import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const THEMES = ["dark", "light", "system"] as const;

type Theme = (typeof THEMES)[number];

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  setTheme: (theme: Theme) => void;
  theme: Theme;
}

const initialState: ThemeProviderState = {
  setTheme: () => null,
  theme: "system",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null && isTheme(stored) ? stored : defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const mediaQuery = matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
      };
      listener();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    root.classList.add(theme);
    return undefined;
  }, [theme]);

  const applyTheme = useCallback(
    (next: Theme) => {
      localStorage.setItem(storageKey, next);
      setTheme(next);
    },
    [storageKey],
  );

  const value = useMemo(
    (): ThemeProviderState => ({ setTheme: applyTheme, theme }),
    [applyTheme, theme],
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeProviderContext);
}
