/* ============ Home ============ */
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- anno ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- header al scroll ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-stuck", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- conteggi reali ---------- */
  const total = BOOKS.reduce((s, b) => s + b.pages, 0);
  document.querySelector('[data-count="books"]').textContent = BOOKS.length;
  document.querySelector('[data-count="pages"]').textContent = total;
  const tag = document.querySelector(".quota__tag");
  if (tag) tag.textContent = `${total} pagine in ${BOOKS.length} book`;

  /* ---------- pila di copertine ---------- */
  const stack = document.getElementById("stack");
  const titleEl = document.getElementById("stackTitle");
  const hintEl = document.getElementById("stackHint");
  const order = [];

  BOOKS.forEach((b, i) => {
    const leaf = document.createElement("div");
    leaf.className = "stack__leaf";
    leaf.innerHTML =
      `<img src="assets/books/${b.slug}/cover.webp" alt="Copertina del book ${b.title}"
            width="1000" height="707" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`;
    stack.appendChild(leaf);
    order.push(leaf);
  });

  function layout() {
    order.forEach((leaf, p) => {
      leaf.style.zIndex = 100 - p;
      leaf.style.opacity = p > 3 ? "0" : "1";
      leaf.style.transform =
        `translate3d(${p * -2.6}%, ${p * 2.2}%, ${p * -26}px) rotate(${p * -1.1}deg)`;
    });
  }
  layout();

  let current = 0;
  const setCaption = () => {
    const b = BOOKS[current];
    titleEl.textContent = b.title;
    hintEl.innerHTML =
      `<span class="on-hover">${b.discipline} · ${b.pages} pagine · clicca per sfogliare</span>` +
      `<span class="on-touch">${b.pages} pagine · tocca per sfogliare</span>`;
  };
  setCaption();

  let busy = false;
  function advance() {
    if (busy || order.length < 2) return;
    busy = true;
    const top = order[0];
    top.style.transition = "transform .95s cubic-bezier(.65,0,.35,1), opacity .5s linear .38s";
    top.style.transform = "rotateY(152deg) translateZ(60px)";
    top.style.opacity = "0";

    current = (current + 1) % BOOKS.length;
    setTimeout(setCaption, 330);

    setTimeout(() => {
      order.push(order.shift());
      top.style.transition = "none";
      layout();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          top.style.transition = "";
          busy = false;
        })
      );
    }, 980);
  }

  const open = () => (location.href = `book.html?b=${BOOKS[current].slug}`);
  stack.addEventListener("click", open);
  stack.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    if (e.key === "ArrowRight") { e.preventDefault(); advance(); }
  });

  if (!reduced) {
    let timer = setInterval(advance, 4600);
    const pause = () => clearInterval(timer);
    const resume = () => { clearInterval(timer); timer = setInterval(advance, 4600); };
    stack.addEventListener("pointerenter", pause);
    stack.addEventListener("pointerleave", resume);
    stack.addEventListener("focus", pause);
    stack.addEventListener("blur", resume);
    document.addEventListener("visibilitychange", () => (document.hidden ? pause() : resume()));
  }

  /* ---------- schede dei book ---------- */
  const wrap = document.getElementById("tavole");
  wrap.innerHTML = BOOKS.map((b, i) => `
    <article class="book rise" data-book="${b.slug}" style="--d:${i * 90}ms">
      <div class="book__cover">
        <div class="book__under"><img src="assets/books/${b.slug}/cover2.webp" alt="" aria-hidden="true" loading="lazy"></div>
        <div class="book__leaf">
          <img src="assets/books/${b.slug}/cover.webp" alt="Copertina del book ${b.title}" width="1000" height="707" loading="lazy">
        </div>
        <p class="book__tag">${b.discipline} <span aria-hidden="true">·</span> ${b.year}</p>
      </div>
      <div class="book__body">
        <h3 class="book__title">${b.title}</h3>
        <p class="book__sub">${b.subtitle}</p>
        <p class="book__blurb">${b.blurb}</p>
        <div class="book__swatches" aria-hidden="true">${b.palette.map(c => `<i style="background:${c}"></i>`).join("")}</div>
        <div class="book__foot">
          <span class="book__pages">${b.pages} pagine<span class="book__tavole"> · ${b.tavole}</span></span>
          <span class="book__cta">Sfoglia <span aria-hidden="true">→</span></span>
        </div>
      </div>
      <a class="book__link" href="book.html?b=${b.slug}"><span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Sfoglia il book ${b.title}</span></a>
    </article>`).join("");

  /* ---------- rivelazione allo scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: .12 });
  document.querySelectorAll(".rise").forEach((el) => io.observe(el));
})();
