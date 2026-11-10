"use client";

import { ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { BufferCard } from "@/components/settings/buffer-card";
import { ClaudeCard } from "@/components/settings/claude-card";
import { RhythmCard } from "@/components/settings/rhythm-card";
import { useToast } from "@/components/toast";
import { PageHeader, Spinner } from "@/components/ui";
import { api, useData } from "@/lib/client";
import type { PublicSettings, Slot } from "@/lib/types";

export default function SettingsPage() {
  const { data: settings, setData } = useData<PublicSettings>("/api/settings");
  const toast = useToast();

  const save = async (patch: Record<string, unknown>) => {
    try {
      const s = await api<PublicSettings>("/api/settings", { method: "PUT", body: patch });
      setData(s);
      return s;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save", "error");
      return null;
    }
  };

  if (!settings) {
    return (
      <div className="flex h-64 items-center justify-center text-blush-400">
        <Spinner className="size-6" />
      </div>
    );
  }

  const fade = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: 0.05 + i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <>
      <PageHeader
        emoji="⚙️"
        title={
          <>
            Settings <span className="font-display-wonk text-blush-500">& keys</span>
          </>
        }
        subtitle="Connect Buffer for scheduling and set the rhythm you want to post at."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div {...fade(0)} className="lg:col-span-2">
          <BufferCard settings={settings} save={save} />
        </motion.div>

        <motion.div {...fade(1)} className="lg:col-span-2">
          <RhythmCard
            initial={settings.slots}
            onSave={async (slots: Slot[]) => {
              const s = await save({ slots });
              if (s) toast("Posting rhythm saved 🗓️");
              return !!s;
            }}
          />
        </motion.div>

        <motion.div {...fade(2)} className="lg:col-span-2">
          <ClaudeCard settings={settings} save={save} />
        </motion.div>

        <motion.div {...fade(3)} className="lg:col-span-2">
          <div className="flex items-start gap-3 rounded-[var(--radius-candy)] border border-dashed border-blush-200 bg-white/60 p-5 text-[13px] text-berry-soft">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-mint-deep" />
            {settings.hosted ? (
              <p>
                <b className="text-berry">Your keys are private to this browser.</b> They&apos;re encrypted before
                they&apos;re stored, only ever sent to Buffer (and Anthropic, if you add the optional key), and never sent
                back to this page. The browser only sees the last four characters. Clearing this site&apos;s cookies
                starts a fresh, empty workspace.
              </p>
            ) : (
              <p>
                <b className="text-berry">Your keys stay on this machine.</b> They&apos;re saved in{" "}
                <code className="rounded bg-blush-50 px-1.5 py-0.5 font-mono text-blush-600">data/db.json</code> inside
                this project (git-ignored) and only ever sent to Buffer (and Anthropic, if you add the optional key). The
                browser only sees the last four characters.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
