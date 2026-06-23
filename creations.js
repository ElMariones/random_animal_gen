import { supabase, uploadToCloudinary, isConfigured, voterId } from "./db.js";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const $gallery   = document.getElementById("gallery");
const $status    = document.getElementById("status");
const $toast     = document.getElementById("toast");
const $dialog    = document.getElementById("submitDialog");
const $form      = document.getElementById("submitForm");
const $openBtn   = document.getElementById("openSubmit");
const $closeBtn  = document.getElementById("closeSubmit");
const $cancelBtn = document.getElementById("cancelSubmit");
const $imageIn   = document.getElementById("imageInput");
const $preview   = document.getElementById("preview");
const $previewImg= document.getElementById("previewImg");
const $formMsg   = document.getElementById("formMsg");
const $sendBtn   = document.getElementById("sendSubmit");
const $sendLabel = $sendBtn.querySelector(".send-label");
const $sendProg  = $sendBtn.querySelector(".send-progress");

// ── helpers ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  $toast.textContent = msg;
  $toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => $toast.classList.remove("show"), 2200);
}
function setStatus(msg) { $status.textContent = msg; $status.hidden = !msg; }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Only allow http(s) links, and render them safely.
function safeUrl(raw) {
  try { const u = new URL(raw); return (u.protocol === "http:" || u.protocol === "https:") ? u.href : null; }
  catch { return null; }
}
function socialLabel(raw) {
  try { return new URL(raw).hostname.replace(/^www\./, ""); } catch { return "link"; }
}

// ── gallery ──────────────────────────────────────────────────────────────────
async function loadGallery() {
  if (!isConfigured()) {
    setStatus("🛠️ The gallery isn't connected yet. Add your Cloudinary + Supabase keys in config.js (see SETUP.md) to switch it on.");
    $openBtn.disabled = true;
    return;
  }
  setStatus("Loading creations…");
  // Most-liked first, newest as the tie-breaker.
  const { data, error } = await supabase
    .from("creations")
    .select("id, artist, social_url, image_url, title, likes, created_at")
    .eq("status", "approved")
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) { setStatus("Couldn't load the gallery right now. Try again later."); return; }
  if (!data || data.length === 0) {
    setStatus("No creations yet — be the first to add one! 🎨");
    return;
  }
  setStatus("");
  await loadMyLikes(data.map((c) => c.id));
  $gallery.innerHTML = data.map(renderCard).join("");
}

// which of these creations the current browser has already liked
const myLikes = new Set();
async function loadMyLikes(ids) {
  myLikes.clear();
  if (!ids.length) return;
  const { data } = await supabase
    .from("likes")
    .select("creation_id")
    .eq("voter_id", voterId())
    .in("creation_id", ids);
  (data || []).forEach((r) => myLikes.add(r.creation_id));
}

function renderCard(c) {
  const link = safeUrl(c.social_url);
  const title = c.title ? `<p class="card-title">${esc(c.title)}</p>` : "";
  const artist = link
    ? `<a class="card-artist" href="${esc(link)}" target="_blank" rel="noopener nofollow">
         <span class="card-name">${esc(c.artist)}</span>
         <span class="card-social">${esc(socialLabel(link))} ↗</span>
       </a>`
    : `<span class="card-artist"><span class="card-name">${esc(c.artist)}</span></span>`;
  const liked = myLikes.has(c.id);
  return `
    <figure class="card">
      <div class="card-img"><img loading="lazy" src="${esc(c.image_url)}" alt="${esc(c.title || ("Creation by " + c.artist))}" /></div>
      <figcaption class="card-cap">
        <div class="card-text">${title}${artist}</div>
        <button class="like-btn${liked ? " is-liked" : ""}" type="button"
                data-id="${esc(c.id)}" aria-pressed="${liked}" title="Like this creation">
          <span class="like-heart">${liked ? "❤️" : "🤍"}</span>
          <span class="like-count">${Number(c.likes) || 0}</span>
        </button>
      </figcaption>
    </figure>`;
}

