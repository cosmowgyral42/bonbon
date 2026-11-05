import { friendlyAIError, generateDrafts } from "@/lib/ai";
import { anthropicKey, getDB } from "@/lib/store";
import type { Category } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as { category: Category; story: string; tweak?: string; previous?: string };
  if (!body.story?.trim()) return Response.json({ error: "Tell me what happened first ✨" }, { status: 400 });
  const db = await getDB();
  try {
    const drafts = await generateDrafts({
      apiKey: anthropicKey(db.settings),
      voice: db.voice,
      category: body.category,
      story: body.story,
      tweak: body.tweak,
      previous: body.previous,
    });
    return Response.json({ drafts });
  } catch (e) {
    return Response.json({ error: friendlyAIError(e) }, { status: 400 });
  }
}
