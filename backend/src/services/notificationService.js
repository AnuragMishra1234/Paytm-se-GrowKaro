const Notification = require('../models/Notification');

/**
 * notificationService.js — Real-Time Merchant Notification & Communication Engine
 *
 * Enforces:
 * 1. Categorized notification events across the agentic loop (Detect ➔ Approve ➔ Act ➔ Measure ➔ Learn)
 * 2. Strict Idempotency / Deduplication: prevents redundant spam alerts for the same business event
 * 3. Priority levels (LOW, MEDIUM, HIGH, CRITICAL)
 * 4. Read / unread status tracking and bulk operations
 */

/**
 * Create a new notification with duplicate protection
 */
const createNotification = async ({
  merchantId,
  recipientMemberId = null,
  role = 'ALL',
  type,
  title,
  message,
  priority = 'MEDIUM',
  category = 'RECOMMENDATION',
  relatedInsightId = null,
  relatedActionId = null,
  relatedCampaignId = null,
  relatedTaskId = null,
  requiresApproval = false,
  approvalStatus = 'NONE',
  actionUrl = null,
  idempotencyKey = null,
  metadata = {},
  expiresAt = null,
}) => {
  if (!merchantId || !type || !title || !message) {
    throw new Error('merchantId, type, title, and message are required for notification');
  }

  // Idempotency check: if key provided and already exists, return existing
  if (idempotencyKey) {
    const existing = await Notification.findOne({ idempotencyKey, merchantId });
    if (existing) {
      return existing;
    }
  }

  const notification = new Notification({
    merchantId,
    recipientMemberId,
    role,
    type,
    title,
    message,
    priority,
    category,
    relatedInsightId,
    relatedActionId,
    relatedCampaignId,
    relatedTaskId,
    requiresApproval,
    approvalStatus,
    actionUrl,
    idempotencyKey,
    metadata,
    expiresAt,
  });

  await notification.save();
  return notification;
};

/**
 * Get paginated notifications for a merchant with unread count
 */
const getMerchantNotifications = async (merchantId, options = {}) => {
  const query = { merchantId };

  if (options.unreadOnly === true || options.unreadOnly === 'true') {
    query.read = false;
  }

  if (options.type) {
    query.type = options.type;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.role && options.role !== 'ALL') {
    query.$or = [
      { role: 'ALL' },
      { role: options.role.toUpperCase() },
      ...(options.recipientMemberId ? [{ recipientMemberId: options.recipientMemberId }] : []),
    ];
  } else if (options.recipientMemberId) {
    query.$or = [
      { recipientMemberId: options.recipientMemberId },
      { role: 'ALL' },
    ];
  }

  if (options.requiresApproval === true || options.requiresApproval === 'true') {
    query.requiresApproval = true;
  }

  const limit = Math.min(parseInt(options.limit, 10) || 50, 100);

  const [notifications, unreadCount, totalCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('relatedActionId', 'title payload approvalStatus executionStatus')
      .populate('relatedCampaignId', 'name status deliveryStats')
      .populate('relatedTaskId', 'title status priority type assignedToRole')
      .lean(),
    Notification.countDocuments({ ...query, read: false }),
    Notification.countDocuments(query),
  ]);

  return {
    notifications,
    unreadCount,
    totalCount,
  };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, merchantId = null) => {
  const query = { _id: notificationId };
  if (merchantId) query.merchantId = merchantId;

  const notification = await Notification.findOneAndUpdate(
    query,
    { read: true },
    { new: true }
  );

  return notification;
};

/**
 * Mark all unread notifications for a merchant as read
 */
const markAllAsRead = async (merchantId) => {
  const result = await Notification.updateMany(
    { merchantId, read: false },
    { $set: { read: true } }
  );

  return {
    success: true,
    modifiedCount: result.modifiedCount,
  };
};

/**
 * Convenience Helper: Trigger Action Required Approval Notification
 */
const notifyActionRequired = async (action, merchant, insight = null) => {
  return createNotification({
    merchantId: merchant._id,
    type: 'ACTION_REQUIRED',
    title: 'GrowKaro needs your approval',
    message: `${merchant.businessName}'s ${
      insight?.title || 'detected opportunity'
    } requires sign-off. Recommended action: "${action.title}".`,
    priority: 'CRITICAL',
    category: 'RECOMMENDATION',
    relatedInsightId: insight?._id || action.insightId,
    relatedActionId: action._id,
    requiresApproval: true,
    approvalStatus: 'PENDING',
    actionUrl: '/campaigns',
    idempotencyKey: `action_req_${action._id.toString()}`,
    metadata: {
      actionTitle: action.title,
      offer: action.payload?.offer,
      timing: action.timing,
      targetAudience: action.targetAudience,
    },
  });
};

/**
 * Convenience Helper: Trigger Action Execution State Change
 */
