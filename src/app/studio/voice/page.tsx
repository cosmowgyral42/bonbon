"use client";

import clsx from "clsx";
import { Check, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LinkedInPreview } from "@/components/linkedin-preview";
import { useToast } from "@/components/toast";
import { Card, Chip, Input, Label, PageHeader, Spinner } from "@/components/ui";
import { RuleList } from "@/components/voice/rule-list";
import { SamplesManager } from "@/components/voice/samples";
import { VoiceCard } from "@/components/voice/voice-card";
import { api, useData } from "@/lib/client";
import type { Voice } from "@/lib/types";

const TONE_PRESETS = [
  "warm",
  "witty",
  "honest",
  "curious",
  "bold",
  "nerdy",
  "soft-spoken",
  "storyteller",
  "motivational",
  "minimal",
  "playful",
  "reflective",
];
const EMOJI_LEVELS = [
  { label: "None", icon: "🤍" },
  { label: "Rare", icon: "🌸" },
  { label: "A few", icon: "🌸✨" },
  { label: "Lots", icon: "🌸✨🎀" },
];
const LENGTHS: { id: Voice["length"]; label: string; hint: string }[] = [
  { id: "short", label: "Short", hint: "< 600 chars" },
  { id: "medium", label: "Medium", hint: "600–1300" },
  { id: "long", label: "Long", hint: "story-style" },
];

type SaveState = "idle" | "saving" | "saved";

