import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { SCHOOL_SLUG } from "./lib/api";

// Every route in this app lives under /:slug (see App.tsx's basename) so
// the URL shape matches "one deployment, one school, its slug right in
// the path". Bounce a bare "/" (or anything outside that prefix) straight
// there instead of rendering a blank page outside the router's basename.
if (SCHOOL_SLUG && !window.location.pathname.startsWith(`/${SCHOOL_SLUG}`)) {
  window.location.replace(`/${SCHOOL_SLUG}${window.location.search}`);
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
