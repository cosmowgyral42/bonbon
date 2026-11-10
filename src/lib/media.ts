import "server-only";
import { execFile } from "child_process";
import { createHash, randomBytes } from "crypto";
import path from "path";
import { promisify } from "util";
import { headers } from "next/headers";
import { id, saveError } from "./store";
import type { PostImage } from "./types";
import { HOSTED, publicStorage, workspaceId, workspaceStorage } from "./workspace";

export const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export const MAX_BYTES = 10 * 1024 * 1024;

// Only plain file names (no paths), with an image extension.
export function safeName(file: string) {
  const base = path.basename(file);
  return /^[\w.-]+$/.test(base) && MIME[path.extname(base).toLowerCase()] ? base : null;
}

export async function saveImage(file: File): Promise<PostImage> {
  const ext = path.extname(file.name).toLowerCase() || "." + (file.type.split("/")[1] ?? "png");
  if (!MIME[ext]) throw new Error("Use a PNG, JPG, GIF or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Images need to be under 10 MB.");
  const imageId = id();
  const name = `${imageId}${ext === ".jpeg" ? ".jpg" : ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const storage = await workspaceStorage(await workspaceId(true));
    await storage.write(`media/${name}`, bytes);
  } catch (e) {
    throw saveError(e, "the image");
  }
  return { id: imageId, file: name, url: null };
}

// Reads one of this workspace's private images. Returns null if it isn't there.
export async function readMedia(file: string) {
  const name = safeName(file);
  if (!name) return null;
  const ws = await workspaceId(false);
  if (HOSTED && !ws) return null;
  const bytes = await (await workspaceStorage(ws)).read(`media/${name}`);
  return bytes ? { name, bytes } : null;
}

// Reads an image that was made public for Buffer on a hosted site.
export async function readPublicMedia(file: string) {
  const name = safeName(file);
  if (!name) return null;
  const bytes = await (await publicStorage()).read(name);
  return bytes ? { name, bytes } : null;
}

// Host 1 — catbox.moe: free, keyless, permanent. (Uploads were paused in Nov 2026; kept as first choice.)
async function uploadToCatbox(name: string, bytes: Buffer): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("userhash", "");
  form.append("fileToUpload", new Blob([new Uint8Array(bytes)], { type: MIME[path.extname(name).toLowerCase()] }), name);
  const res = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form, signal: AbortSignal.timeout(20_000) });
  const text = (await res.text()).trim();
  if (!res.ok || !/^https:\/\/files\.catbox\.moe\/\S+$/.test(text)) throw new Error(`catbox: ${text.slice(0, 80) || res.status}`);
  return text;
}

// Host 2 — a public GitHub repo (BONBON_GITHUB_MEDIA_REPO=owner/repo), using the `gh` CLI login on this machine.
let ghToken: string | null = null;
async function githubToken() {
  if (!ghToken) ghToken = (await promisify(execFile)("gh", ["auth", "token"])).stdout.trim();
  return ghToken;
}

async function uploadToGitHub(name: string, bytes: Buffer): Promise<string> {
  const repo = process.env.BONBON_GITHUB_MEDIA_REPO;
  if (!repo) throw new Error("github: BONBON_GITHUB_MEDIA_REPO not set");
  // Content-addressed name, so re-uploading the same image reuses the same file.
  const file = `images/${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}${path.extname(name).toLowerCase()}`;
  const url = `https://raw.githubusercontent.com/${repo}/main/${file}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${await githubToken()}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({ message: `Add ${name}`, content: bytes.toString("base64") }),
  });
  if (res.ok || res.status === 422 /* already there */) return url;
  throw new Error(`github: ${res.status} ${(await res.text()).slice(0, 80)}`);
}

// Hosted site: copy the image to an unguessable public address on this same site.
// Only happens when the post is scheduled, so drafts stay private.
async function publishOnSite(name: string, bytes: Buffer): Promise<string> {
  const publicName = randomBytes(16).toString("hex") + path.extname(name).toLowerCase();
  await (await publicStorage()).write(publicName, bytes);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = process.env.BONBON_PUBLIC_URL || `${proto}://${host}`;
  return `${origin.replace(/\/$/, "")}/api/media/public/${publicName}`;
}

async function uploadPublic(file: string): Promise<string> {
  const media = await readMedia(file);
  if (!media) throw new Error(`Image ${file} is missing.`);
  const { name, bytes } = media;
  if (HOSTED) return publishOnSite(name, bytes);
  const problems: string[] = [];
  for (const host of [uploadToCatbox, uploadToGitHub]) {
    try {
      return await host(name, bytes);
    } catch (e) {
      problems.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`Couldn't make the image public (${problems.join("; ")}).`);
}

// Makes sure every image has a public URL. Mutates the images in place; returns the URLs in order.
export async function ensurePublicImages(images: PostImage[] = []): Promise<string[]> {
  const urls: string[] = [];
  for (const img of images) {
    if (!img.url) {
      if (!img.file) continue;
      img.url = await uploadPublic(img.file);
    }
    urls.push(img.url);
  }
  return urls;
}
