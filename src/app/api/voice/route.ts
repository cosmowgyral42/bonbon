import { getDB, updateDB } from "@/lib/store";
import type { Voice } from "@/lib/types";

export async function GET() {
  return Response.json((await getDB()).voice);
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<Voice>;
  const voice = await updateDB((db) => {
    db.voice = { ...db.voice, ...body, updatedAt: new Date().toISOString() };
    return db.voice;
  });
  return Response.json(voice);
}
