// Analytics page logic

let currentPeriod = 7; // days

window.addEventListener('DOMContentLoaded', async () => {
  setActiveNav('analytics.html');
  await data.init();
  setPeriod(7);
});

function setPeriod(days) {
  currentPeriod = days;

  // Update button styles
  ['period7', 'period30', 'periodAll'].forEach(id => {
    document.getElementById(id).classList.remove('btn-secondary');
  });

  const activeButton = days === 7 ? 'period7' : days === 30 ? 'period30' : 'periodAll';
  document.getElementById(activeButton).classList.add('btn-secondary');

  loadAnalytics();
}

function loadAnalytics() {
  loadStreakStats();
  loadBurnoutInsights();
  loadTopicHeatmap();
  loadWeeklyPatterns();
  loadResourceChart();
  loadStreakCalendar();
}

function getFilteredLogs() {
  const logs = data.getDailyLogs();
  if (currentPeriod === 0) return logs;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - currentPeriod);
  const cutoffString = cutoffDate.toISOString().split('T')[0];

  return logs.filter(log => log.date >= cutoffString);
}

function loadStreakStats() {
  const logs = data.getDailyLogs();

  // Current streak
  const currentStreak = analytics.getCurrentStreak();
  document.getElementById('currentStreak').textContent = currentStreak;

  // Longest streak
  const longestStreak = calculateLongestStreak(logs);
  document.getElementById('longestStreak').textContent = longestStreak;

  // Total days logged
  const filteredLogs = getFilteredLogs();
  document.getElementById('totalDays').textContent = filteredLogs.length;

  // Average daily time
  if (filteredLogs.length > 0) {
    const totalMinutes = filteredLogs.reduce((sum, log) => sum + log.minutesSpent, 0);
    const avgMinutes = totalMinutes / filteredLogs.length;
    document.getElementById('avgDaily').textContent = utils.minutesToHours(Math.round(avgMinutes));
  } else {
    document.getElementById('avgDaily').textContent = '0h';
  }
}

