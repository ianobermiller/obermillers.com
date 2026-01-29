#!/usr/bin/env node

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://obermillers.com';
const THUMBNAILS_DIR = path.join(__dirname, 'thumbnails');
const DESKTOP_WIDTH = 1024;
const DESKTOP_HEIGHT = 768; // 4:3 aspect ratio
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;
const MAX_CONCURRENT = 4; // Number of pages to capture in parallel

// Pages to capture thumbnails for
const PAGES = [
  { path: '2024/', name: '2024-newsletter' },
  { path: 'blog/', name: 'blog' },
  { path: '2014-gender-reveal/', name: '2014-gender-reveal' },
  { path: '2013-gender-reveal/', name: '2013-gender-reveal' },
  { path: 'oliviabday2011/', name: 'olivia-birthday-2011' },
  { path: 'babywells/', name: 'babywells' },
  { path: 'cal/', name: 'color-calendar' },
  { path: 'museums/', name: 'museum-reciprocity' },
  { path: 'passports/', name: 'passport' },
  { path: 'sightwords/', name: 'sightwords' },
  { url: 'https://ianobermiller.com', name: 'ianobermiller' },
];

// Ensure thumbnails directory exists
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

async function capturePage(browser, pageConfig) {
  const url = pageConfig.url || `${BASE_URL}/${pageConfig.path}`;
  const tempFilename = `${pageConfig.name}-temp.png`;
  const filename = `${pageConfig.name}.webp`;
  const tempFilepath = path.join(THUMBNAILS_DIR, tempFilename);
  const filepath = path.join(THUMBNAILS_DIR, filename);

  try {
    console.log(`Capturing ${url}...`);
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({
      width: DESKTOP_WIDTH,
      height: DESKTOP_HEIGHT,
      deviceScaleFactor: 1
    });

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for any animations or dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot at desktop size
    await page.screenshot({
      path: tempFilepath,
      fullPage: false
    });

    await page.close();

    // Resize image maintaining aspect ratio and convert to WebP
    await sharp(tempFilepath)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
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
    console.error(`✗ Failed to capture ${url}: ${error.message}`);
    return { ...pageConfig, success: false, error: error.message };
  }
}

async function generateThumbnails() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const results = [];

  // Process pages in batches to parallelize
  for (let i = 0; i < PAGES.length; i += MAX_CONCURRENT) {
    const batch = PAGES.slice(i, i + MAX_CONCURRENT);
    console.log(`\nProcessing batch ${Math.floor(i / MAX_CONCURRENT) + 1} (${batch.length} pages)...`);

    const batchResults = await Promise.all(
      batch.map(pageConfig => capturePage(browser, pageConfig))
    );

    results.push(...batchResults);
  }

  await browser.close();

  console.log('\n=== Summary ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Successfully captured: ${successful.length}/${PAGES.length}`);
  if (failed.length > 0) {
    console.log('\nFailed pages:');
    failed.forEach(r => console.log(`  - ${r.path}: ${r.error}`));
  }

  return results;
}

// Run the script
generateThumbnails()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

