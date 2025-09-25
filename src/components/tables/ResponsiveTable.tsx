import { ReactNode, useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Grid, List, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useResponsive, useTouchDevice } from '../../hooks/useResponsive'

export interface TableColumn<T = any> {
  key: string
  title: string
  render?: (value: any, item: T, index: number) => ReactNode
  sortable?: boolean
  width?: string | number
  minWidth?: string | number
  hideOnMobile?: boolean
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface TableAction<T = any> {
  key: string
  label: string
  icon: ReactNode
  onClick: (item: T, index: number) => void
  variant?: 'primary' | 'secondary' | 'danger'
  hideOnMobile?: boolean
  condition?: (item: T) => boolean
}

export interface ResponsiveTableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  isLoading?: boolean
  emptyState?: {
    icon?: ReactNode
    title: string
    description?: string
  }
  searchable?: boolean
  searchPlaceholder?: string
  sortable?: boolean
  filterable?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
  className?: string
  rowClassName?: string | ((item: T, index: number) => string)
  onRowClick?: (item: T, index: number) => void
  selectable?: boolean
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  getItemId?: (item: T) => string
  viewModes?: ('table' | 'cards' | 'compact')[]
  defaultViewMode?: 'table' | 'cards' | 'compact'
}

type SortDirection = 'asc' | 'desc' | null

