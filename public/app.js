/* BURN Terminal — client */
(() => {
"use strict";

/* ---------- settings ---------- */
const CONFIG = {
  deadAddress: "",                               // comes from the server (/api/me ← DEAD_ADDRESS)
  xHandle: "burnterminal",
  launchTweetId: "2109343538269847771",           // id of the post to like/repost/quote
  launchTweetUrl: "https://x.com/burnterminal/status/2109343538269847771", // same post as a URL
  telegram: "https://t.me/burnterminal",          // Telegram channel
  pool: 150_000_000, basePct: 0.30, exponent: 0.7, maxCounted: 30, expected: 4000, avgTokens: 2.3,
  earlyPool: 50_000_000, earlyExpected: 5000,     // 5% of supply for early supporters (tasks, no burn), split equally
};

const FLAME = ["                          ::                   ", "                         :**:                  ", "                       ******:                 ", "                      ********:                ", "                    *********:                 ", "                   *********:                  ", "                   *********                   ", "                 :*****##****                  ", "                :*****###***                   ", "                *****####***:                  ", "               :****######***:                 ", "               :***####@##****:                ", "        ::     ****###@@###****:               ", "      :****:    ***###@@@##*****:              ", "       :****:   ***###@@@###****:      ::      ", "       ::*****  :***##@@@@###****:    :*::     ", "        :*****   ***##@@@@@###****  :***::     ", "        *******  ***##@@@@@###***: :****:      ", "       ****#***::***##@@@@@@##***: *****:      ", "     .*****#*******###@@@@@@###** ******:      ", "    :*****###*****###@@@@@@@##***:*******:     ", "    :****#####**####@@@@@@@@@##*****#*****     ", "   :*****###@#####@@@@@@@@@@@##***###******    ", "  ******###@@@@@@@@@@@@@@@@@@@########*****:   ", "  *****###@@@@@@@@@@@@@@@@@@@@@@@@@####*****   ", " :****###@@@@@@@@@@@@@@@@@@@@@@@@@@@###*****:  ", " *****##@@@          @@@@          @@###*****  ", ":****###@@ WWWWWWWWW @@@@ WWWWWWWWW @###*****  ", "::***###@@       WWW @@@@       WW  @@##*****  ", ":****##@@@@      WW @@@@@@      WW @@@###****: ", "*****###@@@@       @@@@@@@@       @@@####****: ", ":****###@@@@@@@@@@@@@@@@@@@@@@@@@@@@@####****: ", " :****###@@@@@@@@@@@@@@@@@@@@@@@@@@@####****:  ", " :*****####@@@@@@@@@@@@@@@@@@@@@@@#####*****:  ", "  ******####@@@@@@@@@@@@@@@@@@@@######*****:   ", "  ::******#####@@@@@@@@@@@@@@@#####********    ", "   ::*******#######@@@@@@@@######*******:::    ", "     ::********################********::      ", "      ::***********#########*********::        ", "        :::************************::          ", "           ::::**************:::::             ", "               ::::::::::::::                  "];
const FIG = {"0": [" ██████╗ ", "██╔═████╗", "██║██╔██║", "████╔╝██║", "╚██████╔╝", " ╚═════╝ "], "1": [" ██╗", "███║", "╚██║", " ██║", " ██║", " ╚═╝"], "2": ["██████╗ ", "╚════██╗", " █████╔╝", "██╔═══╝ ", "███████╗", "╚══════╝"], "3": ["██████╗ ", "╚════██╗", " █████╔╝", " ╚═══██╗", "██████╔╝", "╚═════╝ "], "4": ["██╗  ██╗", "██║  ██║", "███████║", "╚════██║", "     ██║", "     ╚═╝"], "5": ["███████╗", "██╔════╝", "███████╗", "╚════██║", "███████║", "╚══════╝"], "6": [" ██████╗ ", "██╔════╝ ", "███████╗ ", "██╔═══██╗", "╚██████╔╝", " ╚═════╝ "], "7": ["███████╗", "╚════██║", "    ██╔╝", "   ██╔╝ ", "   ██║  ", "   ╚═╝  "], "8": [" █████╗ ", "██╔══██╗", "╚█████╔╝", "██╔══██╗", "╚█████╔╝", " ╚════╝ "], "9": [" █████╗ ", "██╔══██╗", "╚██████║", " ╚═══██║", " █████╔╝", " ╚════╝ "], ",": ["   ", "   ", "   ", "   ", "▄█╗", "╚═╝"], "B": ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "], "U": ["██╗   ██╗", "██║   ██║", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "], "R": ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██║  ██║", "╚═╝  ╚═╝"], "N": ["███╗   ██╗", "████╗  ██║", "██╔██╗ ██║", "██║╚██╗██║", "██║ ╚████║", "╚═╝  ╚═══╝"], "$": ["▄▄███▄▄·", "██╔════╝", "███████╗", "╚════██║", "███████║", "╚═▀▀▀══╝"], "E": ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "███████╗", "╚══════╝"], "A": [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"], "L": ["██╗     ", "██║     ", "██║     ", "██║     ", "███████╗", "╚══════╝"], "Y": ["██╗   ██╗", "╚██╗ ██╔╝", " ╚████╔╝ ", "  ╚██╔╝  ", "   ██║   ", "   ╚═╝   "], "S": ["███████╗", "██╔════╝", "███████╗", "╚════██║", "███████║", "╚══════╝"], "P": ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔═══╝ ", "██║     ", "╚═╝     "], "O": [" ██████╗ ", "██╔═══██╗", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "], "T": ["████████╗", "╚══██╔══╝", "   ██║   ", "   ██║   ", "   ██║   ", "   ╚═╝   "], " ": ["   ", "   ", "   ", "   ", "   ", "   "], "~": ["", "", "", "", "", ""]};

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = n => Math.round(n).toLocaleString("en-US");
const pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const short = a => a ? a.slice(0, 6) + "…" + a.slice(-4) : "";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("burn:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("burn:" + k, JSON.stringify(v)); } catch {} },
};
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 1800); }
async function copy(text, label) {
  try { await navigator.clipboard.writeText(text); toast(label + " ✓"); beep(880, .04); }
  catch { const n = document.createElement("textarea"); n.value = text; document.body.append(n); n.select(); try { document.execCommand("copy"); toast(label + " ✓"); } catch { toast(text); } n.remove(); }
}
async function api(path, opts = {}) {
  const r = await fetch(path, { credentials: "same-origin", headers: { "content-type": "application/json" }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || "Something went wrong. Try again."); e.status = r.status; throw e; }
  return j;
}
// burn check: when the server says it's busy (503), wait a moment and try again, up to 3 times
async function claimCall(wallet, onBusy) {
  for (let i = 0; ; i++) {
    try { return await api("/api/claim", { method: "POST", body: { wallet } }); }
    catch (e) { if (e.status !== 503 || i >= 2) throw e; onBusy?.(); await sleep(2000 + i * 1500 + Math.random() * 800); }
  }
}

