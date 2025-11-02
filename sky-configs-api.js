(function() {
  const API_BASE = 'https://api.bytarch.dpdns.org/v1/sky/sky_configs';

  async function getBearerToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apikey'], async (result) => {
        if (result.apikey) {
          const token = await (window._extDecryptApiKey ? window._extDecryptApiKey(result.apikey) : result.apikey);
          resolve(token);
        } else {
          resolve(null);
        }
      });
    });
  }

  async function apiRequest(method, url, body = null) {
    const token = await getBearerToken();
    if (!token) {
      throw new Error('No API key found');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // GET /v1/sky_configs - Retrieves all sky configs
  async function getSkyConfigs() {
    try {
      const result = await apiRequest('GET', API_BASE);
      return result; // Assuming it returns array directly
    } catch (error) {
      console.error('Error fetching sky configs:', error);
      return [];
    }
  }

  // POST /v1/sky_configs - Creates a new sky config
  async function createSkyConfig(systemPrompt) {
    try {
      const body = { system_prompt: systemPrompt };
      const result = await apiRequest('POST', API_BASE, body);
     chrome.storage.local.set({ customPrompt: systemPrompt });
      return result; // Assuming it returns created config ID and/or the config
    } catch (error) {
      console.error('Error creating sky config:', error);
      throw error;
    }
  }

  // PUT /v1/sky_configs/:id - Updates an existing sky config
  async function updateSkyConfig(id, systemPrompt) {
    try {
      const body = { system_prompt: systemPrompt };
      const result = await apiRequest('PUT', `${API_BASE}/${id}`, body);
      chrome.storage.local.set({ customPrompt: systemPrompt });
      return result;
    } catch (error) {
      console.error('Error updating sky config:', error);
      throw error;
    }
  }

  // Expose functions globally
  window.SkyConfigsAPI = {
    getAll: getSkyConfigs,
    create: createSkyConfig,
    update: updateSkyConfig
  };
})();