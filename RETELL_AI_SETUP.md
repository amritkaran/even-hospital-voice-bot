# Retell AI Setup Guide for Even Hospital Voice Bot

## Overview

This guide will help you set up Retell AI as an alternative to VAPI for your Even Hospital voice bot. Retell AI provides reliable voice AI agents with custom function calling capabilities.

## Prerequisites

1. **Retell AI Account**: Sign up at [https://retellai.com](https://retellai.com)
2. **Node.js Server**: Already running at `http://localhost:3001`
3. **Ngrok**: Running to expose your local server
4. **API Keys**: You'll need Retell AI API key

## Step 1: Get Your Retell AI API Key

1. Go to [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to **Settings** → **API Keys**
3. Create a new API key
4. Copy the API key

## Step 2: Create a Retell LLM

Before creating an agent, you need to create an LLM configuration:

1. In the Retell Dashboard, go to **LLMs**
2. Click **Create LLM**
3. Configure:
   - **Name**: "Even Hospital LLM"
   - **Model**: Select "GPT-4o" or "GPT-4"
   - **Temperature**: 0.7
   - **Max Tokens**: 1000

4. Save and copy the **LLM ID** (looks like `llm_xxxxx`)

## Step 3: Configure Environment Variables

Add these to your `config/.env` file:

```env
# Retell AI Configuration
RETELL_API_KEY=your_retell_api_key_here
RETELL_LLM_ID=your_llm_id_here
RETELL_AGENT_ID=will_be_generated
```

## Step 4: Create the Retell AI Agent

You have two options:

### Option A: Use the API Endpoint

1. Make sure your server is running (`npm start`)
2. Make a POST request to create the agent:

```bash
curl -X POST http://localhost:3001/api/retell/setup-agent
```

3. Copy the `agent_id` from the response
4. Add it to your `.env` file as `RETELL_AGENT_ID`

### Option B: Create Manually in Dashboard

1. Go to **Agents** → **Create Agent**
2. Configure:
   - **Name**: "Even Hospital Doctor Booking Assistant"
   - **LLM**: Select the LLM you created
   - **Voice**: Choose a voice (e.g., "11labs-Adrian")
   - **Language**: "en-US"

3. Add **Custom Functions**:

#### Function 1: find_doctor
```json
{
  "name": "find_doctor",
  "description": "Search for doctors based on patient symptoms or health condition. Call this immediately when patient mentions any symptoms.",
  "parameters": {
    "type": "object",
    "properties": {
      "symptoms": {
        "type": "string",
        "description": "Patient's symptoms or health concern"
      }
    },
    "required": ["symptoms"]
  }
}
```

#### Function 2: book_appointment
```json
{
  "name": "book_appointment",
  "description": "Book an appointment with a selected doctor",
  "parameters": {
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
}
```

#### Function 3: get_doctor_availability
```json
{
  "name": "get_doctor_availability",
  "description": "Check doctor's availability for appointments",
  "parameters": {
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
}
```

4. **Configure Webhook**:
   - Webhook URL: `https://your-ngrok-url.ngrok-free.dev/api/retell/webhook`
   - Get your ngrok URL by running: `curl http://localhost:4040/api/tunnels`

5. **General Prompt**: Paste the system prompt (see below)

6. **Begin Message**:
```
Hello! I'm the virtual assistant for Even Hospital Bangalore. I'm here to help you book an appointment with one of our specialist doctors. Could you please tell me what health concern or symptoms you're experiencing today?
```

7. Save the agent and copy the **Agent ID**

## Step 5: System Prompt

Use this system prompt when creating the agent:

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
3. DOCTOR RECOMMENDATION: Use the find_doctor function to get relevant specialists IMMEDIATELY when symptoms are mentioned
4. PRESENT OPTIONS: When you receive the function result, read out the 'result' field which contains formatted doctor information with names. ALWAYS mention doctor names clearly.
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
- ALWAYS call the find_doctor function when a patient mentions symptoms
- ALWAYS read doctor names from the function response
- Never diagnose or provide medical advice
- Always recommend seeing a doctor for symptoms
- If multiple doctors match, present options based on experience and patient preference
- Mention consultation fees transparently

Remember: You represent a preventive, people-first healthcare facility. Every interaction should reflect care, competence, and compassion.
```

## Step 6: Test the Voice Bot

1. **Start ngrok** (if not already running):
   ```bash
   ngrok http 3001
   ```

2. **Get ngrok URL**:
   ```bash
   curl http://localhost:4040/api/tunnels
   ```

3. **Update Retell Agent Webhook**:
   - Go to your agent settings in Retell Dashboard
   - Set webhook URL to: `https://your-ngrok-url.ngrok-free.dev/api/retell/webhook`

4. **Open the test page**:
   - Open `test-retell-ai.html` in your browser
   - Or navigate to the file location

5. **Start a call**:
   - Click "Start Voice Call"
   - Allow microphone access
   - Say: "I have knee pain"

6. **Expected Response**:
   The bot should respond with something like:
   > "I found 3 specialist doctors who can help with knee pain. First, Dr. Harish Puranik, an Orthopedic Surgeon with 17 years of experience. Second, Dr. Prashanth Nagaraj, also an Orthopedic Surgeon with 20 years of experience. And third, Dr. Mithun N Oswal, an Orthopedic Surgeon with 13 years of experience. Would you like to book an appointment with any of these doctors?"

## Step 7: Monitor and Debug

### Check Server Logs

Watch your terminal where `npm start` is running. You should see:

```
🔔 Retell Webhook request received
✓ Custom function call detected
  Function: find_doctor
🔍 Searching for: "knee pain"
✓ Found 3 doctors
✓ Message: I found 3 specialist doctors...
```

### Check ngrok Requests

Visit `http://localhost:4040` to see all requests going through ngrok.

### Common Issues

**Issue 1: "Failed to create web call"**
- Solution: Check that `RETELL_AGENT_ID` is set in your `.env` file

**Issue 2: "Function not called"**
- Solution: Make sure the webhook URL in Retell Dashboard is correct
- Check that ngrok is running and the URL matches

**Issue 3: "No doctor names in response"**
- Solution: The server is already configured to return doctor names prominently
- Check server logs to confirm the function is being called

## Step 8: Production Deployment

For production, you'll need to:

1. Deploy your server to a cloud provider (AWS, Heroku, etc.)
2. Get a permanent domain/URL
3. Update the webhook URL in Retell Dashboard
4. Set environment variables on your production server

## Comparison: Retell AI vs VAPI

| Feature | Retell AI | VAPI |
|---------|-----------|------|
| Latency | ~1 second | ~1-2 seconds |
| Function Calling | ✅ Reliable | ⚠️ Inconsistent (current issue) |
| Voice Quality | Excellent | Excellent |
| Setup Complexity | Medium | Medium |
| Pricing | Competitive | Competitive |
| Documentation | Good | Good |

## Support

- **Retell AI Docs**: https://docs.retellai.com
- **Retell AI Discord**: Join their community for support
- **Server Logs**: Check `npm start` terminal for detailed logs

## Summary

You now have Retell AI fully integrated with your Even Hospital voice bot! The key advantages:

✅ More reliable function calling
✅ Clear doctor name responses
✅ Better webhook handling
✅ Comprehensive logging

The voice bot will now properly call the `find_doctor` function and return doctor names when patients mention symptoms.