/* ---------- sound ---------- */
let audio, soundOn = store.get("sound", false);
function beep(f = 660, d = .05, type = "square", vol = .03) {
  if (!soundOn) return;
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + d); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + d + .02); } catch {}
}
function setSound(v) { soundOn = v; store.set("sound", v); const b = $("#soundBtn"); b.setAttribute("aria-pressed", v); b.textContent = "sound " + (v ? "on" : "off"); }
$("#soundBtn").onclick = () => { setSound(!soundOn); beep(990); };
setSound(soundOn);

/* ---------- big ascii text ---------- */
function fig(str) {
  const rows = ["", "", "", "", "", ""];
  for (const ch of str) { const g = FIG[ch] || FIG["~"]; for (let i = 0; i < 6; i++) rows[i] += (g[i] || "").padEnd(g[0].length); }
  return rows;
}
const figRows = (rows, color) => rows.map((r, i) => [...r].map(ch => "█▄▀".includes(ch) ? `<span style="color:${typeof color === "function" ? color(i) : color}">${ch}</span>` : ch === " " ? " " : `<span class="k">${esc(ch)}</span>`).join(""));
const figHTML = (rows, color) => figRows(rows, color).join("\n");
// big amount with an equally big "$BURN" next to it (under it when the screen is too narrow)
function paintAmount(el, v) {
  const n = fig(fmt(v)), b = fig("$BURN"), gap = "   ";
  const p = el.parentElement, cs = getComputedStyle(p), w = (p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) || 300;
  const oneCols = n[0].length + gap.length + b[0].length, one = w / (oneCols * .6021) >= 9;
  const rn = figRows(n, i => i < 2 ? "#FFE15A" : "#FFD21F"), rb = figRows(b, i => i < 2 ? "#FF8A0C" : "#FF6A0A");
  el.innerHTML = one ? rn.map((r, i) => r + gap + rb[i]).join("\n") : rn.join("\n") + "\n\n" + rb.join("\n");
  fitFont(el, one ? oneCols : Math.max(n[0].length, b[0].length, 44), 16);
}
function fitFont(el, cols, max) {
  const p = el.parentElement, cs = getComputedStyle(p), w = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  el.style.fontSize = Math.min(max, (w || 300) / (cols * 0.6021)) + "px";
}
const HEAT = ["#FF2E1A", "#FF3F14", "#FF6A0A", "#FF8A0C", "#FFA50F", "#FFD21F"];

/* ---------- drop math ---------- */
let STATS = { claimers: 0, points: 0, early: 0 };
const M = (() => {
  const p = 1 / CONFIG.avgTokens; let E = 0;
  for (let k = 1; k < 400; k++) E += p * Math.pow(1 - p, k - 1) * Math.pow(Math.min(k, CONFIG.maxCounted), CONFIG.exponent);
  const pts = n => n > 0 ? Math.pow(Math.min(n, CONFIG.maxCounted), CONFIG.exponent) : 0;
  // people = how many burn; uses live numbers when they are bigger than the model
  function est(n, people) {
    if (n <= 0) return 0;
    const N = people || Math.max(CONFIG.expected, STATS.claimers || 0);
    const SP = people ? N * E : Math.max(CONFIG.expected * E, STATS.points || 0);
    return CONFIG.pool * CONFIG.basePct / N + CONFIG.pool * (1 - CONFIG.basePct) * pts(n) / SP;
  }
  const early = () => CONFIG.earlyPool / Math.max(CONFIG.earlyExpected, STATS.early || 0);
  return { est, early };
})();

/* =========================================================
   FLAME (real text)
   ========================================================= */
