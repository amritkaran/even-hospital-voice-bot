/**
 * Even Hospital Voice Bot - API Test Suite
 * Tests RAG search accuracy, appointment booking, and doctor recommendations
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const SCENARIOS_FILE = path.join(__dirname, 'scenarios', 'test-scenarios.json');
const RESULTS_DIR = path.join(__dirname, 'results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  metrics: {
    doctorMatchAccuracy: 0,
    specialtyAccuracy: 0,
    avgResponseTime: 0,
    searchSuccessRate: 0
  },
  testDetails: []
};

/**
 * Load test scenarios from JSON file
 */
function loadTestScenarios() {
  try {
    const data = fs.readFileSync(SCENARIOS_FILE, 'utf-8');
    const scenarios = JSON.parse(data);
    return scenarios.test_scenarios;
  } catch (error) {
    console.error('❌ Error loading test scenarios:', error.message);
    process.exit(1);
  }
}

/**
 * Test the RAG doctor search API
 */
async function testDoctorSearch(scenario) {
  const startTime = Date.now();

  try {
    const response = await axios.post(`${API_BASE_URL}/api/search-doctors`, {
      symptoms: scenario.scenario.symptoms
    });

    const responseTime = Date.now() - startTime;

    // Extract doctor names from response (handle nested structure)
    const doctors = response.data.results?.doctors || response.data.doctors || [];
    const returnedDoctors = doctors.map(d => d.name);

    // Check if expected doctors are in the results
    const expectedDoctors = scenario.scenario.expectedOutcome?.recommendedDoctors || [];
    const matchedDoctors = expectedDoctors.filter(expected =>
      returnedDoctors.some(returned => returned.includes(expected))
    );

    // Calculate accuracy
    const doctorMatchAccuracy = expectedDoctors.length > 0 ?
      (matchedDoctors.length / expectedDoctors.length) * 100 : 0;

    // Check specialty match
    const expectedSpecialty = scenario.scenario.expectedOutcome?.specialty;
    const returnedSpecialty = response.data.specialty ||
      response.data.results?.specialty ||
      (doctors.length > 0 ? doctors[0]?.specialty : null);
    const specialtyMatch = returnedSpecialty === expectedSpecialty ||
      (returnedSpecialty && expectedSpecialty &&
       returnedSpecialty.toLowerCase().includes(expectedSpecialty.toLowerCase()));

    return {
      testId: scenario.testId,
      category: scenario.category,
      status: 'PASSED',
      responseTime,
      doctorMatchAccuracy,
      specialtyMatch,
      expectedDoctors,
      returnedDoctors,
      expectedSpecialty,
      returnedSpecialty,
      rawResponse: response.data
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      testId: scenario.testId,
      category: scenario.category,
      status: 'FAILED',
      responseTime,
      error: error.message,
      errorDetails: error.response?.data
    };
  }
}

/**
 * Test appointment availability check
 */
async function testAvailability(doctorName) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/appointments/availability/${encodeURIComponent(doctorName)}`
    );

    return {
      success: true,
      availableSlots: response.data.availableSlots || [],
      hasAvailability: response.data.availableSlots?.length > 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test appointment booking
 */
async function testBooking(doctorName, patientInfo) {
  try {
    // First check availability
    const availabilityResult = await testAvailability(doctorName);

    if (!availabilityResult.hasAvailability) {
      return {
        success: false,
        reason: 'No available slots',
        availabilityCheck: availabilityResult
      };
    }

    // Try to book the first available slot
    const firstSlot = availabilityResult.availableSlots[0];

    const bookingData = {
      doctorName: doctorName,
      patientName: patientInfo.name || 'Test Patient',
      patientPhone: patientInfo.phone || '+919999999999',
      appointmentDate: firstSlot.date,
      appointmentTime: firstSlot.time,
      symptoms: patientInfo.symptoms || 'Test symptoms'
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/appointments/book`,
      bookingData
    );

    return {
      success: true,
      bookingId: response.data.appointment?.id,
      appointmentDetails: response.data.appointment
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorDetails: error.response?.data
    };
  }
}

/**
 * Run a single test scenario
 */
