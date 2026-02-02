// Topics page logic

let currentSort = 'category';

window.addEventListener('DOMContentLoaded', async () => {
  setActiveNav('topics.html');
  await data.init();
  loadTopicsSummary();
  loadTopicsList();
});

function loadTopicsSummary() {
  const topics = data.getTopics();
  const totalTopics = topics.length;
  const practicedTopics = topics.filter(t => t.practiceCount > 0).length;
  const coveragePercent = totalTopics > 0 ? Math.round((practicedTopics / totalTopics) * 100) : 0;

  document.getElementById('totalTopics').textContent = totalTopics;
  document.getElementById('practicedTopics').textContent = practicedTopics;
  document.getElementById('coveragePercent').textContent = coveragePercent + '%';
  document.getElementById('coverageProgress').style.width = coveragePercent + '%';

  // Count by status
  const today = utils.getTodayDate();
  let greenCount = 0, yellowCount = 0, redCount = 0;

  topics.forEach(topic => {
    const status = getTopicStatus(topic, today);
    if (status === 'green') greenCount++;
    else if (status === 'yellow') yellowCount++;
    else redCount++;
  });

  document.getElementById('greenCount').textContent = greenCount;
  document.getElementById('yellowCount').textContent = yellowCount;
  document.getElementById('redCount').textContent = redCount;
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
  const topics = data.getTopics();
  const today = utils.getTodayDate();

  if (currentSort === 'category') {
    loadTopicsByCategory(container, topics, today);
  } else {
    loadTopicsFlat(container, topics, today);
  }
}

function loadTopicsByCategory(container, topics, today) {
  const categorized = data.getTopicsByCategory();
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
          ${categoryTopics.map(topic => renderTopicItem(topic, today)).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function loadTopicsFlat(container, topics, today) {
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
  html += sortedTopics.map(topic => renderTopicItem(topic, today)).join('');
  html += '</div></div>';

  container.innerHTML = html;
}

function renderTopicItem(topic, today) {
  const status = getTopicStatus(topic, today);
  const statusClass = `status-${status}`;

  const lastPracticed = topic.lastPracticed
    ? `Last: ${utils.formatDate(topic.lastPracticed)}`
    : 'Never practiced';

  return `
    <div class="topic-item ${statusClass}" onclick="incrementTopic('${topic.id}')">
      <div class="topic-name">${topic.name}</div>
      <div class="topic-stats">
        ${topic.category} • Practiced ${topic.practiceCount}x • ${lastPracticed}
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

function incrementTopic(topicId) {
  data.incrementTopicPractice(topicId);
  loadTopicsSummary();
  loadTopicsList();

  // Show brief feedback
  const topic = data.getTopics().find(t => t.id === topicId);
  if (topic) {
    showToast(`✓ ${topic.name} - Practice count: ${topic.practiceCount}`);
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
