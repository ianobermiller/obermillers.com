import { useEffect } from "react";

import { ColorSchemeProvider } from "../theme/colorScheme";
import { MuseumsApp } from "./App";

export default function MuseumsPage() {
  useEffect(() => {
    document.title = "Museum Reciprocity - ASTC & AZA";
  }, []);

  return (
    <div className="museums min-h-dvh font-sans antialiased">
      <ColorSchemeProvider scopeClass="museums-theme" storageKey="museum-finder-theme">
        <MuseumsApp />
      </ColorSchemeProvider>
    </div>
  );
}
