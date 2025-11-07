# 🚀 Railway + Netlify Deployment Guide

## Overview
- **Backend (Railway)**: Node.js Express server with VAPI integration
- **Frontend (Netlify)**: Static HTML landing page with voice bot

---

## 🚂 Part 1: Deploy Backend to Railway

### Step 1: Create GitHub Repository

1. Go to GitHub: https://github.com/new
2. Create a new repository:
   - Repository name: `even-hospital-voice-bot`
   - Description: `AI-powered voice bot for Even Hospital`
   - Visibility: **Public** (required for Railway free tier)
   - Click "Create repository"

### Step 2: Push Your Code to GitHub

Your local git repository is already initialized. Now push it to GitHub:

```bash
cd "C:\Users\AD\Desktop\Even Hospital"
git remote add origin https://github.com/YOUR_USERNAME/even-hospital-voice-bot.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Sign Up for Railway

1. Go to: https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. Free tier: $5 credit/month (no credit card required)

### Step 4: Deploy to Railway

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `even-hospital-voice-bot`
4. Railway will automatically:
   - Detect Node.js project
   - Install dependencies (`npm install`)
   - Start server (`npm start`)

### Step 5: Configure Environment Variables in Railway

1. In your Railway project, click on your service
2. Go to **"Variables"** tab
3. Click **"Raw Editor"** button
4. Paste these environment variables:

```env
OPENAI_API_KEY=your_openai_api_key_here

VAPI_API_KEY=your_vapi_api_key_here
VAPI_PUBLIC_KEY=your_vapi_public_key_here
VAPI_ASSISTANT_ID=your_vapi_assistant_id_here

PORT=3001
NODE_ENV=production

EMBEDDINGS_PATH=./data/embeddings/doctor_embeddings.json

RETELL_API_KEY=your_retell_api_key_here
RETELL_AGENT_ID=your_retell_agent_id_here
RETELL_LLM_ID=your_retell_llm_id_here
```

5. Click **"Save"** or **"Deploy"**
6. Railway will redeploy with new environment variables

### Step 6: Get Your Railway URL

1. In Railway, go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://even-hospital-voice-bot-production.up.railway.app`
5. **Copy this URL** - you'll need it for VAPI and Netlify

### Step 7: Verify Backend is Running

Test your Railway backend:

1. Health check: `https://YOUR-RAILWAY-URL.up.railway.app/health`
2. You should see: `{"status":"ok","timestamp":"..."}`

---

## 🎨 Part 2: Deploy Frontend to Netlify

### Step 1: Sign Up for Netlify

1. Go to: https://app.netlify.com/signup
2. Sign up with GitHub (free account)
3. No credit card required

### Step 2: Update Landing Page with Railway URL

Before deploying, we need to update the HTML file to use your Railway backend URL.

**DO NOT DO THIS YET** - I'll help you update the file once you have your Railway URL.

### Step 3: Deploy to Netlify

**Method A: Drag & Drop (Easiest)**

1. In Netlify dashboard, click **"Add new site"** → **"Deploy manually"**
2. Drag and drop your `even-landing-page.html` file
3. Netlify will deploy it instantly
4. You'll get a URL like: `https://even-hospital-xyz.netlify.app`

**Method B: GitHub (Recommended for updates)**

1. Create a new folder in your GitHub repo: `frontend/`
2. Move `even-landing-page.html` to `frontend/` and rename it to `index.html`
3. Push to GitHub
4. In Netlify, click **"Add new site"** → **"Import from Git"**
5. Choose your GitHub repository
6. Configure:
   - Base directory: `frontend`
   - Build command: (leave empty)
   - Publish directory: `.` (current directory)
7. Click **"Deploy"**

### Step 4: Get Your Netlify URL

1. After deployment completes
2. Netlify shows your URL: `https://even-hospital-xyz.netlify.app`
3. You can customize this later to: `https://your-custom-name.netlify.app`

---

## 🔗 Part 3: Connect Everything

### Step 1: Update VAPI Webhook

