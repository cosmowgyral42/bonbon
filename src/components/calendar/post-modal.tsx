"use client";

import clsx from "clsx";
import { CalendarClock, CloudUpload, HardDrive, Trash2, Undo2, X } from "lucide-react";
import { useState } from "react";
import { ImagePicker } from "@/components/image-picker";
import { LinkedInPreview } from "@/components/linkedin-preview";
import { useToast } from "@/components/toast";
import { Button, CategoryBadge, Input, Modal } from "@/components/ui";
import { api, fmtDateTime, fmtDay, fmtTime, imageSrc } from "@/lib/client";
import { toLocalInput } from "@/lib/slots";
import type { Post, PostImage, Voice } from "@/lib/types";

type Result = { post: Post; warning?: string };

const MAX = 3000;

export function PostModal({
  post,
  voice,
  suggested = [],
  onClose,
  onChanged,
}: {
  post: Post | null;
  voice: Voice | null;
  suggested?: Date[]; // open slots offered as one-tap times
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Modal open={!!post} onClose={onClose} className="w-[min(72rem,94vw)] max-w-none! overflow-hidden! p-0!">
      {post && (
        <Body key={post.id} post={post} voice={voice} suggested={suggested} onClose={onClose} onChanged={onChanged} />
      )}
    </Modal>
  );
}

