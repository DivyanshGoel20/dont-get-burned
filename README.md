# Don't Get Burned

England, 1350. You've fallen out of the future into the village of Little Hambury. Over three
rounds, three different villagers each ask you to explain one modern thing (the potato, Wi-Fi,
the stock market, dinosaurs…), drawn from a pool of 75. Each topic has words you must not say.
Get the villager's understanding to 85% within five attempts. The whole village shares one
suspicion meter: let it reach 100 and everyone you've met, and everyone you haven't, gathers
with torches. Survive all three rounds and they gather to thank you instead.

The villagers are played by an LLM on the [0G Compute Router](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/overview)
(OpenAI-compatible), which writes their replies and judges understanding and suspicion.

## Run it

```bash
npm install
cp .env.example .env.local   # paste your ZG_API_KEY (from pc.0g.ai)
npm run dev
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
- `server/talk.ts` holds the villager prompt and the 0G call. `server/offline.ts` is the no-key fallback.
- `api/talk.ts` is the Vercel function. During `npm run dev` a Vite middleware serves the same handler.
