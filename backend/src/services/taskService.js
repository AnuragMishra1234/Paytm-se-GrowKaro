const Task = require('../models/Task');
const Action = require('../models/Action');
const TeamMember = require('../models/TeamMember');
const teamService = require('./teamService');
const notificationService = require('./notificationService');
const memoryService = require('./memoryService');

/**
 * taskService.js — Operational Task Creation, Routing & Lifecycle Management
 */

/**
 * Automatically create actionable employee tasks when an Action is approved
 */
const createTasksForAction = async (action, merchant) => {
  const merchantId = action.merchantId;
  const createdTasks = [];

  // Ensure team members exist
  await teamService.ensureDefaultTeam(merchantId, merchant.businessName);

  // Identify assignees
  const marketingMember = await teamService.getPreferredAssignee(merchantId, 'MARKETING');
  const staffMember = await teamService.getPreferredAssignee(merchantId, 'STAFF');
  const managerMember = await teamService.getPreferredAssignee(merchantId, 'MANAGER');

  // 1. Marketing Task: Campaign Creative & Copy Prep
  if (marketingMember) {
    const marketingTask = await Task.create({
      merchantId,
      assignedTo: marketingMember._id,
      assignedToRole: 'MARKETING',
      assignedToName: marketingMember.name,
      createdBy: managerMember?._id || null,
      createdByName: managerMember?.name || 'Store Manager',
      title: `Campaign Prep: ${action.title}`,
      description: `Prepare promotional creative, review WhatsApp copy ("${action.payload?.headline || action.title}"), and confirm audience targeting (${action.targetAudience}) before dispatch.`,
      type: 'MARKETING',
      priority: 'HIGH',
      status: 'TODO',
      relatedActionId: action._id,
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      auditLog: [
        {
          status: 'TODO',
          actor: managerMember?.name || 'Manager',
          note: 'Task created automatically following AI recommendation approval.',
        },
      ],
    });

    createdTasks.push(marketingTask);

    // Central notification router notifies Marketing
    await notificationService.notifyTaskAssigned(marketingTask, merchant).catch(() => {});
  }

  // 2. Staff Task: Store & Inventory Readiness
  if (staffMember) {
    let inventoryDesc = `Ensure cold brew batches, fresh glassware, and pastry pairing inventory are stocked and ready at the counter before the 2:00 PM lull window.`;
    if (action.payload?.offer) {
      inventoryDesc += ` Brief counter staff on active offer: "${action.payload.offer}".`;
    }

    const staffTask = await Task.create({
      merchantId,
      assignedTo: staffMember._id,
      assignedToRole: 'STAFF',
      assignedToName: staffMember.name,
      createdBy: managerMember?._id || null,
      createdByName: managerMember?.name || 'Store Manager',
      title: `Inventory & Counter Prep: ${action.title}`,
      description: inventoryDesc,
      type: 'INVENTORY',
      priority: 'URGENT',
      status: 'TODO',
      relatedActionId: action._id,
      dueAt: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 90 mins
      auditLog: [
        {
          status: 'TODO',
          actor: managerMember?.name || 'Manager',
          note: 'Task created automatically for floor operations readiness.',
        },
      ],
    });

    createdTasks.push(staffTask);

    // Central notification router notifies Staff
    await notificationService.notifyTaskAssigned(staffTask, merchant).catch(() => {});
  }

  // Record task assignment context in Cognee memory
  await memoryService.storeMemory(merchantId, {
    type: 'preference',
    key: `task_assignment_pattern_${action.type.toLowerCase()}`,
    content: `When ${action.title} was approved, tasks were routed to Marketing (${marketingMember?.name || 'Marketing'}) for creative prep and Staff (${staffMember?.name || 'Staff'}) for inventory readiness.`,
    tags: ['task_routing', 'team_assignment', action.type.toLowerCase()],
    source: 'system_observed',
  }).catch(() => {});

  return createdTasks;
};

/**
 * Query tasks for a merchant with role/assignee filtering
 */
const getMerchantTasks = async (merchantId, filter = {}) => {
  const query = { merchantId };

  if (filter.assignedTo) {
    query.assignedTo = filter.assignedTo;
  }

  if (filter.role && filter.role !== 'ALL') {
    query.assignedToRole = filter.role.toUpperCase();
  }

  if (filter.status && filter.status !== 'ALL') {
    query.status = filter.status.toUpperCase();
  }

  if (filter.type && filter.type !== 'ALL') {
    query.type = filter.type.toUpperCase();
  }

  if (filter.relatedActionId) {
    query.relatedActionId = filter.relatedActionId;
  }

  return await Task.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('assignedTo', 'name email role avatar')
    .populate('relatedActionId', 'title channel targetAudience payload executionStatus')
    .lean();
};

/**
 * Start a task (TODO -> IN_PROGRESS)
 */
