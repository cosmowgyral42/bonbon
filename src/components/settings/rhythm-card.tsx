"use client";

import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { WEEKDAYS } from "@/lib/slots";
import type { Slot } from "@/lib/types";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

const prettyTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

const joinAnd = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} & ${xs[xs.length - 1]}`);

export function summarize(slots: Slot[]) {
  if (!slots.length) return "No posting days yet — pick a few below.";
  // Group days that share the same set of times.
  const byDay = new Map<number, string[]>();
  for (const s of slots) byDay.set(s.weekday, [...(byDay.get(s.weekday) ?? []), s.time].sort());
  const groups = new Map<string, number[]>();
  for (const d of ORDER) {
    const times = byDay.get(d);
    if (!times) continue;
    const k = times.join(",");
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  const parts = [...groups.entries()].map(
    ([times, days]) => `${joinAnd(days.map((d) => WEEKDAYS[d]))} at ${joinAnd(times.split(",").map(prettyTime))}`,
  );
  const perWeek = slots.length;
  return `You post ${parts.join("; ")} — ${perWeek} post${perWeek === 1 ? "" : "s"} a week.`;
}

export function RhythmCard({ initial, onSave }: { initial: Slot[]; onSave: (slots: Slot[]) => Promise<boolean> }) {
  const [slots, setSlots] = useState<Slot[]>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(sortSlots(slots)) !== JSON.stringify(sortSlots(initial));

  const timesFor = (d: number) => slots.filter((s) => s.weekday === d);

  const toggleDay = (d: number) => {
    if (timesFor(d).length) setSlots(slots.filter((s) => s.weekday !== d));
    else setSlots([...slots, { weekday: d, time: "09:00" }]);
  };

  const setTime = (d: number, idx: number, time: string) => {
    let i = -1;
    setSlots(slots.map((s) => (s.weekday === d && ++i === idx ? { ...s, time } : s)));
  };

  const addTime = (d: number) => {
    const existing = timesFor(d).map((s) => s.time);
    const next = ["12:30", "17:30", "08:00", "19:00"].find((t) => !existing.includes(t)) ?? "12:00";
    setSlots([...slots, { weekday: d, time: next }]);
  };

  const removeTime = (d: number, idx: number) => {
    let i = -1;
    setSlots(slots.filter((s) => !(s.weekday === d && ++i === idx)));
  };

  return (
    <Card>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-peach to-white text-xl shadow-[var(--shadow-candy)]">
          🗓️
        </span>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold text-berry">Posting rhythm</h2>
          <p className="text-xs text-berry-faint">Your calendar shows empty slots to fill on these days</p>
        </div>
      </div>

      <motion.p
        key={summarize(slots)}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 rounded-2xl bg-gradient-to-r from-blush-50 via-white to-lilac/50 px-4 py-3 text-[14px] font-medium text-berry"
      >
        💗 {summarize(slots)}
      </motion.p>

      <div className="mt-5 flex flex-wrap gap-2">
        {ORDER.map((d) => {
          const on = timesFor(d).length > 0;
          return (
            <motion.button
              key={d}
              whileTap={{ scale: 0.9 }}
              whileHover={{ y: -2 }}
              onClick={() => toggleDay(d)}
              aria-pressed={on}
              className={clsx(
                "h-12 w-14 cursor-pointer rounded-2xl text-sm font-bold transition-colors duration-300",
                on ? "btn-candy" : "border border-blush-100 bg-white text-berry-soft hover:border-blush-300 hover:text-blush-600",
              )}
            >
              {WEEKDAYS[d]}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {ORDER.filter((d) => timesFor(d).length).map((d) => (
            <motion.div
              key={d}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-blush-50/70 px-3 py-2.5">
                <span className="w-12 text-sm font-bold text-berry">{WEEKDAYS[d]}</span>
                {timesFor(d).map((s, idx) => (
                  <span key={idx} className="group inline-flex items-center gap-1 rounded-full bg-white py-1 pr-1 pl-3 ring-1 ring-blush-100">
                    <input
                      type="time"
                      value={s.time}
                      onChange={(e) => e.target.value && setTime(d, idx, e.target.value)}
                      className="cursor-pointer bg-transparent text-[13px] font-medium text-berry outline-none"
                      aria-label={`${WEEKDAYS[d]} time ${idx + 1}`}
                    />
                    <button
                      aria-label="Remove time"
                      onClick={() => removeTime(d, idx)}
                      className="cursor-pointer rounded-full p-1 text-berry-faint transition-colors hover:bg-blush-100 hover:text-blush-700"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => addTime(d)}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-blush-500 transition-colors hover:bg-white"
                >
                  <Plus className="size-3" /> time
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {dirty && (
          <Button variant="ghost" onClick={() => setSlots(initial)}>
            Reset
          </Button>
        )}
        <Button
          disabled={!dirty}
          loading={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(sortSlots(slots));
            setSaving(false);
          }}
        >
          Save rhythm
        </Button>
      </div>
    </Card>
  );
}

function sortSlots(s: Slot[]) {
  return [...s].sort((a, b) => ORDER.indexOf(a.weekday) - ORDER.indexOf(b.weekday) || a.time.localeCompare(b.time));
}
