import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

import "./index.css";

const root = document.getElementById("app");

if (root === null) {
  throw new Error("Missing #app");
}

document.addEventListener(
  "wheel",
  (event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === "number") {
      event.target.blur();
    }
  },
  { capture: true, passive: true },
);

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
