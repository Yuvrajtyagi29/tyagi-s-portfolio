/* ===== HARISH ELECTRICALS - script.js ===== */

/* ---- 1. SETTINGS YOU CAN EDIT ----
   PHONE: digits only with country code, e.g. "919876543210". Leave "" until you have the number:
   the Call and WhatsApp buttons stay hidden and the page shows "Phone number coming soon".
   USE_OWN_PHOTOS: set to true after adding your .jpg photos next to the .svg files (same name). */
const PHONE = "";
const DISPLAY_PHONE = "Phone number coming soon"; // when PHONE is set, change to e.g. "+91 98765 43210"
const USE_OWN_PHOTOS = false;

/* ---- 2. Phone, call and WhatsApp links ---- */
const waText = encodeURIComponent("Hello Harish Electricals, I would like to enquire about a product.");
document.querySelectorAll("[data-call]").forEach(a => { PHONE ? a.href = "tel:+" + PHONE : a.hidden = true; });
document.querySelectorAll("[data-wa]").forEach(a => {
  if (!PHONE) { a.hidden = true; return; }
  a.href = `https://wa.me/${PHONE}?text=${waText}`; a.target = "_blank"; a.rel = "noopener";
});
document.querySelectorAll("[data-phone-text]").forEach(el => {
  el.outerHTML = PHONE ? `<a href="tel:+${PHONE}">${DISPLAY_PHONE}</a>` : DISPLAY_PHONE;
});
document.getElementById("enquiry").hidden = !PHONE;
document.getElementById("noPhone").hidden = !!PHONE;
if (USE_OWN_PHOTOS) document.querySelectorAll("img[data-photo]").forEach(img => {
  const fallback = img.getAttribute("src");
  img.onerror = () => { img.onerror = null; img.src = fallback; };
  img.src = img.dataset.photo;
});

/* ---- 3. Split intro text into letters ---- */
document.querySelectorAll("[data-split]").forEach(el => {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.innerHTML = [...text].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join("");
});

/* ---- 3b. Sound: starts only after the visitor presses a Sound button ---- */
const AUDIO_DIR = "assets/audio/";
const CUES = [[1.1, "logo"], [4, "tr1"], [8, "tr2"], [12, "tr1"], [17, "tr2"], [20.7, "final"]]; // [seconds into the intro, sound]. Each sound ends before the next begins, and "final" lands its low impact exactly at 22s.
const SFX_VOL = { logo: 0.6, tr1: 0.5, tr2: 0.5, final: 0.8 };
const introEl = document.getElementById("intro");
const pageStart = performance.now();
let music, sfx = {}, timers = [], soundOn = false, introDone = false;
function introElapsed() { // read the intro's own CSS clock so sound stays in step with the scenes
  try { const an = introEl.getAnimations().find(x => x.animationName === "introOut"); if (an && an.currentTime != null) return an.currentTime / 1000; } catch (e) {}
  return (performance.now() - pageStart) / 1000;
}
function setLabels() {
  document.querySelectorAll("[data-sound]").forEach(b => { b.textContent = soundOn ? "Sound: On" : "Sound: Off"; b.setAttribute("aria-pressed", soundOn); });
}
function fade(a, to, ms, done) {
  clearInterval(a._f);
  const from = a.volume, steps = Math.max(1, ms / 40); let i = 0;
  a._f = setInterval(() => {
    i++; a.volume = Math.min(1, Math.max(0, from + (to - from) * i / steps));
    if (i >= steps) { clearInterval(a._f); if (done) done(); }
  }, 40);
}
function loadAudio() { // files are fetched at page load so they are ready when the visitor presses Sound
  if (music) return;
  music = new Audio(AUDIO_DIR + "intro-music.wav");
  music.preload = "auto";
  Object.keys(SFX_VOL).forEach(n => { sfx[n] = new Audio(AUDIO_DIR + n + ".wav"); sfx[n].preload = "auto"; });
}
loadAudio();
function startSound() {
  timers.forEach(clearTimeout); timers = [];
  music.volume = 0;
  soundOn = true; setLabels();
  const begin = () => {
    if (!soundOn) return;
    const e = introElapsed();
    if (!introDone && e < 24) { // intro mode: music and effects follow the scenes
      music.loop = false;
      music.currentTime = e; // jump to the scene currently on screen
      music.play().then(() => fade(music, 0.6, 2000)).catch(() => {});
      // a sound that started less than 1.5s ago still plays, from the matching point, with a short fade-in
      timers = CUES.filter(c => c[0] + 1.5 > e).map(c => setTimeout(() => {
        const s = sfx[c[1]], late = Math.max(0, introElapsed() - c[0]);
        s.currentTime = late;
        if (late > 0.05) { s.volume = 0; s.play().catch(() => {}); fade(s, SFX_VOL[c[1]], 300); }
        else { s.volume = SFX_VOL[c[1]]; s.play().catch(() => {}); }
      }, Math.max(0, c[0] - e) * 1000));
    } else { // after the intro: quiet background music, only when the visitor asks for it
      music.loop = true;
      music.currentTime = 0;
      music.play().then(() => fade(music, 0.25, 1500)).catch(() => {});
    }
  };
  Object.entries(sfx).forEach(([n, s]) => { s.volume = SFX_VOL[n]; s.muted = true; s.play().then(() => { s.pause(); s.currentTime = 0; s.muted = false; }).catch(() => { s.muted = false; }); });
  if (music.readyState >= 3) begin(); else music.addEventListener("canplaythrough", begin, { once: true });
}
function stopSound(ms) {
  timers.forEach(clearTimeout); timers = [];
  if (soundOn) { fade(music, 0, ms, () => music.pause()); Object.values(sfx).forEach(s => fade(s, 0, ms, () => s.pause())); }
  soundOn = false; setLabels();
}
document.querySelectorAll("[data-sound]").forEach(b => b.addEventListener("click", () => soundOn ? stopSound(800) : startSound()));

