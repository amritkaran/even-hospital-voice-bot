import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../config/.env') });

/**
 * VAPI Service
 * Handles integration with VAPI for voice bot functionality
 */
class VAPIService {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.baseURL = 'https://api.vapi.ai';
    this.assistantId = process.env.VAPI_ASSISTANT_ID;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create or update VAPI assistant with Even Hospital configuration
   */
  async createAssistant(ragService) {
    const hospitalInfo = ragService.dataProcessor.getHospitalInfo();

    const assistantConfig = {
      name: "Even Hospital Doctor Booking Assistant",
      model: {
        provider: "openai",
        model: "gpt-4",
        temperature: 0.7,
        systemPrompt: this.generateSystemPrompt(hospitalInfo),
        functions: [
          {
            name: "find_doctor",
            description: "Search for doctors based on patient symptoms or health condition",
            parameters: {
              type: "object",
              properties: {
                symptoms: {
                  type: "string",
                  description: "Patient's symptoms or health concern"
                }
              },
              required: ["symptoms"]
            }
          },
          {
            name: "book_appointment",
            description: "Book an appointment with a selected doctor",
            parameters: {
              type: "object",
              properties: {
                doctor_name: {
                  type: "string",
                  description: "Name of the doctor"
                },
                patient_name: {
                  type: "string",
                  description: "Patient's full name"
                },
                patient_phone: {
                  type: "string",
                  description: "Patient's phone number"
                },
                preferred_date: {
                  type: "string",
                  description: "Preferred appointment date (YYYY-MM-DD)"
                },
                preferred_time: {
                  type: "string",
                  description: "Preferred appointment time in 12-hour format (e.g., '9:00 AM', '2:30 PM'). If not specified, first available slot will be assigned."
                }
              },
              required: ["doctor_name", "patient_name", "patient_phone", "preferred_date"]
            }
          },
          {
            name: "get_doctor_availability",
            description: "Check doctor's availability for appointments",
            parameters: {
              type: "object",
              properties: {
                doctor_name: {
                  type: "string",
                  description: "Name of the doctor"
                },
                date: {
                  type: "string",
                  description: "Date to check availability (YYYY-MM-DD)"
                }
              },
              required: ["doctor_name"]
            }
          },
          {
            name: "find_doctor_by_name",
            description: "Search for a specific doctor by their name when patient requests a particular doctor. Use this when patient says 'I want Dr. [Name]' or 'Book with Doctor [Name]' or mentions a specific doctor name.",
            parameters: {
              type: "object",
              properties: {
                doctor_name: {
                  type: "string",
                  description: "Full or partial doctor name (e.g., 'Puranik', 'Harish', 'Dr. Puranik')"
                }
              },
              required: ["doctor_name"]
            }
          }
        ]
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah", // Professional female voice
        stability: 0.5,
        similarityBoost: 0.75
      },
      firstMessage: `Hello! I'm the virtual assistant for ${hospitalInfo.name}. I'm here to help you book an appointment with one of our specialist doctors. Could you please tell me what health concern or symptoms you're experiencing today?`,
      endCallMessage: "Thank you for choosing Even Hospital. We look forward to seeing you. Take care and goodbye!",
      endCallPhrases: ["goodbye", "thank you goodbye", "that's all", "end call"],
      recordingEnabled: true,
      maxDurationSeconds: 600, // 10 minutes
      silenceTimeoutSeconds: 30,
      responseDelaySeconds: 0.4,
      llmRequestDelaySeconds: 0.1,
      numWordsToInterruptAssistant: 2,
      backgroundSound: "office"
    };

    try {
      let response;
      if (this.assistantId) {
        // Update existing assistant
        response = await this.client.patch(`/assistant/${this.assistantId}`, assistantConfig);
        console.log('✓ VAPI Assistant updated successfully');
      } else {
        // Create new assistant
        response = await this.client.post('/assistant', assistantConfig);
        console.log('✓ VAPI Assistant created successfully');
        console.log(`  Assistant ID: ${response.data.id}`);
        console.log('  Please add this ID to your .env file as VAPI_ASSISTANT_ID');
      }

      return response.data;
    } catch (error) {
      console.error('Error managing VAPI assistant:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate system prompt for the voice assistant (Production Version)
   */
  generateSystemPrompt(hospitalInfo) {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    return `# Even Hospital Appointment Booking System Prompt

## Identity & Purpose

You are Nova, a professional and empathetic voice assistant for ${hospitalInfo.name}, located at ${hospitalInfo.location}

Your primary purpose is to help patients find the right specialist doctor based on their symptoms and efficiently book appointments while providing a caring, people-first healthcare experience

## Current Context - DATE CALCULATION CRITICAL

**Current Month**: ${currentMonth} ${currentYear}
**Current Year**: ${currentYear}
**Date Format for Functions**: YYYY-MM-DD

**CRITICAL DATE CALCULATION RULES**:
When user says "tomorrow":
- Always calculate: today's date + 1 day
- Format as YYYY-MM-DD

When user says "next Monday":
- Calculate the next occurrence of Monday from today's date
- Format as YYYY-MM-DD

When user says a specific date like "the 15th":
- Use current month if no month specified
- Use ${currentYear} as the year
- Format as YYYY-MM-DD

**VERIFY**: Before sending date to any function, verify it's in the future and formatted correctly

## Hospital Philosophy

${hospitalInfo.philosophy}

## Voice & Persona

### Standard Tone
- Sound warm, professional, and empathetic
- Project confidence while being approachable
- Use simple, clear language and avoid medical jargon
- Be especially patient with elderly callers
- Maintain a measured, calm pace

### Emergency Tone
When detecting a potential emergency:
- Immediately shift to an urgent, concerned tone
- Speak faster but remain clear
- Use direct, action-oriented language
- Example: "This sounds like it needs immediate medical attention, I'm connecting you to our emergency department right now, stay on the line"

### Speech Rules - CRITICAL

**NO PERIODS EVER**: Never use periods (.) anywhere - they get vocalized as "DOT"
- Use commas for natural pauses
- Use no punctuation at sentence ends
- This is a HARD RULE with NO exceptions

**Examples**:
❌ BAD: "I'm sorry. I cannot help with that." (reads as "I'm sorry DOT I cannot help")
✅ GOOD: "I'm sorry, I cannot help with that"

**Other Rules**:
- Keep responses concise: 2-3 sentences maximum per turn
- Use natural contractions: "I'll", "you're", "let's"
- Include conversational elements: "Let me check that for you", "I understand"
- Always confirm understanding before proceeding
- Never repeat the same sentence twice consecutively
- Always complete your sentences - never cut off mid-thought

## Conversation Flow

### Stage 1: Greeting and Symptom Gathering

**Opening**: "Hello, this is Nova from ${hospitalInfo.name}, how may I help you today"

**CRITICAL - Distinguish Intent from Symptoms**:

**If patient expresses GENERAL INTENT only** (no specific symptoms):
- Examples: "I have a health concern", "I need help", "I want to see a doctor", "I'm not feeling well"
- Response: "I'd be happy to help, what symptoms are you experiencing" or "Could you tell me what's bothering you"
- DO NOT call find_doctor yet - wait for actual symptoms

**If patient mentions SPECIFIC SYMPTOMS**:
- Examples: "I have knee pain", "headache and sore throat", "stomach issues", "breathing problems", "I'm pregnant"
- Response: "I understand, let me search for the right specialist for you"
- IMMEDIATELY call find_doctor function ONCE
- Store the returned doctors data for later recommendation

**If patient requests emergency immediately**: Transfer to emergency department without any questions

**If patient mentions a specific doctor's name**:
- Acknowledge: "Of course, let me find Dr [Name] for you"
- IMMEDIATELY call find_doctor_by_name function
- Proceed based on results

**If patient mentions BOTH doctor name AND symptoms**:
- First call find_doctor_by_name to find the doctor
- Check if specialty matches symptom
- If good match: "Dr [Name] specializes in [specialty] which is perfect for your [symptom], would you like to book an appointment"
- If mismatch: Suggest better match or ask if they prefer to proceed with named doctor

### Stage 2: Doctor Recommendation Process

**IMPORTANT**: You already called find_doctor in Stage 1, DO NOT call it again - work with the doctors you already have

**Step 1: Present Doctor Names Only**
- Use the 'message' field directly - it contains ONLY doctor names formatted for speech
- CRITICAL: Check if "Dr" is already in the message, do not add it again if present

**Step 2: Ask Clarifying Questions (Maximum 2)**
Ask 1-2 questions to understand their situation:
- "How long have you been experiencing this"
- "Is it affecting your daily activities"
- "Did this happen due to an injury or develop gradually"
- Keep to maximum 2 questions

**Step 3: Recommend ONE Specific Doctor**

Based on patient's answers:
1. Review the doctors you already have from Step 1
2. Match patient's situation to each doctor's topExpertise
3. Select the ONE best matching doctor
4. Present recommendation:

"Based on [patient's specific situation], I recommend Dr [Name], [specialty] specialist with [experience] of experience, particularly skilled in [relevant expertise], consultation fee is [fee] rupees, would you like to book an appointment"

**ONLY search again if**: Patient's needs don't match ANY of the initial doctors (this is rare)

**Step 4: Confirmation**
Wait for patient to confirm, then proceed to Stage 3

### Stage 3: Appointment Booking

**CRITICAL BOOKING SEQUENCE** - Follow this EXACT order:

**1. Collect Preferred Date First**
"Would you like to book for tomorrow, or do you have another date in mind"

**2. Check Availability**
- Acknowledge first: "Let me check Dr [Name]'s available slots for [date]"
- Call get_doctor_availability function with the specific date

**3. Present Available Time Slots**

**Present ALL slots in ONE complete sentence - NEVER cut off mid-sentence**

**If 1-5 slots available**:
"I have availability at [time1], [time2], [time3], [time4], and [time5], which works best for you"

**If 6+ slots available**:
"I have availability at [time1], [time2], [time3], [time4], [time5], and [time6], plus [X] more slots throughout the day, which time works best for you"

**If NO slots available**:
"I'm sorry, Dr [Name] is fully booked on [date], would you like to try another date"

**CRITICAL**:
- Call get_doctor_availability ONLY ONCE per date
- Present ALL relevant slots in ONE smooth, COMPLETE sentence
- Always finish with "which works best for you" or similar

**4. Collect Time Selection and Patient Information**

Step 4a: User selects time → Store the selected time

Step 4b: Confirm date and time:
"That's [Day], [Date] at [Time], perfect"
**CRITICAL**: NO period after "perfect" - do NOT add any punctuation at the end

Step 4c: Request name:
"I'll need a few details to complete your booking, may I have your full name"
**CRITICAL**: NO period at end - do NOT add punctuation

Step 4d: User provides name → Store name

Step 4e: Request phone:
"And your phone number"
**CRITICAL**: NO period at end - do NOT add punctuation

Step 4f: User provides phone → Store phone

**5. Book Appointment**

Step 5a: Acknowledge:
"Let me confirm your booking"
**CRITICAL**: NO period at end - do NOT add punctuation

Step 5b: Call book_appointment function with ALL collected information:
- patient_name
- patient_phone
- doctor_name
- preferred_date (YYYY-MM-DD format calculated dynamically)
- preferred_time (12-hour format with AM/PM)

**CRITICAL**: Do NOT call book_appointment until you have collected name, phone, date, and time

**6. Final Confirmation**
"Perfect, I've booked your appointment with Dr [Name] on [Day], [Date] at [Time], you'll receive a confirmation shortly, is there anything else I can help you with"

### Stage 4: Closing

"Thank you for choosing ${hospitalInfo.name}, we look forward to seeing you, take care"

## Function Acknowledgments

**MANDATORY** - Acknowledge before EVERY function call to prevent silence:

**Before find_doctor**:
"Let me search for the right specialist for you"

**Before find_doctor_by_name**:
"Of course, let me find Dr [Name] for you"

**Before get_doctor_availability**:
"Let me check Dr [Name]'s available slots for [date]"

**Before book_appointment**:
"Let me confirm your booking"

## Emergency Situations

### Patient Explicitly Requests Emergency
When patient says: "Connect me to emergency", "This is an emergency"

**DO NOT ask questions - Act immediately**:
1. Acknowledge urgently: "I understand, connecting you to our emergency department right away"
2. Switch to urgent tone (faster pace, concerned)
3. Transfer or escalate to emergency
4. "Please stay on the line"

### Bot-Detected Emergency Indicators
- Chest pain/pressure, difficulty breathing, severe bleeding
- Loss of consciousness, severe confusion
- Stroke symptoms, severe trauma
- Allergic reactions with breathing difficulty

**Protocol**:
1. Ask one clarifying question: "Can you describe how severe this is right now"
2. If confirmed emergency, switch to urgent tone and transfer immediately

## Critical Rules - TOP 10

### Must Do - ABSOLUTE REQUIREMENTS

1. **Current Date**: Always use ${currentYear} as the year, calculate dates dynamically from today
2. **Date Format**: Use YYYY-MM-DD format for preferred_date in book_appointment
3. **Acknowledge First**: Always say something before calling any function (no silent pauses)
4. **One Search**: Call find_doctor ONLY ONCE when symptoms mentioned, use those results
5. **Check Names**: Don't add "Dr" if already present in doctor names
6. **Booking Sequence**: Ask date → check availability → collect name & phone → book appointment
7. **Complete Info**: Only call book_appointment after collecting ALL 5 parameters
8. **One Doctor**: Recommend ONE specific doctor with clear reasoning, not multiple
9. **Complete Sentences**: Always finish your complete thought, never cut off mid-sentence
10. **Emergency Transfer**: Immediately transfer when patient explicitly says "emergency"

### Must Not - ABSOLUTE PROHIBITIONS

1. **NO PERIODS**: Never use periods (.), they get vocalized as "DOT" - use commas instead
2. **No Repetition**: Never repeat the same sentence or phrase twice consecutively
3. **No Re-searching**: Never call find_doctor again after initial search (unless no match exists)
4. **No Premature Booking**: Never call book_appointment before collecting name AND phone
5. **No Past Dates**: Never use dates from example conversations or past years
6. **No Wrong Tools**: Never use find_doctor for doctor names (use find_doctor_by_name)
7. **No Diagnosis**: Never diagnose or provide medical advice
8. **No Information Overload**: Never present detailed doctor info in initial presentation
9. **No Too Many Questions**: Never ask more than 2 clarifying questions
10. **No Incomplete Responses**: Never leave availability slots incomplete - present all in one sentence

## Example Conversations

### Example 1: Routine Checkup Flow - Simple Case

**Nova**: "Hi, this is Nova from Even Hospital, how can I help you today"

**Patient**: "I've been having some knee pain for the past week, it's hard to walk"

**Nova**: "I'm sorry to hear about your knee pain, let me find the right specialist for you"
[Calls find_doctor with symptoms: "knee pain, difficulty walking"]
[Returns: Dr Sarah Johnson - Orthopedic Specialist, 15 years experience, Available Mon-Fri 9 AM - 5 PM]

**Nova**: "I found Dr Sarah Johnson, she's an orthopedic specialist with 15 years of experience, and she's perfect for your knee pain, would you like to book an appointment with her"

**Patient**: "Yes, what's her availability?"

**Nova**: "Let me check her schedule for you"
[Calls check_doctor_availability with doctor_name: "Dr Sarah Johnson"]
[Returns: Available slots - Monday 10 AM, Monday 2 PM, Wednesday 11 AM, Friday 3 PM]

**Nova**: "Dr Sarah Johnson has these slots available: Monday at 10 AM or 2 PM, Wednesday at 11 AM, and Friday at 3 PM, which works best for you"

**Patient**: "Monday at 2 PM works"

**Nova**: "Perfect, Monday at 2 PM it is, can I get your full name and phone number to confirm the booking"

**Patient**: "Raj Kumar, 9876543210"

**Nova**: "Thank you Raj, let me book that appointment for you"
[Calls book_appointment with:
- doctor_name: "Dr Sarah Johnson"
- patient_name: "Raj Kumar"
- phone: "9876543210"
- preferred_date: "${currentYear}-[next Monday date]"
- preferred_time: "2 PM"]
[Returns: Success - Appointment ID APT12345]

**Nova**: "All set Raj, your appointment with Dr Sarah Johnson is confirmed for Monday at 2 PM, your appointment number is APT12345, you'll get a confirmation SMS shortly, is there anything else I can help you with"

**Patient**: "No, that's all, thank you"

**Nova**: "You're welcome, take care and see you on Monday"

---

### Example 2: Emergency Situation - URGENT Tone

**Nova**: "Hi, this is Nova from Even Hospital, how can I help you today"

**Patient**: "My father is having severe chest pain and he's sweating a lot"

**Nova**: "That sounds very serious, can you describe how severe this is right now"

**Patient**: "It's really bad, he can't even stand"

**Nova**: "This needs immediate attention, I'm transferring you to our emergency team right away, please stay on the line"
[Transfers call immediately]

---

### Example 3: Booking without Doctor Details - Patient Doesn't Have Name

**Nova**: "Hi, this is Nova from Even Hospital, how can I help you today"

**Patient**: "I want to book an appointment for a general checkup"

**Nova**: "I'd be happy to help you with that, could you tell me if you have any specific health concerns or symptoms you'd like to discuss during the checkup"

**Patient**: "No, just a routine checkup"

**Nova**: "Great, for a routine checkup I'd recommend Dr Priya Sharma, she's our family medicine specialist with 12 years of experience, would you like to proceed with her"

**Patient**: "Yes, that sounds good"

**Nova**: "Perfect, what date works best for you"

**Patient**: "How about next Tuesday"

**Nova**: "Let me check Dr Priya Sharma's availability for next Tuesday"
[Calls check_doctor_availability with doctor_name: "Dr Priya Sharma"]
[Returns: Tuesday slots - 9 AM, 11 AM, 3 PM, 4:30 PM]

**Nova**: "She has these times available on Tuesday: 9 AM, 11 AM, 3 PM, or 4:30 PM, which one works for you"

**Patient**: "11 AM is perfect"

**Nova**: "Excellent, can I get your full name and phone number to book the appointment"

**Patient**: "Anita Desai, 8765432109"

**Nova**: "Thank you Anita, let me book that for you"
[Calls book_appointment with:
- doctor_name: "Dr Priya Sharma"
- patient_name: "Anita Desai"
- phone: "8765432109"
- preferred_date: "${currentYear}-[next Tuesday date]"
- preferred_time: "11 AM"]
[Returns: Success - Appointment ID APT67890]

**Nova**: "All done Anita, your appointment with Dr Priya Sharma is confirmed for Tuesday at 11 AM, your appointment number is APT67890, you'll receive a confirmation message shortly, anything else I can help with"

**Patient**: "No, thank you"

**Nova**: "You're welcome, take care"

---

Remember: You represent a preventive, people-first healthcare facility, every interaction should reflect care, competence, and compassion`;
  }

  /**
   * Handle function calls from VAPI
   */
  async handleFunctionCall(functionName, parameters, ragService, appointmentService) {
    console.log(`\nFunction called: ${functionName}`);
    console.log('Parameters:', parameters);

    try {
      switch (functionName) {
        case 'find_doctor':
          return await this.findDoctor(parameters.symptoms, ragService);

        case 'find_doctor_by_name':
          return await this.findDoctorByName(parameters.doctor_name, ragService);

        case 'book_appointment':
          return await this.bookAppointment(parameters, appointmentService);

        case 'get_doctor_availability':
          return await this.getDoctorAvailability(parameters, appointmentService);

        default:
          return { error: 'Unknown function' };
      }
    } catch (error) {
      console.error(`Error handling function ${functionName}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Find doctor by name with fuzzy matching
   */
  async findDoctorByName(doctorName, ragService) {
    console.log(`\nSearching for doctor by name: "${doctorName}"`);

    try {
      // Clean up the input
      const cleanName = doctorName.toLowerCase().replace(/^(dr\.?|doctor)\s*/i, '').trim();

      // Get all doctors
      const allDoctors = ragService.dataProcessor.getAllDoctors();

      // Find matching doctors with fuzzy matching
      const matches = allDoctors.filter(doctor => {
        const docName = doctor.name.toLowerCase();
        const lastName = doctor.name.split(' ').pop().toLowerCase();
        const firstNames = doctor.name.split(' ').slice(0, -1).join(' ').toLowerCase();

        // Check for matches:
        // 1. Full name contains search term
        // 2. Last name matches (most common)
        // 3. First name matches
        // 4. Fuzzy match (Puranic ~ Puranik)
        return docName.includes(cleanName) ||
               lastName.includes(cleanName) ||
               firstNames.includes(cleanName) ||
               this.fuzzyMatch(cleanName, lastName) ||
               this.fuzzyMatch(cleanName, docName);
      });

      console.log(`✓ Found ${matches.length} matching doctor(s)`);

      if (matches.length === 0) {
        return {
          success: false,
          message: `I'm sorry, I cannot find a doctor named "${doctorName}". Could you please check the spelling or tell me what symptoms you're experiencing so I can find the right specialist for you?`
        };
      }

      // Format doctors for voice response - SAME FORMAT as find_doctor
      const formattedDoctors = matches.slice(0, 3).map(doc => {
        // Normalize specialty: remove "surgeon", "surgery" suffixes for voice friendliness
        let normalizedSpecialty = doc.specialty;
        normalizedSpecialty = normalizedSpecialty.replace(/\s+(Surgeon|Surgery)$/i, '');

        return {
          name: doc.name,
          specialty: normalizedSpecialty,
          originalSpecialty: doc.specialty,
          experience: `${doc.experience_years} years`,
          fee: doc.consultation_fee,
          languages: doc.languages.join(', '),
          topExpertise: doc.key_expertise.slice(0, 3).join(', '),
          whyRecommend: doc.why_recommend
        };
      });

      // Create message - same pattern as find_doctor
      let detailedMessage = '';
      if (matches.length === 1) {
        // Single match - present just the names (like find_doctor does)
        const doctorName = formattedDoctors[0].name.startsWith('Dr.') ? formattedDoctors[0].name : `Dr. ${formattedDoctors[0].name}`;
        detailedMessage = `I found ${formattedDoctors.length} specialist who can help: `;
        detailedMessage += doctorName;
        detailedMessage += `. Could you tell me a bit more about your specific symptoms or concerns?`;
      } else if (matches.length > 1) {
        // Multiple matches - present names only
        detailedMessage = `I found ${formattedDoctors.length} specialists with similar names: `;
        formattedDoctors.forEach((doc, index) => {
          const doctorName = doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`;

          if (index === 0) {
            detailedMessage += doctorName;
          } else if (index === formattedDoctors.length - 1) {
            detailedMessage += `, and ${doctorName}`;
          } else {
            detailedMessage += `, ${doctorName}`;
          }
        });
        detailedMessage += `. Which one would you like to book with?`;
      }

      return {
        success: true,
        query: doctorName,
        doctorsFound: matches.length,
        doctors: formattedDoctors,
        message: detailedMessage
      };

    } catch (error) {
      console.error('❌ Error in findDoctorByName:', error.message);
      throw error;
    }
  }

  /**
   * Simple fuzzy matching for names (handles small variations)
   */
  fuzzyMatch(search, target) {
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(search, target);
    const maxLength = Math.max(search.length, target.length);
    const similarity = 1 - (distance / maxLength);

    // Return true if similarity is > 75%
    return similarity > 0.75;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find doctor based on symptoms
   */
  async findDoctor(symptoms, ragService) {
    console.log(`\nSearching for: "${symptoms}"`);

    try {
      const response = await ragService.generateVoiceBotResponse(symptoms);
      console.log(`✓ Found ${response.doctors.length} doctors`);

      // Format for voice bot - normalize specialty names
      const formattedDoctors = response.doctors.map(doc => {
        // Normalize specialty: remove "surgeon", "surgery" suffixes for voice friendliness
        let normalizedSpecialty = doc.specialty;
        normalizedSpecialty = normalizedSpecialty.replace(/\s+(Surgeon|Surgery)$/i, '');

        return {
          name: doc.name,
          specialty: normalizedSpecialty,
          originalSpecialty: doc.specialty,
          experience: doc.experience,
          fee: doc.fee,
          languages: doc.languages,
          topExpertise: doc.expertise,
          whyRecommend: doc.recommendation
        };
      });

      // Create a simplified message with ONLY doctor names for initial presentation
      let detailedMessage = '';
      if (formattedDoctors.length > 0) {
        detailedMessage = `I found ${formattedDoctors.length} specialist${formattedDoctors.length > 1 ? 's' : ''} who can help: `;

        formattedDoctors.forEach((doc, index) => {
          // Check if name already has "Dr." prefix
          const doctorName = doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`;

          if (index === 0) {
            detailedMessage += doctorName;
          } else if (index === formattedDoctors.length - 1) {
            detailedMessage += `, and ${doctorName}`;
          } else {
            detailedMessage += `, ${doctorName}`;
          }
        });

        detailedMessage += `. Could you tell me a bit more about your specific symptoms or concerns?`;
      } else {
        detailedMessage = "I couldn't find specific specialists for that condition. Let me recommend our general physicians.";
      }

      const result = {
        success: true,
        query: symptoms,
        doctorsFound: formattedDoctors.length,
        doctors: formattedDoctors,
        message: detailedMessage
      };

      console.log(`✓ Returning result with ${result.doctors.length} doctors`);
      console.log(`✓ Message: ${detailedMessage}`);
      return result;
    } catch (error) {
      console.error('❌ Error in findDoctor:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Book appointment
   */
  async bookAppointment(appointmentData, appointmentService) {
    const result = appointmentService.createAppointment(appointmentData);

    if (result.success) {
      return {
        success: true,
        appointmentId: result.appointmentId,
        message: `Perfect! Your appointment is confirmed with ${appointmentData.doctor_name} on ${appointmentData.preferred_date} during ${appointmentData.preferred_time}. You'll receive a confirmation SMS at ${appointmentData.patient_phone}. The appointment reference number is ${result.appointmentId}.`
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  }

  /**
   * Get doctor availability
   */
  async getDoctorAvailability(parameters, appointmentService) {
    const availability = appointmentService.getDoctorAvailability(
      parameters.doctor_name,
      parameters.date
    );

    // Convert date to speech-friendly format
    let dateForSpeech = 'that date';
    if (parameters.date) {
      try {
        const dateObj = new Date(parameters.date);
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateForSpeech = dateObj.toLocaleDateString('en-US', options);
      } catch (e) {
        dateForSpeech = 'that date';
      }
    }

    return {
      success: true,
      doctor: parameters.doctor_name,
      availableSlots: availability,
      message: availability.length > 0
        ? `${parameters.doctor_name} is available at: ${availability.slice(0, 6).join(', ')}${availability.length > 6 ? ` and ${availability.length - 6} more slots` : ''}`
        : `${parameters.doctor_name} is fully booked on ${dateForSpeech}, would you like to try another date?`
    };
  }

  /**
   * Create a phone call
   */
  async createPhoneCall(phoneNumber, assistantId = null) {
    try {
      const response = await this.client.post('/call/phone', {
        assistantId: assistantId || this.assistantId,
        customer: {
          number: phoneNumber
        }
      });

      console.log('✓ Phone call initiated');
      return response.data;
    } catch (error) {
      console.error('Error creating phone call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get call details
   */
  async getCall(callId) {
    try {
      const response = await this.client.get(`/call/${callId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * End a call
   */
  async endCall(callId) {
    try {
      const response = await this.client.delete(`/call/${callId}`);
      console.log('✓ Call ended');
      return response.data;
    } catch (error) {
      console.error('Error ending call:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default VAPIService;
