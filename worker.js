
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Redirect the default Cloudflare address
    if (
      url.hostname ===
      "academicstrata.azabokennedy09.workers.dev"
    ) {
      url.hostname = "academicstrata.com";

      return Response.redirect(url.toString(), 301);
    }

    // Serve the website normally on the custom domain
    return env.ASSETS.fetch(request);
  }
};
