"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { STATUSES, PRIORITIES } from "@/lib/constants";
import { formatDate, statusToClass, priorityToClass, isOverdue } from "@/lib/utils";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterArea, setFilterArea] = useState(searchParams.get("areaId") || "");
  const [filterStatus, setFilterStatus] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ areaId: "", name: "", description: "", status: "Zaplanowane", priority: "Normalny", startDate: "", endDate: "", budget: "" });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterArea) params.set("areaId", filterArea);
    if (filterStatus) params.set("status", filterStatus);
    const [p, a] = await Promise.all([
      fetch(`/api/projects?${params}`).then(r => r.json()),
      fetch("/api/areas").then(r => r.json()),
    ]);
    setProjects(p); setAreas(a); setLoading(false);
  }, [filterArea, filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name.trim() || !form.areaId) return alert("Wypełnij wymagane pola");
    if (editId) {
      await fetch("/api/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
    } else {
      await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowModal(false); setEditId(null); load();
  }

  async function del(id: string) {
    if (!confirm("Usunąć projekt i wszystkie jego zadania?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    load();
  }

  function openAdd() {
    setForm({ areaId: filterArea || (areas[0]?.id || ""), name: "", description: "", status: "Zaplanowane", priority: "Normalny", startDate: "", endDate: "", budget: "" });
    setEditId(null); setShowModal(true);
  }

  function openEdit(p: any) {
    setForm({
      areaId: p.areaId, name: p.name, description: p.description || "",
      status: p.status, priority: p.priority,
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      endDate: p.endDate ? p.endDate.split("T")[0] : "",
      budget: p.budget || "",
    });
    setEditId(p.id); setShowModal(true);
  }

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;
  
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projekty i Działania</h1>
          <p className="page-subtitle">{projects.length} projektów</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nowy projekt</button>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
          <option value="">Wszystkie obszary</option>
          {areas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Wszystkie statusy</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        {projects.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📁</div><p>Brak projektów. Dodaj pierwszy projekt.</p></div>
        ) : projects.map((p: any) => (
          <div key={p.id} className="card card-clickable" style={{ marginBottom: "0.75rem", borderLeft: `3px solid ${p.area?.color || "#6366f1"}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 6 }}>
                  <a href={`/projects/${p.id}`} style={{ textDecoration: "none", color: "var(--text)", fontWeight: 700, fontSize: "0.95rem" }}>{p.name}</a>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: 6 }}>
                  <span className={`badge ${statusToClass(p.status)}`}>{p.status}</span>
                  <span className={`badge ${priorityToClass(p.priority)}`}>{p.priority}</span>
                  <span className="badge" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{p.area?.name}</span>
                </div>
                {p.description && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6 }}>{p.description}</p>}
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {p.startDate && <span>Start: {formatDate(p.startDate)}</span>}
                  {p.endDate && <span>Koniec: {formatDate(p.endDate)}</span>}
                  {p.budget && <span>Budżet: {p.budget}</span>}
                  <span>{p._count?.tasks || 0} zadań</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <a href={`/projects/${p.id}`} className="btn btn-secondary btn-sm">Otwórz</a>
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(p)}>✏️</button>
                <button className="btn btn-ghost btn-icon" onClick={() => del(p.id)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={() => setShowModal(false)} />
      <div className={`modal modal-lg ${showModal ? "open" : ""}`}>
        <div className="modal-header">
          <h2>{editId ? "Edytuj projekt" : "Nowy projekt"}</h2>
          <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Obszar *</label>
            <select className="form-input" value={form.areaId} onChange={e => setForm(f => ({ ...f, areaId: e.target.value }))}>
              <option value="">-- Wybierz obszar --</option>
              {areas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nazwa projektu *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="np. WP2 – Content Development" />
          </div>
          <div className="form-group">
            <label className="form-label">Opis</label>
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
              <label className="form-label">Data rozpoczęcia</label>
              <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Data zakończenia</label>
              <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Budżet (opcjonalnie)</label>
            <input className="form-input" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="np. 15 000 EUR" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Anuluj</button>
          <button className="btn btn-primary" onClick={save}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return <Suspense><ProjectsContent /></Suspense>;
}
