// A scripted stand-in for the villagers, used when no LLM_API_KEY is set.
// It scores messages with simple word lists so the game is still playable.
import type { Villager } from "../src/data/cast.js";
import type { Topic } from "../src/data/topics.js";
import { clamp, type Mood, type TalkReply, type TalkRequest } from "../src/shared.js";

const FAMILIAR = [
  "horse", "cow", "pig", "sheep", "goat", "hen", "pigeon", "bird", "dove", "letter", "messenger",
  "rider", "scroll", "parchment", "seal", "bell", "candle", "fire", "hearth", "river", "well",
  "water", "mirror", "pond", "cart", "wagon", "boat", "ship", "market", "bread", "turnip",
  "harvest", "field", "winter", "snow", "cellar", "church", "priest", "king", "lord", "knight",
  "castle", "village", "saint", "portrait", "painter", "song", "minstrel", "festival", "wedding",
  "merchant", "pilgrim", "cloud", "wind", "mill", "forge", "ale", "feast", "sword", "monk",
];
const SPOOKY = ["magic", "spell", "demon", "devil", "witch", "sorcery", "curse", "ghost", "potion", "satan"];
const JARGON = ["data", "app", "online", "battery", "software", "pixel", "download", "server", "algorithm", "website", "technology", "electronic"];

const has = (text: string, w: string) => new RegExp(`\\b${w}`, "i").test(text);
const count = (text: string, words: string[]) => words.filter((w) => has(text, w)).length;
const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];

const LINES: Record<Mood, string[]> = {
  curious: ["Go on, then. Slowly.", "That part almost makes sense. Tell me the rest."],
  confused: ["You've lost me entirely. Try it with things I know.", "*frowns* Is it a beast? A tool? A relic?"],
  amazed: ["By Saint Swithun. And common folk can just have one?", "Either that's a miracle or a lie, and you don't look clever enough to lie."],
  delighted: ["Oh, now I see it! Wait till the village hears.", "*laughs* Now that I understand perfectly."],
  suspicious: ["*crosses themself* Those are strange words for an honest mouth.", "Father Thomas warned us about folk who talk like that."],
  afraid: ["*backs away* Keep your devil-words in your own mouth!", "Say that word again and I'll fetch the priest."],
  furious: ["That's it. TORCHES! The stranger's a witch!", "*shouts to the village* Bring the torches!"],
};

export function offlineReply(req: TalkRequest, v: Villager, topic: Topic, bannedUsed: string[]): TalkReply {
  const msg = req.message;
  const words = msg.split(/\s+/).filter(Boolean).length;
  const familiar = count(msg, FAMILIAR);
  const spooky = count(msg, SPOOKY);
  const jargon = count(msg, JARGON);
  const comparison = /\b(like|as if|similar|imagine|think of|same as)\b/i.test(msg) ? 1 : 0;

  let gain = familiar * 12 + comparison * 14 + Math.min(words, 30) * 0.6 - jargon * 8 - spooky * 10;
  if (words < 4) gain -= 10;
  const understanding = clamp(req.understanding + gain, 0, 100);

  let change = jargon * 6 + spooky * 18 + 12 * bannedUsed.length - (familiar ? 4 : 0) + (gain < 5 ? 6 : 0);
  change = clamp(change, -15, 30);
  if (change > 0) change = Math.round(change * v.temper);
  const suspicion = clamp(req.suspicion + change, 0, 100);

  let mood: Mood = "curious";
  if (suspicion >= 100) mood = "furious";
  else if (spooky || bannedUsed.length > 1) mood = "afraid";
  else if (bannedUsed.length || jargon) mood = "suspicious";
  else if (understanding >= 85) mood = "delighted";
  else if (gain >= 25) mood = "amazed";
  else if (gain < 8) mood = "confused";

  const seed = msg.length + req.transcript.length * 7;
  let reply = pick(LINES[mood], seed);
  if (bannedUsed.length && mood !== "furious")
    reply = `"${bannedUsed[0].charAt(0).toUpperCase() + bannedUsed[0].slice(1)}"? *crosses themself twice* That is not a Christian word.`;

  const thing = topic.title.replace(/^the /i, "").toLowerCase();
  const frame = pick(v.frames.split(",").map((s) => s.trim()), seed);
  return {
    reply,
    mood,
    understanding,
    suspicion,
    belief: understanding >= 40 ? `${thing} is a sort of ${frame.replace(/^(the|her|his) /, "")}, from the future` : "",
    bannedUsed,
    offline: true,
  };
}
