(() => {
"use strict";

// ---------- Einstellungen des Kastens ----------
const DAY = 864e5;
const INTERVAL = [0, 1, 2, 4, 8, 16, 30, 180];          // Tage bis zur nächsten Abfrage, je Fach
const FACH_LABEL = ["neu", "1 Tag", "2 Tage", "4 Tage", "8 Tage", "16 Tage", "1 Monat", "½ Jahr"];
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

const PHOTO_PROMPT = `Auf dem Foto ist eine Vokabelseite aus einem Englisch-Schulbuch. Schreib alle Vokabeln als Liste, eine Vokabel pro Zeile, in diesem Format:
englisch ; deutsch ; Beispielsatz
Übernimm den englischen Beispielsatz, wenn auf der Seite einer steht, sonst lass ihn weg. Lass Lautschrift und Seitenzahlen weg. Mehrere deutsche Bedeutungen trennst du mit Komma. Wenn die Seite eine Überschrift wie „Unit 2“ hat, schreib sie in die erste Zeile mit # davor. Gib nur die Liste als Codeblock aus, ohne weiteren Text.`;

const BOTS = {
  chatgpt: { name: "ChatGPT", url: q => "https://chatgpt.com/?q=" + encodeURIComponent(q) },
  claude:  { name: "Claude",  url: q => "https://claude.ai/new?q=" + encodeURIComponent(q) },
  gemini:  { name: "Gemini",  url: () => "https://gemini.google.com/app", copyFirst: true }
};

// ---------- Speicher (nur auf diesem Gerät) ----------
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function defaults() {
  return {
    cards: SAMPLE.map(([en, de, ex], i) => ({ id: "s" + i, en, de, ex: ex || "", unit: SAMPLE_UNIT, level: 0, due: 0 })),
    dir: "de-en", streak: 0, lastDay: 0, newDay: 0, newCount: 0, newPerDay: 10,
    aiHelp: false, bot: "chatgpt", speechMode: "say"
  };
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.cards)) return Object.assign(defaults(), s); } catch (e) {}
  return null;
}
let S = load() || defaults();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

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
function variants(a) { return a.startsWith("to ") ? [a, a.slice(3)] : [a, "to " + a]; }
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
function dueCards() { const now = Date.now(); return S.cards.filter(c => c.level > 0 && c.due <= now).sort((a, b) => a.due - b.due); }
function newLeft() { if (S.newDay !== today()) { S.newDay = today(); S.newCount = 0; } return Math.max(0, S.newPerDay - S.newCount); }
function newCards() { return S.cards.filter(c => c.level === 0); }
function grade(card, result) {
  const wasNew = card.level === 0;
  if (result === "good") card.level = Math.min(7, card.level + 1);
  else if (result === "bad") card.level = Math.max(1, card.level - 2);
  else card.level = Math.max(1, card.level);
  card.due = today() + INTERVAL[result === "good" ? card.level : 1] * DAY;
  if (wasNew) { newLeft(); S.newCount++; }
}
function bumpStreak() {
  const t = today(); if (S.lastDay === t) return;
  S.streak = (S.lastDay === t - DAY) ? S.streak + 1 : 1; S.lastDay = t;
}
function liveStreak() { return (S.lastDay === today() || S.lastDay === today() - DAY) ? S.streak : 0; }

