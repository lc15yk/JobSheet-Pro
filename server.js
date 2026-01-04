import 'dotenv/config'
import express from 'express'
import Stripe from 'stripe'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './emailService.js'

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CLIENT_URL',
  'OPENAI_API_KEY'
]

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`))
  console.error('\nPlease check your .env file and ensure all required variables are set.')
  process.exit(1)
}

console.log('✅ All required environment variables are present')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const app = express()
app.use(cors())
app.use(express.json())

// Initialize Supabase client (for updating subscription status)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for admin operations
)

// Create Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  const { userId, userEmail, priceId } = req.body

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}?success=true`,
      cancel_url: `${process.env.CLIENT_URL}?canceled=true`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        description: 'JobSheet Pro - Create professional job reports',
      },
      custom_text: {
        submit: {
          message: 'Start creating job reports',
        },
      },
    })

    console.log('✅ Checkout session created:', session.id)
    console.log('🔗 Checkout URL:', session.url)

    res.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate AI report endpoint
app.post('/generate-report', async (req, res) => {
  const { prompt, systemPrompt, detailLevel } = req.body

  try {
    console.log('🤖 Generating AI report...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 650,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ OpenAI API error:', error)
      return res.status(response.status).json({ error: error.error?.message || 'OpenAI API error' })
    }

    const data = await response.json()
    const report = data.choices[0].message.content.trim()

    console.log('✅ Report generated successfully')
    res.json({ report })
  } catch (error) {
    console.error('❌ Error generating report:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create Stripe Customer Portal session for subscription management
app.post('/create-portal-session', async (req, res) => {
  const { customerId } = req.body

  console.log('📋 Portal session request received')
  console.log('Customer ID:', customerId)
  console.log('Return URL:', process.env.CLIENT_URL)

  try {
    if (!customerId) {
      console.error('❌ No customer ID provided')
      return res.status(400).json({ error: 'Customer ID is required' })
    }

    console.log('🔄 Creating Stripe portal session...')
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}`,
    })

    console.log('✅ Customer portal session created:', session.id)
    console.log('Portal URL:', session.url)
    res.json({ url: session.url })
  } catch (error) {
    console.error('❌ Error creating portal session:', error.message)
    console.error('Full error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Endpoint to verify and activate subscription after successful payment
app.post('/verify-subscription', async (req, res) => {
  const { userId, sessionId } = req.body

  try {
    // Get the user's subscription record
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    // If already active with stripe_subscription_id, return success
    if (subscription.subscription_status === 'active' && subscription.stripe_subscription_id) {
      return res.json({ success: true, status: 'active' })
    }

    // Retrieve the checkout session from Stripe to get subscription details
    let stripeCustomerId = subscription.stripe_customer_id
    let stripeSubscriptionId = subscription.stripe_subscription_id

    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        stripeCustomerId = session.customer
        stripeSubscriptionId = session.subscription
        console.log('📦 Retrieved Stripe session:', {
          customer: stripeCustomerId,
          subscription: stripeSubscriptionId
        })
      } catch (err) {
        console.error('Error retrieving Stripe session:', err)
      }
    }

    // Activate the subscription
    const subscriptionEnd = new Date()
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1) // 1 month from now

    const updateData = {
      subscription_status: 'active',
      subscription_end: subscriptionEnd.toISOString(),
      trial_end: null, // Clear trial
      updated_at: new Date().toISOString()
    }

    // Add Stripe IDs if we have them
    if (stripeCustomerId) updateData.stripe_customer_id = stripeCustomerId
    if (stripeSubscriptionId) updateData.stripe_subscription_id = stripeSubscriptionId

    await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)

    console.log('✅ Subscription activated for user:', userId, updateData)
    res.json({ success: true, status: 'active' })
  } catch (error) {
    console.error('Error verifying subscription:', error)
    res.status(500).json({ error: error.message })
  }
})

// Stripe webhook to handle subscription events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    console.log('✅ Webhook signature verified:', event.type)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        const userId = session.metadata.userId

        if (!userId) {
          console.error('❌ No userId in session metadata')
          break
        }

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        const userEmail = userData?.user?.email

        // Update subscription in database
        const subscriptionEnd = new Date()
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1) // 1 month from now

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
            subscription_end: subscriptionEnd.toISOString(),
            trial_end: null, // Clear trial
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError)
        } else {
          console.log('✅ Subscription activated for user:', userId)

          // Send subscription started email
          if (userEmail) {
            await sendEmail(userEmail, 'subscriptionStarted', { userName: userEmail.split('@')[0] })
          }
        }
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object
        const status = subscription.status === 'active' ? 'active' : 'canceled'

        // Get subscription record to find user
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            subscription_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (subError) {
          console.error('❌ Error updating subscription status:', subError)
        } else {
          console.log('✅ Subscription updated:', subscription.id, status)

          // Send cancellation email if subscription was canceled
          if (status === 'canceled' && subRecord?.user_id) {
            const { data: cancelUserData } = await supabase.auth.admin.getUserById(subRecord.user_id)
            const cancelUserEmail = cancelUserData?.user?.email

            if (cancelUserEmail) {
              await sendEmail(cancelUserEmail, 'subscriptionCanceled', { userName: cancelUserEmail.split('@')[0] })
            }
          }
        }
        break

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }

  res.json({ received: true })
})

const PORT = process.env.PORT || 3000

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
    console.log(`📍 Checkout endpoint: http://localhost:${PORT}/create-checkout-session`)
    console.log(`📍 Portal endpoint: http://localhost:${PORT}/create-portal-session`)
    console.log(`📍 Verify endpoint: http://localhost:${PORT}/verify-subscription`)
    console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook`)
  })
}

// Export for serverless
export default app
