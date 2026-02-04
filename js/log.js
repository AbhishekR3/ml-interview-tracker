// Daily Log page logic

let editingLogId = null;

window.addEventListener('DOMContentLoaded', async () => {
  setActiveNav('log.html');
  await data.init();
  initializeForm();
  loadLogHistory();
});

function initializeForm() {
  // Set default date to today
  document.getElementById('logDate').value = utils.getTodayDate();

  // Load topics into select
  loadTopicsSelect();

  // Topic search functionality
  const topicSearch = document.getElementById('topicSearch');
  topicSearch.addEventListener('input', (e) => {
    filterTopics(e.target.value);
  });

  // Show selected topics
  const topicSelect = document.getElementById('topicSelect');
  topicSelect.addEventListener('change', updateSelectedTopicsDisplay);

  // Character count for notes
  const notesField = document.getElementById('notes');
  notesField.addEventListener('input', (e) => {
    document.getElementById('charCount').textContent = e.target.value.length;
  });

  // Form submission
  document.getElementById('logForm').addEventListener('submit', handleFormSubmit);
}

function loadTopicsSelect() {
  console.log('loadTopicsSelect() called');
  const select = document.getElementById('topicSelect');
  const allTopics = data.getTopics();
  // Filter out completed topics (in Casual Revision)
  const topics = allTopics.filter(t => !t.completed);
  console.log('Active topics:', topics.length);

  // Group by category
  const categorized = {};
  topics.forEach(topic => {
    if (!categorized[topic.category]) {
      categorized[topic.category] = [];
    }
    categorized[topic.category].push(topic);
  });
  console.log('Categories:', Object.keys(categorized));

  select.innerHTML = '';

  Object.keys(categorized).sort().forEach(category => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category;

    categorized[category].sort((a, b) => a.name.localeCompare(b.name)).forEach(topic => {
      const option = document.createElement('option');
      option.value = topic.id;
      option.textContent = topic.name;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });

  console.log('Select element children:', select.children.length);
}

function filterTopics(searchTerm) {
  const select = document.getElementById('topicSelect');
  const searchLower = searchTerm.toLowerCase();

  Array.from(select.options).forEach(option => {
    const text = option.textContent.toLowerCase();
    const parentGroup = option.parentElement;

    if (text.includes(searchLower) || parentGroup.label.toLowerCase().includes(searchLower)) {
      option.style.display = '';
    } else {
      option.style.display = 'none';
    }
  });

  // Hide empty optgroups
  Array.from(select.getElementsByTagName('optgroup')).forEach(group => {
    const visibleOptions = Array.from(group.options).filter(opt => opt.style.display !== 'none');
    group.style.display = visibleOptions.length > 0 ? '' : 'none';
  });
}

function updateSelectedTopicsDisplay() {
  const select = document.getElementById('topicSelect');
  const display = document.getElementById('selectedTopicsDisplay');
  const selectedOptions = Array.from(select.selectedOptions);

  if (selectedOptions.length === 0) {
    display.innerHTML = '';
    return;
  }

  const topicNames = selectedOptions.map(opt => opt.textContent);
  display.innerHTML = `<strong>Selected (${selectedOptions.length}):</strong> ${topicNames.join(', ')}`;
}

function setMinutes(minutes) {
  document.getElementById('minutesSpent').value = minutes;
}

function toggleResource(resourceName) {
  const checkbox = document.getElementById(`use${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}`);
  const input = document.getElementById(resourceName);
  input.disabled = !checkbox.checked;
  if (!checkbox.checked) {
    input.value = 0;
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    date: document.getElementById('logDate').value,
    minutesSpent: parseInt(document.getElementById('minutesSpent').value),
    resources: {
      interviewPrepPDF: parseInt(document.getElementById('interviewPrepPDF').value) || 0,
      stratascratch: parseInt(document.getElementById('stratascratch').value) || 0,
      hackerrank: parseInt(document.getElementById('hackerrank').value) || 0,
      leetcode: parseInt(document.getElementById('leetcode').value) || 0,
      tryexponent: parseInt(document.getElementById('tryexponent').value) || 0,
      claudeQA: parseInt(document.getElementById('claudeQA').value) || 0
    },
    topics: Array.from(document.getElementById('topicSelect').selectedOptions).map(opt => opt.value),
    notes: document.getElementById('notes').value.trim()
  };

  // Topic stats are recalculated from logs on the Topics page

  if (editingLogId) {
    // Update existing log
    data.updateDailyLog(editingLogId, formData);
    alert('Log updated successfully!');
  } else {
    // Create new log
    data.addDailyLog(formData);
    alert('Log saved successfully!');
  }

  resetForm();
  loadLogHistory();
}

function resetForm() {
  document.getElementById('logForm').reset();
  document.getElementById('editLogId').value = '';
  document.getElementById('logDate').value = utils.getTodayDate();
  document.getElementById('charCount').textContent = '0';
  document.getElementById('formTitle').textContent = 'Log Practice Session';
  editingLogId = null;

  // Disable all resource inputs
  ['interviewPrepPDF', 'stratascratch', 'hackerrank', 'leetcode', 'tryexponent', 'claudeQA'].forEach(resource => {
    document.getElementById(resource).disabled = true;
    document.getElementById(resource).value = 0;
  });
}

function cancelEdit() {
  resetForm();
}

function loadLogHistory() {
  const container = document.getElementById('logHistory');
  const logs = data.getDailyLogs();

  if (logs.length === 0) {
    container.innerHTML = '<p class="text-muted">No practice logs yet. Start by logging your first session above!</p>';
    return;
  }

  // Sort by date descending and take last 30 days
  const sortedLogs = logs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const settings = data.getSettings();

  let html = '';
  sortedLogs.forEach(log => {
    const totalQuestions = Object.values(log.resources).reduce((sum, count) => sum + count, 0);
    const goalMet = log.minutesSpent >= settings.dailyGoalMinutes;
    const topicNames = getTopicNames(log.topics);

    html += `
      <div class="log-entry ${goalMet ? 'goal-met' : ''}">
        <div class="log-header">
          <span class="log-date">${utils.formatDate(log.date)}</span>
          <div class="btn-group">
            <button class="btn btn-small btn-secondary" onclick="editLog('${log.id}')">Edit</button>
            <button class="btn btn-small btn-danger" onclick="deleteLog('${log.id}')">Delete</button>
          </div>
        </div>
        <div class="log-details">
          <strong>Time:</strong> ${utils.minutesToHours(log.minutesSpent)} ${goalMet ? '✓ Goal met!' : ''}<br>
          <strong>Questions:</strong> ${totalQuestions} total
          ${formatResourceBreakdown(log.resources)}<br>
          ${topicNames.length > 0 ? `<strong>Topics:</strong> ${topicNames.join(', ')}<br>` : ''}
          ${log.notes ? `<strong>Notes:</strong><div class="log-notes">${log.notes.replace(/\n/g, '<br>')}</div>` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function formatResourceBreakdown(resources) {
  const used = [];
  if (resources.interviewPrepPDF > 0) used.push(`PDF: ${resources.interviewPrepPDF}`);
  if (resources.stratascratch > 0) used.push(`Stratascratch: ${resources.stratascratch}`);
  if (resources.hackerrank > 0) used.push(`HackerRank: ${resources.hackerrank}`);
  if (resources.leetcode > 0) used.push(`LeetCode: ${resources.leetcode}`);
  if (resources.tryexponent > 0) used.push(`TryExponent: ${resources.tryexponent}`);
  if (resources.claudeQA > 0) used.push(`Claude Q&A: ${resources.claudeQA}`);

  return used.length > 0 ? ` (${used.join(', ')})` : '';
}

function getTopicNames(topicIds) {
  if (!topicIds || topicIds.length === 0) return [];

  const allTopics = data.getTopics();
  const names = [];

  topicIds.forEach(id => {
    const topic = allTopics.find(t => t.id === id);
    if (topic) names.push(topic.name);
  });

  return names;
}

function editLog(logId) {
  const logs = data.getDailyLogs();
  const log = logs.find(l => l.id === logId);

  if (!log) return;

  editingLogId = logId;
  document.getElementById('formTitle').textContent = 'Edit Practice Session';
  document.getElementById('editLogId').value = logId;
  document.getElementById('logDate').value = log.date;
  document.getElementById('minutesSpent').value = log.minutesSpent;

  // Set resources
  Object.keys(log.resources).forEach(resource => {
    const count = log.resources[resource];
    if (count > 0) {
      const checkboxId = `use${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
      document.getElementById(checkboxId).checked = true;
      document.getElementById(resource).disabled = false;
      document.getElementById(resource).value = count;
    }
  });

  // Set topics
  const topicSelect = document.getElementById('topicSelect');
  Array.from(topicSelect.options).forEach(option => {
    option.selected = log.topics && log.topics.includes(option.value);
  });
  updateSelectedTopicsDisplay();

  // Set notes
  document.getElementById('notes').value = log.notes || '';
  document.getElementById('charCount').textContent = (log.notes || '').length;

  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteLog(logId) {
  if (confirm('Are you sure you want to delete this log entry?')) {
    data.deleteDailyLog(logId);
    loadLogHistory();
    alert('Log deleted successfully!');
  }
}
