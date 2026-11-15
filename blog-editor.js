// Blog editor for Academicstrata: WordPress-style writing, publishing and a Rank Math-style SEO panel.
// It relies on cleanHtml(), tx(), db, posts helpers and thumbData() from app.js. Everything is cleaned before it is saved or shown.
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var area = $("be-area"), bar = $("be-bar"), pop = $("be-pop");
  if (!area || !bar || typeof cleanHtml !== "function") return;
  var rng = null, last = { score: 0 }, curThumb = "", rmThumb = false, curStatus = "new", timer = 0, dev = "desktop", flt = "all", qry = "", MAXIMG = 6;
  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) {}
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function mk(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function val(i) { var e = $(i); return e ? e.value.trim() : ""; }
  function getHtml() { var b = cleanHtml(area.innerHTML), h = b.innerHTML.trim(); return (!tx(b) && !b.querySelector("img")) ? "" : h; }
  function setHtml(h) { area.innerHTML = h ? cleanHtml(h).innerHTML : "<p><br></p>"; area.querySelectorAll("figure").forEach(function (f) { f.contentEditable = "false"; }); changed(); }
  function bodyToHtml(t) {
    function inl(s) { return esc(s).replace(/\[([^\]]+)\]\((#[a-z0-9_~.-]+)\)/g, '<a href="$2">$1</a>'); }
    return String(t || "").split(/\n\n+/).map(function (b) {
      if (b.indexOf("### ") === 0) return "<h3>" + inl(b.slice(4)) + "</h3>";
      if (b.indexOf("## ") === 0) return "<h2>" + inl(b.slice(3)) + "</h2>";
      if (b.indexOf("- ") === 0) return "<ul>" + b.split("\n").map(function (l) { return "<li>" + inl(l.replace(/^- /, "")) + "</li>"; }).join("") + "</ul>";
      return "<p>" + inl(b).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }
  function statusOf(p) { return p.status === "draft" ? "draft" : (p.publishAt && p.publishAt > Date.now()) ? "scheduled" : "published"; }
  function localInput(ts) { if (!ts) return ""; var d = new Date(ts), z = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + "T" + z(d.getHours()) + ":" + z(d.getMinutes()); }
  function kws() { return val("bk").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean).slice(0, 5); }
  function tagList() { return val("be-tags").split(",").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 12); }
  function seoTitle() { var t = val("be-st") || "%title% | Academicstrata"; return t.replace(/%title%/g, val("bt")).replace(/%sitename%/g, "Academicstrata"); }

  // ---------- toolbar
  document.addEventListener("selectionchange", function () {
    var s = getSelection();
    if (s.rangeCount && area.contains(s.anchorNode)) {
      rng = s.getRangeAt(0).cloneRange();
      var n = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode, f = n.closest("h2,h3,h4,blockquote,pre");
      if ($("be-fmt")) $("be-fmt").value = f ? f.tagName.toLowerCase() : "p";
    }
  });
  function keep() { var s = getSelection(); if (s.rangeCount && area.contains(s.anchorNode)) rng = s.getRangeAt(0).cloneRange(); }
  function restore() { var s = getSelection(); if (document.activeElement === area && s.rangeCount && area.contains(s.anchorNode)) return; area.focus(); s.removeAllRanges(); if (rng) s.addRange(rng); }
  function cmd(c, v) { restore(); document.execCommand(c, false, v == null ? null : v); changed(); }
  function align(v) {
    restore(); var s = getSelection(), n = s.anchorNode; if (!n) return; n = n.nodeType === 1 ? n : n.parentNode;
    while (n && n.parentNode !== area) n = n.parentNode;
    if (n && n.nodeType === 1) { if (v === "left") n.removeAttribute("data-al"); else n.setAttribute("data-al", v); changed(); }
  }
  var fmt = mk("select"); fmt.id = "be-fmt"; fmt.setAttribute("aria-label", "Text style");
  [["p", "Paragraph"], ["h2", "Heading 2"], ["h3", "Heading 3"], ["h4", "Heading 4"], ["blockquote", "Quote"], ["pre", "Code"]].forEach(function (o) { var op = mk("option", "", o[1]); op.value = o[0]; fmt.appendChild(op); });
  fmt.onchange = function () { cmd("formatBlock", "<" + fmt.value + ">"); };
  bar.appendChild(fmt);
  [["B", "Bold (Ctrl+B)", function () { cmd("bold"); }], ["I", "Italic (Ctrl+I)", function () { cmd("italic"); }], ["U", "Underline (Ctrl+U)", function () { cmd("underline"); }], ["S", "Strikethrough", function () { cmd("strikeThrough"); }],
   ["x\u00b2", "Superscript", function () { cmd("superscript"); }], ["x\u2082", "Subscript", function () { cmd("subscript"); }], "|",
   ["\u2022 List", "Bulleted list", function () { cmd("insertUnorderedList"); }], ["1. List", "Numbered list", function () { cmd("insertOrderedList"); }], ["Indent", "Indent", function () { cmd("indent"); }], ["Outdent", "Outdent", function () { cmd("outdent"); }], "|",
   ["Left", "Align left", function () { align("left"); }], ["Centre", "Align centre", function () { align("center"); }], ["Right", "Align right", function () { align("right"); }], "|",
   ["Link", "Add or edit a link (Ctrl+K)", function () { openLink(); }], ["Unlink", "Remove link", function () { cmd("unlink"); }], ["Image", "Add a picture", function () { openImage(null); }], ["Table", "Add a table", function () { openTable(); }], ["Line", "Divider line", function () { cmd("insertHorizontalRule"); }], "|",
   ["Undo", "Undo", function () { cmd("undo"); }], ["Redo", "Redo", function () { cmd("redo"); }], ["Clear", "Clear formatting", function () { cmd("removeFormat"); cmd("formatBlock", "<p>"); }]].forEach(function (b) {
    if (b === "|") { bar.appendChild(mk("span", "be-sep")); return; }
    var x = mk("button", "be-b", b[0]); x.type = "button"; x.title = b[1]; x.setAttribute("aria-label", b[1]);
    if (b[0] === "B") x.style.fontWeight = "800"; if (b[0] === "I") x.style.fontStyle = "italic"; if (b[0] === "U") x.style.textDecoration = "underline"; if (b[0] === "S") x.style.textDecoration = "line-through";
    x.onmousedown = function (e) { e.preventDefault(); }; x.onclick = b[2]; bar.appendChild(x);
  });
  area.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openLink(); } });
  area.addEventListener("paste", function (e) {
    var cd = e.clipboardData; if (!cd) return; e.preventDefault();
    var img = [].filter.call(cd.files || [], function (f) { return /^image\//.test(f.type); })[0];
    if (img) { openImage(null, img); return; }
    var h = cd.getData("text/html"), t = cd.getData("text/plain");
    document.execCommand("insertHTML", false, h ? cleanHtml(h).innerHTML : t.split(/\n\n+/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join(""));
    changed();
  });
  area.addEventListener("dragover", function (e) { if (e.dataTransfer && [].some.call(e.dataTransfer.types || [], function (t) { return t === "Files"; })) e.preventDefault(); });
  area.addEventListener("drop", function (e) { var f = e.dataTransfer && [].filter.call(e.dataTransfer.files || [], function (x) { return /^image\//.test(x.type); })[0]; if (f) { e.preventDefault(); openImage(null, f); } });
  area.addEventListener("keyup", keep); area.addEventListener("mouseup", keep); area.addEventListener("blur", keep); area.addEventListener("input", changed);
  area.addEventListener("click", function (e) { var f = e.target.closest("figure"); if (f && area.contains(f)) openImage(f); });

  // ---------- panel under the toolbar (link, picture, table)
  function showPop(title, rows, actions) {
    pop.textContent = ""; pop.hidden = false; pop.appendChild(mk("strong", "", title));
    rows.forEach(function (r) { pop.appendChild(r); });
    var a = mk("div", "be-act"); actions.forEach(function (x) { var b = mk("button", x[2] ? "chip" : "btn", x[0]); b.type = "button"; b.onclick = x[1]; a.appendChild(b); }); pop.appendChild(a);
    var f = pop.querySelector("input"); if (f) f.focus();
  }
  function field(label, type, v, ph) { var l = mk("label", "", label), i = mk("input"); i.type = type || "text"; i.value = v || ""; if (ph) i.placeholder = ph; l.appendChild(i); l.input = i; return l; }
  function closePop() { pop.hidden = true; pop.textContent = ""; }
  function openLink() {
    var n = rng && rng.startContainer, el0 = n && (n.nodeType === 1 ? n : n.parentNode), a = el0 && el0.closest ? el0.closest("a") : null, collapsed = !rng || rng.collapsed;
    var u = field("Web address", "text", a ? a.getAttribute("href") : "", "https://example.com or /resources"), t = field("Link text", "text", "", "What the reader sees"), sel = mk("select"), msg = mk("p", "be-err");
    [["", "Or choose a page on this site\u2026"], ["/resources", "Resources"], ["/free", "Free Guides"], ["/premium", "Premium Guides"], ["/blog", "Blog"], ["/about", "About"], ["/team", "Our Team"], ["/faq", "FAQ"], ["/contact", "Contact"]].forEach(function (p) { var o = mk("option", "", p[1]); o.value = p[0]; sel.appendChild(o); });
    sel.onchange = function () { if (sel.value) u.input.value = sel.value; };
    var rows = [u, sel]; if (collapsed && !a) rows.push(t); rows.push(msg);
    showPop("Link", rows, [["Apply", function () {
      var v = u.input.value.trim();
      if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) v = "https://" + v;
      if (!/^(https?:\/\/\S+|mailto:\S+|#[A-Za-z0-9_~.-]+|\/[A-Za-z0-9_~.-]+)$/.test(v)) { msg.textContent = "Enter a web address such as https://example.com, or choose a page."; return; }
      restore();
      if (a) a.setAttribute("href", v);
      else if (collapsed) document.execCommand("insertHTML", false, '<a href="' + esc(v) + '">' + esc(t.input.value.trim() || v) + "</a>");
      else document.execCommand("createLink", false, v);
      closePop(); changed();
    }], ["Remove link", function () { restore(); document.execCommand("unlink"); closePop(); changed(); }, 1], ["Cancel", closePop, 1]]);
  }
  function openTable() {
    var r = field("Rows", "number", "3"), c = field("Columns", "number", "3"), msg = mk("p", "be-err");
    showPop("Add a table", [r, c, msg], [["Add table", function () {
      var R = Math.min(20, Math.max(1, +r.input.value || 0)), C = Math.min(8, Math.max(1, +c.input.value || 0)), h = "<table><tbody>";
      for (var i = 0; i < R; i++) { h += "<tr>"; for (var j = 0; j < C; j++) h += i === 0 ? "<th>Heading</th>" : "<td><br></td>"; h += "</tr>"; }
      restore(); document.execCommand("insertHTML", false, h + "</tbody></table><p><br></p>"); closePop(); changed();
    }], ["Cancel", closePop, 1]]);
  }
  function shrink(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var w = Math.min(900, im.width), q = 0.76, d, h, W;
          do { W = w; h = Math.round(im.height * w / im.width); var c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h); d = c.toDataURL("image/jpeg", q); w = Math.round(w * 0.85); q = 0.7; } while (d.length > 240000 && w > 420);
          res({ src: d, w: W, h: h });
        };
        im.onerror = rej; im.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  function openImage(fig, dropped) {
    var edit = !!fig, im = fig && fig.querySelector("img"), cap = fig && fig.querySelector("figcaption");
    var f = mk("label", "", "Choose a picture"), fi = mk("input"); fi.type = "file"; fi.accept = "image/*"; f.appendChild(fi); if (edit) f.hidden = true;
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
      msg.textContent = "Preparing the picture\u2026";
      try {
        var r = await shrink(file); restore();
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

  // ---------- Write / Preview tabs and the sidebar tabs
  function tab(prev) {
    $("be-tw").classList.toggle("on", !prev); $("be-tp").classList.toggle("on", prev);
    area.hidden = prev; bar.hidden = prev; closePop(); $("be-prev").hidden = !prev;
    if (prev) {
      var p = $("be-prev"); p.textContent = ""; p.appendChild(mk("h1", "", val("bt") || "Untitled post"));
      var b = cleanHtml(getHtml()); while (b.firstChild) p.appendChild(b.firstChild);
    }
  }
  $("be-tw").onclick = function () { tab(false); }; $("be-tp").onclick = function () { tab(true); };
  function sideTab(n) { [1, 2].forEach(function (i) { $("be-t" + i).classList.toggle("on", i === n); $("be-p" + i).hidden = i !== n; }); }
  $("be-t1").onclick = function () { sideTab(1); }; $("be-t2").onclick = function () { sideTab(2); };

  // ---------- SEO panel (Rank Math style)
  var p2 = $("be-p2");
  function lab(txt, el0, small) { var l = mk("label", "", ""); var s = mk("span", "", txt); if (small) { s.appendChild(document.createTextNode(" ")); var sm = mk("small"); sm.id = small; s.appendChild(sm); } l.appendChild(s); l.appendChild(el0); return l; }
  var top = mk("div", "be-top"); top.id = "be-top"; p2.appendChild(top);
  var kwIn = mk("input"); kwIn.id = "bk"; kwIn.placeholder = "e.g. UACE chemistry notes, revision tips";
  p2.appendChild(lab("Focus keywords (the first is the main one)", kwIn));
  var dv = mk("div", "be-dev"), b1 = mk("button", "chip on", "Desktop"), b2 = mk("button", "chip", "Mobile"); b1.type = b2.type = "button";
  b1.onclick = function () { dev = "desktop"; b1.classList.add("on"); b2.classList.remove("on"); render(); }; b2.onclick = function () { dev = "mobile"; b2.classList.add("on"); b1.classList.remove("on"); render(); };
  dv.appendChild(mk("strong", "", "Search preview")); dv.appendChild(b1); dv.appendChild(b2); p2.appendChild(dv);
  var serp = mk("div", "be-serp"); serp.id = "be-serp"; p2.appendChild(serp);
  var stIn = mk("input"); stIn.id = "be-st"; stIn.placeholder = "%title% | Academicstrata"; p2.appendChild(lab("SEO title", stIn, "be-sc"));
  var mdIn = mk("textarea"); mdIn.id = "be-md"; mdIn.rows = 3; mdIn.placeholder = "Leave empty to use the excerpt"; p2.appendChild(lab("Meta description", mdIn, "be-mc"));
  var niIn = mk("input"); niIn.type = "checkbox"; niIn.id = "be-ni"; var niL = mk("label", "be-chk"); niL.appendChild(niIn); niL.appendChild(document.createTextNode(" Hide this post from search engines (noindex)")); p2.appendChild(niL);
  var tests = mk("div", "be-tests"); tests.id = "be-tests"; p2.appendChild(tests);
  p2.appendChild(mk("p", "be-note", "Schema: Article details (title, date, author, tags) are added to each post automatically. Post addresses use #, and Google ignores everything after #, so each post cannot appear in search results on its own."));

  function syll(w) { w = w.toLowerCase().replace(/[^a-z]/g, ""); if (!w) return 0; if (w.length <= 3) return 1; w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, ""); var m = w.match(/[aeiouy]{1,2}/g); return m ? m.length : 1; }
  var POWER = ["best", "ultimate", "easy", "simple", "quick", "complete", "essential", "proven", "free", "guide", "tips", "how", "why", "new", "top", "secret", "step", "easily", "fast", "effective"];
  function analyze() {
    var K = kws(), kw = K[0] || "", title = val("bt"), st = seoTitle(), md = val("be-md") || val("bs"), html = getHtml(), box = cleanHtml(html), text = tx(box), words = text ? text.split(/\s+/) : [], wc = words.length, low = text.toLowerCase();
    var h2 = box.querySelectorAll("h2").length, subs = [].slice.call(box.querySelectorAll("h2,h3")).map(function (h) { return h.textContent.toLowerCase(); }), imgs = [].slice.call(box.querySelectorAll("img"));
    var links = [].slice.call(box.querySelectorAll("a[href]")), internal = links.filter(function (a) { var h = a.getAttribute("href"); return h.charAt(0) === "#" || h.charAt(0) === "/" || /academicstrata\.com/i.test(h); }).length, external = links.length - internal;
    var sent = text.split(/[.!?]+\s/).filter(function (s) { return s.trim().split(/\s+/).length > 2; }), long = sent.filter(function (s) { return s.split(/\s+/).length > 25; }).length;
    var syl = words.reduce(function (n, w) { return n + syll(w); }, 0), fre = wc && sent.length ? 206.835 - 1.015 * (wc / sent.length) - 84.6 * (syl / wc) : 0;
    var kwN = kw ? low.split(kw).length - 1 : 0, dens = kw && wc ? kwN * kw.split(/\s+/).length / wc * 100 : 0, first = words.slice(0, Math.max(30, Math.ceil(wc * 0.1))).join(" ").toLowerCase();
    var longP = [].filter.call(box.querySelectorAll("p"), function (p) { return tx(p).split(/\s+/).filter(Boolean).length > 120; }).length;
    var secs = 0, run = 0; [].forEach.call(box.children, function (n) { if (/^H[2-4]$/.test(n.tagName)) { secs = Math.max(secs, run); run = 0; } else run += tx(n).split(/\s+/).filter(Boolean).length; }); secs = Math.max(secs, run);
    var noAlt = imgs.filter(function (i) { return !(i.getAttribute("alt") || "").trim(); }).length, hasImg = imgs.length > 0 || !!curThumb || ($("bi").files && $("bi").files.length > 0);
    var dup = kw ? (typeof allPosts !== "undefined" ? allPosts : []).filter(function (p) { return p.id !== (typeof editingId !== "undefined" ? editingId : null) && String(p.kw || "").split(",")[0].trim().toLowerCase() === kw; }).length : 0;
    var G = { "Basic SEO": [], "Additional": [], "Title readability": [], "Content readability": [] };
    function T(g, w, st0, name, msg, nk) { G[g].push({ w: w, st: st0, name: name, msg: msg, nk: !!nk }); }
    function yn(c, good, bad) { return c ? good : bad; }
    T("Basic SEO", 8, kw && st.toLowerCase().indexOf(kw) >= 0 ? "good" : "bad", "Keyword in the SEO title", yn(kw && st.toLowerCase().indexOf(kw) >= 0, "The focus keyword is in the SEO title.", "Add the focus keyword to the SEO title."), 1);
    T("Basic SEO", 5, kw && md.toLowerCase().indexOf(kw) >= 0 ? "good" : "bad", "Keyword in the meta description", yn(kw && md.toLowerCase().indexOf(kw) >= 0, "The description uses the keyword.", "Use the focus keyword in the meta description."), 1);
    T("Basic SEO", 6, kw && first.indexOf(kw) >= 0 ? "good" : "bad", "Keyword at the start of the content", yn(kw && first.indexOf(kw) >= 0, "The keyword appears at the start.", "Use the keyword in the first 10% of the content."), 1);
    T("Basic SEO", 4, kwN > 0 ? "good" : "bad", "Keyword in the content", yn(kwN > 0, "The keyword is in the content.", "Use the focus keyword in the content."), 1);
    T("Basic SEO", 8, wc >= 600 ? "good" : wc >= 300 ? "ok" : "bad", "Content length", wc + " words. " + (wc >= 600 ? "A good length." : wc >= 300 ? "Aim for 600 or more words." : "Short posts rarely rank. Aim for at least 300 words, ideally 600."));
    T("Basic SEO", 5, val("be-md") || val("bs") ? (md.length >= 120 && md.length <= 160 ? "good" : md.length >= 70 && md.length <= 180 ? "ok" : "bad") : "bad", "Meta description length", md ? md.length + " characters. Aim for 120 to 160." : "Write a description of 120 to 160 characters.");
    T("Basic SEO", 5, st.length <= 60 && st.length >= 20 ? "good" : st.length <= 70 ? "ok" : "bad", "SEO title length", st.length + " characters. Aim for 60 or fewer so Google shows all of it.");
    T("Additional", 4, kw && subs.some(function (s) { return s.indexOf(kw) >= 0; }) ? "good" : "bad", "Keyword in a subheading", yn(kw && subs.some(function (s) { return s.indexOf(kw) >= 0; }), "A heading uses the keyword.", "Use the keyword in one Heading 2 or 3."), 1);
    T("Additional", 3, !imgs.length ? "ok" : imgs.some(function (i) { return (i.getAttribute("alt") || "").toLowerCase().indexOf(kw) >= 0; }) ? "good" : "bad", "Keyword in a picture description", !imgs.length ? "Add a picture with the keyword in its description." : "Put the keyword in one picture's description.", 1);
    T("Additional", 5, wc < 100 ? "ok" : dens >= 0.5 && dens <= 2.5 ? "good" : dens > 0 && dens <= 3.5 ? "ok" : "bad", "Keyword density", wc < 100 ? "Write more text first." : kwN + " use" + (kwN === 1 ? "" : "s") + " (" + dens.toFixed(1) + "% of the words). Aim for 0.5% to 2.5%.", 1);
    T("Additional", 3, dup ? "bad" : "good", "Keyword used before", dup ? "Another post already targets this keyword. Pick a different one." : "No other post uses this main keyword.", 1);
    T("Additional", 4, internal ? "good" : "bad", "Links to your own pages", internal ? internal + " link" + (internal === 1 ? "" : "s") + " to pages on this site." : "Link to at least one of your own pages, such as Resources.");
    T("Additional", 3, external ? "good" : "ok", "Links to other sites", external ? external + " link" + (external === 1 ? "" : "s") + " to other sites." : "A link to a trusted source adds credibility.");
    T("Title readability", 4, kw && st.toLowerCase().indexOf(kw) >= 0 && st.toLowerCase().indexOf(kw) <= st.length / 2 ? "good" : kw && st.toLowerCase().indexOf(kw) >= 0 ? "ok" : "bad", "Keyword near the start of the title", "Move the focus keyword closer to the start of the SEO title.", 1);
    T("Title readability", 2, /\d/.test(st) ? "good" : "ok", "Number in the title", /\d/.test(st) ? "The title has a number." : "Titles with a number, such as \"5 ways\", often get more clicks.");
    T("Title readability", 2, POWER.some(function (w) { return new RegExp("\\b" + w, "i").test(st); }) ? "good" : "ok", "Power word in the title", POWER.some(function (w) { return new RegExp("\\b" + w, "i").test(st); }) ? "The title has a strong word." : "Words like best, easy, simple or guide make titles more appealing.");
    T("Content readability", 3, h2 >= 2 ? "good" : "ok", "Table of contents", h2 >= 2 ? "Your post gets an automatic table of contents." : "Add at least 2 Heading 2 sections and a table of contents appears on the post.");
    T("Content readability", 4, longP ? "bad" : "good", "Short paragraphs", longP ? longP + " paragraph" + (longP === 1 ? " is" : "s are") + " over 120 words. Split them." : "Paragraphs are a comfortable length.");
    T("Content readability", 4, secs > 250 ? "bad" : secs > 180 ? "ok" : "good", "Headings spread out", secs > 180 ? "One section runs about " + secs + " words with no heading. Add a subheading." : "Headings break the text up well.");
    T("Content readability", 4, hasImg ? "good" : "bad", "Pictures", hasImg ? "The post has a picture." : "Add a featured image or a picture.");
    T("Content readability", 3, !imgs.length ? "ok" : noAlt ? "bad" : "good", "Picture descriptions", !imgs.length ? "Describe each picture you add (alt text)." : noAlt ? noAlt + " picture" + (noAlt === 1 ? " has" : "s have") + " no description." : "Every picture has a description.");
    T("Content readability", 4, !wc ? "ok" : fre >= 60 ? "good" : fre >= 45 ? "ok" : "bad", "Reading ease", wc ? "Score " + Math.max(0, Math.round(fre)) + "/100 (60 or more is easy). Use shorter words and sentences." : "Write some text first.");
    T("Content readability", 2, !wc ? "ok" : long / Math.max(1, sent.length) <= 0.15 ? "good" : long / sent.length <= 0.3 ? "ok" : "bad", "Sentence length", wc ? long + " of " + sent.length + " sentences are over 25 words." : "Write some text first.");
    var tot = 0, got = 0, err = 0, warn = 0, pass = 0;
    Object.keys(G).forEach(function (g) { G[g].forEach(function (c) {
      if (c.nk && !K.length) { c.st = "na"; c.msg = "Add a focus keyword to check this."; return; }
      if (c.nk && c.name === "Keyword in a picture description" && !imgs.length) { c.st = "ok"; }
      tot += c.w; got += c.w * (c.st === "good" ? 1 : c.st === "ok" ? 0.5 : 0);
      if (c.st === "bad") err++; else if (c.st === "ok") warn++; else pass++;
    }); });
    var score = (!wc && !title) ? 0 : (tot ? Math.round(got / tot * 100) : 0);
    return { score: score, groups: G, err: err, warn: warn, pass: pass, wc: wc, size: Math.round(html.length / 1024), K: K, title: title, st: st, md: md };
  }
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "your-post"; }
  function render() {
    var r = analyze(); last = r;
    var col = r.score >= 81 ? "var(--accent)" : r.score >= 51 ? "#C98516" : "#D64545", word = !r.wc && !r.title ? "Start writing" : r.score >= 81 ? "Good" : r.score >= 51 ? "Needs work" : "Weak";
    var t = $("be-top"); t.textContent = "";
    var ring = mk("div", "be-ring"); ring.style.setProperty("--p", r.score); ring.style.setProperty("--c", col); ring.appendChild(mk("b", "", r.score)); ring.appendChild(mk("span", "", "/100")); t.appendChild(ring);
    var vt = mk("div", ""); vt.appendChild(mk("strong", "", word)); vt.appendChild(mk("p", "", r.err + " to fix · " + r.warn + " to improve · " + r.pass + " passed")); vt.appendChild(mk("p", "", r.wc + " words · about " + Math.max(1, Math.round(r.wc / 200)) + " min read · " + r.size + " KB")); t.appendChild(vt);
    var pill = $("be-pill"); pill.textContent = "SEO " + r.score; pill.style.background = col;
    var s = $("be-serp"); s.textContent = ""; s.className = "be-serp " + dev;
    var lim = dev === "mobile" ? 54 : 60, dl = dev === "mobile" ? 120 : 160;
    s.appendChild(mk("div", "be-su", "academicstrata.com \u203a blog \u203a " + slug(r.title)));
    s.appendChild(mk("div", "be-stt", (r.st.length > lim ? r.st.slice(0, lim) + "\u2026" : r.st)));
    s.appendChild(mk("div", "be-sd", (r.md ? (r.md.length > dl ? r.md.slice(0, dl) + "\u2026" : r.md) : "Your meta description appears here.")));
    $("be-sc").textContent = r.st.length + "/60"; $("be-mc").textContent = r.md.length + "/160";
    $("be-dc").textContent = val("bs").length + "/160"; $("be-tc").textContent = val("bt").length + "/60";
    var T0 = $("be-tests"); T0.textContent = "";
    if (!r.K.length) T0.appendChild(mk("p", "be-hint", "Type a focus keyword above to unlock the keyword checks."));
    else if (r.K.length > 1) { var ex = mk("p", "be-hint", "Other keywords: " + r.K.slice(1).map(function (k) { var n = (tx(cleanHtml(getHtml())).toLowerCase().split(k).length - 1); return k + " (" + n + ")"; }).join(", ")); T0.appendChild(ex); }
    var ord = { bad: 0, ok: 1, na: 2, good: 3 };
    Object.keys(r.groups).forEach(function (g) {
      var list = r.groups[g], bad = list.filter(function (c) { return c.st === "bad"; }).length, ok = list.filter(function (c) { return c.st === "ok"; }).length;
      var d = mk("details", "be-grp"); if (bad || ok) d.open = true;
      var sm = mk("summary", ""); sm.appendChild(mk("span", "", g)); sm.appendChild(mk("em", "", bad ? bad + " to fix" : ok ? ok + " to improve" : "All good")); d.appendChild(sm);
      var ul = mk("ul", "be-list"); list.slice().sort(function (a, b) { return ord[a.st] - ord[b.st]; }).forEach(function (c) {
        var li = mk("li", c.st); li.appendChild(mk("i", "", c.st === "good" ? "\u2713" : c.st === "bad" ? "\u2715" : c.st === "ok" ? "!" : "\u2013")); var x = mk("div", ""); x.appendChild(mk("strong", "", c.name)); x.appendChild(mk("span", "", c.msg)); li.appendChild(x); ul.appendChild(li);
      });
      d.appendChild(ul); T0.appendChild(d);
    });
    $("be-stat").textContent = r.wc + " words \u00b7 " + Math.max(1, Math.round(r.wc / 200)) + " min read";
    stateText();
  }
  function changed() { clearTimeout(timer); timer = setTimeout(function () { render(); draft(); }, 250); }
  ["bt", "bs", "bk", "be-st", "be-md", "be-ni", "be-tags", "be-au", "be-when", "bc", "bi"].forEach(function (i) { var e = $(i); if (e) { e.addEventListener("input", changed); e.addEventListener("change", changed); } });

  // ---------- featured image
  $("bi").addEventListener("change", function () {
    var f = this.files[0]; if (!f || !/^image\//.test(f.type)) return;
    var fr = new FileReader(); fr.onload = function () { $("be-fi").src = fr.result; $("be-fi").hidden = false; $("be-fr").hidden = false; rmThumb = false; }; fr.readAsDataURL(f);
  });
  $("be-fr").onclick = function () { $("bi").value = ""; $("be-fi").hidden = true; $("be-fi").removeAttribute("src"); this.hidden = true; curThumb = ""; rmThumb = true; changed(); };
  function showThumb(src) { var im = $("be-fi"); if (src) { im.src = src; im.hidden = false; $("be-fr").hidden = false; } else { im.hidden = true; im.removeAttribute("src"); $("be-fr").hidden = true; } }

  // ---------- publishing
  function stateText() {
    var w = val("be-when") ? new Date(val("be-when")).getTime() : 0, now = Date.now(), pub = $("be-pub"), s = $("be-state");
    var sched = w > now;
    pub.textContent = sched ? (curStatus === "scheduled" ? "Update schedule" : "Schedule") : curStatus === "published" ? "Update" : "Publish";
    s.textContent = "Status: " + (curStatus === "new" ? "new post (not saved yet)" : curStatus === "draft" ? "draft (hidden from visitors)" : curStatus === "scheduled" ? "scheduled" : "published") + (sched ? " \u00b7 goes live " + new Date(w).toLocaleString() : "");
  }
  async function save(kind) {
    var m = $("bm"), t = val("bt"), hx = getHtml(), body = tx(cleanHtml(hx)), f = $("bi").files[0], old = null;
    if (!t) { m.textContent = "Add a title first."; return; }
    if (kind === "publish" && !body) { m.textContent = "Write the article first."; return; }
    if (f && !/^image\//.test(f.type)) { m.textContent = "The featured image must be a picture."; return; }
    if (typeof db === "undefined" || !db) { m.textContent = "The database is not connected."; return; }
    if (editingId) old = (allPosts || []).filter(function (x) { return x.id === editingId; })[0] || null;
    var now = Date.now(), when = val("be-when") ? new Date(val("be-when")).getTime() : 0, status = kind === "draft" ? "draft" : (when > now ? "scheduled" : "published");
    var sc = BlogEditor.score(), rec = { title: t, category: $("bc").value, summary: val("bs") || body.slice(0, 120), body: body, html: hx, kw: val("bk"), tags: tagList(), author: val("be-au"), seoTitle: val("be-st") ? seoTitle() : "", metaDesc: val("be-md"), noindex: $("be-ni").checked, seo: sc, status: status, publishAt: status === "scheduled" ? when : 0, updatedAt: now };
    try {
      m.textContent = "Saving\u2026";
      if (f) rec.thumb = await thumbData(f); else if (rmThumb) rec.thumb = ""; else rec.thumb = old ? (old.thumb || "") : curThumb || "";
      rec.createdAt = old ? (old.status === "draft" && status === "published" ? now : status === "scheduled" ? when : (old.createdAt || now)) : (status === "scheduled" ? when : now);
      if (editingId) await db.collection("posts").doc(editingId).update(rec); else await db.collection("posts").add(rec);
      m.textContent = status === "draft" ? "Draft saved. It is hidden from visitors." : status === "scheduled" ? "Scheduled for " + new Date(when).toLocaleString() + "." : (old && statusOf(old) === "published" ? "Updated." : "Published.");
      if (status === "draft") {
        if (!editingId) {
          for (var i = 0; i < 12 && !editingId; i++) { await new Promise(function (r) { setTimeout(r, 400); }); var fnd = (allPosts || []).filter(function (x) { return x.createdAt === rec.createdAt && x.title === t; })[0]; if (fnd) editingId = fnd.id; }
          if (editingId) { document.getElementById("bh").textContent = "Edit post"; document.getElementById("bx").hidden = false; } else { resetPost(); return; }
        }
        curStatus = "draft"; curThumb = rec.thumb; rmThumb = false; if ($("bi").value) $("bi").value = ""; showThumb(curThumb); stateText();
      } else resetPost();
    } catch (e) { m.textContent = "Could not save. Try again."; }
  }
  $("be-sd").onclick = function () { save("draft"); }; $("be-pub").onclick = function () { save("publish"); };

  // ---------- posts screen
  function editPost(p) {
    editingId = p.id; $("bt").value = p.title; var bcs = $("bc");
    if (p.category && ![].some.call(bcs.options, function (o) { return o.value === p.category; })) { var oo = document.createElement("option"); oo.textContent = p.category; bcs.appendChild(oo); }
    bcs.value = p.category; $("bs").value = p.summary || ""; clearFile(); editBody = p.body || ""; $("bb").value = p.body || "";
    BlogEditor.load(p); $("bh").textContent = "Edit post"; $("bx").hidden = false; $("bt").scrollIntoView();
  }
  function plBar() {
    var P = $("plist"); if (P.querySelector(".pl-bar")) return; P.textContent = "";
    var b = mk("div", "pl-bar"), q = mk("input"); q.type = "search"; q.placeholder = "Search your posts\u2026"; q.setAttribute("aria-label", "Search your posts"); q.oninput = function () { qry = q.value.trim().toLowerCase(); renderPlist(); };
    var f = mk("div", "pl-f"); f.id = "pl-f"; b.appendChild(f); b.appendChild(q); P.appendChild(b); P.appendChild(mk("div", "pl-list")).id = "pl-list";
  }
  window.renderPlist = function () {
    var P = $("plist"); if (!P) return; plBar();
    var all = (typeof allPosts !== "undefined" ? allPosts : []).slice(), cnt = { all: all.length, published: 0, draft: 0, scheduled: 0 };
    all.forEach(function (p) { cnt[statusOf(p)]++; });
    var F = $("pl-f"); F.textContent = "";
    [["all", "All"], ["published", "Published"], ["draft", "Drafts"], ["scheduled", "Scheduled"]].forEach(function (x) { var b = mk("button", "chip" + (flt === x[0] ? " on" : ""), x[1] + " (" + cnt[x[0]] + ")"); b.type = "button"; b.onclick = function () { flt = x[0]; renderPlist(); }; F.appendChild(b); });
    var L = $("pl-list"); L.textContent = "";
    var rows = all.filter(function (p) { return (flt === "all" || statusOf(p) === flt) && (!qry || (p.title + " " + (p.category || "") + " " + (p.tags || []).join(" ")).toLowerCase().indexOf(qry) >= 0); });
    if (!rows.length) L.appendChild(mk("p", "", all.length ? "No posts match." : "No posts yet."));
    rows.forEach(function (p) {
      var st = statusOf(p), row = mk("div", "card pl-row"); row.style.marginTop = "10px";
      var h = mk("h3", "", p.title); row.appendChild(h);
      var meta = mk("p", "pl-meta"); var bd = mk("span", "pl-badge " + st, st === "draft" ? "Draft" : st === "scheduled" ? "Scheduled" : "Published"); meta.appendChild(bd);
      meta.appendChild(document.createTextNode(" " + (p.category || "") + " \u00b7 " + new Date(p.createdAt || 0).toLocaleDateString()));
      if (p.seo) { var sp = mk("span", "pl-seo " + (p.seo >= 81 ? "g" : p.seo >= 51 ? "o" : "r"), "SEO " + p.seo); meta.appendChild(document.createTextNode(" ")); meta.appendChild(sp); }
      row.appendChild(meta);
      var act = mk("div", "row");
      function btn(txt, fn) { var b = mk("button", "chip", txt); b.type = "button"; b.onclick = fn; act.appendChild(b); return b; }
      btn("Edit", function () { editPost(p); });
      if (st === "published") btn("View", function () { go("post-" + p.id); });
      btn("Duplicate", async function () { var c = Object.assign({}, p); delete c.id; c.title = p.title + " (copy)"; c.status = "draft"; c.createdAt = Date.now(); c.publishAt = 0; try { await db.collection("posts").add(c); } catch (e) {} });
      btn(st === "draft" ? "Publish" : "Move to drafts", async function () { try { await db.collection("posts").doc(p.id).update(st === "draft" ? { status: "published", publishAt: 0, createdAt: Date.now() } : { status: "draft" }); } catch (e) {} });
      var dx = btn("Delete", async function () {
        if (!dx.dataset.sure) { dx.dataset.sure = "1"; dx.textContent = "Click again to confirm"; setTimeout(function () { dx.dataset.sure = ""; dx.textContent = "Delete"; }, 4000); return; }
        try { await db.collection("posts").doc(p.id).delete(); allPosts = allPosts.filter(function (x) { return x.id !== p.id; }); posts = allPosts.filter(isLive); renderPosts(); } catch (e) { dx.textContent = "Could not delete"; }
      });
      row.appendChild(act); L.appendChild(row);
    });
  };

  // ---------- draft kept on this computer (new posts only)
  var DK = "as_blog_draft";
  function draft() {
    try {
      if (typeof editingId !== "undefined" && editingId) return;
      var h = getHtml(), t = val("bt");
      if (!h && !t) { localStorage.removeItem(DK); return; }
      localStorage.setItem(DK, JSON.stringify({ t: t, s: val("bs"), k: val("bk"), c: $("bc").value, tg: val("be-tags"), au: val("be-au"), st: val("be-st"), md: val("be-md"), h: h, at: Date.now() }));
    } catch (e) {}
  }
  try {
    var dr = JSON.parse(localStorage.getItem(DK) || "null");
    if (dr && (dr.h || dr.t)) {
      var bn = mk("div", "be-draft"); bn.appendChild(mk("span", "", "You have an unfinished draft from " + new Date(dr.at).toLocaleString() + "."));
      var rs = mk("button", "chip", "Restore it"), ds = mk("button", "chip", "Discard"); rs.type = ds.type = "button";
      rs.onclick = function () { $("bt").value = dr.t || ""; $("bs").value = dr.s || ""; $("bk").value = dr.k || ""; $("be-tags").value = dr.tg || ""; $("be-au").value = dr.au || ""; $("be-st").value = dr.st || ""; $("be-md").value = dr.md || ""; if (dr.c) $("bc").value = dr.c; setHtml(dr.h || ""); bn.remove(); };
      ds.onclick = function () { localStorage.removeItem(DK); bn.remove(); };
      bn.appendChild(rs); bn.appendChild(ds); area.parentNode.insertBefore(bn, $("be-tw").parentNode);
    }
  } catch (e) {}
  addEventListener("spa:route", function () { if (location.pathname.indexOf("/post-") !== 0) { var r = document.querySelector('meta[name="robots"]'); if (r) r.remove(); } });
  setHtml("");
  window.BlogEditor = {
    getHtml: getHtml, setHtml: setHtml, keyword: function () { return val("bk"); }, score: function () { render(); return last.score; },
    load: function (p) {
      $("bk").value = p.kw || ""; $("be-tags").value = (p.tags || []).join(", "); $("be-au").value = p.author || ""; $("be-st").value = p.seoTitle || ""; $("be-md").value = p.metaDesc || ""; $("be-ni").checked = !!p.noindex;
      $("be-when").value = p.status === "scheduled" || (p.publishAt && p.publishAt > Date.now()) ? localInput(p.publishAt) : ""; curStatus = statusOf(p); curThumb = p.thumb || ""; rmThumb = false; showThumb(curThumb);
      setHtml(p.html || bodyToHtml(p.body || "")); tab(false); sideTab(1);
    },
    clear: function () {
      ["bk", "be-tags", "be-au", "be-st", "be-md", "be-when"].forEach(function (i) { $(i).value = ""; }); $("be-ni").checked = false; curStatus = "new"; curThumb = ""; rmThumb = false; showThumb(""); $("bi").value = "";
      setHtml(""); tab(false); closePop(); try { localStorage.removeItem(DK); } catch (e) {}
    }
  };
  render();
})();
