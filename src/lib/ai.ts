import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Category, Voice } from "./types";

const MODEL = "claude-opus-5-5";

export class AIError extends Error {}

function client(apiKey: string) {
  if (!apiKey) throw new AIError("No Anthropic API key yet — add one in Settings (or ANTHROPIC_API_KEY in .env.local).");
  return new Anthropic({ apiKey });
}

function voiceBrief(v: Voice) {
  const lines: string[] = [];
  if (v.name) lines.push(`Author: ${v.name}${v.headline ? ` — ${v.headline}` : ""}`);
  if (v.summary) lines.push(`Voice summary: ${v.summary}`);
  if (v.toneTags.length) lines.push(`Tone: ${v.toneTags.join(", ")}`);
  lines.push(
    `Length: ${{ short: "short (under ~600 characters)", medium: "medium (~600-1300 characters)", long: "long-form story (~1300-2200 characters)" }[v.length]}`,
  );
  lines.push(`Emoji use: ${["none", "rare (0-1)", "a few", "playful, several"][v.emojiLevel] ?? "a few"}`);
  lines.push(`Hashtags: ${v.hashtags === 0 ? "none" : `${v.hashtags} at the very end`}`);
  if (v.dos.length) lines.push(`Always:\n${v.dos.map((d) => `- ${d}`).join("\n")}`);
  if (v.donts.length) lines.push(`Never:\n${v.donts.map((d) => `- ${d}`).join("\n")}`);
  return lines.join("\n");
}

function samplesBlock(v: Voice) {
  if (!v.samples.length) return "";
  return v.samples
    .slice(0, 12)
    .map((s, i) => `<sample index="${i + 1}">\n${s.text.trim()}\n</sample>`)
    .join("\n");
}

const SYSTEM = `You ghostwrite LinkedIn posts for one specific person. Your job is to sound exactly like them — their rhythm, word choice, sentence length, humour, line breaks and formatting habits — not like a generic LinkedIn influencer.

Write the way a real person posts:
- Open with a line that earns the "see more" click (LinkedIn truncates after ~210 characters), but keep it true to the author's style rather than clickbait.
- Use short paragraphs and line breaks the way the author's samples do.
- Be specific: names of tools, numbers, places and small concrete details from the story beat vague claims.
- Avoid corporate filler and AI tells: "I'm thrilled to announce", "delve", "game-changer", "in today's fast-paced world", "humbled", "let that sink in", em-dash-heavy rhythm, and rhetorical triplets — unless the samples show the author genuinely writes that way.
- Never invent facts, employers, numbers or people that aren't in the story. If a detail is missing, write around it.
- Stay under LinkedIn's 3000-character limit.`;

const DraftsSchema = z.object({
  drafts: z
    .array(
      z.object({
        angle: z.string().describe("2-4 word label for the angle, e.g. 'The lesson', 'Behind the scenes'"),
        hook: z.string().describe("The opening line"),
        text: z.string().describe("The full post, ready to publish, with line breaks"),
      }),
    )
    .describe("Exactly three drafts, each with a clearly different angle"),
});

export async function generateDrafts(opts: {
  apiKey: string;
  voice: Voice;
  category: Category;
  story: string;
  tweak?: string;
  previous?: string;
}) {
  const { voice } = opts;
  const samples = samplesBlock(voice);
  const kind = {
    life: "a personal life moment",
    career: "a career update",
    project: "a project they built or are building",
    learning: "something they've been learning or exploring",
  }[opts.category];

  const userContent = [
    `<voice_profile>\n${voiceBrief(voice)}\n</voice_profile>`,
    samples ? `<voice_samples>\nThese are real posts by the author. Match their voice closely.\n${samples}\n</voice_samples>` : "",
    `<story type="${kind}">\n${opts.story.trim()}\n</story>`,
    opts.previous ? `<previous_draft>\n${opts.previous}\n</previous_draft>` : "",
    opts.tweak
      ? `Rewrite based on the previous draft with this change: "${opts.tweak}". Still return three variations of that rewrite.`
      : "Write three drafts about this story, each with a different angle (for example: the story itself, the lesson, a question to the audience).",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await client(opts.apiKey).beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: betaZodOutputFormat(DraftsSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });

  if (res.stop_reason === "refusal") throw new AIError("Claude declined to write this one — try rephrasing the story.");
  if (!res.parsed_output) throw new AIError("Couldn't read the drafts back — please try again.");
  return res.parsed_output.drafts.slice(0, 3);
}

const VoiceSchema = z.object({
  summary: z.string().describe("3-5 sentences, second person ('You write...'), describing how this author writes"),
  toneTags: z.array(z.string()).describe("4-7 single-word or two-word tone descriptors"),
  dos: z.array(z.string()).describe("3-6 concrete habits to keep"),
  donts: z.array(z.string()).describe("2-5 things this author never does"),
  traits: z
    .array(z.object({ label: z.string(), score: z.number().describe("0-100") }))
    .describe(
      "Exactly 5 traits scored 0-100 in this order: Warmth, Playfulness, Vulnerability, Authority, Storytelling",
    ),
  emojiLevel: z.number().describe("0 none, 1 rare, 2 a few, 3 lots"),
  length: z.enum(["short", "medium", "long"]),
});

export async function analyzeVoice(apiKey: string, voice: Voice) {
  const samples = samplesBlock(voice);
  if (!samples) throw new AIError("Add at least one sample post first.");
  const res = await client(apiKey).beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: betaZodOutputFormat(VoiceSchema) },
    system:
      "You are a writing-style analyst. Study the author's LinkedIn posts and describe their voice precisely enough that a ghostwriter could imitate it: sentence length, openings, line-break habits, humour, emoji and hashtag use, how personal they get, recurring phrases.",
    messages: [
      {
        role: "user",
        content: `<voice_samples>\n${samples}\n</voice_samples>${
          voice.toneTags.length ? `\n\nThe author describes their own tone as: ${voice.toneTags.join(", ")}.` : ""
        }`,
      },
    ],
  });
  if (res.stop_reason === "refusal") throw new AIError("Claude declined to analyse these samples.");
  if (!res.parsed_output) throw new AIError("Couldn't read the analysis back — please try again.");
  const out = res.parsed_output;
  return {
    ...out,
    emojiLevel: Math.max(0, Math.min(3, Math.round(out.emojiLevel))),
    traits: out.traits.map((t) => ({ label: t.label, score: Math.max(0, Math.min(100, Math.round(t.score))) })),
  };
}

export function friendlyAIError(e: unknown) {
  if (e instanceof AIError) return e.message;
  if (e instanceof Anthropic.AuthenticationError) return "Anthropic didn't accept that API key.";
  if (e instanceof Anthropic.RateLimitError) return "Anthropic rate limit hit — wait a moment and try again.";
  if (e instanceof Anthropic.APIConnectionError) return "Couldn't reach Anthropic — check your internet connection.";
  if (e instanceof Anthropic.APIError) return `Anthropic error: ${e.message}`;
  return e instanceof Error ? e.message : "Something went wrong.";
}
