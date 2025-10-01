import { useState } from 'react'
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  Users,
  Shield,
  TrendingUp,
  PieChart,
  BarChart3
} from 'lucide-react'
import { PrintableReport } from '../components/reports/PrintableReport'
import { StatisticsChart } from '../components/charts/StatisticsChart'
import { AnalyticsService } from '../services/analyticsService'
import { useRealtimeCitizenStore } from '../stores/realtimeCitizenStore'
import { useRequestStore } from '../stores/realtimeRequestStore'
import { useMilitaryStore } from '../stores/realtimeMilitaryStore'

interface ReportFilters {
  type: 'citizens' | 'requests' | 'military' | 'analytics'
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate: string
  endDate: string
  status?: 'all' | 'active' | 'pending' | 'completed'
}

export function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({
    type: 'citizens',
    dateRange: 'month',
    startDate: '',
    endDate: '',
    status: 'all'
  })
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Get data from stores
  const { items: citizens } = useRealtimeCitizenStore()
  const { items: requests } = useRequestStore()
  const { items: militaryPersonnel } = useMilitaryStore()

  // Adapter: Convert military personnel to citizen-like interface for analytics
  const militaryAsCitizens = militaryPersonnel.map(m => ({
    ...m,
    name: m.name,
    surname: m.surname,
    militaryEsso: m.esso,
    militaryEssoYear: m.essoYear,
    militaryEssoLetter: m.essoLetter,
    militaryRank: m.rank,
    militaryServiceUnit: m.unit,
    militaryWish: m.wish,
    militaryStatus: m.status as any,
    created_at: m.created_at,
    updated_at: m.updated_at
  })) as any[]

  // Get analytics data with real data (using adapted military data)
  const analyticsData = AnalyticsService.getFullAnalytics(citizens, requests, militaryAsCitizens)

  const reportTypes = [
    {
      id: 'citizens-summary',
      title: 'Αναφορά Πολιτών',
      description: 'Λίστα καταχωρημένων πολιτών με φίλτρα',
      icon: Users,
      type: 'citizens' as const
    },
    {
      id: 'requests-summary',
      title: 'Αναφορά Αιτημάτων',
      description: 'Κατάσταση όλων των αιτημάτων',
      icon: FileText,
      type: 'requests' as const
    },
    {
      id: 'military-summary',
      title: 'Στρατιωτική Αναφορά',
      description: 'Αναφορά στρατιωτικού προσωπικού ΕΣΣΟ',
      icon: Shield,
      type: 'military' as const
    },
    {
      id: 'analytics-summary',
      title: 'Στατιστική Αναφορά',
      description: 'Γραφήματα και στατιστικά απόδοσης',
      icon: TrendingUp,
      type: 'analytics' as const
    }
  ]

  const handleGenerateReport = (reportId: string, type: ReportFilters['type']) => {
    setFilters(prev => ({ ...prev, type }))
    setSelectedReport(reportId)
    setShowPrintModal(true)
  }


  const getReportData = () => {
    if (!selectedReport) return null

    const reportType = reportTypes.find(r => r.id === selectedReport)
    if (!reportType) return null

    let data: any[] = []
    let summary: any = {}

    // Apply date filtering if needed
    const filterByDate = (item: any) => {
      if (filters.dateRange === 'custom') {
        if (filters.startDate && filters.endDate) {
          const itemDate = new Date(item.created_at)
          const start = new Date(filters.startDate)
          const end = new Date(filters.endDate)
          return itemDate >= start && itemDate <= end
        }
      }
      return true // No filtering if not custom or dates not set
    }

    switch (filters.type) {
      case 'citizens':
        data = (citizens || []).filter(filterByDate)
        summary = {
          total: data.length,
          active: data.filter(c => c.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ').length,
          pending: data.filter(c => c.status === 'ΕΚΚΡΕΜΗ').length,
          completed: data.filter(c => c.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ').length
        }
        break
      case 'requests':
        data = (requests || []).filter(filterByDate)
        summary = {
          total: data.length,
          active: data.filter(r => r.status === 'in-progress').length,
          pending: data.filter(r => r.status === 'pending').length,
          completed: data.filter(r => r.status === 'completed').length
        }
        break
      case 'military':
        // Use original military personnel for reports (not adapted)
        data = (militaryPersonnel || []).filter(item => {
          if (filters.dateRange === 'custom') {
            if (filters.startDate && filters.endDate) {
              const itemDate = new Date(item.created_at)
              const start = new Date(filters.startDate)
              const end = new Date(filters.endDate)
              return itemDate >= start && itemDate <= end
            }
          }
          return true
        })
        summary = {
          total: data.length,
          active: data.filter(m => m.status === 'approved' || m.status === 'completed').length,
          pending: data.filter(m => m.status === 'pending').length,
          completed: data.filter(m => m.status === 'completed').length
        }
        break
      default:
        return null
    }

    // Apply status filter if needed
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          data = data.filter(item => {
            if (filters.type === 'citizens') return item.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ'
            if (filters.type === 'requests') return item.status === 'in-progress'
            if (filters.type === 'military') return (item as any).status === 'approved'
            return false
          })
          break
        case 'pending':
          data = data.filter(item => {
            if (filters.type === 'citizens') return item.status === 'ΕΚΚΡΕΜΗ'
            if (filters.type === 'requests') return item.status === 'pending'
            if (filters.type === 'military') return (item as any).status === 'pending'
            return false
          })
          break
        case 'completed':
          data = data.filter(item => {
            if (filters.type === 'citizens') return item.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ'
            if (filters.type === 'requests') return item.status === 'completed'
            if (filters.type === 'military') return (item as any).status === 'completed'
            return false
          })
          break
      }
    }

    const dateRangeText = filters.dateRange === 'custom' && filters.startDate && filters.endDate
      ? `${new Date(filters.startDate).toLocaleDateString('el-GR')} - ${new Date(filters.endDate).toLocaleDateString('el-GR')}`
      : `${filters.dateRange === 'week' ? 'Τελευταία Εβδομάδα' :
          filters.dateRange === 'month' ? 'Τελευταίος Μήνας' :
          filters.dateRange === 'quarter' ? 'Τελευταίο Τρίμηνο' :
          filters.dateRange === 'year' ? 'Τελευταίος Χρόνος' : 'Όλες οι περίοδοι'}`

    return {
      title: reportType.title,
      type: filters.type,
      dateRange: `${dateRangeText} - ${new Date().toLocaleDateString('el-GR')}`,
      data,
      summary
    }
  }

  const handlePrint = () => {
    window.print()
  }


  return (
    <div className="responsive-padding">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Αναφορές & Στατιστικά
        </h1>
        <p className="text-gray-400">
          Δημιουργία και εξαγωγή αναφορών για το σύστημα διαχείρισης
        </p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className="bg-slate-800 border border-slate-700 rounded-xl responsive-padding hover:bg-slate-700/50 cursor-pointer transition-colors duration-200 touch-target"
            onClick={() => handleGenerateReport(report.id, report.type)}
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <report.icon className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
              {report.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {report.description}
            </p>
            <div className="flex items-center text-blue-400 text-sm font-medium">
              <Download className="h-4 w-4 mr-2" />
              Δημιουργία Αναφοράς
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Dashboard */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            Στατιστικό Dashboard
          </h2>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Monthly Trends */}
          <StatisticsChart
            type="line"
            data={analyticsData.monthlyTrends}
            title="Μηνιαία Εξέλιξη Δεδομένων"
            height={350}
            mobileHeight={250}
          />
          
          {/* Military Distribution */}
          <StatisticsChart
            type="pie"
            data={analyticsData.militaryDistribution}
            title="Κατανομή ΕΣΣΟ"
            height={350}
            mobileHeight={250}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Request Distribution */}
          <StatisticsChart
            type="pie"
            data={analyticsData.requestDistribution}
            title="Τύποι Αιτημάτων"
            height={350}
            mobileHeight={250}
          />
          
          {/* Bar Chart for Last 6 Months */}
          <StatisticsChart
            type="bar"
            data={analyticsData.monthlyTrends.slice(-6)}
            title="Τελευταίοι 6 Μήνες"
            height={350}
            mobileHeight={250}
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl responsive-padding mb-6 sm:mb-8">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-blue-400 mr-3" />
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Φίλτρα Αναφορών
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Τύπος Αναφοράς
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 touch-target"
            >
              <option value="citizens">Πολίτες</option>
              <option value="requests">Αιτήματα</option>
              <option value="military">Στρατιωτικό</option>
              <option value="analytics">Στατιστικά</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Περίοδος
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 touch-target"
            >
              <option value="week">Τελευταία Εβδομάδα</option>
              <option value="month">Τελευταίος Μήνας</option>
              <option value="quarter">Τελευταίο Τρίμηνο</option>
              <option value="year">Τελευταίος Χρόνος</option>
              <option value="custom">Προσαρμοσμένη</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Κατάσταση
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 touch-target"
            >
              <option value="all">Όλες οι Καταστάσεις</option>
              <option value="active">Ενεργά</option>
              <option value="pending">Εκκρεμή</option>
              <option value="completed">Ολοκληρωμένα</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => setShowPrintModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors duration-200 touch-target"
            >
              <FileText className="h-4 w-4 mr-2" />
              Εφαρμογή Φίλτρων
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Από Ημερομηνία
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 touch-target"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Έως Ημερομηνία
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 touch-target"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {citizens.length.toLocaleString('el-GR')}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Σύνολο Πολιτών</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-500/20">
              <FileText className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {requests.length.toLocaleString('el-GR')}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Σύνολο Αιτημάτων</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Shield className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {militaryPersonnel.length.toLocaleString('el-GR')}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Στρατιωτικό Προσωπικό</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-bold text-white">
                94%
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Ικανοποίηση</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="responsive-modal-lg bg-slate-900 rounded-xl max-h-screen-90 overflow-y-auto">
            <div className="responsive-padding">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Προεπισκόπηση Αναφοράς
                </h2>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-gray-400 hover:text-white touch-target"
                >
                  ✕
                </button>
              </div>
              
              {getReportData() && (
                <PrintableReport
                  reportData={getReportData()!}
                  onPrint={handlePrint}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}