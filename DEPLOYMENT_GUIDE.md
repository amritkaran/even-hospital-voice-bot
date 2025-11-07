# 🚀 Even Hospital - Deployment Guide

This guide will help you deploy the Even Hospital Voice Bot to the internet for free.

## 📦 What Needs to Be Deployed

### 1. **Frontend (Landing Page)**
- File: `even-landing-page.html`
- Type: Static HTML file
- Hosting: Netlify (recommended)

### 2. **Backend (Node.js Server)**
- Files: Entire `src/` directory + dependencies
- Type: Node.js Express server
- Hosting: Render or Railway (recommended)

---

## 🎯 Deployment Strategy

```
┌─────────────────────────────────────────────────┐
│  USER VISITS                                    │
│  https://even-hospital.netlify.app             │
│  (Frontend - Netlify)                           │
└────────────────┬────────────────────────────────┘
                 │
                 │ Clicks "Talk to Me"
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  VAPI SERVER (Vapi.ai)                          │
│  - Handles voice call                           │
│  - Manages conversation                         │
└────────────────┬────────────────────────────────┘
                 │
                 │ Calls functions
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  YOUR BACKEND SERVER                            │
│  https://even-hospital-api.onrender.com         │
│  (Backend - Render/Railway)                     │
│  - Search doctors                               │
│  - Book appointments                            │
│  - Check availability                           │
└─────────────────────────────────────────────────┘
```

---

## 🌐 Option 1: Deploy with Netlify + Render (Recommended)

### **Part A: Deploy Backend to Render**

#### Step 1: Prepare Your Project

1. **Initialize Git** (if not already done):
   ```bash
   cd "C:\Users\AD\Desktop\Even Hospital"
   git init
   git add .
   git commit -m "Initial commit for deployment"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name: `even-hospital-voice-bot`
   - Make it **Private** (contains API keys)
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/even-hospital-voice-bot.git
   git branch -M main
   git push -u origin main
   ```

#### Step 2: Deploy to Render

1. **Sign up for Render**:
   - Go to https://render.com
   - Sign up with GitHub
   - Free tier requires no credit card

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `even-hospital-voice-bot`

3. **Configure Service**:
   ```
   Name: even-hospital-api
   Region: Select closest to you
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**:
   Click "Environment" → "Add Environment Variable"

   Copy these from your `.env` file:
   ```
   OPENAI_API_KEY=your_key_here
   VAPI_API_KEY=your_key_here
   VAPI_PUBLIC_KEY=your_key_here
   VAPI_ASSISTANT_ID=your_id_here
   PORT=3000
   NODE_ENV=production
   RAG_DOCUMENT_PATH=./data/embeddings/doctor_embeddings.json
   EMBEDDINGS_PATH=./data/embeddings/doctor_embeddings.json
   RETELL_API_KEY=your_key_here
   RETELL_AGENT_ID=your_id_here
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - You'll get URL like: `https://even-hospital-api.onrender.com`

6. **Test Backend**:
   - Visit: `https://even-hospital-api.onrender.com/health`
   - Should see: `{"status":"healthy",...}`

#### Step 3: Update VAPI Webhook

1. **Go to VAPI Dashboard**:
   - Login at https://dashboard.vapi.ai
   - Go to your assistant settings

2. **Update Server URL**:
   - Find "Server URL" or "Webhook URL"
   - Set to: `https://even-hospital-api.onrender.com/api/vapi/tool-calls`
   - Save changes

### **Part B: Deploy Frontend to Netlify**

#### Step 1: Prepare Landing Page

The landing page needs to be updated to work as a standalone file. I'll create a production-ready version for you.

#### Step 2: Deploy to Netlify

**Option A: Drag & Drop (Easiest)**

1. **Sign up for Netlify**:
   - Go to https://netlify.com
   - Sign up (free, no credit card)

2. **Deploy**:
   - Go to https://app.netlify.com/drop
   - Drag and drop `even-landing-page.html` file
   - Rename to `index.html` when prompted
   - Get instant URL: `https://random-name-12345.netlify.app`

3. **Custom Domain** (Optional):
   - Click "Domain settings"
   - Change site name to: `even-hospital`
   - New URL: `https://even-hospital.netlify.app`

