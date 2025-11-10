# 🚀 Testing Quick Start Guide

## What We Built

A **comprehensive 3-phase testing framework** that validates your voice bot from RAG accuracy to realistic conversations:

- **Phase 1**: API/RAG Tests - 60 scenarios validating doctor search accuracy
- **Phase 2**: Appointment Booking Tests - 10 tests for the complete booking workflow
- **Phase 3**: LLM Conversation Simulator - 10 GPT-4-powered realistic patient conversations

---

## ✅ Phase 1: API/RAG Tests - Step-by-Step Instructions

### 1️⃣ Start Your Server

Open a terminal and run:

```bash
npm start
```

Wait for: `✅ Server running on http://localhost:3000`

---

### 2️⃣ Run the Tests

Open a **new terminal** (keep the server running) and execute:

```bash
npm run test:api
```

This will:
- Run 60 test scenarios across all 12 specialties
- Test doctor search accuracy
- Measure response times
- Check specialty matching

**Expected output:**
```
🔍 Testing: TC001 - happy_path
   Symptoms: "knee pain and difficulty walking"
   ✅ PASSED - Doctor Match: 100%, Specialty: ✓
```

---

### 3️⃣ View Detailed Analysis

After tests complete, run:

```bash
npm run test:evaluate
```

This generates:
- Performance ratings (Excellent/Good/Acceptable/Poor)
- Specialty-specific analysis
- Identified issues
- Actionable recommendations

---

### 4️⃣ View HTML Report

Open the generated HTML file:

```
tests/results/test-report-[timestamp].html
```

This provides a visual dashboard with:
- ✅ Pass/fail metrics
- 📊 Performance charts
- 📋 Test-by-test breakdown

---

## 📊 What Gets Measured

### 1. Doctor Match Accuracy
How well the RAG system recommends the right doctors for symptoms.

**Target:** ≥75%

### 2. Specialty Accuracy
Whether the correct medical specialty is identified.

**Target:** ≥85%

### 3. Response Time
How fast the API responds to search queries.

**Target:** <2000ms

### 4. Search Success Rate
Percentage of queries that return valid results.

**Target:** ≥80%

---

## 📁 Generated Files

All results are saved to `tests/results/`:

1. **test-results-[timestamp].json** - Raw test data
2. **test-report-[timestamp].html** - Visual dashboard
3. **evaluation-[timestamp].json** - Analysis & recommendations

---

## 🎯 Success Criteria

Your bot is performing well if:

| Metric | Target | Excellent |
|--------|--------|-----------|
| Doctor Match | ≥75% | ≥90% |
| Specialty Match | ≥85% | ≥95% |
| Response Time | <2000ms | <1000ms |
| Success Rate | ≥80% | ≥90% |

---

## 🔍 Understanding Results

### ✅ Green = Excellent
System performing great! No action needed.

### 🟡 Yellow = Good
System working well but has room for improvement.

### 🟠 Orange = Acceptable
System functional but should be optimized.

### 🔴 Red = Poor
Immediate attention required.

---

## 🛠️ Common Issues & Fixes

### Issue: Tests can't connect to server
```bash
# Solution: Check server is running
curl http://localhost:3000/health
```

### Issue: Low accuracy scores
**Check evaluation report recommendations** - it will tell you exactly what to improve.

### Issue: Slow response times
- Check if embeddings are generated
- Review server logs for bottlenecks

---

## 📋 Test Categories

### Happy Path (25 tests)
Standard symptoms → correct doctors
- "knee pain" → Orthopedic Surgery
- "chest pain" → Cardiology
- "pregnancy care" → Gynecology

### Complex Medical (10 tests)
Multiple symptoms, chronic conditions
- "diabetes and kidney problems"
- "sports injury ACL tear"

### Edge Cases (10 tests)
Unusual scenarios
- "I'm not feeling well" (vague)
- "dental checkup" (unavailable)
- Multilingual requests

