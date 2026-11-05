"use client";

import clsx from "clsx";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/studio-nav";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#voice", label: "Your voice" },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
        className={clsx(
          "flex w-full items-center justify-between rounded-full transition-all duration-500 ease-[var(--ease-smooth)]",
          scrolled
            ? "glass max-w-3xl px-3 py-2 pl-5 shadow-[var(--shadow-candy-lg)]"
            : "max-w-6xl border border-transparent px-2 py-3",
        )}
      >
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative rounded-full px-4 py-2 text-sm font-medium text-berry-soft transition-colors hover:text-blush-600"
            >
              <span className="absolute inset-0 scale-75 rounded-full bg-blush-100/70 opacity-0 transition-all duration-300 ease-[var(--ease-bounce)] group-hover:scale-100 group-hover:opacity-100" />
              <span className="relative">{l.label}</span>
            </a>
          ))}
        </div>
        <Link href="/studio" className="btn-candy inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold">
          Open studio ✨
        </Link>
      </motion.nav>
    </div>
  );
}
