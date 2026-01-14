# Meta Pixel Setup - JobSheet Pro

## Pixel ID
`3325919997562689`

## Events Tracked

### 1. **PageView** (Automatic)
- Fires on every page load
- Tracked automatically when pixel initializes

### 2. **CompleteRegistration**
- Fires when: User successfully signs up
- Location: `Signup.jsx`
- Data: User email

### 3. **StartTrial**
- Fires when: User starts 72-hour free trial
- Location: `SubscriptionBanner.jsx` → `handleStartTrial()`
- Data: 
  - Content name: "72 Hour Free Trial"
  - Value: 0
  - Currency: GBP
  - Predicted LTV: £9.99

### 4. **InitiateCheckout**
- Fires when: User clicks "Subscribe Now" button
- Location: `SubscriptionBanner.jsx` → `handleSubscribe()`
- Data:
  - Content name: "Subscription Checkout"
  - Value: £9.99
  - Currency: GBP

### 5. **Purchase**
- Fires when: Payment successfully completed via Stripe
- Location: `SubscriptionBanner.jsx` → `handlePaymentSuccess()`
- Data:
  - Content name: "JobSheet Pro Subscription"
  - Value: £9.99
  - Currency: GBP

### 6. **Subscribe**
- Fires when: Payment successfully completed (custom event)
- Location: `SubscriptionBanner.jsx` → `handlePaymentSuccess()`
- Data:
  - Content name: "JobSheet Pro Subscription"
  - Value: £9.99
  - Currency: GBP
  - Predicted LTV: £119.88 (annual value)

### 7. **Lead**
- Fires when: User generates a report
- Location: `JobForm.jsx` → after successful report generation
- Data:
  - Content name: "Report Generated"
  - Content category: "engagement"

### 8. **ViewContent**
- Fires when: User views subscription settings page
- Location: `Settings.jsx` → when `currentScreen === 'subscription'`
- Data:
  - Content name: "Subscription Page"
  - Content category: "pricing"

## Files Modified

1. **src/lib/metaPixel.js** (NEW)
   - Meta Pixel initialization code
   - Event tracking utilities
   - Predefined event helpers

2. **src/App.jsx**
   - Added Meta Pixel initialization on app load

3. **src/components/Signup.jsx**
   - Track CompleteRegistration event

4. **src/components/SubscriptionBanner.jsx**
   - Track StartTrial event
   - Track InitiateCheckout event
   - Track Purchase + Subscribe events

5. **src/components/JobForm.jsx**
   - Track Lead event (report generation)

6. **src/components/Settings.jsx**
   - Track ViewContent event (subscription page view)

## Verification

To verify the pixel is working:

1. Install **Meta Pixel Helper** Chrome extension
2. Visit your site
3. Check the extension icon - should show green with "1" badge
4. Click the icon to see events being fired

## Facebook Events Manager

View all tracked events at:
https://business.facebook.com/events_manager

Select your pixel (3325919997562689) to see:
- Real-time events
- Event history
- Conversion tracking
- Custom audiences

## Next Steps (Optional)

1. **Set up Conversions API** for server-side tracking (better iOS 14.5+ tracking)
2. **Create Custom Audiences** based on events (e.g., "Started Trial but didn't Subscribe")
3. **Set up Conversion Events** for ad optimization
4. **Create Lookalike Audiences** from purchasers

