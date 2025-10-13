
importScripts('notification.js');
importScripts('notification-notifier.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: "askGenie",
    title: "Ask Sky",
    contexts: ["selection"]
  });

  // Context menu item to hide/show floating div
  chrome.contextMenus.create({
    id: "hideShowFloatingDiv",
    title: "Hide/Show",
    contexts: ["all"]
  });

  // Context menu items for screen recording
  chrome.contextMenus.create({
    id: "startScreenRecord",
    title: "Start Screen Recording",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "stopScreenRecord",
    title: "Stop Screen Recording",
    contexts: ["all"]
  });

  // Context menu to summarize YouTube video
  chrome.contextMenus.create({
    id: "summarizeYouTube",
    title: "YouTube Video Report",
    contexts: ["page"]
  });

  // Context menu to show response history
  chrome.contextMenus.create({
    id: "showResponseHistory",
    title: "Show Response History",
    contexts: ["all"]
  });

  // Context menu to take screenshot
  chrome.contextMenus.create({
    id: "takeScreenshot",
    title: "Ask Sky w/ Screenshot",
    contexts: ["all"]
  });

  // Start notification scheduling on installation
  startNotificationScheduling();

  // Show welcome notification on installation
  showWelcomeNotification();
});



// Start notification scheduling when background script loads
startNotificationScheduling();


// Check for updates on startup
checkUpdateAndNotify();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab({format: 'png'}, (dataUrl) => {
      if (dataUrl) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'capturedImage',
          dataUrl: dataUrl,
          left: message.left,
          top: message.top,
          width: message.width,
          height: message.height
        });
      }
    });
  } else if (message.action === 'showWelcomeNotification') {
    showWelcomeNotification();
  } else if (message.action === 'showSetupNotification') {
    showSetupNotification();
  } else if (message.action === 'showShortcutNotifications') {
    showShortcutNotifications();
  } else if (message.action === 'showFeatureTips') {
    showFeatureTips();
  } else if (message.action === 'showUpdateNotification') {
    showUpdateNotification(message.version, message.features, message.notes);
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["popup.js"]
  });
});

// Handle clicks on the context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askGenie" && info.selectionText) {
    // Single message to handle ask-genie click and state logic in content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'askGenieClick',
      selection: info.selectionText
    });
  
  } else if (info.menuItemId === "hideShowFloatingDiv") {
    chrome.tabs.sendMessage(tab.id, {
      action: 'hideShowFloatingDiv'
    });
  } else if (info.menuItemId === "startScreenRecord") {
    // Send message to content script to start screen recording
    chrome.tabs.sendMessage(tab.id, {
      action: 'startScreenRecord'
    });
  } else if (info.menuItemId === "stopScreenRecord") {
    // Send message to content script to stop screen recording
    chrome.tabs.sendMessage(tab.id, {
      action: 'stopScreenRecord'
    });
  } else if (info.menuItemId === "summarizeYouTube") {
    chrome.tabs.sendMessage(tab.id, {
      action: 'summarizeYouTubeVideo'
    });
  } else if (info.menuItemId === "showResponseHistory") {
    chrome.tabs.create({ url: 'https://bytarch.netlify.app/dashboard/history?tab=sky' });
  } else if (info.menuItemId === "takeScreenshot") {
    chrome.tabs.sendMessage(tab.id, {
      action: 'takeScreenshot'
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    if (command === 'startScreenRecord') {
      chrome.tabs.sendMessage(tabId, { action: 'startScreenRecord' });
    } else if (command === 'stopScreenRecord') {
      chrome.tabs.sendMessage(tabId, { action: 'stopScreenRecord' });
    } else if (command === 'hideShowFloatingDiv') {
      chrome.tabs.sendMessage(tabId, { action: 'hideShowFloatingDiv' });
    } else if (command === 'askGenie') {
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.getSelection().toString()
      }, (results) => {
        const selectedText = results && results[0] ? results[0].result : '';
        if (selectedText) {
          chrome.tabs.sendMessage(tabId, { action: 'askGenieClick', selection: selectedText });
        } else {
          console.warn('No text selected for Ask Genie.');
        }
      });
    } else if (command === 'summarizeYouTube') {
      chrome.tabs.sendMessage(tabId, { action: 'summarizeYouTubeVideo' });
    } else if (command === 'showResponseHistory') {
      chrome.tabs.create({ url: 'https://bytarch.netlify.app/dashboard/history?tab=sky' });
    }
  });
});

