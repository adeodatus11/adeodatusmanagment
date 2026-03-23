"use client";
import { useEffect, useState, useCallback } from "react";
import { getInitials, stringToColor } from "@/lib/utils";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", organization: "", role: "", email: "", phone: "", notes: "" });

  const load = useCallback(async () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await fetch(`/api/contacts${params}`).then(r => r.json());
    setContacts(data); setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) return alert("Podaj imię i nazwisko");
    if (editId) {
      await fetch("/api/contacts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
    } else {
      await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowModal(false); setEditId(null); setForm({ firstName: "", lastName: "", organization: "", role: "", email: "", phone: "", notes: "" }); load();
  }

  async function del(id: string) {
    if (!confirm("Usunąć tę osobę z bazy?")) return;
    await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    load();
  }

  function openEdit(c: any) {
    setForm({ firstName: c.firstName, lastName: c.lastName, organization: c.organization || "", role: c.role || "", email: c.email || "", phone: c.phone || "", notes: c.notes || "" });
    setEditId(c.id); setShowModal(true);
  }

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Baza Osób</h1>
          <p className="page-subtitle">Kontakty, partnerzy, współpracownicy · {contacts.length} osób</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ firstName: "", lastName: "", organization: "", role: "", email: "", phone: "", notes: "" }); setEditId(null); setShowModal(true); }}>+ Nowa osoba</button>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <input className="filter-input" placeholder="Szukaj po nazwisku, imieniu, organizacji..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", maxWidth: 500 }} />
      </div>

      <div className="contacts-grid">
        {contacts.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}><div className="empty-state-icon">👥</div><p>Brak kontaktów. Dodaj pierwszą osobę.</p></div>
        ) : contacts.map((c: any) => {
          const color = stringToColor(`${c.firstName}${c.lastName}`);
          return (
            <div key={c.id} className="contact-card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="contact-avatar" style={{ background: `${color}22`, color }}>
                  {getInitials(c.firstName, c.lastName)}
                </div>
                <div>
                  <div className="contact-name">{c.firstName} {c.lastName}</div>
                  {c.organization && <div className="contact-org">{c.organization}</div>}
                  {c.role && <div className="contact-role">{c.role}</div>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {c.email && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>✉️ {c.email}</div>}
                {c.phone && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📞 {c.phone}</div>}
              </div>
              {c.notes && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>{c.notes}</div>}
              <div className="contact-actions">
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c._count?.tasks || 0} zadań · {c._count?.logs || 0} wpisów</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}>✏️</button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => del(c.id)}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? "open" : ""}`} onClick={() => setShowModal(false)} />
      <div className={`modal ${showModal ? "open" : ""}`}>
        <div className="modal-header">
          <h2>{editId ? "Edytuj osobę" : "Nowa Osoba"}</h2>
          <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Imię *</label><input className="form-input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Nazwisko *</label><input className="form-input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Organizacja</label><input className="form-input" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Rola / Stanowisko</label><input className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Telefon</label><input type="tel" className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Notatki</label><textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Anuluj</button>
          <button className="btn btn-primary" onClick={save}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}
