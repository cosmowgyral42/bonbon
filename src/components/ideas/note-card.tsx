"use client";

import clsx from "clsx";
import { Pencil, Pin, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { CATEGORY_STYLE, CategoryBadge } from "@/components/ui";
import type { Note } from "@/lib/types";

// Stable pseudo-random tilt per note so it doesn't jump between renders.
function tilt(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 50) / 10 - 2.5).toFixed(2);
}

export function NoteCard({
  note,
  onPin,
  onEdit,
  onDelete,
}: {
  note: Note;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const s = CATEGORY_STYLE[note.category];
  const rotate = Number(tilt(note.id));
  const date = new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, rotate: rotate * 2 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      whileHover={{ rotate: 0, y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="mb-5 break-inside-avoid"
    >
      <div
        className={clsx(
          "group relative rounded-[1.4rem] p-5 pt-6 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] transition-shadow duration-500 hover:shadow-[var(--shadow-candy-lg)]",
          s.bg,
        )}
      >
        {/* tape */}
        <span
          aria-hidden
          className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-3deg] rounded-sm bg-white/70 shadow-sm backdrop-blur-sm"
        />

        {note.pinned && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 -right-2 text-2xl drop-shadow-sm"
            aria-label="Pinned"
          >
            📌
          </motion.span>
        )}
        {note.used && (
          <span className="absolute top-3 right-3 rotate-[8deg] rounded-full border-2 border-dashed border-blush-400 bg-white/80 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-blush-500 uppercase">
            posted ✓
          </span>
        )}

        <div className="mb-2 flex items-center gap-2">
          <CategoryBadge category={note.category} className="bg-white/70" />
          <span className="text-[11px] text-berry-faint">{date}</span>
        </div>

        {note.title && <h3 className="font-hand text-[26px] leading-[1.1] font-semibold text-berry">{note.title}</h3>}
        {note.body && (
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap text-berry-soft">{note.body}</p>
        )}

        <div className="mt-4 flex items-center gap-1 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
          <IconBtn label={note.pinned ? "Unpin" : "Pin"} onClick={onPin} active={note.pinned}>
            <Pin className="size-3.5" />
          </IconBtn>
          <IconBtn label="Edit" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </IconBtn>
          <IconBtn label="Delete" onClick={onDelete} danger>
            <Trash2 className="size-3.5" />
          </IconBtn>
          <Link
            href={`/studio/compose?noteId=${note.id}`}
            className="group/link ml-auto inline-flex h-8 items-center gap-1 rounded-full bg-white/85 px-3 text-xs font-bold text-blush-600 shadow-sm transition-all duration-300 hover:bg-blush-500 hover:text-white"
          >
            Turn into post
            <span className="transition-transform duration-300 group-hover/link:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-300",
        active ? "bg-blush-500 text-white" : "bg-white/70 text-berry-soft",
        danger ? "hover:bg-blush-100 hover:text-blush-700" : "hover:bg-white hover:text-blush-600",
      )}
    >
      {children}
    </motion.button>
  );
}
