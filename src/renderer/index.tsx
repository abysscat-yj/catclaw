import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

console.log("[CatClaw Renderer] Starting...");
console.log("[CatClaw Renderer] window.catclaw:", typeof window.catclaw);

const container = document.getElementById("root");
if (!container) {
  document.body.innerHTML = "<h1>No root element</h1>";
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("[CatClaw Renderer] React mounted.");
  } catch (err) {
    console.error("[CatClaw Renderer] Mount error:", err);
    container.innerHTML = `<pre style="color:red;padding:20px">${err}</pre>`;
  }
}
