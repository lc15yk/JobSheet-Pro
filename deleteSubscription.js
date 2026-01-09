import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteSubscription(email) {
  console.log(`\n🗑️  Deleting subscription for: ${email}\n`)

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

    // Delete subscription record
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Error deleting subscription:', deleteError)
      return
    }

    console.log(`\n✅ SUCCESS! Subscription deleted for ${email}`)
    console.log(`\n💡 User will now see "Welcome" modal as a brand new user\n`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║        🗑️  Delete Subscription Tool                    ║
╚════════════════════════════════════════════════════════╝

Usage:
  node deleteSubscription.js <email>

Example:
  node deleteSubscription.js user@example.com

⚠️  This will completely delete the user's subscription record,
   making them appear as a brand new user who can start a trial.

`)
  process.exit(0)
}

deleteSubscription(email)

