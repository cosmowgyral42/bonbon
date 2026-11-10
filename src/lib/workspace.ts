import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

// Two ways to run Bonbon:
// - Local (default): one person on their own computer. Data in data/db.json and data/media,
//   and keys may come from .env.local.
// - Hosted (BONBON_HOSTED=1): a public site anyone can use. Each browser gets its own private
//   workspace, picked by an httpOnly cookie. API keys are encrypted before they're stored, and
//   the server's own env keys are never used, so nobody can post with someone else's account.
export const HOSTED = process.env.BONBON_HOSTED === "1";

// Hosted storage: Netlify Blobs by default, or folders under data/workspaces with BONBON_STORAGE=files.
const USE_BLOBS = HOSTED && process.env.BONBON_STORAGE !== "files";

const DATA_DIR = path.join(process.cwd(), "data");
const COOKIE = "bonbon_ws";
const ID_RE = /^[a-f0-9]{32}$/;

/* ───────── Which workspace is this request for? ───────── */

// Local mode has a single workspace (null). In hosted mode, a visitor without a cookie gets
// null until they save something (create=true), so just looking around stores nothing.
export async function workspaceId(create: boolean): Promise<string | null> {
  if (!HOSTED) return null;
  const jar = await cookies();
  const current = jar.get(COOKIE)?.value;
  if (current && ID_RE.test(current)) return current;
  if (!create) return null;
  const id = randomBytes(16).toString("hex");
  jar.set(COOKIE, id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
  return id;
}

/* ───────── Storage ───────── */

export type Storage = {
  read(key: string): Promise<Buffer | null>;
  write(key: string, data: Buffer | string): Promise<void>;
};

function filesAt(root: string): Storage {
  return {
    async read(key) {
      try {
        return await fs.readFile(path.join(root, key));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw e;
      }
    },
    async write(key, data) {
      const file = path.join(root, key);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, data);
      await fs.rename(tmp, file);
    },
  };
}

// Storage calls get a time limit, so a stuck connection becomes a readable error instead of a hung request.
async function limit<T>(what: string, p: Promise<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Storage didn't respond in time (${what}). Please try again.`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function blobsAt(prefix: string): Promise<Storage> {
  const { getStore } = await limit("loading storage", import("@netlify/blobs"));
  const store = getStore({ name: "bonbon", consistency: "strong" });
  return {
    async read(key) {
      // On Netlify, get() of a key that doesn't exist never resolves, so check it exists first.
      if (!(await limit(`checking ${key}`, store.getMetadata(prefix + key)))) return null;
      const data = await limit(`reading ${key}`, store.get(prefix + key, { type: "arrayBuffer" }));
      return data ? Buffer.from(data) : null;
    },
    async write(key, data) {
      const body = typeof data === "string" ? data : new Blob([new Uint8Array(data)]);
      await limit(`saving ${key}`, store.set(prefix + key, body));
    },
  };
}

// Private storage for one workspace (keys like "db.json", "media/abc.png").
export async function workspaceStorage(ws: string | null): Promise<Storage> {
  if (!HOSTED) return filesAt(DATA_DIR);
  if (!ws) throw new Error("No workspace for this request.");
  return USE_BLOBS ? blobsAt(`ws/${ws}/`) : filesAt(path.join(DATA_DIR, "workspaces", ws));
}

// Shared storage for images that were made public for Buffer (hosted mode only).
export async function publicStorage(): Promise<Storage> {
  return USE_BLOBS ? blobsAt("public/") : filesAt(path.join(DATA_DIR, "public"));
}

/* ───────── Encrypting API keys at rest (hosted mode) ───────── */

const SEALED = "enc:v1:";

function secretKey() {
  const s = process.env.BONBON_SECRET;
  if (!s || s.length < 32) throw new Error("BONBON_SECRET (32+ characters) must be set when BONBON_HOSTED=1.");
  return createHash("sha256").update(s).digest();
}

export function seal(plain: string) {
  if (!plain) return "";
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return SEALED + Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}

export function unseal(value: string) {
  if (!value.startsWith(SEALED)) return value;
  try {
    const raw = Buffer.from(value.slice(SEALED.length), "base64");
    const d = createDecipheriv("aes-256-gcm", secretKey(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
  } catch (e) {
    // The secret changed or the value is damaged: treat the key as missing so the user re-enters it.
    console.error("[bonbon] couldn't decrypt a stored key:", e);
    return "";
  }
}
