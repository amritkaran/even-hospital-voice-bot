# 🤖 Bolt.new AI Prompt - Generate Your Project

Since Bolt.new doesn't allow folder uploads, use this prompt to have Bolt AI generate your project:

---

## 📝 Copy This Prompt to Bolt.new

```
Create a Node.js Express server for Even Hospital voice bot with the following:

1. BACKEND SETUP:
- Express server on port 3000
- CORS enabled
- Environment variables support with dotenv
- JSON file storage for appointments

2. REQUIRED ROUTES:
- GET /health - Health check
- POST /api/search-doctors - Search doctors by symptoms
- POST /api/appointments/book - Book appointment
- GET /api/appointments/:id - Get appointment
- GET /api/appointments/availability/:doctorName - Check availability
- POST /api/vapi/webhook - VAPI webhook handler
- POST /api/vapi/tool-calls - VAPI tool calls handler

3. SERVICES NEEDED:
- AppointmentService: Manage appointments with 30-min slots
  - Monday-Friday: 9:00 AM - 12:00 PM, 2:00 PM - 6:00 PM
  - Saturday: 9:00 AM - 12:00 PM
  - Sunday: Closed
- VAPI integration for voice bot function calls

4. FRONTEND:
- Serve an HTML landing page at root (/)
- Landing page should have:
  - Even Hospital branding (blue color #2D5BFF)
  - Hero section with title "Doctors who don't just treat. They lead your care."
  - Floating voice bot button at bottom-right
  - Button connects to VAPI for voice calls
  - VAPI public key: 9fca90ac-bb25-45df-9e2a-2145562075e4
  - VAPI assistant ID: d595c5af-588f-4b43-a9ee-01863175608b

5. ENVIRONMENT VARIABLES NEEDED:
- OPENAI_API_KEY
- VAPI_API_KEY
- VAPI_ASSISTANT_ID
- PORT=3000

Make it production-ready and include error handling.
```

---

## 🎯 After Bolt Generates the Project

### Step 1: Bolt Creates Basic Structure
Bolt will generate the basic structure automatically

### Step 2: Add Your Doctor Data
You'll need to paste your actual service logic. I'll provide simplified versions below.

### Step 3: Configure Environment Variables
Add these in Bolt's settings panel

---

## 📋 But This Is Too Complex...

**Better Approach**: Since Bolt.new has limitations, use a different method below.

