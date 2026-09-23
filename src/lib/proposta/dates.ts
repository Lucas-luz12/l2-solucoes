const SAO_PAULO = "America/Sao_Paulo";

export function saoPauloToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addCalendarDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function dateDaysAgo(days: number, now = new Date()) {
  return addCalendarDays(saoPauloToday(now), -days);
}

/** Meio-dia em São Paulo, estável o ano todo (UTC−3, sem horário de verão). */
export function timestampOn(isoDate: string, hour = 12) {
  const utcHour = hour + 3;
  return `${isoDate}T${String(utcHour).padStart(2, "0")}:00:00.000Z`;
}

export function toSaoPauloDate(iso: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return saoPauloToday(new Date(iso));
}

export function sameMonth(iso: string, now = new Date()) {
  return toSaoPauloDate(iso).slice(0, 7) === saoPauloToday(now).slice(0, 7);
}

export function formatDate(iso: string) {
  const [year, month, day] = toSaoPauloDate(iso).split("-");
  return `${day}/${month}/${year}`;
}

export function calendarDaysUntil(isoDate: string, now = new Date()) {
  const today = saoPauloToday(now);
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = isoDate.slice(0, 10).split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

export function relativePast(iso: string, now = new Date()) {
  const days = -calendarDaysUntil(toSaoPauloDate(iso), now);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export function monthLabel(now = new Date()) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: SAO_PAULO,
  }).format(now);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
