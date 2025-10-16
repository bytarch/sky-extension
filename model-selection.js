document.addEventListener('DOMContentLoaded', () => {
  // crypto storage moved to crypto-storage.js
  const modelList = document.getElementById('model-list');
  const modelSearch = document.getElementById('model-search');
  const modelsSection = document.getElementById('models-section');
  const settingsSection = document.getElementById('settings-section');
  const tabModels = document.getElementById('tab-models');
  const tabSettings = document.getElementById('tab-settings');
  const apikeyInput = document.getElementById('apikey-input');
  const saveApikeyBtn = document.getElementById('save-apikey');
  const saveStatus = document.getElementById('save-status');
  let allModels = []; // Store all models for filtering
  
  // Add event listener for search input
  if (modelSearch) {
    modelSearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      filterModels(searchTerm);
    });
  }
  
  // Function to filter models based on search term
  function filterModels(searchTerm) {
    const filteredModels = allModels.filter(model =>
      model.name.toLowerCase().includes(searchTerm) ||
      model.type.toLowerCase().includes(searchTerm)
    );
    renderModels(filteredModels);
  }
  
  // Function to render models
  function renderModels(modelsToRender) {
    // Clear the model list
    modelList.innerHTML = '';

    if (modelsToRender.length === 0) {
      modelList.textContent = 'No models found.';
      return;
    }

    // Get selected model ID
    chrome.storage.local.get(['selectedModel'], (result) => {
      const selectedModelId = result.selectedModel;

      modelsToRender.forEach(model => {
        const modelDiv = document.createElement('div');
        modelDiv.className = 'model-card bg-white p-4 rounded shadow flex justify-between items-center mb-2';

        const modelInfo = document.createElement('div');
        modelInfo.innerHTML = `<span class="model-name">${model.name}</span> |  ${model.type}`;
        modelInfo.className = 'text-gray-700 cursor-pointer';
        modelInfo.title = 'Click to preview model description';

        const modelDesc = document.createElement('div');
        modelDesc.className = 'model-description hidden text-gray-600 mt-2 italic';
        modelDesc.style.fontSize = '8px';
        if (model.description) {
          modelDesc.textContent = model.description;
        } else {
          modelDesc.textContent = 'No description available.';
        }

        modelInfo.addEventListener('click', () => {
          modelDesc.classList.toggle('hidden');
        });

        const selectButton = document.createElement('button');
        if (model.id === selectedModelId) {
          modelDiv.classList.add('selected');
          selectButton.textContent = 'Selected';
          selectButton.className = 'bg-green-500 text-white px-3 py-1 rounded cursor-default';
          selectButton.disabled = true;
        } else {
          selectButton.textContent = 'Select';
          selectButton.className = 'bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600';
          selectButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the model info click
            if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ selectedModel: model.id }, () => {
                // Re-render all models to update selection status
                renderModels(modelsToRender);
              });
            }
          });
        }

        modelDiv.appendChild(modelInfo);
        modelDiv.appendChild(modelDesc);
        modelDiv.appendChild(selectButton);
        modelList.appendChild(modelDiv);
      });
    });
  }
  
  // Settings tabs
  const tabSettingsMain = document.getElementById('tab-settings-main');
  const tabSettingsUsage = document.getElementById('tab-settings-usage');
  const settingsMainContent = document.getElementById('settings-main-content');
  const settingsUsageContent = document.getElementById('settings-usage-content');
  const usageContent = document.getElementById('usage-content');

  // Tab switching - main tabs
  tabModels.addEventListener('click', () => {
    tabModels.classList.add('border-blue-600', 'font-semibold');
    tabModels.classList.remove('border-transparent');
    tabSettings.classList.remove('border-blue-600', 'font-semibold');
    tabSettings.classList.add('border-transparent');
    modelsSection.classList.remove('hidden');
    settingsSection.classList.add('hidden');
    // Hide all settings sub-tabs content including prompt
    settingsMainContent.classList.add('hidden');
    settingsUsageContent.classList.add('hidden');
    settingsPromptContent.classList.add('hidden');
  });
  

  tabSettings.addEventListener('click', () => {
    tabSettings.classList.add('border-blue-600', 'font-semibold');
    tabSettings.classList.remove('border-transparent');
    tabModels.classList.remove('border-blue-600', 'font-semibold');
    tabModels.classList.add('border-transparent');
    settingsSection.classList.remove('hidden');
    modelsSection.classList.add('hidden');
  
    // Reset sub-tab buttons to main tab selected, others unselected
    tabSettingsMain.classList.add('border-blue-600', 'font-semibold');
    tabSettingsMain.classList.remove('border-transparent');
    tabSettingsUsage.classList.remove('border-blue-600', 'font-semibold');
    tabSettingsUsage.classList.add('border-transparent');
    tabSettingsPrompt.classList.remove('border-blue-600', 'font-semibold');
    tabSettingsPrompt.classList.add('border-transparent');
  
    // Show only main content, hide others
    settingsMainContent.classList.remove('hidden');
    settingsUsageContent.classList.add('hidden');
    settingsPromptContent.classList.add('hidden');
  });
  
  // New sub-tab for prompt inside settings
  const tabSettingsPrompt = document.getElementById('tab-settings-prompt');
  const settingsPromptContent = document.getElementById('settings-prompt-content');
  
  tabSettingsPrompt.addEventListener('click', () => {
    tabSettingsPrompt.classList.add('border-blue-600', 'font-semibold');
    tabSettingsPrompt.classList.remove('border-transparent');
    tabSettingsMain.classList.remove('border-blue-600', 'font-semibold');
    tabSettingsMain.classList.add('border-transparent');
    tabSettingsUsage.classList.remove('border-blue-600', 'font-semibold');
    tabSettingsUsage.classList.add('border-transparent');
  
    settingsPromptContent.classList.remove('hidden');
    settingsMainContent.classList.add('hidden');
    settingsUsageContent.classList.add('hidden');
  });


  function hidePromptTab() {
    tabPrompt.classList.remove('border-blue-600', 'font-semibold');
    tabPrompt.classList.add('border-transparent');
    promptSection.classList.add('hidden');
  }

  // Tab switching - settings sub-tabs
  tabSettingsMain.addEventListener('click', showSettingsMainTab);
  tabSettingsUsage.addEventListener('click', showSettingsUsageTab);

  function showSettingsMainTab() {
    tabSettingsMain.classList.add('border-blue-600', 'font-semibold');
    tabSettingsMain.classList.remove('border-transparent');
    tabSettingsUsage.classList.remove('border-blue-600', 'font-semibold');
    tabSettingsUsage.classList.add('border-transparent');
    settingsMainContent.classList.remove('hidden');
    settingsUsageContent.classList.add('hidden');
  }

  // Custom prompt elements
  const customPromptInput = document.getElementById('custom-prompt');
  const summarizePromptBtn = document.getElementById('summarize-prompt');
  const answerPromptBtn = document.getElementById('answer-prompt');
  const promptSavingIndicator = document.getElementById('prompt-saving-indicator');

  // Default prompts
  const defaultPrompts = {
    summarize: "Summarize the Given text as the prompt",
    answer: "Answer the following multiple choice and true/false questions based on the provided text. Provide only the correct answers without explanations."
  };

  // Set up event listeners for default prompt buttons
  summarizePromptBtn.addEventListener('click', () => {
    customPromptInput.value = defaultPrompts.summarize;
    savePromptViaAPI(defaultPrompts.summarize);
  });

  answerPromptBtn.addEventListener('click', () => {
    customPromptInput.value = defaultPrompts.answer;
    savePromptViaAPI(defaultPrompts.answer);
  });

  // Auto-save with debounce
  let debounceTimer;
  async function savePromptViaAPI(prompt) {
    
    if (!prompt || prompt.trim() === '') return;
    // Save to local storage as well for backup
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ customPrompt: prompt });
    }
    
    // Show saving indicator
    promptSavingIndicator.classList.remove('hidden');

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const configs = await window.SkyConfigsAPI.getAll();
        if (configs && configs.length > 0) {
          configs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
          // If the latest config has the same prompt, do nothing
          if (configs[0].system_prompt === prompt) {
            promptSavingIndicator.classList.add('hidden');
            return;
          } else {
            // Update the latest config
            await window.SkyConfigsAPI.update(configs[0].id, prompt);
          }
        } else {
          // No configs, create new
          await window.SkyConfigsAPI.create(prompt);
        }
        // Hide saving indicator after save
        promptSavingIndicator.classList.add('hidden');
      } catch (error) {
        console.error('Failed to save prompt:', error);
        promptSavingIndicator.classList.add('hidden');
      }
    }, 1000); // 1 second debounce
  }

  // Load saved custom prompt from API
  async function loadPrompt() {
    try {
      const configs = await window.SkyConfigsAPI.getAll();
      const defaultPrompt = "Answer the following multiple choice and true/false questions based on the provided text. Provide only the correct answers without explanations.";
      if (configs && configs.length > 0) {
        configs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        customPromptInput.value = configs[0].system_prompt;
      } else {
        customPromptInput.value = defaultPrompt;
        // Save the default prompt
        savePromptViaAPI(defaultPrompt);
      }
    } catch (error) {
      console.error('Failed to load prompt:', error);
      const defaultPrompt = "Answer the following multiple choice and true/false questions based on the provided text. Provide only the correct answers without explanations.";
      customPromptInput.value = defaultPrompt;
      // Save the default prompt on error (assuming no configs)
      savePromptViaAPI(defaultPrompt);
    }
  }

  loadPrompt();

  // Auto-save on input
  if (customPromptInput) {
    customPromptInput.addEventListener('input', (e) => {
      const prompt = e.target.value;
      savePromptViaAPI(prompt);
    });
  }


  function showSettingsUsageTab() {
    tabSettingsUsage.classList.add('border-blue-600', 'font-semibold');
    tabSettingsUsage.classList.remove('border-transparent');
    tabSettingsMain.classList.remove('border-blue-600', 'font-semibold');
    tabSettingsMain.classList.add('border-transparent');
    settingsUsageContent.classList.remove('hidden');
    settingsMainContent.classList.add('hidden');
  }

  // Load API key from storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['apikey', 'selectedModel','customPrompt'], async (result) => {
      if (result.apikey) {
        const decrypted = await (window._extDecryptApiKey ? window._extDecryptApiKey(result.apikey) : result.apikey);
        apikeyInput.value = decrypted;
        if (decrypted) {
          const loadUsageForToken = window.loadUsageForToken;
          loadUsageForToken(decrypted, usageContent);
        }
      }
      if (!result.customPrompt) {
        
        savePromptViaAPI(defaultPrompts.answer);
      }
      const selectedModelId = result.selectedModel;

      fetch('https://flow-models.bytarch.dpdns.org/genie-extension.json?t='+ Date.now())
       .then(response => response.json())
       .then(data => {
         if (data && data.data && Array.isArray(data.data)) {
           // Store all models for filtering
           allModels = data.data;
           // Set first model as selected if none selected
           if (!selectedModelId && allModels.length > 0) {
             chrome.storage.local.set({ selectedModel: allModels[0].id });
           }
           // Render all models initially
           renderModels(allModels);
         } else {
           modelList.textContent = 'No models found.';
         }
       })
        .catch(error => {
          modelList.textContent = 'Failed to load models.';
          console.error('Error fetching models:', error);
        });
    });
  } else {
    // Fallback if chrome.storage is not available
    fetch('https://flow-models.bytarch.dpdns.org/genie-extension.json?t='+ Date.now())
      .then(response => response.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data)) {
          // Store all models for filtering
          allModels = data.data;
          // Render all models initially
          renderModels(allModels);
        } else {
          modelList.textContent = 'No models found.';
        }
      })
      .catch(error => {
        modelList.textContent = 'Failed to load models.';
        console.error('Error fetching models:', error);
      });
  }

  // Save API key to storage
  saveApikeyBtn.addEventListener('click', async () => {
    const apikey = apikeyInput.value.trim();
    if (apikey && chrome && chrome.storage && chrome.storage.local) {
      const encrypted = await (window._extEncryptApiKey ? window._extEncryptApiKey(apikey) : apikey);
      chrome.storage.local.set({ apikey: encrypted }, () => {
        saveStatus.classList.remove('hidden');
        setTimeout(() => saveStatus.classList.add('hidden'), 3000);
        Promise.resolve().then(() => {
          const loadUsageForToken = window.loadUsageForToken;
          loadUsageForToken(apikey, usageContent);
        });
      });
    }
  });
});