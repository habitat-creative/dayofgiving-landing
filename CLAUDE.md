# Day of Giving Montreal — Landing Page

## Session Continuity (MANDATORY)

Memory files live at:
`/Users/habitat/.claude/projects/-Users-habitat-Library-CloudStorage-Dropbox-GivingGateway-MONTREAL-SCHOOLS-2026-dayofgiving-landing/memory/`

**On EVERY session start:**
1. Read `WORKSTATE.md` from the path above — what's done, what's next, current cache versions.
2. Read `PROJECT_HISTORY.md` — key decisions and why.

**Checkpoint WORKSTATE.md** after any discrete unit of work.

**Never full-read large files.** `css/style.css` and `js/render.js` are the biggest — grep first, read with offset/limit.

## Git Workflow

**Repo:** `github.com/habitat-creative/dayofgiving-landing` | Branch: `main`

```bash
git add <files>
git commit -m "description"
git push origin main
# Then deploy (see Deploy Pipeline section below)
```

**This is a live production site.** Test locally with `python3 server.py 8088` before deploying.

## Project Overview
Custom static landing page for **educationjuive.com** — the 2026 Montreal Jewish Day Schools Day of Giving campaign. Vanilla JS SPA (no build step), bilingual EN/FR, deployed to Cloudflare Pages.

**Live URL:** https://educationjuive.com
**Dev server:** `python3 server.py 8088` (custom server with range request support for video)

## File Map

| File | Purpose |
|---|---|
| `index.html` | Shell — loads fonts, CSS, JS |
| `css/style.css` | All styles (layout, meter, cards, responsive breakpoints) |
| `js/render.js` | Section HTML renderers: renderHeader, renderHero, renderMeter, renderSchoolCards, renderAbout, renderPartners, renderFooter, renderAll |
| `js/app.js` | Init, countdown timer, scroll observers, count-up animation, donor scroll, header scroll effect |
| `js/i18n.js` | All bilingual strings. t('key') helper for translations |
| `js/config.js` | Campaign dates, fundraiser IDs (fcja: '128018'), feature flags |
| `js/schools.js` | School data (names, logos, campaign URLs) |
| `js/state.js` | DOG_STATE global state object |
| `js/api.js` | CrowdChange API calls + mock data fallback (useMockData: true) |
| `js/mock-data.js` | Mock stats/donors for dev |
| `server.py` | Custom Python HTTP server with range request support (for video) |
| `_headers` | Cloudflare Pages custom headers |
| `studio/ambassador-widget.html` | Standalone ambassador embed widget |

## Key Assets
- `assets/bg_video.mp4` — Hero background video (~7.2MB), looping, muted autoplay
- `assets/hero/TopLeftLogo.png` — Sticky-note style header logo (cache: ?v=4)
- `assets/hero/maingraphic.png` — Hero "7 Schools 1 Tradition" graphic
- `assets/hero/HP_image_EN.png` — About section image (tilted postcard style)
- `assets/logos/crowdchange-logo-white.png` — Footer CrowdChange logo

## Architecture
- Rendering: String concatenation in render.js, injected via innerHTML into #app
- Bilingual: t('key') helper, ?lang=fr URL param, toggle button in header
- Video: Created via DOM createElement after 500ms delay (innerHTML video won't autoplay in Chrome)
- Scroll effects: IntersectionObserver for reveals + scroll listener for header state
- Count-up: animateCountUp() in app.js, triggered by IntersectionObserver on meter, 2s ease-out cubic

## CSS Breakpoints
- `1024px` — Tablet: meter/donors stack, school cards 3-col, stats bar stacks
- `768px` — Mobile: about stacks, school cards 2-col, countdown hidden, footer 1-col
- `480px` — Small mobile: school cards 1-col, partners stack

## Deploy Pipeline

How Cloudflare Pages gets this site: Direct Wrangler deploy (not git-triggered).

```bash
# 1. Commit and push first (always)
git add <files> && git commit -m "description" && git push origin main

# 2. Deploy to Cloudflare Pages (run from inside dayofgiving-landing/)
npx wrangler pages deploy . --project-name=educationjuive --branch=main
```

## Cache Busting
Assets use ?v=N query params in js/render.js:
- TopLeftLogo.png?v=4
- maingraphic.png?v=1
- HP_image_EN.png?v=1
- bg_video.mp4?v=2

Bump version number when updating an asset file.

## Common Tasks
- **Update a logo/image:** Replace file in assets/, bump ?v=N in js/render.js
- **Update copy:** Edit js/render.js (EN and FR blocks) or js/i18n.js for UI strings
- **Adjust spacing/sizing:** Edit css/style.css — check all responsive breakpoints
- **Redeploy:** Commit then push then run deploy pipeline above
