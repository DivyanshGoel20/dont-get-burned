// Calls an OpenAI-compatible chat completions API. Configured for Google's
// Gemini API (free tier, OpenAI-compatible endpoint) by default; any compatible
// provider works by changing the LLM_* variables in .env.
//
// The API key is read only here, on the server. It is never sent to the browser.

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export class LlmError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

const config = () => ({
  apiKey: process.env.LLM_API_KEY?.trim() || "",
  baseUrl: (process.env.LLM_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/$/, ""),
  // A comma-separated list: the first is used, the rest are fallbacks when a model is unavailable.
  models: (process.env.LLM_MODEL || "gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.8-flash")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
  // Optional: "low" keeps thinking models quick. Leave empty for providers that don't support it.
  reasoningEffort: process.env.LLM_REASONING_EFFORT?.trim() || "",
});

export const llmConfigured = () => Boolean(config().apiKey);

async function request(model: string, messages: ChatMessage[], extras: boolean): Promise<string> {
  const { apiKey, baseUrl, reasoningEffort } = config();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.9,
      max_tokens: 2000,
      ...(extras ? { response_format: { type: "json_object" } } : {}),
      ...(extras && reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    // Never include request headers in errors: they carry the key.
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new LlmError(`${model} returned ${res.status}: ${detail}`, res.status);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new LlmError(`${model} returned an empty reply`);
  return content;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends one chat request. On failure it tries the same model without optional extras,
 * then the next model; if every model is busy, it waits briefly and goes round once more.
 */
export async function chat(messages: ChatMessage[]): Promise<string> {
  const { models } = config();
  let lastError: unknown;
  for (let pass = 0; pass < 2; pass++) {
    if (pass > 0) await sleep(1500);
    for (const model of models) {
      try {
        return await request(model, messages, true);
      } catch (err) {
        lastError = err;
        const status = err instanceof LlmError ? err.status : undefined;
        // Some models reject response_format or reasoning_effort: retry the same model without them.
        if (status === 400 || status === 422) {
          try {
            return await request(model, messages, false);
          } catch (retryErr) {
            lastError = retryErr;
          }
        }
        // Bad key or rate limit: another model or another pass won't help.
        if (status === 401 || status === 403 || status === 429) throw err;
      }
    }
  }
  throw lastError;
}
