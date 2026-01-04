import 'dotenv/config'
import { sendEmail } from './emailService.js'

// Test email sending
async function testEmails() {
  console.log('📧 Testing email notifications...\n')

  // Get test email from command line or use default
  const testEmail = process.argv[2] || 'test@example.com'

  console.log(`Sending test emails to: ${testEmail}\n`)

  // Test 1: Subscription Started
  console.log('1️⃣ Testing "Subscription Started" email...')
  const result1 = await sendEmail(testEmail, 'subscriptionStarted', {
    userName: 'TestUser'
  })
  if (result1.success) {
    console.log('✅ Sent!')
  } else {
    console.log('❌ Failed!')
    console.log('Error details:', JSON.stringify(result1.error, null, 2))
  }
  console.log()

  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Test 2: Subscription Canceled
  console.log('2️⃣ Testing "Subscription Canceled" email...')
  const result2 = await sendEmail(testEmail, 'subscriptionCanceled', {
    userName: 'TestUser'
  })
  if (result2.success) {
    console.log('✅ Sent!')
  } else {
    console.log('❌ Failed!')
    console.log('Error details:', JSON.stringify(result2.error, null, 2))
  }
  console.log()

  // Summary
  const allSuccess = result1.success && result2.success

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (allSuccess) {
    console.log('✅ All emails sent successfully!')
    console.log(`📬 Check ${testEmail} inbox`)
  } else {
    console.log('⚠️ Some emails failed to send')
    console.log('Check your RESEND_API_KEY in .env')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

testEmails()

