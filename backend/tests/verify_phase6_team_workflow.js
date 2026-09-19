/**
 * verify_phase6_team_workflow.js
 * End-to-End Verification Suite for GrowKaro Phase 6: Employee & Team Workflow Integration
 *
 * Tests:
 * 1. Default team setup & role retrieval (/api/merchants/:id/team)
 * 2. Team invitation (/api/merchants/:id/team/invite)
 * 3. Member update & role modification (/api/team/:memberId)
 * 4. Role-based task generation upon Action Approval
 * 5. Role notification routing (Marketing & Staff get specific task notifications)
 * 6. Task lifecycle execution: TODO -> IN_PROGRESS -> COMPLETED
 * 7. Manager notification on task completion
 * 8. Outcome routing to team members
 * 9. Activity timeline capturing ASSIGN and TASK_COMPLETED events
 * 10. Demo reset idempotency & zero duplicate clutter
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

async function runPhase6Tests() {
  console.log('================================================================');
  console.log('👥 GROWKARO PHASE 6: TEAM & EMPLOYEE WORKFLOW VERIFICATION SUITE');
  console.log(`Target Backend: ${API_BASE}`);
  console.log('================================================================\n');

  try {
    // 0. Clean reset first
    console.log('--- 0. Preparing Clean Demo State ---');
    const resetRes0 = await request('/api/demo/reset', { method: 'POST' });
    assert(resetRes0.ok && resetRes0.data.success, 'Clean demo reset succeeded');
    const merchantId = resetRes0.data.data?.merchantId || resetRes0.data.merchantId;
    console.log(`   Target Merchant: Cafe Aroma (${merchantId})\n`);

    // 1. Team Retrieval
    console.log('--- 1. Testing Team Retrieval & Canonical Roles ---');
    const teamRes = await request(`/api/merchants/${merchantId}/team`);
    assert(teamRes.ok && teamRes.data.success, 'Team fetched successfully');
    assert(Array.isArray(teamRes.data.data), 'Team data is an array');
    assert(teamRes.data.count >= 4, `At least 4 default members present (found: ${teamRes.data.count})`);

    const members = teamRes.data.data;
    const owner = members.find((m) => m.role === 'OWNER');
    const manager = members.find((m) => m.role === 'MANAGER');
    const marketing = members.find((m) => m.role === 'MARKETING');
    const staff = members.find((m) => m.role === 'STAFF');

    assert(owner && owner.name === 'Vikram Mehta', 'Owner Vikram Mehta is seeded and active');
    assert(manager && manager.name === 'Priya Sharma', 'Manager Priya Sharma is seeded and active');
    assert(marketing && marketing.name === 'Rahul Verma', 'Marketing lead Rahul Verma is seeded and active');
    assert(staff && staff.name === 'Ananya Das', 'Store staff Ananya Das is seeded and active');
    console.log(`   Verified 4 canonical roles: OWNER, MANAGER, MARKETING, STAFF\n`);

    // 2. Invite New Team Member
    console.log('--- 2. Testing Team Invitation ---');
    const invitePayload = {
      name: 'Karan Patel',
      email: 'karan.barista@cafearoma.in',
      phone: '+91 98765 43219',
      role: 'STAFF',
    };
    const inviteRes = await request(`/api/merchants/${merchantId}/team/invite`, {
      method: 'POST',
      body: JSON.stringify(invitePayload),
    });
    assert(inviteRes.ok && inviteRes.data.success, 'Team invite request succeeded');
    assert(inviteRes.data.data.status === 'INVITED', 'Invited member status is INVITED');
    assert(inviteRes.data.data.role === 'STAFF', 'Invited member role is STAFF');
    const invitedMemberId = inviteRes.data.data._id;
    console.log(`   Invited member: Karan Patel (${invitedMemberId})\n`);

    // 3. Team Member Update & Removal
    console.log('--- 3. Testing Member Update & Cleanup ---');
    const updateRes = await request(`/api/team/${invitedMemberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(updateRes.ok && updateRes.data.success, 'Member status update succeeded');
    assert(updateRes.data.data.status === 'ACTIVE', 'Member status is now ACTIVE');

    const deleteRes = await request(`/api/team/${invitedMemberId}`, {
      method: 'DELETE',
    });
    assert(deleteRes.ok && deleteRes.data.success, 'Member removal succeeded');
    console.log(`   Member successfully updated and removed\n`);

    // 4. Action Approval & Automatic Task Generation
    console.log('--- 4. Testing Action Approval & Automatic Task Generation ---');
    const actionsRes = await request(`/api/merchants/${merchantId}/actions?status=PENDING`);
    assert(actionsRes.ok && actionsRes.data.data.length > 0, 'Found pending action draft');
    const pendingAction = actionsRes.data.data[0];
    console.log(`   Target Action Draft: "${pendingAction.title}" (${pendingAction._id})`);

    // Approve the action
    const approveRes = await request(`/api/actions/${pendingAction._id}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        payload: pendingAction.payload,
      }),
    });
    assert(approveRes.ok && approveRes.data.success, 'Action approved successfully');
    assert(approveRes.data.data.approvalStatus === 'APPROVED', 'Action is APPROVED');

    // Fetch tasks created for this action
    const tasksRes = await request(`/api/merchants/${merchantId}/tasks?relatedActionId=${pendingAction._id}`);
    assert(tasksRes.ok && tasksRes.data.success, 'Action tasks fetched successfully');
    assert(tasksRes.data.count >= 2, `At least 2 operational tasks created (found: ${tasksRes.data.count})`);

    const actionTasks = tasksRes.data.data;
    const marketingTask = actionTasks.find((t) => t.assignedToRole === 'MARKETING');
    const staffTask = actionTasks.find((t) => t.assignedToRole === 'STAFF');

    assert(marketingTask && marketingTask.status === 'TODO', 'Marketing task created with status TODO');
    assert(staffTask && staffTask.status === 'TODO', 'Staff task created with status TODO');
    console.log(`   Marketing Task: "${marketingTask.title}" -> Assigned to ${marketingTask.assignedToName}`);
    console.log(`   Staff Task: "${staffTask.title}" -> Assigned to ${staffTask.assignedToName}\n`);

    // 5. Role-Scoped Notifications
    console.log('--- 5. Testing Role-Scoped Notifications ---');
    const staffNotifsRes = await request(`/api/merchants/${merchantId}/notifications?role=STAFF`);
    assert(staffNotifsRes.ok && staffNotifsRes.data.success, 'Staff notifications fetched');
    const staffTaskNotif = staffNotifsRes.data.data.find(
      (n) => n.type === 'TASK_ASSIGNED' && n.role === 'STAFF'
    );
    assert(staffTaskNotif != null, 'Staff received TASK_ASSIGNED notification');

    const mktgNotifsRes = await request(`/api/merchants/${merchantId}/notifications?role=MARKETING`);
    assert(mktgNotifsRes.ok && mktgNotifsRes.data.success, 'Marketing notifications fetched');
    const mktgTaskNotif = mktgNotifsRes.data.data.find(
      (n) => n.type === 'TASK_ASSIGNED' && n.role === 'MARKETING'
    );
    assert(mktgTaskNotif != null, 'Marketing received TASK_ASSIGNED notification');
    console.log(`   Staff Notification: "${staffTaskNotif.title}"`);
    console.log(`   Marketing Notification: "${mktgTaskNotif.title}"\n`);

    // 6. Task Lifecycle Execution (TODO -> IN_PROGRESS -> COMPLETED)
    console.log('--- 6. Testing Task Lifecycle Transitions ---');
    // Start Staff Task
    const startRes = await request(`/api/tasks/${staffTask._id}/start`, { method: 'POST' });
    assert(startRes.ok && startRes.data.success, 'Staff task started successfully');
    assert(startRes.data.data.status === 'IN_PROGRESS', 'Staff task status is IN_PROGRESS');

    // Complete Staff Task
    const completeStaffRes = await request(`/api/tasks/${staffTask._id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completionNote: 'Cold brew and croissants ready at the counter.' }),
    });
    assert(completeStaffRes.ok && completeStaffRes.data.success, 'Staff task completed successfully');
    assert(completeStaffRes.data.data.status === 'COMPLETED', 'Staff task status is COMPLETED');

    // Complete Marketing Task
    const completeMktgRes = await request(`/api/tasks/${marketingTask._id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completionNote: 'WhatsApp copy verified with ₹199 combo banner.' }),
    });
    assert(completeMktgRes.ok && completeMktgRes.data.success, 'Marketing task completed successfully');
    assert(completeMktgRes.data.data.status === 'COMPLETED', 'Marketing task status is COMPLETED');
    console.log(`   Both team tasks executed through completion lifecycle\n`);

    // 7. Manager Notification on Task Completion
    console.log('--- 7. Testing Manager Task Completion Notifications ---');
    const managerNotifsRes = await request(`/api/merchants/${merchantId}/notifications?role=MANAGER`);
    assert(managerNotifsRes.ok && managerNotifsRes.data.success, 'Manager notifications fetched');
    const taskCompletedNotif = managerNotifsRes.data.data.find((n) => n.type === 'TASK_COMPLETED');
    assert(taskCompletedNotif != null, 'Manager received TASK_COMPLETED notification');
    console.log(`   Manager Notification: "${taskCompletedNotif.title}"\n`);

    // 8. Outcome Measurement & Team Outcome Notification
    console.log('--- 8. Testing Team Outcome Notification ---');
    const measureRes = await request(`/api/actions/${pendingAction._id}/measure`, {
      method: 'POST',
      body: JSON.stringify({ merchantId }),
    });
    assert(measureRes.ok && measureRes.data.success, 'Outcome measured successfully');

    // Check Marketing notifications for OUTCOME_AVAILABLE or OUTCOME_MEASURED
    const mktgOutcomeNotifs = await request(`/api/merchants/${merchantId}/notifications?role=MARKETING`);
    const hasOutcomeNotif = mktgOutcomeNotifs.data.data.some(
      (n) => n.type === 'OUTCOME_AVAILABLE' || n.category === 'OUTCOME'
    );
    assert(hasOutcomeNotif, 'Marketing received outcome notification');
    console.log(`   Outcome result routed to relevant team members\n`);

    // 9. Activity Timeline Lifecycle Validation
    console.log('--- 9. Testing Activity Timeline Events ---');
    const activityRes = await request(`/api/merchants/${merchantId}/activity`);
    assert(activityRes.ok && activityRes.data.success, 'Activity timeline fetched');
    const events = Array.isArray(activityRes.data.data) ? activityRes.data.data : (activityRes.data.data?.events || []);

    const assignEvent = events.find((e) => e.category === 'ASSIGN' || e.type === 'TASK_ASSIGNED');
    const taskDoneEvent = events.find((e) => e.category === 'TASK_COMPLETED' || e.type === 'TASK_COMPLETED');

    assert(assignEvent != null, 'Activity timeline captures task assignment (ASSIGN)');
    assert(taskDoneEvent != null, 'Activity timeline captures task completion (TASK_COMPLETED)');
    console.log(`   ASSIGN Event: "${assignEvent.title}"`);
    console.log(`   TASK_COMPLETED Event: "${taskDoneEvent.title}"\n`);

    // 10. Demo Reset Idempotency & Zero Clutter
    console.log('--- 10. Testing Demo Reset Idempotency & Zero Duplicate Clutter ---');
    const resetRes1 = await request('/api/demo/reset', { method: 'POST' });
    assert(resetRes1.ok && resetRes1.data.success, 'Reset 1 succeeded');

    const resetRes2 = await request('/api/demo/reset', { method: 'POST' });
    assert(resetRes2.ok && resetRes2.data.success, 'Reset 2 succeeded');

    // Confirm tasks cleared and team intact
    const tasksAfterReset = await request(`/api/merchants/${merchantId}/tasks`);
    assert(tasksAfterReset.data.count === 0, 'All dynamic tasks purged cleanly on reset');

    const teamAfterReset = await request(`/api/merchants/${merchantId}/team`);
    assert(teamAfterReset.data.count === 4, 'Exactly 4 canonical team members preserved');

    const notifsAfterReset = await request(`/api/merchants/${merchantId}/notifications`);
    assert(notifsAfterReset.data.data.length === 1, 'Exactly 1 notification preserved on reset');

    console.log('\n================================================================');
    console.log(`🎉 ALL PHASE 6 TESTS PASSED: ${passCount}/${testCount}`);
    console.log('GrowKaro Phase 6 Team & Employee Integration Successfully Verified!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

runPhase6Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
