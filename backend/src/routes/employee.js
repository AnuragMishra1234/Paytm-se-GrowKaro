const express = require('express');
const router = express.Router();
const { validateObjectId } = require('../middleware/errorHandler');
const {
  getEmployeeDashboard,
  startEmployeeTask,
  completeEmployeeTask,
} = require('../controllers/employeeController');

// GET /api/employee or /api/employee/dashboard
router.get('/', getEmployeeDashboard);
router.get('/dashboard', getEmployeeDashboard);

// POST /api/employee/tasks/:taskId/start
router.post('/tasks/:taskId/start', startEmployeeTask);

// POST /api/employee/tasks/:taskId/complete
router.post('/tasks/:taskId/complete', completeEmployeeTask);

// Merchant-scoped aliases:
// GET /api/employee/:id/dashboard
router.get('/:id/dashboard', validateObjectId, getEmployeeDashboard);
router.post('/:id/tasks/:taskId/start', validateObjectId, startEmployeeTask);
router.post('/:id/tasks/:taskId/complete', validateObjectId, completeEmployeeTask);

module.exports = router;
