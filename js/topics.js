// Topics page logic

let currentSort = 'category';

window.addEventListener('DOMContentLoaded', async () => {
  setActiveNav('topics.html');
  await data.init();
  recalculateTopicStatsFromLogs();
  loadTopicsSummary();
  loadTopicsList();
});

// Recalculate topic stats from daily logs (source of truth)
function recalculateTopicStatsFromLogs() {
  const logs = data.getDailyLogs();
  const topics = data.getTopics();

  // Reset all topic stats (except completed status)
  topics.forEach(topic => {
    topic.practiceCount = 0;
    topic.lastPracticed = null;
  });

  // Recalculate from logs
  logs.forEach(log => {
    if (log.topics && log.topics.length > 0) {
      log.topics.forEach(topicId => {
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
          topic.practiceCount++;
          if (!topic.lastPracticed || log.date > topic.lastPracticed) {
            topic.lastPracticed = log.date;
          }
        }
      });
    }
  });

  // Save updated topics
  storage.set(STORAGE_KEYS.TOPICS, topics);
}

function loadTopicsSummary() {
  const topics = data.getTopics();
  const activeTopics = topics.filter(t => !t.completed);
  const completedTopics = topics.filter(t => t.completed);

  const totalTopics = activeTopics.length;
  const practicedTopics = activeTopics.filter(t => t.practiceCount > 0).length;
  const coveragePercent = totalTopics > 0 ? Math.round((practicedTopics / totalTopics) * 100) : 0;

  document.getElementById('totalTopics').textContent = totalTopics;
  document.getElementById('practicedTopics').textContent = practicedTopics;
  document.getElementById('coveragePercent').textContent = coveragePercent + '%';
  document.getElementById('coverageProgress').style.width = coveragePercent + '%';

  // Count by status (only active topics)
  const today = utils.getTodayDate();
  let greenCount = 0, yellowCount = 0, redCount = 0;

  activeTopics.forEach(topic => {
    const status = getTopicStatus(topic, today);
    if (status === 'green') greenCount++;
    else if (status === 'yellow') yellowCount++;
    else redCount++;
  });

  document.getElementById('greenCount').textContent = greenCount;
  document.getElementById('yellowCount').textContent = yellowCount;
  document.getElementById('redCount').textContent = redCount;

  // Update completed count if element exists
  const completedCountEl = document.getElementById('completedCount');
  if (completedCountEl) {
    completedCountEl.textContent = completedTopics.length;
  }
}

function getTopicStatus(topic, today) {
  if (!topic.lastPracticed) return 'red';

  const daysSince = utils.daysBetween(topic.lastPracticed, today);

  if (daysSince <= 7) return 'green';
  if (daysSince <= 14) return 'yellow';
  return 'red';
}

