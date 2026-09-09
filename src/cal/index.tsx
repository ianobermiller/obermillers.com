import "@fontsource-variable/inter/wght.css";
import { useEffect } from "react";

import { ColorSchemeProvider } from "../theme/colorScheme";
import { App } from "./App";

export default function CalPage() {
  useEffect(() => {
    document.title = "Color Calendar";
  }, []);

  return (
    <ColorSchemeProvider storageKey="color-calendar-theme">
      <div className="bg-cc-page font-cc text-cc-text min-h-dvh antialiased">
        <App />
      </div>
    </ColorSchemeProvider>
  );
}
