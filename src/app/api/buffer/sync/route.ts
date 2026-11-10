import { BufferError, listScheduledPosts } from "@/lib/buffer";
import { bufferKey, getDB, id, updateDB } from "@/lib/store";
import { route } from "@/lib/route";

// Pulls scheduled posts from Buffer so the calendar also shows things queued outside this app.
export const POST = route("POST /api/buffer/sync", async function POST() {
  const { settings } = await getDB();
  if (!settings.bufferOrgId) return Response.json({ error: "Pick your Buffer channel in Settings first." }, { status: 400 });
  try {
    const remote = await listScheduledPosts(bufferKey(settings), settings.bufferOrgId, settings.bufferChannelId || undefined);
    const result = await updateDB((db) => {
      const remoteIds = new Set(remote.map((r) => r.id));
      let added = 0;
      let updated = 0;
      for (const r of remote) {
        const local = db.posts.find((p) => p.bufferPostId === r.id);
        if (local) {
          if (local.text !== r.text || local.scheduledAt !== r.dueAt) updated++;
          local.text = r.text;
          local.scheduledAt = r.dueAt;
          local.status = "scheduled";
        } else {
          added++;
          db.posts.push({
            id: id(),
            text: r.text,
            category: "career",
            status: "scheduled",
            scheduledAt: r.dueAt,
            bufferPostId: r.id,
            fromBuffer: true,
            createdAt: new Date().toISOString(),
          });
        }
      }
      // Scheduled-in-Buffer posts whose time has passed and are gone from the queue were most likely published.
      for (const p of db.posts) {
        if (p.bufferPostId && p.status === "scheduled" && !remoteIds.has(p.bufferPostId) && p.scheduledAt && new Date(p.scheduledAt) < new Date()) {
          p.status = "sent";
        }
      }
      return { added, updated, total: remote.length };
    });
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof BufferError ? e.message : "Couldn't reach Buffer.";
    return Response.json({ error: msg }, { status: 400 });
  }
});
