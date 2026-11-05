"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useEffect } from "react";
import type { Category } from "@/lib/types";

/* ───────── Button ───────── */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "candy" | "soft" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "candy", size = "md", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none",
        "disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-14 px-8 text-base",
        variant === "candy" && "btn-candy",
        variant === "soft" &&
          "bg-blush-100 text-blush-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blush-200 active:translate-y-0",
        variant === "ghost" && "text-berry-soft transition-colors hover:bg-blush-50 hover:text-blush-600",
        variant === "outline" &&
          "border border-blush-200 bg-white text-berry transition-all duration-300 hover:-translate-y-0.5 hover:border-blush-300 hover:shadow-[var(--shadow-candy)]",
        variant === "danger" && "text-blush-700 transition-colors hover:bg-blush-100",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      aria-hidden
    />
  );
}

/* ───────── Card ───────── */
export function Card({
  className,
  hover,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={clsx("candy-card p-6", hover && "lift", className)} {...rest}>
      {children}
    </div>
  );
}

/* ───────── Inputs ───────── */
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-11 w-full rounded-2xl border border-blush-100 bg-white px-4 text-sm text-berry placeholder:text-berry-faint",
        "transition-all duration-300 outline-none hover:border-blush-200 focus:border-blush-300 focus:ring-4 focus:ring-blush-100",
        className,
      )}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(
          "w-full resize-none rounded-2xl border border-blush-100 bg-white p-4 text-sm leading-relaxed text-berry placeholder:text-berry-faint",
          "transition-all duration-300 outline-none hover:border-blush-200 focus:border-blush-300 focus:ring-4 focus:ring-blush-100",
          className,
        )}
        {...rest}
      />
    );
  },
);

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="text-[13px] font-semibold text-berry">{children}</span>
      {hint && <span className="text-xs text-berry-faint">{hint}</span>}
    </div>
  );
}

/* ───────── Chip (toggleable pill) ───────── */
export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={clsx(
        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-all duration-300",
        active
          ? "border-blush-400 bg-blush-500 text-white shadow-[0_6px_16px_-8px_rgba(232,54,122,0.8)]"
          : "border-blush-100 bg-white text-berry-soft hover:border-blush-300 hover:text-blush-600",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

/* ───────── Category styling ───────── */
export const CATEGORY_STYLE: Record<Category, { bg: string; text: string; dot: string; soft: string }> = {
  life: { bg: "bg-peach", text: "text-peach-deep", dot: "bg-peach-deep", soft: "bg-peach/60" },
  career: { bg: "bg-lilac", text: "text-lilac-deep", dot: "bg-lilac-deep", soft: "bg-lilac/60" },
  project: { bg: "bg-blush-100", text: "text-blush-600", dot: "bg-blush-500", soft: "bg-blush-100/60" },
  learning: { bg: "bg-mint", text: "text-mint-deep", dot: "bg-mint-deep", soft: "bg-mint/60" },
};

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const s = CATEGORY_STYLE[category];
  const label = { life: "Life", career: "Career", project: "Project", learning: "Learning" }[category];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", s.bg, s.text, className)}>
      <span className={clsx("size-1.5 rounded-full", s.dot)} />
      {label}
    </span>
  );
}

/* ───────── Page header ───────── */
export function PageHeader({
  emoji,
  title,
  subtitle,
  actions,
}: {
  emoji: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-[var(--shadow-candy)] transition-transform hover:animate-wiggle">
          {emoji}
        </div>
        <h1 className="font-display text-4xl font-semibold text-berry md:text-[2.75rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-berry-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}

/* ───────── Empty state ───────── */
export function Empty({ emoji, title, children }: { emoji: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-candy)] border border-dashed border-blush-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-3 animate-float text-4xl">{emoji}</div>
      <p className="font-display text-xl font-semibold text-berry">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm text-berry-soft">{children}</div>}
    </div>
  );
}

/* ───────── Modal ───────── */
export function Modal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-berry/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={clsx(
              "candy-card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-7 shadow-[var(--shadow-candy-lg)]",
              className,
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────── Stagger helpers for lists ───────── */
export const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
  },
};
