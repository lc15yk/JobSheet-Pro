# 🔐 Job Report Generator - Authentication & Subscriptions

Your Job Report Generator now includes **full authentication and subscription management**!

---

## 🎉 What's New

### ✅ User Authentication
- Secure login and signup pages
- Protected routes (must be logged in to use app)
- Logout functionality

### ✅ 72-Hour Free Trial
- Every new user gets 72 hours free
- Trial countdown shown in banner
- Automatic trial creation on signup

### ✅ £9.99/Month Subscription
- Stripe-powered payments
- Secure checkout flow
- Automatic subscription management

### ✅ Access Control
- AI report generation blocked when subscription expires
- Clear "Renew Subscription" prompt
- Seamless user experience

---

## 📚 Documentation

### Quick Start (5 minutes)
👉 **[QUICKSTART.md](./QUICKSTART.md)** - Get up and running fast

### Full Setup Guide
👉 **[AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)** - Complete setup instructions

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd job-report-generator
npm install
npm install express stripe cors dotenv
```

### 2. Set Up Credentials

```bash
cp .env.example .env
```

Fill in your:
- Supabase URL & keys
- Stripe keys & price ID

### 3. Create Database Table

Run the SQL from `AUTHENTICATION_SETUP.md` in your Supabase dashboard

### 4. Start Backend

```bash
node server.js
```

### 5. Start Frontend

```bash
npm run dev
```

### 6. Test!

Go to `http://localhost:5173` and sign up!

---

## 🎨 User Flow

```
1. User visits app → Redirected to Login
2. User clicks "Sign up" → Creates account
3. 72-hour trial starts automatically
4. User generates reports (AI works!)
5. Trial banner shows hours remaining
6. Trial expires → "Renew Subscription" banner
7. User clicks "Subscribe" → Stripe checkout
8. Payment successful → Full access restored
```

---

## 🔧 Tech Stack

- **Frontend**: React + Vite
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe Checkout
- **Routing**: React Router
- **Backend**: Express.js (minimal)

---

## 📁 New Files

```
src/
├── components/
│   ├── Login.jsx              # Login page
│   ├── Signup.jsx             # Signup page  
│   ├── Auth.css               # Auth styling
│   ├── ProtectedRoute.jsx     # Auth guard
│   ├── SubscriptionBanner.jsx # Trial/expired banner
│   └── SubscriptionBanner.css
├── lib/
│   ├── supabase.js            # Supabase client
│   └── stripe.js              # Stripe checkout

server.js                      # Backend API
.env.example                   # Environment template
AUTHENTICATION_SETUP.md        # Full setup guide
QUICKSTART.md                  # Quick start guide
```

---

## 🎯 Features

### Authentication
- ✅ Email/password signup
- ✅ Secure login
- ✅ Session management
- ✅ Protected routes
- ✅ Logout

### Subscription Management
- ✅ 72-hour free trial
- ✅ Trial countdown
- ✅ Stripe checkout integration
- ✅ Subscription status tracking
- ✅ Access control
- ✅ Renewal prompts

### User Experience
- ✅ Dark theme (matches existing design)
- ✅ Mobile responsive
- ✅ Clear error messages
- ✅ Loading states
- ✅ Smooth transitions

---

## 🔒 Security

- ✅ Row Level Security (RLS) on database
- ✅ Secure password hashing (Supabase)
- ✅ API keys in environment variables
- ✅ HTTPS for payments (Stripe)
- ✅ Protected API endpoints

---

## 💡 Customization

### Change Trial Duration
Edit `src/lib/supabase.js`:
```javascript
trialEnd.setHours(trialEnd.getHours() + 72) // Change 72 to your hours
```

### Change Subscription Price
1. Create new price in Stripe Dashboard
2. Update `VITE_STRIPE_PRICE_ID` in `.env`

### Customize Styling
- `src/components/Auth.css` - Login/signup pages
- `src/components/SubscriptionBanner.css` - Trial banner

---

## 🆘 Support

**Issues?** Check:
1. `.env` file exists and has correct values
2. Backend server is running
3. Supabase table was created
4. Browser console for errors

**Still stuck?** See `AUTHENTICATION_SETUP.md` troubleshooting section

---

## 📈 Next Steps

- [ ] Test signup flow
- [ ] Test trial countdown
- [ ] Test Stripe checkout
- [ ] Customize branding
- [ ] Deploy to production

---

**Built with ❤️ for engineers who value their time**

