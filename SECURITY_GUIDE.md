# 🔒 Security Guide - Protecting Your API Key

## ⚠️ IMPORTANT: Current Setup (Development Only)

Your Gemini API key is currently **hardcoded** in the source code:
- **File:** `src/App.jsx`
- **Line:** `geminiApiKey: 'AIzaSyDINRCvN2DLfa_zVXkyxJ7V1rxO90MOvMg'`

### ✅ Safe for:
- Local development (localhost)
- Testing on your computer
- Sharing with trusted team members

### ❌ NOT safe for:
- **Pushing to GitHub** (your key will be public!)
- **Deploying to production** (anyone can steal your key)
- **Sharing the code publicly**

---

## 🚨 Before Deploying to Production:

### **DO NOT:**
- ❌ Push this code to GitHub with the API key
- ❌ Deploy to Vercel/Netlify with the key in the code
- ❌ Share the code publicly

### **DO:**
- ✅ Use environment variables (see below)
- ✅ Add `.env` to `.gitignore`
- ✅ Use backend proxy (recommended)

---

## 🛡️ Production Security Options:

### **Option 1: Environment Variables (Quick Fix)**

#### **Step 1: Create `.env` file**
```bash
# In job-report-generator folder
echo "VITE_GEMINI_API_KEY=AIzaSyDINRCvN2DLfa_zVXkyxJ7V1rxO90MOvMg" > .env
```

#### **Step 2: Update `.gitignore`**
```bash
# Add to .gitignore
.env
.env.local
```

#### **Step 3: Update `src/App.jsx`**
```javascript
const [companySettings, setCompanySettings] = useState(() => {
  const saved = localStorage.getItem('companySettings')
  return saved ? JSON.parse(saved) : {
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    logo: null,
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
  }
})
```

#### **Step 4: Deploy to Vercel/Netlify**
Add environment variable in dashboard:
- **Key:** `VITE_GEMINI_API_KEY`
- **Value:** `AIzaSyDINRCvN2DLfa_zVXkyxJ7V1rxO90MOvMg`

**⚠️ Warning:** Key is still visible in browser (anyone can find it in network requests)

---

### **Option 2: Backend Proxy (Most Secure) ✅ RECOMMENDED**

Create a simple backend that hides your API key.

#### **Why this is better:**
- ✅ API key never exposed to users
- ✅ You can track usage
- ✅ You can add rate limiting
- ✅ You can add authentication

#### **Quick Setup with Vercel Serverless Functions:**

**File: `api/generate-report.js`**
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt } = req.body

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 10
          }
        })
      }
    )

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

**Update `src/components/JobForm.jsx`:**
```javascript
// Instead of calling Gemini directly, call your backend
const response = await fetch('/api/generate-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt })
})
```

---

## 📊 Current Risk Level:

| Scenario | Risk | Impact |
|----------|------|--------|
| Local development | 🟢 Low | Only you can see it |
| Push to GitHub | 🔴 High | Anyone can steal your key |
| Deploy with key in code | 🔴 High | Users can extract key from browser |
| Deploy with env vars | 🟡 Medium | Key visible in network requests |
| Deploy with backend proxy | 🟢 Low | Key completely hidden |

---

## 🎯 Recommended Action Plan:

### **For Now (Development):**
✅ Keep the key in the code
✅ Test locally
✅ Don't push to GitHub yet

### **Before Going Live:**
1. Choose Option 2 (Backend Proxy) - I can help set this up
2. Or use Option 1 (Environment Variables) as a quick fix
3. Add rate limiting to prevent abuse
4. Monitor usage in Google AI Studio

---

## 💡 Need Help?

I can help you:
1. Set up environment variables
2. Create a backend proxy
3. Deploy to Vercel/Netlify securely
4. Add authentication/rate limiting

Just ask! 🚀

