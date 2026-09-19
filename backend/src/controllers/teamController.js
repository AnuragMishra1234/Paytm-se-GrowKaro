const teamService = require('../services/teamService');
const Merchant = require('../models/Merchant');

/**
 * teamController.js — Controller for merchant team members
 */

/**
 * GET /api/merchants/:id/team
 */
const getTeam = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const team = await teamService.getMerchantTeam(merchantId);
    res.json({
      success: true,
      data: team,
      count: team.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/merchants/:id/team/invite
 */
const inviteMember = async (req, res, next) => {
  try {
    const merchantId = req.params.id;
    const { name, email, phone, role } = req.body;

    const member = await teamService.inviteTeamMember(merchantId, {
      name,
      email,
      phone,
      role,
    });

    res.status(201).json({
      success: true,
      data: member,
      message: `Invitation successfully sent to ${name} (${role}). Status: INVITED`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/team/:memberId
 */
const updateMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const updates = req.body;
    const updated = await teamService.updateTeamMember(memberId, updates);
    res.json({
      success: true,
      data: updated,
      message: 'Team member updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/team/:memberId
 */
const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const result = await teamService.removeTeamMember(memberId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTeam,
  inviteMember,
  updateMember,
  removeMember,
};
