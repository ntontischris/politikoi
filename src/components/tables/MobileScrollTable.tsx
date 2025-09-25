import { ReactNode, useRef, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useResponsive, useTouchDevice } from '../../hooks/useResponsive'

interface MobileScrollTableColumn<T = any> {
  key: string
  title: string
  render?: (value: any, item: T) => ReactNode
  width?: string
  minWidth?: string
  sticky?: boolean
  priority?: number // 1 = highest priority (always visible), higher numbers get hidden first
}

interface MobileScrollTableProps<T = any> {
  data: T[]
  columns: MobileScrollTableColumn<T>[]
  isLoading?: boolean
  emptyMessage?: string
  className?: string
  onRowClick?: (item: T) => void
  maxHeight?: string
}

export function MobileScrollTable<T = any>({
  data = [],
  columns,
  isLoading = false,
  emptyMessage = 'Δεν βρέθηκαν δεδομένα',
  className = '',
  onRowClick,
  maxHeight = '70vh'
}: MobileScrollTableProps<T>) {
  const { isMobile, isTablet } = useResponsive()
  const { isTouchDevice } = useTouchDevice()
  const tableRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(true)

  // Check scroll position
  const checkScroll = () => {
    if (tableRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScroll()
    const element = tableRef.current
    if (element) {
      element.addEventListener('scroll', checkScroll)
      return () => element.removeEventListener('scroll', checkScroll)
    }
  }, [data])

  // Hide scroll hint after user interaction
  useEffect(() => {
    if (showScrollHint) {
      const timer = setTimeout(() => setShowScrollHint(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showScrollHint])

  const scrollToDirection = (direction: 'left' | 'right') => {
    if (tableRef.current) {
      const scrollAmount = tableRef.current.clientWidth * 0.8
      const currentScroll = tableRef.current.scrollLeft
      const newScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount

      tableRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      })
    }
  }

  // Sort columns by priority for responsive hiding
  const sortedColumns = [...columns].sort((a, b) => (a.priority || 999) - (b.priority || 999))

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
    <div className={`bg-slate-800 border border-slate-700 rounded-xl relative ${className}`}>
      {/* Scroll Hint */}
      {isMobile && showScrollHint && canScrollRight && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs z-10 animate-bounce">
          <div className="flex items-center gap-2">
            <MoreHorizontal className="w-4 h-4" />
            Σύρετε για περισσότερα
          </div>
        </div>
      )}

      {/* Scroll Buttons - Desktop/Tablet */}
      {!isMobile && (canScrollLeft || canScrollRight) && (
        <>
          {canScrollLeft && (
            <button
              onClick={() => scrollToDirection('left')}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scrollToDirection('right')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}

      {/* Table Container */}
      <div
        ref={tableRef}
        className="overflow-x-auto scroll-smooth-mobile"
        style={{ maxHeight }}
        onScroll={() => {
          checkScroll()
          setShowScrollHint(false)
        }}
      >
        <table className="w-full min-w-max">
          <thead className="sticky top-0 z-20 bg-slate-700/95 backdrop-blur-sm">
            <tr className="border-b border-slate-700">
              {sortedColumns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    text-left py-3 px-4 text-gray-300 font-medium text-sm whitespace-nowrap
                    ${column.sticky ? 'sticky left-0 z-30 bg-slate-700/95' : ''}
                  `}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || (isMobile ? '120px' : '100px')
                  }}
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
                {sortedColumns.map((column) => {
                  const value = (item as any)[column.key]
                  const content = column.render ? column.render(value, item) : value

                  return (
                    <td
                      key={column.key}
                      className={`
                        py-3 px-4 text-gray-300 text-sm whitespace-nowrap
                        ${column.sticky ? 'sticky left-0 z-10 bg-slate-800' : ''}
                      `}
                      style={{
                        minWidth: column.minWidth || (isMobile ? '120px' : '100px')
                      }}
                    >
                      <div className="max-w-40 truncate" title={typeof content === 'string' ? content : undefined}>
                        {content}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scroll Indicators - Mobile */}
      {isMobile && (canScrollLeft || canScrollRight) && (
        <div className="flex justify-center pt-2 pb-4">
          <div className="flex items-center gap-2 bg-slate-700 rounded-full px-4 py-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${canScrollLeft ? 'bg-blue-400' : 'bg-slate-500'}`} />
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <div className={`w-2 h-2 rounded-full transition-colors ${canScrollRight ? 'bg-blue-400' : 'bg-slate-500'}`} />
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced table with both scroll and card fallback
export function ResponsiveMobileTable<T = any>({
  data = [],
  columns,
  cardColumns,
  isLoading = false,
  emptyMessage = 'Δεν βρέθηκαν δεδομένα',
  className = '',
  onRowClick,
  preferCards = false
}: MobileScrollTableProps<T> & {
  cardColumns?: MobileScrollTableColumn<T>[]
  preferCards?: boolean
}) {
  const { isMobile } = useResponsive()

  // Use card view on mobile if preferred or if too many columns
  const shouldUseCards = isMobile && (preferCards || columns.length > 4)

  if (shouldUseCards && cardColumns) {
    return (
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Φόρτωση...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl">
            <div className="text-center py-12 text-gray-400">
              <p>{emptyMessage}</p>
            </div>
          </div>
        ) : (
          data.map((item, index) => (
            <div
              key={index}
              className={`
                bg-slate-800 border border-slate-700 rounded-xl p-4
                ${onRowClick ? 'cursor-pointer hover:bg-slate-700/30 transition-colors' : ''}
              `}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {cardColumns.map((column, colIndex) => {
                const value = (item as any)[column.key]
                const content = column.render ? column.render(value, item) : value

                if (value === null || value === undefined || value === '') return null

                return (
                  <div key={column.key} className={colIndex > 0 ? 'mt-2' : ''}>
                    {colIndex === 0 ? (
                      <div className="text-white font-medium text-base">{content}</div>
                    ) : (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-400 min-w-20 mr-2">{column.title}:</span>
                        <span className="text-gray-300">{content}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <MobileScrollTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      className={className}
      onRowClick={onRowClick}
    />
  )
}