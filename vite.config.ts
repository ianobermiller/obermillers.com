import { createReadStream, cpSync, existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const root = fileURLToPath(new URL(".", import.meta.url));

const LEGACY_STATIC_DIRS = [
  "2013-gender-reveal",
  "2014-gender-reveal",
  "2024",
  "baby",
  "oliviabday2011",
  "pt",
  "resurrection-challenge",
  "sightwords",
  "thumbnails",
] as const;

const SPA_STATIC_DIRS = [
  { route: "recipes", source: "src/recipes/static" },
  { route: "passports", source: "src/passports/static" },
  { route: "scanify", source: "src/scanify/static" },
  {
    route: "travel/2026-morocco-balkans",
    source: "src/travel/2026-morocco-balkans/static",
  },
  { route: "bank", source: "src/bank/static" },
  { route: "cal", source: "src/cal/static" },
] as const;
const ALLOWED_LEGACY_DIRS = new Set<string>(LEGACY_STATIC_DIRS);

const MIME: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".onnx": "application/octet-stream",
  ".bin": "application/octet-stream",
  ".mp3": "audio/mpeg",
  ".dcr": "application/octet-stream",
  ".cct": "application/octet-stream",
  ".cst": "application/octet-stream",
  ".avi": "video/x-msvideo",
};

function isSpaPath(pathname: string): boolean {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";
  return (
    path === "/" ||
    path === "/recipes" ||
    path === "/passports" ||
    path === "/scanify" ||
    path === "/travel/2026-morocco-balkans" ||
    path === "/bank" ||
    path === "/cal" ||
    (/^\/recipes\/[^/]+$/.test(path) && !path.includes(".")) ||
    (/^\/bank(\/.*)?$/.test(path) && !path.includes(".")) ||
    (/^\/cal(\/.*)?$/.test(path) && !path.includes("."))
  );
}

function resolveStaticFile(urlPath: string): string | null {
  const relativePath = decodeURIComponent(urlPath.replace(/^\//, ""));
  if (relativePath === "" || relativePath.includes("..")) return null;

  for (const directory of SPA_STATIC_DIRS) {
    if (relativePath !== directory.route && !relativePath.startsWith(`${directory.route}/`)) {
      continue;
    }
    const assetPath = relativePath.slice(directory.route.length).replace(/^\//, "");
    if (assetPath === "") return null;
    const file = resolve(root, directory.source, assetPath);
    if (existsSync(file) && statSync(file).isFile()) return file;
    return null;
  }

  const topDirectory = relativePath.split("/")[0];
  if (topDirectory === undefined || !ALLOWED_LEGACY_DIRS.has(topDirectory)) {
    return null;
  }

  let file = join(root, relativePath);
  if (!existsSync(file)) return null;
  if (statSync(file).isDirectory()) {
    file = join(file, "index.html");
    if (!existsSync(file) || !statSync(file).isFile()) return null;
  }
  return file;
}

function staticMiddleware(
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
): void {
  const url = (request.url ?? "/").split("?")[0] ?? "/";
  if (url.startsWith("/@") || url.startsWith("/src/") || url.startsWith("/node_modules/")) {
    next();
    return;
  }
  if (isSpaPath(url)) {
    request.url = "/index.html";
    next();
    return;
  }

  const file = resolveStaticFile(url);
  if (file === null) {
    next();
    return;
  }
  response.setHeader(
    "Content-Type",
    MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
  );
  createReadStream(file).pipe(response);
}

function copyStaticIntoDist(): void {
  const dist = resolve(root, "dist");
  for (const directory of LEGACY_STATIC_DIRS) {
    const source = resolve(root, directory);
    if (existsSync(source)) {
      cpSync(source, resolve(dist, directory), { recursive: true });
    }
  }

  for (const directory of SPA_STATIC_DIRS) {
    const source = resolve(root, directory.source);
    if (existsSync(source)) {
      cpSync(source, resolve(dist, directory.route), { recursive: true });
    }
  }

  const spaIndex = resolve(dist, "index.html");
  for (const directory of SPA_STATIC_DIRS) {
    cpSync(spaIndex, resolve(dist, directory.route, "index.html"));
  }

  const htaccess = resolve(root, ".htaccess");
  if (existsSync(htaccess)) {
    cpSync(htaccess, resolve(dist, ".htaccess"));
  }
}

export default defineConfig({
  appType: "spa",
  publicDir: false,
  resolve: {
    alias: {
      "@bank/core": resolve(root, "src/bank/core"),
      "@bank/hooks": resolve(root, "src/bank/hooks"),
      "@bank/ui": resolve(root, "src/bank/components/ui"),
      "@bank/utils": resolve(root, "src/bank/utils"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      injectRegister: false,
      minify: false,
      includeAssets: ["bank/icon-512x512.png"],
      manifest: {
        background_color: "#fdf7ef",
        description: "Family bank app for keeping track of kids finances.",
        display: "fullscreen",
        icons: [
          {
            sizes: "512x512",
            src: "/bank/icon-512x512.png",
            type: "image/png",
          },
        ],
        name: "Family Bank",
        scope: "/bank",
        short_name: "Family Bank",
        start_url: "/bank",
        theme_color: "#0e9488",
      },
      workbox: {
        globPatterns: ["index.html", "assets/bank-*.js", "assets/index-*.css", "bank/**/*"],
        navigateFallback: "/index.html",
        navigateFallbackAllowlist: [/^\/bank(?:\/|$)/],
        globIgnores: ["**/*.wasm", "**/*.mjs"],
      },
    }),
    {
      name: "obermillers-static",
      configureServer(server) {
        server.middlewares.use(staticMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(staticMiddleware);
      },
      writeBundle() {
        copyStaticIntoDist();
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Each route's entry point is an index.tsx, which would otherwise
        // produce a pile of indistinguishable index-[hash].js chunks.
        chunkFileNames(chunk) {
          const id = chunk.facadeModuleId;
          if (id !== null && /\/index\.tsx?$/.test(id)) {
            return `assets/${basename(dirname(id))}-[hash].js`;
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
  optimizeDeps: {
    include: ["onnxruntime-web", "onnxruntime-web/webgpu", "pdfjs-dist", "pdf-lib"],
  },
});
