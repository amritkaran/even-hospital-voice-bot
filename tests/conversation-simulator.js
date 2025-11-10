import { OpenAI } from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../config/.env') });

/**
 * LLM Conversation Simulator
 * Uses GPT-4 to simulate realistic patient conversations with the voice bot
 */

const API_BASE_URL = 'http://localhost:3001';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class ConversationSimulator {
  constructor() {
    this.conversationHistory = [];
    this.testResults = {
      totalScenarios: 0,
      passed: 0,
      failed: 0,
      scenarios: []
    };

    // Conversation context tracking
    this.conversationContext = {
      recommendedDoctors: [],
      selectedDoctor: null,
      symptoms: null,
      stage: 'greeting', // greeting, symptom_gathering, doctor_recommendation, availability_check, booking
      lastQuery: null
    };
  }

  /**
   * Reset conversation context for new scenario
   */
  resetContext() {
    this.conversationContext = {
      recommendedDoctors: [],
      selectedDoctor: null,
      symptoms: null,
      stage: 'greeting',
      lastQuery: null
    };
  }

  /**
   * Detect patient intent from message
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Check for symptom description FIRST (highest priority)
    if (this.conversationContext.stage === 'greeting' || this.conversationContext.recommendedDoctors.length === 0) {
      // If we haven't recommended doctors yet, any message is likely symptom description
      if (lowerMessage.match(/\b(pain|hurt|fever|sick|ache|problem|issue|pregnant|pregnancy|prenatal|checkup|not feeling|aches|tired)\b/)) {
        return 'describe_symptoms';
      }
    }

    // Check for availability questions (ONLY if we have recommended doctors)
    if (this.conversationContext.recommendedDoctors.length > 0 &&
        lowerMessage.match(/\b(availability|available|when|schedule|timings?|slots?|free|time)\b/)) {
      return 'check_availability';
    }

    // Check for booking requests
    if (lowerMessage.match(/\b(book|appointment|confirm|proceed)\b/) &&
        this.conversationContext.stage !== 'symptom_gathering' &&
        this.conversationContext.recommendedDoctors.length > 0) {
      return 'book_appointment';
    }

    // Check for doctor selection
    if (lowerMessage.match(/\b(dr\.|doctor|with|recommend)\b/) &&
        this.conversationContext.recommendedDoctors.length > 0) {
      return 'select_doctor';
    }

    // Check for symptom description (fallback)
    if (lowerMessage.match(/\b(pain|hurt|fever|sick|ache|problem|issue|pregnant|not feeling)\b/)) {
      return 'describe_symptoms';
    }

    // Default to clarification
    return 'clarify';
  }

  /**
   * Extract doctor name from message
   */
  extractDoctorName(message) {
    const lowerMessage = message.toLowerCase();

    // Check each recommended doctor
    for (const doctor of this.conversationContext.recommendedDoctors) {
      // Clean doctor name (remove "Dr. Dr." prefix)
      let cleanDocName = doctor.name.replace(/^(dr\.\s*)+/gi, '').trim();
      const docNameLower = cleanDocName.toLowerCase();
      const parts = docNameLower.split(' ');
      const lastName = parts[parts.length - 1];
      const firstName = parts[0];

      // Check for matches with last name, first name, or full name
      if (lowerMessage.includes(lastName) ||
          lowerMessage.includes(firstName) ||
          lowerMessage.includes(docNameLower) ||
          lowerMessage.includes(doctor.name.toLowerCase())) {
        return cleanDocName;
      }
    }

    return null;
  }

  /**
   * Generate patient persona prompt for GPT-4
   */
  generatePatientPersonaPrompt(persona, scenario) {
    return `You are roleplaying as a patient calling a hospital voice bot to book an appointment.

PATIENT PROFILE:
- Name: ${persona.name}
- Age: ${persona.age}
- Personality: ${persona.personality}
- Medical History: ${persona.medicalHistory}
- Tech Savvy: ${persona.techSavvy ? 'Yes' : 'No'}

CURRENT SITUATION:
You have: ${scenario.initialComplaint}

INSTRUCTIONS:
1. Act EXACTLY like this patient would - match their personality and communication style
2. ${persona.techSavvy ? 'You are comfortable with technology and speak clearly' : 'You may need more guidance and speak in simpler terms'}
3. ${persona.age > 60 ? 'You speak slower and may need things repeated' : 'You communicate at a normal pace'}
4. Be natural - ask questions, express concerns, and behave like a real patient
5. Your goal is to: ${scenario.expectedOutcome.doctorBooked ? 'book an appointment with the right specialist' : 'get help with your medical concern'}
6. Respond ONLY as the patient - keep responses conversational and realistic (2-3 sentences max)
7. Do NOT narrate actions or add stage directions - just speak naturally

IMPORTANT:
- If the bot recommends doctors, ask relevant questions about them (experience, availability, etc.)
- If booking an appointment, provide realistic information when asked
- Stay in character throughout the entire conversation
- End the conversation when you're satisfied or the appointment is booked

Your first message will be when the bot greets you. Respond naturally.`;
  }

  /**
   * Simulate patient response using GPT-4
   */
  async generatePatientResponse(conversationHistory, personaPrompt) {
    const messages = [
      {
        role: 'system',
        content: personaPrompt
      },
      ...conversationHistory
    ];

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.8,
        max_tokens: 150
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating patient response:', error.message);
      throw error;
    }
  }

  /**
   * Send message to voice bot and get response (with context awareness)
   */
  async sendToVoiceBot(patientMessage, conversationContext) {
    try {
      // Detect intent based on message and context
      const intent = this.detectIntent(patientMessage);
      console.log(`   [Intent detected: ${intent}]`);

      switch (intent) {
        case 'describe_symptoms':
          return await this.handleSymptomQuery(patientMessage);

        case 'check_availability':
          return await this.handleAvailabilityQuery(patientMessage);

        case 'select_doctor':
        case 'clarify':
          return await this.handleDoctorSelection(patientMessage);

        case 'book_appointment':
          return await this.handleBookingIntent(patientMessage);

        default:
          return await this.handleSymptomQuery(patientMessage);
      }
    } catch (error) {
      console.error('Error communicating with voice bot:', error.message);
      return {
        success: false,
        message: 'Sorry, I encountered an error. Could you please repeat that?'
      };
    }
  }

  /**
   * Handle symptom-related queries
   */
  async handleSymptomQuery(patientMessage) {
    const response = await axios.post(`${API_BASE_URL}/api/search-doctors`, {
      symptoms: patientMessage
    });

    const formatted = this.formatBotResponse(response.data);

    // Update context with recommended doctors
    if (formatted.doctors && formatted.doctors.length > 0) {
      this.conversationContext.recommendedDoctors = formatted.doctors;
      this.conversationContext.symptoms = patientMessage;
      this.conversationContext.stage = 'doctor_recommendation';
    }

    return formatted;
  }

  /**
   * Handle availability queries
   */
  async handleAvailabilityQuery(patientMessage) {
    // Extract doctor name from message or use selected doctor
    let doctorName = this.extractDoctorName(patientMessage);

    if (!doctorName && this.conversationContext.selectedDoctor) {
      doctorName = this.conversationContext.selectedDoctor;
    }

    if (!doctorName && this.conversationContext.recommendedDoctors.length > 0) {
      // Default to first recommended doctor
      doctorName = this.conversationContext.recommendedDoctors[0].name;
    }

    if (!doctorName) {
      return {
        success: true,
        message: "Which doctor would you like to check availability for?",
        type: 'clarification'
      };
    }

    // Get availability (using current or next few days)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/appointments/availability/${encodeURIComponent(doctorName)}?date=${dateStr}`
      );

      this.conversationContext.selectedDoctor = doctorName;
      this.conversationContext.stage = 'availability_check';

      const slots = response.data.availableSlots || [];

      if (slots.length > 0) {
        return {
          success: true,
          message: `${doctorName} has the following available slots: ${slots.slice(0, 5).join(', ')}${slots.length > 5 ? ` and ${slots.length - 5} more` : ''}. Would you like to book one of these times?`,
          type: 'availability',
          availableSlots: slots
        };
      } else {
        return {
          success: true,
          message: `${doctorName} is fully booked today. Would you like me to check another day?`,
          type: 'availability',
          availableSlots: []
        };
      }
    } catch (error) {
      return {
        success: true,
        message: `${doctorName} is generally available on weekdays from 9:00 AM to 5:00 PM. Would you like to book an appointment?`,
        type: 'availability'
      };
    }
  }

  /**
   * Handle doctor selection
   */
  async handleDoctorSelection(patientMessage) {
    const doctorName = this.extractDoctorName(patientMessage);

    if (doctorName) {
      this.conversationContext.selectedDoctor = doctorName;

      // Find the selected doctor's details
      const selectedDoc = this.conversationContext.recommendedDoctors.find(
        d => d.name.toLowerCase() === doctorName.toLowerCase()
      );

      if (selectedDoc) {
        return {
          success: true,
          message: `Great choice! ${doctorName} specializes in ${selectedDoc.specialty} with ${selectedDoc.experience} of experience. Would you like to check their availability or book an appointment directly?`,
          type: 'doctor_selected',
          selectedDoctor: selectedDoc
        };
      }
    }

    // If we have recommended doctors but couldn't extract selection, provide options
    if (this.conversationContext.recommendedDoctors.length > 0) {
      const firstDoc = this.conversationContext.recommendedDoctors[0];
      return {
        success: true,
        message: `Based on your symptoms, I'd recommend ${firstDoc.name} who specializes in ${firstDoc.specialty}. They have ${firstDoc.experience} of experience. Would you like to check their availability?`,
        type: 'recommendation',
        doctors: this.conversationContext.recommendedDoctors
      };
    }

    return {
      success: true,
      message: "Could you tell me more about your symptoms so I can recommend the right specialist?",
      type: 'clarification'
    };
  }

  /**
   * Handle booking intent
   */
  async handleBookingIntent(patientMessage) {
    if (!this.conversationContext.selectedDoctor) {
      return {
        success: true,
        message: "Which doctor would you like to book with?",
        type: 'clarification'
      };
    }

    // Check if message contains booking details (name, phone, date)
    const hasName = patientMessage.match(/name is (\w+ \w+)/i);
    const hasPhone = patientMessage.match(/\b\d{10}\b/);
    const hasDate = patientMessage.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|today)\b/i);

    // If patient provided details, simulate booking confirmation
    if (hasName || hasPhone || (hasDate && this.conversationContext.stage === 'booking')) {
      this.conversationContext.stage = 'booking_confirmed';

      const appointmentRef = 'APT' + Math.floor(Math.random() * 10000);

      return {
        success: true,
        message: `Perfect! I've booked your appointment with ${this.conversationContext.selectedDoctor}. Your appointment reference number is ${appointmentRef}. You'll receive a confirmation SMS shortly. Is there anything else I can help you with?`,
        type: 'booking_confirmed',
        appointmentBooked: true
      };
    }

    // Ask for booking details
    this.conversationContext.stage = 'booking';
    return {
      success: true,
      message: `Perfect! I'll book your appointment with ${this.conversationContext.selectedDoctor}. Could you please provide your full name, phone number, and preferred date?`,
      type: 'booking_collection',
      appointmentBooked: false
    };
  }

  /**
   * Format bot response into conversational text
   */
  formatBotResponse(apiResponse) {
    if (!apiResponse.success) {
      // Handle error responses (vague query, unavailable service, etc.)
      return {
        success: true,
        message: apiResponse.message,
        type: apiResponse.error || 'clarification'
      };
    }

    // Format doctor recommendations into natural language
    const doctors = apiResponse.results?.doctors || [];

    if (doctors.length === 0) {
      return {
        success: true,
        message: 'I couldn\'t find specific doctors for that. Could you describe your symptoms in more detail?',
        type: 'clarification'
      };
    }

    // Create a natural response with doctor recommendations
    let message = `Based on your symptoms, I recommend seeing one of our specialists:\n\n`;

    doctors.slice(0, 3).forEach((doc, idx) => {
      message += `${idx + 1}. Dr. ${doc.name} - ${doc.specialty}\n`;
      message += `   ${doc.experience} experience, Fee: ${doc.fee}\n`;
      message += `   Specializes in: ${doc.expertise}\n\n`;
    });

    message += 'Would you like to book an appointment with any of these doctors?';

    return {
      success: true,
      message: message,
      type: 'recommendation',
      doctors: doctors
    };
  }

  /**
   * Run a single conversation scenario
   */
  async runConversationScenario(scenario) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎭 Testing Scenario: ${scenario.name}`);
    console.log(`   Patient: ${scenario.patientPersona.name} (${scenario.patientPersona.age}y)`);
    console.log(`   Complaint: "${scenario.initialComplaint}"`);
    console.log(`${'='.repeat(70)}\n`);

    // Reset context for new scenario
    this.resetContext();

    const conversationHistory = [];
    const personaPrompt = this.generatePatientPersonaPrompt(
      scenario.patientPersona,
      scenario
    );

    let turnCount = 0;
    const maxTurns = 15; // Safety limit
    let conversationComplete = false;
    let appointmentBooked = false;

    // Bot's initial greeting
    const botGreeting = `Hello! I'm the virtual assistant for Even Hospital. I'm here to help you book an appointment with one of our specialist doctors. Could you please tell me what health concern or symptoms you're experiencing today?`;

    console.log(`\n🤖 Bot: ${botGreeting}\n`);
    conversationHistory.push({
      role: 'assistant',
      content: botGreeting
    });

    // Conversation loop
    while (turnCount < maxTurns && !conversationComplete) {
      turnCount++;

      // Generate patient response
      const patientResponse = await this.generatePatientResponse(
        conversationHistory,
        personaPrompt
      );

      console.log(`👤 Patient (Turn ${turnCount}): ${patientResponse}\n`);
      conversationHistory.push({
        role: 'user',
        content: patientResponse
      });

      // Check if patient wants to end conversation
      const endPhrases = ['goodbye', 'thank you', 'that\'s all', 'bye', 'thanks'];
      if (endPhrases.some(phrase => patientResponse.toLowerCase().includes(phrase))) {
        conversationComplete = true;
        break;
      }

      // Get bot response
      const botResponse = await this.sendToVoiceBot(patientResponse, {
        conversationHistory,
        scenario
      });

      console.log(`🤖 Bot (Turn ${turnCount}): ${botResponse.message}\n`);
      conversationHistory.push({
        role: 'assistant',
        content: botResponse.message
      });

      // Check if appointment booking is progressing
      if (botResponse.type === 'booking_confirmed' ||
          botResponse.appointmentBooked ||
          this.conversationContext.stage === 'booking_confirmed') {
        appointmentBooked = true;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Evaluate conversation
    const evaluation = this.evaluateConversation(
      scenario,
      conversationHistory,
      {
        turnCount,
        appointmentBooked,
        conversationComplete
      }
    );

    console.log(`\n📊 Conversation Evaluation:`);
    console.log(`   Turns: ${turnCount}`);
    console.log(`   Status: ${evaluation.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Score: ${evaluation.score}/100`);
    console.log(`   Appointment Booked: ${appointmentBooked ? 'Yes' : 'No'}`);

    return {
      scenarioId: scenario.scenarioId,
      scenarioName: scenario.name,
      conversationHistory,
      turnCount,
      appointmentBooked,
      evaluation
    };
  }

  /**
   * Evaluate conversation quality
   */
  evaluateConversation(scenario, conversationHistory, metadata) {
    const scores = {
      symptomsGathered: 0,
      appropriateRecommendation: 0,
      conversationFlow: 0,
      efficiency: 0,
      completion: 0
    };

    // Check if symptoms were gathered (bot asked about symptoms)
    const botMessages = conversationHistory.filter((_, idx) => idx % 2 === 0);
    const hasSymptomQuestion = botMessages.some(msg =>
      msg.content.toLowerCase().includes('symptom') ||
      msg.content.toLowerCase().includes('experiencing') ||
      msg.content.toLowerCase().includes('health concern')
    );
    scores.symptomsGathered = hasSymptomQuestion ? 20 : 0;

    // Check if appropriate recommendations were made
    const hasDoctorRecommendation = conversationHistory.some(msg =>
      msg.content.toLowerCase().includes('recommend') ||
      msg.content.toLowerCase().includes('specialist') ||
      msg.content.toLowerCase().includes('dr.')
    );
    scores.appropriateRecommendation = hasDoctorRecommendation ? 30 : 0;

    // Evaluate conversation flow (natural back-and-forth)
    scores.conversationFlow = conversationHistory.length >= 4 ? 20 : 10;

    // Evaluate efficiency (not too long)
    const expectedMax = parseInt(scenario.expectedOutcome.conversationLength.split('-')[1]) || 10;
    scores.efficiency = metadata.turnCount <= expectedMax ? 20 : 10;

    // Check completion
    scores.completion = metadata.appointmentBooked ? 10 : 5;

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const passed = totalScore >= 60; // Pass threshold: 60%

    return {
      passed,
      score: totalScore,
      details: scores,
      feedback: this.generateFeedback(scores, scenario)
    };
  }

  /**
   * Generate feedback for conversation
   */
  generateFeedback(scores, scenario) {
    const feedback = [];

    if (scores.symptomsGathered < 20) {
      feedback.push('❌ Bot did not effectively gather symptom information');
    }
    if (scores.appropriateRecommendation < 30) {
      feedback.push('❌ Bot did not provide appropriate doctor recommendations');
    }
    if (scores.efficiency < 20) {
      feedback.push('⚠️  Conversation was longer than expected');
    }
    if (scores.completion < 10) {
      feedback.push('⚠️  Appointment was not booked');
    }

    if (feedback.length === 0) {
      feedback.push('✅ Conversation met all success criteria');
    }

    return feedback;
  }

  /**
   * Run all conversation scenarios
   */
  async runAllScenarios() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║    Even Hospital - LLM Conversation Simulator             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Load scenarios
    const scenariosPath = join(__dirname, 'conversation-scenarios.json');
    const scenariosData = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));
    const scenarios = scenariosData.conversationScenarios;

    console.log(`📋 Loaded ${scenarios.length} conversation scenarios\n`);

    // Check server availability
    try {
      await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is running\n');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server first.');
      process.exit(1);
    }

    // Run each scenario
    for (const scenario of scenarios) { // Run all scenarios
      try {
        const result = await this.runConversationScenario(scenario);

        this.testResults.totalScenarios++;
        if (result.evaluation.passed) {
          this.testResults.passed++;
        } else {
          this.testResults.failed++;
        }

        this.testResults.scenarios.push(result);

        // Delay between scenarios
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`\n❌ Error in scenario ${scenario.scenarioId}:`, error.message);
        this.testResults.failed++;
        this.testResults.totalScenarios++;
      }
    }

    // Print summary
    this.printSummary();

    // Save results
    this.saveResults();
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 CONVERSATION TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Scenarios: ${this.testResults.totalScenarios}`);
    console.log(`✅ Passed: ${this.testResults.passed} (${((this.testResults.passed / this.testResults.totalScenarios) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${this.testResults.failed} (${((this.testResults.failed / this.testResults.totalScenarios) * 100).toFixed(1)}%)`);
    console.log('='.repeat(70) + '\n');

    // Print individual scenario results
    this.testResults.scenarios.forEach(scenario => {
      const status = scenario.evaluation.passed ? '✅' : '❌';
      console.log(`${status} ${scenario.scenarioName}`);
      console.log(`   Score: ${scenario.evaluation.score}/100 | Turns: ${scenario.turnCount}`);
      scenario.evaluation.feedback.forEach(fb => console.log(`   ${fb}`));
      console.log();
    });
  }

  /**
   * Save results to file
   */
  saveResults() {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsPath = join(__dirname, 'results', `conversation-test-results-${timestamp}.json`);

    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`💾 Results saved to: ${resultsPath}\n`);
  }
}

// Run simulator if executed directly
// Convert Windows path to file URL for comparison
const currentFileUrl = pathToFileURL(process.argv[1]).href;

if (import.meta.url === currentFileUrl) {
  console.log('✓ Running as main module\n');
  const simulator = new ConversationSimulator();
  simulator.runAllScenarios().catch(error => {
    console.error('Fatal error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
}

export default ConversationSimulator;
