import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import RAGService from './services/ragService.js';
import VAPIService from './services/vapiService.js';
import RetellService from './services/retellService.js';
import AppointmentService from './services/appointmentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (for landing page)
app.use(express.static(path.join(__dirname, '..')));

// Initialize services
let ragService;
let vapiService;
let retellService;
let appointmentService;

/**
 * Initialize all services
 */
async function initializeServices() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    Even Hospital Voice Bot Server                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize RAG Service
    console.log('Initializing RAG Service...');
    ragService = new RAGService();
    await ragService.initialize();

    // Initialize VAPI Service
    console.log('Initializing VAPI Service...');
    vapiService = new VAPIService();

    // Initialize Retell AI Service
    console.log('Initializing Retell AI Service...');
    retellService = new RetellService();

    // Initialize Appointment Service
    console.log('Initializing Appointment Service...');
    appointmentService = new AppointmentService();

    console.log('\n✓ All services initialized successfully\n');

    return true;
  } catch (error) {
    console.error('\n❌ Error initializing services:', error.message);
    return false;
  }
}

/**
 * Serve landing page at root
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../even-landing-page.html'));
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      rag: ragService?.isInitialized || false,
      vapi: !!vapiService,
      appointments: !!appointmentService
    }
  });
});

/**
 * Search for doctors based on symptoms
 */
