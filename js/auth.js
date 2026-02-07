// Authentication module for ML Interview Prep Tracker

const auth = {
  SESSION_KEY: 'mltracker_auth',
  DEVICE_TOKEN_KEY: 'mltracker_device_token',

  // Generate a unique device token
  generateDeviceToken() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  },

  // Get or create device token for this device
  getDeviceToken() {
    let token = localStorage.getItem(this.DEVICE_TOKEN_KEY);
    if (!token) {
      token = this.generateDeviceToken();
      localStorage.setItem(this.DEVICE_TOKEN_KEY, token);
    }
    return token;
  },

  // Hash a string using SHA-256
  async hashCredentials(username, password) {
    const str = `${username}:${password}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  },

  // Check if user is authenticated (uses localStorage for persistence)
  isAuthenticated() {
    return localStorage.getItem(this.SESSION_KEY) === 'true';
  },

  // Check if this device is authorized (token exists in synced data)
  isDeviceAuthorized() {
    const deviceToken = this.getDeviceToken();
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    const authorizedDevices = settings.authorizedDevices || [];
    return authorizedDevices.includes(deviceToken);
  },

  // Authorize this device (add token to synced data)
  authorizeDevice() {
    const deviceToken = this.getDeviceToken();
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    const authorizedDevices = settings.authorizedDevices || [];

    if (!authorizedDevices.includes(deviceToken)) {
      authorizedDevices.push(deviceToken);
      settings.authorizedDevices = authorizedDevices;
      storage.set(STORAGE_KEYS.SETTINGS, settings);
    }
  },

  // Login with username and password
  async login(username, password) {
    const hash = await this.hashCredentials(username, password);
    const expectedHash = await this.hashCredentials('Abhishek', 'Ramesh');

    if (hash === expectedHash) {
      // Store auth in localStorage (persists across browser sessions)
      localStorage.setItem(this.SESSION_KEY, 'true');
      // Authorize this device for future auto-login
      this.authorizeDevice();
      return true;
    }
    return false;
  },

  // Auto-login if device is authorized (called after sync)
  autoLoginIfAuthorized() {
    if (this.isDeviceAuthorized()) {
      localStorage.setItem(this.SESSION_KEY, 'true');
      return true;
    }
    return false;
  },

  // Logout (only from this device, doesn't remove device authorization)
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  // Logout and remove device authorization
  logoutAndForgetDevice() {
    const deviceToken = this.getDeviceToken();
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    const authorizedDevices = settings.authorizedDevices || [];

    // Remove this device from authorized list
    settings.authorizedDevices = authorizedDevices.filter(t => t !== deviceToken);
    storage.set(STORAGE_KEYS.SETTINGS, settings);

    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.DEVICE_TOKEN_KEY);
    window.location.href = 'login.html';
  },

  // Require authentication - redirect to login if not authenticated
  requireAuth() {
    // First check if already authenticated
    if (this.isAuthenticated()) {
      return true;
    }
    // Try auto-login if device is authorized
    if (this.autoLoginIfAuthorized()) {
      return true;
    }
    // Redirect to login
    window.location.href = 'login.html';
    return false;
  },

  // Async initialization - syncs first, then checks auth
  // Call this on pages that need auth
  async initWithSync() {
    // If already authenticated locally, we're good
    if (this.isAuthenticated()) {
      return true;
    }

    // Try to sync first to get device authorizations
    if (typeof supabaseSync !== 'undefined') {
      try {
        supabaseSync.autoConfigureDefaults();
        if (supabaseSync.isConfigured()) {
          // Just fetch data, don't do full init yet
          const result = await supabaseSync.fetchFromSupabase();
          if (result && result.exists && result.data) {
            // Temporarily save settings to check device auth
            if (result.data.settings) {
              storage.set(STORAGE_KEYS.SETTINGS, result.data.settings);
            }
          }
        }
      } catch (e) {
        console.log('Sync fetch failed during auth init:', e);
      }
    }

    // Now check if device is authorized
    if (this.autoLoginIfAuthorized()) {
      return true;
    }

    // Not authenticated, redirect to login
    window.location.href = 'login.html';
    return false;
  }
};
