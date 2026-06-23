// Buildless i18n for the generator + creations pages.
// English is the default; Spanish is picked up from the browser/OS language and
// the choice is remembered in localStorage. A small switcher (top-right) changes it.
//
// Static strings are tagged in the HTML with data-i18n / -html / -title / -ph.
// Dynamic, JS-built strings (chips, slots, toasts…) read T() directly and
// re-localize through onLang().

const STR = {
  en: {
    docTitleGen: "Random Animal Generator",
    docTitleCre: "Creations · Random Animal Generator",
    heroTitle: "Random Animal Generator",
    bylineHtml: 'inspired by <a href="https://github.com/gracewqma/TuimizRandonAnimalGenerator" target="_blank" rel="noopener">Tuimiz</a> · web by <a href="https://instagram.com/mariolandaburu" target="_blank" rel="noopener">Mario&nbsp;Landáburu</a>',
    subA: "Tap any row to roll it. Built from ",
    subB: "+ animals and beings.",
    includeTypes: "Include animal types",
    selectAll: "Select all",
    clear: "Clear",
    viewCreations: "View creations",
    tapToRoll: "Tap to roll",
    rerollTitle: "Reroll this part",
    imagesTitle: "Search Google Images",
    noMatch: "no match for this filter",
    hintPickType: "Pick at least one animal type to start rolling.",
    toastPickType: "Pick at least one animal type first",
    toastCopyFail: "Couldn't copy — check permissions",
    footerHtml: 'Tap a row to roll · tap the name to copy · <span class="kbd">🎲</span> rerolls · <span class="kbd">🔍</span> Google Images',
    parts: { base: "Base", head: "Head", ears: "Ears", eyes: "Eyes", nose: "Nose", legs: "Legs", feet: "Feet", tail: "Tail", coat: "Coat", colour: "Colour", extra: "Extra" },
    types: { mammal: "Mammals", bird: "Birds", aquatic: "Sea & Fish", bugs: "Bugs & Insects", reptamph: "Reptiles & Dinos", pokemon: "Pokémon" },
    featureLabel: "Feature",
    copied: (v) => `Copied “${v}”`,

    // creations page
    creTitle: "Creations",
    creBylineHtml: 'an exhibition by the <a href="/">Random Animal Generator</a> community',
    creSubtitle: "Real artists, fantastical creatures. Roll the dice, draw, and add it to the wall!",
    backToGen: "Back to generator",
    submitCreation: "Submit your creation",
    creFooter: "Images hosted on Cloudinary · submissions are reviewed before they appear",
    dlgSub: "It'll show up in the gallery once it's approved. Be kind, only your own art please.",
    fArtwork: "Your artwork",
    fArtworkHint: "PNG, JPG, WEBP or GIF · up to 10 MB",
    fArtist: "Artist name / handle",
    fArtistPh: "e.g. @critter.queen",
    fTitle: "Title",
    optional: "(optional)",
    fTitlePh: "e.g. Narwhal-legged tiger",
    fSocial: "Social link",
    fSocialPh: "instagram.com/yourname",
    fSocialHint: 'Instagram, X, Bluesky, your portfolio. No need to type <code>https://</code>. Leave it blank to stay anonymous.',
    cancel: "Cancel",
    submitReview: "Submit for review",
    galLoading: "Loading creations…",
    galNotConfigured: "🛠️ The gallery isn't connected yet. Add your Cloudinary and Supabase keys in config.js (see SETUP.md) to switch it on.",
    galLoadError: "Couldn't load the gallery right now. Try again later.",
    galEmpty: "No creations yet, be the first to add one! 🎨",
    notConnectedToast: "Gallery isn't connected yet, see SETUP.md",
    likeError: "Couldn't register that like, try again.",
    likeTitle: "Like this creation",
    errNoImage: "Please choose an image.",
    errNotImage: "That file isn't an image.",
    errTooBig: "Image is over 10 MB, please shrink it a bit.",
    errNoArtist: "Please add your name or handle.",
    errBadSocial: "That social link doesn't look right, fix it or leave it blank.",
    submitOk: "Thanks! Your creation is in the queue for review. 🎉",
    submitErr: "Something went wrong, please try again.",
    uploading: (p) => `Uploading… ${p}%`,
    saving: "Saving…",
  },

  es: {
    docTitleGen: "Generador de Animales Aleatorios",
    docTitleCre: "Creaciones · Generador de Animales Aleatorios",
    heroTitle: "Generador de Animales Aleatorios",
    bylineHtml: 'inspirado en <a href="https://github.com/gracewqma/TuimizRandonAnimalGenerator" target="_blank" rel="noopener">Tuimiz</a> · web de <a href="https://instagram.com/mariolandaburu" target="_blank" rel="noopener">Mario&nbsp;Landáburu</a>',
    subA: "Toca cualquier fila para tirar. Hecho con ",
    subB: "+ animales y seres.",
    includeTypes: "Tipos de animales",
    selectAll: "Seleccionar todo",
    clear: "Limpiar",
    viewCreations: "Ver creaciones",
    tapToRoll: "Toca para tirar",
    rerollTitle: "Vuelve a tirar",
    imagesTitle: "Buscar en Google Imágenes",
    noMatch: "sin resultados para este filtro",
    hintPickType: "Elige al menos un tipo de animal para empezar.",
    toastPickType: "Elige al menos un tipo de animal primero",
    toastCopyFail: "No se pudo copiar, revisa los permisos",
    footerHtml: 'Toca una fila para tirar · toca el nombre para copiar · <span class="kbd">🎲</span> vuelve a tirar · <span class="kbd">🔍</span> Google Imágenes',
    parts: { base: "Base", head: "Cabeza", ears: "Orejas", eyes: "Ojos", nose: "Nariz", legs: "Patas", feet: "Pies", tail: "Cola", coat: "Pelaje", colour: "Color", extra: "Extra" },
    types: { mammal: "Mamíferos", bird: "Aves", aquatic: "Mar y peces", bugs: "Bichos e insectos", reptamph: "Reptiles y dinos", pokemon: "Pokémon" },
    featureLabel: "Rasgo",
    copied: (v) => `Copiado «${v}»`,

    // creations page
    creTitle: "Creaciones",
    creBylineHtml: 'una exposición de la comunidad del <a href="/">Generador de Animales Aleatorios</a>',
    creSubtitle: "Artistas de verdad, criaturas fantásticas. Tira los dados, dibuja y súmala al muro.",
    backToGen: "Volver al generador",
    submitCreation: "Sube tu creación",
    creFooter: "Imágenes alojadas en Cloudinary · las propuestas se revisan antes de publicarse",
    dlgSub: "Aparecerá en la galería una vez aprobada. Sé majo: solo tu propio arte, por favor.",
    fArtwork: "Tu obra",
    fArtworkHint: "PNG, JPG, WEBP o GIF · hasta 10 MB",
    fArtist: "Nombre o usuario",
    fArtistPh: "p. ej. @reina.bichos",
    fTitle: "Título",
    optional: "(opcional)",
    fTitlePh: "p. ej. Tigre con patas de narval",
    fSocial: "Enlace social",
    fSocialPh: "instagram.com/tuusuario",
    fSocialHint: 'Instagram, X, Bluesky, tu portfolio. No hace falta escribir <code>https://</code>. Déjalo en blanco para quedar anónimo.',
    cancel: "Cancelar",
    submitReview: "Enviar a revisión",
    galLoading: "Cargando creaciones…",
    galNotConfigured: "🛠️ La galería aún no está conectada. Añade tus claves de Cloudinary y Supabase en config.js (mira SETUP.md) para activarla.",
    galLoadError: "No se pudo cargar la galería ahora mismo. Inténtalo más tarde.",
    galEmpty: "Aún no hay creaciones, ¡sé el primero en añadir una! 🎨",
    notConnectedToast: "La galería aún no está conectada, mira SETUP.md",
    likeError: "No se pudo registrar el me gusta, inténtalo de nuevo.",
    likeTitle: "Dar me gusta",
    errNoImage: "Elige una imagen.",
    errNotImage: "Ese archivo no es una imagen.",
    errTooBig: "La imagen supera los 10 MB, redúcela un poco.",
    errNoArtist: "Añade tu nombre o usuario.",
    errBadSocial: "Ese enlace social no parece válido, corrígelo o déjalo en blanco.",
    submitOk: "¡Gracias! Tu creación está en la cola de revisión. 🎉",
    submitErr: "Algo salió mal, inténtalo de nuevo.",
    uploading: (p) => `Subiendo… ${p}%`,
    saving: "Guardando…",
  },
};

