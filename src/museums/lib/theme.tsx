import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const THEMES = ["dark", "light", "system"] as const;

type Theme = (typeof THEMES)[number];

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  setTheme: () => undefined,
  theme: "system",
});

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

const THEME_CLASS = "museums-theme";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "museum-finder-theme",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null && isTheme(stored) ? stored : defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add(THEME_CLASS);

    const apply = (next: "dark" | "light") => {
      root.classList.remove("light", "dark");
      root.classList.add(next);
    };

    if (theme === "system") {
      const mediaQuery = matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        apply(mediaQuery.matches ? "dark" : "light");
      };
      listener();
      mediaQuery.addEventListener("change", listener);
      return () => {
        mediaQuery.removeEventListener("change", listener);
        root.classList.remove(THEME_CLASS, "light", "dark");
      };
    }

    apply(theme);
    return () => {
      root.classList.remove(THEME_CLASS, "light", "dark");
    };
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
