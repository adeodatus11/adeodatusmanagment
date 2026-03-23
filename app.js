/**
 * AMS – System Zarządzania Działalnością
 * Frontend Logic for Static Dashboard
 */

// --- DATA INITIALIZATION ---
let storage = {
  areas: [],
  projects: [],
  tasks: [],
  logs: [],
  contacts: [],
  events: []
};

function loadFromStorage() {
  const saved = localStorage.getItem('ams_data');
  if (saved) {
    storage = JSON.parse(saved);
  } else {
    seedInitialData();
  }
}

function saveToStorage() {
  localStorage.setItem('ams_data', JSON.stringify(storage));
  updateUI();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function clearInputs(parent) {
    parent.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.type === 'checkbox') el.checked = false;
        else if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
}

function seedInitialData() {
  storage.areas = [
    { id: 'a1', name: 'WIN4SMEs', color: '#6366f1', desc: 'Projekt WIN4SMEs' },
    { id: 'a2', name: 'COVE Polska', color: '#10b981', desc: 'Centra Doskonałości Zawodowej' }
  ];
  storage.projects = [
    { id: 'p1', areaId: 'a1', name: 'Zarządzanie WP1', status: 'W toku', priority: 'Wysoki' }
  ];
  saveToStorage();
}

// --- UTILS ---
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL');
}

function getStatusClass(status) {
  const map = {
    'Pomysł': 'status-idea',
    'Do decyzji': 'status-decide',
    'Zaplanowane': 'status-planned',
    'W toku': 'status-inprogress',
    'Czekam na kogoś': 'status-waiting',
    'Zablokowane': 'status-blocked',
    'Do poprawy': 'status-revision',
    'Gotowe': 'status-done',
    'Archiwum': 'status-archive'
  };
  return map[status] || '';
}

