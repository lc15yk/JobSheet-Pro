# 🚀 Quick Start Guide

Get your Job Report Generator with authentication and subscriptions running in minutes!

---

## ⚡ Fast Setup (5 minutes)

### 1. Install Backend Dependencies

```bash
cd job-report-generator
npm install express stripe cors dotenv
```

### 2. Set Up Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your:
- Supabase URL and anon key
- Stripe publishable key and price ID
- Backend URL (default: http://localhost:3001)

### 3. Set Up Supabase Database

1. Go to your Supabase project → **SQL Editor**
2. Run the SQL from `AUTHENTICATION_SETUP.md` (Part 1, Step 4)
3. This creates the `subscriptions` table

### 4. Start the Backend Server

```bash
node server.js
```

You should see:
```
✅ Server running on port 3001
📍 Checkout endpoint: http://localhost:3001/create-checkout-session
📍 Webhook endpoint: http://localhost:3001/webhook
```

### 5. Start the Frontend

In a new terminal:

```bash
npm run dev
```

### 6. Test It Out!

1. Open `http://localhost:5173`
2. Click **"Sign up"**
3. Create an account
4. You'll see **"72 hours free trial"** banner
5. Generate a report (should work!)
6. Click **"Subscribe Now"** to test Stripe checkout

---

## 📁 Project Structure

```
job-report-generator/
├── src/
│   ├── components/
│   │   ├── Login.jsx              # Login page
│   │   ├── Signup.jsx             # Signup page
│   │   ├── ProtectedRoute.jsx     # Auth guard
│   │   ├── SubscriptionBanner.jsx # Trial/expired banner
│   │   ├── JobForm.jsx            # Main form (updated)
│   │   └── Settings.jsx
│   ├── lib/
│   │   ├── supabase.js            # Supabase client & helpers
│   │   └── stripe.js              # Stripe checkout
│   └── App.jsx                    # Router setup
├── server.js                      # Backend API
├── .env                           # Your credentials (DO NOT COMMIT!)
├── .env.example                   # Template
└── AUTHENTICATION_SETUP.md        # Full setup guide
```

---

## 🔑 What You Need

### Supabase (Free)
- Project URL
- Anon/public key
- Service role key (for backend)

### Stripe (Free for testing)
- Publishable key
- Secret key
- Price ID (for £9.99/month product)
- Webhook secret (optional, for production)

---

## ✅ Features Included

- ✅ **User Authentication** - Secure login/signup
- ✅ **72-Hour Free Trial** - Automatic for new users
- ✅ **Subscription Management** - £9.99/month via Stripe
- ✅ **Access Control** - Blocks AI generation when expired
- ✅ **Trial Banner** - Shows hours remaining
- ✅ **Renewal Prompt** - Clear call-to-action when expired
- ✅ **Dark Theme** - Matches your existing design

---

## 🆘 Troubleshooting

**"Cannot find module 'express'"**
```bash
npm install express stripe cors dotenv
```

**"Supabase URL not found"**
- Make sure `.env` file exists
- Restart dev server after creating `.env`

**"Stripe checkout not working"**
- Check backend server is running (`node server.js`)
- Verify `.env` has correct Stripe keys

**"Subscription not created"**
- Check Supabase SQL table was created
- Look for errors in browser console

---

## 📖 Full Documentation

See `AUTHENTICATION_SETUP.md` for:
- Detailed Supabase setup
- Stripe product creation
- Webhook configuration
- Production deployment

---

## 🎯 Next Steps

1. **Test the full flow** - Signup → Trial → Subscribe
2. **Customize styling** - Update colors/branding
3. **Add features** - Email notifications, usage limits, etc.
4. **Deploy** - See deployment section in AUTHENTICATION_SETUP.md

---

**You're ready to go! 🎉**

