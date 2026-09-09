# Thumbnail Generation Script

This script generates thumbnail screenshots of all pages on obermillers.com and updates the homepage to display them.

## Setup

1. Install dependencies:

```bash
npm install
```

## Usage

Run the script to generate thumbnails:

```bash
npm run generate
```

Or directly:

```bash
npx tsx scripts/generate-thumbnails.ts
```

The script will:

- Serve the built `dist/` directory (run `npm run build` first)
- Take screenshots of all pages listed in the script
- Save them to the `thumbnails/` directory
- The homepage is already configured to display these thumbnails

## Pages Captured

Served from the local `dist/` build:

- 2024 Newsletter (`2024/`)
- 2014 Gender Reveal (`2014-gender-reveal/`)
- 2013 Gender Reveal (`2013-gender-reveal/`)
- Olivia's Birthday 2011 (`oliviabday2011/`)
- Wellington's Baby Website (`baby/`)
- Recipes (`recipes/`)
- Color Calendar (`cal/`)
- Family Bank (`bank/`)
- Passport Photo Tiler (`passports/`)
- Scanify (`scanify/`)
- Sight Words (`sightwords/`)

Captured from the live site, because they are not part of this repo:

- Blog (`https://obermillers.com/blog/`)
- Museum Reciprocity (`https://obermillers.com/museums/`)
- ianobermiller.com (`https://ianobermiller.com`)

## Thumbnail Specifications

- Size: 400x300 pixels
- Format: WebP (85% quality for space saving)
- Device Scale Factor: 1x

## Notes

- The script uses Puppeteer to take screenshots
- Thumbnails are saved in the `thumbnails/` directory
- If a thumbnail fails to load, it will be hidden automatically (using `onerror` handler)
- The script serves the built `dist/` locally, so pages in this repo do not need to be published first. The three pages listed above under "Captured from the live site" are the exception: `blog/` and `museums/` are not in this repo, so they are always fetched from obermillers.com.