1. Go to VAPI Dashboard: https://dashboard.vapi.ai
2. Find your assistant (ID: `d595c5af-588f-4b43-a9ee-01863175608b`)
3. Update **"Server URL"** to: `https://YOUR-RAILWAY-URL.up.railway.app/api/vapi/tool-calls`
4. Save changes

### Step 2: Test Complete Flow

1. Visit your Netlify URL: `https://even-hospital-xyz.netlify.app`
2. Click **"Talk to Me"** button
3. Allow microphone access
4. Say: **"I have knee pain"**
5. Bot should respond with doctor recommendations

---

## 📋 Quick Reference

### Your URLs:
- **Backend (Railway)**: `https://YOUR-APP.up.railway.app`
- **Frontend (Netlify)**: `https://YOUR-SITE.netlify.app`
- **VAPI Webhook**: `https://YOUR-APP.up.railway.app/api/vapi/tool-calls`

### Key Endpoints:
- Health check: `/health`
- Search doctors: `/api/search-doctors`
- Book appointment: `/api/appointments/book`
- VAPI webhook: `/api/vapi/tool-calls`

---

## ✅ Testing Checklist

- [ ] Railway backend is deployed and running
- [ ] Health endpoint returns 200 OK
- [ ] Netlify frontend is deployed
- [ ] Landing page loads correctly
- [ ] "Talk to Me" button appears
- [ ] VAPI webhook is updated
- [ ] Voice bot connects (green indicator)
- [ ] Doctor search works (test: "knee pain")
- [ ] Appointment booking works

---

## 🐛 Troubleshooting

### Railway Backend Issues

**Deployment Failed:**
- Check Railway logs (Deployments tab)
- Verify `package.json` has correct start script
- Check if embeddings file exists: `data/embeddings/doctor_embeddings.json`

**Environment Variables Not Working:**
- Go to Variables tab
- Click "Raw Editor"
- Verify all variables are present
- Redeploy the service

**Backend Not Responding:**
- Check Railway logs for errors
- Verify PORT is set to 3001
- Check if service is sleeping (Railway free tier may sleep)

### Netlify Frontend Issues

**Landing Page Not Loading:**
- Check if file was uploaded correctly
- Verify VAPI keys in HTML are correct
- Check browser console (F12) for errors

**Voice Bot Not Connecting:**
- Verify VAPI_PUBLIC_KEY in HTML
- Check VAPI_ASSISTANT_ID matches your assistant
- Verify VAPI webhook URL is updated

**CORS Errors:**
- Railway backend has CORS enabled by default
- Check if Railway URL is correct in any API calls

---

## 💰 Cost Breakdown

### Railway:
- **Free tier**: $5 credit/month
- Estimated usage: ~$5-10/month
- First month free with signup credit
- After credit runs out: ~$5-10/month

### Netlify:
- **Free tier**: Unlimited for personal projects
- 100GB bandwidth/month
- Automatic HTTPS
- Custom domain support (free)

### Total: ~$0-10/month

---

## 🔄 Updating Your App

### Update Backend:
1. Make changes to your code locally
2. Commit: `git add . && git commit -m "Update message"`
3. Push: `git push origin main`
4. Railway auto-deploys from GitHub (30-60 seconds)

### Update Frontend:
1. Update `even-landing-page.html`
2. Re-upload to Netlify:
   - Drag & drop method: Upload new file
   - GitHub method: Push changes, Netlify auto-deploys

---

## 🎯 Custom Domains (Optional)

### Railway Custom Domain:
1. In Railway project → Settings → Domains
2. Click "Custom Domain"
3. Add your domain: `api.yourdomain.com`
4. Update DNS records as instructed

### Netlify Custom Domain:
1. In Netlify site → Domain settings
2. Click "Add custom domain"
3. Add your domain: `yourdomain.com`
4. Update DNS records as instructed

---

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Netlify Docs**: https://docs.netlify.com
- **VAPI Docs**: https://docs.vapi.ai

---

## 🎉 Next Steps

After deployment:
1. Share your Netlify URL with users
2. Monitor Railway usage in dashboard
3. Check VAPI call logs for issues
4. Consider upgrading if you need more resources

Your voice bot is now live and accessible worldwide!
