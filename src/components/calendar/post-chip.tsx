"use client";

import clsx from "clsx";
import { Check, CloudUpload } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { CATEGORY_STYLE } from "@/components/ui";
import { fmtTime } from "@/lib/client";
import type { Post } from "@/lib/types";

export function postLabel(text: string, n = 32) {
  const first = text.split("\n").find((l) => l.trim()) ?? "";
  return first.length > n ? first.slice(0, n).trimEnd() + "…" : first;
}

// One post inside a calendar cell. Style varies with status.
export function PostChip({ post, onClick, compact }: { post: Post; onClick: () => void; compact?: boolean }) {
  const s = CATEGORY_STYLE[post.category];
  const sent = post.status === "sent";
  const draft = post.status === "draft";
  const failed = post.status === "failed";
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={post.text.slice(0, 200)}
      className={clsx(
        "group/chip flex w-full cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1 text-left text-[11px] leading-tight font-semibold transition-shadow hover:shadow-[var(--shadow-candy)]",
        draft && "border border-dashed border-current bg-white",
        sent && "opacity-60",
        failed && "bg-blush-100 text-blush-700 ring-1 ring-blush-400",
        !draft && !failed && [s.bg],
        !failed && s.text,
        post.fromBuffer && "ring-1 ring-white/80 ring-offset-1 ring-offset-blush-100",
      )}
    >
      {sent ? (
        <Check className="size-3 shrink-0" />
      ) : (
        <span className={clsx("size-1.5 shrink-0 rounded-full", s.dot)} />
      )}
      {post.scheduledAt && <span className="shrink-0 tabular-nums opacity-80">{fmtTime(post.scheduledAt)}</span>}
      {!compact && <span className="truncate text-berry/80">{postLabel(post.text)}</span>}
      {post.bufferPostId && <CloudUpload className="ml-auto size-3 shrink-0 opacity-50" aria-label="In Buffer" />}
    </motion.button>
  );
}

// Dashed bubble for an empty posting slot. Click → compose with that slot prefilled.
export function OpenSlot({ date, className }: { date: Date; className?: string }) {
  return (
    <Link
      href={`/studio/compose?slot=${encodeURIComponent(date.toISOString())}`}
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        "slot-open group/slot relative flex w-full items-center gap-1.5 rounded-xl px-1.5 py-1 text-[11px] font-semibold text-blush-600 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-blush-500 hover:bg-blush-50 hover:shadow-[var(--shadow-candy)]",
        className,
      )}
    >
      <span className="relative flex size-1.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-blush-400 opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-blush-500" />
      </span>
      <span className="truncate whitespace-nowrap tabular-nums" title={`Open slot · ${fmtTime(date)}`}>
        {fmtTime(date).replace(/\s?(AM|PM)$/i, (m) => m.trim().toLowerCase())}
      </span>
    </Link>
  );
}
