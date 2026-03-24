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

let appPassword = null;

function encryptData(data, pwd) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), pwd).toString();
}

function decryptData(ciphertext, pwd) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, pwd);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) return null;
        return JSON.parse(decryptedStr);
    } catch (e) {
        return null;
    }
}

async function attemptLogin() {
    const passInput = document.getElementById('login-password');
    const pwd = passInput.value;
    if (!pwd) return;
    
    document.getElementById('login-error').style.display = 'none';
    const success = await loadFromStorage(pwd);
    if (success) {
        appPassword = pwd;
        document.getElementById('login-overlay').style.display = 'none';
        showView('dashboard');
        
        // Force re-save to ensure legacy data gets encrypted
        const saved = localStorage.getItem('ams_data');
        if (saved && !saved.includes('"payload"')) {
            saveToStorage();
        }
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

async function loadFromStorage(pwd) {
  const defaults = { areas: [], projects: [], tasks: [], logs: [], contacts: [], events: [], teams: [] };
  
  try {
      const res = await fetch('/api/sync');
      if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
              if (cloudData.payload) {
                  const decrypted = decryptData(cloudData.payload, pwd);
                  if (decrypted) {
                      storage = { ...defaults, ...decrypted };
                      localStorage.setItem('ams_data', JSON.stringify(cloudData));
                      updateUI();
                      return true;
                  } else {
                      return false; // błędne hasło
                  }
              } else {
                  // legacy (niezaszyfrowane)
                  storage = { ...defaults, ...cloudData };
                  updateUI();
                  return true;
              }
          }
      }
  } catch(e) {
      console.log('Working offline / Cloud sync failed');
  }

  const saved = localStorage.getItem('ams_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.payload) {
          const decrypted = decryptData(parsed.payload, pwd);
          if (decrypted) {
              storage = { ...defaults, ...decrypted };
              updateUI();
              return true;
          } else {
              return false; // błędne hasło
          }
      } else {
          storage = { ...defaults, ...parsed };
          updateUI();
          return true;
      }
    } catch(e) {
      storage = { ...defaults };
      return true; // pusta/uszkodzona baza
    }
  } else {
    storage = { ...defaults };
    return true; // nowa pusta baza
  }
}