/* ---- 4. Intro control (ends after 25 seconds, or on Skip) ---- */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let started = false;
function start() {
  if (started) return;
  started = true;
  introDone = true;
  stopSound(1200);
  document.body.classList.add("ready");
  document.body.classList.remove("locked");
  watchReveals();
}
document.body.classList.add("locked");
const intro = document.getElementById("intro");
if (reduce) start();
else {
  setTimeout(start, 24800); // 25-second intro, then the hero begins
  document.getElementById("skip").addEventListener("click", () => { intro.style.animation = "none"; start(); });
}

/* ---- 5. Scroll reveals with stagger ---- */
function watchReveals() {
  document.querySelectorAll("[data-stagger]").forEach(group => {
    group.querySelectorAll(".reveal").forEach((el, i) => el.style.setProperty("--d", Math.min(i % 6, 5) * 0.09 + "s"));
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.querySelector("[data-count]")) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}

/* ---- 6. Number count-up ---- */
function countUp(box) {
  box.querySelectorAll("[data-count]").forEach(el => {
    const end = +el.dataset.count;
    if (reduce) return;
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 1400, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
}

/* ---- 7. Navigation: solid bar on scroll, mobile menu, hero parallax ---- */
const nav = document.getElementById("nav");
const heroBg = document.querySelector(".hero-bg");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    nav.classList.toggle("solid", y > 60);
    if (!reduce && y < innerHeight) heroBg.style.marginTop = y * 0.25 + "px";
    ticking = false;
  });
}, { passive: true });

const menu = document.getElementById("menu"), btn = document.getElementById("menuBtn");
btn.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  menu.classList.remove("open"); btn.classList.remove("open"); btn.setAttribute("aria-expanded", false);
}));

/* ---- 8. Hero photo follows the mouse slightly (desktop only) ---- */
const heroPhoto = document.querySelector(".hero-photo");
if (!reduce && matchMedia("(hover:hover)").matches) {
  document.querySelector(".hero").addEventListener("mousemove", e => {
    const x = (e.clientX / innerWidth - 0.5) * 18, y = (e.clientY / innerHeight - 0.5) * 18;
    heroPhoto.style.translate = `${x}px ${y}px`;
  });
}

/* ---- 9. Enquiry form opens WhatsApp with the message ---- */
document.getElementById("enquiry").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = encodeURIComponent(`Hello Harish Electricals, I am ${f.get("name")}.\n${f.get("msg")}`);
  if (!PHONE) { alert("Add your phone number in script.js (PHONE) to enable WhatsApp enquiries."); return; }
  window.open(`https://wa.me/${PHONE}?text=${msg}`, "_blank", "noopener");
});

const toTop = document.getElementById("toTop");
addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 700), { passive: true });
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
if (!("IntersectionObserver" in window)) document.querySelectorAll(".reveal").forEach(el => el.classList.add("in"));
document.getElementById("year").textContent = new Date().getFullYear();