const FL = (() => {
  const rows = FLAME.length, cols = FLAME[0].length, LVL = { ".": 0, ":": 1, "*": 2, "#": 3, "@": 4 }, RAMP = [".", ":", "✱", "#", "@"];
  const grid = FLAME.map(r => [...r]);
  let lidRow = Infinity; grid.forEach((r, i) => r.forEach(ch => { if (ch === "W") lidRow = Math.min(lidRow, i); }));
  const lid = [], pc = [];
  grid.forEach((r, i) => r.forEach((ch, c) => { if (ch === "W") { (i === lidRow ? lid : pc).push({ r: i, c }); grid[i][c] = " "; } }));
  const L = grid.map(r => r.map(ch => ch in LVL ? LVL[ch] : -1));
  const stops = [[0, [122, 20, 8]], [1, [212, 31, 16]], [2, [255, 46, 26]], [2.6, [255, 90, 16]], [3.2, [255, 138, 12]], [3.7, [255, 178, 18]], [4, [255, 210, 31]]];
  const col = h => { for (let i = 1; i < stops.length; i++) if (h <= stops[i][0]) { const [h0, a] = stops[i - 1], [h1, b] = stops[i], t = (h - h0) / (h1 - h0); return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * t)).join(",")})`; } return "rgb(255,210,31)"; };
  const C = grid.map((r, i) => r.map((_, c) => { if (L[i][c] < 0) return null; let s = 0, n = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const v = L[i + a]?.[c + b]; if (v >= 0) { s += v; n++; } } return col(.55 * L[i][c] + .45 * s / n); }));
  const mid = cols / 2;
  const eyes = [0, 1].map(s => { const lc = lid.filter(p => (p.c >= mid) === !!s).map(p => p.c), pp = pc.filter(p => (p.c >= mid) === !!s); return { min: Math.min(...lc), max: Math.max(...lc), pupil: Math.max(...pp.map(p => p.c)) - 1, prow: Math.floor(pp.reduce((a, p) => a + p.r, 0) / pp.length) }; });
  function frame(o = {}) {
    const out = grid.map((r, i) => r.map((ch, c) => [ch === "*" ? "✱" : ch, C[i][c]]));
    for (const e of eyes) {
      const lr = o.blink ? lidRow + 1 : lidRow;
      for (let c = e.min; c <= e.max; c++) out[lr][c] = ["=", "#F6F3EE"];
      if (!o.blink) { const p = Math.max(e.min, Math.min(e.max - 1, e.pupil + (o.pupilDx || 0))); out[e.prow][p] = ["#", "#F6F3EE"]; out[e.prow][p + 1] = ["#", "#F6F3EE"]; }
    }
    return out;
  }
  return { rows, cols, L, RAMP, frame, lidRow };
})();

const hero = (() => {
  const pre = $("#flame"); let spans = [], rowsEl = [], t0 = 0, pdx = 0, pdxT = 0, nextBlink = 4, blinkUntil = 0, dirty = [];
  function build() {
    pre.innerHTML = FL.frame().map(r => `<span class="rw">${r.map(([ch, c]) => `<span${c ? ` style="color:${c}"` : ""}>${ch === " " ? " " : esc(ch)}</span>`).join("")}</span>`).join("");
    rowsEl = [...pre.children]; spans = rowsEl.map(r => [...r.children]); fit();
  }
  function fit() { const w = pre.parentElement.clientWidth || 300; pre.style.fontSize = Math.min(15, w / (FL.cols * 0.6021)) + "px"; }
  function eyes(blink) {
    const f = FL.frame({ blink, pupilDx: Math.round(pdx) });
    for (let r = FL.lidRow; r <= FL.lidRow + 3 && r < FL.rows; r++) for (let c = 0; c < FL.cols; c++) { const [ch, color] = f[r][c], s = spans[r][c]; if (s.textContent !== ch) s.textContent = ch; s.style.color = color || ""; }
  }
  function ignite() {
    if (reduce) return Promise.resolve();
    rowsEl.forEach(r => r.style.visibility = "hidden");
    return new Promise(res => {
      const n = FL.rows, start = performance.now();
      (function step(now) {
        const k = Math.min(1, (now - start) / 1200), show = Math.floor(k * n);
        for (let i = 0; i < show; i++) {
          const r = n - 1 - i; rowsEl[r].style.visibility = "";
          if (i > show - 4) spans[r].forEach((s, c) => { const l = FL.L[r][c]; if (l > 0) s.textContent = FL.RAMP[l - 1]; });
          else if (i > show - 7) spans[r].forEach((s, c) => { const l = FL.L[r][c]; if (l >= 0) s.textContent = FL.RAMP[l]; });
        }
        if (k < 1) requestAnimationFrame(step); else { build(); res(); }
      })(start);
    });
  }
  function loop(now) {
    const t = (now - t0) / 1000;
    for (const [r, c] of dirty) spans[r][c].textContent = FL.RAMP[FL.L[r][c]];
    dirty = [];
    const n = Math.floor(FL.rows * FL.cols * .03);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(Math.random() * FL.rows), c = Math.floor(Math.random() * FL.cols), l = FL.L[r][c];
      if (l < 1 || (r >= FL.lidRow && r <= FL.lidRow + 3)) continue;
      spans[r][c].textContent = FL.RAMP[Math.random() < .7 ? l - 1 : Math.min(4, l + 1)]; dirty.push([r, c]);
    }
    const cw = parseFloat(pre.style.fontSize) * .6021;
    rowsEl.forEach((el, r) => { const a = Math.max(0, 1 - r / (FL.rows * .6)); el.style.transform = a ? `translateX(${(Math.sin(t * 2.1 + r * .42) * a * cw * .55).toFixed(1)}px)` : ""; });
    if (t > nextBlink) { blinkUntil = t + .16; nextBlink = t + 4 + Math.random() * 4; }
    pdx += (pdxT - pdx) * .35; eyes(t < blinkUntil);
    setTimeout(() => requestAnimationFrame(loop), 90);
  }
  addEventListener("pointermove", e => { const r = pre.getBoundingClientRect(), d = (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2); pdxT = Math.max(-6, Math.min(0, Math.round(d * 6))); }, { passive: true });
  addEventListener("resize", fit);
  build();
  return { async go() { await ignite(); if (!reduce) { t0 = performance.now(); requestAnimationFrame(loop); } }, blink() { nextBlink = 0; } };
})();

/* =========================================================
   SESSION · X → tasks → wallet → burn, or "no tokens" = early supporter
   ========================================================= */
const MODE = { live: false, xEnabled: false, manual: true };   // live = Netlify functions answered
const STEPS = ["Sign in with X", "Do four quick tasks", "Your wallet", "Burn or claim"];
const N_STEPS = STEPS.length;
const TASKS = ["follow", "likert", "reply", "tg"];
const blank = () => ({ step: 1, user: null, tasks: {}, replyUrl: "", replyOpen: false, wallet: "", path: "", checked: false, result: [], skipped: [], estimate: 0, kind: "", done: false, sample: false });
let S = Object.assign(blank(), store.get("s3", {}));
const save = () => store.set("s3", S);
const tasksDone = () => TASKS.every(k => S.tasks[k]);
const WHY = { keep: "not a rug, keep it", cnft: "compressed NFT" };
const tag = r => r.kind === "nft" ? `<span class="dim">[nft]</span>` : "";
const itemName = r => (r.kind === "nft" ? "" : "$") + esc(r.symbol);
const itemsHTML = () => S.result.map(r => `<span class="w">${itemName(r)}</span>${r.kind === "nft" ? " " + tag(r) : ""}`).join("  ");

// preview only (no server): what a check could return
const SAMPLE_BURN = [
  { address: "0x01", symbol: "RUGLORD", kind: "token" }, { address: "0x02", symbol: "BAGHOLD", kind: "token" },
  { address: "0x03", symbol: "DEADCAT", kind: "token" }, { address: "0x04", symbol: "Hood Apes", kind: "nft" },
  { address: "0x05", symbol: "Pixel Bags", kind: "nft" },
];
const SAMPLE_SKIP = [{ address: "0x09", symbol: "USDC", kind: "token", reason: "keep" }];

function doneLine(k) {
  const back = n => S.done ? "" : ` <button class="lk" data-back="${n}">change</button>`;
  const L = {
    1: `Signed in as <span class="w">@${esc(S.user?.username)}</span>${back(1)}`,
    2: `${TASKS.length} tasks done`,
    3: `Wallet <span class="w">${short(S.wallet)}</span>${S.sample ? " (preview)" : ""}${back(3)}`,
    4: S.kind === "early" ? `No rugs to burn · <span class="y">early supporter</span>` : `${pl(S.result.length, "rug")} burned`,
  }[k];
  return `<p class="ln"><span class="mk ok">✓</span>${L}</p>`;
}
function head(k) { return `<p class="ln head"><span class="mk">›</span>Step ${k} of ${N_STEPS} <span class="dim">·</span> ${STEPS[k - 1]} <span class="cur"></span></p>`; }

function body(k) {
  switch (k) {
    case 1: return `
      <p class="dim">We link your drop to your X account.</p>
      <div class="row"><button class="b p" id="xGo">Sign in with X</button></div>
      <form id="xForm" class="row" hidden><div class="field" style="flex:1 1 28ch"><label for="xHandle">your X handle @</label><input id="xHandle" autocomplete="off" spellcheck="false" maxlength="15" placeholder="handle"></div><button class="b" type="submit">Continue</button></form>
      <p class="err" id="xErr">${esc(S.xError || "")}</p>`;
    case 2: {
      const T = [["follow", "Follow @" + CONFIG.xHandle], ["likert", "Like and repost our post"], ["reply", "Reply to our post"], ["tg", "Join our Telegram"]];
      const replyForm = S.replyOpen && !S.tasks.reply ? `<form id="rForm" class="row rform"><div class="field" style="flex:1 1 40ch"><label for="rIn">your reply link</label><input id="rIn" autocomplete="off" spellcheck="false" placeholder="https://x.com/you/status/…" value="${esc(S.replyUrl)}"></div><button class="b p" type="submit">Continue</button></form><p class="err" id="rErr"></p>` : "";
      return `
      <p class="dim">Everyone who finishes these gets $BURN. Got rugs? You'll burn them next for a bigger drop.</p>
      <ul class="tasks">${T.map(([k, name]) => `<li class="task${S.tasks[k] ? " done" : ""}" data-task="${k}"><span class="ck">${S.tasks[k] ? "[✓]" : "[ ]"}</span><span class="tn">${name}</span><span class="act">${S.tasks[k] ? '<span class="ok">done</span>' : `<a class="b" target="_blank" rel="noopener" href="${taskUrl(k)}" data-open="${k}">${k === "reply" && S.replyOpen ? "Open again" : "Open"}</a>`}</span>${k === "reply" ? replyForm : ""}</li>`).join("")}</ul>
      <p class="err" id="tErr"></p>`;
    }
    case 3: return `
      <p class="dim">Paste the Solana wallet that gets your $BURN. If you have rugs, you'll send them from this wallet. You never connect it or sign anything.</p>
      <form id="wForm" class="row"><div class="field" style="flex:1 1 44ch"><label for="wIn">wallet</label><input id="wIn" autocomplete="off" spellcheck="false" placeholder="your Solana address" value="${esc(S.wallet)}"></div><button class="b p" type="submit">Continue</button></form>
      <p class="err" id="wErr"></p>`;
    case 4: {
      if (!S.path && !S.checked) return `
      <p class="w">Got rugged tokens or NFTs to burn?</p>
      <div class="choice">
        <button class="b p big" id="pathBurn">I have rugs to burn · bigger airdrop</button>
        <button class="b free big" id="pathFree">Just claim free allocation</button>
      </div>
      <ul class="facts">
        <li>Burners split ${fmt(CONFIG.pool)} $BURN. More rugs burned, bigger share.</li>
        <li>Free allocation: early supporters split ${fmt(CONFIG.earlyPool)} $BURN equally. Nothing to send.</li>
      </ul>
      <p class="err" id="lErr"></p>`;
      return `
      <p>From your wallet app, send the rugged tokens and NFTs you want to burn to this address:</p>
      <div class="dest"><span class="addr">${CONFIG.deadAddress}</span><button class="b" data-copy="dead">Copy</button></div>
      <ul class="facts">
        <li>Each token or NFT collection counts once. Sending more of it adds nothing.</li>
        <li>Up to 30 count per wallet. Any amount works. NFTs count once per collection.</li>
        <li class="a">Don't send SOL, stablecoins or compressed NFTs. They don't count. Stock tokens are real money, keep them.</li>
      </ul>
      <div class="row" id="sentRow"><button class="b p" id="sent">${S.checked ? "Check again" : "I sent them, check"}</button><span class="dim" id="cool"></span></div>
      <pre id="vOut" class="dim"></pre>
      <p class="err" id="vErr"></p>
      <div id="estBox" class="est" hidden>
        <p class="w">Your estimated drop</p>
        <pre class="bigfig" id="estFig"></pre>
        <p class="dim">The final amount can go up or down after everyone has burned. Burn more and check again any time.</p>
        <div class="row gap"><button class="b p" id="lockBurn">Lock in my drop</button></div>
      </div>
      <p class="dim alt-line"${S.checked ? " hidden" : ""}>No rugs after all? <button class="lk" id="pathFree">Just claim free allocation</button></p>
      <p class="err" id="lErr"></p>`;
    }
  }
}

function render(animate) {
  const log = $("#log");
  let h = "";
  for (let k = 1; k < S.step; k++) h += doneLine(k);
  if (S.done) h += doneLine(N_STEPS) + finalCard();
  else h += `<div class="blk${animate ? " reveal" : ""}">${head(S.step)}<div class="body">${body(S.step)}</div></div>`;
  log.innerHTML = h;
  bind();
  if (S.done) { paintAlloc(animate); drawCard(); }
  if (animate && !reduce) $$(S.done ? ".final > *" : ".blk .body > *").forEach((el, i) => { el.classList.add("reveal"); el.style.animationDelay = (i * 70) + "ms"; });
}
function go(step) { S.step = step; save(); render(true); beep(740); const b = $(".blk") || $(".final") || $("#log"); if (b && b.getBoundingClientRect().top > innerHeight * .7) b.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }

/* ---------- the end: allocation card, burner or early supporter ---------- */
// live number: same formula as the server, with today's totals; the exact amount is fixed at the snapshot
const allocNow = () => S.kind === "early" ? Math.round(M.early()) : S.result.length ? Math.round(M.est(S.result.length)) : S.estimate;
function finalCard() {
  const early = S.kind === "early";
  return `
    <div class="final${early ? " early" : ""}" role="region" aria-label="Your allocation">
      <p class="ttl"><span class="w">${early ? "Early supporter" : "Your allocation"}</span><span class="dim">@${esc(S.user?.username || "anon")} · ${short(S.wallet)}</span></p>
      ${early ? `<pre class="efig" aria-label="Early supporter">${figHTML(fig("EARLY"), i => HEAT[i])}\n${figHTML(fig("SUPPORTER"), i => HEAT[i])}</pre>` : `<p><span class="ok">✓ ${pl(S.result.length, "rug")} burned</span>  ${itemsHTML()}</p>`}
      <div class="est">
        <p class="w">Estimated allocation</p>
        <pre class="bigfig" id="allocFig" aria-label="${fmt(allocNow())} BURN"></pre>
      </div>
      <dl class="stat">
        <dt>you</dt><dd class="ok">${early ? "early supporter" : "burner"} ✓</dd>
        <dt>claim</dt><dd class="a">waiting <span class="cur"></span></dd>
        <dt>launch</dt><dd class="a">waiting</dd>
      </dl>
      <p class="y"><b>You're all set. Now wait for the claim and the launch.</b></p>
      <p class="dim">${early
        ? `Early supporters split ${fmt(CONFIG.earlyPool)} $BURN equally. This estimate assumes about ${fmt(CONFIG.earlyExpected)} of you. The exact amount is set at the snapshot.`
        : "Nothing else to do here. The exact amount is set at the snapshot, after everyone has burned."} We'll announce the claim date on X and Telegram.</p>
      <div class="share">
        <p class="w"><b>Flex your card.</b> <span class="dim">Quote our post with it.</span></p>
        <canvas class="card" id="card" width="1200" height="675" aria-label="Your ${early ? "early supporter" : "burn"} card"></canvas>
        <ol class="howto"><li>Download or copy your card.</li><li>Quote our post and attach the card.</li></ol>
        <div class="row"><a class="b" id="cardDl" download="${early ? "burn-early-supporter" : "burn-card"}.png">Download card</a><button class="b q" id="cardCopy">Copy image</button><a class="b p" target="_blank" rel="noopener" id="postGo" href="${postUrl()}">Quote on X</a></div>
      </div>
      <p class="dim">${early ? `Found some rugs after all? <button class="lk" id="toBurn">burn them for a bigger drop</button>` : `Burned more since? <button class="lk" id="recheck">recheck my burns</button> <span id="rcCool"></span>`}</p>
      <p class="err" id="rcErr"></p>
    </div>`;
}
function paintAlloc(animate) {
  const el = $("#allocFig"); if (!el) return;
  const v = allocNow();
  const paint = x => paintAmount(el, x);
  const ef = $(".efig"); if (ef) fitFont(ef, fig("SUPPORTER")[0].length, 10);
  if (!animate || reduce) { paint(v); return; }
  const t0 = performance.now();
  (function f(now) { const k = Math.min(1, (now - t0) / 1300); paint(v * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); else beep(1180, .12, "triangle", .05); })(t0);
}
function postUrl() {
  const amount = fmt(allocNow());
  const text = S.kind === "early"
    ? `I'm an EARLY SUPPORTER of the $BURN terminal 🔥\n\nEstimated allocation: ~${amount} $BURN`
    : `I just burned ${pl(S.result.length, "rug")} in the $BURN terminal 🔥\n\nEstimated allocation: ~${amount} $BURN`;
  // the url is our launch post, so X turns this into a quote; the card is attached by hand
  const u = new URL("https://x.com/intent/tweet"); u.searchParams.set("text", text + "\n\n" + location.host); u.searchParams.set("url", CONFIG.launchTweetUrl); return u.toString();
}
async function recheck() {
  const b = $("#recheck"), err = $("#rcErr");
  if (!b || Date.now() < coolUntil) return;
  err.textContent = ""; b.disabled = true; b.textContent = "checking…";
  try {
    if (MODE.live && !S.sample) {
      const r = await claimCall(S.wallet, () => { b.textContent = "busy, retrying…"; });
      const more = r.burned.length - S.result.length;
      S.result = r.burned; S.skipped = r.skipped || []; S.estimate = r.estimate; if (r.stats) STATS = r.stats; save();
      coolUntil = Date.now() + 15000;
      render(more > 0); toast(more > 0 ? `${pl(more, "new rug")} counted ✓` : "Nothing new yet");
      if (more > 0) hero.blink();
    } else { await sleep(600); coolUntil = Date.now() + 15000; render(false); toast("Nothing new yet"); }
  } catch (x) { b.disabled = false; b.textContent = "recheck my burns"; err.textContent = x.message; return; }
  tickRecheck();
}
function tickRecheck() {
  const b = $("#recheck"), c = $("#rcCool"); if (!b) return;
  const left = Math.ceil((coolUntil - Date.now()) / 1000);
  b.disabled = left > 0; c.textContent = left > 0 ? `· again in ${left}s` : "";
  if (left > 0) setTimeout(tickRecheck, 500);
}

