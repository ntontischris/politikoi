import { useState } from 'react'
import { Shield, Plus, FileText, Clock, Star, TrendingUp, Calendar, Users } from 'lucide-react'
import { EssoAccordion } from '../components/military/EssoAccordion'
import { MilitaryPersonnelForm } from '../components/forms/MilitaryPersonnelForm'
import { MilitaryViewModal } from '../components/modals/MilitaryViewModal'
import { useMilitaryStore } from '../stores/militaryStore'
import type { MilitaryPersonnel } from '../stores/militaryStore'

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
    militaryPersonnel,
    addMilitaryPersonnel,
    updateMilitaryPersonnel,
    getStats
  } = useMilitaryStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState<MilitaryPersonnel | null>(null)

  const stats = getStats()

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
    } catch (error) {
      console.error('Error adding personnel:', error)
    }
  }

  const handleEditPersonnel = async (formData: MilitaryPersonnelFormData) => {
    if (!selectedPersonnel) return
    
    try {
      await updateMilitaryPersonnel(selectedPersonnel.id, formData)
      setShowEditModal(false)
      setSelectedPersonnel(null)
    } catch (error) {
      console.error('Error updating personnel:', error)
    }
  }

  const handleEditFromView = (personnel: MilitaryPersonnel) => {
    setSelectedPersonnel(personnel)
    setShowEditModal(true)
    setShowViewModal(false)
  }

  const convertPersonnelToFormData = (personnel: MilitaryPersonnel): MilitaryPersonnelFormData => ({
    name: personnel.name,
    surname: personnel.surname,
    rank: personnel.rank,
    unit: personnel.unit,
    militaryId: personnel.militaryId,
    esso: personnel.esso,
    essoYear: personnel.essoYear,
    essoLetter: personnel.essoLetter,
    requestType: personnel.requestType,
    description: personnel.description,
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
                    onClick={() => handleSelectPersonnel(person)}
                    className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">
                        {person.rank} {person.surname}
                      </span>
                      <span className="text-blue-400 text-xs">
                        {person.esso}
                      </span>
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
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <FileText className="h-4 w-4 mr-2" />
                Εξαγωγή Λίστας
              </button>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center">
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