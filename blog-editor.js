// Blog editor for Academicstrata: formatting, links, pictures, live SEO check.
// It relies on cleanHtml(), tx() and cl() from app.js, which also clean everything before it is saved or shown.
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var area = $("be-area"), bar = $("be-bar"), pop = $("be-pop"), seoBox = $("be-seo");
  if (!area || !bar || typeof cleanHtml !== "function") return;
  var rng = null, last = { score: 0 }, hasThumb = false, timer = 0, MAXIMG = 6;
  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) {}
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function mk(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function getHtml() {
    var b = cleanHtml(area.innerHTML), h = b.innerHTML.trim();
    return (!tx(b) && !b.querySelector("img")) ? "" : h;
  }
  function setHtml(h) {
    area.innerHTML = h ? cleanHtml(h).innerHTML : "<p><br></p>";
    area.querySelectorAll("figure").forEach(function (f) { f.contentEditable = "false"; });
    changed();
  }
  function bodyToHtml(t) {
    function inl(s) { return esc(s).replace(/\[([^\]]+)\]\((#[a-z0-9_~.-]+)\)/g, '<a href="$2">$1</a>'); }
    return String(t || "").split(/\n\n+/).map(function (b) {
      if (b.indexOf("### ") === 0) return "<h3>" + inl(b.slice(4)) + "</h3>";
      if (b.indexOf("## ") === 0) return "<h2>" + inl(b.slice(3)) + "</h2>";
      if (b.indexOf("- ") === 0) return "<ul>" + b.split("\n").map(function (l) { return "<li>" + inl(l.replace(/^- /, "")) + "</li>"; }).join("") + "</ul>";
      return "<p>" + inl(b).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }
  // ----- toolbar
  document.addEventListener("selectionchange", function () {
    var s = getSelection();
    if (s.rangeCount && area.contains(s.anchorNode)) {
      rng = s.getRangeAt(0).cloneRange();
      var n = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode, f = n.closest("h2,h3,h4,blockquote");
      if ($("be-fmt")) $("be-fmt").value = f ? f.tagName.toLowerCase() : "p";
    }
  });
  function restore() { var s = getSelection(); if (document.activeElement === area && s.rangeCount && area.contains(s.anchorNode)) return; area.focus(); s.removeAllRanges(); if (rng) s.addRange(rng); }
  function cmd(c, v) { restore(); document.execCommand(c, false, v == null ? null : v); changed(); }
  var fmt = mk("select"); fmt.id = "be-fmt"; fmt.setAttribute("aria-label", "Text style");
  [["p", "Paragraph"], ["h2", "Heading 2"], ["h3", "Heading 3"], ["h4", "Heading 4"], ["blockquote", "Quote"]].forEach(function (o) { var op = mk("option", "", o[1]); op.value = o[0]; fmt.appendChild(op); });
  fmt.onchange = function () { cmd("formatBlock", "<" + fmt.value + ">"); };
  bar.appendChild(fmt);
  [["B", "Bold (Ctrl+B)", function () { cmd("bold"); }], ["I", "Italic (Ctrl+I)", function () { cmd("italic"); }], ["U", "Underline (Ctrl+U)", function () { cmd("underline"); }],
   ["List", "Bulleted list", function () { cmd("insertUnorderedList"); }], ["1. List", "Numbered list", function () { cmd("insertOrderedList"); }],
   ["Link", "Add or edit a link (Ctrl+K)", function () { openLink(); }], ["Unlink", "Remove link", function () { cmd("unlink"); }],
   ["Image", "Add a picture", function () { openImage(null); }], ["Line", "Divider line", function () { cmd("insertHorizontalRule"); }],
   ["Undo", "Undo", function () { cmd("undo"); }], ["Redo", "Redo", function () { cmd("redo"); }],
   ["Clear", "Clear formatting", function () { cmd("removeFormat"); cmd("formatBlock", "<p>"); }]].forEach(function (b) {
    var x = mk("button", "be-b", b[0]); x.type = "button"; x.title = b[1]; x.setAttribute("aria-label", b[1]);
    if (b[0] === "B") x.style.fontWeight = "800"; if (b[0] === "I") x.style.fontStyle = "italic"; if (b[0] === "U") x.style.textDecoration = "underline";
    x.onmousedown = function (e) { e.preventDefault(); }; x.onclick = b[2]; bar.appendChild(x);
  });
  area.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openLink(); } });
  // ----- pasting: everything pasted is cleaned first
  area.addEventListener("paste", function (e) {
    var cd = e.clipboardData; if (!cd) return; e.preventDefault();
    var img = [].filter.call(cd.files || [], function (f) { return /^image\//.test(f.type); })[0];
    if (img) { openImage(null, img); return; }
    var h = cd.getData("text/html"), t = cd.getData("text/plain");
    document.execCommand("insertHTML", false, h ? cleanHtml(h).innerHTML : t.split(/\n\n+/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join(""));
    changed();
  });
  function keep() { var s = getSelection(); if (s.rangeCount && area.contains(s.anchorNode)) rng = s.getRangeAt(0).cloneRange(); }
  area.addEventListener("keyup", keep); area.addEventListener("mouseup", keep); area.addEventListener("blur", keep);
  area.addEventListener("input", changed);
  area.addEventListener("click", function (e) { var f = e.target.closest("figure"); if (f && area.contains(f)) openImage(f); });
  // ----- panel under the toolbar
  function showPop(title, rows, actions) {
    pop.textContent = ""; pop.hidden = false; pop.appendChild(mk("strong", "", title));
    rows.forEach(function (r) { pop.appendChild(r); });
    var a = mk("div", "be-act"); actions.forEach(function (x) { var b = mk("button", x[2] ? "chip" : "btn", x[0]); b.type = "button"; b.onclick = x[1]; a.appendChild(b); }); pop.appendChild(a);
    var first = pop.querySelector("input"); if (first) first.focus();
  }
  function field(label, type, val, ph) { var l = mk("label", "", label), i = mk("input"); i.type = type || "text"; i.value = val || ""; if (ph) i.placeholder = ph; l.appendChild(i); l.input = i; return l; }
  function closePop() { pop.hidden = true; pop.textContent = ""; }
  function openLink() {
    var s = getSelection(), n = rng && rng.startContainer, a = n && (n.nodeType === 1 ? n : n.parentNode).closest ? (n.nodeType === 1 ? n : n.parentNode).closest("a") : null;
    var collapsed = !rng || rng.collapsed, u = field("Web address", "text", a ? a.getAttribute("href") : "", "https://example.com or #resources"), t = field("Link text", "text", "", "What the reader sees"), sel = mk("select"), msg = mk("p", "be-err");
    var pages = [["", "Or choose a page on this site…"], ["#resources", "Resources"], ["#free", "Free Guides"], ["#premium", "Premium Guides"], ["#blog", "Blog"], ["#about", "About"], ["#team", "Our Team"], ["#faq", "FAQ"], ["#contact", "Contact"]];
    pages.forEach(function (p) { var o = mk("option", "", p[1]); o.value = p[0]; sel.appendChild(o); });
    sel.onchange = function () { if (sel.value) u.input.value = sel.value; };
    var rows = [u, sel]; if (collapsed && !a) rows.push(t); rows.push(msg);
    showPop("Link", rows, [["Apply", function () {
      var v = u.input.value.trim();
      if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) v = "https://" + v;
      if (!/^(https?:\/\/\S+|mailto:\S+|#[A-Za-z0-9_~.-]+)$/.test(v)) { msg.textContent = "Enter a web address such as https://example.com, or choose a page."; return; }
      restore();
      if (a) a.setAttribute("href", v);
      else if (collapsed) { var tx0 = t.input.value.trim() || v; document.execCommand("insertHTML", false, '<a href="' + esc(v) + '">' + esc(tx0) + "</a>"); }
      else document.execCommand("createLink", false, v);
      closePop(); changed();
    }], ["Remove link", function () { restore(); document.execCommand("unlink"); closePop(); changed(); }, 1], ["Cancel", closePop, 1]]);
  }
  function shrink(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var w = Math.min(900, im.width), q = 0.76, d, h;
          do { h = Math.round(im.height * w / im.width); var c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h); d = c.toDataURL("image/jpeg", q); w = Math.round(w * 0.85); q = 0.7; } while (d.length > 240000 && w > 420);
          res({ src: d, w: Math.round(w / 0.85), h: h });
        };
        im.onerror = rej; im.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  function openImage(fig, dropped) {
    var edit = !!fig, im = fig && fig.querySelector("img"), cap = fig && fig.querySelector("figcaption");
    var f = mk("label", "", edit ? "Picture" : "Choose a picture"), fi = mk("input"); fi.type = "file"; fi.accept = "image/*"; f.appendChild(fi); if (edit) f.hidden = true;
    var alt = field("Describe the picture (alt text, important for search and screen readers)", "text", im ? im.getAttribute("alt") || "" : "", "e.g. A student balancing a chemical equation"), c = field("Caption (optional)", "text", cap ? cap.textContent : ""), msg = mk("p", "be-err"), pend = dropped || null;
    var acts = [[edit ? "Save" : "Add picture", async function () {
      if (edit) {
        im.setAttribute("alt", alt.input.value.trim()); var cx = c.input.value.trim();
        if (cx) { if (!cap) { cap = mk("figcaption"); fig.appendChild(cap); } cap.textContent = cx; } else if (cap) cap.remove();
        closePop(); changed(); return;
      }
      var file = pend || fi.files[0];
      if (!file || !/^image\//.test(file.type)) { msg.textContent = "Choose a picture file (JPG, PNG or WebP)."; return; }
      if (area.querySelectorAll("img").length >= MAXIMG) { msg.textContent = "A post can hold up to " + MAXIMG + " pictures. Keep it light so pages load fast."; return; }
      if (!alt.input.value.trim()) { msg.textContent = "Add a short description of the picture."; return; }
      msg.textContent = "Preparing the picture…";
      try {
        var r = await shrink(file);
        restore();
        document.execCommand("insertHTML", false, '<figure><img src="' + r.src + '" alt="' + esc(alt.input.value.trim()) + '" width="' + r.w + '" height="' + r.h + '">' + (c.input.value.trim() ? "<figcaption>" + esc(c.input.value.trim()) + "</figcaption>" : "") + "</figure><p><br></p>");
        area.querySelectorAll("figure").forEach(function (x) { x.contentEditable = "false"; });
        closePop(); changed();
      } catch (e) { msg.textContent = "Could not read that picture. Try another file."; }
    }]];
    if (edit) acts.push(["Remove picture", function () { fig.remove(); closePop(); changed(); }, 1]);
    acts.push(["Cancel", closePop, 1]);
    showPop(edit ? "Picture" : "Add a picture", [f, alt, c, msg], acts);
    if (pend) msg.textContent = "Picture ready: " + (pend.name || "pasted image") + ". Describe it, then add it.";
  }
  // ----- Write / Preview tabs
  function tab(prev) {
    $("be-tw").classList.toggle("on", !prev); $("be-tp").classList.toggle("on", prev);
    area.hidden = prev; bar.hidden = prev; closePop(); $("be-prev").hidden = !prev;
    if (prev) {
      var p = $("be-prev"); p.textContent = "";
      var h = mk("h1", "", $("bt").value.trim() || "Untitled post"); p.appendChild(h);
      var b = cleanHtml(getHtml()); while (b.firstChild) p.appendChild(b.firstChild);
    }
  }
  $("be-tw").onclick = function () { tab(false); }; $("be-tp").onclick = function () { tab(true); };
  // ----- numbers and SEO
  function syll(w) { w = w.toLowerCase().replace(/[^a-z]/g, ""); if (!w) return 0; if (w.length <= 3) return 1; w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, ""); var m = w.match(/[aeiouy]{1,2}/g); return m ? m.length : 1; }
  function analyze() {
    var title = $("bt").value.trim(), desc = $("bs").value.trim(), kw = ($("bk").value || "").trim().toLowerCase(), html = getHtml();
    var box = cleanHtml(html), text = tx(box), words = text ? text.split(/\s+/) : [], wc = words.length, low = text.toLowerCase();
    var h2 = [].slice.call(box.querySelectorAll("h2")), h3 = box.querySelectorAll("h3"), subs = [].slice.call(box.querySelectorAll("h2,h3")).map(function (h) { return h.textContent.toLowerCase(); });
    var imgs = [].slice.call(box.querySelectorAll("img")), links = [].slice.call(box.querySelectorAll("a[href]"));
    var internal = links.filter(function (a) { var h = a.getAttribute("href"); return h.charAt(0) === "#" || /academicstrata\.com/i.test(h); }).length, external = links.length - internal;
    var badTxt = links.filter(function (a) { return /^(click here|here|read more|this|link)$/i.test(a.textContent.trim()); }).length;
    var sent = text.split(/[.!?]+\s/).filter(function (s) { return s.trim().split(/\s+/).length > 2; }), long = sent.filter(function (s) { return s.split(/\s+/).length > 25; }).length;
    var syl = words.reduce(function (n, w) { return n + syll(w); }, 0), fre = wc && sent.length ? 206.835 - 1.015 * (wc / sent.length) - 84.6 * (syl / wc) : 0;
    var kwN = kw ? low.split(kw).length - 1 : 0, dens = kw && wc ? kwN * kw.split(/\s+/).length / wc * 100 : 0;
    var first100 = words.slice(0, 100).join(" ").toLowerCase();
    var secs = 0, run = 0; [].forEach.call(box.children, function (n) { if (/^H[2-4]$/.test(n.tagName)) { secs = Math.max(secs, run); run = 0; } else run += tx(n).split(/\s+/).filter(Boolean).length; }); secs = Math.max(secs, run);
    var out = [], K = !!kw;
    function add(w, st, name, msg, needKw) { out.push({ w: w, st: st, name: name, msg: msg, kw: !!needKw }); }
    var tl = title.length;
    add(8, tl >= 30 && tl <= 60 ? "good" : tl >= 20 && tl <= 70 ? "ok" : "bad", "Title length", tl ? tl + " characters. Aim for 30 to 60 so search results show it in full." : "Add a title.");
    add(8, K ? (low && title.toLowerCase().indexOf(kw) === 0 ? "good" : title.toLowerCase().indexOf(kw) > 0 ? "good" : "bad") : "ok", "Keyword in title", K ? (title.toLowerCase().indexOf(kw) >= 0 ? "The focus keyword is in the title." : "Put the focus keyword in the title, ideally near the start.") : "", 1);
    var dl = desc.length;
    add(8, dl >= 120 && dl <= 160 ? "good" : dl >= 70 && dl <= 180 ? "ok" : "bad", "Summary (meta description)", dl ? dl + " characters. Aim for 120 to 160." : "Write a summary of 120 to 160 characters. It is the text under your title in Google.");
    add(4, K ? (desc.toLowerCase().indexOf(kw) >= 0 ? "good" : "bad") : "ok", "Keyword in summary", K ? (desc.toLowerCase().indexOf(kw) >= 0 ? "The summary uses the keyword." : "Use the focus keyword in the summary.") : "", 1);
    add(6, K ? (first100.indexOf(kw) >= 0 ? "good" : "bad") : "ok", "Keyword near the start", K ? (first100.indexOf(kw) >= 0 ? "The keyword appears in the first 100 words." : "Mention the keyword in the first paragraph.") : "", 1);
    add(6, !K || wc < 100 ? "ok" : dens >= 0.5 && dens <= 2.5 ? "good" : dens > 0 && dens <= 3.5 ? "ok" : "bad", "Keyword use", K ? (wc < 100 ? "Write more text first." : kwN + " use" + (kwN === 1 ? "" : "s") + " (" + dens.toFixed(1) + "% of the words). Aim for 0.5% to 2.5%.") : "", 1);
    add(10, wc >= 600 ? "good" : wc >= 300 ? "ok" : "bad", "Length", wc + " words. " + (wc >= 600 ? "A good length." : wc >= 300 ? "Fine, but 600 or more words often rank better." : "Short posts rarely rank. Aim for at least 300 words."));
    add(6, h2.length >= 2 ? "good" : h2.length === 1 ? "ok" : "bad", "Headings", h2.length + " Heading 2 section" + (h2.length === 1 ? "" : "s") + ". Break the article into at least 2 sections with Heading 2.");
    add(4, K ? (subs.some(function (s) { return s.indexOf(kw) >= 0; }) ? "good" : "bad") : "ok", "Keyword in a heading", K ? (subs.some(function (s) { return s.indexOf(kw) >= 0; }) ? "A heading uses the keyword." : "Use the keyword in one Heading 2 or 3.") : "", 1);
    add(4, secs > 250 ? "bad" : secs > 180 ? "ok" : "good", "Section length", secs > 180 ? "One section runs about " + secs + " words with no heading. Add a subheading." : "Sections are a comfortable length.");
    add(6, internal >= 1 ? "good" : "bad", "Links to your own pages", internal ? internal + " link" + (internal === 1 ? "" : "s") + " to pages on this site." : "Link to at least one of your own pages, such as Resources.");
    add(4, external >= 1 ? "good" : "ok", "Links to other sites", external ? external + " link" + (external === 1 ? "" : "s") + " to other sites." : "One link to a trusted source adds credibility.");
    add(2, badTxt ? "bad" : "good", "Link wording", badTxt ? "Use descriptive link text instead of 'click here'." : "Link text is descriptive.");
    var hasImg = imgs.length > 0 || hasThumb || ($("bi") && $("bi").files.length > 0);
    add(6, hasImg ? "good" : "bad", "Pictures", hasImg ? (imgs.length ? imgs.length + " picture" + (imgs.length === 1 ? "" : "s") + " in the article." : "A thumbnail is set.") : "Add a thumbnail or a picture. It also becomes the card image.");
    var noAlt = imgs.filter(function (i) { return !(i.getAttribute("alt") || "").trim(); }).length;
    add(6, !imgs.length ? "ok" : noAlt ? "bad" : "good", "Picture descriptions", !imgs.length ? "Describe each picture you add (alt text)." : noAlt ? noAlt + " picture" + (noAlt === 1 ? " has" : "s have") + " no description." : "Every picture has a description.");
    add(6, !wc ? "ok" : fre >= 60 ? "good" : fre >= 45 ? "ok" : "bad", "Readability", wc ? "Reading ease " + Math.max(0, Math.round(fre)) + "/100 (60 or more is easy). Use shorter words and sentences." : "");
    add(4, !wc ? "ok" : long / Math.max(1, sent.length) <= 0.15 ? "good" : long / sent.length <= 0.3 ? "ok" : "bad", "Sentence length", wc ? long + " of " + sent.length + " sentences are over 25 words." : "");
    var tot = 0, got = 0;
    out.forEach(function (c) { if (c.kw && !K) { c.st = "na"; c.msg = "Add a focus keyword to check this."; return; } if (!c.msg && !wc && c.st === "ok") { c.st = "na"; return; } tot += c.w; got += c.w * (c.st === "good" ? 1 : c.st === "ok" ? 0.5 : 0); });
    var score = tot ? Math.round(got / tot * 100) : 0;
    return { score: score, checks: out, title: title, desc: desc, wc: wc, size: Math.round((html.length + ($("bi").files[0] ? 0 : 0)) / 1024), kw: K };
  }
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "your-post"; }
  function render() {
    var r = analyze(); last = r;
    var col = r.score >= 80 ? "var(--accent)" : r.score >= 50 ? "#C98516" : "#D64545", word = r.score >= 80 ? "Good" : r.score >= 50 ? "Needs work" : "Weak";
    if (!r.wc && !r.title) { r.score = 0; word = "Start writing"; }
    var s = seoBox; s.textContent = "";
    s.appendChild(mk("h3", "", "SEO check"));
    var top = mk("div", "be-top"), ring = mk("div", "be-ring"); ring.style.setProperty("--p", r.score); ring.style.setProperty("--c", col); ring.appendChild(mk("b", "", r.score)); ring.appendChild(mk("span", "", "/100")); top.appendChild(ring);
    var vt = mk("div", ""); vt.appendChild(mk("strong", "", word)); vt.appendChild(mk("p", "", r.wc + " words · about " + Math.max(1, Math.round(r.wc / 200)) + " min read · " + r.size + " KB of text and pictures")); top.appendChild(vt); s.appendChild(top);
    if (r.size > 700) s.appendChild(mk("p", "be-err", "This post is heavy. Remove a picture or two so the blog page loads fast."));
    var sp = mk("div", "be-serp"); sp.appendChild(mk("small", "", "How it may look in Google"));
    sp.appendChild(mk("div", "be-st", (r.title || "Your post title").slice(0, 60) + (r.title.length > 60 ? "…" : "") + " | Academicstrata"));
    sp.appendChild(mk("div", "be-su", "academicstrata.com › blog › " + slug(r.title)));
    sp.appendChild(mk("div", "be-sd", (r.desc || "Your summary appears here.").slice(0, 160) + (r.desc.length > 160 ? "…" : ""))); s.appendChild(sp);
    if (!r.kw) s.appendChild(mk("p", "be-hint", "Type a focus keyword above to unlock the keyword checks."));
    var ul = mk("ul", "be-list"), ord = { bad: 0, ok: 1, na: 2, good: 3 };
    r.checks.slice().sort(function (a, b) { return ord[a.st] - ord[b.st]; }).forEach(function (c) {
      if (!c.msg) return;
      var li = mk("li", c.st); li.appendChild(mk("i", "", c.st === "good" ? "✓" : c.st === "bad" ? "✕" : c.st === "ok" ? "!" : "–")); var d = mk("div", ""); d.appendChild(mk("strong", "", c.name)); d.appendChild(mk("span", "", c.msg)); li.appendChild(d); ul.appendChild(li);
    });
    s.appendChild(ul);
    s.appendChild(mk("p", "be-note", "These checks cover how the post is written. Your post addresses use # (for example #post-123), and Google ignores everything after #, so each post cannot appear in search results on its own."));
    var tc = $("be-tc"), dc = $("be-dc"); if (tc) { tc.textContent = $("bt").value.length + "/60"; } if (dc) { dc.textContent = $("bs").value.length + "/160"; }
    $("be-stat").textContent = r.wc + " words · " + Math.max(1, Math.round(r.wc / 200)) + " min read";
  }
  function changed() { clearTimeout(timer); timer = setTimeout(function () { render(); draft(); }, 250); }
  ["bt", "bs", "bk", "bi", "bc"].forEach(function (i) { var e = $(i); if (e) { e.addEventListener("input", changed); e.addEventListener("change", changed); } });
  // ----- draft kept on this computer (new posts only)
  var DK = "as_blog_draft";
  function draft() {
    try {
      if (typeof editingId !== "undefined" && editingId) return;
      var h = getHtml(), t = $("bt").value;
      if (!h && !t) { localStorage.removeItem(DK); return; }
      localStorage.setItem(DK, JSON.stringify({ t: t, s: $("bs").value, k: $("bk").value, c: $("bc").value, h: h, at: Date.now() }));
    } catch (e) {}
  }
  try {
    var dr = JSON.parse(localStorage.getItem(DK) || "null");
    if (dr && (dr.h || dr.t)) {
      var bn = mk("div", "be-draft"); bn.appendChild(mk("span", "", "You have an unfinished draft from " + new Date(dr.at).toLocaleString() + "."));
      var rs = mk("button", "chip", "Restore it"), ds = mk("button", "chip", "Discard"); rs.type = ds.type = "button";
      rs.onclick = function () { $("bt").value = dr.t || ""; $("bs").value = dr.s || ""; $("bk").value = dr.k || ""; if (dr.c) $("bc").value = dr.c; setHtml(dr.h || ""); bn.remove(); };
      ds.onclick = function () { localStorage.removeItem(DK); bn.remove(); };
      bn.appendChild(rs); bn.appendChild(ds); area.parentNode.insertBefore(bn, $("be-tw").parentNode);
    }
  } catch (e) {}
  setHtml("");
  window.BlogEditor = {
    getHtml: getHtml, setHtml: setHtml, keyword: function () { return ($("bk").value || "").trim(); }, score: function () { render(); return last.score; },
    load: function (p) { $("bk").value = p.kw || ""; hasThumb = !!p.thumb; setHtml(p.html || bodyToHtml(p.body || "")); tab(false); },
    clear: function () { $("bk").value = ""; hasThumb = false; setHtml(""); tab(false); closePop(); try { localStorage.removeItem(DK); } catch (e) {} }
  };
  render();
})();
