"use client";
import { useEffect, useState, useCallback } from "react";
import { LOG_TYPES, LOG_TYPE_ICONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function LogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ actionType: "Inne", description: "", date: "", projectId: "", taskId: "", contactId: "" });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterProject) params.set("projectId", filterProject);
    const [l, p, t, c] = await Promise.all([
      fetch(`/api/logs?${params}`).then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]);
    setLogs(l); setProjects(p); setTasks(t); setContacts(c); setLoading(false);
  }, [filterType, filterProject]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.description.trim()) return;
    await fetch("/api/logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, date: form.date ? new Date(form.date).toISOString() : new Date().toISOString() }),
    });
    setShowModal(false); setForm({ actionType: "Inne", description: "", date: "", projectId: "", taskId: "", contactId: "" });
    load();
  }

  async function del(id: string) {
    await fetch(`/api/logs?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;

  // Group logs by date
  const filtered = logs.filter((l: any) => l.description.toLowerCase().includes(search.toLowerCase()));
  const grouped: Record<string, any[]> = {};
  filtered.forEach((l: any) => {
    const dateKey = new Date(l.date).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(l);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dziennik Działań</h1>
          <p className="page-subtitle">Chronologiczny zapis aktywności · {logs.length} wpisów</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(f => ({ ...f, date: new Date().toISOString().split("T")[0] })); setShowModal(true); }}>+ Nowy wpis</button>
      </div>

      <div className="card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input className="form-input" placeholder="Szukaj w opisie..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: "auto" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Wszystkie typy</option>
          {LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="form-input" style={{ width: "auto" }} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">Wszystkie projekty</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="timeline">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {date}
              <div style={{ height: "1px", flex: 1, background: "var(--border)", opacity: 0.5 }}></div>
            </h3>
            {items.map((log: any) => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-icon">{LOG_TYPE_ICONS[log.actionType] || "📝"}</div>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className="badge" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text)", border: "1px solid var(--border)" }}>{log.actionType}</span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{new Date(log.date).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div style={{ fontWeight: 500, lineHeight: 1.5, marginBottom: 8, fontSize: "0.95rem" }}>{log.description}</div>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {log.project && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>📁 {log.project.name}</div>}
                    {log.task && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>✅ {log.task.name}</div>}
                    {log.contact && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>👤 {log.contact.firstName} {log.contact.lastName}</div>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => del(log.id)} style={{ flexShrink: 0 }}>🗑</button>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon">🔍</div><p>Nie znaleziono wpisów spełniających kryteria.</p></div>}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={() => setShowModal(false)} />
      <div className={`modal ${showModal ? "open" : ""}`}>
        <div className="modal-header">
          <h2>Nowy wpis do dziennika</h2>
          <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Typ działania</label>
              <select className="form-input" value={form.actionType} onChange={e => setForm(f => ({ ...f, actionType: e.target.value }))}>
                {LOG_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Opis *</label>
            <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Co się wydarzyło? Z kim? Co ustalono? Jaki był wynik?" />
          </div>
          <div className="form-group">
            <label className="form-label">Projekt</label>
            <select className="form-input" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value, taskId: "" }))}>
              <option value="">-- Opcjonalnie --</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Zadanie</label>
            <select className="form-input" value={form.taskId} onChange={e => setForm(f => ({ ...f, taskId: e.target.value }))}>
              <option value="">-- Opcjonalnie --</option>
              {(form.projectId ? tasks.filter((t: any) => t.projectId === form.projectId) : tasks).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Osoba</label>
            <select className="form-input" value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}>
              <option value="">-- Opcjonalnie --</option>
              {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Anuluj</button>
          <button className="btn btn-primary" onClick={save}>Zapisz wpis</button>
        </div>
      </div>
    </div>
  );
}
