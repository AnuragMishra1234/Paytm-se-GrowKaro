const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const {
  updateMember,
  removeMember,
} = require('../controllers/teamController');

// PATCH /api/team/:memberId
router.patch('/:memberId', validateObjectId, updateMember);

// DELETE /api/team/:memberId
router.delete('/:memberId', validateObjectId, removeMember);

module.exports = router;
