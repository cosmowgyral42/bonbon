import { getDB, id, updateDB } from "@/lib/store";
import type { Note } from "@/lib/types";

export async function GET() {
  const notes = (await getDB()).notes;
  return Response.json(notes.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Note>;
  const note: Note = {
    id: id(),
    title: body.title?.trim() || "",
    body: body.body?.trim() || "",
    category: body.category ?? "life",
    pinned: false,
    used: false,
    createdAt: new Date().toISOString(),
  };
  await updateDB((db) => void db.notes.push(note));
  return Response.json(note);
}
