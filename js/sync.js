// GitHub Sync module for ML Interview Prep Tracker

const githubSync = {
  // Configuration
  STORAGE_KEY_TOKEN: 'mltracker_github_token',
  STORAGE_KEY_REPO: 'mltracker_github_repo',
  DATA_FILE_PATH: 'data/user-data.json',
  DEBOUNCE_MS: 2000,

  // State
  _debounceTimer: null,
  _isSyncing: false,
  _lastSyncStatus: null, // 'success', 'error', 'offline'
  _fileSha: null, // Required for updates

  // Get GitHub token from localStorage
  getToken() {
    return localStorage.getItem(this.STORAGE_KEY_TOKEN);
  },

  // Set GitHub token
  setToken(token) {
    if (token) {
      localStorage.setItem(this.STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_TOKEN);
    }
  },

  // Get repository info (owner/repo format)
  getRepo() {
    return localStorage.getItem(this.STORAGE_KEY_REPO) || 'abhishekramesh/ml-interview-tracker';
  },

  // Set repository info
  setRepo(repo) {
    localStorage.setItem(this.STORAGE_KEY_REPO, repo);
  },

  // Check if sync is configured
  isConfigured() {
    return !!this.getToken();
  },

  // Update sync status indicator in UI
  updateSyncIndicator(status, message = '') {
    this._lastSyncStatus = status;
    const indicator = document.getElementById('syncIndicator');
    if (!indicator) return;

    const iconEl = indicator.querySelector('.sync-icon');
    const textEl = indicator.querySelector('.sync-text');

    indicator.className = 'sync-indicator';

    switch (status) {
      case 'syncing':
        indicator.classList.add('syncing');
        iconEl.textContent = '↻';
        textEl.textContent = 'Syncing...';
        break;
      case 'success':
        indicator.classList.add('success');
        iconEl.textContent = '✓';
        textEl.textContent = 'Synced';
        break;
      case 'error':
        indicator.classList.add('error');
        iconEl.textContent = '⚠';
        textEl.textContent = message || 'Sync failed';
        break;
      case 'offline':
        indicator.classList.add('offline');
        iconEl.textContent = '○';
        textEl.textContent = 'Offline';
        break;
      case 'not-configured':
        indicator.classList.add('not-configured');
        iconEl.textContent = '⚙';
        textEl.textContent = 'Setup sync';
        break;
      default:
        iconEl.textContent = '○';
        textEl.textContent = '';
    }
  },

  // Show offline banner
  showOfflineBanner(show = true, message = 'Sync failed - working offline') {
    let banner = document.getElementById('offlineBanner');

    if (show) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offlineBanner';
        banner.className = 'offline-banner';
        banner.innerHTML = `
          <span class="offline-message">${message}</span>
          <button class="btn btn-small" onclick="githubSync.manualSync()">Retry</button>
          <button class="btn-close" onclick="githubSync.hideOfflineBanner()">&times;</button>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
      } else {
        banner.querySelector('.offline-message').textContent = message;
        banner.classList.remove('hidden');
      }
    } else if (banner) {
      banner.classList.add('hidden');
    }
  },

  hideOfflineBanner() {
    const banner = document.getElementById('offlineBanner');
    if (banner) banner.classList.add('hidden');
  },

  // Fetch data from GitHub
  async fetchFromGitHub() {
    const token = this.getToken();
    if (!token) return null;

    const repo = this.getRepo();
    const url = `https://api.github.com/repos/${repo}/contents/${this.DATA_FILE_PATH}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        // File doesn't exist yet
        return { exists: false, data: null };
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const fileInfo = await response.json();
      this._fileSha = fileInfo.sha;

      // Decode base64 content
      const content = atob(fileInfo.content);
      const data = JSON.parse(content);

      return { exists: true, data, sha: fileInfo.sha };
    } catch (error) {
      console.error('Error fetching from GitHub:', error);
      throw error;
    }
  },

  // Push data to GitHub
  async pushToGitHub(data) {
    const token = this.getToken();
    if (!token) throw new Error('No GitHub token configured');

    const repo = this.getRepo();
    const url = `https://api.github.com/repos/${repo}/contents/${this.DATA_FILE_PATH}`;

    // Add lastModified timestamp
    data.lastModified = new Date().toISOString();

    const content = btoa(JSON.stringify(data, null, 2));

    const body = {
      message: `Sync data: ${new Date().toISOString()}`,
      content: content,
      branch: 'main'
    };

    // Include SHA if updating existing file
    if (this._fileSha) {
      body.sha = this._fileSha;
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `GitHub API error: ${response.status}`);
      }

      const result = await response.json();
      this._fileSha = result.content.sha;

      return true;
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      throw error;
    }
  },

  // Get all syncable data from localStorage
  getLocalData() {
    return {
      dailyLogs: storage.get(STORAGE_KEYS.DAILY_LOGS) || [],
      topics: storage.get(STORAGE_KEYS.TOPICS) || [],
      applications: storage.get(STORAGE_KEYS.APPLICATIONS) || [],
      settings: storage.get(STORAGE_KEYS.SETTINGS) || {},
      lastModified: new Date().toISOString()
    };
  },

  // Save remote data to localStorage
  saveToLocal(data) {
    if (data.dailyLogs) storage.set(STORAGE_KEYS.DAILY_LOGS, data.dailyLogs);
    if (data.topics) storage.set(STORAGE_KEYS.TOPICS, data.topics);
    if (data.applications) storage.set(STORAGE_KEYS.APPLICATIONS, data.applications);
    if (data.settings) storage.set(STORAGE_KEYS.SETTINGS, data.settings);
  },

  // Pull data from GitHub and update local if newer
  async pull() {
    if (!this.isConfigured()) {
      this.updateSyncIndicator('not-configured');
      return false;
    }

    this._isSyncing = true;
    this.updateSyncIndicator('syncing');

    try {
      const result = await this.fetchFromGitHub();

      if (!result.exists) {
        // No remote data yet, push local data
        console.log('No remote data found, pushing local data...');
        await this.push();
        return true;
      }

      const remoteData = result.data;
      const localData = this.getLocalData();

      // Compare timestamps
      const remoteTime = new Date(remoteData.lastModified || 0).getTime();
      const localTime = new Date(localData.lastModified || 0).getTime();

      if (remoteTime > localTime) {
        // Remote is newer, update local
        console.log('Remote data is newer, updating local...');
        this.saveToLocal(remoteData);
        this.updateSyncIndicator('success');
        this.hideOfflineBanner();

        // Trigger UI refresh
        if (typeof refreshPage === 'function') {
          refreshPage();
        } else {
          window.location.reload();
        }
      } else if (localTime > remoteTime) {
        // Local is newer, push to remote
        console.log('Local data is newer, pushing to remote...');
        await this.push();
      } else {
        // Same timestamp, already in sync
        console.log('Data is in sync');
        this.updateSyncIndicator('success');
        this.hideOfflineBanner();
      }

      return true;
    } catch (error) {
      console.error('Pull failed:', error);
      this.updateSyncIndicator('error', 'Sync failed');
      this.showOfflineBanner(true, `Sync failed: ${error.message}`);
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  // Push local data to GitHub
  async push() {
    if (!this.isConfigured()) {
      this.updateSyncIndicator('not-configured');
      return false;
    }

    this._isSyncing = true;
    this.updateSyncIndicator('syncing');

    try {
      const localData = this.getLocalData();
      await this.pushToGitHub(localData);
      this.updateSyncIndicator('success');
      this.hideOfflineBanner();
      return true;
    } catch (error) {
      console.error('Push failed:', error);
      this.updateSyncIndicator('error', 'Sync failed');
      this.showOfflineBanner(true, `Sync failed: ${error.message}`);
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  // Debounced push - called after data changes
  schedulePush() {
    if (!this.isConfigured()) return;

    // Clear existing timer
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    // Schedule new push
    this._debounceTimer = setTimeout(() => {
      this.push();
    }, this.DEBOUNCE_MS);
  },

  // Manual sync trigger
  async manualSync() {
    return await this.pull();
  },

  // Initialize sync on page load
  async init() {
    if (!this.isConfigured()) {
      this.updateSyncIndicator('not-configured');
      return;
    }

    // Pull latest data on page load
    await this.pull();
  }
};

// Hook into storage.set to trigger sync on data changes
const originalStorageSet = storage.set;
storage.set = function(key, value) {
  const result = originalStorageSet.call(this, key, value);

  // Trigger sync for data keys (not UI state)
  const syncableKeys = [
    STORAGE_KEYS.DAILY_LOGS,
    STORAGE_KEYS.TOPICS,
    STORAGE_KEYS.APPLICATIONS,
    STORAGE_KEYS.SETTINGS
  ];

  if (syncableKeys.includes(key)) {
    githubSync.schedulePush();
  }

  return result;
};
