(async function () {
  var out = document.getElementById("out"), L = [];
  function log(s) { L.push(s); out.textContent = L.join("\n"); }
  try {
    log("Config URL: " + window.SUPABASE_URL);
    log("Config key set: " + (!!window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY.indexOf("PASTE") < 0));
    if (!window.supabase) { log("FAIL: the Supabase library did not load (blocked or offline)."); return; }
    var sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    var r = await sb.from("docs").select("id,collection").limit(1000);
    if (r.error) { log("docs table: ERROR " + (r.error.code || "") + " " + r.error.message); }
    else {
      var t = {}; r.data.forEach(function (x) { t[x.collection] = (t[x.collection] || 0) + 1; });
      log("docs table: OK, " + r.data.length + " rows");
      Object.keys(t).forEach(function (k) { log("  " + k + ": " + t[k]); });
      if (!r.data.length) log("  (table is empty, or the read rule hides every row from visitors)");
    }
    var c = await sb.from("download_counts").select("resource_id,n").limit(5);
    log("download_counts: " + (c.error ? "ERROR " + (c.error.code || "") + " " + c.error.message : "OK, " + c.data.length + " rows"));
    var b = await sb.storage.from("files").list("", { limit: 5 });
    log("storage bucket 'files': " + (b.error ? "ERROR " + b.error.message : "reachable, " + b.data.length + " visible entries"));
  } catch (e) { log("FAIL: " + (e && e.message ? e.message : e)); }
})();
