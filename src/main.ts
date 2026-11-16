import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource-variable/inter";
import "./styles.css";

import { Sound } from "./audio";
import { CAST, type Villager } from "./data/cast";
import { ROUND_SCENES, SCENES, type Scene } from "./data/scenes";
import { TOPICS, type Topic } from "./data/topics";
import { Embers } from "./fx";
import {
  FAIL_PENALTY,
  MAX_TURNS,
  ROUNDS,
  WIN_UNDERSTANDING,
  findBanned,
  type Mood,
  type TalkReply,
  type TalkRequest,
  type TurnLine,
} from "./shared";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const ROMAN = ["I", "II", "III", "IV", "V"];
const ORDINAL = ["first", "second", "third"];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const art = (file: string) => `/art/${file}.webp`;

const MOOD_TEXT: Record<Mood, (n: string) => string> = {
  curious: (n) => `${n} is listening closely.`,
  confused: (n) => `${n} is baffled.`,
  amazed: (n) => `${n} is astonished.`,
  delighted: (n) => `${n} is delighted.`,
  suspicious: (n) => `${n} is growing suspicious.`,
  afraid: (n) => `${n} is frightened of you.`,
  furious: (n) => `${n} is calling for torches.`,
};

const sound = new Sound();
const embers = new Embers($<HTMLCanvasElement>("fx"));

interface RoundResult {
  villager: Villager;
  topic: Topic;
  won: boolean;
  belief: string;
}

const state = {
  round: 0,
  lineup: [] as Villager[],
  topics: [] as Topic[],
  suspicion: 0,
  understanding: 0,
  turnsUsed: 0,
  transcript: [] as TurnLine[],
  belief: "",
  results: [] as RoundResult[],
  busy: false,
  over: false,
};

const villager = () => state.lineup[state.round];
const topic = () => state.topics[state.round];

// ---------- helpers ----------

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Escapes text and turns *stage directions* into italic spans. */
function speech(text: string) {
  return escapeHtml(text).replace(/\*([^*]+)\*/g, '<span class="act">$1</span>');
}

function toast(msg: string) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

let backdropFlip = false;
function setBackdrop(scene: Scene, mode = "") {
  const layers = document.querySelectorAll<HTMLElement>(".backdrop .layer");
  const next = layers[backdropFlip ? 0 : 1];
  const prev = layers[backdropFlip ? 1 : 0];
  backdropFlip = !backdropFlip;
  next.style.backgroundImage = `url(${art(scene.file)})`;
  next.classList.add("on");
  prev.classList.remove("on");
  document.querySelector<HTMLElement>(".backdrop")!.dataset.mode = mode;
}

type ScreenName = "title" | "intro" | "game" | "finale";
function show(screen: ScreenName) {
  const ids: Record<ScreenName, string> = { title: "titleScreen", intro: "intro", game: "game", finale: "finale" };
  for (const key of Object.keys(ids) as ScreenName[]) {
    const el = $(ids[key]);
    if (key === screen) {
      el.hidden = false;
      el.classList.remove("enter");
      void el.offsetWidth;
      el.classList.add("enter");
    } else el.hidden = true;
  }
  document.body.dataset.screen = screen;
  scrollTo({ top: 0 });
}

function renderProgress() {
  const onTitle = document.body.dataset.screen === "title";
  $("progress").innerHTML = Array.from({ length: ROUNDS }, (_, i) => {
    const r = state.results[i];
    const cls = r ? (r.won ? "won" : "lost") : i === state.round && !onTitle ? "now" : "";
    return `<li class="${cls}"><span>${ROMAN[i]}</span></li>`;
  }).join("");
}

// ---------- meters ----------

function setSuspicion(v: number) {
  const prev = state.suspicion;
  state.suspicion = v;
  $("susValue").textContent = String(v);
  $("susFill").style.transform = `scaleX(${v / 100})`;
  const level = v >= 75 ? "torches" : v >= 50 ? "whispering" : v >= 25 ? "uneasy" : "calm";
  const meter = $("meter");
  meter.dataset.level = level;
  document.body.dataset.heat = level;
  if (v > prev) {
    meter.classList.remove("rise");
    void meter.offsetWidth;
    meter.classList.add("rise");
  }
  embers.intensity = v >= 50 ? (v - 50) / 120 : 0;
  sound.setSuspicion(v);
}

function setUnderstanding(v: number) {
  state.understanding = v;
  $("uValue").textContent = `${v}%`;
  $("uFill").style.transform = `scaleX(${v / 100})`;
}

function renderAttempts() {
  const left = MAX_TURNS - state.turnsUsed;
  $("attempts").innerHTML =
    Array.from({ length: MAX_TURNS }, (_, i) => `<i class="${i < left ? "left" : "used"}"></i>`).join("") +
    `<span>${left} left</span>`;
}

