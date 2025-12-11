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

  // Global variables for screen recording
  let mediaRecorder;
  let screenStream;

  // Function to start screen recording
  async function startScreenRecording() {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true,audio:true });
      mediaRecorder = new MediaRecorder(screenStream);

      // Handle data available event
      mediaRecorder.ondataavailable = function(event) {
        if (event.data && event.data.size > 0) {
          const videoBlob = event.data;
          console.log('Recorded video blob:', videoBlob);

          // Create FormData for upload
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2025-10-21T18-31-52
          const filename = `screen-recording-${timestamp}.webm`;
          const formData = new FormData();
          formData.append('file', videoBlob, filename);

          // Upload or save locally
          chrome.storage.local.get(['apikey'], async (result) => {
            let apikey = result.apikey;
            if (apikey) {
              try {
                apikey = await window._extDecryptApiKey(apikey);
                // Upload to the API
                fetch('https://api.bytarch.dpdns.org/v1/upload', {
                  method: 'POST',
                  headers: {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'authorization': 'Bearer ' + apikey,
                    'origin': 'https://genieaibz.netlify.app',
                    'priority': 'u=1, i',
                    'referer': 'https://genieaibz.netlify.app/',
                    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
                  },
                  body: formData
                })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    console.log('Upload successful:', data.url);
                    window.updateFloatingDivWithMarkdown('Recording saved to: ' + data.url);
                  } else {
                    console.error('Upload failed:', data);
                    window.updateFloatingDivWithMarkdown('Failed to save recording.');
                  }
                })
                .catch(error => {
                  console.error('Upload error:', error);
                  window.updateFloatingDivWithMarkdown('Error saving recording.');
                });
              } catch (decryptError) {
                window.updateFloatingDivWithMarkdown('Error decrypting API key.');
                console.error('API key decryption error:', decryptError);
              }
            } else {
              // Save locally
              const url = URL.createObjectURL(videoBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              window.updateFloatingDivWithMarkdown('Recording saved locally as ' + filename);
            }
          });
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

      chrome.storage.local.get(['selectedModel', 'apikey', 'customPrompt', 'autoPublish'], async (result) => {
        // Check if selected model is free by fetching model list
        let isFreeModel = false;
        try {
          const modelResponse = await fetch('https://corsproxy.io/?url=https%3A//flow-models.bytarch.dpdns.org/genie-extension.json%3Ft%3D' + Date.now());
          const modelData = await modelResponse.json();
          const selectedModelData = modelData.data.find(model => model.id === result.selectedModel);
          if (selectedModelData) {
            isFreeModel = selectedModelData.type.toLowerCase().includes('free');
          }
        } catch (error) {
          console.error('Error checking model type:', error);
        }
        if (!result.selectedModel || /*!result.apikey ||*/ !result.customPrompt) {
          window.updateFloatingDivWithMarkdown('Please set your API key, select a model, and set your instruction prompt in model-selection.html.');
          return;
        }
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
            
            { role: 'user', content: `${systemPrompt}\n\n${combinedUserContent}` },
           
          ];
          
          // Send request to the API endpoint
          const headers = {
            'Content-Type': 'application/json',
            'Origin': 'sky-local-42069'
          };
          if (apikey) {
            headers['Authorization'] = 'Bearer ' + apikey;
          }
          fetch('https://api.bytarch.dpdns.org/v1/chat/completions', {
            method: 'POST',
            headers: headers,
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
                   if(!apikey){
                    apikey = "64bc09ef-064c-4c2c-a29e-eafe1134978e"
                }
            
                fetch('https://api.bytarch.dpdns.org/v1/sky/sky_responses', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (apikey)
                  },
                  body: JSON.stringify({
                    model: model,
                    prompt: combinedUserContent,
                    response: accumulatedText
                  })
                }).then(response => response.json())
                .then(data => {
                  if (!response.ok) {
                    console.error('Failed to log response');
                  } else {
                    // If using free model and auto-publish is enabled, update to public
                    if (result.autoPublish === true) {
                      fetch(`https://api.bytarch.dpdns.org/v1/sky/sky_responses/${data.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer '+ (apikey),
                          'accept': '*/*',
                          },
                        body: JSON.stringify({
                          "is_public": true,
                          "category": null
                        })
                      }).catch(err => console.error('Error updating to public:', err));
                    }
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
    chrome.storage.local.get(['selectedModel', 'apikey', 'customPrompt', 'autoPublish'], async (result) => {
      // Check if selected model is free by fetching model list
      let isFreeModel = false;
      try {
        const modelResponse = await fetch('https://corsproxy.io/?url=https%3A//flow-models.bytarch.dpdns.org/genie-extension.json%3Ft%3D' + Date.now());
        const modelData = await modelResponse.json();
        const selectedModelData = modelData.data.find(model => model.id === result.selectedModel);
        if (selectedModelData) {
          isFreeModel = selectedModelData.type.toLowerCase().includes('free');
        }
      } catch (error) {
        console.error('Error checking model type:', error);
      }
      if (!result.selectedModel ||/* !result.apikey ||*/ !result.customPrompt) {
        window.updateFloatingDivWithMarkdown('Please set your API key, select a model, and set your instruction prompt in model-selection.html.');
        return;
      }
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
 const combinedUserContent = `<user_question_with_instructions_to_follow>${userQuestion}</user_question_with_instructions_to_follow>\n\n<content_you_should_answer>based on the provided image.</content_you_should_answer>`;
         
        // Content with text and image
        const content = [
          { "type": "text", "text": `${systemPrompt}\n\n${combinedUserContent}` },
          { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }
        ];

        let messages = [
        //  { role: 'user', content: systemPrompt },
          { role: 'user', content }
        ];

        // Send request to the API endpoint
        const headers = {
          'Content-Type': 'application/json',
          'Origin': 'sky-local-42069'
        };
        if (apikey) {
          headers['Authorization'] = 'Bearer ' + apikey;
        }
        fetch('https://api.bytarch.dpdns.org/v1/chat/completions', {
          method: 'POST',
          headers: headers,
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
             if(!apikey){
                    apikey = "64bc09ef-064c-4c2c-a29e-eafe1134978e"
                }
              // Stream complete, log the response
              fetch('https://api.bytarch.dpdns.org/v1/sky/sky_responses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + (apikey)
                },
                body: JSON.stringify({
                  model: model,
                  prompt: userQuestion,
                  response: accumulatedText
                })
              }).then(response => response.json())
              .then(data => {
                if (!response.ok) {
                  console.error('Failed to log response');
                } else {
                  // If using free model and auto-publish is enabled, update to public
                  if (result.autoPublish === true) {
                    fetch(`https://api.bytarch.dpdns.org/v1/sky/sky_responses/${data.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (apikey),
                        'accept': '*/*',},
                      body: JSON.stringify({
                        "is_public": true,
                        "category": null
                      })
                    }).catch(err => console.error('Error updating to public:', err));
                  }
                }
              }).catch(err => console.error('Error logging response:', err));
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;
            window.updateFloatingDivWithMarkdown(chunk, true);

            reader.read().then(processChunk).catch(error => {
              window.updateFloatingDivWithMarkdown(error);
              console.error('Stream reading error:', error);
            });
          }

          reader.read().then(processChunk).catch(error => {
            window.updateFloatingDivWithMarkdown(error);
            console.error('Stream start error:', error);
          });
        })
        .catch(error => {
          window.updateFloatingDivWithMarkdown(error);
          console.error('API fetch error:', error);
        });
      } catch (decryptError) {
        window.updateFloatingDivWithMarkdown('Error decrypting API key.');
        console.error('API key decryption error:', decryptError);
      }
    });
  }


}
