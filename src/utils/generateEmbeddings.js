import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DataProcessor from './dataProcessor.js';
import EmbeddingService from '../services/embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../config/.env') });

/**
 * Script to generate embeddings from RAG document
 * Run: npm run generate-embeddings
 */
async function generateEmbeddings() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    Even Hospital - Embedding Generation Script            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.error('❌ Error: OpenAI API key not configured');
      console.error('   Please set OPENAI_API_KEY in config/.env file');
      process.exit(1);
    }

    // Initialize services
    console.log('Step 1: Initializing services...');
    const ragDocumentPath = process.env.RAG_DOCUMENT_PATH ||
      'C:\\Users\\AD\\Desktop\\Even Voice Bot\\even_hospital_comprehensive_rag_document.json';
    const embeddingsOutputPath = process.env.EMBEDDINGS_PATH ||
      path.join(__dirname, '../../data/embeddings/doctor_embeddings.json');

    const dataProcessor = new DataProcessor(ragDocumentPath);
    const embeddingService = new EmbeddingService();

    // Load and process document
    console.log('\nStep 2: Loading RAG document...');
    dataProcessor.loadDocument();

    // Extract embeddable chunks
    console.log('\nStep 3: Extracting embeddable chunks...');
    const chunks = dataProcessor.extractEmbeddableChunks();

    // Generate embeddings
    console.log('\nStep 4: Generating embeddings (this may take a few minutes)...');
    await embeddingService.generateAndSaveChunkEmbeddings(chunks, embeddingsOutputPath);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║    ✓ Embedding generation completed successfully!         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('Next steps:');
    console.log('  1. Configure VAPI credentials in config/.env');
    console.log('  2. Run "npm start" to launch the voice bot server');
    console.log('  3. Test the RAG system with "npm run test-rag"\n');

  } catch (error) {
    console.error('\n❌ Error generating embeddings:', error.message);
    console.error('\nPlease check:');
    console.error('  - OpenAI API key is valid');
    console.error('  - RAG document path is correct');
    console.error('  - You have sufficient OpenAI API credits');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEmbeddings();
}

export default generateEmbeddings;
