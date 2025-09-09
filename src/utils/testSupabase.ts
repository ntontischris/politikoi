import { supabase } from '../lib/supabase'

export async function testSupabaseConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test basic connection with citizens table
    const { data, error, count } = await supabase
      .from('citizens')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Connection failed:', error)
      return false
    }
    
    console.log('✅ Connection successful!')
    console.log(`📊 Citizens count: ${count || 0}`)
    
    // Test statistics functions
    try {
      const { data: stats, error: statsError } = await supabase.rpc('get_citizen_stats')
      if (statsError) {
        console.warn('⚠️ Statistics function error:', statsError)
      } else {
        console.log('📈 Statistics function working:', stats)
      }
    } catch (e) {
      console.warn('⚠️ Statistics function not available yet')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

export async function testAllServices() {
  console.log('🧪 Testing all services...')
  
  try {
    // Import services
    const { citizensService } = await import('../services/citizensService')
    const { requestsService } = await import('../services/requestsService')
    const { militaryService } = await import('../services/militaryService')
    const { communicationService } = await import('../services/communicationService')
    const { reminderService } = await import('../services/reminderService')
    
    // Test each service
    console.log('Testing Citizens Service...')
    const citizens = await citizensService.getAllCitizens()
    console.log(`✅ Citizens: ${citizens.length} records`)
    
    console.log('Testing Requests Service...')
    const requests = await requestsService.getAllRequests()
    console.log(`✅ Requests: ${requests.length} records`)
    
    console.log('Testing Military Service...')
    const military = await militaryService.getAllMilitaryPersonnel()
    console.log(`✅ Military Personnel: ${military.length} records`)
    
    console.log('Testing Communication Service...')
    const communications = await communicationService.getAllCommunicationDates()
    console.log(`✅ Communications: ${communications.length} records`)
    
    console.log('Testing Reminder Service...')
    const reminders = await reminderService.getAllReminders()
    console.log(`✅ Reminders: ${reminders.length} records`)
    
    console.log('🎉 All services tested successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Service test failed:', error)
    return false
  }
}

// Helper function to run tests from console
export function runDatabaseTests() {
  console.log('🚀 Starting database tests...')
  
  testSupabaseConnection()
    .then(connectionSuccess => {
      if (connectionSuccess) {
        return testAllServices()
      } else {
        console.error('❌ Skipping service tests due to connection failure')
        return false
      }
    })
    .then(success => {
      if (success) {
        console.log('✅ All tests passed! Your Supabase integration is ready.')
      } else {
        console.error('❌ Some tests failed. Check the errors above.')
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error)
    })
}

// Run tests automatically in development
if (import.meta.env.DEV) {
  console.log('🔧 Development mode detected. Available test functions:')
  console.log('- runDatabaseTests() - Test database connection and services')
  console.log('- For store integration tests, use functions from integrationTests.ts')
  
  // Make database tests available globally
  ;(window as any).runDatabaseTests = runDatabaseTests
  ;(window as any).testSupabaseConnection = testSupabaseConnection
  ;(window as any).testAllServices = testAllServices
}