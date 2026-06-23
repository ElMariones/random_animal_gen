import { PART_ORDER, PART_LABELS, TYPE_ORDER, TYPE_META, PARTS, EXTRAS, TYPES, DEFAULT_TYPES } from "./data.js";
import { playRoll } from "./fx.js";
import { T, onLang } from "./i18n.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── state ──────────────────────────────────────────────────────────────────
const selectedTypes = new Set(DEFAULT_TYPES);   // everything except Pokémon on by default
const current = {};                          // part -> revealed value (or null when hidden)
const rollToken = {};                        // part -> id; bumping it cancels an in-flight roll

// ── element refs ─────────────────────────────────────────────────────────────
const $chips     = document.getElementById("typeChips");
const $slots     = document.getElementById("slots");
const $selectAll = document.getElementById("selectAll");
const $clear     = document.getElementById("clearBtn");
const $hint      = document.getElementById("hint");
const $toast     = document.getElementById("toast");
const $count     = document.getElementById("animalCount");

$count.textContent = new Set([].concat(...Object.values(PARTS))).size;

// ── helpers ──────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const EXTRAS_REAL = EXTRAS.filter((e) => e !== "none");   // every feature except "none"

function poolFor(part) {
  if (part === "extra") return EXTRAS;                 // features are never type-filtered
  return PARTS[part].filter((a) => selectedTypes.has(TYPES[a]));
}

// "extra" is weighted: ~20% "none", ~80% a feature from the list
function pickFinal(part, pool) {
  if (part === "extra") return Math.random() < 0.2 ? "none" : rand(EXTRAS_REAL);
  return rand(pool);
}

const imagesUrl = (q) => "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q);

function typeBadge(part, value) {
  if (part === "extra") return { emoji: "✨", label: "Feature" };
  const t = TYPES[value];
  return t ? TYPE_META[t] : { emoji: "", label: "" };
}

function showToast(msg) {
  $toast.textContent = msg;
  $toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => $toast.classList.remove("show"), 1600);
}

// Copy text, falling back to the legacy path when the async API is unavailable.
async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.top = "-9999px";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

// Copy a revealed name to the clipboard with a quick visual "Copied" flash.
async function copyName(part) {
  const value = current[part];
  if (!value) return;
  if (!(await copyToClipboard(value))) { showToast(T().toastCopyFail); return; }
  const el = $slots.querySelector(`.slot[data-part="${part}"]`);
  el.classList.remove("copied");
  void el.offsetWidth;            // restart the pop animation on repeat copies
  el.classList.add("copied");
  clearTimeout(copyName._t);
  copyName._t = setTimeout(() => el.classList.remove("copied"), 1300);
  showToast(T().copied(value));
}

// ── type chips ───────────────────────────────────────────────────────────────
function buildChips() {
  $chips.innerHTML = "";
  const everyAnimal = [].concat(...Object.values(PARTS));
  for (const t of TYPE_ORDER) {
    const meta = TYPE_META[t];
    const count = new Set(everyAnimal.filter((a) => TYPES[a] === t)).size;
    const on = selectedTypes.has(t);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (on ? " is-on" : "");
    btn.dataset.type = t;
    btn.setAttribute("aria-pressed", String(on));
    btn.innerHTML = `<span class="c-emoji">${meta.svg || meta.emoji}</span>${T().types[t] || meta.label}<span class="c-count">${count}</span>`;
    btn.addEventListener("click", () => toggleType(t, btn));
    $chips.appendChild(btn);
  }
}

function toggleType(t, btn) {
  if (selectedTypes.has(t)) selectedTypes.delete(t); else selectedTypes.add(t);
  const on = selectedTypes.has(t);
  btn.classList.toggle("is-on", on);
  btn.setAttribute("aria-pressed", String(on));
  syncSelectAll();
  updateAvailability();
}