function Section({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-bold tracking-wide text-berry uppercase">{title}</h3>
        {hint && <span className="text-xs text-berry-faint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Body({
  post,
  voice,
  suggested,
  onClose,
  onChanged,
}: {
  post: Post;
  voice: Voice | null;
  suggested: Date[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [text, setText] = useState(post.text);
  const [images, setImages] = useState<PostImage[]>(post.images ?? []);
  const [when, setWhen] = useState(post.scheduledAt ? toLocalInput(new Date(post.scheduledAt)) : "");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sent = post.status === "sent";
  const inBuffer = !!post.bufferPostId;
  const isDraft = post.status === "draft";

  async function run(kind: string, fn: () => Promise<Result | { ok: boolean }>, success: string) {
    setBusy(kind);
    try {
      const r = await fn();
      if ("warning" in r && r.warning) toast(r.warning, "info");
      else toast(success);
      onChanged();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong", "error");
    } finally {
      setBusy(null);
    }
  }

  const save = () =>
    run(
      "save",
      () => api<Result>(`/api/posts/${post.id}`, { method: "PATCH", body: { text, images, action: "save" } }),
      "Saved 💕",
    );
  const schedule = () => {
    if (!when) return toast("Pick a slot or a time first 🗓️", "info");
    run(
      "schedule",
      () =>
        api<Result>(`/api/posts/${post.id}`, {
          method: "PATCH",
          body: { text, images, scheduledAt: new Date(when).toISOString(), action: "schedule" },
        }),
      inBuffer ? "Updated in Buffer ✨" : "Scheduled ✨",
    );
  };
  const unschedule = () =>
    run(
      "unschedule",
      () => api<Result>(`/api/posts/${post.id}`, { method: "PATCH", body: { action: "unschedule" } }),
      "Moved back to drafts",
    );
  const remove = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    run("delete", () => api<{ ok: boolean }>(`/api/posts/${post.id}`, { method: "DELETE" }), "Deleted");
  };

  const firstLine = text.split("\n")[0] ?? "";

  return (
    <div className="flex max-h-[90vh] flex-col">
      {/* ── Header ── */}
      <header className="flex items-start justify-between gap-4 border-b border-blush-100 px-8 pt-7 pb-5">
        <div className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <CategoryBadge category={post.category} />
            {isDraft && !post.fromBuffer && (
              <span className="rounded-full bg-blush-50 px-2.5 py-1 text-[11px] font-semibold text-blush-600">
                Written by Claude · waiting for you
              </span>
            )}
            {!isDraft &&
              (inBuffer ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-semibold text-mint-deep">
                  <CloudUpload className="size-3" /> In Buffer · auto-publishes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-butter px-2.5 py-1 text-[11px] font-semibold text-butter-deep">
                  <HardDrive className="size-3" /> On your calendar only
                </span>
              ))}
            {post.fromBuffer && <span className="text-[11px] text-berry-faint">imported from Buffer</span>}
          </div>
          <h2 className="font-display text-[1.75rem] leading-tight font-semibold text-berry">
            {isDraft ? "Review this draft" : sent ? "Published" : `Going out ${fmtDateTime(post.scheduledAt!)}`}
          </h2>
          {firstLine && <p className="mt-1 truncate text-sm text-berry-soft">{firstLine}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-berry-soft transition-all duration-300 hover:rotate-90 hover:bg-blush-50 hover:text-blush-600"
        >
          <X className="size-5" />
        </button>
      </header>

      {/* ── Body: editor | preview ── */}
      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-7 overflow-y-auto px-8 py-7">
          {post.error && <p className="rounded-2xl bg-blush-50 p-3 text-sm text-blush-700">{post.error}</p>}

          <Section
            title="Post"
            hint={
              <span className={clsx("tabular-nums", text.length > MAX && "font-semibold text-blush-600")}>
                {text.length.toLocaleString()} / {MAX.toLocaleString()}
              </span>
            }
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sent}
              rows={16}
              className="w-full resize-y rounded-2xl border border-blush-100 bg-blush-50/30 px-5 py-4 text-[15px] leading-7 text-berry transition-all duration-300 outline-none hover:border-blush-200 focus:border-blush-300 focus:bg-white focus:ring-4 focus:ring-blush-100"
            />
          </Section>

          <Section title="Image" hint={images.length ? "Made public only when the post is scheduled" : "Optional"}>
            <ImagePicker images={images} onChange={setImages} disabled={sent} />
          </Section>

          {!sent && (
            <Section title="When">
              {suggested.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {suggested.slice(0, 4).map((d) => {
                    const v = toLocalInput(d);
                    const active = when === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setWhen(v)}
                        className={clsx(
                          "flex cursor-pointer flex-col items-start rounded-2xl border px-4 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5",
                          active
                            ? "border-blush-400 bg-blush-500 text-white shadow-[var(--shadow-candy)]"
                            : "border-blush-100 bg-white text-berry hover:border-blush-300",
                        )}
                      >
                        <span className="text-sm font-semibold">{fmtDay(d)}</span>
                        <span className={clsx("text-xs", active ? "text-white/85" : "text-berry-soft")}>
                          {fmtTime(d)} · open slot
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </Section>
          )}
        </div>

        <div className="sprinkles overflow-y-auto border-t border-blush-100 bg-blush-50/70 px-8 py-7 md:border-t-0 md:border-l">
          <div className="mx-auto max-w-[520px]">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-[13px] font-bold tracking-wide text-berry uppercase">Feed preview</h3>
              <span className="text-xs text-berry-faint">How it&apos;ll look on LinkedIn</span>
            </div>
            <LinkedInPreview
              text={text}
              name={voice?.name}
              headline={voice?.headline}
              images={images.map(imageSrc)}
            />
          </div>
        </div>
      </div>

      {/* ── Footer actions ── */}
      <footer className="flex flex-wrap items-center gap-3 border-t border-blush-100 bg-white px-8 py-4">
        <Button variant="danger" onClick={remove} loading={busy === "delete"} disabled={!!busy}>
          <Trash2 className="size-4" /> {confirmDelete ? "Really delete?" : "Delete"}
        </Button>
        {!sent && (
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {post.status === "scheduled" && (
              <Button variant="ghost" onClick={unschedule} loading={busy === "unschedule"} disabled={!!busy}>
                <Undo2 className="size-4" /> Unschedule
              </Button>
            )}
            <Button variant="outline" onClick={save} loading={busy === "save"} disabled={!!busy || text.length > MAX}>
              Save changes
            </Button>
            <Button onClick={schedule} loading={busy === "schedule"} disabled={!!busy || text.length > MAX}>
              <CalendarClock className="size-4" /> {post.status === "scheduled" ? "Update schedule" : "Approve & schedule"}
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}
