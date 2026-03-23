"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { STATUSES, PRIORITIES, LOG_TYPES } from "@/lib/constants";
import { formatDate, statusToClass, priorityToClass, isOverdue, isDueThisWeek, stringToColor } from "@/lib/utils";

function TasksContent() {
  const searchParams = useSearchParams();
  const preFilter = searchParams.get("filter");
  const focusId = searchParams.get("id");

  const [tasks, setTasks] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [steps, setSteps] = useState<{ title: string }[]>([]);
  const [form, setForm] = useState({ projectId: "", name: "", description: "", status: "W toku", priority: "Normalny", dueDate: "", progress: "0", contactId: "" });
  // Log modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [logForm, setLogForm] = useState({ actionType: "Inne", description: "", date: "", projectId: "", taskId: "", contactId: "" });
  const [docForm, setDocForm] = useState({ title: "", urlOrPath: "", type: "Link" });
  const [taskDocuments, setTaskDocuments] = useState<any[]>([]);

  function closeAllModals() {
    setShowModal(false);
    setShowLogModal(false);
    setShowDocModal(false);
  }

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterArea) params.set("areaId", filterArea);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPriority) params.set("priority", filterPriority);
    const [t, a, p, c] = await Promise.all([
      fetch(`/api/tasks?${params}`).then(r => r.json()),
      fetch("/api/areas").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]);
    setTasks(t); setAreas(a); setProjects(p); setContacts(c); setLoading(false);
    if (focusId) {
      const found = t.find((x: any) => x.id === focusId);
      if (found) setSelectedTask(found);
    }
  }, [filterArea, filterStatus, filterPriority, focusId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedTask) {
      fetch(`/api/documents?taskId=${selectedTask.id}`)
        .then(r => r.json())
        .then(setTaskDocuments);
    } else {
      setTaskDocuments([]);
    }
  }, [selectedTask]);

  async function saveDoc() {
    if (!docForm.title.trim() || !selectedTask) return;
    await fetch("/api/documents", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ ...docForm, taskId: selectedTask.id, projectId: selectedTask.projectId }) 
    });
    setShowDocModal(false);
    setDocForm({ title: "", urlOrPath: "", type: "Link" });
    // Refresh documents
    fetch(`/api/documents?taskId=${selectedTask.id}`).then(r => r.json()).then(setTaskDocuments);
  }

  async function delDoc(id: string) {
    if (!confirm("Usunąć dokument?")) return;
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    setTaskDocuments(docs => docs.filter(d => d.id !== id));
  }

  async function save() {
    if (!form.name.trim() || !form.projectId) return alert("Podaj nazwę i projekt");
    const body = { ...form, progress: parseInt(form.progress) || 0, contactId: form.contactId || null, steps };
    if (editId) {
      await fetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form, progress: parseInt(form.progress) || 0, contactId: form.contactId || null }) });
    } else {
      await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setShowModal(false); setEditId(null); setSteps([]); load();
  }

  async function del(id: string) {
    if (!confirm("Usunąć zadanie?")) return;
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    if (selectedTask?.id === id) setSelectedTask(null);
    load();
  }

  async function toggleStep(step: any) {
    await fetch("/api/steps", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: step.id, completed: !step.completed }) });
    load();
  }

  async function addStep(title: string) {
    if (!title.trim()) return;
    if (editId) {
      await fetch("/api/steps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: editId, title, order: selectedTask?.steps?.length || 0 }) });
      load();
    } else {
      setSteps(s => [...s, { title }]);
    }
  }

  async function delStep(id: string, index: number) {
    if (editId) {
      await fetch(`/api/steps?id=${id}`, { method: "DELETE" });
      load();
    } else {
      setSteps(st => st.filter((_, j) => j !== index));
    }
  }

  async function saveLog() {
    if (!logForm.description.trim()) return;
    await fetch("/api/logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...logForm, date: logForm.date || new Date().toISOString() }) });
    setShowLogModal(false); setLogForm({ actionType: "Inne", description: "", date: "", projectId: "", taskId: "", contactId: "" });
  }

  function openAdd() {
    setForm({ projectId: projects[0]?.id || "", name: "", description: "", status: "W toku", priority: "Normalny", dueDate: "", progress: "0", contactId: "" });
    setSteps([]); setEditId(null); setShowModal(true);
  }
  function openEdit(t: any) {
    setForm({ projectId: t.projectId, name: t.name, description: t.description || "", status: t.status, priority: t.priority, dueDate: t.dueDate ? t.dueDate.split("T")[0] : "", progress: String(t.progress), contactId: t.contactId || "" });
    setSteps(t.steps || []);
    setEditId(t.id); setShowModal(true);
  }
  function openLogForTask(t: any) {
    setLogForm(f => ({ ...f, taskId: t.id, projectId: t.projectId, date: new Date().toISOString().split("T")[0] }));
    setShowLogModal(true);
  }

  // Filtering
  let filtered = tasks;
  if (preFilter === "overdue") filtered = tasks.filter((t: any) => t.dueDate && isOverdue(t.dueDate) && t.status !== "Gotowe" && t.status !== "Archiwum");
  else if (preFilter === "week") filtered = tasks.filter((t: any) => t.dueDate && !isOverdue(t.dueDate) && isDueThisWeek(t.dueDate) && t.status !== "Gotowe" && t.status !== "Archiwum");
  else if (preFilter === "waiting") filtered = tasks.filter((t: any) => t.status === "Czekam na kogoś");
  if (filterSearch) filtered = filtered.filter((t: any) => t.name.toLowerCase().includes(filterSearch.toLowerCase()));

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Zadania</h1>
          <p className="page-subtitle">{filtered.length} zadań {preFilter ? `(filtr: ${preFilter})` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => { closeAllModals(); setLogForm(f => ({ ...f, date: new Date().toISOString().split("T")[0] })); setShowLogModal(true); }}>+ Log</button>
          <button className="btn btn-primary" onClick={() => { closeAllModals(); openAdd(); }}>+ Nowe zadanie</button>
        </div>
      </div>

      {!preFilter && (
        <div className="filter-bar">
          <select className="filter-select" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
            <option value="">Wszystkie obszary</option>
            {areas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Wszystkie statusy</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">Wszystkie priorytety</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <input className="filter-input" placeholder="Szukaj zadań..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
        </div>
      )}

      <div className="task-view-layout">
        {/* Task list */}
        <div style={{ flex: 1 }}>
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><p>Brak zadań do wyświetlenia</p></div>
          ) : filtered.map((t: any) => {
            const od = t.dueDate && isOverdue(t.dueDate) && t.status !== "Gotowe";
            const isSelected = selectedTask?.id === t.id;
            return (
              <div key={t.id} className={`task-card ${od ? "task-overdue" : ""}`} style={{ borderColor: isSelected ? "var(--accent)" : undefined }} onClick={() => setSelectedTask(isSelected ? null : t)}>
                <div className="widget-dot" style={{ background: t.project?.area?.color || "#6366f1", flexShrink: 0, marginTop: 4 }} />
                <div className="task-card-left">
                  <div className="task-card-name">{t.name}</div>
                  <div className="task-card-meta">
                    <span className={`badge ${statusToClass(t.status)}`}>{t.status}</span>
                    <span className={`badge ${priorityToClass(t.priority)}`}>{t.priority}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.project?.name}</span>
                  </div>
                </div>
                <div className="task-card-right">
                  {t.dueDate && <span className={`task-due ${od ? "overdue" : ""}`}>{od ? "⚠ " : ""}{formatDate(t.dueDate)}</span>}
                  {t.progress > 0 && <div style={{ width: 60 }}><div className="progress-bar"><div className="progress-fill" style={{ width: `${t.progress}%` }} /></div></div>}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); closeAllModals(); openLogForTask(t); }}>📋</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); closeAllModals(); openEdit(t); }}>✏️</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); del(t.id); }}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Task detail panel */}
        {selectedTask && (
          <div className="task-detail-panel">
            <div className="card" style={{ position: "sticky", top: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.95rem" }}>{selectedTask.name}</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTask(null)}>✕</button>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span className={`badge ${statusToClass(selectedTask.status)}`}>{selectedTask.status}</span>
                <span className={`badge ${priorityToClass(selectedTask.priority)}`}>{selectedTask.priority}</span>
              </div>
              {selectedTask.description && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{selectedTask.description}</p>}
              {selectedTask.dueDate && <div style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>📅 {formatDate(selectedTask.dueDate)}</div>}
              {selectedTask.contact && <div style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>👤 {selectedTask.contact.firstName} {selectedTask.contact.lastName}</div>}
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Postęp: {selectedTask.progress}%</div>
                <div className="progress-bar" style={{ height: 8 }}><div className="progress-fill" style={{ width: `${selectedTask.progress}%` }} /></div>
              </div>
              {taskDocuments?.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dokumenty ({taskDocuments.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {taskDocuments.map((d: any) => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: "1rem" }}>{d.type === "PDF" ? "📕" : d.type === "Obraz" ? "🖼️" : "🔗"}</span>
                          <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                            {d.urlOrPath ? <a href={d.urlOrPath} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{d.title}</a> : d.title}
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => delDoc(d.id)} style={{ padding: 2, height: 24, width: 24 }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { closeAllModals(); setShowDocModal(true); }}>+ Dokument</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { closeAllModals(); openLogForTask(selectedTask); }}>+ Log</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { closeAllModals(); openEdit(selectedTask); }}>Edytuj</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={() => setShowModal(false)} />
      <div className={`modal modal-lg ${showModal ? "open" : ""}`}>
        <div className="modal-header">
          <h2>{editId ? "Edytuj zadanie" : "Nowe zadanie"}</h2>
          <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Projekt *</label>
            <select className="form-input" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
              <option value="">-- Wybierz projekt --</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.area?.name} → {p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nazwa zadania *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="np. Przygotować raport WP2" />
          </div>
          <div className="form-group">
            <label className="form-label">Opis / Notatki</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priorytet</label>
              <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Postęp (%)</label>
              <input type="number" className="form-input" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} min="0" max="100" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Osoba / Czekam na</label>
            <select className="form-input" value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}>
              <option value="">-- Opcjonalnie --</option>
              {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} {c.organization ? `(${c.organization})` : ""}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Etapy / Checklista</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(editId ? (selectedTask?.steps || []) : steps).map((s: any, i: number) => (
                <div key={editId ? s.id : i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: 8 }}>
                  <input 
                    className="form-input" 
                    value={s.title} 
                    onChange={e => {
                      if (!editId) {
                        setSteps(st => st.map((x, j) => j === i ? { ...x, title: e.target.value } : x));
                      }
                    }} 
                    placeholder="Tytuł etapu..."
                    readOnly={!!editId}
                    style={{ background: "transparent", border: "none" }}
                  />
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => delStep(s.id, i)}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: 4 }}>
                <input 
                  id="new-step-input"
                  className="form-input" 
                  placeholder="Nowy etap..." 
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addStep((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => {
                    const input = document.getElementById("new-step-input") as HTMLInputElement;
                    addStep(input.value);
                    input.value = "";
                  }}
                >Dodaj</button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Anuluj</button>
          <button className="btn btn-primary" onClick={save}>Zapisz</button>
        </div>
      </div>

      {/* Log Modal */}
      <div className={`modal-overlay ${showLogModal ? "open" : ""}`} onClick={() => setShowLogModal(false)} />
      <div className={`modal ${showLogModal ? "open" : ""}`}>
        <div className="modal-header">
          <h2>Nowy wpis do dziennika</h2>
          <button className="modal-close" onClick={() => setShowLogModal(false)}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Typ</label>
              <select className="form-input" value={logForm.actionType} onChange={e => setLogForm(f => ({ ...f, actionType: e.target.value }))}>
                {LOG_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Opis *</label>
            <textarea className="form-input" rows={4} value={logForm.description} onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))} placeholder="Co się wydarzyło? Z kim? Co ustalono?" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Anuluj</button>
          <button className="btn btn-primary" onClick={saveLog}>Zapisz wpis</button>
        </div>
      </div>

      {/* Document Modal */}
      <div className={`modal-overlay ${showDocModal ? "open" : ""}`} onClick={() => setShowDocModal(false)} />
      <div className={`modal ${showDocModal ? "open" : ""}`}>
        <div className="modal-header"><h2>Nowy dokument</h2><button className="modal-close" onClick={() => setShowDocModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Tytuł *</label><input className="form-input" value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Link / Ścieżka</label><input className="form-input" value={docForm.urlOrPath} onChange={e => setDocForm(f => ({ ...f, urlOrPath: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Typ</label>
            <select className="form-input" value={docForm.type} onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))}>
              <option value="Link">Link</option>
              <option value="PDF">PDF</option>
              <option value="Obraz">Obraz</option>
            </select>
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDocModal(false)}>Anuluj</button><button className="btn btn-primary" onClick={saveDoc}>Dodaj</button></div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return <Suspense><TasksContent /></Suspense>;
}
