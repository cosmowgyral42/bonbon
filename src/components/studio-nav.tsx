"use client";

import clsx from "clsx";
import { CalendarHeart, Feather, Home, Lightbulb, Mic2, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/studio", label: "Overview", icon: Home },
  { href: "/studio/compose", label: "Compose", icon: Feather },
  { href: "/studio/calendar", label: "Calendar", icon: CalendarHeart },
  { href: "/studio/ideas", label: "Idea jar", icon: Lightbulb },
  { href: "/studio/voice", label: "My voice", icon: Mic2 },
  { href: "/studio/settings", label: "Settings", icon: Settings2 },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("group flex items-center gap-2.5", className)}>
      <span className="relative inline-flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-300 to-blush-500 text-lg shadow-[var(--shadow-candy)] transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:rotate-12 group-hover:scale-110">
        🍬
      </span>
      <span className="font-display text-2xl font-semibold tracking-tight text-berry">
        bonbon<span className="text-blush-500">.</span>
      </span>
    </Link>
  );
}

export function StudioNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/studio" ? path === href : path.startsWith(href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="glass sticky top-4 m-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-[2rem] p-5 shadow-[var(--shadow-soft)] lg:flex">
        <Logo className="px-2 pt-1 pb-8" />
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group relative flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-berry-soft hover:text-blush-600",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="btn-candy absolute inset-0 rounded-2xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {!active && (
                  <span className="absolute inset-0 scale-90 rounded-2xl bg-blush-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                )}
                <Icon className="relative size-[18px] transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:-rotate-12 group-hover:scale-110" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/studio/compose"
          className="group relative mt-auto overflow-hidden rounded-3xl bg-gradient-to-br from-blush-100 via-white to-lilac p-5 transition-transform duration-500 ease-[var(--ease-bounce)] hover:-translate-y-1"
        >
          <span className="absolute top-3 right-3 animate-float text-3xl">🧁</span>
          <p className="font-display text-lg font-semibold text-berry">Something happened?</p>
          <p className="mt-1 text-xs text-berry-soft">Turn it into a post in under a minute.</p>
          <span className="mt-3 inline-flex text-xs font-semibold text-blush-600 transition-transform group-hover:translate-x-1">
            Write it →
          </span>
        </Link>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full p-1.5 shadow-[var(--shadow-candy-lg)] lg:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} aria-label={label} className="relative flex size-11 items-center justify-center rounded-full">
              {active && (
                <motion.span layoutId="nav-pill-m" className="btn-candy absolute inset-0 rounded-full" />
              )}
              <Icon className={clsx("relative size-5", active ? "text-white" : "text-berry-soft")} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