/* ---------- bindings ---------- */
function bind() {
  $$("[data-back]").forEach(b => b.onclick = () => back(+b.dataset.back));
  $$('[data-copy="dead"]').forEach(b => b.onclick = () => copy(CONFIG.deadAddress, "Burn address copied"));
  if (S.done) return bindFinal();
  ({ 1: bind1, 2: bind2, 3: bind3, 4: bind4 })[S.step]?.();
}
function back(n) {
  if (S.done) return;
  if (n <= 1) { S = blank(); if (MODE.live) api("/api/logout", { method: "POST" }).catch(() => {}); }
  if (n <= 3) Object.assign(S, { wallet: "", path: "", checked: false, result: [], skipped: [], estimate: 0, kind: "" });
  go(n);
}
function bindFinal() {
  $("#recheck") && ($("#recheck").onclick = recheck, tickRecheck());
  $("#toBurn") && ($("#toBurn").onclick = () => { S.done = false; S.kind = ""; S.path = "burn"; go(4); });
  $("#postGo").onclick = () => beep(990);
  $("#cardCopy").onclick = async () => {
    try { const blob = await new Promise(r => $("#card").toBlob(r, "image/png")); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast("Card copied ✓"); }
    catch { toast("Can't copy here. Use Download instead."); }
  };
}

