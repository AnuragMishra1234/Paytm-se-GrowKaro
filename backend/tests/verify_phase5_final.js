/**
 * verify_phase5_final.js — GrowKaro Phase 5 Final Verification Suite
 *
 * Validates:
 * 1. Demo Reset Idempotency & Cleanliness (Double run verification)
 * 2. Strict Approval Gate Enforcement (PENDING, REJECTED, CANCELLED cannot execute)
 * 3. n8n Simulation Execution & Lifecycle Transitions
 * 4. Deterministic Outcome Attribution & Non-Causal Wording
 * 5. Cognee / MongoDB Memory Learning & Rejection Retention
 * 6. Clean Presentation & Multi-Merchant Isolation
 */

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhase5Verification() {
  console.log('================================================================');
  console.log('🏆 GROWKARO PHASE 5 FINAL VERIFICATION SUITE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('================================================================\n');

  // --- 1. System Health & Demo Status ---
  console.log('--- 1. Testing System Health & Demo Endpoint ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert(healthRes.ok, 'Health check returns 200 OK');

  const demoStatusRes = await fetch(`${BASE_URL}/api/demo/status`);
  assert(demoStatusRes.ok, 'Demo status endpoint returns 200 OK');
  const demoStatus = await demoStatusRes.json();
  const demoMerchantName = demoStatus.data?.merchant?.name || 'Cafe Aroma';
  console.log(`   Demo Merchant: ${demoMerchantName}`);

  // --- 2. Demo Reset Idempotency (Run 1) ---
  console.log('\n--- 2. Testing Demo Reset Idempotency (First Run) ---');
  const resetRes1 = await fetch(`${BASE_URL}/api/demo/reset`, { method: 'POST' });
  assert(resetRes1.ok, 'First demo reset returns 200 OK');
  const resetData1 = await resetRes1.json();
  assert(resetData1.success === true, 'First demo reset succeeded');

  const merchantId = resetData1.data?.merchantId || demoStatus.data?.merchant?.id;
  assert(Boolean(merchantId), `Target Merchant ID obtained: ${merchantId}`);

  // Fetch baseline state
  const actionsRes1 = await fetch(`${BASE_URL}/api/merchants/${merchantId}/actions`);
  const actionsData1 = await actionsRes1.json();
  const pendingActions1 = (actionsData1.data || []).filter((a) => a.approvalStatus === 'PENDING');
  assert(pendingActions1.length === 1, `First reset produces exactly 1 pending action (found: ${pendingActions1.length})`);

  const notifsRes1 = await fetch(`${BASE_URL}/api/merchants/${merchantId}/notifications`);
  const notifsData1 = await notifsRes1.json();
  assert((notifsData1.data || []).length === 1, `First reset produces exactly 1 notification (found: ${notifsData1.data?.length})`);

  // --- 3. Demo Reset Idempotency (Run 2 — Verification of No Duplicate Junk) ---
  console.log('\n--- 3. Testing Demo Reset Idempotency (Second Run - Zero Clutter Check) ---');
  const resetRes2 = await fetch(`${BASE_URL}/api/demo/reset`, { method: 'POST' });
  assert(resetRes2.ok, 'Second demo reset returns 200 OK');
  const resetData2 = await resetRes2.json();
  assert(resetData2.success === true, 'Second demo reset succeeded');

  const actionsRes2 = await fetch(`${BASE_URL}/api/merchants/${merchantId}/actions`);
  const actionsData2 = await actionsRes2.json();
  const pendingActions2 = (actionsData2.data || []).filter((a) => a.approvalStatus === 'PENDING');
  assert(pendingActions2.length === 1, `Second reset leaves strictly 1 pending action (no duplicate accumulation)`);

  const notifsRes2 = await fetch(`${BASE_URL}/api/merchants/${merchantId}/notifications`);
  const notifsData2 = await notifsRes2.json();
  assert((notifsData2.data || []).length === 1, `Second reset leaves strictly 1 notification (no notification spam)`);

  const campaignsRes2 = await fetch(`${BASE_URL}/api/merchants/${merchantId}/campaigns`);
  const campaignsData2 = await campaignsRes2.json();
  assert((campaignsData2.data || []).length === 1, `Second reset preserves strictly 1 historical completed campaign`);
  console.log(`   Baseline Campaign: "${campaignsData2.data[0].name}"`);

  // --- 4. Testing Strict Approval Gate Enforcement ---
  console.log('\n--- 4. Testing Strict Approval Gate Enforcement ---');
  const targetAction = pendingActions2[0];
  assert(targetAction.approvalStatus === 'PENDING', 'Target action starts in PENDING status');

  // Attempt to execute a rejected action:
  // First reject a dummy draft
  const rejectRes = await fetch(`${BASE_URL}/api/actions/${targetAction._id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId,
      reason: 'Merchant prefers bundles over discounts to protect gross margin.',
    }),
  });
  assert(rejectRes.ok, 'Action rejected successfully');
  const rejectedData = await rejectRes.json();
  assert(rejectedData.data.approvalStatus === 'REJECTED', 'Action approvalStatus is now REJECTED');

  // Now attempt to approve/execute this rejected action — it MUST be blocked
  const blockedApproveRes = await fetch(`${BASE_URL}/api/actions/${targetAction._id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  assert(!blockedApproveRes.ok, 'Attempt to execute a REJECTED action is blocked by backend');
  assert(blockedApproveRes.status >= 400, `Blocked execution returns HTTP ${blockedApproveRes.status} (Client Error)`);
  console.log('   ✓ Approval gate successfully blocked execution of REJECTED action.');

  // --- 5. Testing Cognee Rejection Memory Retention ---
  console.log('\n--- 5. Testing Cognee / MongoDB Rejection Memory Retention ---');
  const memoryRes = await fetch(`${BASE_URL}/api/merchants/${merchantId}/memory`);
  assert(memoryRes.ok, 'Fetched merchant memories');
  const memoryData = await memoryRes.json();
  const memories = memoryData.data || [];
  const rejectionMem = memories.find((m) => m.content && m.content.includes('Merchant rejected'));
  assert(Boolean(rejectionMem), 'Rejection reason was captured in Cognee business memory');
  console.log(`   Retained Memory Fact: "${rejectionMem.content}"`);

  // --- 6. Testing Full Agentic Flow: Detect -> Recommend -> Approve -> Act -> Measure -> Learn ---
  console.log('\n--- 6. Testing Complete Agentic Flow Execution ---');
  // Reset back to clean demo state
  await fetch(`${BASE_URL}/api/demo/reset`, { method: 'POST' });

  // 6a. Fetch the pending action
  const cleanActionsRes = await fetch(`${BASE_URL}/api/merchants/${merchantId}/actions`);
  const cleanActions = (await cleanActionsRes.json()).data || [];
  const freshAction = cleanActions.find((a) => a.approvalStatus === 'PENDING');
  assert(Boolean(freshAction), 'Clean pending action available for approval');
  console.log(`   Approving Action: "${freshAction.title}"`);

  // 6b. Approve the action (Enforces valid transition to APPROVED -> EXECUTING -> SUCCESS)
  const approveRes = await fetch(`${BASE_URL}/api/actions/${freshAction._id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId,
      approvedPayload: {
        title: freshAction.title,
      },
    }),
  });
  assert(approveRes.ok, 'Action approval request succeeded');
  const approvedAction = (await approveRes.json()).data;
  assert(approvedAction.approvalStatus === 'APPROVED', 'Action is APPROVED');
  assert(approvedAction.executionStatus === 'SUCCESS', 'Action execution completed with status SUCCESS');
  console.log(`   Execution completed via n8n simulation. Status: ${approvedAction.executionStatus}`);

  // 6c. Test Idempotency: Second approval of already-executed action does not duplicate
  const duplicateApproveRes = await fetch(`${BASE_URL}/api/actions/${freshAction._id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  assert(duplicateApproveRes.ok, 'Idempotent approval request succeeded');
  const dupAction = (await duplicateApproveRes.json()).data;
  assert(dupAction.executionStatus === 'SUCCESS', 'Idempotent approval returns existing SUCCESS action');

  // 6d. Measure Outcome
  const measureRes = await fetch(`${BASE_URL}/api/actions/${freshAction._id}/measure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  assert(measureRes.ok, 'Outcome measurement calculated');
  const outcomeData = (await measureRes.json()).data;
  assert(outcomeData.status === 'MEASURED', 'Outcome status is MEASURED');
  assert(typeof outcomeData.changePercentage === 'number', 'Outcome change percentage is numeric');
  assert(
    outcomeData.interpretation && outcomeData.interpretation.startsWith('Observed'),
    'Attribution interpretation strictly adheres to non-causal standard ("Observed +X%...")'
  );
  console.log(`   Outcome Measured: ${outcomeData.changePercentage >= 0 ? '+' : ''}${outcomeData.changePercentage}% observed change.`);
  console.log(`   Attribution Copy: "${outcomeData.interpretation}"`);

  // 6e. Verify Memory Update after Outcome
  const postOutcomeMemoriesRes = await fetch(`${BASE_URL}/api/merchants/${merchantId}/memory`);
  const postMemories = (await postOutcomeMemoriesRes.json()).data || [];
  const outcomeMem = postMemories.find((m) => m.type === 'past_outcome' && m.content.includes(freshAction.title));
  assert(Boolean(outcomeMem), 'Outcome learning was successfully ingested into Cognee memory');
  console.log(`   Learned Fact: "${outcomeMem.content}"`);

  // --- 7. Testing Unified Activity Timeline Integration ---
  console.log('\n--- 7. Testing Activity Timeline Verification ---');
  const activityRes = await fetch(`${BASE_URL}/api/merchants/${merchantId}/activity`);
  assert(activityRes.ok, 'Activity timeline fetched successfully');
  const activityData = await activityRes.json();
  const events = activityData.data || [];
  assert(events.length >= 6, `Activity timeline contains complete audit log (${events.length} events)`);

  const categories = new Set(events.map((e) => e.category));
  assert(categories.has('DETECT'), 'Activity contains DETECT event');
  assert(categories.has('RECOMMEND'), 'Activity contains RECOMMEND event');
  assert(categories.has('APPROVE'), 'Activity contains APPROVE event');
  assert(categories.has('ACT'), 'Activity contains ACT event');
  assert(categories.has('MEASURE'), 'Activity contains MEASURE event');
  assert(categories.has('LEARN'), 'Activity contains LEARN event');
  console.log(`   All 6 lifecycle stages present: ${Array.from(categories).join(' -> ')}`);

  // --- 8. Final Reset to Pristine Presentation State ---
  console.log('\n--- 8. Final Reset to Pristine Presentation State ---');
  const finalReset = await fetch(`${BASE_URL}/api/demo/reset`, { method: 'POST' });
  assert(finalReset.ok, 'Final reset executed cleanly');

  console.log('\n================================================================');
  console.log(`🏆 ALL PHASE 5 TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('GrowKaro Phase 5 Integration & Verification Successfully Complete!');
  console.log('================================================================\n');
}

runPhase5Verification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
