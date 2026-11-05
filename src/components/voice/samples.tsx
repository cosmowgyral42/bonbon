"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button, Textarea } from "@/components/ui";
import type { VoiceSample } from "@/lib/types";

export function SamplesManager({
  samples,
  onChange,
}: {
  samples: VoiceSample[];
  onChange: (s: VoiceSample[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    const id = Math.random().toString(36).slice(2, 10);
    onChange([{ id, text }, ...samples]);
    setDraft("");
  };

  return (
    <div>
      <div className="relative">
        <Textarea
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
          }}
          placeholder="Paste one of your LinkedIn posts here — the more 'you' it sounds, the better 💌"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-berry-faint">
            3–8 samples work best · <kbd className="rounded bg-blush-50 px-1.5 py-0.5 text-[10px]">⌘ Enter</kbd> to add
          </p>
          <Button size="sm" onClick={add} disabled={!draft.trim()}>
            <Plus className="size-4" /> Add sample
          </Button>
        </div>
      </div>

      <motion.ul layout className="mt-5 space-y-3">
        <AnimatePresence initial={false}>
          {samples.map((s, i) => {
            const expanded = open === s.id;
            return (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="group rounded-2xl border border-blush-100 bg-white/90 p-4 transition-all duration-300 hover:border-blush-200 hover:shadow-[var(--shadow-candy)]"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-blush-100 text-[11px] font-bold text-blush-600">
                    {samples.length - i}
                  </span>
                  <p
                    className={`flex-1 text-[13px] leading-relaxed whitespace-pre-wrap text-berry-soft ${
                      expanded ? "" : "line-clamp-3"
                    }`}
                  >
                    {s.text}
                  </p>
                  <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      aria-label={expanded ? "Collapse" : "Expand"}
                      onClick={() => setOpen(expanded ? null : s.id)}
                      className="cursor-pointer rounded-full p-1.5 text-berry-faint transition-colors hover:bg-blush-50 hover:text-blush-600"
                    >
                      <ChevronDown className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      aria-label="Delete sample"
                      onClick={() => onChange(samples.filter((x) => x.id !== s.id))}
                      className="cursor-pointer rounded-full p-1.5 text-berry-faint transition-colors hover:bg-blush-100 hover:text-blush-700"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
