/**
 * Plain local-time date math for the month grid. No timezone cleverness:
 * events are stored as ISO instants in the pod and rendered with
 * toLocaleString; the grid is computed entirely in the browser's local time.
 */

export type GridCell = {
  date: Date;
  /** Local-day key, e.g. "2026-6-10" — match events to cells with this. */
  key: string;
  inMonth: boolean;
  isToday: boolean;
};

/** Local-day key for any date (year-month-day in local time). */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Cells for the month view: Mon–Sun columns, 5 or 6 rows depending on the
 * month, leading/trailing days from the neighbouring months included (and
 * flagged `inMonth: false` so the UI can dim them).
 */
export function monthGrid(year: number, month: number): GridCell[] {
  const first = new Date(year, month, 1);
  // getDay(): Sun=0 … Sat=6 → offset from Monday.
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = Math.ceil((lead + daysInMonth) / 7);
  const todayKey = dayKey(new Date());

  const cells: GridCell[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const date = new Date(year, month, 1 - lead + i);
    const key = dayKey(date);
    cells.push({
      date,
      key,
      inMonth: date.getMonth() === month,
      isToday: key === todayKey,
    });
  }
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** "2026-06-10" for an <input type="date"> default, in local time. */
export function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Short in-cell time, e.g. "09:00". */
export function pillTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
