# VAPI Manual Setup Guide

Since your VAPI plan doesn't allow programmatic assistant creation, you need to manually configure your existing assistant in the VAPI dashboard.

## 📋 Your Assistant Information

**Assistant ID:** e8691430-fcc8-4fa2-9542-2931f9cdfa7e
**Already Configured In:** config/.env

---

## 🔧 Manual Configuration Steps

### Step 1: Open VAPI Dashboard

Go to: https://dashboard.vapi.ai

### Step 2: Find Your Assistant

1. Click on "Assistants" in the left menu
2. Find assistant with ID: `e8691430-fcc8-4fa2-9542-2931f9cdfa7e`
3. Click to edit it

### Step 3: Configure Basic Settings

**Name:**
```
Even Hospital Doctor Booking Assistant
```

**First Message:**
```
Hello! I'm the virtual assistant for Even Hospital Bangalore. I'm here to help you book an appointment with one of our specialist doctors. Could you please tell me what health concern or symptoms you're experiencing today?
```

**Model:**
- Provider: OpenAI
- Model: GPT-4 (or gpt-4-turbo)
- Temperature: 0.7

### Step 4: Set System Prompt

Copy and paste this **exact system prompt**:

```
You are a professional and empathetic voice assistant for Even Hospital Bangalore, located in 29/2, Race Course Rd, Madhava Nagar, Gandhi Nagar, Bengaluru, Karnataka 560001.

HOSPITAL PHILOSOPHY:
Preventive, people-first approach to care. Doctors are evaluated by results, not procedure count. Care is collaborative with continuous follow-up and post-discharge support.

YOUR ROLE:
- Help patients find the right specialist doctor based on their symptoms
- Provide information about doctors' experience, specialties, and consultation fees
- Book appointments efficiently and courteously
- Answer questions about the hospital and doctors

CONVERSATION FLOW:
1. GREETING: Warmly greet the patient and ask about their health concern
2. SYMPTOM GATHERING: Listen carefully to their symptoms and ask clarifying questions if needed
3. DOCTOR RECOMMENDATION: Use the find_doctor function to get relevant specialists
4. PRESENT OPTIONS: Clearly present 2-3 doctor options with:
   - Doctor's name and specialty
   - Years of experience
   - Key expertise relevant to their condition
   - Consultation fee range
   - Languages spoken
5. BOOKING: Once they select a doctor, collect:
   - Patient's full name
   - Phone number
   - Preferred date (offer options for next 7 days)
   - Preferred time (morning 9am-12pm, afternoon 12pm-4pm, evening 4pm-7pm)
6. CONFIRMATION: Confirm all details and use book_appointment function

COMMUNICATION STYLE:
- Professional yet warm and empathetic
- Use simple, clear language (avoid medical jargon)
- Be patient with elderly callers
- Show genuine concern for their health
- Keep responses concise (2-3 sentences max per turn)
- Always confirm understanding before proceeding

IMPORTANT GUIDELINES:
- Never diagnose or provide medical advice
- Always recommend seeing a doctor for symptoms
- If multiple doctors match, present options based on experience and patient preference
- Mention consultation fees transparently
- If urgent symptoms (severe pain, bleeding, breathing issues), suggest immediate emergency visit
- For pediatric issues, recommend our pediatricians
- For pregnancy-related issues, recommend our gynecologists/obstetricians

HANDLING EDGE CASES:
- If symptom is unclear, ask targeted questions
- If no exact match, recommend general physician or most relevant specialty
- If patient asks for specific doctor by name, provide that doctor's information
- If booking conflicts, offer alternative dates/times
- Always be respectful and never rush the patient

Remember: You represent a preventive, people-first healthcare facility. Every interaction should reflect care, competence, and compassion.
```

### Step 5: Configure Voice Settings

**Voice Provider:** 11labs
**Voice:** Sarah (or any professional female voice)
**Stability:** 0.5
**Similarity Boost:** 0.75

### Step 6: Add Functions (IMPORTANT!)

You need to add 3 custom functions. For each function:

#### Function 1: find_doctor

**Name:** `find_doctor`
**Description:** `Search for doctors based on patient symptoms or health condition`

**Parameters (JSON):**
```json
{
  "type": "object",
  "properties": {
    "symptoms": {
      "type": "string",
      "description": "Patient's symptoms or health concern"
    }
  },
  "required": ["symptoms"]
}
```

#### Function 2: book_appointment

**Name:** `book_appointment`
**Description:** `Book an appointment with a selected doctor`

**Parameters (JSON):**
```json
{
  "type": "object",
  "properties": {
    "doctor_name": {
      "type": "string",
      "description": "Name of the doctor"
    },
    "patient_name": {
      "type": "string",
      "description": "Patient's full name"
    },
    "patient_phone": {
      "type": "string",
      "description": "Patient's phone number"
    },
    "preferred_date": {
      "type": "string",
      "description": "Preferred appointment date (YYYY-MM-DD)"
    },
    "preferred_time": {
      "type": "string",
      "description": "Preferred appointment time slot (morning/afternoon/evening)"
    }
  },
  "required": ["doctor_name", "patient_name", "patient_phone", "preferred_date"]
}
```

#### Function 3: get_doctor_availability

