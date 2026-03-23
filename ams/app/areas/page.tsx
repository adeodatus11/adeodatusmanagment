"use client";
import { useEffect, useState } from "react";
import { AREA_COLORS } from "@/lib/constants";

export default function AreasPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: AREA_COLORS[0] });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetch("/api/areas").then(r => r.json());
    setAreas(data); setLoading(false);
  }

  async function save() {
    if (!form.name.trim()) return;
    if (editId) {
      await fetch("/api/areas", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
    } else {
      await fetch("/api/areas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowModal(false); setForm({ name: "", description: "", color: AREA_COLORS[0] }); setEditId(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("Czy na pewno usunąć ten obszar? Zostaną usunięte powiązane projekty.")) return;
    await fetch(`/api/areas?id=${id}`, { method: "DELETE" });
    load();
  }

  function openEdit(area: any) {
    setForm({ name: area.name, description: area.description || "", color: area.color });
    setEditId(area.id); setShowModal(true);
  }

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Obszary Działalności</h1>
          <p className="page-subtitle">Najwyższy poziom organizacji — {areas.length} obszarów</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: "", description: "", color: AREA_COLORS[0] }); setEditId(null); setShowModal(true); }}>+ Nowy obszar</button>
      </div>

      <div className="areas-grid">
        {areas.map((area: any) => (
          <div key={area.id} className="area-card" style={{ "--area-color": area.color } as any}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: area.color, flexShrink: 0 }} />
                <div className="area-name">{area.name}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(area)}>✏️</button>
                <button className="btn btn-ghost btn-icon" onClick={() => del(area.id)}>🗑</button>
              </div>
            </div>
            {area.description && <p className="area-desc">{area.description}</p>}
            <div className="area-meta">
              <div className="area-stat">Projekty: <span>{area._count?.projects ?? 0}</span></div>
            </div>
            <a href={`/projects?areaId=${area.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "1rem", fontSize: "0.8rem", color: area.color, textDecoration: "none", fontWeight: 600 }}>
              Zobacz projekty →
            </a>
          </div>
        ))}
        {areas.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-state-icon">🗂</div>
            <p>Brak obszarów. Kliknij „+ Nowy obszar" by dodać.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={() => setShowModal(false)} />
      <div className={`modal ${showModal ? "open" : ""}`}>
        <div className="modal-header">
          <h2>{editId ? "Edytuj obszar" : "Nowy Obszar"}</h2>
          <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nazwa obszaru *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="np. WIN4SMEs / COVE Polska" />
          </div>
          <div className="form-group">
            <label className="form-label">Opis</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Krótki opis obszaru..." />
          </div>
          <div className="form-group">
            <label className="form-label">Kolor identyfikacyjny</label>
            <div className="color-picker">
              {AREA_COLORS.map(c => (
                <div key={c} className={`color-swatch ${form.color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
              ))}
            </div>
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
