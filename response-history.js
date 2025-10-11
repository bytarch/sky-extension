// Response history floating div
let historyFloatingDiv = null;
let historyShowButton = null;
let historyIsClosed = false;

// Detailed view floating div
let detailFloatingDiv = null;

function addDragFunctionality(element) {
  let isDragging = false, offsetX, offsetY;
  const handleMouseDown = (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    e.preventDefault();
    element.style.cursor = 'grabbing';
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const { clientWidth: vw, clientHeight: vh } = document.documentElement;
    const { offsetWidth: dw, offsetHeight: dh } = element;
    let left = Math.max(0, Math.min(e.clientX - offsetX, vw - dw));
    let top = Math.max(0, Math.min(e.clientY - offsetY, vh - dh));
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    if (element === detailFloatingDiv) element.style.transform = 'none';
    else element.style.bottom = 'auto';
  };
  const handleMouseUp = () => {
    isDragging = false;
    element.style.cursor = 'grab';
  };
  element.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// Function to create history floating div if not exists
function createHistoryFloatingDiv() {
  if (historyFloatingDiv) return;

  historyFloatingDiv = document.createElement('div');
  historyFloatingDiv.id = 'history-floating-div';
  historyFloatingDiv.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    min-width: 200px;
    max-width: 300px;
    height: auto;
    max-height: 450px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 10px 14px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    cursor: grab;
    user-select: none;
    font-family: sans-serif;
    z-index: 10001;
    overflow-y: auto;
    overflow-x: hidden;
    word-wrap: break-word;
    display: flex;
    flex-direction: column;
    margin-right: 70px;
  `;

  // Header with title and close button
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  `;
  const title = document.createElement('h3');
  title.textContent = 'Response History';
  title.style.cssText = `
    margin: 0;
    color: white;
    font-size: 16px;
  `;
  header.appendChild(title);
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 14px;
  `;
  closeButton.onclick = () => {
    historyFloatingDiv.remove();
    historyFloatingDiv = null;
  };
  header.appendChild(closeButton);
  historyFloatingDiv.appendChild(header);

  // Floating close button
  const floatingCloseButton = document.createElement('button');
  floatingCloseButton.textContent = 'Close';
  floatingCloseButton.style.cssText = `
    position: absolute;
    right: -60px;
    top: 10px;
    background-color: #dc3545;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
  `;
  floatingCloseButton.onclick = () => {
    historyFloatingDiv.remove();
    historyFloatingDiv = null;
  };
  historyFloatingDiv.appendChild(floatingCloseButton);

  document.body.appendChild(historyFloatingDiv);

  addDragFunctionality(historyFloatingDiv);
}

// Function to toggle hide/show history floating div
function toggleHistoryVisibility() {
  if (historyIsClosed) {
    // Show the div
    historyFloatingDiv.style.display = 'flex';
    historyIsClosed = false;
    historyShowButton.textContent = 'Hide';
  } else {
    // Hide the div
    historyFloatingDiv.style.display = 'none';
    historyIsClosed = true;
    historyShowButton.textContent = 'Show';
  }
}

function createDetailFloatingDiv() {
  if (detailFloatingDiv) return;

  detailFloatingDiv = document.createElement('div');
  detailFloatingDiv.id = 'detail-floating-div';
  detailFloatingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto;
    max-width: 500px;
    height: auto;
    max-height: 400px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    cursor: grab;
    user-select: none;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 10003;
    overflow-y: auto;
    overflow-x: hidden;
    word-wrap: break-word;
    display: flex;
    flex-direction: column;
  `;

  // Close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    align-self: flex-end;
    margin-bottom: 10px;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    background-color: #dc3545;
    color: white;
    cursor: pointer;
    font-size: 14px;
  `;
  closeButton.onclick = closeDetailView;
  detailFloatingDiv.appendChild(closeButton);

  const contentDiv = document.createElement('div');
  contentDiv.id = 'detail-content-div';
  contentDiv.style.cssText = `
    flex: 2 1 auto;
    overflow-y: auto;
    padding-right: 8px;
    word-wrap: break-word;
    user-select: text;
  `;
  detailFloatingDiv.appendChild(contentDiv);

  document.body.appendChild(detailFloatingDiv);

  addDragFunctionality(detailFloatingDiv);
}

function showDetailView(item) {
  createDetailFloatingDiv();
  const date = new Date(item.date).toLocaleString();
  const { question, content: promptContent } = parsePrompt(item.prompt);
  const content = `
    <h2>Response Details</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr style="border-bottom: 1px solid #555;"><td style="padding: 8px 0;"><strong>Date:</strong></td><td style="padding: 8px 0;">${date}</td></tr>
      <tr style="border-bottom: 1px solid #555;"><td style="padding: 8px 0;"><strong>Model:</strong></td><td style="padding: 8px 0;">${item.model}</td></tr>
      <tr style="border-bottom: 1px solid #555;"><td style="padding: 8px 0;"><strong>Question:</strong></td><td style="padding: 8px 0; word-break: break-word;">${question}</td></tr>
      <tr style="border-bottom: 1px solid #555;"><td style="padding: 8px 0;"><strong>Content:</strong></td><td style="padding: 8px 0; word-break: break-word;">${promptContent}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Response:</strong></td><td style="padding: 8px 0; word-break: break-word;">${item.response}</td></tr>
    </table>
    <div style="margin-top: 10px;">
      <button id="delete-response-btn" style="background-color: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
    </div>
  `;
  const contentDiv = detailFloatingDiv.querySelector('#detail-content-div');
  if (contentDiv) {
    contentDiv.innerHTML = content;
    const deleteBtn = contentDiv.querySelector('#delete-response-btn');
    deleteBtn.addEventListener('click', () => deleteResponse(item));
  }
  detailFloatingDiv.style.display = 'flex';
}

function closeDetailView() {
  if (detailFloatingDiv) {
    detailFloatingDiv.style.display = 'none';
  }
}

function deleteResponse(item) {
  chrome.storage.local.get(['apikey'], async (result) => {
    let apikey = result.apikey;
    if (apikey) {
      try {
        apikey = await window._extDecryptApiKey(apikey);
        const url = `https://api.bytarch.dpdns.org/v1/sky/sky_responses/${item.id}`;
        const headers = {
          'Authorization': 'Bearer ' + apikey
        };
        fetch(url, {
          method: 'DELETE',
          headers: headers
        })
        .then(response => {
          if (response.ok) {
            closeDetailView();
            fetchAndUpdateHistory();
          } else {
            alert('Failed to delete response');
          }
        })
        .catch(error => {
          alert('Error deleting response: ' + error.message);
        });
      } catch (decryptError) {
        alert('Error decrypting API key');
      }
    } else {
      alert('API key not found');
    }
  });
}

