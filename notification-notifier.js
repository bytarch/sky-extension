// Notification Notifier Script for Sky Extension
// This script schedules and manages scheduled notifications for the extension

// Class to handle scheduled notifications
class NotificationNotifier {
  constructor() {
    this.schedules = new Map();
    this.initSchedules();
  }

  // Initialize predefined notification schedules
  initSchedules() {
    // Schedule setup reminder check every 24 hours
    this.scheduleNotification('setup-reminder', {
      type: 'interval',
      interval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      startDelay: 30 * 60 * 1000, // Start after 30 minutes
      condition: () => {
        return new Promise((resolve) => {
          chrome.storage.local.get(['selectedModel', 'apikey', 'customPrompt'], (result) => {
            const missing = [];
            if (!result.selectedModel) missing.push('model');
            if (!result.apikey) missing.push('API key');
            if (!result.customPrompt) missing.push('instruction prompt');
            resolve(missing.length > 0);
          });
        });
      },
      callback: () => showSetupNotification()
    });

    // Schedule feature tips every 3 days
    this.scheduleNotification('feature-tips', {
      type: 'interval',
      interval: 3 * 24 * 60 * 60 * 1000, // 3 days
      startDelay: 60 * 60 * 1000, // Start after 1 hour
      callback: () => showFeatureTips()
    });

    // Schedule periodic usage reminders - every 7 days
    this.scheduleNotification('usage-reminder', {
      type: 'interval',
      interval: 7 * 24 * 60 * 60 * 1000, // 7 days
      startDelay: 2 * 24 * 60 * 60 * 1000, // Start after 2 days
      callback: () => showShortcutNotifications()
    });


  }

  // Schedule a notification
  scheduleNotification(id, config) {
    const scheduleInfo = {
      id,
      config,
      timeoutId: null,
      intervalId: null
    };

    this.startSchedule(scheduleInfo);
    this.schedules.set(id, scheduleInfo);
  }

  // Start a notification schedule
  async startSchedule(scheduleInfo) {
    const { id, config } = scheduleInfo;
    const { type, interval, startDelay, condition, callback } = config;

    // Function to execute the notification
    const executeNotification = async () => {
      try {
        if (condition) {
          const shouldTrigger = await condition();
          if (shouldTrigger) {
            callback();
          }
        } else {
          callback();
        }
      } catch (error) {
        console.error(`Error triggering scheduled notification "${id}":`, error);
      }
    };

    if (type === 'interval') {
      // Start with initial delay
      if (startDelay && startDelay > 0) {
        scheduleInfo.timeoutId = setTimeout(() => {
          executeNotification();
          // Then set up the recurring interval
          scheduleInfo.intervalId = setInterval(executeNotification, interval);
        }, startDelay);
      } else {
        // Start immediately with interval
        scheduleInfo.intervalId = setInterval(executeNotification, interval);
      }
    } else if (type === 'timeout') {
      scheduleInfo.timeoutId = setTimeout(executeNotification, config.delay || 0);
    }
  }

  // Stop a notification schedule
  stopSchedule(id) {
    const scheduleInfo = this.schedules.get(id);
    if (scheduleInfo) {
      if (scheduleInfo.timeoutId) {
        clearTimeout(scheduleInfo.timeoutId);
        scheduleInfo.timeoutId = null;
      }
      if (scheduleInfo.intervalId) {
        clearInterval(scheduleInfo.intervalId);
        scheduleInfo.intervalId = null;
      }
    }
  }

  // Stop all notification schedules
  stopAllSchedules() {
    for (const [id] of this.schedules) {
      this.stopSchedule(id);
    }
  }

  // Reset all schedules (useful for when extension restarts)
  resetAllSchedules() {
    this.stopAllSchedules();
    this.schedules.clear();
    this.initSchedules();
  }

  // Get status of all schedules
  getScheduleStatus() {
    const status = {};
    for (const [id, scheduleInfo] of this.schedules) {
      status[id] = {
        active: scheduleInfo.timeoutId !== null || scheduleInfo.intervalId !== null,
        type: scheduleInfo.config.type,
        interval: scheduleInfo.config.interval || null,
        startDelay: scheduleInfo.config.startDelay || null
      };
    }
    return status;
  }

  // Add custom notification schedule
  addCustomNotification(id, config) {
    this.scheduleNotification(id, config);
  }

  // Remove custom notification schedule
  removeCustomNotification(id) {
    this.stopSchedule(id);
    this.schedules.delete(id);
  }
}

// Global instance
let notificationNotifier;

// Initialize the notifier
function initNotificationNotifier() {
  if (!notificationNotifier) {
    notificationNotifier = new NotificationNotifier();
  }
}

// Start notification scheduling
function startNotificationScheduling() {
  initNotificationNotifier();
}

// Stop notification scheduling
function stopNotificationScheduling() {
  if (notificationNotifier) {
    notificationNotifier.stopAllSchedules();
  }
}

// Reset notification scheduler
function resetNotificationScheduler() {
  if (notificationNotifier) {
    notificationNotifier.resetAllSchedules();
  }
}

// Get scheduling status (for debugging)
function getNotificationScheduleStatus() {
  if (notificationNotifier) {
    return notificationNotifier.getScheduleStatus();
  }
  return {};
}

// Add custom schedule
function addCustomNotificationSchedule(id, config) {
  initNotificationNotifier();
  notificationNotifier.addCustomNotification(id, config);
}

// Remove custom schedule
function removeCustomNotificationSchedule(id) {
  if (notificationNotifier) {
    notificationNotifier.removeCustomNotification(id);
  }
}

// Export functions (for compatibility with other scripts)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NotificationNotifier,
    initNotificationNotifier,
    startNotificationScheduling,
    stopNotificationScheduling,
    resetNotificationScheduler,
    getNotificationScheduleStatus,
    addCustomNotificationSchedule,
    removeCustomNotificationSchedule
  };
}
