import path from "path";
import { MIME, readMedia } from "@/lib/media";
import { route } from "@/lib/route";

// A private image from this workspace (local: data/media).
export const GET = route("GET /api/media/[file]", async function GET(_req: Request, ctx: RouteContext<"/api/media/[file]">) {
  const media = await readMedia((await ctx.params).file);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(media.bytes), {
    headers: { "Content-Type": MIME[path.extname(media.name).toLowerCase()], "Cache-Control": "private, max-age=3600" },
  });
});
