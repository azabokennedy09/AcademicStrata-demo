// Google Analytics (GA4) for Academicstrata.
// The site switches views with real paths (/blog, /resources, /contact and so on). app.js fires a
// "spa:route" event after every view change, and each one is sent as a page view.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-X349QW37F9", { send_page_view: false });

// Only the path is sent, never the part after a # sign. Sign-in and password-reset links put private
// codes there, and those must never reach Google.
function sendView() {
  gtag("event", "page_view", {
    page_title: document.title,
    page_location: location.origin + location.pathname,
    page_path: location.pathname
  });
}
window.addEventListener("spa:route", sendView);
