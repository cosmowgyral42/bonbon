# 🍬 Bonbon — your LinkedIn, sweetened

A local web studio that turns your life moments, career news, projects and learnings into LinkedIn posts **in your own voice**, then schedules them through **Buffer**.

**Live demo:** https://bonbon-studio.netlify.app

The demo is for looking around: it has no API keys and doesn't save anything. Run it locally (below) to write and schedule real posts.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

## First-time setup (5 minutes)

1. **Settings → Claude:** paste an Anthropic API key (from console.anthropic.com). This is what writes the drafts.
2. **Settings → Buffer:** paste a Buffer personal API key (from `publish.buffer.com/settings/api`), click **Connect**, and pick your LinkedIn channel.
3. **Settings → Posting rhythm:** choose the days/times you want to post (e.g. Tue & Thu 9:00). Empty ones show up as open slots on the calendar.
4. **My voice:** paste 3–8 of your past posts, pick tone tags, then hit **Analyze my voice ✨**.

Instead of pasting keys in the app, you can put them in `.env.local` (see `.env.example`).

## How it works

| Page | What it does |
| --- | --- |
| `/` | Landing page |
| `/studio` | Overview: setup checklist, stats, what's next, open slots |
| `/studio/compose` | Pick a moment type → tell the story → get 3 drafts → tweak → schedule |
| `/studio/calendar` | Month/week view of scheduled posts + open posting slots to fill |
| `/studio/ideas` | Idea jar: sticky notes for future posts, one click to turn into a post |
| `/studio/voice` | Your voice profile: samples, tone, emoji/length/hashtags, do's & don'ts |
| `/studio/settings` | API keys, Buffer channel, posting rhythm |

- **Writing:** Claude (`claude-opus-5-5`) gets your voice profile + sample posts + the story, and returns three drafts with different angles. See `src/lib/ai.ts`.
- **Scheduling:** posts are created in Buffer with an exact time (`customScheduled`) via Buffer's GraphQL API. Rescheduling, editing and unscheduling update Buffer too. **Sync from Buffer** on the calendar pulls in posts you queued elsewhere. See `src/lib/buffer.ts`.
- **Storage:** everything (including your keys) is kept in `data/db.json` on your machine. It's git-ignored. Back it up if you care about your ideas.

## Notes

- Buffer's free plan allows 1 API key and ~600 requests/day, which is plenty here.
- If Buffer isn't connected, scheduling still works locally — posts just land on the calendar without being sent.
