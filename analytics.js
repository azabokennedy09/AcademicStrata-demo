// Google Analytics (GA4) for Academicstrata.
// The page switches views with #home, #blog, #resources and so on, so each view change is sent as a page view.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-X349QW37F9", { send_page_view: false });

// Only plain view names like #blog or #res-123 are sent. Sign-in and password-reset links put private
// codes after the # sign, and those must never reach Google.
function safeHash() {
  var h = location.hash || "";
  return /^#[A-Za-z0-9_-]{1,80}$/.test(h) ? h : "";
}
function sendView() {
  var h = safeHash();
  gtag("event", "page_view", {
    page_title: document.title,
    page_location: location.origin + location.pathname + h,
    page_path: location.pathname + h
  });
}
sendView();
window.addEventListener("hashchange", sendView);