function setMood(mood: Mood) {
  const frame = $("sitterFrame");
  frame.dataset.mood = mood;
  $("sitterMood").textContent = MOOD_TEXT[mood](villager().name);
  frame.classList.remove("react");
  void frame.offsetWidth;
  frame.classList.add("react");
}

// ---------- exchange ----------

function addEntry(who: "you" | "them", html: string, extra = ""): HTMLElement {
  const entry = document.createElement("article");
  entry.className = `entry ${who} ${extra}`.trim();
  const name = who === "you" ? "You" : villager().name;
  entry.innerHTML = `<h4>${escapeHtml(name)}</h4><p>${html}</p>`;
  $("exchange").append(entry);
  scrollExchange();
  return entry.querySelector("p")!;
}

function scrollExchange() {
  const ex = $("exchange");
  const behavior = reduceMotion ? "auto" : "smooth";
  ex.scrollTo({ top: ex.scrollHeight, behavior });
  // On phones the whole page scrolls instead of the exchange panel.
  if (matchMedia("(max-width: 900px)").matches) scrollTo({ top: document.body.scrollHeight, behavior });
}

async function typeOut(el: HTMLElement, text: string) {
  if (reduceMotion) {
    el.innerHTML = speech(text);
    return;
  }
  el.classList.add("typing");
  for (let i = 1; i <= text.length; i += 2) {
    el.innerHTML = speech(text.slice(0, i));
    await wait(/[.!?]/.test(text[i - 1]) ? 90 : 14);
  }
  el.innerHTML = speech(text);
  el.classList.remove("typing");
  scrollExchange();
}

function addVerdict(won: boolean, note: string) {
  const el = document.createElement("div");
  el.className = `verdict ${won ? "won" : "lost"}`;
  el.innerHTML = `<span>${won ? "Convinced" : "Unconvinced"}</span><small>${escapeHtml(note)}</small>`;
  $("exchange").append(el);
  scrollExchange();
}

// ---------- rounds ----------

function newRun() {
  state.lineup = shuffle(CAST).slice(0, ROUNDS);
  state.topics = ([1, 2, 3] as const).map((tier) => shuffle(TOPICS.filter((t) => t.tier === tier))[0]);
  state.round = 0;
  state.results = [];
  state.over = false;
  state.busy = false;
  embers.intensity = 0;
  setSuspicion(0);
  delete document.body.dataset.ending;
  $("offlinePill").hidden = true;
}

function showIntro() {
  const v = villager();
  const t = topic();
  setBackdrop(ROUND_SCENES[state.round]);
  $("introKicker").textContent = `Round ${ROMAN[state.round]} of ${ROMAN[ROUNDS - 1]} · The ${ORDINAL[state.round]} villager`;
  const img = $<HTMLImageElement>("introImg");
  img.src = art(v.art.file);
  img.alt = `${v.art.title}, ${v.art.artist}`;
  $("introName").textContent = v.name;
  $("introRole").textContent = v.role;
  $("introTopic").textContent = t.title;
  $("introHint").textContent = t.hint;
  $("introBtn").textContent = `Speak to ${v.name}`;
  show("intro");
  renderProgress();
  $("introBtn").focus({ preventScroll: true });
}

function startRound() {
  const v = villager();
  const t = topic();
  state.turnsUsed = 0;
  state.transcript = [];
  state.belief = "";

  const img = $<HTMLImageElement>("sitterImg");
  img.src = art(v.art.file);
  img.alt = `${v.name}: ${v.art.title} by ${v.art.artist}, ${v.art.date}`;
  $("sitterName").textContent = v.name;
  $("sitterRole").textContent = v.role;
  $("briefKicker").textContent = `Round ${ROMAN[state.round]} · Explain to ${v.name}`;
  $("briefTitle").textContent = t.title;
  $("briefHint").textContent = t.hint;
  $("forbidden").innerHTML = t.banned.map((w) => `<s data-word="${escapeHtml(w)}">${escapeHtml(w)}</s>`).join("");
  setUnderstanding(0);
  renderAttempts();

  $("exchange").innerHTML = "";
  $("after").hidden = true;
  $("reply").hidden = false;
  const input = $<HTMLTextAreaElement>("input");
  input.value = "";
  input.disabled = false;
  input.placeholder = `Explain ${t.title.replace(/^The /, "the ")} to ${v.name}…`;
  show("game");
  updateWarn();
  setMood(state.suspicion >= 50 ? "suspicious" : "curious");
  const opener = addEntry("them", "", "first");
  void typeOut(opener, v.opener).then(() => input.focus({ preventScroll: true }));
}

