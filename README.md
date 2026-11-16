# Don't Get Burned

It's 1350. You've fallen out of the future into a turnip field, and Agnes the farmer wants answers.
Explain eight modern things to her (a smartphone, Wi-Fi, a selfie, crypto…) using only ideas a
medieval peasant would understand. Each card has **witch-words** you can't use without raising her
suspicion. Get her understanding to 85% within five tries. Let suspicion hit 100 and the village
brings the torches.

Agnes is played by Claude (`claude-opus-5-5`), which writes her replies and judges how well she
understands you and how suspicious she has become.

## Run it

```bash
npm install
cp .env.example .env.local   # then paste your ANTHROPIC_API_KEY
npm run dev
```

Without a key the game still runs with a simple scripted "offline Agnes", and a small pill on screen says so.

## How it's built

- `src/` is a Vite + TypeScript front end with no framework: `scene.ts` (canvas sky, village and torch mob), `agnes.ts` (SVG portrait with moods), `audio.ts` (generated sound) and `main.ts` (game flow).
- `server/agnes.ts` holds Agnes's prompt and the Claude call, which uses structured output for the reply, mood, understanding, suspicion and belief.
- `api/agnes.ts` is the Vercel function. During `npm run dev`, the same handler is served by a Vite middleware.
