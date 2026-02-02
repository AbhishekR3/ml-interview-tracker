// Applications page logic

let editingAppId = null;
let currentFilter = 'all';
let currentSortBy = 'dateDesc';

window.addEventListener('DOMContentLoaded', async () => {
  setActiveNav('applications.html');
  await data.init();
  initializeForm();
  loadSummaryStats();
  loadApplicationsTable();
});

function initializeForm() {
  // Set default date to today
  document.getElementById('dateApplied').value = utils.getTodayDate();

  // Character count for notes
  const notesField = document.getElementById('appNotes');
  notesField.addEventListener('input', (e) => {
    document.getElementById('appCharCount').textContent = e.target.value.length;
  });

  // Form submission
  document.getElementById('appForm').addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    company: document.getElementById('company').value.trim(),
    title: document.getElementById('jobTitle').value.trim(),
    link: document.getElementById('link').value.trim(),
    dateApplied: document.getElementById('dateApplied').value,
    status: document.getElementById('status').value,
    notes: document.getElementById('appNotes').value.trim()
  };

  if (editingAppId) {
    // Update existing application
    data.updateApplication(editingAppId, formData);
    alert('Application updated successfully!');
  } else {
    // Create new application
    data.addApplication(formData);
    alert('Application added successfully!');
  }

  resetForm();
  loadSummaryStats();
  loadApplicationsTable();
}

function resetForm() {
  document.getElementById('appForm').reset();
  document.getElementById('editAppId').value = '';
  document.getElementById('dateApplied').value = utils.getTodayDate();
  document.getElementById('appCharCount').textContent = '0';
  document.getElementById('formTitle').textContent = 'Add Application';
  editingAppId = null;
}

function cancelEdit() {
  resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadSummaryStats() {
  const apps = data.getApplications();

  document.getElementById('totalApps').textContent = apps.length;
  document.getElementById('appliedCount').textContent =
    apps.filter(a => a.status === 'Applied').length;

  const interviewStatuses = ['Phone Screen', 'Technical Interview'];
  document.getElementById('interviewCount').textContent =
    apps.filter(a => interviewStatuses.includes(a.status)).length;

  document.getElementById('onsiteCount').textContent =
    apps.filter(a => a.status === 'Onsite').length;
}

function filterApplications() {
  currentFilter = document.getElementById('statusFilter').value;
  loadApplicationsTable();
}

function sortApplications() {
  currentSortBy = document.getElementById('sortBy').value;
  loadApplicationsTable();
}

function loadApplicationsTable() {
  const tbody = document.getElementById('applicationsBody');
  let apps = data.getApplications();

  // Filter
  if (currentFilter !== 'all') {
    apps = apps.filter(app => app.status === currentFilter);
  }

  // Sort
  if (currentSortBy === 'dateDesc') {
    apps.sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
  } else if (currentSortBy === 'dateAsc') {
    apps.sort((a, b) => a.dateApplied.localeCompare(b.dateApplied));
  } else if (currentSortBy === 'company') {
    apps.sort((a, b) => a.company.localeCompare(b.company));
  } else if (currentSortBy === 'status') {
    apps.sort((a, b) => a.status.localeCompare(b.status));
  }

  if (apps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No applications found. Add your first application above!</td></tr>';
    return;
  }

  const today = utils.getTodayDate();
  let html = '';

  apps.forEach(app => {
    const isStale = utils.daysBetween(app.lastUpdated, today) >= 14;
    const rowClass = isStale ? 'row-warning' : '';

    html += `
      <tr class="${rowClass}">
        <td><strong>${app.company}</strong></td>
        <td>${app.title}</td>
        <td>${utils.formatDate(app.dateApplied)}</td>
        <td>${getStatusBadge(app.status)}</td>
        <td>${utils.formatDate(app.lastUpdated)}</td>
        <td>
          <div class="btn-group">
            <a href="${app.link}" target="_blank" class="btn btn-small" style="text-decoration: none;">View</a>
            <button class="btn btn-small btn-secondary" onclick="editApplication('${app.id}')">Edit</button>
            <button class="btn btn-small btn-danger" onclick="deleteApplication('${app.id}')">Delete</button>
          </div>
        </td>
      </tr>
      ${app.notes ? `
        <tr class="${rowClass}">
          <td colspan="6" style="padding-left: 24px; font-size: 0.875rem; color: var(--gray-600);">
            <strong>Notes:</strong> ${app.notes}
          </td>
        </tr>
      ` : ''}
    `;
  });

  tbody.innerHTML = html;
}

function getStatusBadge(status) {
  const colors = {
    'Applied': '#64748b',
    'Phone Screen': '#0d9488',
    'Technical Interview': '#2563eb',
    'Onsite': '#7c3aed'
  };

  const color = colors[status] || '#64748b';

  return `<span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.875rem; font-weight: 600;">${status}</span>`;
}

function editApplication(appId) {
  const apps = data.getApplications();
  const app = apps.find(a => a.id === appId);

  if (!app) return;

  editingAppId = appId;
  document.getElementById('formTitle').textContent = 'Edit Application';
  document.getElementById('editAppId').value = appId;
  document.getElementById('company').value = app.company;
  document.getElementById('jobTitle').value = app.title;
  document.getElementById('link').value = app.link;
  document.getElementById('dateApplied').value = app.dateApplied;
  document.getElementById('status').value = app.status;
  document.getElementById('appNotes').value = app.notes || '';
  document.getElementById('appCharCount').textContent = (app.notes || '').length;

  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteApplication(appId) {
  if (confirm('Are you sure you want to delete this application?')) {
    data.deleteApplication(appId);
    loadSummaryStats();
    loadApplicationsTable();
    alert('Application deleted successfully!');
  }
}
