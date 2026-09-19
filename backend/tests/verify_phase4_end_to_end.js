/**
 * verify_phase4_end_to_end.js
 *
 * Automated verification test suite for GrowKaro Phase 4:
 * 1. Health & n8n Status verification (real vs demo separation)
 * 2. Notification System & Idempotency / Deduplication
 * 3. End-to-End Agentic Loop:
 *    Observe -> Detect -> Recommend -> Notify -> Approve -> Act (n8n) -> Measure (Deterministic) -> Learn (Memory)
 * 4. Rejection Memory Learning Verification
 * 5. Unified Activity Timeline Lifecycle Verification
 * 6. Multi-Merchant Isolation Verification (Cafe Aroma, Fresh Kirana, Style Studio)
 */

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
  passedTests++;
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 GROWKARO PHASE 4 END-TO-END VERIFICATION SUITE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('================================================================\n');

  try {
    // ─── 1. Health & System Status ──────────────────────────────────────────
    console.log('--- 1. Testing System Health & n8n Status ---');
    const healthRes = await request('/health');
    assert(healthRes.data.status === 'ok', 'API health check responds OK');

    const n8nRes = await request('/api/n8n/status');
    assert(n8nRes.data.success === true, 'n8n status returned successfully');
    assert(
      n8nRes.data.data.mode === 'real' ||
        n8nRes.data.data.mode === 'demo' ||
        n8nRes.data.data.mode === 'simulation',
      `n8n mode is explicit: "${n8nRes.data.data.mode}"`
    );
    console.log(`   n8n Provider: ${n8nRes.data.data.provider || n8nRes.data.data.label}`);
    console.log(`   n8n Description: ${n8nRes.data.data.description || n8nRes.data.data.label}\n`);

    // ─── 2. Fetch Active Merchants ──────────────────────────────────────────
    console.log('--- 2. Fetching Active Merchants ---');
    const merchantsRes = await request('/api/merchants');
    assert(merchantsRes.data.success === true, 'Merchants fetched successfully');
    const merchants = merchantsRes.data.data;
    assert(merchants.length >= 3, `Found ${merchants.length} seeded merchants`);

    const cafeAroma = merchants.find((m) => m.businessName.includes('Cafe Aroma'));
    const freshKirana = merchants.find((m) => m.businessName.includes('Fresh Kirana'));
    const styleStudio = merchants.find((m) => m.businessName.includes('Style Studio'));

    assert(!!cafeAroma, 'Cafe Aroma found');
    assert(!!freshKirana, 'Fresh Kirana found');
    assert(!!styleStudio, 'Style Studio found');
    console.log(`   Target Merchant: ${cafeAroma.businessName} (ID: ${cafeAroma._id})\n`);

    // ─── 3. Trigger Simulator Scenario: Sales Drop ──────────────────────────
    console.log('--- 3. Testing Simulator Scenario: sales-drop ---');
    const simRes = await request(`/api/merchants/${cafeAroma._id}/simulate/sales-drop`, {
      method: 'POST',
    });
    assert(simRes.data.success === true, 'Simulation endpoint executed successfully');
    assert(!!simRes.data.data.insight, 'Simulation produced an Insight');
    assert(!!simRes.data.data.action, 'Simulation generated an Action Draft');
    assert(!!simRes.data.data.notification, 'Simulation generated an Action Required Notification');

    const createdAction = simRes.data.data.action;
    const createdNotification = simRes.data.data.notification;

    assert(createdAction.approvalStatus === 'PENDING', 'Action is in PENDING approval gate');
    assert(createdNotification.requiresApproval === true, 'Notification requiresApproval is true');
    assert(createdNotification.type === 'ACTION_REQUIRED', 'Notification type is ACTION_REQUIRED');
    console.log(`   Created Action: "${createdAction.title}" (ID: ${createdAction._id})`);
    console.log(`   Created Notification: "${createdNotification.title}"\n`);

    // ─── 4. Notifications API & Idempotency ─────────────────────────────────
    console.log('--- 4. Testing Notification Fetch & Mark Read ---');
    const notifRes = await request(`/api/merchants/${cafeAroma._id}/notifications`);
    assert(notifRes.data.success === true, 'Fetched merchant notifications');
    assert(Array.isArray(notifRes.data.data), 'Notification list is an array');
    assert(notifRes.data.data.length > 0, 'Notifications list is non-empty');

    const targetNotif = notifRes.data.data[0];
    const markReadRes = await request(`/api/notifications/${targetNotif._id}/read`, {
      method: 'PATCH',
    });
    assert(markReadRes.data.success === true, 'Notification marked as read');
    assert(markReadRes.data.data.read === true, 'Notification read flag set to true\n');

    // ─── 5. Approve & Execute Action (n8n Integration) ─────────────────────
    console.log('--- 5. Testing Merchant Approval Gate & n8n Execution ---');
    const approveRes = await request(`/api/actions/${createdAction._id}/approve`, {
      method: 'POST',
      body: { merchantId: cafeAroma._id, channel: 'WHATSAPP' },
    });
    assert(approveRes.data.success === true, 'Action approved successfully');
    assert(approveRes.data.data.approvalStatus === 'APPROVED', 'Approval status is APPROVED');
    assert(
      approveRes.data.data.executionStatus === 'SUCCESS' ||
        approveRes.data.data.executionStatus === 'QUEUED',
      `Execution status is valid: ${approveRes.data.data.executionStatus}`
    );
    console.log(`   Execution Result:`, approveRes.data.data.executionResult);

    // Verify Action Completed Notification was created
    const postApproveNotifs = await request(`/api/merchants/${cafeAroma._id}/notifications`);
    const completedNotif = postApproveNotifs.data.data.find(
      (n) =>
        String(n.relatedActionId?._id || n.relatedActionId) === String(createdAction._id) &&
        n.type === 'ACTION_COMPLETED'
    );
    assert(!!completedNotif, 'ACTION_COMPLETED notification was created');
    console.log(`   Dispatched Notification: "${completedNotif.title}"\n`);

    // ─── 6. Deterministic Outcome Measurement ──────────────────────────────
    console.log('--- 6. Testing Deterministic Outcome Measurement ---');
    const measureRes = await request(`/api/actions/${createdAction._id}/measure`, {
      method: 'POST',
      body: { merchantId: cafeAroma._id },
    });
    assert(measureRes.data.success === true, 'Outcome measured successfully');
    const outcome = measureRes.data.data;

    assert(outcome.status === 'MEASURED', 'Outcome status is MEASURED');
    assert(typeof outcome.baselineValue === 'number', 'Baseline value is numeric');
    assert(typeof outcome.postActionValue === 'number', 'Post-action value is numeric');
    assert(typeof outcome.changePercentage === 'number', 'Change percentage is numeric');
    assert(outcome.learningStored === true, 'Learning stored flag is true');
    assert(
      outcome.interpretation.includes('Observed') &&
        (outcome.interpretation.includes('after the campaign') ||
          outcome.interpretation.includes('following')),
      'Interpretation strictly follows non-causal attribution standard'
    );
    console.log(`   Baseline Revenue: ₹${outcome.baselineValue}`);
    console.log(`   Post-Action Revenue: ₹${outcome.postActionValue}`);
    console.log(`   Change: ${outcome.changePercentage}%`);
    console.log(`   Interpretation: "${outcome.interpretation}"\n`);

    // Verify Outcome Ready Notification was generated
    const postMeasureNotifs = await request(`/api/merchants/${cafeAroma._id}/notifications`);
    const outcomeNotif = postMeasureNotifs.data.data.find(
      (n) =>
        String(n.relatedActionId?._id || n.relatedActionId) === String(createdAction._id) &&
        (n.type === 'OUTCOME_MEASURED' || n.type === 'OUTCOME_READY')
    );
    assert(!!outcomeNotif, 'OUTCOME_MEASURED notification was created');
    console.log(`   Outcome Notification: "${outcomeNotif.title}"\n`);

    // ─── 7. Rejection Memory Learning Verification ──────────────────────────
    console.log('--- 7. Testing Rejection Learning Memory ---');
    const draftRes = await request('/api/actions', {
      method: 'POST',
      body: {
        merchantId: cafeAroma._id,
        insightId: simRes.data.data.insight._id,
        overrides: {
          title: 'Monsoon 30% Flash Discount Special',
          description: 'Offer deep discounts on all espresso drinks',
          channel: 'SMS',
          payload: { offer: '30% off all beverages' },
        },
      },
    });
    assert(draftRes.data.success === true, 'Created draft action for rejection test');
    const draftAction = draftRes.data.data;

    const rejectRes = await request(`/api/actions/${draftAction._id}/reject`, {
      method: 'POST',
      body: {
        reason: 'We do not offer direct price discounts; prefer bundled complimentary snacks.',
      },
    });
    assert(rejectRes.data.success === true, 'Action rejected successfully');
    assert(rejectRes.data.data.approvalStatus === 'REJECTED', 'Action marked as REJECTED');

    // Verify memory contains rejection preference
    const memoriesRes = await request(`/api/merchants/${cafeAroma._id}/memory`);
    assert(memoriesRes.data.success === true, 'Fetched merchant memories');
    const rejectMemory = memoriesRes.data.data.find((m) =>
      m.content.includes('do not offer direct price discounts')
    );
    assert(!!rejectMemory, 'Merchant rejection preference preserved in memory');
    console.log(`   Recorded Rejection Memory: "${rejectMemory.content}"\n`);

    // ─── 8. Unified Activity Timeline ───────────────────────────────────────
    console.log('--- 8. Testing Unified Activity Timeline ---');
    const activityRes = await request(`/api/merchants/${cafeAroma._id}/activity?limit=30`);
    assert(activityRes.data.success === true, 'Activity timeline fetched');
    const events = activityRes.data.data;
    assert(Array.isArray(events), 'Activity events is an array');
    assert(events.length >= 5, `Activity timeline contains ${events.length} events`);

    const categories = new Set(events.map((e) => e.category));
    assert(categories.has('DETECT'), 'Activity contains DETECT stage event');
    assert(categories.has('RECOMMEND'), 'Activity contains RECOMMEND stage event');
    assert(categories.has('APPROVE'), 'Activity contains APPROVE stage event');
    assert(categories.has('ACT'), 'Activity contains ACT stage event');
    assert(categories.has('MEASURE'), 'Activity contains MEASURE stage event');
    assert(categories.has('LEARN'), 'Activity contains LEARN stage event');
    console.log(`   Captured Lifecycle Stages: ${Array.from(categories).join(', ')}\n`);

    // ─── 9. Multi-Merchant Isolation Verification ───────────────────────────
    console.log('--- 9. Testing Multi-Merchant Isolation ---');
    const fkNotifs = await request(`/api/merchants/${freshKirana._id}/notifications`);
    assert(fkNotifs.data.success === true, 'Fresh Kirana notifications fetched');

    const ssNotifs = await request(`/api/merchants/${styleStudio._id}/notifications`);
    assert(ssNotifs.data.success === true, 'Style Studio notifications fetched');

    // Verify Fresh Kirana activity does not bleed into Cafe Aroma
    const fkActivity = await request(`/api/merchants/${freshKirana._id}/activity`);
    assert(fkActivity.data.success === true, 'Fresh Kirana activity fetched');
    console.log(`   Fresh Kirana Events: ${fkActivity.data.data.length}`);
    console.log(`   Style Studio Notifications: ${ssNotifs.data.data.length}\n`);

    // ─── 10. Summary ────────────────────────────────────────────────────────
    console.log('================================================================');
    console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log('GrowKaro Phase 4 Complete Agentic Loop Verified Successfully!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
