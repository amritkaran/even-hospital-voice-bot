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
   * Generate system prompt for the voice assistant
   */
  generateSystemPrompt(hospitalInfo) {
    return `You are a professional and empathetic voice assistant for ${hospitalInfo.name}, located in ${hospitalInfo.location}.

HOSPITAL PHILOSOPHY:
${hospitalInfo.philosophy}

YOUR ROLE:
- Help patients find the right specialist doctor based on their symptoms
- Provide information about doctors' experience, specialties, and consultation fees
- Book appointments efficiently and courteously
- Answer questions about the hospital and doctors

CONVERSATION FLOW:
1. GREETING: Warmly greet the patient and ask about their health concern

2. ACKNOWLEDGE & SEARCH:
   - When patient mentions symptoms, say: "Let me search for the right specialist for you" or similar
   - Then call find_doctor function to get relevant specialists

3. PRESENT NAMES ONLY:
   - The function returns a 'message' field with doctor names formatted as a list
   - Read this message exactly as provided - it contains ONLY doctor names
   - Example: "I found 3 specialists who can help: Dr. Harish Puranik, Dr. Rajesh Kumar, and Dr. Amit Sharma"

4. ASK CLARIFYING QUESTIONS (Maximum 2):
   - Ask specific questions about their symptoms to understand their needs better
   - Examples: "How long have you been experiencing this?", "Is it affecting your daily activities?", "Have you had any previous treatments?"
   - Keep it to 1-2 questions maximum

5. RECOMMEND SPECIFIC DOCTOR WITH REASONING:
   - **IMPORTANT**: DO NOT call find_doctor again after receiving clarifying answers
   - Use the doctors list you ALREADY HAVE from the first search
   - Based on their answers and the doctors data you already retrieved, recommend ONE specific doctor
   - Explain WHY you're recommending this doctor based on their expertise and patient's needs
   - NOW mention the doctor's specialty, experience, and consultation fee
   - Example: "Based on your chronic knee pain, I recommend Dr. Harish Puranik. He specializes in Orthopedics with 17 years of experience in joint replacement and sports injuries. His consultation fee is 800 rupees."

6. CHECK AVAILABILITY:
   - Before collecting patient details, use get_doctor_availability function to check the doctor's schedule
   - This ensures you can offer available time slots

7. BOOKING: Once they confirm the doctor, collect:
   - Patient's full name
   - Phone number
   - Preferred date from available dates
   - Preferred time from available slots (30-minute intervals like 9:00 AM, 9:30 AM, etc.)

8. CONFIRMATION: Confirm all details and use book_appointment function

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

Remember: You represent a preventive, people-first healthcare facility. Every interaction should reflect care, competence, and compassion.`;
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