**Name:** `get_doctor_availability`
**Description:** `Check doctor's availability for appointments`

**Parameters (JSON):**
```json
{
  "type": "object",
  "properties": {
    "doctor_name": {
      "type": "string",
      "description": "Name of the doctor"
    },
    "date": {
      "type": "string",
      "description": "Date to check availability (YYYY-MM-DD)"
    }
  },
  "required": ["doctor_name"]
}
```

### Step 7: Configure Webhook (Optional but Recommended)

If you want the bot to actually search doctors and book appointments:

1. **Make your server public** (for testing, use ngrok):
   ```bash
   ngrok http 3001
   ```

2. **Get your ngrok URL** (e.g., https://abc123.ngrok.io)

3. **Set webhook URL in VAPI:**
   ```
   https://abc123.ngrok.io/api/vapi/webhook
   ```

**Note:** Without webhook, the bot will still talk but won't be able to search doctors or book appointments.

### Step 8: Other Settings

**End Call Message:**
```
Thank you for choosing Even Hospital. We look forward to seeing you. Take care and goodbye!
```

**End Call Phrases:**
- goodbye
- thank you goodbye
- that's all
- end call

**Max Duration:** 600 seconds (10 minutes)
**Silence Timeout:** 30 seconds
**Response Delay:** 0.4 seconds
**Recording:** Enabled
**Background Sound:** Office

---

## 🧪 Testing Your Assistant

### Step 1: Test in VAPI Dashboard

1. After saving all settings, click "Test" button
2. Allow microphone access
3. Say: "I have knee pain"
4. The bot should respond and ask for more details

### Step 2: Test with Webhook (If Configured)

1. Make sure your server is running (http://localhost:3001)
2. Make sure ngrok is running
3. Test the bot and say: "I have stomach pain"
4. The bot should call your API and return doctor recommendations

### Step 3: Check Server Logs

If webhook is configured, you'll see function calls in your server logs:
```
Function called: find_doctor
Parameters: { symptoms: 'stomach pain' }
```

---

## 🎯 Quick Test Without Webhook

If you haven't set up webhook yet, you can still test the conversation flow:

**You:** "Hi"
**Bot:** "Hello! I'm the virtual assistant for Even Hospital..."

**You:** "I have knee pain"
**Bot:** Will try to call find_doctor function (but it won't work without webhook)

**What to do:** Set up ngrok and webhook URL so functions work!

---

## 🔍 Troubleshooting

### Bot Doesn't Respond
- Check if assistant is saved properly
- Verify microphone permissions
- Try refreshing the test page

### Functions Don't Work
- Check webhook URL is set correctly
- Verify server is running (http://localhost:3001/health)
- Check ngrok is forwarding to port 3001
- Look at server logs for errors

### Bot Gives Generic Responses
- Check system prompt is pasted correctly
- Verify functions are added with exact names
- Make sure model is GPT-4 (not GPT-3.5)

---

## 📊 What Each Function Does

### find_doctor
- Takes patient symptoms
- Searches 226 embeddings
- Returns top 3 relevant doctors with details
- **Example:** "knee pain" → Returns orthopedic surgeons

### book_appointment
- Takes doctor name, patient details, date, time
- Checks availability
- Creates appointment with ID
- **Example:** Books Dr. Harish Puranik for morning slot

### get_doctor_availability
- Takes doctor name and optional date
- Returns available time slots
- **Example:** Shows morning/afternoon/evening availability

---

## ✅ Configuration Checklist

- [ ] Name: "Even Hospital Doctor Booking Assistant"
- [ ] First message configured
- [ ] System prompt pasted (entire prompt above)
- [ ] Model: GPT-4 with temperature 0.7
- [ ] Voice: 11labs Sarah or similar
- [ ] Function 1: find_doctor added
- [ ] Function 2: book_appointment added
- [ ] Function 3: get_doctor_availability added
- [ ] End call message set
- [ ] Max duration: 600 seconds
- [ ] Recording enabled
- [ ] (Optional) Webhook URL configured
- [ ] Save all changes
- [ ] Test button works

---

## 🚀 Once Configured

Your voice bot will be able to:
1. ✅ Greet patients warmly
2. ✅ Listen to their symptoms
3. ✅ Search for relevant doctors (with webhook)
4. ✅ Present doctor options with details
5. ✅ Book appointments (with webhook)
6. ✅ Confirm bookings with reference numbers

---

## 💡 Pro Tips

1. **Start without webhook** to test conversation flow
2. **Add webhook later** when you want full functionality
3. **Use ngrok** for local testing before deploying
4. **Check server logs** to debug function calls
5. **Test different symptoms** to see doctor matching

---

## 📞 Quick Webhook Setup with ngrok

```bash
# Terminal 1: Start server
cd "C:\Users\AD\Desktop\Even Hospital"
npm start

# Terminal 2: Start ngrok
ngrok http 3001

# Copy the https URL from ngrok (e.g., https://abc123.ngrok.io)
# Paste in VAPI webhook settings: https://abc123.ngrok.io/api/vapi/webhook
```

---

Your assistant is ready to be configured! Follow the steps above and test it. The system is already built and waiting - you just need to configure the VAPI UI manually. 🎉
