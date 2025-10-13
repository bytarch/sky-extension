


function checkForUpdates() {
  const current = chrome.runtime.getManifest().version;
  let hasUpdate = false;
  fetch('https://raw.githubusercontent.com/bytarch/sky-extension/refs/heads/main/version.json?t=' + Date.now())
    .then(r => r.ok ? r.json() : Promise.reject('bad response'))
    .then(data => {
      if (!data || !data.version) {
        console.log('Update check: invalid data', data);
        return;
      }
      if( current !== data.version) {
      hasUpdate = true;
      }
      
      console.log('Update check:', { current, fetched: data.version, hasUpdate });
     
      if (hasUpdate) {
        showUpdateFloatingDiv(data.version, data.notes || []);
      }
    })
    .catch(err => console.error('Update check failed:', err));
}

// Check immediately on load
checkForUpdates();

function showUpdateFloatingDiv(newVersion, features) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    background: rgba(0, 0, 0, 0.39);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 20px;
    border-radius: 16px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    cursor: move;
  `;
  div.innerHTML = `
    <h3 style="margin-top: 0; color: #ffd700;">Update Available!</h3>
    <p style="margin: 5px 0;"><strong>Current:</strong> ${chrome.runtime.getManifest().version}</p>
    <p style="margin: 5px 0;"><strong>New:</strong> ${newVersion}</p>
    <p style="margin: 10px 0 15px 0;"> - ${features.join('<br><br>- ')}</p>
    <div style="text-align: center;">
      <button id="download-btn" style="background: rgba(0, 123, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Download</button>
      <button id="close-btn" style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
    </div>
  `;

  document.body.appendChild(div);

  const downloadBtn = div.querySelector('#download-btn');
  const closeBtn = div.querySelector('#close-btn');

  downloadBtn.addEventListener('click', () => {
    window.open('https://github.com/bytarch/sky-extension/archive/refs/heads/main.zip', '_blank');
    div.remove();
  });

  closeBtn.addEventListener('click', () => {
    div.remove();
  });

  // Make the div draggable
  let isDragging = false;
  let dragStartX, dragStartY, initialTop, initialRight;

  div.addEventListener('mousedown', (e) => {
    if (e.target === downloadBtn || e.target === closeBtn) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialTop = div.offsetTop;
    initialRight = div.offsetLeft;
    div.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    div.style.top = initialTop + dy + 'px';
    div.style.left = initialRight + dx + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      div.style.cursor = 'move';
    }
  });

  // Prevent text selection during drag
  div.addEventListener('dragstart', (e) => e.preventDefault());
}
// Check periodically every hour (3600000 ms)
setInterval(checkForUpdates, 3600000);