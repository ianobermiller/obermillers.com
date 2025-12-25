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
node generate-thumbnails.js
```

The script will:
- Take screenshots of all pages listed in the script
- Save them to the `thumbnails/` directory
- The homepage (`index.html`) is already configured to display these thumbnails

## Pages Captured

- 2024 Newsletter (`2024/`)
- Blog (`blog/`)
- 2014 Gender Reveal (`2014-gender-reveal/`)
- 2013 Gender Reveal (`2013-gender-reveal/`)
- Olivia's Birthday 2011 (`oliviabday2011/`)
- Wellington's Baby Website (`babywells/`)
- Color Calendar (`cal/`)
- Museum Reciprocity (`museums/`)
- Passport Photo Tiler (`passports/`)

## Thumbnail Specifications

- Size: 400x300 pixels
- Format: WebP (85% quality for space saving)
- Device Scale Factor: 1x

## Notes

- The script uses Puppeteer to take screenshots
- Thumbnails are saved in the `thumbnails/` directory
- If a thumbnail fails to load, it will be hidden automatically (using `onerror` handler)
- Make sure the website is accessible at https://obermillers.com/ before running the script

