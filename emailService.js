import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
const emailTemplates = {
  subscriptionStarted: (userName) => ({
    subject: '🎉 Welcome to JobSheet Pro!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #51cf66;">Thanks for subscribing!</h2>
        <p>Hi ${userName || 'there'},</p>
        <p>Thank you for subscribing to JobSheet Pro! Your payment has been processed successfully.</p>
        <p><strong>Subscription Details:</strong></p>
        <ul style="color: #666;">
          <li>Plan: JobSheet Pro Monthly</li>
          <li>Price: £9.99/month</li>
          <li>Status: Active</li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    display: inline-block;
                    font-weight: bold;">
            Start Generating Reports
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          You now have unlimited access to AI-powered job report generation!
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          JobSheet Pro - Professional job reports, simplified<br>
          <a href="${process.env.CLIENT_URL}" style="color: #667eea;">Visit Dashboard</a>
        </p>
      </div>
    `
  }),

  subscriptionCanceled: (userName) => ({
    subject: 'Your JobSheet Pro subscription has been canceled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">Subscription Canceled</h2>
        <p>Hi ${userName || 'there'},</p>
        <p>Your JobSheet Pro subscription has been canceled.</p>
        <p>You'll continue to have access until the end of your current billing period.</p>
        <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    display: inline-block;
                    font-weight: bold;">
            Resubscribe
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Have feedback? We'd love to hear from you. Just reply to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          JobSheet Pro - Professional job reports, simplified<br>
          <a href="${process.env.CLIENT_URL}" style="color: #667eea;">Visit Dashboard</a>
        </p>
      </div>
    `
  })
}

// Send email function
export async function sendEmail(to, templateName, templateData = {}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not set, skipping email')
      return { success: false, error: 'No API key' }
    }

    console.log('📧 Sending email with CLIENT_URL:', process.env.CLIENT_URL)

    const template = emailTemplates[templateName]
    if (!template) {
      throw new Error(`Unknown email template: ${templateName}`)
    }

    const { subject, html } = typeof template === 'function'
      ? template(...Object.values(templateData))
      : template

    const { data, error } = await resend.emails.send({
      from: 'JobSheet Pro <noreply@jobsheet.pro>',
      to: [to],
      subject,
      html
    })

    if (error) {
      console.error('❌ Email send error:', error)
      return { success: false, error }
    }

    console.log('✅ Email sent:', data.id)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Email error:', error)
    return { success: false, error: error.message }
  }
}

