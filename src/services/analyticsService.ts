export interface MonthlyAnalytics {
  month: string
  citizens: number
  requests: number
  military: number
  completed: number
  pending: number
}

export interface StatusDistribution {
  name: string
  value: number
  color: string
}

export interface AnalyticsData {
  monthlyTrends: MonthlyAnalytics[]
  statusDistribution: StatusDistribution[]
  requestDistribution: StatusDistribution[]
  militaryDistribution: StatusDistribution[]
  completionRates: {
    citizens: number
    requests: number
    military: number
  }
  growthRates: {
    citizensGrowth: number
    requestsGrowth: number
    militaryGrowth: number
  }
}

export class AnalyticsService {
  
  static getMonthlyTrends(): MonthlyAnalytics[] {
    const months = [
      'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν',
      'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'
    ]
    
    return months.map((month, index) => ({
      month,
      citizens: Math.floor(50 + Math.random() * 30 + index * 2),
      requests: Math.floor(20 + Math.random() * 40 + index * 3),
      military: Math.floor(5 + Math.random() * 15 + index * 1),
      completed: Math.floor(15 + Math.random() * 25 + index * 2),
      pending: Math.floor(5 + Math.random() * 15)
    }))
  }
  
  static getStatusDistribution(): StatusDistribution[] {
    return [
      { name: 'Ενεργά', value: 45, color: '#10B981' },
      { name: 'Εκκρεμή', value: 30, color: '#F59E0B' },
      { name: 'Ολοκληρωμένα', value: 20, color: '#3B82F6' },
      { name: 'Απορριφθέντα', value: 5, color: '#EF4444' }
    ]
  }
  
  static getRequestDistribution(): StatusDistribution[] {
    return [
      { name: 'Πιστοποιητικά', value: 40, color: '#3B82F6' },
      { name: 'Άδειες', value: 25, color: '#10B981' },
      { name: 'Βεβαιώσεις', value: 20, color: '#F59E0B' },
      { name: 'Λοιπά', value: 15, color: '#8B5CF6' }
    ]
  }
  
  static getMilitaryDistribution(): StatusDistribution[] {
    return [
      { name: 'ΕΣΣΟ 2025', value: 35, color: '#3B82F6' },
      { name: 'ΕΣΣΟ 2024', value: 30, color: '#10B981' },
      { name: 'ΕΣΣΟ 2023', value: 20, color: '#F59E0B' },
      { name: 'Παλαιότερα', value: 15, color: '#8B5CF6' }
    ]
  }
  
  static getCompletionRates() {
    return {
      citizens: 85,
      requests: 78,
      military: 92
    }
  }
  
  static getGrowthRates() {
    return {
      citizensGrowth: 12.5,
      requestsGrowth: 18.3,
      militaryGrowth: 6.7
    }
  }
  
  static getFullAnalytics(): AnalyticsData {
    return {
      monthlyTrends: this.getMonthlyTrends(),
      statusDistribution: this.getStatusDistribution(),
      requestDistribution: this.getRequestDistribution(),
      militaryDistribution: this.getMilitaryDistribution(),
      completionRates: this.getCompletionRates(),
      growthRates: this.getGrowthRates()
    }
  }
  
  // Performance metrics
  static getPerformanceMetrics() {
    return {
      avgProcessingTime: '2.3 ημέρες',
      satisfactionRate: '94%',
      systemUptime: '99.8%',
      activeUsers: 156,
      monthlyTransactions: 834
    }
  }
  
  // Time-based statistics  
  static getCurrentMonthStats() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const trends = this.getMonthlyTrends()
    
    return trends[currentMonth] || trends[trends.length - 1]
  }
  
  static getYearOverYearComparison() {
    return {
      citizens: { current: 487, previous: 423, growth: 15.1 },
      requests: { current: 1247, previous: 1089, growth: 14.5 },
      military: { current: 234, previous: 198, growth: 18.2 }
    }
  }
}