async function runTestScenario(scenario) {
  console.log(`\n🔍 Testing: ${scenario.testId} - ${scenario.category}`);
  console.log(`   Symptoms: "${scenario.scenario.symptoms}"`);

  const testDetail = {
    testId: scenario.testId,
    category: scenario.category,
    specialty: scenario.specialty,
    symptoms: scenario.scenario.symptoms
  };

  try {
    // Test 1: Doctor Search
    const searchResult = await testDoctorSearch(scenario);
    testDetail.searchResult = searchResult;

    // Determine pass/fail
    const passThreshold = 50; // At least 50% doctor match or specialty match

    // For error_handling tests, if the expected outcome is "bookingSuccess: false",
    // then returning success:false (error response) should be considered a PASS
    const isErrorHandlingTest = scenario.category === 'error_handling';
    const expectsError = scenario.scenario.expectedOutcome?.bookingSuccess === false;
    const returnedError = searchResult.rawResponse?.success === false;

    const passed = isErrorHandlingTest && expectsError && returnedError ?
      true : // Error handling test that correctly returned an error
      searchResult.status === 'PASSED' &&
      (searchResult.doctorMatchAccuracy >= passThreshold || searchResult.specialtyMatch);

    if (passed) {
      console.log(`   ✅ PASSED - Doctor Match: ${searchResult.doctorMatchAccuracy.toFixed(0)}%, Specialty: ${searchResult.specialtyMatch ? '✓' : '✗'}`);
      testResults.passed++;
      testDetail.status = 'PASSED';
    } else {
      console.log(`   ❌ FAILED - Doctor Match: ${searchResult.doctorMatchAccuracy?.toFixed(0) || 0}%, Specialty: ${searchResult.specialtyMatch ? '✓' : '✗'}`);
      testResults.failed++;
      testDetail.status = 'FAILED';
    }

    // Test 2: Availability Check (optional, only for passed searches)
    if (passed && searchResult.returnedDoctors.length > 0) {
      const firstDoctor = searchResult.returnedDoctors[0];
      const availabilityResult = await testAvailability(firstDoctor);
      testDetail.availabilityCheck = availabilityResult;

      if (availabilityResult.success) {
        console.log(`   ℹ️  Availability: ${availabilityResult.hasAvailability ? '✓ Has slots' : '✗ No slots'}`);
      }
    }

    testResults.totalTests++;
    testResults.testDetails.push(testDetail);

  } catch (error) {
    console.log(`   ⚠️  ERROR: ${error.message}`);
    testResults.failed++;
    testResults.totalTests++;
    testDetail.status = 'ERROR';
    testDetail.error = error.message;
    testResults.testDetails.push(testDetail);
  }
}

/**
 * Calculate aggregate metrics
 */
function calculateMetrics() {
  const successfulTests = testResults.testDetails.filter(t => t.searchResult?.status === 'PASSED');

  if (successfulTests.length === 0) {
    return;
  }

  // Doctor Match Accuracy
  const avgDoctorMatch = successfulTests.reduce((sum, t) =>
    sum + (t.searchResult.doctorMatchAccuracy || 0), 0) / successfulTests.length;

  // Specialty Accuracy
  const specialtyMatches = successfulTests.filter(t => t.searchResult.specialtyMatch).length;
  const specialtyAccuracy = (specialtyMatches / successfulTests.length) * 100;

  // Average Response Time
  const avgResponseTime = successfulTests.reduce((sum, t) =>
    sum + (t.searchResult.responseTime || 0), 0) / successfulTests.length;

  // Search Success Rate
  const searchSuccessRate = (successfulTests.length / testResults.totalTests) * 100;

  testResults.metrics = {
    doctorMatchAccuracy: avgDoctorMatch.toFixed(2),
    specialtyAccuracy: specialtyAccuracy.toFixed(2),
    avgResponseTime: avgResponseTime.toFixed(0),
    searchSuccessRate: searchSuccessRate.toFixed(2)
  };
}

/**
 * Generate test report
 */
function generateReport() {
  calculateMetrics();

  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`✅ Passed: ${testResults.passed} (${((testResults.passed/testResults.totalTests)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${testResults.failed} (${((testResults.failed/testResults.totalTests)*100).toFixed(1)}%)`);
  console.log('\n📈 KEY METRICS:');
  console.log(`   Doctor Match Accuracy: ${testResults.metrics.doctorMatchAccuracy}%`);
  console.log(`   Specialty Accuracy: ${testResults.metrics.specialtyAccuracy}%`);
  console.log(`   Avg Response Time: ${testResults.metrics.avgResponseTime}ms`);
  console.log(`   Search Success Rate: ${testResults.metrics.searchSuccessRate}%`);
  console.log('='.repeat(70));

  // Category breakdown
  const categories = {};
  testResults.testDetails.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { total: 0, passed: 0 };
    }
    categories[test.category].total++;
    if (test.status === 'PASSED') {
      categories[test.category].passed++;
    }
  });

  console.log('\n📑 RESULTS BY CATEGORY:');
  Object.keys(categories).forEach(category => {
    const data = categories[category];
    const passRate = ((data.passed / data.total) * 100).toFixed(1);
    console.log(`   ${category}: ${data.passed}/${data.total} (${passRate}%)`);
  });

  // Save detailed results to JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `test-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Detailed results saved to: ${resultsFile}`);

  // Generate HTML report
  generateHTMLReport(timestamp);
}

