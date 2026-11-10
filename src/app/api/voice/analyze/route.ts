import { analyzeVoice, friendlyAIError } from "@/lib/ai";
import { anthropicKey, getDB, updateDB } from "@/lib/store";
import { route } from "@/lib/route";

export const POST = route("POST /api/voice/analyze", async function POST() {
  const db = await getDB();
  try {
    const result = await analyzeVoice(anthropicKey(db.settings), db.voice);
    const voice = await updateDB((d) => {
      d.voice = { ...d.voice, ...result, updatedAt: new Date().toISOString() };
      return d.voice;
    });
    return Response.json(voice);
  } catch (e) {
    return Response.json({ error: friendlyAIError(e) }, { status: 400 });
  }
});
