(() => {
"use strict";

// ---------- Einstellungen des Kastens ----------
const DAY = 864e5;
const INTERVAL = [0, 1, 2, 4, 8, 16, 30, 180];          // Grammatik-Kasten: Tage bis zur nächsten Abfrage, je Fach
// Vokabeln: FSRS rechnet für jedes Wort einzeln, wann es wiederkommt. Das Fach zeigt grob, wie weit der Abstand schon ist.
const FACH_MAX = [0, 2, 5, 10, 21, 45, 120, Infinity];  // Abstand in Tagen bis einschließlich dieses Fachs
const FACH_LABEL = ["neu", "1–2 Tage", "3–5 Tage", "1 Woche", "2–3 Wochen", "1 Monat", "2–4 Monate", "½ Jahr"];
const FACH_IN = ["", "morgen", "in 2 Tagen", "in 4 Tagen", "in 8 Tagen", "in 16 Tagen", "in 1 Monat", "in ½ Jahr"];
const DUE_SHOW = 30;                                   // höchstens so viele Wiederholungen pro Tag, der Rest wartet unsichtbar
const NEW_GATE = 20;                                   // neue Wörter nur, solange weniger Wiederholungen offen sind
const DAY_BUDGET = 15 * 60;                            // nach 15 Minuten Übungszeit kommen heute keine neuen Wörter mehr
const ROUND_SIZE = 10;
const KEY = "vokabelkasten.v1";

const SAMPLE_UNIT = "Beispiel: Unit 1 – At school";
const SAMPLE = [
  ["school", "Schule", "I go to school by bus."], ["teacher", "Lehrer, Lehrerin", "Our teacher is nice."],
  ["classroom", "Klassenzimmer"], ["pencil case", "Federmäppchen", "My pencil case is blue."], ["ruler", "Lineal"],
  ["rubber", "Radiergummi"], ["exercise book", "Heft"], ["board", "Tafel"], ["friend", "Freund, Freundin", "Tom is my best friend."],
  ["to be late", "zu spät sein", "Sorry, I'm late!"], ["break", "Pause"], ["timetable", "Stundenplan"], ["homework", "Hausaufgaben"],
  ["Monday", "Montag"], ["favourite", "Lieblings-", "My favourite subject is English."], ["subject", "Schulfach"],
  ["to read", "lesen"], ["to write", "schreiben"], ["bag", "Tasche"], ["Welcome!", "Willkommen!"]
];

const LANG_PRESETS = [
  { name: "Englisch", code: "en-GB", flag: "🇬🇧" }, { name: "Französisch", code: "fr-FR", flag: "🇫🇷" },
  { name: "Spanisch", code: "es-ES", flag: "🇪🇸" }, { name: "Latein", code: "", flag: "🏛️" },
  { name: "Italienisch", code: "it-IT", flag: "🇮🇹" }, { name: "Russisch", code: "ru-RU", flag: "🇷🇺" },
  { name: "Niederländisch", code: "nl-NL", flag: "🇳🇱" }, { name: "Türkisch", code: "tr-TR", flag: "🇹🇷" }
];
// Fahne der Sprache; eigene Sprachen bekommen ihre ersten zwei Buchstaben.
function flagOf(l) {
  const p = LANG_PRESETS.find(x => x.name === l.name);
  return p ? p.flag : `<span class="abbr">${esc(l.name.slice(0, 2))}</span>`;
}

// Tags: kleine Stichwörter wie #tiere oder #verb, nach denen man gezielt üben kann.
// Jedes Wort bekommt genau ein Thema und höchstens eine Wortart.
const WB = "wordbank-";                                 // Tags der Wordbanks aus dem Buch (Camden Town 6)
const THEME_TAGS = ["familie", "schule", "zuhause", "essen", "kleidung", "körper", "gesundheit", "gefühle", "freizeit", "sport", "tiere", "natur", "wetter", "stadt", "fortbewegung", "reisen", "einkaufen", "beruf", "zeit", "zahlen", "farben", "feste", "redemittel", "allgemein"];
const GRAM_TAGS = ["nomen", "verb", "unregelmäßiges-verb", "adjektiv", "adverb", "präposition", "pronomen", "fragewort", "redewendung"];
const BASE_TAGS = [...THEME_TAGS, ...GRAM_TAGS];
function normTag(t) { return String(t).toLowerCase().replace(/^#+/, "").replace(/[^\p{L}\d-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 24); }
function tagCounts() { const n = {}; cardsL().forEach(c => (c.tags || []).forEach(t => n[t] = (n[t] || 0) + 1)); return n; }
// Die Tag-Liste für den Auftrag: alle schon benutzten (häufigste zuerst, höchstens 80), dann die Grundliste.
function tagListForPrompt() {
  const n = tagCounts(), used = Object.keys(n).sort((a, b) => n[b] - n[a]).slice(0, 80);
  return [...new Set([...used, ...BASE_TAGS])];
}
function photoPrompt() {
  const n = L().name;
  return `Im Anhang ist eine Vokabelliste aus einem ${n}-Schulbuch (Foto, PDF oder Datei). Schreib alle Vokabeln als Liste, eine Vokabel pro Zeile, in diesem Format:
${n.toLowerCase()} ; deutsch ; Beispielsatz ; #tag #tag

Regeln:
- Übernimm den Beispielsatz auf ${n}, wenn einer dasteht. Sonst lass das Feld leer, aber behalte das Semikolon: ${n.toLowerCase()} ; deutsch ; ; #tag
- Lass Lautschrift und Seitenzahlen weg. Mehrere deutsche Bedeutungen trennst du mit Komma.
- Wenn die Vorlage eine Überschrift wie „Unit 2“ hat, schreib sie in die erste Zeile mit # und Leerzeichen davor: # Unit 2
- Tags: Ein Tag ist ein kleingeschriebenes deutsches Wort mit # davor, ohne Leerzeichen. Jede Vokabel bekommt genau einen Themen-Tag und, wenn es passt, einen Wortart-Tag, z. B. #tiere #nomen.
- Themen-Tags: ${[...new Set([...tagListForPrompt().filter(t => !GRAM_TAGS.includes(t)), ...THEME_TAGS])].map(t => "#" + t).join(" ")}
- Wortart-Tags: ${GRAM_TAGS.map(t => "#" + t).join(" ")}
- Wenn in der Vorlage schon Themen oder Kategorien stehen, nimm den passenden Themen-Tag dafür.
- Passt kein Thema, nimm #allgemein. Erfinde keine neuen Tags.
Gib nur die Liste als Codeblock aus, ohne weiteren Text.`;
}

const BOTS = {
  chatgpt: { name: "ChatGPT", url: q => "https://chatgpt.com/?q=" + encodeURIComponent(q) },
  claude:  { name: "Claude",  url: q => "https://claude.ai/new?q=" + encodeURIComponent(q) },
  gemini:  { name: "Gemini",  url: () => "https://gemini.google.com/app", copyFirst: true }
};

// ---------- Speicher (nur auf diesem Gerät) ----------
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function defaults() {
  return {
    name: "", onboarded: false, langs: [], cur: null, cards: [], log: {}, gram: {},
    streak: 0, lastDay: 0, newPerDay: 10, aiHelp: false, bot: "chatgpt", speechMode: "say",
    goal: 20, sound: true, input: "tiles", xp: 0, badges: {},
    stickers: {}, packQ: [], marks: 0, packDay: "", welt: {}
  };
}
// Ältere Stände ohne Sprachen werden zu einem Kasten "Englisch".
function migrate(s) {
  s = Object.assign(defaults(), s);
  if (!s.langs.length && s.cards.length) {
    s.langs = [{ id: "en", name: "Englisch", code: "en-GB", dir: s.dir || "de-en", newDay: s.newDay || 0, newCount: s.newCount || 0 }];
    s.cards.forEach(c => c.lang = "en"); s.cur = "en";
  }
  if (s.langs.length && !s.langs.some(l => l.id === s.cur)) s.cur = s.langs[0].id;
  return s;
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.cards)) return migrate(s); } catch (e) {}
  return null;
}
let S = load() || defaults();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function L() { return S.langs.find(l => l.id === S.cur) || S.langs[0]; }
function cardsL() { return S.cards.filter(c => c.lang === S.cur); }
function isEn() { return /^en/.test(L().code); }
function canHear() { return canSpeak && !!L().code; }
function addLang(name, code, withSample) {
  const id = uid();
  S.langs.push({ id, name, code: code || "", dir: "de-en", newDay: 0, newCount: 0 });
  S.cur = id;
  if (withSample && name === "Englisch" && !S.cards.some(c => c.unit === SAMPLE_UNIT))
    SAMPLE.forEach(([en, de, ex]) => S.cards.push({ id: uid(), en, de, ex: ex || "", unit: SAMPLE_UNIT, lang: id, level: 0, due: 0 }));
  save(); return id;
}

// ---------- Hilfsfunktionen ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const app = $("#app");
function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content; }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function uid() { return Math.random().toString(36).slice(2, 10); }
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2600); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}

function norm(s) {
  return String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
}
function alts(s) { return String(s).split(/\s*[,/;]\s*/).map(norm).filter(Boolean); }
function variants(a) { if (!isEn()) return [a]; return a.startsWith("to ") ? [a, a.slice(3)] : [a, "to " + a]; }
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
// "good" | "near" (ein Tippfehler) | "bad"
function check(input, solution) {
  const x = norm(input); if (!x) return "bad";
  const options = [norm(solution), ...alts(solution)];
  for (const o of options) if (variants(o).includes(x)) return "good";
  for (const o of options) for (const v of variants(o)) if (v.length >= 4 && lev(x, v) === 1) return "near";
  return "bad";
}

// ---------- Kasten ----------
// Fällig, niedrigste Fächer zuerst, dann die am längsten wartenden
function dueCards() { const now = Date.now(); return cardsL().filter(c => c.level > 0 && c.due <= now).sort((a, b) => a.level - b.level || a.due - b.due); }
// Tagesbudget: höchstens DUE_SHOW Wiederholungen am Tag; was darüber liegt, wartet unsichtbar auf morgen
function dueLeft() { return Math.max(0, DUE_SHOW - (dayLog().rev || 0)); }
function dueToday() { return dueCards().slice(0, dueLeft()); }
// Neue Wörter nur, wenn kein Stau da ist und die 15 Minuten noch nicht um sind
function newAllowed() { return dueCards().length < NEW_GATE && dayLog().sec < DAY_BUDGET ? newLeft() : 0; }
function newLeft() { const l = L(); if (l.newDay !== today()) { l.newDay = today(); l.newCount = 0; } return Math.max(0, S.newPerDay - l.newCount); }
function levelCounts() { const n = Array(8).fill(0); cardsL().forEach(c => { if (c.level || !isPaused(c)) n[c.level]++; }); return n; }
// ---------- FSRS (Free Spaced Repetition Scheduler, Version 5, Standardgewichte) ----------
const FW = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const F_DECAY = -0.5, F_FACTOR = 19 / 81, F_RETAIN = 0.9, F_MAXIVL = 365;
const fClampD = d => Math.min(10, Math.max(1, d));
const fInitD = g => fClampD(FW[4] - Math.exp(FW[5] * (g - 1)) + 1);
function fRecall(t, st) { return Math.pow(1 + F_FACTOR * t / st, F_DECAY); }
function fIvl(st) { return Math.min(F_MAXIVL, Math.max(1, Math.round(st / F_FACTOR * (Math.pow(F_RETAIN, 1 / F_DECAY) - 1)))); }
// Ältere Karten ohne FSRS-Werte: Stabilität aus dem bisherigen Fach schätzen
function fInit(card) {
  if (card.st) return;
  if (!card.level) return;
  const iv = INTERVAL[card.level] || 1;
  card.st = iv; card.df = 5; card.seen = card.due ? card.due - iv * DAY : Date.now();
}
// g: 1 = falsch, 2 = fast (Tippfehler), 3 = richtig
function fsrs(card, g) {
  fInit(card);
  const now = Date.now();
  if (!card.st) { card.st = FW[g - 1]; card.df = fInitD(g); }
  else {
    const t = Math.max(0, (now - (card.seen || now)) / DAY), r = fRecall(t, card.st), d = card.df;
    if (t < 1) card.st = Math.max(0.1, card.st * Math.exp(FW[17] * (g - 3 + FW[18])));
    else if (g === 1) card.st = Math.min(card.st, FW[11] * Math.pow(d, -FW[12]) * (Math.pow(card.st + 1, FW[13]) - 1) * Math.exp(FW[14] * (1 - r)));
    else card.st = card.st * (Math.exp(FW[8]) * (11 - d) * Math.pow(card.st, -FW[9]) * (Math.exp(FW[10] * (1 - r)) - 1) * (g === 2 ? FW[15] : 1) + 1);
    const d1 = d - FW[6] * (g - 3) * (10 - d) / 9;
    card.df = fClampD(FW[7] * fInitD(4) + (1 - FW[7]) * d1);
  }
  card.seen = now;
  card.ivl = g === 1 ? 1 : fIvl(card.st);
  return card.ivl;
}
function fachFor(days) { let f = 1; while (days > FACH_MAX[f]) f++; return f; }
// Wann kommt die Karte wieder, in Worten
function whenText(card) {
  const n = Math.round((card.due - today()) / DAY);
  return n <= 1 ? "morgen" : n < 14 ? `in ${n} Tagen` : n < 60 ? `in ${Math.round(n / 7)} Wochen` : n < 330 ? `in ${Math.round(n / 30)} Monaten` : "in einem Jahr";
}
// Richtig: mindestens ein Fach weiter (leichte Wörter springen weiter). Fast: bleibt. Falsch: zwei Fächer zurück, kommt morgen.
function grade(card, result) {
  const wasNew = card.level === 0;
  const iv = fsrs(card, result === "good" ? 3 : result === "near" ? 2 : 1);
  if (result === "good") card.level = Math.min(7, Math.max(card.level + 1, fachFor(iv)));
  else if (result === "bad") card.level = Math.max(1, card.level - 2);
  else card.level = Math.max(1, card.level);
  card.due = today() + iv * DAY;
  if (wasNew) { newLeft(); L().newCount++; dayLog().learned++; } else { const dl = dayLog(); dl.rev = (dl.rev || 0) + 1; }
}
// Freies Üben, richtig: Wort bleibt im Fach, seine Wartezeit beginnt von vorn
function rest(card) { fInit(card); card.due = today() + (card.ivl || INTERVAL[card.level] || 1) * DAY; card.seen = Date.now(); }

// ---------- Übungstagebuch: pro Tag Übungszeit, Antworten und neue Wörter ----------
function dayKey(t = Date.now()) { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function dayLog(k = dayKey()) { return S.log[k] || (S.log[k] = { sec: 0, ans: 0, right: 0, learned: 0, added: 0, gram: 0 }); }
function practiced(k) { const d = S.log[k]; return !!d && (d.ans > 0 || d.gram > 0 || d.sec >= 30); }
// Zählt aktive Zeit in einer Runde (Vokabeln oder Grammatik); Pausen über 60 Sekunden zählen nicht mit.
function tick() {
  const run = R || G || P, now = Date.now();
  if (run && run.last) dayLog().sec += Math.min(now - run.last, 60000) / 1000;
  if (run) run.last = now;
}
function shiftDay(k, n) { const [y, m, d] = k.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n).getTime()); }
// Serie: Tage am Stück. Pro Woche (Mo–So) darf ein Tag ausfallen, ohne dass die Serie reißt (Pausentag).
// Ein Pausentag zählt nicht mit, zwei Pausentage hintereinander gibt es nicht.
function streakInfo() {
  let k = dayKey(), n = 0, prevPause = false;
  const pauses = new Set(), used = new Set();
  if (!practiced(k)) k = shiftDay(k, -1);
  for (let guard = 0; guard < 4000; guard++) {
    if (practiced(k)) { n++; prevPause = false; }
    else {
      const wk = weekStart(k);
      if (prevPause || used.has(wk) || !practiced(shiftDay(k, -1))) break;
      used.add(wk); pauses.add(k); prevPause = true;
    }
    k = shiftDay(k, -1);
  }
  return { n, pauses };
}
function liveStreak() { return streakInfo().n; }
function fmtMin(sec) {
  const m = Math.round(sec / 60);
  if (sec > 0 && m < 1) return "< 1 Min";
  return m >= 60 ? `${Math.floor(m / 60)} Std ${m % 60} Min` : `${m} Min`;
}

// ---------- Vorlesen und Spracheingabe ----------
const canSpeak = "speechSynthesis" in window;
function say(text, lang = L().code) {
  if (!canSpeak || !lang) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = .9; speechSynthesis.speak(u); } catch (e) {}
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const LETTERS_EN = {
  ay: "a", eh: "a", be: "b", bee: "b", see: "c", sea: "c", si: "c", dee: "d", ee: "e", ef: "f", eff: "f", gee: "g", jee: "g",
  aitch: "h", age: "h", eye: "i", aye: "i", jay: "j", kay: "k", el: "l", ell: "l", em: "m", en: "n", oh: "o", owe: "o",
  pee: "p", pea: "p", queue: "q", cue: "q", are: "r", ar: "r", es: "s", ess: "s", tea: "t", tee: "t", you: "u", vee: "v",
  ex: "x", why: "y", zed: "z", zee: "z", hyphen: "-", dash: "-", space: " ", apostrophe: "'"
};
const LETTERS_DE = {
  be: "b", ce: "c", tse: "c", de: "d", ef: "f", ge: "g", ha: "h", jot: "j", ka: "k", el: "l", em: "m", en: "n", pe: "p",
  ku: "q", er: "r", es: "s", te: "t", vau: "v", we: "w", ix: "x", ypsilon: "y", zett: "z", eszett: "ß", "ä": "ä", "ö": "ö", "ü": "ü",
  leerzeichen: " ", bindestrich: "-"
};
// Macht aus "b e a u t i f u l" oder "bee e a you tea …" ein Wort. Klingt es nicht nach Buchstaben, bleibt der Text, wie er ist.
function spellToWord(text, lang) {
  const map = lang.startsWith("de") ? LETTERS_DE : lang.startsWith("en") ? LETTERS_EN : {};
  const toks = norm(text).replace(/[.,]/g, " ").split(/\s+/).filter(Boolean);
  let out = "", hits = 0;
  for (let i = 0; i < toks.length; i++) {
    let t = toks[i];
    if ((t === "double" || t === "doppel") && toks[i + 1]) {
      const nx = toks[i + 1];
      if (nx === "you" || nx === "u") { out += "w"; hits++; i++; continue; }
      const l = nx.length === 1 ? nx : map[nx];
      if (l) { out += l + l; hits++; i++; continue; }
    }
    if (t === "scharfes" && toks[i + 1] === "s") { out += "ß"; hits++; i++; continue; }
    if (t.length === 1 || /^[äöü]$/.test(t)) { out += t; hits++; continue; }
    if (map[t]) { out += map[t]; hits++; continue; }
    out += t;
  }
  return toks.length && hits / toks.length >= .6 ? out : norm(text);
}

// ---------- Unit-Pakete als Link ----------
function b64u(bytes) {
  let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64u(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/")); const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b;
}
// Ein Paket ist entweder eine Unit {n, l, c, w:[[wort, deutsch, beispiel]]}
// oder ein ganzes Buch {t, l, c, u:[{n, w}], p:[pausierte Units]}.
async function packCode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if ("CompressionStream" in window) {
    try {
      const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();
      return "z" + b64u(new Uint8Array(buf));
    } catch (e) {}
  }
  return "j" + b64u(bytes);
}
function packRows(cards) {
  return cards.map(c => { const r = [c.en, c.de, c.ex || "", c.mn || 0, c.dx || 0, c.tags && c.tags.length ? c.tags : 0, c.part || 0, c.nf ? 1 : 0]; while (r.length > 2 && !r[r.length - 1]) r.pop(); return r; });
}
// Fallen: falsche, aber leicht verwechselbare Antworten für die Auswahl, {en: [...], de: [...]}.
function dxList(d) {
  if (!d || typeof d !== "object") return undefined;
  const l = a => (Array.isArray(a) ? a.map(String).filter(Boolean).slice(0, 6) : []);
  const out = { en: l(d.en), de: l(d.de) };
  return out.en.length || out.de.length ? out : undefined;
}
// Wie leicht lässt sich eine Antwort mit der richtigen verwechseln? Ähnliche Schreibweise, gemeinsame Wörter, gleiche Form.
function lookAlike(a, b) {
  const x = a.toLowerCase(), y = b.toLowerCase(), words = t => t.split(/[^a-zäöüß]+/).filter(w => w.length > 2 && !["the", "and", "...", "sth", "etw"].includes(w));
  const wb = new Set(words(y)); let sc = words(x).filter(w => wb.has(w)).length * 3;
  sc += 4 * (1 - lev(x, y) / Math.max(x.length, y.length, 1));
  if (x.slice(0, 2) === y.slice(0, 2)) sc += 1;
  for (const f of [t => t.startsWith("to "), t => t.includes("..."), t => /[?!]$/.test(t), t => t.includes(" ")]) if (f(x) === f(y)) sc += .7;
  return sc - Math.abs(x.length - y.length) / Math.max(x.length, y.length, 1);
}
function choiceOpts(card, sol, dir, pool) {
  const side = dir === "de-en" ? "en" : "de", taken = new Set([norm(sol)]), out = [];
  const add = t => { const k = norm(t); if (t && !taken.has(k)) { taken.add(k); out.push(t); } };
  // Jedes Mal anders gemischt: ein bis drei eigene Fallen, der Rest zufällig aus den ähnlichsten Wörtern im Kasten.
  const own = shuffle([...(card.dx && card.dx[side] || [])]), mine = own.length ? 1 + Math.floor(Math.random() * Math.min(3, own.length)) : 0;
  own.slice(0, mine).forEach(add);
  // Wörter aus dem Kasten, die dasselbe bedeuten oder gleich geschrieben sind, wären auch richtig: die fallen weg.
  const bare = t => t.toLowerCase().replace(/[^a-zäöüß]/g, ""), qs = side === "en" ? "de" : "en";
  const parts = t => new Set(t.split(/[,/;]/).map(bare).filter(Boolean)), mean = parts(card[qs]), sb = bare(sol);
  const same = c => { const b = bare(c[side]); return [...parts(c[qs])].some(x => mean.has(x)) || (b.length > 2 && (b.includes(sb) || sb.includes(b))); };
  const near = shuffle(pool.filter(c => !same(c)).map(c => c[side]).filter(t => !taken.has(norm(t))).map(t => [t, lookAlike(t, sol)]).sort((a, b) => b[1] - a[1]).slice(0, 12));
  near.forEach(([t]) => out.length < 3 && add(t));
  own.slice(mine).forEach(t => out.length < 3 && add(t));
  return shuffle([sol, ...out.slice(0, 3)]);
}
// Eselsbrücken: [art, bild, text, verwechselt mit]; art ist "s" (Schreibweise), "b" (Bedeutung) oder "v" (Verwechslung).
function mnList(m) {
  if (!Array.isArray(m)) return undefined;
  const out = m.filter(x => Array.isArray(x) && "sbv".includes(x[0]) && x[2]).map(x => [x[0], String(x[1] || ""), String(x[2]), String(x[3] || "")]);
  return out.length ? out : undefined;
}
async function encodePack(name, cards) { return packCode({ n: name, l: L().name, c: L().code, w: packRows(cards) }); }
async function decodePack(code) {
  let bytes = unb64u(code.slice(1));
  if (code[0] === "z") bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
  const obj = JSON.parse(new TextDecoder().decode(bytes));
  const rows = w => (w || []).filter(r => r && r[0] && r[1]).map(r => ({ en: String(r[0]), de: String(r[1]), ex: String(r[2] || ""), mn: mnList(r[3]), dx: dxList(r[4]), tags: Array.isArray(r[5]) ? r[5].map(normTag).filter(Boolean).slice(0, 5) : undefined, part: r[6] ? String(r[6]).slice(0, 8) : undefined, nf: r[7] ? 1 : undefined }));
  const units = (Array.isArray(obj.u) ? obj.u.map(u => ({ name: String(u.n || "Unit"), rows: rows(u.w) })) : [{ name: String(obj.n || "Neue Unit"), rows: rows(obj.w) }])
    .filter(u => u.rows.length);
  return { title: String(obj.t || obj.n || ""), lang: String(obj.l || "Englisch"), code: String(obj.c ?? "en-GB"), units, isBook: Array.isArray(obj.u), paused: (obj.p || []).map(String) };
}
function appUrl() { return location.origin + location.pathname.replace(/index\.html$/, ""); }

// ---------- Symbole ----------
const ICON = {
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5.5.3 1.6 1 2.7 2 3.2C11 8 11 5 12 2z" fill="#F08A24"/><path d="M12 13c.6 1.6 2 2.3 2 4a2 2 0 0 1-4 0c0-1.3.9-2.2 2-4z" fill="#FFD43B"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6"/></svg>'
};

