"use client";

import clsx from "clsx";
import { ArrowRight, CalendarHeart, Check, Feather, Lightbulb, NotebookPen } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PostModal } from "@/components/calendar/post-modal";
import { LinkedInPreview } from "@/components/linkedin-preview";
import { CountUp, ProgressRing } from "@/components/overview/bits";
import { CATEGORY_STYLE, Card, CategoryBadge, Empty, PageHeader, stagger } from "@/components/ui";
import { fmtDay, fmtTime, useData } from "@/lib/client";
import { openSlots } from "@/lib/slots";
import { CATEGORIES, type Note, type Post, type PublicSettings, type Voice } from "@/lib/types";

function greeting(h: number) {
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  const posts = useData<Post[]>("/api/posts");
  const notes = useData<Note[]>("/api/notes");
  const voice = useData<Voice>("/api/voice");
  const settings = useData<PublicSettings>("/api/settings");
  const [now, setNow] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Post | null>(null);

  // Set the clock after mount so server and client render the same markup.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  const allPosts = useMemo(() => posts.data ?? [], [posts.data]);
  const s = settings.data;
  const v = voice.data;

  const stats = useMemo(() => {
    if (!now) return null;
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    const upcoming = allPosts
      .filter((p) => p.status === "scheduled" && p.scheduledAt && new Date(p.scheduledAt) > now)
      .sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
    return {
      upcoming,
      thisWeek: upcoming.filter((p) => new Date(p.scheduledAt!) <= weekEnd).length,
      open: openSlots(s?.slots ?? [], allPosts, 14, now),
      drafts: allPosts.filter((p) => p.status === "draft").length,
    };
  }, [allPosts, now, s?.slots]);

  const drafts = useMemo(
    () => allPosts.filter((p) => p.status === "draft").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allPosts],
  );
  const ideas = notes.data ?? [];
  const freshIdeas = ideas.filter((n) => !n.used).slice(0, 3);

  const checklist = s && v
    ? [
        {
          done: s.hasBufferKey && !!s.bufferChannelId,
          label: "Connect Buffer + pick LinkedIn",
          hint: s.bufferKeyFromEnv ? "Key found in .env.local — pick your channel" : "For hands-free publishing",
          href: "/studio/settings",
        },
        { done: v.samples.length > 0, label: "Teach it your voice", hint: "Paste a few posts you love", href: "/studio/voice" },
        { done: s.slots.length > 0, label: "Set your posting rhythm", hint: "e.g. Tue & Thu at 9am", href: "/studio/settings" },
      ]
    : [];
  const doneCount = checklist.filter((c) => c.done).length;

  const firstName = v?.name?.split(" ")[0];

  return (
    <>
      <PageHeader
        emoji="🌸"
        title={
          <>
            {now ? greeting(now.getHours()) : "Hello"}
            {firstName ? (
              <>
                , <span className="font-display-wonk text-candy">{firstName}</span>
              </>
            ) : null}
          </>
        }
        subtitle="Here's what's cooking on your LinkedIn this week."
        actions={
          <Link href="/studio/compose" className="btn-candy inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
            <Feather className="size-4" /> New post
          </Link>
        }
      />

      {checklist.length > 0 && doneCount < checklist.length && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="sprinkles mb-6 flex flex-col gap-6 bg-gradient-to-br from-white via-white to-blush-50 md:flex-row md:items-center">
            <ProgressRing done={doneCount} total={checklist.length} />
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold">Let&apos;s finish setting you up</h2>
              <p className="mb-4 text-sm text-berry-soft">A few sweet steps and you&apos;re posting on autopilot.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {checklist.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    className={clsx(
                      "group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300",
                      c.done
                        ? "border-mint bg-mint/50"
                        : "border-blush-100 bg-white hover:-translate-y-0.5 hover:border-blush-300 hover:shadow-[var(--shadow-candy)]",
                    )}
                  >
                    <span
                      className={clsx(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs",
                        c.done ? "bg-mint-deep text-white" : "border-2 border-dashed border-blush-300 text-blush-400",
                      )}
                    >
                      {c.done ? <Check className="size-4" /> : ""}
                    </span>
                    <span className="min-w-0">
                      <span className={clsx("block text-sm font-semibold", c.done ? "text-mint-deep line-through" : "text-berry")}>
                        {c.label}
                      </span>
                      <span className="block truncate text-xs text-berry-soft">{c.hint}</span>
                    </span>
                    {!c.done && <ArrowRight className="ml-auto size-4 text-blush-400 transition-transform group-hover:translate-x-1" />}
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stat tiles */}
      <motion.div variants={stagger.container} initial="hidden" animate="show" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Scheduled this week", value: stats?.thisWeek ?? 0, icon: CalendarHeart, tint: "from-blush-100 to-white", href: "/studio/calendar" },
          { label: "Open slots · 14 days", value: stats?.open.length ?? 0, icon: Feather, tint: "from-lilac to-white", href: "/studio/calendar" },
          { label: "Ideas in the jar", value: ideas.filter((n) => !n.used).length, icon: Lightbulb, tint: "from-butter to-white", href: "/studio/ideas" },
          { label: "Drafts to review", value: stats?.drafts ?? 0, icon: NotebookPen, tint: "from-peach to-white", href: "#drafts" },
        ].map((t) => (
          <motion.div key={t.label} variants={stagger.item}>
            <Link
              href={t.href}
              className={clsx("candy-card lift group block bg-gradient-to-br p-5", t.tint)}
            >
              <t.icon className="mb-4 size-5 text-blush-500 transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:scale-125 group-hover:-rotate-12" />
              <p className="font-display text-4xl font-semibold text-berry">
                {stats ? <CountUp value={t.value} /> : "–"}
              </p>
              <p className="mt-1 text-xs font-medium text-berry-soft">{t.label}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Drafts Claude wrote, waiting for review */}
      {drafts.length > 0 && (
        <section id="drafts" className="mb-6 scroll-mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Drafts <span className="font-display-wonk text-candy">waiting</span> for you
              </h2>
              <p className="text-sm text-berry-soft">Written in your voice — tweak, approve, and drop into a slot.</p>
            </div>
            <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-bold text-blush-600">{drafts.length}</span>
          </div>
          <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {drafts.slice(0, 6).map((p, i) => (
              <motion.button
                key={p.id}
                variants={stagger.item}
                onClick={() => setSelected(p)}
                whileHover={{ y: -6, rotate: i % 2 ? 0.6 : -0.6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative cursor-pointer rounded-[var(--radius-candy)] border border-blush-100 bg-white p-3 text-left shadow-[var(--shadow-soft)] hover:border-blush-200 hover:shadow-[var(--shadow-candy-lg)]"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <CategoryBadge category={p.category} />
                  {p.scheduledAt ? (
                    <span className="text-[11px] font-semibold text-berry-soft">for {fmtDay(p.scheduledAt)}</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-blush-500">needs a slot</span>
                  )}
                </div>
                <div className="pointer-events-none max-h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
                  <LinkedInPreview text={p.text} name={v?.name} headline={v?.headline} />
                </div>
                <span className="btn-candy absolute right-5 bottom-5 inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold opacity-0 transition-all duration-300 group-hover:opacity-100">
                  Review & schedule
                </span>
              </motion.button>
            ))}
          </motion.div>
          {drafts.length > 6 && (
            <Link href="/studio/calendar" className="mt-3 inline-block text-xs font-semibold text-blush-600 hover:underline">
              +{drafts.length - 6} more on the calendar →
            </Link>
          )}
        </section>
      )}

      {/* Quick start */}
      <Card className="relative mb-6 overflow-hidden bg-gradient-to-br from-blush-100 via-white to-lilac/70 p-7">
        <div aria-hidden className="absolute -top-6 -right-4 animate-float text-7xl opacity-90">🍓</div>
        <h2 className="font-display text-3xl font-semibold">
          What happened <span className="font-display-wonk text-candy">lately?</span>
        </h2>
        <p className="mt-1 mb-6 text-sm text-berry-soft">Pick a flavour and jot the story down — Claude turns it into drafts in your voice.</p>
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <motion.div key={c.id} variants={stagger.item}>
              <Link
                href={`/studio/compose?category=${c.id}`}
                className="group flex h-full flex-col rounded-3xl border border-white bg-white/80 p-4 transition-all duration-500 ease-[var(--ease-bounce)] hover:-translate-y-1.5 hover:rotate-[-1deg] hover:shadow-[var(--shadow-candy-lg)]"
              >
                <span
                  className={clsx(
                    "mb-3 inline-flex size-11 items-center justify-center rounded-2xl text-2xl transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:scale-115 group-hover:rotate-12",
                    CATEGORY_STYLE[c.id].bg,
                  )}
                >
                  {c.emoji}
                </span>
                <span className="font-semibold text-berry">{c.label}</span>
                <span className="mt-0.5 text-xs text-berry-soft">{c.blurb}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Next up */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Next up</h2>
            <Link href="/studio/calendar" className="text-xs font-semibold text-blush-600 hover:underline">
              Open calendar →
            </Link>
          </div>
          {!stats ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-blush-50" />
              ))}
            </div>
          ) : stats.upcoming.length === 0 ? (
            <Empty emoji="🍭" title="Nothing queued yet">
              Fill an open slot and it&apos;ll show up here.
            </Empty>
          ) : (
            <motion.ul variants={stagger.container} initial="hidden" animate="show" className="flex flex-col gap-2">
              {stats.upcoming.slice(0, 4).map((p) => (
                <motion.li key={p.id} variants={stagger.item}>
                  <Link
                    href="/studio/calendar"
                    className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-blush-100 hover:bg-blush-50/60"
                  >
                    <div className={clsx("flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl", CATEGORY_STYLE[p.category].bg)}>
                      <span className="text-[10px] font-bold text-berry-soft uppercase">
                        {new Date(p.scheduledAt!).toLocaleDateString(undefined, { weekday: "short" })}
                      </span>
                      <span className="font-display text-xl leading-none font-semibold text-berry">
                        {new Date(p.scheduledAt!).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-berry">{p.text.split("\n").find((l) => l.trim())}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-berry-soft">
                        <CategoryBadge category={p.category} />
                        <span className="tabular-nums">{fmtTime(p.scheduledAt!)}</span>
                        {p.bufferPostId ? <span className="text-mint-deep">· in Buffer</span> : <span className="text-butter-deep">· local</span>}
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-blush-300 transition-transform group-hover:translate-x-1 group-hover:text-blush-500" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          {/* Open slots */}
          <Card>
            <h2 className="mb-1 font-display text-xl font-semibold">Open slots</h2>
            <p className="mb-4 text-xs text-berry-soft">Empty spots in the next two weeks.</p>
            {!stats ? (
              <div className="h-10 animate-pulse rounded-full bg-blush-50" />
            ) : (s?.slots.length ?? 0) === 0 ? (
              <p className="text-sm text-berry-soft">
                <Link href="/studio/settings" className="font-semibold text-blush-600 hover:underline">
                  Set a posting rhythm
                </Link>{" "}
                to see your slots.
              </p>
            ) : stats.open.length === 0 ? (
              <p className="text-sm text-berry-soft">All filled — look at you 💅</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.open.slice(0, 6).map((d, i) => (
                  <motion.div
                    key={d.toISOString()}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.05, type: "spring", stiffness: 400, damping: 22 }}
                  >
                    <Link
                      href={`/studio/compose?slot=${encodeURIComponent(d.toISOString())}`}
                      className="slot-open inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-blush-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-blush-500 hover:bg-blush-50"
                    >
                      {fmtDay(d)} · {fmtTime(d)}
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent ideas */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Fresh ideas</h2>
              <Link href="/studio/ideas" className="text-xs font-semibold text-blush-600 hover:underline">
                Idea jar →
              </Link>
            </div>
            {notes.loading ? (
              <div className="h-20 animate-pulse rounded-2xl bg-blush-50" />
            ) : freshIdeas.length === 0 ? (
              <p className="text-sm text-berry-soft">
                Your jar is empty.{" "}
                <Link href="/studio/ideas" className="font-semibold text-blush-600 hover:underline">
                  Drop an idea in
                </Link>
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {freshIdeas.map((n, i) => (
                  <li key={n.id}>
                    <Link
                      href={`/studio/compose?noteId=${n.id}`}
                      className={clsx(
                        "group block rounded-2xl p-3 transition-all duration-500 ease-[var(--ease-bounce)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-candy)]",
                        CATEGORY_STYLE[n.category].soft,
                        i % 2 ? "hover:rotate-[0.6deg]" : "hover:-rotate-[0.6deg]",
                      )}
                    >
                      <p className="font-hand text-xl leading-tight text-berry">{n.title || n.body.slice(0, 50)}</p>
                      <p className="mt-1 flex items-center justify-between text-xs text-berry-soft">
                        <CategoryBadge category={n.category} />
                        <span className="font-semibold text-blush-600 opacity-0 transition-opacity group-hover:opacity-100">
                          Write it →
                        </span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <PostModal
        post={selected}
        voice={v}
        suggested={stats?.open ?? []}
        onClose={() => setSelected(null)}
        onChanged={posts.reload}
      />
    </>
  );
}
