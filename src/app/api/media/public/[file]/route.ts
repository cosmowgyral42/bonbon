import path from "path";
import { MIME, readPublicMedia } from "@/lib/media";
import { route } from "@/lib/route";

// An image made public for Buffer when its post was scheduled (hosted sites only).
export const GET = route(
  "GET /api/media/public/[file]",
  async function GET(_req: Request, ctx: RouteContext<"/api/media/public/[file]">) {
    const media = await readPublicMedia((await ctx.params).file);
    if (!media) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(media.bytes), {
      headers: {
        "Content-Type": MIME[path.extname(media.name).toLowerCase()],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  },
);
