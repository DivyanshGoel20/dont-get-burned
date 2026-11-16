# Don't Get Burned

England, 1350. You've fallen out of the future into the village of Little Hambury. Over three
rounds, three different villagers each ask you to explain one modern thing (the potato, Wi-Fi,
the stock market, dinosaurs…), drawn from a pool of 75. Each topic has words you must not say.
Get the villager's understanding to 85% within five attempts. The whole village shares one
suspicion meter: let it reach 100 and everyone you've met, and everyone you haven't, gathers
with torches. Survive all three rounds and they gather to thank you instead.

The villagers are played by an LLM through [AgentRouter](https://agentrouter.org) (OpenAI-compatible
`/v1/chat/completions`), which writes their replies and judges understanding and suspicion. Any
OpenAI-compatible provider works by changing the `AGENTROUTER_*` values.

## Run it

```bash
npm install
cp .env.example .env   # paste your key after AGENTROUTER_API_KEY=
npm run dev
```

## Secrets

- The key lives only in `.env`, which is git-ignored (every `.env.*` file except `.env.example` is).
- It is read only on the server (`server/llm.ts`) and never reaches the browser bundle.
- A pre-commit hook in `.githooks/` refuses to commit env files or anything that looks like an API key.
  It's enabled per clone with:

```bash
git config core.hooksPath .githooks
```

Without a key the villagers run on a simple offline script, and a small notice on screen says so.

## Art

Every face and scene is a real public-domain painting from Wikimedia Commons: portraits by
Bruegel, Petrus Christus, Antonello da Messina, Rogier van der Weyden, Dieric Bouts, Memling and
Hugo van der Goes, and scenes from Bruegel and the *Très Riches Heures du duc de Berry*. Full
credits are in the game under "The paintings" and in `src/data/`.

## Code

- `src/data/` holds the cast (8 villagers with personas), the topics (75 across three tiers) and the scene credits.
- `src/main.ts` runs the game flow. `fx.ts` draws the embers and `audio.ts` generates the sound.
- `server/talk.ts` holds the villager prompt. `server/llm.ts` is the AgentRouter client, with model fallback. `server/offline.ts` is the no-key fallback.
- `api/talk.ts` is the Vercel function. During `npm run dev` a Vite middleware serves the same handler.