/* 1 · X */
function bind1() {
  const showManual = () => { $("#xForm").hidden = false; $("#xGo").parentElement.hidden = true; $("#xHandle").focus(); };
  $("#xGo").onclick = () => {
    if (MODE.live && MODE.xEnabled) { location.href = "/api/x/login"; return; }
    if (MODE.live && !MODE.manual) { $("#xErr").textContent = "X sign-in isn't set up yet. Try again later."; return; }
    showManual();
  };
  $("#xForm").onsubmit = async e => {
    e.preventDefault();
    const h = $("#xHandle").value.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{1,15}$/.test(h)) { $("#xErr").textContent = "Handles use letters, numbers and _ only, up to 15 characters."; return; }
    try { S.user = MODE.live ? (await api("/api/x/manual", { method: "POST", body: { username: h } })).user : { id: "local:" + h, username: h }; }
    catch (err) { $("#xErr").textContent = err.message; return; }
    S.xError = ""; S.sample = !MODE.live; go(tasksDone() ? 3 : 2);
  };
}

/* 2 · tasks (checked for show: "checking . . ." then a tick) */
function taskUrl(k) {
  if (k === "follow") return `https://x.com/intent/follow?screen_name=${CONFIG.xHandle}`;
  if (k === "likert") return CONFIG.launchTweetUrl;   // the post itself: like and repost are both right there
  if (k === "tg") return CONFIG.telegram;
  if (k === "reply") return `https://x.com/intent/tweet?in_reply_to=${CONFIG.launchTweetId}`;
  const text = `Getting into the $BURN terminal early 🔥\n\ndead bags in → $BURN out\n\n@${CONFIG.xHandle}`;
  const u = new URL("https://x.com/intent/tweet"); u.searchParams.set("text", text); u.searchParams.set("url", CONFIG.launchTweetUrl); return u.toString();
}
function bind2() {
  $$("[data-open]").forEach(a => a.onclick = () => {
    if (a.dataset.open !== "reply") return ping(a.dataset.open);
    if (!S.replyOpen) { S.replyOpen = true; save(); setTimeout(() => { render(); $("#rIn")?.focus(); }, 300); }   // after X opens: ask for the reply link
  });
  const f = $("#rForm"); if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const url = $("#rIn").value.trim(), err = $("#rErr"), m = url.match(REPLY_RE);
    S.replyUrl = url; save();
    if (!m) { err.textContent = "Paste the link to your reply. It looks like x.com/you/status/123…"; return; }
    if (m[3] === CONFIG.launchTweetId) { err.textContent = "That's our post. Paste the link to your reply."; return; }
    if (S.user?.username && !S.sample && m[2].toLowerCase() !== S.user.username.toLowerCase()) { err.textContent = `That reply is from @${m[2]}. Paste one from @${S.user.username}.`; return; }
    const btn = f.querySelector("button"); btn.disabled = true;
    const tasks = { ...S.tasks, reply: true };
    if (MODE.live && !S.sample) {
      try { const r = await api("/api/tasks", { method: "POST", body: { tasks, replyUrl: url } }); if (!r.tasks?.reply) throw new Error("That reply link didn't check out. Paste the link to your own reply."); }
      catch (x) { btn.disabled = false; err.textContent = x.message; return; }
    }
    S.tasks.reply = true; S.replyOpen = false; save(); beep(1046, .08);
    if (tasksDone()) { go(3); $("#wIn")?.focus(); } else render();
  };
}
const REPLY_RE = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d{5,25})/i;
function ping(k) {
  const li = $(`.task[data-task="${k}"]`); if (!li || S.tasks[k] || li.dataset.busy) return;
  li.dataset.busy = 1; li.querySelector(".act").innerHTML = `<span class="ping">checking <i>.</i><i>.</i><i>.</i></span>`;
  setTimeout(async () => {
    S.tasks[k] = true; save(); beep(1046, .08);
    const all = tasksDone();
    if (MODE.live && !S.sample) { try { await api("/api/tasks", { method: "POST", body: { tasks: S.tasks, replyUrl: S.replyUrl } }); } catch (x) { if (all) { S.tasks[k] = false; save(); render(); $("#tErr").textContent = x.message; return; } } }
    if (all) { go(3); $("#wIn")?.focus(); return; }
    render();
  }, 2000);
}

