import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ColorScheme = "dark" | "light";

/** `system` means "nothing stored, follow the OS", not a third stored value. */
export type ColorSchemePreference = ColorScheme | "system";

interface ColorSchemeState {
  preference: ColorSchemePreference;
  /** The scheme actually on screen right now. */
  resolved: ColorScheme;
  setPreference: (preference: ColorSchemePreference) => void;
  system: ColorScheme;
  /**
   * Flip to the opposite of what is on screen, dropping the stored override
   * when that lands back on the OS setting. See ColorSchemeToggle.
   */
  toggle: () => void;
}

const ColorSchemeContext = createContext<ColorSchemeState>({
  preference: "system",
  resolved: "light",
  setPreference: () => undefined,
  system: "light",
  toggle: () => undefined,
});

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

function getSystemScheme(): ColorScheme {
  return matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
}

function subscribeToSystemScheme(onChange: () => void) {
  const media = matchMedia(SYSTEM_QUERY);
  media.addEventListener("change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
  };
}

function readOverride(storageKey: string): ColorScheme | null {
  const stored = localStorage.getItem(storageKey);
  if (stored === "dark" || stored === "light") return stored;
  // Earlier builds persisted the literal "system", which is now the absence of
  // a value. Drop it so the key only ever holds a real override.
  if (stored !== null) localStorage.removeItem(storageKey);
  return null;
}

export function ColorSchemeProvider({
  children,
  scopeClass,
  storageKey,
}: {
  children: ReactNode;
  /**
   * Extra class for apps whose tokens have to outrank another SPA's `:root`
   * defaults while mounted (museums). Added to <html> alongside the scheme.
   */
  scopeClass?: string;
  storageKey: string;
}) {
  const [override, setOverride] = useState<ColorScheme | null>(() => readOverride(storageKey));
  const system = useSyncExternalStore(subscribeToSystemScheme, getSystemScheme);
  const resolved = override ?? system;

  useEffect(() => {
    // The `dark:` variant resolves against an ancestor `.dark`, so the class has
    // to live on <html> for portalled modals and tooltips to pick up the scheme.
    const root = document.documentElement;
    if (scopeClass !== undefined) root.classList.add(scopeClass);
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;

    return () => {
      root.classList.remove("light", "dark");
      root.style.removeProperty("color-scheme");
      if (scopeClass !== undefined) root.classList.remove(scopeClass);
    };
  }, [resolved, scopeClass]);

  const setPreference = useCallback(
    (next: ColorSchemePreference) => {
      if (next === "system") {
        localStorage.removeItem(storageKey);
        setOverride(null);
        return;
      }
      localStorage.setItem(storageKey, next);
      setOverride(next);
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    const target = resolved === "dark" ? "light" : "dark";
    // Collapsing an override back into "follow the OS" only ever happens here,
    // on an explicit press. Doing it when the OS itself flips would silently
    // unpin a scheme the user chose, which matters for anyone whose OS switches
    // on a schedule.
    setPreference(target === getSystemScheme() ? "system" : target);
  }, [resolved, setPreference]);

  const value = useMemo(
    (): ColorSchemeState => ({
      preference: override ?? "system",
      resolved,
      setPreference,
      system,
      toggle,
    }),
    [override, resolved, setPreference, system, toggle],
  );

  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
}

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
