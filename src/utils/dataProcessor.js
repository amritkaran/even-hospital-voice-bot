import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Data Processor Utility
 * Processes the hospital RAG document and prepares data for embedding generation
 */
class DataProcessor {
  constructor(ragDocumentPath) {
    this.ragDocumentPath = ragDocumentPath;
    this.data = null;
  }

  /**
   * Load and parse the RAG document
   */
  loadDocument() {
    try {
      const rawData = fs.readFileSync(this.ragDocumentPath, 'utf-8');
      this.data = JSON.parse(rawData);
      console.log('✓ RAG document loaded successfully');
      console.log(`  - Total doctors: ${this.data.document_info.total_doctors}`);
      console.log(`  - Total specialties: ${this.data.document_info.total_specialties}`);
      return this.data;
    } catch (error) {
      console.error('Error loading RAG document:', error);
      throw error;
    }
  }

  /**
   * Extract all embeddable chunks from the document
   * Returns array of objects with: {id, type, text, metadata}
   */
  extractEmbeddableChunks() {
    if (!this.data) {
      this.loadDocument();
    }

    const chunks = [];
    let chunkId = 0;

    // 1. Process Doctor Profiles
    this.data.doctor_profiles.forEach(doctor => {
      const doctorText = `
Doctor: ${doctor.name}
Specialty: ${doctor.specialty}
Experience: ${doctor.experience_years} years
Credentials: ${doctor.credentials.join(', ')}
Languages: ${doctor.languages.join(', ')}
Consultation Fee: ${doctor.consultation_fee}
Key Expertise: ${doctor.key_expertise.join(', ')}
Why Recommend: ${doctor.why_recommend}
      `.trim();

      chunks.push({
        id: `doctor_${chunkId++}`,
        type: 'doctor_profile',
        text: doctorText,
        metadata: {
          doctor_id: doctor.doctor_id,
          name: doctor.name,
          specialty: doctor.specialty,
          experience_years: doctor.experience_years,
          consultation_fee: doctor.consultation_fee,
          languages: doctor.languages
        }
      });
    });

    // 2. Process Conditions with Patient Phrases
    this.data.specialties_and_conditions.forEach(specialty => {
      specialty.common_conditions.forEach(condition => {
        // Create chunks for each patient phrase set
        const conditionText = `
Condition: ${condition.condition}
Specialty: ${specialty.specialty}
Patient Symptoms: ${condition.patient_phrases.join(', ')}
Recommended Doctors: ${condition.recommended_doctors.join(', ')}
Specialty Description: ${specialty.description}
        `.trim();

        chunks.push({
          id: `condition_${chunkId++}`,
          type: 'condition',
          text: conditionText,
          metadata: {
            condition: condition.condition,
            specialty: specialty.specialty,
            recommended_doctors: condition.recommended_doctors,
            patient_phrases: condition.patient_phrases
          }
        });

        // Create individual chunks for each patient phrase for better matching
        condition.patient_phrases.forEach(phrase => {
          chunks.push({
            id: `phrase_${chunkId++}`,
            type: 'patient_phrase',
            text: `Patient says: "${phrase}". This indicates: ${condition.condition}. Specialty: ${specialty.specialty}. Recommended doctors: ${condition.recommended_doctors.join(', ')}`,
            metadata: {
              original_phrase: phrase,
              condition: condition.condition,
              specialty: specialty.specialty,
              recommended_doctors: condition.recommended_doctors
            }
          });
        });
      });
    });

    // 3. Process Q&A Pairs
    this.data.specialties_and_conditions.forEach(specialty => {
      specialty.common_conditions.forEach(condition => {
        if (condition.qa_pairs && condition.qa_pairs.length > 0) {
          condition.qa_pairs.forEach(qa => {
            chunks.push({
              id: `qa_${chunkId++}`,
              type: 'qa_pair',
              text: `Question: ${qa.question}\nAnswer: ${qa.answer}`,
              metadata: {
                question: qa.question,
                answer: qa.answer,
                condition: condition.condition,
                specialty: specialty.specialty
              }
            });
          });
        }
      });
    });

    // 4. Process Specialty Descriptions
    this.data.specialties_and_conditions.forEach(specialty => {
      const specialtyText = `
Specialty: ${specialty.specialty}
Description: ${specialty.description}
Number of Doctors: ${specialty.doctors_in_specialty}
Common Conditions Treated: ${specialty.common_conditions.map(c => c.condition).join(', ')}
      `.trim();

      chunks.push({
        id: `specialty_${chunkId++}`,
        type: 'specialty',
        text: specialtyText,
        metadata: {
          specialty: specialty.specialty,
          description: specialty.description,
          doctors_count: specialty.doctors_in_specialty
        }
      });
    });

    console.log(`✓ Extracted ${chunks.length} embeddable chunks`);
    console.log(`  - Doctor profiles: ${chunks.filter(c => c.type === 'doctor_profile').length}`);
    console.log(`  - Conditions: ${chunks.filter(c => c.type === 'condition').length}`);
    console.log(`  - Patient phrases: ${chunks.filter(c => c.type === 'patient_phrase').length}`);
    console.log(`  - Q&A pairs: ${chunks.filter(c => c.type === 'qa_pair').length}`);
    console.log(`  - Specialties: ${chunks.filter(c => c.type === 'specialty').length}`);

    return chunks;
  }

  /**
   * Get doctor by ID
   */
  getDoctorById(doctorId) {
    if (!this.data) {
      this.loadDocument();
    }
    return this.data.doctor_profiles.find(d => d.doctor_id === doctorId);
  }

  /**
   * Get doctor by name
   */
  getDoctorByName(name) {
    if (!this.data) {
      this.loadDocument();
    }
    return this.data.doctor_profiles.find(d =>
      d.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Get all doctors
   */
  getAllDoctors() {
    if (!this.data) {
      this.loadDocument();
    }
    return this.data.doctor_profiles;
  }

  /**
   * Get all doctors in a specialty
   */
  getDoctorsBySpecialty(specialty) {
    if (!this.data) {
      this.loadDocument();
    }
    return this.data.doctor_profiles.filter(d =>
      d.specialty.toLowerCase() === specialty.toLowerCase()
    );
  }

  /**
   * Get specialty information
   */
  getSpecialtyInfo(specialtyName) {
    if (!this.data) {
      this.loadDocument();
    }
    return this.data.specialties_and_conditions.find(s =>
      s.specialty.toLowerCase() === specialtyName.toLowerCase()
    );
  }

  /**
   * Get hospital information
   */
  getHospitalInfo() {
    if (!this.data) {
      this.loadDocument();
    }
    return this.data.hospital;
  }
}

export default DataProcessor;
