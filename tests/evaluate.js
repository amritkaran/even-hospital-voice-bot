/**
 * Even Hospital Voice Bot - Evaluation & Scoring System
 * Analyzes test results and generates comprehensive metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.join(__dirname, 'results');

/**
 * Success Metrics Thresholds
 */
const THRESHOLDS = {
  doctorMatchAccuracy: {
    excellent: 90,
    good: 75,
    acceptable: 60,
    poor: 0
  },
  specialtyAccuracy: {
    excellent: 95,
    good: 85,
    acceptable: 70,
    poor: 0
  },
  responseTime: {
    excellent: 1000,    // < 1 second
    good: 2000,         // < 2 seconds
    acceptable: 3000,   // < 3 seconds
    slow: 5000          // < 5 seconds
  },
  searchSuccessRate: {
    excellent: 90,
    good: 80,
    acceptable: 70,
    poor: 0
  }
};

/**
 * Load the most recent test results
 */
function loadLatestResults() {
  try {
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(f => f.startsWith('test-results-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error('❌ No test results found. Run tests first with: npm test');
      process.exit(1);
    }

    const latestFile = path.join(RESULTS_DIR, files[0]);
    const data = fs.readFileSync(latestFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading test results:', error.message);
    process.exit(1);
  }
}

/**
 * Get performance rating based on threshold
 */
function getRating(value, thresholds, lowerIsBetter = false) {
  if (lowerIsBetter) {
    if (value <= thresholds.excellent) return 'EXCELLENT';
    if (value <= thresholds.good) return 'GOOD';
    if (value <= thresholds.acceptable) return 'ACCEPTABLE';
    if (value <= thresholds.slow) return 'SLOW';
    return 'VERY SLOW';
  } else {
    if (value >= thresholds.excellent) return 'EXCELLENT';
    if (value >= thresholds.good) return 'GOOD';
    if (value >= thresholds.acceptable) return 'ACCEPTABLE';
    return 'POOR';
  }
}

/**
 * Analyze performance by specialty
 */
function analyzeBySpecialty(results) {
  const specialties = {};

  results.testDetails.forEach(test => {
    if (!test.specialty || !test.searchResult) return;

    if (!specialties[test.specialty]) {
      specialties[test.specialty] = {
        total: 0,
        passed: 0,
        failed: 0,
        avgDoctorMatch: 0,
        avgResponseTime: 0,
        tests: []
      };
    }

    const specialty = specialties[test.specialty];
    specialty.total++;
    specialty.tests.push(test);

    if (test.status === 'PASSED') {
      specialty.passed++;
    } else {
      specialty.failed++;
    }
  });

  // Calculate averages
  Object.keys(specialties).forEach(key => {
    const specialty = specialties[key];
    const validTests = specialty.tests.filter(t => t.searchResult?.doctorMatchAccuracy !== undefined);

    if (validTests.length > 0) {
      specialty.avgDoctorMatch = validTests.reduce((sum, t) =>
        sum + t.searchResult.doctorMatchAccuracy, 0) / validTests.length;

      specialty.avgResponseTime = validTests.reduce((sum, t) =>
        sum + t.searchResult.responseTime, 0) / validTests.length;
    }

    specialty.passRate = (specialty.passed / specialty.total) * 100;
  });

  return specialties;
}

/**
 * Analyze performance by category
 */
function analyzeByCategory(results) {
  const categories = {};

  results.testDetails.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      };
    }

    const category = categories[test.category];
    category.total++;
    category.tests.push(test);

    if (test.status === 'PASSED') {
      category.passed++;
    } else {
      category.failed++;
    }
  });

  // Calculate pass rates
  Object.keys(categories).forEach(key => {
    const category = categories[key];
    category.passRate = (category.passed / category.total) * 100;
  });

  return categories;
}

/**
 * Identify problematic areas
 */