const startTask = async (taskId, memberId = null) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');

  task.status = 'IN_PROGRESS';
  task.startedAt = new Date();
  task.auditLog.push({
    status: 'IN_PROGRESS',
    actor: task.assignedToName || 'Employee',
    note: 'Task work started.',
  });

  await task.save();
  return task;
};

/**
 * Complete a task (IN_PROGRESS/TODO -> COMPLETED)
 */
const completeTask = async (taskId, memberId = null, completionNote = '') => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');

  task.status = 'COMPLETED';
  task.completedAt = new Date();
  task.completionNote = completionNote || 'Completed on schedule.';
  task.auditLog.push({
    status: 'COMPLETED',
    actor: task.assignedToName || 'Employee',
    note: task.completionNote,
  });

  await task.save();

  // Notify manager/owner via central router
  const Merchant = require('../models/Merchant');
  const merchant = await Merchant.findById(task.merchantId).lean();
  if (merchant) {
    await notificationService.notifyTaskCompleted(task, task.assignedToName, merchant).catch(() => {});
  }

  // Check if all tasks for the linked action are completed
  if (task.relatedActionId) {
    await checkAndExecuteActionIfReady(task.relatedActionId, merchant);
  }

  return task;
};

/**
 * If all tasks for an action are complete, trigger the n8n execution pipeline
 */
const checkAndExecuteActionIfReady = async (actionId, merchant) => {
  const remainingTasks = await Task.countDocuments({
    relatedActionId: actionId,
    status: { $in: ['TODO', 'IN_PROGRESS'] },
  });

  if (remainingTasks === 0) {
    const action = await Action.findById(actionId);
    if (action && action.approvalStatus === 'APPROVED' && action.executionStatus !== 'SUCCESS') {
      const actionService = require('./actionService');
      await actionService.triggerExecutionAfterTasks(action._id, merchant);
    }
  }
};

/**
 * Manually create a task
 */
const createManualTask = async (merchantId, data) => {
  // Ensure default team members exist
  await teamService.ensureDefaultTeam(merchantId);

  let assignedTo = data.assignedTo;
  let assignedToRole = (data.assignedToRole || 'STAFF').toUpperCase();
  let assignedToName = data.assignedToName;

  // Resolve assignedTo if missing, or if empty string
  if (!assignedTo || assignedTo === '') {
    const preferred = await teamService.getPreferredAssignee(merchantId, assignedToRole);
    if (preferred) {
      assignedTo = preferred._id;
      assignedToName = preferred.name;
      assignedToRole = preferred.role;
    }
  } else {
    // If assignedTo ID is given, confirm name and role
    const member = await TeamMember.findById(assignedTo).lean();
    if (member) {
      assignedToName = member.name;
      assignedToRole = member.role;
    }
  }

  // Fallback if still no assignedTo
  if (!assignedTo) {
    const anyMember = await TeamMember.findOne({ merchantId }).lean();
    if (anyMember) {
      assignedTo = anyMember._id;
      assignedToName = anyMember.name;
      assignedToRole = anyMember.role;
    }
  }

  let createdBy = data.createdBy;
  let createdByName = data.createdByName;
  if (!createdBy) {
    const manager = await teamService.getPreferredAssignee(merchantId, 'MANAGER');
    if (manager) {
      createdBy = manager._id;
      createdByName = manager.name;
    } else {
      createdByName = 'Priya Sharma (Store Manager)';
    }
  }

  const dueAt = data.dueAt ? new Date(data.dueAt) : new Date(Date.now() + 2 * 60 * 60 * 1000);

  const task = await Task.create({
    merchantId,
    assignedTo,
    assignedToRole,
    assignedToName: assignedToName || assignedToRole,
    createdBy,
    createdByName: createdByName || 'Store Manager',
    title: data.title?.trim() || 'Store Task',
    description: data.description?.trim() || 'Operational task assigned by Store Manager.',
    type: data.type || 'OPERATIONS',
    priority: data.priority || 'HIGH',
    status: 'TODO',
    dueAt,
    auditLog: [
      {
        status: 'TODO',
        actor: createdByName || 'Store Manager',
        note: 'Task assigned manually by Store Manager.',
      },
    ],
  });

  const Merchant = require('../models/Merchant');
  const merchant = await Merchant.findById(merchantId).lean();
  if (merchant) {
    await notificationService.notifyTaskAssigned(task, merchant).catch(() => {});
  }

  return task;
};

/**
 * Delete / cancel a task
 */
const deleteTask = async (taskId, merchantId = null) => {
  const query = { _id: taskId };
  if (merchantId) query.merchantId = merchantId;

  const task = await Task.findOneAndDelete(query);
  if (!task) {
    throw new Error('Task not found');
  }
  return { success: true, message: `Task "${task.title}" deleted` };
};

module.exports = {
  createTasksForAction,
  getMerchantTasks,
  startTask,
  completeTask,
  createManualTask,
  deleteTask,
  checkAndExecuteActionIfReady,
};
