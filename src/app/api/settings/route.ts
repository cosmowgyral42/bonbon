import { getDB, publicSettings, updateDB } from "@/lib/store";
import type { Settings } from "@/lib/types";
import { route } from "@/lib/route";

export const GET = route("GET /api/settings", async function GET() {
  return Response.json(publicSettings((await getDB()).settings));
});

export const PUT = route("PUT /api/settings", async function PUT(req: Request) {
  const body = (await req.json()) as Partial<Settings>;
  const s = await updateDB((db) => {
    const next = { ...body };
    // Masked values coming back from the form mean "unchanged".
    if (next.bufferApiKey?.startsWith("••••")) delete next.bufferApiKey;
    if (next.anthropicApiKey?.startsWith("••••")) delete next.anthropicApiKey;
    if (next.bufferApiKey !== undefined && next.bufferApiKey !== db.settings.bufferApiKey) {
      // New Buffer account → forget the old org/channel choice.
      next.bufferOrgId = next.bufferOrgId ?? "";
      next.bufferChannelId = next.bufferChannelId ?? "";
      next.bufferChannelName = next.bufferChannelName ?? "";
    }
    db.settings = { ...db.settings, ...next };
    return db.settings;
  });
  return Response.json(publicSettings(s));
});
