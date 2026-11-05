"use client";

import clsx from "clsx";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { NoteCard } from "@/components/ideas/note-card";
import { QuickCapture } from "@/components/ideas/quick-capture";
import { useToast } from "@/components/toast";
import { Button, Chip, Empty, Input, Label, Modal, PageHeader, Spinner, Textarea } from "@/components/ui";
import { api, useData } from "@/lib/client";
import { CATEGORIES, type Category, type Note } from "@/lib/types";

type Filter = "all" | "unused" | Category;

const sortNotes = (ns: Note[]) =>
  [...ns].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));

export default function IdeasPage() {
  const { data: notes, setData: setNotes, loading } = useData<Note[]>("/api/notes");
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);

  const visible = useMemo(() => {
    const list = notes ?? [];
    const needle = q.trim().toLowerCase();
    return sortNotes(
      list.filter((n) => {
        if (filter === "unused" && n.used) return false;
        if (filter !== "all" && filter !== "unused" && n.category !== filter) return false;
        if (needle && !`${n.title} ${n.body}`.toLowerCase().includes(needle)) return false;
        return true;
      }),
    );
  }, [notes, filter, q]);

  const counts = useMemo(() => {
    const list = notes ?? [];
    const c: Record<string, number> = { all: list.length, unused: list.filter((n) => !n.used).length };
    for (const cat of CATEGORIES) c[cat.id] = list.filter((n) => n.category === cat.id).length;
    return c;
  }, [notes]);

  const create = async (n: { title: string; body: string; category: Category }) => {
    try {
      const note = await api<Note>("/api/notes", { body: n });
      setNotes((prev) => [note, ...(prev ?? [])]);
      toast("Into the jar it goes 🫙");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save", "error");
      throw e;
    }
  };

  const patch = async (id: string, body: Partial<Note>) => {
    const prev = notes;
    setNotes((ns) => (ns ?? []).map((n) => (n.id === id ? { ...n, ...body } : n)));
    try {
      await api(`/api/notes/${id}`, { method: "PATCH", body });
    } catch (e) {
      setNotes(prev);
      toast(e instanceof Error ? e.message : "Couldn't update", "error");
    }
  };

  const remove = async (id: string) => {
    const prev = notes;
    setNotes((ns) => (ns ?? []).filter((n) => n.id !== id));
    try {
      await api(`/api/notes/${id}`, { method: "DELETE" });
      toast("Idea removed", "info");
    } catch (e) {
      setNotes(prev);
      toast(e instanceof Error ? e.message : "Couldn't delete", "error");
    }
  };

  const filters: { id: Filter; label: string; emoji?: string }[] = [
    { id: "all", label: "All" },
    ...CATEGORIES.map((c) => ({ id: c.id as Filter, label: c.label, emoji: c.emoji })),
    { id: "unused", label: "Not posted yet", emoji: "🌱" },
  ];

  return (
    <>
      <PageHeader
        emoji="🫙"
        title={
          <>
            Idea <span className="font-display-wonk text-blush-500">jar</span>
          </>
        }
        subtitle={
          <>
            Catch the little moments before they slip away. Drop ideas here —{" "}
            <b className="font-semibold text-blush-600">Claude turns the unused ones into drafts</b> for you.
          </>
        }
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <QuickCapture onSave={create} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mt-8 mb-7 flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.emoji && <span>{f.emoji}</span>}
              {f.label}
              <span
                className={clsx(
                  "ml-0.5 rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                  filter === f.id ? "bg-white/25" : "bg-blush-50 text-berry-faint",
                )}
              >
                {counts[f.id] ?? 0}
              </span>
            </Chip>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-berry-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ideas…" className="h-10 pl-10" />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-blush-400">
          <Spinner className="size-6" />
        </div>
      ) : visible.length === 0 ? (
        <Empty emoji={notes?.length ? "🔍" : "🫙"} title={notes?.length ? "Nothing matches" : "Your jar is empty"}>
          {notes?.length
            ? "Try a different filter or search word."
            : "Got a new course, a tiny win, a project you're tinkering with? Jot it above — future you will thank you."}
        </Empty>
      ) : (
        <motion.div layout className="columns-1 gap-5 pt-3 sm:columns-2 xl:columns-3">
          <AnimatePresence mode="popLayout">
            {visible.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onPin={() => patch(n.id, { pinned: !n.pinned })}
                onEdit={() => setEditing(n)}
                onDelete={() => remove(n.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <EditNoteModal
        note={editing}
        onClose={() => setEditing(null)}
        onSave={async (body) => {
          if (!editing) return;
          await patch(editing.id, body);
          setEditing(null);
          toast("Idea updated ✨");
        }}
      />
    </>
  );
}

function EditNoteModal({
  note,
  onClose,
  onSave,
}: {
  note: Note | null;
  onClose: () => void;
  onSave: (b: Partial<Note>) => Promise<void>;
}) {
  return (
    <Modal open={!!note} onClose={onClose}>
      {note && <EditForm key={note.id} note={note} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

function EditForm({
  note,
  onClose,
  onSave,
}: {
  note: Note;
  onClose: () => void;
  onSave: (b: Partial<Note>) => Promise<void>;
}) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [category, setCategory] = useState<Category>(note.category);
  const [used, setUsed] = useState(note.used);
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <h2 className="font-display mb-5 text-2xl font-semibold text-berry">Edit idea ✏️</h2>
      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <Label>Details</Label>
          <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.emoji} {c.label}
              </Chip>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-berry-soft">
          <input
            type="checkbox"
            checked={used}
            onChange={(e) => setUsed(e.target.checked)}
            className="size-4 accent-blush-500"
          />
          Already posted about this
        </label>
      </div>
      <div className="mt-7 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          loading={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({ title: title.trim(), body: body.trim(), category, used });
            setSaving(false);
          }}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
