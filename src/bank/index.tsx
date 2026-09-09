import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

import { ColorSchemeProvider } from "../theme/colorScheme";
import { App } from "./App";

import "@fontsource-variable/nunito/wght.css";
import "@fontsource-variable/fraunces/wght.css";

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

export default function BankPage() {
  useEffect(() => {
    document.title = "Family Bank";
    updateSW ??= registerSW({
      onNeedRefresh() {
        if (confirm("New version available. Reload?")) {
          void updateSW?.(true);
        }
      },
    });
  }, []);

  return (
    <div className="family-bank font-bank min-h-dvh">
      <ColorSchemeProvider storageKey="family-bank-theme">
        <App />
      </ColorSchemeProvider>
    </div>
  );
}