// ---------- Vorlesen und Spracheingabe ----------
const canSpeak = "speechSynthesis" in window;
function say(text, lang = "en-GB") {
  if (!canSpeak) return;
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
  const map = lang.startsWith("de") ? LETTERS_DE : LETTERS_EN;
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
async function encodePack(name, cards) {
  const obj = { n: name, w: cards.map(c => { const r = [c.en, c.de]; if (c.ex) r.push(c.ex); return r; }) };
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if ("CompressionStream" in window) {
    try {
      const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();
      return "z" + b64u(new Uint8Array(buf));
    } catch (e) {}
  }
  return "j" + b64u(bytes);
}
async function decodePack(code) {
  let bytes = unb64u(code.slice(1));
  if (code[0] === "z") bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
  const obj = JSON.parse(new TextDecoder().decode(bytes));
  return { name: String(obj.n || "Neue Unit"), rows: (obj.w || []).filter(r => r && r[0] && r[1]).map(r => ({ en: String(r[0]), de: String(r[1]), ex: String(r[2] || "") })) };
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

// ---------- Startseite ----------
let confirmDelete = null;
function renderHome() {
  const due = dueCards().length;
  const nl = Math.min(newLeft(), newCards().length);
  const counts = Array(8).fill(0); S.cards.forEach(c => counts[c.level]++);
  const max = Math.max(1, ...counts);
  const units = [...new Set(S.cards.map(c => c.unit))];
  const dirs = [["de-en", "Deutsch → Englisch"], ["en-de", "Englisch → Deutsch"], ["mix", "gemischt"]];
  app.replaceChildren(h(`
    <header class="top">
      <div><p class="eyebrow">Englisch · ab Klasse 5</p><h1>Vokabelkasten</h1></div>
      <div class="row" style="gap:6px;flex-wrap:nowrap">
        <div class="streak" title="Tage am Stück geübt">${ICON.flame}<span>${liveStreak()}</span></div>
        <button class="iconbtn" id="settings" aria-label="Einstellungen">${ICON.gear}</button>
      </div>
    </header>
    <section class="today">
      <div class="stats">
        <div><span class="big">${due}</span><span class="muted small">fällig heute</span></div>
        <div><span class="big">${nl}</span><span class="muted small">neue Wörter</span></div>
      </div>
      ${due + nl ? `<button class="btn wide" id="start">Runde starten</button>` : `<p><b>Heute ist alles geschafft.</b></p>`}
      <button class="btn ghost wide" id="free">Freies Üben</button>
      <p class="muted small">${due + nl ? `Eine Runde hat bis zu ${ROUND_SIZE} Wörter und dauert etwa 2 Minuten. ` : ""}Freies Üben geht jederzeit, vor allem mit den Wörtern aus den unteren Fächern. Es wirft dich nie zurück.</p>
    </section>
    <section>
      <div class="spread"><h2>Dein Kasten</h2><span class="muted small">${S.cards.length} Wörter</span></div>
      <div class="box" aria-label="Karten pro Fach">
        ${counts.map((n, i) => `<div class="slot ${i === 0 ? "new" : ""}">
          <div class="stack"><i style="height:${n ? Math.max(6, Math.round(n / max * 84)) : 0}px"></i></div>
          <b>${n}</b><span>${i === 0 ? "neu" : "Fach " + i}<br>${i === 0 ? "&nbsp;" : FACH_LABEL[i]}</span></div>`).join("")}
      </div>
      <p class="muted small">Richtig heißt ein Fach weiter, falsch heißt zwei Fächer zurück. Unter jedem Fach steht, wann ein Wort daraus wieder drankommt.</p>
    </section>
    <section>
      <h2>Abfragerichtung</h2>
      <div class="chips">${dirs.map(([k, l]) => `<button class="chip" data-dir="${k}" aria-pressed="${S.dir === k}">${l}</button>`).join("")}</div>
    </section>
    <section>
      <div class="spread"><h2>Units</h2><button class="btn small" id="add">+ Vokabeln hinzufügen</button></div>
      <div class="units">${units.length ? units.map(u => {
        const cs = S.cards.filter(c => c.unit === u); const sit = cs.filter(c => c.level >= 3).length;
        const pct = Math.round(sit / cs.length * 100);
        return `<div class="unit">
          <div class="spread"><div><h3 style="overflow-wrap:anywhere">${esc(u)}</h3>
            <p class="muted small">${cs.length} Wörter · ${pct} % sitzen (ab Fach 3)</p></div>
            ${u === SAMPLE_UNIT ? '<span class="tag">Beispiel</span>' : ""}</div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="row">
            <button class="btn ghost small" data-test="${esc(u)}">Für den Test üben</button>
            <button class="link" data-share="${esc(u)}">Teilen</button>
            ${confirmDelete === u
              ? `<span class="small">Wirklich löschen?</span><button class="link" data-del-yes="${esc(u)}">Ja</button><button class="link" data-del-no>Nein</button>`
              : `<button class="link" data-del="${esc(u)}">Löschen</button>`}
          </div></div>`;
      }).join("") : '<p class="muted">Noch keine Vokabeln. Füge die erste Unit hinzu.</p>'}</div>
    </section>
  `));
  if ($("#start")) $("#start").onclick = () => startRound(null);
  $("#free").onclick = () => startRound(FREE);
  $("#add").onclick = () => renderImport();
  $("#settings").onclick = renderSettings;
  $$("[data-dir]").forEach(b => b.onclick = () => { S.dir = b.dataset.dir; save(); renderHome(); });
  $$("[data-test]").forEach(b => b.onclick = () => startRound(b.dataset.test));
  $$("[data-share]").forEach(b => b.onclick = () => renderShare(b.dataset.share));
  $$("[data-del]").forEach(b => b.onclick = () => { confirmDelete = b.dataset.del; renderHome(); });
  $$("[data-del-no]").forEach(b => b.onclick = () => { confirmDelete = null; renderHome(); });
  $$("[data-del-yes]").forEach(b => b.onclick = () => {
    const u = b.dataset.delYes; S.cards = S.cards.filter(c => c.unit !== u); confirmDelete = null; save(); renderHome(); toast("Unit gelöscht");
  });
  window.scrollTo(0, 0);
}

// ---------- Runde ----------
let R = null;
const FREE = "\u0000free";
function startRound(unit) {
  let pick;
  if (unit === FREE) {
    pick = shuffle([...S.cards]).sort((a, b) => a.level - b.level).slice(0, Math.max(ROUND_SIZE, Math.ceil(S.cards.length / 3)));
    pick = shuffle(pick).slice(0, ROUND_SIZE);
  } else if (unit) {
    pick = shuffle(S.cards.filter(c => c.unit === unit)).slice(0, 20);
  } else {
    pick = dueCards().slice(0, ROUND_SIZE);
    if (pick.length < ROUND_SIZE) pick = pick.concat(newCards().slice(0, Math.min(newLeft(), ROUND_SIZE - pick.length)));
    pick = shuffle(pick);
  }
  if (!pick.length) { toast("Noch keine Vokabeln vorhanden"); return; }
  R = { practice: !!unit, unit, queue: pick.map(c => c.id), total: pick.length, done: new Set(), first: {}, good: 0 };
  renderCard();
}
function dirFor() { return S.dir === "mix" ? (Math.random() < .5 ? "de-en" : "en-de") : S.dir; }

function renderCard() {
  if (!R.queue.length) return renderSummary();
  const card = S.cards.find(c => c.id === R.queue[0]);
  if (!card) { R.queue.shift(); return renderCard(); }
  const dir = dirFor();
  const q = dir === "de-en" ? card.de : card.en;
  const sol = dir === "de-en" ? card.en : card.de;
  const lang = dir === "de-en" ? "en-GB" : "de-DE";
  const pool = S.cards.filter(c => c.id !== card.id);
  const useChoice = card.level <= 1 && !R.done.has(card.id) && !(card.id in R.first) && pool.length >= 3 && !R.practice;
  const pct = Math.round(R.done.size / R.total * 100);
  const label = R.unit === FREE ? " · Freies Üben" : R.practice ? " · Testtraining" : "";
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="quit" aria-label="Runde beenden">${ICON.x}</button>
      <div class="bar"><i style="width:${pct}%"></i></div><span class="small muted" style="font-variant-numeric:tabular-nums">${R.done.size}/${R.total}</span></div>
    <div class="icard pop">
      <div class="spread"><span class="eyebrow">${dir === "de-en" ? "Deutsch → Englisch" : "Englisch → Deutsch"}${label}</span>
        ${dir === "en-de" && canSpeak ? `<button class="speak" id="hear">${ICON.speaker}Anhören</button>` : ""}</div>
      <div class="q">${esc(q)}</div>
      <div id="answerArea"></div>
      <div id="fb"></div>
    </div>
  `));
  $("#quit").onclick = () => { stopListening(); save(); R = null; renderHome(); };
  if ($("#hear")) $("#hear").onclick = () => say(card.en);
  if (dir === "en-de" && canSpeak && !useChoice) say(card.en);
  const area = $("#answerArea");
  if (useChoice) {
    const others = shuffle(pool.map(c => dir === "de-en" ? c.en : c.de).filter(x => norm(x) !== norm(sol))).slice(0, 3);
    const opts = shuffle([sol, ...others]);
    area.replaceChildren(h(`<div class="choices">${opts.map((o, i) => `<button class="choice" data-i="${i}">${esc(o)}</button>`).join("")}</div>`));
    $$(".choice", area).forEach(b => b.onclick = () => {
      const ok = opts[+b.dataset.i] === sol;
      $$(".choice", area).forEach(x => { x.disabled = true; if (opts[+x.dataset.i] === sol) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      answered(card, ok ? "good" : "bad", sol, dir);
    });
    return;
  }
  area.replaceChildren(h(`<form id="f" autocomplete="off">
    <div class="answerRow">
      <input class="answer" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"
        placeholder="${dir === "de-en" ? "auf Englisch …" : "auf Deutsch …"}" aria-label="Deine Antwort">
      ${SR ? `<button type="button" class="mic" id="mic" aria-label="${S.speechMode === "spell" ? "Buchstabieren" : "Sprechen"}">${ICON.mic}</button>` : ""}
    </div>
    ${SR ? `<div class="speechModes" style="margin-top:8px">Mikrofon:
      <button type="button" class="chip" data-sm="say" aria-pressed="${S.speechMode === "say"}">Wort sagen</button>
      <button type="button" class="chip" data-sm="spell" aria-pressed="${S.speechMode === "spell"}">Buchstabieren</button></div>`
      : `<p class="hint" style="margin-top:8px">Tipp: Mit dem Mikrofon der Handy-Tastatur kannst du auch sprechen.</p>`}
    <button class="btn wide" type="submit" style="margin-top:12px">Prüfen</button></form>`));
  const inp = $("#ans");
  if (!SR) setTimeout(() => inp.focus({ preventScroll: true }), 50);
  $$("[data-sm]", area).forEach(b => b.onclick = () => {
    S.speechMode = b.dataset.sm; save();
    $$("[data-sm]", area).forEach(x => x.setAttribute("aria-pressed", x === b));
  });
  if (SR) $("#mic").onclick = () => listen(inp, sol, lang);
  $("#f").onsubmit = e => {
    e.preventDefault(); if (!inp.value.trim()) return;
    stopListening();
    inp.disabled = true; $$("button", e.target).forEach(b => b.hidden = true); $(".speechModes") && ($(".speechModes").hidden = true);
    answered(card, check(inp.value, sol), sol, dir, inp.value);
  };
}

let rec = null;
function stopListening() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } const m = $("#mic"); if (m) m.classList.remove("listening"); }
function listen(inp, sol, lang) {
  if (rec) { stopListening(); return; }
  const mic = $("#mic");
  rec = new SR(); rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 5;
  mic.classList.add("listening");
  rec.onresult = e => {
    const alts = [...e.results[0]].map(a => a.transcript);
    let text;
    if (S.speechMode === "spell") text = spellToWord(alts[0], lang);
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
  return `Erkläre einem Kind aus der 5. Klasse kurz das englische Wort „${card.en}“ (deutsch: ${card.de}). Gib eine einfache Erklärung, zwei kurze englische Beispielsätze mit Übersetzung und eine Eselsbrücke zum Merken. Antworte auf Deutsch.`;
}
function answered(card, result, sol, dir, typed) {
  const firstTime = !(card.id in R.first);
  if (firstTime) { R.first[card.id] = result; if (result !== "bad") R.good++; if (!R.practice) grade(card, result); }
  R.queue.shift();
  if (result === "bad") R.queue.splice(Math.min(R.queue.length, 3), 0, card.id);   // kommt in dieser Runde gleich noch einmal
  else R.done.add(card.id);
  const msg = result === "good" ? ["good", pick(["Richtig!", "Super!", "Genau!", "Stark!"]), ""]
    : result === "near" ? ["near", "Fast!", `Achte auf die Schreibweise: <span class="sol">${typed ? markDiff(typed, sol) : esc(sol)}</span>`]
    : ["bad", "Noch nicht.", `Richtig ist: <span class="sol">${esc(sol)}</span><span class="small">Das Wort kommt in dieser Runde gleich noch einmal.</span>`];
  const bot = BOTS[S.bot] || BOTS.chatgpt;
  $("#fb").replaceChildren(h(`<div class="feedback ${msg[0]}"><strong>${msg[1]}</strong>${msg[2] ? `<span class="fbtext">${msg[2]}</span>` : ""}
      ${card.ex ? `<div class="extra"><i>${esc(card.ex)}</i></div>` : ""}
      <div class="row">${canSpeak ? `<button class="speak" id="say2">${ICON.speaker}${esc(card.en)}</button>` : ""}
      ${S.aiHelp ? `<a class="speak" id="ask" href="${esc(bot.url(aiQuestion(card)))}" target="_blank" rel="noopener">Frag ${esc(bot.name)}</a>` : ""}</div></div>
    <button class="btn wide" id="next" style="margin-top:12px">Weiter</button>`));
  if (canSpeak) { $("#say2").onclick = () => say(card.en); if (result !== "bad") say(card.en); }
  if ($("#ask") && bot.copyFirst) $("#ask").onclick = () => { copyText(aiQuestion(card)); toast("Frage kopiert. Füge sie im Chat ein."); };
  save();
  const nx = $("#next"); nx.focus({ preventScroll: true }); nx.onclick = renderCard;
}
function renderSummary() {
  if (!R.practice) bumpStreak(); save();
  const n = R.total, g = R.good;
  const what = R.unit === FREE ? "Übungsrunde geschafft" : R.practice ? "Testtraining geschafft" : "Runde geschafft";
  app.replaceChildren(h(`<div class="done">
    <p class="eyebrow">${what}</p>
    <div class="score">${g}/${n}</div>
    <p>${g === n ? "Alles beim ersten Versuch gewusst." : "beim ersten Versuch gewusst. Die anderen hast du am Ende auch geschafft."}</p>
    ${R.practice ? '<p class="muted small">Beim freien Üben und beim Testtraining bleiben die Fächer unverändert.</p>'
      : `<div class="streak">${ICON.flame}<span>${liveStreak()} ${liveStreak() === 1 ? "Tag" : "Tage"} am Stück</span></div>`}
    <div class="row" style="justify-content:center"><button class="btn" id="again">Noch eine Runde</button><button class="btn ghost" id="home">Fertig</button></div>
  </div>`));
  const unit = R.practice ? R.unit : null;
  $("#again").onclick = () => startRound(unit === null && !dueCards().length && !Math.min(newLeft(), newCards().length) ? FREE : unit);
  $("#home").onclick = () => { R = null; renderHome(); };
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
    if (parts.length >= 2 && parts[0] && parts[1]) out.push({ en: parts[0].trim(), de: parts[1].trim(), ex: (parts[2] || "").trim() });
  }
  return { name, rows: out };
}
function renderImport(prefill) {
  if (prefill) { rows = prefill.rows; importName = prefill.name; }
  const shareFiles = !!(navigator.canShare && window.File);
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Vokabeln hinzufügen</h2></div>
    ${prefill ? `<p class="status">Jemand hat dir diese Unit geschickt. Prüf die Liste und tipp auf „Übernehmen“.</p>` : ""}
    <label class="f">Name der Unit<input class="input" id="unitName" placeholder="z. B. Unit 2 – My family" value="${esc(importName)}"></label>
    ${prefill ? "" : `
    <section class="panel">
      <h3>1. Foto der Vokabelseite an deinen KI-Chat</h3>
      <p class="muted small">Die App schickt nichts selbst weg. Du entscheidest, an welchen Chat das Foto geht.</p>
      <label class="btn wide" for="photo">${ICON.camera}<span id="photoLabel">Foto aufnehmen oder wählen</span></label>
      <input type="file" id="photo" accept="image/*" capture="environment" hidden>
      <button class="btn ghost wide" id="sharePhoto" hidden>${ICON.share}Foto und Auftrag an KI-Chat senden</button>
      <p class="muted small" id="shareHint" hidden>Im Teilen-Menü wählst du ChatGPT, Claude oder Gemini. Der Auftrag liegt außerdem in der Zwischenablage, falls die Chat-App nur das Bild übernimmt.</p>
      <details>
        <summary class="small" style="cursor:pointer">Ohne Teilen-Menü: Chat selbst öffnen</summary>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
          <p class="muted small">Öffne den Chat mit dem Auftrag und häng dort das Foto an.</p>
          <div class="row">${Object.entries(BOTS).map(([k, b]) => `<a class="btn ghost small" data-bot="${k}" href="${esc(b.url(PHOTO_PROMPT))}" target="_blank" rel="noopener">${b.name}</a>`).join("")}</div>
          <div class="prompt" id="promptText">${esc(PHOTO_PROMPT)}</div>
          <button class="btn ghost small" id="copy">Auftrag kopieren</button>
        </div>
      </details>
    </section>
    <section class="panel">
      <h3>2. Antwort hier einfügen</h3>
      <p class="muted small">Kopiere die Liste aus dem Chat. Du kannst auch selbst tippen: eine Vokabel pro Zeile, <b>englisch ; deutsch</b>.</p>
      <textarea id="paste" placeholder="mother ; Mutter&#10;brother ; Bruder ; I have got a brother."></textarea>
      <div class="row">
        ${navigator.clipboard && navigator.clipboard.readText ? '<button class="btn ghost small" id="fromClip">Aus Zwischenablage einfügen</button>' : ""}
        <button class="btn small" id="parse">Liste prüfen</button>
      </div>
    </section>`}
    <section class="panel" id="reviewPanel" hidden>
      <div class="spread"><h3>${prefill ? "Vokabeln der Unit" : "3. Erkannte Vokabeln"}</h3><span class="small muted" id="rcount"></span></div>
      <div class="review" id="review"></div>
      <button class="btn wide" id="save">Übernehmen</button>
    </section>
  `));
  $("#back").onclick = () => { rows = []; photo = null; importName = ""; renderHome(); };
  $("#unitName").oninput = e => importName = e.target.value;
  if (!prefill) {
    $("#photo").onchange = e => {
      photo = e.target.files[0] || null; e.target.value = "";
      if (!photo) return;
      $("#photoLabel").textContent = "Anderes Foto wählen";
      const can = shareFiles && navigator.canShare({ files: [photo] });
      $("#sharePhoto").hidden = !can; $("#shareHint").hidden = !can;
      if (!can) { $("details").open = true; toast("Teilen geht hier nicht. Öffne den Chat und häng das Foto an."); }
    };
    $("#sharePhoto").onclick = async () => {
      if (!photo) return;
      await copyText(PHOTO_PROMPT);
      try { await navigator.share({ files: [photo], text: PHOTO_PROMPT }); }
      catch (err) { if (err && err.name !== "AbortError") { $("details").open = true; toast("Teilen hat nicht geklappt. Öffne den Chat selbst."); } }
    };
    $$("[data-bot]").forEach(a => a.onclick = () => { copyText(PHOTO_PROMPT); if (BOTS[a.dataset.bot].copyFirst) toast("Auftrag kopiert. Füge ihn im Chat ein."); });
    $("#copy").onclick = async () => {
      if (await copyText(PHOTO_PROMPT)) toast("Auftrag kopiert");
      else { const r = document.createRange(); r.selectNodeContents($("#promptText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Text markiert. Bitte kopieren."); }
    };
    if ($("#fromClip")) $("#fromClip").onclick = async () => {
      try { const t = await navigator.clipboard.readText(); $("#paste").value = t; addParsed(t); }
      catch (e) { toast("Kein Zugriff auf die Zwischenablage. Füge den Text mit langem Tippen ein."); }
    };
    $("#parse").onclick = () => addParsed($("#paste").value);
  }
  $("#save").onclick = () => {
    const unit = $("#unitName").value.trim() || "Neue Unit";
    const good = rows.filter(r => r.en.trim() && r.de.trim());
    if (!good.length) { toast("Die Liste ist leer"); return; }
    const existing = new Set(S.cards.filter(c => c.unit === unit).map(c => norm(c.en) + "|" + norm(c.de)));
    let added = 0;
    good.forEach(r => {
      const k = norm(r.en) + "|" + norm(r.de); if (existing.has(k)) return; existing.add(k);
      S.cards.push({ id: uid(), en: r.en.trim(), de: r.de.trim(), ex: (r.ex || "").trim(), unit, level: 0, due: 0 }); added++;
    });
    save(); rows = []; photo = null; importName = "";
    toast(added ? `${added} Vokabeln übernommen` : "Diese Vokabeln sind schon in der Unit"); renderHome();
  };
  if (rows.length) renderReview();
}
function addParsed(text) {
  const p = parseList(text);
  if (!p.rows.length) { toast("Keine Zeile im Format englisch ; deutsch gefunden"); return; }
  rows = rows.concat(p.rows);
  if (p.name && !$("#unitName").value.trim()) { $("#unitName").value = p.name; importName = p.name; }
  renderReview();
  $("#reviewPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderReview() {
  $("#reviewPanel").hidden = !rows.length;
  $("#rcount").textContent = rows.length + " Wörter";
  const box = $("#review");
  box.replaceChildren(h(`<div class="rrow small muted"><span>Englisch</span><span>Deutsch</span><span></span></div>` +
    rows.map((r, i) => `<div class="rrow"><input class="input" data-k="en" data-i="${i}" value="${esc(r.en)}" aria-label="Englisch">
      <input class="input" data-k="de" data-i="${i}" value="${esc(r.de)}" aria-label="Deutsch">
      <button data-rm="${i}" aria-label="Zeile entfernen">×</button></div>`).join("")));
  $$("input", box).forEach(inp => inp.oninput = () => { rows[+inp.dataset.i][inp.dataset.k] = inp.value; });
  $$("[data-rm]", box).forEach(b => b.onclick = () => { rows.splice(+b.dataset.rm, 1); renderReview(); });
}

// ---------- Unit teilen ----------
async function renderShare(unit) {
  const cards = S.cards.filter(c => c.unit === unit);
  const link = appUrl() + "#pack=" + await encodePack(unit, cards);
  let qrSvg = "";
  try {
    if (window.qrcode && link.length <= 2000) { const q = qrcode(0, "L"); q.addData(link, "Byte"); q.make(); qrSvg = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
  } catch (e) { qrSvg = ""; }
  app.replaceChildren(h(`
    <div class="progress"><button class="iconbtn" id="back" aria-label="Zurück">${ICON.back}</button><h2>Unit teilen</h2></div>
    <section class="panel">
      <h3 style="overflow-wrap:anywhere">${esc(unit)}</h3>
      <p class="muted small">${cards.length} Wörter. Der Link enthält nur die Wortliste, keinen Lernstand und keine Namen. Wer ihn öffnet, kann die Unit in die eigene App übernehmen.</p>
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

// ---------- Einstellungen ----------
let deferredInstall = null;
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
      <p class="small">Der Vokabelkasten braucht keine Anmeldung und speichert keine Namen. Alle Vokabeln und der Lernstand bleiben in deinem Browser auf diesem Gerät. Die App schickt nichts an einen Server. Sie lädt keine Schriften, Werbung oder Statistik-Dienste von anderen Anbietern.</p>
      <p class="small">Fotos und Fragen gehen nur dann an einen KI-Chat, wenn du sie selbst teilst oder den Chat öffnest. Dafür gelten die Regeln des jeweiligen Anbieters.</p>
      <p class="small">Die Spracheingabe nutzt die Spracherkennung deines Browsers. Bei Chrome läuft sie über Server von Google, bei Safari über Apple.</p>
      <p class="small muted">Beim Laden der Seite sieht der Webserver (GitHub Pages) technisch bedingt deine IP-Adresse.</p>
    </section>
    <div class="footer small muted"><span>Vokabelkasten</span><a href="https://github.com/davidpricking/vokabelkasten" target="_blank" rel="noopener">Quellcode</a></div>
  `));
  $("#back").onclick = renderHome;
  if ($("#install")) $("#install").onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; renderSettings(); };
  $$("[data-npd]").forEach(b => b.onclick = () => { S.newPerDay = +b.dataset.npd; save(); renderSettings(); });
  $("#aiHelp").onchange = e => { S.aiHelp = e.target.checked; save(); };
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
      S = Object.assign(defaults(), data); save(); renderSettings(`Lernstand geladen: ${S.cards.length} Wörter.`);
    } catch (err) { renderSettings("Diese Datei ist keine Sicherung des Vokabelkastens."); }
  };
}

// ---------- Start ----------
async function boot() {
  const m = location.hash.match(/^#pack=([zj][A-Za-z0-9_-]+)$/);
  if (m) {
    history.replaceState(null, "", location.pathname);
    try { const p = await decodePack(m[1]); if (p.rows.length) { renderImport(p); return; } } catch (e) {}
    toast("Dieser Link enthält keine lesbare Unit.");
  }
  renderHome();
}
boot();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
