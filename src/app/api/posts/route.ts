import { pushSchedule } from "./push";
import { getDB, id, updateDB } from "@/lib/store";
import type { Post } from "@/lib/types";
import { route } from "@/lib/route";

export const GET = route("GET /api/posts", async function GET() {
  return Response.json((await getDB()).posts);
});

export const POST = route("POST /api/posts", async function POST(req: Request) {
  const body = (await req.json()) as Partial<Post> & { schedule?: boolean };
  if (!body.text?.trim()) return Response.json({ error: "Post is empty." }, { status: 400 });
  const post: Post = {
    id: id(),
    text: body.text,
    category: body.category ?? "life",
    status: "draft",
    scheduledAt: body.scheduledAt ?? null,
    sourceNoteId: body.sourceNoteId ?? null,
    images: body.images ?? [],
    bufferPostId: null,
    createdAt: new Date().toISOString(),
  };

  let warning: string | undefined;
  if (body.schedule && post.scheduledAt) {
    const { settings } = await getDB();
    const r = await pushSchedule(settings, post);
    if (r.error) return Response.json({ error: r.error }, { status: 400 });
    warning = r.warning;
  }

  await updateDB((db) => {
    db.posts.push(post);
    const note = db.notes.find((n) => n.id === post.sourceNoteId);
    if (note) note.used = true;
  });
  return Response.json({ post, warning });
});
