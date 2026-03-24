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

let editingId = null;
let editingType = null;

async function loadFromStorage() {
  const saved = localStorage.getItem('ams_data');
  if (saved) {
    storage = JSON.parse(saved);
  } else {
    seedInitialData();
  }
  updateUI();

  // Try fetching from the cloud
  try {
      const res = await fetch('/api/sync');
      if (res.ok) {
          const cloudData = await res.json();
          // If cloud has data, it's the source of truth
          if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
              storage = cloudData;
              localStorage.setItem('ams_data', JSON.stringify(storage));
              updateUI();
          }
      }
  } catch(e) {
      console.log('Working offline / No DB configured');
  }
}

async function saveToStorage() {
  localStorage.setItem('ams_data', JSON.stringify(storage));
  updateUI();
  
  // Save to cloud in background
  try {
      await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storage)
      });
  } catch(e) {
      console.log('Offline / Cloud sync failed');
  }
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
  storage.areas = [];
  storage.projects = [];
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

  // Close sidebar on mobile
  closeSidebar();

  if (viewId === 'dashboard') renderDashboard();
  if (viewId === 'areas') renderAreas();
  if (viewId === 'projects') renderProjects();
  if (viewId === 'tasks') renderTasks(filter);
  if (viewId === 'log') renderLog();
  if (viewId === 'contacts') renderContacts();
  if (viewId === 'calendar') renderEvents();
}