// ── likes (one per browser) ──────────────────────────────────────────────────
let likeBusy = false;
$gallery.addEventListener("click", async (e) => {
  const btn = e.target.closest(".like-btn");
  if (!btn || likeBusy) return;
  likeBusy = true;
  btn.disabled = true;

  const id = btn.dataset.id;
  const liked = myLikes.has(id);
  const $count = btn.querySelector(".like-count");
  const $heart = btn.querySelector(".like-heart");
  const n = Number($count.textContent) || 0;

  try {
    if (liked) {
      const { error } = await supabase.from("likes")
        .delete().eq("creation_id", id).eq("voter_id", voterId());
      if (error) throw error;
      myLikes.delete(id);
      $count.textContent = Math.max(0, n - 1);
      $heart.textContent = "🤍";
      btn.classList.remove("is-liked");
      btn.setAttribute("aria-pressed", "false");
    } else {
      // unique(creation_id, voter_id) in the DB guarantees one like per browser
      const { error } = await supabase.from("likes")
        .insert({ creation_id: id, voter_id: voterId() });
      if (error && error.code !== "23505") throw error; // ignore duplicate
      myLikes.add(id);
      $count.textContent = n + 1;
      $heart.textContent = "❤️";
      btn.classList.add("is-liked");
      btn.setAttribute("aria-pressed", "true");
    }
  } catch {
    showToast("Couldn't register that like — try again.");
  } finally {
    btn.disabled = false;
    likeBusy = false;
  }
});

// ── submission dialog ────────────────────────────────────────────────────────
function openDialog() {
  if (!isConfigured()) { showToast("Gallery isn't connected yet — see SETUP.md"); return; }
  $formMsg.hidden = true;
  $dialog.showModal();
}
function closeDialog() { $dialog.close(); }

$openBtn.addEventListener("click", openDialog);
$closeBtn.addEventListener("click", closeDialog);
$cancelBtn.addEventListener("click", closeDialog);

$imageIn.addEventListener("change", () => {
  const file = $imageIn.files?.[0];
  if (!file) { $preview.hidden = true; return; }
  $previewImg.src = URL.createObjectURL(file);
  $preview.hidden = false;
});

function setFormError(msg) {
  $formMsg.textContent = msg;
  $formMsg.className = "form-msg is-error";
  $formMsg.hidden = false;
}
function setSending(sending, pct) {
  $sendBtn.disabled = sending;
  $imageIn.disabled = sending;
  if (sending) {
    $sendLabel.hidden = true;
    $sendProg.hidden = false;
    $sendProg.textContent = pct != null ? `Uploading… ${Math.round(pct * 100)}%` : "Saving…";
  } else {
    $sendLabel.hidden = false;
    $sendProg.hidden = true;
  }
}

$form.addEventListener("submit", async (e) => {
  e.preventDefault();
  $formMsg.hidden = true;

  const file = $imageIn.files?.[0];
  const artist = document.getElementById("artistInput").value.trim();
  const title = document.getElementById("titleInput").value.trim();
  const social = document.getElementById("socialInput").value.trim();

  if (!file) return setFormError("Please choose an image.");
  if (!file.type.startsWith("image/")) return setFormError("That file isn't an image.");
  if (file.size > MAX_BYTES) return setFormError("Image is over 10 MB — please shrink it a bit.");
  if (!artist) return setFormError("Please add your name or handle.");
  if (!safeUrl(social)) return setFormError("Please enter a valid http(s) social link.");

  try {
    setSending(true, 0);
    const imageUrl = await uploadToCloudinary(file, { onProgress: (p) => setSending(true, p) });

    setSending(true, null); // saving row
    const { error } = await supabase.from("creations").insert({
      artist, title: title || null, social_url: social, image_url: imageUrl, status: "pending",
    });
    if (error) throw error;

    setSending(false);
    closeDialog();
    $form.reset();
    $preview.hidden = true;
    showToast("Thanks! Your creation is in the queue for review. 🎉");
  } catch (err) {
    setSending(false);
    setFormError(err?.message || "Something went wrong — please try again.");
  }
});

// close on backdrop click
$dialog.addEventListener("click", (e) => {
  const r = $dialog.querySelector(".submit-form").getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  if (!inside) closeDialog();
});

loadGallery();
