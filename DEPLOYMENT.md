# 🚀 Deploy JobSheet Pro to the Web

## Quick Deploy (5 minutes)

### Step 1: Deploy Backend to Railway

1. **Go to:** https://railway.app/
2. **Sign up** with GitHub (free)
3. **Click "New Project"** → "Deploy from GitHub repo"
4. **Select** your `JobSheet Pro` repository
5. **Add Environment Variables:**
   - `STRIPE_SECRET_KEY` = (from Stripe dashboard)
   - `STRIPE_PRICE_ID` = (from Stripe dashboard)
   - `STRIPE_WEBHOOK_SECRET` = (from Stripe dashboard)
   - `SUPABASE_URL` = (from Supabase dashboard)
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase dashboard)
   - `OPENAI_API_KEY` = (your OpenAI key)
   - `CLIENT_URL` = (leave blank for now, we'll add this after frontend deploy)
   - `NODE_ENV` = `production`
6. **Click Deploy**
7. **Copy your Railway URL** (looks like: `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Go to:** https://vercel.com/
2. **Sign up** with GitHub (free)
3. **Click "Add New Project"**
4. **Import** your `JobSheet Pro` repository
5. **Configure:**
   - Framework Preset: **Vite**
   - Root Directory: **job-report-generator**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Add Environment Variables:**
   - `VITE_SUPABASE_URL` = (from Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (from Supabase)
   - `VITE_STRIPE_PUBLISHABLE_KEY` = (from Stripe)
   - `VITE_STRIPE_PRICE_ID` = (from Stripe)
   - `VITE_BACKEND_URL` = (your Railway URL from Step 1)
7. **Click Deploy**
8. **Copy your Vercel URL** (looks like: `https://your-app.vercel.app`)

### Step 3: Update Backend with Frontend URL

1. **Go back to Railway**
2. **Add environment variable:**
   - `CLIENT_URL` = (your Vercel URL from Step 2)
3. **Redeploy**

### Step 4: Update Stripe Webhook

1. **Go to:** https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL:** `https://your-railway-url.railway.app/webhook`
4. **Select events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. **Copy the Signing Secret**
6. **Update Railway** environment variable `STRIPE_WEBHOOK_SECRET` with this new secret

## Done! 🎉

Your app is now live at: `https://your-app.vercel.app`

---

## Alternative: Deploy Both to Vercel

If you prefer to keep everything in one place:

1. Follow Step 2 above for frontend
2. Backend will automatically deploy as serverless functions
3. Your backend will be at: `https://your-app.vercel.app/api/*`

---

## Troubleshooting

**"Environment variables not found"**
- Make sure all variables are added in both Railway and Vercel
- Redeploy after adding variables

**"CORS error"**
- Check that `CLIENT_URL` in Railway matches your Vercel URL exactly
- No trailing slash

**"Stripe webhook not working"**
- Make sure webhook URL is correct
- Check that signing secret matches

---

Need help? Check the console logs in Railway/Vercel dashboards.

