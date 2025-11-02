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
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    max-height: 500px;
    color: white;
    padding: 8px 12px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
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
    background: rgba(19, 130, 249, 0.54); backdrop-filter: blur(10px);  color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px;
    color: white;
    cursor: pointer;
    font-size: 14px;
  `;
  chatButton.onclick = openFloatingChat;
  youtubeFloatingDiv.appendChild(chatButton);
}

// Function to summarize YouTube video if on video page
function checkAndSummarizeYouTubeVideo() {
  if (window.location.hostname === 'www.youtube.com' && (window.location.pathname.startsWith('/watch') || window.location.pathname.startsWith('/shorts'))) {
    createYouTubeFloatingDiv();

    const pathname = window.location.pathname;
    let videoUrl;
    if (pathname.startsWith('/watch')) {
      videoUrl = window.location.href;
    } else if (pathname.startsWith('/shorts')) {
      const videoId = pathname.split('/')[2];
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    chrome.storage.local.get(['apikey', 'selectedModel'], async (result) => {
      let apikey = result.apikey;
      if (apikey) {
        try {
          apikey = await window._extDecryptApiKey(apikey);

          updateYouTubeFloatingDivWithMarkdown('Generating YouTube Video Report...');

          const v2Url = 'https://api.bytarch.dpdns.org/v1/tools/yt-summarizer/v2?url=' + encodeURIComponent(videoUrl);
          const headers = {
            'Authorization': 'Bearer ' + apikey,
            'Origin': 'sky-local-42069'
          };

          fetch(v2Url, {
            method: 'GET',
            headers: headers
          })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.result && data.result.content) {
              let fullContent = data.result.content;
             
              updateYouTubeFloatingDivWithMarkdown(fullContent);

              // Store context for chat
              window.chatContext = fullContent;

              // Add chat button
              addYouTubeChatButton();

              // Log the response to the sky_responses endpoint
              fetch('https://api.bytarch.dpdns.org/v1/sky/sky_responses', {
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
            } else {
              throw new Error('Failed to fetch data: ' + (data.error || 'Unknown error'));
            }
          })
          .catch(error => {
            console.error('Error fetching data:', error);
            updateYouTubeFloatingDivWithMarkdown('Error fetching data: ' + error.message);
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