export function ResponsiveTable<T = any>({
  data = [],
  columns,
  actions = [],
  isLoading = false,
  emptyState = { title: 'Δεν βρέθηκαν δεδομένα' },
  searchable = true,
  searchPlaceholder = 'Αναζήτηση...',
  sortable = true,
  filterable = false,
  pagination,
  className = '',
  rowClassName,
  onRowClick,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId = (item: T) => (item as any).id || '',
  viewModes = ['table', 'cards'],
  defaultViewMode = 'table'
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useResponsive()
  const { isTouchDevice } = useTouchDevice()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>(
    isMobile && viewModes.includes('cards') ? 'cards' : defaultViewMode
  )
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const tableRef = useRef<HTMLDivElement>(null)
  const [showMobileActions, setShowMobileActions] = useState<string | null>(null)

  // Auto-switch view mode based on screen size
  useEffect(() => {
    if (isMobile && viewModes.includes('cards') && viewMode === 'table') {
      setViewMode('cards')
    } else if (!isMobile && viewMode === 'cards' && viewModes.includes('table')) {
      setViewMode('table')
    }
  }, [isMobile, viewModes, viewMode])

  // Filter and search data
  const filteredData = data.filter(item => {
    if (!searchTerm) return true

    return columns.some(column => {
      const value = (item as any)[column.key]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // Sort data
  const sortedData = sortable && sortColumn && sortDirection
    ? [...filteredData].sort((a, b) => {
        const aValue = (a as any)[sortColumn]
        const bValue = (b as any)[sortColumn]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        let comparison = 0
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue, 'el-GR')
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else {
          comparison = String(aValue).localeCompare(String(bValue), 'el-GR')
        }

        return sortDirection === 'desc' ? -comparison : comparison
      })
    : filteredData

  const handleSort = (columnKey: string) => {
    if (!sortable) return

    if (sortColumn === columnKey) {
      setSortDirection(prev =>
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      )
      if (sortDirection === 'desc') {
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleRowClick = (item: T, index: number) => {
    if (onRowClick && !isTouchDevice) {
      onRowClick(item, index)
    }
  }

  const handleSelection = (itemId: string, checked: boolean) => {
    if (!onSelectionChange) return

    const newSelection = checked
      ? [...selectedItems, itemId]
      : selectedItems.filter(id => id !== itemId)

    onSelectionChange(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    const newSelection = checked
      ? sortedData.map(item => getItemId(item))
      : []

    onSelectionChange(newSelection)
  }

  const toggleRowExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedRows(newExpanded)
  }

  const visibleColumns = columns.filter(col =>
    !col.hideOnMobile || !isMobile
  )

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 text-blue-400" />
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4 text-blue-400" />
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />
  }

  const getActionVariantClasses = (variant: string = 'secondary') => {
    switch (variant) {
      case 'primary':
        return 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'
      case 'danger':
        return 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20'
      default:
        return 'text-gray-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/50'
    }
  }

  const renderTableView = () => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto scroll-smooth-mobile" ref={tableRef}>
        <table className="w-full min-w-full">
          <thead className="bg-slate-700/50 sticky top-0 z-10">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 touch-target"
                  />
                </th>
              )}

              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-left text-gray-300 font-medium text-sm
                    ${column.sortable !== false && sortable ? 'cursor-pointer hover:text-white touch-target' : ''}
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${column.className || ''}
                  `}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || '100px'
                  }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{column.title}</span>
                    {column.sortable !== false && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}

              {actions.length > 0 && (
                <th className="w-24 px-4 py-3 text-center text-gray-300 font-medium text-sm">
                  Ενέργειες
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                    className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-400">Φόρτωση...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                    className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    {emptyState.icon || <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-gray-500" />
                    </div>}
                    <p className="text-lg font-medium mb-2">{emptyState.title}</p>
                    {emptyState.description && (
                      <p className="text-sm text-gray-500">{emptyState.description}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => {
                const itemId = getItemId(item)
                const isSelected = selectedItems.includes(itemId)
                const rowClass = typeof rowClassName === 'function'
                  ? rowClassName(item, index)
                  : rowClassName || ''

                return (
                  <tr
                    key={itemId}
                    className={`
                      hover:bg-slate-700/30 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-blue-500/10' : ''}
                      ${rowClass}
                    `}
                    onClick={() => handleRowClick(item, index)}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelection(itemId, e.target.checked)
                          }}
                          className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 touch-target"
                        />
                      </td>
                    )}

                    {visibleColumns.map((column) => {
                      const value = (item as any)[column.key]
                      const cellContent = column.render
                        ? column.render(value, item, index)
                        : value

                      return (
                        <td
                          key={`${itemId}-${column.key}`}
                          className={`
                            px-4 py-3 text-gray-300 text-sm
                            ${column.align === 'center' ? 'text-center' : ''}
                            ${column.align === 'right' ? 'text-right' : ''}
                            ${column.className || ''}
                          `}
                          style={{
                            maxWidth: column.width || '200px'
                          }}
                        >
                          <div className="truncate" title={typeof cellContent === 'string' ? cellContent : undefined}>
                            {cellContent}
                          </div>
                        </td>
                      )
                    })}

                    {actions.length > 0 && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {actions
                            .filter(action => !action.condition || action.condition(item))
                            .filter(action => !action.hideOnMobile || !isMobile)
                            .slice(0, isMobile ? 2 : 3)
                            .map((action) => (
                              <button
                                key={action.key}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  action.onClick(item, index)
                                }}
                                className={`
                                  p-2 rounded-lg transition-colors touch-target
                                  ${getActionVariantClasses(action.variant)}
                                `}
                                title={action.label}
                              >
                                {action.icon}
                              </button>
                            ))}

                          {actions.filter(action => !action.condition || action.condition(item)).length > (isMobile ? 2 : 3) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMobileActions(showMobileActions === itemId ? null : itemId)
                              }}
                              className="p-2 rounded-lg transition-colors touch-target text-gray-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/50"
                              title="Περισσότερες ενέργειες"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Mobile Actions Dropdown */}
                        {showMobileActions === itemId && (
                          <div className="absolute right-4 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-2">
                            {actions
                              .filter(action => !action.condition || action.condition(item))
                              .slice(isMobile ? 2 : 3)
                              .map((action) => (
                                <button
                                  key={action.key}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    action.onClick(item, index)
                                    setShowMobileActions(null)
                                  }}
                                  className={`
                                    w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2
                                    ${getActionVariantClasses(action.variant)} hover:bg-slate-700/50
                                  `}
                                >
                                  {action.icon}
                                  {action.label}
                                </button>
                              ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderCardView = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Φόρτωση...</span>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="flex flex-col items-center">
            {emptyState.icon || <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>}
            <p className="text-lg font-medium mb-2">{emptyState.title}</p>
            {emptyState.description && (
              <p className="text-sm text-gray-500">{emptyState.description}</p>
            )}
          </div>
        </div>
      ) : (
        sortedData.map((item, index) => {
          const itemId = getItemId(item)
          const isSelected = selectedItems.includes(itemId)
          const rowClass = typeof rowClassName === 'function'
            ? rowClassName(item, index)
            : rowClassName || ''

          return (
            <div
              key={itemId}
              className={`
                bg-slate-800 border border-slate-700 rounded-xl p-4
                ${onRowClick ? 'cursor-pointer hover:bg-slate-700/30' : ''}
                ${isSelected ? 'border-blue-500/50 bg-blue-500/5' : ''}
                ${rowClass}
                transition-colors
              `}
              onClick={() => onRowClick && onRowClick(item, index)}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelection(itemId, e.target.checked)
                      }}
                      className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 touch-target mb-2"
                    />
                  )}

                  {/* Primary column (usually name/title) */}
                  {columns[0] && (
                    <div className="text-white font-semibold text-base mb-1">
                      {columns[0].render
                        ? columns[0].render((item as any)[columns[0].key], item, index)
                        : (item as any)[columns[0].key]
                      }
                    </div>
                  )}

                  {/* Secondary column */}
                  {columns[1] && (
                    <div className="text-gray-400 text-sm">
                      {columns[1].render
                        ? columns[1].render((item as any)[columns[1].key], item, index)
                        : (item as any)[columns[1].key]
                      }
                    </div>
                  )}
                </div>

                {actions.length > 0 && (
                  <div className="flex items-center gap-2 ml-2">
                    {actions
                      .filter(action => !action.condition || action.condition(item))
                      .slice(0, 2)
                      .map((action) => (
                        <button
                          key={action.key}
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick(item, index)
                          }}
                          className={`
                            p-2 rounded-lg transition-colors touch-target
                            ${getActionVariantClasses(action.variant)}
                          `}
                          title={action.label}
                        >
                          {action.icon}
                        </button>
                      ))}

                    {actions.filter(action => !action.condition || action.condition(item)).length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMobileActions(showMobileActions === itemId ? null : itemId)
                        }}
                        className="p-2 rounded-lg transition-colors touch-target text-gray-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 relative"
                        title="Περισσότερες ενέργειες"
                      >
                        <MoreVertical className="w-4 h-4" />

                        {/* Actions Dropdown */}
                        {showMobileActions === itemId && (
                          <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-2 min-w-40">
                            {actions
                              .filter(action => !action.condition || action.condition(item))
                              .slice(2)
                              .map((action) => (
                                <button
                                  key={action.key}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    action.onClick(item, index)
                                    setShowMobileActions(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 hover:bg-slate-700/50 text-gray-400 hover:text-white"
                                >
                                  {action.icon}
                                  {action.label}
                                </button>
                              ))}
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Card Body - remaining columns */}
              <div className="grid grid-cols-1 gap-2">
                {columns.slice(2).map((column) => {
                  const value = (item as any)[column.key]
                  if (value === null || value === undefined || value === '') return null

                  return (
                    <div key={column.key} className="flex items-center text-sm">
                      <span className="text-gray-400 min-w-24 mr-2">{column.title}:</span>
                      <span className="text-gray-300 flex-1 truncate">
                        {column.render
                          ? column.render(value, item, index)
                          : value
                        }
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* View Mode Toggle */}
          {viewModes.length > 1 && (
            <div className="flex items-center bg-slate-700 rounded-lg p-1">
              {viewModes.includes('table') && (
                <button
                  onClick={() => setViewMode('table')}
                  className={`
                    p-2 rounded transition-colors touch-target
                    ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}
                  `}
                  title="Προβολή πίνακα"
                >
                  <List className="w-4 h-4" />
                </button>
              )}
              {viewModes.includes('cards') && (
                <button
                  onClick={() => setViewMode('cards')}
                  className={`
                    p-2 rounded transition-colors touch-target
                    ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}
                  `}
                  title="Προβολή καρτών"
                >
                  <Grid className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-400">
          {sortedData.length} από {data.length} {sortedData.length === 1 ? 'αποτέλεσμα' : 'αποτελέσματα'}
          {searchTerm && ` για "${searchTerm}"`}
        </div>
      </div>

      {/* Table/Cards Content */}
      <div className="relative">
        {viewMode === 'table' ? renderTableView() : renderCardView()}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-sm text-gray-400">
            Εμφάνιση {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} από {pagination.total}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-1 text-sm touch-target"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 bg-slate-700 border border-slate-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors touch-target"
              >
                Προηγούμενη
              </button>

              <span className="text-sm text-gray-400 px-2">
                Σελίδα {pagination.page} από {Math.ceil(pagination.total / pagination.pageSize)}
              </span>

              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                className="px-3 py-1 bg-slate-700 border border-slate-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors touch-target"
              >
                Επόμενη
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Common table action components
export const TableActions = {
  view: (onClick: () => void): TableAction => ({
    key: 'view',
    label: 'Προβολή',
    icon: <Eye className="w-4 h-4" />,
    onClick,
    variant: 'primary'
  }),

  edit: (onClick: () => void): TableAction => ({
    key: 'edit',
    label: 'Επεξεργασία',
    icon: <Edit className="w-4 h-4" />,
    onClick,
    variant: 'secondary'
  }),

  delete: (onClick: () => void, condition?: (item: any) => boolean): TableAction => ({
    key: 'delete',
    label: 'Διαγραφή',
    icon: <Trash2 className="w-4 h-4" />,
    onClick,
    variant: 'danger',
    condition
  })
}

// Status badge component for tables
export function StatusBadge({
  status,
  variant = 'default'
}: {
  status: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'danger':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getVariantClasses()}`}>
      {status}
    </span>
  )
}