### Multi-turn (8 tests)
Scenarios requiring clarification
- "My shoulder hurts" (needs follow-up)

### Error Handling (4 tests)
Invalid requests and edge cases

### Specialty Specific (3 tests)
Specialty-unique scenarios

---

## ✅ Phase 2: Appointment Booking Tests

Test the complete appointment workflow from availability checking to cancellation.

### Run Appointment Tests

```bash
npm run test:appointments
```

**Tests 10 scenarios:**
1. Check doctor availability
2. Book appointment without specific time
3. Book appointment with specific time
4. Retrieve appointment details
5. Cancel appointment
6. Prevent double booking
7. Reject past dates
8. Reject invalid dates
9. Validate missing fields
10. Get upcoming appointments

**Success Metrics:**
- ✅ 10/10 tests passing (100%)
- All appointment operations working correctly
- Proper validation and error handling

---

## ✅ Phase 3: LLM Conversation Simulator

Advanced testing using GPT-4 to simulate realistic patient conversations.

### Run Conversation Simulator

```bash
npm run test:conversations
```

**Features:**
- 🎭 GPT-4 acts as realistic patients with distinct personas
- 💬 Full multi-turn conversation testing
- 📊 Evaluates conversation quality (naturalness, empathy, efficiency)
- 🧪 Tests 10 diverse scenarios:
  - Clear symptoms (happy path)
  - Vague symptoms requiring clarification
  - Pregnant patients needing prenatal care
  - Elderly patients with multiple conditions
  - Emergency situations
  - Child patients (parent calling)
  - Indecisive patients comparing doctors
  - Unavailable services
  - Follow-up appointments
  - Multilingual (Hindi) patients

**Evaluation Metrics:**
- Symptom gathering (20 points)
- Appropriate recommendations (30 points)
- Conversation flow (20 points)
- Efficiency (20 points)
- Completion (10 points)

**Pass threshold:** 60/100

**Current Results:**
- ✅ 3/3 scenarios passing (100%)
- Average score: 88.3/100

---

## 💡 Pro Tips

1. **Run tests regularly** - After any RAG document changes
2. **Review evaluation reports** - They provide specific improvement suggestions
3. **Track metrics over time** - Compare results across test runs
4. **Filter by category** - Test specific areas:
   ```bash
   TEST_CATEGORY=complex_medical npm run test:api
   ```

---

## 📞 Quick Commands Reference

```bash
# Start server
npm start

# Phase 1: API/RAG Tests
npm run test:api              # Run all 60 API tests
npm run test:evaluate         # Generate evaluation report
npm run test:all              # Run API tests + evaluation

# Phase 2: Appointment Tests
npm run test:appointments     # Test appointment booking flow (10 tests)

# Phase 3: Conversation Simulator
npm run test:conversations    # Run LLM conversation simulator (10 scenarios)

# Test specific category (Phase 1)
TEST_CATEGORY=happy_path npm run test:api
TEST_CATEGORY=edge_cases npm run test:api
```

---

## 📊 Sample Output Interpretation

```
🟢 Orthopedic Surgery
   Pass Rate: 100.0% (5/5)
   Doctor Match: 92.5% | Response Time: 780ms
```

**Meaning:**
- All 5 orthopedic tests passed ✅
- Recommended doctors matched expected 92.5% of the time
- Average response time was 780ms (excellent!)

```
🔴 Nephrology
   Pass Rate: 50.0% (1/2)
   Doctor Match: 45.2% | Response Time: 1200ms
```

**Meaning:**
- Only 1 of 2 nephrology tests passed ⚠️
- Doctor recommendations were only 45% accurate (needs improvement)
- Response time is acceptable but could be faster

**Action:** Check evaluation report for specific recommendations to improve nephrology matching.

---

## ✨ You're All Set!

Run the tests and see how your voice bot performs. The evaluation report will guide you on what to improve next.

**Questions?** Check `tests/README.md` for detailed documentation.

---

**Built for Even Hospital Bangalore** 🏥
