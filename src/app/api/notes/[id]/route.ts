import { updateDB } from "@/lib/store";
import type { Note } from "@/lib/types";

export async function PATCH(req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<Note>;
  const note = await updateDB((db) => {
    const n = db.notes.find((x) => x.id === id);
    if (n) Object.assign(n, body, { id });
    return n;
  });
  return note ? Response.json(note) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const { id } = await ctx.params;
  await updateDB((db) => void (db.notes = db.notes.filter((x) => x.id !== id)));
  return Response.json({ ok: true });
}