/* 3 · wallet (no scan: nothing to load, nothing to wait for) */
function bind3() {
  $("#wForm").onsubmit = e => {
    e.preventDefault();
    const a = $("#wIn").value.trim(), err = $("#wErr");
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) { err.textContent = "That's not a Solana address. Copy it from Phantom, Solflare or Backpack."; return; }
    if (a === CONFIG.deadAddress) { err.textContent = "That's the burn address. Paste your own wallet."; return; }
    S.wallet = a; S.sample = !MODE.live; S.checked = false; S.result = []; S.skipped = []; go(4);
  };
}

/* 4 · send + check, then lock in · or "no tokens" = early supporter */
let coolUntil = 0;
function bind4() {
  $("#pathBurn") && ($("#pathBurn").onclick = () => { S.path = "burn"; save(); render(true); beep(740); });
  $("#pathFree") && ($("#pathFree").onclick = e => lock("early", e.currentTarget));
  if (!$("#sent")) return;
  $("#sent").onclick = check;
  $("#lockBurn").onclick = e => lock("burn", e.currentTarget);
  if (S.checked) showResult(false);
  tickCool();
}
async function lock(mode, btn) {
  const err = $("#lErr"); err.textContent = ""; btn.disabled = true;
  try {
    let kind = mode;
    if (MODE.live && !S.sample) {
      const r = await api("/api/lock", { method: "POST", body: { mode, wallet: S.wallet } });
      kind = r.kind; if (r.stats) STATS = r.stats;
      if (kind === "burn" && r.tokens?.length) S.result = r.tokens;
      S.estimate = r.estimate;
      if (mode === "early" && kind === "burn") toast("This wallet already burned rugs, so you're in as a burner ✓");
    } else { if (mode === "early" && S.result.length) kind = "burn"; S.estimate = Math.round(kind === "early" ? M.early() : M.est(S.result.length)); }
    if (kind === "early") Object.assign(S, { result: [], skipped: [], checked: false });
    S.kind = kind; S.done = true; save(); go(N_STEPS); hero.blink();
  } catch (x) { btn.disabled = false; err.textContent = x.message; }
}
function tickCool() {
  const b = $("#sent"), c = $("#cool"); if (!b) return;
  const left = Math.ceil((coolUntil - Date.now()) / 1000);
  b.disabled = left > 0; c.textContent = left > 0 ? `check again in ${left}s` : "";
  if (left > 0) setTimeout(tickCool, 500);
}
async function check() {
  if (Date.now() < coolUntil) return;
  const out = $("#vOut"), err = $("#vErr"); err.textContent = ""; $("#estBox").hidden = true;
  out.textContent = "Checking the burn address…"; $("#sent").disabled = true;
  try {
    if (MODE.live && !S.sample) {
      const r = await claimCall(S.wallet, () => { out.textContent = "Lots of people burning right now. Retrying…"; });
      S.result = r.burned; S.skipped = r.skipped || []; S.estimate = r.estimate; if (r.stats) STATS = r.stats;
    } else {
      await sleep(800);
      S.result = SAMPLE_BURN; S.skipped = SAMPLE_SKIP; S.estimate = Math.round(M.est(S.result.length));
    }
  } catch (x) { out.textContent = ""; err.textContent = x.message; $("#sent").disabled = false; return; }
  coolUntil = Date.now() + 15000; tickCool();
  S.checked = S.result.length > 0; save();
  $("#sent").textContent = "Check again";
  if (!S.result.length) {
    out.innerHTML = S.skipped.length ? skippedLine() : "";
    err.textContent = "Nothing found yet. New transfers can take a minute to show up.";
    return;
  }
  $(".alt-line") && ($(".alt-line").hidden = true);
  await burnAnim(out);
  if (S.skipped.length) out.innerHTML += "\n" + skippedLine();
  showResult(true);
}
const skippedLine = () => `<span class="a">Not counted: ${S.skipped.map(s => `${itemName(s)} (${WHY[s.reason] || "doesn't count"})`).join(", ")}</span>`;
async function burnAnim(out) {
  const names = S.result.map(r => (r.kind === "nft" ? "" : "$") + r.symbol), head = `<span class="ok">✓ ${pl(names.length, "rug")} burned</span>  `;
  hero.blink(); beep(220, .25, "sawtooth", .03);
  const final = () => head + itemsHTML();
  if (reduce) { out.innerHTML = final(); return; }
  const G = ".:✱#@", cols = ["#FFD21F", "#FFA50F", "#FF6A0A", "#FF2E1A", "#7A1A08"], line = names.join("  ");
  for (let f = 0; f < 10; f++) {
    out.innerHTML = head + [...line].map(ch => ch === " " ? " " : f < 8 && Math.random() < .6 ? `<span style="color:${cols[Math.min(4, Math.floor(f / 2 + Math.random() * 1.5))]}">${G[Math.floor(Math.random() * 5)]}</span>` : `<span class="w">${esc(ch)}</span>`).join("");
    await sleep(70);
  }
  out.innerHTML = final();
}
function showResult(animate) {
  const box = $("#estBox"), el = $("#estFig"); if (!box || !S.checked) return; box.hidden = false;
  const paint = v => paintAmount(el, v);
  if (!$("#vOut").textContent) $("#vOut").innerHTML = `<span class="ok">✓ ${pl(S.result.length, "rug")} burned</span>  ` + itemsHTML() + (S.skipped?.length ? "\n" + skippedLine() : "");
  if (!animate || reduce) { paint(S.estimate); return; }
  const t0 = performance.now();
  (function f(now) { const k = Math.min(1, (now - t0) / 1300); paint(S.estimate * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); else beep(1180, .12, "triangle", .05); })(t0);
}

