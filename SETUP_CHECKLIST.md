# ✅ Setup Checklist

Follow this checklist to get your authenticated Job Report Generator running!

---

## 📋 Pre-Setup

- [ ] Node.js installed (v16 or higher)
- [ ] npm installed
- [ ] Code editor ready (VS Code recommended)

---

## 🔧 Step 1: Install Dependencies

```bash
cd job-report-generator
npm install
```

**Expected output**: `added X packages`

---

## 🔐 Step 2: Supabase Setup

### 2.1 Create Account
- [ ] Go to https://supabase.com
- [ ] Sign up (free)
- [ ] Create new project
- [ ] Wait for project to finish setting up (~2 minutes)

### 2.2 Get Credentials
- [ ] Go to Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **anon/public key**
- [ ] Copy **service_role key** (for backend)

### 2.3 Create Database Table
- [ ] Go to SQL Editor
- [ ] Click "New query"
- [ ] Paste SQL from `AUTHENTICATION_SETUP.md` (Part 1, Step 4)
- [ ] Click "Run"
- [ ] Verify table created (check Tables section)

---

## 💳 Step 3: Stripe Setup

### 3.1 Create Account
- [ ] Go to https://stripe.com
- [ ] Sign up (free)
- [ ] Complete account setup

### 3.2 Create Product
- [ ] Go to Products → Add product
- [ ] Name: "Job Report Generator Subscription"
- [ ] Price: £9.99
- [ ] Billing: Monthly
- [ ] Click "Save product"
- [ ] Copy **Price ID** (starts with `price_...`)

### 3.3 Get API Keys
- [ ] Go to Developers → API keys
- [ ] Copy **Publishable key** (starts with `pk_test_...`)
- [ ] Copy **Secret key** (starts with `sk_test_...`)

---

## 📝 Step 4: Environment Variables

### 4.1 Create .env File
```bash
cp .env.example .env
```

### 4.2 Fill in .env
- [ ] `VITE_SUPABASE_URL` = Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key
- [ ] `VITE_STRIPE_PRICE_ID` = Your Stripe price ID
- [ ] `VITE_BACKEND_URL` = `http://localhost:3001`

### 4.3 Create Backend .env
Add these to the same `.env` file:
- [ ] `STRIPE_SECRET_KEY` = Your Stripe secret key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- [ ] `CLIENT_URL` = `http://localhost:5173`
- [ ] `PORT` = `3001`

---

## 🚀 Step 5: Run the App

### 5.1 Start Backend
Open terminal 1:
```bash
node server.js
```

**Expected output**:
```
✅ Server running on port 3001
📍 Checkout endpoint: http://localhost:3001/create-checkout-session
📍 Webhook endpoint: http://localhost:3001/webhook
```

### 5.2 Start Frontend
Open terminal 2:
```bash
npm run dev
```

**Expected output**:
```
VITE v7.x.x ready in XXX ms
➜ Local: http://localhost:5173/
```

---

## 🧪 Step 6: Test Everything

### 6.1 Test Signup
- [ ] Open http://localhost:5173
- [ ] Should redirect to /login
- [ ] Click "Sign up"
- [ ] Enter email and password
- [ ] Click "Start Free Trial"
- [ ] Should redirect to main app

### 6.2 Test Trial Banner
- [ ] Should see "Free Trial Active" banner
- [ ] Should show "72 hours remaining" (or less)

### 6.3 Test Report Generation
- [ ] Fill in form fields
- [ ] Add work description
- [ ] Click "Generate Report"
- [ ] Should generate AI report successfully

### 6.4 Test Logout
- [ ] Click "Logout" button
- [ ] Should redirect to /login

### 6.5 Test Login
- [ ] Enter same email/password
- [ ] Click "Sign In"
- [ ] Should return to main app

### 6.6 Test Stripe Checkout (Optional)
- [ ] Click "Subscribe Now" button
- [ ] Should redirect to Stripe checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Any future date, any CVC
- [ ] Complete checkout
- [ ] Should return to app

---

## ✅ Success Criteria

You're all set if:
- ✅ Signup creates new account
- ✅ Trial banner shows correctly
- ✅ AI report generation works
- ✅ Logout/login works
- ✅ Stripe checkout opens (even if you don't complete it)

---

## 🆘 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install express stripe cors dotenv
```

### "Supabase URL not found"
- Check `.env` file exists in `job-report-generator` folder
- Restart both servers after creating `.env`

### "Stripe checkout not working"
- Verify backend server is running
- Check `.env` has correct Stripe keys
- Check browser console for errors

### "Subscription not created"
- Verify SQL table was created in Supabase
- Check browser console for errors
- Check backend terminal for errors

---

## 📚 Next Steps

Once everything works:
- [ ] Read `AUTHENTICATION_SETUP.md` for production deployment
- [ ] Customize styling to match your brand
- [ ] Set up Stripe webhooks for production
- [ ] Deploy to production (Vercel, Netlify, etc.)

---

**Need help? Check the other documentation files!**
- `QUICKSTART.md` - Quick overview
- `AUTHENTICATION_SETUP.md` - Detailed setup
- `README_AUTH.md` - Features overview

