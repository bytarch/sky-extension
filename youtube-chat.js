// Floating chat div
let floatingChatDiv = null;
let chatMessages = [];

// Function to create floating chat div
function createFloatingChatDiv() {
  if (floatingChatDiv) return;

  floatingChatDiv = document.createElement('div');
  floatingChatDiv.id = 'floating-chat-div';
  floatingChatDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 300px;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 12px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    cursor: grab;
    user-select: none;
    font-family: sans-serif;
    z-index: 10002;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.1);
  `;

  const chatHistory = document.createElement('div');
  chatHistory.id = 'chat-history';
  chatHistory.style.cssText = `
    flex: 1;
    overflow-y: auto;
    margin-bottom: 10px;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
  `;
  floatingChatDiv.appendChild(chatHistory);

  const inputGroup = document.createElement('div');
  inputGroup.style.cssText = `
    display: flex;
    gap: 8px;
  `;

  const input = document.createElement('input');
  input.id = 'chat-input';
  input.type = 'text';
  input.placeholder = 'Ask me anything...';
  input.style.cssText = `
    flex: 1;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.4);
    color: white;
    outline: none;
    backdrop-filter: blur(5px);
  `;
  inputGroup.appendChild(input);

  const sendButton = document.createElement('button');
  sendButton.textContent = 'Send';
  sendButton.style.cssText = `
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background-color: rgba(0, 123, 255, 0.8);
    backdrop-filter: blur(10px);
    color: white;
    cursor: pointer;
  `;
  sendButton.onclick = () => sendChatMessage();
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
  inputGroup.appendChild(sendButton);

  floatingChatDiv.appendChild(inputGroup);

  // Add style
  const style = document.createElement('style');
  style.textContent = `
    #floating-chat-div::-webkit-scrollbar { width: 8px; }
    #floating-chat-div::-webkit-scrollbar-track { background: rgba(74, 144, 226, 0.3); border-radius: 4px; }
    #floating-chat-div::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.5); border-radius: 4px; }
    #floating-chat-div::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.7); }
    .chat-bubble {
      padding: 8px 12px;
      border-radius: 18px;
      margin: 5px 0;
      width: fit-content;
      max-width: 70%;
      word-wrap: break-word;
    }
    .chat-bubble.user {
      background-color: rgba(0, 123, 255, 0.66);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      align-self: flex-end;
      margin-left: auto;
    }
    .chat-bubble.assistant {
      background-color: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      align-self: flex-start;
      margin-right: auto;
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(floatingChatDiv);

  // Add drag functionality
  let isDragging = false;
  let offsetX, offsetY;

  floatingChatDiv.addEventListener('mousedown', (e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') return;
    isDragging = true;
    offsetX = e.clientX - floatingChatDiv.getBoundingClientRect().left;
    offsetY = e.clientY - floatingChatDiv.getBoundingClientRect().top;
    e.preventDefault();
    floatingChatDiv.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const divWidth = floatingChatDiv.offsetWidth;
    const divHeight = floatingChatDiv.offsetHeight;

    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    newLeft = Math.max(0, Math.min(newLeft, viewportWidth - divWidth));
    newTop = Math.max(0, Math.min(newTop, viewportHeight - divHeight));

    floatingChatDiv.style.left = newLeft + 'px';
    floatingChatDiv.style.top = newTop + 'px';
    floatingChatDiv.style.transform = '';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    floatingChatDiv.style.cursor = 'grab';
  });

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    backdrop-filter: blur(10px);
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeButton.onclick = () => {
    if (floatingChatDiv) {
      floatingChatDiv.remove();
      floatingChatDiv = null;
      chatMessages = [];
    }
  };
  floatingChatDiv.appendChild(closeButton);
}

// Function to send chat message
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;

  const userMessage = input.value.trim();
  input.value = '';

  // Add user message
  chatMessages.push({ role: 'user', content: userMessage });
  updateChatHistory();

  chrome.storage.local.get(['apikey', 'selectedModel'], async (result) => {
    const apikey = result.apikey;
    const model = result.selectedModel || 'gemini-1.5-flash';
    if (!apikey) {
      addToChatHistory('Error: API key not found.');
      return;
    }

    try {
      const decryptedApiKey = await window._extDecryptApiKey(apikey);

      const context = window.chatContext || '';
      const systemMessage = context ? `You are chatting about the following content: ${context}` : '';

      const messages = [
        { role: 'user', content: systemMessage },
        ...chatMessages
      ];

      const response = await fetch('https://api.bytarch.dpdns.org/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + decryptedApiKey,
          'Origin': 'sky-local-42069'
        },
        body: JSON.stringify({
          model: model,
          stream: true,
          messages: messages
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let currentAssistantMessage = document.createElement('div');
      currentAssistantMessage.className = 'chat-bubble assistant';
      const chatHistory = document.getElementById('chat-history');
      if (chatHistory) {
        chatHistory.appendChild(currentAssistantMessage);
      }

      // Add system message to history if context exists
      if (systemMessage) {
        chatMessages.unshift({ role: 'system', content: systemMessage });
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        currentAssistantMessage.innerHTML = window.renderMarkdown ? window.renderMarkdown(accumulatedText) : accumulatedText;
      }

      chatMessages.push({ role: 'assistant', content: accumulatedText });

      // Log the response to the sky_responses endpoint
      fetch('https://api.bytarch.dpdns.org/v1/sky/sky_responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + decryptedApiKey
        },
        body: JSON.stringify({
          model: model,
          prompt: userMessage,
          response: accumulatedText
        })
      }).then(res => {
        if (!res.ok) {
          console.error('Failed to log chat response');
        }
      }).catch(err => console.error('Error logging chat response:', err));
    } catch (error) {
      addToChatHistory('Error: ' + error.message);
    }
  });
}

// Function to update chat history
function updateChatHistory() {
  const chatHistory = document.getElementById('chat-history');
  if (!chatHistory) return;

  chatHistory.innerHTML = '';
  chatMessages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = msg.role === 'user' ? 'chat-bubble user' : 'chat-bubble assistant';
    msgDiv.innerHTML = window.renderMarkdown ? window.renderMarkdown(msg.content) : msg.content;
    chatHistory.appendChild(msgDiv);
  });
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Function to add to chat history
function addToChatHistory(content) {
  const chatHistory = document.getElementById('chat-history');
  if (chatHistory) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-bubble assistant';
    msgDiv.style.color = '#ff6b6b';
    msgDiv.innerHTML = content;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

// Function to open floating chat
function openFloatingChat() {
  createFloatingChatDiv();
}