/* share card, 1200×675: burner or EARLY SUPPORTER */
async function drawCard() {
  const cv = $("#card"); if (!cv) return;
  try { await Promise.all([document.fonts.load('700 20px "BurnMono"'), document.fonts.load('400 20px "BurnMono"')]); } catch {}
  const c = cv.getContext("2d"), W = 1200, H = 675, F = '"BurnMono", monospace', early = S.kind === "early";
  c.fillStyle = "#000"; c.fillRect(0, 0, W, H);
  const off = document.createElement("canvas"); off.width = W; off.height = H; const o = off.getContext("2d");
  const fw = 420, cw = fw / FL.cols, chh = cw * 1.25, fx = W - fw - 60, fy = (H - FL.rows * chh) / 2;
  o.font = `700 ${cw / .6021}px ${F}`; o.textAlign = "center"; o.textBaseline = "middle";
  FL.frame().forEach((row, r) => row.forEach(([ch, col], k) => { if (ch !== " ") { o.fillStyle = col || "#F6F3EE"; o.fillText(ch, fx + (k + .5) * cw, fy + (r + .5) * chh); } }));
  if ("filter" in c) { c.filter = "blur(9px)"; c.globalAlpha = .7; c.drawImage(off, 0, 0); c.filter = "none"; c.globalAlpha = 1; }
  c.drawImage(off, 0, 0);
  const L = 64, n = S.result.length, room = fx - L - 30; let y = early ? 92 : 110;
  c.textBaseline = "alphabetic";
  const text = (parts, size = 24, bold) => { let x = L; c.font = `${bold ? 700 : 400} ${size}px ${F}`; for (const [t, col] of parts) { c.fillStyle = col; c.fillText(t, x, y); x += c.measureText(t).width; } y += size * 1.7; };
  const bigfig = (str, fs, color, glow) => {
    const rows = fig(str); c.font = `400 ${fs}px ${F}`; c.shadowColor = glow; c.shadowBlur = 14;
    rows.forEach((r, i) => { let x = L; for (const ch of r) { if (ch !== " ") { c.fillStyle = "█▄▀".includes(ch) ? color(i) : "#7A2A08"; c.fillText(ch, x, y + i * fs * 1.02); } x += fs * .6021; } });
    c.shadowBlur = 0; y += 6 * fs * 1.02;
  };
  text([["$ ", "#3BE36B"], ["burn", "#FFFFFF"]]);
  text([["@" + (S.user?.username || "anon"), "#FFFFFF"]], 30, true);
  if (early) {
    const fs = Math.min(18, room / (fig("SUPPORTER")[0].length * .6021));
    y -= 8; bigfig("EARLY", fs, i => HEAT[i], "rgba(255,90,20,.45)"); y += 10;
    bigfig("SUPPORTER", fs, i => HEAT[i], "rgba(255,90,20,.45)"); y += 40;
  } else {
    text([[`burned ${pl(n, "rug")}`, "#D8D8D8"]], 26);
    let line = ""; c.font = `400 22px ${F}`; const lines = [];
    for (const s of S.result.map(r => (r.kind === "nft" ? "" : "$") + r.symbol)) { if (c.measureText(line + s + "  ").width > room - 10) { lines.push(line); line = ""; } line += s + "  "; }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach(l => text([[l, "#FF6A0A"]], 22));
    y += 16;
  }
  text([["estimated allocation", "#7C7C7C"]], 22);
  const amount = fmt(allocNow()), afs = Math.min(early ? 19 : 22, room / (fig(amount)[0].length * .6021));
  bigfig(amount, afs, () => "#FFD21F", "rgba(255,190,30,.5)"); y += 34;
  c.font = `700 28px ${F}`; c.fillStyle = "#FF6A0A"; c.fillText("$BURN", L, y);
  c.font = `400 18px ${F}`; c.fillStyle = "#7C7C7C"; c.fillText("x.com/" + CONFIG.xHandle + " · Solana", L, H - 40);
  try { $("#cardDl").href = cv.toDataURL("image/png"); } catch {}
}

