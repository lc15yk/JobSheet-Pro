import { loadStripe } from '@stripe/stripe-js'

// Validate Stripe publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey || stripePublishableKey === 'YOUR_STRIPE_PUBLISHABLE_KEY') {
  console.error('❌ Stripe publishable key not configured!')
  console.error('Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file')
}

const stripePromise = loadStripe(stripePublishableKey)

export async function createCheckoutSession(userId, userEmail) {
  try {
    // Call your backend to create a Stripe checkout session
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
    console.log('🔗 Backend URL:', backendUrl)
    console.log('📧 User Email:', userEmail)
    console.log('🆔 User ID:', userId)
    console.log('💰 Price ID:', import.meta.env.VITE_STRIPE_PRICE_ID)

    const response = await fetch(`${backendUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userEmail,
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID, // Your £9.99/month price ID
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Backend error: ${errorData.error || response.statusText}`)
    }

    const session = await response.json()
    console.log('✅ Checkout session created:', session)

    // Store session ID in localStorage for verification after redirect
    if (session.id) {
      localStorage.setItem('stripe_session_id', session.id)
    }

    // Redirect to Stripe Checkout URL directly
    if (session.url) {
      console.log('🔗 Redirecting to:', session.url)
      window.location.href = session.url
    } else {
      throw new Error('No checkout URL returned from server')
    }
  } catch (err) {
    console.error('❌ Error creating checkout session:', err)
    throw err
  }
}

export { stripePromise }

