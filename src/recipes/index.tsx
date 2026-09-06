import { Link } from "@zoontek/chicane";
import { useEffect, useMemo, useState } from "react";
import { scaleIngredient } from "./scaling";
import type { Recipe, RecipeSummary } from "./types";
import { Router } from "../router";

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
    return <p className="py-10 text-center text-white/80">Loading…</p>;
  }

  if (recipes.status === "error") {
    return (
      <div className="rounded-xl border border-white/20 bg-white/15 p-6">
        Could not load recipes: {recipes.message}
      </div>
    );
  }

  return (
    <>
      <p className="mt-1 text-sm text-white/85">
        {recipes.data.length} recipes
      </p>
      {categories.map(([category, entries]) => (
        <section className="mt-8" key={category}>
          <h2 className="mb-3 text-2xl font-semibold drop-shadow">{category}</h2>
          <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {entries.map((recipe) => (
              <li key={recipe.slug}>
                <Link
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/20 bg-white/15 text-white no-underline shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  to={Router.Recipe({ slug: recipe.slug })}
                >
                  {recipe.image === undefined ? (
                    <div className="aspect-4/3 bg-white/10" />
                  ) : (
                    <img
                      className="aspect-4/3 w-full object-cover"
                      src={`/recipes/${recipe.image}`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <span className="p-3 text-sm font-medium">{recipe.name}</span>
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
    return <p className="py-10 text-center text-white/80">Loading…</p>;
  }

  if (recipe.status === "error") {
    return (
      <div className="rounded-xl border border-white/20 bg-white/15 p-6">
        <p>Recipe not found.</p>
        <Link className="mt-3 inline-block underline" to={Router.Recipes()}>
          Back to all recipes
        </Link>
      </div>
    );
  }

  const data = recipe.data;
  const chooseScale = (nextScale: number) => {
    setScale(nextScale);
    localStorage.setItem(`recipe-scale:${slug}`, String(nextScale));
  };

  return (
    <article className="rounded-xl border border-white/20 bg-white/15 p-5 shadow-lg backdrop-blur-md sm:p-6">
      <h1 className="mb-5 text-4xl font-bold drop-shadow-lg">{data.name}</h1>
      {data.image !== undefined && (
        <img
          className="mb-5 max-h-100 w-full rounded-lg object-cover shadow-md"
          src={`/recipes/${data.image}`}
          alt={data.name}
        />
      )}
      {data.description !== undefined && data.description !== "" && (
        <p className="my-3 italic text-white/90">{data.description}</p>
      )}
      {data.time !== undefined && (
        <p className="my-2 text-sm text-white/85">
          {[
            data.time.total !== undefined && `Total: ${data.time.total}`,
            data.time.prep !== undefined && `Prep: ${data.time.prep}`,
            data.time.cook !== undefined && `Cook: ${data.time.cook}`,
          ]
            .filter((part): part is string => Boolean(part))
            .join(" · ")}
        </p>
      )}
      {data.servings !== undefined && (
        <p className="my-2 text-sm text-white/85">
          <strong>Servings:</strong> {scaleIngredient(data.servings, scale)}
        </p>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <section className="self-start md:sticky md:top-5">
          <h2 className="mb-3 text-2xl font-semibold">Ingredients</h2>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="font-medium">Scale:</span>
            {SCALES.map((value) => (
              <button
                className={
                  value === scale
                    ? "rounded-md border-2 border-white bg-white px-3 py-1 text-sm font-semibold text-violet-700"
                    : "rounded-md border-2 border-white/60 bg-white/10 px-3 py-1 text-sm transition hover:bg-white/20"
                }
                key={value}
                type="button"
                onClick={() => {
                  chooseScale(value);
                }}
              >
                {value}x
              </button>
            ))}
          </div>
          {data.ingredientGroups.map((group, groupIndex) => (
            <div key={`${group.name ?? "ingredients"}-${groupIndex}`}>
              {group.name !== undefined && (
                <h3 className="mb-2 mt-4 text-lg font-semibold">{group.name}</h3>
              )}
              <ul className="list-none">
                {group.ingredients.map((ingredient, ingredientIndex) => (
                  <li key={`${ingredient}-${ingredientIndex}`}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/10">
                      <input
                        className="peer mt-1 size-4 shrink-0 accent-white"
                        type="checkbox"
                      />
                      <span className="peer-checked:line-through">
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
          <h2 className="mb-3 text-2xl font-semibold">Directions</h2>
          <ol className="ml-6 list-decimal">
            {data.directions.map((direction, index) => (
              <li className="my-3 pl-1" key={`${direction}-${index}`}>
                {direction}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {data.notes !== undefined && data.notes.length > 0 && (
        <section>
          <h2 className="mb-3 mt-7 text-2xl font-semibold">Notes</h2>
          <ul className="ml-6 list-disc">
            {data.notes.map((note, index) => (
              <li className="my-1" key={`${note}-${index}`}>
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.source !== undefined && (
        <p className="mt-6 text-sm text-white/85">
          Adapted from{" "}
          {data.source.url === undefined ? (
            data.source.name
          ) : (
            <a
              className="text-white underline"
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
  return (
    <main className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] px-5 py-8 font-sans text-white">
      <div className={slug === undefined ? "mx-auto max-w-[820px]" : "mx-auto max-w-300"}>
        <header className="mb-4">
          <Link
            className="mb-4 inline-block text-sm text-white/90 hover:underline"
            to={slug === undefined ? Router.Home() : Router.Recipes()}
          >
            {slug === undefined ? "← Home" : "← All recipes"}
          </Link>
          {slug === undefined && (
            <h1 className="text-4xl font-bold drop-shadow-lg">Recipes</h1>
          )}
        </header>
        {slug === undefined ? (
          <RecipeIndex />
        ) : (
          <RecipeDetail key={slug} slug={slug} />
        )}
      </div>
    </main>
  );
}
