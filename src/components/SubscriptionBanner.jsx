import { useState, useEffect } from 'react'
import { supabase, checkSubscription, createTrialSubscription } from '../lib/supabase'
import { createCheckoutSession } from '../lib/stripe'
import './SubscriptionBanner.css'

export default function SubscriptionBanner({ onAccessChange, onStatusChange }) {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadSubscription()
    handlePaymentSuccess()
  }, [])

  const handlePaymentSuccess = async () => {
    // Check if user just returned from successful payment
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      console.log('✅ Payment successful! Activating subscription...')

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Get the session ID from localStorage
          const sessionId = localStorage.getItem('stripe_session_id')
          console.log('📦 Session ID:', sessionId)

          // Call backend to verify and activate subscription
          const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
          const response = await fetch(`${backendUrl}/verify-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              sessionId: sessionId
            })
          })

          if (response.ok) {
            console.log('✅ Subscription activated!')
            // Clear the session ID
            localStorage.removeItem('stripe_session_id')
            // Remove the success parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname)
            // Reload subscription data
            await loadSubscription()
          }
        }
      } catch (error) {
        console.error('Error activating subscription:', error)
      }
    }
  }

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const subData = await checkSubscription(user.id)
        console.log('🔍 Subscription Status:', {
          hasAccess: subData.hasAccess,
          isTrialActive: subData.isTrialActive,
          isPaidActive: subData.isPaidActive,
          trialEnd: subData.trialEnd,
          subscriptionEnd: subData.subscriptionEnd,
          rawData: subData.subscriptionData
        })
        setSubscription(subData)
        onAccessChange?.(subData.hasAccess)
        onStatusChange?.(subData) // Pass full subscription status
      }
    } catch (err) {
      console.error('Error loading subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      alert('❌ User not found. Please log in again.')
      return
    }

    try {
      setLoading(true)
      await createCheckoutSession(user.id, user.email)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('❌ Error starting subscription. Please check the console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = async () => {
    if (!user) {
      alert('❌ User not found. Please log in again.')
      return
    }

    try {
      console.log('🎉 Starting free trial for user:', user.id)
      setLoading(true)
      await createTrialSubscription(user.id)
      console.log('✅ Trial created, reloading subscription...')
      await loadSubscription()
      console.log('✅ Subscription reloaded')
    } catch (error) {
      console.error('Error starting trial:', error)
      alert('Failed to start trial. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  // Show "Start Free Trial" banner for new users
  if (subscription?.noSubscription) {
    return (
      <div className="subscription-banner trial-banner">
        <div className="banner-content">
          <span className="banner-icon">🎁</span>
          <div className="banner-text">
            <strong>Welcome to JobSheet Pro!</strong>
            <span>Start your 72-hour free trial to generate unlimited reports</span>
          </div>
        </div>
        <div className="banner-buttons">
          <button onClick={handleStartTrial} className="subscribe-btn" disabled={loading}>
            {loading ? 'Starting...' : 'Start Free Trial (72 hours)'}
          </button>
          <button onClick={handleSubscribe} className="subscribe-btn subscribe-btn-secondary">
            Subscribe Now - £9.99/month
          </button>
        </div>
      </div>
    )
  }

  // Show trial banner
  if (subscription?.isTrialActive) {
    const timeLeft = subscription.trialEnd - new Date()
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    return (
      <div className="subscription-banner trial-banner">
        <div className="banner-content">
          <span className="banner-icon">🎉</span>
          <div className="banner-text">
            <strong>Free Trial Active</strong>
            <span>{hoursLeft} hours {minutesLeft} minutes remaining</span>
          </div>
        </div>
        <button onClick={handleSubscribe} className="subscribe-btn">
          Subscribe Now - £9.99/month
        </button>
      </div>
    )
  }

  // Show expired banner (blocks access)
  if (!subscription?.hasAccess) {
    return (
      <div className="subscription-banner expired-banner">
        <div className="banner-content">
          <span className="banner-icon">⚠️</span>
          <div className="banner-text">
            <strong>Subscription Required</strong>
            <span>Your trial has ended. Subscribe to continue generating reports.</span>
          </div>
        </div>
        <button onClick={handleSubscribe} className="subscribe-btn urgent">
          Renew Subscription - £9.99/month
        </button>
      </div>
    )
  }

  // Active subscription - show nothing
  return null
}

