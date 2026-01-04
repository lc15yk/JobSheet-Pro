import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function grantFreeAccess(email, weeks = 2) {
  console.log(`\n🎁 Granting free access to: ${email}`)
  console.log(`⏰ Duration: ${weeks} weeks\n`)

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

    // Calculate end date
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (weeks * 7))

    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        trial_end: endDate.toISOString(),
        subscription_status: 'trial',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      return
    }

    console.log(`\n✅ SUCCESS! Free access granted until: ${endDate.toLocaleDateString()}`)
    console.log(`\n🎉 ${email} can now use the app for free!\n`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Get email from command line
const email = process.argv[2]
const weeks = parseInt(process.argv[3]) || 2

if (!email) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           🎁 Grant Free Access Tool                    ║
╚════════════════════════════════════════════════════════╝

Usage:
  node grantFreeAccess.js <email> [weeks]

Examples:
  node grantFreeAccess.js user@example.com          (2 weeks free - default)
  node grantFreeAccess.js user@example.com 4        (4 weeks free)
  node grantFreeAccess.js user@example.com 52       (1 year free)

`)
  process.exit(0)
}

grantFreeAccess(email, weeks)

