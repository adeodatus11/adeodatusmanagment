"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, isOverdue, isDueThisWeek, statusToClass, priorityToClass } from "@/lib/utils";
import { LOG_TYPE_ICONS } from "@/lib/constants";

export default function Dashboard() {
  const [kpis, setKpis] = useState({ overdue: 0, week: 0, waiting: 0, active: 0 });
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [weekTasks, setWeekTasks] = useState<any[]>([]);
  const [waitingTasks, setWaitingTasks] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Seed default areas
      await fetch("/api/areas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: true }) });
      await loadData();
    }
    init();
  }, []);

  async function loadData() {
    const [tasks, projects, logs, evts] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/logs?limit=8").then(r => r.json()),
      fetch("/api/events").then(r => r.json()),
    ]);

    const now = new Date();
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);

    const overdue = tasks.filter((t: any) => t.dueDate && isOverdue(t.dueDate) && t.status !== "Gotowe" && t.status !== "Archiwum");
    const week = tasks.filter((t: any) => t.dueDate && !isOverdue(t.dueDate) && isDueThisWeek(t.dueDate) && t.status !== "Gotowe" && t.status !== "Archiwum");
    const waiting = tasks.filter((t: any) => t.status === "Czekam na kogoś");
    const active = projects.filter((p: any) => p.status === "W toku" || p.status === "Zaplanowane");

    setKpis({ overdue: overdue.length, week: week.length, waiting: waiting.length, active: active.length });
    setOverdueTasks(overdue.slice(0, 5));
    setWeekTasks(week.slice(0, 5));
    setWaitingTasks(waiting.slice(0, 5));
    setActiveProjects(active.slice(0, 6));
    setRecentLogs(logs.slice(0, 6));
    setEvents(evts.filter((e: any) => new Date(e.date) >= new Date()).slice(0, 5));
    setLoading(false);
  }

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Wczytywanie...</div>;

  const today = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle" style={{ textTransform: "capitalize" }}>{today}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/tasks" className="btn btn-secondary">+ Zadanie</Link>
          <Link href="/log" className="btn btn-primary">+ Wpis do logu</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <Link href="/tasks?filter=overdue" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ borderColor: kpis.overdue > 0 ? "rgba(239,68,68,0.4)" : undefined }}>
            <div className="kpi-icon">🔴</div>
            <div className="kpi-info">
              <div className="kpi-num" style={{ color: kpis.overdue > 0 ? "#f87171" : undefined }}>{kpis.overdue}</div>
              <div className="kpi-label">Po terminie</div>
            </div>
          </div>
        </Link>
        <Link href="/tasks?filter=week" style={{ textDecoration: "none" }}>
          <div className="kpi-card">
            <div className="kpi-icon">📅</div>
            <div className="kpi-info"><div className="kpi-num">{kpis.week}</div><div className="kpi-label">Na 7 dni</div></div>
          </div>
        </Link>
        <Link href="/tasks?filter=waiting" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ borderColor: kpis.waiting > 0 ? "rgba(249,115,22,0.4)" : undefined }}>
            <div className="kpi-icon">⏳</div>
            <div className="kpi-info">
              <div className="kpi-num" style={{ color: kpis.waiting > 0 ? "#fb923c" : undefined }}>{kpis.waiting}</div>
              <div className="kpi-label">Czekam na kogoś</div>
            </div>
          </div>
        </Link>
        <Link href="/projects" style={{ textDecoration: "none" }}>
          <div className="kpi-card">
            <div className="kpi-icon">🚀</div>
            <div className="kpi-info"><div className="kpi-num">{kpis.active}</div><div className="kpi-label">Aktywne projekty</div></div>
          </div>
        </Link>
      </div>

      {/* 3-col layout */}
      <div className="dashboard-cols">
        {/* Col 1 */}
        <div>
          <Widget title="🔴 Po terminie" link="/tasks?filter=overdue" linkText="Wszystkie">
            {overdueTasks.length === 0 ? <Empty text="Brak zadań po terminie 🎉" /> :
              overdueTasks.map((t: any) => <TaskItem key={t.id} task={t} overdue />)}
          </Widget>
          <Widget title="📅 Na 7 dni" link="/tasks?filter=week" linkText="Wszystkie">
            {weekTasks.length === 0 ? <Empty text="Brak zadań na najbliższe 7 dni" /> :
              weekTasks.map((t: any) => <TaskItem key={t.id} task={t} />)}
          </Widget>
        </div>

        {/* Col 2 */}
        <div>
          <Widget title="⏳ Czekam na kogoś" link="/tasks?filter=waiting" linkText="Wszystkie">
            {waitingTasks.length === 0 ? <Empty text="Brak oczekujących zadań" /> :
              waitingTasks.map((t: any) => <TaskItem key={t.id} task={t} />)}
          </Widget>
          <Widget title="🚀 Aktywne projekty" link="/projects" linkText="Wszystkie">
            {activeProjects.length === 0 ? <Empty text="Brak aktywnych projektów" /> :
              activeProjects.map((p: any) => (
                <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
                  <div className="widget-item">
                    <div className="widget-dot" style={{ background: p.area?.color || "#6366f1" }} />
                    <div className="widget-item-info">
                      <div className="widget-item-name">{p.name}</div>
                      <div className="widget-item-meta">{p.area?.name} · {p._count?.tasks || 0} zadań</div>
                    </div>
                    <span className={`badge ${statusToClass(p.status)}`} style={{ fontSize: "0.68rem" }}>{p.status}</span>
                  </div>
                </Link>
              ))}
          </Widget>
        </div>

        {/* Col 3 */}
        <div>
          <Widget title="📋 Ostatnie wpisy" link="/log" linkText="Dziennik">
            {recentLogs.length === 0 ? <Empty text="Brak wpisów w dzienniku" /> :
              recentLogs.map((l: any) => (
                <div key={l.id} className="widget-item" style={{ cursor: "default" }}>
                  <span style={{ fontSize: "1.1rem" }}>{LOG_TYPE_ICONS[l.actionType] || "📎"}</span>
                  <div className="widget-item-info">
                    <div className="widget-item-name">{l.description.substring(0, 60)}{l.description.length > 60 ? "..." : ""}</div>
                    <div className="widget-item-meta">{formatDate(l.date)}{l.project ? ` · ${l.project.name}` : ""}</div>
                  </div>
                </div>
              ))}
          </Widget>
          <Widget title="📅 Najbliższe terminy" link="/events" linkText="Wszystkie">
            {events.length === 0 ? <Empty text="Brak nadchodzących terminów" /> :
              events.map((e: any) => (
                <div key={e.id} className="widget-item" style={{ cursor: "default" }}>
                  <div className="widget-dot" style={{ background: e.project?.area?.color || "#6366f1", marginTop: 5 }} />
                  <div className="widget-item-info">
                    <div className="widget-item-name">{e.title}</div>
                    <div className="widget-item-meta">{formatDate(e.date)}{e.time ? ` o ${e.time}` : ""}</div>
                  </div>
                </div>
              ))}
          </Widget>
        </div>
      </div>
    </div>
  );
}

function Widget({ title, link, linkText, children }: { title: string; link?: string; linkText?: string; children: React.ReactNode }) {
  return (
    <div className="dash-widget">
      <div className="widget-header">
        <span>{title}</span>
        {link && <Link href={link} className="widget-link">{linkText}</Link>}
      </div>
      <div className="widget-body">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>{text}</div>;
}

function TaskItem({ task, overdue }: { task: any; overdue?: boolean }) {
  return (
    <Link href={`/tasks?id=${task.id}`} style={{ textDecoration: "none" }}>
      <div className="widget-item">
        <div className="widget-dot" style={{ background: task.project?.area?.color || "#6366f1" }} />
        <div className="widget-item-info">
          <div className="widget-item-name" style={{ color: overdue ? "#f87171" : undefined }}>{task.name}</div>
          <div className="widget-item-meta">
            {task.project?.name}
            {task.dueDate && ` · ${formatDate(task.dueDate)}`}
          </div>
        </div>
        <span className={`badge ${statusToClass(task.status)}`} style={{ fontSize: "0.65rem" }}>{task.status}</span>
      </div>
    </Link>
  );
}
