import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DataProcessor from '../utils/dataProcessor.js';
import EmbeddingService from './embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../config/.env') });

/**
 * RAG Service
 * Retrieval-Augmented Generation for doctor recommendations
 */
class RAGService {
  constructor() {
    const ragDocumentPath = process.env.RAG_DOCUMENT_PATH ||
      path.join(__dirname, '../../data/even_hospital_comprehensive_rag_document.json');
    const embeddingsPath = process.env.EMBEDDINGS_PATH ||
      path.join(__dirname, '../../data/embeddings/doctor_embeddings.json');

    this.dataProcessor = new DataProcessor(ragDocumentPath);
    this.embeddingService = new EmbeddingService();
    this.embeddingsData = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the RAG service
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing RAG Service...');

    // Load RAG document
    this.dataProcessor.loadDocument();

    // Load embeddings
    const embeddingsPath = process.env.EMBEDDINGS_PATH ||
      path.join(__dirname, '../../data/embeddings/doctor_embeddings.json');

    this.embeddingsData = this.embeddingService.loadEmbeddings(embeddingsPath);
    this.isInitialized = true;

    console.log('✓ RAG Service initialized successfully\n');
  }

  /**
   * Find relevant doctors based on patient symptoms/query
   */
  async findRelevantDoctors(patientQuery, topK = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`\nSearching for: "${patientQuery}"`);

    // Use hybrid search for better results
    const results = await this.embeddingService.hybridSearch(
      patientQuery,
      this.embeddingsData,
      topK * 2 // Get more results initially
    );

    // Extract unique doctor recommendations
    const doctorRecommendations = new Map();

    results.forEach(result => {
      // Prioritize patient phrases and conditions
      if (result.type === 'patient_phrase' || result.type === 'condition') {
        const doctors = result.metadata.recommended_doctors || [];
        doctors.forEach(doctorName => {
          const doctor = this.dataProcessor.getDoctorByName(doctorName);
          if (doctor && !doctorRecommendations.has(doctor.doctor_id)) {
            doctorRecommendations.set(doctor.doctor_id, {
              doctor: doctor,
              relevanceScore: result.finalScore || result.similarity,
              matchedCondition: result.metadata.condition,
              matchedSpecialty: result.metadata.specialty,
              matchReason: result.type === 'patient_phrase'
                ? `Matches symptom: "${result.metadata.original_phrase}"`
                : `Relevant for: ${result.metadata.condition}`
            });
          }
        });
      }
    });

    // Convert to array and sort by relevance
    let recommendations = Array.from(doctorRecommendations.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);

    // If no specific doctors found, fallback to doctor profiles
    if (recommendations.length === 0) {
      const doctorProfiles = results.filter(r => r.type === 'doctor_profile').slice(0, topK);
      recommendations = doctorProfiles.map(result => ({
        doctor: this.dataProcessor.getDoctorById(result.metadata.doctor_id),
        relevanceScore: result.finalScore || result.similarity,
        matchedSpecialty: result.metadata.specialty,
        matchReason: 'General match based on specialty and expertise'
      }));
    }

    return {
      query: patientQuery,
      totalResults: recommendations.length,
      recommendations: recommendations,
      rawResults: results.slice(0, 3) // Include top 3 raw results for context
    };
  }

  /**
   * Get contextual information for a condition
   */
  async getConditionContext(conditionName) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = await this.embeddingService.findSimilarChunks(
      conditionName,
      this.embeddingsData,
      5,
      'condition'
    );

    return results.map(r => ({
      condition: r.metadata.condition,
      specialty: r.metadata.specialty,
      recommended_doctors: r.metadata.recommended_doctors,
      similarity: r.similarity
    }));
  }

  /**
   * Get Q&A pairs relevant to query
   */
  async getRelevantQA(query, topK = 3) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = await this.embeddingService.findSimilarChunks(
      query,
      this.embeddingsData,
      topK,
      'qa_pair'
    );

    return results.map(r => ({
      question: r.metadata.question,
      answer: r.metadata.answer,
      relevance: r.similarity
    }));
  }

  /**
   * Format doctor recommendation for voice bot response
   */
  formatDoctorRecommendation(recommendation) {
    const doctor = recommendation.doctor;

    return {
      name: doctor.name,
      specialty: doctor.specialty,
      experience: `${doctor.experience_years} years`,
      fee: doctor.consultation_fee,
      languages: doctor.languages.join(', '),
      expertise: doctor.key_expertise.slice(0, 3).join(', '),
      recommendation: doctor.why_recommend,
      matchReason: recommendation.matchReason
    };
  }

  /**
   * Generate comprehensive response for voice bot
   */
  async generateVoiceBotResponse(patientQuery) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Find relevant doctors
    const searchResults = await this.findRelevantDoctors(patientQuery, 3);

    // Get relevant Q&A
    const qaResults = await this.getRelevantQA(patientQuery, 2);

    // Format response
    const response = {
      query: patientQuery,
      doctors: searchResults.recommendations.map(rec =>
        this.formatDoctorRecommendation(rec)
      ),
      relatedQA: qaResults,
      hospitalInfo: this.dataProcessor.getHospitalInfo()
    };

    return response;
  }

  /**
   * Get all doctors in a specialty
   */
  getDoctorsBySpecialty(specialty) {
    return this.dataProcessor.getDoctorsBySpecialty(specialty);
  }

  /**
   * Get specialty information
   */
  getSpecialtyInfo(specialty) {
    return this.dataProcessor.getSpecialtyInfo(specialty);
  }
}

// Test function if run directly
async function testRAGService() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    Even Hospital - RAG Service Test                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const ragService = new RAGService();
  await ragService.initialize();

  // Test queries
  const testQueries = [
    "I have severe stomach pain",
    "My knee is painful and swollen",
    "I'm pregnant and need prenatal care",
    "I have bleeding piles",
    "I need a heart checkup"
  ];

  for (const query of testQueries) {
    console.log('\n' + '='.repeat(60));
    const response = await ragService.generateVoiceBotResponse(query);

    console.log(`\nQuery: "${response.query}"`);
    console.log(`\nTop ${response.doctors.length} Recommended Doctors:`);

    response.doctors.forEach((doc, idx) => {
      console.log(`\n${idx + 1}. ${doc.name}`);
      console.log(`   Specialty: ${doc.specialty}`);
      console.log(`   Experience: ${doc.experience}`);
      console.log(`   Fee: ${doc.fee}`);
      console.log(`   Match Reason: ${doc.matchReason}`);
    });

    if (response.relatedQA.length > 0) {
      console.log('\nRelated Q&A:');
      response.relatedQA.forEach((qa, idx) => {
        console.log(`\n${idx + 1}. Q: ${qa.question}`);
        console.log(`   A: ${qa.answer.substring(0, 150)}...`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✓ RAG Service test completed!\n');
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRAGService().catch(console.error);
}

export default RAGService;
