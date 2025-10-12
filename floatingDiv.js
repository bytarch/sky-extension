/* Replaced entire floatingDiv.js content with the provided floating div implementation */
const floatingDiv = document.createElement('div');
floatingDiv.id = 'floating-div';
floatingDiv.style.cssText = `
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: auto;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  /* Allow container to expand slightly with content */
  max-height: 300px;
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  cursor: grab;
  user-select: none;
  font-family: sans-serif;
  z-index: 10000;
  transition: box-shadow 0.2s ease;
  overflow-y: auto;
  overflow-x: hidden;
  word-wrap: break-word;
  display: none;
  flex-direction: column;
  
  /* Custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.1);
`;

// Add WebKit-specific scrollbar styling
const style = document.createElement('style');
style.textContent = `
  #floating-div::-webkit-scrollbar {
    width: 8px;
  }
  
  #floating-div::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  #floating-div::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  #floating-div::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  #response-div {
    flex: 1 1 auto;
    overflow-y: auto;
    padding-right: 8px;
    margin-bottom: 8px;
    word-wrap: break-word;
  }

  #follow-up-div {
    /* Removed follow-up div styling as follow-up functionality is removed */
    display: none;
  }
`;
document.head.appendChild(style);

let isDragging = false;
let offsetX, offsetY;

floatingDiv.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - floatingDiv.getBoundingClientRect().left;
  offsetY = e.clientY - floatingDiv.getBoundingClientRect().top;
  e.preventDefault();
  floatingDiv.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const divWidth = floatingDiv.offsetWidth;
  const divHeight = floatingDiv.offsetHeight;

  let newLeft = e.clientX - offsetX;
  let newTop = e.clientY - offsetY;

  newLeft = Math.max(0, Math.min(newLeft, viewportWidth - divWidth));
  newTop = Math.max(0, Math.min(newTop, viewportHeight - divHeight));

  floatingDiv.style.left = newLeft + 'px';
  floatingDiv.style.top = newTop + 'px';
  floatingDiv.style.transform = '';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  floatingDiv.style.cursor = 'grab';
});


let ctrlPressed = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Control') {
    ctrlPressed = true;
  }

  if (ctrlPressed && e.key.startsWith('Arrow')) {
    e.preventDefault();

    let currentLeft, currentTop;
    if (floatingDiv.style.left) {
      currentLeft = parseInt(floatingDiv.style.left);
    } else {
      const rect = floatingDiv.getBoundingClientRect();
      currentLeft = rect.left;
    }

    if (floatingDiv.style.top) {
      currentTop = parseInt(floatingDiv.style.top);
    } else {
      currentTop = 10;
    }

    const step = 10;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const divWidth = floatingDiv.offsetWidth;
    const divHeight = floatingDiv.offsetHeight;

    floatingDiv.style.transform = '';

    switch (e.key) {
      case 'ArrowUp':
        floatingDiv.style.top = Math.max(0, currentTop - step) + 'px';
        break;
      case 'ArrowDown':
        floatingDiv.style.top = Math.min(viewportHeight - divHeight, currentTop + step) + 'px';
        break;
      case 'ArrowLeft':
        floatingDiv.style.left = Math.max(0, currentLeft - step) + 'px';
        break;
      case 'ArrowRight':
        floatingDiv.style.left = Math.min(viewportWidth - divWidth, currentLeft + step) + 'px';
        break;
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Control') {
    ctrlPressed = false;
  }
});



window.floatingDiv = floatingDiv;

// Function to toggle floating div visibility
function toggleFloatingDivVisibility() {
  if (floatingDiv.style.display === 'none') {
    floatingDiv.style.display = 'flex';
  } else {
    floatingDiv.style.display = 'none';
  }
}
window.toggleFloatingDivVisibility = toggleFloatingDivVisibility;

// Function to toggle floating div visibility
function toggleFloatingDivVisibility() {
  if (floatingDiv.style.display === 'none') {
    floatingDiv.style.display = 'flex';
  } else {
    floatingDiv.style.display = 'none';
  }
}
window.toggleFloatingDivVisibility = toggleFloatingDivVisibility;


// Simple markdown renderer
function renderMarkdown(text) {
  if (!text) return '';

  // Escape HTML characters
  text = text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

  // Code blocks (```language\ncode```)
  text = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Inline code (`code`)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Lists
  text = text.replace(/^(\s*)\* (.*$)/gm, '$1<li>$2</li>');
  text = text.replace(/^(\s*)- (.*$)/gm, '$1<li>$2</li>');
  text = text.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/g, '<ul>$1</ul>');

  text = text.replace(/^(\s*)\d+\. (.*$)/gm, '$1<li>$2</li>');
  text = text.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/g, '<ol>$1</ol>');

  // 🔹 Thinking blocks -> collapsible dropdown
  text = text.replace(/&lt;(thinking|think)&gt;([\s\S]*?)&lt;\/\1&gt;/gi, (match, tag, inner) => {
    return `
      <details style="margin:4px 0;padding:4px;background:rgba(255,255,255,0.05);border-radius:6px;">
        <summary style="cursor:pointer;color:#ccc;">Hidden reasoning</summary>
        <div style="white-space:pre-wrap;margin-top:4px;">${inner.trim()}</div>
      </details>
    `;
  });

  // Line breaks
  text = text.replace(/\n/g, '<br>');

  return text;
}


