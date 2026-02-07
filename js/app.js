// ML Interview Prep Tracker - Core Utilities

// localStorage keys
const STORAGE_KEYS = {
  DAILY_LOGS: 'mltracker_dailyLogs',
  TOPICS: 'mltracker_topics',
  APPLICATIONS: 'mltracker_applications',
  SETTINGS: 'mltracker_settings',
  WELCOMED: 'mltracker_welcomed'
};

// Motivational quotes
const QUOTES = [
  // General motivation
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "What seems impossible today will become your warm-up tomorrow.", author: "" },
  { text: "Focus on progress, not perfection.", author: "" },
  { text: "Every master was once a disaster.", author: "T. Harv Eker" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "" },
  { text: "You are one decision away from a completely different life.", author: "" },
  { text: "The pain of discipline is nothing like the pain of disappointment.", author: "Justin Langer" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "" },
  // Sports motivation
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "I've failed over and over again in my life. And that is why I succeed.", author: "Michael Jordan" },
  { text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi" },
  { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
  { text: "The more difficult the victory, the greater the happiness in winning.", author: "Pelé" },
  { text: "You have to expect things of yourself before you can do them.", author: "Michael Jordan" },
  { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan" },
  { text: "The only way to prove you are a good sport is to lose.", author: "Ernie Banks" },
  { text: "Winners never quit and quitters never win.", author: "Vince Lombardi" },
  { text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice.", author: "Pelé" },
  { text: "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
  { text: "The will to win is important, but the will to prepare is vital.", author: "Joe Paterno" },
  { text: "Excellence is not a singular act, but a habit. You are what you repeatedly do.", author: "Shaquille O'Neal" },
  { text: "Push yourself again and again. Don't give an inch until the final buzzer sounds.", author: "Larry Bird" },
  { text: "Age is no barrier. It's a limitation you put on your mind.", author: "Jackie Joyner-Kersee" },
  { text: "Set your goals high, and don't stop till you get there.", author: "Bo Jackson" },
  { text: "Never give up! Failure and rejection are only the first step to succeeding.", author: "Jim Valvano" },
  { text: "If you can't outplay them, outwork them.", author: "Ben Hogan" },
  { text: "The principle is competing against yourself. It's about self-improvement.", author: "Steve Young" }
];

// Utility functions
const utils = {
  // Get today's date in YYYY-MM-DD format (PT timezone)
  getTodayDate() {
    // Use en-CA locale which gives YYYY-MM-DD format directly
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  },

  // Format date for display (PST timezone)
  formatDate(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  },

  // Get day of week (0 = Sunday) (PST timezone)
  getDayOfWeek(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    const pstDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    return pstDate.getDay();
  },

  // Get start of week (Sunday) for a given date (PT timezone)
  getWeekStart(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  },

  // Get days between two dates
  daysBetween(date1, date2) {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Get random quote
  getRandomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  },

  // Convert minutes to hours display
  minutesToHours(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
};

// localStorage management
const storage = {
  // Get data from localStorage
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  },

  // Set data in localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  },

  // Remove data from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  },

  // Clear all app data
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

// Data management
const data = {
  _initialized: false,

  // Initialize app data
  async init() {
    console.log('data.init() called, _initialized:', this._initialized);

    // Prevent multiple initializations
    if (this._initialized) {
      console.log('Already initialized, skipping');
      return;
    }

    // Check if topics exist, if not load from JSON
    let topics = storage.get(STORAGE_KEYS.TOPICS);
    console.log('Topics from storage:', topics ? topics.length : 'null');

    if (!topics || topics.length === 0) {
      console.log('Loading initial topics from JSON...');
      topics = await this.loadInitialTopics();
      console.log('Saving', topics.length, 'topics to localStorage');
      storage.set(STORAGE_KEYS.TOPICS, topics);
    }

    // Initialize other data structures if needed
    if (!storage.get(STORAGE_KEYS.DAILY_LOGS)) {
      storage.set(STORAGE_KEYS.DAILY_LOGS, []);
    }

    if (!storage.get(STORAGE_KEYS.APPLICATIONS)) {
      storage.set(STORAGE_KEYS.APPLICATIONS, []);
    }

    if (!storage.get(STORAGE_KEYS.SETTINGS)) {
      storage.set(STORAGE_KEYS.SETTINGS, {
        weeklyGoalHours: 14,
        dailyGoalMinutes: 30
      });
    }

    this._initialized = true;
  },

  // Load initial topics (embedded data to avoid CORS issues with file:// protocol)
  async loadInitialTopics() {
    const categories = [
      {"category": "ML Algorithms & Neural Networks", "topics": ["Random Forest", "SVM", "Naive Bayes", "k-NN", "Ensemble Methods", "k-Means", "PCA", "Clustering", "Neural Network Fundamentals", "Backpropagation", "Activation Functions", "CNNs Architecture", "Convolution & Pooling", "Transfer Learning", "RNN Fundamentals", "LSTM", "GRU", "Vanishing Gradient", "Transformers & Attention", "Self-Attention", "Multi-Head Attention", "Positional Encoding", "GANs", "Generator/Discriminator", "Mode Collapse", "Autoencoders", "VAE", "Graph Neural Networks", "Node Embeddings", "Message Passing"]},
      {"category": "Computer Vision", "topics": ["Object Detection (YOLO)", "Object Tracking (DeepSORT)", "MOTA/MOTP/IDF1", "Semantic Segmentation", "Instance Segmentation", "Amodal Segmentation", "SLAM", "Camera Calibration", "Homogeneous Coordinates", "Epipolar Geometry"]},
      {"category": "NLP & LLMs", "topics": ["Tokenization", "Word2Vec", "Subword Tokenization", "Attention Mechanisms", "RAG (Retrieval-Augmented Generation)", "Fine-tuning", "RLHF", "DPO", "Prompt Engineering", "Hallucination", "LLM Evaluation"]},
      {"category": "Statistics & Probability", "topics": ["Normal Distribution", "Binomial Distribution", "Poisson Distribution", "Hypothesis Testing", "p-values", "Type I/II Errors", "t-test", "z-test", "Chi-square", "ANOVA", "Mann-Whitney", "Wilcoxon", "Bias-Variance Tradeoff", "Chebyshev Inequality", "Markov Inequality", "Jensen's Inequality"]},
      {"category": "Model Evaluation & Validation", "topics": ["Confusion Matrix", "Precision & Recall", "F1 Score", "ROC/AUC", "Cross-Validation", "Data Drift", "Concept Drift", "Variable Selection", "AIC/BIC"]},
      {"category": "Regression & Optimization", "topics": ["Linear Regression", "Lasso (L1)", "Ridge (L2)", "Elastic Net", "Gradient Descent", "SGD", "Adam Optimizer", "MSE", "MSPE", "Cross-Entropy Loss"]},
      {"category": "Data Engineering", "topics": ["Relational Databases", "NoSQL", "Graph Databases", "Vector Databases", "Spatial Databases", "ACID Properties", "Star Schema", "Snowflake Schema", "Normalization", "B-Tree Index", "Hash Index", "Spatial Index (R-Tree)", "Clustered vs Non-clustered Index", "Sharding", "Partitioning", "Slowly Changing Dimensions", "SCD Types", "ETL Pipelines"]},
      {"category": "System Design & Architecture", "topics": ["Horizontal Scaling", "Vertical Scaling", "CAP Theorem", "Caching Strategies", "Load Balancing", "Replication", "Eventual Consistency", "Circuit Breakers", "Fault Tolerance"]},
      {"category": "Software Engineering", "topics": ["Merge Sort", "Quick Sort", "Complexity Analysis", "Binary Trees", "Heaps", "Docker", "Containerization", "CI/CD Pipelines", "Memory Management"]},
      {"category": "Behavioral & Soft Skills", "topics": ["Leadership & Influence", "Stakeholder Management", "Technical Communication", "Problem-Solving Approach", "STAR Method"]}
    ];

    console.log('Loading embedded topics data');
    const topics = [];
    categories.forEach(category => {
      category.topics.forEach(topicName => {
        topics.push({
          id: utils.generateId(),
          category: category.category,
          name: topicName,
          practiceCount: 0,
          lastPracticed: null
        });
      });
    });

    console.log('Generated topics:', topics.length);
    return topics;
  },

  // Daily logs
  getDailyLogs() {
    const logs = storage.get(STORAGE_KEYS.DAILY_LOGS) || [];
    // Filter out soft-deleted logs for display
    return logs.filter(log => !log.deleted);
  },

  // Get all logs including deleted (for sync purposes)
  getAllDailyLogs() {
    return storage.get(STORAGE_KEYS.DAILY_LOGS) || [];
  },

  addDailyLog(log) {
    // Use getAllDailyLogs to preserve deleted items
    const logs = this.getAllDailyLogs();
    log.id = utils.generateId();
    log.updatedAt = new Date().toISOString();
    logs.push(log);
    storage.set(STORAGE_KEYS.DAILY_LOGS, logs);
    return log;
  },

  updateDailyLog(logId, updatedLog) {
    // Use getAllDailyLogs to preserve deleted items
    const logs = this.getAllDailyLogs();
    const index = logs.findIndex(log => log.id === logId);
    if (index !== -1) {
      logs[index] = { ...logs[index], ...updatedLog, updatedAt: new Date().toISOString() };
      storage.set(STORAGE_KEYS.DAILY_LOGS, logs);
      return logs[index];
    }
    return null;
  },

  deleteDailyLog(logId) {
    // Use soft delete for sync support
    const logs = this.getAllDailyLogs();
    const index = logs.findIndex(log => log.id === logId);
    if (index !== -1) {
      logs[index].deleted = true;
      logs[index].deletedAt = new Date().toISOString();
      logs[index].updatedAt = new Date().toISOString();
      storage.set(STORAGE_KEYS.DAILY_LOGS, logs);
    }
  },

  getLogByDate(date) {
    const logs = this.getDailyLogs();
    return logs.find(log => log.date === date);
  },

  // Topics
  getTopics() {
    return storage.get(STORAGE_KEYS.TOPICS) || [];
  },

  incrementTopicPractice(topicId) {
    const topics = this.getTopics();
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      topic.practiceCount++;
      topic.lastPracticed = utils.getTodayDate();
      topic.updatedAt = new Date().toISOString();
      storage.set(STORAGE_KEYS.TOPICS, topics);
    }
  },

  getTopicsByCategory() {
    const topics = this.getTopics();
    const categorized = {};
    topics.forEach(topic => {
      if (!categorized[topic.category]) {
        categorized[topic.category] = [];
      }
      categorized[topic.category].push(topic);
    });
    return categorized;
  },

  // Applications
  getApplications() {
    const apps = storage.get(STORAGE_KEYS.APPLICATIONS) || [];
    // Filter out soft-deleted applications for display
    return apps.filter(app => !app.deleted);
  },

  // Get all applications including deleted (for sync purposes)
  getAllApplications() {
    return storage.get(STORAGE_KEYS.APPLICATIONS) || [];
  },

  addApplication(app) {
    // Use getAllApplications to preserve deleted items
    const apps = this.getAllApplications();
    app.id = utils.generateId();
    app.lastUpdated = app.dateApplied;
    app.updatedAt = new Date().toISOString();
    apps.push(app);
    storage.set(STORAGE_KEYS.APPLICATIONS, apps);
    return app;
  },

  updateApplication(appId, updatedApp) {
    // Use getAllApplications to preserve deleted items
    const apps = this.getAllApplications();
    const index = apps.findIndex(app => app.id === appId);
    if (index !== -1) {
      apps[index] = { ...apps[index], ...updatedApp, lastUpdated: utils.getTodayDate(), updatedAt: new Date().toISOString() };
      storage.set(STORAGE_KEYS.APPLICATIONS, apps);
      return apps[index];
    }
    return null;
  },

  deleteApplication(appId) {
    // Use soft delete for sync support
    const apps = this.getAllApplications();
    const index = apps.findIndex(app => app.id === appId);
    if (index !== -1) {
      apps[index].deleted = true;
      apps[index].deletedAt = new Date().toISOString();
      apps[index].updatedAt = new Date().toISOString();
      storage.set(STORAGE_KEYS.APPLICATIONS, apps);
    }
  },

  // Settings
  getSettings() {
    return storage.get(STORAGE_KEYS.SETTINGS) || {
      weeklyGoalHours: 14,
      dailyGoalMinutes: 30
    };
  },

  updateSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    storage.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // Welcome flag
  hasBeenWelcomed() {
    return storage.get(STORAGE_KEYS.WELCOMED) === true;
  },

  setWelcomed() {
    storage.set(STORAGE_KEYS.WELCOMED, true);
  }
};

// Analytics calculations
const analytics = {
  // Calculate current streak (unique days only)
  getCurrentStreak() {
    const logs = data.getDailyLogs();
    if (logs.length === 0) return 0;

    // Get unique dates only
    const uniqueDates = [...new Set(logs.map(log => log.date))];
    uniqueDates.sort((a, b) => b.localeCompare(a)); // Sort descending

    const today = utils.getTodayDate();
    let streak = 0;
    let expectedDate = today;

    for (let date of uniqueDates) {
      if (date === expectedDate) {
        streak++;
        // Move to previous day
        const d = new Date(expectedDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        expectedDate = d.toISOString().split('T')[0];
      } else {
        // Check if there's a gap
        const daysDiff = utils.daysBetween(date, expectedDate);
        if (daysDiff === 0) {
          // Same day, skip
          continue;
        } else {
          // Gap found, stop counting
          break;
        }
      }
    }

    return streak;
  },

  // Get daily minutes for today
  getDailyMinutes() {
    const logs = data.getDailyLogs();
    const today = utils.getTodayDate();

    let totalMinutes = 0;
    logs.forEach(log => {
      if (log.date === today) {
        totalMinutes += log.minutesSpent || 0;
      }
    });

    return totalMinutes;
  },

  // Get weekly hours (Sunday to Saturday)
  getWeeklyHours() {
    const logs = data.getDailyLogs();
    const today = utils.getTodayDate();
    const weekStart = utils.getWeekStart(today);

    let totalMinutes = 0;
    logs.forEach(log => {
      if (log.date >= weekStart && log.date <= today) {
        totalMinutes += log.minutesSpent || 0;
      }
    });

    return totalMinutes / 60;
  },

  // Get total questions answered
  getTotalQuestions() {
    const logs = data.getDailyLogs();
    let total = 0;
    logs.forEach(log => {
      if (log.resources) {
        Object.values(log.resources).forEach(count => {
          total += count || 0;
        });
      }
    });
    return total;
  },

  // Get topics covered this week
  getWeeklyTopics() {
    const logs = data.getDailyLogs();
    const today = utils.getTodayDate();
    const weekStart = utils.getWeekStart(today);

    const topicSet = new Set();
    logs.forEach(log => {
      if (log.date >= weekStart && log.date <= today && log.topics) {
        log.topics.forEach(topicId => topicSet.add(topicId));
      }
    });

    return topicSet.size;
  },

  // Get days until milestone
  getDaysUntilMilestone() {
    const settings = data.getSettings();
    if (!settings.targetDate) return null;

    const today = utils.getTodayDate();
    const days = utils.daysBetween(today, settings.targetDate);
    return days;
  },

  // Get application count for current month
  getMonthlyApplications() {
    const apps = data.getApplications();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return apps.filter(app => {
      const appDate = new Date(app.dateApplied + 'T00:00:00');
      return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
    }).length;
  },

  // Get recommended topics (least practiced in last 14 days)
  getRecommendedTopics(count = 3) {
    const topics = data.getTopics();
    const today = utils.getTodayDate();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const cutoffDate = fourteenDaysAgo.toISOString().split('T')[0];

    // Score topics: lower is higher priority
    const scoredTopics = topics.map(topic => {
      let score = topic.practiceCount;

      if (!topic.lastPracticed) {
        score = -1000; // Never practiced = highest priority
      } else if (topic.lastPracticed < cutoffDate) {
        score -= 100; // Not practiced in 14 days = high priority
      } else {
        const daysSince = utils.daysBetween(topic.lastPracticed, today);
        score -= (14 - daysSince) * 5; // Weight by recency
      }

      return { ...topic, score };
    });

    // Sort by score (ascending) and return top N
    return scoredTopics.sort((a, b) => a.score - b.score).slice(0, count);
  }
};

// Navigation helper
function setActiveNav(pageName) {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === pageName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Initialize data on page load
document.addEventListener('DOMContentLoaded', async () => {
  // IMPORTANT: Sync first BEFORE loading defaults
  // This ensures remote data is pulled before we potentially overwrite with defaults
  if (typeof githubSync !== 'undefined' && githubSync.isConfigured()) {
    console.log('Sync configured, pulling remote data first...');
    await githubSync.init();
  }

  // Now initialize local data (loads defaults only if still empty after sync)
  await data.init();

  // If sync wasn't configured initially, still set up the sync hooks
  if (typeof githubSync !== 'undefined' && !githubSync.isConfigured()) {
    // Just update the indicator, don't call full init
    if (typeof supabaseSync !== 'undefined') {
      supabaseSync.updateSyncIndicator('not-configured');
    }
  }
});
