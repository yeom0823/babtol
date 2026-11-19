/** 날짜는 어디서나 로컬 달력 기준 "YYYY-MM-DD" 문자열로 다룬다. */

export function toISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** 월요일부터 일요일까지. */
export function weekOf(iso: string): string[] {
  const dow = parseISODate(iso).getDay();
  const monday = addDays(iso, dow === 0 ? -6 : 1 - dow);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function isWeekend(iso: string): boolean {
  const dow = parseISODate(iso).getDay();
  return dow === 0 || dow === 6;
}
