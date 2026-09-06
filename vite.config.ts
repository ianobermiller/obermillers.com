import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createReadStream, cpSync, existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

const STATIC_DIRS = [
  "2013-gender-reveal",
  "2014-gender-reveal",
  "2024",
  "baby",
  "oliviabday2011",
  "passports",
  "pt",
  "recipes",
  "resurrection-challenge",
  "scanify",
  "sightwords",
  "thumbnails",
] as const;

const SPA_DIRS = ["recipes", "passports", "scanify"] as const;
const ALLOWED_DIRS = new Set<string>(STATIC_DIRS);

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
    (/^\/recipes\/[^/]+$/.test(path) && !path.includes("."))
  );
}

function resolveStaticFile(urlPath: string): string | null {
  const relativePath = decodeURIComponent(urlPath.replace(/^\//, ""));
  if (relativePath === "" || relativePath.includes("..")) return null;

  const topDirectory = relativePath.split("/")[0];
  if (topDirectory === undefined || !ALLOWED_DIRS.has(topDirectory)) return null;

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
  if (
    url.startsWith("/@") ||
    url.startsWith("/src/") ||
    url.startsWith("/node_modules/")
  ) {
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

// Extraction leftovers and editor cruft that must never reach the server.
// The background-removal tarball unpacks to ~570MB; only models/ is needed.
const EXCLUDED_FROM_DIST = [
  "passports/background-removal-assets/package",
  "passports/background-removal-assets/package.tgz",
] as const;

function copyStaticIntoDist(): void {
  const dist = resolve(root, "dist");
  const excluded = EXCLUDED_FROM_DIST.map((path) => resolve(root, path));
  for (const directory of STATIC_DIRS) {
    const source = resolve(root, directory);
    if (existsSync(source)) {
      cpSync(source, resolve(dist, directory), {
        recursive: true,
        filter: (from) => !excluded.includes(from),
      });
    }
  }

  const spaIndex = resolve(dist, "index.html");
  for (const directory of SPA_DIRS) {
    cpSync(spaIndex, resolve(dist, directory, "index.html"));
  }

  const htaccess = resolve(root, ".htaccess");
  if (existsSync(htaccess)) {
    cpSync(htaccess, resolve(dist, ".htaccess"));
  }
}

export default defineConfig({
  appType: "spa",
  publicDir: false,
  plugins: [
    react(),
    tailwindcss(),
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
    include: [
      "onnxruntime-web",
      "onnxruntime-web/webgpu",
      "pdfjs-dist",
      "pdf-lib",
    ],
  },
});
