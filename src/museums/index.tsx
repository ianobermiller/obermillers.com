import { useEffect } from "react";

import { MuseumsApp } from "./App";
import { ThemeProvider } from "./lib/theme";

export default function MuseumsPage() {
  useEffect(() => {
    document.title = "Museum Reciprocity - ASTC & AZA";
  }, []);

  return (
    <div className="museums min-h-dvh font-sans antialiased">
      <ThemeProvider defaultTheme="system" storageKey="museum-finder-theme">
        <MuseumsApp />
      </ThemeProvider>
    </div>
  );
}
