# Email Configuration Guide

## Overview
JobSheet Pro requires email configuration for:
- ✅ Email confirmation after signup
- 🔑 Password reset emails
- 📧 Subscription confirmation emails (optional)

---

## Option 1: Enable Supabase Email Confirmation (Recommended for Testing)

### Steps:
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**
4. Toggle **"Confirm email"** to **ON** or **OFF**
   - **ON**: Users must confirm email before logging in (more secure)
   - **OFF**: Users can log in immediately (easier for testing)

### For Production:
- Keep **"Confirm email"** **ON** for security
- Supabase provides default email templates
- Emails will be sent from `noreply@mail.app.supabase.io`

---

## Option 2: Custom SMTP (Recommended for Production)

For a professional email experience with your own domain:

### Recommended Services:
- **SendGrid** (Free tier: 100 emails/day)
- **Resend** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **AWS SES** (Very cheap, requires AWS account)

### Setup with SendGrid:

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for free account
   - Verify your email

2. **Get API Key**
   - Go to Settings → API Keys
   - Create new API key with "Mail Send" permissions
   - Copy the API key (you won't see it again!)

3. **Configure Supabase**
   - Go to Supabase Dashboard → **Project Settings** → **Auth**
   - Scroll to **SMTP Settings**
   - Enable **"Enable Custom SMTP"**
   - Fill in:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: <your-sendgrid-api-key>
     Sender email: noreply@yourdomain.com
     Sender name: JobSheet Pro
     ```

4. **Verify Domain (Optional but Recommended)**
   - In SendGrid, go to Settings → Sender Authentication
   - Verify your domain to improve deliverability
   - Add DNS records as instructed

---

## Option 3: Disable Email Confirmation (Not Recommended)

If you want to skip email confirmation entirely:

1. Go to Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to **OFF**
3. Users can log in immediately after signup

**⚠️ Warning**: This is less secure and not recommended for production.

---

## Email Templates

Supabase provides default templates for:
- Confirmation email
- Password reset email
- Magic link email

### Customize Templates:
1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Edit the templates with your branding
3. Available variables:
   - `{{ .ConfirmationURL }}` - Email confirmation link
   - `{{ .Token }}` - Confirmation token
   - `{{ .SiteURL }}` - Your app URL

---

## Testing Email Configuration

### Test Email Confirmation:
1. Create a new account with a real email address
2. Check your inbox for confirmation email
3. Click the confirmation link
4. Try logging in

### Test Password Reset:
1. Go to login page
2. Click "Forgot Password?"
3. Enter your email
4. Check inbox for reset email
5. Click reset link and set new password

---

## Current Status

✅ **What's Working:**
- User signup and login
- Subscription system
- Trial activation

⚠️ **What Needs Configuration:**
- Email confirmation (currently disabled or using Supabase default)
- Password reset emails (using Supabase default)
- Custom email templates (optional)

---

## Next Steps

1. **For Testing**: Keep email confirmation disabled or use Supabase default
2. **For Production**: Set up custom SMTP with SendGrid/Resend
3. **Customize**: Update email templates with your branding

---

## Environment Variables

No additional environment variables needed! Email configuration is done entirely in the Supabase Dashboard.

---

## Troubleshooting

### Emails not arriving?
- Check spam folder
- Verify SMTP credentials in Supabase
- Check SendGrid/Resend dashboard for delivery logs
- Ensure sender email is verified

### "Email not confirmed" error?
- Disable email confirmation in Supabase Auth settings
- Or manually confirm email using Supabase Dashboard → Authentication → Users

---

**Need help?** Check Supabase docs: https://supabase.com/docs/guides/auth/auth-smtp