// --- VIEW NAVIGATION ---
function showView(viewId, filter = null) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewId}`).classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) navItem.classList.add('active');

  if (viewId === 'dashboard') renderDashboard();
  if (viewId === 'areas') renderAreas();
  if (viewId === 'projects') renderProjects();
  if (viewId === 'tasks') renderTasks(filter);
  if (viewId === 'log') renderLog();
  if (viewId === 'contacts') renderContacts();
  if (viewId === 'calendar') renderEvents();
}

// --- MODAL MANAGEMENT ---
function openModal(modalId) {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById(`modal-${modalId}`).classList.add('open');
  
  // Populate select boxes if needed
  if (modalId === 'addProject') populateAreaSelect('proj-area');
  if (modalId === 'addTask') {
    populateProjectSelect('task-project');
    populateContactSelect('task-contact');
  }
}

function closeAllModals() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}

// --- RENDERERS ---
function renderDashboard() {
  const now = new Date();
  document.getElementById('today-date').innerText = now.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  const overdue = storage.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Gotowe');
  document.getElementById('kpi-overdue').innerText = overdue.length;
  
  const inNext7Days = storage.tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  document.getElementById('kpi-week').innerText = inNext7Days.length;
  
  const waiting = storage.tasks.filter(t => t.status === 'Czekam na kogoś');
  document.getElementById('kpi-waiting').innerText = waiting.length;
  
  const activeProjects = storage.projects.filter(p => ['W toku', 'Zaplanowane'].includes(p.status));
  document.getElementById('kpi-active').innerText = activeProjects.length;

  // Render small lists
  renderList('widget-overdue-tasks', overdue.slice(0, 5), 'task');
  renderList('widget-week-tasks', inNext7Days.slice(0, 5), 'task');
  renderList('widget-waiting-tasks', waiting.slice(0, 5), 'task');
  renderList('widget-active-projects', activeProjects.slice(0, 5), 'project');
  renderList('widget-recent-log', storage.logs.slice(-5).reverse(), 'log');
  renderList('widget-events', storage.events.slice(0, 5), 'event');
}

function renderList(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state-small">Brak danych</div>';
    return;
  }

  container.innerHTML = items.map(item => {
    if (type === 'task') {
      return `<div class="widget-item" onclick="openDetail('task', '${item.id}')">
        <div class="widget-dot" style="background: ${getAreaColorForProject(item.projectId)}"></div>
        <div class="widget-item-info">
          <div class="widget-item-name">${item.name}</div>
          <div class="widget-item-meta">${formatDate(item.dueDate)}</div>
        </div>
      </div>`;
    }
    if (type === 'project') {
      return `<div class="widget-item" onclick="showView('projects')">
        <div class="widget-dot" style="background: ${getAreaColor(item.areaId)}"></div>
        <div class="widget-item-info">
          <div class="widget-item-name">${item.name}</div>
          <div class="widget-item-meta">${item.status}</div>
        </div>
      </div>`;
    }
    if (type === 'log') {
        return `<div class="widget-item">
          <div class="widget-item-info">
            <div class="widget-item-name">${item.desc}</div>
            <div class="widget-item-meta">${formatDate(item.date)}</div>
          </div>
        </div>`;
    }
    return '';
  }).join('');
}

function renderAreas() {
  const grid = document.getElementById('areas-grid');
  grid.innerHTML = storage.areas.map(a => `
    <div class="area-card" style="--area-color: ${a.color}">
      <div class="area-name">${a.name}</div>
      <div class="area-desc">${a.desc || ''}</div>
    </div>
  `).join('');
}

function renderProjects() {
  const list = document.getElementById('projects-list');
  const areaFilter = document.getElementById('filter-area').value;
  const statusFilter = document.getElementById('filter-proj-status').value;

  const filtered = storage.projects.filter(p => {
    if (areaFilter && p.areaId !== areaFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  list.innerHTML = filtered.map(p => `
    <div class="task-card">
      <div class="task-card-left">
        <div class="task-card-name">${p.name}</div>
        <div class="task-card-meta">
          <span>${getAreaName(p.areaId)}</span>
        </div>
      </div>
      <div class="task-card-right">
        <span class="badge ${getStatusClass(p.status)}">${p.status}</span>
      </div>
    </div>
  `).join('');
}

function renderTasks(filter = null) {
  const list = document.getElementById('tasks-list');
  const filtered = storage.tasks.filter(t => {
      if (filter === 'overdue' && (new Date(t.dueDate) >= new Date() || t.status === 'Gotowe')) return false;
      return true;
  });

  list.innerHTML = filtered.map(t => `
    <div class="task-card">
      <div class="task-card-left">
        <div class="task-card-name">${t.name}</div>
        <div class="task-card-meta">
          <span>${getProjectName(t.projectId)}</span>
        </div>
      </div>
      <div class="task-card-right">
        <span class="badge ${getStatusClass(t.status)}">${t.status}</span>
        <span class="task-due">${formatDate(t.dueDate)}</span>
      </div>
    </div>
  `).join('');
}

function renderLog() {
    const list = document.getElementById('log-timeline');
    list.innerHTML = storage.logs.map(l => `
        <div class="timeline-item">
            <div class="timeline-icon">📋</div>
            <div class="timeline-content">
                <div class="timeline-meta">
                    <span class="timeline-date">${formatDate(l.date)}</span>
                </div>
                <div class="timeline-desc">${l.desc}</div>
            </div>
        </div>
    `).join('');
}

function renderContacts() {
    const list = document.getElementById('contacts-list');
    list.innerHTML = storage.contacts.map(c => `
        <div class="contact-card">
            <div class="contact-name">${c.first} ${c.last}</div>
            <div class="contact-org">${c.org || ''}</div>
            <div class="contact-role">${c.role || ''}</div>
        </div>
    `).join('');
}

function renderEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = storage.events.map(e => `
        <div class="task-card">
            <div class="task-card-left">
                <div class="task-card-name">${e.title}</div>
            </div>
            <div class="task-card-right">
                <span class="task-due">${formatDate(e.date)} ${e.time || ''}</span>
            </div>
        </div>
    `).join('');
}

// --- SAVE ACTIONS ---
function saveArea() {
  const modal = document.getElementById('modal-addArea');
  const name = document.getElementById('area-name').value;
  if (!name) return alert('Nazwa jest wymagana');
  
  storage.areas.push({
    id: generateId(),
    name,
    desc: document.getElementById('area-desc').value,
    color: '#6366f1'
  });
  
  saveToStorage();
  clearInputs(modal);
  closeAllModals();
  showToast('Obszar został zapisany! ✅');
}

function saveProject() {
  const modal = document.getElementById('modal-addProject');
  const name = document.getElementById('proj-name').value;
  if (!name) return alert('Nazwa jest wymagana');
  
  storage.projects.push({
    id: generateId(),
    areaId: document.getElementById('proj-area').value,
    name,
    desc: document.getElementById('proj-desc').value,
    status: document.getElementById('proj-status').value,
    priority: document.getElementById('proj-priority').value,
    start: document.getElementById('proj-start').value,
    end: document.getElementById('proj-end').value
  });
  
  saveToStorage();
  clearInputs(modal);
  closeAllModals();
  showToast('Projekt został zapisany! 📁');
}

function saveTask() {
  const modal = document.getElementById('modal-addTask');
  const name = document.getElementById('task-name').value;
  if (!name) return alert('Nazwa jest wymagana');
  
  storage.tasks.push({
    id: generateId(),
    projectId: document.getElementById('task-project').value,
    name,
    desc: document.getElementById('task-desc').value,
    status: document.getElementById('task-status').value,
    dueDate: document.getElementById('task-due').value,
    progress: document.getElementById('task-progress').value
  });
  
  saveToStorage();
  clearInputs(modal);
  closeAllModals();
  showToast('Zadanie zostało zapisane! ✅');
}

function saveLog() {
    const modal = document.getElementById('modal-addLog');
    const desc = document.getElementById('log-desc').value;
    if (!desc) return alert('Opis jest wymagany');
    
    storage.logs.push({
        id: generateId(),
        desc,
        date: document.getElementById('log-date').value || new Date().toISOString().split('T')[0],
        type: document.getElementById('log-type').value
    });
    
    saveToStorage();
    clearInputs(modal);
    closeAllModals();
    showToast('Wpis do dziennika zapisany! 📋');
}

function saveContact() {
    const modal = document.getElementById('modal-addContact');
    const first = document.getElementById('contact-first').value;
    const last = document.getElementById('contact-last').value;
    if (!first || !last) return alert('Imię i nazwisko są wymagane');
    
    storage.contacts.push({
        id: generateId(),
        first, last,
        org: document.getElementById('contact-org').value,
        role: document.getElementById('contact-role').value
    });
    
    saveToStorage();
    clearInputs(modal);
    closeAllModals();
    showToast('Osoba zapisana do bazy! 👥');
}

function saveEvent() {
    const modal = document.getElementById('modal-addEvent');
    const title = document.getElementById('event-title').value;
    if (!title) return alert('Tytuł jest wymagany');
    
    storage.events.push({
        id: generateId(),
        title,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value
    });
    
    saveToStorage();
    clearInputs(modal);
    closeAllModals();
    showToast('Wydarzenie zapisane! 📅');
}

// --- SELECT BOX HELPERS ---
function populateAreaSelect(id) {
  const select = document.getElementById(id);
  select.innerHTML = storage.areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

function populateProjectSelect(id) {
  const select = document.getElementById(id);
  select.innerHTML = storage.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function populateContactSelect(id) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">-- Wybierz osobę --</option>` + storage.contacts.map(c => `<option value="${c.id}">${c.first} ${c.last}</option>`).join('');
}

function getAreaName(id) {
  const a = storage.areas.find(a => a.id === id);
  return a ? a.name : '';
}

function getAreaColor(id) {
  const a = storage.areas.find(a => a.id === id);
  return a ? a.color : '#ccc';
}

function getProjectName(id) {
  const p = storage.projects.find(p => p.id === id);
  return p ? p.name : '';
}

function getAreaColorForProject(projId) {
  const p = storage.projects.find(p => p.id === projId);
  return p ? getAreaColor(p.areaId) : '#ccc';
}

// --- UI UPDATES ---
function updateUI() {
  const currentView = document.querySelector('.view.active').id.replace('view-', '');
  showView(currentView);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  showView('dashboard');
});

function closeDetailPanel() {
    document.getElementById('detail-panel').classList.remove('open');
    document.getElementById('detail-overlay').classList.remove('open');
}

function addTaskStep() {
    const list = document.getElementById('task-steps-list');
    const div = document.createElement('div');
    div.className = 'step-item';
    div.innerHTML = `<input type="checkbox" class="step-checkbox"> <input type="text" class="form-input" placeholder="Nazwa etapu...">`;
    list.appendChild(div);
}
