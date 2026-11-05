@AGENTS.md

# Operating Bonbon (Claude is the operator)

The user does **not** connect an Anthropic key. Claude Code writes the posts and drives the app through its local API; the user reviews in the web UI. The only key is Buffer's, kept in `.env.local` as `BUFFER_API_KEY` (never commit it, never echo it back in chat).

## Start the app
`npm run dev` → http://localhost:3000 (studio at `/studio`). All operations below go through the running server so Buffer stays in sync. Data lives in `data/db.json` — don't hand-edit it while the server runs.

## The loop
1. **Read the voice first:** `curl -s localhost:3000/api/voice` — samples, tone tags, dos/donts, emoji level, length, hashtags. Match it closely: rhythm, line breaks, openers, humour. Follow the writing rules in `SYSTEM` in `src/lib/ai.ts` (no corporate filler, no invented facts, hook within ~210 chars, under 3000 chars).
2. **Voice setup / updates:** when the user shares example posts, add them as `samples` and write the analysis yourself:
   `PUT /api/voice` with `{ samples:[{id,text}], summary, toneTags, dos, donts, traits:[{label,score}] x5 (Warmth, Playfulness, Vulnerability, Authority, Storytelling), emojiLevel 0-3, length, hashtags }`.
3. **Ideas queue:** `GET /api/notes` — unused notes (`used:false`) are stories waiting to be written. New moments from chat → `POST /api/notes {title, body, category}` (category: life | career | project | learning).
4. **Write drafts:** `POST /api/posts {text, category, sourceNoteId?}` → saved as a draft for the user to review (marks the note used). Prefer drafts unless the user says "just schedule it".
5. **Schedule:** `POST /api/posts {text, category, scheduledAt: ISO, schedule: true}` or for an existing draft `PATCH /api/posts/<id> {scheduledAt, action:"schedule"}`. This creates the post in Buffer (customScheduled). Use open slots from the user's rhythm (`GET /api/settings` → `slots`, weekday 0=Sun, local time) — pick slots that have no post within 4h.
6. **Change / cancel:** `PATCH /api/posts/<id> {text}` (also edits in Buffer), `{action:"unschedule"}` (removes from Buffer, back to draft), `DELETE /api/posts/<id>`.
7. **Images:** files live in `data/media/`; attach with `images:[{id, file:"name.png"}]` on POST/PATCH `/api/posts`. On scheduling, each image is made public (catbox.moe first, then the public GitHub repo in `BONBON_GITHUB_MEDIA_REPO` via the `gh` login) and sent to Buffer as `assets`. Never make images public before the user approves scheduling.
8. **Sync:** `POST /api/buffer/sync` pulls posts queued directly in Buffer.
9. **Buffer channel:** `GET /api/buffer/channels` lists orgs/channels; save the LinkedIn one with `PUT /api/settings {bufferOrgId, bufferChannelId, bufferChannelName}`.

Always confirm with the user before scheduling something to publish (it goes live on LinkedIn), unless they've said to go ahead.