// --- SIDEBAR TOGGLE ---
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent scrolling behind
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// --- MODAL MANAGEMENT ---
function openModal(modalId) {
  document.getElementById('modal-overlay').classList.add('open');
  const modal = document.getElementById(`modal-${modalId}`);
  modal.classList.add('open');
  
  if (!editingId) {
      clearInputs(modal);
      // Reset titles for creation mode
      const titleEl = modal.querySelector('h2');
      if (titleEl) {
        if (modalId === 'addArea') titleEl.innerText = 'Nowy Obszar Działalności';
        if (modalId === 'addProject') titleEl.innerText = 'Nowy Projekt / Działanie';
        if (modalId === 'addTask') titleEl.innerText = 'Nowe Zadanie';
        if (modalId === 'addLog') titleEl.innerText = 'Nowy Wpis do Dziennika';
        if (modalId === 'addContact') titleEl.innerText = 'Nowa Osoba';
        if (modalId === 'addEvent') titleEl.innerText = 'Nowe Wydarzenie / Termin';
      }
  }
  
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
  editingId = null;
  editingType = null;
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
      <div class="action-btns" style="margin-top:10px; display:flex; gap:8px;">
        <button onclick="event.stopPropagation(); editItem('area', '${a.id}')" style="background:none; border:none; cursor:pointer; color:#4f46e5; font-size:14px; text-decoration:underline;">Edytuj</button>
        <button onclick="event.stopPropagation(); deleteItem('area', '${a.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; font-size:14px; text-decoration:underline;">Usuń</button>
      </div>
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
      <div class="task-card-right" style="text-align:right;">
        <span class="badge ${getStatusClass(p.status)}">${p.status}</span>
        <div style="margin-top:6px; font-size:13px;">
          <button onclick="event.stopPropagation(); editItem('project', '${p.id}')" style="background:none; border:none; cursor:pointer; color:#4f46e5; text-decoration:underline; margin-right:6px;">Edytuj</button>
          <button onclick="event.stopPropagation(); deleteItem('project', '${p.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; text-decoration:underline;">Usuń</button>
        </div>
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
      <div class="task-card-right" style="text-align:right;">
        <span class="badge ${getStatusClass(t.status)}">${t.status}</span>
        <span class="task-due" style="display:block; margin-top:2px;">${formatDate(t.dueDate)}</span>
        <div style="margin-top:6px; font-size:13px;">
          <button onclick="event.stopPropagation(); editItem('task', '${t.id}')" style="background:none; border:none; cursor:pointer; color:#4f46e5; text-decoration:underline; margin-right:6px;">Edytuj</button>
          <button onclick="event.stopPropagation(); deleteItem('task', '${t.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; text-decoration:underline;">Usuń</button>
        </div>
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
                <div style="margin-top:6px; font-size:13px;">
                  <button onclick="event.stopPropagation(); editItem('log', '${l.id}')" style="background:none; border:none; cursor:pointer; color:#4f46e5; text-decoration:underline; margin-right:6px;">Edytuj</button>
                  <button onclick="event.stopPropagation(); deleteItem('log', '${l.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; text-decoration:underline;">Usuń</button>
                </div>
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
            <div style="margin-top:10px; font-size:13px; border-top: 1px solid #eee; padding-top:8px;">
              <button onclick="event.stopPropagation(); editItem('contact', '${c.id}')" style="background:none; border:none; cursor:pointer; color:#4f46e5; text-decoration:underline; margin-right:6px;">Edytuj</button>
              <button onclick="event.stopPropagation(); deleteItem('contact', '${c.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; text-decoration:underline;">Usuń</button>
            </div>
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
            <div class="task-card-right" style="text-align:right;">
                <span class="task-due">${formatDate(e.date)} ${e.time || ''}</span>
                <div style="margin-top:6px; font-size:13px;">
                  <button onclick="event.stopPropagation(); editItem('event', '${e.id}')" style="background:none; border:none; cursor:pointer; color:#4f46e5; text-decoration:underline; margin-right:6px;">Edytuj</button>
                  <button onclick="event.stopPropagation(); deleteItem('event', '${e.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; text-decoration:underline;">Usuń</button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- SAVE ACTIONS ---
function saveArea() {
  const modal = document.getElementById('modal-addArea');
  const name = document.getElementById('area-name').value;
  if (!name) return alert('Nazwa jest wymagana');
  
  if (editingId && editingType === 'area') {
      const a = storage.areas.find(x => x.id === editingId);
      if (a) {
          a.name = name;
          a.desc = document.getElementById('area-desc').value;
      }
      showToast('Obszar został zaktualizowany! ✅');
  } else {
      storage.areas.push({
        id: generateId(),
        name,
        desc: document.getElementById('area-desc').value,
        color: '#6366f1' // simple default color 
      });
      showToast('Obszar został zapisany! ✅');
  }
  
  saveToStorage();
  closeAllModals();
}

function saveProject() {
  const modal = document.getElementById('modal-addProject');
  const name = document.getElementById('proj-name').value;
  if (!name) return alert('Nazwa jest wymagana');
  
  if (editingId && editingType === 'project') {
      const p = storage.projects.find(x => x.id === editingId);
      if (p) {
          p.areaId = document.getElementById('proj-area').value;
          p.name = name;
          p.desc = document.getElementById('proj-desc').value;
          p.status = document.getElementById('proj-status').value;
          p.priority = document.getElementById('proj-priority').value;
          p.start = document.getElementById('proj-start').value;
          p.end = document.getElementById('proj-end').value;
      }
      showToast('Projekt zaktualizowany! 📁');
  } else {
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
      showToast('Projekt został zapisany! 📁');
  }
  
  saveToStorage();
  closeAllModals();
}

function saveTask() {
  const modal = document.getElementById('modal-addTask');
  const name = document.getElementById('task-name').value;
  if (!name) return alert('Nazwa jest wymagana');
  
  if (editingId && editingType === 'task') {
      const t = storage.tasks.find(x => x.id === editingId);
      if (t) {
          t.projectId = document.getElementById('task-project').value;
          t.name = name;
          t.desc = document.getElementById('task-desc').value;
          t.status = document.getElementById('task-status').value;
          t.dueDate = document.getElementById('task-due').value;
          t.progress = document.getElementById('task-progress').value;
      }
      showToast('Zadanie zaktualizowane! ✅');
  } else {
      storage.tasks.push({
        id: generateId(),
        projectId: document.getElementById('task-project').value,
        name,
        desc: document.getElementById('task-desc').value,
        status: document.getElementById('task-status').value,
        dueDate: document.getElementById('task-due').value,
        progress: document.getElementById('task-progress').value
      });
      showToast('Zadanie zostało zapisane! ✅');
  }
  
  saveToStorage();
  closeAllModals();
}

function saveLog() {
    const modal = document.getElementById('modal-addLog');
    const desc = document.getElementById('log-desc').value;
    if (!desc) return alert('Opis jest wymagany');
    
    if (editingId && editingType === 'log') {
        const l = storage.logs.find(x => x.id === editingId);
        if (l) {
            l.desc = desc;
            l.date = document.getElementById('log-date').value || l.date;
            l.type = document.getElementById('log-type').value;
        }
        showToast('Wpis do dziennika zaktualizowany! 📋');
    } else {
        storage.logs.push({
            id: generateId(),
            desc,
            date: document.getElementById('log-date').value || new Date().toISOString().split('T')[0],
            type: document.getElementById('log-type').value
        });
        showToast('Wpis do dziennika zapisany! 📋');
    }
    
    saveToStorage();
    closeAllModals();
}

function saveContact() {
    const modal = document.getElementById('modal-addContact');
    const first = document.getElementById('contact-first').value;
    const last = document.getElementById('contact-last').value;
    if (!first || !last) return alert('Imię i nazwisko są wymagane');
    
    if (editingId && editingType === 'contact') {
        const c = storage.contacts.find(x => x.id === editingId);
        if (c) {
            c.first = first;
            c.last = last;
            c.org = document.getElementById('contact-org').value;
            c.role = document.getElementById('contact-role').value;
        }
        showToast('Dane osoby zaktualizowane! 👥');
    } else {
        storage.contacts.push({
            id: generateId(),
            first, last,
            org: document.getElementById('contact-org').value,
            role: document.getElementById('contact-role').value
        });
        showToast('Osoba zapisana do bazy! 👥');
    }
    
    saveToStorage();
    closeAllModals();
}

function saveEvent() {
    const modal = document.getElementById('modal-addEvent');
    const title = document.getElementById('event-title').value;
    if (!title) return alert('Tytuł jest wymagany');
    
    if (editingId && editingType === 'event') {
        const e = storage.events.find(x => x.id === editingId);
        if (e) {
            e.title = title;
            e.date = document.getElementById('event-date').value;
            e.time = document.getElementById('event-time').value;
        }
        showToast('Wydarzenie zaktualizowane! 📅');
    } else {
        storage.events.push({
            id: generateId(),
            title,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value
        });
        showToast('Wydarzenie zapisane! 📅');
    }
    
    saveToStorage();
    closeAllModals();
}

// --- CRUD HELPER METHODS ---
function deleteItem(type, id) {
    if (!confirm('Czy na pewno chcesz usunąć ten element?')) return;
    if (type === 'area') storage.areas = storage.areas.filter(a => a.id !== id);
    if (type === 'project') storage.projects = storage.projects.filter(p => p.id !== id);
    if (type === 'task') storage.tasks = storage.tasks.filter(t => t.id !== id);
    if (type === 'log') storage.logs = storage.logs.filter(l => l.id !== id);
    if (type === 'contact') storage.contacts = storage.contacts.filter(c => c.id !== id);
    if (type === 'event') storage.events = storage.events.filter(e => e.id !== id);
    saveToStorage();
    showToast('Element usunięty!');
}

function editItem(type, id) {
    editingId = id;
    editingType = type;
    
    if (type === 'area') {
        const a = storage.areas.find(x => x.id === id);
        if(!a) return;
        openModal('addArea');
        document.getElementById('area-name').value = a.name;
        document.getElementById('area-desc').value = a.desc || '';
        document.querySelector('#modal-addArea h2').innerText = 'Edycja Obszaru';
    }
    else if (type === 'project') {
        const p = storage.projects.find(x => x.id === id);
        if(!p) return;
        openModal('addProject');
        document.getElementById('proj-area').value = p.areaId;
        document.getElementById('proj-name').value = p.name;
        document.getElementById('proj-desc').value = p.desc || '';
        document.getElementById('proj-status').value = p.status || 'Zaplanowane';
        document.getElementById('proj-priority').value = p.priority || 'Normalny';
        document.getElementById('proj-start').value = p.start || '';
        document.getElementById('proj-end').value = p.end || '';
        document.querySelector('#modal-addProject h2').innerText = 'Edycja Projektu';
    }
    else if (type === 'task') {
        const t = storage.tasks.find(x => x.id === id);
        if(!t) return;
        openModal('addTask');
        document.getElementById('task-project').value = t.projectId;
        document.getElementById('task-name').value = t.name;
        document.getElementById('task-desc').value = t.desc || '';
        document.getElementById('task-status').value = t.status || 'W toku';
        document.getElementById('task-due').value = t.dueDate || '';
        document.getElementById('task-progress').value = t.progress || 0;
        document.querySelector('#modal-addTask h2').innerText = 'Edycja Zadania';
    }
    else if (type === 'log') {
        const l = storage.logs.find(x => x.id === id);
        if(!l) return;
        openModal('addLog');
        document.getElementById('log-type').value = l.type || 'Inne';
        document.getElementById('log-date').value = l.date || '';
        document.getElementById('log-desc').value = l.desc || '';
        document.querySelector('#modal-addLog h2').innerText = 'Edycja Logu';
    }
    else if (type === 'contact') {
        const c = storage.contacts.find(x => x.id === id);
        if(!c) return;
        openModal('addContact');
        document.getElementById('contact-first').value = c.first;
        document.getElementById('contact-last').value = c.last;
        document.getElementById('contact-org').value = c.org || '';
        document.getElementById('contact-role').value = c.role || '';
        document.querySelector('#modal-addContact h2').innerText = 'Edycja Osoby';
    }
    else if (type === 'event') {
        const e = storage.events.find(x => x.id === id);
        if(!e) return;
        openModal('addEvent');
        document.getElementById('event-title').value = e.title;
        document.getElementById('event-date').value = e.date || '';
        document.getElementById('event-time').value = e.time || '';
        document.querySelector('#modal-addEvent h2').innerText = 'Edycja Wydarzenia';
    }
}

// --- EXPORT/IMPORT ---
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storage, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ams_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported && imported.areas !== undefined) {
                storage = imported;
                saveToStorage();
                showToast('Dane zaimportowane pomyślnie! 🔄');
                setTimeout(() => location.reload(), 1000);
            } else {
                alert('Nieprawidłowy plik danych!');
            }
        } catch (err) {
            alert('Błąd podczas ładowania pliku!');
        }
    };
    reader.readAsText(file);
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
