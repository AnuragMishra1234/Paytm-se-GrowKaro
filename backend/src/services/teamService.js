const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const memoryService = require('./memoryService');

/**
 * teamService.js — Merchant Team & Employee Management Layer
 */

const DEFAULT_CAFE_TEAM = [
  {
    name: 'Vikram Mehta',
    email: 'vikram@cafearoma.in',
    phone: '+91 98765 43210',
    role: 'OWNER',
    status: 'ACTIVE',
    avatar: 'VM',
    permissions: ['ALL'],
  },
  {
    name: 'Priya Sharma',
    email: 'priya@cafearoma.in',
    phone: '+91 98765 43211',
    role: 'MANAGER',
    status: 'ACTIVE',
    avatar: 'PS',
    permissions: ['VIEW_PULSE', 'APPROVE_ACTIONS', 'ASSIGN_TASKS', 'TRACK_TEAM'],
  },
  {
    name: 'Rahul Verma',
    email: 'rahul@cafearoma.in',
    phone: '+91 98765 43212',
    role: 'MARKETING',
    status: 'ACTIVE',
    avatar: 'RV',
    permissions: ['VIEW_CAMPAIGNS', 'WORK_TASKS', 'COMPLETE_TASKS'],
  },
  {
    name: 'Ananya Das',
    email: 'ananya@cafearoma.in',
    phone: '+91 98765 43213',
    role: 'STAFF',
    status: 'ACTIVE',
    avatar: 'AD',
    permissions: ['VIEW_OPERATIONS', 'COMPLETE_TASKS'],
  },
];

/**
 * Ensure default team members exist for a merchant (e.g. Cafe Aroma)
 */
const ensureDefaultTeam = async (merchantId, businessName = '') => {
  const existingCount = await TeamMember.countDocuments({ merchantId });
  if (existingCount > 0) {
    return await TeamMember.find({ merchantId, status: { $ne: 'REMOVED' } }).lean();
  }

  const createdMembers = [];
  for (const template of DEFAULT_CAFE_TEAM) {
    const member = await TeamMember.create({
      ...template,
      merchantId,
    });
    createdMembers.push(member);
  }

  // Record initial team structure in Cognee merchant memory
  await memoryService.storeMemory(merchantId, {
    type: 'preference',
    key: 'team_roster_defaults',
    content: `Cafe Aroma team structure established: Manager Priya Sharma oversees approvals, Marketing tasks are assigned to Rahul Verma, and Store Operations/Inventory prep are assigned to Ananya Das.`,
    tags: ['team_structure', 'role_assignment', 'operations'],
    source: 'system_observed',
  }).catch(() => {});

  return createdMembers;
};

/**
 * Get all active team members for a merchant with active task counts
 */
const getMerchantTeam = async (merchantId) => {
  // Ensure default team is present if empty
  await ensureDefaultTeam(merchantId);

  const members = await TeamMember.find({ merchantId, status: { $ne: 'REMOVED' } })
    .sort({ createdAt: 1 })
    .lean();

  // Attach active task counts
  const memberIds = members.map((m) => m._id);
  const taskCounts = await Task.aggregate([
    {
      $match: {
        merchantId,
        assignedTo: { $in: memberIds },
        status: { $in: ['TODO', 'IN_PROGRESS'] },
      },
    },
    {
      $group: {
        _id: '$assignedTo',
        count: { $sum: 1 },
      },
    },
  ]);

  const taskCountMap = {};
  taskCounts.forEach((tc) => {
    taskCountMap[tc._id.toString()] = tc.count;
  });

  return members.map((m) => ({
    ...m,
    activeTaskCount: taskCountMap[m._id.toString()] || 0,
  }));
};

/**
 * Invite / create a new team member
 */
const inviteTeamMember = async (merchantId, { name, email, phone = '', role = 'STAFF' }) => {
  if (!name || !email) {
    throw new Error('Name and email are required to invite a team member');
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await TeamMember.findOne({ merchantId, email: cleanEmail });
  if (existing) {
    if (existing.status === 'REMOVED') {
      existing.status = 'INVITED';
      existing.role = role;
      existing.name = name;
      existing.phone = phone;
      await existing.save();
      return existing;
    }
    throw new Error(`A team member with email ${cleanEmail} already exists in this store.`);
  }

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const member = await TeamMember.create({
    merchantId,
    name: name.trim(),
    email: cleanEmail,
    phone: phone.trim(),
    role: role.toUpperCase(),
    status: 'INVITED',
    avatar: initials,
    permissions: role === 'MANAGER' ? ['VIEW_PULSE', 'APPROVE_ACTIONS', 'ASSIGN_TASKS'] : ['WORK_TASKS'],
  });

  // Record preference in Cognee memory
  await memoryService.storeMemory(merchantId, {
    type: 'preference',
    key: `team_member_invite_${member._id}`,
    content: `New team member ${name} (${role}) invited to merchant team.`,
    tags: ['team', 'invite', role.toLowerCase()],
    source: 'merchant_feedback',
  }).catch(() => {});

  return member;
};

/**
 * Update a team member's role, status, or details
 */
const updateTeamMember = async (memberId, updates, merchantId = null) => {
  const query = { _id: memberId };
  if (merchantId) query.merchantId = merchantId;

  const member = await TeamMember.findOne(query);
  if (!member) throw new Error('Team member not found');

  if (updates.role) member.role = updates.role.toUpperCase();
  if (updates.status) member.status = updates.status.toUpperCase();
  if (updates.name) member.name = updates.name.trim();
  if (updates.phone) member.phone = updates.phone.trim();
  if (updates.lastActiveAt) member.lastActiveAt = updates.lastActiveAt;

  await member.save();
  return member;
};

/**
 * Remove a team member (Soft delete)
 */
const removeTeamMember = async (memberId, merchantId = null) => {
  const query = { _id: memberId };
  if (merchantId) query.merchantId = merchantId;

  const member = await TeamMember.findOne(query);
  if (!member) throw new Error('Team member not found');

  member.status = 'REMOVED';
  await member.save();
  return { success: true, message: `Member ${member.name} removed from team` };
};

/**
 * Get preferred or default assignee for a specific role
 */
const getPreferredAssignee = async (merchantId, role) => {
  const member = await TeamMember.findOne({
    merchantId,
    role: role.toUpperCase(),
    status: 'ACTIVE',
  }).sort({ createdAt: 1 });

  return member || null;
};

module.exports = {
  getMerchantTeam,
  ensureDefaultTeam,
  inviteTeamMember,
  updateTeamMember,
  removeTeamMember,
  getPreferredAssignee,
};
