// Cloudflare Worker for academicstrata.com
// Runs in front of the static files. It redirects the default workers.dev
// address, blocks files that should never be public, allows only safe request
// methods, and makes sure the security headers are always present.

const CANONICAL_HOST = "academicstrata.com";

// Paths that must never be served, even if they end up in the upload folder.
const BLOCKED = [
  /^\/\./,                                   // dotfiles such as /.env or /.git
  /^\/(readme|security)\.md$/i,
  /^\/(setup|update-[0-9a-z-]+)\.sql$/i,     // database scripts
  /^\/(wrangler\.jsonc?|worker\.js|package(-lock)?\.json)$/i,
  /^\/check\.(html|js)$/i,                   // connection check page
  /^\/version\.txt$/i,
  /^\/(node_modules|\.github)(\/|$)/i,
];

// Used only when a response does not already carry the header (the _headers
// file stays the main place to edit these).
const FALLBACK_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "X-Permitted-Cross-Domain-Policies": "none",
};

function withSecurityHeaders(response) {
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(FALLBACK_HEADERS)) {
    if (!out.headers.has(name)) out.headers.set(name, value);
  }
  return out;
}

function plain(status, text, extra) {
  return withSecurityHeaders(
    new Response(text, {
      status,
      headers: Object.assign({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, extra || {}),
    })
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Redirect the default Cloudflare address and www to the real domain.
    if (url.hostname.endsWith(".workers.dev") || url.hostname === "www." + CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    // 2. A static website only needs GET, HEAD and OPTIONS.
    if (request.method !== "GET" && request.method !== "HEAD") {
      return plain(405, "Method not allowed", { Allow: "GET, HEAD" });
    }

    // 3. Never serve private or internal files.
    let path;
    try {
      path = decodeURIComponent(url.pathname);
    } catch (e) {
      return plain(400, "Bad request");
    }
    if (path.includes("..") || path.includes("\\") || path.includes("\0")) {
      return plain(400, "Bad request");
    }
    if (BLOCKED.some((re) => re.test(path))) {
      return plain(404, "Not found");
    }

    // 4. Serve the website normally, with security headers guaranteed.
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
