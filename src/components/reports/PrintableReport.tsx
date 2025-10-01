import React from 'react'
import { FileText, Printer, Calendar, Users, Shield } from 'lucide-react'

interface ReportData {
  title: string
  type: 'citizens' | 'requests' | 'military' | 'analytics'
  dateRange: string
  data: any[]
  summary?: {
    total: number
    active: number
    pending: number
    completed: number
  }
}

interface PrintableReportProps {
  reportData: ReportData
  onPrint: () => void
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ 
  reportData, 
  onPrint
}) => {
  
  const getReportIcon = () => {
    switch (reportData.type) {
      case 'citizens': return Users
      case 'requests': return FileText
      case 'military': return Shield
      default: return FileText
    }
  }
  
  const IconComponent = getReportIcon()
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('el-GR')
  }
  
  const renderCitizenReport = () => (
    <div className="space-y-4">
      {reportData.data.map((citizen, index) => (
        <div key={index} className="border-b border-slate-600 pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
            <div className="flex-1">
              <h4 className="text-white font-medium text-base mb-1">
                {citizen.name} {citizen.surname}
              </h4>
              {citizen.afm && (
                <p className="text-gray-400 text-sm mb-1">ΑΦΜ: {citizen.afm}</p>
              )}
              {citizen.phone && (
                <p className="text-gray-400 text-sm mb-1">📞 {citizen.phone}</p>
              )}
              {citizen.landline && (
                <p className="text-gray-400 text-sm mb-1">🏠 {citizen.landline}</p>
              )}
              {citizen.email && (
                <p className="text-gray-400 text-sm mb-1">✉️ {citizen.email}</p>
              )}
              {citizen.requestCategory && (
                <p className="text-purple-400 text-xs mt-1">Κατηγορία: {citizen.requestCategory}</p>
              )}
              {citizen.request && (
                <p className="text-gray-300 text-sm mt-2 line-clamp-2">{citizen.request}</p>
              )}
              {citizen.isMilitary && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                    {citizen.militaryType === 'career' ? 'ΜΟΝΙΜΟΣ' : 'ΣΤΡΑΤΙΩΤΙΚΟΣ'}
                  </span>
                  {citizen.militaryEsso && (
                    <span className="text-cyan-400 text-xs">ΕΣΣΟ: {citizen.militaryEsso}</span>
                  )}
                </div>
              )}
            </div>
            <div className="sm:text-right sm:ml-4 flex-shrink-0">
              {citizen.municipality && (
                <p className="text-blue-400 text-sm mb-1">{citizen.municipality}</p>
              )}
              {citizen.region && (
                <p className="text-gray-400 text-xs mb-2">{citizen.region}</p>
              )}
              {citizen.status && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block mb-2 ${
                  citizen.status === 'ΟΛΟΚΛΗΡΩΜΕΝΑ' ? 'bg-green-500/20 text-green-400' :
                  citizen.status === 'ΕΚΚΡΕΜΗ' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {citizen.status}
                </span>
              )}
              {citizen.created_at && (
                <p className="text-gray-500 text-xs">
                  Δημιουργήθηκε: {formatDate(citizen.created_at)}
                </p>
              )}
              {citizen.addedDate && (
                <p className="text-gray-500 text-xs">
                  Προστέθηκε: {formatDate(citizen.addedDate)}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
  
  const renderRequestReport = () => (
    <div className="space-y-4">
      {reportData.data.map((request, index) => (
        <div key={index} className="border-b border-slate-600 pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
            <div>
              <h4 className="text-white font-medium">{request.title}</h4>
              <p className="text-gray-400 text-sm">{request.description}</p>
              <p className="text-gray-500 text-xs">
                Αιτών: {request.citizenName}
              </p>
            </div>
            <div className="sm:text-right">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {request.status === 'completed' ? 'Ολοκληρωμένο' :
                 request.status === 'pending' ? 'Εκκρεμές' : 'Άγνωστο'}
              </span>
              <p className="text-gray-500 text-xs mt-1">
                {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
  
  const renderMilitaryReport = () => (
    <div className="space-y-4">
      {reportData.data.map((personnel, index) => {
        // Support both military personnel interface and citizen interface
        const rank = personnel.militaryRank || personnel.rank
        const unit = personnel.militaryServiceUnit || personnel.unit
        const wish = personnel.militaryWish || personnel.wish
        const esso = personnel.militaryEsso || personnel.esso
        const militaryId = personnel.militaryId
        const status = personnel.militaryStatus || personnel.status
        const sendDate = personnel.militarySendDate || personnel.sendDate

        return (
          <div key={index} className="border-b border-slate-600 pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
              <div className="flex-1">
                <h4 className="text-white font-medium text-base mb-2">
                  {rank && `${rank} `}
                  {personnel.name} {personnel.surname}
                </h4>
                {militaryId && (
                  <p className="text-gray-400 text-sm mb-1">ΑΜ: {militaryId}</p>
                )}
                {unit && (
                  <p className="text-gray-400 text-sm mb-1">Μονάδα: {unit}</p>
                )}
                {wish && (
                  <p className="text-gray-300 text-sm mt-2">Επιθυμία: {wish}</p>
                )}
              </div>
              <div className="sm:text-right sm:ml-4 flex-shrink-0">
                {esso && (
                  <p className="text-blue-400 text-sm font-medium mb-2">ΕΣΣΟ: {esso}</p>
                )}
                {status && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                    status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {status === 'approved' ? 'Εγκρίθηκε' :
                     status === 'pending' ? 'Εκκρεμεί' :
                     status === 'rejected' ? 'Απορρίφθηκε' :
                     'Ολοκληρώθηκε'}
                  </span>
                )}
                {sendDate && (
                  <p className="text-gray-500 text-xs mt-2">
                    Αποστολή: {formatDate(sendDate)}
                  </p>
                )}
                {personnel.created_at && (
                  <p className="text-gray-500 text-xs">
                    Καταχώρηση: {formatDate(personnel.created_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl responsive-padding">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6 pb-4 border-b border-slate-600 space-y-4 sm:space-y-0">
        <div className="flex items-center">
          <IconComponent className="h-6 w-6 text-blue-400 mr-3" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              {reportData.title}
            </h2>
            <p className="text-gray-400 text-sm">
              Περίοδος: {reportData.dateRange}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={onPrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm transition-colors duration-200 touch-target"
          >
            <Printer className="h-4 w-4 mr-2" />
            Εκτύπωση
          </button>
        </div>
      </div>
      
      {/* Summary Statistics */}
      {reportData.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg responsive-padding text-center">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {reportData.summary.total.toLocaleString('el-GR')}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Σύνολο</div>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg responsive-padding text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-400">
              {reportData.summary.active.toLocaleString('el-GR')}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Ενεργά</div>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg responsive-padding text-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-400">
              {reportData.summary.pending.toLocaleString('el-GR')}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Εκκρεμή</div>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg responsive-padding text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-400">
              {reportData.summary.completed.toLocaleString('el-GR')}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Ολοκληρωμένα</div>
          </div>
        </div>
      )}
      
      {/* Report Content */}
      <div className="bg-slate-900/50 rounded-lg responsive-padding">
        <div className="flex items-center mb-4">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-400 text-sm">
            Δημιουργήθηκε: {new Date().toLocaleDateString('el-GR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        
        {reportData.type === 'citizens' && renderCitizenReport()}
        {reportData.type === 'requests' && renderRequestReport()}
        {reportData.type === 'military' && renderMilitaryReport()}
        
        {reportData.data.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              Δεν βρέθηκαν δεδομένα για την επιλεγμένη περίοδο
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-600">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Σύστημα Διαχείρισης Πολιτών & Στρατιωτικών - CitizenManager
          </div>
          <div>
            Σελίδα 1 από 1
          </div>
        </div>
      </div>
    </div>
  )
}