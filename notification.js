
// Function to show notification for setup reminders
function showSetupNotification() {
  chrome.notifications.create('setup-reminder', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('logo.png'),
    title: 'Sky Extension Setup Required',
    message: 'Please set your API key, select a model, and customize your instruction prompt in the extension settings.',
    buttons: [{ title: 'Open Settings' }]
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError);
    }
  });
}

// Function to show notification for feature availability
function showFeatureNotification(featureName, description) {
  chrome.notifications.create('feature-' + featureName, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('logo.png'),
    title: 'Feature Available: ' + featureName,
    message: description,
    buttons: [{ title: 'Try It' }]
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError);
    }
  });
}

// Function to show notification for usage reminders
function showUsageNotification(action, message) {
  chrome.notifications.create('usage-' + action, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('logo.png'),
    title: 'Usage Reminder',
    message: 'You can ' + action + '. ' + message,
    buttons: [{ title: 'Got it' }]
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError);
    }
  });
}

// Function to show update or feature announcement
function showUpdateNotification(version, features, notes) {
  chrome.notifications.create('update-' + version, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('logo.png'),
    title: 'Update Available: v' + version,
    message: 'New update available with new features',
    buttons: [{ title: 'View Details' }],
    requireInteraction: true
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError);
    } else {
      // Store update info for when user clicks
      chrome.storage.local.set({ pendingUpdate: { version, features, notes } });
    }
  });
}

// Function to notify about extension installation
function showWelcomeNotification() {
  chrome.notifications.create('welcome', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('logo.png'),
    title: 'Welcome to Sky Extension!',
    message: 'Get started by setting up your API key and exploring features.',
    buttons: [{ title: 'Get Started' }]
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError);
    }
  });
}


// Function to check and notify for setup
function checkAndNotifySetup() {
  chrome.storage.local.get(['selectedModel', 'apikey', 'customPrompt'], (result) => {
    const missing = [];
    if (!result.selectedModel) missing.push('model');
    if (!result.apikey) missing.push('API key');
    if (!result.customPrompt) missing.push('instruction prompt');

    if (missing.length > 0) {
      showSetupNotification();
    }
  });
}

// Function to notify about keyboard shortcuts
function showShortcutNotifications() {
  const shortcuts = [
    { name: 'Ask Sky', key: 'Alt+A', description: 'Quickly ask questions about selected text' },
    { name: 'Take Screenshot', key: 'Alt+S', description: 'Capture screen areas for analysis' },
    { name: 'Start Recording', key: 'Alt+R', description: 'Record your screen for analysis' },
    { name: 'Show History', key: 'Alt+H', description: 'View previous responses' },
    { name: 'Hide/Show', key: 'N/A', description: 'Toggle the floating interface' }
  ];

  // Show notifications one by one with delay
  shortcuts.forEach((shortcut, index) => {
    setTimeout(() => {
      showUsageNotification(shortcut.name + ' (' + shortcut.key + ')', shortcut.description);
    }, index * 3000); // 3 second intervals
  });
}

// Function to show feature tips periodically
function showFeatureTips() {
  const tips = [
    'Try right-clicking on selected text to ask questions about it.',
    'Use the screenshot feature to analyze images or specific page areas.',
    'YouTube videos can be summarized automatically.',
    'Access your response history anytime to review previous answers.',
    'Customize your instruction prompts for different types of queries.'
  ];

  // Random tip
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  showUsageNotification('Tip', randomTip);
}


// Handle notification button clicks
if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.onButtonClicked) {
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId.startsWith('update-') && buttonIndex === 0) {
      // Open update page
      chrome.tabs.create({ url: chrome.runtime.getURL('update-page.html') });
    }
  });
}

// Handle notification clicks (if clicked directly, not just button)
if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.onClicked) {
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith('update-')) {
      chrome.tabs.create({ url: chrome.runtime.getURL('update-page.html') });
      chrome.notifications.clear(notificationId);
    }
  });
}
// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showSetupNotification,
    showFeatureNotification,
    showUsageNotification,
    showUpdateNotification,
    showWelcomeNotification,
    checkAndNotifySetup,
    showShortcutNotifications,
    showFeatureTips
  };
}
