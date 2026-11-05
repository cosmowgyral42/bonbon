"use client";

import { motion } from "motion/react";
import { useState } from "react";

const TONES = ["warm", "witty", "honest", "curious", "storyteller", "soft-spoken", "bold", "nerdy"];

const GENERIC = `I'm thrilled to announce that I have completed a comprehensive course in data visualization! 🚀

In today's fast-paced world, data is a game-changer. This journey has been truly transformative.

#Growth #Learning #Data #Success #Motivation #Leadership`;

const YOURS = `Confession: I've opened that data viz course 11 times since March.

This week I finally finished it 📊

The thing that stuck with me? A chart should answer one question. Mine used to answer six, badly.

Next up: redesigning our team's ugliest dashboard. Wish me luck.

#dataviz`;

export function VoiceCompare() {
  const [active, setActive] = useState<string[]>(["warm", "honest", "witty"]);
  const toggle = (t: string) => setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  return (
    <section id="voice" className="relative overflow-hidden py-28">
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-blush-50 to-transparent" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-hand text-3xl text-blush-500">sounds like you</p>
          <h2 className="mt-1 font-display text-5xl font-semibold text-berry md:text-6xl">
            Not another <span className="font-display-wonk text-candy">“thrilled to announce”</span>.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-berry-soft">
            Bonbon learns from your real posts — how you open, where you break lines, how many emoji you actually use — so the
            drafts read like you on a good day.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {TONES.map((t) => {
              const on = active.includes(t);
              return (
                <motion.button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ y: -3 }}
                  className={`h-10 cursor-pointer rounded-full border px-5 text-sm font-medium transition-colors duration-300 ${
                    on
                      ? "border-blush-400 bg-blush-500 text-white shadow-[0_8px_18px_-8px_rgba(232,54,122,0.8)]"
                      : "border-blush-200 bg-white text-berry-soft hover:border-blush-300 hover:text-blush-600"
                  }`}
                >
                  {on ? "♡ " : ""}
                  {t}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <div className="relative grid gap-5 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -4 }}
            whileInView={{ opacity: 1, y: 0, rotate: -2 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            whileHover={{ rotate: 0, y: -6 }}
            className="relative rounded-3xl border border-dashed border-berry-faint/50 bg-white/60 p-6 text-sm leading-relaxed whitespace-pre-wrap text-berry-faint"
          >
            <span className="absolute -top-3 left-5 rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-wider text-berry-faint uppercase shadow-sm">
              Generic AI 🥱
            </span>
            <span className="line-through decoration-blush-300/70 decoration-2">{GENERIC}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 5 }}
            whileInView={{ opacity: 1, y: 24, rotate: 2 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 }}
            whileHover={{ rotate: 0, y: 14 }}
            className="relative rounded-3xl border border-blush-200 bg-white p-6 text-sm leading-relaxed whitespace-pre-wrap text-berry shadow-[var(--shadow-candy-lg)]"
          >
            <span className="btn-candy absolute -top-3 left-5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase">
              In your voice 💗
            </span>
            {YOURS}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