/* =========================================================
   CALCULATOR · simple and chart views
   ========================================================= */
const calc = { n: 3, p: 4000, view: store.get("calcView", "simple") };
function drawCalc() {
  $("#cN").textContent = calc.n; $("#cP").textContent = fmt(calc.p);
  const v = M.est(calc.n, calc.p);
  $("#cOut").textContent = fmt(v) + " $BURN";
  $$("[data-view]").forEach(b => { const on = b.dataset.view === calc.view; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  $("#calcChart").hidden = calc.view !== "chart";
  if (calc.view !== "chart") return;
  const max = M.est(30, calc.p), cols = $("#cCols");
  if (!cols.children.length) {
    cols.innerHTML = Array.from({ length: 30 }, (_, i) => `<button class="col" data-k="${i + 1}"><span class="bar"></span></button>`).join("");
    cols.querySelectorAll(".col").forEach(b => b.onclick = () => { calc.n = +b.dataset.k; drawCalc(); beep(600 + calc.n * 20, .02); });
  }
  cols.querySelectorAll(".col").forEach(b => {
    const k = +b.dataset.k, val = M.est(k, calc.p);
    b.querySelector(".bar").style.height = Math.max(4, val / max * 100) + "%";
    b.classList.toggle("cur", k === calc.n); b.classList.toggle("below", k < calc.n);
    b.setAttribute("aria-label", `${k} burned: ${fmt(val)} $BURN`); b.title = `${k} burned → ${fmt(val)} $BURN`;
  });
  $("#cMax").textContent = fmt(max);
  $("#cPick").innerHTML = `<span class="w">${calc.n} burned</span> → <span class="y">${fmt(v)} $BURN</span>`;
}
$$("[data-c]").forEach(b => b.onclick = () => {
  if (b.dataset.c === "n") calc.n = Math.max(1, Math.min(30, calc.n + +b.dataset.d));
  else calc.p = Math.max(500, Math.min(20000, calc.p + +b.dataset.d));
  drawCalc(); beep(600 + calc.n * 20, .02);
});
$$("[data-view]").forEach(b => b.onclick = () => { calc.view = b.dataset.view; store.set("calcView", calc.view); drawCalc(); beep(880, .03); });

/* =========================================================
   START
   ========================================================= */
function figs() { const hf = $("#heroFig"), r = fig("BURN"); hf.innerHTML = figHTML(r, i => HEAT[i]); fitFont(hf, r[0].length, 22); }
if (!CONFIG.deadAddress) CONFIG.deadAddress = "BurnAddressComesFromTheServer111111111111";
$("#footAddr").textContent = CONFIG.deadAddress;
$$(".tgLink").forEach(a => a.href = CONFIG.telegram);
figs(); drawCalc();
addEventListener("resize", () => { figs(); if (S.done) paintAlloc(false); else if (S.step === 4 && S.checked) showResult(false); });
(document.fonts ? document.fonts.ready : Promise.resolve()).then(figs).catch(() => {});

(async () => {
  try { const q = new URLSearchParams(location.search).get("xerror"); if (q) { S.xError = q; history.replaceState(null, "", location.pathname + "#burn"); } } catch {}
  let me = null;
  try { const r = await fetch("/api/me", { credentials: "same-origin" }); if (r.ok && (r.headers.get("content-type") || "").includes("json")) me = await r.json(); } catch {}
  if (me) {
    MODE.live = true; MODE.xEnabled = me.xEnabled; MODE.manual = me.manualAllowed;
    if (me.deadAddress) { CONFIG.deadAddress = me.deadAddress; $("#footAddr").textContent = me.deadAddress; }
    if (me.user) {
      if (S.user?.id !== me.user.id) S = Object.assign(blank(), { user: me.user });
      S.user = me.user; S.sample = false; if (S.step === 1) S.step = 2;
      const c = me.claim;
      if (c) {
        for (const k of TASKS) if (c.tasks?.[k]) S.tasks[k] = true;          // tasks saved on the server count
        if (c.tasks?.reply_url) S.replyUrl = c.tasks.reply_url;
        if (tasksDone() && S.step < 3) S.step = 3;
        if (c.confirmed && c.wallet) {
          const burned = (c.tokens_counted || 0) > 0;
          Object.assign(S, { wallet: c.wallet, result: burned ? c.tokens || [] : [], checked: burned, kind: burned ? "burn" : "early", estimate: +c.estimate || 0, done: true, step: N_STEPS });
        } else if (S.done) S.done = false;
      } else if (S.done) S.done = false;
    } else if (S.user && !S.sample) { S = blank(); }
    if (!S.done && S.step > 2 && !tasksDone()) S.step = 2;    // a new task was added: send people back to finish it
    try {
      STATS = await api("/api/stats");
      const parts = [];
      if (STATS.claimers > 0) parts.push(`${fmt(STATS.claimers)} people burned ${fmt(STATS.tokens)} rugs`);
      if (STATS.early > 0) parts.push(`${fmt(STATS.early)} early supporters`);
      if (parts.length) { $("#live").hidden = false; $("#live").textContent = parts.join(" · ") + " so far."; }
    } catch {}
  }
  save(); render(false);
})();
hero.go();
})();
