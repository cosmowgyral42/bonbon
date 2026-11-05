"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { LinkedInPreview } from "@/components/linkedin-preview";

const SAMPLE = `Six months ago I couldn't center a div.

Last night I shipped my first full-stack app — a tiny habit tracker for my book club 📚

What actually helped:
→ Building something I'd use every week
→ Asking "dumb" questions early and often
→ Celebrating the small, ugly first versions

If you're learning something new right now: your version one is allowed to be messy. Ship it anyway.

What are you building this month? 💗

#learninpublic #webdev #womenintech`;

// Floating candy bits. depth controls how much they follow the mouse.
const CANDY = [
  { e: "🍬", x: "6%", y: "18%", size: "text-5xl", depth: 40, delay: 0 },
  { e: "🧁", x: "88%", y: "12%", size: "text-5xl", depth: 60, delay: 0.4 },
  { e: "🍓", x: "4%", y: "72%", size: "text-4xl", depth: 25, delay: 0.8 },
  { e: "💗", x: "46%", y: "88%", size: "text-3xl", depth: 50, delay: 1.2 },
  { e: "🌸", x: "94%", y: "64%", size: "text-4xl", depth: 35, delay: 0.2 },
  { e: "✨", x: "52%", y: "6%", size: "text-3xl", depth: 70, delay: 0.6 },
];

function Floaty({
  c,
  mx,
  my,
}: {
  c: (typeof CANDY)[number];
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const x = useTransform(mx, (v) => v * c.depth);
  const y = useTransform(my, (v) => v * c.depth);
  return (
    <motion.div
      className="pointer-events-none absolute select-none"
      style={{ left: c.x, top: c.y, x, y }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.5 + c.delay }}
    >
      <div className={`${c.size} animate-float drop-shadow-[0_10px_14px_rgba(232,54,122,0.25)]`} style={{ animationDelay: `${c.delay}s` }}>
        {c.e}
      </div>
    </motion.div>
  );
}

function TiltCard() {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(28rem circle at ${gx}% ${gy}%, rgba(255,255,255,0.55), transparent 45%)`;

  function onMove(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 16);
    rx.set(-(py - 0.5) * 14);
    gx.set(px * 100);
    gy.set(py * 100);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <div style={{ perspective: 1200 }} className="relative">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative rounded-[2rem] bg-gradient-to-br from-white via-blush-50 to-blush-100 p-3 shadow-[var(--shadow-candy-lg)]"
      >
        <LinkedInPreview text={SAMPLE} name="Maya Fernandes" headline="Product designer · learning to code in public" />
        <motion.div className="pointer-events-none absolute inset-0 rounded-[2rem]" style={{ background: glare }} />

        {/* pop-out stickers */}
        <motion.div
          style={{ translateZ: 60 }}
          className="glass absolute -top-5 -left-6 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-blush-600 shadow-[var(--shadow-candy)]"
        >
          <Sparkles className="size-3.5" /> Written in your voice
        </motion.div>
        <motion.div
          style={{ translateZ: 80 }}
          className="absolute -right-5 -bottom-5 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-candy-lg)]"
        >
          <p className="text-[10px] font-semibold tracking-wider text-berry-faint uppercase">Scheduled</p>
          <p className="font-display text-sm font-semibold text-berry">Tue · 9:00 AM 💌</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

const word = {
  hidden: { opacity: 0, y: 40, rotate: 4 },
  show: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring" as const, stiffness: 220, damping: 20 } },
};

export function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const cardY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      onMouseMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16"
    >
      {/* soft blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 size-[36rem] animate-float-slow rounded-full bg-blush-200/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[32rem] animate-float rounded-full bg-lilac blur-3xl" />
        <div className="absolute top-1/3 left-1/2 size-[22rem] -translate-x-1/2 rounded-full bg-peach/70 blur-3xl" />
        <div className="sprinkles absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-60" />
      </div>
      {CANDY.map((c) => (
        <Floaty key={c.e + c.x} c={c} mx={smx} my={smy} />
      ))}

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div style={{ y: textY, opacity: fade }}>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="glass mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-blush-600"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blush-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blush-500" />
            </span>
            Your personal LinkedIn studio
          </motion.div>

          <motion.h1
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } } }}
            initial="hidden"
            animate="show"
            className="font-display text-[3.4rem] leading-[0.95] font-semibold text-berry sm:text-7xl lg:text-[5.6rem]"
          >
            {["Your", "LinkedIn,"].map((w) => (
              <motion.span key={w} variants={word} className="mr-[0.22em] inline-block">
                {w}
              </motion.span>
            ))}
            <br />
            <motion.span variants={word} className="font-display-wonk text-candy inline-block pr-2 pb-2">
              sweetened.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-lg text-lg leading-relaxed text-berry-soft"
          >
            Drop in a life moment, a project you shipped or something you&apos;re learning. Bonbon writes it the way{" "}
            <em className="font-display-wonk text-berry">you</em> would, then tucks it into your calendar and Buffer queue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link href="/studio/compose" className="btn-candy group inline-flex h-14 items-center gap-2 rounded-full px-8 text-base font-semibold">
              Write my first post
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/studio/voice"
              className="inline-flex h-14 items-center gap-2 rounded-full border border-blush-200 bg-white/80 px-7 text-base font-semibold text-berry transition-all duration-300 hover:-translate-y-0.5 hover:border-blush-300 hover:shadow-[var(--shadow-candy)]"
            >
              🎙️ Set up my voice
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 font-hand text-2xl text-blush-500"
          >
            runs locally · your keys stay on your laptop ♡
          </motion.p>
        </motion.div>

        <motion.div
          style={{ y: cardY }}
          initial={{ opacity: 0, y: 60, rotate: 6 }}
          animate={{ opacity: 1, y: 0, rotate: 2 }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.5 }}
          className="relative mx-auto w-full max-w-md lg:rotate-2"
        >
          <TiltCard />
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.a
        href="#how"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold text-berry-faint transition-colors hover:text-blush-500 md:flex"
      >
        scroll for sweetness
        <span className="flex h-9 w-6 justify-center rounded-full border-2 border-current pt-1.5">
          <motion.span
            className="size-1.5 rounded-full bg-current"
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </span>
      </motion.a>
    </section>
  );
}
