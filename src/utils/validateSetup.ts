// Validation script για έλεγχο του setup
import { supabase, signInWithPassword } from '../lib/supabase'
import { DEV_AUTH } from '../lib/devAuth'

interface ValidationResult {
  test: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

export async function validateAuthSetup(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  // Test 1: Environment Variables
  try {
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY

    results.push({
      test: 'Environment Variables',
      status: hasUrl && hasKey ? 'pass' : 'fail',
      message: hasUrl && hasKey ? 'Environment variables configured' : 'Missing environment variables',
      details: { hasUrl, hasKey }
    })
  } catch (error) {
    results.push({
      test: 'Environment Variables',
      status: 'fail',
      message: 'Error checking environment variables',
      details: error
    })
  }

  // Test 2: Database Connection
  try {
    const { data, error } = await supabase.from('citizens').select('count', { count: 'exact', head: true })

    results.push({
      test: 'Database Connection',
      status: error ? 'fail' : 'pass',
      message: error ? `Database error: ${error.message}` : `Connected. ${data ? 'Found data' : 'No data'}`,
      details: { error, count: data }
    })
  } catch (error) {
    results.push({
      test: 'Database Connection',
      status: 'fail',
      message: 'Database connection failed',
      details: error
    })
  }

  // Test 3: Authentication
  try {
    const { data, error } = await signInWithPassword('admin@politikoi.gr', 'admin123!')

    if (!error && data.user) {
      results.push({
        test: 'Authentication',
        status: 'pass',
        message: 'Admin authentication successful',
        details: { userId: data.user.id, email: data.user.email }
      })

      // Sign out immediately
      await supabase.auth.signOut()
    } else {
      results.push({
        test: 'Authentication',
        status: 'warning',
        message: `Auth failed: ${error?.message || 'Unknown error'}`,
        details: error
      })
    }
  } catch (error) {
    results.push({
      test: 'Authentication',
      status: 'fail',
      message: 'Authentication test failed',
      details: error
    })
  }

  // Test 4: Dev Auth Fallback
  try {
    const devAuthEnabled = DEV_AUTH.isEnabled()
    const devResult = await DEV_AUTH.signIn()

    results.push({
      test: 'Development Auth',
      status: devAuthEnabled && devResult.data ? 'pass' : 'warning',
      message: devAuthEnabled ?
        (devResult.data ? 'Dev auth working' : 'Dev auth enabled but not working') :
        'Dev auth disabled (production mode)',
      details: { enabled: devAuthEnabled, working: !!devResult.data }
    })

    // Clean up dev auth
    await DEV_AUTH.signOut()
  } catch (error) {
    results.push({
      test: 'Development Auth',
      status: 'warning',
      message: 'Dev auth test failed',
      details: error
    })
  }

  // Test 5: CRUD Operations
  try {
    // Test insert
    const { data: insertData, error: insertError } = await supabase
      .from('citizens')
      .insert([{ name: 'Test', surname: 'Validation', phone: '6900000000' }])
      .select()
      .single()

    if (insertError) {
      results.push({
        test: 'CRUD Operations',
        status: 'fail',
        message: `Insert failed: ${insertError.message}`,
        details: insertError
      })
    } else {
      // Test update
      const { error: updateError } = await supabase
        .from('citizens')
        .update({ phone: '6900000001' })
        .eq('id', insertData.id)

      // Test delete
      const { error: deleteError } = await supabase
        .from('citizens')
        .delete()
        .eq('id', insertData.id)

      if (updateError || deleteError) {
        results.push({
          test: 'CRUD Operations',
          status: 'warning',
          message: `CRUD partially working. Update: ${updateError?.message || 'OK'}, Delete: ${deleteError?.message || 'OK'}`,
          details: { updateError, deleteError }
        })
      } else {
        results.push({
          test: 'CRUD Operations',
          status: 'pass',
          message: 'All CRUD operations working',
          details: { insertId: insertData.id }
        })
      }
    }
  } catch (error) {
    results.push({
      test: 'CRUD Operations',
      status: 'fail',
      message: 'CRUD test failed',
      details: error
    })
  }

  // Test 6: Real-time Features
  try {
    const channel = supabase.channel('validation-test')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'citizens' },
        () => console.log('Real-time test successful'))
      .subscribe()

    // Test the subscription
    const subscriptionStatus = channel.state

    results.push({
      test: 'Real-time Features',
      status: subscriptionStatus === 'subscribed' ? 'pass' : 'warning',
      message: `Real-time subscription: ${subscriptionStatus}`,
      details: { status: subscriptionStatus }
    })

    // Clean up
    await supabase.removeChannel(channel)
  } catch (error) {
    results.push({
      test: 'Real-time Features',
      status: 'warning',
      message: 'Real-time test failed',
      details: error
    })
  }

  return results
}

// Helper function για console output
export function logValidationResults(results: ValidationResult[]) {
  console.log('\n🔍 VALIDATION RESULTS')
  console.log('========================')

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warning').length

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${result.test}: ${result.message}`)

    if (result.details && import.meta.env.DEV) {
      console.log('   Details:', result.details)
    }
  })

  console.log('\n📊 SUMMARY')
  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️ Warnings: ${warnings}`)
  console.log(`❌ Failed: ${failed}`)

  const overallStatus = failed === 0 ? (warnings === 0 ? 'ALL GOOD' : 'MOSTLY WORKING') : 'NEEDS ATTENTION'
  console.log(`\n🎯 Overall Status: ${overallStatus}`)

  return { passed, warnings, failed, overallStatus }
}

// Auto-run in development
if (import.meta.env.DEV) {
  console.log('🔧 Development mode: Validation available via window.validateSetup()')
  ;(window as any).validateSetup = async () => {
    const results = await validateAuthSetup()
    return logValidationResults(results)
  }
}