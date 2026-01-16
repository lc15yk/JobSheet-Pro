-- ========================================
-- FIX SUPABASE SECURITY POLICIES
-- Run this in Supabase SQL Editor to fix all 9 security issues
-- ========================================

-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscription" ON subscriptions;

-- Make sure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICY 1: Users can SELECT (view) their own subscription
-- ========================================
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ========================================
-- POLICY 2: Users can INSERT (create) their own subscription
-- ========================================
CREATE POLICY "Users can create their own subscription"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- POLICY 3: Users can UPDATE their own subscription
-- ========================================
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- POLICY 4: Service role can UPDATE subscriptions (for Stripe webhooks)
-- This allows your backend to update subscription status
-- ========================================
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (true);

-- ========================================
-- POLICY 5: Users can DELETE their own subscription (optional)
-- ========================================
CREATE POLICY "Users can delete own subscription"
  ON subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- Verify policies were created
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions';

-- ========================================
-- DONE! All security policies are now configured
-- ========================================

