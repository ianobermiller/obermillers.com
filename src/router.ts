import { createRouter } from "@zoontek/chicane";

const initialPath = window.location.pathname;
if (initialPath !== "/" && initialPath.endsWith("/")) {
  window.history.replaceState(
    null,
    "",
    `${initialPath.replace(/\/+$/, "")}${window.location.search}${window.location.hash}`,
  );
}

export const Router = createRouter({
  Home: "/",
  Recipes: "/recipes",
  Recipe: "/recipes/:slug",
  Passports: "/passports",
  Scanify: "/scanify",
  MoroccoBalkans: "/travel/2026-morocco-balkans",
});