**Option B: Continuous Deployment**

1. Create `netlify.toml` in project root:
   ```toml
   [build]
     publish = "."

   [[redirects]]
     from = "/*"
     to = "/even-landing-page.html"
     status = 200
   ```

2. Connect GitHub repo to Netlify
3. Auto-deploys on every push

#### Step 3: Test Complete Flow

1. Visit your Netlify URL
2. Click "Talk to Me" button
3. Allow microphone access
4. Say: "I have knee pain"
5. Bot should respond with doctor recommendations

---

## 🌐 Option 2: Deploy with Vercel + Railway

### **Backend: Railway**

1. **Sign up**: https://railway.app
2. **New Project** → "Deploy from GitHub"
3. Select your repo
4. Add environment variables
5. Deploy
6. Get URL: `https://even-hospital-api.up.railway.app`

### **Frontend: Vercel**

1. **Sign up**: https://vercel.com
2. **New Project** → Import GitHub repo
3. Deploy
4. Get URL: `https://even-hospital.vercel.app`

---

## 🔒 Important Security Notes

### **DO NOT**:
- ❌ Commit `.env` file to GitHub (already in `.gitignore`)
- ❌ Expose API keys in frontend code
- ❌ Make your GitHub repo public if it contains sensitive data

### **DO**:
- ✅ Use environment variables for all secrets
- ✅ Keep your repo private
- ✅ Use HTTPS URLs only
- ✅ Set up CORS properly (already configured)

---

## 📊 Free Tier Limitations

### **Render Free Tier**:
- ✅ 750 hours/month
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 30-60 sec cold start
- ✅ Automatic HTTPS
- ✅ 100GB bandwidth

**Solution for Cold Starts**:
- Use a ping service (e.g., UptimeRobot) to keep it awake
- Or accept the delay

### **Netlify Free Tier**:
- ✅ 100GB bandwidth/month
- ✅ Unlimited sites
- ✅ Always on (no cold starts)
- ✅ Global CDN

### **Railway Free Tier**:
- ✅ $5 credit/month (~550 hours)
- ✅ No cold starts
- ✅ Better performance than Render

---

## 🐛 Troubleshooting

### **Backend Returns 404**
- Check VAPI webhook URL is correct
- Verify environment variables are set
- Check logs in Render dashboard

### **Voice Bot Not Working**
- Check browser console (F12) for errors
- Verify VAPI_PUBLIC_KEY is correct
- Test microphone permissions

### **Cold Start Issues**
- Use Railway instead of Render (no cold starts within credit)
- Or set up UptimeRobot to ping your backend every 5 minutes

### **CORS Errors**
- Already configured in `src/index.js`
- If issues persist, check Render logs

---

## 📱 Sharing Your App

Once deployed, share this URL with anyone:

```
https://even-hospital.netlify.app
```

They can:
1. Click "Talk to Me"
2. Allow microphone
3. Speak their symptoms
4. Get doctor recommendations
5. Book appointments

---

## 🔄 Making Updates

### **Update Backend**:
```bash
git add .
git commit -m "Update backend"
git push
```
→ Render auto-deploys in 2-3 minutes

### **Update Frontend**:
- Drag new HTML file to Netlify
- Or push to GitHub (if connected)

---

## 💰 Cost Estimation

**Free Setup (Recommended for Testing)**:
- Netlify: $0/month
- Render: $0/month (with cold starts)
- Total: **$0/month**

**Paid Setup (Better Performance)**:
- Netlify: $0/month (still free)
- Render: $7/month (no cold starts, better performance)
- Total: **$7/month**

**Production Setup**:
- Vercel Pro: $20/month
- Railway Pro: $20/month
- Total: **$40/month**

---

## 📞 Next Steps

1. Follow deployment steps above
2. Test your live URL
3. Share with stakeholders
4. Monitor usage in dashboards
5. Upgrade to paid plans if needed

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Railway Docs**: https://docs.railway.app
- **VAPI Docs**: https://docs.vapi.ai

---

**Questions?** Check the troubleshooting section or review service logs in your hosting dashboard.