function identifyIssues(results) {
  const issues = [];

  // Low doctor match accuracy tests
  const lowMatchTests = results.testDetails.filter(t =>
    t.searchResult?.doctorMatchAccuracy !== undefined &&
    t.searchResult.doctorMatchAccuracy < 50
  );

  if (lowMatchTests.length > 0) {
    issues.push({
      severity: 'HIGH',
      category: 'Doctor Match Accuracy',
      count: lowMatchTests.length,
      description: `${lowMatchTests.length} tests have less than 50% doctor match accuracy`,
      examples: lowMatchTests.slice(0, 3).map(t => ({
        testId: t.testId,
        symptoms: t.symptoms,
        accuracy: t.searchResult.doctorMatchAccuracy.toFixed(1) + '%'
      }))
    });
  }

  // Specialty mismatch
  const specialtyMismatches = results.testDetails.filter(t =>
    t.searchResult?.specialtyMatch === false
  );

  if (specialtyMismatches.length > 0) {
    issues.push({
      severity: 'MEDIUM',
      category: 'Specialty Mismatch',
      count: specialtyMismatches.length,
      description: `${specialtyMismatches.length} tests returned incorrect specialty`,
      examples: specialtyMismatches.slice(0, 3).map(t => ({
        testId: t.testId,
        symptoms: t.symptoms,
        expected: t.searchResult.expectedSpecialty,
        returned: t.searchResult.returnedSpecialty
      }))
    });
  }

  // Slow responses
  const slowTests = results.testDetails.filter(t =>
    t.searchResult?.responseTime > THRESHOLDS.responseTime.acceptable
  );

  if (slowTests.length > 0) {
    issues.push({
      severity: 'LOW',
      category: 'Slow Response Time',
      count: slowTests.length,
      description: `${slowTests.length} tests took longer than ${THRESHOLDS.responseTime.acceptable}ms`,
      examples: slowTests.slice(0, 3).map(t => ({
        testId: t.testId,
        responseTime: t.searchResult.responseTime + 'ms'
      }))
    });
  }

  // Failed tests
  const failedTests = results.testDetails.filter(t => t.status === 'FAILED' || t.status === 'ERROR');

  if (failedTests.length > 0) {
    issues.push({
      severity: 'HIGH',
      category: 'Test Failures',
      count: failedTests.length,
      description: `${failedTests.length} tests failed to execute properly`,
      examples: failedTests.slice(0, 3).map(t => ({
        testId: t.testId,
        error: t.error || 'Unknown error'
      }))
    });
  }

  return issues.sort((a, b) => {
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Generate recommendations
 */
function generateRecommendations(results, issues, specialtyAnalysis) {
  const recommendations = [];

  // Overall performance recommendations
  const doctorMatchAccuracy = parseFloat(results.metrics.doctorMatchAccuracy);
  const specialtyAccuracy = parseFloat(results.metrics.specialtyAccuracy);

  if (doctorMatchAccuracy < THRESHOLDS.doctorMatchAccuracy.good) {
    recommendations.push({
      priority: 'HIGH',
      area: 'RAG System',
      recommendation: 'Improve doctor matching algorithm',
      details: `Current doctor match accuracy is ${doctorMatchAccuracy.toFixed(1)}%. Consider:
        - Enhancing the embeddings with more medical synonyms
        - Tuning the hybrid search weights
        - Adding more patient phrase variations to the RAG document`
    });
  }

  if (specialtyAccuracy < THRESHOLDS.specialtyAccuracy.good) {
    recommendations.push({
      priority: 'HIGH',
      area: 'Specialty Classification',
      recommendation: 'Improve specialty identification',
      details: `Current specialty accuracy is ${specialtyAccuracy.toFixed(1)}%. Consider:
        - Adding more condition-to-specialty mappings
        - Improving symptom parsing and categorization
        - Reviewing specialty descriptions for clarity`
    });
  }

  // Response time recommendations
  const avgResponseTime = parseFloat(results.metrics.avgResponseTime);
  if (avgResponseTime > THRESHOLDS.responseTime.good) {
    recommendations.push({
      priority: 'MEDIUM',
      area: 'Performance',
      recommendation: 'Optimize response time',
      details: `Average response time is ${avgResponseTime.toFixed(0)}ms. Consider:
        - Implementing caching for common queries
        - Optimizing vector search indexing
        - Using faster embedding models if possible`
    });
  }

  // Specialty-specific recommendations
  const poorPerformingSpecialties = Object.keys(specialtyAnalysis)
    .filter(key => specialtyAnalysis[key].passRate < 70)
    .sort((a, b) => specialtyAnalysis[a].passRate - specialtyAnalysis[b].passRate);

  if (poorPerformingSpecialties.length > 0) {
    poorPerformingSpecialties.slice(0, 3).forEach(specialty => {
      const data = specialtyAnalysis[specialty];
      recommendations.push({
        priority: 'MEDIUM',
        area: `Specialty: ${specialty}`,
        recommendation: `Improve ${specialty} doctor matching`,
        details: `Pass rate is only ${data.passRate.toFixed(1)}%. Review:
          - Symptom descriptions in RAG document for ${specialty}
          - Doctor profiles and expertise keywords
          - Patient phrase variations for common ${specialty} conditions`
      });
    });
  }

  return recommendations;
}

/**
 * Print evaluation report
 */
function printEvaluationReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 EVALUATION REPORT - EVEN HOSPITAL VOICE BOT');
  console.log('='.repeat(80));
  console.log(`Test Run: ${new Date(results.timestamp).toLocaleString()}`);
  console.log(`Total Tests: ${results.totalTests} | Passed: ${results.passed} | Failed: ${results.failed}`);

  // Overall Performance
  console.log('\n' + '─'.repeat(80));
  console.log('🎯 OVERALL PERFORMANCE METRICS');
  console.log('─'.repeat(80));

  const metrics = [
    {
      name: 'Doctor Match Accuracy',
      value: parseFloat(results.metrics.doctorMatchAccuracy),
      unit: '%',
      rating: getRating(parseFloat(results.metrics.doctorMatchAccuracy), THRESHOLDS.doctorMatchAccuracy)
    },
    {
      name: 'Specialty Accuracy',
      value: parseFloat(results.metrics.specialtyAccuracy),
      unit: '%',
      rating: getRating(parseFloat(results.metrics.specialtyAccuracy), THRESHOLDS.specialtyAccuracy)
    },
    {
      name: 'Search Success Rate',
      value: parseFloat(results.metrics.searchSuccessRate),
      unit: '%',
      rating: getRating(parseFloat(results.metrics.searchSuccessRate), THRESHOLDS.searchSuccessRate)
    },
    {
      name: 'Avg Response Time',
      value: parseFloat(results.metrics.avgResponseTime),
      unit: 'ms',
      rating: getRating(parseFloat(results.metrics.avgResponseTime), THRESHOLDS.responseTime, true)
    }
  ];

  metrics.forEach(metric => {
    const icon = metric.rating === 'EXCELLENT' ? '🟢' :
                 metric.rating === 'GOOD' ? '🟡' :
                 metric.rating === 'ACCEPTABLE' ? '🟠' : '🔴';
    console.log(`${icon} ${metric.name}: ${metric.value}${metric.unit} [${metric.rating}]`);
  });

  // Specialty Analysis
  console.log('\n' + '─'.repeat(80));
  console.log('🏥 PERFORMANCE BY SPECIALTY');
  console.log('─'.repeat(80));

  const specialtyAnalysis = analyzeBySpecialty(results);
  const specialtyEntries = Object.entries(specialtyAnalysis)
    .sort((a, b) => b[1].passRate - a[1].passRate);

  specialtyEntries.forEach(([specialty, data]) => {
    const icon = data.passRate >= 90 ? '🟢' :
                 data.passRate >= 75 ? '🟡' :
                 data.passRate >= 60 ? '🟠' : '🔴';
    console.log(`${icon} ${specialty}`);
    console.log(`   Pass Rate: ${data.passRate.toFixed(1)}% (${data.passed}/${data.total})`);
    console.log(`   Doctor Match: ${data.avgDoctorMatch.toFixed(1)}% | Response Time: ${data.avgResponseTime.toFixed(0)}ms`);
  });

  // Category Analysis
  console.log('\n' + '─'.repeat(80));
  console.log('📁 PERFORMANCE BY TEST CATEGORY');
  console.log('─'.repeat(80));

  const categoryAnalysis = analyzeByCategory(results);
  const categoryEntries = Object.entries(categoryAnalysis)
    .sort((a, b) => b[1].passRate - a[1].passRate);

  categoryEntries.forEach(([category, data]) => {
    const icon = data.passRate >= 90 ? '🟢' :
                 data.passRate >= 75 ? '🟡' :
                 data.passRate >= 60 ? '🟠' : '🔴';
    console.log(`${icon} ${category}: ${data.passRate.toFixed(1)}% (${data.passed}/${data.total})`);
  });

  // Issues
  console.log('\n' + '─'.repeat(80));
  console.log('⚠️  IDENTIFIED ISSUES');
  console.log('─'.repeat(80));

  const issues = identifyIssues(results);
  if (issues.length === 0) {
    console.log('✅ No significant issues identified!');
  } else {
    issues.forEach((issue, index) => {
      const severityIcon = issue.severity === 'HIGH' ? '🔴' :
                           issue.severity === 'MEDIUM' ? '🟡' : '🟠';
      console.log(`\n${severityIcon} Issue #${index + 1}: ${issue.category} [${issue.severity}]`);
      console.log(`   ${issue.description}`);
      if (issue.examples && issue.examples.length > 0) {
        console.log('   Examples:');
        issue.examples.forEach(ex => {
          console.log(`   - ${JSON.stringify(ex, null, 2).split('\n').join('\n     ')}`);
        });
      }
    });
  }

  // Recommendations
  console.log('\n' + '─'.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('─'.repeat(80));

  const recommendations = generateRecommendations(results, issues, specialtyAnalysis);
  if (recommendations.length === 0) {
    console.log('✅ System performing well! No immediate recommendations.');
  } else {
    recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' :
                           rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`\n${priorityIcon} Recommendation #${index + 1}: ${rec.recommendation} [${rec.priority}]`);
      console.log(`   Area: ${rec.area}`);
      console.log(`   Details: ${rec.details.split('\n').join('\n   ')}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // Save evaluation report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const evaluationFile = path.join(RESULTS_DIR, `evaluation-${timestamp}.json`);
  const evaluationData = {
    timestamp: new Date().toISOString(),
    testResults: results,
    specialtyAnalysis,
    categoryAnalysis,
    issues,
    recommendations
  };
  fs.writeFileSync(evaluationFile, JSON.stringify(evaluationData, null, 2));
  console.log(`\n💾 Evaluation saved to: ${evaluationFile}`);
}

/**
 * Main evaluation function
 */
function runEvaluation() {
  console.log('🔍 Loading test results...');
  const results = loadLatestResults();
  console.log(`✅ Loaded results from: ${results.timestamp}`);

  printEvaluationReport(results);
}

// Run evaluation
runEvaluation();
