import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('📧 Testing email sending...\n');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env file!');
    process.exit(1);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'JobSheet Pro <onboarding@resend.dev>',
      to: ['dan00o@hotmail.co.uk'],
      subject: '🧪 Test Email from JobSheet Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">✅ Email Test Successful!</h1>
          <p>This is a test email from JobSheet Pro.</p>
          <p>If you're seeing this, your email configuration is working correctly! 🎉</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent from JobSheet Pro Email System
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data.id);
    console.log('\n💡 Check your inbox at: dan00o@hotmail.co.uk');
    console.log('📝 Note: Check spam folder if you don\'t see it!\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testEmail();

