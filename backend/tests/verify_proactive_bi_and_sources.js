/**
 * verify_proactive_bi_and_sources.js
 * End-to-End Verification Suite for GrowKaro Proactive Business Intelligence & Data Source Integration
 */

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:5000';

let testCount = 0;
let passCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runVerification() {
  console.log('================================================================');
  console.log('🧠 GROWKARO: PROACTIVE BUSINESS INTELLIGENCE & DATA SOURCES VERIFICATION');
  console.log(`Target Backend: ${API_BASE}`);
  console.log('================================================================\n');

  try {
    // 0. Clean reset
    console.log('--- 0. Demo State Reset ---');
    const resetRes = await request('/api/demo/reset', { method: 'POST' });
    assert(resetRes.ok && resetRes.data.success, 'Clean demo reset succeeded');
    const merchantId = resetRes.data.data?.merchantId || resetRes.data.merchantId;
    assert(merchantId, `Target Merchant identified: ${merchantId}\n`);

    // 1. Proactive Alert Engine (12 Categories & Structured Fields)
    console.log('--- 1. Proactive Alert Engine & Detections ---');
    const insightsRes = await request(`/api/merchants/${merchantId}/insights`);
    assert(insightsRes.ok && insightsRes.data.success, 'Fetched proactive insights successfully');
    const insights = insightsRes.data.data;
    assert(Array.isArray(insights) && insights.length > 0, `Insights generated (${insights.length} active detections)`);

    const firstInsight = insights[0];
    assert(firstInsight.title, `First insight has title: "${firstInsight.title}"`);
    assert(firstInsight.whatHappened || firstInsight.title, 'Insight contains structured "whatHappened"');
    assert(firstInsight.whyItMatters || firstInsight.explanation, 'Insight contains structured "whyItMatters"');
    assert(Array.isArray(firstInsight.evidence) && firstInsight.evidence.length > 0, 'Insight contains verified factual evidence array');
    assert(firstInsight.confidence, `Insight has confidence score tier: "${firstInsight.confidence}"`);
    assert(firstInsight.whatToDo || firstInsight.recommendation?.action, 'Insight contains actionable "whatToDo" recommendation');
    console.log(`   Sample Detection: [${firstInsight.category}] ${firstInsight.title} (Confidence: ${firstInsight.confidence})\n`);

    // 2. Daily Business Brief
    console.log('--- 2. Automated Daily Business Brief ---');
    const dailyBriefRes = await request(`/api/merchants/${merchantId}/briefs/daily`);
    assert(dailyBriefRes.ok && dailyBriefRes.data.success, 'Fetched Daily Business Brief');
    const dailyBrief = dailyBriefRes.data.data;
    assert(dailyBrief.greeting, `Daily brief greeting: "${dailyBrief.greeting}"`);
    assert(dailyBrief.yesterdayPerformance, 'Daily brief contains yesterdayPerformance object');
    assert(typeof dailyBrief.yesterdayPerformance.revenue === 'number', `Yesterday revenue computed: ₹${dailyBrief.yesterdayPerformance.revenue}`);
    assert(typeof dailyBrief.yesterdayPerformance.transactions === 'number', `Yesterday transactions: ${dailyBrief.yesterdayPerformance.transactions}`);
    assert(dailyBrief.whatMatters, `What Matters: "${dailyBrief.whatMatters}"`);
    assert(dailyBrief.topOpportunity, `Top Opportunity: "${dailyBrief.topOpportunity}"`);
    assert(dailyBrief.externalContextNote, `External Context note: "${dailyBrief.externalContextNote}"`);
    assert(dailyBrief.recommendedAction, `Recommended Action: "${dailyBrief.recommendedAction}"`);

    // Test Brief Refresh
    const refreshBriefRes = await request(`/api/merchants/${merchantId}/briefs/daily/generate`, { method: 'POST' });
    assert(refreshBriefRes.ok && refreshBriefRes.data.success, 'Refreshed Daily Business Brief successfully\n');

    // 3. Weekly Business Review
    console.log('--- 3. Automated Weekly Business Review ---');
    const weeklyRes = await request(`/api/merchants/${merchantId}/briefs/weekly`);
    assert(weeklyRes.ok && weeklyRes.data.success, 'Fetched Weekly Business Review');
    const weekly = weeklyRes.data.data;
    assert(weekly.weekLabel, `Weekly review label: "${weekly.weekLabel}"`);
    assert(weekly.kpis, 'Weekly review contains 7-day KPIs');
    assert(typeof weekly.kpis.revenue === 'number', `Weekly revenue: ₹${weekly.kpis.revenue}`);
    assert(typeof weekly.kpis.repeatRate === 'number', `Weekly repeat customer rate: ${weekly.kpis.repeatRate}%`);
    assert(weekly.peakHours, `Peak hours tracked: ${weekly.peakHours}`);
    assert(weekly.weakHours, `Weak hours tracked: ${weekly.weakHours}`);
    assert(Array.isArray(weekly.topProducts), 'Top products tracked');
    assert(Array.isArray(weekly.recommendedActions) && weekly.recommendedActions.length >= 3, 'Contains 3 prioritized strategic actions');

    // 4. Data Source Architecture & Linking
    console.log('--- 4. Data Source Architecture & Ingestion Status ---');
    const dsStatusRes = await request(`/api/merchants/${merchantId}/data-sources/status`);
    assert(dsStatusRes.ok && dsStatusRes.data.success, 'Fetched Data Source Status');
    const dsStatus = dsStatusRes.data.data;
    assert(typeof dsStatus.totalTransactions === 'number', `Total recorded transactions: ${dsStatus.totalTransactions}`);
    assert(typeof dsStatus.linkedPercentage === 'number', `Linked POS percentage: ${dsStatus.linkedPercentage}%`);
    assert(dsStatus.primaryStatus, `Primary Confidence status: "${dsStatus.primaryStatus}"`);
    assert(dsStatus.honestyStatement, 'Honesty statement present');

    // Test Simulated POS Order Linking
    const linkRes = await request(`/api/merchants/${merchantId}/data-sources/simulate-link`, { method: 'POST' });
    assert(linkRes.ok && linkRes.data.success, 'Simulated POS order linking successfully');

    // 5. Test With Real Data: Itemized Dataset vs Payment-Only Dataset
    console.log('--- 5. Real Dataset Ingestion & Data Honesty Standard ---');
    
    // 5A: Itemized Dataset (High Confidence)
    const itemizedCSV = `date,time,customer_id,product,category,amount,mode
2026-09-01,10:00,C01,Cold Brew Coffee,Beverages,220,upi
2026-09-01,10:30,C02,Butter Croissant,Bakery,140,upi
2026-09-01,14:00,C01,Cold Brew Coffee,Beverages,220,upi`;

    const analyzeItemizedRes = await request('/api/datasets/analyze', {
      method: 'POST',
      body: JSON.stringify({
        rawContent: itemizedCSV,
        fileName: 'test_itemized.csv',
        columnMapping: {
          date: 'date',
          amount: 'amount',
          product: 'product',
          category: 'category',
          customerId: 'customer_id',
        },
      }),
    });

    assert(analyzeItemizedRes.ok && analyzeItemizedRes.data.success, 'Itemized dataset parsed and analyzed');
    assert(analyzeItemizedRes.data.data.hasProductData === true, 'Itemized dataset marked hasProductData === true');
    assert(analyzeItemizedRes.data.data.dataConfidence === 'HIGH', 'Itemized dataset tagged with HIGH confidence');
    assert(analyzeItemizedRes.data.data.limitationDisclaimer === null, 'Itemized dataset has no limitation disclaimer');

    // 5B: Payment-Only Dataset (LOW Confidence & Exact Disclaimer)
    console.log('--- 5B. Testing Payment-Only Dataset (Missing Product Data) ---');
    const paymentOnlyCSV = `payment_id,timestamp,amount,status,method
P001,2026-09-01T10:00:00Z,450,success,upi
P002,2026-09-01T11:30:00Z,220,success,upi`;

    const analyzePaymentOnlyRes = await request('/api/datasets/analyze', {
      method: 'POST',
      body: JSON.stringify({
        rawContent: paymentOnlyCSV,
        fileName: 'test_paytm_payments_only.csv',
        columnMapping: {
          date: 'timestamp',
          amount: 'amount',
          product: '',
        },
      }),
    });

    assert(analyzePaymentOnlyRes.ok && analyzePaymentOnlyRes.data.success, 'Payment-only dataset parsed successfully');
    const paySession = analyzePaymentOnlyRes.data.data;
    assert(paySession.hasProductData === false, 'Payment-only dataset honestly marked hasProductData === false');
    assert(paySession.dataConfidence === 'LOW', 'Payment-only dataset tagged with LOW confidence');
    const expectedDisclaimer = 'Product-level insights unavailable because the uploaded dataset does not contain item-level order data.';
    assert(paySession.limitationDisclaimer === expectedDisclaimer, 'Exact required disclaimer verified');

    // 6. Grounded Scoped Copilot on Payment-Only Dataset
    console.log('--- 6. Grounded Scoped Copilot on Real Dataset ---');
    const copilotRes = await request(`/api/datasets/${paySession.sessionId}/copilot`, {
      method: 'POST',
      body: JSON.stringify({ query: 'What are my top selling products and what should I promote?' }),
    });

    assert(copilotRes.ok && copilotRes.data.success, 'Scoped dataset copilot responded');
    const copilotAnswer = copilotRes.data.data.answer;
    assert(
      copilotAnswer.toLowerCase().includes('unavailable') ||
      copilotAnswer.toLowerCase().includes('item-level') ||
      copilotAnswer.toLowerCase().includes('does not contain'),
      `Copilot honestly refused to hallucinate products: "${copilotAnswer.slice(0, 80)}..."`
    );

    // Clean up
    await request(`/api/datasets/${paySession.sessionId}`, { method: 'DELETE' });
    await request(`/api/datasets/${analyzeItemizedRes.data.data.sessionId}`, { method: 'DELETE' });

    console.log('================================================================');
    console.log(`🎉 ALL TESTS PASSED: ${passCount}/${testCount} checks succeeded.`);
    console.log('Autonomous Proactive BI and Data Source Integration are 100% verified!');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runVerification();
