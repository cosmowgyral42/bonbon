"use client";

import clsx from "clsx";
import { Check, ExternalLink, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { Button, Card, Spinner } from "@/components/ui";
import { api } from "@/lib/client";
import type { PublicSettings } from "@/lib/types";
import { KeyField, StatusPill } from "./key-field";

type Channel = { id: string; name: string; displayName?: string; service: string; avatar?: string };
type Org = { id: string; name: string; channels: Channel[] };

export function BufferCard({
  settings,
  save,
}: {
  settings: PublicSettings;
  save: (patch: Record<string, unknown>) => Promise<PublicSettings | null>;
}) {
  const toast = useToast();
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(!settings.bufferChannelId);

  const connected = !!settings.bufferChannelId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ orgs: Org[] }>("/api/buffer/channels");
      setOrgs(r.orgs);
      setShowPicker(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't reach Buffer", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // If there's a key but no channel yet, fetch channels straight away.
  useEffect(() => {
    if (settings.hasBufferKey && !settings.bufferChannelId && !orgs) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.hasBufferKey]);

  const saveKey = async (bufferApiKey: string) => {
    setSavingKey(true);
    const s = await save({ bufferApiKey });
    setSavingKey(false);
    if (s) {
      toast("Buffer key saved — fetching your channels…", "info");
      setOrgs(null);
      load();
    }
  };

  const pick = async (org: Org, ch: Channel) => {
    setPicking(ch.id);
    const s = await save({
      bufferOrgId: org.id,
      bufferChannelId: ch.id,
      bufferChannelName: ch.displayName || ch.name,
    });
    setPicking(null);
    if (s) {
      toast(`Connected to ${ch.displayName || ch.name} 💕`);
      setShowPicker(false);
    }
  };

  const allChannels = (orgs ?? []).flatMap((o) =>
    o.channels.map((c) => ({ org: o, ch: c, li: c.service.toLowerCase().includes("linkedin") })),
  );
  allChannels.sort((a, b) => Number(b.li) - Number(a.li));

  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="absolute -top-20 -right-20 size-56 rounded-full bg-blush-100/70 blur-2xl" />
      <div className="relative">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-100 to-white text-xl shadow-[var(--shadow-candy)]">
            📮
          </span>
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-berry">Buffer</h2>
            <p className="text-xs text-berry-faint">Schedules and publishes your posts to LinkedIn</p>
          </div>
          <StatusPill ok={connected}>{connected ? "Connected" : settings.hasBufferKey ? "Pick a channel" : "Not connected"}</StatusPill>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-[13px] font-semibold text-berry">API key</p>
          {settings.bufferKeyFromEnv ? (
            <p className="flex items-center gap-2 rounded-2xl bg-mint/70 px-4 py-3 text-[13px] text-berry-soft">
              <span>🔐</span>
              <span>
                <b className="text-mint-deep">Key connected via .env.local</b> — nothing to paste. You can still override it
                below.
              </span>
            </p>
          ) : null}
          <div className={settings.bufferKeyFromEnv ? "mt-2" : ""}>
            <KeyField masked={settings.bufferApiKey} placeholder={settings.bufferKeyFromEnv ? "Paste a different key to override (optional)" : "Paste your Buffer API key"} onSave={saveKey} saving={savingKey} />
          </div>
          <a
            href="https://publish.buffer.com/settings/api"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blush-500 underline-offset-2 hover:underline"
          >
            Get a key at publish.buffer.com/settings/api <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Connected channel */}
        <AnimatePresence initial={false}>
          {connected && !showPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blush-50 to-white p-4 ring-1 ring-blush-100">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#0a66c2] text-sm font-bold text-white">in</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-berry">{settings.bufferChannelName || "Your channel"}</p>
                  <p className="text-xs text-berry-faint">Posts you schedule land here</p>
                </div>
                <Button variant="outline" size="sm" onClick={load} loading={loading}>
                  {!loading && <RefreshCw className="size-3.5" />} Change
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Channel picker */}
        <AnimatePresence initial={false}>
          {showPicker && (loading || orgs) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-berry">Choose your LinkedIn channel</p>
                  {connected && (
                    <button
                      onClick={() => setShowPicker(false)}
                      className="cursor-pointer text-xs font-semibold text-berry-faint hover:text-blush-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-blush-50 p-4 text-sm text-berry-soft">
                    <Spinner className="text-blush-500" /> Talking to Buffer…
                  </div>
                ) : allChannels.length === 0 ? (
                  <p className="rounded-2xl bg-blush-50 p-4 text-sm text-berry-soft">
                    No channels found. Connect your LinkedIn profile inside Buffer first, then hit refresh.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {allChannels.map(({ org, ch, li }, i) => {
                      const selected = settings.bufferChannelId === ch.id;
                      return (
                        <motion.button
                          key={ch.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => pick(org, ch)}
                          disabled={!!picking}
                          className={clsx(
                            "group relative flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-candy)]",
                            selected ? "border-blush-400 ring-4 ring-blush-100" : li ? "border-blush-200" : "border-blush-100 opacity-80",
                          )}
                        >
                          {ch.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ch.avatar} alt="" className="size-10 rounded-full object-cover ring-2 ring-white" />
                          ) : (
                            <span className="inline-flex size-10 items-center justify-center rounded-full bg-blush-100 font-bold text-blush-600">
                              {(ch.displayName || ch.name).slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-berry">{ch.displayName || ch.name}</span>
                            <span
                              className={clsx(
                                "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                                li ? "bg-[#0a66c2]/10 text-[#0a66c2]" : "bg-blush-50 text-berry-faint",
                              )}
                            >
                              {ch.service}
                            </span>
                            {orgs && orgs.length > 1 && <span className="ml-1.5 text-[10px] text-berry-faint">{org.name}</span>}
                          </span>
                          {picking === ch.id ? (
                            <Spinner className="text-blush-500" />
                          ) : selected ? (
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-blush-500 text-white">
                              <Check className="size-3.5" />
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-blush-500 opacity-0 transition-opacity group-hover:opacity-100">
                              Use →
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
                {!loading && (
                  <button
                    onClick={load}
                    className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-berry-faint hover:text-blush-600"
                  >
                    <RefreshCw className="size-3" /> Refresh channels
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {settings.hasBufferKey && !orgs && !loading && !connected && (
          <Button className="mt-5" onClick={load}>
            Connect to Buffer
          </Button>
        )}
      </div>
    </Card>
  );
}
