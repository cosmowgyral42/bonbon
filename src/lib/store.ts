import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Note, Post, PublicSettings, Settings, Voice } from "./types";

// Everything lives in one local JSON file. Simple, private, easy to back up.
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type DB = { voice: Voice; notes: Note[]; posts: Post[]; settings: Settings };

const defaultDB = (): DB => ({
  voice: {
    name: "",
    headline: "",
    toneTags: [],
    samples: [],
    dos: [],
    donts: [],
    emojiLevel: 1,
    length: "medium",
    hashtags: 3,
    summary: "",
    traits: [],
    updatedAt: null,
  },
  notes: [],
  posts: [],
  settings: {
    bufferApiKey: "",
    bufferOrgId: "",
    bufferChannelId: "",
    bufferChannelName: "",
    anthropicApiKey: "",
    slots: [
      { weekday: 2, time: "09:00" },
      { weekday: 4, time: "09:00" },
    ],
  },
});

let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    const d = defaultDB();
    return {
      voice: { ...d.voice, ...parsed.voice },
      notes: parsed.notes ?? [],
      posts: parsed.posts ?? [],
      settings: { ...d.settings, ...parsed.settings },
    };
  } catch {
    return defaultDB();
  }
}

async function write(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_FILE);
}

export function getDB() {
  return read();
}

// Serialize writes so two quick requests can't clobber each other.
export function updateDB<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const result = await fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const id = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function bufferKey(s: Settings) {
  return s.bufferApiKey || process.env.BUFFER_API_KEY || "";
}
export function anthropicKey(s: Settings) {
  return s.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "";
}

const mask = (k: string) => (k ? "••••" + k.slice(-4) : "");

export function publicSettings(s: Settings): PublicSettings {
  return {
    ...s,
    bufferApiKey: mask(s.bufferApiKey),
    anthropicApiKey: mask(s.anthropicApiKey),
    hasBufferKey: !!bufferKey(s),
    hasAnthropicKey: !!anthropicKey(s),
    bufferKeyFromEnv: !s.bufferApiKey && !!process.env.BUFFER_API_KEY,
    anthropicKeyFromEnv: !s.anthropicApiKey && !!process.env.ANTHROPIC_API_KEY,
  };
}
