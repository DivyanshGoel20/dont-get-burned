// Calls an OpenAI-compatible chat completions API. Configured for AgentRouter
// (https://agentrouter.org) by default; any compatible provider works by
// changing the three AGENTROUTER_* variables in .env.local.
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
  apiKey: process.env.AGENTROUTER_API_KEY?.trim() || "",
  baseUrl: (process.env.AGENTROUTER_BASE_URL?.trim() || "https://agentrouter.org/v1").replace(/\/$/, ""),
  // A comma-separated list: the first is used, the rest are fallbacks when a model is unavailable.
  models: (process.env.AGENTROUTER_MODEL || "gpt-5.6-sol,gpt-6.1-sol")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
});

export const llmConfigured = () => Boolean(config().apiKey);

async function request(model: string, messages: ChatMessage[], jsonMode: boolean): Promise<string> {
  const { apiKey, baseUrl } = config();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.9,
      max_tokens: 2000,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(60_000),
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

/** Sends one chat request, retrying without JSON mode or on the next model if needed. */
export async function chat(messages: ChatMessage[]): Promise<string> {
  const { models } = config();
  let lastError: unknown;
  for (const model of models) {
    try {
      return await request(model, messages, true);
    } catch (err) {
      lastError = err;
      const status = err instanceof LlmError ? err.status : undefined;
      // Some models reject response_format: retry the same model without it.
      if (status === 400 || status === 422) {
        try {
          return await request(model, messages, false);
        } catch (retryErr) {
          lastError = retryErr;
        }
      }
      // Bad key or no credit: another model won't help.
      if (status === 401 || status === 403) break;
    }
  }
  throw lastError;
}
