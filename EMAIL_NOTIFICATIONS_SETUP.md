# 📧 Email Notifications Setup Guide

## Overview
Your app now sends automated emails for:
- ✅ Trial ending soon (24 hours before)
- ✅ Trial expired
- ✅ Subscription canceled
- ✅ Payment successful

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Get Resend API Key

1. **Go to Resend**: https://resend.com/
2. **Sign up** (free account)
3. **Verify your email**
4. **Go to API Keys**: https://resend.com/api-keys
5. **Click "Create API Key"**
6. **Copy the key** (starts with `re_`)

### Step 2: Add API Key to Environment

**Local Development:**
1. Open `.env` file
2. Replace `YOUR_RESEND_API_KEY` with your actual key:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

**Production (Railway):**
1. Go to Railway dashboard
2. Select your project
3. Go to Variables
4. Add: `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
5. Redeploy

### Step 3: Test Emails Locally

```bash
# Restart your server
node server.js

# In another terminal, test the trial expiry checker
node checkTrialExpiry.js
```

---

## 📧 Email Templates

### 1. Trial Ending Soon
**Sent:** 24 hours before trial expires  
**Trigger:** Cron job checks database hourly  
**Content:** Reminder with subscribe button

### 2. Trial Expired
**Sent:** When trial expires  
**Trigger:** Cron job checks database hourly  
**Content:** Encouragement to subscribe

### 3. Subscription Canceled
**Sent:** When user cancels via Stripe portal  
**Trigger:** Stripe webhook `customer.subscription.deleted`  
**Content:** Confirmation with resubscribe option

### 4. Payment Successful
**Sent:** When payment completes  
**Trigger:** Stripe webhook `checkout.session.completed`  
**Content:** Welcome message with details

---

## ⏰ Setting Up Automated Checks (Cron Jobs)

You need to run `checkTrialExpiry.js` every hour to send trial emails.

### Option 1: Railway Cron (Recommended for Production)

1. **Create a new service** in Railway
2. **Deploy the same repo**
3. **Set as Cron Job**:
   - Command: `node checkTrialExpiry.js`
   - Schedule: `0 * * * *` (every hour)
4. **Add same environment variables**

### Option 2: GitHub Actions (Free)

Create `.github/workflows/check-trials.yml`:

```yaml
name: Check Trial Expiry
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  check-trials:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node checkTrialExpiry.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          CLIENT_URL: ${{ secrets.CLIENT_URL }}
```

Then add secrets in GitHub repo settings.

### Option 3: Local Testing (Development)

```bash
# Run manually
node checkTrialExpiry.js

# Or set up a cron job on your machine (macOS/Linux)
crontab -e
# Add this line:
0 * * * * cd /path/to/job-report-generator && node checkTrialExpiry.js
```

---

## 🎨 Customizing Email Templates

Edit `emailService.js` to customize:
- Subject lines
- HTML content
- Colors and styling
- Call-to-action buttons

Example:
```javascript
trialEndingSoon: (userName, hoursLeft) => ({
  subject: '⏰ Your trial ends in ' + hoursLeft + ' hours!',
  html: `
    <h2>Hi ${userName}!</h2>
    <p>Your trial is ending soon...</p>
  `
})
```

---

## 🔧 Using Your Own Domain

**Free tier limitation:** Resend free tier sends from `onboarding@resend.dev`

**To use your own domain:**
1. Go to Resend → Domains
2. Add your domain (e.g., `jobsheetpro.com`)
3. Add DNS records (they'll show you what to add)
4. Verify domain
5. Update `emailService.js`:
   ```javascript
   from: 'JobSheet Pro <noreply@jobsheetpro.com>'
   ```

---

## 📊 Monitoring Emails

**Resend Dashboard:**
- View all sent emails
- See delivery status
- Check open rates
- View bounces/complaints

**Server Logs:**
```
✅ Email sent: abc123
✅ Sent trial ending email to user@example.com
```

---

## 🧪 Testing

### Test Payment Success Email
1. Subscribe with test card
2. Check email inbox
3. Should receive "Payment Successful" email

### Test Cancellation Email
1. Cancel subscription via portal
2. Check email inbox
3. Should receive "Subscription Canceled" email

### Test Trial Emails
1. Create test user with trial
2. Manually change `trial_end` in database to 23 hours from now
3. Run: `node checkTrialExpiry.js`
4. Check email inbox

---

## 🚨 Troubleshooting

**No emails sending?**
- Check `RESEND_API_KEY` is set
- Check server logs for errors
- Verify email address is valid
- Check Resend dashboard for failures

**Emails going to spam?**
- Use verified domain (not resend.dev)
- Add SPF/DKIM records
- Avoid spammy words in subject

**Cron job not running?**
- Check Railway/GitHub Actions logs
- Verify environment variables are set
- Test manually first: `node checkTrialExpiry.js`

---

## 💰 Pricing

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for starting out

**Paid Plans:**
- $20/month for 50,000 emails
- Upgrade when you need more

---

## ✅ Checklist

- [ ] Sign up for Resend
- [ ] Get API key
- [ ] Add to `.env` locally
- [ ] Add to Railway/production
- [ ] Test locally
- [ ] Set up cron job (Railway/GitHub Actions)
- [ ] Test all 4 email types
- [ ] (Optional) Add custom domain
- [ ] Monitor in Resend dashboard

---

## 🎯 Next Steps

After emails are working:
1. Track email open rates
2. A/B test subject lines
3. Add more email types (welcome series, tips, etc.)
4. Segment users for targeted emails

