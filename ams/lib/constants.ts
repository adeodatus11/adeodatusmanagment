export const AREA_COLORS = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
];

export const STATUSES = [
  "Pomysł",
  "Do decyzji",
  "Zaplanowane",
  "W toku",
  "Czekam na kogoś",
  "Zablokowane",
  "Do poprawy",
  "Gotowe",
  "Archiwum",
] as const;

export const PRIORITIES = ["Niski", "Normalny", "Wysoki", "Krytyczny"] as const;

export const LOG_TYPES = [
  "Mail",
  "Spotkanie",
  "Ustalenie",
  "Decyzja",
  "Telefon",
  "Dokument",
  "Raport",
  "Delegacja",
  "Inne",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  "Pomysł": "bg-slate-100 text-slate-700",
  "Do decyzji": "bg-yellow-100 text-yellow-800",
  "Zaplanowane": "bg-blue-100 text-blue-800",
  "W toku": "bg-indigo-100 text-indigo-800",
  "Czekam na kogoś": "bg-orange-100 text-orange-800",
  "Zablokowane": "bg-red-100 text-red-800",
  "Do poprawy": "bg-pink-100 text-pink-800",
  "Gotowe": "bg-green-100 text-green-800",
  "Archiwum": "bg-gray-100 text-gray-500",
};

export const PRIORITY_COLORS: Record<string, string> = {
  "Niski": "bg-slate-100 text-slate-600",
  "Normalny": "bg-blue-50 text-blue-600",
  "Wysoki": "bg-orange-100 text-orange-700",
  "Krytyczny": "bg-red-100 text-red-700",
};

export const LOG_TYPE_ICONS: Record<string, string> = {
  "Mail": "✉️",
  "Spotkanie": "🤝",
  "Ustalenie": "📌",
  "Decyzja": "⚖️",
  "Telefon": "📞",
  "Dokument": "📄",
  "Raport": "📊",
  "Delegacja": "✈️",
  "Inne": "📎",
};

export const DEFAULT_AREAS = [
  { name: "WIN4SMEs / COVE Polska", color: "#6366f1", description: "Projekt europejski, partnerstwa, raporty" },
  { name: "Szkoła – zarządzanie", color: "#0ea5e9", description: "Administracja, organizacja roku szkolnego" },
  { name: "Szkoła – projekty i promocja", color: "#10b981", description: "Konkursy, sesje, rekrutacja, szkolenia" },
  { name: "Stowarzyszenie", color: "#f59e0b", description: "Działalność stowarzyszenia" },
  { name: "IT / Automatyzacje", color: "#8b5cf6", description: "Systemy, skrypty, automatyzacje" },
  { name: "Konferencje / Współpraca międzyn.", color: "#ec4899", description: "Hamburg, INTED, wyjazdy, współpraca" },
  { name: "Administracja / Organizacja", color: "#14b8a6", description: "Sprawy organizacyjne i administracyjne" },
  { name: "Sprawy prywatne", color: "#ef4444", description: "Sprawy osobiste" },
];
