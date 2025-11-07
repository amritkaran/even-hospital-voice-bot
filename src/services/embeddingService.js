import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../config/.env') });

/**
 * Embedding Service
 * Handles creation and management of embeddings using OpenAI
 */
class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'text-embedding-3-small'; // Cost-effective and performant
    this.embeddingsCache = null;
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float'
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddings(texts, batchSize = 100) {
    const embeddings = [];
    const totalBatches = Math.ceil(texts.length / batchSize);

    console.log(`Generating embeddings for ${texts.length} texts in ${totalBatches} batches...`);

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`Processing batch ${batchNumber}/${totalBatches}...`);

      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
          encoding_format: 'float'
        });

        embeddings.push(...response.data.map(item => item.embedding));

        // Add small delay to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
        throw error;
      }
    }

    console.log('✓ All embeddings generated successfully');
    return embeddings;
  }

  /**
   * Generate and save embeddings for document chunks
   */
  async generateAndSaveChunkEmbeddings(chunks, outputPath) {
    console.log('\n=== Starting Embedding Generation ===');
    console.log(`Total chunks to process: ${chunks.length}`);

    // Extract texts from chunks
    const texts = chunks.map(chunk => chunk.text);

    // Generate embeddings
    const embeddings = await this.generateEmbeddings(texts);

    // Combine chunks with their embeddings
    const embeddedChunks = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }));

    // Save to file
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify({
        model: this.model,
        embedding_dimension: embeddings[0].length,
        total_chunks: embeddedChunks.length,
        generated_at: new Date().toISOString(),
        chunks: embeddedChunks
      }, null, 2)
    );

    console.log(`✓ Embeddings saved to: ${outputPath}`);
    console.log(`  - Embedding dimension: ${embeddings[0].length}`);
    console.log(`  - Total embedded chunks: ${embeddedChunks.length}`);

    return embeddedChunks;
  }

  /**
   * Load embeddings from file
   */
  loadEmbeddings(embeddingsPath) {
    try {
      if (this.embeddingsCache) {
        return this.embeddingsCache;
      }

      const data = fs.readFileSync(embeddingsPath, 'utf-8');
      this.embeddingsCache = JSON.parse(data);

      console.log('✓ Embeddings loaded successfully');
      console.log(`  - Total chunks: ${this.embeddingsCache.total_chunks}`);
      console.log(`  - Embedding model: ${this.embeddingsCache.model}`);

      return this.embeddingsCache;
    } catch (error) {
      console.error('Error loading embeddings:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Find most similar chunks to a query
   */
  async findSimilarChunks(query, embeddingsData, topK = 5, typeFilter = null) {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate similarities
    let chunks = embeddingsData.chunks.map(chunk => ({
      ...chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Apply type filter if specified
    if (typeFilter) {
      chunks = chunks.filter(chunk => chunk.type === typeFilter);
    }

    // Sort by similarity and return top K
    chunks.sort((a, b) => b.similarity - a.similarity);

    return chunks.slice(0, topK);
  }

  /**
   * Hybrid search: combines semantic search with keyword matching
   */
  async hybridSearch(query, embeddingsData, topK = 5) {
    const queryLower = query.toLowerCase();

    // Get semantic search results
    const semanticResults = await this.findSimilarChunks(query, embeddingsData, topK * 2);

    // Boost scores for keyword matches
    const boostedResults = semanticResults.map(result => {
      let boostScore = 0;

      // Boost if query keywords appear in metadata
      if (result.metadata.condition && queryLower.includes(result.metadata.condition.toLowerCase())) {
        boostScore += 0.1;
      }
      if (result.metadata.specialty && queryLower.includes(result.metadata.specialty.toLowerCase())) {
        boostScore += 0.1;
      }
      if (result.metadata.name && queryLower.includes(result.metadata.name.toLowerCase())) {
        boostScore += 0.15;
      }

      return {
        ...result,
        finalScore: result.similarity + boostScore
      };
    });

    // Re-sort by final score
    boostedResults.sort((a, b) => b.finalScore - a.finalScore);

    return boostedResults.slice(0, topK);
  }
}

export default EmbeddingService;
