import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseUser(email) {
  console.log('\n🔍 DIAGNOSING USER SUBSCRIPTION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('❌ Error fetching users:', userError)
      return
    }

    const user = userData.users.find(u => u.email === email)

    if (!user) {
      console.error(`❌ User not found: ${email}`)
      return
    }

    console.log(`✅ Found user: ${user.email}`)
    console.log(`   User ID: ${user.id}\n`)

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError) {
      console.error('❌ Error fetching subscription:', subError)
      return
    }

    if (!subscription) {
      console.log('⚠️  No subscription found for this user')
      return
    }

    console.log('📋 RAW DATABASE VALUES:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('subscription_status:', subscription.subscription_status)
    console.log('stripe_subscription_id:', subscription.stripe_subscription_id || 'NULL')
    console.log('stripe_customer_id:', subscription.stripe_customer_id || 'NULL')
    console.log('trial_end:', subscription.trial_end || 'NULL')
    console.log('subscription_end:', subscription.subscription_end || 'NULL')
    console.log('created_at:', subscription.created_at)
    console.log('updated_at:', subscription.updated_at || 'NULL')
    console.log('\n')

    // Now run the EXACT same logic as the app
    const now = new Date()
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null
    const subscriptionEnd = subscription.subscription_end ? new Date(subscription.subscription_end) : null

    console.log('🧮 CALCULATED VALUES:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Current time:', now.toISOString())
    console.log('Trial end:', trialEnd ? trialEnd.toISOString() : 'NULL')
    console.log('Subscription end:', subscriptionEnd ? subscriptionEnd.toISOString() : 'NULL')
    console.log('\n')

    // Check trial
    const isTrialActive = subscription.subscription_status === 'trial' && trialEnd && now < trialEnd
    console.log('🔍 TRIAL CHECK:')
    console.log('  subscription_status === "trial"?', subscription.subscription_status === 'trial')
    console.log('  trialEnd exists?', !!trialEnd)
    console.log('  now < trialEnd?', trialEnd ? now < trialEnd : 'N/A')
    console.log('  ➡️  isTrialActive:', isTrialActive ? '✅ YES' : '❌ NO')
    console.log('\n')

    // Check paid subscription
    const isPaidActive = subscription.stripe_subscription_id &&
                         subscription.subscription_status === 'active' &&
                         subscriptionEnd && now < subscriptionEnd

    console.log('🔍 PAID SUBSCRIPTION CHECK:')
    console.log('  stripe_subscription_id exists?', !!subscription.stripe_subscription_id)
    console.log('  subscription_status === "active"?', subscription.subscription_status === 'active')
    console.log('  subscriptionEnd exists?', !!subscriptionEnd)
    console.log('  now < subscriptionEnd?', subscriptionEnd ? now < subscriptionEnd : 'N/A')
    console.log('  ➡️  isPaidActive:', isPaidActive ? '✅ YES' : '❌ NO')
    console.log('\n')

    // Final result
    const hasAccess = isTrialActive || isPaidActive
    console.log('🎯 FINAL RESULT:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('hasAccess:', hasAccess ? '✅ YES - USER HAS ACCESS' : '❌ NO - USER BLOCKED')
    console.log('\n')

    if (!hasAccess) {
      console.log('💡 TO FIX THIS:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('In Supabase, update the subscriptions table:')
      console.log('1. Set subscription_status = "active"')
      console.log('2. Set subscription_end to a future date (e.g., "2027-01-13T00:00:00Z")')
      console.log('3. Make sure stripe_subscription_id has a value (any value works for testing)')
      console.log('\n')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log('Usage: node diagnoseUser.js <user-email>')
  process.exit(1)
}

diagnoseUser(email)

