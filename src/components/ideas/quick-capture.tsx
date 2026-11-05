"use client";

import clsx from "clsx";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { CATEGORIES, type Category } from "@/lib/types";

export function QuickCapture({
  onSave,
}: {
  onSave: (n: { title: string; body: string; category: Category }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Category>("life");
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const expanded = focused || !!body || !!title;

  const save = async () => {
    if (!title.trim() && !body.trim()) return;
    setSaving(true);
    try {
      await onSave({ title, body, category });
      setTitle("");
      setBody("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      ref={wrap}
      layout
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      className={clsx(
        "candy-card relative overflow-hidden p-2 transition-shadow duration-500",
        expanded && "shadow-[var(--shadow-candy-lg)] ring-4 ring-blush-100",
      )}
    >
      <div className="flex items-center gap-2 pr-1">
        <span className="pl-3 text-xl">💡</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
          }}
          placeholder="Jot an idea… a win, a lesson, something you tried"
          className="h-12 flex-1 bg-transparent text-[15px] font-medium text-berry outline-none placeholder:text-berry-faint"
        />
        {!expanded && (
          <Button size="sm" onClick={save} disabled={!title.trim()} aria-label="Save idea">
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              }}
              rows={3}
              placeholder="Details you'll want later — what happened, who was there, why it mattered…"
              className="w-full resize-none bg-transparent px-4 py-2 text-sm leading-relaxed text-berry-soft outline-none placeholder:text-berry-faint"
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-blush-50 px-2 pt-3 pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={clsx(
                    "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-300",
                    category === c.id
                      ? "bg-blush-500 text-white shadow-[0_6px_14px_-8px_rgba(232,54,122,0.9)]"
                      : "bg-blush-50 text-berry-soft hover:bg-blush-100 hover:text-blush-600",
                  )}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
              <span className="ml-auto hidden text-[11px] text-berry-faint sm:inline">⌘ Enter to save</span>
              <Button size="sm" onClick={save} loading={saving} disabled={!title.trim() && !body.trim()}>
                Drop in the jar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
