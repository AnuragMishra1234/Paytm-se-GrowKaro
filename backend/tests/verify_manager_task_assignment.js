/**
 * verify_manager_task_assignment.js
 * Verification suite for Manager Manual Task Assignment & Dispatch
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

async function runTests() {
  console.log('================================================================');
  console.log('👔 GROWKARO: MANAGER TASK ASSIGNMENT & DISPATCH VERIFICATION');
  console.log(`Target Backend: ${API_BASE}`);
  console.log('================================================================\n');

  try {
    // 0. Fetch Cafe Aroma
    console.log('--- 0. Fetching Cafe Aroma Merchant ---');
    const merchantsRes = await request('/api/merchants');
    assert(merchantsRes.ok, 'Merchants endpoint returns 200');
    const cafe = (merchantsRes.data.data || merchantsRes.data).find(
      (m) => m.businessName && m.businessName.includes('Cafe Aroma')
    );
    assert(cafe && cafe._id, 'Found Cafe Aroma merchant');
    const merchantId = cafe._id;

    // 1. Fetch Team Roster
    console.log('\n--- 1. Fetching Team Roster ---');
    const teamRes = await request(`/api/merchants/${merchantId}/team`);
    assert(teamRes.ok, 'Team endpoint returns 200');
    const team = teamRes.data.data;
    const priya = team.find((m) => m.role === 'MANAGER');
    const rahul = team.find((m) => m.role === 'MARKETING');
    const ananya = team.find((m) => m.role === 'STAFF');
    assert(priya, 'Found Manager Priya Sharma');
    assert(rahul, 'Found Marketing Lead Rahul Verma');
    assert(ananya, 'Found Floor Staff Ananya Das');

    // 2. Manager creates task for Ananya (Staff)
    console.log('\n--- 2. Creating Task for Floor Operations (Ananya Das) ---');
    const staffTaskRes = await request(`/api/merchants/${merchantId}/tasks`, {
      method: 'POST',
      headers: { 'x-demo-role': 'MANAGER' },
      body: JSON.stringify({
        title: 'Batch Cold Brew Kegs (20L)',
        description: 'Brew and refrigerate 20L fresh cold brew batch at counter tap before the 2:00 PM afternoon lull window.',
        type: 'INVENTORY',
        priority: 'HIGH',
        assignedToRole: 'STAFF',
      }),
    });
    assert(staffTaskRes.status === 201, 'Task created successfully with HTTP 201');
    const staffTask = staffTaskRes.data.data;
    assert(staffTask.title === 'Batch Cold Brew Kegs (20L)', 'Task title matches');
    assert(staffTask.assignedToRole === 'STAFF', 'Task role is STAFF');
    assert(staffTask.assignedToName === 'Ananya Das', 'Auto-resolved assignee name to Ananya Das');
    assert(staffTask.createdByName.includes('Manager') || staffTask.createdByName.includes('Priya'), 'Task creator credited to Manager');

    // 3. Manager creates task for Rahul (Marketing)
    console.log('\n--- 3. Creating Task for Marketing Lead (Rahul Verma) ---');
    const mktgTaskRes = await request(`/api/merchants/${merchantId}/tasks`, {
      method: 'POST',
      headers: { 'x-demo-role': 'MANAGER' },
      body: JSON.stringify({
        title: 'Weekend Special WhatsApp Blast',
        description: 'Draft broadcast copy for 15% off Cold Brew + Pastry combo targeting churn-risk customers.',
        type: 'MARKETING',
        priority: 'URGENT',
        assignedToRole: 'MARKETING',
        assignedTo: rahul._id,
      }),
    });
    assert(mktgTaskRes.status === 201, 'Marketing task created successfully with HTTP 201');
    const mktgTask = mktgTaskRes.data.data;
    assert(mktgTask.assignedToRole === 'MARKETING', 'Task role is MARKETING');
    assert(mktgTask.assignedToName === 'Rahul Verma', 'Assignee is Rahul Verma');
    assert(mktgTask.priority === 'URGENT', 'Priority is URGENT');

    // 4. Verify tasks appear in Merchant Tasks List
    console.log('\n--- 4. Verifying Merchant Tasks List ---');
    const listRes = await request(`/api/merchants/${merchantId}/tasks`);
    assert(listRes.ok, 'Fetch tasks returns 200');
    const allTasks = listRes.data.data;
    const foundStaff = allTasks.find((t) => t._id === staffTask._id);
    const foundMktg = allTasks.find((t) => t._id === mktgTask._id);
    assert(foundStaff, 'Ananya task present in merchant task list');
    assert(foundMktg, 'Rahul task present in merchant task list');

    // 5. Verify Ananya sees her task in Employee Dashboard
    console.log('\n--- 5. Verifying Ananya Das Employee Workspace ---');
    const ananyaDashRes = await request(`/api/merchants/${merchantId}/employee/dashboard?role=STAFF`);
    assert(ananyaDashRes.ok, 'Staff employee dashboard returns 200');
    const ananyaTasks = ananyaDashRes.data.data.tasks || [];
    assert(
      ananyaTasks.some((t) => t._id === staffTask._id),
      'Ananya sees newly assigned task in her workspace'
    );

    // 6. Verify Rahul sees his task in Employee Dashboard
    console.log('\n--- 6. Verifying Rahul Verma Employee Workspace ---');
    const rahulDashRes = await request(`/api/merchants/${merchantId}/employee/dashboard?role=MARKETING`);
    assert(rahulDashRes.ok, 'Marketing employee dashboard returns 200');
    const rahulTasks = rahulDashRes.data.data.tasks || [];
    assert(
      rahulTasks.some((t) => t._id === mktgTask._id),
      'Rahul sees newly assigned task in his workspace'
    );

    // 7. Test Lifecycle: Start and Complete
    console.log('\n--- 7. Testing Task Work Lifecycle ---');
    const startRes = await request(`/api/tasks/${staffTask._id}/start`, { method: 'POST' });
    assert(startRes.ok, 'Start task returns 200');
    assert(startRes.data.data.status === 'IN_PROGRESS', 'Task status is IN_PROGRESS');

    const completeRes = await request(`/api/tasks/${staffTask._id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completionNote: '20L cold brew brewed, keg tapped in fridge.' }),
    });
    assert(completeRes.ok, 'Complete task returns 200');
    assert(completeRes.data.data.status === 'COMPLETED', 'Task status is COMPLETED');
    assert(completeRes.data.data.completionNote.includes('20L cold brew'), 'Completion note recorded');

    // 8. Test Delete Task
    console.log('\n--- 8. Testing Task Deletion ---');
    const deleteRes = await request(`/api/tasks/${staffTask._id}`, { method: 'DELETE' });
    assert(deleteRes.ok && deleteRes.data.success, 'DELETE /api/tasks/:id succeeded');

    const deleteMktgRes = await request(`/api/tasks/${mktgTask._id}`, { method: 'DELETE' });
    assert(deleteMktgRes.ok && deleteMktgRes.data.success, 'DELETE mktg task succeeded');

    const verifyDeleteRes = await request(`/api/tasks/${staffTask._id}`);
    assert(verifyDeleteRes.status === 404, 'Deleted task returns 404 Not Found');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passCount}/${testCount} TESTS PASSED PERFECTLY!`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
