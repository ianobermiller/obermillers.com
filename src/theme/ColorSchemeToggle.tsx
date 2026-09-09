import { Moon, Sun } from "lucide-react";

import { useColorScheme } from "./colorScheme";

/**
 * Two states, not three. The underlying model still has three, but "system" is
 * only ever relevant to someone whose page already looks right — and those
 * people are not reaching for this button. Pressing it flips to the opposite of
 * what is on screen; when that opposite happens to be what the OS says, the
 * override is dropped instead of stored, so following the OS stays reachable.
 *
 * https://lea.verou.me/blog/2026/dark-mode-toggles/
 *
 * `className` carries the whole look, including size and radius, so each app
 * can match its own buttons without fighting the base classes.
 */
export function ColorSchemeToggle({ className }: { className?: string }) {
  const { resolved, system, toggle } = useColorScheme();

  const target = resolved === "dark" ? "light" : "dark";
  const label =
    target === system ? `Switch back to ${target} (system default)` : `Switch to ${target}`;
  const Icon = resolved === "dark" ? Moon : Sun;

  return (
    <button
      aria-label={label}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors ${className ?? ""}`}
      onClick={toggle}
      title={label}
      type="button"
    >
      <Icon aria-hidden className="size-[1.2rem]" />
    </button>
  );
}
