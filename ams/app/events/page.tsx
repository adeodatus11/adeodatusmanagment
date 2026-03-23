"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", projectId: "", notes: "" });

  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [e, p] = await Promise.all([fetch("/api/events").then(r => r.json()), fetch("/api/projects").then(r => r.json())]);
    setEvents(e); setProjects(p); setLoading(false);
  }

  async function save() {
    if (!form.title.trim() || !form.date) return alert("Podaj tytuł i datę");
    if (editId) {
      await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
    } else {
      await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowModal(false); setEditId(null); setForm({ title: "", date: "", time: "", projectId: "", notes: "" }); load();
  }

  async function del(id: string) {
    if (!confirm("Usunąć wydarzenie?")) return;
    await fetch(`/api/events?id=${id}`, { method: "DELETE" }); load();
  }

  function openEdit(e: any) {
    setForm({
      title: e.title,
      date: e.date ? e.date.split("T")[0] : "",
      time: e.time || "",
      projectId: e.projectId || "",
      notes: e.notes || ""
    });
    setEditId(e.id);
    setShowModal(true);
  }

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;
  const now = new Date();
  const upcoming = events.filter((e: any) => new Date(e.date) >= now);
  const past = events.filter((e: any) => new Date(e.date) < now);

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Terminy i Wydarzenia</h1><p className="page-subtitle">{upcoming.length} nadchodzących · {past.length} minionych</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ title: "", date: "", time: "", projectId: "", notes: "" }); setEditId(null); setShowModal(true); }}>+ Nowe wydarzenie</button>
      </div>
      {upcoming.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Nadchodzące</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {upcoming.map((e: any) => (
              <div key={e.id} className="card" style={{ borderLeft: `4px solid ${e.project?.area?.color || "#6366f1"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{e.title}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(e)}>✏️</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => del(e.id)}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--accent)", marginBottom: 4, fontWeight: 600 }}>📅 {formatDate(e.date)}{e.time ? ` o ${e.time}` : ""}</div>
                {e.project && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>📁 {e.project.name}</div>}
                {e.notes && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8, fontStyle: "italic", borderTop: "1px solid var(--border)", paddingTop: 8 }}>{e.notes}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Minione</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {past.map((e: any) => (
              <div key={e.id} className="card" style={{ opacity: 0.6, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontWeight: 600 }}>{e.title}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{formatDate(e.date)}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(e)}>✏️</button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => del(e.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {events.length === 0 && <div className="empty-state"><div className="empty-state-icon">📅</div><p>Brak wydarzeń. Dodaj pierwszy termin.</p></div>}
      
      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={() => { setShowModal(false); setEditId(null); }} />
      <div className={`modal ${showModal ? "open" : ""}`}>
        <div className="modal-header"><h2>{editId ? "Edytuj wydarzenie" : "Nowe wydarzenie"}</h2><button className="modal-close" onClick={() => { setShowModal(false); setEditId(null); }}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Tytuł *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="np. Spotkanie WP2, Konferencja" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Data *</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Godzina</label><input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Projekt</label>
            <select className="form-input" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
              <option value="">-- Opcjonalnie --</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Notatki</label><textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Dodatkowe informacje..." /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditId(null); }}>Anuluj</button>
          <button className="btn btn-primary" onClick={save}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}
