document.addEventListener('DOMContentLoaded', () => {
  // Initialize auth event listeners
  if (window.setupAuthEventListeners) {
    window.setupAuthEventListeners();
  }

  // crypto storage moved to crypto-storage.js
  const modelList = document.getElementById('model-list');
  const modelLoading = document.getElementById('model-loading');
  const modelSearch = document.getElementById('model-search');
  const modelsSection = document.getElementById('models-section');
  const settingsSection = document.getElementById('settings-section');
  const tabModels = document.getElementById('tab-models');
  const tabSettings = document.getElementById('tab-settings');
  const apikeyInput = document.getElementById('apikey-input');
  const removeApikeyBtn = document.getElementById('remove-apikey');
  const saveStatus = document.getElementById('save-status');
  const removeStatus = document.getElementById('remove-status');
  const apikeySection = document.getElementById('apikey-section');
  const loginSection = document.getElementById('login-section');
  let allModels = []; // Store all models for filtering
  const filterFree = document.getElementById('filter-free');
  const filterPremium = document.getElementById('filter-premium');
  const filterVision = document.getElementById('filter-vision');
  const filterSummary = document.getElementById('filter-summary');
  const filterQa = document.getElementById('filter-qa');

  // Add event listener for search input
  if (modelSearch) {
    modelSearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      filterModels(searchTerm);
    });
  }

  // Add event listeners for filters
  const filterElements = [filterFree, filterPremium, filterVision, filterSummary, filterQa];
  filterElements.forEach(filter => {
    if (filter) {
      filter.addEventListener('change', () => {
        // Make free/premium mutually exclusive
        if (filter.id === 'filter-free' && filter.checked) {
          filterPremium.checked = false;
        } else if (filter.id === 'filter-premium' && filter.checked) {
          filterFree.checked = false;
        }
        // Make summary/qa mutually exclusive
        else if (filter.id === 'filter-summary' && filter.checked) {
          filterQa.checked = false;
        } else if (filter.id === 'filter-qa' && filter.checked) {
          filterSummary.checked = false;
        }
        filterModels(modelSearch.value.toLowerCase());
      });
    }
  });

  // Function to filter models based on search term and filters
  function filterModels(searchTerm) {
    let filteredModels = allModels.filter(model =>
      model.name.toLowerCase().includes(searchTerm) ||
      model.type.toLowerCase().includes(searchTerm)
    );

    // Apply free filter
    if (filterFree && filterFree.checked) {
      filteredModels = filteredModels.filter(model =>
        model.type.toLowerCase().includes('free')
      );
    }

    // Apply premium filter (opposite of free - exclude free models)
    if (filterPremium && filterPremium.checked) {
      filteredModels = filteredModels.filter(model =>
        !model.type.toLowerCase().includes('free')
      );
    }

    // Apply vision filter
    if (filterVision && filterVision.checked) {
      filteredModels = filteredModels.filter(model =>
        model.type.toLowerCase().includes('vision')
      );
    }

    // Apply summary filter (based on description containing 'summarizing')
    if (filterSummary && filterSummary.checked) {
      filteredModels = filteredModels.filter(model =>
        model.description && model.description.toLowerCase().includes('summarizing')
      );
    }

    // Apply Q&A filter (opposite of summary - models for Q&A/reasoning)
    if (filterQa && filterQa.checked) {
      filteredModels = filteredModels.filter(model =>
        model.description && !model.description.toLowerCase().includes('summarizing')
      );
    }

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
      let selectedModelId = result.selectedModel;

      // Check if selected model exists in current filtered list
      const selectedModelExists = modelsToRender.some(model => model.id === selectedModelId);

      // If selected model doesn't exist in filtered results, switch to first model
      if (!selectedModelExists && modelsToRender.length > 0) {
        selectedModelId = modelsToRender[0].id;
        chrome.storage.local.set({ selectedModel: selectedModelId, isFreeModel: modelsToRender.find(m => m.id === selectedModelId)?.type.toLowerCase().includes('free') });
      }

      // Sort models so selected model appears first
      modelsToRender.sort((a, b) => {
        if (a.id === selectedModelId) return -1;
        if (b.id === selectedModelId) return 1;
        return 0;
      });

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
              const isFreeModel = model.type.toLowerCase().includes('free');
              chrome.storage.local.set({ selectedModel: model.id, isFreeModel: isFreeModel }, () => {
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
    settingsPromptContent.classList.add('hidden');
  }

  // Custom prompt elements
  const customPromptInput = document.getElementById('custom-prompt');
  const customPromptContainer = document.getElementById('custom-prompt-container');
  const customizePromptBtn = document.getElementById('customize-prompt-btn');
  const summarizePromptBtn = document.getElementById('summarize-prompt');
  const answerPromptBtn = document.getElementById('answer-prompt');
  const studyPromptBtn = document.getElementById('study-prompt');
  const explainPromptBtn = document.getElementById('explain-prompt');
  const promptSavingIndicator = document.getElementById('prompt-saving-indicator');

  // Default prompts are now loaded from system_prompts/default-prompts.js

  // Set up event listeners for default prompt buttons
  summarizePromptBtn.addEventListener('click', () => {
    customPromptInput.value = defaultPrompts.summarize;
    savePromptViaAPI(defaultPrompts.summarize);
  });

  answerPromptBtn.addEventListener('click', () => {
    customPromptInput.value = defaultPrompts.answer;
    savePromptViaAPI(defaultPrompts.answer);
  });

  studyPromptBtn.addEventListener('click', () => {
    customPromptInput.value = defaultPrompts.study;
    savePromptViaAPI(defaultPrompts.study);
  });

  explainPromptBtn.addEventListener('click', () => {
    customPromptInput.value = defaultPrompts.explain;
    savePromptViaAPI(defaultPrompts.explain);
  });

  customizePromptBtn.addEventListener('click', () => {
    customPromptContainer.classList.remove('hidden');
    // Load the current custom prompt if it exists
    chrome.storage.local.get(['customPrompt'], (result) => {
      if (result.customPrompt) {
        customPromptInput.value = result.customPrompt;
      }
    });
  });

  // Auto-save with debounce
  let debounceTimer;
  async function savePromptViaAPI(prompt) {

    if (!prompt || prompt.trim() === '') return;
    // Always save to local storage
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ customPrompt: prompt });
    }

    // Show saving indicator
    promptSavingIndicator.classList.remove('hidden');

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        // Check if API key exists
        const hasApiKey = await new Promise(resolve => {
          chrome.storage.local.get(['apikey'], (result) => {
            resolve(!!result.apikey);
          });
        });

        if (hasApiKey) {
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
        }
        // Hide saving indicator after save (or if no API key, just saved to local)
        promptSavingIndicator.classList.add('hidden');
      } catch (error) {
        console.error('Failed to save prompt:', error);
        promptSavingIndicator.classList.add('hidden');
      }
    }, 1000); // 1 second debounce
  }

  // Load saved custom prompt from local storage, then API if available
  async function loadPrompt() {
    const defaultPrompt = "Answer the following multiple choice and true/false questions based on the provided text. Provide only the correct answers without explanations.";

    // First, check local storage
    chrome.storage.local.get(['customPrompt'], async (result) => {
      if (result.customPrompt) {
        // If a custom prompt is saved, show the container and load it
        customPromptContainer.classList.remove('hidden');
        customPromptInput.value = result.customPrompt;
      } else {
        // Check if API key exists and load from API
        chrome.storage.local.get(['apikey'], async (apiResult) => {
          if (apiResult.apikey) {
            try {
              const configs = await window.SkyConfigsAPI.getAll();
              if (configs && configs.length > 0) {
                configs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                customPromptContainer.classList.remove('hidden');
                customPromptInput.value = configs[0].system_prompt;
                // Also save to local storage
                chrome.storage.local.set({ customPrompt: configs[0].system_prompt });
              }
              // If no configs, keep container hidden
            } catch (error) {
              console.error('Failed to load prompt from API:', error);
              // Keep container hidden
            }
          }
          // If no API key, keep container hidden
        });
      }
    });
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
    tabSettingsPrompt.classList.remove('border-blue-600', 'font-semibold');
    tabSettingsPrompt.classList.add('border-transparent');
    settingsUsageContent.classList.remove('hidden');
    settingsMainContent.classList.add('hidden');
    settingsPromptContent.classList.add('hidden');
  }

  // Load API key from storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['apikey', 'selectedModel','customPrompt'], async (result) => {
      if (result.apikey) {
        apikeySection.classList.remove('hidden');
        loginSection.classList.add('hidden');
        const decrypted = await (window._extDecryptApiKey ? window._extDecryptApiKey(result.apikey) : result.apikey);
        apikeyInput.value = decrypted;
        if (decrypted) {
          const loadUsageForToken = window.loadUsageForToken;
          loadUsageForToken(decrypted, usageContent);
        }
      } else {
        apikeySection.classList.add('hidden');
        loginSection.classList.remove('hidden');
      }
      if (!result.customPrompt) {
       // If no custom prompt saved, set default to Answer Questions (but don't show in textarea)
       // This ensures the default behavior is "Answer Questions" without displaying the prompt text
       chrome.storage.local.set({ customPrompt: defaultPrompts.answer });
     }
      const selectedModelId = result.selectedModel;

      // Show loading
      modelLoading.classList.remove('hidden');
      modelList.innerHTML = '';

      fetch('https://flow-models.bytarch.dpdns.org/genie-extension.json?t='+ Date.now())
       .then(response => response.json())
       .then(data => {
         // Hide loading
         modelLoading.classList.add('hidden');

         if (data && data.data && Array.isArray(data.data)) {
           // Store all models for filtering
           allModels = data.data;
           // Set first model as selected if none selected
           if (!selectedModelId && allModels.length > 0) {
             chrome.storage.local.set({ selectedModel: allModels[0].id, isFreeModel: allModels[0].type.toLowerCase().includes('free') });
           }
           // Render all models initially
           renderModels(allModels);
         } else {
           modelList.textContent = 'No models found.';
         }
       })
       .catch(error => {
         // Hide loading
         modelLoading.classList.add('hidden');
         modelList.textContent = 'Failed to load models.';
         console.error('Error fetching models:', error);
       });
    });
  } else {
    // Fallback if chrome.storage is not available
    // Show loading
    modelLoading.classList.remove('hidden');
    modelList.innerHTML = '';

    fetch('https://flow-models.bytarch.dpdns.org/genie-extension.json?t='+ Date.now())
      .then(response => response.json())
      .then(data => {
        // Hide loading
        modelLoading.classList.add('hidden');

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
        // Hide loading
        modelLoading.classList.add('hidden');
        modelList.textContent = 'Failed to load models.';
        console.error('Error fetching models:', error);
      });
  }



  // Remove API key from storage
  if (removeApikeyBtn) {
    removeApikeyBtn.addEventListener('click', () => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['apikey'], () => {
          apikeyInput.value = '';
          removeStatus.classList.remove('hidden');
          setTimeout(() => removeStatus.classList.add('hidden'), 3000);
          // Clear usage content
          usageContent.innerHTML = 'No usage data available';
          // Show login section
          apikeySection.classList.add('hidden');
          loginSection.classList.remove('hidden');
        });
      }
    });
  }
});