// ---------- Erster Start: Name und Sprache ----------
function renderHome() {
  if (!S.onboarded) return renderWelcome();
  if (!S.langs.length) return renderAddLang(true);
  renderHomeView();
}
function renderWelcome() {
  app.replaceChildren(h(`
    <div class="welcome">
      <img src="icons/icon-192.png" alt="" width="72" height="72">
      <p class="eyebrow">Willkommen</p>
      <h1>Schön, dass du da bist!</h1>
      <form id="nameForm" class="panel">
        <label class="f">Wie heißt du?
          <input class="input" id="nameIn" autocomplete="given-name" maxlength="30" placeholder="Vorname oder Spitzname" value="${esc(S.name)}"></label>
        <button class="btn wide" type="submit">Weiter</button>
        <p class="muted small">Dein Name bleibt nur auf diesem Handy. Die App schickt ihn nirgendwohin.</p>
      </form>
      <button class="link" id="skip">Ohne Namen weiter</button>
    </div>`));
  const go = name => { S.name = name; S.onboarded = true; save(); renderHome(); };
  $("#nameForm").onsubmit = e => { e.preventDefault(); go($("#nameIn").value.trim().slice(0, 30)); };
  $("#skip").onclick = () => go("");
  setTimeout(() => $("#nameIn").focus(), 50);
}
function renderAddLang(first) {
  const taken = new Set(S.langs.map(l => l.name.toLowerCase()));
  app.replaceChildren(h(`
    ${first ? "" : `<div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Sprache hinzufügen</h2></div>`}
    ${first ? `<div class="welcome" style="padding-top:8px"><p class="eyebrow">${S.name ? `Hallo, ${esc(S.name)}!` : "Hallo!"}</p><h1>Welche Sprache lernst du?</h1></div>` : ""}
    <section class="panel">
      <div class="langgrid">${LANG_PRESETS.filter(x => !taken.has(x.name.toLowerCase())).map(x =>
        `<button class="langbtn" data-name="${esc(x.name)}" data-code="${x.code}"><span class="flag">${x.flag}</span>${esc(x.name)}</button>`).join("")}</div>
      <form id="customLang" class="row" style="flex-wrap:nowrap">
        <input class="input" id="customName" maxlength="24" placeholder="Andere Sprache …" aria-label="Andere Sprache">
        <button class="btn small" type="submit">Anlegen</button>
      </form>
      <p class="muted small">Jede Sprache bekommt ihren eigenen Kasten. ${first ? "Weitere Sprachen kannst du später oben über das + anlegen." : ""}</p>
    </section>`));
  if ($("#back")) $("#back").onclick = renderHome;
  const make = (name, code) => {
    const ex = S.langs.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (ex) S.cur = ex.id; else addLang(name, code, true);
    save(); toast(`${name} angelegt`); renderHome();
  };
  $$("[data-name]").forEach(b => b.onclick = () => make(b.dataset.name, b.dataset.code));
  $("#customLang").onsubmit = e => {
    e.preventDefault(); const n = $("#customName").value.trim();
    if (!n) { toast("Gib den Namen der Sprache ein"); return; }
    make(n.charAt(0).toUpperCase() + n.slice(1), "");
  };
}

// ---------- Der Karteikasten als Bild ----------
// Jedes Fach ist ein Abteil mit Trennkarte und Kartenstapel; der Stapel wächst mit der Wurzel der Anzahl.
function pileH(n, mini) { return n ? Math.min(mini ? 17 : 46, 3 + Math.round(Math.sqrt(n) * (mini ? 2.6 : 5))) : 0; }
function kastenHtml(counts, mini, label = "Karten pro Fach") {
  return `<div class="kasten${mini ? " mini" : ""}" role="img" aria-label="${label}: ${counts.map((n, i) => `${i ? "Fach " + i : "neu"} ${n}`).join(", ")}">${counts.map((n, i) =>
    `<div class="fach" data-f="${i}"><span class="tab">${i === 0 ? "neu" : i}</span><i class="pile" style="height:${pileH(n, mini)}px"></i><b class="cnt">${n}</b>
      ${mini ? "" : `<span class="when">${i === 0 ? "" : FACH_LABEL[i]}</span>`}</div>`).join("")}</div>`;
}
function setFach(f, delta, bump) {
  const el = $(`.kasten.mini [data-f="${f}"]`); if (!el) return;
  const b = $(".cnt", el), n = Math.max(0, +b.textContent + delta);
  b.textContent = n; $(".pile", el).style.height = pileH(n, true) + "px";
  if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
}
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// Die Karte kommt aus ihrem Fach geflogen ...
function liftCard(f) {
  const card = $("#icard"), src = $(`.kasten.mini [data-f="${f}"]`);
  if (src) src.classList.add("from");
  if (!card) return;
  if (!src || reduced() || !card.animate) { card.classList.add("pop"); return; }
  const a = src.getBoundingClientRect(), b = card.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
  card.animate([{ transform: `translate(${dx}px,${dy}px) scale(.1)`, opacity: 0 }, { transform: "translateY(-6px) scale(1.02)", opacity: 1, offset: .7 }, { transform: "none" }],
    { duration: 480, easing: "cubic-bezier(.2,.7,.3,1)" });
}
// ... und nach der Antwort in hohem Bogen in ihr neues Fach. Falsche Antworten wackeln erst und fliegen dann zurück.
function flyCard(from, to, ok, word) {
  const box = $(".kasten.mini"); if (!box) return;
  setFach(from, -1, false);
  const target = $(`[data-f="${to}"]`, box), card = $("#icard");
  const land = () => { setFach(to, 1, true); sound("land"); };
  if (reduced() || !card || !card.animate) return land();
  const a = card.getBoundingClientRect(), b = target.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + 70, dx = b.left + b.width / 2 - x0, dy = b.top + b.height * .35 - y0;
  const el = document.createElement("div");
  el.className = "flyer " + (ok ? "good" : "bad"); el.textContent = word; el.setAttribute("aria-hidden", "true");
  el.style.left = x0 + "px"; el.style.top = y0 + "px"; document.body.append(el);
  const T = (x, y, s, r) => ({ transform: `translate(-50%,-50%) translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)` });
  const kf = ok
    ? [T(0, 0, 1, 0), { ...T(dx * .45, dy * .5 - 80, .75, -14), offset: .55 }, T(dx, dy, .2, 0)]
    : [T(0, 0, 1, 0), { ...T(-12, 0, 1, -5), offset: .07 }, { ...T(12, 0, 1, 5), offset: .14 }, { ...T(-8, 0, 1, -3), offset: .21 }, { ...T(0, 0, 1, 0), offset: .28 },
       { ...T(dx * .5, dy * .5 - 40, .7, 12), offset: .65 }, T(dx, dy, .2, 0)];
  el.animate(kf, { duration: ok ? 650 : 950, easing: "cubic-bezier(.45,0,.25,1)" }).onfinish = () => { el.remove(); land(); };
}

// ---------- Startseite ----------
let confirmDelete = null;
function goalCount() { const d = dayLog(); return d.ans + d.gram; }
function ringHtml(n, goal) {
  const r = 34, c = +(2 * Math.PI * r).toFixed(1), f = Math.min(1, n / goal);
  return `<div class="ring${n >= goal ? " full" : ""}" role="img" aria-label="Tagesziel: ${Math.min(n, goal)} von ${goal} Antworten">
    <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="ring-bg"/><circle cx="40" cy="40" r="${r}" class="ring-fg" style="stroke-dasharray:${c};--off:${(c * (1 - f)).toFixed(1)}"/></svg>
    <span>${n >= goal ? "✓" : `${n}<small>/${goal}</small>`}</span></div>`;
}
function renderHomeView() {
  const qd = checkQuests(); if (qd.length) setTimeout(() => celebrate(`Tagesaufgabe geschafft: ${qd[0]}`), 400);
  const lang = L(), all = cardsL(), paused = lang.paused || [];
  const due = dueToday().length, nl = Math.min(newAllowed(), newCards().length), gd = gDue().length;
  const units = [...new Set(all.map(c => c.unit))];
  const dirs = [["de-en", `Deutsch → ${lang.name}`], ["en-de", `${lang.name} → Deutsch`], ["mix", "gemischt"]];
  const inputs = [["tiles", "Buchstaben und Sprechen"], ["keyboard", "Tastatur"]];
  const lv = levelOf(S.xp), todo = due + nl + gd;
  const placeU = units.find(u => !paused.includes(u) && canPlace(u));
  const parts = [due && `${due} ${due === 1 ? "Wiederholung" : "Wiederholungen"}`, nl && `${nl} neue ${nl === 1 ? "Wort" : "Wörter"}`, gd && `${gd} Grammatik`].filter(Boolean);
  const earned = BADGES.filter(b => S.badges[b[0]]);
  app.replaceChildren(h(`
    <div class="spread">
      <nav class="langs" aria-label="Sprachen">
        ${S.langs.map(l => `<button class="langflag" data-lang="${l.id}" aria-pressed="${l.id === S.cur}" title="${esc(l.name)}" aria-label="${esc(l.name)}">${flagOf(l)}</button>`).join("")}
        <button class="langflag add" id="addLang" title="Sprache hinzufügen" aria-label="Sprache hinzufügen">+</button>
      </nav>
      <div class="row" style="gap:6px;flex-wrap:nowrap">
        <button class="streak" id="cal" title="Übungskalender" aria-label="Übungskalender, ${liveStreak()} Tage am Stück">${ICON.flame}<span>${liveStreak()}</span></button>
        <button class="iconbtn" id="settings" aria-label="Einstellungen">${ICON.gear}</button>
      </div>
    </div>
    <header class="top">
      <div><p class="eyebrow">${S.name ? `Hallo, ${esc(S.name)}!` : "Vokabelkasten"}</p><h1>${esc(lang.name)}</h1></div>
      <button class="lvchip" id="lv" aria-label="Level ${lv}, Abzeichen ansehen"><span>Level ${lv}</span><i><b style="width:${levelPct(S.xp)}%"></b></i></button>
    </header>
    <section class="hero">
      <div class="herotop">${ringHtml(goalCount(), S.goal)}
        <div><b class="herotitle">${todo ? "Heute dran" : all.length ? "Heute alles geschafft!" : "Los geht's!"}</b>
          <span class="muted small">${todo ? parts.join(" · ") : all.length ? "Freies Üben geht immer. Was du dabei kannst, wartet wieder von vorn." : "Hol dir zuerst Vokabeln in deinen Kasten."}</span></div></div>
      <button class="btn big wide" id="go">${todo ? "Los geht's" : all.length ? "Freies Üben" : "Vokabeln hinzufügen"}</button>
      ${todo && all.length ? `<button class="link" id="free">Lieber frei üben</button>` : ""}
    </section>
    ${posCard()}
    ${counterCard()}
    ${placeU ? `<section class="panel place">
      <h3>Kannst du schon Wörter aus „${esc(placeU)}“?</h3>
      <p class="muted small">Beim Sortieren tippst du nur die richtige Bedeutung an. Was du schon kannst, fliegt gleich nach hinten. So lernst du nur, was wirklich neu ist.</p>
      <button class="btn ghost" data-place="${esc(placeU)}">Sortieren starten</button></section>` : ""}
    ${all.length ? `<section>
      <div class="spread"><h2>Dein Kasten</h2><span class="muted small">${all.length} Wörter</span></div>
      ${kastenHtml(levelCounts())}
      <p class="muted small">Richtig heißt mindestens ein Fach weiter, leichte Wörter springen auch weiter. Falsch heißt zwei Fächer zurück. Unter jedem Fach steht ungefähr, wann ein Wort daraus wieder drankommt.</p>
    </section>` : ""}
    ${monsterCard()}
    ${grammarCard()}
    ${questCard()}
    ${weltCard()}
    ${duelCard()}
    ${albumCard()}
    <section>
      <div class="spread"><h2>Abzeichen</h2><button class="link" id="badges">Alle ${BADGES.length} ansehen</button></div>
      <div class="badgerow">${earned.length ? earned.slice(-6).map(b => `<span class="bdg" title="${esc(b[2])}">${b[1]}</span>`).join("")
        : `<span class="muted small">Dein erstes Abzeichen bekommst du nach der ersten Runde.</span>`}</div>
    </section>
    <section>
      <div class="spread"><h2>Units</h2><button class="btn small" id="add">+ Vokabeln</button></div>
      <div class="units">${units.length ? units.map(u => {
        const cs = all.filter(c => c.unit === u); const sit = cs.filter(c => c.level >= 3).length;
        const pct = Math.round(sit / cs.length * 100), isP = paused.includes(u), fresh = cs.filter(c => c.level === 0).length;
        return `<div class="unit${isP ? " paused" : ""}">
          <div class="spread"><div><h3 style="overflow-wrap:anywhere">${esc(u)}</h3>
            <p class="muted small">${cs.length} Wörter · ${isP ? "pausiert" : `${pct} % sitzen (ab Fach 3)`}</p></div>
            ${u === SAMPLE_UNIT ? '<span class="tag">Beispiel</span>' : isP ? '<span class="tag soft">Pause</span>' : ""}</div>
          ${isP ? "" : `<div class="bar"><i style="width:${pct}%"></i></div>`}
          <div class="row">
            ${isP ? `<button class="btn small" data-unpause="${esc(u)}">Freischalten</button>`
              : `<button class="btn ghost small" data-test="${esc(u)}">Für den Test üben</button>${canPlace(u) ? `<button class="link" data-place="${esc(u)}">Sortieren</button>` : ""}`}
            <button class="link" data-share="${esc(u)}">Teilen</button>
            ${!isP && fresh ? `<button class="link" data-pause="${esc(u)}">Pausieren</button>` : ""}
            ${confirmDelete === u
              ? `<span class="small">Wirklich löschen?</span><button class="link" data-del-yes="${esc(u)}">Ja</button><button class="link" data-del-no>Nein</button>`
              : `<button class="link" data-del="${esc(u)}">Löschen</button>`}
          </div></div>`;
      }).join("") : `<div class="unit"><p><b>Noch keine Vokabeln für ${esc(lang.name)}.</b></p><p class="muted small">Tipp auf „Vokabeln“. Du kannst eine Buchseite fotografieren oder die Wörter eintippen.</p></div>`}</div>
      <p class="muted small">Pausierte Units liefern keine neuen Wörter. Schalte sie frei, wenn das Thema in der Schule drankommt.</p>
    </section>
    ${(() => { const n = tagCounts(), ts = Object.keys(n).filter(t => n[t] >= 3 && t !== "allgemein").sort((a, b) => n[b] - n[a]);
      const chips = l => `<div class="chips">${l.map(t => `<button class="chip" data-tag="${esc(t)}">${t.startsWith(WB) ? esc(t.slice(WB.length).replace(/-/g, " ")) : "#" + esc(t)} <span class="muted small">${n[t]}</span></button>`).join("")}</div>`;
      const wb = ts.filter(t => t.startsWith(WB)), th = ts.filter(t => !GRAM_TAGS.includes(t) && !t.startsWith(WB)), gr = ts.filter(t => GRAM_TAGS.includes(t));
      return ts.length ? `<details class="panel"><summary><b>Nach Thema üben</b></summary>
      ${th.length ? chips(th) : ""}${wb.length ? `<h3>Wordbanks aus dem Buch</h3>${chips(wb)}` : ""}${gr.length ? `<h3>Wortarten</h3>${chips(gr)}` : ""}
      <p class="muted small">Eine Runde nur mit Wörtern zu diesem Tag. Richtig: Das Wort bleibt im Fach, seine Wartezeit beginnt neu. Falsch: zwei Fächer zurück.</p></details>` : ""; })()}
    <details class="panel">
      <summary><b>So wirst du abgefragt</b></summary>
      <h3>Richtung</h3>
      <div class="chips">${dirs.map(([k, l]) => `<button class="chip" data-dir="${k}" aria-pressed="${lang.dir === k}">${l}</button>`).join("")}</div>
      <h3>Antworten mit</h3>
      <div class="chips">${inputs.map(([k, l]) => `<button class="chip" data-input="${k}" aria-pressed="${S.input === k}">${l}</button>`).join("")}</div>
      <p class="muted small">Buchstaben und Sprechen: Ins ${esc(lang.name)}e legst du das Wort aus Buchstaben, so übst du die Schreibweise. Ins Deutsche sagst du es ins Mikrofon oder drehst die Karte um.</p>
    </details>
  `));
  $("#go").onclick = () => todo ? startRound(null) : all.length ? startRound(FREE) : renderImport();
  if ($("#free")) $("#free").onclick = () => startRound(FREE);
  $("#add").onclick = () => renderImport();
  $("#settings").onclick = () => renderSettings();
  $("#cal").onclick = () => { renderCalendar(); scrollTo(0, 0); };
  $("#addLang").onclick = () => renderAddLang(false);
  $("#lv").onclick = $("#badges").onclick = () => renderBadges();
  if ($("#album")) $("#album").onclick = () => renderAlbum();
  $("#welt").onclick = () => renderWelt();
  if ($("#duelGo")) $("#duelGo").onclick = renderDuelSetup;
  if ($("#sprintGo")) $("#sprintGo").onclick = renderSprint;
  bindPos();
  save(); pauseNotice(); animateCounter(); if (!qd.length) setTimeout(checkMilestone, 600);
  if ($("#homePack")) $("#homePack").onclick = () => openPack();
  if ($("#gram")) $("#gram").onclick = () => renderGrammar();
  $$("[data-lang]").forEach(b => b.onclick = () => { S.cur = b.dataset.lang; confirmDelete = null; save(); renderHome(); });
  $$("[data-dir]").forEach(b => b.onclick = () => { lang.dir = b.dataset.dir; save(); keepScroll(renderHome); });
  $$("[data-input]").forEach(b => b.onclick = () => { S.input = b.dataset.input; save(); keepScroll(renderHome); });
  $$("[data-test]").forEach(b => b.onclick = () => startRound(b.dataset.test));
  $$("[data-tag]").forEach(b => b.onclick = () => startRound(TAG + b.dataset.tag));
  $$("[data-place]").forEach(b => b.onclick = () => startPlace(b.dataset.place));
  $$("[data-share]").forEach(b => b.onclick = () => renderShare(b.dataset.share));
  $$("[data-pause]").forEach(b => b.onclick = () => { lang.paused = [...paused, b.dataset.pause]; save(); keepScroll(renderHome); });
  $$("[data-unpause]").forEach(b => b.onclick = () => { lang.paused = paused.filter(u => u !== b.dataset.unpause); if (lang.upto) delete lang.upto[b.dataset.unpause]; save(); toast("Freigeschaltet. Die neuen Wörter kommen ab jetzt dran."); keepScroll(renderHome); });
  $$("[data-del]").forEach(b => b.onclick = () => { confirmDelete = b.dataset.del; keepScroll(renderHome); });
  $$("[data-del-no]").forEach(b => b.onclick = () => { confirmDelete = null; keepScroll(renderHome); });
  $$("[data-del-yes]").forEach(b => b.onclick = () => {
    const u = b.dataset.delYes; S.cards = S.cards.filter(c => !(c.lang === S.cur && c.unit === u));
    lang.paused = paused.filter(x => x !== u); confirmDelete = null; save(); keepScroll(renderHome); toast("Unit gelöscht");
  });
  if (!keepScroll.on) window.scrollTo(0, 0);
}
// Neu zeichnen, ohne nach oben zu springen
function keepScroll(f) { const y = scrollY; keepScroll.on = true; try { f(); } finally { keepScroll.on = false; } scrollTo(0, y); }

// ---------- Runde ----------
let R = null;
const FREE = "\u0000free", TAG = "\u0000tag:";
function startRound(unit) {
  let pick;
  if (unit === FREE) {
    const all = cardsL().filter(c => c.level || !isPaused(c));
    pick = shuffle([...all]).sort((a, b) => a.level - b.level).slice(0, Math.max(ROUND_SIZE, Math.ceil(all.length / 3)));
    pick = shuffle(pick).slice(0, ROUND_SIZE);
  } else if (unit && unit.startsWith(TAG)) {
    const t = unit.slice(TAG.length);
    pick = shuffle(cardsL().filter(c => (c.tags || []).includes(t) && (c.level || !isPaused(c)))).sort((a, b) => a.level - b.level).slice(0, 20);
    pick = shuffle(pick).slice(0, ROUND_SIZE);
  } else if (unit) {
    pick = shuffle(cardsL().filter(c => c.unit === unit)).slice(0, 20);
  } else {
    pick = dueToday().slice(0, ROUND_SIZE);
    if (pick.length < ROUND_SIZE) pick = pick.concat(newCards().slice(0, Math.min(newAllowed(), ROUND_SIZE - pick.length)));
    pick = shuffle(pick);
  }
  const items = pick.map(c => c.id);
  if (!unit) items.push(...grammarItems());
  if (!items.length) { toast("Noch keine Vokabeln vorhanden"); return; }
  R = { practice: !!unit, unit, queue: items, total: items.length, done: new Set(), first: {}, good: 0, last: Date.now(),
        combo: 0, best: 0, xp: 0, up: 0, down: 0, sat: 0, gram: {}, timer: 0, newBadges: [] };
  renderCard();
}
function dirFor() { const d = L().dir; return d === "mix" ? (Math.random() < .5 ? "de-en" : "en-de") : d; }
function roundHead() {
  const pct = Math.round(R.done.size / R.total * 100);
  return `<div class="progress"><button class="iconbtn" id="quit" aria-label="Runde beenden">${ICON.x}</button>
      <div class="bar"><i style="width:${pct}%"></i></div>
      ${R.combo >= 3 ? `<span class="combo" aria-label="${R.combo} richtig hintereinander">×${R.combo}</span>` : ""}
      <span class="small muted" style="font-variant-numeric:tabular-nums">${R.done.size}/${R.total}</span></div>
    ${R.practice ? "" : kastenHtml(levelCounts(), true)}`;
}
function bindQuit() { $("#quit").onclick = () => { clearTimeout(R.timer); stopListening(); tick(); save(); R = null; renderHome(); }; }

