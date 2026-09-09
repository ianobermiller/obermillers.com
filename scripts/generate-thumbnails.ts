#!/usr/bin/env tsx

import fs from "node:fs";
import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer";
import type { Browser } from "puppeteer";
import sharp from "sharp";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const THUMBNAILS_DIR = path.join(repoRoot, "thumbnails");
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const DESKTOP_WIDTH = 1024;
const DESKTOP_HEIGHT = 768; // 4:3 aspect ratio
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;
const MAX_CONCURRENT = 4; // Number of pages to capture in parallel

type PageConfig = {
  name: string;
  path?: string;
  url?: string;
};

type CaptureResult =
  | (PageConfig & { success: true; filename: string })
  | (PageConfig & { success: false; error: string });

// Pages to capture thumbnails for
const PAGES: PageConfig[] = [
  { path: "2024/", name: "2024-newsletter" },
  { url: "https://obermillers.com/blog/", name: "blog" },
  { path: "2014-gender-reveal/", name: "2014-gender-reveal" },
  { path: "2013-gender-reveal/", name: "2013-gender-reveal" },
  { path: "oliviabday2011/", name: "olivia-birthday-2011" },
  { path: "baby/", name: "baby" },
  { path: "cal/", name: "color-calendar" },
  { url: "https://obermillers.com/museums/", name: "museum-reciprocity" },
  { path: "passports/", name: "passport" },
  { path: "scanify/", name: "scanify" },
  { path: "sightwords/", name: "sightwords" },
  { path: "recipes/", name: "recipes" },
  { path: "bank/", name: "family-bank" },
  { url: "https://ianobermiller.com", name: "ianobermiller" },
];

// Ensure thumbnails directory exists
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function boundPort(server: Server): number {
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("HTTP server has no TCP address");
  }
  return address.port;
}

/** Start a local HTTP server serving the built site. Returns { server, baseUrl }. */
function startLocalServer(): Promise<{ server: Server; baseUrl: string }> {
  const root = path.join(repoRoot, "dist");
  if (!fs.existsSync(path.join(root, "index.html"))) {
    throw new Error("No dist/index.html. Run npm run build before generating thumbnails.");
  }

  const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
    let filePath = path.join(root, pathname === "/" ? "index.html" : pathname);

    // Prevent path traversal
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Treat directory requests as index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      // SPA fallback for /recipes/slug etc.
      filePath = path.join(root, "index.html");
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const baseUrl = `http://127.0.0.1:${boundPort(server)}`;
      resolve({ server, baseUrl });
    });
    server.on("error", reject);
  });
}

async function capturePage(
  browser: Browser,
  pageConfig: PageConfig,
  baseUrl: string,
): Promise<CaptureResult> {
  const pageUrl = pageConfig.url || `${baseUrl}/${pageConfig.path}`;
  const tempFilename = `${pageConfig.name}-temp.png`;
  const filename = `${pageConfig.name}.webp`;
  const tempFilepath = path.join(THUMBNAILS_DIR, tempFilename);
  const filepath = path.join(THUMBNAILS_DIR, filename);

  try {
    console.log(`Capturing ${pageUrl}...`);
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({
      width: DESKTOP_WIDTH,
      height: DESKTOP_HEIGHT,
      deviceScaleFactor: 1,
    });

    // Navigate to the page
    await page.goto(pageUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait a bit for any animations or dynamic content
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Take screenshot at desktop size
    await page.screenshot({
      path: tempFilepath,
      fullPage: false,
    });

    await page.close();

    // Resize image maintaining aspect ratio and convert to WebP
    await sharp(tempFilepath)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Remove temp file
    fs.unlinkSync(tempFilepath);

    console.log(`✓ Saved ${filename}`);
    return { ...pageConfig, success: true, filename };
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempFilepath)) {
      fs.unlinkSync(tempFilepath);
    }
    console.error(`✗ Failed to capture ${pageUrl}: ${errorMessage(error)}`);
    return { ...pageConfig, success: false, error: errorMessage(error) };
  }
}

async function generateThumbnails(): Promise<CaptureResult[]> {
  const { server, baseUrl } = await startLocalServer();
  console.log("Local server ready at " + baseUrl + "\n");

  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const results: CaptureResult[] = [];

  try {
    // Process pages in batches to parallelize
    for (let i = 0; i < PAGES.length; i += MAX_CONCURRENT) {
      const batch = PAGES.slice(i, i + MAX_CONCURRENT);
      console.log(
        `\nProcessing batch ${Math.floor(i / MAX_CONCURRENT) + 1} (${batch.length} pages)...`,
      );

      const batchResults = await Promise.all(
        batch.map((pageConfig) => capturePage(browser, pageConfig, baseUrl)),
      );

      results.push(...batchResults);
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("\n=== Summary ===");
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`Successfully captured: ${successful.length}/${PAGES.length}`);
  if (failed.length > 0) {
    console.log("\nFailed pages:");
    failed.forEach((r) => console.log(`  - ${r.path || r.name}: ${r.error}`));
  }

  return results;
}

// Run the script
void generateThumbnails()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Error:", error);
    process.exit(1);
  });
