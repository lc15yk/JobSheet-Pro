import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file')
}

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ Supabase credentials not configured!')
  console.error('Please update your .env file with actual Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if user has active subscription
export async function checkSubscription(userId) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If no subscription record exists, user hasn't started trial yet
    if (error && error.code === 'PGRST116') {
      return {
        hasAccess: false,
        isTrialActive: false,
        isPaidActive: false,
        noSubscription: true, // New user who hasn't started trial
        isExpired: false
      }
    }

    if (error) {
      console.error('Error checking subscription:', error)
      return { hasAccess: false, isTrialActive: false, isPaidActive: false, isExpired: false }
    }

    const now = new Date()
    const trialEnd = data.trial_end ? new Date(data.trial_end) : null
    const subscriptionEnd = data.subscription_end ? new Date(data.subscription_end) : null

    // Check if trial is active (must be within trial period AND status is 'trial')
    const isTrialActive = data.subscription_status === 'trial' && trialEnd && now < trialEnd

    // Check if paid subscription is active
    const isPaidActive = data.stripe_subscription_id &&
                         data.subscription_status === 'active' &&
                         subscriptionEnd && now < subscriptionEnd

    // Check if subscription/trial has expired
    const isExpired = (trialEnd && now >= trialEnd && data.subscription_status === 'trial') ||
                      (subscriptionEnd && now >= subscriptionEnd && data.subscription_status === 'active')

    return {
      hasAccess: isTrialActive || isPaidActive,
      isTrialActive,
      isPaidActive,
      isExpired,
      trialEnd,
      subscriptionEnd,
      subscriptionData: data,
      noSubscription: false
    }
  } catch (err) {
    console.error('Subscription check error:', err)
    return { hasAccess: false, isTrialActive: false, isPaidActive: false, isExpired: false }
  }
}

// Create subscription record for new user (with 72-hour trial)
export async function createTrialSubscription(userId) {
  const trialEnd = new Date()
  trialEnd.setHours(trialEnd.getHours() + 72) // 72 hours from now

  const { data, error } = await supabase
    .from('subscriptions')
    .insert([
      {
        user_id: userId,
        trial_end: trialEnd.toISOString(),
        subscription_status: 'trial'
      }
    ])
    .select()

  if (error) {
    console.error('Error creating trial:', error)
    return null
  }

  return data[0]
}

