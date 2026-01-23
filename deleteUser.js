import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteUser(email) {
  console.log(`\n🗑️  Deleting user account: ${email}\n`)

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

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Delete user account (this will also delete subscription due to CASCADE)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError)
      return
    }

    console.log(`\n✅ SUCCESS! User account deleted: ${email}`)
    console.log(`\n💡 User can now sign up again with the same email\n`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║        🗑️  Delete User Account Tool                   ║
╚════════════════════════════════════════════════════════╝

Usage:
  node deleteUser.js <email>

Example:
  node deleteUser.js user@example.com

⚠️  This will completely delete the user account and all associated data.

`)
  process.exit(0)
}

deleteUser(email)

