# 📧 Email Notifications - Quick Start

## ✅ What's Been Added

Your app now automatically sends emails for:

1. **Trial Ending Soon** - 24 hours before trial expires
2. **Trial Expired** - When trial ends
3. **Subscription Canceled** - When user cancels
4. **Payment Successful** - When payment completes

---

## 🚀 Setup in 5 Minutes

### Step 1: Get Resend API Key (2 min)

1. Go to: https://resend.com/signup
2. Sign up (it's free)
3. Go to: https://resend.com/api-keys
4. Click "Create API Key"
5. Copy the key (starts with `re_`)

### Step 2: Add to Your .env File (1 min)

Open `.env` and replace:
```
RESEND_API_KEY=YOUR_RESEND_API_KEY
```

With your actual key:
```
RESEND_API_KEY=re_abc123xyz...
```

### Step 3: Test It Works (2 min)

```bash
# Test with your email
node testEmail.js your-email@example.com

# You should see:
# ✅ All emails sent successfully!
# 📬 Check your inbox
```

---

## 🎯 How It Works

### Automatic Emails (via Webhooks)

These send automatically when events happen:

- **Payment Successful** → Sends when user subscribes
- **Subscription Canceled** → Sends when user cancels

No setup needed! Just make sure your Stripe webhook is configured.

### Scheduled Emails (via Cron)

These need a cron job to run hourly:

- **Trial Ending Soon** → Checks every hour for trials ending in 24h
- **Trial Expired** → Checks every hour for expired trials

---

## ⏰ Setting Up the Cron Job

You need to run `checkTrialExpiry.js` every hour.

### Option A: Railway Cron (Easiest for Production)

1. In Railway, create a new service
2. Connect same GitHub repo
3. Set service type to "Cron Job"
4. Command: `node checkTrialExpiry.js`
5. Schedule: `0 * * * *`
6. Add environment variables (same as main app)

### Option B: GitHub Actions (Free)

Create `.github/workflows/check-trials.yml`:

```yaml
name: Check Trials
on:
  schedule:
    - cron: '0 * * * *'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node checkTrialExpiry.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          CLIENT_URL: ${{ secrets.CLIENT_URL }}
```

Add secrets in GitHub repo → Settings → Secrets.

### Option C: Manual Testing (Development)

```bash
# Run manually whenever you want
node checkTrialExpiry.js
```

---

## 🧪 Testing Each Email Type

### Test 1: Payment Success Email

1. Subscribe with test card: `4242 4242 4242 4242`
2. Check your email
3. Should receive "Payment Successful" ✅

### Test 2: Cancellation Email

1. Go to Settings → Manage Subscription
2. Cancel subscription
3. Check your email
4. Should receive "Subscription Canceled" ✅

### Test 3: Trial Ending Email

1. Create a test user
2. In Supabase, set `trial_end` to 23 hours from now
3. Run: `node checkTrialExpiry.js`
4. Check email
5. Should receive "Trial Ending Soon" ✅

### Test 4: Trial Expired Email

1. In Supabase, set `trial_end` to 1 hour ago
2. Run: `node checkTrialExpiry.js`
3. Check email
4. Should receive "Trial Expired" ✅

---

## 📊 Monitoring

**View sent emails:**
- Go to: https://resend.com/emails
- See all sent emails, delivery status, opens

**Check logs:**
```bash
# Server logs show:
✅ Email sent: abc123
✅ Sent trial ending email to user@example.com
```

---

## 🎨 Customizing Emails

Edit `emailService.js` to change:
- Subject lines
- Email content
- Colors and styling
- Button text

Example:
```javascript
subject: '⏰ Your trial ends in 24 hours!'
```

---

## 💰 Resend Pricing

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for starting!

**Paid:**
- $20/month for 50,000 emails
- Upgrade when needed

---

## 🚨 Troubleshooting

**No emails sending?**
```bash
# Check API key is set
echo $RESEND_API_KEY

# Test manually
node testEmail.js your-email@example.com

# Check server logs
```

**Emails in spam?**
- Free tier uses `onboarding@resend.dev` (may go to spam)
- Solution: Add your own domain in Resend dashboard

**Cron not running?**
- Check Railway/GitHub Actions logs
- Test manually first: `node checkTrialExpiry.js`

---

## ✅ Production Checklist

- [ ] Get Resend API key
- [ ] Add to local `.env`
- [ ] Test locally: `node testEmail.js your-email@example.com`
- [ ] Add `RESEND_API_KEY` to Railway
- [ ] Add `CLIENT_URL` to Railway (your production URL)
- [ ] Set up cron job (Railway or GitHub Actions)
- [ ] Test all 4 email types
- [ ] Monitor in Resend dashboard

---

## 🎯 What's Next?

After emails are working:
1. Add more email types (welcome series, tips)
2. Track open rates
3. A/B test subject lines
4. Add custom domain for better deliverability

---

Need help? Check `EMAIL_NOTIFICATIONS_SETUP.md` for detailed docs!

