import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Appointment Booking Test Suite
 * Tests the complete appointment booking flow
 */

const API_BASE_URL = 'http://localhost:3001';
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  testDetails: []
};

// Test data
const testDoctor = 'Dr. Harish Puranik';
const testPatient = {
  name: 'John Doe',
  phone: '+91-9876543210'
};

// Store created appointment IDs for cleanup
const createdAppointments = [];

/**
 * Helper: Get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Helper: Get date N days from now
 */
function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Get a past date
 */
function getPastDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Test 1: Check Doctor Availability
 */
async function testCheckAvailability() {
  console.log('\n🔍 Test 1: Check Doctor Availability');
  const testName = 'Check Doctor Availability';

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/appointments/availability/${encodeURIComponent(testDoctor)}`,
      { params: { date: getTomorrowDate() } }
    );

    if (response.data.success && response.data.availableSlots && response.data.availableSlots.length > 0) {
      console.log(`   ✅ PASSED - Found ${response.data.availableSlots.length} available slots`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        details: `Found ${response.data.availableSlots.length} slots`,
        data: response.data
      });
      return response.data.availableSlots[0]; // Return first slot for next test
    } else {
      throw new Error('No available slots found');
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`);
    testResults.failed++;
    testResults.testDetails.push({
      test: testName,
      status: 'FAILED',
      error: error.message
    });
    return null;
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 2: Create Appointment with Specific Time
 */
