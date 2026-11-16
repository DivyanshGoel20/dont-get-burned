import "@fontsource/im-fell-english/400.css";
import "@fontsource/im-fell-english/400-italic.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./styles.css";

import { Agnes } from "./agnes";
import { Sound } from "./audio";
import { Scene } from "./scene";
import {
  CARDS,
  MAX_TURNS,
  WIN_UNDERSTANDING,
  findBanned,
  type AgnesReply,
  type AgnesRequest,
  type Mood,
  type TurnLine,
} from "./shared";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const MOOD_LABEL: Record<Mood, string> = {
  curious: "curious",
  confused: "baffled",
  amazed: "astonished",
  delighted: "delighted",
  suspicious: "suspicious",
  afraid: "frightened",
  furious: "calling for torches",
};

const OPENERS = [
  "*grips her hoe* You fell out of the sky into my turnips. Start talking, stranger.",
  "Right. Next strange thing. Go on, I've got pigs to feed.",
  "*sighs* What else do they have in your future, then?",
  "Another one? Saints preserve us. Go on.",
  "*sits on an upturned bucket* I'm listening. Carefully.",
  "Margery won't believe a word of this. Next.",
  "*narrows her eyes* Careful now. I've been counting your odd words.",
  "Last one, is it? Make it a good one.",
];

const scene = new Scene($<HTMLCanvasElement>("sky"));
const sound = new Sound();
const agnes = new Agnes($("portrait"));

interface CardResult {
  title: string;
  won: boolean;
  belief: string;
}

const state = {
  cardIndex: 0,
  suspicion: 0,
  understanding: 0,
  turnsUsed: 0,
  transcript: [] as TurnLine[],
  belief: "",
  results: [] as CardResult[],
  busy: false,
  over: false,
};

// ---------- small helpers ----------

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toast(msg: string) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}

/** Turns *stage directions* into styled spans; escapes everything else. */
function renderSpeech(text: string): string {
  const esc = text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return esc.replace(/\*([^*]+)\*/g, '<span class="act">$1</span>');
}

async function typeInto(el: HTMLElement, text: string) {
  if (reduceMotion) {
    el.innerHTML = renderSpeech(text);
    return;
  }
  el.classList.add("typing");
  for (let i = 1; i <= text.length; i++) {
    el.innerHTML = renderSpeech(text.slice(0, i));
    if (i % 3 === 0) sound.blip();
    const ch = text[i - 1];
    await wait(/[.!?]/.test(ch) ? 140 : /[,;]/.test(ch) ? 70 : 16);
  }
  el.classList.remove("typing");
}

function scrollLog() {
  const log = $("log");
  log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
}

function addLine(who: "you" | "agnes", text = ""): HTMLElement {
  const row = document.createElement("div");
  row.className = `line ${who}`;
  const bubble = document.createElement("p");
  bubble.className = "bubble";
  if (who === "you") bubble.textContent = text;
  else bubble.innerHTML = renderSpeech(text);
  row.append(bubble);
  $("log").append(row);
  scrollLog();
  return bubble;
}

// ---------- meters ----------

function setSuspicion(v: number) {
  const prev = state.suspicion;
  state.suspicion = v;
  $("suspicionFill").style.width = `${v}%`;
  $("suspicionValue").textContent = String(v);
  const meter = $("suspicionMeter");
  meter.dataset.level = v >= 75 ? "high" : v >= 45 ? "mid" : "low";
  if (v > prev) {
    meter.classList.remove("bump");
    void meter.offsetWidth;
    meter.classList.add("bump");
  }
  document.body.style.setProperty("--heat", String(v / 100));
  scene.setSuspicion(v);
  sound.setSuspicion(v);
}

function setUnderstanding(v: number) {
  state.understanding = v;
  $("uFill").style.width = `${v}%`;
  $("uValue").textContent = `${v}%`;
  $("card").classList.toggle("close", v >= 60 && v < WIN_UNDERSTANDING);
}

function renderCandles() {
  const el = $("candles");
  el.innerHTML = "";
  for (let i = 0; i < MAX_TURNS; i++) {
    const c = document.createElement("i");
    c.className = i < MAX_TURNS - state.turnsUsed ? "lit" : "out";
    el.append(c);
  }
  el.setAttribute("aria-label", `${MAX_TURNS - state.turnsUsed} tries left`);
}

// ---------- cards ----------

