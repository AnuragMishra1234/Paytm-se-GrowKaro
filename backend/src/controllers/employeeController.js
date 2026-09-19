const Merchant = require('../models/Merchant');
const Task = require('../models/Task');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const Outcome = require('../models/Outcome');
const Insight = require('../models/Insight');
const TeamMember = require('../models/TeamMember');
const loyaltyService = require('../services/loyaltyService');
const n8nService = require('../services/n8nService');

/**
 * employeeController.js
 * Specialized controller powering Rahul Verma's Marketing Lead Workspace.
 */

// GET /api/merchants/:id/employee/dashboard or /api/employee/dashboard
const getEmployeeDashboard = async (req, res, next) => {
  try {
    let merchantId = req.params.id || req.query.merchantId;
    if (!merchantId) {
      const cafe = await Merchant.findOne({ businessName: /Cafe Aroma/i });
      merchantId = cafe?._id;
    }

    const targetRole = (req.query.role || req.headers['x-demo-role'] || 'MARKETING').toUpperCase();
    const isStaff = targetRole === 'STAFF';

    if (isStaff) {
      let staffMember = await TeamMember.findOne({
        merchantId,
        role: 'STAFF',
        status: 'ACTIVE',
      });

      if (!staffMember) {
        staffMember = {
          name: 'Ananya Das',
          role: 'STAFF',
          email: 'ananya@cafearoma.in',
        };
      }

      const tasks = await Task.find({
        merchantId,
        assignedToRole: 'STAFF',
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const notifications = await Notification.find({
        merchantId,
        $or: [
          { role: 'STAFF' },
          { role: 'ALL' },
          { recipientMemberId: staffMember?._id },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const operationalChecklist = [
        { id: 'chk_1', task: 'Cold Brew Keg Readiness', detail: 'Ensure 20L fresh brew is tapped and refrigerated before 1:30 PM', status: 'READY', time: '1:30 PM' },
        { id: 'chk_2', task: 'Pastry Counter Stocking', detail: 'Verify 15 Butter Croissants and 10 Muffins on front display', status: 'IN_PROGRESS', time: '1:45 PM' },
        { id: 'chk_3', task: 'POS Promotional Shortcut', detail: 'Confirm ₹199 Afternoon Combo quick-key is enabled on billing terminal', status: 'READY', time: '2:00 PM' },
      ];

      return res.json({
        success: true,
        data: {
          employee: {
            name: staffMember.name || 'Ananya Das',
            role: 'STAFF',
            title: 'Floor Operations & Barista',
            email: staffMember.email || 'ananya@cafearoma.in',
            greeting: 'Good morning, Ananya',
            subtitle: 'Here is your store-floor operational checklist, inventory prep, and shift readiness for today.',
          },
          summary: {
            pendingTasks: tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
            completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
            checklistTotal: operationalChecklist.length,
            activeCampaigns: 0,
            customerOpportunitiesCount: 0,
            recentCampaignsCount: 0,
          },
          tasks,
          checklist: operationalChecklist,
          notifications,
          campaigns: [],
          customerOpportunities: [],
          pendingActions: [],
          outcomes: [],
          recommendations: [],
        },
      });
    }

    // Default: Rahul Verma (Marketing Lead)
    let marketingMember = await TeamMember.findOne({
      merchantId,
      role: 'MARKETING',
      status: 'ACTIVE',
    });

    if (!marketingMember) {
      marketingMember = {
        name: 'Rahul Verma',
        role: 'MARKETING',
        email: 'rahul@cafearoma.in',
      };
    }

    // 2. Fetch Rahul's Tasks
    const tasks = await Task.find({
      merchantId,
      assignedToRole: 'MARKETING',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 3. Fetch Campaigns Assigned / Relevant to Marketing
    const campaigns = await Campaign.find({
      merchantId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 4. Fetch Grounded Customer Opportunities (AI Loyalty)
    const customerOpportunities = await loyaltyService.getPersonalizedOpportunities(merchantId);

    // 5. Fetch Pending Actions requiring Marketing Preparation or Signoff
    const pendingActions = await Action.find({
      merchantId,
      approvalStatus: { $in: ['PENDING', 'APPROVED'] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 6. Fetch Recent Notifications (Filtered strictly for Marketing)
    const notifications = await Notification.find({
      merchantId,
      $or: [
        { role: 'MARKETING' },
        { role: 'ALL' },
        { recipientMemberId: marketingMember?._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 7. Fetch Recent Campaign Results (strictly non-causal observed metrics)
    const outcomes = await Outcome.find({
      merchantId,
      status: 'MEASURED',
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    // 8. AI Marketing Recommendations
    const marketingInsights = await Insight.find({
      merchantId,
      category: { $in: ['OPPORTUNITY', 'ACT_NOW'] },
    })
      .sort({ priorityScore: -1 })
      .limit(3)
      .lean();

    res.json({
      success: true,
      data: {
        employee: {
          name: marketingMember.name || 'Rahul Verma',
          role: 'MARKETING',
          title: 'Marketing Lead',
          email: marketingMember.email || 'rahul@cafearoma.in',
          greeting: 'Good morning, Rahul',
          subtitle: 'Here are the marketing actions and customer opportunities that need your attention.',
        },
        summary: {
          pendingTasks: tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
          activeCampaigns: campaigns.filter((c) => c.status === 'RUNNING' || c.status === 'SCHEDULED').length,
          customerOpportunitiesCount: customerOpportunities.length,
          recentCampaignsCount: campaigns.length,
        },
        tasks,
        campaigns,
        customerOpportunities,
        pendingActions,
        notifications,
        outcomes,
        recommendations: marketingInsights,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchants/:id/employee/tasks/:taskId/start
const startEmployeeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    task.status = 'IN_PROGRESS';
    task.auditLog.push({
      status: 'IN_PROGRESS',
      actor: req.requester?.name || 'Rahul Verma',
      timestamp: new Date(),
      note: 'Employee started working on marketing task',
    });
    await task.save();

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchants/:id/employee/tasks/:taskId/complete
const completeEmployeeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { completionNote } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    task.status = 'COMPLETED';
    task.completedAt = new Date();
    task.completionNote = completionNote || 'Marketing creative, copy, and audience verified.';
    task.auditLog.push({
      status: 'COMPLETED',
      actor: req.requester?.name || 'Rahul Verma',
      timestamp: new Date(),
      note: task.completionNote,
    });
    await task.save();

    // Check if related Action is now ready for execution
    if (task.relatedActionId) {
      const remainingTasks = await Task.countDocuments({
        relatedActionId: task.relatedActionId,
        status: { $in: ['TODO', 'IN_PROGRESS'] },
      });

      // If all prep tasks done and action is APPROVED, execute campaign via n8n
      const action = await Action.findById(task.relatedActionId);
      if (action && action.approvalStatus === 'APPROVED' && remainingTasks === 0 && action.executionStatus !== 'SUCCESS') {
        await n8nService.executeActionWorkflow(action, task.merchantId);
      }
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmployeeDashboard,
  startEmployeeTask,
  completeEmployeeTask,
};