function loadTopicsList() {
  const container = document.getElementById('topicsList');
  const allTopics = data.getTopics();
  const activeTopics = allTopics.filter(t => !t.completed);
  const completedTopics = allTopics.filter(t => t.completed);
  const today = utils.getTodayDate();

  let html = '';

  // Active topics
  if (currentSort === 'category') {
    html += loadTopicsByCategory(activeTopics, today, false);
  } else {
    html += loadTopicsFlat(activeTopics, today, false);
  }

  // Casual Revision section (completed topics)
  if (completedTopics.length > 0) {
    html += `
      <div class="topic-category casual-revision-section">
        <div class="category-header casual-revision-header" onclick="toggleCategory('casual-revision')">
          <span>Casual Revision (${completedTopics.length} topics)</span>
          <span id="arrow-casual-revision">▶</span>
        </div>
        <div class="topic-list collapsed" id="category-casual-revision">
          ${completedTopics.map(topic => renderTopicItem(topic, today, true)).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function loadTopicsByCategory(topics, today, isCompleted) {
  // Group topics by category
  const categorized = {};
  topics.forEach(topic => {
    if (!categorized[topic.category]) {
      categorized[topic.category] = [];
    }
    categorized[topic.category].push(topic);
  });

  let html = '';

  Object.keys(categorized).sort().forEach(category => {
    const categoryTopics = categorized[category];

    html += `
      <div class="topic-category">
        <div class="category-header" onclick="toggleCategory('${sanitizeId(category)}')">
          <span>${category} (${categoryTopics.length} topics)</span>
          <span id="arrow-${sanitizeId(category)}">▼</span>
        </div>
        <div class="topic-list" id="category-${sanitizeId(category)}">
          ${categoryTopics.map(topic => renderTopicItem(topic, today, isCompleted)).join('')}
        </div>
      </div>
    `;
  });

  return html;
}

function loadTopicsFlat(topics, today, isCompleted) {
  let sortedTopics = [...topics];

  if (currentSort === 'alphabetical') {
    sortedTopics.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === 'leastPracticed') {
    sortedTopics.sort((a, b) => a.practiceCount - b.practiceCount);
  } else if (currentSort === 'oldestPracticed') {
    sortedTopics.sort((a, b) => {
      if (!a.lastPracticed && !b.lastPracticed) return 0;
      if (!a.lastPracticed) return -1;
      if (!b.lastPracticed) return 1;
      return a.lastPracticed.localeCompare(b.lastPracticed);
    });
  }

  let html = '<div class="card"><div class="topic-list">';
  html += sortedTopics.map(topic => renderTopicItem(topic, today, isCompleted)).join('');
  html += '</div></div>';

  return html;
}

function renderTopicItem(topic, today, isCompleted) {
  const status = getTopicStatus(topic, today);
  const statusClass = isCompleted ? 'status-completed' : `status-${status}`;

  const lastPracticed = topic.lastPracticed
    ? `Last: ${utils.formatDate(topic.lastPracticed)}`
    : 'Never practiced';

  const actionButton = isCompleted
    ? `<button class="btn btn-small btn-secondary topic-action-btn" onclick="event.stopPropagation(); restoreTopic('${topic.id}')" title="Restore to active">↩</button>`
    : `<button class="btn btn-small topic-action-btn" onclick="event.stopPropagation(); markAsCompleted('${topic.id}')" title="Mark as casual revision">✓</button>`;

  return `
    <div class="topic-item ${statusClass}">
      <div class="topic-content">
        <div class="topic-name">${topic.name}</div>
        <div class="topic-stats">
          ${topic.category} • Practiced ${topic.practiceCount}x • ${lastPracticed}
        </div>
      </div>
      <div class="topic-actions">
        ${actionButton}
      </div>
    </div>
  `;
}

function sanitizeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '-');
}

function toggleCategory(categoryId) {
  const content = document.getElementById(`category-${categoryId}`);
  const arrow = document.getElementById(`arrow-${categoryId}`);

  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    arrow.textContent = '▼';
  } else {
    content.classList.add('collapsed');
    arrow.textContent = '▶';
  }
}

function markAsCompleted(topicId) {
  const topics = data.getTopics();
  const topic = topics.find(t => t.id === topicId);
  if (topic) {
    topic.completed = true;
    topic.updatedAt = new Date().toISOString();
    storage.set(STORAGE_KEYS.TOPICS, topics);
    loadTopicsSummary();
    loadTopicsList();
    showToast(`✓ "${topic.name}" moved to Casual Revision`);
  }
}

function restoreTopic(topicId) {
  const topics = data.getTopics();
  const topic = topics.find(t => t.id === topicId);
  if (topic) {
    topic.completed = false;
    topic.updatedAt = new Date().toISOString();
    storage.set(STORAGE_KEYS.TOPICS, topics);
    loadTopicsSummary();
    loadTopicsList();
    showToast(`↩ "${topic.name}" restored to active topics`);
  }
}

function showToast(message) {
  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #10b981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

function sortTopics(sortType) {
  currentSort = sortType;
  loadTopicsList();
}