function loadCard(i: number) {
  const card = CARDS[i];
  state.cardIndex = i;
  state.turnsUsed = 0;
  state.transcript = [];
  state.belief = "";
  setUnderstanding(0);
  renderCandles();

  const el = $("card");
  el.classList.remove("won", "lost", "deal");
  void el.offsetWidth;
  el.classList.add("deal");
  $("cardNo").textContent = `${ROMAN[i]} of ${ROMAN[CARDS.length - 1]}`;
  $("cardTitle").textContent = card.title;
  $("cardHint").textContent = card.hint;
  $("seals").innerHTML = card.banned.map((w) => `<span class="seal" data-word="${w}">${w}</span>`).join("");
  $("stamp").hidden = true;

  $("log").innerHTML = "";
  $("nextBtn").hidden = true;
  $("composer").classList.remove("done");
  const input = $<HTMLTextAreaElement>("input");
  input.value = "";
  input.disabled = false;
  updateWarn();
  agnes.setMood(state.suspicion >= 60 ? "suspicious" : "curious");
  void typeInto(addLine("agnes"), OPENERS[i] ?? OPENERS[1]).then(() => input.focus({ preventScroll: true }));
}

function updateWarn() {
  const input = $<HTMLTextAreaElement>("input");
  const card = CARDS[state.cardIndex];
  const hits = findBanned(input.value, card.banned);
  document.querySelectorAll<HTMLElement>(".seal").forEach((s) => {
    s.classList.toggle("hit", hits.includes(s.dataset.word!));
  });
  const warn = $("warn");
  warn.hidden = !hits.length;
  if (hits.length) warn.innerHTML = `Agnes will hear <b>${hits.join("</b>, <b>")}</b> as witch-talk.`;
  $<HTMLButtonElement>("sendBtn").disabled = state.busy || !input.value.trim();
}

// ---------- a turn ----------

async function askAgnes(message: string): Promise<AgnesReply> {
  const body: AgnesRequest = {
    cardId: CARDS[state.cardIndex].id,
    transcript: state.transcript,
    message,
    suspicion: state.suspicion,
    understanding: state.understanding,
    beliefs: state.results.filter((r) => r.belief).map((r) => r.belief),
    turnsLeft: MAX_TURNS - state.turnsUsed,
  };
  const res = await fetch("/api/agnes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Agnes didn't answer.");
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
  addLine("you", message);

  const thinking = addLine("agnes", "");
  thinking.classList.add("thinking");
  thinking.innerHTML = "<i></i><i></i><i></i>";
  agnes.thinking(true);

  let reply: AgnesReply;
  try {
    reply = await askAgnes(message);
  } catch (err) {
    thinking.parentElement!.remove();
    agnes.thinking(false);
    toast(err instanceof Error ? err.message : "Something went wrong.");
    input.value = message;
    input.disabled = false;
    state.busy = false;
    updateWarn();
    input.focus();
    return;
  }

  agnes.thinking(false);
  $("offlinePill").hidden = !reply.offline;
  state.turnsUsed++;
  renderCandles();
  state.transcript.push({ who: "you", text: message }, { who: "agnes", text: reply.reply });
  if (reply.belief) state.belief = reply.belief;

  thinking.classList.remove("thinking");
  agnes.setMood(reply.mood);
  $("moodLabel").textContent = MOOD_LABEL[reply.mood];
  if (reply.suspicion > state.suspicion + 10) sound.alarm();
  setSuspicion(reply.suspicion);
  setUnderstanding(reply.understanding);
  await typeInto(thinking, reply.reply);

  state.busy = false;

  if (state.suspicion >= 100) return burn(reply.reply);
  if (state.understanding >= WIN_UNDERSTANDING) return finishCard(true);
  if (state.turnsUsed >= MAX_TURNS) return finishCard(false);

  input.disabled = false;
  updateWarn();
  input.focus({ preventScroll: true });
}

async function finishCard(won: boolean) {
  const card = CARDS[state.cardIndex];
  state.results.push({ title: card.title, won, belief: state.belief });
  const el = $("card");
  el.classList.add(won ? "won" : "lost");
  const stamp = $("stamp");
  stamp.textContent = won ? "Understood" : "Gave up";
  stamp.hidden = false;
  $("composer").classList.add("done");
  $<HTMLTextAreaElement>("input").disabled = true;

  if (won) {
    sound.win();
    setSuspicion(Math.max(0, state.suspicion - 8));
  } else {
    sound.fail();
    await wait(500);
    agnes.setMood("suspicious");
    await typeInto(addLine("agnes"), "*shakes her head* You've talked and talked and I'm none the wiser. That's what a liar sounds like.");
    setSuspicion(Math.min(100, state.suspicion + 12));
    if (state.suspicion >= 100) return burn("You've talked and talked and I'm none the wiser. TORCHES!");
  }

  const last = state.cardIndex === CARDS.length - 1;
  const next = $<HTMLButtonElement>("nextBtn");
  next.innerHTML = last ? 'See what became of you <span aria-hidden="true">→</span>' : 'Next thing <span aria-hidden="true">→</span>';
  next.hidden = false;
  next.focus({ preventScroll: true });
}