function syncSelectAll() {
  const all = selectedTypes.size === TYPE_ORDER.length;
  $selectAll.classList.toggle("is-on", all);
  $selectAll.setAttribute("aria-pressed", String(all));
}

$selectAll.addEventListener("click", () => {
  const all = selectedTypes.size === TYPE_ORDER.length;
  selectedTypes.clear();
  if (!all) TYPE_ORDER.forEach((t) => selectedTypes.add(t));   // off -> turn all on
  document.querySelectorAll(".chip").forEach((c) => {
    const on = selectedTypes.has(c.dataset.type);
    c.classList.toggle("is-on", on);
    c.setAttribute("aria-pressed", String(on));
  });
  syncSelectAll();
  updateAvailability();
});

function updateAvailability() {
  const none = selectedTypes.size === 0;
  $hint.hidden = !none;
  if (none) $hint.textContent = T().hintPickType;
}

// ── list rows ────────────────────────────────────────────────────────────────
function buildSlots() {
  $slots.innerHTML = "";
  PART_ORDER.forEach((part, i) => {
    const el = document.createElement("article");
    el.className = "slot is-hidden";
    el.dataset.part = part;
    el.style.animationDelay = (i * 30) + "ms";
    el.innerHTML = `
      <span class="slot-label">${T().parts[part]}</span>
      <button class="slot-value" type="button"><span class="ghost">${T().tapToRoll}</span></button>
      <span class="copied-flag" aria-hidden="true">✓</span>
      <div class="slot-right">
        <span class="slot-type" hidden><span class="st-emoji"></span><span class="st-label"></span></span>
        <div class="slot-actions">
          <a class="ico-btn gimg" target="_blank" rel="noopener" title="${T().imagesTitle}" aria-label="${T().imagesTitle}">🔍</a>
          <button class="ico-btn reroll" type="button" title="${T().rerollTitle}" aria-label="${T().rerollTitle}">🎲</button>
        </div>
      </div>
      <span class="roll-dice" aria-hidden="true">🎲</span>`;

    const valueBtn = el.querySelector(".slot-value");
    const isBusy = () => el.classList.contains("is-rolling");

    // Tap the name → roll it the first time, copy it once revealed.
    valueBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isBusy()) return;
      if (el.classList.contains("is-hidden")) rollSlot(part);
      else copyName(part);
    });
    // The 🎲 button is the dedicated reroll; Images opts out of any row click.
    el.querySelector(".reroll").addEventListener("click", (e) => { e.stopPropagation(); if (!isBusy()) rollSlot(part); });
    el.querySelector(".gimg").addEventListener("click", (e) => e.stopPropagation());
    // While still "Tap to roll", the whole row is one big roll target.
    el.addEventListener("click", () => { if (el.classList.contains("is-hidden") && !isBusy()) rollSlot(part); });
    $slots.appendChild(el);
  });
}

function hideSlot(part) {
  rollToken[part] = (rollToken[part] || 0) + 1;   // cancel any in-flight roll
  const el = $slots.querySelector(`.slot[data-part="${part}"]`);
  current[part] = null;
  el.classList.add("is-hidden");
  el.classList.remove("landed", "is-rolling", "is-empty", "copied");
  el.querySelector(".slot-type").hidden = true;
  el.querySelector(".slot-value").innerHTML = `<span class="ghost">${T().tapToRoll}</span>`;
}