function renderCard() {
  tick(); clearTimeout(R.timer);
  if (!R.queue.length) return renderSummary();
  if (R.queue[0].startsWith("g|")) return renderRoundTask();
  const card = S.cards.find(c => c.id === R.queue[0]);
  if (!card) { R.queue.shift(); return renderCard(); }
  const dir = card.chk && !R.practice ? "de-en" : dirFor();   // Gekonnt einsortiert: einmal in die schwere Richtung prüfen
  const q = dir === "de-en" ? card.de : card.en;
  const sol = dir === "de-en" ? card.en : card.de;
  const lname = L().name;
  const qHot = dir === "en-de" && hotSpot(card, q);   // schwierige Schreibstelle im englischen Wort leuchtet mit
  const qHtml = qHot ? spellHtml(q, qHot, "spellq") : esc(q);
  const pool = cardsL().filter(c => c.id !== card.id);
  const fresh = !R.done.has(card.id) && !(card.id in R.first);
  const useChoice = card.level <= 1 && fresh && pool.length >= 3 && !R.practice;
  const mode = useChoice ? "choice" : S.input === "keyboard" ? "keyboard" : dir === "de-en" ? "tiles" : "speak";
  const label = R.unit === FREE ? " · Freies Üben" : R.unit && R.unit.startsWith(TAG) ? (R.unit.startsWith(TAG + WB) ? " · Wordbank " + esc(R.unit.slice((TAG + WB).length).replace(/-/g, " ")) : " · #" + esc(R.unit.slice(TAG.length))) : R.practice ? " · Testtraining" : "";
  app.replaceChildren(h(`${roundHead()}
    <div class="icard" id="icard">
      <div class="spread"><span class="eyebrow">${dir === "de-en" ? `Deutsch → ${esc(lname)}` : `${esc(lname)} → Deutsch`}${label}</span>
        ${dir === "en-de" && canHear() ? `<button class="speak" id="hear">${ICON.speaker}Anhören</button>` : ""}</div>
      ${card.level === 0 && fresh && !R.practice ? '<span class="newtag">Neues Wort</span>' : isMonster(card) ? `<span class="newtag montag">👾 Monster-Wort · noch ${Math.max(1, 3 - card.level)} ♥</span>` : ""}
      ${mode === "speak" ? `<div class="flip" id="flip"><div class="face front"><div class="q">${qHtml}</div></div><div class="face back"><div class="q">${esc(sol)}</div></div></div>`
        : `<div class="q">${qHtml}</div>`}
      <div id="answerArea"></div>
      <div id="fb"></div>
    </div>`));
  bindQuit();
  if ($("#hear")) $("#hear").onclick = () => say(card.en);
  if (dir === "en-de" && canHear() && !useChoice) say(card.en);
  liftCard(card.level);
  const area = $("#answerArea");
  const done = (result, typed) => answered(card, result, sol, dir, typed);
  if (mode === "choice") {
    const opts = choiceOpts(card, sol, dir, pool);
    area.replaceChildren(h(`<div class="choices">${opts.map((o, i) => `<button class="choice" data-i="${i}">${esc(o)}</button>`).join("")}</div>`));
    $$(".choice", area).forEach(b => b.onclick = () => {
      const ok = opts[+b.dataset.i] === sol;
      $$(".choice", area).forEach(x => { if (opts[+x.dataset.i] === sol) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      done(ok ? "good" : "bad", ok ? "" : opts[+b.dataset.i]);
    });
  } else if (mode === "tiles") tilesUi(area, sol, card.level, done);
  else if (mode === "speak") speakUi(area, sol, done);
  else keyboardUi(area, sol, dir, done);
}

// Deutsch → Englisch: Das Wort wird aus Buchstaben-Kacheln gelegt. Leerzeichen, Satzzeichen und ein "to" am Anfang stehen schon da.
function tileTarget(sol) { return sol.split(/\s*[,;]\s*|\s+\/\s+/)[0].replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim() || sol.trim(); }
const DECOYS = "eaiotnsrhldcumwfgypbvk";
// Fehlerfallen: Buchstaben, die deutsche Kinder an dieser Stelle gern verwechseln (friend → i/e, yes → j, very → w).
// Höchstens die Hälfte der Extra-Kacheln sind Fallen, damit ein ähnlicher Buchstabe nicht immer falsch ist.
const TRAPS = [[/e/, "i"], [/i/, "e"], [/y/, "i"], [/y/, "j"], [/a/, "e"], [/u/, "a"], [/o/, "u"], [/w/, "v"], [/v/, "w"], [/c/, "k"], [/k/, "c"],
  [/th/, "d"], [/th/, "s"], [/sh/, "c"], [/ch/, "s"], [/ph/, "f"], [/qu/, "k"], [/s/, "z"], [/z/, "s"], [/er\b/, "a"], [/ou/, "a"]];
function trapLetters(word) {
  const w = word.toLowerCase(), out = [];
  TRAPS.forEach(([re, ch]) => { if (re.test(w) && !out.includes(ch)) out.push(ch); });
  return out;
}
function tilesUi(area, sol, level, done) {
  const target = tileTarget(sol);
  let pre = "", body = target;
  if (isEn() && /^to [^ ]/.test(body)) { pre = "to"; body = body.slice(3); }
  const chars = [...body], isLetter = ch => /\p{L}/u.test(ch);
  const letters = chars.filter(isLetter);
  if (letters.length > 22) return keyboardUi(area, sol, "de-en", done);
  const n = level >= 4 ? 4 : 2, decoys = shuffle(isEn() ? trapLetters(body) : []).slice(0, Math.ceil(n / 2));
  while (decoys.length < n) { const d = pick([...DECOYS]); if (!decoys.includes(d)) decoys.push(d); }
  const pool = shuffle([...letters, ...decoys]).map(ch => ({ ch, used: false }));
  const holes = letters.length, filled = [];
  let fresh = -1;
  const draw = () => {
    let fi = 0;
    const words = [[]];
    if (pre) words[0].push(`<span class="lfix">${pre}</span>`), words.push([]);
    chars.forEach(ch => {
      if (ch === " ") { words.push([]); return; }
      const w = words[words.length - 1];
      if (!isLetter(ch)) { w.push(`<span class="lfix">${esc(ch)}</span>`); return; }
      const k = fi++, pi = filled[k];
      w.push(pi === undefined ? `<span class="lslot${k === filled.length ? " cur" : ""}"></span>`
        : `<button class="lslot full${k === fresh ? " just" : ""}" data-back="${k}" aria-label="${esc(pool[pi].ch)} entfernen">${esc(pool[pi].ch)}</button>`);
    });
    area.replaceChildren(h(`<div class="letters" aria-label="Dein Wort">${words.filter(w => w.length).map(w => `<span class="lword">${w.join("")}</span>`).join("")}</div>
      <div class="lpool">${pool.map((p, i) => `<button class="ltile" data-take="${i}" ${p.used ? "disabled" : ""}>${esc(p.ch)}</button>`).join("")}</div>
      <div class="row lrow"><button class="link" id="lback" ${filled.length ? "" : "disabled"}>⌫ Zurück</button><button class="link" id="lgive">Weiß ich nicht</button></div>`));
    $$("[data-take]", area).forEach(b => b.onclick = () => {
      const i = +b.dataset.take; if (pool[i].used || filled.length >= holes) return;
      pool[i].used = true; filled.push(i); fresh = filled.length - 1; sound("tap"); draw();
      if (filled.length === holes) finish();
    });
    $$("[data-back]", area).forEach(b => b.onclick = () => { const k = +b.dataset.back; pool[filled[k]].used = false; filled.splice(k, 1); fresh = -1; draw(); });
    $("#lback").onclick = () => { if (!filled.length) return; pool[filled.pop()].used = false; fresh = -1; draw(); };
    $("#lgive").onclick = () => done("bad", "");
  };
  const finish = () => {
    let fi = 0;
    const typed = (pre ? pre + " " : "") + chars.map(ch => isLetter(ch) ? pool[filled[fi++]].ch : ch).join("");
    done(norm(typed) === norm(target) ? "good" : check(typed, sol), typed);
  };
  draw();
}

// Englisch → Deutsch: sagen statt tippen. Klappt das Mikrofon nicht, wird die Karte umgedreht und selbst bewertet.
function deForms(sol) {
  const out = new Set();
  [sol, sol.replace(/\([^)]*\)/g, ""), sol.replace(/[()]/g, "")].forEach(b => alts(b).forEach(a => {
    a = a.replace(/[.!?]/g, "").trim(); out.add(a); out.add(a.replace(/^(der|die|das|ein|eine|sich)\s+/, ""));
  }));
  return [...out].filter(Boolean);
}
function checkSpoken(heard, sol) {
  const x = norm(heard).replace(/[.,!?]/g, ""), xs = x.replace(/^(der|die|das|ein|eine|einen|sich)\s+/, "");
  return deForms(sol).some(o => o === x || o === xs || (o.length >= 5 && lev(xs, o) <= 1) || (o.length >= 3 && ` ${x} `.includes(` ${o} `)));
}
function speakUi(area, sol, done) {
  let turned = false;
  const turn = () => {
    if (turned) return; turned = true;
    stopListening();
    $("#flip").classList.add("turned"); sound("flip");
    area.replaceChildren(h(`<p class="muted small" style="text-align:center">Wusstest du es?</p>
      <div class="choices"><button class="choice yes" id="yes">✓ Gewusst</button><button class="choice no" id="no">✗ Nicht gewusst</button></div>`));
    $("#yes").onclick = () => done("good", "");
    $("#no").onclick = () => done("bad", "");
  };
  area.replaceChildren(h(`<div class="speakbox">
    ${SR ? `<button class="bigmic" id="bigmic">${ICON.mic}<span>Sag es auf Deutsch</span></button><p class="muted small" id="heard" aria-live="polite"></p>` : ""}
    <button class="btn ${SR ? "ghost " : ""}wide" id="turn">Karte umdrehen</button></div>`));
  $("#turn").onclick = turn;
  $("#flip").onclick = turn;
  if (SR) $("#bigmic").onclick = () => listenDe(sol, (ok, heard) => {
    if (ok) { $("#flip").classList.add("turned"); done("good", heard); }
    else $("#heard").textContent = heard ? `Ich habe „${heard}“ verstanden. Sag es noch einmal oder dreh die Karte um.` : "Nichts gehört. Tipp noch einmal aufs Mikrofon.";
  }, turn);
}
function listenDe(sol, cb, fallback) {
  if (rec) { stopListening(); return; }
  const mic = $("#bigmic");
  rec = new SR(); rec.lang = "de-DE"; rec.interimResults = false; rec.maxAlternatives = 5;
  mic.classList.add("listening");
  rec.onresult = e => {
    const heard = [...e.results[0]].map(a => a.transcript.trim());
    const hit = heard.find(a => checkSpoken(a, sol));
    cb(!!hit, hit || heard[0] || "");
  };
  rec.onerror = e => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") { toast("Das Mikrofon ist nicht freigegeben. Dreh die Karte um."); fallback(); }
    else if (e.error === "no-speech") cb(false, "");
    else if (e.error !== "aborted") { toast("Die Spracheingabe hat nicht geklappt."); fallback(); }
  };
  rec.onend = () => { rec = null; mic.classList.remove("listening"); };
  try { rec.start(); } catch (e) { stopListening(); fallback(); }
}

// Tastatur, wie früher: tippen oder mit dem Mikrofon sprechen bzw. buchstabieren
function keyboardUi(area, sol, dir, done) {
  const lname = L().name, lang = dir === "de-en" ? L().code : "de-DE";
  const mic = SR && !!lang, spellOk = /^(en|de)/.test(lang);
  area.replaceChildren(h(`<form id="f" autocomplete="off">
    <div class="answerRow">
      <input class="answer" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"
        placeholder="${dir === "de-en" ? `auf ${esc(lname)} …` : "auf Deutsch …"}" aria-label="Deine Antwort">
      ${mic ? `<button type="button" class="mic" id="mic" aria-label="${S.speechMode === "spell" && spellOk ? "Buchstabieren" : "Sprechen"}">${ICON.mic}</button>` : ""}
    </div>
    ${mic && spellOk ? `<div class="speechModes" style="margin-top:8px">Mikrofon:
      <button type="button" class="chip" data-sm="say" aria-pressed="${S.speechMode === "say"}">Wort sagen</button>
      <button type="button" class="chip" data-sm="spell" aria-pressed="${S.speechMode === "spell"}">Buchstabieren</button></div>`
      : mic ? ""
      : `<p class="hint" style="margin-top:8px">Tipp: Mit dem Mikrofon der Handy-Tastatur kannst du auch sprechen.</p>`}
    <button class="btn wide" type="submit" style="margin-top:12px">Prüfen</button></form>`));
  const inp = $("#ans");
  if (!mic) setTimeout(() => inp.focus({ preventScroll: true }), 50);
  $$("[data-sm]", area).forEach(b => b.onclick = () => {
    S.speechMode = b.dataset.sm; save();
    $$("[data-sm]", area).forEach(x => x.setAttribute("aria-pressed", x === b));
  });
  if (mic) $("#mic").onclick = () => listen(inp, sol, lang, spellOk);
  $("#f").onsubmit = e => {
    e.preventDefault(); if (!inp.value.trim()) return;
    stopListening();
    inp.disabled = true; $$("button", e.target).forEach(b => b.hidden = true); $(".speechModes") && ($(".speechModes").hidden = true);
    done(check(inp.value, sol), inp.value);
  };
}

let rec = null;
function stopListening() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } $$("#mic, #bigmic").forEach(m => m.classList.remove("listening")); }
function listen(inp, sol, lang, spellOk) {
  if (rec) { stopListening(); return; }
  const mic = $("#mic");
  rec = new SR(); rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 5;
  mic.classList.add("listening");
  rec.onresult = e => {
    const alts = [...e.results[0]].map(a => a.transcript);
    let text;
    if (S.speechMode === "spell" && spellOk) text = spellToWord(alts[0], lang);
    else text = alts.find(a => check(a, sol) === "good") || alts[0];
    inp.value = text.trim();
  };
  rec.onerror = e => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("Das Mikrofon ist nicht freigegeben. Erlaube es in den Browser-Einstellungen.");
    else if (e.error === "no-speech") toast("Nichts gehört. Tipp noch einmal aufs Mikrofon.");
    else if (e.error !== "aborted") toast("Die Spracheingabe hat nicht geklappt.");
  };
  rec.onend = () => { rec = null; mic.classList.remove("listening"); if (inp.value) inp.focus({ preventScroll: true }); };
  try { rec.start(); } catch (e) { stopListening(); }
}

function markDiff(input, sol) {
  const a = norm(input); let out = "", j = 0;
  for (let i = 0; i < sol.length; i++) {
    const ch = sol[i];
    if (a[j] !== undefined && a[j] === ch.toLowerCase()) { out += esc(ch); j++; }
    else { out += `<mark>${esc(ch)}</mark>`; if (a.length > sol.length) j++; }
  }
  return out;
}
function aiQuestion(card) {
  const n = L().name;
  return `Erkläre einem Kind aus der 5. Klasse kurz das Wort „${card.en}“ (${n}, auf Deutsch: ${card.de}). Gib eine einfache Erklärung, zwei kurze Beispielsätze auf ${n} mit Übersetzung und eine Eselsbrücke zum Merken. Antworte auf Deutsch.`;
}
// Eselsbrücke passend zum Fehler: Schreibfehler → Schreibweise, falsches Wort gewählt → Verwechslung, gar nicht gewusst → Bedeutung.
function pickMnemonic(card, result, typed, dir) {
  const m = card.mn; if (!m || result === "good") return null;
  const by = k => m.filter(x => x[0] === k);
  const t = norm(typed || "");
  const vs = t && by("v").find(x => x[3] && alts(x[3]).includes(t));
  if (vs) return vs;
  const spelling = dir === "de-en" && t && (result === "near" || lev(t, norm(tileTarget(card.en))) <= 3);
  return (spelling ? by("s")[0] : null) || by("b")[0] || by("s")[0] || by("v")[0] || null;
}
// Schwierige Stelle der Schreibweise: der fett markierte Teil der Schreib-Eselsbrücke, der im Wort vorkommt (gr**e**y → "e").
function hotSpot(card, word) {
  const s = card.mn && card.mn.find(x => x[0] === "s"); if (!s || !word) return null;
  const w = word.toLowerCase();
  for (const [, b] of s[2].matchAll(/\*\*(.+?)\*\*/g)) {
    const k = b.toLowerCase(), at = w.indexOf(k);
    if (at >= 0 && k.length < w.length) return { at, len: k.length };
  }
  return null;
}
function spellHtml(word, hot, cls = "mword") {
  return `<span class="${cls}">${[...word].map((ch, i) => `<span class="${hot && i >= hot.at && i < hot.at + hot.len ? "hot" : ""}" style="--d:${i}">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</span>`;
}
function mnemonicHtml(x, word) {
  const fr = x[1].split("|");
  const spell = x[0] === "s" && word ? spellHtml(word, hotSpot({ mn: [x] }, word)).replace("<span", '<span aria-hidden="true"') : "";
  return `<div class="mnemo"><span class="mnemo-pic" aria-hidden="true" data-frames="${esc(x[1])}">${esc(fr[0])}</span>
    <span><b class="mnemo-k">Eselsbrücke</b>${spell}${gmark(x[2])}</span></div>`;
}
function answered(card, result, sol, dir, typed) {
  tick();
  $$("#answerArea button, #answerArea input").forEach(x => x.disabled = true);
  const firstTime = !(card.id in R.first), from = card.level;
  const dl = dayLog(); dl.ans++; if (result !== "bad") dl.right++;
  if (firstTime && !R.practice) delete card.chk;
  if (firstTime) { R.first[card.id] = result; if (result !== "bad") R.good++; if (!R.practice) grade(card, result); else if (card.level > 0) { if (result === "bad") grade(card, "bad"); else if (result === "good") rest(card); } }
  // Beim freien Üben: falsch rutscht zwei Fächer zurück, richtig bleibt im Fach und die Wartezeit beginnt von vorn.
  const to = card.level, moved = firstTime && !R.practice, slipped = firstTime && R.practice && to < from, rested = firstTime && R.practice && result === "good" && to > 0;
  R.queue.shift();
  if (result === "bad") R.queue.splice(Math.min(R.queue.length, 3), 0, card.id);   // kommt in dieser Runde gleich noch einmal
  else R.done.add(card.id);
  if (result === "bad") { R.combo = 0; card.miss = (card.miss || 0) + 1; }
  else if (firstTime) { R.combo++; R.best = Math.max(R.best, R.combo); }
  if (moved && from < 3 && to >= 3) { R.sat++; dl.sat = (dl.sat || 0) + 1; }
  if (moved && to > from && result === "good") dl.up = (dl.up || 0) + 1;
  monsterHit(card, from, to, result, moved);
  if (result !== "bad" && firstTime) dl.combo = Math.max(dl.combo || 0, R.combo);
  if (moved) { if (to > from && result === "good") R.up++; else if (to < from) R.down++; flyCard(from, to, result !== "bad", card.en); }
  sound(result === "bad" ? "bad" : "good");
  const where = slipped ? `Zurück in Fach ${to}, kommt morgen wieder.` : rested ? `Bleibt in Fach ${to}, kommt ${whenText(card)} wieder.` : !moved ? "" : from === 0 ? `Ab in Fach ${to}, kommt ${whenText(card)} wieder.`
    : to > from ? `Weiter in Fach ${to}, kommt ${whenText(card)} wieder.` : to < from ? `Zurück in Fach ${to}, kommt morgen wieder.` : `Bleibt in Fach ${to}, kommt ${whenText(card)} wieder.`;
  const msg = result === "good" ? ["good", pick(["Richtig!", "Super!", "Genau!", "Stark!"]), ""]
    : result === "near" ? ["near", "Fast!", `Achte auf die Schreibweise: <span class="sol">${typed ? markDiff(typed, sol) : esc(sol)}</span>`]
    : ["bad", "Noch nicht.", `Richtig ist: <span class="sol">${esc(sol)}</span><span class="small">Das Wort kommt in dieser Runde gleich noch einmal.</span>`];
  const mn = pickMnemonic(card, result, typed, dir);
  const hot = dir === "de-en" && hotSpot(card, sol);
  if (hot && result === "bad") msg[2] = msg[2].replace(`<span class="sol">${esc(sol)}</span>`, spellHtml(sol, hot, "sol mword"));
  if (hot && result === "good" && !mn) msg[2] = `Merk dir die Stelle: ${spellHtml(sol, hot, "sol mword")}`;
  const bot = BOTS[S.bot] || BOTS.chatgpt;
  $("#fb").replaceChildren(h(`<div class="feedback ${msg[0]}"><strong>${msg[1]}</strong>${msg[2] ? `<span class="fbtext">${msg[2]}</span>` : ""}
      ${where ? `<span class="fachinfo">${where}</span>` : ""}
      ${mn ? mnemonicHtml(mn, tileTarget(card.en)) : ""}
      ${card.ex ? `<div class="extra"><i>${esc(card.ex)}</i></div>` : ""}
      <div class="row">${canHear() ? `<button class="speak" id="say2">${ICON.speaker}${esc(card.en)}</button>` : ""}
      ${S.aiHelp ? `<a class="speak" id="ask" href="${esc(bot.url(aiQuestion(card)))}" target="_blank" rel="noopener">Frag ${esc(bot.name)}</a>` : ""}</div></div>
    <button class="btn wide${result === "good" ? " auto" : ""}" id="next" style="margin-top:12px">Weiter</button>`));
  if (canHear()) { $("#say2").onclick = () => say(card.en); if (result !== "bad") say(card.en); }
  playMnemo($("#fb"));
  if ($("#ask") && bot.copyFirst) $("#ask").onclick = () => { copyText(aiQuestion(card)); toast("Frage kopiert. Füge sie im Chat ein."); };
  addXp(result === "bad" ? 0 : !firstTime ? 4 : (result === "good" ? 10 : 6) + (result === "good" ? Math.min(R.combo - 1, 5) * 2 : 0));
  checkGoal(); checkBadges();
  save();
  nextButton(result === "good");
}
// Nach einer richtigen Antwort geht es von selbst weiter; wer in die Rückmeldung tippt, hält an.
function nextButton(auto) {
  const nx = $("#next"); nx.focus({ preventScroll: true }); nx.onclick = renderCard;
  if (!auto) return;
  R.timer = setTimeout(renderCard, 1700);
  $(".feedback").addEventListener("click", () => { clearTimeout(R.timer); nx.classList.remove("auto"); });
}
function renderRoundTask() {
  const item = R.queue[0], [, id, ti] = item.split("|"), d = gData(), t = d && d.topics.find(x => x.id === id), task = t && t.tasks[+ti];
  if (!task) { R.queue.shift(); R.total--; return renderCard(); }
  app.replaceChildren(h(`${roundHead()}
    <div class="icard pop" id="icard"><span class="eyebrow">Grammatik-Kasten · ${esc(t.t)}</span>
      <div class="gq">${taskQuestion(task)}</div><div id="answerArea"></div><div id="fb"></div></div>`));
  bindQuit();
  drawTask(task, $("#answerArea"), (ok, full, why) => {
    tick();
    const first = !(item in R.first);
    dayLog().gram++;
    if (first) { R.first[item] = ok; if (ok) R.good++; R.gram[id] = (R.gram[id] || 0) + (ok ? 0 : 1); }
    R.queue.shift();
    if (ok) { R.done.add(item); if (first) { R.combo++; R.best = Math.max(R.best, R.combo); } }
    else { R.combo = 0; R.queue.splice(Math.min(R.queue.length, 3), 0, item); }
    sound(ok ? "good" : "bad");
    $("#fb").replaceChildren(h(taskFeedback(ok, full, why, t) + `<button class="btn wide${ok ? " auto" : ""}" id="next" style="margin-top:12px">Weiter</button>`));
    bindSay($("#fb"));
    if ($("#say2")) $("#say2").onclick = () => say(full);
    addXp(ok ? (first ? 10 : 4) : 0);
    checkGoal(); checkBadges(); save();
    nextButton(ok);
  });
}
function renderSummary() {
  tick();
  R.finished = true;
  const gl = Object.entries(R.gram).map(([id, err]) => gMove(id, err <= G_MAX_ERR)).filter(Boolean);
  const n = R.total, g = R.good, lv = levelOf(S.xp);
  const earned = R.total >= 5 && !R.packed; if (earned) { R.packed = true; S.packQ.push(makePack(R)); }
  if (R.total >= 5 && g === n) dayLog().perfect = 1;
  if (R.unit && R.unit.startsWith(TAG)) dayLog().tag = 1;
  const doneQ = checkQuests();
  checkBadges(); save();
  const what = R.unit === FREE || (R.unit && R.unit.startsWith(TAG)) ? "Übungsrunde geschafft" : R.practice ? "Testtraining geschafft" : "Runde geschafft";
  app.replaceChildren(h(`<div class="done">
    <p class="eyebrow">${what}</p>
    <div class="score">${g}/${n}</div>
    <p>${g === n ? (S.name ? `Stark, ${esc(S.name)}! Alles beim ersten Versuch gewusst.` : "Alles beim ersten Versuch gewusst.") : "beim ersten Versuch gewusst. Die anderen hast du am Ende auch geschafft."}</p>
    ${R.practice ? '<p class="muted small">Beim freien Üben und beim Testtraining bleiben richtige Wörter in ihrem Fach, ihre Wartezeit beginnt neu. Falsche rutschen zwei Fächer zurück und kommen morgen wieder.</p>'
      : `<div class="moves">${R.up ? `<span class="up">${R.up} ${R.up === 1 ? "Karte" : "Karten"} nach hinten</span>` : ""}${R.down ? `<span class="down">${R.down} zurück</span>` : ""}</div>
         ${kastenHtml(levelCounts())}`}
    ${monsterSummary()}
    ${gl.map(x => `<p class="small">${x}</p>`).join("")}
    ${doneQ.map(q => `<p class="questdone">✓ Tagesaufgabe geschafft: ${esc(q)}</p>`).join("")}
    ${weltNew() || weltDistrictNew() || treasureReady() ? `<button class="packbtn welt" id="toWelt" type="button"><span class="weltmini" aria-hidden="true">${SKYLINE}</span><span><b>${weltDistrictNew() ? "Ein neues Viertel in Camden!" : weltNew() ? (weltNew() === 1 ? "Ein neues Haus in Camden!" : weltNew() + " neue Häuser in Camden!") : "🎁 In Camden ist ein Schatz versteckt!"}</b><span class="small">${weltNew() || weltDistrictNew() ? "Antippen und zuschauen, wie es wächst" : "Folge dem Lichtstrahl und tipp ihn an"}</span></span></button>` : ""}
    ${earned ? `<button class="packbtn" id="openPack" type="button"><span class="pack mini" aria-hidden="true"><i></i></span><span><b>${S.packQ.length > 1 ? S.packQ.length + " Sticker-Päckchen!" : "Neues Sticker-Päckchen!"}</b><span class="small">Antippen und aufreißen</span></span></button>` : ""}
    <div class="xpline"><b>+${R.xp} Punkte</b><span class="lvchip static"><span>Level ${lv}</span><i><b style="width:${levelPct(S.xp)}%"></b></i></span></div>
    ${R.newBadges.length ? `<div class="newbadges">${R.newBadges.map(b => `<div class="badge got"><span>${b.icon}</span><b>${esc(b.name)}</b></div>`).join("")}</div>` : ""}
    <button class="streak" id="toCal">${ICON.flame}<span>${liveStreak()} ${liveStreak() === 1 ? "Tag" : "Tage"} am Stück · heute ${fmtMin(dayLog().sec)}</span></button>
    <div class="row" style="justify-content:center"><button class="btn" id="again">Noch eine Runde</button><button class="btn ghost" id="home">Fertig</button></div>
  </div>`));
  if ((g === n && n >= 5) || R.newBadges.length || (R.mon || []).some(x => x.slain)) confetti();
  setTimeout(checkMilestone, 1200);
  const unit = R.practice ? R.unit : null;
  $("#again").onclick = () => startRound(unit === null && !dueToday().length && !Math.min(newAllowed(), newCards().length) && !gDue().length ? FREE : unit);
  $("#home").onclick = () => { R = null; renderHome(); };
  if ($("#openPack")) $("#openPack").onclick = () => { R = null; openPack(); };
  if ($("#toWelt")) $("#toWelt").onclick = () => { R = null; renderWelt(); };
  $("#toCal").onclick = () => { R = null; renderCalendar(); scrollTo(0, 0); };
  window.scrollTo(0, 0);
}

// ---------- Wie weit seid ihr im Buch? Nur was schon dran war, wird abgefragt ----------
// L().pos = { u, n }: In Unit u sind die ersten n Wörter frei, alle Units davor auch (außer übersprungene), alle danach warten.
// L().paused: gesperrte Units, L().upto[u]: Anzahl freier Wörter in einer halb freien Unit, L().skip: Units, die die Lehrerin auslässt.
let ordCache = null;
function unitList() { return [...new Set(cardsL().map(c => c.unit))]; }
function unitCards(u) { return cardsL().filter(c => c.unit === u); }
function ordOf(c) {
  const key = S.cur + ":" + S.cards.length;
  if (!ordCache || ordCache.key !== key) { const m = new Map(), n = {}; cardsL().forEach(x => { n[x.unit] = n[x.unit] || 0; m.set(x.id, n[x.unit]++); }); ordCache = { key, m }; }
  return ordCache.m.get(c.id) ?? 0;
}
function isPaused(c) {
  const l = L(); if ((l.paused || []).includes(c.unit)) return true;
  const n = l.upto && l.upto[c.unit];
  return n != null && ordOf(c) >= n;
}
// Neue Wörter: zuerst aus der Unit, die in der Schule gerade dran ist, dann der Rest der Reihe nach
function newCards() {
  const cs = cardsL().filter(c => c.level === 0 && !isPaused(c)), u = L().pos && L().pos.u;
  return u ? cs.filter(c => c.unit === u).concat(cs.filter(c => c.unit !== u)) : cs;
}
function setPos(u, n) {
  const l = L(), us = unitList(), i = us.indexOf(u), len = unitCards(u).length, before = newCards().length;
  n = Math.max(0, Math.min(n, len));
  l.skip = (l.skip || []).filter(x => x !== u);
  l.pos = { u, n }; l.upto = {}; l.paused = [];
  us.forEach((x, j) => { if (j > i || (j < i && l.skip.includes(x))) l.paused.push(x); });
  if (n < len) l.upto[u] = n;
  save();
  return newCards().length - before;
}
function posLabel() {
  const p = L().pos; if (!p) return "";
  const cs = unitCards(p.u); if (!cs.length) return "";
  if (p.n >= cs.length) return `${p.u}, ganz`;
  if (!p.n) return `${p.u}, noch nichts`;
  const c = cs[p.n - 1];
  return c.part ? `${p.u}, Teil ${c.part}` : `${p.u}, bis „${c.en}“`;
}
// Ein Teil weiter: bis zum Ende des nächsten Buch-Teils, ohne Teile zehn Wörter weiter, am Ende in die nächste Unit
function stepPos() {
  const l = L(), p = l.pos; if (!p) return 0;
  let u = p.u, n = p.n, cs = unitCards(u);
  if (n >= cs.length) {
    const us = unitList(), nx = us.slice(us.indexOf(u) + 1).find(x => !(l.skip || []).includes(x));
    if (!nx) { toast("Das war die letzte Unit."); return 0; }
    u = nx; n = 0; cs = unitCards(u);
  }
  if (cs[n] && cs[n].part) { const pt = cs[n].part; while (n < cs.length && cs[n].part === pt) n++; }
  else n = Math.min(cs.length, n + 10);
  return setPos(u, n);
}
function posCard() {
  if (!cardsL().length) return "";
  const lbl = posLabel();
  return `<section class="panel pos"><div class="spread"><div><span class="eyebrow">Wir sind bei</span><br><b>${lbl ? esc(lbl) : "Noch nicht eingestellt"}</b></div>
      <button class="link" id="posEdit">${lbl ? "ändern" : "einstellen"}</button></div>
    ${lbl ? `<button class="btn ghost small" id="posStep">Ein Teil weiter</button>` : ""}
    <p class="muted small">Abgefragt wird nur, was in der Schule schon dran war.</p></section>`;
}
function bindPos() {
  if ($("#posEdit")) $("#posEdit").onclick = () => renderPos(L().pos && L().pos.u);
  if ($("#posStep")) $("#posStep").onclick = () => { const k = stepPos(); toast(`${posLabel()} ist frei${k > 0 ? `, ${k} neue Wörter` : ""}.`); keepScroll(renderHome); };
}
function renderPos(openU) {
  const l = L(), us = unitList(), p = l.pos;
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Wie weit seid ihr?</h2></div>
    <p class="muted">Tipp an, was in der Schule zuletzt dran war: eine ganze Unit, einen Teil oder ein einzelnes Wort. Alles davor wird frei, alles danach wartet.</p>
    ${us.map(u => {
      const cs = unitCards(u), sk = (l.skip || []).includes(u), lock = (l.paused || []).includes(u);
      const n = lock ? 0 : l.upto && l.upto[u] != null ? l.upto[u] : cs.length;
      const parts = [...new Set(cs.map(c => c.part).filter(Boolean))];
      return `<details class="panel posunit"${u === openU ? " open" : ""}><summary><b>${esc(u)}</b>
          <span class="tag${n && !sk ? "" : " soft"}">${sk ? "fällt aus" : n >= cs.length ? "frei" : n ? `${n} von ${cs.length}` : "noch nicht"}</span>${p && p.u === u ? ' <span class="tag">hier seid ihr</span>' : ""}</summary>
        <div class="row"><button class="btn small" data-pall="${esc(u)}">Ganze Unit war dran</button>
          <button class="link" data-pskip="${esc(u)}">${sk ? "Kommt doch dran" : "Lässt die Lehrerin aus"}</button></div>
        ${parts.length > 1 ? `<h3>Bis zu diesem Teil</h3><div class="chips">${parts.map(pt => `<button class="chip" data-ppart="${esc(pt)}" data-u="${esc(u)}">${esc(pt)}</button>`).join("")}</div>` : ""}
        <h3>Bis zu diesem Wort</h3>
        <div class="poswords">${cs.map((c, i) => `${c.part && (!i || cs[i - 1].part !== c.part) ? `<span class="pwpart">${esc(c.part)}</span>` : ""}<button class="pw${i < n && !sk ? " on" : ""}" data-pw="${i}" data-u="${esc(u)}">${esc(c.en)}</button>`).join("")}</div>
      </details>`; }).join("")}
    <button class="btn wide" id="done">Fertig</button>`));
  const after = (u, k) => { toast(`${posLabel()} ist frei${k > 0 ? `, ${k} neue Wörter` : ""}.`); keepScroll(() => renderPos(u)); };
  $("#back").onclick = $("#done").onclick = () => renderHome();
  $$("[data-pall]").forEach(b => b.onclick = () => { const u = b.dataset.pall; after(u, setPos(u, unitCards(u).length)); });
  $$("[data-ppart]").forEach(b => b.onclick = () => { const u = b.dataset.u, cs = unitCards(u); let i = cs.length; while (i > 0 && cs[i - 1].part !== b.dataset.ppart) i--; after(u, setPos(u, i)); });
  $$("[data-pw]").forEach(b => b.onclick = () => { const u = b.dataset.u; after(u, setPos(u, +b.dataset.pw + 1)); });
  $$("[data-pskip]").forEach(b => b.onclick = () => {
    const u = b.dataset.pskip, sk = new Set(l.skip || []);
    sk.has(u) ? sk.delete(u) : sk.add(u); l.skip = [...sk];
    if (l.pos && l.pos.u !== u) { const s2 = l.skip; setPos(l.pos.u, l.pos.n); l.skip = s2; save(); }
    keepScroll(() => renderPos(u));
  });
  if (!keepScroll.on) window.scrollTo(0, 0);
}

