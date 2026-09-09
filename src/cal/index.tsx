import "@fontsource-variable/inter/wght.css";
import { useEffect } from "react";

import { App } from "./App";

export default function CalPage() {
  useEffect(() => {
    document.title = "Color Calendar";
  }, []);

  // The `dark:` variant resolves against an ancestor `.dark`, so the class has
  // to live on <html> for portalled modals and tooltips to pick up the theme.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.classList.toggle("dark", media.matches);
    };
    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      document.documentElement.classList.remove("dark");
    };
  }, []);

  return (
    <div className="bg-cc-page font-cc text-cc-text min-h-dvh antialiased">
      <App />
    </div>
  );
}
