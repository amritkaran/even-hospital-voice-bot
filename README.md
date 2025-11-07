# Even Hospital Voice Bot

AI-powered voice bot for doctor appointment booking at Even Hospital Bangalore, using RAG (Retrieval-Augmented Generation) for intelligent doctor recommendations based on patient symptoms.

## Features

- **Intelligent Doctor Matching**: Uses OpenAI embeddings and semantic search to match patient symptoms with specialist doctors
- **Voice Interface**: VAPI integration for natural voice conversations
- **RAG System**: 28 doctors across 12 specialties with comprehensive symptom-to-doctor mapping
- **Appointment Management**: Complete booking system with availability checking
- **Multi-language Support**: Doctors speak multiple languages (English, Hindi, Kannada, Tamil, etc.)
- **Transparent Pricing**: Clear consultation fees (₹700-₹1,000 range)

## Project Structure

```
Even Hospital/
├── config/
│   └── .env                          # Environment configuration
├── data/
│   ├── embeddings/
│   │   └── doctor_embeddings.json   # Generated embeddings
│   └── appointments.json             # Appointment database
├── src/
│   ├── services/
│   │   ├── embeddingService.js      # OpenAI embedding generation
│   │   ├── ragService.js            # RAG-based doctor search
│   │   ├── vapiService.js           # VAPI voice bot integration
│   │   └── appointmentService.js    # Appointment management
│   ├── utils/
│   │   ├── dataProcessor.js         # JSON document processing
│   │   └── generateEmbeddings.js    # Embedding generation script
│   └── index.js                      # Main server
├── package.json
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- OpenAI API key
- VAPI API key
- RAG document at: `C:\Users\AD\Desktop\Even Voice Bot\even_hospital_comprehensive_rag_document.json`

### 2. Installation

```bash
cd "C:\Users\AD\Desktop\Even Hospital"
npm install
```

### 3. Configuration

Edit `config/.env` and add your API keys:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-actual-openai-key

# VAPI API Configuration
VAPI_API_KEY=your-actual-vapi-key
VAPI_ASSISTANT_ID=your-vapi-assistant-id (optional, will be created)

# Other settings
PORT=3000
NODE_ENV=development
```

### 4. Generate Embeddings

Before running the server, generate embeddings from the RAG document:

```bash
npm run generate-embeddings
```

This will:
- Process the comprehensive hospital RAG document
- Extract 200+ embeddable chunks (doctors, conditions, symptoms, Q&A)
- Generate OpenAI embeddings
- Save to `data/embeddings/doctor_embeddings.json`

**Expected output:**
- Doctor profiles: 28
- Conditions: 40+
- Patient phrases: 150+
- Q&A pairs: 20+
- Specialties: 12

**Note:** This process will cost approximately $0.05-0.10 in OpenAI credits.

### 5. Test RAG System (Optional)

Test the doctor recommendation system:

```bash
npm run test-rag
```

This will run test queries like:
- "I have severe stomach pain"
- "My knee is painful and swollen"
- "I'm pregnant and need prenatal care"

### 6. Start the Server

```bash
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Doctor Search

**Search doctors by symptoms:**
```bash
POST /api/search-doctors
Content-Type: application/json

{
  "symptoms": "I have severe knee pain and swelling"
}
```

**Response:**
```json
{
  "success": true,
  "query": "I have severe knee pain and swelling",
  "results": {
    "doctors": [
      {
        "name": "Dr. Harish Puranik",
        "specialty": "Orthopedic Surgery",
        "experience": "17 years",
        "fee": "₹850-₹900",
        "languages": "English, Hindi, Kannada",
        "expertise": "Joint replacement, Arthroscopy, Sports medicine"
      }
    ]
  }
}
```

### Appointments

**Book appointment:**
```bash
POST /api/appointments/book
Content-Type: application/json

{
  "doctor_name": "Dr. Harish Puranik",
  "patient_name": "John Doe",
  "patient_phone": "+91-9876543210",
  "preferred_date": "2025-11-10",
  "preferred_time": "morning"
}
```

**Check availability:**
```bash
GET /api/appointments/availability/Dr. Harish Puranik?date=2025-11-10
```

**Get appointment:**
```bash
GET /api/appointments/APT12345678ABCD
```

**Cancel appointment:**
```bash
POST /api/appointments/APT12345678ABCD/cancel
Content-Type: application/json

