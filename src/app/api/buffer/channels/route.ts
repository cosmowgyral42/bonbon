import { BufferError, listChannels, listOrgs } from "@/lib/buffer";
import { bufferKey, getDB } from "@/lib/store";
import { route } from "@/lib/route";

// Lists every org + channel on the Buffer account so the user can pick their LinkedIn profile.
export const GET = route("GET /api/buffer/channels", async function GET() {
  const key = bufferKey((await getDB()).settings);
  try {
    const orgs = await listOrgs(key);
    const withChannels = await Promise.all(
      orgs.map(async (o) => ({ ...o, channels: await listChannels(key, o.id) })),
    );
    return Response.json({ orgs: withChannels });
  } catch (e) {
    const msg = e instanceof BufferError ? e.message : "Couldn't reach Buffer.";
    return Response.json({ error: msg }, { status: 400 });
  }
});
