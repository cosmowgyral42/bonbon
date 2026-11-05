"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { Card } from "@/components/ui";
import type { PublicSettings } from "@/lib/types";
import { KeyField } from "./key-field";

// Optional: by default Claude (the operator, in chat) writes drafts and pushes them in via the local API.
export function ClaudeCard({
  settings,
  save,
}: {
  settings: PublicSettings;
  save: (patch: Record<string, unknown>) => Promise<PublicSettings | null>;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Card className="relative overflow-hidden bg-white/70 p-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full cursor-pointer items-center gap-3 p-6 text-left"
      >
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lilac to-white text-xl shadow-[var(--shadow-candy)] transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:rotate-6">
          ✍️
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-xl font-semibold text-berry">In-app writer</span>
            <span className="rounded-full bg-lilac px-2 py-0.5 text-[10px] font-bold tracking-wide text-lilac-deep uppercase">
              Optional
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-berry-faint">
            {settings.hasAnthropicKey
              ? "Anthropic key added — the Compose page can generate drafts itself"
              : "Claude writes your drafts for you in chat — no key needed"}
          </span>
        </span>
        <ChevronDown
          className={`size-5 text-berry-faint transition-transform duration-300 group-hover:text-blush-500 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-blush-50 px-6 pt-5 pb-6">
              <p className="mb-4 text-[13px] leading-relaxed text-berry-soft">
                Optional — only needed if you want the app itself to generate drafts. Your operator, Claude, writes them
                for you otherwise.
              </p>
              {settings.anthropicKeyFromEnv && (
                <p className="mb-2 rounded-2xl bg-lilac/60 px-4 py-3 text-[13px] text-berry-soft">
                  Using <code className="font-mono text-lilac-deep">ANTHROPIC_API_KEY</code> from .env.local.
                </p>
              )}
              <KeyField
                masked={settings.anthropicApiKey}
                placeholder="sk-ant-… (optional)"
                saving={saving}
                onSave={async (anthropicApiKey) => {
                  setSaving(true);
                  const s = await save({ anthropicApiKey });
                  setSaving(false);
                  if (s) toast("Key saved — in-app drafting is on ✨");
                }}
              />
              <a
                href="https://platform.claude.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blush-500 underline-offset-2 hover:underline"
              >
                Create a key in the Claude Console <ExternalLink className="size-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
