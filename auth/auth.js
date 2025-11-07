// Authentication functions
async function performLogin(email, password) {
  try {
    const response = await fetch('https://api-bytarch.netlify.app/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: email, password }),
    });
    const data = await response.json();

    if (response.ok) {
      const apikey = data.user.id;
      const encrypted = await (window._extEncryptApiKey ? window._extEncryptApiKey(apikey) : apikey);
      chrome.storage.local.set({ apikey: encrypted }, () => {
        const apikeySection = document.getElementById('apikey-section');
        const loginSection = document.getElementById('login-section');
        const apikeyInput = document.getElementById('apikey-input');
        const usageContent = document.getElementById('usage-content');

        apikeySection.classList.remove('hidden');
        loginSection.classList.add('hidden');
        apikeyInput.value = apikey;
        const loadUsageForToken = window.loadUsageForToken;
        loadUsageForToken(apikey, usageContent);
      });
      return true;
    } else {
      throw new Error(data.error || 'Login failed!');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function performRegister(email, password) {
  try {
    const response = await fetch('https://api-bytarch.netlify.app/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      // Automatically login the user after successful signup
      await performLogin(email, password);
    } else {
      throw new Error(data.error || 'Registration failed!');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

function setupAuthEventListeners() {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const loginStatus = document.getElementById('login-status');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      if (!email || !password) {
        loginStatus.textContent = 'Please enter email and password!';
        loginStatus.classList.remove('hidden');
        return;
      }
      loginStatus.textContent = 'Logging in...';
      loginStatus.classList.remove('hidden');
      try {
        await performLogin(email, password);
        loginStatus.classList.add('hidden');
      } catch (error) {
        loginStatus.textContent = error.message;
        loginStatus.classList.remove('hidden');
      }
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      if (!email || !password) {
        loginStatus.textContent = 'Please enter email and password!';
        loginStatus.classList.remove('hidden');
        return;
      }
      loginStatus.textContent = 'Registering...';
      loginStatus.classList.remove('hidden');
      try {
        await performRegister(email, password);
        loginStatus.classList.add('hidden');
      } catch (error) {
        loginStatus.textContent = error.message;
        loginStatus.classList.remove('hidden');
      }
    });
  }
}

// Export functions to window for global access
window.performLogin = performLogin;
window.performRegister = performRegister;
window.setupAuthEventListeners = setupAuthEventListeners;