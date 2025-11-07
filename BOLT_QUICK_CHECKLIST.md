# ⚡ Bolt.new - 5 Minute Deployment Checklist

## ✅ Pre-Deployment Checklist

Before uploading to Bolt.new, ensure:

- [ ] All code files are in the project folder
- [ ] `package.json` exists
- [ ] `data/embeddings/doctor_embeddings.json` file exists
- [ ] `.env` file is ready (you'll add these as secrets in Bolt)

---

## 🚀 Deployment Steps

### 1. Go to Bolt.new
- [ ] Visit: https://bolt.new
- [ ] Sign in (free account)

### 2. Create New Project
- [ ] Click "New Project" or "Import from GitHub"
- [ ] Choose method:
  - **Easy**: Upload folder directly
  - **Better**: Import from GitHub repo

### 3. Upload Your Project

**Method A: Direct Upload**
- [ ] Drag & drop your `Even Hospital` folder
- [ ] Or click "Upload" and select folder

**Method B: GitHub Import**
- [ ] Push code to GitHub first
- [ ] Import from GitHub in Bolt
- [ ] Auto-syncs on updates

### 4. Add Environment Variables

In Bolt's "Secrets" or "Environment" panel, add:

```env
OPENAI_API_KEY=your_openai_api_key_here

VAPI_API_KEY=your_vapi_api_key_here
VAPI_PUBLIC_KEY=your_vapi_public_key_here
VAPI_ASSISTANT_ID=your_vapi_assistant_id_here

PORT=3000
NODE_ENV=production

EMBEDDINGS_PATH=./data/embeddings/doctor_embeddings.json

RETELL_API_KEY=your_retell_api_key_here
RETELL_AGENT_ID=your_retell_agent_id_here
```

- [ ] Add all environment variables
- [ ] Save/Apply changes

### 5. Install & Run

Bolt should automatically:
- [ ] Run `npm install`
- [ ] Start server with `npm start`
- [ ] Show running on port 3000

### 6. Get Your URL

Bolt gives you: `https://your-project-xyz.bolt.new`

- [ ] Copy this URL
- [ ] Test: Visit `https://your-project-xyz.bolt.new/`
- [ ] Should see your landing page

### 7. Update VAPI Webhook

- [ ] Go to VAPI Dashboard: https://dashboard.vapi.ai
- [ ] Find your assistant settings
- [ ] Update "Server URL" to: `https://your-project-xyz.bolt.new/api/vapi/tool-calls`
- [ ] Save changes

### 8. Test Complete Flow

- [ ] Visit your Bolt URL
- [ ] Click "Talk to Me" button
- [ ] Allow microphone access
- [ ] Say: "I have knee pain"
- [ ] Verify bot responds with doctors
- [ ] Check browser console for errors (F12)

---

## 🎯 Quick Test Checklist

Once deployed, test these:

- [ ] Landing page loads: `https://your-url.bolt.new/`
- [ ] Health check works: `https://your-url.bolt.new/health`
- [ ] "Talk to Me" button appears
- [ ] Button floats at bottom-right
- [ ] Clicking button activates microphone
- [ ] Voice call connects to VAPI
- [ ] Speaking triggers doctor search
- [ ] Bot responds with recommendations
- [ ] Can book appointment

---

## 🐛 Troubleshooting

### Landing Page Not Loading
- [ ] Check Bolt logs for errors
- [ ] Verify `even-landing-page.html` is uploaded
- [ ] Check root route in `src/index.js`

### Backend API Not Working
- [ ] Check environment variables are set
- [ ] Verify embeddings file exists
- [ ] Check Bolt console for errors
- [ ] Test health endpoint

### Voice Bot Not Responding
- [ ] Check VAPI webhook URL is correct
- [ ] Verify VAPI assistant ID matches
- [ ] Check browser console (F12)
- [ ] Test microphone permissions

### Function Calls Failing
- [ ] Check Bolt logs when speaking
- [ ] Verify webhook receives calls
- [ ] Check OpenAI API key is valid
- [ ] Test with simple query: "knee pain"

---

## 📱 Sharing Your App

Once everything works:

1. **Copy URL**: `https://your-project.bolt.new/`
2. **Share** with anyone
3. **Instructions**: "Click Talk to Me and allow microphone"

---

## 💡 Pro Tips

### Keep Bolt Alive
- Bolt may sleep after inactivity (free tier)
- Solution: Visit URL periodically
- Or upgrade to paid tier

### Update Code
- If using GitHub import: Just push changes
- If direct upload: Re-upload files in Bolt

### Monitor Logs
- Click "Logs" in Bolt to see server output
- Helpful for debugging

### Custom Domain
- Paid Bolt plans allow custom domains
- E.g., `voice-bot.yourdomain.com`

---

## 🎉 Done!

Your app is now live on Bolt.new and anyone can use it!

**Your shareable link**: `https://your-project-xyz.bolt.new/`

---

## 📞 If You Get Stuck

1. Check Bolt logs (Console tab)
2. Verify all files uploaded correctly
3. Test health endpoint first
4. Check VAPI dashboard for errors
5. Review browser console (F12)

---

**Time to deploy**: ~5 minutes
**Cost**: Free (with limits) or ~$10/month (paid)
**Reliability**: Good for demos and testing
