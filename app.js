import { PART_ORDER, PART_LABELS, TYPE_ORDER, TYPE_META, PARTS, EXTRAS, TYPES } from "./data.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── state ──────────────────────────────────────────────────────────────────
const selectedTypes = new Set(TYPE_ORDER);   // all on by default
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

// ── type chips ───────────────────────────────────────────────────────────────
function buildChips() {
  $chips.innerHTML = "";
  const everyAnimal = [].concat(...Object.values(PARTS));
  for (const t of TYPE_ORDER) {
    const meta = TYPE_META[t];
    const count = new Set(everyAnimal.filter((a) => TYPES[a] === t)).size;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip is-on";
    btn.dataset.type = t;
    btn.setAttribute("aria-pressed", "true");
    btn.innerHTML = `<span class="c-emoji">${meta.emoji}</span>${meta.label}<span class="c-count">${count}</span>`;
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
  if (none) $hint.textContent = "Pick at least one animal type to start rolling.";
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
      <div class="slot-top">
        <span class="slot-label">${PART_LABELS[part]}</span>
        <span class="slot-type" hidden><span class="st-emoji"></span><span class="st-label"></span></span>
        <div class="slot-actions">
          <a class="ico-btn gimg" target="_blank" rel="noopener" title="Search Google Images" aria-label="Search Google Images">🔍 Images</a>
        </div>
      </div>
      <div class="slot-value-row">
        <button class="slot-value" type="button"><span class="ghost">Tap to roll</span></button>
        <span class="reroll-hint">tap again to reroll</span>
      </div>
      <span class="roll-dice" aria-hidden="true">🎲</span>`;

    // the whole row is the roll target; the Images link opts out via stopPropagation
    el.addEventListener("click", () => rollSlot(part));
    el.querySelector(".gimg").addEventListener("click", (e) => e.stopPropagation());
    $slots.appendChild(el);
  });
}

function hideSlot(part) {
  rollToken[part] = (rollToken[part] || 0) + 1;   // cancel any in-flight roll
  const el = $slots.querySelector(`.slot[data-part="${part}"]`);
  current[part] = null;
  el.classList.add("is-hidden");
  el.classList.remove("landed", "is-rolling", "is-empty");
  el.querySelector(".slot-type").hidden = true;
  el.querySelector(".slot-value").innerHTML = `<span class="ghost">Tap to roll</span>`;
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
    valueBtn.textContent = "no match for this filter";
    return;
  }

  current[part] = value;
  el.classList.remove("is-empty");
  valueBtn.textContent = value;

  const meta = typeBadge(part, value);
  badge.hidden = false;
  badge.querySelector(".st-emoji").textContent = meta.emoji;
  badge.querySelector(".st-label").textContent = meta.label;
  gimg.href = imagesUrl(value);

  el.classList.remove("landed");
  void el.offsetWidth;
  el.classList.add("landed");
}

// reveal/re-roll a single row: flicker through the pool, then settle
function rollSlot(part) {
  if (selectedTypes.size === 0) { showToast("Pick at least one animal type first"); return Promise.resolve(); }
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
      else { el.classList.remove("is-rolling"); setSlotValue(part, final); resolve(); }
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

// ── init (nothing is revealed until the user acts) ───────────────────────────
buildChips();
buildSlots();
syncSelectAll();
updateAvailability();
