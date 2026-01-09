import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function expireTrial(email) {
  console.log(`\n⏰ Expiring trial for: ${email}\n`)

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
      console.log('\n💡 Make sure they have signed up first!')
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Set trial end to 1 hour ago (expired)
    const expiredDate = new Date()
    expiredDate.setHours(expiredDate.getHours() - 1)

    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        trial_end: expiredDate.toISOString(),
        subscription_status: 'trial',
        stripe_subscription_id: null,
        stripe_customer_id: null,
        subscription_end: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      return
    }

    console.log(`\n✅ SUCCESS! Trial expired at: ${expiredDate.toLocaleString()}`)
    console.log(`\n⚠️  ${email} will now see "Subscription Required" modal\n`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           ⏰ Expire Trial Tool                         ║
╚════════════════════════════════════════════════════════╝

Usage:
  node expireTrial.js <email>

Example:
  node expireTrial.js user@example.com

⚠️  This will immediately expire the user's trial and remove
   any paid subscription, forcing them to subscribe.

`)
  process.exit(0)
}

expireTrial(email)

