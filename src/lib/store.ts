import "server-only";
import type { Note, Post, PublicSettings, Settings, Voice } from "./types";
import { HOSTED, seal, unseal, workspaceId, workspaceStorage, type Storage } from "./workspace";

// Everything for one workspace lives in one JSON document ("db.json").
// Locally that's data/db.json; on a hosted site each browser has its own (see workspace.ts).
const DB_KEY = "db.json";

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

// A missing file means a fresh start. Anything else (unreadable or damaged data) is an error,
// so a later save can never overwrite real data with empty defaults.
async function read(storage: Storage): Promise<DB> {
  const raw = await storage.read(DB_KEY);
  if (!raw) return defaultDB();
  let parsed: Partial<DB>;
  try {
    parsed = JSON.parse(raw.toString("utf8")) as Partial<DB>;
  } catch (e) {
    throw new StoreError("Your saved data couldn't be read (db.json is damaged). Nothing was changed.", false, e);
  }
  const d = defaultDB();
  const settings = { ...d.settings, ...parsed.settings };
  if (HOSTED) {
    settings.bufferApiKey = unseal(settings.bufferApiKey);
    settings.anthropicApiKey = unseal(settings.anthropicApiKey);
  }
  return {
    voice: { ...d.voice, ...parsed.voice },
    notes: parsed.notes ?? [],
    posts: parsed.posts ?? [],
    settings,
  };
}

// A save that failed, with a message the user can read.
// `readOnly` is set when the disk can't be written at all (e.g. a serverless host without BONBON_HOSTED).
export class StoreError extends Error {
  constructor(
    message: string,
    public readOnly = false,
    cause?: unknown,
  ) {
    super(message, { cause });
  }
}

export function saveError(e: unknown, what: string) {
  const code = (e as NodeJS.ErrnoException)?.code;
  if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
    return new StoreError(
      "Bonbon can't save here because this server's disk is read-only. Run it on your own computer, or host it with BONBON_HOSTED=1.",
      true,
      e,
    );
  }
  return new StoreError(`Couldn't save ${what}: ${e instanceof Error ? e.message : String(e)}`, false, e);
}

async function write(storage: Storage, db: DB) {
  // On a hosted site, API keys are encrypted before they're stored.
  const stored = HOSTED
    ? { ...db, settings: { ...db.settings, bufferApiKey: seal(db.settings.bufferApiKey), anthropicApiKey: seal(db.settings.anthropicApiKey) } }
    : db;
  try {
    await storage.write(DB_KEY, JSON.stringify(stored, null, 2));
  } catch (e) {
    throw saveError(e, "your data");
  }
}

export async function getDB() {
  const ws = await workspaceId(false);
  // A hosted visitor who hasn't saved anything yet just sees a fresh, empty workspace.
  if (HOSTED && !ws) return defaultDB();
  return read(await workspaceStorage(ws));
}

// Serialize writes so two quick requests can't clobber each other.
export async function updateDB<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const storage = await workspaceStorage(await workspaceId(true));
  const run = queue.then(async () => {
    const db = await read(storage);
    const result = await fn(db);
    await write(storage, db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const id = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Keys from .env.local are only for a local install. A hosted site never uses them,
// so every visitor can only ever post with the key they entered themselves.
const envKey = (name: string) => (HOSTED ? "" : process.env[name] || "");

export function bufferKey(s: Settings) {
  return s.bufferApiKey || envKey("BUFFER_API_KEY");
}
export function anthropicKey(s: Settings) {
  return s.anthropicApiKey || envKey("ANTHROPIC_API_KEY");
}

const mask = (k: string) => (k ? "••••" + k.slice(-4) : "");

export function publicSettings(s: Settings): PublicSettings {
  return {
    ...s,
    bufferApiKey: mask(s.bufferApiKey),
    anthropicApiKey: mask(s.anthropicApiKey),
    hasBufferKey: !!bufferKey(s),
    hasAnthropicKey: !!anthropicKey(s),
    bufferKeyFromEnv: !s.bufferApiKey && !!envKey("BUFFER_API_KEY"),
    anthropicKeyFromEnv: !s.anthropicApiKey && !!envKey("ANTHROPIC_API_KEY"),
    hosted: HOSTED,
  };
}
