// YouTube summary floating div
let youtubeFloatingDiv = null;
let showButton = null;
let isClosed = false;

// Function to create YouTube floating div if not exists
function createYouTubeFloatingDiv() {
  if (youtubeFloatingDiv) return;

  youtubeFloatingDiv = document.createElement('div');
  youtubeFloatingDiv.id = 'youtube-floating-div';
  youtubeFloatingDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 350px;
    height: auto;
    background-color: rgba(0, 0, 0, 0.8);
    max-height: 500px;
    color: white;
    padding: 8px 12px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    cursor: grab;
    user-select: none;
    font-family: sans-serif;
    z-index: 10001;
    transition: box-shadow 0.2s ease;
    overflow-y: auto;
    overflow-x: hidden;
    word-wrap: break-word;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.1);
  `;

  // Create toggle button (always visible)
  showButton = document.createElement('button');
  showButton.textContent = 'Hide';
  showButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 50px;
    height: 30px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 12px;
    z-index: 10002;
    display: block;
  `;
  showButton.onclick = toggleVisibility;
  document.body.appendChild(showButton);

  // Add WebKit scrollbar styling
  const style = document.createElement('style');
  style.textContent = `
    #youtube-floating-div::-webkit-scrollbar { width: 8px; }
    #youtube-floating-div::-webkit-scrollbar-track { background: rgba(74, 144, 226, 0.3); border-radius: 4px; }
    #youtube-floating-div::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.5); border-radius: 4px; }
    #youtube-floating-div::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.7); }
  `;
  document.head.appendChild(style);

  document.body.appendChild(youtubeFloatingDiv);

  // Add drag functionality
  let isDragging = false;
  let offsetX, offsetY;

  youtubeFloatingDiv.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - youtubeFloatingDiv.getBoundingClientRect().left;
    offsetY = e.clientY - youtubeFloatingDiv.getBoundingClientRect().top;
    e.preventDefault();
    youtubeFloatingDiv.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const divWidth = youtubeFloatingDiv.offsetWidth;
    const divHeight = youtubeFloatingDiv.offsetHeight;

    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    newLeft = Math.max(0, Math.min(newLeft, viewportWidth - divWidth));
    newTop = Math.max(0, Math.min(newTop, viewportHeight - divHeight));

    youtubeFloatingDiv.style.left = newLeft + 'px';
    youtubeFloatingDiv.style.top = newTop + 'px';
    youtubeFloatingDiv.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    youtubeFloatingDiv.style.cursor = 'grab';
  });
}

// Function to toggle hide/show YouTube floating div
function toggleVisibility() {
  if (isClosed) {
    // Show the div
    youtubeFloatingDiv.style.display = 'flex';
    isClosed = false;
    showButton.textContent = 'Hide';
  } else {
    // Hide the div
    youtubeFloatingDiv.style.display = 'none';
    isClosed = true;
    showButton.textContent = 'Show';
  }
}

// Function to update YouTube floating div with markdown content
function updateYouTubeFloatingDivWithMarkdown(content, append = false) {
  if (!youtubeFloatingDiv) return;

  if (!append) {
    youtubeFloatingDiv.innerHTML = '';
    const resp = document.createElement('div');
    resp.id = 'youtube-response-div';
    resp.style.cssText = `
      flex: 2 1 auto;
      overflow-y: auto;
      padding-right: 8px;
      word-wrap: break-word;
    `;
    resp.innerHTML = window.renderMarkdown ? window.renderMarkdown(content) : content;
    youtubeFloatingDiv.appendChild(resp);
  } else {
    let resp = youtubeFloatingDiv.querySelector('#youtube-response-div');
    if (!resp) {
      resp = document.createElement('div');
      resp.id = 'youtube-response-div';
      resp.style.cssText = `
        flex: 1 1 auto;
        overflow-y: auto;
        padding-right: 8px;
        word-wrap: break-word;
      `;
      youtubeFloatingDiv.appendChild(resp);
    }
    const currentText = resp.textContent;
    resp.innerHTML = window.renderMarkdown ? window.renderMarkdown(currentText + content) : currentText + content;
    resp.scrollTop = resp.scrollHeight;
  }
}

