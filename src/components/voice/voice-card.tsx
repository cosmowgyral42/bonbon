"use client";

import clsx from "clsx";
import { Sparkles, Wand2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui";
import type { Voice } from "@/lib/types";

const DEFAULT_TRAITS = ["Warmth", "Playfulness", "Vulnerability", "Authority", "Storytelling"];
const BAR_COLORS = [
  "from-blush-300 to-blush-500",
  "from-peach-deep/70 to-blush-400",
  "from-lilac-deep/60 to-blush-400",
  "from-blush-400 to-blush-600",
  "from-lilac-deep/70 to-lilac-deep",
];

export function VoiceCard({
  voice,
  analyzing,
  onAnalyze,
  note,
}: {
  voice: Voice;
  analyzing: boolean;
  onAnalyze: () => void;
  note?: React.ReactNode;
}) {
  const hasTraits = voice.traits.length > 0;
  const hasAnalysis = !!voice.summary || hasTraits;
  // Before any analysis, show empty placeholder bars; after, show only real traits.
  const traits = hasTraits ? voice.traits : hasAnalysis ? [] : DEFAULT_TRAITS.map((label) => ({ label, score: 0 }));

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-candy)] border border-blush-100 bg-gradient-to-br from-white via-blush-50 to-lilac/60 p-6 shadow-[var(--shadow-candy-lg)]">
      <div aria-hidden className="sprinkles pointer-events-none absolute inset-0 opacity-50" />
      <div aria-hidden className="absolute -top-16 -right-16 size-48 animate-float-slow rounded-full bg-blush-200/50 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-blush-500 uppercase">Voice card</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-berry">
              {voice.name ? (
                <>
                  {voice.name.split(" ")[0]}&apos;s <span className="font-display-wonk text-blush-500">voice</span>
                </>
              ) : (
                <>
                  Your <span className="font-display-wonk text-blush-500">voice</span>
                </>
              )}
            </h2>
          </div>
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }}
            className="text-3xl"
          >
            🎀
          </motion.span>
        </div>

        {/* Summary */}
        <div className="mt-5 min-h-24">
          {analyzing ? (
            <div className="space-y-2.5">
              {[100, 92, 80, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-3.5 animate-pulse rounded-full bg-gradient-to-r from-blush-100 via-blush-200 to-blush-100"
                  style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          ) : voice.summary ? (
            <motion.p
              key={voice.summary}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[14px] leading-relaxed text-berry-soft"
            >
              {voice.summary}
            </motion.p>
          ) : (
            <p className="text-[14px] leading-relaxed text-berry-faint">
              Paste a few of your posts on the left. Your voice gets distilled here — rhythm, humour and
              little habits — so every draft sounds like you.
            </p>
          )}
        </div>

        {/* Tone tags */}
        {voice.toneTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {voice.toneTags.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 20 }}
                className="rounded-full border border-blush-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blush-600"
              >
                {t}
              </motion.span>
            ))}
          </div>
        )}

        {/* Trait bars */}
        {traits.length > 0 && (
        <div className="mt-6 space-y-3">
          {traits.slice(0, 6).map((t, i) => (
            <div key={t.label}>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="text-berry">{t.label}</span>
                <span className="text-berry-faint tabular-nums">{hasTraits ? t.score : "–"}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-blush-100">
                <motion.div
                  key={`${t.label}-${t.score}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${hasTraits ? t.score : 0}%` }}
                  transition={{ duration: 1.1, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={clsx("h-full rounded-full bg-gradient-to-r", BAR_COLORS[i % BAR_COLORS.length])}
                />
              </div>
            </div>
          ))}
        </div>
        )}

        <Button onClick={onAnalyze} loading={analyzing} className="mt-6 w-full" size="lg">
          {!analyzing && (hasAnalysis ? <Wand2 className="size-4" /> : <Sparkles className="size-4" />)}
          {analyzing ? "Reading your posts…" : hasAnalysis ? "Re-analyze my voice ✨" : "Analyze my voice ✨"}
        </Button>
        {note}
        {voice.updatedAt && hasAnalysis && voice.samples.length > 0 && (
          <p className="mt-2 text-center text-[11px] text-berry-faint">
            Learned from {voice.samples.length} sample{voice.samples.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </div>
  );
}
