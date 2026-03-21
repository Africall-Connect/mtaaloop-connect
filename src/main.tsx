// src/main.tsx
// Polyfill `global` and `process` for certain browser bundles (randombytes/simple-peer)
declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

window.global = window;
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import process from 'process';
window.process = process;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PusherProvider } from "./contexts/PusherContext.tsx";
import { initSecurity } from "./lib/security.ts";

// 🔒 Security initialization (HTTPS enforcement)
initSecurity();

createRoot(document.getElementById("root")!).render(
  <PusherProvider>
    <App />
  </PusherProvider>
);
