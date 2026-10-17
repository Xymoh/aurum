import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
// Self-hosted fonts, bundled and served from the same origin as the site.
// Loading them from Google Fonts would send every visitor's IP address to
// Google before any consent, which EU courts have treated as a GDPR breach.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
// font-black asks for 900; 800 is the heaviest the family ships, and loading
// it beats letting the browser embolden 400 by hand.
import "@fontsource/jetbrains-mono/800.css";
import "./index.css";
import { initTheme } from "./lib/theme";

initTheme();

// A deploy replaces the hashed chunks an open tab still links to, and a lazy
// route that fails to load would leave a blank page. Reload once to pick up
// the new build; the timestamp stops a reload loop when the network is down.
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem("aurum:chunk-reload") ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem("aurum:chunk-reload", String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