// ---------- Schnell-Sortieren: Was schon sitzt, wird nicht neu gelernt ----------
// Englisches Wort, vier deutsche Antworten. Schnell richtig = kann ich, langsam richtig = unsicher, sonst neu lernen.
// Erst eine Stichprobe von 20 Wörtern: Sitzt fast alles, gilt die ganze Unit als gekonnt.
let P = null;
const PLACE_FAST = 4000, PLACE_SAMPLE = 20;
function placeable(u) { return cardsL().filter(c => c.unit === u && c.level === 0 && !c.pl && !isPaused(c)); }
function canPlace(u) { return placeable(u).length >= 5; }
function startPlace(u) {
  const ids = shuffle(placeable(u).map(c => c.id));
  P = { unit: u, queue: ids, total: ids.length, known: 0, unsure: 0, unknown: 0, sample: ids.length > PLACE_SAMPLE + 10 ? PLACE_SAMPLE : 0,
        sk: 0, bulk: "", last: Date.now(), newBadges: [] };
  renderPlace();
}
// Fälligkeit verteilen: der Tag im Fenster, an dem bisher am wenigsten fällig ist. So kommt nie eine Welle.
function spreadDue(minD, maxD) {
  const t0 = today(), load = new Map();
  cardsL().forEach(c => { if (c.level) { const d = Math.round((c.due - t0) / DAY); if (d >= minD && d <= maxD) load.set(d, (load.get(d) || 0) + 1); } });
  let best = minD; for (let d = minD; d <= maxD; d++) if ((load.get(d) || 0) < (load.get(best) || 0)) best = d;
  return t0 + best * DAY;
}
function placeCard(card, how) {
  if (how === "known") { card.level = 5; card.st = 30; card.df = 5; card.seen = Date.now(); card.ivl = 30; card.due = spreadDue(7, 56); card.chk = 1; P.known++; }
  else if (how === "unsure") { card.level = 2; card.st = 4; card.df = 6; card.seen = Date.now(); card.ivl = 4; card.due = spreadDue(1, 14); P.unsure++; }
  else { card.pl = 1; P.unknown++; }
}
function renderPlace() {
  tick();
  if (P.sample && P.total - P.queue.length === P.sample) {
    const rate = P.sk / P.sample; P.sample = 0;
    const bulk = rate >= 0.9 ? "known" : rate < 0.6 ? "unknown" : "";
    if (bulk) { P.bulk = bulk; P.queue.splice(0).forEach(id => { const c = S.cards.find(x => x.id === id); if (c) placeCard(c, bulk); }); save(); }
  }
  if (!P.queue.length) return renderPlaceDone();
  const card = S.cards.find(c => c.id === P.queue[0]);
  if (!card) { P.queue.shift(); return renderPlace(); }
  const k = P.total - P.queue.length, n = P.sample || P.total;
  const opts = choiceOpts(card, card.de, "en-de", cardsL().filter(c => c.id !== card.id));
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="quit" aria-label="Sortieren beenden">${ICON.x}</button>
      <div class="bar"><i style="width:${Math.round(k / n * 100)}%"></i></div><span class="small muted" style="font-variant-numeric:tabular-nums">${k}/${n}</span></div>
    ${kastenHtml(levelCounts(), true)}
    <div class="icard" id="icard">
      <div class="spread"><span class="eyebrow">${P.sample ? "Stichprobe" : "Sortieren"}</span>${canHear() ? `<button class="speak" id="hear">${ICON.speaker}Anhören</button>` : ""}</div>
      <div class="q">${esc(card.en)}</div>
      <p class="muted small">Was heißt das? Tipp an${SR ? " oder sag es auf Deutsch" : ""}.</p>
      <div class="choices">${opts.map(o => `<button class="choice" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>
      <div class="row" style="justify-content:center">${SR ? `<button class="speak" id="bigmic">${ICON.mic || "🎤"}Sagen</button>` : ""}<button class="choice no" id="no">Weiß ich nicht</button></div>
    </div>
    <button class="link" id="stop" style="align-self:center">Rest später sortieren</button>`));
  const t0 = Date.now();
  $("#quit").onclick = $("#stop").onclick = () => { stopListening(); tick(); save(); P = null; renderHome(); };
  if ($("#hear")) $("#hear").onclick = () => say(card.en);
  liftCard(0);
  const go = (how, btn) => {
    stopListening(); $$("#icard button").forEach(b => b.disabled = true); tick();
    $$("[data-o]").forEach(b => { if (b.dataset.o === card.de) b.classList.add("right"); });
    if (btn && how === "unknown") btn.classList.add("wrong");
    if (how !== "unknown") P.sk++;
    placeCard(card, how);
    P.queue.shift(); S.xp++; save();
    flyCard(0, card.level, how !== "unknown", card.en);
    sound(how === "unknown" ? "tap" : "good");
    setTimeout(renderPlace, reduced() ? 150 : how === "unknown" ? 1100 : 720);
  };
  $$("[data-o]").forEach(b => b.onclick = () => go(b.dataset.o === card.de ? (Date.now() - t0 <= PLACE_FAST ? "known" : "unsure") : "unknown", b));
  $("#no").onclick = () => go("unknown");
  // Sprechen: Deutsch versteht die Erkennung gut. Nicht verstanden heißt nicht falsch, dann einfach antippen.
  if ($("#bigmic")) $("#bigmic").onclick = () => listenDe(card.de, (hit, heard) => {
    if (hit) go(Date.now() - t0 <= PLACE_FAST + 2000 ? "known" : "unsure");
    else toast(heard ? `Verstanden: „${heard}“. Tipp die Antwort lieber an.` : "Nichts gehört. Tipp die Antwort an.");
  }, () => {});
}
function renderPlaceDone() {
  P.finished = true; checkBadges(); save();
  const nextU = [...new Set(cardsL().map(c => c.unit))].find(u => u !== P.unit && canPlace(u));
  app.replaceChildren(h(`<div class="done">
    <p class="eyebrow">„${esc(P.unit)}“ sortiert</p>
    <div class="score">${P.known + P.unsure}</div>
    <p>${P.known + P.unsure === 1 ? "Wort kennst" : "Wörter kennst"} du schon.${P.bulk === "known" ? " Die Stichprobe saß fast komplett, darum gilt die ganze Unit als gekonnt." : P.bulk ? " Die Stichprobe war noch wackelig, darum lernst du den Rest der Unit nach und nach neu." : ""}</p>
    <p class="muted small">${P.known} sitzen und kommen verteilt über die nächsten Wochen zur Kontrolle, ${P.unsure} unsicher kommen in den nächsten Tagen.</p>
    ${P.unknown ? `<p class="muted">${P.unknown} ${P.unknown === 1 ? "Wort lernst" : "Wörter lernst"} du neu, nach und nach, wenn Platz ist.</p>` : ""}
    ${kastenHtml(levelCounts())}
    ${P.newBadges.length ? `<div class="newbadges">${P.newBadges.map(b => `<div class="badge got"><span>${b.icon}</span><b>${esc(b.name)}</b></div>`).join("")}</div>` : ""}
    <div class="row" style="justify-content:center">${nextU ? `<button class="btn" id="nextU">Nächste Unit sortieren</button>` : ""}<button class="btn ${nextU ? "ghost" : ""}" id="home">Fertig</button></div>
  </div>`));
  if (P.known + P.unsure) confetti();
  if (nextU) $("#nextU").onclick = () => startPlace(nextU);
  $("#home").onclick = () => { P = null; renderHome(); };
  window.scrollTo(0, 0);
}

