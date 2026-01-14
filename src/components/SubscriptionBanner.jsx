import { useState, useEffect } from 'react'
import { supabase, checkSubscription, createTrialSubscription } from '../lib/supabase'
import { createCheckoutSession } from '../lib/stripe'
import { metaPixelEvents } from '../lib/metaPixel'
import './SubscriptionBanner.css'

export default function SubscriptionBanner({ onAccessChange, onStatusChange, showBanner = false }) {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadSubscription()
    handlePaymentSuccess()
  }, [])

  useEffect(() => {
    // Only show modal if:
    // 1. Trial/subscription has actually EXPIRED, OR
    // 2. User is brand new (noSubscription = true)
    // DO NOT show modal if trial is still active (even if hasAccess is false due to other issues)
    if (subscription?.isExpired || subscription?.noSubscription) {
      setShowModal(true)
    }
  }, [subscription])

  const handlePaymentSuccess = async () => {
    // Check if user just returned from Stripe
    const urlParams = new URLSearchParams(window.location.search)

    // Handle successful payment
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
            // Track successful purchase
            metaPixelEvents.purchase()
            metaPixelEvents.subscribe(user.email)
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

    // Handle canceled payment - just clean up the URL
    if (urlParams.get('canceled') === 'true') {
      console.log('⚠️ Payment canceled by user')
      // Clear the session ID
      localStorage.removeItem('stripe_session_id')
      // Remove the canceled parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Reload subscription data to show current status
      await loadSubscription()
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
      // Track checkout initiation
      metaPixelEvents.initiateCheckout()
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
      // Track trial start
      metaPixelEvents.startTrial(user.email)
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

  // Show trial countdown banner (non-blocking) - ONLY if showBanner prop is true
  if (showBanner && subscription?.isTrialActive) {
    const timeLeft = Math.max(0, subscription.trialEnd - new Date())
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

  // Show modal for new users or expired subscriptions
  if (!showModal) return null

  // New user modal (only for users who have NEVER had a subscription)
  if (subscription?.noSubscription && !subscription?.isExpired) {
    return (
      <div className="subscription-modal-overlay">
        <div className="subscription-modal">
          <button className="modal-close" onClick={() => setShowModal(false)}>
            ✕
          </button>
          <div className="modal-header">
            <span className="modal-icon">🎁</span>
            <h2>Welcome to JobSheet Pro!</h2>
            <p>Choose how you'd like to get started</p>
          </div>
          <div className="modal-options">
            <button onClick={handleStartTrial} className="modal-option-btn trial-btn" disabled={loading}>
              <div className="option-content">
                <span className="option-icon">⏱️</span>
                <div className="option-text">
                  <strong>Start Free Trial</strong>
                  <span>72 hours of unlimited reports</span>
                </div>
              </div>
            </button>
            <button onClick={handleSubscribe} className="modal-option-btn subscribe-btn-full">
              <div className="option-content">
                <span className="option-icon">⭐</span>
                <div className="option-text">
                  <strong>Subscribe Now</strong>
                  <span>£9.99/month - Unlimited reports</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Expired subscription modal (cannot close) - for users whose trial/subscription expired
  if (!subscription?.hasAccess) {
    return (
      <div className="subscription-modal-overlay">
        <div className="subscription-modal expired-modal">
          <div className="modal-header">
            <span className="modal-icon">⚠️</span>
            <h2>Subscription Required</h2>
            <p>
              {subscription?.isExpired
                ? 'Your trial has ended. Subscribe to continue generating reports.'
                : 'You need an active subscription to generate reports.'}
            </p>
          </div>
          <div className="modal-options">
            <button onClick={handleSubscribe} className="modal-option-btn subscribe-btn-urgent" disabled={loading}>
              <div className="option-content">
                <span className="option-icon">🔓</span>
                <div className="option-text">
                  <strong>{loading ? 'Loading...' : 'Subscribe Now'}</strong>
                  <span>£9.99/month - Unlimited reports</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

