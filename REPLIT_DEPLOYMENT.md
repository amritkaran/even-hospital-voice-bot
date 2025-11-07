# 🚀 Replit Deployment - Upload Entire Project (EASIEST)

## ✅ Why Replit Instead of Bolt.new

**Replit allows:**
- ✅ Upload entire folder with files
- ✅ Import from GitHub
- ✅ Full Node.js backend + frontend
- ✅ Instant shareable URL
- ✅ Free hosting

**Bolt.new limitations:**
- ❌ No folder uploads
- ❌ Need to paste code manually
- ❌ More restrictive

---

## 🚀 Deploy to Replit in 5 Minutes

### Step 1: Sign Up for Replit

1. Go to: https://replit.com/signup
2. Sign up (free account)
3. No credit card needed

---

### Step 2: Create New Repl

**Method A: Import from GitHub (Recommended)**

1. Click "Create Repl"
2. Select "Import from GitHub"
3. Enter your repo URL: `https://github.com/YOUR_USERNAME/even-hospital`
4. Click "Import from GitHub"
5. Replit auto-detects Node.js and installs dependencies

**Method B: Upload Directly**

1. Click "Create Repl"
2. Choose "Node.js" template
3. Name it: `even-hospital-voice-bot`
4. Click "Create Repl"

---

### Step 3: Upload Your Files

In the Replit file explorer:

1. **Click the 3-dot menu** (⋮) next to "Files"
2. Select "Upload folder"
3. Select your entire `Even Hospital` folder
4. Wait for upload to complete

**Files structure should look like:**
```
├── src/
│   ├── index.js
│   ├── services/
│   └── utils/
├── data/
│   └── embeddings/
├── even-landing-page.html
├── package.json
├── .env
└── README.md
```

---

### Step 4: Configure Environment Variables

1. Click "Secrets" tab (🔒 icon on left sidebar)
2. Click "Open raw editor"
3. Paste your environment variables:

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
RETELL_LLM_ID=your_retell_llm_id_here
```

4. Click "Save"

---

### Step 5: Update .replit Configuration

Replit auto-generates a `.replit` file. Update it if needed:

1. Click on `.replit` file
2. Update to:

```toml
run = "npm start"
entrypoint = "src/index.js"

[nix]
channel = "stable-22_11"

[deployment]
run = ["npm", "start"]
deploymentTarget = "cloudrun"
```

---

### Step 6: Install Dependencies & Run

1. Click "Shell" tab
2. Run:
```bash
npm install
```

3. Click "Run" button (▶️ at top)

4. Server starts and you'll see:
```
Server running on http://localhost:3000
```

---

### Step 7: Get Your Public URL

Replit automatically creates a public URL:

1. Look at the "Webview" panel (right side)
2. You'll see a URL like: `https://even-hospital-voice-bot.YOUR_USERNAME.repl.co`
3. Click "Open in new tab" icon

**This is your shareable URL!**

---

### Step 8: Update VAPI Webhook

1. Copy your Replit URL: `https://even-hospital-voice-bot.YOUR_USERNAME.repl.co`
2. Go to VAPI Dashboard: https://dashboard.vapi.ai
3. Update webhook URL to: `https://even-hospital-voice-bot.YOUR_USERNAME.repl.co/api/vapi/tool-calls`
4. Save changes

---

### Step 9: Test Your App

1. Visit: `https://even-hospital-voice-bot.YOUR_USERNAME.repl.co/`
2. You should see the landing page
3. Click "Talk to Me" button
4. Allow microphone
5. Say: "I have knee pain"
6. Bot should respond with doctors!

---

## ✅ Testing Checklist

- [ ] Landing page loads
- [ ] Health check works: `/health`
- [ ] Voice button appears
- [ ] Click button activates microphone
- [ ] Speaking triggers response
- [ ] Bot suggests doctors
- [ ] Can book appointment

---

## 🎯 Advantages of Replit

1. ✅ **Upload entire folder** (not possible in Bolt)
2. ✅ **Free hosting** with public URL
3. ✅ **Always-on** (with activity)
4. ✅ **Built-in IDE** for editing
5. ✅ **GitHub sync** for updates
6. ✅ **Environment secrets** built-in
7. ✅ **No cold starts** (keeps running)

---

## 💰 Replit Pricing

### Free Tier (Starter):
- ✅ Public repls
- ✅ 1GB storage
- ✅ Basic compute
- ⚠️ Sleeps after 1 hour inactivity
- ⚠️ Limited always-on time

### Hacker Plan ($7/month):
- ✅ Private repls
- ✅ Always-on repls (no sleep)
- ✅ 5GB storage
- ✅ Faster compute
- ✅ Custom domains

**Recommendation**: Start with free, upgrade if needed.

---

## 🔄 Keeping Repl Awake (Free Tier)

### Option 1: Use UptimeRobot
1. Sign up: https://uptimerobot.com (free)
2. Create monitor
3. URL: Your Replit URL
4. Check interval: 5 minutes
5. Keeps your repl awake

### Option 2: Upgrade to Hacker Plan
- Always-on repls
- No sleep timer
- Better for production

---

## 🐛 Troubleshooting

### Files Not Uploading
- Try uploading smaller batches
- Or use GitHub import method

### Server Not Starting
- Check `.replit` file configuration
- Verify `package.json` exists
- Check Shell tab for errors

### Environment Variables Not Working
- Verify they're in Secrets tab
- Restart the repl
- Check for typos

### Port Issues
- Replit assigns port automatically
- Don't hardcode port, use: `process.env.PORT || 3000`

---

## 📱 Sharing Your App

**Share this URL with anyone:**
```
https://even-hospital-voice-bot.YOUR_USERNAME.repl.co
```

They can immediately:
1. Use voice bot
2. Book appointments
3. Search doctors

---

## 🔄 Updating Your App

### If Using GitHub:
1. Push changes to GitHub
2. In Replit, click "Pull" from GitHub
3. Auto-updates

### If Direct Upload:
1. Edit files in Replit IDE
2. Changes auto-save and reload

---

## 🆘 Need Help?

- **Replit Docs**: https://docs.replit.com
- **Replit Community**: https://ask.replit.com
- **Video Tutorials**: https://www.youtube.com/c/replit

---

## 🎉 You're Done!

**Deployment time**: ~5 minutes
**Cost**: Free (or $7/month for always-on)
**Shareable**: Instant public URL

Your app is now live and anyone can use it! 🚀

---

## 📊 Comparison: Replit vs Others

| Feature | Replit | Bolt.new | Render |
|---------|--------|----------|--------|
| Folder Upload | ✅ Yes | ❌ No | ✅ GitHub only |
| Setup Time | 5 min | Complex | 10 min |
| Free Tier | ✅ Yes | ✅ Yes | ✅ Yes |
| Always-On (Free) | ⚠️ Limited | ⚠️ Limited | ❌ No |
| Built-in IDE | ✅ Yes | ✅ Yes | ❌ No |

**Winner for your use case: Replit** ✅