async function saveToStorage() {
  if (!appPassword) return; // nie zapisujemy jeśli nie odblokowano
  const payload = encryptData(storage, appPassword);
  const dataToSave = { payload };
  
  localStorage.setItem('ams_data', JSON.stringify(dataToSave));
  updateUI();
  
  try {
      await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
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
  // Usunięto tę funkcję, ponieważ przez wywoływanie saveToStorage() na czystych 
  // instancjach i nadpisywało dane na serwerze!
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

function toggleEventTimes(checkbox) {
    document.getElementById('event-time').disabled = checkbox.checked;
    document.getElementById('event-end-time').disabled = checkbox.checked;
    if(checkbox.checked) {
        document.getElementById('event-time').value = '';
        document.getElementById('event-end-time').value = '';
    }
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
  
  if (modalId === 'addArea') {
      renderAssigneeCheckboxes('area-owners-container', 'area-owner-check', []);
      renderAssigneeCheckboxes('area-workers-container', 'area-worker-check', []);
  }
  if (modalId === 'addProject') {
      populateAreaSelect('proj-area');
      renderAssigneeCheckboxes('proj-owners-container', 'proj-owner-check', []);
      renderAssigneeCheckboxes('proj-workers-container', 'proj-worker-check', []);
  }
  if (modalId === 'addTask') {
      populateProjectSelect('task-project');
      renderAssigneeCheckboxes('task-owners-container', 'task-owner-check', []);
      renderAssigneeCheckboxes('task-workers-container', 'task-worker-check', []);
  }
  if (modalId === 'addTeam') {
      populateTeamMembersCheckboxes();
  }
  if (modalId === 'addLog') {
      populateLogRelationSelect('log-relation');
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
  lucide.createIcons();
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
    <div class="area-card" style="--area-color: ${a.color}" onclick="openDetail('area', '${a.id}')" style="cursor:pointer;">
      <div class="area-name">${a.name}</div>
      <div class="area-desc">${a.desc || ''}</div>
      <div class="action-btns" style="margin-top:10px; display:flex; justify-content:flex-end;">
        <button class="action-btn edit" onclick="event.stopPropagation(); editItem('area', '${a.id}')" title="Edytuj"><i data-lucide="edit-2"></i></button>
        <button class="action-btn delete" onclick="event.stopPropagation(); deleteItem('area', '${a.id}')" title="Usuń"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
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
    <div class="task-card" onclick="openDetail('project', '${p.id}')" style="cursor:pointer;">
      <div class="task-card-left">
        <div class="task-card-name">${p.name}</div>
        <div class="task-card-meta">
          <span>${getAreaName(p.areaId)}</span>
        </div>
      </div>
      <div class="task-card-right" style="text-align:right;">
        <span class="badge ${getStatusClass(p.status)}">${p.status}</span>
        <div class="action-btns" style="margin-top:8px;">
          <button class="action-btn edit" onclick="event.stopPropagation(); editItem('project', '${p.id}')" title="Edytuj"><i data-lucide="edit-2"></i></button>
          <button class="action-btn delete" onclick="event.stopPropagation(); deleteItem('project', '${p.id}')" title="Usuń"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
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
        <span class="task-due" style="display:block; margin-top:2px;"><i data-lucide="calendar"></i> ${formatDate(t.dueDate)}</span>
        <div class="action-btns" style="margin-top:8px;">
          <button class="action-btn edit" onclick="event.stopPropagation(); editItem('task', '${t.id}')" title="Edytuj"><i data-lucide="edit-2"></i></button>
          <button class="action-btn delete" onclick="event.stopPropagation(); deleteItem('task', '${t.id}')" title="Usuń"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function renderLog() {
    const list = document.getElementById('log-timeline');
    list.innerHTML = storage.logs.map(l => `
        <div class="timeline-item">
            <div class="timeline-icon"><i data-lucide="clipboard-list"></i></div>
            <div class="timeline-content">
                <div class="timeline-meta">
                    <span class="timeline-date">${formatDate(l.date)}</span>
                </div>
                <div class="timeline-desc">${l.desc}</div>
                <div class="action-btns" style="margin-top:8px; justify-content:flex-start;">
                  <button class="action-btn edit" onclick="event.stopPropagation(); editItem('log', '${l.id}')" title="Edytuj"><i data-lucide="edit-2"></i></button>
                  <button class="action-btn delete" onclick="event.stopPropagation(); deleteItem('log', '${l.id}')" title="Usuń"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderContacts() {
    const list = document.getElementById('contacts-list');
    if (list) {
        list.innerHTML = storage.contacts.map(c => `
            <div class="contact-card" onclick="openDetail('contact', '${c.id}')" style="cursor:pointer;">
                <div class="contact-name"><i data-lucide="user" style="width:18px;height:18px;color:var(--accent-light);"></i> ${c.first} ${c.last}</div>
                <div class="contact-org"><i data-lucide="building" style="width:14px;height:14px;"></i> ${c.org || 'Brak organizacji'}</div>
                <div class="contact-role"><i data-lucide="briefcase" style="width:14px;height:14px;"></i> ${c.role || 'Brak roli'}</div>
                <div class="action-btns" style="margin-top:12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:12px; justify-content:flex-end;">
                  <button class="action-btn edit" onclick="event.stopPropagation(); editItem('contact', '${c.id}')" title="Edytuj"><i data-lucide="edit-2"></i></button>
                  <button class="action-btn delete" onclick="event.stopPropagation(); deleteItem('contact', '${c.id}')" title="Usuń"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `).join('');
    }
    
    // Render Teams
    const teamsList = document.getElementById('teams-list');
    if (teamsList) {
        teamsList.innerHTML = (storage.teams || []).map(t => `
            <div class="contact-card" onclick="openDetail('team', '${t.id}')" style="cursor:pointer; background:rgba(99,102,241,0.05);">
                <div class="contact-name"><i data-lucide="users" style="width:18px;height:18px;color:var(--primary);"></i> ${t.name}</div>
                <div class="contact-org" style="margin-top:6px; font-size:13px; color:var(--text-muted);">${t.desc || ''}</div>
                <div class="contact-role" style="color:var(--text-muted); font-size:12px; margin-top:4px;">Członkowie: ${t.members ? t.members.length : 0}</div>
                <div class="action-btns" style="margin-top:12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:12px; justify-content:flex-end;">
                  <button class="action-btn edit" onclick="event.stopPropagation(); editItem('team', '${t.id}')" title="Edytuj"><i data-lucide="edit-2"></i></button>
                  <button class="action-btn delete" onclick="event.stopPropagation(); deleteItem('team', '${t.id}')" title="Usuń"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

let currentCalendarDate = new Date();

function changePeriod(offset) {
    if (window.innerWidth <= 768) {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + (offset * 7));
    } else {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    }
    renderEvents();
}

window.addEventListener('resize', () => {
    if ((window.innerWidth <= 768 && !document.getElementById('monthly-calendar-grid').dataset.mobile) ||
        (window.innerWidth > 768 && document.getElementById('monthly-calendar-grid').dataset.mobile)) {
        renderEvents();
    }
});

function renderEvents() {
    const grid = document.getElementById('monthly-calendar-grid');
    const label = document.getElementById('calendar-month-label');
    if (!grid || !label) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    label.innerText = currentCalendarDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }).toUpperCase();
    
    // Generate events per day
    const getItemsForDate = (dateStr) => {
        let items = [];
        storage.events.forEach(e => { 
            const startStr = e.date || '';
            const endStr = e.endDate || startStr;
            if (startStr && dateStr >= startStr && dateStr <= endStr) {
                const isStart = dateStr === startStr;
                const timePrefix = (!e.isAllDay && isStart && e.time) ? `${e.time} ` : '';
                items.push({ type: 'event', title: timePrefix + e.title, d: e, icon: 'calendar-heart', class: 'cal-event', assignedIds: [] }); 
            }
        });
        storage.tasks.forEach(t => { if (t.dueDate === dateStr) items.push({ type: 'task', title: `${t.name}`, d: t, icon: 'check-square', class: 'cal-task', assignedIds: [...(t.owners||[]), ...(t.workers||[]), ...(t.assignee?[t.assignee]:[])] }); });
        storage.projects.forEach(p => { if (p.deadline === dateStr) items.push({ type: 'project', title: `${p.name}`, d: p, icon: 'folder', class: 'cal-project', assignedIds: [...(p.owners||[]), ...(p.workers||[]), ...(p.assignee?[p.assignee]:[])] }); });
        return items;
    };
    
    let html = '';
    const daysOfWeek = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'N'];
    daysOfWeek.forEach(d => html += `<div class="calendar-day-header">${d}</div>`);
    
    const renderItemsHtml = (items) => {
        return items.map(it => {
           let assigneesHtml = '';
           // Make array unique
           const uniqueIds = [...new Set(it.assignedIds)];
           uniqueIds.forEach(idStr => {
               if (idStr.startsWith('contact_')) {
                   const c = storage.contacts.find(x => x.id === idStr.split('_')[1]);
                   if (c) assigneesHtml += ` <span style="opacity:0.6; margin-left:2px;">[${c.first}]</span>`;
               } else if (idStr.startsWith('team_')) {
                   const t = (storage.teams||[]).find(x => x.id === idStr.split('_')[1]);
                   if (t) assigneesHtml += ` <span style="opacity:0.6; margin-left:2px;">[${t.name}]</span>`;
               }
           });
           let clickAction = '';
           if (it.type === 'task') clickAction = `onclick="openDetail('task', '${it.d.id}')"`;
           else if (it.type === 'project') clickAction = `onclick="openDetail('project', '${it.d.id}')"`;
           else if (it.type === 'event') clickAction = `onclick="editItem('event', '${it.d.id}')"`;
           
           return `<div class="cal-event-badge ${it.class}" title="${it.title}" ${clickAction}>
             <i data-lucide="${it.icon}" style="width:12px;height:12px;"></i> ${it.title}${assigneesHtml}
           </div>`;
        }).join('');
    };

    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        const dayOfWeek = currentCalendarDate.getDay() || 7;
        const monday = new Date(currentCalendarDate);
        monday.setDate(monday.getDate() - dayOfWeek + 1);
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(monday);
            currentDay.setDate(monday.getDate() + i);
            const y = currentDay.getFullYear();
            const m = currentDay.getMonth();
            const d = currentDay.getDate();
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const items = getItemsForDate(dateStr);
            
            let itemsHtml = renderItemsHtml(items);
            
            html += `<div class="calendar-cell ${isToday ? 'today' : ''}">
                <div class="calendar-date-label">${d} ${currentDay.toLocaleDateString('pl-PL', { month: 'short' })}</div>
                ${itemsHtml}
            </div>`;
        }
    } else {
        const firstDayIndex = (new Date(year, month, 1).getDay() || 7) - 1; 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let dayCount = 1;
        for (let i = 0; i < 42; i++) {
            if (i < firstDayIndex || dayCount > daysInMonth) {
                html += `<div class="calendar-cell other-month"></div>`;
            } else {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const items = getItemsForDate(dateStr);
                
                let itemsHtml = renderItemsHtml(items);
                
                html += `<div class="calendar-cell ${isToday ? 'today' : ''}">
                    <div class="calendar-date-label">${dayCount}</div>
                    ${itemsHtml}
                </div>`;
                dayCount++;
            }
        }
    }
    
    grid.dataset.mobile = isMobile ? 'true' : '';
    grid.innerHTML = html;
    lucide.createIcons();
}

