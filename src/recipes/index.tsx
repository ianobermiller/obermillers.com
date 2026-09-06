import { Link } from "@zoontek/chicane";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "../PageShell";
import { Router } from "../router";
import { scaleIngredient } from "./scaling";
import type { Recipe, RecipeSummary } from "./types";

const SCALES = [1, 1.5, 2, 3, 4] as const;

type Loadable<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

function useJson<T>(url: string): Loadable<T> {
  const [result, setResult] = useState<Loadable<T>>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    void fetchJson<T>(url, controller.signal)
      .then((data) => {
        setResult({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      });
    return () => {
      controller.abort();
    };
  }, [url]);

  return result;
}

function StatusNote({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
      {children}
    </p>
  );
}

function RecipeIndex() {
  const recipes = useJson<RecipeSummary[]>("/recipes/manifest.json");

  useEffect(() => {
    document.title = "Recipes — Obermiller Family";
  }, []);

  const categories = useMemo(() => {
    if (recipes.status !== "ready") return [];
    const grouped = new Map<string, RecipeSummary[]>();
    for (const recipe of recipes.data) {
      const group = grouped.get(recipe.category) ?? [];
      group.push(recipe);
      grouped.set(recipe.category, group);
    }
    return [...grouped.entries()].toSorted(([a], [b]) => a.localeCompare(b));
  }, [recipes]);

  if (recipes.status === "loading") {
    return <StatusNote>Loading</StatusNote>;
  }

  if (recipes.status === "error") {
    return (
      <p className="text-sm leading-relaxed text-zinc-400">
        Could not load recipes: {recipes.message}
      </p>
    );
  }

  return (
    <>
      {categories.map(([category, entries]) => (
        <section className="mt-10 first:mt-0" key={category}>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {category}
          </h2>
          <ul className="list-none">
            {entries.map((recipe) => (
              <li key={recipe.slug}>
                <Link
                  className="group flex items-center gap-4 border-t border-zinc-800 py-3.5 text-zinc-200 no-underline"
                  to={Router.Recipe({ slug: recipe.slug })}
                >
                  {recipe.image === undefined ? (
                    <span className="size-12 shrink-0 bg-zinc-900" />
                  ) : (
                    <img
                      className="size-12 shrink-0 object-cover"
                      src={`/recipes/${recipe.image}`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <span className="text-sm transition group-hover:text-white">
                    {recipe.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function loadSavedScale(slug: string): number {
  const scale = Number.parseFloat(
    localStorage.getItem(`recipe-scale:${slug}`) ?? "",
  );
  return SCALES.includes(scale as (typeof SCALES)[number]) ? scale : 1;
}

function RecipeDetail({ slug }: { slug: string }) {
  const recipe = useJson<Recipe>(`/recipes/${encodeURIComponent(slug)}.json`);
  const [scale, setScale] = useState(() => loadSavedScale(slug));

  useEffect(() => {
    if (recipe.status === "ready") {
      document.title = `${recipe.data.name} — Recipes`;
    }
  }, [recipe]);

  if (recipe.status === "loading") {
    return <StatusNote>Loading</StatusNote>;
  }

  if (recipe.status === "error") {
    return (
      <div>
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight">
          Recipe not found
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-zinc-400">
          That recipe is missing from the collection.
        </p>
      </div>
    );
  }

  const data = recipe.data;
  const chooseScale = (nextScale: number) => {
    setScale(nextScale);
    localStorage.setItem(`recipe-scale:${slug}`, String(nextScale));
  };

  return (
    <article>
      <h1 className="font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
        {data.name}
      </h1>
      {data.image !== undefined && (
        <img
          className="mt-8 max-h-100 w-full object-cover"
          src={`/recipes/${data.image}`}
          alt={data.name}
        />
      )}
      {data.description !== undefined && data.description !== "" && (
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {data.description}
        </p>
      )}
      {(data.time !== undefined || data.servings !== undefined) && (
        <p className="mt-4 text-xs tracking-wide text-zinc-500">
          {[
            data.time?.total !== undefined && `Total ${data.time.total}`,
            data.time?.prep !== undefined && `Prep ${data.time.prep}`,
            data.time?.cook !== undefined && `Cook ${data.time.cook}`,
            data.servings !== undefined &&
              `Serves ${scaleIngredient(data.servings, scale)}`,
          ]
            .filter((part): part is string => Boolean(part))
            .join(" · ")}
        </p>
      )}

      <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <section className="self-start md:sticky md:top-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Ingredients
          </h2>
          <div className="mb-5 flex flex-wrap items-center gap-x-1 gap-y-2">
            <span className="mr-2 text-xs text-zinc-500">Scale</span>
            {SCALES.map((value) => (
              <button
                className={
                  value === scale
                    ? "px-2 py-1 text-sm text-white"
                    : "px-2 py-1 text-sm text-zinc-500 hover:text-zinc-200"
                }
                key={value}
                type="button"
                onClick={() => {
                  chooseScale(value);
                }}
              >
                {value}×
              </button>
            ))}
          </div>
          {data.ingredientGroups.map((group, groupIndex) => (
            <div key={`${group.name ?? "ingredients"}-${groupIndex}`}>
              {group.name !== undefined && (
                <h3 className="mb-2 mt-5 text-sm text-zinc-300">{group.name}</h3>
              )}
              <ul className="list-none">
                {group.ingredients.map((ingredient, ingredientIndex) => (
                  <li key={`${ingredient}-${ingredientIndex}`}>
                    <label className="flex cursor-pointer items-start gap-3 border-t border-zinc-800 py-2 text-sm text-zinc-200">
                      <input
                        className="peer mt-1 size-3.5 shrink-0 accent-zinc-300"
                        type="checkbox"
                      />
                      <span className="peer-checked:text-zinc-600 peer-checked:line-through">
                        {scaleIngredient(ingredient, scale)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Directions
          </h2>
          <ol className="list-none">
            {data.directions.map((direction, index) => (
              <li
                className="grid grid-cols-[2rem_1fr] gap-3 border-t border-zinc-800 py-4 text-sm leading-relaxed text-zinc-200"
                key={`${direction}-${index}`}
              >
                <span className="font-mono text-xs text-zinc-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {direction}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {data.notes !== undefined && data.notes.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Notes
          </h2>
          <ul className="list-none">
            {data.notes.map((note, index) => (
              <li
                className="border-t border-zinc-800 py-3 text-sm leading-relaxed text-zinc-400"
                key={`${note}-${index}`}
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.source !== undefined && (
        <p className="mt-10 text-xs text-zinc-600">
          Adapted from{" "}
          {data.source.url === undefined ? (
            data.source.name
          ) : (
            <a
              className="text-zinc-500 no-underline hover:text-zinc-300"
              href={data.source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.source.name}
            </a>
          )}
          .
        </p>
      )}
    </article>
  );
}

export default function RecipesPage({ slug }: { slug?: string }) {
  const isIndex = slug === undefined;
  return (
    <PageShell
      backTo={isIndex ? Router.Home() : Router.Recipes()}
      backLabel={isIndex ? "Family hub" : "All recipes"}
      title={isIndex ? "Recipes" : undefined}
      description={
        isIndex ? "Family favorites and tested classics." : undefined
      }
      wide={!isIndex}
    >
      {isIndex ? <RecipeIndex /> : <RecipeDetail key={slug} slug={slug} />}
    </PageShell>
  );
}
