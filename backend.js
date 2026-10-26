// Connects the site to Supabase (login, database, file storage).
(function () {
  var ok = window.SUPABASE_URL && /^https:\/\//.test(window.SUPABASE_URL) && window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY.indexOf("PASTE") < 0;
  if (!ok) {
    window.claude = { use: async function () { return null; } };
    var fail = async function () { throw new Error("The site is not connected to its database yet. Add your Supabase URL and key to config.js (see README, step 1)."); };
    window.SS = { signIn: fail, signUp: fail, signOut: fail, url: fail, grant: fail };
    window.addEventListener("DOMContentLoaded", function () {
      var b = document.createElement("div");
      b.setAttribute("role", "alert");
      b.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:100;background:#b00020;color:#fff;padding:10px 16px;font:600 14px sans-serif;text-align:center";
      b.textContent = "Setup needed: add your Supabase URL and key to config.js, then upload the folder again (see README, step 1).";
      document.body.appendChild(b);
    });
    return;
  }
  var sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  var session = null, profile = null;
  var ready = (async function () {
    try {
      var r = await sb.auth.getSession(); session = r.data.session;
      if (session) {
        var p = await sb.from("profiles").select("role,premium").eq("id", session.user.id).single();
        profile = p.data || { role: "member", premium: false };
      }
    } catch (e) {}
  })();

  function makeDb() {
    return {
      collection: function (c) {
        return {
          onSnapshot: function (next, err) {
            var alive = true;
            var load = async function () {
              var r = await sb.from("docs").select("id,data,created_at").eq("collection", c).order("created_at", { ascending: false });
              if (r.error) { if (err) err(r.error); return; }
              if (alive) next({ docs: r.data.map(function (x) { return { id: x.id, data: function () { return x.data; } }; }) });
            };
            load();
            var timer = setInterval(load, 30000);
            var ch = sb.channel("docs-" + c + "-" + Math.random()).on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: "collection=eq." + c }, load).subscribe();
            return function () { alive = false; clearInterval(timer); sb.removeChannel(ch); };
          },
          add: async function (o) { var r = await sb.from("docs").insert({ collection: c, data: o }); if (r.error) throw r.error; },
          doc: function (id) {
            return {
              delete: async function () { var r = await sb.from("docs").delete().eq("id", id); if (r.error) throw r.error; },
              update: async function (patch) {
                var g = await sb.from("docs").select("data").eq("id", id).single(); if (g.error) throw g.error;
                var u = await sb.from("docs").update({ data: Object.assign({}, g.data.data, patch) }).eq("id", id); if (u.error) throw u.error;
              }
            };
          }
        };
      }
    };
  }

  window.claude = {
    use: async function (name) {
      await ready;
      if (name === "user") return {
        canEdit: function () { return !!profile && profile.role === "admin"; },
        isMember: function () { return !!session; },
        premium: function () { return !!profile && (profile.premium || profile.role === "admin"); },
        email: function () { return session ? session.user.email : ""; }
      };
      if (name === "db") return makeDb();
      if (name === "assets") return session ? {
        upload: async function (f) {
          var ext = f.name.split(".").pop().toLowerCase();
          var path = session.user.id + "/" + crypto.randomUUID() + "." + ext;
          var r = await sb.storage.from("files").upload(path, f, { contentType: f.type });
          if (r.error) throw r.error;
          return { id: path, url: "", sizeBytes: f.size };
        },
        delete: async function (id) { await sb.storage.from("files").remove([id]); }
      } : null;
      return null;
    }
  };

  window.SS = {
    signIn: async function (email, password) { var r = await sb.auth.signInWithPassword({ email: email, password: password }); if (r.error) throw r.error; return {}; },
    signUp: async function (email, password) { var r = await sb.auth.signUp({ email: email, password: password }); if (r.error) throw r.error; return { confirm: !r.data.session }; },
    signOut: async function () { await sb.auth.signOut(); location.reload(); },
    url: async function (path, download) {
      var r = await sb.storage.from("files").createSignedUrl(path, 120, download ? { download: true } : undefined);
      if (r.error) throw r.error; return r.data.signedUrl;
    },
    grant: async function (email, flag) {
      var r = await sb.from("profiles").update({ premium: flag }).eq("email", email).select("id");
      if (r.error) throw r.error; return r.data.length;
    }
  };
})();
