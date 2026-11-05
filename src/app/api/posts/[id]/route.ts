import { pullFromBuffer, pushSchedule } from "../push";
import { getDB, updateDB } from "@/lib/store";
import type { Post } from "@/lib/types";

type Patch = { images?: Post["images"]; text?: string; scheduledAt?: string | null; category?: Post["category"]; action?: "schedule" | "unschedule" | "save" };

export async function PATCH(req: Request, ctx: RouteContext<"/api/posts/[id]">) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Patch;
  const { settings, posts } = await getDB();
  const current = posts.find((p) => p.id === id);
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const post: Post = { ...current };
  if (body.text !== undefined) post.text = body.text;
  if (body.images !== undefined) post.images = body.images;
  if (body.category) post.category = body.category;
  if (body.scheduledAt !== undefined) post.scheduledAt = body.scheduledAt;

  let warning: string | undefined;
  if (body.action === "unschedule") {
    const r = await pullFromBuffer(settings, post);
    if (r.error) return Response.json({ error: r.error }, { status: 400 });
    post.status = "draft";
    post.scheduledAt = null;
  } else if (body.action === "schedule" || (post.status === "scheduled" && post.bufferPostId)) {
    const r = await pushSchedule(settings, post);
    if (r.error) return Response.json({ error: r.error }, { status: 400 });
    warning = r.warning;
  }

  await updateDB((db) => {
    const i = db.posts.findIndex((p) => p.id === id);
    if (i >= 0) db.posts[i] = post;
  });
  return Response.json({ post, warning });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/posts/[id]">) {
  const { id } = await ctx.params;
  const { settings, posts } = await getDB();
  const post = posts.find((p) => p.id === id);
  if (post && post.status === "scheduled") {
    const r = await pullFromBuffer(settings, { ...post });
    if (r.error) return Response.json({ error: r.error }, { status: 400 });
  }
  await updateDB((db) => void (db.posts = db.posts.filter((p) => p.id !== id)));
  return Response.json({ ok: true });
}
