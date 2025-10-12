// Load the floatingDiv functionality
function loadFloatingDiv() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('floatingDiv.js');
  script.onload = function() {
    // Append the floating div to the document body
    document.body.appendChild(window.floatingDiv);
    // Set initial text content
 //    window.updateSelectedModelText();
  };
  window.html2canvasUrl = chrome.runtime.getURL('html2canvas.min.js');
  document.head.appendChild(script);
}

 // Load the floating div when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFloatingDiv);
} else {
  loadFloatingDiv();
}

// Listen for messages from the extension's background script
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  // Listener to show input field in floating div
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // Automatically process selection when context menu clicked
    if (request.action === 'askGenieClick' && request.selection) {
      // Show floating div if hidden
      if (window.floatingDiv && window.floatingDiv.style.display === 'none') {
        window.floatingDiv.style.display = 'flex';
      }
      // Clear if response visible
      if (window.responseDiv && window.responseDiv.innerHTML.trim() !== '') {
        window.floatingDiv.innerHTML = '';
      }
      window.updateFloatingDivWithMarkdown('thinking...');
      // Send selected text directly to API
      processUserQuestion( request.selection);
    }  else if (request.action === 'startScreenRecord') {
    } else if (request.action === 'hideShowFloatingDiv') {
      if (window.toggleFloatingDivVisibility) {
        window.toggleFloatingDivVisibility();
      }
    } else if (request.action === 'startScreenRecord') {
      startScreenRecording();
    } else if (request.action === 'stopScreenRecord') {
      stopScreenRecording();
    } else if (request.action === 'summarizeYouTubeVideo') {
      checkAndSummarizeYouTubeVideo();
    } else if (request.action === 'takeScreenshot') {

      startScreenshotMode();
    } else if (request.action === 'processScreenshot') {
      // Show floating div if hidden
      if (window.floatingDiv && window.floatingDiv.style.display === 'none') {
        window.floatingDiv.style.display = 'flex';
      }
      // Clear if response visible
      if (window.responseDiv && window.responseDiv.innerHTML.trim() !== '') {
        window.floatingDiv.innerHTML = '';
      }
      window.updateFloatingDivWithMarkdown('Processing screenshot...');
      processScreenshot(request.base64_image);
    } else if (request.action === 'capturedImage') {
      // Process captured image from background
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = request.width;
        canvas.height = request.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, request.left, request.top, request.width, request.height, 0, 0, request.width, request.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        processScreenshot(base64);
      };
      img.src = request.dataUrl;
    }
  });

  // Function to start screen recording
  async function startScreenRecording() {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true,audio:true });
      mediaRecorder = new MediaRecorder(screenStream);

      // Handle data available event
      mediaRecorder.ondataavailable = function(event) {
        if (event.data && event.data.size > 0) {
          // You can do something with the recorded data, e.g., send it to the background script
          // For now, let's log it or create a download link
          const videoBlob = event.data;
          console.log('Recorded video blob:', videoBlob);

          // Example: Create a download link (for testing purposes)
          const url = URL.createObjectURL(videoBlob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'screen-recording.webm';
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
        }
      };

      // Start the recording
      mediaRecorder.start();
      console.log('Screen recording started.');
      window.updateFloatingDivWithMarkdown('Recording started...');

    } catch (error) {
      console.error('Error starting screen recording:', error);
      window.updateFloatingDivWithMarkdown('Error starting recording. Please grant screen recording permission.');
    }
  }

  // Function to stop screen recording
  function stopScreenRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      // Stop all tracks in the screen stream to release resources
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      console.log('Screen recording stopped.');
      window.updateFloatingDivWithMarkdown('Recording stopped.');
    } else {
      console.log('No active screen recording to stop.');
      window.updateFloatingDivWithMarkdown('No active recording to stop.');
    }
  }


  // Function to process the user's question with selected text as context
  function processUserQuestion( contextText) {
    if (contextText.trim()) {
      // Show a loading message
      window.updateFloatingDivWithMarkdown('Thinking...');
      
      chrome.storage.local.get(['selectedModel', 'apikey', 'customPrompt'], async (result) => {
        const model = result.selectedModel;
        let apikey = result.apikey;
        let userQuestion = window.PRIMARY_PROMPT;
        let systemPrompt = window.SYSTEM_PROMPT_MAIN; // default prompt
        if (result.customPrompt && result.customPrompt.trim() !== '') {
          userQuestion = result.customPrompt;
        }
        try {
          // Decrypt the API key properly using await
          apikey = await window._extDecryptApiKey(apikey);
          
          // Check if system prompt is loaded
          if (!systemPrompt) {
            window.updateFloatingDivWithMarkdown('System prompt not loaded.');
            console.error('System prompt not loaded.');
            return;
          }
          
          // Combine the system prompt and user question into a single user message
          const combinedUserContent = `<user_question_with_instructions_to_follow>${userQuestion}</user_question_with_instructions_to_follow>\n\n<content_you_should_answer>${contextText}</content_you_should_answer>`;
          
          // Prepare the messages array with only a user role message containing the combined prompt and question
          let messages = [
            
            { role: 'user', content: systemPrompt },
            { role: 'user', content: combinedUserContent }
          ];
          
          // Send request to the API endpoint
          fetch('https://api.bytarch.dpdns.org/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + apikey,
              'Origin': 'sky-local-42069'
          
            },
            body: JSON.stringify({
              model: model,
              stream: true,
              messages: messages
            })
          })
          .then(response => {
            // Handle plain text streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let accumulatedText = '';
            
            // Clear the floating div and prepare for streaming
            window.updateFloatingDivWithMarkdown('', false);
            
            // Function to process each chunk
            function processChunk({ done, value }) {
              if (done) {
                // Stream complete
                // Log the response to the sky_responses endpoint
                fetch('https://api.bytarch.dpdns.org/v1/sky/sky_responses', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apikey
                  },
                  body: JSON.stringify({
                    model: model,
                    prompt: combinedUserContent,
                    response: accumulatedText
                  })
                }).then(res => {
                  if (!res.ok) {
                    console.error('Failed to log response');
                  }
                }).catch(err => console.error('Error logging response:', err));
                return;
              }
              
              // Decode the chunk and add to accumulated text
              const chunk = decoder.decode(value, { stream: true });
              accumulatedText += chunk;
              // Append new chunk to the floating div in real-time
              window.updateFloatingDivWithMarkdown(chunk, true);
              
              // Continue reading
              reader.read().then(processChunk).catch(error => {
                window.updateFloatingDivWithMarkdown('Error reading stream.');
                console.error('Stream reading error:', error);
              });
            }
            
            // Start reading the stream
            reader.read().then(processChunk).catch(error => {
              window.updateFloatingDivWithMarkdown('Error starting stream.');
              console.error('Stream start error:', error);
            });
          })
          .catch(error => {
            window.updateFloatingDivWithMarkdown('Error fetching response.');
            console.error('API fetch error:', error);
          });
        } catch (decryptError) {
          window.updateFloatingDivWithMarkdown('Error decrypting API key.');
          console.error('API key decryption error:', decryptError);
        }
      });
    }
  }


  // Function to process the screenshot with base64 image
  function processScreenshot(base64Image) {
    chrome.storage.local.get(['selectedModel', 'apikey', 'customPrompt'], async (result) => {
    const model = result.selectedModel;
      let apikey = result.apikey;
      let userQuestion = 'What\'s in this image?'; // Fixed text for image
      let systemPrompt = window.SYSTEM_PROMPT_MAIN; // default prompt
      if (result.customPrompt && result.customPrompt.trim() !== '') {
        userQuestion = result.customPrompt; // or keep as is
      }else{
        return window.updateFloatingDivWithMarkdown('Please set a custom prompt for image analysis.');
      }
      try {
        // Decrypt the API key
        apikey = await window._extDecryptApiKey(apikey);

        if (!systemPrompt) {
          window.updateFloatingDivWithMarkdown('System prompt not loaded.');
          console.error('System prompt not loaded.');
          return;
        }

        // Content with text and image
        const content = [
          { "type": "text", "text": userQuestion },
          { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }
        ];

        let messages = [
          { role: 'user', content: systemPrompt },
          { role: 'user', content }
        ];

        // Send request to the API endpoint
        fetch('https://api.bytarch.dpdns.org/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apikey,
            'Origin': 'sky-local-42069'
          },
          body: JSON.stringify({
            model: model,
            stream: true,
            messages: messages
          })
        })
        .then(response => {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedText = '';

          window.updateFloatingDivWithMarkdown('', false);

          function processChunk({ done, value }) {
            if (done) {
              // Stream complete, log the response
              fetch('https://api.bytarch.dpdns.org/v1/sky/sky_responses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + apikey
                },
                body: JSON.stringify({
                  model: model,
                  prompt: userQuestion,
                  response: accumulatedText
                })
              }).catch(err => console.error('Error logging response:', err));
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;
            window.updateFloatingDivWithMarkdown(chunk, true);

            reader.read().then(processChunk).catch(error => {
              window.updateFloatingDivWithMarkdown('Error reading stream.');
              console.error('Stream reading error:', error);
            });
          }

          reader.read().then(processChunk).catch(error => {
            window.updateFloatingDivWithMarkdown('Error starting stream.');
            console.error('Stream start error:', error);
          });
        })
        .catch(error => {
          window.updateFloatingDivWithMarkdown('Error fetching response.');
          console.error('API fetch error:', error);
        });
      } catch (decryptError) {
        window.updateFloatingDivWithMarkdown('Error decrypting API key.');
        console.error('API key decryption error:', decryptError);
      }
    });
  }


}
