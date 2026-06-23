import { PART_ORDER, PART_LABELS, TYPE_ORDER, TYPE_META, PARTS, EXTRAS, TYPES } from "./data.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── state ──────────────────────────────────────────────────────────────────
const selectedTypes = new Set(TYPE_ORDER);   // all on by default
const current = {};                          // part -> last rolled value

// ── element refs ─────────────────────────────────────────────────────────────
const $chips   = document.getElementById("typeChips");
const $slots   = document.getElementById("slots");
const $selectAll = document.getElementById("selectAll");
const $spinAll = document.getElementById("spinAll");
const $copyAll = document.getElementById("copyAll");
const $hint    = document.getElementById("hint");
const $toast   = document.getElementById("toast");
const $count   = document.getElementById("animalCount");

// total unique animals (across all body-part lists)
$count.textContent = new Set([].concat(...Object.values(PARTS))).size;

// ── helpers ──────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// pool of candidates for a part given the current type filter
function poolFor(part) {
  if (part === "extra") return EXTRAS;                 // features are never type-filtered
  return PARTS[part].filter((a) => selectedTypes.has(TYPES[a]));
}

function imagesUrl(q) {
  return "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q);
}

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

async function copyText(text, okMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(okMsg);
    return true;
  } catch {
    showToast("Couldn't copy — check permissions");
    return false;
  }
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
  if (selectedTypes.has(t)) selectedTypes.delete(t);
  else selectedTypes.add(t);
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
  if (!all) TYPE_ORDER.forEach((t) => selectedTypes.add(t)); // turn all on
  // if it was all-on, we leave it empty (toggled off)
  document.querySelectorAll(".chip").forEach((c) => {
    const on = selectedTypes.has(c.dataset.type);
    c.classList.toggle("is-on", on);
    c.setAttribute("aria-pressed", String(on));
  });
  syncSelectAll();
  updateAvailability();
});

// reflect whether anything can be generated
function updateAvailability() {
  const none = selectedTypes.size === 0;
  $spinAll.disabled = none;
  $hint.hidden = !none;
  if (none) $hint.textContent = "Pick at least one animal type to start forging.";
}

// ── slots ────────────────────────────────────────────────────────────────────
function buildSlots() {
  $slots.innerHTML = "";
  PART_ORDER.forEach((part, i) => {
    const el = document.createElement("article");
    el.className = "slot is-empty";
    el.dataset.part = part;
    el.style.animationDelay = (i * 35) + "ms";
    el.innerHTML = `
      <div class="slot-top">
        <span class="slot-label">${PART_LABELS[part]}</span>
        <span class="slot-type" hidden><span class="st-emoji"></span><span class="st-label"></span></span>
      </div>
      <button class="slot-value" type="button">tap to roll</button>
      <div class="slot-actions">
        <a class="ico-btn gimg" target="_blank" rel="noopener">🔍 Images</a>
        <button class="ico-btn copy" type="button">📋 Copy</button>
      </div>`;

    const valueBtn = el.querySelector(".slot-value");
    valueBtn.addEventListener("click", () => {
      if (el.classList.contains("is-empty") && !current[part]) return rollSlot(part);
      rollSlot(part);
    });
    el.querySelector(".copy").addEventListener("click", () => {
      if (current[part]) copyText(current[part], `Copied “${current[part]}”`);
    });
    $slots.appendChild(el);
  });
}

function setSlotValue(part, value) {
  const el = $slots.querySelector(`.slot[data-part="${part}"]`);
  const valueBtn = el.querySelector(".slot-value");
  const badge = el.querySelector(".slot-type");
  const gimg = el.querySelector(".gimg");

  if (!value) {
    current[part] = null;
    el.classList.add("is-empty");
    el.classList.remove("landed");
    badge.hidden = true;
    valueBtn.textContent = "no " + PART_LABELS[part].toLowerCase() + " for this filter";
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
  void el.offsetWidth;        // restart pop animation
  el.classList.add("landed");
}

// spin one slot: flicker through pool, then settle on a final pick
function rollSlot(part) {
  const pool = poolFor(part);
  const el = $slots.querySelector(`.slot[data-part="${part}"]`);
  const valueBtn = el.querySelector(".slot-value");

  if (pool.length === 0) { setSlotValue(part, null); return Promise.resolve(); }
  const final = rand(pool);

  if (reduceMotion) { setSlotValue(part, final); return Promise.resolve(); }

  return new Promise((resolve) => {
    el.classList.add("is-rolling");
    el.classList.remove("is-empty", "landed");
    let i = 0;
    const ticks = 14;
    const step = () => {
      valueBtn.textContent = rand(pool);
      valueBtn.style.textTransform = "capitalize";
      i++;
      if (i < ticks) {
        setTimeout(step, 40 + i * i * 1.6); // ease-out: slow down near the end
      } else {
        el.classList.remove("is-rolling");
        setSlotValue(part, final);
        resolve();
      }
    };
    step();
  });
}

// spin everything with a gentle stagger
async function spinAll() {
  if (selectedTypes.size === 0) return;
  $spinAll.classList.add("is-spinning");
  const jobs = PART_ORDER.map((part, i) =>
    new Promise((res) => setTimeout(() => rollSlot(part).then(res), reduceMotion ? 0 : i * 80))
  );
  await Promise.all(jobs);
  $spinAll.classList.remove("is-spinning");
}

$spinAll.addEventListener("click", spinAll);

$copyAll.addEventListener("click", () => {
  const lines = PART_ORDER
    .filter((p) => current[p])
    .map((p) => `${PART_LABELS[p]}: ${current[p]}`);
  if (!lines.length) return showToast("Spin something first!");
  copyText(lines.join("\n"), "Recipe copied to clipboard");
});

// ── init ───────────────────────────────────────────────────────────────────
buildChips();
buildSlots();
syncSelectAll();
updateAvailability();
spinAll();   // forge a first creature on load
