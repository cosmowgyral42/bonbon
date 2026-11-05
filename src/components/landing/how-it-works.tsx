"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { CATEGORY_STYLE } from "@/components/ui";

/* ───── tiny illustrations for each step ───── */

function MomentVisual() {
  const chips = [
    { label: "🌷 Life", cat: "life" as const },
    { label: "💼 Career", cat: "career" as const },
    { label: "🧁 Project", cat: "project" as const },
    { label: "📚 Learning", cat: "learning" as const },
  ];
  return (
    <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <motion.span
            key={c.label}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * i, type: "spring", stiffness: 300 }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${CATEGORY_STYLE[c.cat].bg} ${CATEGORY_STYLE[c.cat].text} ${
              i === 2 ? "ring-2 ring-blush-400 ring-offset-2" : ""
            }`}
          >
            {c.label}
          </motion.span>
        ))}
      </div>
      <div className="rounded-2xl border border-blush-100 bg-blush-50/50 p-4 text-sm leading-relaxed text-berry-soft">
        <motion.span
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: "linear", delay: 0.4 }}
          className="block"
        >
          Built a tiny habit tracker for my book club over the weekend. First time deploying anything!
        </motion.span>
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-blush-500 align-middle" />
      </div>
    </div>
  );
}

function DraftsVisual() {
  const drafts = [
    { angle: "The story", rot: -8, x: -40 },
    { angle: "The lesson", rot: 0, x: 0 },
    { angle: "A question", rot: 8, x: 40 },
  ];
  return (
    <div className="relative flex h-56 w-full max-w-sm items-center justify-center">
      {drafts.map((d, i) => (
        <motion.div
          key={d.angle}
          initial={{ rotate: 0, x: 0, opacity: 0, y: 20 }}
          whileInView={{ rotate: d.rot, x: d.x * 1.6, opacity: 1, y: i === 1 ? -10 : 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.15 * i }}
          whileHover={{ y: -20, rotate: 0, zIndex: 10 }}
          className="absolute w-44 cursor-pointer rounded-2xl bg-white p-4 shadow-[var(--shadow-candy-lg)]"
          style={{ zIndex: i === 1 ? 2 : 1 }}
        >
          <p className="mb-2 text-[10px] font-bold tracking-wider text-blush-500 uppercase">{d.angle}</p>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-blush-100" />
            <div className="h-2 w-5/6 rounded-full bg-blush-100" />
            <div className="h-2 w-4/6 rounded-full bg-blush-100" />
            <div className="h-2 w-3/4 rounded-full bg-lilac" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CalendarVisual() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="grid grid-cols-5 gap-2 text-center">
        {days.map((d, i) => (
          <div key={d}>
            <p className="mb-2 text-[11px] font-semibold text-berry-faint">{d}</p>
            <div
              className={`relative flex h-24 items-start justify-center rounded-2xl p-1.5 ${
                i === 1 || i === 3 ? "slot-open" : "bg-blush-50/60"
              }`}
            >
              {i === 1 && (
                <motion.div
                  initial={{ y: -80, opacity: 0, rotate: -12 }}
                  whileInView={{ y: 0, opacity: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.5 }}
                  className="btn-candy w-full rounded-xl px-1 py-2 text-[10px] leading-tight font-semibold"
                >
                  9:00
                  <br />🧁
                </motion.div>
              )}
              {i === 3 && <span className="mt-8 animate-pulse text-lg text-blush-300">+</span>}
            </div>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.1 }}
        className="mt-4 flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-semibold text-mint-deep"
      >
        ✓ Sent to Buffer · publishes Tue 9:00 AM
      </motion.div>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Drop a moment",
    body: "Something happened? A promotion, a weekend build, a book that rewired your brain. Jot it down in a sentence or two, or pull it from your idea jar.",
    visual: <MomentVisual />,
    tint: "from-peach via-white to-blush-50",
  },
  {
    n: "02",
    title: "Bonbon writes it like you",
    body: "Using the sample posts and tone you set up, you get three drafts with different angles. Pick one, tweak it, or ask for “shorter” or “more playful”.",
    visual: <DraftsVisual />,
    tint: "from-lilac via-white to-blush-50",
  },
  {
    n: "03",
    title: "It lands on your calendar",
    body: "Choose an open slot and it goes straight to your Buffer queue. The calendar shows what's planned and which slots are still waiting for a post.",
    visual: <CalendarVisual />,
    tint: "from-mint via-white to-blush-50",
  },
];

function StepCard({
  step,
  i,
  progress,
}: {
  step: (typeof STEPS)[number];
  i: number;
  progress: MotionValue<number>;
}) {
  const targetScale = 1 - (STEPS.length - 1 - i) * 0.05;
  const scale = useTransform(progress, [i / STEPS.length, 1], [1, targetScale]);
  return (
    <div className="sticky top-0 flex h-[85vh] items-center justify-center">
      <motion.div
        style={{ scale, top: `calc(${i * 28}px)` }}
        className={`relative grid w-full origin-top items-center gap-8 overflow-hidden rounded-[2.5rem] border border-blush-100 bg-gradient-to-br ${step.tint} p-8 shadow-[var(--shadow-candy-lg)] md:grid-cols-2 md:p-12`}
      >
        <div>
          <span className="font-display-wonk text-candy text-6xl font-semibold">{step.n}</span>
          <h3 className="mt-3 font-display text-3xl font-semibold text-berry md:text-4xl">{step.title}</h3>
          <p className="mt-4 max-w-md text-base leading-relaxed text-berry-soft">{step.body}</p>
        </div>
        <div className="flex justify-center">{step.visual}</div>
      </motion.div>
    </div>
  );
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section id="how" className="relative mx-auto max-w-5xl px-6 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="font-hand text-3xl text-blush-500">how it works</p>
        <h2 className="mt-1 font-display text-5xl font-semibold text-berry md:text-6xl">
          From <span className="font-display-wonk text-candy">“oh, that happened”</span> to posted.
        </h2>
      </motion.div>
      <div ref={ref} className="relative mt-6">
        {STEPS.map((s, i) => (
          <StepCard key={s.n} step={s} i={i} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
