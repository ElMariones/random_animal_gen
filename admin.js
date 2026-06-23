import { supabase, isConfigured } from "./db.js";

const $login      = document.getElementById("loginView");
const $admin      = document.getElementById("adminView");
const $loginForm  = document.getElementById("loginForm");
const $loginMsg   = document.getElementById("loginMsg");
const $email      = document.getElementById("email");
const $password   = document.getElementById("password");
const $logout     = document.getElementById("logout");
const $list       = document.getElementById("adminList");
const $status     = document.getElementById("adminStatus");
const $toast      = document.getElementById("toast");
const $notConfig  = document.getElementById("notConfigured");
const $tabs       = [...document.querySelectorAll(".admin-tab")];

let tab = "pending";

function showToast(msg) {
  $toast.textContent = msg;
  $toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => $toast.classList.remove("show"), 2000);
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function safeUrl(raw) {
  try { const u = new URL(raw); return (u.protocol === "http:" || u.protocol === "https:") ? u.href : null; }
  catch { return null; }
}
const fmtDate = (s) => { try { return new Date(s).toLocaleString(); } catch { return ""; } };

// ── auth gate ────────────────────────────────────────────────────────────────
async function init() {
  if (!isConfigured()) {
    $notConfig.hidden = false;
    $notConfig.textContent = "🛠️ Not connected yet. Add your Supabase keys in config.js (see SETUP.md), then create your admin user in the Supabase dashboard.";
    return;
  }
  const { data } = await supabase.auth.getSession();
  renderAuth(!!data.session);
  supabase.auth.onAuthStateChange((_e, session) => renderAuth(!!session));
}

function renderAuth(loggedIn) {
  $login.hidden = loggedIn;
  $admin.hidden = !loggedIn;
  if (loggedIn) load();
}

$loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  $loginMsg.hidden = true;
  const { error } = await supabase.auth.signInWithPassword({
    email: $email.value.trim(), password: $password.value,
  });
  if (error) { $loginMsg.textContent = error.message; $loginMsg.className = "form-msg is-error"; $loginMsg.hidden = false; }
});

$logout.addEventListener("click", async () => { await supabase.auth.signOut(); });

$tabs.forEach((t) => t.addEventListener("click", () => {
  tab = t.dataset.tab;
  $tabs.forEach((x) => x.classList.toggle("is-on", x === t));
  load();
}));

// ── list + moderate ──────────────────────────────────────────────────────────
async function load() {
  $status.hidden = false; $status.textContent = "Loading…"; $list.innerHTML = "";
  const { data, error } = await supabase
    .from("creations")
    .select("id, artist, social_url, image_url, title, status, likes, created_at")
    .eq("status", tab)
    .order("created_at", { ascending: false });

  if (error) { $status.textContent = "Couldn't load: " + error.message; return; }
  if (!data || !data.length) { $status.textContent = tab === "pending" ? "Nothing waiting for review. 🎉" : "No approved creations yet."; return; }
  $status.hidden = true;
  $list.innerHTML = data.map(renderRow).join("");
}

function renderRow(c) {
  const link = safeUrl(c.social_url);
  const social = link
    ? `<a href="${esc(link)}" target="_blank" rel="noopener nofollow">${esc(link)}</a>`
    : `<span class="when">⚠️ invalid link: ${esc(c.social_url)}</span>`;
  const actions = c.status === "pending"
    ? `<button class="btn btn-approve" data-act="approve" data-id="${esc(c.id)}">✓ Approve</button>
       <button class="btn btn-reject"  data-act="reject"  data-id="${esc(c.id)}">✕ Reject</button>`
    : `<span class="badge approved">approved · ${Number(c.likes) || 0} ♥</span>
       <button class="btn btn-reject" data-act="unapprove" data-id="${esc(c.id)}">Unpublish</button>
       <button class="btn btn-reject" data-act="reject" data-id="${esc(c.id)}">Delete</button>`;
  return `
    <div class="admin-row" data-id="${esc(c.id)}">
      <img src="${esc(c.image_url)}" alt="" />
      <div class="admin-meta">
        <h3>${c.title ? esc(c.title) : "<em>Untitled</em>"} <span class="badge ${esc(c.status)}">${esc(c.status)}</span></h3>
        <div class="who">${esc(c.artist)}</div>
        <div>${social}</div>
        <div class="when">submitted ${esc(fmtDate(c.created_at))}</div>
      </div>
      <div class="admin-actions">${actions}</div>
    </div>`;
}

$list.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const { act, id } = btn.dataset;
  btn.disabled = true;

  let res;
  if (act === "approve")   res = await supabase.from("creations").update({ status: "approved" }).eq("id", id);
  if (act === "unapprove") res = await supabase.from("creations").update({ status: "pending" }).eq("id", id);
  if (act === "reject") {
    if (!confirm("Delete this submission permanently?")) { btn.disabled = false; return; }
    res = await supabase.from("creations").delete().eq("id", id);
  }

  if (res?.error) { showToast("Failed: " + res.error.message); btn.disabled = false; return; }
  showToast(act === "approve" ? "Approved ✓" : act === "reject" ? "Deleted" : "Moved back to pending");
  document.querySelector(`.admin-row[data-id="${CSS.escape(id)}"]`)?.remove();
  if (!$list.children.length) load();
});

init();
