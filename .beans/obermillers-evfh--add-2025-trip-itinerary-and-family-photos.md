---
# obermillers-evfh
title: Build a 2025 trip site with its own design
status: todo
type: feature
priority: normal
created_at: 2026-09-06T03:48:09Z
updated_at: 2026-09-06T03:49:22Z
---

A **standalone site** for the 2025 family trip, living in this hub at its own route. It should look like its own thing — **not** a reskin of `src/travel/2026-morocco-balkans/`.

Photos are ours (Apple Photos), not Wikimedia stand-ins.

## Sources (do not invent)

- **Itinerary:** Apple Notes — find the 2025 trip note and transcribe it. Confirm the destination/title from that note before naming the folder and route.
- **Pictures:** Apple Photos — export the matching 2025 album (or date range) as web-sized WebP. Map photos to days/moments; no Commons/Unsplash fillers.

If Notes/Photos access needs a person at the Mac (permissions, album name), stop and ask rather than guessing.

## Design

Its own visual identity, driven by the trip and the photos we actually have. Do not copy the 2026 page's layout, palette, typography, day-card pattern, or country filter.

- [ ] Pick a distinct direction before building (palette, type, layout) and note it in this bean
- [ ] Let the real photos lead — a photo-forward layout is fair game since these are our pictures, not stock
- [ ] Sharing generic primitives (`PageShell`, router, build config) is fine; sharing trip UI is not

## Work

- [ ] Transcribe the itinerary from Apple Notes into `src/travel/2025-<destination>/`
- [ ] Export photos from Apple Photos into `src/travel/2025-<destination>/static/images/`
- [ ] Build the page with its own components and CSS
- [ ] Wire it up: Chicane route in `src/router.ts`, lazy page in `src/App.tsx`, Vite SPA path, `.htaccess` rewrite, hub `featured` entry in `src/home/links.ts` with `spa: true`
- [ ] Match repo checks: oxlint, oxfmt, knip, typecheck
- [ ] Verify in the browser: days match the note, photos are ours, hub card lands on the new URL, and it reads as a different site from 2026
