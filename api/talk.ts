// Vercel serverless function: POST /api/talk
import { BadRequest, handleTalk } from "../server/talk.js";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => null);
    return Response.json(await handleTalk(body));
  } catch (err) {
    if (err instanceof BadRequest) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "They didn't hear you over the pigs. Try again." }, { status: 502 });
  }
}
