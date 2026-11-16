import { defineConfig, loadEnv, type Plugin } from "vite";

// Serves POST /api/agnes during `vite dev`, using the same handler as the Vercel function.
function agnesApi(): Plugin {
  return {
    name: "agnes-api",
    configureServer(server) {
      server.middlewares.use("/api/agnes", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const { BadRequest, handleAgnes } = await server.ssrLoadModule("/server/agnes.ts");
        res.setHeader("Content-Type", "application/json");
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString() || "null");
          res.end(JSON.stringify(await handleAgnes(body)));
        } catch (err) {
          const bad = err instanceof BadRequest || err instanceof SyntaxError;
          if (!bad) console.error(err);
          res.statusCode = bad ? 400 : 502;
          res.end(JSON.stringify({ error: bad ? "Bad request" : "Agnes is busy with the pigs. Try again." }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  return { plugins: [agnesApi()] };
});
