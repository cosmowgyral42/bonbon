"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { isFilled, slotsBetween } from "@/lib/slots";
import type { Post, Slot } from "@/lib/types";
import { OpenSlot, PostChip } from "./post-chip";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday first
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function dayContents(day: Date, posts: Post[], slots: Slot[], now: Date) {
  const dayPosts = posts
    .filter((p) => p.scheduledAt && sameDay(new Date(p.scheduledAt), day))
    .sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const open = slotsBetween(slots, start, endOfDay(day)).filter((d) => d > now && !isFilled(d, posts));
  return { dayPosts, open };
}

type GridProps = {
  anchor: Date;
  posts: Post[];
  slots: Slot[];
  now: Date;
  onOpen: (p: Post) => void;
};

const cell = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.012, duration: 0.35 } }),
};

export function MonthGrid({ anchor, posts, slots, now, onOpen }: GridProps) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  // Drop a trailing week that's entirely next month.
  const visible = days.slice(35).every((d) => d.getMonth() !== anchor.getMonth()) ? days.slice(0, 35) : days;

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-semibold tracking-wider text-berry-faint uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {visible.map((day, i) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const today = sameDay(day, now);
          const { dayPosts, open } = dayContents(day, posts, slots, now);
          const items = dayPosts.length + open.length;
          return (
            <motion.div
              key={day.toISOString()}
              custom={i}
              variants={cell}
              initial="hidden"
              animate="show"
              className={clsx(
                "group/cell relative flex min-h-[7.25rem] flex-col gap-1 rounded-2xl border p-1.5 transition-all duration-300",
                inMonth ? "border-blush-100 bg-white/90" : "border-transparent bg-white/40",
                "hover:z-10 hover:border-blush-200 hover:shadow-[var(--shadow-candy)]",
                today && "border-blush-300 ring-2 ring-blush-200",
              )}
            >
              <div className="flex items-center justify-between px-1 pt-0.5">
                <span
                  className={clsx(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-transform duration-300 group-hover/cell:scale-110",
                    today ? "btn-candy text-white" : inMonth ? "text-berry" : "text-berry-faint",
                  )}
                >
                  {day.getDate()}
                </span>
                {items > 2 && <span className="text-[10px] font-medium text-berry-faint">{items}</span>}
              </div>
              <div className="flex flex-col gap-1">
                {dayPosts.slice(0, 3).map((p) => (
                  <PostChip key={p.id} post={p} onClick={() => onOpen(p)} compact={dayPosts.length + open.length > 2} />
                ))}
                {dayPosts.length > 3 && (
                  <span className="px-2 text-[10px] font-semibold text-berry-soft">+{dayPosts.length - 3} more</span>
                )}
                {open.map((d) => (
                  <OpenSlot key={d.toISOString()} date={d} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const START_H = 6;
const END_H = 23;
const ROW = 44;

export function WeekGrid({ anchor, posts, slots, now, onOpen }: GridProps) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const top = (d: Date) => {
    const h = Math.min(Math.max(d.getHours() + d.getMinutes() / 60, START_H), END_H - 0.5);
    return (h - START_H) * ROW;
  };
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="mb-2 grid grid-cols-[3rem_repeat(7,1fr)] gap-1.5">
          <div />
          {days.map((d) => {
            const today = sameDay(d, now);
            return (
              <div key={d.toISOString()} className="text-center">
                <p className="text-[11px] font-semibold tracking-wider text-berry-faint uppercase">{DAY_NAMES[(d.getDay() + 6) % 7]}</p>
                <p
                  className={clsx(
                    "mx-auto mt-1 inline-flex size-8 items-center justify-center rounded-full font-display text-lg font-semibold",
                    today ? "btn-candy text-white" : "text-berry",
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-1.5">
          <div className="relative" style={{ height: hours.length * ROW }}>
            {hours.map((h) => (
              <span key={h} className="absolute right-1 -translate-y-1/2 text-[10px] text-berry-faint tabular-nums" style={{ top: (h - START_H) * ROW }}>
                {new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric" })}
              </span>
            ))}
          </div>
          {days.map((day, i) => {
            const { dayPosts, open } = dayContents(day, posts, slots, now);
            const today = sameDay(day, now);
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={clsx(
                  "relative rounded-2xl border bg-white/80 transition-colors hover:border-blush-200",
                  today ? "border-blush-300" : "border-blush-100",
                )}
                style={{
                  height: hours.length * ROW,
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${ROW - 1}px, rgba(255,209,227,0.45) ${ROW - 1}px ${ROW}px)`,
                }}
              >
                {today && now.getHours() >= START_H && now.getHours() < END_H && (
                  <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: top(now) }}>
                    <span className="-ml-1 size-2 rounded-full bg-blush-500" />
                    <span className="h-0.5 flex-1 bg-blush-400/70" />
                  </div>
                )}
                {dayPosts.map((p) => (
                  <div key={p.id} className="absolute inset-x-1" style={{ top: top(new Date(p.scheduledAt!)) + 2 }}>
                    <PostChip post={p} onClick={() => onOpen(p)} />
                  </div>
                ))}
                {open.map((d) => (
                  <div key={d.toISOString()} className="absolute inset-x-1" style={{ top: top(d) + 2 }}>
                    <OpenSlot date={d} />
                  </div>
                ))}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
