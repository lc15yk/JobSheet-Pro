# Subscription Management Setup Guide

## Overview
Your app already has the code to allow users to cancel subscriptions via Stripe's Customer Portal. You just need to configure it in Stripe.

## ✅ What's Already Working
- Frontend button in Settings → Subscription
- Backend endpoint `/create-portal-session`
- Proper error handling

## 🔧 Setup Required (One-Time)

### Step 1: Configure Stripe Customer Portal

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/test/settings/billing/portal

2. **Enable Customer Portal**
   - Click "Activate test link" or "Activate"

3. **Configure Portal Settings**
   - **Products**: Check "Customers can switch plans"
   - **Cancellation**: Check "Customers can cancel subscriptions"
   - **Payment Methods**: Check "Customers can update payment methods"
   - **Invoices**: Check "Customers can view invoices"

4. **Set Cancellation Behavior**
   - Choose one:
     - ✅ **Cancel immediately** (recommended for testing)
     - **Cancel at period end** (keeps access until billing cycle ends)

5. **Save Changes**

### Step 2: Test the Flow

1. **Start your server**
   ```bash
   node server.js
   ```

2. **Start your app**
   ```bash
   npm run dev
   ```

3. **Test as a user**
   - Log in to your app
   - Go to Settings → Subscription
   - Click "Manage Subscription"
   - You should be redirected to Stripe's Customer Portal
   - Try canceling the subscription

### Step 3: Verify Cancellation Works

After canceling in the portal:
1. User is redirected back to your app
2. Webhook receives `customer.subscription.deleted` event
3. Database updates subscription status to 'canceled'
4. User loses access (banner shows "Subscription Expired")

## 🎯 What Users Can Do in Customer Portal

- ✅ Cancel subscription
- ✅ Update payment method
- ✅ View billing history
- ✅ Download invoices
- ✅ Update billing information

## 🔒 Production Setup

When ready for production:

1. **Activate Production Portal**
   - Go to: https://dashboard.stripe.com/settings/billing/portal
   - Configure same settings as test mode

2. **Update Environment Variables**
   - Use production Stripe keys in `.env`

## 📝 Current Implementation

### Frontend (Settings.jsx)
```javascript
handleManageSubscription() {
  // Calls backend with customer ID
  // Redirects to Stripe Customer Portal
}
```

### Backend (server.js)
```javascript
POST /create-portal-session
// Creates portal session
// Returns portal URL
```

### Webhook (server.js)
```javascript
customer.subscription.deleted
// Updates database
// Marks subscription as canceled
```

## ✨ Everything is Ready!

Just configure the Stripe Customer Portal in your dashboard and it will work immediately.

## 🧪 Quick Test (5 minutes)

1. **Configure Stripe Portal** (if not done)
   - https://dashboard.stripe.com/test/settings/billing/portal
   - Enable cancellation

2. **Create a test subscription**
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

3. **Test cancellation**
   - Go to Settings → Subscription
   - Click "Manage Subscription"
   - Should redirect to Stripe portal
   - Cancel the subscription
   - Should redirect back to your app

4. **Verify it worked**
   - Check your Supabase `subscriptions` table
   - Status should be 'canceled'
   - User should see "Subscription Expired" banner

## 🎯 UI Improvements Made

- ✅ Better styled "Manage Subscription" button
- ✅ Clear description of what users can do
- ✅ Highlighted subscription management section
- ✅ Uses theme colors (works in light/dark mode)
- ✅ Loading state while redirecting

## 📞 Support

If users have issues:
1. Check server logs for errors
2. Verify Stripe Customer Portal is enabled
3. Check webhook is receiving events
4. Verify customer ID exists in Stripe