function nextCard() {
  if (state.cardIndex >= CARDS.length - 1) return survive();
  loadCard(state.cardIndex + 1);
}

// ---------- endings ----------

function beliefs(): string[] {
  const list = state.results.filter((r) => r.belief).map((r) => r.belief);
  if (state.belief && !list.includes(state.belief)) list.push(state.belief);
  return list;
}

function showEnding(kind: "burn" | "dawn", lastWords: string) {
  state.over = true;
  const won = state.results.filter((r) => r.won).length;
  document.body.dataset.ending = kind;
  $("stage").classList.add("leaving");
  scene.setEnding(kind);

  setTimeout(() => {
    $("stage").hidden = true;
    $("suspicionMeter").hidden = true;
    const end = $("ending");
    $("endEyebrow").textContent =
      kind === "burn"
        ? `Burned at the stake · ${won} of ${CARDS.length} explained`
        : `You survived 1350 · ${won} of ${CARDS.length} explained`;
    $("endTitle").innerHTML = kind === "burn" ? "They burned<br /><em>you.</em>" : "You made it<br /><em>to morning.</em>";
    $("lastWords").innerHTML = `<span class="who">Agnes, ${kind === "burn" ? "holding a torch" : "at sunrise"}</span>${renderSpeech(lastWords)}`;
    const list = beliefs();
    $("beliefList").innerHTML = list.length
      ? list.map((b) => `<li>${renderSpeech(b.charAt(0).toUpperCase() + b.slice(1))}.</li>`).join("")
      : "<li>Nothing. She only believes you were a witch.</li>";
    end.hidden = false;
    end.classList.remove("show");
    void end.offsetWidth;
    end.classList.add("show");
  }, kind === "burn" ? 1600 : 900);
}

function burn(line: string) {
  state.over = true;
  sound.bell();
  agnes.setMood("furious");
  $("moodLabel").textContent = MOOD_LABEL.furious;
  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 900);
  showEnding("burn", line);
}

function survive() {
  sound.dawn();
  const won = state.results.filter((r) => r.won).length;
  const line =
    won >= 6
      ? "*hands you a turnip* You're the strangest man God ever dropped in a field, but I believe you. Mostly."
      : won >= 3
        ? "*squints at the sunrise* I still think you're half mad. But mad isn't witchcraft. Off you go."
        : "*keeps her hoe raised* I didn't understand a word, but you're too boring to be a witch. Leave.";
  showEnding("dawn", line);
}

function shareText(): string {
  const won = state.results.filter((r) => r.won).length;
  const b = beliefs();
  const lead =
    document.body.dataset.ending === "burn"
      ? `I explained ${won}/${CARDS.length} modern things to a medieval peasant before she burned me as a witch. 🔥`
      : `I explained ${won}/${CARDS.length} modern things to a medieval peasant and survived 1350. 🌅`;
  const belief = b.length ? `\nShe now believes ${b[b.length - 1]}.` : "";
  return `${lead}${belief}\n\nDon't Get Burned → ${location.origin}`;
}

// ---------- flow ----------

function start() {
  sound.start();
  state.cardIndex = 0;
  state.results = [];
  state.over = false;
  state.busy = false;
  delete document.body.dataset.ending;
  scene.setEnding(null);
  setSuspicion(0);
  $("moodLabel").textContent = MOOD_LABEL.curious;
  $("titleScreen").classList.add("leaving");
  $("ending").hidden = true;
  setTimeout(() => {
    $("titleScreen").hidden = true;
    const stage = $("stage");
    stage.classList.remove("leaving");
    stage.hidden = false;
    $("suspicionMeter").hidden = false;
    loadCard(0);
  }, 450);
}

$("startBtn").addEventListener("click", start);
$("againBtn").addEventListener("click", start);
$("composer").addEventListener("submit", send);
$("nextBtn").addEventListener("click", nextCard);
const input = $<HTMLTextAreaElement>("input");
input.addEventListener("input", updateWarn);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) send(e);
});
$("shareBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareText());
    toast("Copied. Go spread the word, witch.");
  } catch {
    toast("Couldn't copy. Your browser said no.");
  }
});

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
  muteBtn.setAttribute("aria-label", m ? "Sound on" : "Sound off");
  try {
    localStorage.setItem("dgb-muted", m ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
});
