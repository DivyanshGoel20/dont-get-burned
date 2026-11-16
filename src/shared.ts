// Types and data shared by the browser game and the Agnes server.

export type Mood =
  | "curious"
  | "confused"
  | "amazed"
  | "delighted"
  | "suspicious"
  | "afraid"
  | "furious";

export const MOODS: Mood[] = [
  "curious",
  "confused",
  "amazed",
  "delighted",
  "suspicious",
  "afraid",
  "furious",
];

export interface Card {
  id: string;
  title: string;
  /** One-line plain description shown under the title. */
  hint: string;
  /** Words Agnes would hear as witch-talk. Using one raises suspicion. */
  banned: string[];
  /** What "understanding" means for this card, used by the judge. */
  essence: string;
}

export const CARDS: Card[] = [
  {
    id: "smartphone",
    title: "Smartphone",
    hint: "The thing in your pocket.",
    banned: ["phone", "screen", "call", "electricity"],
    essence:
      "a small hand-held object that lets you send words and pictures to faraway people instantly and see things from far away",
  },
  {
    id: "selfie",
    title: "Selfie",
    hint: "A picture of yourself, taken by yourself.",
    banned: ["camera", "photo", "picture", "phone"],
    essence:
      "making a perfect lasting image of your own face, by yourself, mostly to show other people",
  },
  {
    id: "wifi",
    title: "Wi-Fi",
    hint: "Why everyone asks for the password.",
    banned: ["internet", "signal", "wireless", "router", "network"],
    essence:
      "something invisible in the air of a house that lets those hand-held objects send and receive messages, and it needs a secret word to use",
  },
  {
    id: "fridge",
    title: "Refrigerator",
    hint: "A cupboard that is always winter.",
    banned: ["cold", "ice", "electricity", "machine"],
    essence:
      "a cupboard in the house that stays chilly all year so food stays fresh for many days",
  },
  {
    id: "airplane",
    title: "Airplane",
    hint: "Two hundred people in a metal tube, above the clouds.",
    banned: ["fly", "wings", "engine", "sky", "bird"],
    essence:
      "a huge carriage of metal that carries hundreds of ordinary people through the air, above the clouds, to faraway lands in a few hours",
  },
  {
    id: "dating",
    title: "Online dating",
    hint: "Finding a spouse by judging faces with your thumb.",
    banned: ["app", "phone", "internet", "match", "swipe"],
    essence:
      "choosing a sweetheart from strangers by looking at their pictures and a few words about them, without any matchmaker or family",
  },
  {
    id: "influencer",
    title: "Influencer",
    hint: "A job, apparently.",
    banned: ["famous", "followers", "video", "internet", "content"],
    essence:
      "a person who earns a living because many strangers watch them live their life and buy the things they use",
  },
  {
    id: "crypto",
    title: "Cryptocurrency",
    hint: "Money that isn't there, but is.",
    banned: ["money", "coin", "internet", "computer", "digital"],
    essence:
      "a kind of wealth that has no metal or paper at all, only a shared record that everyone agrees on, and its worth swings wildly",
  },
];

export interface TurnLine {
  who: "you" | "agnes";
  text: string;
}

/** What the browser sends to /api/agnes. */
export interface AgnesRequest {
  cardId: string;
  /** Earlier lines on this card, oldest first. */
  transcript: TurnLine[];
  message: string;
  suspicion: number;
  understanding: number;
  /** Beliefs Agnes already holds from earlier cards. */
  beliefs: string[];
  turnsLeft: number;
}

/** What /api/agnes returns. */
export interface AgnesReply {
  reply: string;
  mood: Mood;
  understanding: number;
  suspicion: number;
  belief: string;
  bannedUsed: string[];
  offline?: boolean;
}

export const MAX_TURNS = 5;
export const WIN_UNDERSTANDING = 85;

/** Banned words found in a message (whole words, plural and possessive forms count). */
export function findBanned(message: string, banned: string[]): string[] {
  const lower = message.toLowerCase();
  return banned.filter((word) => {
    const w = word.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    return new RegExp(`(^|[^a-z])${w}(s|es|'s)?([^a-z]|$)`).test(lower);
  });
}

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : lo)));
