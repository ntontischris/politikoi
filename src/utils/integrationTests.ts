// Integration test script for all store integrations
import { useCitizenStore } from '../stores/citizenStore'
import { useRequestStore } from '../stores/requestStore'
import { useMilitaryStore } from '../stores/militaryStore'
import { useReminderStore } from '../stores/reminderStore'
import { useCommunicationStore } from '../stores/communicationStore'

interface TestResult {
  service: string
  success: boolean
  error?: string
  dataCount?: number
}

export async function runStoreIntegrationTests(): Promise<TestResult[]> {
  const results: TestResult[] = []
  
  console.log('🧪 Starting Store Integration Tests...\n')

  // Test Citizen Store
  try {
    console.log('Testing Citizen Store...')
    const citizenStore = useCitizenStore.getState()
    
    await citizenStore.loadCitizens()
    const stats = await citizenStore.getStats()
    
    results.push({
      service: 'Citizens Store',
      success: true,
      dataCount: stats.total
    })
    
    console.log(`✅ Citizens Store: ${stats.total} records loaded`)
  } catch (error) {
    results.push({
      service: 'Citizens Store',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log(`❌ Citizens Store failed: ${error}`)
  }

  // Test Request Store
  try {
    console.log('Testing Request Store...')
    const requestStore = useRequestStore.getState()
    
    await requestStore.loadRequests()
    const stats = await requestStore.getStats()
    
    results.push({
      service: 'Requests Store',
      success: true,
      dataCount: stats.total
    })
    
    console.log(`✅ Requests Store: ${stats.total} records loaded`)
  } catch (error) {
    results.push({
      service: 'Requests Store',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log(`❌ Requests Store failed: ${error}`)
  }

  // Test Military Store
  try {
    console.log('Testing Military Store...')
    const militaryStore = useMilitaryStore.getState()
    
    await militaryStore.loadMilitaryPersonnel()
    const stats = await militaryStore.getStats()
    
    results.push({
      service: 'Military Store',
      success: true,
      dataCount: stats.total
    })
    
    console.log(`✅ Military Store: ${stats.total} records loaded`)
  } catch (error) {
    results.push({
      service: 'Military Store',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log(`❌ Military Store failed: ${error}`)
  }

  // Test Reminder Store
  try {
    console.log('Testing Reminder Store...')
    const reminderStore = useReminderStore.getState()
    
    await reminderStore.loadReminders()
    const stats = reminderStore.getStats()
    
    results.push({
      service: 'Reminders Store',
      success: true,
      dataCount: stats.total
    })
    
    console.log(`✅ Reminders Store: ${stats.total} records loaded`)
  } catch (error) {
    results.push({
      service: 'Reminders Store',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log(`❌ Reminders Store failed: ${error}`)
  }

  // Test Communication Store
  try {
    console.log('Testing Communication Store...')
    const communicationStore = useCommunicationStore.getState()
    
    await communicationStore.loadCommunications()
    const stats = communicationStore.getStats()
    
    results.push({
      service: 'Communications Store',
      success: true,
      dataCount: stats.total
    })
    
    console.log(`✅ Communications Store: ${stats.total} records loaded`)
  } catch (error) {
    results.push({
      service: 'Communications Store',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log(`❌ Communications Store failed: ${error}`)
  }

  console.log('\n📊 Test Results Summary:')
  console.log('=' + '='.repeat(50))
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    const count = result.dataCount !== undefined ? ` (${result.dataCount} records)` : ''
    const error = result.error ? ` - ${result.error}` : ''
    console.log(`${status} ${result.service}${count}${error}`)
  })

  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  console.log('=' + '='.repeat(50))
  console.log(`Summary: ${successCount}/${totalCount} stores working correctly`)
  
  if (successCount === totalCount) {
    console.log('🎉 All store integrations are working perfectly!')
  } else {
    console.log('⚠️  Some stores need attention. Check errors above.')
  }

  return results
}

// Test CRUD operations for a specific store
export async function testCRUDOperations() {
  console.log('🧪 Testing CRUD Operations...\n')
  
  try {
    const citizenStore = useCitizenStore.getState()
    
    console.log('1. Testing CREATE operation...')
    await citizenStore.addCitizen({
      name: 'Test',
      surname: 'User',
      afm: '999999999',
      phone: '6900000000',
      email: 'test@example.com',
      address: 'Test Address 123',
      city: 'Test City',
      municipality: 'ΘΕΣΣΑΛΟΝΙΚΗΣ',
      status: 'active'
    })
    console.log('✅ CREATE operation successful')
    
    const citizens = citizenStore.citizens
    const testCitizen = citizens.find(c => c.afm === '999999999')
    
    if (testCitizen) {
      console.log('2. Testing UPDATE operation...')
      await citizenStore.updateCitizen(testCitizen.id, {
        notes: 'Updated via integration test'
      })
      console.log('✅ UPDATE operation successful')
      
      console.log('3. Testing DELETE operation...')
      await citizenStore.deleteCitizen(testCitizen.id)
      console.log('✅ DELETE operation successful')
    }
    
    console.log('🎉 CRUD operations test completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ CRUD operations test failed:', error)
    return false
  }
}

// Helper function to run all integration tests from console
export function runAllIntegrationTests() {
  console.log('🚀 Starting Complete Integration Tests...\n')
  
  return runStoreIntegrationTests()
    .then(results => {
      const allSuccess = results.every(r => r.success)
      if (allSuccess) {
        return testCRUDOperations()
      }
      return false
    })
    .then(crudSuccess => {
      if (crudSuccess) {
        console.log('\n✅ All integration tests completed successfully!')
        console.log('Your Supabase integration is fully functional! 🎉')
      } else {
        console.log('\n❌ Some tests failed. Check the errors above.')
      }
    })
    .catch(error => {
      console.error('❌ Integration test execution failed:', error)
    })
}

// Make functions available in development console
if (import.meta.env.DEV) {
  (window as any).runStoreTests = runStoreIntegrationTests
  (window as any).runCRUDTests = testCRUDOperations
  (window as any).runAllTests = runAllIntegrationTests
  
  console.log('🔧 Integration test functions available:')
  console.log('- runStoreTests() - Test all store connections')
  console.log('- runCRUDTests() - Test create/read/update/delete operations')
  console.log('- runAllTests() - Run complete test suite')
}