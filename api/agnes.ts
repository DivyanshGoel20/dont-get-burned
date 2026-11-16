// Vercel serverless function: POST /api/agnes
import { BadRequest, handleAgnes } from "../server/agnes.js";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => null);
    return Response.json(await handleAgnes(body));
  } catch (err) {
    if (err instanceof BadRequest) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Agnes is busy with the pigs. Try again." }, { status: 502 });
  }
}
