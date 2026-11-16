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
  models: (process.env.LLM_MODEL || "gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.1-flash-lite")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
  // Optional: "low" keeps thinking models quick. Leave empty for providers that don't support it.
  reasoningEffort: process.env.LLM_REASONING_EFFORT?.trim() || "",
});

export const llmConfigured = () => Boolean(config().apiKey);

async function request(model: string, messages: ChatMessage[], extras: boolean, cancel?: AbortSignal): Promise<string> {
  const { apiKey, baseUrl, reasoningEffort } = config();
  const timeout = AbortSignal.timeout(9_000);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.9,
      max_tokens: 800,
      ...(extras ? { response_format: { type: "json_object" } } : {}),
      ...(extras && reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    }),
    signal: cancel ? AbortSignal.any([cancel, timeout]) : timeout,
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
const statusOf = (err: unknown) => (err instanceof LlmError ? err.status : undefined);

/** One model, with a second try without optional extras if the model rejects them. */
async function attempt(model: string, messages: ChatMessage[], cancel: AbortSignal): Promise<string> {
  const t0 = Date.now();
  const log = (what: string) => process.env.LLM_DEBUG && console.log(`[llm] ${model} ${what} after ${Date.now() - t0}ms`);
  try {
    const out = await request(model, messages, true, cancel);
    log("ok");
    return out;
  } catch (err) {
    if (cancel.aborted) throw err;
    log(`failed (${statusOf(err) ?? (err as Error).name})`);
    const status = statusOf(err);
    if (status === 400 || status === 422) return request(model, messages, false, cancel);
    throw err;
  }
}

/**
 * Sends one chat request to every configured model at once and uses the first good answer,
 * cancelling the rest. Free-tier Gemini models are often "busy" for a moment, and each model
 * has its own quota, so racing them keeps replies fast. If all fail, it retries briefly.
 */
export async function chat(messages: ChatMessage[]): Promise<string> {
  const { models } = config();
  const started = Date.now();
  let errors: unknown[] = [];
  for (let pass = 0; pass < 3 && Date.now() - started < 20_000; pass++) {
    if (pass > 0) await sleep(500 * pass);
    const cancel = new AbortController();
    try {
      const out = await Promise.any(models.map((m) => attempt(m, messages, cancel.signal)));
      cancel.abort();
      return out;
    } catch (err) {
      errors = err instanceof AggregateError ? err.errors : [err];
      const statuses = errors.map(statusOf);
      // A bad key won't fix itself; and if every model is rate-limited, retrying only burns quota.
      if (statuses.some((s) => s === 401 || s === 403)) break;
      if (statuses.every((s) => s === 429)) break;
    }
  }
  const auth = errors.find((e) => [401, 403].includes(statusOf(e) ?? 0));
  throw auth ?? errors.find((e) => statusOf(e) === 429) ?? errors[0];
}
