import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSubscriptionStatus(email) {
  console.log(`\n🔍 Checking subscription status for: ${email}\n`)

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

    const now = new Date()
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null
    const subscriptionEnd = subscription.subscription_end ? new Date(subscription.subscription_end) : null

    console.log('📊 Subscription Details:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Status: ${subscription.subscription_status}`)
    console.log(`Trial End: ${trialEnd ? trialEnd.toLocaleString() : 'N/A'}`)
    console.log(`Subscription End: ${subscriptionEnd ? subscriptionEnd.toLocaleString() : 'N/A'}`)
    console.log(`Stripe Customer ID: ${subscription.stripe_customer_id || 'N/A'}`)
    console.log(`Stripe Subscription ID: ${subscription.stripe_subscription_id || 'N/A'}`)
    console.log(`Created: ${new Date(subscription.created_at).toLocaleString()}`)
    console.log(`Updated: ${new Date(subscription.updated_at).toLocaleString()}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Calculate access status
    const isTrialActive = trialEnd && now < trialEnd && !subscription.stripe_subscription_id
    const isPaidActive = subscription.stripe_subscription_id &&
                         subscription.subscription_status === 'active' &&
                         subscriptionEnd && now < subscriptionEnd

    console.log('🎯 Access Status:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Trial Active: ${isTrialActive ? '✅ YES' : '❌ NO'}`)
    console.log(`Paid Active: ${isPaidActive ? '✅ YES' : '❌ NO'}`)
    console.log(`Has Access: ${(isTrialActive || isPaidActive) ? '✅ YES' : '❌ NO'}`)
    
    if (isTrialActive && trialEnd) {
      const timeLeft = trialEnd - now
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      console.log(`Time Remaining: ${hoursLeft} hours ${minutesLeft} minutes`)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║        🔍 Check Subscription Status Tool               ║
╚════════════════════════════════════════════════════════╝

Usage:
  node checkSubscriptionStatus.js <email>

Example:
  node checkSubscriptionStatus.js user@example.com

`)
  process.exit(0)
}

checkSubscriptionStatus(email)

