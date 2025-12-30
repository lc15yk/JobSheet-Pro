# 🔐 Authentication & Subscription Setup Guide

This guide will help you set up **Supabase authentication** and **Stripe subscriptions** for your Job Report Generator.

---

## 📋 Overview

Your app now includes:
- ✅ **User Authentication** (Login/Signup)
- ✅ **72-hour Free Trial** for new users
- ✅ **£9.99/month Subscription** via Stripe
- ✅ **Access Control** - blocks AI report generation when subscription expires

---

## 🚀 Part 1: Supabase Setup (Authentication & Database)

### Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. Create a new project:
   - **Project name**: `job-report-generator`
   - **Database password**: (create a strong password)
   - **Region**: Choose closest to you
   - Click **"Create new project"**

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Create Environment Variables

Create a file called `.env` in the `job-report-generator` folder:

```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Add `.env` to your `.gitignore` file to keep credentials private!

### Step 4: Create the Subscriptions Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  subscription_status TEXT DEFAULT 'trial',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Service role can update subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (true);
```

---

## 💳 Part 2: Stripe Setup (Payments)

### Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Start now"** and create an account
3. Complete the signup process

### Step 2: Create a Product & Price

1. In Stripe Dashboard, go to **Products** → **Add product**
2. Fill in:
   - **Name**: Job Report Generator Subscription
   - **Description**: Monthly subscription for AI-powered job reports
   - **Pricing**: Recurring
   - **Price**: £9.99
   - **Billing period**: Monthly
3. Click **"Save product"**
4. **Copy the Price ID** (starts with `price_...`)

### Step 3: Get Your Stripe API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - **Keep this private!**

### Step 4: Add Stripe Keys to .env

Add these to your `.env` file:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_STRIPE_PRICE_ID=price_your_price_id_here
```

---

## 🔧 Part 3: Backend Setup (Stripe Checkout)

You need a simple backend to create Stripe checkout sessions. Here's a minimal Node.js example:

### Create `server.js` in your project root:

```javascript
const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

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
    })

    res.json({ id: session.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

### Install backend dependencies:

```bash
npm install express stripe cors
```

### Update `.env` with backend URL:

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
CLIENT_URL=http://localhost:5173
PORT=3001
```

### Update `src/lib/stripe.js`:

Replace `YOUR_BACKEND_URL` with `http://localhost:3001`

---

## ✅ Testing Your Setup

1. **Start the backend**:
   ```bash
   node server.js
   ```

2. **Start the frontend**:
   ```bash
   cd job-report-generator
   npm run dev
   ```

3. **Test the flow**:
   - Go to `http://localhost:5173`
   - Click **"Sign up"**
   - Create an account
   - You should see **"72 hours free trial"** banner
   - Try generating a report (should work)
   - Click **"Subscribe Now"** to test Stripe checkout

---

## 🎯 Going to Production

When ready to deploy:

1. **Stripe**: Switch from test mode to live mode
2. **Supabase**: Already production-ready
3. **Environment Variables**: Update with production URLs
4. **Deploy Backend**: Use Heroku, Railway, or Vercel
5. **Deploy Frontend**: Use Vercel, Netlify, or similar

---

## 🆘 Troubleshooting

**"Supabase URL not found"**
- Make sure `.env` file exists in `job-report-generator` folder
- Restart your dev server after creating `.env`

**"Stripe checkout not working"**
- Check that backend server is running
- Verify `YOUR_BACKEND_URL` is updated in `src/lib/stripe.js`

**"Subscription not created"**
- Check Supabase SQL table was created successfully
- Look for errors in browser console

---

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **React Router**: https://reactrouter.com

---

**You're all set! 🎉**