// --- SAVE ACTIONS ---
function saveArea() {
  const modal = document.getElementById('modal-addArea');
  const name = document.getElementById('area-name').value;
  const color = document.getElementById('area-color').value || '#6366f1';
  if (!name) return alert('Nazwa jest wymagana');
  
  if (editingId && editingType === 'area') {
      const a = storage.areas.find(x => x.id === editingId);
      if (a) {
          a.name = name;
          a.desc = document.getElementById('area-desc').value;
          a.color = color;
      }
      showToast('Obszar został zaktualizowany! ✅');
  } else {
      storage.areas.push({
        id: generateId(),
        name,
        desc: document.getElementById('area-desc').value,
        color
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
          p.owners = Array.from(document.querySelectorAll('.proj-owner-check:checked')).map(c => c.value);
          p.workers = Array.from(document.querySelectorAll('.proj-worker-check:checked')).map(c => c.value);
          p.deadline = document.getElementById('proj-deadline').value;
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
        end: document.getElementById('proj-end').value,
        owners: Array.from(document.querySelectorAll('.proj-owner-check:checked')).map(c => c.value),
        workers: Array.from(document.querySelectorAll('.proj-worker-check:checked')).map(c => c.value),
        deadline: document.getElementById('proj-deadline').value
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
          t.owners = Array.from(document.querySelectorAll('.task-owner-check:checked')).map(c => c.value);
          t.workers = Array.from(document.querySelectorAll('.task-worker-check:checked')).map(c => c.value);
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
        progress: document.getElementById('task-progress').value,
        owners: Array.from(document.querySelectorAll('.task-owner-check:checked')).map(c => c.value),
        workers: Array.from(document.querySelectorAll('.task-worker-check:checked')).map(c => c.value)
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
    
    const relInput = document.getElementById('log-relation');
    const parentId = relInput ? relInput.value : '';
    
    if (editingId && editingType === 'log') {
        const l = storage.logs.find(x => x.id === editingId);
        if (l) {
            l.desc = desc;
            l.date = document.getElementById('log-date').value || l.date;
            l.type = document.getElementById('log-type').value;
            l.parentId = parentId;
        }
        showToast('Wpis do dziennika zaktualizowany! 📋');
    } else {
        storage.logs.push({
            id: generateId(),
            desc,
            date: document.getElementById('log-date').value || new Date().toISOString().split('T')[0],
            type: document.getElementById('log-type').value,
            parentId: parentId
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
    
    const isAllDay = document.getElementById('event-allday').checked;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const endDate = document.getElementById('event-end-date').value || date; // fallback to start date
    const endTime = document.getElementById('event-end-time').value;
    
    if (!date) return alert('Data rozpoczęcia jest wymagana');
    
    if (editingId && editingType === 'event') {
        const e = storage.events.find(x => x.id === editingId);
        if (e) {
            e.title = title;
            e.date = date;
            e.time = time;
            e.endDate = endDate;
            e.endTime = endTime;
            e.isAllDay = isAllDay;
        }
        showToast('Wydarzenie zaktualizowane! 📅');
    } else {
        storage.events.push({
            id: generateId(),
            title,
            date,
            time,
            endDate,
            endTime,
            isAllDay
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
    if (type === 'team') storage.teams = storage.teams.filter(t => t.id !== id);
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
        document.getElementById('area-color').value = a.color || '#6366f1';
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
        // Checkboxes check timeout
        setTimeout(() => {
            renderAssigneeCheckboxes('proj-owners-container', 'proj-owner-check', p.owners || (p.assignee ? [p.assignee] : []));
            renderAssigneeCheckboxes('proj-workers-container', 'proj-worker-check', p.workers || []);
        }, 10);
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
        // Checkboxes check timeout
        setTimeout(() => {
            renderAssigneeCheckboxes('task-owners-container', 'task-owner-check', t.owners || (t.assignee ? [t.assignee] : []));
            renderAssigneeCheckboxes('task-workers-container', 'task-worker-check', t.workers || []);
        }, 10);
    }
    else if (type === 'log') {
        const l = storage.logs.find(x => x.id === id);
        if(!l) return;
        openModal('addLog');
        document.getElementById('log-type').value = l.type || 'Inne';
        document.getElementById('log-date').value = l.date || '';
        document.getElementById('log-desc').value = l.desc || '';
        document.querySelector('#modal-addLog h2').innerText = 'Edycja Logu';
        // Wait for parent DOM
        setTimeout(() => {
            const relSelect = document.getElementById('log-relation');
            if(relSelect) relSelect.value = l.parentId || '';
        }, 10);
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
    else if (type === 'team') {
        const t = storage.teams.find(x => x.id === id);
        if(!t) return;
        openModal('addTeam');
        document.getElementById('team-name').value = t.name;
        document.getElementById('team-desc').value = t.desc || '';
        document.querySelector('#modal-addTeam h2').innerText = 'Edycja Zespołu';
        
        // Czekamy na przetworzenie modalu i renderowanie checkboxów by móc je zainicjować
        setTimeout(() => {
            Array.from(document.querySelectorAll('.team-member-check')).forEach(chk => {
                if (t.members && t.members.includes(chk.value)) {
                    chk.checked = true;
                }
            });
        }, 10);
    }
    else if (type === 'event') {
        const e = storage.events.find(x => x.id === id);
        if(!e) return;
        openModal('addEvent');
        document.getElementById('event-title').value = e.title;
        document.getElementById('event-date').value = e.date || '';
        document.getElementById('event-time').value = e.time || '';
        document.getElementById('event-end-date').value = e.endDate || e.date || '';
        document.getElementById('event-end-time').value = e.endTime || '';
        const allDayCheck = document.getElementById('event-allday');
        allDayCheck.checked = !!e.isAllDay;
        toggleEventTimes(allDayCheck);
        document.querySelector('#modal-addEvent h2').innerText = 'Edycja Wydarzenia';
    }
}

// --- EXPORT/IMPORT ---
function exportData() {
    if (!appPassword) return;
    const payload = encryptData(storage, appPassword);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ payload }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ams_backup_encrypted_" + new Date().toISOString().split('T')[0] + ".json");
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
            if (imported.payload) {
                const decrypted = decryptData(imported.payload, appPassword);
                if (decrypted && decrypted.areas !== undefined) {
                    storage = decrypted;
                    saveToStorage();
                    showToast('Dane zaimportowane pomyślnie! 🔄');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    alert('Błędne hasło chroniące plik lub plik uszkodzony!');
                }
            } else if (imported.areas !== undefined) {
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
function populateLogRelationSelect(id) {
    const select = document.getElementById(id);
    if (!select) return;
    let html = '<option value="">-- Brak powiązania --</option>';
    
    if (storage.areas.length > 0) {
        html += '<optgroup label="Obszary">';
        storage.areas.forEach(a => html += `<option value="${a.id}">Obszar: ${a.name}</option>`);
        html += '</optgroup>';
    }
    if (storage.projects.length > 0) {
        html += '<optgroup label="Projekty">';
        storage.projects.forEach(p => html += `<option value="${p.id}">Projekt: ${p.name}</option>`);
        html += '</optgroup>';
    }
    if (storage.tasks.length > 0) {
        html += '<optgroup label="Zadania">';
        storage.tasks.forEach(t => html += `<option value="${t.id}">Zadanie: ${t.name}</option>`);
        html += '</optgroup>';
    }
    select.innerHTML = html;
}

function renderAssigneeCheckboxes(containerId, inputClass, selectedArray = []) {
   const container = document.getElementById(containerId);
   if (!container) return;
   let html = '';
   
   if (storage.contacts.length > 0) {
       html += '<div style="font-size:11px;color:#a1a1aa;margin-top:4px;">OSOBY</div>';
       storage.contacts.forEach(c => {
           const val = `contact_${c.id}`;
           const checked = selectedArray.includes(val) ? 'checked' : '';
           html += `<label class="checkbox-row"><input type="checkbox" class="${inputClass}" value="${val}" ${checked}> <span>${c.first} ${c.last}</span></label>`;
       });
   }
   const teams = storage.teams || [];
   if (teams.length > 0) {
       html += '<div style="font-size:11px;color:#a1a1aa;margin-top:8px;">ZESPOŁY</div>';
       teams.forEach(t => {
           const val = `team_${t.id}`;
           const checked = selectedArray.includes(val) ? 'checked' : '';
           html += `<label class="checkbox-row"><input type="checkbox" class="${inputClass}" value="${val}" ${checked}> <span>${t.name}</span></label>`;
       });
   }
   if(!html) html = '<span style="font-size:12px;color:#666;">Brak kontaktów/zespołów</span>';
   container.innerHTML = html;
}

function populateTeamMembersCheckboxes() {
    const container = document.getElementById('team-members-container');
    if (!container) return;
    if (storage.contacts.length === 0) {
        container.innerHTML = '<span style="color:#aaa;font-size:12px;">Brak osób w bazie. Najpierw dodaj osobę.</span>';
        return;
    }
    container.innerHTML = storage.contacts.map(c => `
      <label class="checkbox-row" style="cursor:pointer; padding: 4px; border-radius: 4px;">
        <input type="checkbox" class="team-member-check" value="${c.id}" style="accent-color: var(--primary);">
        <span>${c.first} ${c.last}</span>
      </label>
    `).join('');
}

function saveTeam() {
    const name = document.getElementById('team-name').value;
    if (!name) return alert('Nazwa zespołu jest wymagana');
    
    const checkboxes = document.querySelectorAll('.team-member-check:checked');
    const members = Array.from(checkboxes).map(c => c.value);
    
    if (editingId && editingType === 'team') {
        const t = storage.teams.find(x => x.id === editingId);
        if (t) {
            t.name = name;
            t.desc = document.getElementById('team-desc').value;
            t.members = members;
        }
        showToast('Zespół zaktualizowany! 🤝');
    } else {
        storage.teams = storage.teams || [];
        storage.teams.push({
            id: generateId(),
            name,
            desc: document.getElementById('team-desc').value,
            members
        });
        showToast('Zespół zapisany do bazy! 🤝');
    }
    saveToStorage();
    closeAllModals();
}
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
  const pwdInput = document.getElementById('login-password');
  if (pwdInput) pwdInput.focus();
});

function closeDetailPanel() {
    const p = document.getElementById('detail-panel');
    const o = document.getElementById('detail-overlay');
    if(p) p.classList.remove('open');
    if(o) o.classList.remove('open');
}

function openDetail(type, id) {
  const panel = document.getElementById('detail-panel');
  const inner = document.getElementById('detail-panel-inner');
  const overlay = document.getElementById('detail-overlay');
  
  if (!panel || !inner) return;
  
  let html = '<button class="close-btn" onclick="closeDetailPanel()" style="position:absolute; top:20px; right:20px; font-size:24px; cursor:pointer; background:none; border:none; color:#a1a1aa; transition:0.2s;">×</button>';
  
  // Helper to format assignees
  const getAssigneesHtml = (ownersArray, workersArray) => {
      let b = [];
      const gather = (list, isWorker) => {
          if(!list) return;
          list.forEach(idStr => {
              const key = idStr.split('_')[1];
              if(idStr.startsWith('contact_')) {
                  const c = storage.contacts.find(x=>x.id===key);
                  if(c) b.push(`<span style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-size:11px; margin-right:4px; display:inline-block;"><i data-lucide="user" style="width:10px;height:10px;"></i> ${c.first} ${c.last}${isWorker?' (w)':' (o)'}</span>`);
              } else if(idStr.startsWith('team_')) {
                  const t = (storage.teams||[]).find(x=>x.id===key);
                  if(t) b.push(`<span style="background:rgba(99,102,241,0.1); color:#c7d2fe; padding:2px 6px; border-radius:4px; font-size:11px; margin-right:4px; display:inline-block;"><i data-lucide="users" style="width:10px;height:10px;"></i> ${t.name}${isWorker?' (w)':' (o)'}</span>`);
              }
          });
      };
      gather(ownersArray, false);
      gather(workersArray, true);
      return b.length > 0 ? `<div style="margin-top:10px;">${b.join('')}</div>` : `<div style="margin-top:10px; font-size:11px; color:#666;">Brak przypisanych</div>`;
  };
  
  // Helper to render Logs section
  const renderRelatedLogs = (parentId) => {
      const relatedLogs = storage.logs.filter(l => l.parentId && String(l.parentId) === String(parentId));
      let lh = `<h3 style="font-size:15px; margin-bottom:12px; margin-top:25px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; color:#f4f4f5;"><i data-lucide="clipboard-list" style="width:16px;height:16px;"></i> Powiązane Logi (${relatedLogs.length})</h3>`;
      if(relatedLogs.length === 0) lh += '<p style="font-size:13px;color:#a1a1aa;">Brak powiązanych logów i wpisów pamiętnika.</p>';
      else {
          lh += `<div class="detail-assigned-list" style="display:flex; flex-direction:column; gap:8px;">`;
          relatedLogs.forEach(l => {
              lh += `<div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; font-size:13px;">
                <div style="color:var(--text-muted); font-size:11px; margin-bottom:4px;">${formatDate(l.date)} – ${l.type}</div>
                <div>${l.desc}</div>
              </div>`;
          });
          lh += `</div>`;
      }
      return lh;
  };

  if (type === 'contact' || type === 'team') {

      const isTeam = type === 'team';
      const entity = isTeam ? (storage.teams||[]).find(x => x.id === id) : storage.contacts.find(x => x.id === id);
      if (!entity) return;
      
      const title = isTeam ? entity.name : `${entity.first} ${entity.last}`;
      const subtitle = isTeam ? (entity.desc||'') : ((entity.role||'') + ' ' + (entity.org||''));
      const prefix = isTeam ? 'team_' : 'contact_';
      const assignKey = prefix + id;
      
      const assignedTasks = storage.tasks.filter(t => (t.owners||[]).includes(assignKey) || (t.workers||[]).includes(assignKey) || t.assignee === assignKey);
      const assignedProjects = storage.projects.filter(p => (p.owners||[]).includes(assignKey) || (p.workers||[]).includes(assignKey) || p.assignee === assignKey);
      
      html += `<h2 style="font-size:24px; font-weight:700; margin-bottom:5px; padding-right:30px;">${isTeam ? '<i data-lucide="users" style="color:var(--primary)"></i> ' : '<i data-lucide="user" style="color:var(--accent-light)"></i> '}${title}</h2>`;
      html += `<p style="color:#a1a1aa; margin-bottom: 25px;">${subtitle}</p>`;
      
      if (isTeam && entity.members && entity.members.length > 0) {
          html += `<h3 style="font-size:15px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; color:#c7d2fe;">Skład zespołu</h3>`;
          html += `<div style="margin-bottom: 25px; display:flex; flex-direction:column; gap:6px;">`;
          entity.members.forEach(mId => {
              const c = storage.contacts.find(x => x.id === mId);
              if (c) html += `<div style="background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:6px; font-size:14px; display:flex; align-items:center; gap:8px;"><i data-lucide="user" style="width:14px; height:14px; opacity:0.6;"></i> ${c.first} ${c.last}</div>`;
          });
          html += `</div>`;
      }
      
      html += `<h3 style="font-size:15px; margin-bottom:12px; margin-top:25px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; color:var(--success);">📁 Przypisane Projekty (${assignedProjects.length})</h3>`;
      html += `<div class="detail-assigned-list" style="display:flex; flex-direction:column; gap:8px;">`;
      assignedProjects.forEach(p => {
          html += `<div class="card-sm" style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); padding:12px; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:0.2s;" onclick="showView('projects'); closeDetailPanel();">
            <span style="font-weight:600; font-size:14px; flex:1;">${p.name}</span>
            <span class="badge ${getStatusClass(p.status)}">${p.status}</span>
          </div>`;
      });
      if(assignedProjects.length===0) html += '<p style="font-size:13px;color:#a1a1aa;">Brak aktywnych projektów</p>';
      html += `</div>`;
      
      html += `<h3 style="font-size:15px; margin-bottom:12px; margin-top:25px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; color:var(--primary);">✅ Przypisane Zadania (${assignedTasks.length})</h3>`;
      html += `<div class="detail-assigned-list" style="display:flex; flex-direction:column; gap:8px;">`;
      assignedTasks.forEach(t => {
          html += `<div class="card-sm" style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); padding:12px; border-radius:8px; cursor:pointer; transition:0.2s;" onclick="openDetail('task', '${t.id}')">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="font-weight:600; font-size:14px; flex:1;">${t.name}</span><span class="badge ${getStatusClass(t.status)}">${t.status}</span></div>
            ${t.dueDate ? `<div style="font-size:12px; color:#a1a1aa; display:flex; align-items:center; gap:4px;"><i data-lucide="calendar" style="width:12px;height:12px;"></i> Deadline: ${formatDate(t.dueDate)}</div>` : ''}
          </div>`;
      });
      if(assignedTasks.length===0) html += '<p style="font-size:13px;color:#a1a1aa;">Brak przypisanych zadań</p>';
      html += `</div>`;
  }
  else if (type === 'task') {
      const t = storage.tasks.find(x => x.id === id);
      if (!t) return;
      html += `<h2 style="font-size:22px; font-weight:700; margin-bottom:10px; padding-right:30px;"><i data-lucide="check-square" style="color:var(--primary)"></i> ${t.name}</h2>`;
      html += `<span class="badge ${getStatusClass(t.status)}">${t.status}</span>`;
      html += getAssigneesHtml(t.owners, t.workers);
      html += `<div style="margin-top:20px; padding:15px; background:rgba(0,0,0,0.2); border-radius:8px; font-size:14px; color:#e4e4e7; line-height:1.5;">${t.desc || 'Brak opisu'}</div>`;
      html += renderRelatedLogs(t.id);
  }
  else if (type === 'project') {
      const p = storage.projects.find(x => x.id === id);
      if (!p) return;
      const associatedTasks = storage.tasks.filter(t => t.projectId === p.id);
      
      html += `<h2 style="font-size:22px; font-weight:700; margin-bottom:10px; padding-right:30px;"><i data-lucide="folder" style="color:var(--success)"></i> ${p.name}</h2>`;
      html += `<span class="badge ${getStatusClass(p.status)}">${p.status}</span>`;
      html += getAssigneesHtml(p.owners, p.workers);
      html += `<div style="margin-top:20px; padding:15px; background:rgba(0,0,0,0.2); border-radius:8px; font-size:14px; color:#e4e4e7; line-height:1.5;">${p.desc || 'Brak opisu'}</div>`;
      
      html += `<h3 style="font-size:15px; margin-bottom:12px; margin-top:25px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; color:var(--primary);">Zadania w projekcie (${associatedTasks.length})</h3>`;
      html += `<div class="detail-assigned-list" style="display:flex; flex-direction:column; gap:8px;">`;
      associatedTasks.forEach(t => {
          html += `<div class="card-sm" style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); padding:12px; border-radius:8px; cursor:pointer; transition:0.2s;" onclick="openDetail('task', '${t.id}')">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="font-weight:600; font-size:14px; flex:1;">${t.name}</span><span class="badge ${getStatusClass(t.status)}">${t.status}</span></div>
            ${getAssigneesHtml(t.owners, t.workers)}
          </div>`;
      });
      if(associatedTasks.length===0) html += '<p style="font-size:13px;color:#a1a1aa;">Brak zadań w tym projekcie</p>';
      html += `</div>`;
      
      html += renderRelatedLogs(p.id);
  }
  else if (type === 'area') {
      const a = storage.areas.find(x => x.id === id);
      if (!a) return;
      const associatedProjects = storage.projects.filter(p => p.areaId === a.id);
      
      html += `<h2 style="font-size:22px; font-weight:700; margin-bottom:10px; padding-right:30px; display:flex; gap:8px; align-items:center;"><span style="width:16px;height:16px;border-radius:50%;background:${a.color};display:inline-block;"></span> ${a.name}</h2>`;
      html += getAssigneesHtml(a.owners, a.workers);
      html += `<div style="margin-top:20px; padding:15px; background:rgba(0,0,0,0.2); border-radius:8px; font-size:14px; color:#e4e4e7; line-height:1.5;">${a.desc || 'Brak opisu'}</div>`;
      
      html += `<h3 style="font-size:15px; margin-bottom:12px; margin-top:25px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; color:var(--success);">Projekty w Obszarze (${associatedProjects.length})</h3>`;
      html += `<div class="detail-assigned-list" style="display:flex; flex-direction:column; gap:8px;">`;
      associatedProjects.forEach(p => {
          html += `<div class="card-sm" style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); padding:12px; border-radius:8px; cursor:pointer; transition:0.2s;" onclick="openDetail('project', '${p.id}')">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="font-weight:600; font-size:14px; flex:1;">${p.name}</span><span class="badge ${getStatusClass(p.status)}">${p.status}</span></div>
            ${getAssigneesHtml(p.owners, p.workers)}
          </div>`;
      });
      if(associatedProjects.length===0) html += '<p style="font-size:13px;color:#a1a1aa;">Brak projektów w tym obszarze</p>';
      html += `</div>`;
      
      html += renderRelatedLogs(a.id);
  }
  
  inner.innerHTML = html;
  panel.classList.add('open');
  if(overlay) overlay.classList.add('open');
  lucide.createIcons();
}

function addTaskStep() {
    const list = document.getElementById('task-steps-list');
    const div = document.createElement('div');
    div.className = 'step-item';
    div.innerHTML = `<input type="checkbox" class="step-checkbox"> <input type="text" class="form-input" placeholder="Nazwa etapu...">`;
    list.appendChild(div);
}

// --- SPEECH TO TEXT (DARMOWE) ---
function startDictation(inputId, btnId) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Twoja przeglądarka nie obsługuje dyktowania głosowego. Użyj Chrome lub Edge.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pl-PL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const btn = document.getElementById(btnId);
    const inputEl = document.getElementById(inputId);
    const originalHtml = btn.innerHTML;

    recognition.onstart = function() {
        btn.innerHTML = '<i data-lucide="mic" style="width:12px; height:12px; color: var(--danger);"></i> Słucham...';
        btn.style.borderColor = 'var(--danger)';
        if (window.lucide) lucide.createIcons();
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        if (inputEl.value) {
            inputEl.value += ' ' + transcript;
        } else {
            // uppercase first letter
            inputEl.value = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        }
    };

    recognition.onerror = function(event) {
        console.error('Błąd dyktowania:', event.error);
        if (event.error === 'not-allowed') {
            showToast('Musisz zezwolić przeglądarce na dostęp do mikrofonu.');
        } else {
            showToast('Przerwano nasłuchiwanie.');
        }
    };

    recognition.onend = function() {
        btn.innerHTML = originalHtml;
        btn.style.borderColor = 'rgba(255,255,255,0.3)';
        if (window.lucide) lucide.createIcons();
    };

    recognition.start();
}
