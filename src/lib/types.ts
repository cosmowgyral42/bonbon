export type Category = "life" | "career" | "project" | "learning";

export const CATEGORIES: { id: Category; label: string; emoji: string; blurb: string }[] = [
  { id: "life", label: "Life moment", emoji: "🌷", blurb: "Milestones, moves, little personal wins" },
  { id: "career", label: "Career news", emoji: "💼", blurb: "New role, promotion, talks, big launches" },
  { id: "project", label: "Project", emoji: "🧁", blurb: "Something you built, shipped or are building" },
  { id: "learning", label: "Learning", emoji: "📚", blurb: "Courses, books, experiments, new skills" },
];

export type VoiceSample = { id: string; text: string };

export type Voice = {
  name: string;
  headline: string;
  toneTags: string[];
  samples: VoiceSample[];
  dos: string[];
  donts: string[];
  emojiLevel: number; // 0 none .. 3 lots
  length: "short" | "medium" | "long";
  hashtags: number;
  summary: string; // AI-distilled description of the voice
  traits: { label: string; score: number }[]; // 0..100
  updatedAt: string | null;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  category: Category;
  pinned: boolean;
  used: boolean;
  createdAt: string;
};

// An image attached to a post. `file` lives in data/media on this laptop;
// `url` is the public copy (catbox.moe) that Buffer fetches when the post goes out.
export type PostImage = { id: string; file?: string; url?: string | null };

export type PostStatus = "draft" | "scheduled" | "sent" | "failed";

export type Post = {
  id: string;
  text: string;
  category: Category;
  status: PostStatus;
  scheduledAt: string | null; // ISO
  sourceNoteId?: string | null;
  images?: PostImage[];
  bufferPostId?: string | null;
  fromBuffer?: boolean; // pulled in from Buffer, not created here
  error?: string | null;
  createdAt: string;
};

export type Slot = { weekday: number; time: string }; // weekday 0=Sun, time "HH:mm" local

export type Settings = {
  bufferApiKey: string;
  bufferOrgId: string;
  bufferChannelId: string;
  bufferChannelName: string;
  anthropicApiKey: string;
  slots: Slot[];
};

// What the browser sees: secrets are masked.
export type PublicSettings = Omit<Settings, "bufferApiKey" | "anthropicApiKey"> & {
  bufferApiKey: string;
  anthropicApiKey: string;
  hasBufferKey: boolean;
  hasAnthropicKey: boolean;
  bufferKeyFromEnv: boolean;
  anthropicKeyFromEnv: boolean;
  hosted: boolean; // a public site where each browser has its own private workspace
};

export type Draft = { angle: string; hook: string; text: string };
