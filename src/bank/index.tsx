import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

import { App } from "./App";
import { ThemeProvider } from "./components/ui/ThemeProvider";

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
    return () => {
      document.documentElement.classList.remove("light", "dark");
    };
  }, []);

  return (
    <div className="family-bank font-bank min-h-dvh">
      <ThemeProvider defaultTheme="system" storageKey="family-bank-theme">
        <App />
      </ThemeProvider>
    </div>
  );
}
