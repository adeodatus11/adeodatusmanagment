"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STATUSES, PRIORITIES, LOG_TYPES } from "@/lib/constants";
import { formatDate, statusToClass, priorityToClass, isOverdue } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", status: "W toku", priority: "Normalny", dueDate: "", progress: "0", contactId: "" });
  const [logForm, setLogForm] = useState({ actionType: "Mail", description: "", date: "", contactId: "" });
  const [docForm, setDocForm] = useState({ title: "", urlOrPath: "", type: "Link" });

  useEffect(() => { load(); }, [id]);

  async function load() {
    const [projData, t, l, e, d, c] = await Promise.all([
      fetch(`/api/projects`).then(r => r.json()).then(ps => ps.find((p: any) => p.id === id)),
      fetch(`/api/tasks?projectId=${id}`).then(r => r.json()),
      fetch(`/api/logs?projectId=${id}`).then(r => r.json()),
      fetch(`/api/events?projectId=${id}`).then(r => r.json()),
      fetch(`/api/documents?projectId=${id}`).then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]);
    setProject(projData); setTasks(t); setLogs(l); setEvents(e); setDocuments(d); setContacts(c); setLoading(false);
  }

  function closeAllModals() {
    setShowTaskModal(false);
    setShowLogModal(false);
    setShowDocModal(false);
  }

  async function saveTask() {
    if (!taskForm.name.trim()) return;
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...taskForm, projectId: id, progress: parseInt(taskForm.progress) || 0, contactId: taskForm.contactId || null }) });
    setShowTaskModal(false); setTaskForm({ name: "", description: "", status: "W toku", priority: "Normalny", dueDate: "", progress: "0", contactId: "" }); load();
  }

  async function saveLog() {
    if (!logForm.description.trim()) return;
    await fetch("/api/logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...logForm, projectId: id, date: logForm.date ? new Date(logForm.date).toISOString() : new Date().toISOString() }) });
    setShowLogModal(false); setLogForm({ actionType: "Mail", description: "", date: "", contactId: "" }); load();
  }

  async function saveDoc() {
    if (!docForm.title.trim()) return;
    await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...docForm, projectId: id }) });
    setShowDocModal(false); setDocForm({ title: "", urlOrPath: "", type: "Link" }); load();
  }

  async function delDoc(did: string) {
    if (!confirm("Usunąć dokument?")) return;
    await fetch(`/api/documents?id=${did}`, { method: "DELETE" }); load();
  }

  async function delTask(tid: string) {
    if (!confirm("Usunąć zadanie?")) return;
    await fetch(`/api/tasks?id=${tid}`, { method: "DELETE" }); load();
  }

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;
  if (!project) return <div style={{ padding: "2rem", color: "#f87171" }}>Projekt nie znaleziony. <Link href="/projects">Wróć</Link></div>;

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <Link href="/projects" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem" }}>← Wszystkie projekty</Link>
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.area?.name} · {project.status}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => { closeAllModals(); setShowDocModal(true); }}>+ Dokument</button>
          <button className="btn btn-secondary" onClick={() => { closeAllModals(); setShowLogModal(true); }}>+ Wpis do logu</button>
          <button className="btn btn-primary" onClick={() => { closeAllModals(); setShowTaskModal(true); }}>+ Zadanie</button>
        </div>
      </div>
      {project.description && <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>{project.description}</p>}
      {(project.startDate || project.endDate) && (
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {project.startDate && <span>📅 Start: {formatDate(project.startDate)}</span>}
          {project.endDate && <span>🏁 Koniec: {formatDate(project.endDate)}</span>}
        </div>
      )}

      {/* Layout Grid */}
      <div className="project-detail-layout">
        {/* Tasks */}
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Zadania ({tasks.length})</div>
          {tasks.length === 0 ? <div className="empty-state"><div className="empty-state-icon">✅</div><p>Brak zadań w tym projekcie</p></div> :
            tasks.map((t: any) => {
              const od = t.dueDate && isOverdue(t.dueDate) && t.status !== "Gotowe";
              return (
                <div key={t.id} className="task-card" style={{ cursor: "default" }}>
                  <div className="task-card-left">
                    <div className="task-card-name" style={{ color: od ? "#f87171" : undefined }}>{t.name}</div>
                    <div className="task-card-meta">
                      <span className={`badge ${statusToClass(t.status)}`}>{t.status}</span>
                      <span className={`badge ${priorityToClass(t.priority)}`}>{t.priority}</span>
                      {t.contact && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>👤 {t.contact.firstName} {t.contact.lastName}</span>}
                    </div>
                    {t.steps?.length > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                        ☑ {t.steps.filter((s: any) => s.completed).length}/{t.steps.length} etapów
                      </div>
                    )}
                  </div>
                  <div className="task-card-right">
                    {t.dueDate && <span className={`task-due ${od ? "overdue" : ""}`}>{formatDate(t.dueDate)}</span>}
                    {t.progress > 0 && (
                      <div style={{ width: 60 }}>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${t.progress}%` }} /></div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "right" }}>{t.progress}%</div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 4 }}>
                      <Link href={`/tasks?id=${t.id}`} className="btn btn-ghost btn-icon btn-sm">✏️</Link>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => delTask(t.id)}>🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Log */}
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Historia działań ({logs.length})</div>
          <div className="card" style={{ maxHeight: 500, overflowY: "auto" }}>
            {logs.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem" }}>Brak wpisów w dzienniku</p> :
              <div className="timeline">
                {logs.map((l: any) => (
                  <div key={l.id} className="timeline-item">
                    <div className="timeline-icon" style={{ width: 28, height: 28, fontSize: "0.9rem" }}>
                      {({ "Mail": "✉️", "Spotkanie": "🤝", "Ustalenie": "📌", "Decyzja": "⚖️", "Telefon": "📞", "Dokument": "📄", "Raport": "📊", "Delegacja": "✈️" } as any)[l.actionType] || "📎"}
                    </div>
                    <div className="timeline-content">
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>{formatDate(l.date)} · {l.actionType}</div>
                      <div style={{ fontSize: "0.85rem" }}>{l.description}</div>
                    </div>
                  </div>
                ))}
              </div>}
          </div>
        </div>
      </div>

      {/* Documents section */}
      <div style={{ marginTop: "2rem" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Dokumenty i Linki ({documents.length})</div>
        {documents.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Brak dokumentów powiązanych z projektem</p> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {documents.map((d: any) => (
              <div key={d.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                  <span style={{ fontSize: "1.2rem" }}>
                    {d.type === "PDF" ? "📕" : d.type === "Obraz" ? "🖼️" : d.type === "Folder" ? "📁" : "🔗"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                    {d.urlOrPath && (
                      <a href={d.urlOrPath} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary-color)", textDecoration: "none" }}>
                        Otwórz ↗
                      </a>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => delDoc(d.id)}>🗑</button>
              </div>
            ))}
          </div>
        }
      </div>

      {/* Task Modal */}
      <div className={`modal-overlay ${showTaskModal ? "open" : ""}`} onClick={() => setShowTaskModal(false)} />
      <div className={`modal ${showTaskModal ? "open" : ""}`}>
        <div className="modal-header"><h2>Nowe zadanie</h2><button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Nazwa *</label><input className="form-input" value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Opis</label><textarea className="form-input" rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input" value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Priorytet</label>
              <select className="form-input" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Postęp (%)</label><input type="number" className="form-input" value={taskForm.progress} onChange={e => setTaskForm(f => ({ ...f, progress: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Osoba / Czekam na</label>
            <select className="form-input" value={taskForm.contactId} onChange={e => setTaskForm(f => ({ ...f, contactId: e.target.value }))}>
              <option value="">-- Opcjonalnie --</option>
              {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Anuluj</button><button className="btn btn-primary" onClick={saveTask}>Zapisz</button></div>
      </div>

      {/* Log Modal */}
      <div className={`modal-overlay ${showLogModal ? "open" : ""}`} onClick={() => setShowLogModal(false)} />
      <div className={`modal ${showLogModal ? "open" : ""}`}>
        <div className="modal-header"><h2>Nowy wpis do logu</h2><button className="modal-close" onClick={() => setShowLogModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Typ</label>
              <select className="form-input" value={logForm.actionType} onChange={e => setLogForm(f => ({ ...f, actionType: e.target.value }))}>
                {LOG_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Data</label><input type="date" className="form-input" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Opis *</label><textarea className="form-input" rows={4} value={logForm.description} onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))} placeholder="Co się wydarzyło? Jakie ustalenia?" /></div>
          <div className="form-group"><label className="form-label">Osoba</label>
            <select className="form-input" value={logForm.contactId} onChange={e => setLogForm(f => ({ ...f, contactId: e.target.value }))}>
              <option value="">-- Opcjonalnie --</option>
              {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Anuluj</button><button className="btn btn-primary" onClick={saveLog}>Zapisz</button></div>
      </div>

      {/* Document Modal */}
      <div className={`modal-overlay ${showDocModal ? "open" : ""}`} onClick={() => setShowDocModal(false)} />
      <div className={`modal ${showDocModal ? "open" : ""}`}>
        <div className="modal-header"><h2>Nowy dokument / link</h2><button className="modal-close" onClick={() => setShowDocModal(false)}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Tytuł *</label><input className="form-input" value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))} placeholder="np. Umowa, Folder projektu" /></div>
          <div className="form-group"><label className="form-label">Link / Ścieżka</label><input className="form-input" value={docForm.urlOrPath} onChange={e => setDocForm(f => ({ ...f, urlOrPath: e.target.value }))} placeholder="https://... lub /ścieżka/" /></div>
          <div className="form-group"><label className="form-label">Typ</label>
            <select className="form-input" value={docForm.type} onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))}>
              <option value="Link">Link / Inne</option>
              <option value="PDF">Dokument PDF</option>
              <option value="Obraz">Obraz / Zdjęcie</option>
              <option value="Folder">Folder lokalny / chmura</option>
            </select>
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDocModal(false)}>Anuluj</button><button className="btn btn-primary" onClick={saveDoc}>Zapisz</button></div>
      </div>
    </div>
  );
}
