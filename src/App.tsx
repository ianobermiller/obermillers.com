import { lazy, Suspense } from "react";
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

export function App() {
  const route = Router.useRoute([
    "Home",
    "Recipes",
    "Recipe",
    "Passports",
    "Scanify",
  ]);

  return (
    <RouteErrorBoundary key={route?.name ?? "not-found"}>
      <Suspense
        fallback={
          <main className="grid min-h-screen place-items-center bg-violet-700 text-white">
            Loading…
          </main>
        }
      >
        {route?.name === "Home" && <HomePage />}
        {route?.name === "Recipes" && <RecipesPage />}
        {route?.name === "Recipe" && <RecipesPage slug={route.params.slug} />}
        {route?.name === "Passports" && <PassportPage />}
        {route?.name === "Scanify" && <ScanifyPage />}
        {route === undefined && (
          <main className="grid min-h-screen place-items-center bg-violet-700 p-6 text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold">Page not found</h1>
              <a className="mt-4 inline-block underline" href="/">
                Return home
              </a>
            </div>
          </main>
        )}
      </Suspense>
    </RouteErrorBoundary>
  );
}
