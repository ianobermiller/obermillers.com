import { useEffect, useState } from "react";

// Keep in sync with tailwind.config.js
const breakpoints = {
  "2xl": "1400px",
  lg: "1024px",
  md: "768px",
  sm: "640px",
  xl: "1280px",
  xs: "480px",
};

type BreakpointKey = keyof typeof breakpoints;

export function useBreakpoint(breakpointKey: BreakpointKey) {
  return useMediaQuery(`(min-width: ${breakpoints[breakpointKey]})`);
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(window.matchMedia(query).matches);

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    function handleChange() {
      setMatches(matchMedia.matches);
    }

    // Triggered at the first client-side load and if query changes
    handleChange();

    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