export default function VoicePage() {
  const { data } = useData<Voice>("/api/voice");
  const toast = useToast();
  const [voice, setVoice] = useState<Voice | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [analyzing, setAnalyzing] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [noKey, setNoKey] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Partial<Voice> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (data && !voice) setVoice(data);
  }, [data, voice]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const body = pending.current;
    if (!body) return;
    pending.current = null;
    setSave("saving");
    try {
      await api("/api/voice", { method: "PUT", body });
      setSave("saved");
    } catch (e) {
      setSave("idle");
      toast(e instanceof Error ? e.message : "Couldn't save", "error");
    }
  }, [toast]);

  // Save anything pending when leaving the page.
  useEffect(() => () => void flush(), [flush]);

  const update = (patch: Partial<Voice>) => {
    setVoice((v) => (v ? { ...v, ...patch } : v));
    pending.current = { ...pending.current, ...patch };
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  };

  const analyze = async () => {
    if (!voice?.samples.length) {
      toast("Add at least one sample post first 💌", "info");
      return;
    }
    await flush();
    setAnalyzing(true);
    setNoKey(false);
    try {
      const v = await api<Voice>("/api/voice/analyze", { method: "POST" });
      setVoice(v);
      toast("Got it — your voice card is ready 🎀");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      // No Anthropic key is the normal setup: Claude (in chat) analyses the voice instead.
      if (/anthropic api key|no anthropic/i.test(msg)) setNoKey(true);
      else toast(msg, "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTag = (t: string) => {
    if (!voice) return;
    update({ toneTags: voice.toneTags.includes(t) ? voice.toneTags.filter((x) => x !== t) : [...voice.toneTags, t] });
  };

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (!voice || !t) return;
    if (!voice.toneTags.includes(t)) update({ toneTags: [...voice.toneTags, t] });
    setCustomTag("");
  };

  if (!voice) {
    return (
      <div className="flex h-64 items-center justify-center text-blush-400">
        <Spinner className="size-6" />
      </div>
    );
  }

  const customTags = voice.toneTags.filter((t) => !TONE_PRESETS.includes(t));

  return (
    <>
      <PageHeader
        emoji="🎙️"
        title={
          <>
            My <span className="font-display-wonk text-blush-500">voice</span>
          </>
        }
        subtitle="Teach Bonbon how you sound. Paste real posts, pick your vibe — every draft gets written this way."
        actions={<SaveIndicator state={save} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ───── Left: inputs ───── */}
        <div className="space-y-6">
          <Section title="You" emoji="🌷" delay={0}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={voice.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Aditi Sharma" />
              </div>
              <div>
                <Label>Headline</Label>
                <Input
                  value={voice.headline}
                  onChange={(e) => update({ headline: e.target.value })}
                  placeholder="Product designer · building in public"
                />
              </div>
            </div>
          </Section>

          <Section
            title="Sample posts"
            emoji="💌"
            delay={0.05}
            badge={
              <span
                className={clsx(
                  "rounded-full px-2.5 py-0.5 text-xs font-bold",
                  voice.samples.length >= 3 ? "bg-mint text-mint-deep" : "bg-blush-100 text-blush-600",
                )}
              >
                {voice.samples.length} / 8
              </span>
            }
          >
            <SamplesManager
              samples={voice.samples}
              onChange={(samples) => {
                if (samples.length > voice.samples.length) {
                  toast(`Sample saved 💌 ${samples.length} of 3–8 — ask Claude in chat to refresh your voice card`);
                } else if (samples.length < voice.samples.length) {
                  toast("Sample removed", "info");
                }
                update({ samples });
              }}
            />
          </Section>

          <Section title="Tone" emoji="🎀" delay={0.1}>
            <div className="flex flex-wrap gap-2">
              {TONE_PRESETS.map((t) => (
                <Chip key={t} active={voice.toneTags.includes(t)} onClick={() => toggleTag(t)}>
                  {voice.toneTags.includes(t) && <Check className="size-3.5" />}
                  {t}
                </Chip>
              ))}
              {customTags.map((t) => (
                <Chip key={t} active onClick={() => toggleTag(t)}>
                  <Check className="size-3.5" />
                  {t}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex max-w-xs gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                placeholder="Add your own…"
                className="h-9 text-[13px]"
              />
              <button
                onClick={addCustomTag}
                aria-label="Add tag"
                className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-blush-100 text-blush-600 transition-all hover:rotate-90 hover:bg-blush-200"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </Section>

          <Section title="Style dials" emoji="🍭" delay={0.15}>
            <div className="space-y-7">
              {/* Emoji level */}
              <div>
                <Label hint={EMOJI_LEVELS[voice.emojiLevel]?.icon}>Emoji use · {EMOJI_LEVELS[voice.emojiLevel]?.label}</Label>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={voice.emojiLevel}
                  onChange={(e) => update({ emojiLevel: Number(e.target.value) })}
                  className="w-full cursor-pointer accent-blush-500"
                  aria-label="Emoji use"
                />
                <div className="mt-1 flex justify-between text-[11px] text-berry-faint">
                  {EMOJI_LEVELS.map((l) => (
                    <span key={l.label}>{l.label}</span>
                  ))}
                </div>
              </div>

              {/* Length segmented */}
              <div>
                <Label>Post length</Label>
                <div className="relative grid grid-cols-3 rounded-2xl bg-blush-50 p-1 ring-1 ring-blush-100">
                  {LENGTHS.map((l) => {
                    const active = voice.length === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => update({ length: l.id })}
                        className={clsx(
                          "relative cursor-pointer rounded-xl px-3 py-2.5 text-center transition-colors",
                          active ? "text-white" : "text-berry-soft hover:text-blush-600",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="length-pill"
                            className="btn-candy absolute inset-0 rounded-xl"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          />
                        )}
                        <span className="relative block text-sm font-semibold">{l.label}</span>
                        <span className={clsx("relative block text-[11px]", active ? "text-white/80" : "text-berry-faint")}>
                          {l.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hashtag stepper */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-berry">Hashtags</p>
                  <p className="text-xs text-berry-faint">Added at the very end</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-blush-50 p-1 ring-1 ring-blush-100">
                  <StepBtn
                    label="Fewer hashtags"
                    disabled={voice.hashtags <= 0}
                    onClick={() => update({ hashtags: Math.max(0, voice.hashtags - 1) })}
                  >
                    <Minus className="size-4" />
                  </StepBtn>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={voice.hashtags}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      className="w-8 text-center font-display text-lg font-semibold text-berry tabular-nums"
                    >
                      {voice.hashtags}
                    </motion.span>
                  </AnimatePresence>
                  <StepBtn
                    label="More hashtags"
                    disabled={voice.hashtags >= 5}
                    onClick={() => update({ hashtags: Math.min(5, voice.hashtags + 1) })}
                  >
                    <Plus className="size-4" />
                  </StepBtn>
                </div>
              </div>
            </div>
          </Section>

          <Section title="House rules" emoji="📏" delay={0.2}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label>Always</Label>
                <RuleList
                  tone="do"
                  items={voice.dos}
                  onChange={(dos) => update({ dos })}
                  placeholder="End with a question"
                />
              </div>
              <div>
                <Label>Never</Label>
                <RuleList
                  tone="dont"
                  items={voice.donts}
                  onChange={(donts) => update({ donts })}
                  placeholder="Say 'thrilled to announce'"
                />
              </div>
            </div>
          </Section>
        </div>

        {/* ───── Right: sticky voice card ───── */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5 lg:sticky lg:top-8 lg:self-start"
        >
          <VoiceCard
            voice={voice}
            analyzing={analyzing}
            onAnalyze={analyze}
            note={
              <AnimatePresence>
                {noKey && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 rounded-2xl bg-white/85 px-4 py-3 text-[13px] leading-relaxed text-berry-soft ring-1 ring-blush-100">
                      💌 No in-app writer is set up — that&apos;s okay! Just ask <b className="text-blush-600">Claude</b> in your
                      chat to &ldquo;analyze my voice&rdquo; and this card fills itself in.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            }
          />
          <p className="px-2 text-center text-xs text-berry-faint">
            Claude reads your samples and fills in this card — ask in chat, or add an optional key in{" "}
            <Link href="/studio/settings" className="font-semibold text-blush-500 underline-offset-2 hover:underline">
              Settings
            </Link>
            .
          </p>
          {voice.samples[0] && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-bold tracking-[0.18em] text-berry-faint uppercase">
                How you look in the feed
              </p>
              <div className="transition-transform duration-500 ease-[var(--ease-bounce)] hover:-rotate-1 hover:scale-[1.01]">
                <LinkedInPreview text={voice.samples[0].text} name={voice.name} headline={voice.headline} compact />
              </div>
            </div>
          )}
        </motion.aside>
      </div>
    </>
  );
}

function Section({
  title,
  emoji,
  badge,
  delay,
  children,
}: {
  title: string;
  emoji: string;
  badge?: React.ReactNode;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="transition-shadow duration-500 hover:shadow-[var(--shadow-candy)]">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="text-lg transition-transform hover:animate-wiggle">{emoji}</span>
          <h2 className="font-display text-xl font-semibold text-berry">{title}</h2>
          {badge && <span className="ml-auto">{badge}</span>}
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white text-blush-600 shadow-sm transition-colors hover:bg-blush-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </motion.button>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <AnimatePresence mode="wait">
      {state !== "idle" && (
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
            state === "saved" ? "bg-mint text-mint-deep" : "bg-blush-50 text-berry-faint",
          )}
        >
          {state === "saving" ? (
            <>
              <Spinner className="size-3" /> Saving…
            </>
          ) : (
            <>
              <Check className="size-3.5" /> Saved
            </>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