function updateWarn() {
  const input = $<HTMLTextAreaElement>("input");
  const hits = findBanned(input.value, topic().banned);
  document
    .querySelectorAll<HTMLElement>("#forbidden s")
    .forEach((s) => s.classList.toggle("hit", hits.includes(s.dataset.word!)));
  const warn = $("warn");
  warn.hidden = !hits.length;
  if (hits.length)
    warn.innerHTML = `${escapeHtml(villager().name)} will hear <b>${hits.map(escapeHtml).join("</b> and <b>")}</b> as witch-talk.`;
  $<HTMLButtonElement>("sendBtn").disabled = state.busy || !input.value.trim();
}

async function talk(message: string): Promise<TalkReply> {
  const body: TalkRequest = {
    villagerId: villager().id,
    topicId: topic().id,
    transcript: state.transcript,
    message,
    suspicion: state.suspicion,
    understanding: state.understanding,
    turnsLeft: MAX_TURNS - state.turnsUsed,
  };
  const res = await fetch("/api/talk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "No answer came.");
  return res.json();
}

async function send(e?: Event) {
  e?.preventDefault();
  const input = $<HTMLTextAreaElement>("input");
  const message = input.value.trim();
  if (!message || state.busy || state.over) return;

  state.busy = true;
  input.value = "";
  input.disabled = true;
  updateWarn();
  addEntry("you", escapeHtml(message));
  const pending = addEntry("them", `<span class="considering">${escapeHtml(villager().name)} considers this</span>`, "pending");
  $("sitterFrame").classList.add("thinking");

  let reply: TalkReply;
  try {
    reply = await talk(message);
  } catch (err) {
    pending.closest(".entry")!.remove();
    $("sitterFrame").classList.remove("thinking");
    toast(err instanceof Error ? err.message : "Something went wrong.");
    input.value = message;
    input.disabled = false;
    state.busy = false;
    updateWarn();
    input.focus();
    return;
  }

  $("sitterFrame").classList.remove("thinking");
  pending.closest(".entry")!.classList.remove("pending");
  $("offlinePill").hidden = !reply.offline;
  state.turnsUsed++;
  renderAttempts();
  state.transcript.push({ who: "you", text: message }, { who: "them", text: reply.reply });
  if (reply.belief) state.belief = reply.belief;

  setMood(reply.mood);
  if (reply.suspicion > state.suspicion + 10) sound.alarm();
  setSuspicion(reply.suspicion);
  setUnderstanding(reply.understanding);
  await typeOut(pending, reply.reply);
  state.busy = false;

  if (state.suspicion >= 100) return endRound(false, true);
  if (state.understanding >= WIN_UNDERSTANDING) return endRound(true);
  if (state.turnsUsed >= MAX_TURNS) return endRound(false);

  input.disabled = false;
  updateWarn();
  input.focus({ preventScroll: true });
}

async function endRound(won: boolean, burned = false) {
  const v = villager();
  state.results.push({ villager: v, topic: topic(), won, belief: state.belief });
  $("reply").hidden = true;
  renderProgress();

  if (burned) {
    addVerdict(false, "The village has heard enough.");
    sound.bell();
    await wait(1800);
    return finale(false);
  }

  if (won) {
    sound.win();
    addVerdict(true, state.belief ? `${v.name} now believes ${state.belief}.` : `${v.name} understands.`);
    setSuspicion(Math.max(0, state.suspicion - 5));
  } else {
    sound.fail();
    addVerdict(false, `Suspicion +${FAIL_PENALTY}. ${v.name} will tell the others.`);
    setMood("suspicious");
    setSuspicion(Math.min(100, state.suspicion + FAIL_PENALTY));
    if (state.suspicion >= 100) {
      sound.bell();
      await wait(1800);
      return finale(false);
    }
  }

  const last = state.round === ROUNDS - 1;
  $("nextBtn").textContent = last ? "Face the village" : `Continue to round ${ROMAN[state.round + 1]}`;
  $("after").hidden = false;
  $("nextBtn").focus({ preventScroll: true });
}

function nextRound() {
  if (state.round >= ROUNDS - 1) return finale(true);
  state.round++;
  showIntro();
}

// ---------- finale ----------

function finale(survived: boolean) {
  state.over = true;
  const won = state.results.filter((r) => r.won).length;
  document.body.dataset.ending = survived ? "thanks" : "burned";
  setBackdrop(survived ? SCENES.wedding : SCENES.burning, survived ? "warm" : "fire");
  embers.intensity = survived ? 0 : 0.9;
  if (survived) sound.dawn();

  $("finKicker").textContent = survived
    ? `${won} of ${ROUNDS} convinced · You survived 1350`
    : `${won} of ${ROUNDS} convinced · Burned at the stake`;
  $("finTitle").innerHTML = survived ? "Little Hambury <em>thanks you.</em>" : "The village <em>has decided.</em>";
  $("finLede").textContent = survived
    ? "Word spread. By evening the whole village had gathered, not with torches, but with ale, bread and a great many questions."
    : "Word spread. By nightfall the whole village had gathered in the square, and every one of them had brought a torch.";

  // The villagers you met stand at the front, then the rest of the village.
  const met = state.results.map((r) => r.villager);
  const everyone = [...met, ...CAST.filter((v) => !met.includes(v))];
  $("assembly").innerHTML = everyone
    .map(
      (v, i) => `
      <figure class="member${met.includes(v) ? " met" : ""}" style="--i:${i}">
        <div class="frame sm"><img src="${art(v.art.file)}" alt="${escapeHtml(v.name)}" loading="lazy" /><div class="torchlight"></div></div>
        <figcaption><b>${escapeHtml(v.name)}</b><span>${speech(survived ? v.thanksLine : v.burnLine)}</span></figcaption>
      </figure>`,
    )
    .join("");

  const beliefs = state.results.filter((r) => r.belief);
  $("beliefs").innerHTML = beliefs.length
    ? `<h3>What the village now believes</h3><ul>${beliefs
        .map(
          (r) =>
            `<li><b>${escapeHtml(r.topic.title)}</b><span>${escapeHtml(r.belief.charAt(0).toUpperCase() + r.belief.slice(1))}.</span><small>according to ${escapeHtml(r.villager.name)}</small></li>`,
        )
        .join("")}</ul>`
    : "";
  show("finale");
  renderProgress();
}

function shareText() {
  const won = state.results.filter((r) => r.won).length;
  const survived = document.body.dataset.ending === "thanks";
  const topics = state.results.map((r) => `${r.topic.title.replace(/^The /, "the ")} to ${r.villager.name}`).join(", ");
  const lead = survived
    ? `I explained ${topics} in 1350, and the village thanked me.`
    : `I tried to explain ${topics} in 1350. They burned me as a witch.`;
  const b = state.results.find((r) => r.belief);
  return `${lead} (${won}/${ROUNDS})${b ? `\n${b.villager.name} now believes ${b.belief}.` : ""}\n\nDon't Get Burned: ${location.origin}`;
}

// ---------- title & credits ----------

function renderTitle() {
  $("castGrid").innerHTML = CAST.map(
    (v, i) => `
    <div class="cast-card" style="--i:${i}">
      <div class="frame xs"><img src="${art(v.art.file)}" alt="${escapeHtml(v.name)}, ${escapeHtml(v.role)}" /></div>
      <span>${escapeHtml(v.name)}</span>
    </div>`,
  ).join("");
  $("creditList").innerHTML = [
    ...CAST.map((v) => ({ ...v.art, label: v.name })),
    ...Object.values(SCENES).map((s) => ({ ...s, label: "Scene" })),
  ]
    .map(
      (a) =>
        `<li><span class="who">${escapeHtml(a.label)}</span><a href="${a.source}" target="_blank" rel="noopener"><i>${escapeHtml(a.title)}</i>, ${escapeHtml(a.artist)}, ${escapeHtml(a.date)}</a></li>`,
    )
    .join("");
  setBackdrop(SCENES.harvesters);
  renderProgress();
}

function start() {
  sound.start();
  newRun();
  showIntro();
}

// ---------- wiring ----------

renderTitle();
$("startBtn").addEventListener("click", start);
$("againBtn").addEventListener("click", start);
$("introBtn").addEventListener("click", startRound);
$("reply").addEventListener("submit", send);
$("nextBtn").addEventListener("click", nextRound);
const input = $<HTMLTextAreaElement>("input");
input.addEventListener("input", updateWarn);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) send(e);
});
$("shareBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareText());
    toast("Copied to your clipboard.");
  } catch {
    toast("Your browser wouldn't let me copy that.");
  }
});
$("creditsBtn").addEventListener("click", () => $<HTMLDialogElement>("credits").showModal());

const muteBtn = $("muteBtn");
const savedMute = (() => {
  try {
    return localStorage.getItem("dgb-muted") === "1";
  } catch {
    return false;
  }
})();
sound.setMuted(savedMute);
muteBtn.classList.toggle("muted", savedMute);
muteBtn.addEventListener("click", () => {
  sound.start();
  const m = !sound.muted;
  sound.setMuted(m);
  muteBtn.classList.toggle("muted", m);
  muteBtn.setAttribute("aria-label", m ? "Turn sound on" : "Turn sound off");
  try {
    localStorage.setItem("dgb-muted", m ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
});
