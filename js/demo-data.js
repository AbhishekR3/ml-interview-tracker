// Demo data loader for testing

function loadDemoData() {
  const confirmed = confirm('This will load sample data for testing. Any existing data will be preserved. Continue?');
  if (!confirmed) return;

  // Generate demo daily logs (last 30 days with some gaps)
  const today = new Date();
  const demoLogs = [];

  for (let i = 29; i >= 0; i--) {
    // Skip some days randomly to create realistic gaps
    if (Math.random() > 0.7) continue;

    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Random practice time between 30-180 minutes
    const minutesSpent = 30 + Math.floor(Math.random() * 151);

    // Random resource usage
    const resources = {
      interviewPrepPDF: Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0,
      stratascratch: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
      hackerrank: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
      leetcode: Math.random() > 0.4 ? Math.floor(Math.random() * 8) : 0,
      tryexponent: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
      claudeQA: Math.random() > 0.5 ? 5 : 0
    };

    // Random topics (3-7 topics per session)
    const allTopics = data.getTopics();
    const topicCount = 3 + Math.floor(Math.random() * 5);
    const selectedTopics = [];

    for (let j = 0; j < topicCount; j++) {
      const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
      if (!selectedTopics.includes(randomTopic.id)) {
        selectedTopics.push(randomTopic.id);
      }
    }

    const notes = Math.random() > 0.6 ? getDemoNote() : '';

    demoLogs.push({
      id: utils.generateId(),
      date: dateString,
      minutesSpent,
      resources,
      topics: selectedTopics,
      notes
    });

    // Update topic practice counts
    selectedTopics.forEach(topicId => {
      const topics = data.getTopics();
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        topic.practiceCount++;
        topic.lastPracticed = dateString;
      }
    });
  }

  // Save demo logs
  const existingLogs = data.getDailyLogs();
  storage.set(STORAGE_KEYS.DAILY_LOGS, [...existingLogs, ...demoLogs]);

  // Update topics
  storage.set(STORAGE_KEYS.TOPICS, data.getTopics());

  // Generate demo applications
  const demoApps = [
    {
      id: utils.generateId(),
      company: 'Google',
      title: 'ML Engineer, Search',
      link: 'https://careers.google.com',
      dateApplied: getDateDaysAgo(25),
      status: 'Technical Interview',
      lastUpdated: getDateDaysAgo(5),
      notes: 'System design focus, need to review distributed ML'
    },
    {
      id: utils.generateId(),
      company: 'Meta',
      title: 'Machine Learning Engineer',
      link: 'https://www.metacareers.com',
      dateApplied: getDateDaysAgo(20),
      status: 'Phone Screen',
      lastUpdated: getDateDaysAgo(15),
      notes: ''
    },
    {
      id: utils.generateId(),
      company: 'OpenAI',
      title: 'ML Research Engineer',
      link: 'https://openai.com/careers',
      dateApplied: getDateDaysAgo(18),
      status: 'Applied',
      lastUpdated: getDateDaysAgo(18),
      notes: 'Dream company, really hope to hear back'
    },
    {
      id: utils.generateId(),
      company: 'Stripe',
      title: 'Machine Learning Engineer',
      link: 'https://stripe.com/jobs',
      dateApplied: getDateDaysAgo(15),
      status: 'Rejected',
      lastUpdated: getDateDaysAgo(8),
      notes: 'Good interview experience, need to improve coding speed'
    },
    {
      id: utils.generateId(),
      company: 'Anthropic',
      title: 'ML Engineer, Safety',
      link: 'https://www.anthropic.com/careers',
      dateApplied: getDateDaysAgo(12),
      status: 'Onsite',
      lastUpdated: getDateDaysAgo(3),
      notes: 'Very excited about the mission! Interview went well.'
    },
    {
      id: utils.generateId(),
      company: 'Databricks',
      title: 'Senior ML Engineer',
      link: 'https://databricks.com/company/careers',
      dateApplied: getDateDaysAgo(10),
      status: 'Applied',
      lastUpdated: getDateDaysAgo(10),
      notes: ''
    },
    {
      id: utils.generateId(),
      company: 'Scale AI',
      title: 'ML Engineer',
      link: 'https://scale.com/careers',
      dateApplied: getDateDaysAgo(8),
      status: 'Phone Screen',
      lastUpdated: getDateDaysAgo(2),
      notes: 'Phone screen scheduled for next week'
    },
    {
      id: utils.generateId(),
      company: 'Airbnb',
      title: 'ML Engineer, Personalization',
      link: 'https://careers.airbnb.com',
      dateApplied: getDateDaysAgo(5),
      status: 'Applied',
      lastUpdated: getDateDaysAgo(5),
      notes: 'Interesting team working on recommendation systems'
    }
  ];

  const existingApps = data.getApplications();
  storage.set(STORAGE_KEYS.APPLICATIONS, [...existingApps, ...demoApps]);

  // Set a target date if not already set
  const settings = data.getSettings();
  if (!settings.targetDate) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 45);
    settings.targetDate = targetDate.toISOString().split('T')[0];
    storage.set(STORAGE_KEYS.SETTINGS, settings);
  }

  alert('Demo data loaded successfully! The page will now reload.');
  window.location.reload();
}

function getDemoNote() {
  const notes = [
    'Feeling good about progress today',
    'Need to review this topic again',
    'Struggled with some edge cases',
    'Great session, very productive',
    'A bit tired but pushed through',
    'Reviewed weak areas',
    'Mock interview went well',
    'Need more practice with this',
    'Breakthrough moment today!',
    'Solidifying fundamentals'
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Add keyboard shortcut to load demo data (Ctrl/Cmd + Shift + D)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    loadDemoData();
  }
});
