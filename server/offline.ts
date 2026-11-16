// A scripted stand-in for Agnes, used when no ANTHROPIC_API_KEY is set.
// It scores messages with simple word lists so the game is still playable.
import { clamp, type AgnesReply, type AgnesRequest, type Card, type Mood } from "../src/shared.js";

const FAMILIAR = [
  "horse", "cow", "pig", "sheep", "goat", "chicken", "hen", "pigeon", "bird", "dove", "crow",
  "letter", "messenger", "rider", "scroll", "parchment", "seal", "bell", "candle", "fire",
  "hearth", "river", "well", "water", "mirror", "pond", "cart", "wagon", "boat", "ship",
  "market", "coin", "bread", "turnip", "harvest", "field", "winter", "snow", "cellar",
  "church", "priest", "king", "lord", "knight", "castle", "village", "town", "saint",
  "portrait", "painting", "painter", "tapestry", "song", "minstrel", "gossip", "festival",
  "wedding", "matchmaker", "ledger", "tally", "merchant", "pilgrim", "cloud", "wind",
];
const SPOOKY = ["magic", "spell", "demon", "devil", "witch", "sorcery", "curse", "ghost", "potion", "satan"];
const JARGON = [
  "data", "app", "online", "battery", "wifi", "software", "hardware", "pixel", "download",
  "upload", "cloud storage", "server", "algorithm", "website", "email", "text message",
  "technology", "electronic", "plastic", "satellite", "gps", "bluetooth",
];

const count = (text: string, words: string[]) =>
  words.reduce((n, w) => n + (new RegExp(`\\b${w}`, "i").test(text) ? 1 : 0), 0);

const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];

const LINES: Record<Mood, string[]> = {
  curious: [
    "*leans on her hoe* Go on then. Slowly, as if I'm the miller's simple son.",
    "Hm. That part almost makes sense. Tell me the rest before I change my mind.",
  ],
  confused: [
    "You've lost me somewhere between the beginning and the end. Try it with animals.",
    "*scratches her head under the coif* Is it a beast? A tool? A saint's relic?",
  ],
  amazed: [
    "*drops her basket* By Saint Swithun. And common folk can just have one?",
    "Well! That's either a miracle or a lie, and you don't look clever enough to lie.",
  ],
  delighted: [
    "Oh, now I see it! Wait till Margery hears about this, she'll faint in the pig pen.",
    "*claps* Like a carrier pigeon, but cleverer. I understand you perfectly, stranger.",
  ],
  suspicious: [
    "*crosses herself* Those are strange words for an honest mouth.",
    "Father Thomas warned us about folk who talk like that. Who sent you?",
  ],
  afraid: [
    "*backs away* Keep your devil-words in your own mouth, stranger!",
    "*clutches her rosary* Say that word again and I'll fetch the priest.",
  ],
  furious: [
    "That's it. WILLIAM! FETCH THE TORCHES! The stranger's a witch!",
    "*shouts toward the village* TORCHES! Bring the torches and the big stick!",
  ],
};

const BELIEFS: Record<string, string[]> = {
  smartphone: ["the phone is a stone with a tiny pigeon living inside", "the phone is a pocket mirror that gossips"],
  selfie: ["a selfie is a painter so small he lives in your hand", "a selfie is praying to your own face"],
  wifi: ["wi-fi is invisible pigeons nesting in the walls", "wi-fi is a ghost who only obeys a secret word"],
  fridge: ["the fridge is a cupboard where winter is kept prisoner", "the fridge is a little cellar with a snowstorm inside"],
  airplane: ["the airplane is a metal church that rides the clouds", "the airplane is a great iron goose full of pilgrims"],
  dating: ["online dating is a matchmaker made of portraits", "online dating is judging suitors by their faces alone, like buying a horse"],
  influencer: ["an influencer is a minstrel who sings about their breakfast", "an influencer is paid to be watched, like the king"],
  crypto: ["crypto is gold everyone agrees to imagine", "crypto is a tally stick that lives in the clouds"],
};

export function offlineAgnes(req: AgnesRequest, card: Card, bannedUsed: string[]): AgnesReply {
  const msg = req.message;
  const words = msg.split(/\s+/).filter(Boolean).length;
  const familiar = count(msg, FAMILIAR);
  const spooky = count(msg, SPOOKY);
  const jargon = count(msg, JARGON);
  const comparison = /\b(like|as if|similar|imagine|think of|same as)\b/i.test(msg) ? 1 : 0;

  let gain = familiar * 12 + comparison * 14 + Math.min(words, 30) * 0.6 - jargon * 8 - spooky * 10;
  if (words < 4) gain -= 10;
  const understanding = clamp(req.understanding + gain, 0, 100);

  let change = jargon * 6 + spooky * 18 + (bannedUsed.length ? 12 * bannedUsed.length : 0);
  change -= familiar ? 4 : 0;
  if (gain < 5) change += 6;
  const suspicion = clamp(req.suspicion + clamp(change, -15, 30), 0, 100);

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
    reply = `"${bannedUsed[0].toUpperCase()}"? *crosses herself twice* That is not a Christian word, stranger.`;

  return {
    reply,
    mood,
    understanding,
    suspicion,
    belief: understanding >= 40 ? pick(BELIEFS[card.id] ?? ["the future is very strange"], seed) : "",
    bannedUsed,
    offline: true,
  };
}