// ---------- Punkte, Level, Abzeichen, Konfetti und Töne ----------
function xpNeed(l) { return 50 * l * (l + 1); }                 // Punkte, ab denen Level l + 1 beginnt
function levelOf(xp) { let l = 1; while (xp >= xpNeed(l)) l++; return l; }
function levelPct(xp) { const l = levelOf(xp), a = l > 1 ? xpNeed(l - 1) : 0; return Math.round((xp - a) / (xpNeed(l) - a) * 100); }
function addXp(n) {
  if (!n) return;
  const before = levelOf(S.xp); S.xp += n;
  const d = dayLog(); d.xp = (d.xp || 0) + n; if (R) R.xp += n;
  const fb = $("#fb .feedback");
  if (fb && !reduced()) { const el = document.createElement("span"); el.className = "xpfloat"; el.textContent = "+" + n; fb.append(el); setTimeout(() => el.remove(), 1300); }
  if (levelOf(S.xp) > before) setTimeout(() => celebrate(`Level ${levelOf(S.xp)} erreicht!`), 600);
}
function checkGoal() {
  const d = dayLog();
  if (!d.goalHit && goalCount() >= S.goal) { d.goalHit = true; setTimeout(() => celebrate("Tagesziel geschafft!"), 300); }
}
function celebrate(msg) { confetti(); sound("up"); toast(msg); }
const BADGES = [
  ["first", "🎒", "Erste Runde", "Die erste Runde geschafft"],
  ["perfect", "💯", "Fehlerfrei", "Eine Runde mit mindestens 5 Fragen ohne Fehler"],
  ["combo10", "⚡", "Zehn am Stück", "10 Antworten hintereinander richtig"],
  ["goal", "🎯", "Tagesziel", "Zum ersten Mal das Tagesziel geschafft"],
  ["goal7", "🏅", "Sieben Tagesziele", "An 7 Tagen das Tagesziel geschafft"],
  ["streak3", "🔥", "Drei Tage", "3 Tage am Stück geübt"],
  ["streak7", "☄️", "Eine Woche", "7 Tage am Stück geübt"],
  ["streak30", "🌋", "Ein Monat", "30 Tage am Stück geübt"],
  ["place", "🔎", "Schnelltest", "Einen Schnelltest bis zum Ende gemacht"],
  ["words50", "🌱", "50 Wörter", "50 Wörter liegen ab Fach 3"],
  ["words100", "🌿", "100 Wörter", "100 Wörter liegen ab Fach 3"],
  ["words250", "🌳", "250 Wörter", "250 Wörter liegen ab Fach 3"],
  ["words500", "🏰", "500 Wörter", "500 Wörter liegen ab Fach 3"],
  ["fach7", "🏆", "Ganz hinten", "Ein Wort hat Fach 7 erreicht"],
  ["gram5", "🧩", "Grammatik-Profi", "5 Grammatikthemen geübt"],
  ["level5", "⭐", "Level 5", "Level 5 erreicht"],
  ["level10", "🌟", "Level 10", "Level 10 erreicht"]
];
function badgeTest() {
  const sit = S.cards.filter(c => c.level >= 3).length, streak = liveStreak(), lv = levelOf(S.xp);
  const goals = Object.values(S.log).filter(d => d.goalHit).length;
  const gram = Object.values(S.gram).reduce((n, g) => n + Object.keys(g).length, 0);
  return {
    first: !!(R && R.finished), perfect: !!(R && R.finished && R.good === R.total && R.total >= 5), combo10: !!(R && R.best >= 10),
    goal: goals >= 1, goal7: goals >= 7, streak3: streak >= 3, streak7: streak >= 7, streak30: streak >= 30, place: !!(P && P.finished),
    words50: sit >= 50, words100: sit >= 100, words250: sit >= 250, words500: sit >= 500, fach7: S.cards.some(c => c.level === 7),
    gram5: gram >= 5, level5: lv >= 5, level10: lv >= 10
  };
}
function checkBadges() {
  const t = badgeTest(), fresh = [];
  BADGES.forEach(([id, icon, name]) => { if (t[id] && !S.badges[id]) { S.badges[id] = dayKey(); fresh.push({ icon, name }); } });
  if (!fresh.length) return;
  const run = R || P || G;
  if (run && run.newBadges) run.newBadges.push(...fresh);
  setTimeout(() => toast(`Neues Abzeichen: ${fresh[0].icon} ${fresh[0].name}`), 900);
}
function renderBadges() {
  const lv = levelOf(S.xp);
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Level und Abzeichen</h2></div>
    <section class="hero">
      <div class="spread"><b class="herotitle">Level ${lv}</b><span class="muted small">${S.xp} Punkte</span></div>
      <div class="bar"><i style="width:${levelPct(S.xp)}%"></i></div>
      <p class="muted small">Noch ${xpNeed(lv) - S.xp} Punkte bis Level ${lv + 1}. Richtig beim ersten Versuch gibt 10 Punkte, mehrere richtig hintereinander geben Extrapunkte.</p>
    </section>
    <div class="badgegrid">${BADGES.map(([id, icon, name, how]) => `<div class="badge${S.badges[id] ? " got" : ""}">
      <span aria-hidden="true">${icon}</span><b>${esc(name)}</b><span class="muted small">${esc(how)}</span></div>`).join("")}</div>`));
  $("#back").onclick = renderHome;
  window.scrollTo(0, 0);
}

// ---------- Tagesaufgaben: drei wechselnde kleine Aufgaben, jede bringt ein Extra-Päckchen ----------
const QUESTS = [
  ["goal", "Schaff dein Tagesziel", d => [goalCount(), S.goal]],
  ["combo", "5 richtig am Stück", d => [d.combo || 0, 5]],
  ["combo8", "8 richtig am Stück", d => [d.combo || 0, 8]],
  ["up", "Bring 8 Wörter ein Fach weiter", d => [d.up || 0, 8]],
  ["sat", "Bring ein Wort bis Fach 3", d => [d.sat || 0, 1], () => cardsL().some(c => c.level === 2)],
  ["learn", "Lerne 3 neue Wörter", d => [d.learned || 0, 3], () => newCards().length >= 3],
  ["perfect", "Eine Runde ganz ohne Fehler", d => [d.perfect || 0, 1]],
  ["tag", "Üben nach Thema: eine Runde", d => [d.tag || 0, 1], () => Object.keys(tagCounts()).length > 0],
  ["gram", "Eine Grammatik-Aufgabe", d => [d.gram || 0, 1]],
  ["time", "5 Minuten üben", d => [Math.floor((d.sec || 0) / 60), 5]]
];
function todaysQuests() {
  const d = dayLog();
  if (!d.quests) {
    let h = 0; for (const ch of dayKey()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const ok = QUESTS.filter(q => !q[3] || q[3]()), out = [];
    // "goal" ist jeden zweiten Tag dabei, der Rest wechselt
    if (h % 2) out.push("goal");
    // Math.imul: ohne das wird die Zahl zu groß, verliert Stellen und die Schleife lief manchmal endlos
    for (let n = 0; out.length < 3 && ok.length && n < 200; n++) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; const q = ok[h % ok.length][0]; if (!out.includes(q) && !(q === "combo8" && out.includes("combo")) && !(q === "combo" && out.includes("combo8"))) out.push(q); if (out.length >= ok.length) break; }
    d.quests = out; d.qdone = [];
  }
  return d.quests.map(id => QUESTS.find(q => q[0] === id)).filter(Boolean);
}
// Prüft die Aufgaben; neu geschaffte bringen ein Päckchen, alle drei zusammen ein goldenes.
function checkQuests() {
  if (!cardsL().length) return [];
  const d = dayLog(), qs = todaysQuests(), fresh = [];
  qs.forEach(([id, name, prog]) => { const [a, b] = prog(d); if (a >= b && !d.qdone.includes(id)) { d.qdone.push(id); fresh.push(name); S.packQ.push(makePack({ up: 4, sat: 0 })); } });
  if (fresh.length && d.qdone.length === qs.length && !d.gold) { d.gold = 1; S.packQ.push(makePack({ up: 10, sat: 3 }, true)); fresh.push("Alle drei! Goldenes Päckchen"); }
  if (fresh.length) save();
  return fresh;
}
function questCard() {
  if (!cardsL().length) return "";
  const d = dayLog(), qs = todaysQuests(), all = d.qdone.length === qs.length;
  return `<section class="panel quests">
    <div class="spread"><h2>Heutige Aufgaben</h2><span class="muted small">${d.qdone.length} von ${qs.length}</span></div>
    ${qs.map(([id, name, prog]) => { const [a, b] = prog(d), ok = d.qdone.includes(id);
      return `<div class="quest${ok ? " ok" : ""}"><span class="qchk" aria-hidden="true">${ok ? "✓" : ""}</span><div><b>${esc(name)}</b>
        <div class="bar"><i style="width:${Math.min(100, Math.round(a / b * 100))}%"></i></div></div><span class="small muted">${Math.min(a, b)}/${b}</span></div>`; }).join("")}
    <p class="muted small">${all ? "Alles geschafft! Morgen gibt es neue Aufgaben." : "Jede Aufgabe bringt ein Sticker-Päckchen. Alle drei zusammen: ein goldenes Päckchen mit sicherem seltenen Sticker."}</p>
  </section>`;
}

// ---------- Sticker-Album: Nach jeder Runde ein Überraschungs-Päckchen ----------
// [id, englisch, deutsch, Bild, Seltenheit: 0 normal, 1 selten, 2 legendär]
const ALBUM = [
  { name: "London", bg: "#E8574A,#B3261E", st: [
    ["bus", "double-decker bus", "Doppeldeckerbus", "🚌", 0], ["cab", "black cab", "Londoner Taxi", "🚕", 0], ["phone", "phone box", "Telefonzelle", "☎️", 0],
    ["tube", "the Tube", "die Londoner U-Bahn", "🚇", 0], ["brolly", "umbrella", "Regenschirm", "☂️", 0], ["post", "postbox", "Briefkasten", "📮", 0],
    ["ben", "Big Ben", "Big Ben", "🕰️", 1], ["bridge", "Tower Bridge", "Tower Bridge", "🌉", 1], ["eye", "London Eye", "Riesenrad London Eye", "🎡", 1],
    ["crown", "the Crown Jewels", "die Kronjuwelen", "👑", 2]] },
  { name: "Camden", bg: "#9B5DE5,#5B2A86", st: [
    ["market", "market stall", "Marktstand", "🛍️", 0], ["guitar", "guitar", "Gitarre", "🎸", 0], ["record", "record", "Schallplatte", "💿", 0],
    ["boat", "canal boat", "Kanalboot", "🛶", 0], ["art", "street art", "Straßenkunst", "🎨", 0], ["shades", "sunglasses", "Sonnenbrille", "🕶️", 0],
    ["punk", "punk", "Punk", "🧑‍🎤", 1], ["skate", "skateboard", "Skateboard", "🛹", 1], ["drum", "drum", "Trommel", "🥁", 1],
    ["mic", "golden microphone", "goldenes Mikrofon", "🎤", 2]] },
  { name: "Food", bg: "#F08A24,#B85A0E", st: [
    ["chips", "fish and chips", "Fisch mit Pommes", "🍟", 0], ["tea", "a cup of tea", "eine Tasse Tee", "🫖", 0], ["toast", "toast", "Toast", "🍞", 0],
    ["beans", "baked beans", "weiße Bohnen in Tomatensoße", "🫘", 0], ["biscuit", "biscuit", "Keks", "🍪", 0], ["cupcake", "cupcake", "kleiner Kuchen", "🧁", 0],
    ["breakfast", "full English breakfast", "englisches Frühstück", "🍳", 1], ["pudding", "pudding", "Pudding, Nachtisch", "🍮", 1], ["straw", "strawberries and cream", "Erdbeeren mit Sahne", "🍓", 1],
    ["cake", "wedding cake", "Hochzeitstorte", "🎂", 2]] },
  { name: "Animals", bg: "#3FA34D,#1E6B2B", st: [
    ["fox", "fox", "Fuchs", "🦊", 0], ["squirrel", "squirrel", "Eichhörnchen", "🐿️", 0], ["pigeon", "pigeon", "Taube", "🐦", 0],
    ["hedgehog", "hedgehog", "Igel", "🦔", 0], ["duck", "duck", "Ente", "🦆", 0], ["swan", "swan", "Schwan", "🦢", 0],
    ["corgi", "corgi", "Corgi", "🐕", 1], ["owl", "owl", "Eule", "🦉", 1], ["badger", "badger", "Dachs", "🦡", 1],
    ["unicorn", "unicorn", "Einhorn (Schottlands Wappentier)", "🦄", 2]] },
  { name: "School", bg: "#3C8DDE,#1F4E8F", st: [
    ["bag", "school bag", "Schultasche", "🎒", 0], ["pencil", "pencil", "Bleistift", "✏️", 0], ["book", "exercise book", "Schulheft", "📓", 0],
    ["lunch", "lunchbox", "Brotdose", "🍱", 0], ["bell", "school bell", "Schulglocke", "🔔", 0], ["ruler", "ruler", "Lineal", "📏", 0],
    ["trophy", "trophy", "Pokal", "🏆", 1], ["micro", "microscope", "Mikroskop", "🔬", 1], ["globe", "globe", "Globus", "🌍", 1],
    ["cap", "graduation cap", "Doktorhut", "🎓", 2]] },
  { name: "Adventures", bg: "#1F4E5F,#0E2A33", st: [
    ["ball", "football", "Fußball", "⚽", 0], ["cricket", "cricket bat", "Kricketschläger", "🏏", 0], ["kite", "kite", "Drachen (Spielzeug)", "🪁", 0],
    ["tennis", "tennis ball", "Tennisball", "🎾", 0], ["bike", "bike", "Fahrrad", "🚲", 0], ["tent", "tent", "Zelt", "⛺", 0],
    ["guard", "Queen's Guard", "königlicher Wachsoldat", "💂", 1], ["castle", "castle", "Burg, Schloss", "🏰", 1], ["dragon", "dragon", "Drache (Wappentier von Wales)", "🐉", 1],
    ["nessie", "Loch Ness Monster", "Ungeheuer von Loch Ness", "🦕", 2]] }
];
const STICKERS = ALBUM.flatMap((pg, pi) => pg.st.map(([id, en, de, e, r], k) => ({ id, en, de, e, r, pg: pi, no: pi * 10 + k + 1 })));
const RAR = ["Normal", "Selten", "Legendär"];
const MARKS_FOR_PICK = 5;
// Wer mehr Wörter in dieser Runde nach hinten gebracht hat, bekommt eher seltene Sticker.
// Legendäre gibt es nur, wenn ein Wort jetzt sitzt (ab Fach 3) oder das Tagesziel geschafft ist.
function makePack(run, gold) {
  const up = run ? run.up : 0, sat = run ? run.sat : 0, firstToday = S.packDay !== dayKey();
  const pLeg = sat || (run && dayLog().goalHit) ? Math.min(.3, .06 + .05 * sat) : 0, pRare = Math.min(.55, .2 + .04 * up);
  const out = [];
  for (let i = 0; i < 3; i++) {
    let r = Math.random() < pLeg ? 2 : Math.random() < pRare ? 1 : 0;
    if (i === 2 && (firstToday || gold) && r === 0) r = 1;   // erstes Päckchen des Tages und goldene: mindestens ein seltener
    const pool = STICKERS.filter(x => x.r === r), missing = pool.filter(x => !S.stickers[x.id] && !out.includes(x.id));
    const pickFrom = missing.length && Math.random() < .7 ? missing : pool;
    out.push(pick(pickFrom).id);
  }
  return out;
}
function albumCount() { return STICKERS.filter(x => S.stickers[x.id]).length; }
function stickerHtml(x, opts = {}) {
  const have = opts.show || S.stickers[x.id], pg = ALBUM[x.pg];
  return `<span class="stk r${x.r}${have ? "" : " missing"}${opts.cls ? " " + opts.cls : ""}" style="--pg:linear-gradient(135deg,${pg.bg})" aria-label="${have ? esc(x.en) : "Sticker " + x.no + " fehlt noch"}">
    <span class="em" aria-hidden="true">${x.e}</span>${have ? "" : `<b class="no">${x.no}</b>`}${x.r && have ? `<i class="rar" aria-hidden="true">${x.r === 2 ? "★★" : "★"}</i>` : ""}</span>`;
}
// ---------- Camden-Welt: jedes Wort ab Fach 3 baut ein echtes Haus in Camden Town (3D, lädt erst beim Öffnen) ----------
const SKYLINE = `<svg viewBox="0 0 120 56"><rect x="4" y="22" width="20" height="34" rx="2" fill="#E8B796"/><rect x="26" y="10" width="18" height="46" rx="2" fill="#FF6B6B"/><rect x="46" y="26" width="16" height="30" rx="2" fill="#FFD166"/><rect x="64" y="4" width="22" height="52" rx="2" fill="#4CC9F0"/><rect x="88" y="18" width="14" height="38" rx="2" fill="#06D6A0"/><rect x="104" y="28" width="14" height="28" rx="2" fill="#C77DFF"/><g fill="#fff" opacity=".75"><rect x="8" y="28" width="4" height="5"/><rect x="16" y="28" width="4" height="5"/><rect x="30" y="16" width="4" height="5"/><rect x="37" y="16" width="4" height="5"/><rect x="30" y="26" width="4" height="5"/><rect x="68" y="10" width="5" height="6"/><rect x="77" y="10" width="5" height="6"/><rect x="68" y="22" width="5" height="6"/><rect x="77" y="22" width="5" height="6"/><rect x="50" y="32" width="4" height="5"/><rect x="92" y="24" width="4" height="5"/></g></svg>`;
function weltNew() {
  const W = S.welt || {}, built = W.built || [], have = new Set([...built.map(b => b.id), ...(W.wait || [])]);
  return S.cards.filter(c => c.level >= 3 && !have.has(c.id)).length + Math.max(0, built.length - (W.seen || 0));
}
function weltCard() {
  const n = (S.welt.built || []).length, fresh = weltNew(), dn = weltDistrictNew(), tr = treasureReady();
  const nd = 1 + (S.welt.dist || []).length, next = weltUnits().filter(u => !u.done).sort((a, b) => b.pct - a.pct)[0];
  return `<section class="panel weltcard">
    <div class="spread"><h2>Deine Camden-Welt</h2><span class="muted small">${n} ${n === 1 ? "Haus" : "Häuser"} · Viertel ${nd}/7</span></div>
    <div class="weltpeek" aria-hidden="true">${SKYLINE}${fresh ? `<span class="weltbadge">+${fresh}</span>` : ""}${tr ? `<span class="weltgift">🎁</span>` : ""}</div>
    ${dn ? `<p class="weltnews">🗺️ Eine Unit ist geschafft. Ein neues Viertel wartet auf dich!</p>` : ""}
    ${tr ? `<p class="weltnews">🎁 Heute ist in Camden ein Sticker-Päckchen versteckt. Folge dem Lichtstrahl!</p>` : ""}
    <p class="muted small">Jedes Wort ab Fach 3 baut ein Haus. In Fach 5 leuchten nachts seine Fenster, in Fach 7 bekommt es ein goldenes Dach.${nd < 7 && next ? ` Nächstes Viertel: „${esc(next.name)}“ zu ${Math.min(99, Math.round(next.pct / .8 * 100))} % geschafft.` : ""}</p>
    <button class="btn${fresh || dn || tr ? "" : " ghost"}" id="welt">${dn ? "Neues Viertel ansehen" : fresh ? (fresh === 1 ? "1 neues Haus bauen" : fresh + " neue Häuser bauen") : tr ? "Schatz suchen" : "Welt ansehen"}</button>
  </section>`;
}
function renderWelt() {
  document.body.classList.add("weltopen");
  import("./welt/welt.js").then(m => m.open(document.body, {
    cards: () => S.cards, state: S.welt, save, units: weltUnits,
    treasure: { ready: treasureReady(), day: dayKey(), claim: () => { dayLog().treasure = 1; S.packQ.push(makePack({ up: 6, sat: 1 })); save(); } },
    say: canSpeak ? t => say(t, "en-GB") : null,
    sound: k => sound(k), confetti,
    onClose: () => { document.body.classList.remove("weltopen"); renderHome(); }
  })).catch(() => { document.body.classList.remove("weltopen"); toast("Die Welt braucht einmal Internet zum Laden."); });
}

function albumCard() {
  const n = albumCount(), N = STICKERS.length;
  return `<section class="panel albumcard">
    <div class="spread"><h2>Sticker-Album</h2><span class="muted small">${n} von ${N}</span></div>
    <div class="bar"><i style="width:${Math.round(n / N * 100)}%"></i></div>
    <div class="albumpeek">${STICKERS.filter(x => S.stickers[x.id]).slice(-5).map(x => stickerHtml(x, { cls: "sm" })).join("") || `<span class="muted small">Nach jeder Runde gibt es ein Päckchen mit 3 Stickern. Seltene gibt es öfter, wenn Wörter nach hinten wandern.</span>`}</div>
    <div class="row">${S.packQ.length ? `<button class="btn" id="homePack">${S.packQ.length === 1 ? "Päckchen öffnen" : S.packQ.length + " Päckchen öffnen"}</button>` : ""}<button class="btn ghost" id="album">Album ansehen</button></div>
  </section>`;
}
function openPack() {
  const ids = S.packQ[0]; if (!ids) return renderHome();
  app.replaceChildren(h(`<div class="packstage">
    <p class="eyebrow">Sticker-Päckchen</p>
    <button class="pack big" id="pk" type="button" aria-label="Päckchen aufreißen"><span class="top"></span><span class="body"><b>LONDON</b><small>3 Sticker</small></span></button>
    <p class="muted small" id="pkHint">Tipp aufs Päckchen, um es aufzureißen.</p>
    <div class="pcards" id="pcards" hidden></div>
    <div class="row" id="pkDone" hidden style="justify-content:center"><button class="btn" id="toAlbum">Ins Album kleben</button><button class="btn ghost" id="pkHome">Fertig</button></div>
  </div>`));
  sound("tap");
  const pk = $("#pk"); let open = false;
  pk.onclick = () => {
    if (open) return; open = true; pk.classList.add("tear"); sound("flip");
    // Beim Aufreißen gehören die Sticker schon ihr, auch wenn sie nicht alle umdreht
    const seen = new Set(Object.keys(S.stickers).filter(k => S.stickers[k]));
    const isNew = ids.map(id => { const n = !seen.has(id); seen.add(id); return n; });
    ids.forEach((id, i) => { S.stickers[id] = (S.stickers[id] || 0) + 1; if (!isNew[i]) S.marks++; });
    S.packQ.shift(); S.packDay = dayKey(); save();
    setTimeout(() => {
      pk.hidden = true; $("#pkHint").textContent = "Dreh die Sticker um!";
      const box = $("#pcards"); box.hidden = false;
      box.replaceChildren(h(ids.map((id, i) => { const x = STICKERS.find(s => s.id === id);
        return `<button class="pcard" type="button" data-i="${i}" style="animation-delay:${i * .12}s"><span class="back" aria-hidden="true">?</span>
          <span class="front">${stickerHtml(x, { show: true })}<b>${esc(x.en)}</b><span class="small">${esc(x.de)}</span><span class="rtag r${x.r}">${RAR[x.r]}</span><span class="newtag2" hidden>Neu!</span><span class="duptag" hidden>Doppelt</span></span></button>`; }).join("")));
      let turned = 0;
      $$(".pcard", box).forEach(b => b.onclick = () => {
        if (b.classList.contains("on")) return; b.classList.add("on");
        const x = STICKERS.find(s => s.id === ids[+b.dataset.i]);
        $(isNew[+b.dataset.i] ? ".newtag2" : ".duptag", b).hidden = false;
        if (x.r === 2) { confetti(); sound("up"); } else sound(x.r ? "up" : "good");
        if (++turned === ids.length) {
          $("#pkHint").textContent = S.marks >= MARKS_FOR_PICK ? `Du hast ${S.marks} Tauschmarken: Im Album darfst du dir einen fehlenden Sticker aussuchen!` : `Doppelte werden zu Tauschmarken (${S.marks} von ${MARKS_FOR_PICK}). Für ${MARKS_FOR_PICK} darfst du dir einen fehlenden Sticker aussuchen.`;
          $("#pkDone").hidden = false;
          if (S.packQ.length) $("#pkHome").textContent = "Nächstes Päckchen";
        }
      });
    }, 650);
  };
  $("#toAlbum").onclick = () => renderAlbum(ids, STICKERS.find(x => x.id === ids[0]).pg);
  $("#pkHome").onclick = () => S.packQ.length ? openPack() : renderHome();
  window.scrollTo(0, 0);
}
function renderAlbum(fresh = [], page = 0) {
  const n = albumCount(), canPick = S.marks >= MARKS_FOR_PICK;
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Sticker-Album</h2></div>
    <section class="hero">
      <div class="spread"><b class="herotitle">${n} von ${STICKERS.length} Stickern</b><span class="muted small">${S.marks} Tauschmarken</span></div>
      <div class="bar"><i style="width:${Math.round(n / STICKERS.length * 100)}%"></i></div>
      <p class="muted small">${canPick ? `<b>Du darfst dir einen fehlenden Sticker aussuchen!</b> Tipp auf ein leeres Feld.` : `Nach jeder Runde gibt es ein Päckchen. Je mehr Wörter nach hinten wandern, desto eher sind seltene Sticker drin. Legendäre gibt es nur, wenn ein Wort richtig sitzt.`}</p>
    </section>
    <div class="chips">${ALBUM.map((pg, i) => `<button class="chip" data-page="${i}" aria-pressed="${i === page}">${esc(pg.name)} <span class="muted small">${pg.st.filter(x => S.stickers[x[0]]).length}/10</span></button>`).join("")}</div>
    <section class="albumpage" style="--pg:linear-gradient(135deg,${ALBUM[page].bg})">
      <h3>${esc(ALBUM[page].name)}</h3>
      <div class="albumgrid">${STICKERS.filter(x => x.pg === page).map(x => `<button class="slot" type="button" data-st="${x.id}">${stickerHtml(x, { cls: fresh.includes(x.id) ? "pop" : "" })}
        <span class="small">${S.stickers[x.id] ? esc(x.en) : "?"}</span></button>`).join("")}</div>
    </section>
    <div id="stInfo"></div>`));
  $("#back").onclick = renderHome;
  $$("[data-page]").forEach(b => b.onclick = () => renderAlbum(fresh, +b.dataset.page));
  $$("[data-st]").forEach(b => b.onclick = () => {
    const x = STICKERS.find(s => s.id === b.dataset.st);
    if (!S.stickers[x.id]) {
      if (!canPick) { toast(`Sticker ${x.no} fehlt noch. Vielleicht im nächsten Päckchen!`); return; }
      S.marks -= MARKS_FOR_PICK; S.stickers[x.id] = 1; save(); sound("up"); confetti(); renderAlbum([x.id], page); return;
    }
    say(x.en);
    $("#stInfo").replaceChildren(h(`<div class="panel stinfo">${stickerHtml(x, { cls: "lg" })}<div><b>${esc(x.en)}</b><p class="muted small">${esc(x.de)} · ${RAR[x.r]}${S.stickers[x.id] > 1 ? ` · ${S.stickers[x.id]}× gesammelt` : ""}</p></div></div>`));
    $("#stInfo").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  window.scrollTo(0, 0);
}
function confetti() {
  if (reduced()) return;
  const c = document.createElement("canvas"), dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  c.className = "confetti"; c.width = W * dpr; c.height = H * dpr; c.setAttribute("aria-hidden", "true"); document.body.append(c);
  const x = c.getContext("2d"); x.scale(dpr, dpr);
  const cols = ["#1F4E5F", "#FFD43B", "#F08A24", "#E8574A", "#3C8DDE", "#9B5DE5"];
  const ps = [...Array(150)].map(() => ({ x: W / 2 + (Math.random() - .5) * 80, y: H * .35, vx: (Math.random() - .5) * 15, vy: -Math.random() * 13 - 4,
    r: Math.random() * 6, vr: (Math.random() - .5) * .4, w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: pick(cols) }));
  let f = 0;
  (function step() {
    x.clearRect(0, 0, W, H);
    ps.forEach(p => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore(); });
    if (++f < 120) requestAnimationFrame(step); else c.remove();
  })();
}
let AC = null;
const SND = {
  good: [[784, 0, .1], [1175, .07, .16]], bad: [[196, 0, .22, "triangle"]], land: [[1046, 0, .05, "triangle", .06]],
  tap: [[660, 0, .03, "triangle", .04]], flip: [[440, 0, .06, "triangle", .05], [660, .05, .06, "triangle", .05]],
  up: [[523, 0, .12], [659, .1, .12], [784, .2, .12], [1047, .3, .35]]
};
function sound(k) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = AC.currentTime + .01;
    SND[k].forEach(([f, t, d, type = "sine", v = .1]) => {
      const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t0 + t); g.gain.exponentialRampToValueAtTime(v, t0 + t + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + t + d);
      o.connect(g); g.connect(AC.destination); o.start(t0 + t); o.stop(t0 + t + d + .05);
    });
  } catch (e) {}
}

