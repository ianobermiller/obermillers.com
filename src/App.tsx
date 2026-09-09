import { lazy, Suspense } from "react";

import { BANK_AREA } from "./bank/core/routes";
import { CAL_AREA } from "./cal/core/routes";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { Router } from "./router";

const RELOAD_KEY = "obermillers:chunk-reload";

// Storage is unavailable in some privacy modes; a failed guard read must not
// become its own error.
function readFlag(): string | null {
  try {
    return sessionStorage.getItem(RELOAD_KEY);
  } catch {
    return null;
  }
}

function writeFlag(value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(RELOAD_KEY);
    else sessionStorage.setItem(RELOAD_KEY, value);
  } catch {
    // Ignore: the reload below is still worth attempting.
  }
}

/**
 * A deploy replaces every hashed chunk, so a tab opened beforehand asks for
 * filenames that no longer exist and the route import throws. Reloading pulls a
 * fresh index.html with the current filenames.
 *
 * The flag is only cleared once a route import succeeds, so a genuinely broken
 * deploy (for example a cached index.html pointing at missing chunks) reloads
 * at most once per session rather than looping.
 */
async function importRoute<T>(load: () => Promise<T>): Promise<T> {
  try {
    const module = await load();
    writeFlag(null);
    return module;
  } catch (error) {
    if (readFlag() !== null) throw error;
    writeFlag(String(Date.now()));
    window.location.reload();
    // The reload supersedes this render; never settle.
    return new Promise<T>(() => undefined);
  }
}

const HomePage = lazy(() => importRoute(() => import("./home")));
const RecipesPage = lazy(() => importRoute(() => import("./recipes")));
const PassportPage = lazy(() => importRoute(() => import("./passports")));
const ScanifyPage = lazy(() => importRoute(() => import("./scanify")));
const MoroccoBalkansPage = lazy(() => importRoute(() => import("./travel/2026-morocco-balkans")));
const BankPage = lazy(() => importRoute(() => import("./bank")));
const CalPage = lazy(() => importRoute(() => import("./cal")));

export function App() {
  const route = Router.useRoute([
    "Home",
    "Recipes",
    "Recipe",
    "Passports",
    "Scanify",
    "MoroccoBalkans",
    BANK_AREA,
    CAL_AREA,
  ]);

  return (
    <RouteErrorBoundary key={route?.name ?? "not-found"}>
      <Suspense
        fallback={
          <main className="grid min-h-screen place-items-center bg-zinc-950 font-sans text-zinc-100">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Loading
            </p>
          </main>
        }
      >
        {route?.name === "Home" && <HomePage />}
        {route?.name === "Recipes" && <RecipesPage />}
        {route?.name === "Recipe" && <RecipesPage slug={route.params.slug} />}
        {route?.name === "Passports" && <PassportPage />}
        {route?.name === "Scanify" && <ScanifyPage />}
        {route?.name === "MoroccoBalkans" && <MoroccoBalkansPage />}
        {route?.name === BANK_AREA && <BankPage />}
        {route?.name === CAL_AREA && <CalPage />}
        {route === undefined && (
          <main className="grid min-h-screen place-items-center bg-zinc-950 px-5 py-12 font-sans text-zinc-100">
            <div className="w-full max-w-md">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-zinc-500 uppercase">
                404
              </p>
              <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight">
                Page not found
              </h1>
              <p className="mt-6 text-sm leading-relaxed text-zinc-400">
                That link has either moved or never existed. Everything we still keep around is
                listed on the home page.
              </p>
              <div className="mt-8 border-t border-zinc-800 pt-4">
                <a className="text-sm text-zinc-300 no-underline hover:text-white" href="/">
                  Return home
                </a>
              </div>
            </div>
          </main>
        )}
      </Suspense>
    </RouteErrorBoundary>
  );
}