{
  "reason": "Patient rescheduling"
}
```

## VAPI Integration

### Setup VAPI Assistant

1. **Create/Update Assistant:**
```bash
POST /api/vapi/setup-assistant
```

This will create a VAPI assistant with:
- GPT-4 powered conversation
- Custom system prompt for Even Hospital
- Function calling for doctor search and booking
- Professional voice (11labs)
- Natural conversation flow

2. **Configure Webhook:**

In your VAPI dashboard, set webhook URL to:
```
https://your-domain.com/api/vapi/webhook
```

3. **Test Voice Bot:**

The voice bot will:
- Greet patients warmly
- Ask about their symptoms
- Search for relevant doctors using RAG
- Present 2-3 doctor options with details
- Book appointments with availability checking
- Confirm booking details

### Conversation Flow

1. **Greeting**: "Hello! I'm the virtual assistant for Even Hospital..."
2. **Symptom Gathering**: "Could you tell me what symptoms you're experiencing?"
3. **Doctor Search**: Uses RAG to find relevant specialists
4. **Present Options**: Describes 2-3 doctors with experience, fees, languages
5. **Booking**: Collects name, phone, date, time preference
6. **Confirmation**: Provides appointment ID and details

## RAG System Details

### How It Works

1. **Document Processing**: Extracts 200+ chunks from hospital data
2. **Embedding Generation**: Creates semantic vectors using OpenAI
3. **Hybrid Search**: Combines semantic similarity + keyword matching
4. **Doctor Ranking**: Scores doctors by relevance to symptoms
5. **Context Enrichment**: Includes Q&A pairs and specialty info

### Supported Specialties

- General Surgery
- Orthopedic Surgery
- Pediatrics
- Gynecology & Obstetrics
- Cardiology (Non-Interventional)
- ENT (Ear, Nose & Throat)
- Internal Medicine
- Urology
- Dietetics & Nutrition
- Emergency Medicine
- Gastroenterology (Medical)
- Nephrology
- Psychiatry

### Example Symptom Mappings

- "Stomach pain" → General Surgery (Dr. K N Srikanth, Dr. Sunil Kumar V)
- "Knee pain" → Orthopedic Surgery (Dr. Harish Puranik, Dr. Prashanth Nagaraj)
- "Pregnancy care" → Gynecology (Dr. Rashmi Nagaraja Naik)
- "Child health" → Pediatrics (Dr. Sharil Hegde P)
- "Heart checkup" → Cardiology (Dr. Basavaraj Utagi)

## Appointment System

### Time Slots

- **Morning**: 9:00 AM - 12:00 PM (6 slots)
- **Afternoon**: 12:00 PM - 4:00 PM (8 slots)
- **Evening**: 4:00 PM - 7:00 PM (6 slots)

### Availability Rules

- Doctors unavailable on Sundays
- 30-minute appointment slots
- Automatic conflict detection
- Booking up to 7 days in advance

### Appointment States

- `confirmed`: Active appointment
- `cancelled`: Cancelled by patient/hospital

## Development

### Run in Development Mode

```bash
npm run dev
```

Uses `--watch` flag for auto-reload on file changes.

### Test Individual Services

```bash
# Test RAG service
npm run test-rag

# Generate embeddings
npm run generate-embeddings
```

## Cost Estimates

### OpenAI Costs

- **Embedding Generation** (one-time): ~$0.05-0.10
- **Doctor Search** (per query): ~$0.001
- **Monthly** (1000 searches): ~$1-2

### VAPI Costs

- Varies by usage
- Check VAPI pricing at https://vapi.ai/pricing

## Troubleshooting

### Embeddings Not Found

**Error**: "Cannot find embeddings file"

**Solution**: Run `npm run generate-embeddings` first

### OpenAI Rate Limits

**Error**: "Rate limit exceeded"

**Solution**: Add delays or use batch processing (already implemented)

### VAPI Webhook Not Working

**Error**: "Webhook not receiving calls"

**Solutions**:
- Ensure server is publicly accessible (use ngrok for testing)
- Check webhook URL in VAPI dashboard
- Verify VAPI API key in .env

### No Doctors Found

**Error**: "No relevant doctors found"

**Solutions**:
- Check embeddings were generated correctly
- Verify RAG document path is correct
- Test with known symptoms like "knee pain" or "stomach pain"

## Production Deployment

### Requirements

1. **Server**: Node.js 18+ hosting (AWS, Heroku, DigitalOcean)
2. **HTTPS**: Required for VAPI webhook
3. **Environment**: Set all .env variables
4. **Database**: Consider PostgreSQL for appointments in production

### Deployment Steps

1. Deploy to hosting platform
2. Set environment variables
3. Run `npm run generate-embeddings`
4. Start server with `npm start`
5. Update VAPI webhook URL
6. Test complete flow

### Security Considerations

- Store API keys securely (use secrets manager)
- Validate all input data
- Rate limit API endpoints
- Use HTTPS only
- Add authentication for admin endpoints
- Encrypt patient data

## Hospital Information

**Even Hospital Bangalore**
- Address: 29/2, Race Course Rd, Madhava Nagar, Gandhi Nagar, Bengaluru, Karnataka 560001
- Philosophy: Preventive, people-first approach to care
- Doctors: 28 specialists across 12 specialties
- Consultation Fees: ₹700-₹1,000

## Support

For issues or questions:
1. Check troubleshooting section
2. Review VAPI documentation: https://docs.vapi.ai
3. Review OpenAI documentation: https://platform.openai.com/docs

## License

MIT License

---

**Built with:**
- OpenAI GPT-4 & Embeddings
- VAPI Voice AI
- Node.js & Express
- Semantic Search & RAG