const LANGS = [{ code: "en", name: "English" }, { code: "es", name: "Español" }];

function detect() {
  try { const saved = localStorage.getItem("rag_lang"); if (saved && STR[saved]) return saved; } catch {}
  const navs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || "en"];
  return navs.some((l) => String(l).toLowerCase().startsWith("es")) ? "es" : "en";
}

let current = detect();
const listeners = [];

export function getLang() { return current; }
export function T() { return STR[current]; }
export function onLang(fn) { listeners.push(fn); }

export function setLang(l) {
  closeMenu();
  if (!STR[l] || l === current) return;
  current = l;
  try { localStorage.setItem("rag_lang", l); } catch {}
  applyStatic();
  listeners.forEach((fn) => { try { fn(current); } catch {} });
}

function applyStatic() {
  const d = STR[current];
  document.documentElement.lang = current;
  document.querySelectorAll("[data-i18n]").forEach((el) => { const v = d[el.dataset.i18n]; if (typeof v === "string") el.textContent = v; });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { const v = d[el.dataset.i18nHtml]; if (typeof v === "string") el.innerHTML = v; });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { const v = d[el.dataset.i18nTitle]; if (typeof v === "string") el.title = v; });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { const v = d[el.dataset.i18nPh]; if (typeof v === "string") el.placeholder = v; });
  updateSwitch();
}

// ── language switcher ────────────────────────────────────────────────────────
let menuEl = null, btnEl = null;

function buildSwitch() {
  const host = document.getElementById("langSwitch");
  if (!host) return;
  host.innerHTML =
    '<button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Change language">' +
      '<span class="lang-globe" aria-hidden="true">🌐</span><span class="lang-code"></span><span class="lang-caret" aria-hidden="true">▾</span>' +
    '</button><ul class="lang-menu" role="menu" hidden></ul>';
  btnEl = host.querySelector(".lang-btn");
  menuEl = host.querySelector(".lang-menu");
  menuEl.innerHTML = LANGS.map((l) => `<li role="none"><button role="menuitem" type="button" data-lang="${l.code}">${l.name}</button></li>`).join("");
  btnEl.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  menuEl.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  document.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  updateSwitch();
}
function toggleMenu() { const open = menuEl.hidden; menuEl.hidden = !open; btnEl.setAttribute("aria-expanded", String(open)); }
function closeMenu() { if (menuEl && !menuEl.hidden) { menuEl.hidden = true; btnEl.setAttribute("aria-expanded", "false"); } }
function updateSwitch() {
  if (!btnEl) return;
  btnEl.querySelector(".lang-code").textContent = current.toUpperCase();
  menuEl.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === current));
}

function init() { buildSwitch(); applyStatic(); }
document.documentElement.lang = current;
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
