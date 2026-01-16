# 🔒 Security Policy Fix Guide

## Problem
You have **9 security issues** in Supabase that need attention. These are Row Level Security (RLS) policies that protect your database.

---

## ✅ Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your **JobSheet Pro** project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Fix Script
1. Open the file `FIX_SECURITY_POLICIES.sql` (in this folder)
2. **Copy ALL the SQL code** from that file
3. **Paste it** into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify It Worked
After running the script, you should see a table showing 5 policies:
- ✅ Users can view their own subscription
- ✅ Users can create their own subscription
- ✅ Users can update own subscription
- ✅ Service role can update subscriptions
- ✅ Users can delete own subscription

### Step 4: Check Security Issues
1. Go back to your Supabase dashboard home
2. The **9 issues** should now be **0 issues** or significantly reduced
3. If you still see warnings, refresh the page

---

## 🔍 What These Policies Do

### 1. **SELECT Policy** (View)
- Users can only see their own subscription data
- Prevents users from viewing other users' subscriptions

### 2. **INSERT Policy** (Create)
- Users can only create subscriptions for themselves
- Prevents users from creating fake subscriptions for others

### 3. **UPDATE Policy** (Modify)
- Users can update their own subscription
- Your backend (service role) can also update subscriptions via Stripe webhooks

### 4. **DELETE Policy** (Remove)
- Users can delete their own subscription if needed
- Useful for account cleanup

---

## 🛡️ Why This Matters

**Without RLS policies:**
- ❌ Any user could view all subscriptions in your database
- ❌ Users could modify other users' subscription status
- ❌ Users could give themselves free access
- ❌ Your data is exposed to potential attacks

**With RLS policies:**
- ✅ Users can only access their own data
- ✅ Your backend can still update subscriptions via Stripe
- ✅ Database is secure and protected
- ✅ Compliant with security best practices

---

## 🚨 Troubleshooting

### Still seeing security warnings?
1. Make sure you ran the ENTIRE SQL script
2. Refresh your Supabase dashboard
3. Check that RLS is enabled: Go to **Database** → **Tables** → **subscriptions** → Should show "RLS enabled"

### Policies not working?
1. Make sure your `auth.users` table exists (it should be created automatically by Supabase)
2. Verify your app is using the correct Supabase URL and anon key
3. Check that users are properly authenticated before accessing subscriptions

### Need to reset everything?
Run this in SQL Editor:
```sql
-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscription" ON subscriptions;

-- Then re-run the FIX_SECURITY_POLICIES.sql script
```

---

## ✅ After Fixing

Once you've run the SQL script:
1. ✅ All 9 security issues should be resolved
2. ✅ Your database is now secure
3. ✅ Users can only access their own data
4. ✅ Your app will continue to work normally
5. ✅ Stripe webhooks can still update subscriptions

---

## 📚 Learn More

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

