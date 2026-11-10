import { promises as fs } from "fs";
import path from "path";
import { MEDIA_DIR, MIME, safeName } from "@/lib/media";
import { route } from "@/lib/route";

export const GET = route("GET /api/media/[file]", async function GET(_req: Request, ctx: RouteContext<"/api/media/[file]">) {
  const name = safeName((await ctx.params).file);
  if (!name) return new Response("Not found", { status: 404 });
  try {
    const bytes = await fs.readFile(path.join(MEDIA_DIR, name));
    return new Response(bytes, {
      headers: { "Content-Type": MIME[path.extname(name).toLowerCase()], "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});