// ---------- Vokabeln hinzufügen ----------
let rows = [], photo = null, importName = "";
function parseList(text) {
  const out = []; let name = "";
  for (let line of String(text).split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("```")) continue;
    if (line.startsWith("#")) { if (!name) name = line.replace(/^#+\s*/, "").trim(); continue; }
    line = line.replace(/^(?:[-*•]|\d+[.)])\s+/, "");
    let parts = line.split(/\s*;\s*/);
    if (parts.length < 2) parts = line.split(/\s*(?:\t|\s=\s|\s[–—-]\s|\|)\s*/);
    if (parts.length < 2 || !parts[0] || !parts[1]) continue;
    // #tags dürfen in jedem Feld ab dem zweiten stehen, meist im letzten
    const tags = [];
    const rest = parts.slice(1).map(f => f.replace(/(^|\s)#([\p{L}\d_-]+)/gu, (m, a, t) => { const k = normTag(t); if (k && !tags.includes(k)) tags.push(k); return a; }).trim());
    const r = { en: parts[0].trim(), de: rest[0], ex: rest.slice(1).filter(Boolean).join("; ") };
    if (tags.length) r.tags = tags.slice(0, 5);
    if (r.de) out.push(r);
  }
  return { name, rows: out };
}
// Zurück aus dem KI-Chat: Liegt eine Vokabelliste in der Zwischenablage, wird sie gleich geprüft (ein Tipp weniger).
let clipWatch = false;
document.addEventListener("visibilitychange", async () => {
  if (document.hidden || !clipWatch || !$("#paste") || !navigator.clipboard || !navigator.clipboard.readText) return;
  try {
    const t = await navigator.clipboard.readText();
    if (!t || t === photoPrompt() || !parseList(t).rows.length) return;
    clipWatch = false; $("#paste").value = t; addParsed(t);
    toast(`${parseList(t).rows.length} Wörter gefunden. Prüfen und übernehmen.`);
  } catch (e) {}
});
function renderImport(prefill) {
  if (prefill) { rows = prefill.rows; importName = prefill.name; }
  const shareFiles = !!(navigator.canShare && window.File);
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Vokabeln hinzufügen</h2></div>
    ${prefill ? `<p class="status">Jemand hat dir diese Unit geschickt. Prüf die Liste und tipp auf „Übernehmen“.</p>` : ""}
    <p class="muted small">Für deinen Kasten <b>${esc(L().name)}</b></p>
    <label class="f">Name der Unit<input class="input" id="unitName" placeholder="z. B. Unit 2" value="${esc(importName)}"></label>
    ${prefill ? "" : `
    <details class="panel" id="parents">
      <summary><b>Für Eltern: Buchseite mit einem KI-Chat umwandeln</b></summary>
      <p class="muted small">Über dein eigenes Konto, nicht das deines Kindes. Die App schickt nichts selbst weg. Du entscheidest, an welchen Chat das Foto oder die Datei geht. Der Auftrag bittet den Chat auch um Tags wie #tiere oder #verb.</p>
      <label class="btn wide" for="photo">${ICON.camera}<span id="photoLabel">Foto aufnehmen oder wählen</span></label>
      <input type="file" id="photo" accept="image/*" capture="environment" hidden>
      <label class="btn ghost wide" for="srcFile"><span id="fileLabel">Datei wählen (PDF, Word, Excel …)</span></label>
      <input type="file" id="srcFile" accept="image/*,application/pdf,.pdf,.doc,.docx,.odt,.xls,.xlsx,.ods,.csv,.txt" hidden>
      <button class="btn ghost wide" id="sharePhoto" hidden>${ICON.share}Datei und Auftrag an KI-Chat senden</button>
      <p class="muted small" id="shareHint" hidden>Im Teilen-Menü wählst du ChatGPT, Claude oder Gemini. Der Auftrag liegt außerdem in der Zwischenablage, falls die Chat-App nur das Bild übernimmt.</p>
      <details id="selfOpen">
        <summary class="small" style="cursor:pointer">Ohne Teilen-Menü: Chat selbst öffnen</summary>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
          <p class="muted small">Öffne den Chat mit dem Auftrag und häng dort das Foto oder die Datei an.</p>
          <div class="row">${Object.entries(BOTS).map(([k, b]) => `<a class="btn ghost small" data-bot="${k}" href="${esc(b.url(photoPrompt()))}" target="_blank" rel="noopener">${b.name}</a>`).join("")}</div>
          <div class="prompt" id="promptText">${esc(photoPrompt())}</div>
          <button class="btn ghost small" id="copy">Auftrag kopieren</button>
        </div>
      </details>
      <p class="muted small">Kopier danach die Antwort im Chat und komm zurück. Die App holt sie sich selbst aus der Zwischenablage.</p>
    </details>
    <section class="panel">
      <h3>Eigene Liste</h3>
      <p class="muted small">Kopiere die Liste aus dem Chat oder lade die Datei, die der Chat dir gibt. Du kannst auch selbst tippen: eine Vokabel pro Zeile, <b>${esc(L().name.toLowerCase())} ; deutsch ; Beispielsatz ; #tag</b>.</p>
      <textarea id="paste" placeholder="${isEn() ? "mother ; Mutter&#10;brother ; Bruder ; I have got a brother." : "Wort ; deutsche Bedeutung"}"></textarea>
      <div class="row">
        ${navigator.clipboard && navigator.clipboard.readText ? '<button class="btn ghost small" id="fromClip">Aus Zwischenablage einfügen</button>' : ""}
        <label class="btn ghost small" for="answerFile">Antwort-Datei laden</label>
        <input type="file" id="answerFile" accept=".txt,.csv,.tsv,.md,text/*" hidden>
        <button class="btn small" id="parse">Liste prüfen</button>
      </div>
    </section>`}
    <section class="panel" id="reviewPanel" hidden>
      <div class="spread"><h3>${prefill ? "Vokabeln der Unit" : "Erkannte Vokabeln"}</h3><span class="small muted" id="rcount"></span></div>
      <div class="review" id="review"></div>
      <button class="btn wide" id="save">Übernehmen</button>
    </section>
  `));
  $("#back").onclick = () => { rows = []; photo = null; importName = ""; renderHome(); };
  $("#unitName").oninput = e => importName = e.target.value;
  if (!prefill) {
    $("#photo").onchange = $("#srcFile").onchange = e => {
      photo = e.target.files[0] || null; e.target.value = "";
      if (!photo) return;
      $("#photoLabel").textContent = "Anderes Foto wählen";
      $("#fileLabel").textContent = photo.type.startsWith("image/") ? "Datei wählen (PDF, Word, Excel …)" : "Gewählt: " + photo.name;
      const can = shareFiles && navigator.canShare({ files: [photo] });
      $("#sharePhoto").hidden = !can; $("#shareHint").hidden = !can;
      if (!can) { $("#selfOpen").open = true; toast("Teilen geht hier nicht. Öffne den Chat und häng die Datei an."); }
    };
    $("#sharePhoto").onclick = async () => {
      if (!photo) return;
      clipWatch = true;
      await copyText(photoPrompt());
      try { await navigator.share({ files: [photo], text: photoPrompt() }); }
      catch (err) { if (err && err.name !== "AbortError") { $("#selfOpen").open = true; toast("Teilen hat nicht geklappt. Öffne den Chat selbst."); } }
    };
    $$("[data-bot]").forEach(a => a.onclick = () => { clipWatch = true; copyText(photoPrompt()); if (BOTS[a.dataset.bot].copyFirst) toast("Auftrag kopiert. Füge ihn im Chat ein."); });
    $("#copy").onclick = async () => {
      clipWatch = true;
      if (await copyText(photoPrompt())) toast("Auftrag kopiert");
      else { const r = document.createRange(); r.selectNodeContents($("#promptText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Text markiert. Bitte kopieren."); }
    };
    if ($("#fromClip")) $("#fromClip").onclick = async () => {
      try { const t = await navigator.clipboard.readText(); $("#paste").value = t; addParsed(t); }
      catch (e) { toast("Kein Zugriff auf die Zwischenablage. Füge den Text mit langem Tippen ein."); }
    };
    $("#parse").onclick = () => addParsed($("#paste").value);
    $("#answerFile").onchange = async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; const t = await f.text(); $("#paste").value = t; addParsed(t); };
  }
  $("#save").onclick = () => {
    const unit = $("#unitName").value.trim() || "Neue Unit";
    const good = rows.filter(r => r.en.trim() && r.de.trim());
    if (!good.length) { toast("Die Liste ist leer"); return; }
    const added = addCards(unit, good);
    save(); rows = []; photo = null; importName = "";
    toast(added ? `${added} Vokabeln übernommen` : "Diese Vokabeln sind schon in der Unit"); renderHome();
  };
  if (rows.length) renderReview();
}
// Übernimmt Zeilen in eine Unit; doppelte Wörter in derselben Unit behalten ihren Lernstand,
// bekommen aber neue Eselsbrücken und Beispielsätze aus dem Link.
function addCards(unit, list, book) {
  const existing = new Map(cardsL().filter(c => c.unit === unit).map(c => [norm(c.en) + "|" + norm(c.de), c]));
  let added = 0;
  list.forEach(r => {
    const k = norm(r.en) + "|" + norm(r.de), old = existing.get(k);
    if (existing.has(k)) { if (old) { if (r.mn) old.mn = r.mn; if (r.dx) old.dx = r.dx; if (r.ex && !old.ex) old.ex = r.ex.trim(); if (r.tags) old.tags = [...new Set([...(old.tags || []), ...r.tags])]; if (r.part) old.part = r.part; if (book) old.book = book; } return; }
    existing.set(k, null);
    const c = { id: uid(), en: r.en.trim(), de: r.de.trim(), ex: (r.ex || "").trim(), unit, lang: S.cur, level: 0, due: 0 };
    if (r.mn) c.mn = r.mn;
    if (r.dx) c.dx = r.dx;
    if (r.tags && r.tags.length) c.tags = r.tags;
    if (r.part) c.part = r.part;
    if (r.nf) c.nf = 1;
    if (book) c.book = book;
    S.cards.push(c); added++;
  });
  dayLog().added += added;
  return added;
}
// Ein Link mit einem ganzen Buch: Jede Unit lässt sich gleich lernen oder erst einmal pausieren.
function renderBook(p) {
  const have = new Set(cardsL().map(c => c.unit)), total = p.units.reduce((n, u) => n + u.rows.length, 0);
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Vokabeln übernehmen</h2></div>
    <section class="hero">
      <b class="herotitle">${esc(p.title || "Vokabelpaket")}</b>
      <span class="muted small">${esc(p.lang)} · ${p.units.length === 1 ? esc(p.units[0].name) : p.units.length + " Units"} · ${total} Wörter</span>
    </section>
    <section class="panel">
      ${p.units.map((u, i) => {
        const bold = u.rows.filter(r => !r.nf).length;
        return `<p><b>${esc(u.name)}</b><br><span class="muted small">${u.rows.length} Wörter${have.has(u.name) ? " · schon im Kasten, nur Neues kommt dazu" : ""}</span></p>` +
          (bold < u.rows.length ? `<div class="chips" role="group" aria-label="Welche Wörter aus ${esc(u.name)}?">
            <button class="chip" data-u="${i}" data-all="0" aria-pressed="true">Nur fett gedruckte (${bold})</button>
            <button class="chip" data-u="${i}" data-all="1" aria-pressed="false">Alle (${u.rows.length})</button></div>` : "");
      }).join("")}
      <p class="muted small">Gleich danach tippst du an, wie weit ihr in der Schule seid. Nur das wird abgefragt.</p>
    </section>
    <button class="btn wide" id="save">Übernehmen</button>`));
  // Fett gedruckt ist im Buch der Lernwortschatz; „Alle“ holt auch die übrigen Wörter. Später nochmal „Alle“ ergänzt nur den Rest.
  const all = p.units.map(() => false);
  $$("[data-u]").forEach(b => b.onclick = () => {
    all[+b.dataset.u] = b.dataset.all === "1";
    $$(`[data-u="${b.dataset.u}"]`).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  });
  $("#back").onclick = () => renderHome();
  $("#save").onclick = () => {
    const lang = L(); let added = 0;
    lang.paused = lang.paused || [];
    p.units.forEach((u, i) => { added += addCards(u.name, all[i] ? u.rows : u.rows.filter(r => !r.nf), p.title); if (!have.has(u.name)) lang.paused.push(u.name); });
    save();
    toast(added ? `${added} Vokabeln übernommen` : "Diese Vokabeln sind schon in deinem Kasten");
    renderPos(p.units[0].name);
  };
  window.scrollTo(0, 0);
}
function addParsed(text) {
  const p = parseList(text);
  if (!p.rows.length) { toast(`Keine Zeile im Format ${L().name.toLowerCase()} ; deutsch gefunden`); return; }
  rows = rows.concat(p.rows);
  if (p.name && !$("#unitName").value.trim()) { $("#unitName").value = p.name; importName = p.name; }
  renderReview();
  $("#reviewPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderReview() {
  $("#reviewPanel").hidden = !rows.length;
  $("#rcount").textContent = rows.length + " Wörter";
  const box = $("#review");
  box.replaceChildren(h(`<div class="rrow small muted"><span>${esc(L().name)}</span><span>Deutsch</span><span></span></div>` +
    rows.map((r, i) => `<div class="rrow"><input class="input" data-k="en" data-i="${i}" value="${esc(r.en)}" aria-label="${esc(L().name)}">
      <input class="input" data-k="de" data-i="${i}" value="${esc(r.de)}" aria-label="Deutsch">
      <button data-rm="${i}" aria-label="Zeile entfernen">×</button>
      <input class="input rtags" data-k="tags" data-i="${i}" value="${esc((r.tags || []).map(t => "#" + t).join(" "))}" placeholder="#tags" aria-label="Tags"></div>`).join("")));
  $$("input", box).forEach(inp => inp.oninput = () => {
    const r = rows[+inp.dataset.i];
    if (inp.dataset.k === "tags") r.tags = inp.value.split(/[\s,]+/).map(normTag).filter(Boolean).slice(0, 5); else r[inp.dataset.k] = inp.value;
  });
  $$("[data-rm]", box).forEach(b => b.onclick = () => { rows.splice(+b.dataset.rm, 1); renderReview(); });
}

// ---------- Unit teilen ----------
async function renderShare(unit) {
  const cards = cardsL().filter(c => c.unit === unit);
  const link = appUrl() + "#pack=" + await encodePack(unit, cards);
  let qrSvg = "";
  try {
    if (window.qrcode && link.length <= 2000) { const q = qrcode(0, "L"); q.addData(link, "Byte"); q.make(); qrSvg = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
  } catch (e) { qrSvg = ""; }
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Unit teilen</h2></div>
    <section class="panel">
      <h3 style="overflow-wrap:anywhere">${esc(unit)}</h3>
      <p class="muted small">${esc(L().name)}, ${cards.length} Wörter. Der Link enthält nur die Wortliste, keinen Lernstand und keine Namen. Wer ihn öffnet, kann die Unit in die eigene App übernehmen.</p>
      ${qrSvg ? `<div class="qr" role="img" aria-label="QR-Code für diese Unit">${qrSvg}</div><p class="muted small" style="text-align:center">Zum Scannen mit der Handy-Kamera, zum Beispiel vom Beamer.</p>`
        : `<p class="status">Für einen QR-Code sind es zu viele Wörter. Teile den Link oder teile die Unit in zwei Teile.</p>`}
      ${navigator.share ? `<button class="btn wide" id="shareLink">${ICON.share}Link teilen</button>` : ""}
      <button class="btn ghost wide" id="copyLink">Link kopieren</button>
    </section>
  `));
  $("#back").onclick = renderHome;
  if ($("#shareLink")) $("#shareLink").onclick = async () => { try { await navigator.share({ title: unit, text: `Vokabeln: ${unit}`, url: link }); } catch (e) {} };
  $("#copyLink").onclick = async () => toast(await copyText(link) ? "Link kopiert" : "Kopieren ging nicht");
}

// ---------- Grammatik: erst erklären, dann üben ----------
const GRAM = window.GRAMMAR || {};
let G = null;
function gData() { return GRAM[L().name]; }
function gReady(t) { return !!(t.explain && t.tasks); }
function gStore() { return S.gram[S.cur] || (S.gram[S.cur] = {}); }
// **fett** in den Texten wird markiert; alles andere wird als Text ausgegeben.
function gmark(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<mark>$1</mark>"); }
function gStars(r) { if (!r) return ""; const n = r.best >= 1 ? 3 : r.best >= .75 ? 2 : 1; return "★".repeat(n) + "☆".repeat(3 - n); }
// Grammatik-Kasten: Geübte Themen bekommen ein Fach und melden sich in wachsenden Abständen in der Tagesrunde.
// Haken für „Wir sind bei“ (Lernlogik): gesperrte Themen kommen nicht in die Tagesrunde.
// Grammatik aus Camden Town 5 (band ct-N) kommt erst, wenn Theme N im Buch erreicht ist („Wir sind bei“).
function gUnlocked(t) {
  const m = /^ct-(\d+)$/.exec(t.band || ""); if (!m) return true;
  const re = new RegExp(`^Theme ${m[1]}\\b`), cs = cardsL().filter(c => /^Camden Town 5/.test(c.book || "") && re.test(c.unit));
  return !cs.length || cs.some(c => !isPaused(c));
}
function gDue() {
  const d = gData(); if (!d) return [];
  const st = gStore(), now = Date.now();
  return d.topics.filter(t => gReady(t) && gUnlocked(t) && st[t.id] && st[t.id].box && st[t.id].due <= now).sort((a, b) => st[a.id].due - st[b.id].due);
}
// Ein fälliges Thema kommt immer ganz (alle Aufgaben) ans Ende der Tagesrunde.
function grammarItems() {
  const t = gDue()[0]; if (!t) return [];
  return shuffle(t.tasks.map((_, i) => i)).map(i => `g|${t.id}|${i}`);
}
// Ins nächste Fach geht es erst nach der ganzen Runde, mit höchstens einem Fehler beim ersten Versuch.
const G_MAX_ERR = 1;
function gMove(id, ok) {
  const d = gData(), t = d && d.topics.find(x => x.id === id), st = gStore()[id]; if (!t || !st) return "";
  const b0 = st.box || 1;
  st.box = ok ? Math.min(7, b0 + 1) : Math.max(1, b0 - 2); st.due = today() + INTERVAL[st.box] * DAY;
  return ok ? `Grammatik „${esc(t.t)}“ wandert weiter in Fach ${st.box}.` : `Grammatik „${esc(t.t)}“ rutscht zurück in Fach ${st.box} und kommt morgen wieder.`;
}
function grammarCard() {
  const d = gData(); if (!d) return "";
  const ready = d.topics.filter(gReady), st = gStore();
  const done = ready.filter(t => st[t.id]).length, due = gDue().length;
  const counts = Array(8).fill(0); ready.forEach(t => counts[st[t.id] && st[t.id].box || 0]++);
  return `<section class="panel gcard">
      <div class="spread"><div><h2>Grammatik-Kasten</h2><p class="muted small">${done} von ${ready.length} Themen geübt${due ? ` · ${due} fällig` : ""}</p></div>
        <button class="btn small" id="gram">Öffnen</button></div>
      ${done ? kastenHtml(counts, true, "Grammatikthemen pro Fach") : ""}
      <p class="muted small">${done ? "Fällige Themen hängt die App mit 3 kurzen Aufgaben an deine Tagesrunde." : "Jedes Thema wird erst erklärt, mit Beispielen. Danach kommen 8 kurze Aufgaben, und das Thema zieht in den Kasten ein."}</p>
    </section>`;
}
function renderGrammar() {
  const d = gData(), st = gStore();
  let group = null;
  const bands = d.bands.map(b => {
    const ts = d.topics.filter(t => t.band === b.id);
    const rev = (b.review || []).map(id => d.topics.find(t => t.id === id)).filter(t => t && gReady(t));
    if (!ts.length && !rev.length) return "";
    const head = b.group && b.group !== group ? `<h2 class="ggroup">${esc(b.group)}</h2>` : "";
    group = b.group || null;
    const H = b.group ? "h3" : "h2";
    const ready = ts.filter(gReady);
    if (!ts.length) return `${head}<section><h3>${esc(b.label)}</h3>${b.note ? `<p class="muted small">${esc(b.note)}.</p>` : ""}
      <div class="gtopics">${rev.map(t => `<button class="gtopic" data-topic="${t.id}"><span><b>${esc(t.t)}</b><span class="muted small">Wiederholung · ${esc(t.de)}</span></span>
        <span class="gstars">${st[t.id] ? gStars(st[t.id]) : "neu"}</span></button>`).join("")}</div></section>`;
    const item = t => gReady(t)
      ? `<button class="gtopic" data-topic="${t.id}"><span><b>${esc(t.t)}</b><span class="muted small">${esc(t.de)}${t.rez ? " · erkennen" : ""}</span></span>
          <span class="gstars" aria-label="${st[t.id] ? `beste Runde ${Math.round(st[t.id].best * 100)} Prozent` : "noch nicht geübt"}">${st[t.id] ? gStars(st[t.id]) : "neu"}</span></button>`
      : `<li>${esc(t.t)} <span class="muted">· ${esc(t.de)}${t.rez ? " · erkennen" : ""}${t.g8 ? " · nur G8" : ""}</span></li>`;
    return ready.length
      ? `${head}<section><div class="spread"><${H}>${esc(b.label)}</${H}><span class="muted small">${ready.filter(t => st[t.id]).length}/${ready.length}</span></div>
          ${b.note ? `<p class="muted small">${esc(b.note)}.</p>` : ""}
          <div class="gtopics">${ready.map(item).join("")}</div></section>`
      : `${head}<details class="panel gsoon"><summary><b>${esc(b.label)}</b> <span class="muted small">· ${ts.length} ${ts.length === 1 ? "Thema" : "Themen"}, Übungen folgen</span></summary>
          ${b.note ? `<p class="muted small">${esc(b.note)}.</p>` : ""}<ul>${ts.map(item).join("")}</ul></details>`;
  }).join("");
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Grammatik ${esc(L().name)}</h2></div>
    ${bands}
    <p class="muted small">Grundlage: ${esc(d.source)}.</p>`));
  $("#back").onclick = renderHome;
  $$("[data-topic]").forEach(b => b.onclick = () => renderTopic(b.dataset.topic));
  window.scrollTo(0, 0);
}
function explainHtml(t) {
  return `${(t.anim || []).map(morphHtml).join("")}<div class="gexplain">${t.explain.map(p => `<p>${gmark(p)}</p>`).join("")}</div>
    ${t.ex && t.ex.length ? `<div class="gexamples"><p class="eyebrow">Beispiele</p>${t.ex.map(([f, de]) =>
      `<div class="gex"><span>${gmark(f)}<br><span class="muted small">${esc(de)}</span></span>
        ${canHear() ? `<button class="iconbtn gsay" data-say="${esc(f.replace(/\*\*/g, ""))}" aria-label="Vorlesen">${ICON.speaker}</button>` : ""}</div>`).join("")}</div>` : ""}`;
}
function bindSay(root = document) { $$("[data-say]", root).forEach(b => b.onclick = () => say(b.dataset.say)); playMorphs(root); }
// ---------- Bewegte Eselsbrücken ----------
// Grammatik: Satz a verwandelt sich in Satz b. Gleiche Wörter gleiten an ihren neuen Platz,
// was wegfällt, fällt herunter, und was neu ist, springt von oben hinein.
function morphHtml(m) {
  return `<div class="morph" data-a="${esc(m.a)}" data-b="${esc(m.b)}"><div class="mline" aria-label="${esc(m.a)} wird zu ${esc(m.b)}"></div>
    ${m.hint ? `<p class="mhint">${gmark(m.hint)}</p>` : ""}<button class="link mreplay" type="button">Nochmal ansehen</button></div>`;
}
function playMorphs(root = document) { $$(".morph", root).forEach(el => { if (!el.dataset.on) { el.dataset.on = 1; $(".mreplay", el).onclick = () => runMorph(el); runMorph(el); } }); }
function runMorph(el) {
  const line = $(".mline", el), A = el.dataset.a.split(" "), B = el.dataset.b.split(" ");
  const core = w => w.toLowerCase().replace(/[.,!?]/g, "");
  clearTimeout(el._t);
  const used = new Set(), pre = {};
  const map = B.map((w, j) => {
    let k = A.findIndex((x, i) => !used.has(i) && core(x) === core(w));
    if (k < 0) { k = A.findIndex((x, i) => !used.has(i) && core(x).length >= 2 && (core(w).startsWith(core(x)) || core(x).startsWith(core(w)))); if (k >= 0) pre[j] = Math.min(core(A[k]).length, core(w).length); }
    if (k >= 0) used.add(k);
    return k;
  });
  const bHtml = B.map((w, j) => map[j] < 0 ? `<span class="mtok mnew">${esc(w)}</span>`
    : pre[j] !== undefined && core(w).length > pre[j] ? `<span class="mtok" data-k="${map[j]}">${esc(w.slice(0, pre[j]))}<span class="mnew">${esc(w.slice(pre[j]))}</span></span>`
    : `<span class="mtok" data-k="${map[j]}">${esc(w)}</span>`).join(" ");
  if (reduced() || !line.animate) { line.innerHTML = bHtml; return; }
  line.innerHTML = A.map((w, i) => `<span class="mtok" data-i="${i}">${esc(w)}</span>`).join(" ");
  el._t = setTimeout(() => {
    if (!line.isConnected) return;
    const box = line.getBoundingClientRect();
    const old = $$(".mtok", line).map(x => x.getBoundingClientRect());
    line.innerHTML = bHtml;
    A.forEach((w, i) => {
      if (used.has(i)) return;
      const g = document.createElement("span"); g.className = "mtok mgone"; g.textContent = w;
      g.style.left = old[i].left - box.left + "px"; g.style.top = old[i].top - box.top + "px"; line.append(g);
      g.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(34px) rotate(14deg)", opacity: 0 }], { duration: 650, easing: "ease-in", fill: "forwards" });
    });
    $$(".mtok[data-k]", line).forEach(x => {
      const o = old[+x.dataset.k], n = x.getBoundingClientRect();
      x.animate([{ transform: `translate(${o.left - n.left}px,${o.top - n.top}px)` }, { transform: "none" }], { duration: 700, easing: "cubic-bezier(.5,0,.2,1)" });
    });
    $$(".mnew", line).forEach((x, i) => x.animate([{ transform: "translateY(-36px) scale(1.4)", opacity: 0 }, { transform: "translateY(4px) scale(1.15)", opacity: 1, offset: .7 }, { transform: "none", opacity: 1 }],
      { duration: 550, delay: 550 + i * 120, easing: "ease-out", fill: "backwards" }));
    el._t = setTimeout(() => { if (line.isConnected && (el._n = (el._n || 0) + 1) < 3) runMorph(el); }, 4200);
  }, 1300);
}
// Wörter: Die Bilder der Eselsbrücke laufen wie ein kleiner Film nacheinander ab; die Merkstelle im Wort springt hinein.
function playMnemo(root) {
  $$(".mnemo-pic[data-frames]", root).forEach(el => {
    const fr = el.dataset.frames.split("|"); let i = 0;
    if (fr.length < 2 || reduced()) { el.textContent = fr[fr.length - 1]; return; }
    const step = () => {
      if (!el.isConnected) return;
      el.textContent = fr[i % fr.length]; el.animate([{ transform: "scale(.4) rotate(-10deg)", opacity: 0 }, { transform: "scale(1.15)", opacity: 1, offset: .6 }, { transform: "none" }], { duration: 450, easing: "ease-out" });
      if (++i < fr.length * 2) setTimeout(step, i % fr.length ? 1000 : 1700);
    };
    step();
  });
}
function renderTopic(id) {
  const d = gData(), t = d.topics.find(x => x.id === id), band = d.bands.find(b => b.id === t.band);
  const r = gStore()[t.id];
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><span class="eyebrow">${esc(band.label)} · Grammatik</span></div>
    <header><h1>${esc(t.t)}</h1><p class="muted">${esc(t.de)}</p></header>
    <section class="panel">${explainHtml(t)}</section>
    ${t.rez ? `<p class="muted small">Dieses Thema sollst du laut Bildungsplan vor allem erkennen. Die Aufgaben sind deshalb zum Auswählen.</p>` : ""}
    <button class="btn wide" id="go">Üben: ${t.tasks.length} Aufgaben</button>
    ${r ? `<p class="muted small" style="text-align:center">Beste Runde: ${Math.round(r.best * 100)} % ${gStars(r)}</p>` : ""}`));
  $("#back").onclick = renderGrammar;
  $("#go").onclick = () => startGrammar(t);
  bindSay();
  window.scrollTo(0, 0);
}
function startGrammar(t) {
  G = { t, queue: shuffle(t.tasks.map((_, i) => i)), total: t.tasks.length, done: new Set(), first: {}, good: 0, last: Date.now(), newBadges: [] };
  renderTask();
}
// Vergleich ohne Groß-/Kleinschreibung, Satzzeichen am Ende und mit einheitlichen Apostrophen.
function gnorm(s) { return norm(s).replace(/[,!?.]/g, "").replace(/\s+/g, " ").trim(); }
function taskQuestion(task) {
  return task[0] === "order" ? "Bring die Wörter in die richtige Reihenfolge."
    : tapWords(task[1]).replace(/___/g, '<span class="gapline" aria-label="Lücke">&nbsp;</span>');
}
// Antippen übersetzt ein Wort für TAP_MS. Quelle: eigene Wortkarten, dann die Grundwörter aus grammar.js.
const TAP_MS = 2000;
function tapWords(s) { return esc(s).replace(/\p{L}[\p{L}'’]*/gu, w => `<span class="tw" data-w="${w}">${w}</span>`); }
let glossMap = null, glossLang = null;
function glossOf(w) {
  if (glossLang !== S.cur || !glossMap) {
    glossLang = S.cur; glossMap = new Map(Object.entries((gData() || {}).gloss || {}));
    cardsL().forEach(c => String(c.en).split(/[,/;]/).forEach(e => {
      const k = e.replace(/\([^)]*\)/g, "").replace(/^\s*to\s+/i, "").trim().toLowerCase();
      if (k && !k.includes(" ") && !glossMap.has(k)) glossMap.set(k, c.de);
    }));
  }
  const l = w.toLowerCase().replace(/’/g, "'"), b = l.replace(/'s$/, "");
  const tries = [l, b, b.replace(/s$/, ""), b.replace(/es$/, ""), b.replace(/ies$/, "y"), b.replace(/ied$/, "y"), b.replace(/ed$/, ""), b.replace(/d$/, ""),
    b.replace(/ing$/, ""), b.replace(/ing$/, "e"), b.replace(/(.)\1(ing|ed)$/, "$1"), b.replace(/(er|est)$/, ""), b.replace(/i(er|est)$/, "y"), b.replace(/(.)\1(er|est)$/, "$1")];
  for (const k of tries) if (glossMap.has(k)) return glossMap.get(k);
  return "";
}
document.addEventListener("click", e => {
  const el = e.target.closest(".tw"); if (!el) return;
  const old = $(".twpop"); if (old) old.remove();
  const pop = h(`<span class="twpop" role="status">${esc(glossOf(el.dataset.w) || "nicht in deinen Karten")}</span>`).firstElementChild;
  el.append(pop); setTimeout(() => pop.remove(), TAP_MS);
});
// Zeichnet eine Aufgabe (auswählen, Lücke, Reihenfolge) und meldet done(richtig, ganzer Satz, Begründung).
function drawTask(task, area, done) {
  const [type, q] = task;
  if (type === "gap" && task[4]) return drawTask(["pick", q, [task[2].split("|")[0], ...task[4]], task[3]], area, done);
  if (type === "pick") {
    const right = task[2][0], opts = shuffle([...task[2]]);
    area.replaceChildren(h(`<div class="choices">${opts.map((o, k) => `<button class="choice" data-k="${k}">${esc(o)}</button>`).join("")}</div>`));
    $$(".choice", area).forEach(b => b.onclick = () => {
      const ok = opts[+b.dataset.k] === right;
      $$(".choice", area).forEach(x => { x.disabled = true; if (opts[+x.dataset.k] === right) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      done(ok, q.includes("___") ? q.replace(/\s*\([^)]*\)\s*$/, "").replace("___", right) : right, task[3]);
    });
  } else if (type === "gap") {
    const sols = task[2].split("|");
    area.replaceChildren(h(`<form id="f" autocomplete="off">
      <input class="answer" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="Lücke ausfüllen …" aria-label="Deine Antwort">
      <button class="btn wide" type="submit" style="margin-top:12px">Prüfen</button></form>`));
    const inp = $("#ans", area); setTimeout(() => inp.focus({ preventScroll: true }), 50);
    $("#f", area).onsubmit = e => {
      e.preventDefault(); if (!inp.value.trim()) return;
      inp.disabled = true; $("button", e.target).hidden = true;
      done(sols.some(s => gnorm(s) === gnorm(inp.value)), q.replace(/\s*\([^)]*\)\s*$/, "").replace("___", sols[0]), task[3]);
    };
  } else {
    const sols = q.split("|"), words = sols[0].replace(/[.!?]$/, "").split(" ");
    if (words[0] !== "I") words[0] = words[0].charAt(0).toLowerCase() + words[0].slice(1);
    let pool = shuffle(words.map((w, k) => ({ w, k })));
    if (pool.map(x => x.w).join(" ") === words.join(" ")) pool.reverse();   // nie schon fertig gemischt
    const picked = [];
    const draw = () => {
      area.replaceChildren(h(`<div class="oline" aria-label="Dein Satz">${picked.map((x, k) => `<button class="tile" data-back="${k}">${esc(x.w)}</button>`).join("") || '<span class="muted small">Tipp die Wörter unten an.</span>'}</div>
        <div class="opool">${pool.map((x, k) => `<button class="tile" data-take="${k}">${esc(x.w)}</button>`).join("")}</div>
        <button class="btn wide" id="chk" ${pool.length ? "disabled" : ""}>Prüfen</button>`));
      $$("[data-take]", area).forEach(b => b.onclick = () => { picked.push(pool.splice(+b.dataset.take, 1)[0]); sound("tap"); draw(); });
      $$("[data-back]", area).forEach(b => b.onclick = () => { pool.push(picked.splice(+b.dataset.back, 1)[0]); draw(); });
      $("#chk", area).onclick = () => {
        $$(".tile, #chk", area).forEach(x => x.disabled = true);
        done(sols.some(s => gnorm(s) === gnorm(picked.map(x => x.w).join(" "))), sols[0], task[2]);
      };
    };
    draw();
  }
}
function taskFeedback(ok, full, why, t) {
  const say1 = canHear() ? `<button class="speak" id="say2">${ICON.speaker}Anhören</button>` : "";
  return ok
    ? `<div class="feedback good"><strong>${pick(["Richtig!", "Super!", "Genau!", "Stark!"])}</strong><span class="sol">${esc(full)}</span><div class="row">${say1}</div></div>`
    : `<div class="feedback bad"><strong>Noch nicht.</strong><span class="fbtext">Richtig ist: <span class="sol">${esc(full)}</span>
        ${why ? `<span class="small">${esc(why)}</span>` : ""}<span class="small">Die Aufgabe kommt gleich noch einmal.</span></span><div class="row">${say1}</div>
        ${t ? `<details class="gagain" open><summary><b>Erklärung</b></summary>${explainHtml(t)}</details>` : ""}</div>`;
}
function renderTask() {
  tick();
  if (!G.queue.length) return renderGSummary();
  const t = G.t, i = G.queue[0], task = t.tasks[i];
  const pct = Math.round(G.done.size / G.total * 100);
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="quit" aria-label="Übung beenden">${ICON.x}</button>
      <div class="bar"><i style="width:${pct}%"></i></div><span class="small muted" style="font-variant-numeric:tabular-nums">${G.done.size}/${G.total}</span></div>
    <div class="icard pop">
      <span class="eyebrow">${esc(t.t)}</span>
      <div class="gq">${taskQuestion(task)}</div>
      <div id="answerArea"></div>
      <div id="fb"></div>
    </div>
    <details class="panel gagain"><summary><b>Erklärung ansehen</b></summary>${explainHtml(t)}</details>`));
  $("#quit").onclick = () => { tick(); save(); G = null; renderGrammar(); };
  bindSay();
  drawTask(task, $("#answerArea"), gAnswered);
}
function gAnswered(ok, full, why) {
  tick();
  const i = G.queue.shift(), firstTime = !(i in G.first);
  dayLog().gram++;
  if (firstTime) { G.first[i] = ok; if (ok) G.good++; }
  if (ok) G.done.add(i); else G.queue.splice(Math.min(G.queue.length, 3), 0, i);
  sound(ok ? "good" : "bad");
  $("#fb").replaceChildren(h(taskFeedback(ok, full, why)));
  $("#fb").append(h(`<button class="btn wide" id="next" style="margin-top:12px">Weiter</button>`));
  if ($("#say2")) $("#say2").onclick = () => say(full);
  addXp(ok ? (firstTime ? 10 : 4) : 0);
  checkGoal(); checkBadges();
  save();
  const nx = $("#next"); nx.focus({ preventScroll: true }); nx.onclick = renderTask;
}
function renderGSummary() {
  tick();
  const t = G.t, n = G.total, g = G.good, st = gStore(), old = st[t.id], ok = n - g <= G_MAX_ERR;
  st[t.id] = { best: Math.max(old ? old.best : 0, g / n), last: dayKey(), n: (old ? old.n : 0) + 1, box: old && old.box || 0, due: old ? old.due : 0 };
  if (!old || !old.box) { st[t.id].box = ok ? 2 : 1; st[t.id].due = today() + INTERVAL[st[t.id].box] * DAY; }
  else gMove(t.id, ok);
  G.finished = true; checkBadges();
  save();
  const d = gData(), ready = d.topics.filter(gReady), next = ready[ready.indexOf(t) + 1], box = st[t.id].box;
  app.replaceChildren(h(`<div class="done">
    <p class="eyebrow">${esc(t.t)} geschafft</p>
    <div class="score">${g}/${n}</div>
    <p>${g === n ? (S.name ? `Stark, ${esc(S.name)}! Alles beim ersten Versuch richtig.` : "Alles beim ersten Versuch richtig.") : "beim ersten Versuch richtig. Die anderen hast du am Ende auch geschafft."}</p>
    <p class="gstars big" aria-label="Sterne">${gStars(st[t.id])}</p>
    <p class="small">Im Grammatik-Kasten liegt das Thema jetzt in Fach ${box} und meldet sich ${FACH_IN[box]} in deiner Tagesrunde.</p>
    ${G.newBadges && G.newBadges.length ? `<div class="newbadges">${G.newBadges.map(b => `<div class="badge got"><span>${b.icon}</span><b>${esc(b.name)}</b></div>`).join("")}</div>` : ""}
    <button class="streak" id="toCal">${ICON.flame}<span>${liveStreak()} ${liveStreak() === 1 ? "Tag" : "Tage"} am Stück · heute ${fmtMin(dayLog().sec)}</span></button>
    <div class="row" style="justify-content:center"><button class="btn" id="again">Nochmal</button>
      ${next ? `<button class="btn ghost" id="next">Nächstes Thema</button>` : ""}<button class="btn ghost" id="list">Übersicht</button></div>
  </div>`));
  if (g === n) confetti();
  $("#again").onclick = () => startGrammar(t);
  if (next) $("#next").onclick = () => { G = null; renderTopic(next.id); };
  $("#list").onclick = () => { G = null; renderGrammar(); };
  $("#toCal").onclick = () => { G = null; renderCalendar(); scrollTo(0, 0); };
}

