// Supabase Sync module for ML Interview Prep Tracker

const supabaseSync = {
  // Configuration
  STORAGE_KEY_URL: 'mltracker_supabase_url',
  STORAGE_KEY_KEY: 'mltracker_supabase_key',
  STORAGE_KEY_USER_ID: 'mltracker_supabase_user_id',
  STORAGE_KEY_LAST_MODIFIED: 'mltracker_last_modified',
  TABLE_NAME: 'user_data',
  DEBOUNCE_MS: 2000,

  // Default credentials (auto-configured)
  DEFAULT_URL: 'https://mbmlnxpifjmzodzyqqog.supabase.co',
  DEFAULT_KEY: 'sb_publishable_NJwNAgMf-_ROZ-IN6LY3gg_OCjvFceL',
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
  _debounceTimer: null,
  _isSyncing: false,
  _lastSyncStatus: null,
  _subscription: null,
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
      case 'disabled':
        indicator.classList.add('not-configured');
        iconEl.textContent = '○';
        textEl.textContent = 'Local only';
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

  // Get all syncable data from localStorage
  getLocalData() {
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
    if (data.dailyLogs) storage.set(STORAGE_KEYS.DAILY_LOGS, data.dailyLogs);
    if (data.topics) storage.set(STORAGE_KEYS.TOPICS, data.topics);
    if (data.applications) storage.set(STORAGE_KEYS.APPLICATIONS, data.applications);
    if (data.settings) storage.set(STORAGE_KEYS.SETTINGS, data.settings);
    // Persist lastModified timestamp
    if (data.lastModified) {
      localStorage.setItem(this.STORAGE_KEY_LAST_MODIFIED, data.lastModified);
    }
  },

  // Get stored lastModified timestamp
  getStoredLastModified() {
    return localStorage.getItem(this.STORAGE_KEY_LAST_MODIFIED);
  },

  // Set lastModified timestamp
  setLastModified(timestamp) {
    localStorage.setItem(this.STORAGE_KEY_LAST_MODIFIED, timestamp);
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

  // Pull data from Supabase and update local if newer
  async pull() {
    if (!this.isConfigured()) {
      this.updateSyncIndicator('not-configured');
      return false;
    }

    this._isSyncing = true;
    this.updateSyncIndicator('syncing');

    try {
      const result = await this.fetchFromSupabase();

      if (!result.exists) {
        // No remote data yet - only push if local has meaningful data
        if (this.isLocalDataEmpty()) {
          console.log('No remote data and local is empty, nothing to sync');
          this.updateSyncIndicator('success');
          this.hideOfflineBanner();
        } else {
          console.log('No remote data found, pushing local data...');
          await this.push();
        }
        return true;
      }

      const remoteData = result.data;
      const localData = this.getLocalData();

      // Compare timestamps
      const remoteTime = new Date(remoteData.lastModified || 0).getTime();
      const localTime = new Date(localData.lastModified || 0).getTime();

      // If local has no timestamp (new device), always pull remote
      if (!localData.lastModified) {
        console.log('Local has no timestamp (new device), pulling remote data...');
        this.saveToLocal(remoteData);
        this.updateSyncIndicator('success');
        this.hideOfflineBanner();

        // Trigger UI refresh
        if (typeof refreshPage === 'function') {
          refreshPage();
        } else {
          window.location.reload();
        }
      } else if (remoteTime > localTime) {
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
        // Local is newer - but only push if local has meaningful data
        if (this.isLocalDataEmpty()) {
          console.log('Local appears newer but is empty, pulling remote instead...');
          this.saveToLocal(remoteData);
          this.updateSyncIndicator('success');
          this.hideOfflineBanner();

          if (typeof refreshPage === 'function') {
            refreshPage();
          } else {
            window.location.reload();
          }
        } else {
          console.log('Local data is newer, pushing to remote...');
          await this.push();
        }
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
      this.showErrorPopup(
        'Sync Failed',
        'Could not connect to Supabase cloud sync.',
        `Error: ${error.message}\nCode: ${error.code || 'N/A'}\nDetails: ${error.details || error.hint || 'No additional details'}`
      );
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  // Push local data to Supabase
  async push() {
    if (!this.isConfigured()) {
      this.updateSyncIndicator('not-configured');
      return false;
    }

    this._isSyncing = true;
    this.updateSyncIndicator('syncing');

    try {
      const localData = this.getLocalData();
      // Generate new timestamp for this push
      const newTimestamp = new Date().toISOString();
      localData.lastModified = newTimestamp;
      await this.pushToSupabase(localData);
      // Persist the timestamp locally after successful push
      this.setLastModified(newTimestamp);
      this.updateSyncIndicator('success');
      this.hideOfflineBanner();
      return true;
    } catch (error) {
      console.error('Push failed:', error);
      this.updateSyncIndicator('error', 'Sync failed');
      this.showOfflineBanner(true, `Sync failed: ${error.message}`);
      this.showErrorPopup(
        'Sync Failed',
        'Could not push data to Supabase cloud.',
        `Error: ${error.message}\nCode: ${error.code || 'N/A'}\nDetails: ${error.details || error.hint || 'No additional details'}`
      );
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

  // Set up real-time subscription
  setupRealtimeSubscription() {
    if (!this.isConfigured()) return;

    const client = this.getClient();
    if (!client) return;

    const userId = this.getUserId();

    // Unsubscribe from existing subscription
    if (this._subscription) {
      this._subscription.unsubscribe();
    }

    // Subscribe to changes for this user's data
    this._subscription = client
      .channel('user_data_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: this.TABLE_NAME,
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('Realtime update received:', payload);
        // Only pull if we're not currently syncing (to avoid loops)
        if (!this._isSyncing && payload.new && payload.new.data) {
          const remoteData = payload.new.data;
          const localData = this.getLocalData();

          const remoteTime = new Date(remoteData.lastModified || 0).getTime();
          const localTime = new Date(localData.lastModified || 0).getTime();

          // If local has no timestamp or remote is newer, update local
          if (!localData.lastModified || remoteTime > localTime) {
            console.log('Realtime: Remote is newer, updating local...');
            this.saveToLocal(remoteData);
            this.updateSyncIndicator('success');

            if (typeof refreshPage === 'function') {
              refreshPage();
            }
          }
        }
      })
      .subscribe();
  },

  // Manual sync trigger
  async manualSync() {
    return await this.pull();
  },

  // Initialize sync on page load
  async init() {
    // Auto-configure with default credentials if not already set
    this.autoConfigureDefaults();

    if (!this.isConfigured()) {
      this.updateSyncIndicator('not-configured');
      return;
    }

    // Initial pull
    await this.pull();

    // Set up real-time subscription
    this.setupRealtimeSubscription();

    // Set up auto-push when storage changes
    this._setupStorageHook();
  },

  // Hook into storage changes to auto-sync
  _setupStorageHook() {
    if (!this.isConfigured()) return;

    // Override storage.set to trigger sync
    const originalSet = storage.set;
    storage.set = (key, value) => {
      originalSet.call(storage, key, value);
      // Schedule push for data keys, but NOT when we're syncing
      // (to avoid pushing back data we just received from remote)
      if (Object.values(STORAGE_KEYS).includes(key) && !supabaseSync._isSyncing) {
        supabaseSync.schedulePush();
      }
    };
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
