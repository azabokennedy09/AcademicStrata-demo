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
