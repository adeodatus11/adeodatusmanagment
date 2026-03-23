"use client";
import { useEffect, useState } from "react";
import { statusToClass, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const [tasks, projects, logs, areas] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/logs").then(r => r.json()),
      fetch("/api/areas").then(r => r.json()),
    ]);
    setData({ tasks, projects, logs, areas }); setLoading(false);
  }

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "2rem" }}>Wczytywanie...</div>;

  const { tasks, projects, logs, areas } = data;
  const now = new Date();
  const overdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== "Gotowe" && t.status !== "Archiwum");
  const done = tasks.filter((t: any) => t.status === "Gotowe");
  const waiting = tasks.filter((t: any) => t.status === "Czekam na kogoś");
  const blocked = tasks.filter((t: any) => t.status === "Zablokowane");

  const statusGroups: Record<string, number> = {};
  tasks.forEach((t: any) => { statusGroups[t.status] = (statusGroups[t.status] || 0) + 1; });

  const logThisMonth = logs.filter((l: any) => {
    const d = new Date(l.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Raporty</h1><p className="page-subtitle">Analiza aktywności i postępów</p></div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Wszystkie zadania", value: tasks.length, icon: "✅" },
          { label: "Gotowe", value: done.length, icon: "🏁" },
          { label: "Po terminie", value: overdue.length, icon: "⚠️" },
          { label: "Czekam na kogoś", value: waiting.length, icon: "⏳" },
        ].map(k => (
          <div key={k.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800 }}>{k.value}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Status breakdown */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>📊 Rozkład statusów zadań</h3>
          {Object.entries(statusGroups).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
              <span className={`badge ${statusToClass(status)}`} style={{ minWidth: 130 }}>{status}</span>
              <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / tasks.length) * 100}%`, background: "var(--accent)", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, minWidth: 24 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Projects by area */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>📁 Projekty według obszarów</h3>
          {areas.map((a: any) => {
            const projCount = projects.filter((p: any) => p.areaId === a.id).length;
            const taskCount = tasks.filter((t: any) => t.project?.areaId === a.id || projects.find((p: any) => p.id === t.projectId)?.areaId === a.id).length;
            return (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{projCount} proj.</span>
              </div>
            );
          })}
        </div>

        {/* Overdue tasks */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>🔴 Zadania po terminie ({overdue.length})</h3>
          {overdue.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Brak zadań po terminie 🎉</p> :
            overdue.map((t: any) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem" }}>
                <span>{t.name}</span>
                <span style={{ color: "#f87171" }}>{formatDate(t.dueDate)}</span>
              </div>
            ))}
        </div>

        {/* This month's log */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>📋 Aktywność w tym miesiącu ({logThisMonth.length} wpisów)</h3>
          {logThisMonth.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Brak wpisów w tym miesiącu</p> :
            logThisMonth.slice(0, 8).map((l: any) => (
              <div key={l.id} style={{ fontSize: "0.82rem", marginBottom: 6, display: "flex", gap: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(l.date)}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.description}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
