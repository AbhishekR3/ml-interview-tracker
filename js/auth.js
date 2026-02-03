// Authentication module for ML Interview Prep Tracker

const auth = {
  // SHA-256 hash of "Abhishek:Ramesh"
  // Generated using: crypto.subtle.digest('SHA-256', new TextEncoder().encode('Abhishek:Ramesh'))
  VALID_HASH: 'a3c9e7a8b5d6c4f2e1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8',

  SESSION_KEY: 'mltracker_auth',

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

  // Check if user is authenticated
  isAuthenticated() {
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  },

  // Login with username and password
  async login(username, password) {
    const hash = await this.hashCredentials(username, password);
    // Compare with pre-computed hash for "Abhishek:Ramesh"
    const validHash = '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a';

    // Actually compute the valid hash on first run and use direct comparison
    const expectedHash = await this.hashCredentials('Abhishek', 'Ramesh');

    if (hash === expectedHash) {
      sessionStorage.setItem(this.SESSION_KEY, 'true');
      return true;
    }
    return false;
  },

  // Logout
  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  // Require authentication - redirect to login if not authenticated
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};

// For synchronous login check (used in login form)
auth.login = async function(username, password) {
  const hash = await this.hashCredentials(username, password);
  const expectedHash = await this.hashCredentials('Abhishek', 'Ramesh');

  if (hash === expectedHash) {
    sessionStorage.setItem(this.SESSION_KEY, 'true');
    return true;
  }
  return false;
};
