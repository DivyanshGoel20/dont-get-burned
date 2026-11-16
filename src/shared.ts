// Types and rules shared by the browser game and the server.

export type Mood =
  | "curious"
  | "confused"
  | "amazed"
  | "delighted"
  | "suspicious"
  | "afraid"
  | "furious";

export const MOODS: Mood[] = ["curious", "confused", "amazed", "delighted", "suspicious", "afraid", "furious"];

export const ROUNDS = 3;
export const MAX_TURNS = 5;
export const WIN_UNDERSTANDING = 85;
/** Suspicion added when you run out of tries on a round. */
export const FAIL_PENALTY = 30;

export interface TurnLine {
  who: "you" | "them";
  text: string;
}

/** What the browser sends to /api/talk. */
export interface TalkRequest {
  villagerId: string;
  topicId: string;
  /** Earlier lines this round, oldest first. */
  transcript: TurnLine[];
  message: string;
  suspicion: number;
  understanding: number;
  turnsLeft: number;
}

/** What /api/talk returns. */
export interface TalkReply {
  reply: string;
  mood: Mood;
  understanding: number;
  suspicion: number;
  belief: string;
  bannedUsed: string[];
  offline?: boolean;
}

/** Banned words found in a message (whole words; plurals and possessives count). */
export function findBanned(message: string, banned: string[]): string[] {
  const lower = message.toLowerCase();
  return banned.filter((word) => {
    const w = word.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    return new RegExp(`(^|[^a-z])${w}(s|es|'s)?([^a-z]|$)`).test(lower);
  });
}

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : lo)));