function calculateLongestStreak(logs) {
  if (logs.length === 0) return 0;

  const sortedLogs = logs.sort((a, b) => a.date.localeCompare(b.date));
  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedLogs.length; i++) {
    const daysDiff = utils.daysBetween(sortedLogs[i - 1].date, sortedLogs[i].date);

    if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

function loadBurnoutInsights() {
  const container = document.getElementById('burnoutInsights');
  const logs = getFilteredLogs();
  const insights = [];

  // Check for very long sessions (3+ hours)
  const longSessions = logs.filter(log => log.minutesSpent >= 180);
  if (longSessions.length > 0) {
    insights.push({
      type: 'warning',
      message: `You've had ${longSessions.length} session(s) over 3 hours. Remember to take breaks for sustainable learning!`
    });
  }

  // Check for very long streaks
  const currentStreak = analytics.getCurrentStreak();
  if (currentStreak >= 20) {
    insights.push({
      type: 'info',
      message: `Amazing ${currentStreak}-day streak! Consider planning a rest day to recharge and prevent burnout.`
    });
  }

  // Check rolling 7-day average
  if (logs.length >= 7) {
    const recentLogs = logs.slice(-7);
    const avgMinutes = recentLogs.reduce((sum, log) => sum + log.minutesSpent, 0) / 7;

    if (avgMinutes > 180) {
      insights.push({
        type: 'warning',
        message: `Your 7-day average is ${utils.minutesToHours(Math.round(avgMinutes))} per day. Consider reducing intensity to avoid burnout.`
      });
    } else if (avgMinutes < 60 && logs.length > 7) {
      insights.push({
        type: 'info',
        message: `Your 7-day average is ${utils.minutesToHours(Math.round(avgMinutes))} per day. You might benefit from slightly longer sessions for better retention.`
      });
    }
  }

  if (insights.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  insights.forEach(insight => {
    const bgColor = insight.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                     insight.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                     'rgba(37, 99, 235, 0.1)';

    html += `
      <div class="card" style="background: ${bgColor}; border-left: 4px solid var(--${insight.type === 'warning' ? 'accent' : insight.type === 'success' ? 'success' : 'primary'});">
        <p style="margin: 0;">${insight.message}</p>
      </div>
    `;
  });

  container.innerHTML = html;
}

function loadPracticeChart() {
  const container = document.getElementById('practiceChart');
  const logs = getFilteredLogs().sort((a, b) => a.date.localeCompare(b.date));

  if (logs.length === 0) {
    container.innerHTML = '<p class="text-muted">No practice data available for this period.</p>';
    return;
  }

  const maxMinutes = Math.max(...logs.map(log => log.minutesSpent), 120);

  let html = '<div class="bar-chart">';

  logs.forEach(log => {
    const percentage = (log.minutesSpent / maxMinutes) * 100;
    const goalLine = (120 / maxMinutes) * 100;
    const meetsGoal = log.minutesSpent >= 120;

    html += `
      <div class="bar-row">
        <div class="bar-label">${utils.formatDate(log.date).replace(', ' + new Date().getFullYear(), '')}</div>
        <div class="bar-track" style="position: relative;">
          ${goalLine <= 100 ? `<div style="position: absolute; left: ${goalLine}%; top: 0; bottom: 0; width: 2px; background: red; z-index: 1;"></div>` : ''}
          <div class="bar-fill" style="width: ${percentage}%; background: ${meetsGoal ? 'var(--success)' : 'var(--primary)'};">
            ${log.minutesSpent}m
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function loadTopicHeatmap() {
  const container = document.getElementById('topicHeatmap');
  const categorized = data.getTopicsByCategory();
  const logs = getFilteredLogs();

  // Count practice by category
  const categoryCounts = {};

  logs.forEach(log => {
    if (log.topics) {
      log.topics.forEach(topicId => {
        const allTopics = data.getTopics();
        const topic = allTopics.find(t => t.id === topicId);
        if (topic) {
          categoryCounts[topic.category] = (categoryCounts[topic.category] || 0) + 1;
        }
      });
    }
  });

  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">';

  Object.keys(categorized).sort().forEach(category => {
    const count = categoryCounts[category] || 0;
    const intensity = count / maxCount;
    const bgColor = `rgba(37, 99, 235, ${0.1 + intensity * 0.9})`;
    const textColor = intensity > 0.5 ? 'white' : 'var(--text)';

    html += `
      <div style="background: ${bgColor}; color: ${textColor}; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-weight: 600; margin-bottom: 8px;">${category}</div>
        <div style="font-size: 1.5rem; font-weight: 700;">${count}</div>
        <div style="font-size: 0.875rem; opacity: 0.9;">practices</div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function loadWeeklyPatterns() {
  const container = document.getElementById('weeklyPatterns');
  const logs = data.getDailyLogs();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  logs.forEach(log => {
    const dayOfWeek = utils.getDayOfWeek(log.date);
    dayCounts[dayOfWeek]++;
  });

  const maxCount = Math.max(...dayCounts, 1);

  let html = '<div class="bar-chart">';

  dayNames.forEach((day, index) => {
    const percentage = (dayCounts[index] / maxCount) * 100;

    html += `
      <div class="bar-row">
        <div class="bar-label" style="min-width: 120px;">${day}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${percentage}%; background: var(--secondary);">
            ${dayCounts[index]} times
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function loadResourceChart() {
  const container = document.getElementById('resourceChart');
  const logs = getFilteredLogs();

  const resourceTotals = {
    applyingJobs: 0,
    interviewPrepPDF: 0,
    stratascratch: 0,
    hackerrank: 0,
    leetcode: 0,
    tryexponent: 0,
    claudeQA: 0
  };

  logs.forEach(log => {
    if (log.resources) {
      Object.keys(resourceTotals).forEach(resource => {
        resourceTotals[resource] += log.resources[resource] || 0;
      });
    }
  });

  const total = Object.values(resourceTotals).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    container.innerHTML = '<p class="text-muted">No resource data available for this period.</p>';
    return;
  }

  const resourceNames = {
    applyingJobs: 'Applying Jobs',
    interviewPrepPDF: 'Interview Prep PDF',
    stratascratch: 'Stratascratch',
    hackerrank: 'HackerRank',
    leetcode: 'LeetCode',
    tryexponent: 'TryExponent',
    claudeQA: 'Claude Q&A'
  };

  let html = '<div class="bar-chart">';

  Object.keys(resourceTotals).forEach(resource => {
    const count = resourceTotals[resource];
    if (count > 0) {
      const percentage = (count / total) * 100;

      html += `
        <div class="bar-row">
          <div class="bar-label" style="min-width: 150px;">${resourceNames[resource]}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${percentage}%; background: var(--secondary);">
              ${count} (${percentage.toFixed(1)}%)
            </div>
          </div>
        </div>
      `;
    }
  });

  html += '</div>';
  container.innerHTML = html;
}

function loadStreakCalendar() {
  const container = document.getElementById('streakCalendar');
  const logs = data.getDailyLogs();
  const todayString = utils.getTodayDate();

  // Create a map of date -> total minutes practiced
  const dateMinutes = {};
  logs.forEach(log => {
    if (!dateMinutes[log.date]) {
      dateMinutes[log.date] = 0;
    }
    dateMinutes[log.date] += log.minutesSpent || 0;
  });

  // Get color based on practice intensity
  function getColor(minutes) {
    if (minutes === 0) return 'var(--calendar-empty)';
    if (minutes < 60) return 'var(--calendar-light)'; // Light green (< 1 hour)
    if (minutes < 120) return 'var(--calendar-medium)'; // Medium green (1-2 hours)
    return 'var(--calendar-dark)'; // Dark green (2+ hours)
  }

  // Calculate start date (27 days ago, so 28 days total including today)
  const today = new Date(todayString + 'T12:00:00');
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 27);

  // Build calendar - 7x4 grid showing last 28 days
  let html = '<div class="practice-calendar">';

  // Day headers
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  html += '<div class="calendar-grid">';
  html += '<div class="calendar-row calendar-day-headers">';
  days.forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });
  html += '</div>';

  // Generate 4 weeks (28 days)
  let currentDate = new Date(startDate);

  for (let week = 0; week < 4; week++) {
    html += '<div class="calendar-row">';

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dateStr = currentDate.toLocaleDateString('en-CA');
      const dayNum = currentDate.getDate();
      const minutes = dateMinutes[dateStr] || 0;
      const bgColor = getColor(minutes);
      const isToday = dateStr === todayString;

      let tooltip = utils.formatDate(dateStr);
      if (minutes > 0) {
        tooltip += ` - ${utils.minutesToHours(minutes)}`;
      } else {
        tooltip += ' - No practice';
      }

      const cellClasses = [
        'calendar-day',
        isToday ? 'today' : ''
      ].filter(Boolean).join(' ');

      html += `
        <div class="${cellClasses}"
             style="background: ${bgColor};"
             title="${tooltip}">
          <span class="day-number">${dayNum}</span>
        </div>
      `;

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    html += '</div>';
  }

  html += '</div>'; // calendar-grid

  // Legend
  html += '<div class="calendar-legend">';
  html += '<span>Less</span>';
  html += '<div class="legend-cell" style="background: var(--gray-200);" title="No practice"></div>';
  html += '<div class="legend-cell" style="background: #86efac;" title="< 1 hour"></div>';
  html += '<div class="legend-cell" style="background: #22c55e;" title="1-2 hours"></div>';
  html += '<div class="legend-cell" style="background: #15803d;" title="2+ hours"></div>';
  html += '<span>More</span>';
  html += '</div>';

  html += '</div>'; // practice-calendar

  container.innerHTML = html;
}
