/**
 * browserNotifications.js — Web Notifications API helper for GrowKaro
 *
 * Provides opt-in desktop notification prompts, status checks,
 * and dispatching for high-priority alerts like Action Approvals and Outlets.
 */

const STORAGE_KEY = 'growkaro_browser_notifications';

export const isBrowserNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const isNotificationEnabled = () => {
  if (!isBrowserNotificationSupported()) return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  return Notification.permission === 'granted' && stored === 'enabled';
};

export const requestNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) {
    return { granted: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(STORAGE_KEY, 'enabled');
      return { granted: true, permission };
    } else {
      localStorage.setItem(STORAGE_KEY, 'disabled');
      return { granted: false, permission };
    }
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return { granted: false, error: err.message };
  }
};

export const disableNotifications = () => {
  localStorage.setItem(STORAGE_KEY, 'disabled');
};

export const enableNotifications = async () => {
  if (Notification.permission === 'granted') {
    localStorage.setItem(STORAGE_KEY, 'enabled');
    return true;
  }
  const res = await requestNotificationPermission();
  return res.granted;
};

export const sendDesktopNotification = (title, options = {}) => {
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;
  if (localStorage.getItem(STORAGE_KEY) === 'disabled') return null;

  try {
    const notification = new Notification(title, {
      icon: options.icon || '/logo.png',
      badge: '/logo.png',
      body: options.body || '',
      tag: options.tag || 'growkaro-alert',
      renotify: true,
      ...options,
    });

    if (options.onClick) {
      notification.onclick = (e) => {
        window.focus();
        options.onClick(e);
        notification.close();
      };
    }

    return notification;
  } catch (err) {
    console.warn('Desktop notification dispatch failed:', err);
    return null;
  }
};
