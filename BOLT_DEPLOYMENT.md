# ⚡ Bolt.new Deployment Guide

## 🎯 Quick Deployment to Bolt.new

### Method 1: Direct Upload (Fastest - 5 minutes)

#### Step 1: Prepare Files

You need to upload these to Bolt.new:

**Required Files:**
```
├── src/
│   ├── index.js (backend server)
│   ├── services/
│   │   ├── ragService.js
│   │   ├── vapiService.js
│   │   ├── appointmentService.js
│   │   ├── embeddingService.js
│   │   └── retellService.js
│   └── utils/
│       ├── dataProcessor.js
│       └── generateEmbeddings.js
├── data/
│   └── embeddings/
│       └── doctor_embeddings.json
├── even-landing-page.html
├── package.json
└── .env
```

#### Step 2: Go to Bolt.new

1. Visit: https://bolt.new
2. Sign in (free account)
3. Click "New Project"

#### Step 3: Create Project Structure

**Option A: Use Bolt AI**
```
Prompt: "Create a Node.js Express server with the following structure:
- Express server on port 3000
- CORS enabled
- Routes for /health, /api/search-doctors, /api/appointments
- Serve static HTML file"
```

**Option B: Manual Upload**
1. Click "Upload" or drag & drop
2. Upload your entire `Even Hospital` folder
3. Bolt will detect Node.js project

#### Step 4: Configure Environment Variables

In Bolt.new settings:
```
OPENAI_API_KEY=sk-proj-your-key-here
VAPI_API_KEY=your-key-here
VAPI_PUBLIC_KEY=your-key-here
VAPI_ASSISTANT_ID=d595c5af-588f-4b43-a9ee-01863175608b
PORT=3000
NODE_ENV=production
EMBEDDINGS_PATH=./data/embeddings/doctor_embeddings.json
```

#### Step 5: Install Dependencies & Run

Bolt should auto-run:
```bash
npm install
npm start
```

#### Step 6: Get Your URL

Bolt gives you: `https://your-project-xyz.bolt.new`

#### Step 7: Update VAPI Webhook

1. Go to VAPI Dashboard: https://dashboard.vapi.ai
2. Update webhook URL to: `https://your-project-xyz.bolt.new/api/vapi/tool-calls`
3. Save

#### Step 8: Test

Visit: `https://your-project-xyz.bolt.new/even-landing-page.html`

---

## 🚀 Method 2: Import from GitHub (Better for Updates)

### Step 1: Push to GitHub

```bash
cd "C:\Users\AD\Desktop\Even Hospital"

# Initialize git if not done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Bolt.new deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/even-hospital.git
git push -u origin main
```

### Step 2: Import to Bolt

1. Go to Bolt.new
2. Click "Import from GitHub"
3. Authorize GitHub
4. Select `even-hospital` repository
5. Click "Import"

### Step 3: Configure

- Add environment variables in Bolt settings
- Bolt auto-detects `package.json` and runs `npm install`
- Server starts automatically

### Step 4: Share URL

Share: `https://your-project.bolt.new/even-landing-page.html`

---

## 🔧 Fixing Common Issues

### Issue 1: RAG Document Path Error

**Error**: Cannot find RAG document at `C:\Users\AD\...`

**Solution**: Update `.env` in Bolt:
```
RAG_DOCUMENT_PATH=./data/embeddings/doctor_embeddings.json
EMBEDDINGS_PATH=./data/embeddings/doctor_embeddings.json
```

Make sure these files are uploaded to Bolt.

### Issue 2: Appointments Not Persisting

**Error**: Appointments lost after server restart

**Solutions**:
1. **For Demo**: Accept that data resets (fine for testing)
2. **For Production**:
   - Add MongoDB integration
   - Or use Bolt's persistent storage (if available)
   - Or upgrade to full hosting (Render/Railway)

### Issue 3: Environment Variables Not Working

**Error**: `VAPI_API_KEY is undefined`

**Solution**:
1. Check Bolt's secrets/environment panel
2. Restart the server in Bolt
3. Verify `.env` file is uploaded (or use Bolt's UI)

### Issue 4: CORS Errors

**Error**: CORS blocked in browser

**Solution**: Already handled in `src/index.js`:
```javascript
app.use(cors());
```

If still issues, add:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### Issue 5: Port Conflicts

**Error**: Port 3000 already in use

**Solution**: Bolt handles this automatically. If needed:
```javascript
const PORT = process.env.PORT || 3000;
```

---

## 📱 Serving the Landing Page

### Option 1: Direct HTML Access

Update `src/index.js` to serve HTML:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Serve landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../even-landing-page.html'));
});
```

Now users can visit: `https://your-project.bolt.new/` directly!

### Option 2: Keep Separate Paths

- Landing page: `https://your-project.bolt.new/even-landing-page.html`
- API: `https://your-project.bolt.new/api/*`
- Health: `https://your-project.bolt.new/health`

---

## 💰 Bolt.new Pricing

### Free Tier:
- ✅ Public projects
- ✅ Basic resources
- ⚠️ May have usage limits
- ⚠️ Inactivity timeout possible

### Paid Tier:
- ✅ Private projects
- ✅ More resources
- ✅ Better uptime
- ✅ Custom domains

**Recommendation**: Start with free tier for testing.

---

## 🎯 Advantages of Bolt.new for Your Project

1. **All-in-One**: Frontend + Backend in one place
2. **Easy Sharing**: Single URL to share
3. **Quick Setup**: 5 minutes vs 20 minutes (separate hosting)
4. **Built-in IDE**: Edit code directly in browser
5. **No Git Required**: Can upload files directly
6. **Preview**: Instant preview of changes

---

## ⚠️ When NOT to Use Bolt.new

- ❌ Need guaranteed 99.9% uptime
- ❌ High traffic (1000+ users)
- ❌ Need persistent database
- ❌ Production application (use Render/Railway instead)

**Best for**:
- ✅ Demos and prototypes
- ✅ Testing and development
- ✅ Sharing with stakeholders
- ✅ Quick iterations

---

## 🔄 Alternative: StackBlitz (Similar to Bolt)

Another option is **StackBlitz**:
- https://stackblitz.com
- Similar to Bolt.new
- Also hosts Node.js apps
- Good for full-stack projects

---

## 📞 Next Steps

1. **Try Bolt.new first** (fastest to share)
2. **If it works well** → Keep using it for demos
3. **For production** → Migrate to Render/Railway

---

## 🆘 Need Help?

- **Bolt.new Docs**: https://docs.bolt.new
- **StackBlitz Docs**: https://developer.stackblitz.com
- **Community**: Join Bolt.new Discord

---

**Quick Start**: Upload your project to Bolt.new → Add env vars → Get shareable URL in 5 minutes! 🚀
