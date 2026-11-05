"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PostModal } from "@/components/calendar/post-modal";
import { Confetti } from "@/components/compose/confetti";
import { ImagePicker } from "@/components/image-picker";
import { LinkedInPreview } from "@/components/linkedin-preview";
import { useToast } from "@/components/toast";
import { Button, Card, CATEGORY_STYLE, Chip, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { api, fmtDateTime, imageSrc, useData } from "@/lib/client";
import { openSlots, toLocalInput } from "@/lib/slots";
import {
  CATEGORIES,
  type Category,
  type Draft,
  type Note,
  type Post,
  type PostImage,
  type PublicSettings,
  type Voice,
} from "@/lib/types";

const PROMPTS: Record<Category, string> = {
  life: "What happened? Where were you, who was there, how did it feel — and why does it matter to you?",
  career: "What's the news? What did it take to get here, who helped, and what's next?",
  project: "What did you build or ship? What problem does it solve, what was hard, what did you learn, any link?",
  learning:
    "What are you learning or exploring? What surprised you, what clicked, what would you tell someone starting out?",
};

const TWEAKS = [
  "Shorter",
  "More playful",
  "More personal",
  "Punchier hook",
  "End with a question",
  "Less emoji",
  "More detail",
];

const LOADING_LINES = [
  "Reading your voice samples…",
  "Finding the perfect hook…",
  "Sprinkling in your personality…",
  "Trimming the fluff…",
  "Adding a little sparkle…",
];

const MAX = 3000;

export function Composer() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const { data: voice } = useData<Voice>("/api/voice");
  const { data: settings } = useData<PublicSettings>("/api/settings");
  const { data: notes } = useData<Note[]>("/api/notes");
  const { data: posts, reload: reloadPosts } = useData<Post[]>("/api/posts");
  const [openDraft, setOpenDraft] = useState<Post | null>(null);

  const [category, setCategory] = useState<Category>((params.get("category") as Category) || "life");
  const [story, setStory] = useState("");
  const [noteId, setNoteId] = useState<string | null>(params.get("noteId"));
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingLine, setLoadingLine] = useState(0);
  const [customTweak, setCustomTweak] = useState("");
  const [when, setWhen] = useState<string>(() => {
    const s = params.get("slot");
    return s ? toLocalInput(new Date(s)) : "";
  });
  const [saving, setSaving] = useState<"schedule" | "draft" | null>(null);
  const [done, setDone] = useState<Post | null>(null);
  const [manual, setManual] = useState(false);
  const [images, setImages] = useState<PostImage[]>([]);
  const [queuing, setQueuing] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Prefill from an idea in the jar
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !notes || !noteId) return;
    const n = notes.find((x) => x.id === noteId);
    if (n) {
      prefilled.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategory(n.category);
      setStory([n.title, n.body].filter(Boolean).join("\n\n"));
    }
  }, [notes, noteId]);

  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setLoadingLine((i) => (i + 1) % LOADING_LINES.length), 2200);
    return () => clearInterval(t);
  }, [generating]);

  const upcoming = useMemo(
    () => (settings && posts ? openSlots(settings.slots, posts, 28).slice(0, 6) : []),
    [settings, posts],
  );
  const waitingDrafts = useMemo(
    () => (posts ?? []).filter((p) => p.status === "draft").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [posts],
  );
  const freshIdeas = useMemo(() => (notes ?? []).filter((n) => !n.used).slice(0, 6), [notes]);

  async function generate(tweak?: string) {
    if (!story.trim()) {
      toast("Tell me what happened first ✨", "info");
      return;
    }
    setGenerating(true);
    setLoadingLine(0);
    if (!tweak) {
      setDrafts([]);
      setPicked(null);
    }
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    try {
      const res = await api<{ drafts: Draft[] }>("/api/generate", {
        body: { category, story, tweak, previous: tweak ? text : undefined },
      });
      setDrafts(res.drafts);
      setPicked(0);
      setText(res.drafts[0]?.text ?? "");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't write drafts", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function queueForClaude() {
    if (!story.trim()) {
      toast("Tell me what happened first ✨", "info");
      return;
    }
    setQueuing(true);
    try {
      if (noteId) {
        await api(`/api/notes/${noteId}`, { method: "PATCH", body: { body: story, category } });
      } else {
        const [first, ...rest] = story.trim().split("\n");
        await api("/api/notes", {
          body: {
            title: first.slice(0, 80),
            body: rest.join("\n").trim() || (first.length > 80 ? first : ""),
            category,
          },
        });
      }
      toast("Saved to the idea jar — ask Claude in chat to write it 💌");
      setStory("");
      setNoteId(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save", "error");
    } finally {
      setQueuing(false);
    }
  }

  function writeMyself() {
    setManual(true);
    setText((t) => t || story);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function pick(i: number) {
    setPicked(i);
    setText(drafts[i].text);
  }

  async function save(schedule: boolean) {
    if (!text.trim()) return;
    if (schedule && !when) {
      toast("Pick a slot or a time first 🗓️", "info");
      return;
    }
    setSaving(schedule ? "schedule" : "draft");
    try {
      const res = await api<{ post: Post; warning?: string }>("/api/posts", {
        body: {
          text,
          category,
          sourceNoteId: noteId,
          images,
          scheduledAt: when ? new Date(when).toISOString() : null,
          schedule,
        },
      });
      if (res.warning) toast(res.warning, "info");
      else toast(schedule ? "Scheduled with Buffer 💌" : "Saved as a draft");
      setDone(res.post);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save", "error");
    } finally {
      setSaving(null);
    }
  }

  function reset() {
    setDone(null);
    setManual(false);
    setImages([]);
    setDrafts([]);
    setPicked(null);
    setText("");
    setStory("");
    setNoteId(null);
    setWhen("");
    router.replace("/studio/compose");
  }

  const missingKey = settings && !settings.hasAnthropicKey;
  const noSamples = voice && voice.samples.length === 0;

  return (
    <div>
      <PageHeader
        emoji="🪄"
        title={
          <>
            Write a <span className="font-display-wonk text-candy">little</span> post
          </>
        }
        subtitle={
          missingKey
            ? "Drop in what happened. Claude writes it in your voice — you review, polish and pop it on the calendar."
            : "Drop in what happened. Bonbon writes three drafts in your voice — you pick, polish and pop it on the calendar."
        }
      />

      {missingKey && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-blush-200 bg-white/80 px-5 py-4 text-sm text-berry"
        >
          <span className="text-lg">💌</span>
          <span>
            <span className="font-semibold">Claude is your ghostwriter.</span> Save the story and ask in chat — drafts
            show up on your calendar for review. Or write it yourself right here.
          </span>
        </motion.div>
      )}

      {!missingKey && noSamples && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-blush-200 bg-blush-50 px-5 py-4 text-sm text-berry"
        >
          <span className="text-lg">🎀</span>
          {
            <span>
              Tip: add a few of your past posts in{" "}
              <Link href="/studio/voice" className="font-semibold text-blush-600 underline-offset-4 hover:underline">
                My voice
              </Link>{" "}
              so drafts sound just like you.
            </span>
          }
        </motion.div>
      )}

      {waitingDrafts.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-berry">
              Drafts waiting for you <span className="text-blush-500">({waitingDrafts.length})</span>
            </h2>
            <span className="text-xs text-berry-faint">Click one to edit, add a picture or schedule it</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {waitingDrafts.map((p, i) => {
              const [first, ...rest] = p.text.split("\n").filter(Boolean);
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                  onClick={() => setOpenDraft(p)}
                  className="candy-card lift group flex cursor-pointer flex-col items-start justify-start p-5 text-left"
                >
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-wider text-blush-500 uppercase">
                    <span className="size-1.5 rounded-full bg-blush-500" /> Draft · written by Claude
                  </span>
                  <span className="block font-semibold text-berry">{first}</span>
                  <span className="mt-1 line-clamp-2 text-sm text-berry-soft">{rest.join(" ")}</span>
                  <span className="mt-auto inline-flex pt-3 text-xs font-semibold text-blush-600 transition-transform group-hover:translate-x-1">
                    Review &amp; schedule →
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      )}

      <PostModal
        post={openDraft}
        voice={voice}
        suggested={upcoming.slice(0, 4)}
        onClose={() => setOpenDraft(null)}
        onChanged={() => {
          setOpenDraft(null);
          reloadPosts();
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ───────── Left: the story ───────── */}
        <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <Card>
            <StepTitle n={1}>What kind of moment?</StepTitle>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                const s = CATEGORY_STYLE[c.id];
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setCategory(c.id)}
                    className={clsx(
                      "relative cursor-pointer overflow-hidden rounded-2xl border p-4 text-left transition-colors duration-300",
                      active
                        ? "border-blush-400 bg-white shadow-[var(--shadow-candy)]"
                        : "border-blush-100 bg-white hover:border-blush-200",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="cat-glow"
                        className={clsx("absolute inset-0 -z-0 opacity-70", s.bg)}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative block text-2xl">{c.emoji}</span>
                    <span className="relative mt-2 block text-sm font-semibold text-berry">{c.label}</span>
                    <span className="relative mt-0.5 block text-xs leading-snug text-berry-soft">{c.blurb}</span>
                  </motion.button>
                );
              })}
            </div>
          </Card>

          <Card>
            <StepTitle n={2}>Tell me the story</StepTitle>
            <Textarea
              rows={8}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder={PROMPTS[category]}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
              }}
            />
            <p className="mt-2 text-xs text-berry-faint">
              Messy notes are perfect. Specific details make the best posts. ⌘↵ to write.
            </p>

            {freshIdeas.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold tracking-wide text-berry-soft uppercase">
                  Or start from the idea jar
                </p>
                <div className="flex flex-wrap gap-2">
                  {freshIdeas.map((n) => (
                    <Chip
                      key={n.id}
                      active={noteId === n.id}
                      onClick={() => {
                        setNoteId(n.id);
                        setCategory(n.category);
                        setStory([n.title, n.body].filter(Boolean).join("\n\n"));
                      }}
                    >
                      {CATEGORIES.find((c) => c.id === n.category)?.emoji}{" "}
                      {n.title || n.body.slice(0, 28) || "Untitled"}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {missingKey ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button size="lg" onClick={queueForClaude} loading={queuing}>
                  Save for Claude 💌
                </Button>
                <Button size="lg" variant="outline" onClick={writeMyself}>
                  I&apos;ll write it ✍️
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="mt-6 w-full"
                onClick={() => generate()}
                loading={generating && !drafts.length}
              >
                {generating && !drafts.length
                  ? "Writing…"
                  : drafts.length
                    ? "Write fresh drafts ✨"
                    : "Write my drafts ✨"}
              </Button>
            )}
          </Card>
        </div>

        {/* ───────── Right: drafts, editor, schedule ───────── */}
        <div ref={resultsRef} className="scroll-mt-8 space-y-6">
          <AnimatePresence mode="wait">
            {done ? (
              <DoneCard key="done" post={done} onAnother={reset} />
            ) : generating && !drafts.length ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="flex flex-col items-center py-16 text-center">
                  <div className="relative mb-6 size-20">
                    <span className="absolute inset-0 animate-spin-slow rounded-full border-4 border-dashed border-blush-200" />
                    <span className="absolute inset-0 flex animate-float items-center justify-center text-4xl">🍭</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingLine}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="font-display text-xl font-semibold text-berry"
                    >
                      {LOADING_LINES[loadingLine]}
                    </motion.p>
                  </AnimatePresence>
                  <p className="mt-2 text-sm text-berry-soft">This usually takes 15–40 seconds.</p>
                  <div className="mt-8 grid w-full max-w-md gap-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-14 animate-pulse rounded-2xl bg-blush-50"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : drafts.length || manual ? (
              <motion.div
                key="drafts"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {drafts.length > 0 && (
                  <Card>
                    <StepTitle n={3}>Pick your favourite</StepTitle>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {drafts.map((d, i) => (
                        <motion.button
                          key={i + d.hook}
                          type="button"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => pick(i)}
                          className={clsx(
                            "relative cursor-pointer rounded-2xl border p-4 text-left transition-all duration-300",
                            picked === i
                              ? "border-blush-400 bg-blush-50 shadow-[var(--shadow-candy)]"
                              : "border-blush-100 bg-white hover:border-blush-200 hover:shadow-[var(--shadow-soft)]",
                          )}
                        >
                          <span className="text-[11px] font-bold tracking-wider text-blush-500 uppercase">
                            {d.angle}
                          </span>
                          <span className="mt-1.5 line-clamp-4 block text-[13px] leading-snug text-berry">
                            {d.hook}
                          </span>
                          {picked === i && (
                            <motion.span
                              layoutId="picked-heart"
                              className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-blush-500 text-xs text-white shadow-md"
                            >
                              ♥
                            </motion.span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </Card>
                )}

                <Card>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <StepTitle n={drafts.length ? 4 : 3} className="mb-0">
                      Polish it
                    </StepTitle>
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
                        text.length > MAX ? "bg-blush-500 text-white" : "bg-blush-50 text-berry-soft",
                      )}
                    >
                      {text.length.toLocaleString()} / {MAX.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div>
                      <Textarea
                        rows={14}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="text-[15px] leading-7"
                      />
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold tracking-wide text-berry-soft uppercase">Image</p>
                        <ImagePicker images={images} onChange={setImages} />
                      </div>
                      {!missingKey && (
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold tracking-wide text-berry-soft uppercase">Make it…</p>
                          <div className="flex flex-wrap gap-2">
                            {TWEAKS.map((t) => (
                              <Chip key={t} onClick={() => generate(t)}>
                                {t}
                              </Chip>
                            ))}
                          </div>
                          <form
                            className="mt-3 flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (customTweak.trim()) generate(customTweak.trim());
                            }}
                          >
                            <Input
                              value={customTweak}
                              onChange={(e) => setCustomTweak(e.target.value)}
                              placeholder="…or ask for anything: mention my team, drop the hashtags"
                            />
                            <Button type="submit" variant="soft" disabled={!customTweak.trim()}>
                              Redo
                            </Button>
                          </form>
                          {generating && (
                            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-blush-600">
                              <span className="size-2 animate-ping rounded-full bg-blush-500" />{" "}
                              {LOADING_LINES[loadingLine]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold tracking-wide text-berry-soft uppercase">Feed preview</p>
                      <LinkedInPreview text={text} name={voice?.name} headline={voice?.headline} images={images.map(imageSrc)} />
                    </div>
                  </div>
                </Card>

                <Card>
                  <StepTitle n={drafts.length ? 5 : 4}>When should it go out?</StepTitle>
                  {upcoming.length > 0 ? (
                    <>
                      <p className="mb-3 text-sm text-berry-soft">Open slots in your posting rhythm:</p>
                      <div className="flex flex-wrap gap-2">
                        {upcoming.map((d) => {
                          const v = toLocalInput(d);
                          return (
                            <Chip key={v} active={when === v} onClick={() => setWhen(v)}>
                              🗓️ {fmtDateTime(d)}
                            </Chip>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="mb-1 text-sm text-berry-soft">
                      No open slots in the next 4 weeks.{" "}
                      <Link href="/studio/settings" className="font-semibold text-blush-600 hover:underline">
                        Set your posting rhythm
                      </Link>{" "}
                      or pick any time.
                    </p>
                  )}
                  <div className="mt-4 max-w-xs">
                    <Label>Or pick a time</Label>
                    <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => save(true)}
                      loading={saving === "schedule"}
                      disabled={!text.trim() || text.length > MAX}
                    >
                      {settings?.bufferChannelId ? "Schedule with Buffer 💌" : "Add to calendar 💌"}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => save(false)}
                      loading={saving === "draft"}
                      disabled={!text.trim()}
                    >
                      Save as draft
                    </Button>
                  </div>
                  {settings && !settings.bufferChannelId && (
                    <p className="mt-3 text-xs text-berry-faint">
                      Buffer isn&apos;t connected yet, so this lands on your calendar only.{" "}
                      <Link href="/studio/settings" className="text-blush-600 hover:underline">
                        Connect Buffer
                      </Link>
                    </p>
                  )}
                </Card>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <IdleCard voice={voice} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ n, children, className }: { n: number; children: React.ReactNode; className?: string }) {
  return (
    <h2 className={clsx("mb-4 flex items-center gap-3 font-display text-xl font-semibold text-berry", className)}>
      <span className="flex size-7 items-center justify-center rounded-full bg-blush-100 font-sans text-xs font-bold text-blush-600">
        {n}
      </span>
      {children}
    </h2>
  );
}

function IdleCard({ voice }: { voice: Voice | null }) {
  return (
    <Card className="sprinkles relative overflow-hidden py-14 text-center">
      <div className="mx-auto mb-5 flex size-20 animate-float items-center justify-center rounded-[1.75rem] bg-white text-4xl shadow-[var(--shadow-candy-lg)]">
        💌
      </div>
      <p className="font-display text-2xl font-semibold text-berry">Your drafts will appear here</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-berry-soft">
        Written the way{" "}
        {voice?.name ? (
          <>
            <span className="font-semibold text-blush-600">{voice.name.split(" ")[0]}</span> writes
          </>
        ) : (
          "you write"
        )}
        . Save a story for Claude, or write it yourself and preview it here.
      </p>
      {voice && voice.toneTags.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {voice.toneTags.map((t, i) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 + i * 0.06, type: "spring" } }}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blush-600 shadow-sm"
            >
              {t}
            </motion.span>
          ))}
        </div>
      )}
    </Card>
  );
}

function DoneCard({ post, onAnother }: { post: Post; onAnother: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <Card className="relative overflow-hidden py-14 text-center">
        <Confetti />
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="mx-auto mb-5 flex size-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-blush-300 to-blush-500 text-4xl shadow-[var(--shadow-candy-lg)]"
        >
          {post.status === "scheduled" ? "🎀" : "📝"}
        </motion.div>
        <p className="font-display text-3xl font-semibold text-berry">
          {post.status === "scheduled" ? "It's on the calendar!" : "Saved as a draft"}
        </p>
        <p className="mt-2 text-sm text-berry-soft">
          {post.scheduledAt && post.status === "scheduled"
            ? `Going out ${fmtDateTime(post.scheduledAt)}${post.bufferPostId ? " via Buffer" : ""}.`
            : "You can schedule it anytime from the calendar."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/studio/calendar">
            <Button variant="outline">See calendar</Button>
          </Link>
          <Button onClick={onAnother}>Write another ✨</Button>
        </div>
      </Card>
    </motion.div>
  );
}