// ---------- Übungskalender ----------
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
let calMonth = null, calSel = null;
function weekStart(k) { const [y, m, d] = k.split("-").map(Number); const wd = (new Date(y, m - 1, d).getDay() + 6) % 7; return shiftDay(k, -wd); }
function sumDays(from, n, f) { let t = 0; for (let i = 0; i < n; i++) { const d = S.log[shiftDay(from, i)]; if (d) t += d[f]; } return t; }
function renderCalendar() {
  const tk = dayKey();
  if (!calMonth) { const d = new Date(); calMonth = [d.getFullYear(), d.getMonth()]; }
  if (!calSel) calSel = tk;
  const [y, m] = calMonth;
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
  const maxSec = Math.max(600, ...Object.values(S.log).map(d => d.sec));
  const cells = [], pauses = streakInfo().pauses;
  for (let i = 0; i < lead; i++) cells.push(`<span></span>`);
  for (let d = 1; d <= days; d++) {
    const k = dayKey(new Date(y, m, d).getTime()), e = S.log[k];
    const lvl = practiced(k) ? Math.min(4, 1 + Math.floor(e.sec / maxSec * 3.99)) : 0;
    cells.push(`<button class="day lv${lvl}${k === tk ? " today" : ""}${pauses.has(k) ? " pause" : ""}" data-day="${k}" aria-pressed="${k === calSel}"
      aria-label="${d}. ${MONTHS[m]}${practiced(k) ? ", " + fmtMin(e.sec) + " geübt" : pauses.has(k) ? ", Pausentag" : ""}">${d}${e && e.added ? '<i class="dot"></i>' : ""}</button>`);
  }
  const ws = weekStart(tk), weekSec = sumDays(ws, 7, "sec");
  const weekDays = [...Array(7)].filter((_, i) => practiced(shiftDay(ws, i))).length;
  const sel = S.log[calSel] || { sec: 0, ans: 0, right: 0, learned: 0, added: 0, gram: 0 };
  const [sy, sm, sd] = calSel.split("-").map(Number);
  const selDate = new Date(sy, sm - 1, sd).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const weeks = [...Array(6)].map((_, i) => { const st = shiftDay(ws, -7 * i); return { st, sec: sumDays(st, 7, "sec"), added: sumDays(st, 7, "added") }; });
  const wmax = Math.max(60, ...weeks.map(w => w.sec));
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Übungskalender</h2></div>
    <section class="today">
      <div class="stats" style="flex-wrap:wrap">
        <div><span class="big">${liveStreak()}</span><span class="muted small">Tage am Stück</span></div>
        <div><span class="big">${Math.ceil(dayLog(tk).sec / 60)}</span><span class="muted small">Min heute</span></div>
        <div><span class="big">${Math.ceil(weekSec / 60)}</span><span class="muted small">Min diese Woche</span></div>
      </div>
      <p class="muted small">${weekDays ? `Diese Woche an ${weekDays} ${weekDays === 1 ? "Tag" : "Tagen"} geübt, im Schnitt ${fmtMin(weekSec / weekDays)} pro Übungstag.` : "Diese Woche noch nicht geübt."}</p>
    </section>
    <section class="panel">
      <div class="spread"><button class="iconbtn" id="prevM" aria-label="Voriger Monat">${ICON.back}</button>
        <h3>${MONTHS[m]} ${y}</h3>
        <button class="iconbtn" id="nextM" aria-label="Nächster Monat" style="transform:scaleX(-1)">${ICON.back}</button></div>
      <div class="cal">${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => `<span class="wd">${d}</span>`).join("")}${cells.join("")}</div>
      <p class="muted small legend"><span class="day lv2 sw"></span> geübt, je dunkler, desto länger · <span class="dot" style="position:static;display:inline-block"></span> neue Wörter dazu · 💤 Pausentag</p>
      <p class="muted small">Pro Woche darf ein Tag ausfallen, ohne dass deine Serie reißt. Das ist dein Pausentag.</p>
    </section>
    <section class="panel">
      <h3>${selDate}</h3>
      ${sel.ans || sel.sec || sel.added || sel.gram ? `<dl class="facts">
        <div><dt>Geübt</dt><dd>${fmtMin(sel.sec)}</dd></div>
        ${sel.ans || !sel.gram ? `<div><dt>Abgefragt</dt><dd>${sel.ans} ${sel.ans === 1 ? "Wort" : "Wörter"}</dd></div>
        <div><dt>Richtig</dt><dd>${sel.ans ? Math.round(sel.right / sel.ans * 100) : 0} %</dd></div>` : ""}
        <div><dt>Zum ersten Mal geübt</dt><dd>${sel.learned}</dd></div>
        <div><dt>Neu hinzugefügt</dt><dd>${sel.added}</dd></div>
        ${sel.gram ? `<div><dt>Grammatik</dt><dd>${sel.gram} ${sel.gram === 1 ? "Aufgabe" : "Aufgaben"}</dd></div>` : ""}
      </dl>` : `<p class="muted small">${pauses.has(calSel) ? "Pausentag. Deine Serie lief trotzdem weiter." : "An diesem Tag wurde nicht geübt."}</p>`}
    </section>
    <section class="panel">
      <h3>Letzte Wochen</h3>
      <div class="weeks">${weeks.map(w => { const [a, b, c] = w.st.split("-").map(Number);
        return `<div class="wk"><span class="small">ab ${c}.${b}.</span><span class="bar"><i style="width:${Math.round(w.sec / wmax * 100)}%"></i></span>
          <span class="small" style="text-align:right">${fmtMin(w.sec)}${w.added ? ` · +${w.added} Wörter` : ""}</span></div>`; }).join("")}</div>
    </section>`));
  $("#back").onclick = () => { calMonth = null; calSel = null; renderHome(); };
  const stay = f => () => { const sy = scrollY; f(); renderCalendar(); scrollTo(0, sy); };
  $("#prevM").onclick = stay(() => calMonth = m === 0 ? [y - 1, 11] : [y, m - 1]);
  $("#nextM").onclick = stay(() => calMonth = m === 11 ? [y + 1, 0] : [y, m + 1]);
  $$("[data-day]").forEach(b => b.onclick = stay(() => calSel = b.dataset.day));
}

// ---------- Einstellungen ----------
let deferredInstall = null, confirmLangDelete = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; });
function renderSettings(msg) {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Einstellungen</h2></div>
    ${standalone ? "" : `<section class="panel">
      <h3>Als App installieren</h3>
      ${deferredInstall ? `<button class="btn wide" id="install">Auf den Startbildschirm legen</button>`
        : ios ? `<p class="muted small">Tipp in Safari unten auf <b>Teilen</b> und dann auf <b>Zum Home-Bildschirm</b>.</p>`
        : `<p class="muted small">Öffne das Browser-Menü (⋮) und wähle <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b>.</p>`}
      <p class="muted small">Danach startet der Vokabelkasten wie eine App und funktioniert auch ohne Internet.</p>
    </section>`}
    <section class="panel">
      <form id="nameForm" class="f" style="gap:8px"><label class="f" style="margin:0">Dein Name
        <input class="input" id="nameIn" maxlength="30" placeholder="Vorname oder Spitzname" value="${esc(S.name)}"></label>
        <button class="btn ghost small" type="submit" style="align-self:flex-start">Speichern</button></form>
    </section>
    <section class="panel">
      <h3>Deine Sprachen</h3>
      ${S.langs.map(l => `<div class="spread"><span><span class="flag">${flagOf(l)}</span> ${esc(l.name)} <span class="muted small">· ${S.cards.filter(c => c.lang === l.id).length} Wörter</span></span>
        ${confirmLangDelete === l.id
          ? `<span class="row small" style="gap:8px">Mit allen Wörtern löschen?<button class="link" data-ldel-yes="${l.id}">Ja</button><button class="link" data-ldel-no>Nein</button></span>`
          : `<button class="link" data-ldel="${l.id}">Löschen</button>`}</div>`).join("")}
      <button class="btn ghost small" id="addLang2" style="align-self:flex-start">+ Sprache hinzufügen</button>
    </section>
    <section class="panel">
      <h3>Tagesziel</h3>
      <div class="chips">${[10, 20, 30, 50].map(n => `<button class="chip" data-goal="${n}" aria-pressed="${S.goal === n}">${n} Antworten</button>`).join("")}</div>
      <p class="muted small">Der Ring auf der Startseite füllt sich mit jeder Antwort, auch bei Grammatik. 20 Antworten sind etwa 5 Minuten.</p>
      <label class="toggle"><span><b>Töne</b><br><span class="muted small">Kurze Klänge bei richtig, falsch und wenn eine Karte im Fach landet.</span></span>
        <input type="checkbox" id="sound" ${S.sound ? "checked" : ""}></label>
    </section>
    <section class="panel">
      <h3>Neue Wörter pro Tag</h3>
      <div class="chips">${[5, 10, 15, 20].map(n => `<button class="chip" data-npd="${n}" aria-pressed="${S.newPerDay === n}">${n}</button>`).join("")}</div>
      <p class="muted small">Mehr neue Wörter heißt später auch mehr Wiederholungen. 10 am Tag sind etwa 10 Minuten.</p>
    </section>
    <section class="panel">
      <label class="toggle"><span><b>KI-Hilfe bei jedem Wort</b><br><span class="muted small">Zeigt nach der Antwort einen Knopf, der deinen KI-Chat mit einer Frage zum Wort öffnet. Die großen KI-Chats sind für Kinder unter 13 Jahren nicht erlaubt, deshalb ist das anfangs aus.</span></span>
        <input type="checkbox" id="aiHelp" ${S.aiHelp ? "checked" : ""}></label>
      <label class="f">Dein KI-Chat
        <select id="bot">${Object.entries(BOTS).map(([k, b]) => `<option value="${k}" ${S.bot === k ? "selected" : ""}>${b.name}</option>`).join("")}</select></label>
    </section>
    <section class="panel">
      <h3>Lernstand sichern</h3>
      <p class="muted small">Der Lernstand liegt nur in diesem Browser. Sichere ihn ab und zu als Datei, zum Beispiel bevor du das Handy wechselst.</p>
      <div class="row"><button class="btn ghost small" id="export">Als Datei sichern</button>
        <label class="btn ghost small" for="importFile">Aus Datei laden</label><input type="file" id="importFile" accept="application/json,.json" hidden></div>
      ${msg ? `<p class="status">${esc(msg)}</p>` : ""}
    </section>
    <section class="panel" id="datenschutz">
      <h3>Datenschutz</h3>
      <p class="small">Der Vokabelkasten braucht keine Anmeldung. Dein Name, alle Vokabeln und der Lernstand bleiben in deinem Browser auf diesem Gerät. Die App schickt nichts an einen Server. Sie lädt keine Schriften, Werbung oder Statistik-Dienste von anderen Anbietern.</p>
      <p class="small">Fotos und Fragen gehen nur dann an einen KI-Chat, wenn du sie selbst teilst oder den Chat öffnest. Dafür gelten die Regeln des jeweiligen Anbieters.</p>
      <p class="small">Die Spracheingabe nutzt die Spracherkennung deines Browsers. Bei Chrome läuft sie über Server von Google, bei Safari über Apple.</p>
      <p class="small muted">Beim Laden der Seite sieht der Webserver (GitHub Pages) technisch bedingt deine IP-Adresse.</p>
    </section>
    <div class="footer small muted"><span>Vokabelkasten</span><a href="https://github.com/davidpricking/vokabelkasten" target="_blank" rel="noopener">Quellcode</a></div>
  `));
  $("#back").onclick = () => { confirmLangDelete = null; renderHome(); };
  if ($("#install")) $("#install").onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; renderSettings(); };
  $$("[data-npd]").forEach(b => b.onclick = () => { S.newPerDay = +b.dataset.npd; save(); keepScroll(renderSettings); });
  $("#nameForm").onsubmit = e => { e.preventDefault(); S.name = $("#nameIn").value.trim().slice(0, 30); S.onboarded = true; save(); toast("Name gespeichert"); };
  $("#addLang2").onclick = () => renderAddLang(false);
  $$("[data-ldel]").forEach(b => b.onclick = () => { confirmLangDelete = b.dataset.ldel; renderSettings(); });
  $$("[data-ldel-no]").forEach(b => b.onclick = () => { confirmLangDelete = null; renderSettings(); });
  $$("[data-ldel-yes]").forEach(b => b.onclick = () => {
    const id = b.dataset.ldelYes; S.langs = S.langs.filter(l => l.id !== id); S.cards = S.cards.filter(c => c.lang !== id); delete S.gram[id];
    if (S.cur === id) S.cur = S.langs[0] ? S.langs[0].id : null;
    confirmLangDelete = null; save(); renderSettings("Sprache gelöscht.");
  });
  $("#aiHelp").onchange = e => { S.aiHelp = e.target.checked; save(); };
  $$("[data-goal]").forEach(b => b.onclick = () => { S.goal = +b.dataset.goal; save(); keepScroll(renderSettings); });
  $("#sound").onchange = e => { S.sound = e.target.checked; save(); if (S.sound) sound("good"); };
  $("#bot").onchange = e => { S.bot = e.target.value; save(); };
  $("#export").onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `vokabelkasten-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $("#importFile").onchange = async e => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.cards)) throw new Error("format");
      S = migrate(data); save(); renderSettings(`Lernstand geladen: ${S.cards.length} Wörter.`);
    } catch (err) { renderSettings("Diese Datei ist keine Sicherung des Vokabelkastens."); }
  };
}

// ---------- Start ----------
// ---------- Pausentag: Hinweis, wenn gestern einer gebraucht wurde ----------
function pauseNotice() {
  const y = shiftDay(dayKey(), -1);
  if (S.pauseNote === y || !streakInfo().pauses.has(y)) return;
  S.pauseNote = y; save();
  setTimeout(() => toast("💤 Gestern war dein Pausentag. Deine Serie läuft weiter!"), 700);
}

// ---------- Wortzähler: „Ich kann schon … Wörter“, mit großem Fest bei jedem Meilenstein ----------
const MILES = [10, 25, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000];
const MILE_TXT = {
  10: "Die ersten zehn sitzen. So fängt jeder Wortschatz an!", 25: "25 Wörter! Das ist schon eine ganze Buchseite.",
  50: "50 Wörter! Damit kannst du dich schon vorstellen und von dir erzählen.", 100: "100 Wörter! Jetzt verstehst du schon viele Sätze im Buch.",
  150: "150 Wörter! Du wirst richtig schnell.", 200: "200 Wörter! Das ist so viel wie ein halbes Schuljahr.",
  300: "300 Wörter! Damit kommst du in London durch einen ganzen Tag.", 400: "400 Wörter! Englische Lieder ergeben langsam Sinn.",
  500: "500 Wörter! Das ist ungefähr ein ganzes Schuljahr.", 750: "750 Wörter! Du kannst dich schon über fast alles unterhalten.",
  1000: "1000 Wörter! Mit so vielen versteht man die meisten Alltagsgespräche.", 1500: "1500 Wörter! Jetzt kannst du einfache Bücher lesen.",
  2000: "2000 Wörter! Damit verstehst du schon die meisten Wörter in einem Film.", 3000: "3000 Wörter! Das ist ein riesiger Wortschatz.",
  4000: "4000 Wörter! Kaum jemand in deinem Alter kann so viele.", 5000: "5000 Wörter! Unglaublich."
};
function sitCount() { return cardsL().filter(c => c.level >= 3).length; }
function mileSt() { S.miles = S.miles || {}; return S.miles[S.cur] || (S.miles[S.cur] = {}); }
function counterCard() {
  if (!cardsL().length) return "";
  const n = sitCount(), st = mileSt(), from = Math.min(st.shown ?? n, n);
  const next = MILES.find(m => m > n), prev = [...MILES].reverse().find(m => m <= n) || 0;
  return `<section class="panel wcount">
    <div class="wc-row"><b class="wc-num" id="wcN" data-from="${from}" data-to="${n}">${from}</b>
      <span class="wc-txt"><b>${n === 1 ? "Wort" : "Wörter"} kannst du schon</b><span class="muted small">Alle, die ab Fach 3 sitzen</span></span></div>
    ${next ? `<div class="bar gold"><i style="width:${Math.round((n - prev) / (next - prev) * 100)}%"></i></div>
      <p class="muted small">Noch ${next - n} ${next - n === 1 ? "Wort" : "Wörter"} bis zur ${next}!</p>` : ""}
  </section>`;
}
function animateCounter() {
  const el = $("#wcN"); if (!el) return;
  const a = +el.dataset.from, b = +el.dataset.to; mileSt().shown = b; save();
  if (a === b || reduced()) { el.textContent = b; return; }
  const t0 = performance.now(), dur = Math.min(1800, 500 + (b - a) * 70);
  (function f(t) {
    const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(f); else { el.classList.add("bump"); sound("land"); }
  })(t0);
}
// Ein Meilenstein wird nur einmal gefeiert; liefert true, wenn gerade gefeiert wird.
function checkMilestone() {
  const n = sitCount(), st = mileSt(), hit = [...MILES].reverse().find(m => m <= n);
  if (!hit || (st.best || 0) >= hit) return false;
  st.best = hit; save(); showMilestone(hit); return true;
}
function showMilestone(m) {
  const lang = L().name, d = document.createElement("div");
  d.className = "mile"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", `Meilenstein: ${m} Wörter`);
  d.innerHTML = `<div class="mile-rays" aria-hidden="true"></div><div class="mile-box">
    <p class="eyebrow">Meilenstein</p><div class="mile-n" id="mileN">0</div>
    <p class="mile-sub">${lang === "Englisch" ? "englische " : ""}Wörter kannst du jetzt${S.name ? `, ${esc(S.name)}` : ""}!</p>
    <p class="muted">${esc(MILE_TXT[m] || "")}</p><button class="btn big" id="mileOk">Weiter</button></div>`;
  document.body.append(d); sound("up");
  const el = d.querySelector("#mileN"), t0 = performance.now();
  if (reduced()) el.textContent = m;
  else (function f(t) { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(m * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(f); else { confetti(); sound("up"); } })(t0);
  setTimeout(() => d.classList.add("on"), 20);
  d.querySelector("#mileOk").onclick = () => { d.classList.remove("on"); setTimeout(() => d.remove(), 300); };
}

// ---------- Wortmonster: Wörter, die oft danebengehen, werden zu kleinen Monstern ----------
// Jedes Fach weiter kostet das Monster ein Herz, in Fach 3 ist es besiegt und es gibt ein goldenes Päckchen.
const MONSTER_MISS = 3;
function monsters() { return S.monsters || (S.monsters = {}); }        // Karten-id: { b: Tag geboren, s: Tag besiegt }
function isMonster(c) { const m = monsters()[c.id]; return !!m && !m.s; }
function wakeMonster(c) {
  if ((c.miss || 0) < MONSTER_MISS || c.level >= 3 || monsters()[c.id]) return false;
  monsters()[c.id] = { b: dayKey(), s: 0 }; return true;
}
// aus answered(): merkt sich, was in dieser Runde mit Monstern passiert ist
function monsterHit(card, from, to, result, moved) {
  if (!R) return;
  R.mon = R.mon || [];
  if (result === "bad") { if (wakeMonster(card)) R.mon.push({ id: card.id, born: true }); return; }
  const m = monsters()[card.id];
  if (!m || m.s || !moved || to <= from) return;
  const slain = to >= 3;
  if (slain) { m.s = dayKey(); S.packQ.push(makePack({ up: 6, sat: 2 }, true)); }
  R.mon = R.mon.filter(x => x.id !== card.id); R.mon.push({ id: card.id, from, to, slain });
}
function monsterSvg(id) {
  let h = 7; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296;
  const COLS = [["#9B5DE5", "#C9A6F5"], ["#F15BB5", "#F9A8D8"], ["#00A8E8", "#8FDBFA"], ["#00B386", "#8EE6C9"], ["#FF9F1C", "#FFD08A"], ["#FF6B6B", "#FFB3B3"], ["#7DBA2F", "#C4E59A"], ["#4D7CFE", "#A9BFFF"]];
  const [c, light] = COLS[Math.floor(r() * COLS.length)], eyes = 1 + Math.floor(r() * 3), top = Math.floor(r() * 3), teeth = r() < .6, spots = r() < .5, wide = r() < .5;
  const body = wide ? "M50 22C82 22 94 46 92 68C90 88 72 94 50 94C28 94 10 88 8 68C6 46 18 22 50 22Z" : "M50 12C76 12 86 38 85 64C84 88 70 95 50 95C30 95 16 88 15 64C14 38 24 12 50 12Z";
  const ey = wide ? 50 : 44, E = eyes === 1 ? [[50, ey, 13]] : eyes === 2 ? [[36, ey, 10], [64, ey, 10]] : [[31, ey + 3, 8], [50, ey - 7, 8], [69, ey + 3, 8]];
  const hy = wide ? 24 : 15;
  return `<svg viewBox="0 0 100 110" aria-hidden="true"><g class="mb">
    ${top === 1 ? `<path d="M30 ${hy + 6}L24 ${hy - 12}L40 ${hy}Z M70 ${hy + 6}L76 ${hy - 12}L60 ${hy}Z" fill="${light}"/>` : top === 2 ? `<circle cx="28" cy="${hy + 4}" r="9" fill="${c}"/><circle cx="72" cy="${hy + 4}" r="9" fill="${c}"/>` : `<path d="M50 ${hy}Q52 ${hy - 14} 60 ${hy - 14}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="61" cy="${hy - 14}" r="4" fill="${light}"/>`}
    <ellipse cx="34" cy="98" rx="11" ry="6" fill="${c}" filter="brightness(.8)"/><ellipse cx="66" cy="98" rx="11" ry="6" fill="${c}"/>
    <path d="${body}" fill="${c}"/>
    <ellipse cx="50" cy="${wide ? 74 : 72}" rx="${wide ? 28 : 22}" ry="16" fill="${light}" opacity=".7"/>
    ${spots ? `<circle cx="22" cy="66" r="4" fill="${light}"/><circle cx="80" cy="60" r="3" fill="${light}"/><circle cx="76" cy="76" r="2.5" fill="${light}"/>` : ""}
    ${E.map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff"/><circle class="pu" cx="${x + s * .2}" cy="${y + s * .15}" r="${s * .5}" fill="#1D2A36"/><circle cx="${x + s * .4}" cy="${y - s * .25}" r="${s * .18}" fill="#fff"/>`).join("")}
    <path d="M38 ${ey + 22}Q50 ${ey + 32} 62 ${ey + 22}" stroke="#1D2A36" stroke-width="3" fill="${teeth ? "#7A2E3A" : "none"}" stroke-linecap="round"/>
    ${teeth ? `<path d="M43 ${ey + 24.5}l3 4 3-3.5Z M53 ${ey + 25}l3 3.5 3-4.5Z" fill="#fff"/>` : ""}
    <path d="M12 60Q2 56 4 46" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M88 60Q98 56 96 46" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g></svg>`;
}
function monsterHtml(c, cls = "", lv = c.level) {
  const hearts = Math.max(0, 3 - lv);
  return `<div class="mon ${cls}" aria-label="Wortmonster ${esc(c.en)}, noch ${hearts} ${hearts === 1 ? "Herz" : "Herzen"}">
    ${monsterSvg(c.id)}<span class="mon-hp" aria-hidden="true">${"♥".repeat(hearts)}<i>${"♥".repeat(3 - hearts)}</i></span><b class="mon-w">${esc(c.en)}</b></div>`;
}
function monsterCard() {
  const all = cardsL(); all.forEach(wakeMonster);
  const act = all.filter(isMonster), slain = all.filter(c => monsters()[c.id] && monsters()[c.id].s).length;
  if (!act.length && !slain) return "";
  return `<section class="panel moncard">
    <div class="spread"><h2>Wortmonster</h2><span class="muted small">${slain} besiegt</span></div>
    ${act.length ? `<div class="monrow">${act.slice(0, 6).map((c, i) => monsterHtml(c, "", c.level).replace('class="mon ', `style="--d:${i * .37}s" class="mon `)).join("")}</div>
      ${act.length > 6 ? `<p class="muted small">… und noch ${act.length - 6} weitere.</p>` : ""}` : `<p class="moncheer">🏆 Alle Monster besiegt!</p>`}
    <p class="muted small">Diese Wörter gehen oft daneben. Jedes Mal, wenn eins ein Fach weiterkommt, verliert sein Monster ein Herz. In Fach 3 ist es besiegt, dafür gibt es ein goldenes Päckchen.</p>
  </section>`;
}
function monsterSummary() {
  if (!R || !R.mon || !R.mon.length) return "";
  return `<div class="monsum">${R.mon.map(x => { const c = S.cards.find(k => k.id === x.id); if (!c) return "";
    if (x.born) return `<div class="monline">${monsterHtml(c, "born")}<span><b>Ein Wortmonster ist aufgetaucht!</b><span class="small">„${esc(c.en)}“ ging oft daneben. Bring es bis Fach 3, dann besiegst du es.</span></span></div>`;
    if (x.slain) return `<div class="monline">${monsterHtml(c, "slain", x.from)}<span><b>Monster besiegt!</b><span class="small">„${esc(c.en)}“ sitzt jetzt. Dafür gibt es ein goldenes Päckchen.</span></span></div>`;
    return `<div class="monline">${monsterHtml(c, "hit", x.from).replace(/<span class="mon-hp"[^]*?<\/span>/, `<span class="mon-hp" aria-hidden="true">${"♥".repeat(3 - x.to)}<i class="lost">${"♥".repeat(x.to - x.from)}</i><i>${"♥".repeat(x.from)}</i></span>`)}<span><b>Treffer!</b><span class="small">„${esc(c.en)}“ ist jetzt in Fach ${x.to}. Noch ${3 - x.to} ${3 - x.to === 1 ? "Herz" : "Herzen"}.</span></span></div>`;
  }).join("")}</div>`;
}