// Function to update history floating div with markdown content
function updateHistoryFloatingDivWithMarkdown(content, append = false) {
  if (!historyFloatingDiv) return;

  if (!append) {
    historyFloatingDiv.innerHTML = '';
    const resp = document.createElement('div');
    resp.id = 'history-response-div';
    resp.style.cssText = `
      flex: 2 1 auto;
      overflow-y: auto;
      padding-right: 8px;
      word-wrap: break-word;
    `;
    resp.innerHTML = window.renderMarkdown ? window.renderMarkdown(content) : content;
    historyFloatingDiv.appendChild(resp);
  } else {
    let resp = historyFloatingDiv.querySelector('#history-response-div');
    if (!resp) {
      resp = document.createElement('div');
      resp.id = 'history-response-div';
      resp.style.cssText = `
        flex: 1 1 auto;
        overflow-y: auto;
        padding-right: 8px;
        word-wrap: break-word;
      `;
      historyFloatingDiv.appendChild(resp);
    }
    const currentText = resp.textContent;
    resp.innerHTML = window.renderMarkdown ? window.renderMarkdown(currentText + content) : currentText + content;
    resp.scrollTop = resp.scrollHeight;
  }
}

// Function to update history floating div with selectable items
function updateHistoryFloatingDivWithItems(data) {
  if (!historyFloatingDiv) return;

  historyFloatingDiv.innerHTML = '';
  const resp = document.createElement('div');
  resp.id = 'history-response-div';
  resp.style.cssText = `
    flex: 2 1 auto;
    overflow-y: auto;
    padding-right: 8px;
    word-wrap: break-word;
  `;

  data.forEach(item => {
    const date = new Date(item.date).toLocaleString();
    const { question, content: promptContent } = parsePrompt(item.prompt);

    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = `
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.05);
      transition: background-color 0.2s;
    `;
    itemDiv.innerHTML = `
      <strong>${date}</strong><br>
      <em>Model:</em> ${item.model}<br>
      <em>Q:</em> ${question.substring(0, 40)}...<br>
      <em>R:</em> ${item.response.substring(0, 50)}...<br>
    `;
    itemDiv.addEventListener('mouseenter', () => itemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
    itemDiv.addEventListener('mouseleave', () => itemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.05)');
    itemDiv.addEventListener('click', () => showDetailView(item));
    resp.appendChild(itemDiv);
  });

  historyFloatingDiv.appendChild(resp);
}

// Function to parse the prompt structure
function parsePrompt(prompt) {
  const questionMatch = prompt.match(/<user_question_with_instructions_to_follow>(.*?)<\/user_question_with_instructions_to_follow>/s);
  const contentMatch = prompt.match(/<content_you_should_answer>(.*?)<\/content_you_should_answer>/s);

  const question = questionMatch ? questionMatch[1].trim() : 'N/A';
  const content = contentMatch ? contentMatch[1].trim() : 'N/A';

  return { question, content };
}

// Function to fetch and update response history in the floating div
function fetchAndUpdateHistory() {
  chrome.storage.local.get(['apikey'], async (result) => {
    let apikey = result.apikey;
    if (apikey) {
      try {
        apikey = await window._extDecryptApiKey(apikey);

        updateHistoryFloatingDivWithMarkdown('Fetching response history...');

        const url = 'https://api.bytarch.dpdns.org/v1/sky/sky_responses';
        const headers = {
          'Authorization': 'Bearer ' + apikey
        };

        fetch(url, {
          method: 'GET',
          headers: headers
        })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            updateHistoryFloatingDivWithItems(data);
          } else {
            updateHistoryFloatingDivWithMarkdown('Failed to fetch response history.');
          }
        })
        .catch(error => {
          console.error('Error fetching history:', error);
          updateHistoryFloatingDivWithMarkdown('Error fetching response history: ' + error.message);
        });
      } catch (decryptError) {
        updateHistoryFloatingDivWithMarkdown('Error decrypting API key.');
        console.error('API key decryption error:', decryptError);
      }
    } else {
      updateHistoryFloatingDivWithMarkdown('API key not found.');
    }
  });
}

// Function to fetch and display response history
function showResponseHistory() {
  if (historyFloatingDiv && historyFloatingDiv.style.display !== 'none') {
    historyFloatingDiv.remove();
    historyFloatingDiv = null;
    return;
  }
  createHistoryFloatingDiv();
  fetchAndUpdateHistory();
}

// Listen for command from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showResponseHistory') {
    showResponseHistory();
  }
});