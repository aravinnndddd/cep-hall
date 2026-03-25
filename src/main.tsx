/**
 * @file main.tsx
 * @description Application entry point that mounts the React app to the DOM.
 * Initializes the React root and renders the App component in strict mode.
 *
 * Environment: Vite + React 19
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * Initialize and render the application
 * Uses React StrictMode to highlight potential issues during development
 */
const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found in HTML");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
