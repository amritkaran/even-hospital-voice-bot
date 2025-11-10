# Even Hospital Voice Bot - Testing Framework

Comprehensive testing suite for validating RAG performance, doctor recommendations, and appointment booking functionality.

## 📁 Structure

```
tests/
├── scenarios/
│   └── test-scenarios.json     # 60 test cases covering all specialties
├── results/                     # Generated test results and reports
├── api-tests.js                # Main test runner
├── evaluate.js                 # Evaluation and scoring system
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

The testing framework uses the same dependencies as the main project. Ensure you've run:

```bash
npm install
```

### 2. Start the Server

The tests require the API server to be running:

```bash
npm start
```

### 3. Run Tests

```bash
# Run all tests
npm run test:api

# Run specific category
TEST_CATEGORY=happy_path npm run test:api
TEST_CATEGORY=complex_medical npm run test:api
TEST_CATEGORY=edge_cases npm run test:api
```

### 4. View Evaluation

After running tests, generate detailed evaluation:

```bash
npm run test:evaluate
```

## 📊 Test Scenarios

### Total Scenarios: 60

#### Categories:

1. **happy_path** (25 tests)
   - Straightforward symptoms → correct doctor matches
   - All 12 specialties covered
   - Standard appointment booking flows

2. **complex_medical** (10 tests)
   - Multiple symptoms
   - Chronic conditions
   - Specialist referrals
   - High-risk pregnancies

3. **edge_cases** (10 tests)
   - Vague symptoms
   - Multiple conditions
   - Unavailable specialties
   - Elderly patient care

4. **multi_turn** (8 tests)
   - Scenarios requiring clarifying questions
   - Incomplete symptom descriptions
   - Conversational flow testing

5. **error_handling** (4 tests)
   - Invalid requests
   - Unavailable services
   - Unclear inputs

6. **specialty_specific** (3 tests)
   - Multilingual support
   - Specialty-specific nuances

## 📈 Success Metrics

### Doctor Match Accuracy
- **Excellent**: ≥90%
- **Good**: ≥75%
- **Acceptable**: ≥60%
- **Poor**: <60%

Measures: Percentage of expected doctors in top 3 results

### Specialty Accuracy
- **Excellent**: ≥95%
- **Good**: ≥85%
- **Acceptable**: ≥70%
- **Poor**: <70%

Measures: Correct specialty identification

### Response Time
- **Excellent**: <1000ms
- **Good**: <2000ms
- **Acceptable**: <3000ms
- **Slow**: >3000ms

Measures: API response time

### Search Success Rate
- **Excellent**: ≥90%
- **Good**: ≥80%
- **Acceptable**: ≥70%
- **Poor**: <70%

Measures: Percentage of successful searches

## 📝 Test Output

### Console Output
```
🔍 Testing: TC001 - happy_path
   Symptoms: "knee pain and difficulty walking"
   ✅ PASSED - Doctor Match: 100%, Specialty: ✓
   ℹ️  Availability: ✓ Has slots

📊 TEST RESULTS SUMMARY
======================================================================
Total Tests: 60
✅ Passed: 54 (90.0%)
❌ Failed: 6 (10.0%)

📈 KEY METRICS:
   Doctor Match Accuracy: 87.50%
   Specialty Accuracy: 91.67%
   Avg Response Time: 850ms
   Search Success Rate: 90.00%
```

### Generated Files

1. **JSON Results**: `results/test-results-[timestamp].json`
   - Detailed test data
   - Raw API responses
   - Timing information

2. **HTML Report**: `results/test-report-[timestamp].html`
   - Visual test results
   - Interactive charts
   - Easy to share

3. **Evaluation Report**: `results/evaluation-[timestamp].json`
   - Performance analysis
   - Identified issues
   - Recommendations

## 🔍 Understanding Results

### Test Status

- **PASSED**: Test met success criteria (≥50% doctor match OR specialty match)
- **FAILED**: Test did not meet success criteria
- **ERROR**: Test encountered execution error

### Specialty Performance

Shows pass rate for each medical specialty:
```
🟢 Orthopedic Surgery
   Pass Rate: 100.0% (5/5)
   Doctor Match: 92.5% | Response Time: 780ms

🟡 General Surgery
   Pass Rate: 85.0% (17/20)
   Doctor Match: 78.3% | Response Time: 920ms
```

### Issues Identified

Categorized by severity:
- **HIGH**: Critical issues affecting accuracy
- **MEDIUM**: Moderate issues requiring attention
- **LOW**: Minor performance optimizations

### Recommendations

Actionable suggestions to improve:
- RAG system accuracy
- Response time
- Specialty-specific matching
- Edge case handling

## 🛠️ Customization

### Adding New Test Scenarios

Edit `scenarios/test-scenarios.json`:

```json
{
  "testId": "TC061",
  "category": "happy_path",
  "specialty": "Cardiology",
  "scenario": {
    "patientProfile": {
      "age": 55,
      "gender": "male",
      "language": "English"
    },
    "symptoms": "your symptom description",
    "expectedOutcome": {
      "specialty": "Expected Specialty",
      "recommendedDoctors": ["Dr. Name"],
      "bookingSuccess": true
    }
  }
}
```

### Modifying Thresholds

Edit `evaluate.js` THRESHOLDS object:

```javascript
const THRESHOLDS = {
  doctorMatchAccuracy: {
    excellent: 90,
    good: 75,
    acceptable: 60
  },
  // ... modify as needed
};
```

## 📋 Test Scenarios Coverage

### By Specialty:
- ✅ General Surgery (10 scenarios)
- ✅ Orthopedic Surgery (12 scenarios)
- ✅ Pediatrics (5 scenarios)
- ✅ Gynecology & Obstetrics (6 scenarios)
- ✅ Cardiology (4 scenarios)
- ✅ ENT (2 scenarios)
- ✅ Internal Medicine (8 scenarios)
- ✅ Urology (2 scenarios)
- ✅ Dietetics & Nutrition (2 scenarios)
- ✅ Emergency Medicine (2 scenarios)
- ✅ Gastroenterology (2 scenarios)
- ✅ Nephrology (2 scenarios)
- ✅ Psychiatry (2 scenarios)

### By Condition Type:
- Joint pain, arthritis, sports injuries
- Abdominal pain, gallstones, appendicitis
- Pregnancy, fertility, menstrual issues
- Cardiac concerns
- Pediatric emergencies
- Mental health
- Kidney disease
- And 40+ more conditions

## 🎯 Next Steps: Phase 2

After validating Phase 1 results, we'll implement:

1. **LLM-based Conversation Simulator**
   - GPT-4 acting as realistic patients
   - Full conversation flow testing
   - Natural language variations

2. **Voice Bot Integration Tests**
   - Test actual VAPI/Retell calls
   - End-to-end conversation testing
   - Voice quality assessment

3. **Continuous Testing**
   - CI/CD integration
   - Automated regression testing
   - Performance monitoring

## 📞 Support

Questions or issues with testing framework?
- Check test output for detailed error messages
- Review evaluation report recommendations
- Ensure server is running on correct port
- Verify test scenarios match your doctor database

## 🔧 Troubleshooting

### Tests failing to connect
```bash
# Check if server is running
curl http://localhost:3000/health

# If not, start server
npm start
```

### All tests failing
- Verify RAG embeddings are generated
- Check API endpoints are accessible
- Review server logs for errors

### Low accuracy scores
- Review evaluation recommendations
- Check RAG document quality
- Verify doctor profiles are complete
- Consider adding more patient phrases

---

**Built for Even Hospital Bangalore** | Test Framework v1.0