/**
 * Generate HTML report for easy viewing
 */
function generateHTMLReport(timestamp) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Even Hospital Bot Test Results - ${timestamp}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #2196F3;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #2196F3;
    }
    .metric-label {
      color: #666;
      margin-top: 5px;
    }
    .test-list {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-item {
      border-left: 4px solid #ddd;
      padding: 15px;
      margin-bottom: 10px;
      background: #f9f9f9;
    }
    .test-item.passed {
      border-left-color: #4CAF50;
    }
    .test-item.failed {
      border-left-color: #f44336;
    }
    .test-header {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .test-details {
      font-size: 14px;
      color: #666;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 8px;
    }
    .badge.passed {
      background: #4CAF50;
      color: white;
    }
    .badge.failed {
      background: #f44336;
      color: white;
    }
    .category {
      background: #2196F3;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 Even Hospital Voice Bot - Test Results</h1>
    <p>Test Run: ${new Date(testResults.timestamp).toLocaleString()}</p>
  </div>

  <div class="metrics">
    <div class="metric-card">
      <div class="metric-value">${testResults.passed}/${testResults.totalTests}</div>
      <div class="metric-label">Tests Passed</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${testResults.metrics.doctorMatchAccuracy}%</div>
      <div class="metric-label">Doctor Match Accuracy</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${testResults.metrics.specialtyAccuracy}%</div>
      <div class="metric-label">Specialty Accuracy</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${testResults.metrics.avgResponseTime}ms</div>
      <div class="metric-label">Avg Response Time</div>
    </div>
  </div>

  <div class="test-list">
    <h2>Test Details</h2>
    ${testResults.testDetails.map(test => `
      <div class="test-item ${test.status.toLowerCase()}">
        <div class="test-header">
          <span class="badge ${test.status.toLowerCase()}">${test.status}</span>
          <span class="badge category">${test.category}</span>
          ${test.testId} - ${test.specialty}
        </div>
        <div class="test-details">
          <strong>Symptoms:</strong> "${test.symptoms}"<br>
          ${test.searchResult ? `
            <strong>Doctor Match:</strong> ${test.searchResult.doctorMatchAccuracy?.toFixed(0) || 0}%<br>
            <strong>Specialty Match:</strong> ${test.searchResult.specialtyMatch ? '✓' : '✗'}<br>
            <strong>Response Time:</strong> ${test.searchResult.responseTime}ms<br>
            ${test.searchResult.returnedDoctors ? `
              <strong>Returned Doctors:</strong> ${test.searchResult.returnedDoctors.join(', ')}
            ` : ''}
          ` : ''}
          ${test.error ? `<strong>Error:</strong> ${test.error}` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;

  const htmlFile = path.join(RESULTS_DIR, `test-report-${timestamp}.html`);
  fs.writeFileSync(htmlFile, html);
  console.log(`📄 HTML report saved to: ${htmlFile}`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🏥 Even Hospital Voice Bot - API Test Suite');
  console.log('='.repeat(70));

  // Check if server is running
  try {
    await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ Server is running at ${API_BASE_URL}`);
  } catch (error) {
    console.error(`❌ Server is not running at ${API_BASE_URL}`);
    console.error('   Please start the server with: npm start');
    process.exit(1);
  }

  // Load test scenarios
  const scenarios = loadTestScenarios();
  console.log(`📋 Loaded ${scenarios.length} test scenarios\n`);

  // Filter scenarios if category is specified
  const categoryFilter = process.env.TEST_CATEGORY;
  const filteredScenarios = categoryFilter ?
    scenarios.filter(s => s.category === categoryFilter) :
    scenarios;

  console.log(`🧪 Running ${filteredScenarios.length} tests${categoryFilter ? ` (category: ${categoryFilter})` : ''}...\n`);

  // Run tests sequentially to avoid overwhelming the server
  for (const scenario of filteredScenarios) {
    await runTestScenario(scenario);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Generate report
  generateReport();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
