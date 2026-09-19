const taskService = require('../services/taskService');
const Task = require('../models/Task');
const Merchant = require('../models/Merchant');

/**
 * taskController.js — Controller for operational team tasks
 */

/**
 * GET /api/merchants/:id/tasks
 * Returns tasks for a merchant, filtered by role/status if provided
 */
const getMerchantTasks = async (req, res, next) => {
  try {
    const merchantId = req.params.id || req.params.merchantId;
    const { role, status, type, assignedTo, relatedActionId } = req.query;

    const tasks = await taskService.getMerchantTasks(merchantId, {
      role,
      status,
      type,
      assignedTo,
      relatedActionId,
    });

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/merchants/:id/tasks
 * Create a new task manually
 */
const createTask = async (req, res, next) => {
  try {
    const merchantId = req.params.id || req.params.merchantId;
    const taskData = req.body;

    const task = await taskService.createManualTask(merchantId, taskData);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role avatar')
      .populate('relatedActionId', 'title channel targetAudience payload executionStatus')
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tasks/:id/start
 * Mark a task as IN_PROGRESS
 */
const startTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const memberId = req.body.memberId || req.requester?._id;

    const task = await taskService.startTask(taskId, memberId);

    res.json({
      success: true,
      data: task,
      message: `Task "${task.title}" is now in progress`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tasks/:id/complete
 * Mark a task as COMPLETED
 */
const completeTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { completionNote, memberId } = req.body;

    const task = await taskService.completeTask(taskId, memberId || req.requester?._id, completionNote);

    res.json({
      success: true,
      data: task,
      message: `Task "${task.title}" marked as completed`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tasks/:id
 * General task update (priority, dueAt, notes, etc.)
 */
const updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(taskId, { $set: updates }, { new: true });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const result = await taskService.deleteTask(taskId);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMerchantTasks,
  createTask,
  getTaskById,
  startTask,
  completeTask,
  updateTask,
  deleteTask,
};