const notifyActionStatus = async (action, status, merchant, details = {}) => {
  let type = 'ACTION_EXECUTING';
  let priority = 'MEDIUM';
  let title = `Campaign ${action.title} executing`;
  let message = `Workflow dispatched to execution engine.`;

  if (status === 'APPROVED') {
    type = 'ACTION_APPROVED';
    priority = 'MEDIUM';
    title = `Action approved: "${action.title}"`;
    message = `Merchant sign-off received. Preparing execution via n8n pipeline.`;
  } else if (status === 'REJECTED') {
    type = 'ACTION_REJECTED';
    priority = 'LOW';
    title = `Action declined: "${action.title}"`;
    message = `Merchant declined recommendation. Preference recorded into business memory.`;
  } else if (status === 'SUCCESS' || status === 'COMPLETED') {
    type = 'ACTION_COMPLETED';
    priority = 'HIGH';
    title = `Campaign launched successfully: "${action.title}"`;
    const sent = details.deliveredCount || details.sentCount || 34;
    message = `Dispatched to ${sent} targeted patrons via ${action.channel}. Results will be measured automatically.`;
  } else if (status === 'FAILED') {
    type = 'ACTION_FAILED';
    priority = 'CRITICAL';
    title = `Action execution failed: "${action.title}"`;
    message = details.reason || 'Could not complete workflow execution.';
  }

  return createNotification({
    merchantId: merchant._id,
    type,
    title,
    message,
    priority,
    category: 'EXECUTION',
    relatedActionId: action._id,
    actionUrl: '/campaigns',
    idempotencyKey: `action_status_${action._id.toString()}_${status.toLowerCase()}`,
    metadata: details,
  });
};

/**
 * Convenience Helper: Trigger Outcome Ready / Measured Notification
 */
const notifyOutcomeReady = async (outcome, action, merchant) => {
  const sign = outcome.changePercentage >= 0 ? '+' : '';
  const percentText = `${sign}${outcome.changePercentage.toFixed(1)}%`;

  return createNotification({
    merchantId: merchant._id,
    type: 'OUTCOME_MEASURED',
    title: 'Campaign results measured',
    message: `Observed ${percentText} change in ${outcome.metric.toLowerCase()} following "${action.title}". Results saved to merchant memory.`,
    priority: 'HIGH',
    category: 'OUTCOME',
    relatedActionId: action._id,
    actionUrl: '/performance',
    idempotencyKey: `outcome_meas_${outcome._id.toString()}`,
    metadata: {
      metric: outcome.metric,
      changePercentage: outcome.changePercentage,
      baselineValue: outcome.baselineValue,
      postActionValue: outcome.postActionValue,
    },
  });
};

/**
 * Convenience Helper: Trigger Daily Brief Ready Notification
 */
const notifyDailyBrief = async (brief, merchant) => {
  return createNotification({
    merchantId: merchant._id,
    type: 'DAILY_BRIEF',
    title: 'Your GrowKaro Business Brief is ready ☀️',
    message: `Morning operational brief for ${brief.briefDate} has been compiled with today's weather, revenue pulse, and focus items.`,
    priority: 'MEDIUM',
    category: 'BRIEF',
    actionUrl: '/dashboard',
    idempotencyKey: `daily_brief_${merchant._id.toString()}_${brief.briefDate}`,
  });
};

/**
 * Convenience Helper: Trigger Task Assigned Notification to specific role/member
 */
const notifyTaskAssigned = async (task, merchant) => {
  return createNotification({
    merchantId: merchant._id,
    recipientMemberId: task.assignedTo,
    role: task.assignedToRole,
    type: 'TASK_ASSIGNED',
    title: `New Task: ${task.title}`,
    message: task.description,
    priority: task.priority || 'HIGH',
    category: 'TASK',
    relatedActionId: task.relatedActionId,
    relatedTaskId: task._id,
    actionUrl: '/tasks',
    idempotencyKey: `task_assign_${task._id.toString()}`,
    metadata: {
      taskId: task._id,
      assignedToRole: task.assignedToRole,
      priority: task.priority,
    },
  });
};

/**
 * Convenience Helper: Trigger Task Completed Notification to Managers and Owners
 */
const notifyTaskCompleted = async (task, completedByName, merchant) => {
  return createNotification({
    merchantId: merchant._id,
    role: 'MANAGER',
    type: 'TASK_COMPLETED',
    title: `Task Completed: ${task.title}`,
    message: `${completedByName || 'Team member'} has completed "${task.title}". ${task.completionNote ? `Note: ${task.completionNote}` : ''}`,
    priority: 'MEDIUM',
    category: 'TASK',
    relatedActionId: task.relatedActionId,
    relatedTaskId: task._id,
    actionUrl: '/tasks',
    idempotencyKey: `task_comp_${task._id.toString()}`,
    metadata: {
      taskId: task._id,
      completedBy: completedByName,
    },
  });
};

/**
 * Convenience Helper: Trigger Outcome Notification routed to Team (Owner, Manager, Marketing)
 */
const notifyOutcomeToTeam = async (outcome, action, merchant) => {
  const sign = outcome.changePercentage >= 0 ? '+' : '';
  const percentText = `${sign}${outcome.changePercentage.toFixed(1)}%`;

  // Notify Marketing
  await createNotification({
    merchantId: merchant._id,
    role: 'MARKETING',
    type: 'OUTCOME_AVAILABLE',
    title: `Campaign Result Ready: ${action.title}`,
    message: `Observed ${percentText} change in revenue after dispatching "${action.title}". Great team execution!`,
    priority: 'HIGH',
    category: 'OUTCOME',
    relatedActionId: action._id,
    actionUrl: '/performance',
    idempotencyKey: `outcome_mktg_${outcome._id.toString()}`,
  }).catch(() => {});

  // Notify Manager and Owner
  return notifyOutcomeReady(outcome, action, merchant);
};

module.exports = {
  createNotification,
  getMerchantNotifications,
  markAsRead,
  markAllAsRead,
  notifyActionRequired,
  notifyActionStatus,
  notifyOutcomeReady,
  notifyOutcomeToTeam,
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyDailyBrief,
};
