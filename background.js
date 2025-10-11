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
    title: "Summarize YouTube Video",
    contexts: ["page"]
  });

  // Context menu to show response history
  chrome.contextMenus.create({
    id: "showResponseHistory",
    title: "Show Response History",
    contexts: ["all"]
  });
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
    chrome.tabs.sendMessage(tab.id, {
      action: 'showResponseHistory'
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
      chrome.tabs.sendMessage(tabId, { action: 'showResponseHistory' });
    }
  });
});

