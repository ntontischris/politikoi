// Export all table components
export { ResponsiveTable, TableActions, StatusBadge } from './ResponsiveTable'
export type { TableColumn, TableAction, ResponsiveTableProps } from './ResponsiveTable'

export { SimpleTable } from './SimpleTable'
export { MobileScrollTable, ResponsiveMobileTable } from './MobileScrollTable'
export type { MobileScrollTableColumn, MobileScrollTableProps } from './MobileScrollTable'

// Common table utilities
export const TableUtils = {
  // Format date for table display
  formatDate: (date: string | Date, locale = 'el-GR') => {
    if (!date) return '-'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString(locale)
  },

  // Format currency for table display
  formatCurrency: (amount: number, currency = 'EUR', locale = 'el-GR') => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount)
  },

  // Format number for table display
  formatNumber: (num: number, locale = 'el-GR') => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString(locale)
  },

  // Truncate text with ellipsis
  truncateText: (text: string, maxLength = 50) => {
    if (!text) return '-'
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  },

  // Create a badge element for status
  createStatusBadge: (
    status: string,
    statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }>
  ) => {
    const config = statusMap[status] || { label: status, variant: 'default' as const }
    return (
      <StatusBadge
        status={config.label}
        variant={config.variant}
      />
    )
  }
}

// Common status mappings
export const CommonStatusMaps = {
  requestStatus: {
    submitted: { label: 'Υποβλήθηκε', variant: 'info' as const },
    in_progress: { label: 'Σε Εξέλιξη', variant: 'warning' as const },
    pending_review: { label: 'Εκκρεμεί Έλεγχος', variant: 'warning' as const },
    approved: { label: 'Εγκρίθηκε', variant: 'success' as const },
    rejected: { label: 'Απορρίφθηκε', variant: 'danger' as const },
    completed: { label: 'Ολοκληρώθηκε', variant: 'success' as const }
  },

  priority: {
    low: { label: 'Χαμηλή', variant: 'default' as const },
    medium: { label: 'Μέση', variant: 'warning' as const },
    high: { label: 'Υψηλή', variant: 'danger' as const },
    urgent: { label: 'Επείγουσα', variant: 'danger' as const }
  },

  activeStatus: {
    active: { label: 'Ενεργό', variant: 'success' as const },
    inactive: { label: 'Ανενεργό', variant: 'default' as const },
    suspended: { label: 'Αναστολή', variant: 'warning' as const }
  }
}