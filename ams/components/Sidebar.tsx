"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  { href: "/areas", icon: "🗂", label: "Obszary" },
  { href: "/projects", icon: "📁", label: "Projekty" },
  { href: "/tasks", icon: "✅", label: "Zadania" },
  { href: "/log", icon: "📋", label: "Dziennik" },
  { href: "/contacts", icon: "👥", label: "Osoby" },
  { href: "/events", icon: "📅", label: "Terminy" },
  { href: "/reports", icon: "📊", label: "Raporty" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem"
          }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>AMS</span>
        </div>
        <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo (Desktop) */}
        <div className="sidebar-logo">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", boxShadow: "0 4px 12px rgba(99,102,241,0.4)"
            }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.02em" }}>AMS</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Zarządzanie</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "0.75rem 0.75rem", flex: 1 }}>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "0.6rem 0.75rem", borderRadius: 8, marginBottom: 2,
                textDecoration: "none",
                background: active ? "rgba(99,102,241,0.15)" : "transparent",
                color: active ? "#818cf8" : "var(--text-muted)",
                fontWeight: active ? 600 : 400,
                fontSize: "0.88rem",
                transition: "all 0.15s",
                borderLeft: active ? "2px solid #6366f1" : "2px solid transparent",
              }}>
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          <div suppressHydrationWarning style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {mounted ? new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" }) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
