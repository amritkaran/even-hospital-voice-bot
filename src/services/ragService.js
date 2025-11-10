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

    // Response cache for improved performance (saves 200-400ms on repeated queries)
    this.responseCache = new Map();
    this.CACHE_MAX_SIZE = 100; // Limit cache size
    this.CACHE_TTL = 30 * 60 * 1000; // 30 minutes TTL
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
   * Translate common Hindi/Kannada medical phrases to English
   */
  translateQuery(query) {
    const translations = {
      // Hindi translations
      'mera': 'my',
      'mere': 'my',
      'ghutna': 'knee',
      'ghutne': 'knee',
      'dard': 'pain',
      'bahut': 'very',
      'hai': 'is',
      'me': 'in',
      'pet': 'stomach',
      'sar': 'head',
      'peeth': 'back',
      'kamar': 'back',
      'pair': 'leg',
      'hath': 'hand',
      'kandha': 'shoulder',

      // Kannada translations
      'nanna': 'my',
      'nanage': 'to me',
      'kai': 'hand',
      'kaal': 'leg',
      'melu': 'swelling',
      'aagide': 'is swollen',
      'novu': 'pain',
      'tale': 'head',
      'hotte': 'stomach',
      '等': 'etc'
    };

    let translatedQuery = query.toLowerCase();
    let wasTranslated = false;

    // Check if query contains non-ASCII characters (likely Hindi/Kannada)
    const hasNonAscii = /[^\x00-\x7F]/.test(query);

    if (hasNonAscii) {
      // For queries with native scripts, provide common pattern matching
      const patterns = [
        { regex: /घुटन|ghutna|ghutne/gi, replacement: 'knee', desc: 'knee' },
        { regex: /दर्द|dard|novu/gi, replacement: 'pain', desc: 'pain' },
        { regex: /हाथ|हात|हत्थ|kai/gi, replacement: 'hand', desc: 'hand' },
        { regex: /पैर|पाय|kaal/gi, replacement: 'leg', desc: 'leg' },
        { regex: /सूजन|मेलु|melu|aagide/gi, replacement: 'swelling swollen', desc: 'swelling' },
        { regex: /सिर|sir|tale/gi, replacement: 'head', desc: 'head' },
        { regex: /पेट|hotte/gi, replacement: 'stomach', desc: 'stomach' }
      ];

      patterns.forEach(pattern => {
        if (pattern.regex.test(query)) {
          translatedQuery += ' ' + pattern.replacement;
          wasTranslated = true;
        }
      });
    }

    // Word-by-word translation for romanized text
    const words = query.toLowerCase().split(/\s+/);
    const translatedWords = words.map(word => translations[word] || word);

    if (translatedWords.some((w, i) => w !== words[i])) {
      translatedQuery = translatedWords.join(' ');
      wasTranslated = true;
    }

    return {
      original: query,
      translated: translatedQuery,
      wasTranslated
    };
  }

  /**
   * Detect if query is for an unavailable service
   */
  detectUnavailableService(query) {
    const unavailableServices = [
      { keywords: ['dental', 'dentist', 'tooth', 'teeth', 'cavity', 'orthodont'], service: 'Dental/Dentistry' },
      { keywords: ['eye', 'vision', 'opthalm', 'glasses', 'contact lens'], service: 'Ophthalmology' },
      { keywords: ['dermatology', 'skin', 'acne', 'rash', 'dermatologist'], service: 'Dermatology' },
      { keywords: ['physical therapy', 'physiotherapy', 'rehabilitation', 'physio'], service: 'Physiotherapy' },
      { keywords: ['radiology', 'x-ray', 'ct scan', 'mri', 'ultrasound scan'], service: 'Radiology/Imaging' }
    ];

    const lowerQuery = query.toLowerCase();

    for (const unavailable of unavailableServices) {
      if (unavailable.keywords.some(keyword => lowerQuery.includes(keyword))) {
        return {
          isUnavailable: true,
          service: unavailable.service,
          message: `I apologize, but we currently don't have ${unavailable.service} specialists at Even Hospital. However, I can help you find doctors for other medical concerns. What symptoms or health issues are you experiencing?`
        };
      }
    }

    return { isUnavailable: false };
  }

  /**
   * Detect if query is gibberish or contains only random words
   */
  detectGibberish(query) {
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/).filter(w => w.length > 0);

    // List of common English words (medical and general)
    const commonWords = new Set([
      'pain', 'hurt', 'ache', 'swollen', 'fever', 'sick', 'illness', 'disease',
      'problem', 'issue', 'concern', 'symptom', 'feel', 'feeling', 'doctor',
      'appointment', 'checkup', 'health', 'medical', 'emergency', 'acute',
      'chronic', 'severe', 'mild', 'bleeding', 'infection', 'injury',
      'my', 'i', 'have', 'need', 'want', 'get', 'book', 'make', 'help', 'can',
      'the', 'a', 'an', 'is', 'are', 'am', 'me', 'and', 'or', 'but', 'with',
      'knee', 'leg', 'hand', 'arm', 'head', 'stomach', 'chest', 'back', 'neck',
      'shoulder', 'foot', 'ankle', 'hip', 'joint', 'bone', 'muscle', 'skin',
      'eye', 'ear', 'nose', 'throat', 'mouth', 'teeth', 'heart', 'lung',
      'pregnancy', 'pregnant', 'child', 'baby', 'diabetes', 'blood', 'pressure',
      'sugar', 'kidney', 'liver', 'urine', 'stool', 'vomit', 'nausea', 'dizzy'
    ]);

    // Check if most words are unrecognizable
    const recognizedWords = words.filter(word => {
      // Check if word is in common words
      if (commonWords.has(word)) return true;
      // Check if word is part of a common word (for variations like 'painful', 'swelling')
      return Array.from(commonWords).some(common =>
        word.includes(common) || common.includes(word)
      );
    });

    const recognitionRate = words.length > 0 ? recognizedWords.length / words.length : 0;

    // If less than 30% of words are recognized, likely gibberish
    if (recognitionRate < 0.3 && words.length >= 3) {
      return {
        isGibberish: true,
        message: 'I\'m having trouble understanding your request. Could you describe your symptoms or health concern more clearly? For example: "I have knee pain", "I need pregnancy care", or "My child has a fever".'
      };
    }

    return { isGibberish: false };
  }

  /**
   * Detect if query is too vague or unclear
   */
  detectVagueQuery(query, searchResults) {
    const lowerQuery = query.toLowerCase().trim();

    // First check for gibberish
    const gibberishCheck = this.detectGibberish(query);
    if (gibberishCheck.isGibberish) {
      return {
        isVague: true,
        reason: 'gibberish',
        message: gibberishCheck.message
      };
    }

    // Check for very short queries (less than 10 characters)
    if (lowerQuery.length < 10 && !searchResults.recommendations.length) {
      return {
        isVague: true,
        reason: 'too_short',
        message: 'Could you please describe your symptoms or health concern in more detail? For example, tell me where you feel pain or what specific issue you\'re experiencing.'
      };
    }

    // Check for gibberish or random words with low relevance scores
    const words = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    const commonMedicalWords = [
      'pain', 'hurt', 'ache', 'swollen', 'fever', 'sick', 'illness', 'disease',
      'problem', 'issue', 'concern', 'symptom', 'feel', 'feeling', 'doctor',
      'appointment', 'checkup', 'health', 'medical', 'emergency', 'acute',
      'chronic', 'severe', 'mild', 'bleeding', 'infection', 'injury'
    ];

    const hasRelevantWords = words.some(word =>
      commonMedicalWords.some(medical => word.includes(medical))
    );

    // If no relevant medical words and very low relevance scores
    if (!hasRelevantWords && searchResults.recommendations.length > 0) {
      const avgScore = searchResults.recommendations.reduce((sum, rec) =>
        sum + rec.relevanceScore, 0) / searchResults.recommendations.length;

      if (avgScore < 0.3) {
        return {
          isVague: true,
          reason: 'unclear_symptoms',
          message: 'I\'m having trouble understanding your health concern. Could you describe your symptoms more clearly? For example: "I have knee pain", "I need pregnancy care", or "My child has a fever".'
        };
      }
    }

    // Check for appointment-only requests without symptoms
    const appointmentOnlyPatterns = [
      /^(can i|i want|i need|how to|when can).*(book|make|schedule|get).*(appointment|doctor)/i,
      /^(appointment|doctor|booking).*tomorrow|today|next week/i,
      /book.*appointment.*don'?t (know|remember)/i
    ];

    if (appointmentOnlyPatterns.some(pattern => pattern.test(query))) {
      return {
        isVague: true,
        reason: 'no_symptoms',
        message: 'I\'d be happy to help you book an appointment! First, could you tell me what health issue or symptoms you\'re experiencing? This will help me recommend the right specialist for you.'
      };
    }

    return { isVague: false };
  }

  /**
   * Generate comprehensive response for voice bot
   */
  async generateVoiceBotResponse(patientQuery) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Step 0: Translate query if needed (Hindi/Kannada support)
    const translationResult = this.translateQuery(patientQuery);
    const queryToSearch = translationResult.wasTranslated ? translationResult.translated : patientQuery;

    if (translationResult.wasTranslated) {
      console.log(`Translated query: "${patientQuery}" → "${queryToSearch}"`);
    }

    // Step 1: Check for unavailable services first
    const unavailableCheck = this.detectUnavailableService(queryToSearch);
    if (unavailableCheck.isUnavailable) {
      return {
        success: false,
        error: 'unavailable_service',
        service: unavailableCheck.service,
        message: unavailableCheck.message,
        query: patientQuery,
        guidance: {
          type: 'unavailable_service',
          action: 'describe_symptoms'
        }
      };
    }

    // Normalize query for caching (lowercase, trim)
    const cacheKey = queryToSearch.toLowerCase().trim();

    // Check cache first
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('✓ Cache hit for query:', patientQuery);
      return cached.response;
    }

    // Clean up cache if too large
    if (this.responseCache.size >= this.CACHE_MAX_SIZE) {
      // Remove oldest entries (simple FIFO)
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }

    // Find relevant doctors using translated query
    const searchResults = await this.findRelevantDoctors(queryToSearch, 3);

    // Step 2: Check if query is too vague
    const vagueCheck = this.detectVagueQuery(queryToSearch, searchResults);
    if (vagueCheck.isVague) {
      return {
        success: false,
        error: 'vague_query',
        reason: vagueCheck.reason,
        message: vagueCheck.message,
        query: patientQuery,
        guidance: {
          type: 'vague_query',
          action: 'clarify_symptoms',
          examples: [
            'I have knee pain when walking',
            'I\'m pregnant and need prenatal care',
            'My child has high fever',
            'I have chest pain and shortness of breath'
          ]
        }
      };
    }

    // Get relevant Q&A using translated query
    const qaResults = await this.getRelevantQA(queryToSearch, 2);

    // Format response
    const response = {
      success: true,
      query: patientQuery,
      doctors: searchResults.recommendations.map(rec =>
        this.formatDoctorRecommendation(rec)
      ),
      relatedQA: qaResults,
      hospitalInfo: this.dataProcessor.getHospitalInfo()
    };

    // Cache the response
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

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
