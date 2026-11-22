// Google Analytics (GA4) for Academic Strata.
// Every page now has its own address, so each page change is sent as a page view (addresses only, nothing private).
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-X349QW37F9", { send_page_view: false });
var lastPath = null;
function sendView() {
  var p = location.pathname;
  if (p === lastPath) return;
  lastPath = p;
  gtag("event", "page_view", { page_title: document.title, page_location: location.origin + p, page_path: p });
}
sendView();
window.addEventListener("routechange", sendView);