function setSlotValue(part, value) {
  const el = $slots.querySelector(`.slot[data-part="${part}"]`);
  const valueBtn = el.querySelector(".slot-value");
  const badge = el.querySelector(".slot-type");
  const gimg = el.querySelector(".gimg");

  el.classList.remove("is-hidden");

  if (!value) {                                  // safety net (shouldn't happen with merged types)
    current[part] = null;
    el.classList.add("is-empty");
    badge.hidden = true;
    valueBtn.textContent = T().noMatch;
    return;
  }

  current[part] = value;
  el.classList.remove("is-empty");
  valueBtn.textContent = value;

  const meta = typeBadge(part, value);
  const label = part === "extra" ? T().featureLabel : (T().types[TYPES[value]] || meta.label);
  badge.hidden = false;
  badge.title = label;            // emoji-only chip; full category shows on hover
  const stEmoji = badge.querySelector(".st-emoji");
  if (meta.svg) stEmoji.innerHTML = meta.svg; else stEmoji.textContent = meta.emoji;
  badge.querySelector(".st-label").textContent = label;
  gimg.href = imagesUrl(value);

  el.classList.remove("landed");
  void el.offsetWidth;
  el.classList.add("landed");
}

// reveal/re-roll a single row: flicker through the pool, then settle
function rollSlot(part) {
  if (selectedTypes.size === 0) { showToast(T().toastPickType); return Promise.resolve(); }
  const pool = poolFor(part);
  const el = $slots.querySelector(`.slot[data-part="${part}"]`);
  const valueBtn = el.querySelector(".slot-value");

  const myToken = (rollToken[part] = (rollToken[part] || 0) + 1);
  if (pool.length === 0) { setSlotValue(part, null); return Promise.resolve(); }
  const final = pickFinal(part, pool);

  if (reduceMotion) { setSlotValue(part, final); return Promise.resolve(); }

  return new Promise((resolve) => {
    el.classList.add("is-rolling");
    el.classList.remove("is-hidden", "is-empty", "landed");
    el.querySelector(".slot-type").hidden = true;
    let i = 0;
    const ticks = 14;
    const step = () => {
      if (rollToken[part] !== myToken) return resolve();   // cancelled by clear / newer roll
      valueBtn.textContent = rand(pool);
      i++;
      if (i < ticks) setTimeout(step, 40 + i * i * 1.6);  // ease-out slow-down
      else {
        el.classList.remove("is-rolling");
        setSlotValue(part, final);
        playRoll(part === "extra" ? "feature" : TYPES[final], el);   // category-themed burst
        resolve();
      }
    };
    step();
  });
}

// ── controls ──────────────────────────────────────────────────────────────────
let pendingTimers = [];
function cancelPending() { pendingTimers.forEach(clearTimeout); pendingTimers = []; }

function clearAll() {
  cancelPending();                       // stop not-yet-started staggered rolls
  PART_ORDER.forEach(hideSlot);          // bumps tokens -> cancels in-flight rolls
}

$clear.addEventListener("click", clearAll);

// ── language: re-localize in place without resetting any rolled values ───────
function applyDynamicLang() {
  const d = T();
  buildChips();                          // localized labels; is-on state kept via selectedTypes
  $slots.querySelectorAll(".slot").forEach((el) => {
    const part = el.dataset.part;
    el.querySelector(".slot-label").textContent = d.parts[part];
    const reroll = el.querySelector(".reroll"); reroll.title = d.rerollTitle; reroll.setAttribute("aria-label", d.rerollTitle);
    const gimg = el.querySelector(".gimg"); gimg.title = d.imagesTitle; gimg.setAttribute("aria-label", d.imagesTitle);
    if (el.classList.contains("is-hidden")) {
      const ghost = el.querySelector(".ghost"); if (ghost) ghost.textContent = d.tapToRoll;
    } else if (el.classList.contains("is-empty")) {
      el.querySelector(".slot-value").textContent = d.noMatch;
    } else {
      const val = current[part];
      if (val) {
        const label = part === "extra" ? d.featureLabel : (d.types[TYPES[val]] || "");
        const badge = el.querySelector(".slot-type");
        badge.title = label;
        badge.querySelector(".st-label").textContent = label;
      }
    }
  });
  if (!$hint.hidden) $hint.textContent = d.hintPickType;
}
onLang(applyDynamicLang);

// ── init (nothing is revealed until the user acts) ───────────────────────────
buildChips();
buildSlots();
syncSelectAll();
updateAvailability();
