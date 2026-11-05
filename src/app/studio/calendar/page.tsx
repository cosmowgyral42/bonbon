"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MonthGrid, WeekGrid, startOfWeek } from "@/components/calendar/grids";
import { postLabel } from "@/components/calendar/post-chip";
import { PostModal } from "@/components/calendar/post-modal";
import { useToast } from "@/components/toast";
import { Button, CATEGORY_STYLE, Card, PageHeader, stagger } from "@/components/ui";
import { api, fmtDay, fmtTime, useData } from "@/lib/client";
import { openSlots } from "@/lib/slots";
import { CATEGORIES, type Post, type PublicSettings, type Voice } from "@/lib/types";

type View = "month" | "week";

export default function CalendarPage() {
  const toast = useToast();
  const posts = useData<Post[]>("/api/posts");
  const settings = useData<PublicSettings>("/api/settings");
  const voice = useData<Voice>("/api/voice");

  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [dir, setDir] = useState(0);
  const [selected, setSelected] = useState<Post | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const allPosts = useMemo(() => posts.data ?? [], [posts.data]);
  const slots = useMemo(() => settings.data?.slots ?? [], [settings.data]);
  const upcomingOpen = useMemo(() => openSlots(slots, allPosts, 21, now), [slots, allPosts, now]);
  const unscheduled = useMemo(
    () => allPosts.filter((p) => p.status === "draft" && !p.scheduledAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allPosts],
  );
  const canSync = !!settings.data?.hasBufferKey && !!settings.data?.bufferChannelId;

  function shift(step: number) {
    setDir(step);
    setAnchor((a) => {
      const d = new Date(a);
      if (view === "month") d.setMonth(d.getMonth() + step, 1);
      else d.setDate(d.getDate() + step * 7);
      return d;
    });
  }
  function goToday() {
    setDir(0);
    setAnchor(new Date());
  }

  async function sync() {
    setSyncing(true);
    try {
      const r = await api<{ added: number; updated: number; total: number }>("/api/buffer/sync", { method: "POST" });
      toast(
        r.total === 0
          ? "Synced — nothing scheduled in Buffer yet"
          : `Synced ${r.total} post${r.total === 1 ? "" : "s"} · ${r.added} new, ${r.updated} updated`,
      );
      posts.reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  }

  const title =
    view === "month"
      ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : (() => {
          const s = startOfWeek(anchor);
          const e = new Date(s);
          e.setDate(s.getDate() + 6);
          return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
        })();
  const key = `${view}-${view === "month" ? `${anchor.getFullYear()}-${anchor.getMonth()}` : startOfWeek(anchor).toDateString()}`;

  return (
    <>
      <PageHeader
        emoji="🗓️"
        title={
          <>
            Your <span className="font-display-wonk text-candy">posting</span> calendar
          </>
        }
        subtitle="Everything that's queued, plus the empty slots in your rhythm that still need a post."
        actions={
          <>
            <div className="relative flex rounded-full border border-blush-100 bg-white p-1">
              {(["month", "week"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={clsx(
                    "relative h-9 cursor-pointer rounded-full px-4 text-[13px] font-semibold capitalize transition-colors",
                    view === v ? "text-white" : "text-berry-soft hover:text-blush-600",
                  )}
                >
                  {view === v && (
                    <motion.span layoutId="cal-view" className="btn-candy absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative">{v}</span>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={sync}
              loading={syncing}
              disabled={!canSync}
              title={canSync ? "Pull scheduled posts from Buffer" : "Connect Buffer and pick a channel in Settings first"}
            >
              {!syncing && <RefreshCw className="size-4" />} Sync from Buffer
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_17rem]">
        <Card className="overflow-hidden p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold" suppressHydrationWarning>
              {title}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={goToday}>
                Today
              </Button>
              <button
                onClick={() => shift(-1)}
                aria-label="Previous"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-blush-100 bg-white text-berry-soft transition-all hover:-translate-x-0.5 hover:border-blush-300 hover:text-blush-600"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => shift(1)}
                aria-label="Next"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-blush-100 bg-white text-berry-soft transition-all hover:translate-x-0.5 hover:border-blush-300 hover:text-blush-600"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {posts.loading || settings.loading ? (
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="h-[7.25rem] animate-pulse rounded-2xl bg-blush-50" />
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div
                  key={key}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: d * 60 }),
                    center: { opacity: 1, x: 0 },
                    exit: (d: number) => ({ opacity: 0, x: d * -60 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {view === "month" ? (
                    <MonthGrid anchor={anchor} posts={allPosts} slots={slots} now={now} onOpen={setSelected} />
                  ) : (
                    <WeekGrid anchor={anchor} posts={allPosts} slots={slots} now={now} onOpen={setSelected} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </Card>

        <aside className="flex flex-col gap-5">
          {unscheduled.length > 0 && (
            <Card className="bg-gradient-to-br from-white to-lilac/50 p-5">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Unscheduled drafts</h3>
                <span className="rounded-full bg-lilac px-2 py-0.5 text-xs font-bold text-lilac-deep">{unscheduled.length}</span>
              </div>
              <p className="mb-4 text-xs text-berry-soft">Open one, give it a slot, and it&apos;s queued.</p>
              <motion.ul variants={stagger.container} initial="hidden" animate="show" className="flex flex-col gap-2">
                {unscheduled.slice(0, 6).map((p) => (
                  <motion.li key={p.id} variants={stagger.item}>
                    <button
                      onClick={() => setSelected(p)}
                      className="group w-full cursor-pointer rounded-2xl border border-white bg-white/90 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:rotate-[-0.5deg] hover:border-blush-200 hover:shadow-[var(--shadow-candy)]"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={clsx("size-1.5 rounded-full", CATEGORY_STYLE[p.category].dot)} />
                        <span className="line-clamp-2 text-xs font-medium text-berry">{postLabel(p.text, 90)}</span>
                      </span>
                      <span className="mt-1.5 block text-[11px] font-semibold text-blush-600 opacity-70 transition-opacity group-hover:opacity-100">
                        Pick a slot →
                      </span>
                    </button>
                  </motion.li>
                ))}
                {unscheduled.length > 6 && <li className="px-1 text-xs text-berry-faint">+{unscheduled.length - 6} more</li>}
              </motion.ul>
            </Card>
          )}

          <Card className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Open slots</h3>
              <span className="rounded-full bg-blush-100 px-2 py-0.5 text-xs font-bold text-blush-600">{upcomingOpen.length}</span>
            </div>
            <p className="mb-4 text-xs text-berry-soft">Next 3 weeks of your rhythm that still need a post.</p>
            {slots.length === 0 ? (
              <p className="text-sm text-berry-soft">
                No posting rhythm yet.{" "}
                <Link href="/studio/settings" className="font-semibold text-blush-600 hover:underline">
                  Set your slots →
                </Link>
              </p>
            ) : upcomingOpen.length === 0 ? (
              <p className="text-sm text-berry-soft">Every slot is filled. You&apos;re glowing ✨</p>
            ) : (
              <motion.ul variants={stagger.container} initial="hidden" animate="show" className="flex flex-col gap-2">
                {upcomingOpen.slice(0, 8).map((d) => (
                  <motion.li key={d.toISOString()} variants={stagger.item}>
                    <Link
                      href={`/studio/compose?slot=${encodeURIComponent(d.toISOString())}`}
                      className="slot-open group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blush-500 hover:bg-blush-50 hover:shadow-[var(--shadow-candy)]"
                    >
                      <span>
                        <span className="font-semibold text-berry">{fmtDay(d)}</span>
                        <span className="ml-1.5 text-berry-soft tabular-nums">{fmtTime(d)}</span>
                      </span>
                      <span className="text-xs font-semibold text-blush-600 transition-transform group-hover:translate-x-0.5">Fill →</span>
                    </Link>
                  </motion.li>
                ))}
                {upcomingOpen.length > 8 && (
                  <li className="px-1 text-xs text-berry-faint">+{upcomingOpen.length - 8} more</li>
                )}
              </motion.ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">Legend</h3>
            <ul className="flex flex-col gap-2.5 text-xs text-berry-soft">
              {CATEGORIES.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className={clsx("size-3 rounded-md", CATEGORY_STYLE[c.id].bg, "ring-1 ring-inset ring-black/5")} />
                  {c.emoji} {c.label}
                </li>
              ))}
              <li className="mt-1 flex items-center gap-2 border-t border-blush-100 pt-3">
                <span className="size-3 rounded-md bg-blush-100" /> Scheduled
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-md border border-dashed border-blush-500 bg-white" /> Draft with a date
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-md bg-blush-100 opacity-50" /> Published ✓
              </li>
              <li className="flex items-center gap-2">
                <span className="slot-open size-3 rounded-md" /> Open slot
              </li>
            </ul>
            {settings.data?.bufferChannelName ? (
              <p className="mt-4 rounded-2xl bg-mint/70 p-3 text-xs text-mint-deep">
                Publishing to <b>{settings.data.bufferChannelName}</b> via Buffer
              </p>
            ) : (
              <p className="mt-4 rounded-2xl bg-butter/80 p-3 text-xs text-butter-deep">
                Buffer isn&apos;t connected — posts stay on this calendar only.{" "}
                <Link href="/studio/settings" className="font-semibold underline">
                  Connect
                </Link>
              </p>
            )}
          </Card>
        </aside>
      </div>

      <PostModal post={selected} voice={voice.data} suggested={upcomingOpen} onClose={() => setSelected(null)} onChanged={posts.reload} />
    </>
  );
}
