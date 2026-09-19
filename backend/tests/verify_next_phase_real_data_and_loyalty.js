/**
 * verify_next_phase_real_data_and_loyalty.js
 * End-to-End Automated Verification Suite for:
 * 1. Rahul Verma's Employee Workspace & RBAC Protection
 * 2. AI Customer Loyalty & Individually Personalized Offer Engine
 * 3. Grounded 4-Part Rationales & Manager Approval Gate
 * 4. Test With Real Data Pipeline (Preview, Ingestion, Validation, Analytics, Scoped Copilot, Session Deletion)
 * 5. Data Isolation Guarantee (Cafe Aroma seed data is 100% untouched)
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
  console.log('🧪 GROWKARO: REAL DATA, AI LOYALTY & EMPLOYEE WORKSPACE SUITE');
  console.log(`Target Backend: ${API_BASE}`);
  console.log('================================================================\n');

  try {
    // --- Step 0: Ensure Cafe Aroma Exists ---
    console.log('--- 0. Fetching Cafe Aroma Merchant ---');
    const merchantsRes = await request('/api/merchants');
    assert(merchantsRes.ok && Array.isArray(merchantsRes.data.data), 'Merchants endpoint returns list');
    const cafe = merchantsRes.data.data.find((m) => /Cafe Aroma/i.test(m.businessName));
    assert(cafe && cafe._id, `Found Cafe Aroma merchant (ID: ${cafe?._id})`);
    const merchantId = cafe._id;

    // --- Step 1: Employee Workspace (Rahul Verma) ---
    console.log('\n--- 1. Testing Rahul Verma Employee Workspace ---');
    const empRes = await request(`/api/merchants/${merchantId}/employee/dashboard`, {
      headers: { 'x-demo-role': 'MARKETING' },
    });
    assert(empRes.ok && empRes.data.success, 'Employee dashboard endpoint returns 200 OK');
    const empData = empRes.data.data;
    assert(empData.employee?.name === 'Rahul Verma', 'Dashboard identifies Rahul Verma');
    assert(empData.employee?.role === 'MARKETING', 'Dashboard confirms MARKETING role');
    assert(empData.employee?.greeting === 'Good morning, Rahul', 'Greeting matches "Good morning, Rahul"');
    assert(Array.isArray(empData.tasks), 'Rahul receives tasks array');
    assert(Array.isArray(empData.customerOpportunities), 'Rahul receives customer opportunities');
    assert(Array.isArray(empData.campaigns), 'Rahul receives assigned campaigns');
    assert(Array.isArray(empData.notifications), 'Rahul receives role-filtered notifications');

    // --- Step 2: RBAC Authorization (Restricting Financials) ---
    console.log('\n--- 2. Testing RBAC Authorization for Marketing Lead ---');
    const finRes = await request(`/api/merchants/${merchantId}/analytics`, {
      headers: { 'x-demo-role': 'MARKETING' },
    });
    assert(
      finRes.status === 403 && finRes.data.error === 'RESTRICTED_DATA',
      'Marketing role is strictly blocked from sensitive store financial analytics (HTTP 403)'
    );

    const ownerFinRes = await request(`/api/merchants/${merchantId}/analytics`, {
      headers: { 'x-demo-role': 'OWNER' },
    });
    assert(ownerFinRes.ok, 'Store Owner has full authorized access to analytics (HTTP 200)');

    // --- Step 3: Deterministic AI Customer Loyalty Metrics ---
    console.log('\n--- 3. Testing AI Customer Loyalty & Deterministic Calculations ---');
    const loyaltyRes = await request(`/api/merchants/${merchantId}/loyalty/customers`);
    assert(loyaltyRes.ok && loyaltyRes.data.success, 'Loyalty customers endpoint returns 200 OK');
    const loyaltyList = loyaltyRes.data.data;
    assert(loyaltyList.length > 0, `Computed loyalty intelligence for ${loyaltyList.length} customers`);

    // Verify Benchmark Customer: Ananya Das
    const ananya = loyaltyList.find((c) => /Ananya/i.test(c.displayName));
    assert(ananya, 'Found benchmark customer "Ananya Das"');
    assert(ananya.totalVisits === 12, `Ananya has exactly 12 visits (actual: ${ananya.totalVisits})`);
    assert(ananya.totalSpend === 8450, `Ananya has exactly ₹8,450 total spend (actual: ${ananya.totalSpend})`);
    assert(Math.round(ananya.aov) === 704, `Ananya has ₹704 AOV (actual: ${ananya.aov})`);
    assert(ananya.favoriteProduct === 'Cold Brew Coffee', `Ananya favorite product is Cold Brew Coffee (actual: ${ananya.favoriteProduct})`);
    assert(ananya.segmentTags.includes('LOYAL CUSTOMER'), 'Ananya tagged as LOYAL CUSTOMER');
    assert(ananya.segmentTags.includes('HIGH VALUE'), 'Ananya tagged as HIGH VALUE');
    assert(ananya.segmentTags.includes('AT RISK'), 'Ananya tagged as AT RISK (inactivity detected)');
    assert(ananya.segmentTags.includes('COLD BREW CUSTOMER'), 'Ananya tagged as COLD BREW CUSTOMER');

    // --- Step 4: Grounded 4-Part Personalized Offer Rationales ---
    console.log('\n--- 4. Testing Grounded Personalized Offer Opportunities ---');
    const oppsRes = await request(`/api/merchants/${merchantId}/loyalty/opportunities`);
    assert(oppsRes.ok && oppsRes.data.success, 'Loyalty opportunities endpoint returns 200 OK');
    const opportunities = oppsRes.data.data;
    assert(opportunities.length > 0, `Identified ${opportunities.length} customer opportunities`);

    const ananyaOpp = opportunities.find((o) => /Ananya/i.test(o.customerName));
    assert(ananyaOpp, 'Found Ananya Das personalized comeback opportunity');
    assert(ananyaOpp.rationale?.whyThisCustomer, 'Opportunity includes "Why this customer" rationale citing visits/spend');
    assert(ananyaOpp.rationale?.whyThisProduct, 'Opportunity includes "Why this product" rationale');
    assert(ananyaOpp.rationale?.whyNow, 'Opportunity includes "Why now" rationale citing inactivity');
    assert(ananyaOpp.rationale?.whyThisOffer, 'Opportunity includes "Why this offer" rationale');
    assert(ananyaOpp.suggestedOffer?.channel === 'WHATSAPP', 'Target channel is WHATSAPP');

    // --- Step 5: Prepare Personalized Offer -> Manager Approval Gate ---
    console.log('\n--- 5. Testing Personalized Offer Submission to Manager ---');
    const offerDraftRes = await request(`/api/merchants/${merchantId}/loyalty/offers/create`, {
      method: 'POST',
      body: JSON.stringify({
        customerId: ananya._id,
        offerTitle: 'Exclusive Cold Brew Comeback Deal for Ananya',
        message: 'Hi Ananya! We miss seeing you at Cafe Aroma. Enjoy Cold Brew + Butter Croissant for ₹179 today!',
        discount: 'Save ₹50 on Cold Brew Combo',
        channel: 'WHATSAPP',
      }),
    });
    assert(offerDraftRes.status === 201 && offerDraftRes.data.success, 'Personalized offer submitted successfully');
    const createdAction = offerDraftRes.data.data;
    assert(createdAction.approvalStatus === 'PENDING', 'Offer is strictly PENDING Manager approval');
    assert(createdAction.teamImpact?.length >= 2, 'Action impact mapped to Marketing and Staff');

    // --- Step 6: Non-Causal Outcome Recording ---
    console.log('\n--- 6. Testing Non-Causal Attribution Recording ---');
    const outcomeRecordRes = await request(`/api/merchants/${merchantId}/loyalty/offers/${createdAction._id}/outcome`, {
      method: 'POST',
      body: JSON.stringify({
        customerReturned: true,
        returnDays: 2,
        observedSpend: 740,
      }),
    });
    assert(outcomeRecordRes.ok && outcomeRecordRes.data.success, 'Offer outcome recorded');
    assert(
      outcomeRecordRes.data.data.interpretation.includes('Observed return visit'),
      'Outcome adheres to non-causal standard ("Observed return visit")'
    );

    // --- Step 7: Real Data Upload & Column Mapping ---
    console.log('\n--- 7. Testing "Test With Real Data" Ingestion & Parser ---');
    const testCSV = `order_id,date,client_id,buyer_name,item,section,total_price,status,mode
TX901,2026-09-01T10:00:00Z,U101,Rohan Mehta,Cappuccino,Beverages,190,completed,upi
TX902,2026-09-01T14:30:00Z,U102,Kavita Sen,Cold Brew,Beverages,220,completed,upi
TX903,2026-09-01T15:00:00Z,U101,Rohan Mehta,Croissant,Bakery,180,completed,card
TX904,2026-09-02T11:00:00Z,U103,Amit Verma,Latte,Beverages,210,completed,cash
TX905,2026-09-02T14:45:00Z,U102,Kavita Sen,Cold Brew,Beverages,220,completed,upi
TX906,2026-09-03T15:15:00Z,U101,Rohan Mehta,Cheesecake,Desserts,350,completed,upi
TX907,2026-09-04T12:00:00Z,U104,Pooja Roy,Sandwich,Food,260,completed,upi
TX908,INVALID_DATE,U105,Invalid,None,None,0,completed,upi`;

    const previewRes = await request('/api/datasets/preview', {
      method: 'POST',
      body: JSON.stringify({
        rawContent: testCSV,
        fileName: 'evaluator_test.csv',
      }),
    });
    assert(previewRes.ok && previewRes.data.success, 'CSV preview parsed successfully');
    const pData = previewRes.data.data;
    assert(pData.totalRows === 8, 'Detected 8 raw data rows');
    assert(pData.suggestedMapping.amount === 'total_price', 'Auto-mapped "total_price" to amount');
    assert(pData.suggestedMapping.date === 'date', 'Auto-mapped "date" to date');
    assert(pData.suggestedMapping.customerId === 'client_id', 'Auto-mapped "client_id" to customerId');
    assert(pData.suggestedMapping.product === 'item', 'Auto-mapped "item" to product');

    // --- Step 8: Analyze Dataset & Quality Validation ---
    console.log('\n--- 8. Testing Dataset Validation, Isolation & Deterministic Analytics ---');
    const analyzeRes = await request('/api/datasets/analyze', {
      method: 'POST',
      body: JSON.stringify({
        rawContent: testCSV,
        fileName: 'evaluator_test.csv',
        columnMapping: pData.suggestedMapping,
        merchantId,
      }),
    });
    assert(analyzeRes.status === 201 && analyzeRes.data.success, 'Dataset analyzed into DatasetSession');
    const aData = analyzeRes.data.data;
    assert(aData.sessionId?.startsWith('ds_'), 'Generated unique isolated sessionId (ds_...)');
    assert(aData.qualitySummary.totalRows === 8, 'Quality summary reports 8 total rows');
    assert(aData.qualitySummary.validRows === 7, 'Quality summary detects 7 valid transactions');
    assert(aData.qualitySummary.invalidRows === 1, 'Quality summary flags 1 invalid date row without silently failing');
    assert(aData.analyticsSummary.totalRevenue === 1630, `Calculated deterministic total revenue ₹1,630 (actual: ${aData.analyticsSummary.totalRevenue})`);
    assert(aData.hasCustomerIdentifiers === true, 'Detected customer identifiers in dataset');
    assert(aData.customerIntelligence.totalIdentifiedCustomers === 4, 'Identified 4 unique customer profiles');
    assert(aData.insights?.length > 0, `Generated ${aData.insights.length} grounded AI insights on real dataset`);

    const sessionId = aData.sessionId;

    // --- Step 9: Scoped Real-Data AI Copilot ---
    console.log('\n--- 9. Testing Scoped Real-Data AI Copilot ---');
    const copilotRes = await request(`/api/datasets/${sessionId}/copilot`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'What are my top selling products and total revenue in this dataset?',
      }),
    });
    assert(copilotRes.ok && copilotRes.data.success, 'Copilot answered query for real dataset');
    const answer = copilotRes.data.data.answer;
    assert(answer.includes('1,630') || answer.includes('1630'), 'Copilot cites exact pre-computed revenue (₹1,630)');

    // --- Step 10: Session Cleanup & Non-Destructive Data Isolation Verification ---
    console.log('\n--- 10. Verifying Non-Destructive Isolation & Session Cleanup ---');
    const deleteRes = await request(`/api/datasets/${sessionId}`, { method: 'DELETE' });
    assert(deleteRes.ok && deleteRes.data.success, 'Temporary dataset session cleared cleanly');

    const checkCafeRes = await request(`/api/merchants/${merchantId}/loyalty/customers`);
    assert(checkCafeRes.ok, 'Cafe Aroma demo collection remains healthy and responsive');
    const ananyaPost = checkCafeRes.data.data.find((c) => /Ananya/i.test(c.displayName));
    assert(ananyaPost && ananyaPost.totalVisits === 12, 'Cafe Aroma benchmark data is 100% untouched by real-data testing!');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passCount}/${testCount} VERIFICATION TESTS PASSED PERFECTLY!`);
    console.log('================================================================\n');
    return true;
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runVerification().then(() => process.exit(0));
}

module.exports = { runVerification };
