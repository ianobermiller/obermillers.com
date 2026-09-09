import { useEffect, useState } from "react";

import { App } from "./App";

export default function CalPage() {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    document.title = "Color Calendar";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className={dark ? "dark" : undefined}>
      <div className="min-h-dvh overflow-y-scroll bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <App />
      </div>
    </div>
  );
}
