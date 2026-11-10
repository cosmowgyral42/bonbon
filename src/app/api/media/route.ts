import { saveImage } from "@/lib/media";
import { route } from "@/lib/route";

// Upload an image from the browser; it's stored in data/media on this machine.
export const POST = route("POST /api/media", async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No image received." }, { status: 400 });
  try {
    return Response.json(await saveImage(file));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
});
