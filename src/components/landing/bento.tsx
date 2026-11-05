"use client";

import clsx from "clsx";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import Link from "next/link";

/* Card with a pink spotlight that follows the cursor */
function BentoCard({
  className,
  href,
  eyebrow,
  title,
  body,
  children,
  delay = 0,
}: {
  className?: string;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const spot = useMotionTemplate`radial-gradient(22rem circle at ${mx}px ${my}px, rgba(255,173,204,0.28), transparent 60%)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay }}
      className={clsx("group", className)}
    >
      <Link
        href={href}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(e.clientX - r.left);
          my.set(e.clientY - r.top);
        }}
        onMouseLeave={() => {
          mx.set(-200);
          my.set(-200);
        }}
        className="candy-card lift relative flex h-full flex-col overflow-hidden p-7"
      >
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: spot }} />
        <div className="relative flex min-h-44 flex-1 items-center justify-center">{children}</div>
        <div className="relative mt-6">
          <p className="text-[11px] font-bold tracking-[0.14em] text-blush-500 uppercase">{eyebrow}</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold text-berry">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-berry-soft">{body}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blush-600 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
            Take a peek →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function VoiceBars() {
  const traits = [
    { label: "Warmth", v: 88, c: "from-blush-300 to-blush-500" },
    { label: "Playfulness", v: 72, c: "from-peach-deep/60 to-peach-deep" },
    { label: "Storytelling", v: 94, c: "from-lilac-deep/50 to-lilac-deep" },
    { label: "Vulnerability", v: 61, c: "from-mint-deep/50 to-mint-deep" },
  ];
  return (
    <div className="w-full max-w-md space-y-3.5">
      {traits.map((t, i) => (
        <div key={t.label}>
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-berry-soft">
            <span>{t.label}</span>
            <span>{t.v}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-blush-50">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${t.v}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full bg-gradient-to-r ${t.c}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StickyNotes() {
  const notes = [
    { t: "talk at the design meetup?", bg: "bg-butter", rot: "-rotate-6 group-hover:-rotate-[16deg] group-hover:-translate-x-14" },
    { t: "first open-source PR!!", bg: "bg-blush-100", rot: "rotate-3 group-hover:rotate-0 group-hover:-translate-y-4" },
    { t: "what pottery taught me about feedback", bg: "bg-lilac", rot: "rotate-[10deg] group-hover:rotate-[18deg] group-hover:translate-x-14" },
  ];
  return (
    <div className="relative h-40 w-48">
      {notes.map((n, i) => (
        <div
          key={n.t}
          className={`absolute inset-0 flex items-center justify-center rounded-xl p-4 text-center font-hand text-xl leading-tight text-berry shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[var(--ease-bounce)] ${n.bg} ${n.rot}`}
          style={{ zIndex: i }}
        >
          {n.t}
        </div>
      ))}
      <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 text-2xl">📌</span>
    </div>
  );
}

function MiniCalendar() {
  // 5 weeks × 7 days: a few booked, two open slots that pulse
  const booked = new Set([3, 9, 16, 23, 29]);
  const open = new Set([11, 25]);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            "flex size-7 items-center justify-center rounded-lg text-[10px] font-semibold transition-transform duration-300 hover:scale-125",
            booked.has(i) && "btn-candy",
            open.has(i) && "slot-open animate-pulse text-blush-400",
            !booked.has(i) && !open.has(i) && "bg-blush-50 text-berry-faint",
          )}
        >
          {open.has(i) ? "+" : i + 1 <= 31 ? i + 1 : ""}
        </div>
      ))}
    </div>
  );
}

function BufferQueue() {
  const items = [
    { t: "Tue 9:00", txt: "I said yes before I felt ready 🌷", done: true },
    { t: "Thu 9:00", txt: "Three things my first hackathon taught me", done: true },
    { t: "Tue 9:00", txt: "We shipped it. Here's the ugly v1 🧁", done: false },
  ];
  return (
    <div className="w-full max-w-md space-y-2.5">
      {items.map((it, i) => (
        <motion.div
          key={it.txt}
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.15 * i }}
          className="flex items-center gap-3 rounded-2xl border border-blush-100 bg-white px-4 py-3 shadow-sm transition-transform duration-300 hover:translate-x-1"
        >
          <span className="rounded-full bg-blush-50 px-2.5 py-1 text-[11px] font-bold text-blush-600">{it.t}</span>
          <span className="flex-1 truncate text-sm text-berry">{it.txt}</span>
          <span className={clsx("text-xs font-semibold", it.done ? "text-mint-deep" : "text-berry-faint")}>
            {it.done ? "queued ✓" : "sending…"}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export function Bento() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14 max-w-2xl"
      >
        <p className="font-hand text-3xl text-blush-500">the whole candy box</p>
        <h2 className="mt-1 font-display text-5xl font-semibold text-berry md:text-6xl">
          Everything in one <span className="font-display-wonk text-candy">pretty</span> place.
        </h2>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-3">
        <BentoCard
          className="md:col-span-2"
          href="/studio/voice"
          eyebrow="Voice studio"
          title="Teach it how you sound"
          body="Paste a few posts you're proud of, pick your tone, set your emoji and hashtag habits. Bonbon studies them and keeps every draft on-voice."
        >
          <VoiceBars />
        </BentoCard>
        <BentoCard
          href="/studio/ideas"
          eyebrow="Idea jar"
          title="Catch ideas fast"
          body="Little sticky notes for the things worth posting about later. Turn any one into a post with a click."
          delay={0.1}
        >
          <StickyNotes />
        </BentoCard>
        <BentoCard
          href="/studio/calendar"
          eyebrow="Candy calendar"
          title="See the gaps"
          body="Your posting rhythm at a glance. Dashed slots are still waiting for a post."
          delay={0.05}
        >
          <MiniCalendar />
        </BentoCard>
        <BentoCard
          className="md:col-span-2"
          href="/studio/settings"
          eyebrow="Buffer scheduling"
          title="Queued, then off your mind"
          body="Connect your Buffer key once. Scheduled posts go straight to your LinkedIn queue, and posts you queued elsewhere show up on your calendar too."
          delay={0.15}
        >
          <BufferQueue />
        </BentoCard>
      </div>
    </section>
  );
}