async function testCreateAppointmentWithTime(timeSlot) {
  console.log('\n🔍 Test 2: Create Appointment with Specific Time');
  const testName = 'Create Appointment with Specific Time';

  try {
    const appointmentData = {
      doctor_name: testDoctor,
      patient_name: testPatient.name,
      patient_phone: testPatient.phone,
      preferred_date: getTomorrowDate(),
      preferred_time: timeSlot
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/appointments/book`,
      appointmentData
    );

    if (response.data.success && response.data.appointment) {
      console.log(`   ✅ PASSED - Appointment ID: ${response.data.appointmentId}`);
      createdAppointments.push(response.data.appointmentId);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        appointmentId: response.data.appointment.id,
        data: response.data
      });
      // Return appointment with normalized field names for tests
      return {
        id: response.data.appointmentId,
        doctor_name: response.data.appointment.doctorName,
        patient_name: response.data.appointment.patientName,
        date: response.data.appointment.appointmentDate,
        time: response.data.appointment.appointmentTime,
        status: response.data.appointment.status
      };
    } else {
      throw new Error('Appointment creation failed');
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.response?.data?.message || error.message}`);
    testResults.failed++;
    testResults.testDetails.push({
      test: testName,
      status: 'FAILED',
      error: error.response?.data?.message || error.message
    });
    return null;
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 3: Create Appointment without Specific Time (Auto-assign)
 */
async function testCreateAppointmentAutoTime() {
  console.log('\n🔍 Test 3: Create Appointment without Specific Time (Auto-assign)');
  const testName = 'Create Appointment Auto-assign Time';

  try {
    const appointmentData = {
      doctor_name: testDoctor,
      patient_name: 'Jane Smith',
      patient_phone: '+91-9876543211',
      preferred_date: getFutureDate(2)
      // No preferred_time - should auto-assign first available
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/appointments/book`,
      appointmentData
    );

    if (response.data.success && response.data.appointment) {
      console.log(`   ✅ PASSED - Auto-assigned time: ${response.data.appointment.appointmentTime}`);
      createdAppointments.push(response.data.appointmentId);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        appointmentId: response.data.appointmentId,
        assignedTime: response.data.appointment.appointmentTime,
        data: response.data
      });
      // Return appointment with normalized field names for tests
      return {
        id: response.data.appointmentId,
        doctor_name: response.data.appointment.doctorName,
        patient_name: response.data.appointment.patientName,
        date: response.data.appointment.appointmentDate,
        time: response.data.appointment.appointmentTime,
        status: response.data.appointment.status
      };
    } else {
      throw new Error('Auto-assignment failed');
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.response?.data?.message || error.message}`);
    testResults.failed++;
    testResults.testDetails.push({
      test: testName,
      status: 'FAILED',
      error: error.response?.data?.message || error.message
    });
    return null;
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 4: Retrieve Appointment by ID
 */
async function testRetrieveAppointment(appointmentId) {
  console.log('\n🔍 Test 4: Retrieve Appointment by ID');
  const testName = 'Retrieve Appointment';

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/appointments/${appointmentId}`
    );

    if (response.data.success && response.data.appointment) {
      console.log(`   ✅ PASSED - Retrieved appointment for ${response.data.appointment.patient_name}`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        data: response.data
      });
      return true;
    } else {
      throw new Error('Appointment not found');
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`);
    testResults.failed++;
    testResults.testDetails.push({
      test: testName,
      status: 'FAILED',
      error: error.message
    });
    return false;
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 5: Get Upcoming Appointments
 */
async function testGetUpcomingAppointments() {
  console.log('\n🔍 Test 5: Get Upcoming Appointments');
  const testName = 'Get Upcoming Appointments';

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/appointments/upcoming`
    );

    if (response.data.success) {
      const count = response.data.appointments?.length || 0;
      console.log(`   ✅ PASSED - Found ${count} upcoming appointments`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        count: count,
        data: response.data
      });
      return true;
    } else {
      throw new Error('Failed to retrieve upcoming appointments');
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`);
    testResults.failed++;
    testResults.testDetails.push({
      test: testName,
      status: 'FAILED',
      error: error.message
    });
    return false;
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 6: Double Booking Prevention (Same time slot)
 */
async function testDoubleBookingPrevention(appointment) {
  console.log('\n🔍 Test 6: Double Booking Prevention');
  const testName = 'Double Booking Prevention';

  try {
    const duplicateData = {
      doctor_name: appointment.doctor_name,
      patient_name: 'Another Patient',
      patient_phone: '+91-9876543299',
      preferred_date: appointment.date,
      preferred_time: appointment.time
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/appointments/book`,
      duplicateData
    );

    // Check if request succeeded (it shouldn't - double booking)
    if (response.data.success) {
      console.log(`   ❌ FAILED - Double booking was allowed (should be prevented)`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: 'Double booking was allowed'
      });
      // Clean up if it was created
      if (response.data.appointmentId) {
        createdAppointments.push(response.data.appointmentId);
      }
    } else if (response.data.message?.includes('already booked') ||
               response.data.message?.includes('not available')) {
      // API returned success:false with booking conflict message - this is correct!
      console.log(`   ✅ PASSED - Double booking correctly prevented`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        message: 'Double booking prevented as expected'
      });
    } else {
      console.log(`   ❌ FAILED - Unexpected response: ${response.data.message}`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: response.data.message || 'Unexpected response'
      });
    }
  } catch (error) {
    // Error is also acceptable (double booking prevented)
    if (error.response?.data?.message?.includes('already booked') ||
        error.response?.data?.message?.includes('not available')) {
      console.log(`   ✅ PASSED - Double booking correctly prevented`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        message: 'Double booking prevented as expected'
      });
    } else {
      console.log(`   ❌ FAILED - Unexpected error: ${error.response?.data?.message || error.message}`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: error.response?.data?.message || error.message
      });
    }
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 7: Invalid Date (Past Date)
 */
async function testInvalidPastDate() {
  console.log('\n🔍 Test 7: Reject Past Date');
  const testName = 'Reject Past Date';

  try {
    const pastData = {
      doctor_name: testDoctor,
      patient_name: 'Test Patient',
      patient_phone: '+91-9876543288',
      preferred_date: getPastDate(),
      preferred_time: '10:00 AM'
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/appointments/book`,
      pastData
    );

    // Check if request succeeded (it shouldn't)
    if (response.data.success) {
      console.log(`   ❌ FAILED - Past date was accepted (should be rejected)`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: 'Past date was accepted'
      });
      if (response.data.appointmentId) {
        createdAppointments.push(response.data.appointmentId);
      }
    } else if (response.data.message?.includes('past')) {
      // API returned success:false with past date message - this is correct!
      console.log(`   ✅ PASSED - Past date correctly rejected`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        message: 'Past date rejected as expected'
      });
    } else {
      console.log(`   ❌ FAILED - Unexpected response: ${response.data.message}`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: response.data.message || 'Unexpected response'
      });
    }
  } catch (error) {
    // Error is also acceptable (500 error or network error)
    if (error.response?.data?.message?.includes('past')) {
      console.log(`   ✅ PASSED - Past date correctly rejected`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        message: 'Past date rejected as expected'
      });
    } else {
      console.log(`   ❌ FAILED - Unexpected error: ${error.response?.data?.message || error.message}`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: error.response?.data?.message || error.message
      });
    }
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 8: Missing Required Fields
 */
async function testMissingRequiredFields() {
  console.log('\n🔍 Test 8: Reject Missing Required Fields');
  const testName = 'Reject Missing Required Fields';

  try {
    const incompleteData = {
      doctor_name: testDoctor,
      // Missing patient_name, patient_phone
      preferred_date: getTomorrowDate()
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/appointments/book`,
      incompleteData
    );

    // Check if request succeeded (it shouldn't)
    if (response.data.success) {
      console.log(`   ❌ FAILED - Incomplete data was accepted`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: 'Incomplete data was accepted'
      });
    } else if (response.data.message?.includes('Missing') ||
               response.data.message?.includes('required')) {
      // API returned success:false with missing fields message - this is correct!
      console.log(`   ✅ PASSED - Missing fields correctly rejected`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        message: 'Missing fields rejected as expected'
      });
    } else {
      console.log(`   ❌ FAILED - Unexpected response: ${response.data.message}`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: response.data.message || 'Unexpected response'
      });
    }
  } catch (error) {
    // Error is also acceptable
    if (error.response?.data?.message?.includes('Missing') ||
        error.response?.data?.message?.includes('required')) {
      console.log(`   ✅ PASSED - Missing fields correctly rejected`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        message: 'Missing fields rejected as expected'
      });
    } else {
      console.log(`   ❌ FAILED - Unexpected error: ${error.response?.data?.message || error.message}`);
      testResults.failed++;
      testResults.testDetails.push({
        test: testName,
        status: 'FAILED',
        error: error.response?.data?.message || error.message
      });
    }
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 9: Cancel Appointment
 */
async function testCancelAppointment(appointmentId) {
  console.log('\n🔍 Test 9: Cancel Appointment');
  const testName = 'Cancel Appointment';

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/appointments/${appointmentId}/cancel`,
      { cancellation_reason: 'Test cancellation' }
    );

    if (response.data.success) {
      console.log(`   ✅ PASSED - Appointment cancelled successfully`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        data: response.data
      });
      return true;
    } else {
      throw new Error('Cancellation failed');
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.response?.data?.message || error.message}`);
    testResults.failed++;
    testResults.testDetails.push({
      test: testName,
      status: 'FAILED',
      error: error.response?.data?.message || error.message
    });
    return false;
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Test 10: Retrieve Cancelled Appointment
 */
async function testRetrieveCancelledAppointment(appointmentId) {
  console.log('\n🔍 Test 10: Retrieve Cancelled Appointment');
  const testName = 'Retrieve Cancelled Appointment';

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/appointments/${appointmentId}`
    );

    if (response.data.success && response.data.appointment.status === 'cancelled') {
      console.log(`   ✅ PASSED - Cancelled appointment has correct status`);
      testResults.passed++;
      testResults.testDetails.push({
        test: testName,
        status: 'PASSED',
        data: response.data
      });
      return true;
    } else {
      throw new Error('Cancelled appointment status incorrect');
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`);
    testResults.failed++;
    testResults.testDetails.push({
      test: testName,
      status: 'FAILED',
      error: error.message
    });
    return false;
  } finally {
    testResults.totalTests++;
  }
}

/**
 * Cleanup: Cancel all test appointments
 */
async function cleanup() {
  console.log('\n🧹 Cleanup: Cancelling test appointments...');

  for (const appointmentId of createdAppointments) {
    try {
      await axios.post(
        `${API_BASE_URL}/api/appointments/${appointmentId}/cancel`,
        { cancellation_reason: 'Test cleanup' }
      );
      console.log(`   ✓ Cancelled appointment ${appointmentId}`);
    } catch (error) {
      console.log(`   ⚠️  Could not cancel ${appointmentId}: ${error.message}`);
    }
  }
}

/**
 * Main test runner
 */
async function runAppointmentTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    Even Hospital - Appointment Booking Test Suite         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check server availability
  try {
    await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.');
    process.exit(1);
  }

  console.log('🧪 Running Appointment Booking Tests...\n');
  console.log('======================================================================');

  // Run tests in sequence
  const firstSlot = await testCheckAvailability();

  let firstAppointment = null;
  if (firstSlot) {
    firstAppointment = await testCreateAppointmentWithTime(firstSlot);
  }

  const autoAppointment = await testCreateAppointmentAutoTime();

  if (firstAppointment) {
    await testRetrieveAppointment(firstAppointment.id);
  }

  await testGetUpcomingAppointments();

  if (firstAppointment) {
    await testDoubleBookingPrevention(firstAppointment);
  }

  await testInvalidPastDate();
  await testMissingRequiredFields();

  if (firstAppointment) {
    await testCancelAppointment(firstAppointment.id);
    await testRetrieveCancelledAppointment(firstAppointment.id);
  }

  // Cleanup remaining appointments
  await cleanup();

  // Print summary
  console.log('\n======================================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('======================================================================');
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`✅ Passed: ${testResults.passed} (${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${testResults.failed} (${((testResults.failed / testResults.totalTests) * 100).toFixed(1)}%)`);
  console.log('======================================================================\n');

  // Save results
  const fs = await import('fs');
  const resultsPath = join(__dirname, 'results', `appointment-test-results-${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`💾 Detailed results saved to: ${resultsPath}\n`);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAppointmentTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
