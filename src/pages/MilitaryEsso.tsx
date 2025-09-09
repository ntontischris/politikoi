import { useState, useEffect } from 'react'
import { Shield, Plus, FileText, Clock, Star, TrendingUp, Calendar, Users, Edit, Eye } from 'lucide-react'
import { EssoAccordion } from '../components/military/EssoAccordion'
import { MilitaryPersonnelForm } from '../components/forms/MilitaryPersonnelForm'
import { MilitaryViewModal } from '../components/modals/MilitaryViewModal'
import { useMilitaryStore } from '../stores/militaryStore'
import type { MilitaryPersonnel as BaseMilitaryPersonnel } from '../stores/militaryStore'

// Extended interface to include the additional fields needed by the view modal
interface MilitaryPersonnel extends BaseMilitaryPersonnel {
  description?: string
  sendDate?: string
  notes?: string
}

interface MilitaryPersonnelFormData {
  name: string
  surname: string
  rank: string
  unit: string
  militaryId: string
  esso: string
  essoYear: string
  essoLetter: string
  requestType: string
  description: string
  sendDate: string
  notes: string
}

export function MilitaryEsso() {
  const {
    militaryPersonnel: baseMilitaryPersonnel,
    addMilitaryPersonnel,
    updateMilitaryPersonnel,
    loadMilitaryPersonnel,
    getStats,
    isLoading
  } = useMilitaryStore()

  // Cast to extended interface
  const militaryPersonnel = baseMilitaryPersonnel as MilitaryPersonnel[]

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState<MilitaryPersonnel | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    essoCount: 0
  })

  // Load data and stats on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading military personnel data...')
        await loadMilitaryPersonnel()
        console.log('Military personnel loaded:', baseMilitaryPersonnel.slice(0, 1))
        const statsData = await getStats()
        setStats({
          ...statsData,
          essoCount: Object.keys(statsData.by_year || {}).length
        })
      } catch (error) {
        console.error('Error loading military data:', error)
      }
    }
    loadData()
  }, [loadMilitaryPersonnel, getStats, baseMilitaryPersonnel])

  const handleSelectPersonnel = (personnel: MilitaryPersonnel) => {
    setSelectedPersonnel(personnel)
    setShowViewModal(true)
  }

  const handleAddPersonnel = async (formData: MilitaryPersonnelFormData) => {
    try {
      await addMilitaryPersonnel({
        ...formData,
        status: 'pending' as const
      })
      setShowAddModal(false)
      // Refresh stats after adding
      const statsData = await getStats()
      setStats({
        ...statsData,
        essoCount: Object.keys(statsData.by_year || {}).length
      })
    } catch (error) {
      console.error('Error adding personnel:', error)
    }
  }

  const handleEditPersonnel = async (formData: MilitaryPersonnelFormData) => {
    if (!selectedPersonnel) {
      console.error('No selectedPersonnel found')
      alert('Σφάλμα: Δεν βρέθηκε επιλεγμένο προσωπικό')
      return
    }
    
    try {
      console.log('Updating personnel with ID:', selectedPersonnel.id)
      console.log('Form data:', formData)
      
      await updateMilitaryPersonnel(selectedPersonnel.id, formData)
      
      console.log('Personnel updated successfully')
      alert('Η ενημέρωση ολοκληρώθηκε επιτυχώς!')
      
      setShowEditModal(false)
      setSelectedPersonnel(null)
      
      // Refresh stats after updating
      const statsData = await getStats()
      setStats({
        ...statsData,
        essoCount: Object.keys(statsData.by_year || {}).length
      })
    } catch (error) {
      console.error('Error updating personnel:', error)
      alert(`Σφάλμα κατά την ενημέρωση: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`)
      throw error // Re-throw to ensure form handles the error properly
    }
  }

  const handleEditFromView = (personnel: MilitaryPersonnel) => {
    console.log('Editing from view modal:', personnel)
    console.log('Has description:', personnel.description)
    console.log('Has sendDate:', personnel.sendDate) 
    console.log('Has notes:', personnel.notes)
    setSelectedPersonnel(personnel)
    setShowEditModal(true)
    setShowViewModal(false)
  }

  const convertPersonnelToFormData = (personnel: MilitaryPersonnel): MilitaryPersonnelFormData => ({
    name: personnel.name || '',
    surname: personnel.surname || '',
    rank: personnel.rank || '',
    unit: personnel.unit || '',
    militaryId: personnel.militaryId || '',
    esso: personnel.esso || '',
    essoYear: personnel.essoYear || '',
    essoLetter: personnel.essoLetter || '',
    requestType: personnel.requestType || '',
    description: personnel.description || personnel.requestType || '',
    sendDate: personnel.sendDate || '',
    notes: personnel.notes || ''
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Σύστημα ΕΣΣΟ - Στρατιωτικό Προσωπικό
            </h1>
            <p className="text-gray-400">
              Διαχείριση στρατιωτικού προσωπικού με οργάνωση κατά ΕΣΣΟ
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Νέα Καταχώρηση
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {stats.total}
              </div>
              <div className="text-sm text-gray-400">Σύνολο</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-400">Εκκρεμή</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Star className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {stats.approved}
              </div>
              <div className="text-sm text-gray-400">Εγκρίθηκαν</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-400">Ολοκληρωμένα</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-red-500/20">
              <TrendingUp className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {stats.rejected}
              </div>
              <div className="text-sm text-gray-400">Απορρίφθηκαν</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {stats.essoCount}
              </div>
              <div className="text-sm text-gray-400">ΕΣΣΟ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ESSO Accordion - Takes 2 columns */}
        <div className="lg:col-span-2">
          <EssoAccordion onSelectPersonnel={handleSelectPersonnel} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">
                Κατανομή ανά ΕΣΣΟ
              </h3>
            </div>
            <div className="space-y-3">
              {['2025', '2024', '2023'].map(year => {
                const yearPersonnel = militaryPersonnel.filter(p => p.essoYear === year)
                if (yearPersonnel.length === 0) return null
                
                return (
                  <div key={year} className="flex items-center justify-between">
                    <span className="text-gray-400">{year}</span>
                    <div className="flex items-center space-x-2">
                      {['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'].map(letter => {
                        const count = yearPersonnel.filter(p => p.essoLetter === letter).length
                        if (count === 0) return null
                        
                        return (
                          <span
                            key={letter}
                            className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/30"
                          >
                            {letter}:{count}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Additions */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">
                Πρόσφατες Προσθήκες
              </h3>
            </div>
            <div className="space-y-3">
              {militaryPersonnel
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map(person => (
                  <div
                    key={person.id}
                    className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">
                        {person.rank} {person.surname}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 text-xs">
                          {person.esso}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPersonnel(person)
                            setShowEditModal(true)
                          }}
                          className="text-green-400 hover:text-green-300 p-1 hover:bg-green-500/20 rounded transition-colors"
                          title="Επεξεργασία"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectPersonnel(person)
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-500/20 rounded transition-colors"
                          title="Προβολή"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {person.requestType}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">
                Γρήγορες Ενέργειες
              </h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Νέα Καταχώρηση
              </button>
              <button 
                onClick={() => {
                  if (militaryPersonnel.length === 0) {
                    alert('Δεν υπάρχουν δεδομένα για εξαγωγή')
                    return
                  }
                  
                  // Create proper CSV that opens directly in Excel with Greek characters
                  const headers = [
                    'Α/Α',
                    'Όνομα',
                    'Επώνυμο',
                    'Βαθμός',
                    'Μονάδα',
                    'Στρατιωτικός Αριθμός',
                    'ΕΣΣΟ',
                    'Έτος ΕΣΣΟ',
                    'Γράμμα ΕΣΣΟ',
                    'Τύπος Αιτήματος',
                    'Κατάσταση',
                    'Ημερομηνία Δημιουργίας'
                  ]
                  
                  const getStatusInGreek = (status: string) => {
                    switch(status) {
                      case 'pending': return 'Εκκρεμές'
                      case 'approved': return 'Εγκρίθηκε'
                      case 'completed': return 'Ολοκληρωμένο'
                      case 'rejected': return 'Απορρίφθηκε'
                      default: return status || ''
                    }
                  }
                  
                  // Create CSV rows with proper escaping
                  const csvRows = militaryPersonnel.map((person, index) => {
                    return [
                      index + 1,
                      `"${(person.name || '').replace(/"/g, '""')}"`,
                      `"${(person.surname || '').replace(/"/g, '""')}"`,
                      `"${(person.rank || '').replace(/"/g, '""')}"`,
                      `"${(person.unit || '').replace(/"/g, '""')}"`,
                      `"${(person.militaryId || '').replace(/"/g, '""')}"`,
                      `"${(person.esso || '').replace(/"/g, '""')}"`,
                      `"${(person.essoYear || '').replace(/"/g, '""')}"`,
                      `"${(person.essoLetter || '').replace(/"/g, '""')}"`,
                      `"${(person.requestType || '').replace(/"/g, '""')}"`,
                      `"${getStatusInGreek(person.status).replace(/"/g, '""')}"`,
                      `"${new Date(person.created_at).toLocaleDateString('el-GR')}"`
                    ].join(';') // Use semicolon for European CSV format
                  })
                  
                  // Create CSV content with BOM for proper Greek display
                  const BOM = '\uFEFF'
                  const csvContent = BOM + headers.map(h => `"${h}"`).join(';') + '\r\n' + csvRows.join('\r\n')
                  
                  const blob = new Blob([csvContent], { 
                    type: 'text/csv;charset=utf-8;' 
                  })
                  
                  const link = document.createElement('a')
                  const url = URL.createObjectURL(blob)
                  link.setAttribute('href', url)
                  link.setAttribute('download', `Στρατιωτικό_Προσωπικό_ΕΣΣΟ_${new Date().toISOString().split('T')[0]}.csv`)
                  link.style.visibility = 'hidden'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                  
                  alert(`Εξήχθηκε επιτυχώς CSV αρχείο με ${militaryPersonnel.length} εγγραφές στρατιωτικού προσωπικού!\n\nΤο αρχείο θα ανοίξει απευθείας στο Excel με σωστά ελληνικά.`)
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Εξαγωγή Λίστας
              </button>
              <button 
                onClick={() => {
                  // Show detailed statistics in console or alert
                  const detailedStats = {
                    'Σύνολο': stats.total,
                    'Εκκρεμή': stats.pending,
                    'Εγκρίθηκαν': stats.approved,
                    'Ολοκληρωμένα': stats.completed,
                    'Απορρίφθηκαν': stats.rejected,
                    'Αριθμός ΕΣΣΟ': stats.essoCount
                  }
                  
                  alert('Στατιστικά ΕΣΣΟ:\n\n' + 
                    Object.entries(detailedStats)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n'))
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Στατιστικά ΕΣΣΟ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MilitaryPersonnelForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPersonnel}
        mode="add"
      />

      <MilitaryPersonnelForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedPersonnel(null)
        }}
        onSubmit={handleEditPersonnel}
        initialData={selectedPersonnel ? convertPersonnelToFormData(selectedPersonnel) : undefined}
        mode="edit"
      />

      <MilitaryViewModal
        militaryPersonnel={selectedPersonnel}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedPersonnel(null)
        }}
        onEdit={handleEditFromView}
      />
    </div>
  )
}