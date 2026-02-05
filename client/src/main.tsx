import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAntiCloneProtection, addWatermark } from "./lib/antiClone";

try {
  initAntiCloneProtection();
  addWatermark();
} catch (e) {
  console.warn('[Security] Protection init skipped:', e);
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