app.post('/api/search-doctors', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const results = await ragService.generateVoiceBotResponse(symptoms);

    // Handle error responses (unavailable service, vague query)
    if (results.success === false) {
      return res.status(200).json({
        success: false,
        error: results.error,
        message: results.message,
        query: symptoms,
        guidance: results.guidance,
        service: results.service,
        reason: results.reason
      });
    }

    // Handle successful search
    res.json({
      success: true,
      query: symptoms,
      results
    });
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get doctor information
 */
app.get('/api/doctor/:name', (req, res) => {
  try {
    const { name } = req.params;
    const doctor = ragService.dataProcessor.getDoctorByName(name);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get doctors by specialty
 */
app.get('/api/specialty/:specialty', (req, res) => {
  try {
    const { specialty } = req.params;
    const doctors = ragService.dataProcessor.getDoctorsBySpecialty(specialty);

    res.json({
      success: true,
      specialty,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Error fetching specialty doctors:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Book an appointment
 */
app.post('/api/appointments/book', (req, res) => {
  try {
    const result = appointmentService.createAppointment(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get upcoming appointments
 * IMPORTANT: Must be BEFORE /:id route to avoid route conflict
 */
app.get('/api/appointments/upcoming', (req, res) => {
  try {
    const appointments = appointmentService.getUpcomingAppointments();
    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get appointment statistics
 * IMPORTANT: Must be BEFORE /:id route to avoid route conflict
 */
app.get('/api/appointments/stats', (req, res) => {
  try {
    const stats = appointmentService.getStatistics();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get doctor availability
 */
app.get('/api/appointments/availability/:doctorName', (req, res) => {
  try {
    const { doctorName } = req.params;
    const { date } = req.query;

    const availability = appointmentService.getDoctorAvailability(doctorName, date);

    res.json({
      success: true,
      doctor: doctorName,
      date: date || 'general',
      availableSlots: availability
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get appointment by ID
 * IMPORTANT: This must be AFTER specific routes like /upcoming, /stats
 */
app.get('/api/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appointment = appointmentService.getAppointment(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel appointment
 */
app.post('/api/appointments/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason} = req.body;

    const result = appointmentService.cancelAppointment(id, reason);
    res.json(result);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * VAPI webhook endpoint - handles function calls from voice bot
 */
app.post('/api/vapi/webhook', async (req, res) => {
  console.log('\n🔔 VAPI Webhook request received');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const { message } = req.body;

    // Handle different message types
    if (message?.type === 'function-call') {
      console.log('✓ Function call detected');
      const { functionCall } = message;
      const result = await vapiService.handleFunctionCall(
        functionCall.name,
        functionCall.parameters,
        ragService,
        appointmentService
      );

      console.log('✓ Function result:', JSON.stringify(result, null, 2));
      res.json({ result });
    } else {
      console.log('ℹ️ Non-function message:', message?.type || 'unknown');
      res.json({ success: true });
    }
  } catch (error) {
    console.error('❌ Error handling VAPI webhook:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * VAPI tool-calls webhook endpoint - alternative endpoint for function calls
 */
app.post('/api/vapi/tool-calls', async (req, res) => {
  console.log('\n🔔 VAPI Tool-calls request received');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const { message } = req.body;

    // Handle tool-calls format (VAPI's newer format)
    if (message?.type === 'tool-calls' && message?.toolCallList?.length > 0) {
      console.log('✓ Tool-calls detected');

      const results = [];
      for (const toolCall of message.toolCallList) {
        if (toolCall.type === 'function') {
          console.log(`\n  Processing function: ${toolCall.function.name}`);
          console.log(`  Arguments:`, JSON.stringify(toolCall.function.arguments, null, 2));

          const result = await vapiService.handleFunctionCall(
            toolCall.function.name,
            toolCall.function.arguments,
            ragService,
            appointmentService
          );

          results.push({
            toolCallId: toolCall.id,
            result: result
          });
        }
      }

      console.log('✓ Function results:', JSON.stringify(results, null, 2));

      // Return results in VAPI's expected format
      res.json({
        results: results.map(r => ({
          toolCallId: r.toolCallId,
          result: r.result.message || JSON.stringify(r.result)
        }))
      });
    }
    // Handle function-call format (older format)
    else if (message?.type === 'function-call') {
      console.log('✓ Function call detected');
      const { functionCall } = message;
      const result = await vapiService.handleFunctionCall(
        functionCall.name,
        functionCall.parameters,
        ragService,
        appointmentService
      );

      console.log('✓ Function result:', JSON.stringify(result, null, 2));
      res.json({ result: result.message || JSON.stringify(result) });
    }
    else {
      console.log('ℹ️ Non-function message:', message?.type || 'unknown');
      res.json({ success: true });
    }
  } catch (error) {
    console.error('❌ Error handling VAPI tool-calls:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize VAPI assistant
 */
app.post('/api/vapi/setup-assistant', async (req, res) => {
  try {
    const assistant = await vapiService.createAssistant(ragService);
    res.json({
      success: true,
      assistant
    });
  } catch (error) {
    console.error('Error setting up VAPI assistant:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Retell AI webhook endpoint - handles custom function calls from voice bot
 */
app.post('/api/retell/webhook', async (req, res) => {
  console.log('\n🔔 Retell Webhook request received');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const { function_name, arguments: args, call_id } = req.body;

    if (!function_name) {
      console.log('ℹ️ Non-function webhook event');
      return res.json({ response: 'Acknowledged' });
    }

    console.log('✓ Custom function call detected');
    console.log(`  Function: ${function_name}`);
    console.log(`  Call ID: ${call_id}`);

    const result = await retellService.handleFunctionCall(
      function_name,
      args,
      ragService,
      appointmentService
    );

    console.log('✓ Function result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('❌ Error handling Retell webhook:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      result: `I apologize, I encountered a technical issue: ${error.message}`
    });
  }
});

/**
 * Create Retell AI web call
 */
app.post('/api/retell/create-web-call', async (req, res) => {
  try {
    const agentId = process.env.RETELL_AGENT_ID;

    if (!agentId) {
      return res.status(400).json({
        error: 'RETELL_AGENT_ID not configured in environment variables'
      });
    }

    const webCall = await retellService.createWebCall(agentId);
    res.json({
      success: true,
      webCall
    });
  } catch (error) {
    console.error('Error creating Retell web call:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Setup Retell AI assistant
 */
app.post('/api/retell/setup-agent', async (req, res) => {
  try {
    const agent = await retellService.createAgent(ragService);
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Error setting up Retell agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update existing Retell AI agent with custom functions
 */
app.post('/api/retell/update-agent-functions', async (req, res) => {
  try {
    const agentId = process.env.RETELL_AGENT_ID;

    if (!agentId) {
      return res.status(400).json({
        error: 'RETELL_AGENT_ID not configured in environment variables'
      });
    }

    const updatedAgent = await retellService.updateAgentFunctions(agentId, ragService);
    res.json({
      success: true,
      agent: updatedAgent,
      message: 'Custom functions added successfully to agent ' + agentId
    });
  } catch (error) {
    console.error('Error updating Retell agent functions:', error);
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * Get hospital information
 */
app.get('/api/hospital/info', (req, res) => {
  try {
    const info = ragService.dataProcessor.getHospitalInfo();
    res.json({ success: true, info });
  } catch (error) {
    console.error('Error fetching hospital info:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start the server
 */
async function startServer() {
  const initialized = await initializeServices();

  if (!initialized) {
    console.error('Failed to initialize services. Please check configuration.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║  Server running on http://localhost:${PORT}                  ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('Available Endpoints:');
    console.log(`  GET    /health                                - Health check`);
    console.log(`  POST   /api/search-doctors                    - Search doctors by symptoms`);
    console.log(`  GET    /api/doctor/:name                      - Get doctor details`);
    console.log(`  GET    /api/specialty/:specialty              - Get doctors by specialty`);
    console.log(`  POST   /api/appointments/book                 - Book appointment`);
    console.log(`  GET    /api/appointments/:id                  - Get appointment details`);
    console.log(`  GET    /api/appointments/availability/:doctor - Check availability`);
    console.log(`  POST   /api/appointments/:id/cancel           - Cancel appointment`);
    console.log(`  GET    /api/appointments/upcoming             - Get upcoming appointments`);
    console.log(`  GET    /api/appointments/stats                - Get appointment stats`);
    console.log(`  POST   /api/vapi/webhook                      - VAPI webhook handler`);
    console.log(`  POST   /api/vapi/setup-assistant              - Setup VAPI assistant`);
    console.log(`  POST   /api/retell/webhook                    - Retell AI webhook handler`);
    console.log(`  POST   /api/retell/create-web-call            - Create Retell web call`);
    console.log(`  POST   /api/retell/setup-agent                - Setup Retell AI agent`);
    console.log(`  GET    /api/hospital/info                     - Hospital information\n`);

    console.log('Next Steps:');
    console.log('  1. Configure your VAPI webhook to point to: http://your-domain/api/vapi/webhook');
    console.log('  2. Setup VAPI assistant: POST /api/vapi/setup-assistant');
    console.log('  3. Test doctor search: POST /api/search-doctors with {"symptoms": "knee pain"}');
    console.log('');
  });
}

// Start the server
startServer().catch(error => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});

export default app;
