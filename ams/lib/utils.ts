import { format, isToday, isTomorrow, isPast, isWithinInterval, addDays } from "date-fns";
import { pl } from "date-fns/locale";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isToday(d)) return "Dzisiaj";
  if (isTomorrow(d)) return "Jutro";
  return format(d, "d MMM yyyy", { locale: pl });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: pl });
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}

export function isDueThisWeek(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 7) });
}

export function statusToClass(status: string): string {
  const map: Record<string, string> = {
    "Pomysł": "status-idea",
    "Do decyzji": "status-decide",
    "Zaplanowane": "status-planned",
    "W toku": "status-inprogress",
    "Czekam na kogoś": "status-waiting",
    "Zablokowane": "status-blocked",
    "Do poprawy": "status-revision",
    "Gotowe": "status-done",
    "Archiwum": "status-archive",
  };
  return map[status] || "status-idea";
}

export function priorityToClass(priority: string): string {
  const map: Record<string, string> = {
    "Niski": "priority-low",
    "Normalny": "priority-normal",
    "Wysoki": "priority-high",
    "Krytyczny": "priority-critical",
  };
  return map[priority] || "priority-normal";
}

export function getInitials(first: string, last: string) {
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
}

export function stringToColor(str: string): string {
  const colors = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
