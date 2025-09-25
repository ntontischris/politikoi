import { ReactNode } from 'react'
import { useResponsive } from '../../hooks/useResponsive'

interface SimpleTableColumn<T = any> {
  key: string
  title: string
  render?: (value: any, item: T) => ReactNode
  className?: string
  width?: string
  mobileLabel?: string
}

interface SimpleTableProps<T = any> {
  data: T[]
  columns: SimpleTableColumn<T>[]
  isLoading?: boolean
  emptyMessage?: string
  className?: string
  onRowClick?: (item: T) => void
}

export function SimpleTable<T = any>({
  data = [],
  columns,
  isLoading = false,
  emptyMessage = 'Δεν βρέθηκαν δεδομένα',
  className = '',
  onRowClick
}: SimpleTableProps<T>) {
  const { isMobile } = useResponsive()

  if (isLoading) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-xl ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Φόρτωση...</span>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-xl ${className}`}>
        <div className="text-center py-12 text-gray-400">
          <p>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/50 border-b border-slate-700">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left py-3 px-4 text-gray-300 font-medium text-sm ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-slate-700/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column) => {
                  const value = (item as any)[column.key]
                  const content = column.render ? column.render(value, item) : value

                  return (
                    <td
                      key={column.key}
                      className={`py-3 px-4 text-gray-300 text-sm ${column.className || ''}`}
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            className={`
              bg-slate-800 border border-slate-700 rounded-xl p-4
              ${onRowClick ? 'cursor-pointer hover:bg-slate-700/30 transition-colors' : ''}
            `}
            onClick={() => onRowClick && onRowClick(item)}
          >
            {columns.map((column, colIndex) => {
              const value = (item as any)[column.key]
              const content = column.render ? column.render(value, item) : value

              if (value === null || value === undefined || value === '') return null

              return (
                <div key={column.key} className={`${colIndex > 0 ? 'mt-2' : ''} ${column.className || ''}`}>
                  {colIndex === 0 ? (
                    <div className="text-white font-medium text-base">{content}</div>
                  ) : (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 min-w-20 mr-2">
                        {column.mobileLabel || column.title}:
                      </span>
                      <span className="text-gray-300">{content}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}