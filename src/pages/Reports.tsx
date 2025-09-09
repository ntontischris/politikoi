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
import { useCitizenStore } from '../stores/citizenStore'
import { useRequestStore } from '../stores/requestStore'
import { useMilitaryStore } from '../stores/militaryStore'

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
  const { citizens } = useCitizenStore()
  const { requests } = useRequestStore()
  const { militaryPersonnel } = useMilitaryStore()
  
  // Get analytics data
  const analyticsData = AnalyticsService.getFullAnalytics()

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
    const now = new Date()
    const dateRange = `${now.toLocaleDateString('el-GR')} - ${now.toLocaleDateString('el-GR')}`
    
    switch (filters.type) {
      case 'citizens':
        return {
          title: 'Αναφορά Πολιτών',
          type: filters.type,
          dateRange,
          data: citizens.slice(0, 10), // Show first 10 for demo
          summary: {
            total: citizens.length,
            active: citizens.filter(c => c.status === 'active').length,
            pending: citizens.filter(c => c.status === 'pending').length,
            completed: citizens.filter(c => c.status === 'completed').length
          }
        }
      
      case 'requests':
        return {
          title: 'Αναφορά Αιτημάτων',
          type: filters.type,
          dateRange,
          data: requests.slice(0, 10),
          summary: {
            total: requests.length,
            active: requests.filter(r => r.status === 'in-progress').length,
            pending: requests.filter(r => r.status === 'pending').length,
            completed: requests.filter(r => r.status === 'completed').length
          }
        }
      
      case 'military':
        return {
          title: 'Στρατιωτική Αναφορά ΕΣΣΟ',
          type: filters.type,
          dateRange,
          data: militaryPersonnel.slice(0, 10),
          summary: {
            total: militaryPersonnel.length,
            active: militaryPersonnel.filter(m => m.status === 'approved').length,
            pending: militaryPersonnel.filter(m => m.status === 'pending').length,
            completed: militaryPersonnel.filter(m => m.status === 'completed').length
          }
        }
      
      default:
        return {
          title: 'Στατιστική Αναφορά',
          type: 'analytics' as const,
          dateRange,
          data: [],
          summary: {
            total: citizens.length + requests.length + militaryPersonnel.length,
            active: 0,
            pending: 0,
            completed: 0
          }
        }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // This would integrate with a PDF generation library
    alert('Η λειτουργία λήψης PDF θα υλοποιηθεί σύντομα')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Αναφορές & Στατιστικά
        </h1>
        <p className="text-gray-400">
          Δημιουργία και εξαγωγή αναφορών για το σύστημα διαχείρισης
        </p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-700/50 cursor-pointer transition-colors duration-200"
            onClick={() => handleGenerateReport(report.id, report.type)}
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <report.icon className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
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
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
          <h2 className="text-2xl font-semibold text-white">
            Στατιστικό Dashboard
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trends */}
          <StatisticsChart
            type="line"
            data={analyticsData.monthlyTrends}
            title="Μηνιαία Εξέλιξη Δεδομένων"
            height={350}
          />
          
          {/* Military Distribution */}
          <StatisticsChart
            type="pie"
            data={analyticsData.militaryDistribution}
            title="Κατανομή ΕΣΣΟ"
            height={350}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Distribution */}
          <StatisticsChart
            type="pie"
            data={analyticsData.requestDistribution}
            title="Τύποι Αιτημάτων"
            height={350}
          />
          
          {/* Bar Chart for Last 6 Months */}
          <StatisticsChart
            type="bar"
            data={analyticsData.monthlyTrends.slice(-6)}
            title="Τελευταίοι 6 Μήνες"
            height={350}
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-blue-400 mr-3" />
          <h3 className="text-lg font-semibold text-white">
            Φίλτρα Αναφορών
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Τύπος Αναφοράς
            </label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Όλες οι Καταστάσεις</option>
              <option value="active">Ενεργά</option>
              <option value="pending">Εκκρεμή</option>
              <option value="completed">Ολοκληρωμένα</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={() => setShowPrintModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Εφαρμογή Φίλτρων
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {citizens.length.toLocaleString('el-GR')}
              </div>
              <div className="text-sm text-gray-400">Σύνολο Πολιτών</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-500/20">
              <FileText className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {requests.length.toLocaleString('el-GR')}
              </div>
              <div className="text-sm text-gray-400">Σύνολο Αιτημάτων</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Shield className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {militaryPersonnel.length.toLocaleString('el-GR')}
              </div>
              <div className="text-sm text-gray-400">Στρατιωτικό Προσωπικό</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                94%
              </div>
              <div className="text-sm text-gray-400">Ικανοποίηση</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Προεπισκόπηση Αναφοράς
                </h2>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <PrintableReport
                reportData={getReportData()}
                onPrint={handlePrint}
                onDownload={handleDownload}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}