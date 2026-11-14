// Gentle motion for Academicstrata: fade-up on scroll, counting numbers, rotating headline word.
// Skipped completely for visitors who ask their device to reduce motion. The header is not touched.
(function () {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function count(el) {
    var m = (el.textContent || "").trim().match(/^(\d+)$/);
    if (!m || el.__c) return;
    el.__c = 1;
    var to = +m[1], t0 = performance.now(), d = 900;
    (function f(t) {
      var k = Math.min(1, (t - t0) / d);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      var n = en.target;
      io.unobserve(n);
      n.classList.add("rv-in");
      var s = n.matches(".ab-stats>div,.kt-stats>div") ? n.querySelector("strong") : null;
      if (s) count(s);
      setTimeout(function () { n.style.transitionDelay = ""; }, 1200);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;

  function scan() {
    if (!io) return;
    document.querySelectorAll("#main .fx,#main .card,#main .ab-stats>div,#main .kt-stats>div,#main .kt-tl>li,#main .kt-q,#main .feats>h2").forEach(function (n) {
      if (n.__rv) return;
      n.__rv = 1;
      n.classList.add("rv");
      var i = Array.prototype.indexOf.call(n.parentNode.children, n);
      n.style.transitionDelay = Math.min(i, 6) * 70 + "ms";
      io.observe(n);
    });
  }
  scan();
  var main = document.getElementById("main"), pend = false;
  if (main && "MutationObserver" in window) {
    new MutationObserver(function () {
      if (pend) return;
      pend = true;
      requestAnimationFrame(function () { pend = false; scan(); });
    }).observe(main, { childList: true, subtree: true });
  }

  var rw = document.querySelector(".rw");
  if (rw) {
    var W = (rw.getAttribute("data-w") || "").split("|"), i = 0;
    if (W.length > 1) setInterval(function () {
      if (document.hidden || rw.closest("[hidden]")) return;
      rw.classList.add("out");
      setTimeout(function () { i = (i + 1) % W.length; rw.textContent = W[i]; rw.classList.remove("out"); }, 300);
    }, 2600);
  }
})();

// Browse by subject: the row of cards drifts slowly sideways, pauses when you hover or touch it,
// can be dragged with the mouse, and stays still for visitors who ask to reduce motion.
(function () {
  var sl = document.querySelector(".sl");
  if (!sl) return;
  var rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pos = 0, last = 0, hold = 0, wait = 0, dir = 1, pause = false, dragging = false, moved = 0, sx = 0, s0 = 0;
  function holdFor(ms) { hold = performance.now() + ms; }
  sl.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") pause = true; });
  sl.addEventListener("pointerleave", function () { pause = false; holdFor(800); });
  sl.addEventListener("focusin", function () { pause = true; });
  sl.addEventListener("focusout", function () { pause = false; });
  sl.addEventListener("touchstart", function () { holdFor(4000); }, { passive: true });
  sl.addEventListener("wheel", function () { holdFor(2500); }, { passive: true });
  sl.addEventListener("dragstart", function (e) { e.preventDefault(); });
  sl.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button) return;
    dragging = true; moved = 0; sx = e.clientX; s0 = sl.scrollLeft; sl.classList.add("drag");
  });
  addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var d = e.clientX - sx;
    moved = Math.max(moved, Math.abs(d));
    sl.scrollLeft = s0 - d; pos = sl.scrollLeft;
  });
  addEventListener("pointerup", function () {
    if (!dragging) return;
    dragging = false; sl.classList.remove("drag"); holdFor(2500);
  });
  sl.addEventListener("click", function (e) {
    if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
  }, true);
  var wrap = sl.parentNode, prev = wrap.querySelector(".sl-btn.prev"), next = wrap.querySelector(".sl-btn.next");
  function upd() {
    var m = sl.scrollWidth - sl.clientWidth;
    wrap.classList.toggle("fits", m <= 4);
    if (prev) prev.disabled = sl.scrollLeft <= 2;
    if (next) next.disabled = sl.scrollLeft >= m - 2;
  }
  function go(d) { holdFor(5000); sl.scrollBy({ left: d * Math.max(260, sl.clientWidth * 0.8), behavior: rm ? "auto" : "smooth" }); }
  if (prev) prev.addEventListener("click", function () { go(-1); });
  if (next) next.addEventListener("click", function () { go(1); });
  sl.addEventListener("scroll", upd, { passive: true });
  addEventListener("resize", upd);
  upd(); setTimeout(upd, 400);
  if (rm) return;
  function tick(t) {
    var dt = Math.min(64, t - last); last = t;
    if (!pause && !dragging && t > hold && sl.offsetParent && !document.hidden) {
      if (Math.abs(sl.scrollLeft - pos) > 2) pos = sl.scrollLeft;
      var m = sl.scrollWidth - sl.clientWidth;
      if (m > 4 && t >= wait) {
        pos += dt * 0.03 * dir;
        if (pos >= m) { pos = m; dir = -1; wait = t + 1500; }
        else if (pos <= 0) { pos = 0; dir = 1; wait = t + 1500; }
        sl.scrollLeft = pos;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// Subject pictures: if a file named covers/<subject>.jpg exists (for example covers/mathematics.jpg),
// it is shown on that card instead of the drawn cover.
(function () {
  document.querySelectorAll(".sl .si img").forEach(function (img) {
    var m = (img.getAttribute("src") || "").match(/^covers\/([a-z-]+)\.webp$/);
    if (!m) return;
    var t = new Image();
    t.onload = function () { img.src = t.src; img.classList.add("up"); img.removeAttribute("width"); img.removeAttribute("height"); };
    t.src = "covers/" + m[1] + ".jpg";
  });
})();
