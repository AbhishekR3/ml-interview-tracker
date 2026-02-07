// Supabase Sync module for ML Interview Prep Tracker
// Manual sync with smart merge - no auto-sync

const supabaseSync = {
  // Configuration
  STORAGE_KEY_URL: 'mltracker_supabase_url',
  STORAGE_KEY_KEY: 'mltracker_supabase_key',
  STORAGE_KEY_USER_ID: 'mltracker_supabase_user_id',
  STORAGE_KEY_LAST_MODIFIED: 'mltracker_last_modified',
  TABLE_NAME: 'user_data',

  // Default credentials (auto-configured)
  DEFAULT_URL: 'https://mbmlnxpifjmzodzyqqog.supabase.co',
  DEFAULT_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibWxueHBpZmptem9kenlxcW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjczNzUsImV4cCI6MjA4NTc0MzM3NX0.-PyxwnRVD_Bfj-JtkvaxEnFbAFH3os9wO8Dto_cDldg',
  DEFAULT_USER_ID: 'user_1770184708555_2zl59zi3d',

  // Auto-configure with default credentials if not already set
  autoConfigureDefaults() {
    if (!this.getUrl()) {
      this.setUrl(this.DEFAULT_URL);
    }
    if (!this.getKey()) {
      this.setKey(this.DEFAULT_KEY);
    }
    if (!this.getStoredUserId()) {
      this.setStoredUserId(this.DEFAULT_USER_ID);
    }
  },

  // State
  _client: null,
  _isSyncing: false,
  _lastSyncStatus: null,
  _userId: null,

  // Get Supabase URL from localStorage
  getUrl() {
    return localStorage.getItem(this.STORAGE_KEY_URL);
  },

  // Set Supabase URL
  setUrl(url) {
    if (url) {
      localStorage.setItem(this.STORAGE_KEY_URL, url);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_URL);
    }
    this._client = null; // Reset client
  },

  // Get Supabase anon key from localStorage
  getKey() {
    return localStorage.getItem(this.STORAGE_KEY_KEY);
  },

  // Set Supabase anon key
  setKey(key) {
    if (key) {
      localStorage.setItem(this.STORAGE_KEY_KEY, key);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_KEY);
    }
    this._client = null; // Reset client
  },

  // Get stored user ID from localStorage
  getStoredUserId() {
    return localStorage.getItem(this.STORAGE_KEY_USER_ID);
  },

  // Set stored user ID
  setStoredUserId(userId) {
    if (userId) {
      localStorage.setItem(this.STORAGE_KEY_USER_ID, userId);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_USER_ID);
    }
    this._userId = null; // Reset cached user ID
  },

  // Check if sync is configured
  isConfigured() {
    return !!(this.getUrl() && this.getKey() && this.getStoredUserId());
  },

  // Get or create Supabase client
  getClient() {
    if (this._client) return this._client;

    const url = this.getUrl();
    const key = this.getKey();

    if (!url || !key) return null;

    // Use the global supabase object from CDN
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      this._client = supabase.createClient(url, key);
      return this._client;
    }

    console.error('Supabase client library not loaded');
    return null;
  },

  // Get user ID (using stored user ID from settings)
  getUserId() {
    if (this._userId) return this._userId;

    // Use the stored user ID from settings (required)
    const storedUserId = this.getStoredUserId();
    if (storedUserId) {
      this._userId = storedUserId;
      return this._userId;
    }

    // No user ID configured
    return null;
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
        iconEl.textContent = '↑↓';
        textEl.textContent = 'Sync Now';
        break;
      case 'synced':
        indicator.classList.add('synced');
        iconEl.textContent = '✓';
        textEl.textContent = 'Synced!';
        // Revert to "Sync Now" after 3 seconds
        setTimeout(() => {
          this.updateSyncIndicator('success');
        }, 3000);
        break;
      case 'error':
        indicator.classList.add('error');
        iconEl.textContent = '⚠';
        textEl.textContent = message || 'Retry Sync';
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
      case 'disabled':
        indicator.classList.add('not-configured');
        iconEl.textContent = '○';
        textEl.textContent = 'Local only';
        break;
      default:
        iconEl.textContent = '↑↓';
        textEl.textContent = 'Sync Now';
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
          <button class="btn btn-small" onclick="supabaseSync.manualSync()">Retry</button>
          <button class="btn-close" onclick="supabaseSync.hideOfflineBanner()">&times;</button>
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

  // Show error popup with detailed error message
  showErrorPopup(title, message, details = '') {
    // Remove existing popup if any
    const existingPopup = document.getElementById('syncErrorPopup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'syncErrorPopup';
    popup.className = 'sync-error-popup';
    popup.innerHTML = `
      <div class="sync-error-popup-content">
        <h3>${title}</h3>
        <p>${message}</p>
        ${details ? `<pre class="error-details">${details}</pre>` : ''}
        <div class="popup-buttons">
          <button class="btn" onclick="this.closest('.sync-error-popup').remove()">Close</button>
          <button class="btn btn-primary" onclick="supabaseSync.manualSync(); this.closest('.sync-error-popup').remove()">Retry</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
  },

  // Get all syncable data from localStorage (including soft-deleted items for sync)
  getLocalData() {
    // Use raw storage to get ALL items including deleted ones
    return {
      dailyLogs: storage.get(STORAGE_KEYS.DAILY_LOGS) || [],
      topics: storage.get(STORAGE_KEYS.TOPICS) || [],
      applications: storage.get(STORAGE_KEYS.APPLICATIONS) || [],
      settings: storage.get(STORAGE_KEYS.SETTINGS) || {},
      lastModified: this.getStoredLastModified() || null
    };
  },

  // Save remote data to localStorage
  saveToLocal(data) {
    console.log('saveToLocal called with:', {
      dailyLogs: data.dailyLogs?.length || 0,
      topics: data.topics?.length || 0,
      applications: data.applications?.length || 0,
      lastModified: data.lastModified
    });

    // Use direct localStorage to bypass storage hook during sync
    // IMPORTANT: Use STORAGE_KEYS constants to match app.js keys
    if (data.dailyLogs) {
      localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(data.dailyLogs));
    }
    if (data.topics) {
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(data.topics));
    }
    if (data.applications) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    // Persist lastModified timestamp
    if (data.lastModified) {
      localStorage.setItem(this.STORAGE_KEY_LAST_MODIFIED, data.lastModified);
    }

    // Verify data was saved
    console.log('Data saved to localStorage. Verification:', {
      dailyLogs: JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_LOGS) || '[]').length,
      topics: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOPICS) || '[]').length,
      applications: JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]').length,
      lastModified: localStorage.getItem(this.STORAGE_KEY_LAST_MODIFIED)
    });
  },

  // Get stored lastModified timestamp
  getStoredLastModified() {
    return localStorage.getItem(this.STORAGE_KEY_LAST_MODIFIED);
  },

  // Set lastModified timestamp
  setLastModified(timestamp) {
    localStorage.setItem(this.STORAGE_KEY_LAST_MODIFIED, timestamp);
  },

  // Merge two arrays by ID, keeping the item with the newer updatedAt timestamp
  // Items that exist only in one array are included in the result
  // Handles soft-deleted items: if an item is deleted with a newer timestamp, keep it deleted
  mergeArraysById(localArray, remoteArray) {
    const merged = new Map();

    // Add all local items
    for (const item of (localArray || [])) {
      merged.set(item.id, item);
    }

    // Merge remote items
    for (const remoteItem of (remoteArray || [])) {
      const localItem = merged.get(remoteItem.id);

      if (!localItem) {
        // Item only exists remotely - add it (even if deleted, for sync purposes)
        merged.set(remoteItem.id, remoteItem);
      } else {
        // Item exists in both - keep the newer one based on updatedAt
        const localTime = new Date(localItem.updatedAt || 0).getTime();
        const remoteTime = new Date(remoteItem.updatedAt || 0).getTime();

        if (remoteTime > localTime) {
          // Remote is newer - use remote (preserves deleted state if remote was deleted)
          merged.set(remoteItem.id, remoteItem);
        }
        // If local is newer or same, keep local (already in map)
        // This preserves local deleted state if local deletion was more recent
      }
    }

    return Array.from(merged.values());
  },

  // Merge settings objects (simple shallow merge, local wins for conflicts)
  mergeSettings(localSettings, remoteSettings) {
    return { ...(remoteSettings || {}), ...(localSettings || {}) };
  },

  // Merge topics by category+name (unique identifier) instead of ID
  // This handles the case where different devices generate different IDs for the same topic
  mergeTopicsByName(localTopics, remoteTopics) {
    const merged = new Map();

    // Key function: category + name
    const getKey = (topic) => `${topic.category}::${topic.name}`;

    // Add all local topics
    for (const topic of (localTopics || [])) {
      merged.set(getKey(topic), topic);
    }

    // Merge remote topics
    for (const remoteTopic of (remoteTopics || [])) {
      const key = getKey(remoteTopic);
      const localTopic = merged.get(key);

      if (!localTopic) {
        // Topic only exists remotely - add it
        merged.set(key, remoteTopic);
      } else {
        // Topic exists in both - keep the one with more practice or newer update
        const localTime = new Date(localTopic.updatedAt || 0).getTime();
        const remoteTime = new Date(remoteTopic.updatedAt || 0).getTime();

        // Prefer the one with actual practice data, or the newer one
        if (remoteTopic.practiceCount > localTopic.practiceCount ||
            (remoteTopic.practiceCount === localTopic.practiceCount && remoteTime > localTime)) {
          merged.set(key, remoteTopic);
        }
      }
    }

    return Array.from(merged.values());
  },

  // Merge all data from local and remote
  mergeData(localData, remoteData) {
    return {
      dailyLogs: this.mergeArraysById(localData.dailyLogs, remoteData.dailyLogs),
      topics: this.mergeTopicsByName(localData.topics, remoteData.topics),
      applications: this.mergeArraysById(localData.applications, remoteData.applications),
      settings: this.mergeSettings(localData.settings, remoteData.settings),
      lastModified: new Date().toISOString()
    };
  },

  // Check if local data is empty or just defaults (no real user data)
  isLocalDataEmpty() {
    const logs = storage.get(STORAGE_KEYS.DAILY_LOGS) || [];
    const apps = storage.get(STORAGE_KEYS.APPLICATIONS) || [];
    const topics = storage.get(STORAGE_KEYS.TOPICS) || [];

    // If no logs and no applications, consider it empty
    // (topics may be default topics loaded on init)
    const hasNoLogs = logs.length === 0;
    const hasNoApps = apps.length === 0;

    // Check if all topics have zero practice count (meaning they're defaults)
    const allTopicsUnpracticed = topics.every(t => !t.practiceCount || t.practiceCount === 0);

    return hasNoLogs && hasNoApps && allTopicsUnpracticed;
  },

  // Fetch data from Supabase
  async fetchFromSupabase() {
    const client = this.getClient();
    if (!client) return null;

    const userId = this.getUserId();

    try {
      const { data, error } = await client
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return { exists: false, data: null };
        }
        throw error;
      }

      console.log('Fetched from Supabase:', {
        exists: true,
        dailyLogs: data.data?.dailyLogs?.length || 0,
        topics: data.data?.topics?.length || 0,
        applications: data.data?.applications?.length || 0,
        lastModified: data.data?.lastModified
      });
      return { exists: true, data: data.data };
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }
  },

  // Push data to Supabase
  async pushToSupabase(localData) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase not configured');

    const userId = this.getUserId();
    localData.lastModified = new Date().toISOString();

    try {
      const { error } = await client
        .from(this.TABLE_NAME)
        .upsert({
          user_id: userId,
          data: localData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error pushing to Supabase:', error);
      throw error;
    }
  },

  // Sync: Pull remote, merge with local, push merged result
  // This is the main sync method - does pull-merge-push in one operation
  async sync() {
    if (!this.isConfigured()) {
      this.updateSyncIndicator('not-configured');
      return false;
    }

    this._isSyncing = true;
    this.updateSyncIndicator('syncing');

    try {
      const localData = this.getLocalData();
      const result = await this.fetchFromSupabase();

      let mergedData;
      let needsReload = false;

      if (!result.exists) {
        // No remote data yet - just push local data
        console.log('No remote data found, pushing local data...');
        mergedData = { ...localData, lastModified: new Date().toISOString() };
      } else {
        const remoteData = result.data;

        console.log('Sync - merging data:', {
          localLogs: localData.dailyLogs?.length || 0,
          remoteLogs: remoteData.dailyLogs?.length || 0,
          localTopics: localData.topics?.length || 0,
          remoteTopics: remoteData.topics?.length || 0,
          localApps: localData.applications?.length || 0,
          remoteApps: remoteData.applications?.length || 0
        });

        // Merge local and remote data
        mergedData = this.mergeData(localData, remoteData);

        console.log('Merged result:', {
          logs: mergedData.dailyLogs?.length || 0,
          topics: mergedData.topics?.length || 0,
          apps: mergedData.applications?.length || 0
        });

        // Check if merged data differs from local (need to reload UI)
        // Compare visible (non-deleted) counts to detect deletion syncs
        const countVisible = (arr) => (arr || []).filter(item => !item.deleted).length;

        const localLogsVisible = countVisible(localData.dailyLogs);
        const mergedLogsVisible = countVisible(mergedData.dailyLogs);
        const localAppsVisible = countVisible(localData.applications);
        const mergedAppsVisible = countVisible(mergedData.applications);

        needsReload = (mergedLogsVisible !== localLogsVisible) || (mergedAppsVisible !== localAppsVisible);
      }

      // Save merged data locally
      this.saveToLocal(mergedData);

      // Push merged data to remote
      await this.pushToSupabase(mergedData);
      this.setLastModified(mergedData.lastModified);

      // Show green "Synced!" indicator (will auto-revert to "Sync Now" after 3s)
      this.updateSyncIndicator('synced');
      this.hideOfflineBanner();

      // Reload page if we got new data from remote
      if (needsReload) {
        console.log('New data merged, reloading page...');
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.reload();
        return true;
      }

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateSyncIndicator('error', 'Sync failed');
      this.showOfflineBanner(true, `Sync failed: ${error.message}`);
      this.showErrorPopup(
        'Sync Failed',
        'Could not sync with Supabase cloud.',
        `Error: ${error.message}\nCode: ${error.code || 'N/A'}\nDetails: ${error.details || error.hint || 'No additional details'}`
      );
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  // Manual sync trigger (called by Sync Now button)
  async manualSync() {
    return await this.sync();
  },

  // Initialize sync on page load (no auto-sync, just update indicator)
  async init() {
    console.log('Sync init starting...');

    // Auto-configure with default credentials if not already set
    this.autoConfigureDefaults();

    if (!this.isConfigured()) {
      console.log('Sync not configured');
      this.updateSyncIndicator('not-configured');
      return;
    }

    // Just show that sync is available - user must click "Sync Now" to sync
    console.log('Sync configured, ready for manual sync');
    this.updateSyncIndicator('success');
  },

  // Test connection to Supabase
  async testConnection() {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: 'Client not configured' };
    }

    try {
      // Try to query the table (will create if doesn't exist with RLS)
      const { error } = await client
        .from(this.TABLE_NAME)
        .select('user_id')
        .limit(1);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Connected successfully!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

// Alias for backwards compatibility
const githubSync = {
  isConfigured: () => {
    // Auto-configure defaults before checking
    supabaseSync.autoConfigureDefaults();
    return supabaseSync.isConfigured();
  },
  updateSyncIndicator: (status, msg) => supabaseSync.updateSyncIndicator(status, msg),
  manualSync: () => supabaseSync.manualSync(),
  init: () => supabaseSync.init()
};