// Function to update floating div with markdown content
function updateFloatingDivWithMarkdown(content, append = false) {
  if (!append) {
    // Switch to response state: clear previous asking state
    floatingDiv.innerHTML = '';
    // Create response div
    const resp = document.createElement('div');
    resp.id = 'response-div';
    resp.style.cssText = `
      flex: 2 1 auto;
      overflow-y: auto;
      padding-right: 8px;
      word-wrap: break-word;
    `;
    resp.innerHTML = renderMarkdown(content);
   // resp.scrollTop = 0;
    floatingDiv.appendChild(resp);
    window.responseDiv = resp;

    if (content !== 'thinking...' && !document.getElementById('extend-chat-button')) {
      const extendButton = document.createElement('button');
      extendButton.id = 'extend-chat-button';
      extendButton.textContent = 'Extend Chat';
      extendButton.style.cssText = `
        margin-top: 4px;
        padding: 4px 8px;
        border: none;
        border-radius: 6px;
       background: rgba(0, 123, 255, 0.49); backdrop-filter: blur(10px); color: white; border-radius: 4px; cursor: pointer; 
        color: white;
        cursor: pointer;
        font-size: 12px;
        align-self: flex-end;
      `;
      extendButton.onclick = window.extendChat;
      floatingDiv.appendChild(extendButton);
    }
  } else {
    // Append mode: add new content to existing response div
    if (!window.responseDiv) {
      // If responseDiv doesn't exist, create it
      const resp = document.createElement('div');
      resp.id = 'response-div';
      resp.style.cssText = `
        flex: 1 1 auto;
        overflow-y: auto;
        padding-right: 8px;
        word-wrap: break-word;
      `;
      floatingDiv.appendChild(resp);
      window.responseDiv = resp;
    }
    // Append new content rendered as markdown
    window.responseDiv.innerHTML = renderMarkdown(window.responseDiv.textContent + content);
    window.responseDiv.scrollTop = window.responseDiv.scrollHeight;
  }
}

window.renderMarkdown = renderMarkdown;
window.updateFloatingDivWithMarkdown = updateFloatingDivWithMarkdown;

// Function to extend chat
function extendChat() {
  if (window.responseDiv) {
    window.chatContext = window.responseDiv.textContent;
  }
  if (typeof window.openFloatingChat === 'function') {
    window.openFloatingChat();
  }
}
window.extendChat = extendChat;

// Function to show input field in the floating div
function showInputField(selectedText) {
  // Simplified to only return null input and button since follow-up input is removed
  return { input: null, button: null, selectedText };
}

window.showInputField = showInputField;

// Function to start screenshot mode
function startScreenshotMode() {
  startSelection();
}

function startSelection() {
  let isSelecting = false;
  let startX, startY, endX, endY;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.2);
    cursor: crosshair;
    z-index: 999999;
  `;

  // Create selection div
  const selection = document.createElement('div');
  selection.style.cssText = `
    position: absolute;
    border: 2px solid #fff;
    background: rgba(255, 255, 255, 0.2);
    pointer-events: none;
    display: none;
  `;
  overlay.appendChild(selection);

  document.body.appendChild(overlay);

  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0px';
    selection.style.height = '0px';
    selection.style.display = 'block';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    endX = e.clientX;
    endY = e.clientY;

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    selection.style.left = left + 'px';
    selection.style.top = top + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height + 'px';
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!isSelecting) return;
    isSelecting = false;
    overlay.remove();

    if (Math.abs(endX - startX) < 10 || Math.abs(endY - startY) < 10) {
      // Too small selection, ignore
      return;
    }

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    // Show floating div if hidden
    if (floatingDiv && floatingDiv.style.display === 'none') {
      floatingDiv.style.display = 'flex';
    }
    // Clear if response visible
    if (window.responseDiv && window.responseDiv.innerHTML.trim() !== '') {
      floatingDiv.innerHTML = '';
    }
    updateFloatingDivWithMarkdown('Processing screenshot...');

    // Send to background to capture
    chrome.runtime.sendMessage({
      action: 'captureScreenshot',
      left: left,
      top: top,
      width: width,
      height: height
    });
  });

  // Allow escape to cancel
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', escHandler);
      overlay.remove();
    }
  };
  document.addEventListener('keydown', escHandler);
}

window.startScreenshotMode = startScreenshotMode;

// Listener removed - messages now handled by content script