// ---------- Zeit-Training und Duell: Auswahl aus vier, am selben Handy ----------
// Duell: zwei spielen nacheinander dieselben 10 Wörter; mehr richtig gewinnt, bei Gleichstand die schnellere Zeit.
// Zeit-Training: 15 Wörter aus einer Unit bis zu einem Teil (1, 2, A1 … wie im Buch); jeder Fehler kostet 3 Strafsekunden.
// Jede Auswahl hat ihren eigenen Rekord. Danach kann man jemanden mit denselben Wörtern herausfordern. Die Fächer ändern sich nie.
const DUEL_N = 10, SPRINT_N = 15, PENALTY = 3000;
let D = null;
function duelsWeek(ws = weekStart(dayKey())) { return (S.duels || []).filter(d => d.w === ws); }
const penTime = p => p.t + ((p.c ?? (p.a || []).length) - p.s) * PENALTY;
function duelWinner(d) {
  const [a, b] = d.p; if (!b) return -1;
  if (d.m === "sprint") { const x = penTime(a), y = penTime(b); return x === y ? -1 : x < y ? 0 : 1; }
  return a.s !== b.s ? (a.s > b.s ? 0 : 1) : a.t !== b.t ? (a.t < b.t ? 0 : 1) : -1;
}
function duelTally(list) {
  const t = {}; list.forEach(d => { const w = duelWinner(d); d.p.forEach((p, i) => { t[p.n] = t[p.n] || 0; if (w === i) t[p.n]++; }); });
  return Object.entries(t).sort((a, b) => b[1] - a[1]);
}
const secTxt = t => (t / 1000).toFixed(1).replace(".", ",") + " s";
function medal(t, n, s = n) { if (s < n * 0.8) return ""; const per = t / n / 1000; return per <= 2 ? "🥇" : per <= 3.5 ? "🥈" : per <= 5 ? "🥉" : ""; }
// Zeit-Training (Davids Wunsch): erst die Unit wählen, dann die Teile aus dem Buch (blaue Marker 1, 2, A1 …) anhaken.
// Die Häkchen bleiben gespeichert. Es zählen nur freigeschaltete Wörter, und gestartet wird erst ab SPRINT_N Wörtern.
function unitPartList(u) {
  const cs = cardsL().filter(c => c.unit === u && c.en && c.de && !isPaused(c)), groups = [], seen = new Set();
  let last = cs.some(c => c.part) ? "1" : "alle";
  // Wörter, die im Buch zweimal vorkommen, tragen ihren ersten Teil: sie zählen zum aktuellen Abschnitt
  cs.forEach(c => { if (c.part && !seen.has(c.part)) { last = c.part; seen.add(last); } let g = groups.find(x => x.p === last); if (!g) groups.push(g = { p: last, l: [] }); g.l.push(c); });
  return groups;
}
function makeQuestions(cards) {
  const all = cardsL().filter(c => c.en && c.de);
  return cards.map(c => {
    const opts = choiceOpts(c, c.en, "de-en", all.filter(x => x.id !== c.id));
    // sehr ähnliche Kästen liefern manchmal zu wenig Fallen: dann mit zufälligen Wörtern auffüllen
    for (const x of shuffle(all.filter(x => x.id !== c.id))) { if (opts.length >= 4) break; if (!opts.some(o => norm(o) === norm(x.en))) opts.splice(Math.floor(Math.random() * (opts.length + 1)), 0, x.en); }
    return { id: c.id, de: c.de, sol: c.en, opts };
  });
}
const newPlayer = n => ({ n, s: 0, t: 0, a: [] });
function duelCard() {
  if (cardsL().length < DUEL_N) return "";
  const ws = weekStart(dayKey()), week = duelsWeek(ws), tally = duelTally(week), prev = duelTally(duelsWeek(shiftDay(ws, -7)));
  const recs = Object.keys(S.records || {}).filter(k => k.startsWith(S.cur + "|")).length, max = Math.max(1, ...tally.map(t => t[1]));
  return `<section class="panel duel">
    <div class="spread"><h2>Rekorde und Duelle</h2><span class="muted small">${recs ? `${recs} ${recs === 1 ? "Rekord" : "Rekorde"}` : ""}</span></div>
    ${tally.length ? tally.map(([n, w], i) => `<div class="duelrow${n === (S.name || "Ich") ? " me" : ""}"><span class="duelname">${i === 0 && w > 0 && w > (tally[1] || [0, 0])[1] ? "👑 " : ""}${esc(n)}</span>
      <span class="bar"><i style="width:${Math.round(w / max * 100)}%"></i></span><b>${w}</b></div>`).join("") + `<p class="muted small">Siege diese Woche</p>`
      : `<p class="muted small">Üb eine Unit bis zu einem Teil auf Zeit und jag deinen Rekord. Wenn du richtig schnell warst, fordere jemanden heraus! Oder spielt ein Duell: beide bekommen dieselben ${DUEL_N} Wörter.</p>`}
    ${prev.length && prev[0][1] > (prev[1] || [0, 0])[1] ? `<p class="small">🏆 Letzte Woche hat ${esc(prev[0][0])} gewonnen (${prev.map(([n, w]) => `${esc(n)} ${w}`).join(" : ")}).</p>` : ""}
    <div class="row"><button class="btn" id="sprintGo">⏱️ Auf Zeit üben</button><button class="btn ghost" id="duelGo">Duell starten</button></div>
  </section>`;
}
function renderSprint() {
  const units = [...new Set(cardsL().map(c => c.unit))].filter(u => unitPartList(u).length), R2 = S.records || {};
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Auf Zeit üben</h2></div>
    <p class="muted small">Wähl eine Unit und hak die Teile an, die du üben willst. Du bekommst ${SPRINT_N} Wörter daraus und tippst so schnell wie möglich die richtige Antwort an. Jeder Fehler kostet ${PENALTY / 1000} Strafsekunden.</p>
    <div class="sprintparts">${units.map((u, i) => { const n = Object.keys(R2).filter(k => k.startsWith(`${S.cur}|${u}|`)).length;
      return `<button class="sprintpart${n ? " done" : ""}" data-i="${i}"><b style="overflow-wrap:anywhere">${esc(u)}</b><span class="rec">${n ? `${n} ${n === 1 ? "Rekord" : "Rekorde"}` : "–"}</span></button>`; }).join("")
      || `<p class="muted">Noch keine freigeschalteten Wörter.</p>`}</div>`));
  $("#back").onclick = renderHome;
  $$(".sprintpart").forEach(b => b.onclick = () => renderSprintUnit(units[+b.dataset.i]));
  window.scrollTo(0, 0);
}
function renderSprintUnit(u) {
  const groups = unitPartList(u), selAll = S.sprintSel = S.sprintSel || {}, k0 = S.cur + "|" + u;
  if (!selAll[k0]) selAll[k0] = groups.map(g => g.p);
  const draw = () => {
    const sel = selAll[k0].filter(p => groups.some(g => g.p === p)), pick = groups.filter(g => sel.includes(g.p)), n = pick.reduce((a, g) => a + g.l.length, 0);
    const key = `${k0}|${pick.map(g => g.p).join(",")}`, r = (S.records || {})[key];
    app.replaceChildren(h(`
      <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2 style="overflow-wrap:anywhere">${esc(u)}</h2></div>
      ${groups.length > 1 ? `<div class="row"><button class="btn ghost small" id="pAll">Alle</button><button class="btn ghost small" id="pNone">Keine</button></div>
      <div class="partchecks">${groups.map(g => `<label class="partcheck${sel.includes(g.p) ? " on" : ""}"><input type="checkbox" data-p="${esc(g.p)}"${sel.includes(g.p) ? " checked" : ""}><b>${esc(g.p)}</b><span class="small muted">${g.l.length}</span></label>`).join("")}</div>` : ""}
      <section class="panel"><div class="spread"><b>${n} Wörter ausgewählt</b><span class="rec">${r ? `Rekord ${medal(r.t, r.n, r.s)} ${secTxt(r.t)}` : ""}</span></div>
        ${n < SPRINT_N ? `<p class="muted small">Hak noch mehr Teile an: Für ein Zeit-Training brauchst du mindestens ${SPRINT_N} Wörter.</p>` : ""}
        <button class="btn big wide" id="spGo"${n < SPRINT_N ? " disabled" : ""}>⏱️ Los</button></section>`));
    $("#back").onclick = renderSprint;
    const set = l => { selAll[k0] = l; save(); keepScroll(draw); };
    if ($("#pAll")) { $("#pAll").onclick = () => set(groups.map(g => g.p)); $("#pNone").onclick = () => set([]); }
    $$(".partcheck input").forEach(c => c.onchange = () => set(c.checked ? [...sel, c.dataset.p] : sel.filter(p => p !== c.dataset.p)));
    $("#spGo").onclick = () => startSprint(u, { key, name: groups.length > 1 && pick.length < groups.length ? `Teil ${pick.map(g => g.p).join(", ")}` : "ganze Unit", cards: pick.flatMap(g => g.l) });
  };
  draw(); window.scrollTo(0, 0);
}
function startSprint(u, p, name = S.name || "Ich") {
  D = { m: "sprint", unit: u, pool: p, key: p.key, label: `${u} · ${p.name}`, p: [newPlayer(name)], cur: 0, i: 0, q: makeQuestions(shuffle([...p.cards]).slice(0, SPRINT_N)) };
  duelHandover();
}
function renderDuelSetup() {
  const me = S.name || "Ich", other = S.duelOther || "Papa";
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Duell</h2></div>
    <section class="hero duelhero">
      <div class="duelvs"><span class="dv a">${esc(me)}</span><b>gegen</b><input class="dv b" id="duelOther" value="${esc(other)}" maxlength="16" aria-label="Name des Gegners"></div>
      <p class="muted small">Beide bekommen dieselben ${DUEL_N} Wörter aus deinem Kasten und tippen jeweils die richtige von vier Antworten an. Erst spielst du, dann gibst du das Handy weiter. Nicht spicken!</p>
      <button class="btn big wide" id="duelStart">Los geht's</button>
    </section>`));
  $("#back").onclick = renderHome;
  $("#duelStart").onclick = () => {
    const o = $("#duelOther").value.trim() || "Papa"; S.duelOther = o; save();
    const all = cardsL().filter(c => c.en && c.de);
    const pick = [...shuffle(all.filter(c => c.level > 0)), ...shuffle(all.filter(c => !c.level))].slice(0, DUEL_N);
    D = { m: "duel", p: [newPlayer(me), newPlayer(o === me ? o + " 2" : o)], cur: 0, i: 0, q: makeQuestions(pick) };
    duelHandover();
  };
  window.scrollTo(0, 0);
}
// Herausforderung nach dem Zeit-Training: jemand anderes spielt dieselben Wörter in derselben Reihenfolge
function renderChallenge() {
  const other = S.duelOther || "Papa", me = D.p[0];
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Herausforderung</h2></div>
    <section class="hero duelhero">
      <p class="eyebrow">${esc(D.label)}</p>
      <h1 style="text-align:center">${esc(me.n)} hat ${secTxt(penTime(me))} vorgelegt</h1>
      <div class="duelvs"><b>Wer traut sich?</b><input class="dv b" id="duelOther" value="${esc(other)}" maxlength="16" aria-label="Name des Gegners"></div>
      <p class="muted small">Dieselben ${D.q.length} Wörter in derselben Reihenfolge. Jeder Fehler kostet ${PENALTY / 1000} Strafsekunden. Wer insgesamt schneller ist, gewinnt.</p>
      <button class="btn big wide" id="chGo">Handy weitergeben</button>
    </section>`));
  $("#back").onclick = sprintResult;
  $("#chGo").onclick = () => { const o = $("#duelOther").value.trim() || "Papa"; S.duelOther = o; save(); D.p = [D.p[0], newPlayer(o === me.n ? o + " 2" : o)]; D.cur = 1; duelHandover(); };
  window.scrollTo(0, 0);
}
function duelHandover() {
  const p = D.p[D.cur], sprint = D.m === "sprint", rec = sprint && S.records && S.records[D.key];
  app.replaceChildren(h(`<div class="done duelhand">
    <p class="eyebrow">${D.cur ? "Handy weitergeben" : sprint ? esc(D.label) : "Spieler 1"}</p>
    <div class="duelbig" aria-hidden="true">${D.cur ? "🤝" : sprint ? "⏱️" : "🎯"}</div>
    <h1>${esc(p.n)} ist dran!</h1>
    <p class="muted">${D.cur ? (sprint ? `Die Zeit, die du schlagen musst: ${secTxt(penTime(D.p[0]))}.` : `${esc(D.p[0].n)} ist fertig. Das Ergebnis bleibt geheim, bis ${esc(p.n)} auch gespielt hat.`)
      : sprint ? `${D.q.length} Wörter. Die Uhr läuft ab dem ersten Wort.${rec ? ` Dein Rekord: ${secTxt(rec.t)}.` : ""}` : `${DUEL_N} Wörter, so schnell und richtig wie möglich.`}</p>
    <button class="btn big" id="dReady">Bereit</button></div>`));
  sound("tap");
  $("#dReady").onclick = () => { D.i = 0; duelQuestion(); };
  window.scrollTo(0, 0);
}
function duelQuestion() {
  const p = D.p[D.cur], q = D.q[D.i], N = D.q.length, sprint = D.m === "sprint";
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="dQuit" aria-label="Abbrechen">✕</button>
      <div class="bar" style="flex:1"><i style="width:${Math.round(D.i / N * 100)}%"></i></div><b class="small">${esc(p.n)} · ${D.i + 1}/${N}</b></div>
    <div class="icard"><div class="spread"><span class="eyebrow">Deutsch → ${esc(L().name)}</span>${sprint ? `<b class="dclock" id="dClock">${secTxt(penTime(p))}</b>` : ""}</div>
      <div class="q">${esc(q.de)}</div>
      <div class="choices">${q.opts.map((o, i) => `<button class="choice" data-i="${i}">${esc(o)}</button>`).join("")}</div></div>`));
  const t0 = performance.now(), base = penTime(p);
  const tick2 = sprint ? setInterval(() => { const c = $("#dClock"); if (c) c.textContent = secTxt(base + performance.now() - t0); }, 100) : 0;
  $("#dQuit").onclick = () => { clearInterval(tick2); D = null; renderHome(); };
  $$(".choice").forEach(b => b.onclick = () => {
    clearInterval(tick2);
    const ok = q.opts[+b.dataset.i] === q.sol;
    p.t += performance.now() - t0; p.a.push(ok); if (ok) p.s++;
    $$(".choice").forEach(x => { x.disabled = true; if (q.opts[+x.dataset.i] === q.sol) x.classList.add("right"); });
    if (!ok) { b.classList.add("wrong"); const c = $("#dClock"); if (c) { c.textContent = secTxt(penTime(p)); c.classList.add("pen"); } }
    sound(ok ? "good" : "bad");
    setTimeout(() => {
      if (++D.i < N) return duelQuestion();
      if (D.cur === 0) return sprint && !D.rev ? sprintResult(true) : (D.cur = 1, duelHandover());
      duelResult();
    }, ok ? 350 : 1100);
  });
  window.scrollTo(0, 0);
}
function sprintResult(fresh) {
  const p = D.p[0], t = Math.round(penTime(p)), n = p.a.length, R2 = S.records = S.records || {};
  if (fresh) { D.old = R2[D.key]; D.best = !D.old || t < D.old.t; if (D.best) R2[D.key] = { t, s: p.s, n, d: dayKey() }; save(); }
  const old = D.old, best = D.best;
  app.replaceChildren(h(`<div class="done sprintres">
    <p class="eyebrow">${esc(D.label)}</p>
    ${best ? `<div class="newrec">${old ? "Neuer Rekord!" : "Erster Rekord!"}</div>` : ""}
    <div class="score">${secTxt(t)}</div>
    <p>${p.s} von ${n} richtig${n - p.s ? ` · ${n - p.s} × ${PENALTY / 1000} Strafsekunden` : ", ohne Strafsekunden"} ${medal(t, n, p.s)}</p>
    ${old ? `<p class="muted small">${best ? `Alter Rekord: ${secTxt(old.t)}. Du warst ${secTxt(old.t - t)} schneller!` : `Dein Rekord: ${secTxt(old.t)}. Noch ${secTxt(t - old.t)} schneller, dann knackst du ihn.`}</p>` : ""}
    <div class="duelwords">${D.q.map((q, k) => `<div class="dw"><span>${esc(q.de)} = <b>${esc(q.sol)}</b></span><span>${p.a[k] ? "✅" : "❌"}</span></div>`).join("")}</div>
    <div class="row" style="justify-content:center"><button class="btn${best ? "" : " ghost"}" id="chal">🤺 Jemanden herausfordern</button><button class="btn${best ? " ghost" : ""}" id="sAgain">Nochmal</button><button class="btn ghost" id="sHome">Fertig</button></div></div>`));
  if (fresh && best) { confetti(); sound("up"); }
  $("#chal").onclick = renderChallenge;
  $("#sAgain").onclick = () => { startSprint(D.unit, D.pool, p.n); };
  $("#sHome").onclick = () => { const u = D.unit; D = null; renderSprintUnit(u); };
  window.scrollTo(0, 0);
}
function duelResult() {
  const sprint = D.m === "sprint";
  const rec = { m: D.m, w: weekStart(dayKey()), day: dayKey(), p: D.p.map(x => ({ n: x.n, s: x.s, t: Math.round(x.t), c: x.a.length })) };
  S.duels = [...(S.duels || []), rec].slice(-200); save();
  const win = duelWinner(rec), shown = p => sprint ? secTxt(penTime(p)) : `${p.s}/${p.a.length}`;
  app.replaceChildren(h(`<div class="done duelres">
    <p class="eyebrow">${sprint ? "Herausforderung · " + esc(D.label) : "Duell"}</p>
    <h1>${win < 0 ? "Unentschieden!" : `${esc(D.p[win].n)} gewinnt!`}</h1>
    <div class="duelpods">${D.p.map((p, i) => `<div class="pod${i === win ? " win" : ""}" style="--h:${30 + p.s * (sprint ? 5 : 7)}px"><span class="crown" aria-hidden="true">${i === win ? "👑" : ""}</span>
      <b>${esc(p.n)}</b><span class="podbar"><span class="podn">${shown(p)}</span></span><span class="small muted">${sprint ? `${p.s}/${p.a.length} richtig` : secTxt(p.t)}</span></div>`).join("")}</div>
    ${!sprint && win >= 0 && D.p[0].s === D.p[1].s ? `<p class="muted small">Gleich viele richtig, ${esc(D.p[win].n)} war schneller.</p>` : ""}
    <div class="duelwords">${D.q.map((q, k) => `<div class="dw"><span>${esc(q.de)} = <b>${esc(q.sol)}</b></span><span>${D.p.map(p => p.a[k] ? "✅" : "❌").join(" ")}</span></div>`).join("")}</div>
    <p class="muted small">Diese Woche: ${duelTally(duelsWeek()).map(([n, w]) => `${esc(n)} ${w} ${w === 1 ? "Sieg" : "Siege"}`).join(", ")}</p>
    <div class="row" style="justify-content:center"><button class="btn" id="dAgain">Revanche</button><button class="btn ghost" id="dHome">Fertig</button></div></div>`));
  if (win >= 0) { confetti(); sound("up"); }
  $("#dAgain").onclick = () => { if (sprint) { D.p = D.p.map(x => newPlayer(x.n)); D.cur = 0; D.rev = true; duelHandover(); } else { D = null; renderDuelSetup(); } };
  $("#dHome").onclick = () => { D = null; renderHome(); };
  window.scrollTo(0, 0);
}
// ---------- Camden-Welt: Viertel und Schatz (die 3D-Seite liegt in welt/welt.js) ----------
function weltUnits() {
  const g = {};
  S.cards.forEach(c => { if (c.unit === SAMPLE_UNIT) return; const k = c.lang + "|" + c.unit; const u = g[k] || (g[k] = { key: k, name: c.unit, n: 0, sit: 0 }); u.n++; if (c.level >= 3) u.sit++; });
  return Object.values(g).map(u => ({ ...u, pct: u.sit / u.n, done: u.n >= 8 && u.sit / u.n >= .8 }));
}
function weltDistrictNew() { const have = new Set(S.welt.dist || []); return (S.welt.dist || []).length < 6 && weltUnits().some(u => u.done && !have.has(u.key)); }
function treasureReady() { return !!S.cards.length && goalCount() >= Math.min(S.goal, ROUND_SIZE) && !dayLog().treasure && (S.welt.built || []).length >= 3; }

async function boot() {
  const m = location.hash.match(/^#pack=([zj][A-Za-z0-9_-]+)$/);
  if (m) {
    history.replaceState(null, "", location.pathname);
    try {
      const p = await decodePack(m[1]);
      if (p.units.length) {
        if (!S.onboarded) { S.onboarded = true; }
        const ex = S.langs.find(l => l.name.toLowerCase() === p.lang.toLowerCase());
        if (ex) S.cur = ex.id; else addLang(p.lang, p.code);
        save();
        if (p.units.length === 1 && !p.isBook) renderImport({ name: p.units[0].name, rows: p.units[0].rows }); else renderBook(p);
        return;
      }
    } catch (e) {}
    toast("Dieser Link enthält keine lesbare Unit.");
  }
  renderHome();
}
boot();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
