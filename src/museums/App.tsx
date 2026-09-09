import { useEffect, useState } from "react";

import { ColorSchemeToggle } from "../theme/ColorSchemeToggle";
import { MuseumSearch } from "./components/MuseumSearch";
import astcData from "./data/astc-museums.json";
import azaData from "./data/aza-institutions.json";
import logoSvg from "./favicon.svg";
import { getDefaultFilters, loadFilters, saveFilters } from "./lib/storage";
import type { Museum, SearchFilters } from "./types/museum";

type MuseumRecord = Omit<Museum, "distance" | "type">;

/** The two datasets are otherwise identical, so the badge comes from the file. */
function tagged(records: MuseumRecord[], type: NonNullable<Museum["type"]>): Museum[] {
  return records.map((record) =>
    Object.assign<MuseumRecord, Pick<Museum, "type">>(
      { ...record },
      {
        type,
      },
    ),
  );
}

export function MuseumsApp() {
  const [filters, setFilters] = useState<SearchFilters>(() => loadFilters() ?? getDefaultFilters());
  const [allMuseums] = useState<Museum[]>(() => [
    ...tagged(astcData as MuseumRecord[], "astc"),
    ...tagged(azaData as MuseumRecord[], "aza"),
  ]);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  const astcCount = allMuseums.filter((museum) => museum.type === "astc").length;
  const azaCount = allMuseums.filter((museum) => museum.type === "aza").length;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <img alt="Museum" className="mt-0.5 h-6 w-6" src={logoSvg} />
              <div>
                <h1 className="text-xl font-bold">Museum Reciprocity</h1>
                <p className="text-muted-foreground text-xs">
                  {astcCount} ASTC • {azaCount} AZA
                </p>
              </div>
            </div>
            <ColorSchemeToggle className="border-border bg-background hover:bg-accent hover:text-accent-foreground size-9 rounded-md border shadow-xs" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <MuseumSearch filters={filters} museums={allMuseums} onFiltersChange={setFilters} />
      </main>

      <footer className="mt-auto border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="text-muted-foreground flex items-center justify-center text-sm">
            <a
              className="hover:text-foreground flex items-center gap-2 transition-colors"
              href="https://github.com/ianobermiller/obermillers.com/tree/main/src/museums"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fillRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
