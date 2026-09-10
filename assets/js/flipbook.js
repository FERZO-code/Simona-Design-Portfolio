/* ============================================================
   Flipbook — un foglio alla volta, rilegato a sinistra.
   Clic sulle metà, trascinamento del foglio, tastiera, indice, zoom.
   ============================================================ */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const slug = params.get("b") || BOOKS[0].slug;
  const book = BOOK_BY_SLUG[slug] || BOOKS[0];
  const N = book.pages;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DUR = reduced ? 1 : 820;

  document.documentElement.dataset.book = book.slug;
  document.title = `${book.title} — Simona Barbone`;

  const $ = (id) => document.getElementById(id);
  const fb = $("fb"), leaf = $("leaf"),
        frontImg = $("frontImg"), backImg = $("backImg"),
        underImg = $("underImg"), under = $("under"),
        frontShade = $("frontShade"), underShade = $("underShade"),
        zPrev = $("zPrev"), zNext = $("zNext");

  /* ---------- intestazione ---------- */
  $("bTitle").textContent = book.title;
  $("bSub").textContent = `${book.subtitle} · ${book.discipline}`;
  $("pTot").textContent = N;
  $("thumbsLabel").textContent = `Indice · ${N} pagine`;
  $("cartiglio").innerHTML = `
    <div><dt>Book</dt><dd>${book.title}</dd></div>
    <div><dt>Tavole</dt><dd>${book.tavole}</dd></div>
    <div><dt>Anno</dt><dd>${book.year}</dd></div>
    <div><dt>Autrice</dt><dd>Simona Barbone</dd></div>`;

  /* ---------- stato ---------- */
  let idx = Math.min(Math.max(parseInt(params.get("p") || location.hash.replace("#p", ""), 10) || 1, 1), N);
  let angle = 0;          // gradi, 0 = foglio chiuso sul recto
  let dir = 0;            // 1 avanti, -1 indietro
  let busy = false;
  let dragging = false;
  let suppressClick = false;

  const cache = new Map();
  function preload(n) {
    if (n < 1 || n > N || cache.has(n)) return;
    const im = new Image();
    im.src = pageSrc(book.slug, n);
    cache.set(n, im);
  }
  const preloadAround = () => [idx, idx + 1, idx + 2, idx + 3, idx - 1, idx - 2].forEach(preload);

  function setAngle(a) {
    angle = a;
    const t = Math.min(Math.abs(a) / 180, 1);
    leaf.style.transform = `rotateY(${a}deg)`;
    frontShade.style.opacity = (t * 1.35).toFixed(3);
    /* l'ombra del foglio cade appena oltre il suo bordo, e solo fino a 90° */
    const proj = Math.abs(Math.cos((a * Math.PI) / 180));
    underShade.style.left = (proj * 100).toFixed(2) + "%";
    underShade.style.opacity = t < 0.5 ? (Math.sin(Math.PI * t * 2) * 0.8).toFixed(3) : "0";
    leaf.style.boxShadow = t > 0.02
      ? `${(24 * (1 - t)).toFixed(0)}px 0 ${(70 * (1 - t) + 10).toFixed(0)}px -20px rgba(0,0,0,${(0.8 * (1 - t)).toFixed(2)})`
      : "";
  }

  /* pagina ferma: il foglio mostra il recto corrente, niente sotto */
  function rest() {
    frontImg.src = pageSrc(book.slug, idx);
    backImg.src = pageSrc(book.slug, idx);
    underImg.removeAttribute("src");
    setAngle(0);
    leaf.style.boxShadow = "";
    sync();
    preloadAround();
  }

  /* prepara la scena per una rotazione nella direzione d */
  function arm(d) {
    dir = d;
    if (d > 0) {
      underImg.src = pageSrc(book.slug, idx + 1);
      frontImg.src = pageSrc(book.slug, idx);
      backImg.src = pageSrc(book.slug, idx);
      setAngle(0);
    } else {
      underImg.src = pageSrc(book.slug, idx);
      frontImg.src = pageSrc(book.slug, idx - 1);
      backImg.src = pageSrc(book.slug, idx - 1);
      setAngle(-180);
    }
  }

  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function run(from, to, dur, done) {
    const t0 = performance.now();
    (function step(now) {
      const k = Math.min((now - t0) / dur, 1);
      setAngle(from + (to - from) * easeInOut(k));
      if (k < 1) requestAnimationFrame(step);
      else done && done();
    })(t0);
  }

  function flip(d) {
    if (busy || dragging) return;
    if (d > 0 && idx >= N) return bump(1);
    if (d < 0 && idx <= 1) return bump(-1);
    busy = true;
    arm(d);
    // due frame per far applicare l'angolo di partenza prima di animare
    requestAnimationFrame(() => requestAnimationFrame(() => {
      run(angle, d > 0 ? -180 : 0, DUR, () => {
        idx += d;
        rest();
        busy = false;
      });
    }));
  }

  /* piccolo scarto elastico a fine book */
  function bump(d) {
    if (reduced) return;
    fb.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${d * -12}px)` }, { transform: "translateX(0)" }],
      { duration: 380, easing: "ease-out" }
    );
  }

  function goTo(n) {
    n = Math.min(Math.max(n, 1), N);
    if (n === idx || busy) return;
    if (Math.abs(n - idx) === 1 && !zoomOpen) return flip(n > idx ? 1 : -1);
    idx = n;
    rest();
    if (!reduced) fb.animate([{ opacity: .35, transform: "scale(.99)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
  }

  /* ---------- trascinamento del foglio ---------- */
  let startX = 0, lastX = 0, lastT = 0, vel = 0;

  fb.addEventListener("pointerdown", (e) => {
    if (busy || e.button !== 0) return;
    startX = lastX = e.clientX;
    lastT = performance.now();
    vel = 0;
    fb.setPointerCapture(e.pointerId);
  });

  fb.addEventListener("pointermove", (e) => {
    if (!fb.hasPointerCapture(e.pointerId) || busy) return;
    const dx = e.clientX - startX;

    if (!dragging) {
      if (Math.abs(dx) < 9) return;
      const d = dx < 0 ? 1 : -1;
      if ((d > 0 && idx >= N) || (d < 0 && idx <= 1)) return;
      dragging = true;
      fb.classList.add("is-dragging");
      arm(d);
    }

    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(now - lastT, 1);
    lastX = e.clientX; lastT = now;

    const p = Math.min(Math.max((dir > 0 ? -dx : dx) / (fb.clientWidth * 0.75), 0), 1);
    setAngle(dir > 0 ? -180 * p : -180 * (1 - p));
  });

  function endDrag(e) {
    if (fb.hasPointerCapture(e.pointerId)) fb.releasePointerCapture(e.pointerId);
    if (!dragging) return;
    dragging = false;
    fb.classList.remove("is-dragging");
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 60);

    const p = Math.abs(angle) / 180;
    const done = dir > 0 ? p : 1 - p;
    const fast = dir > 0 ? vel < -0.45 : vel > 0.45;
    const commit = done > 0.3 || fast;

    busy = true;
    const target = commit ? (dir > 0 ? -180 : 0) : (dir > 0 ? 0 : -180);
    const remaining = Math.abs(target - angle) / 180;
    run(angle, target, Math.max(220, DUR * remaining), () => {
      if (commit) idx += dir;
      rest();
      busy = false;
    });
  }
  fb.addEventListener("pointerup", endDrag);
  fb.addEventListener("pointercancel", endDrag);

  /* ---------- comandi ---------- */
  zNext.addEventListener("click", () => { if (!suppressClick) flip(1); });
  zPrev.addEventListener("click", () => { if (!suppressClick) flip(-1); });

  /* il centro della pagina apre lo zoom */
  fb.addEventListener("click", (e) => {
    if (suppressClick || busy || e.target.closest(".zone")) return;
    openZoom();
  });

  addEventListener("keydown", (e) => {
    if (zoomOpen) {
      if (e.key === "ArrowRight") { e.preventDefault(); return goTo(idx + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); return goTo(idx - 1); }
      if (e.key !== "Escape" && e.key.toLowerCase() !== "z") return;
    }
    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": e.preventDefault(); flip(1); break;
      case "ArrowLeft": case "PageUp": e.preventDefault(); flip(-1); break;
      case "Home": e.preventDefault(); goTo(1); break;
      case "End": e.preventDefault(); goTo(N); break;
      case "Escape": closeZoom(); setThumbs(false); break;
      default:
        const k = e.key.toLowerCase();
        if (k === "t") setThumbs(!thumbsOpen);
        else if (k === "z") zoomOpen ? closeZoom() : openZoom();
        else if (k === "f") toggleFull();
    }
  });

  /* ---------- quota di avanzamento ---------- */
  const scrub = $("scrub"), fill = $("fill"), knob = $("knob");
  $("ticks").innerHTML = Array.from({ length: 11 }, (_, i) => `<i style="left:${i * 10}%"></i>`).join("");

  function pctOf(n) { return N > 1 ? ((n - 1) / (N - 1)) * 100 : 0; }

  function sync() {
    const pct = pctOf(idx);
    fill.style.width = pct + "%";
    knob.style.left = pct + "%";
    $("pNow").textContent = idx;
    scrub.setAttribute("aria-valuenow", idx);
    scrub.setAttribute("aria-valuemax", N);
    zPrev.disabled = idx <= 1;
    zNext.disabled = idx >= N;
    history.replaceState(null, "", `?b=${book.slug}#p${idx}`);
    document.querySelectorAll(".thumb").forEach((t, i) =>
      t.classList.toggle("is-current", i + 1 === idx));
    if (thumbsOpen) centerThumb();
    if (zoomOpen) $("zoomImg").src = zoomSrc(idx);
  }

  const scrubTo = (e) => {
    const r = scrub.getBoundingClientRect();
    goTo(Math.round(1 + ((e.clientX - r.left) / r.width) * (N - 1)));
  };
  scrub.addEventListener("click", scrubTo);
  scrub.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(idx + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(idx - 1); }
  });

  /* ---------- indice miniature ---------- */
  const thumbs = $("thumbs"), strip = $("strip");
  let thumbsOpen = false, thumbsBuilt = false;

  function buildThumbs() {
    if (thumbsBuilt) return;
    strip.innerHTML = Array.from({ length: N }, (_, i) => `
      <button class="thumb" data-p="${i + 1}" aria-label="Vai a pagina ${i + 1}">
        <img src="${thumbSrc(book.slug, i + 1)}" alt="" loading="lazy" width="122" height="86">
        <b>${String(i + 1).padStart(2, "0")}</b>
      </button>`).join("");
    strip.addEventListener("click", (e) => {
      const b = e.target.closest(".thumb");
      if (b) goTo(+b.dataset.p);
    });
    thumbsBuilt = true;
  }

  /* scorre solo la striscia, senza toccare lo scroll della pagina */
  function centerThumb() {
    const cur = strip.children[idx - 1];
    if (!cur) return;
    strip.scrollLeft = cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2;
  }

  function setThumbs(open) {
    thumbsOpen = open;
    if (open) buildThumbs();
    thumbs.classList.toggle("is-open", open);
    $("btnThumbs").setAttribute("aria-pressed", String(open));
    if (open) requestAnimationFrame(centerThumb);
  }
  $("btnThumbs").addEventListener("click", () => setThumbs(!thumbsOpen));
  $("btnThumbsClose").addEventListener("click", () => setThumbs(false));

  /* ---------- zoom ---------- */
  const zoomer = $("zoomer"), zoomImg = $("zoomImg");
  let zoomOpen = false;

  const zoomSrc = (n) => `assets/books/${book.slug}/zoom/p${String(n).padStart(3, "0")}.webp`;

  function openZoom() {
    zoomImg.src = zoomSrc(idx);
    zoomer.classList.add("is-open");
    zoomer.setAttribute("aria-hidden", "false");
    zoomOpen = true;
    move({ clientX: innerWidth / 2, clientY: innerHeight / 2 });
  }
  function closeZoom() {
    zoomer.classList.remove("is-open");
    zoomer.setAttribute("aria-hidden", "true");
    zoomOpen = false;
  }
  function move(e) {
    if (!zoomOpen) return;
    const ox = (0.5 - e.clientX / innerWidth) * (zoomImg.clientWidth - innerWidth);
    const oy = (0.5 - e.clientY / innerHeight) * (zoomImg.clientHeight - innerHeight);
    zoomImg.style.transform = `translate(${ox}px, ${oy}px)`;
  }
  zoomer.addEventListener("pointermove", move);
  zoomer.addEventListener("click", closeZoom);
  $("btnZoom").addEventListener("click", openZoom);

  /* ---------- schermo intero ---------- */
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
  }
  $("btnFull").addEventListener("click", toggleFull);

  /* ---------- il foglio si adatta allo spazio libero ---------- */
  function measure() {
    const head = document.querySelector(".rhead").offsetHeight;
    const foot = document.querySelector(".rfoot").offsetHeight;
    const hint = document.querySelector(".rotate-hint");
    const extra = hint && hint.offsetParent ? hint.offsetHeight + 14 : 0;
    fb.style.setProperty("--chrome", head + foot + extra + 26 + "px");
  }
  measure();
  addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  /* ---------- avvio ---------- */
  rest();
  const first = new Image();
  first.src = pageSrc(book.slug, idx);
  const reveal = () => $("rload").classList.add("is-done");
  first.decode ? first.decode().then(reveal, reveal) : (first.onload = reveal);
  setTimeout(reveal, 2500);
})();
