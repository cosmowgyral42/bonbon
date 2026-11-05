import type { Post, Slot } from "./types";

// Posting slots are a weekly rhythm ("Tue 9:00, Thu 9:00") in the browser's local time.
// A slot is "open" if no scheduled post lands within a few hours of it.

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function slotDate(day: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

export function slotsBetween(slots: Slot[], from: Date, to: Date) {
  const out: Date[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  while (cur <= to) {
    for (const s of slots) {
      if (s.weekday === cur.getDay()) {
        const d = slotDate(cur, s.time);
        if (d >= from && d <= to) out.push(d);
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out.sort((a, b) => +a - +b);
}

const WINDOW = 4 * 60 * 60 * 1000;

export function isFilled(slot: Date, posts: Post[]) {
  return posts.some(
    (p) => p.scheduledAt && p.status !== "draft" && Math.abs(+new Date(p.scheduledAt) - +slot) < WINDOW,
  );
}

export function openSlots(slots: Slot[], posts: Post[], days = 21, from = new Date()) {
  const to = new Date(from);
  to.setDate(to.getDate() + days);
  return slotsBetween(slots, from, to).filter((d) => !isFilled(d, posts));
}

export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
