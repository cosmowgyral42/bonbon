"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Input } from "@/components/ui";

export function RuleList({
  items,
  onChange,
  placeholder,
  tone,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  tone: "do" | "dont";
}) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setVal("");
  };
  const dot = tone === "do" ? "bg-mint-deep" : "bg-blush-500";
  const icon = tone === "do" ? "💗" : "🚫";

  return (
    <div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li
              key={it}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0, marginTop: 0 }}
              className="group flex items-center gap-2.5 rounded-xl bg-white/80 px-3 py-2 text-[13px] text-berry ring-1 ring-blush-100 transition-all hover:ring-blush-200"
            >
              <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
              <span className="flex-1">{it}</span>
              <button
                aria-label="Remove"
                onClick={() => onChange(items.filter((x) => x !== it))}
                className="cursor-pointer rounded-full p-1 text-berry-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-blush-100 hover:text-blush-700"
              >
                <X className="size-3.5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="relative mt-2">
        <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm">{icon}</span>
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          onBlur={add}
          placeholder={placeholder}
          className="h-10 pl-10"
        />
      </div>
    </div>
  );
}
