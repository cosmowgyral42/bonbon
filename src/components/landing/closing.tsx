"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Logo } from "@/components/studio-nav";

export function ClosingCTA() {
  return (
    <section className="px-4 pb-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-blush-400 via-blush-500 to-blush-600 px-6 py-24 text-center text-white shadow-[var(--shadow-candy-lg)]"
      >
        <div aria-hidden className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.8)_1.5px,transparent_1.5px)] [background-size:22px_22px]" />
        <div aria-hidden className="absolute -top-24 -left-24 size-80 animate-float-slow rounded-full bg-white/20 blur-3xl" />
        <div aria-hidden className="absolute -right-20 -bottom-24 size-96 animate-float rounded-full bg-lilac/40 blur-3xl" />
        {["🍬", "🧁", "💗", "🌸", "🍓"].map((e, i) => (
          <span
            key={e}
            aria-hidden
            className="absolute animate-float text-4xl"
            style={{ left: `${8 + i * 21}%`, top: i % 2 ? "14%" : "76%", animationDelay: `${i * 0.7}s` }}
          >
            {e}
          </span>
        ))}

        <div className="relative">
          <p className="font-hand text-3xl text-white/90">your next post is one sentence away</p>
          <h2 className="mx-auto mt-2 max-w-3xl font-display text-5xl leading-[1.02] font-semibold md:text-7xl">
            Post more. <span className="font-display-wonk">Stress less.</span>
          </h2>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            className="mt-10 inline-block"
          >
            <Link
              href="/studio"
              className="group inline-flex h-16 items-center gap-3 rounded-full bg-white px-10 text-lg font-semibold text-blush-600 shadow-[0_20px_40px_-14px_rgba(61,21,48,0.45)] transition-all duration-500 ease-[var(--ease-bounce)] hover:scale-105 hover:shadow-[0_26px_50px_-14px_rgba(61,21,48,0.55)]"
            >
              Open my studio
              <span className="transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:translate-x-1 group-hover:rotate-12">
                🍬
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-berry-faint sm:flex-row">
      <Logo />
      <p>
        Made with <span className="inline-block animate-pulse text-blush-500">♥</span> on your own laptop · posts via Buffer
      </p>
      <div className="flex gap-5">
        {[
          ["Studio", "/studio"],
          ["Voice", "/studio/voice"],
          ["Calendar", "/studio/calendar"],
        ].map(([l, h]) => (
          <Link key={h} href={h} className="font-medium transition-colors hover:text-blush-500">
            {l}
          </Link>
        ))}
      </div>
    </footer>
  );
}
