# ⚡ Quick Start - Deploy in 10 Minutes

## 🎯 Fastest Way to Get Your App Online

### Step 1: Deploy Backend (5 minutes)

1. **Go to Render**: https://render.com/signup
2. **Sign up** with GitHub (no credit card needed)
3. **New Web Service** → Connect your GitHub repo
4. **Settings**:
   - Name: `even-hospital-api`
   - Build: `npm install`
   - Start: `npm start`
5. **Environment**: Copy from your `.env` file
6. **Deploy** → Get URL: `https://even-hospital-api.onrender.com`

### Step 2: Update VAPI Webhook (2 minutes)

1. **VAPI Dashboard**: https://dashboard.vapi.ai
2. **Your Assistant** → Settings
3. **Server URL**: `https://even-hospital-api.onrender.com/api/vapi/tool-calls`
4. **Save**

### Step 3: Deploy Frontend (3 minutes)

1. **Go to Netlify**: https://app.netlify.com/drop
2. **Drag & Drop**: `even-landing-page.html`
3. **Get URL**: `https://your-site.netlify.app`
4. **Share** the URL with anyone!

---

## ✅ That's It!

Your app is now live on the internet. Anyone can visit the URL and use the voice bot.

---

## 🔗 Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **Netlify Dashboard**: https://app.netlify.com
- **VAPI Dashboard**: https://dashboard.vapi.ai

---

## 🐛 Not Working?

### Backend Issues:
- Check Render logs for errors
- Verify environment variables are set
- Test: `https://YOUR-URL.onrender.com/health`

### Frontend Issues:
- Check browser console (F12)
- Verify microphone permissions
- Check VAPI assistant ID is correct

### Voice Bot Issues:
- Verify VAPI webhook URL is correct
- Check VAPI dashboard for call logs
- Test with: "I have knee pain"

---

## 💡 Pro Tips

1. **Custom Domain**: Change Netlify site name in settings
2. **Keep Awake**: Use UptimeRobot to ping backend every 5 min
3. **Monitor**: Check Render logs for any issues
4. **Test**: Always test the complete flow after deployment

---

For detailed instructions, see **DEPLOYMENT_GUIDE.md**