// Function to add YouTube chat button
function addYouTubeChatButton() {
  if (!youtubeFloatingDiv || youtubeFloatingDiv.querySelector('#youtube-chat-button')) return;

  const chatButton = document.createElement('button');
  chatButton.id = 'youtube-chat-button';
  chatButton.textContent = 'Open Chat';
  chatButton.style.cssText = `
    margin-top: 10px;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    background-color: #28a745;
    color: white;
    cursor: pointer;
    font-size: 14px;
  `;
  chatButton.onclick = openFloatingChat;
  youtubeFloatingDiv.appendChild(chatButton);
}

// Function to summarize YouTube video if on video page
function checkAndSummarizeYouTubeVideo() {
  if (window.location.hostname === 'www.youtube.com' && window.location.pathname.startsWith('/watch')) {
    createYouTubeFloatingDiv();

    const videoUrl = window.location.href;

    chrome.storage.local.get(['apikey', 'selectedModel'], async (result) => {
      let apikey = result.apikey;
      if (apikey) {
        try {
          apikey = await window._extDecryptApiKey(apikey);

          updateYouTubeFloatingDivWithMarkdown('Generating YouTube Video Report...');

          const summaryUrl = 'https://api.bytarch.dpdns.org/v1/tools/yt-summarizer/v1?url=' + encodeURIComponent(videoUrl);
          const transcriptUrl = 'https://api.bytarch.dpdns.org/v1/tools/yt-summarizer/v2?url=' + encodeURIComponent(videoUrl);
          const headers = {
            'Authorization': 'Bearer ' + apikey,
            'Origin': 'sky-local-42069'
          };

          // Fetch both summary and transcript in parallel
          const summaryPromise = fetch(summaryUrl, {
            method: 'GET',
            headers: headers
          })
          .then(response => response.json())
          .then(data => {
            if (data.status && data.result && data.result.summary) {
              return data.result.summary;
            } else {
              throw new Error('Failed to fetch summary: ' + (data.error || 'Unknown error'));
            }
          });

          const transcriptPromise = fetch(transcriptUrl, {
            method: 'GET',
            headers: headers
          })
          .then(response => response.json())
          .then(v2Data => {
            if (v2Data.status && v2Data.result && v2Data.result.content) {
              return v2Data.result.content;
            } else {
              console.warn('Failed to fetch transcript, continuing without it');
              return ''; // No transcript available
            }
          })
          .catch(error => {
            console.error('Error fetching transcript:', error);
            return ''; // Proceed without transcript
          });

          // Wait for both promises
          Promise.all([summaryPromise, transcriptPromise])
          .then(([summary, transcript]) => {
            const fullContent = `${summary}\n\n\n` + transcript;
            updateYouTubeFloatingDivWithMarkdown(fullContent);

            // Store context for chat
            window.chatContext = fullContent;

            // Add chat button
            addYouTubeChatButton();

            // Log the response to the sky_responses endpoint
            fetch('https://api.bytarch.dpdns.org/sky/sky_responses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apikey
              },
              body: JSON.stringify({
                model: result.selectedModel,
                prompt: videoUrl,
                response: fullContent
              })
            }).then(res => {
              if (!res.ok) {
                console.error('Failed to log YouTube summary response');
              }
            }).catch(err => console.error('Error logging YouTube summary response:', err));
          })
          .catch(error => {
            console.error('Error fetching summary:', error);
            updateYouTubeFloatingDivWithMarkdown('Error fetching summary: ' + error.message);
          });
        } catch (decryptError) {
          updateYouTubeFloatingDivWithMarkdown('Error decrypting API key for summary.');
          console.error('API key decryption error:', decryptError);
        }
      } else {
        updateYouTubeFloatingDivWithMarkdown('API key not found for YouTube summary.');
      }
    });
  }
}