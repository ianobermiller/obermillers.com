import { createRouter } from "@zoontek/chicane";

import { bankRoutes } from "./bank/core/routes";
import { calRoutes } from "./cal/core/routes";

const initialPath = window.location.pathname;
if (initialPath !== "/" && initialPath.endsWith("/")) {
  window.history.replaceState(
    null,
    "",
    `${initialPath.replace(/\/+$/, "")}${window.location.search}${window.location.hash}`,
  );
}

const calPath = window.location.pathname;
const calHash = window.location.hash;
if (calPath === "/cal" && calHash.startsWith("#/") && calHash !== "#/") {
  window.history.replaceState(null, "", `/cal${calHash.slice(1)}${window.location.search}`);
}

export const Router = createRouter({
  Home: "/",
  Recipes: "/recipes",
  Recipe: "/recipes/:slug",
  Passports: "/passports",
  Scanify: "/scanify",
  MoroccoBalkans: "/travel/2026-morocco-balkans",
  ...bankRoutes,
  ...calRoutes,
});
