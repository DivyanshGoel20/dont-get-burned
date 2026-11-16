import { defineConfig, loadEnv, type Plugin } from "vite";

// Serves POST /api/talk during `vite dev`, using the same handler as the Vercel function.
function talkApi(): Plugin {
  return {
    name: "talk-api",
    configureServer(server) {
      server.middlewares.use("/api/talk", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const { BadRequest, handleTalk, publicError } = await server.ssrLoadModule("/server/talk.ts");
        res.setHeader("Content-Type", "application/json");
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString() || "null");
          res.end(JSON.stringify(await handleTalk(body)));
        } catch (err) {
          const bad = err instanceof BadRequest || err instanceof SyntaxError;
          if (!bad) console.error(err);
          res.statusCode = bad ? 400 : 502;
          res.end(JSON.stringify({ error: bad ? "Bad request" : publicError(err) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Server-only settings. Without a VITE_ prefix these never reach the browser bundle.
  // loadEnv prefers values already in process.env, so clear ours first: otherwise an
  // edited key in .env would be ignored until a full restart.
  for (const k of Object.keys(process.env)) if (k.startsWith("LLM_")) delete process.env[k];
  const env = loadEnv(mode, process.cwd(), "LLM_");
  for (const [k, v] of Object.entries(env)) if (v) process.env[k] = v;
  return { plugins: [talkApi()] };
});
