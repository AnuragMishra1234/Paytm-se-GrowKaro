const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const {
  getTaskById,
  startTask,
  completeTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// GET /api/tasks/:id
router.get('/:id', validateObjectId, getTaskById);

// POST /api/tasks/:id/start
router.post('/:id/start', validateObjectId, startTask);

// POST /api/tasks/:id/complete
router.post('/:id/complete', validateObjectId, completeTask);

// PATCH /api/tasks/:id
router.patch('/:id', validateObjectId, updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', validateObjectId, deleteTask);

module.exports = router;
