import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Shield, Users, Search, Filter } from 'lucide-react'
import { useMilitaryStore } from '../../stores/militaryStore'
import type { MilitaryPersonnel } from '../../stores/militaryStore'

interface EssoAccordionProps {
  onSelectPersonnel?: (personnel: MilitaryPersonnel) => void
}

export const EssoAccordion: React.FC<EssoAccordionProps> = ({ onSelectPersonnel }) => {
  const { militaryPersonnel, getEssoGroups } = useMilitaryStore()
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const essoYears = ['2025', '2024', '2023', '2022', '2021', '2020']
  const essoLetters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ']

  // Group personnel by ESSO
  const getPersonnelByEsso = (year: string, letter: string) => {
    const esso = `${year}${letter}`
    return militaryPersonnel.filter(p => p.esso === esso)
  }

  // Filter personnel based on search
  const filterPersonnel = (personnel: MilitaryPersonnel[]) => {
    if (!searchTerm) return personnel
    
    const term = searchTerm.toLowerCase()
    return personnel.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.surname.toLowerCase().includes(term) ||
      p.militaryId.toLowerCase().includes(term) ||
      p.rank.toLowerCase().includes(term) ||
      p.unit.toLowerCase().includes(term)
    )
  }

  const toggleYear = (year: string) => {
    setExpandedYear(expandedYear === year ? null : year)
    setExpandedLetter(null) // Reset letter when year changes
  }

  const toggleLetter = (letter: string) => {
    setExpandedLetter(expandedLetter === letter ? null : letter)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Εκκρεμεί'
      case 'approved': return 'Εγκρίθηκε'
      case 'rejected': return 'Απορρίφθηκε'
      case 'completed': return 'Ολοκληρώθηκε'
      default: return 'Άγνωστο'
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">
              Σύστημα ΕΣΣΟ
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Users className="h-4 w-4" />
            <span>{militaryPersonnel.length} συνολικά</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Αναζήτηση σε ΕΣΣΟ (όνομα, ΑΜ, βαθμός, μονάδα)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {essoYears.map(year => {
          const yearHasPersonnel = essoLetters.some(letter => 
            getPersonnelByEsso(year, letter).length > 0
          )

          if (!yearHasPersonnel) return null

          return (
            <div key={year} className="border border-slate-600 rounded-lg overflow-hidden">
              {/* Year Header */}
              <button
                onClick={() => toggleYear(year)}
                className="w-full bg-slate-700/50 hover:bg-slate-700 transition-colors p-4 flex items-center justify-between"
              >
                <div className="flex items-center">
                  {expandedYear === year ? (
                    <ChevronDown className="h-5 w-5 text-blue-400 mr-3" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <span className="text-white font-medium text-lg">{year}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {essoLetters.map(letter => {
                    const count = getPersonnelByEsso(year, letter).length
                    if (count === 0) return null
                    
                    return (
                      <span
                        key={letter}
                        className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm border border-blue-500/30"
                      >
                        {letter}: {count}
                      </span>
                    )
                  })}
                </div>
              </button>

              {/* Year Content */}
              {expandedYear === year && (
                <div className="bg-slate-800/50 p-4 space-y-2">
                  {essoLetters.map(letter => {
                    const personnel = filterPersonnel(getPersonnelByEsso(year, letter))
                    
                    if (getPersonnelByEsso(year, letter).length === 0) return null

                    return (
                      <div key={letter} className="border border-slate-600/50 rounded-lg overflow-hidden">
                        {/* Letter Header */}
                        <button
                          onClick={() => toggleLetter(letter)}
                          className="w-full bg-slate-700/30 hover:bg-slate-700/50 transition-colors p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            {expandedLetter === letter ? (
                              <ChevronDown className="h-4 w-4 text-blue-400 mr-2" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            <span className="text-white font-medium">
                              ΕΣΣΟ {year}{letter}
                            </span>
                          </div>
                          <span className="text-gray-400 text-sm">
                            {personnel.length} {personnel.length === 1 ? 'άτομο' : 'άτομα'}
                          </span>
                        </button>

                        {/* Letter Content - Personnel List */}
                        {expandedLetter === letter && (
                          <div className="bg-slate-900/50 p-3">
                            {personnel.length === 0 ? (
                              <p className="text-gray-500 text-sm text-center py-2">
                                Δεν βρέθηκαν αποτελέσματα
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {personnel.map(person => (
                                  <div
                                    key={person.id}
                                    onClick={() => onSelectPersonnel && onSelectPersonnel(person)}
                                    className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-700/50 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                          <h4 className="text-white font-medium">
                                            {person.rank} {person.name} {person.surname}
                                          </h4>
                                          <span className="text-gray-400 text-sm">
                                            ΑΜ: {person.militaryId}
                                          </span>
                                        </div>
                                        <div className="mt-1 flex items-center space-x-4 text-sm">
                                          <span className="text-gray-400">
                                            {person.unit}
                                          </span>
                                          <span className="text-gray-500">•</span>
                                          <span className="text-gray-400">
                                            {person.requestType}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(person.status)}`}>
                                        {getStatusText(person.status)}
                                      </span>
                                    </div>
                                    {person.notes && (
                                      <p className="mt-2 text-gray-400 text-sm">
                                        {person.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {essoYears.every(year => 
        essoLetters.every(letter => 
          getPersonnelByEsso(year, letter).length === 0
        )
      ) && (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            Δεν υπάρχουν καταχωρημένα στοιχεία ΕΣΣΟ
          </p>
        </div>
      )}
    </div>
  )
}