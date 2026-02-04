// Dashboard page logic

// Check if user should see welcome screen
window.addEventListener('DOMContentLoaded', async () => {
  await data.init();
  if (!data.hasBeenWelcomed()) {
    showWelcome();
  }
  loadDashboard();
  setActiveNav('index.html');
});

function showWelcome() {
  document.getElementById('welcomeScreen').classList.remove('hidden');
}

function closeWelcome() {
  document.getElementById('welcomeScreen').classList.add('hidden');
  data.setWelcomed();
}

function loadDashboard() {
  // Current date (PST timezone)
  const today = new Date();
  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Los_Angeles'
  };
  document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', dateOptions);

  // Streak
  const streak = analytics.getCurrentStreak();
  document.getElementById('streakCount').textContent = streak;
  if (streak === 0) {
    document.getElementById('streakIcon').textContent = '⚪';
  }

  const settings = data.getSettings();

  // Daily progress
  const dailyMinutes = analytics.getDailyMinutes();
  const dailyGoalMinutes = settings.dailyGoalMinutes;
  const dailyProgress = Math.min((dailyMinutes / dailyGoalMinutes) * 100, 100);
  const dailyExceeded = dailyMinutes >= dailyGoalMinutes;

  const dailyProgressBar = document.getElementById('dailyProgress');
  dailyProgressBar.style.width = dailyExceeded ? '100%' : dailyProgress + '%';
  document.getElementById('dailyProgressText').textContent =
    `${dailyMinutes} / ${dailyGoalMinutes} min`;

  if (dailyExceeded) {
    dailyProgressBar.classList.add('exceeded');
    document.getElementById('dailyStar').classList.remove('hidden');
  } else {
    dailyProgressBar.classList.remove('exceeded');
    document.getElementById('dailyStar').classList.add('hidden');
  }

  // Weekly progress
  const weeklyHours = analytics.getWeeklyHours();
  const goalHours = settings.weeklyGoalHours;
  const weeklyProgress = Math.min((weeklyHours / goalHours) * 100, 100);
  const weeklyExceeded = weeklyHours >= goalHours;

  const weeklyProgressBar = document.getElementById('weeklyProgress');
  weeklyProgressBar.style.width = weeklyExceeded ? '100%' : weeklyProgress + '%';
  document.getElementById('weeklyProgressText').textContent =
    `${weeklyHours.toFixed(1)} / ${goalHours} hours`;

  if (weeklyExceeded) {
    weeklyProgressBar.classList.add('exceeded');
    document.getElementById('weeklyStar').classList.remove('hidden');
  } else {
    weeklyProgressBar.classList.remove('exceeded');
    document.getElementById('weeklyStar').classList.add('hidden');
  }

  // Week calendar
  loadWeekCalendar();

  // Random quote
  const quote = utils.getRandomQuote();
  document.getElementById('quoteText').textContent = `"${quote.text}"`;
  document.getElementById('quoteAuthor').textContent = quote.author ? `— ${quote.author}` : '';

  // Today's focus
  loadTodaysFocus();

  // Quick stats
  document.getElementById('totalQuestions').textContent = analytics.getTotalQuestions();
  document.getElementById('weeklyTopics').textContent = analytics.getWeeklyTopics();
  document.getElementById('monthlyApps').textContent = analytics.getMonthlyApplications();
}

function loadWeekCalendar() {
  const container = document.getElementById('weekCalendar');
  container.innerHTML = '';

  const today = utils.getTodayDate();
  const weekStart = utils.getWeekStart(today);
  const logs = data.getDailyLogs();

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart + 'T00:00:00');
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    const hasLog = logs.some(log => log.date === dateString);

    const dayBox = document.createElement('div');
    dayBox.className = 'day-box' + (hasLog ? ' active' : '');
    dayBox.innerHTML = `
      <span class="day-label">${days[i]}</span>
      <span class="day-indicator">${hasLog ? '✓' : '—'}</span>
    `;

    container.appendChild(dayBox);
  }
}

function loadTodaysFocus() {
  const container = document.getElementById('todaysFocus');
  const recommended = analytics.getRecommendedTopics(3);

  if (recommended.length === 0) {
    container.innerHTML = '<p class="text-muted">Start logging your practice to get personalized recommendations!</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
  recommended.forEach(topic => {
    const status = getTopicStatus(topic);
    const statusClass = status === 'never' || status === 'old' ? 'status-red' :
                        status === 'recent' ? 'status-yellow' : 'status-green';

    const lastPracticed = topic.lastPracticed
      ? `Last: ${utils.formatDate(topic.lastPracticed)}`
      : 'Never practiced';

    html += `
      <div class="topic-item ${statusClass}">
        <div class="topic-name">${topic.name}</div>
        <div class="topic-stats">
          ${topic.category} • Practiced ${topic.practiceCount}x • ${lastPracticed}
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

function getTopicStatus(topic) {
  if (!topic.lastPracticed) return 'never';

  const today = utils.getTodayDate();
  const daysSince = utils.daysBetween(topic.lastPracticed, today);

  if (daysSince <= 7) return 'current';
  if (daysSince <= 14) return 'recent';
  return 'old';
}

function resetData() {
  const confirmed = confirm(
    '⚠️ WARNING: This will permanently delete ALL your data including logs, topics, and applications. This cannot be undone!\n\nAre you absolutely sure you want to reset everything?'
  );

  if (confirmed) {
    const doubleCheck = confirm('Last chance! Click OK to permanently delete all data.');
    if (doubleCheck) {
      storage.clearAll();
      alert('All data has been reset. The page will now reload.');
      window.location.reload();
    }
  }
}
