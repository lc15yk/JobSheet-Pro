// Meta Pixel tracking utilities
const PIXEL_ID = '3325919997562689'

// Initialize Meta Pixel
export const initMetaPixel = () => {
  if (typeof window === 'undefined') return

  // Check if already initialized
  if (window.fbq) return

  // Meta Pixel base code
  !(function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  })(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID)
  window.fbq('track', 'PageView')

  console.log('✅ Meta Pixel initialized:', PIXEL_ID)
}

// Track custom events
export const trackMetaEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined' || !window.fbq) {
    console.warn('Meta Pixel not initialized')
    return
  }

  try {
    window.fbq('track', eventName, data)
    console.log('📊 Meta Pixel Event:', eventName, data)
  } catch (error) {
    console.error('Meta Pixel tracking error:', error)
  }
}

// Predefined event helpers
export const metaPixelEvents = {
  // User signs up
  completeRegistration: (email) => {
    trackMetaEvent('CompleteRegistration', {
      content_name: 'User Registration',
      status: 'completed'
    })
  },

  // User starts free trial
  startTrial: (email) => {
    trackMetaEvent('StartTrial', {
      content_name: '72 Hour Free Trial',
      value: 0,
      currency: 'GBP',
      predicted_ltv: 9.99
    })
  },

  // User subscribes (payment completed)
  subscribe: (email, value = 9.99) => {
    trackMetaEvent('Subscribe', {
      content_name: 'JobSheet Pro Subscription',
      value: value,
      currency: 'GBP',
      predicted_ltv: value * 12 // Annual value
    })
  },

  // User generates a report
  generateReport: () => {
    trackMetaEvent('Lead', {
      content_name: 'Report Generated',
      content_category: 'engagement'
    })
  },

  // User views pricing/subscription page
  viewSubscription: () => {
    trackMetaEvent('ViewContent', {
      content_name: 'Subscription Page',
      content_category: 'pricing'
    })
  },

  // User initiates checkout
  initiateCheckout: () => {
    trackMetaEvent('InitiateCheckout', {
      content_name: 'Subscription Checkout',
      value: 9.99,
      currency: 'GBP'
    })
  },

  // Payment completed
  purchase: (value = 9.99) => {
    trackMetaEvent('Purchase', {
      content_name: 'JobSheet Pro Subscription',
      value: value,
      currency: 'GBP'
    })
  }
}

export default {
  init: initMetaPixel,
  track: trackMetaEvent,
  events: metaPixelEvents
}

