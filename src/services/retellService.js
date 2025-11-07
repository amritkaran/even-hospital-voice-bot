import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../config/.env') });

/**
 * Retell AI Service
 * Handles integration with Retell AI for voice bot functionality
 */
class RetellService {
  constructor() {
    this.apiKey = process.env.RETELL_API_KEY;
    this.baseURL = 'https://api.retellai.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create or update Retell AI agent with Even Hospital configuration
   */
  async createAgent(ragService) {
    const hospitalInfo = ragService.dataProcessor.getHospitalInfo();

    const agentConfig = {
      agent_name: "Even Hospital Doctor Booking Assistant",
      voice_id: "11labs-Adrian", // You can change this to your preferred voice
      voice_model: "eleven_turbo_v2",
      language: "en-US",
      response_engine: {
        type: "retell-llm",
        llm_id: process.env.RETELL_LLM_ID // You'll need to create an LLM in Retell dashboard first
      },
      general_prompt: this.generateSystemPrompt(hospitalInfo),
      general_tools: [
        {
          type: "custom",
          name: "find_doctor",
          description: "Search for doctors based on patient symptoms or health condition. Call this immediately when patient mentions any symptoms.",
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
          type: "custom",
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
                description: "Preferred appointment time slot (morning/afternoon/evening)"
              }
            },
            required: ["doctor_name", "patient_name", "patient_phone", "preferred_date"]
          }
        },
        {
          type: "custom",
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
        }
      ],
      begin_message: `Hello! I'm the virtual assistant for ${hospitalInfo.name}. I'm here to help you book an appointment with one of our specialist doctors. Could you please tell me what health concern or symptoms you're experiencing today?`,
      end_call_after_silence_ms: 30000
    };

    try {
      const response = await this.client.post('/create-agent', agentConfig);
      console.log('✓ Retell AI Agent created successfully');
      console.log(`  Agent ID: ${response.data.agent_id}`);
      console.log('  Please add this ID to your .env file as RETELL_AGENT_ID');
      return response.data;
    } catch (error) {
      console.error('Error creating Retell AI agent:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update existing agent with custom functions
   */
  async updateAgentFunctions(agentId, ragService) {
    const hospitalInfo = ragService.dataProcessor.getHospitalInfo();

    const updateConfig = {
      general_prompt: this.generateSystemPrompt(hospitalInfo),
      general_tools: [
        {
          type: "custom",
          name: "find_doctor",
          description: "Search for doctors based on patient symptoms or health condition. Call this immediately when patient mentions any symptoms.",
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
          type: "custom",
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
                description: "Preferred appointment time slot (morning/afternoon/evening)"
              }
            },
            required: ["doctor_name", "patient_name", "patient_phone", "preferred_date"]
          }
        },
        {
          type: "custom",
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
        }
      ]
    };

    try {
      const response = await this.client.patch(`/update-agent/${agentId}`, updateConfig);
      console.log('✓ Retell AI Agent updated successfully');
      console.log(`  Agent ID: ${agentId}`);
      console.log('  Custom functions added: find_doctor, book_appointment, get_doctor_availability');
      return response.data;
    } catch (error) {
      console.error('Error updating Retell AI agent:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate system prompt for the voice assistant
   */
  generateSystemPrompt(hospitalInfo) {
    return `You are a voice assistant for ${hospitalInfo.name} (${hospitalInfo.location}).

GREETING:
"Hello! This is Even Hospital. How can I help you today?"

WORKFLOW:

1. Listen for Health Issue
   - When patient mentions a symptom/condition → immediately use find_doctor function
   - Present top 2-3 relevant doctors with:
     * Name & specialty (ALWAYS mention doctor names clearly)
     * Years of experience
     * Consultation fee
     * Key expertise

2. Timing & Selection
   - Ask: "When would you prefer the appointment?"
   - Based on their timing preference → recommend 1 doctor from your suggestions
   - Explain why this doctor fits their schedule/needs

3. Collect Details
   - "To confirm the booking, I'll need:"
     * Patient's full name
     * Phone number

4. Confirmation
   - Summarize: "[Doctor Name], [Date], [Time], [Fee]"
   - Use book_appointment function

COMMUNICATION RULES:
- Keep responses to 1-2 sentences
- No medical jargon
- Never diagnose - only recommend doctors
- Be warm but efficient
- ALWAYS read out doctor names from the function response

EDGE CASES:
- Unclear symptoms → ask one clarifying question, then search
- No exact match → handover to human receptionist
- Specific doctor requested → provide that doctor's info directly
- Urgent symptoms (severe pain/bleeding/breathing issues) → Sound urgent and say: "This needs immediate attention. I'm transferring you to our emergency ward right away."`;
  }

  /**
   * Handle custom function calls from Retell AI webhook
   */
  async handleFunctionCall(functionName, arguments_obj, ragService, appointmentService) {
    console.log(`\n🔧 Retell Function called: ${functionName}`);
    console.log('Arguments:', arguments_obj);

    try {
      let result;

      switch (functionName) {
        case 'find_doctor':
          result = await this.findDoctor(arguments_obj.symptoms, ragService);
          break;

        case 'book_appointment':
          result = await this.bookAppointment(arguments_obj, appointmentService);
          break;

        case 'get_doctor_availability':
          result = await this.getDoctorAvailability(arguments_obj, appointmentService);
          break;

        default:
          return { result: 'Unknown function' };
      }

      console.log('✓ Function result:', JSON.stringify(result, null, 2));

      // Retell expects the response in a specific format
      return {
        result: result.message || JSON.stringify(result)
      };
    } catch (error) {
      console.error(`❌ Error handling function ${functionName}:`, error);
      return {
        result: `I'm sorry, I encountered an error: ${error.message}`
      };
    }
  }

  /**
   * Find doctor based on symptoms
   */
  async findDoctor(symptoms, ragService) {
    console.log(`\n🔍 Searching for: "${symptoms}"`);

    try {
      const response = await ragService.generateVoiceBotResponse(symptoms);
      console.log(`✓ Found ${response.doctors.length} doctors`);

      // Format for voice bot
      const formattedDoctors = response.doctors.map(doc => ({
        name: doc.name,
        specialty: doc.specialty,
        experience: doc.experience,
        fee: doc.fee,
        languages: doc.languages,
        topExpertise: doc.expertise,
        whyRecommend: doc.recommendation
      }));

      // Create a detailed message with doctor names prominently mentioned
      let detailedMessage = '';
      if (formattedDoctors.length > 0) {
        detailedMessage = `I found ${formattedDoctors.length} specialist doctor${formattedDoctors.length > 1 ? 's' : ''} who can help with ${symptoms}. `;

        formattedDoctors.forEach((doc, index) => {
          if (index === 0) {
            detailedMessage += `First, Dr. ${doc.name}, a ${doc.specialty} with ${doc.experience} of experience. `;
          } else if (index === 1) {
            detailedMessage += `Second, Dr. ${doc.name}, also a ${doc.specialty} with ${doc.experience} of experience. `;
          } else if (index === 2) {
            detailedMessage += `And third, Dr. ${doc.name}, a ${doc.specialty} with ${doc.experience} of experience. `;
          }
        });

        detailedMessage += 'Would you like to book an appointment with any of these doctors?';
      } else {
        detailedMessage = "I couldn't find specific specialists for that condition. Let me recommend our general physicians.";
      }

      console.log(`✓ Message: ${detailedMessage}`);

      return {
        success: true,
        query: symptoms,
        doctorsFound: formattedDoctors.length,
        doctors: formattedDoctors,
        message: detailedMessage
      };
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

    return {
      success: true,
      doctor: parameters.doctor_name,
      date: parameters.date || 'next 7 days',
      availableSlots: availability,
      message: availability.length > 0
        ? `${parameters.doctor_name} is available during: ${availability.join(', ')}`
        : `${parameters.doctor_name} is fully booked for that date. Would you like to try another date?`
    };
  }

  /**
   * Register a phone number for inbound calls
   */
  async registerPhoneNumber(phoneNumber, agentId) {
    try {
      const response = await this.client.post('/register-phone-number', {
        phone_number: phoneNumber,
        agent_id: agentId
      });
      console.log('✓ Phone number registered successfully');
      return response.data;
    } catch (error) {
      console.error('Error registering phone number:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a phone call
   */
  async createPhoneCall(toNumber, fromNumber, agentId) {
    try {
      const response = await this.client.post('/create-phone-call', {
        from_number: fromNumber,
        to_number: toNumber,
        agent_id: agentId,
        retell_llm_dynamic_variables: {
          hospital_name: "Even Hospital Bangalore"
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
   * Create a web call
   */
  async createWebCall(agentId) {
    try {
      const response = await this.client.post('/v2/create-web-call', {
        agent_id: agentId
      });
      console.log('✓ Web call created');
      return response.data;
    } catch (error) {
      console.error('Error creating web call:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default RetellService;
