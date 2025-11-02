// Check if popup already exists
if (document.getElementById('model-selection-popup')) {
  // If exists, toggle visibility
  const popup = document.getElementById('model-selection-popup');
  popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
} else {
  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'model-selection-popup';
  popup.style.position = 'fixed';
  popup.style.top = '50px';
  popup.style.right = '50px';
  popup.style.width = '300px';
  popup.style.maxHeight = '400px';
  popup.style.overflowY = 'auto';
  popup.style.backgroundColor = 'white';
  popup.style.border = '1px solid #ccc';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  popup.style.zIndex = '1000000';
  popup.style.padding = '10px';
  popup.style.fontFamily = 'Arial, sans-serif';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.float = 'right';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.border = 'none';
  closeBtn.style.background = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
  });
  popup.appendChild(closeBtn);

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Select a Model';
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '18px';
  title.style.fontWeight = 'bold';
  popup.appendChild(title);

  // Model list container
  const modelList = document.createElement('div');
  popup.appendChild(modelList);

  // Append popup to body
  document.body.appendChild(popup);

  // Fetch models and populate list
  fetch('https://flow-models.bytarch.dpdns.org/genie-extension.json')
    .then(response => response.json())
    .then(data => {
      if (data && data.data && Array.isArray(data.data)) {
        data.data.forEach(model => {
          const modelDiv = document.createElement('div');
          modelDiv.style.display = 'flex';
          modelDiv.style.justifyContent = 'space-between';
          modelDiv.style.alignItems = 'center';
          modelDiv.style.padding = '6px 0';
          modelDiv.style.borderBottom = '1px solid #eee';

          const modelInfo = document.createElement('span');
          modelInfo.textContent = `ID: ${model.id} | Type: ${model.type}`;
          modelInfo.style.flex = '1';

          const selectButton = document.createElement('button');
          selectButton.textContent = 'Select';
          selectButton.style.backgroundColor = '#3b82f6';
          selectButton.style.color = 'white';
          selectButton.style.border = 'none';
          selectButton.style.padding = '4px 8px';
          selectButton.style.borderRadius = '4px';
          selectButton.style.cursor = 'pointer';
          selectButton.addEventListener('click', () => {
            if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ selectedModel: model.id }, () => {
                alert(`Model "${model.id}" selected and saved!`);
              });
            } else {
              alert('Error: chrome.storage.local is not available.');
            }
          });

          modelDiv.appendChild(modelInfo);
          modelDiv.appendChild(selectButton);
          modelList.appendChild(modelDiv);
        });
      } else {
        modelList.textContent = 'No models found.';
      }
    })
    .catch(error => {
      modelList.textContent = 'Failed to load models.';
      console.error('Error fetching models:', error);
    });
}