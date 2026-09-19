const notificationService = require('../services/notificationService');

/**
 * notificationController.js — Handles merchant notification requests
 */

const getNotifications = async (req, res, next) => {
  try {
    const merchantId = req.params.id || req.params.merchantId;
    const result = await notificationService.getMerchantNotifications(merchantId, req.query);
    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      totalCount: result.totalCount,
    });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const notification = await notificationService.markAsRead(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const merchantId = req.params.id || req.params.merchantId;
    const result = await notificationService.markAllAsRead(merchantId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
};
