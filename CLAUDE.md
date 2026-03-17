# Day of Giving Montreal — Landing Page

## Project Overview
Custom static landing page for **educationjuive.com** — the 2026 Montreal Jewish Day Schools Day of Giving campaign. Vanilla JS SPA (no build step), bilingual EN/FR, deployed to Cloudflare Pages.

**Live URL:** https://educationjuive.com
**Dev server:** `python3 server.py 8088` (custom server with range request support for video)

## File Map

| File | Purpose |
|---|---|
| `index.html` | Shell — loads fonts, CSS, JS |
| `css/style.css` | All styles (layout, meter, cards, responsive breakpoints) |
| `js/render.js` | Section HTML renderers: `renderHeader`, `renderHero`, `renderMeter`, `renderSchoolCards`, `renderAbout`, `renderPartners`, `renderFooter`, `renderAll` |
| `js/app.js` | Init, countdown timer, scroll observers, count-up animation, donor scroll, header scroll effect |
| `js/i18n.js` | All bilingual strings. `t('key')` helper for translations |
| `js/config.js` | Campaign dates, fundraiser IDs (`fcja: '128018'`), feature flags |
| `js/schools.js` | School data (names, logos, campaign URLs) |
| `js/state.js` | `DOG_STATE` global state object |
| `js/api.js` | CrowdChange API calls + mock data fallback (`useMockData: true`) |
| `js/mock-data.js` | Mock stats/donors for dev |
| `server.py` | Custom Python HTTP server with range request support (for video) |
| `_headers` | Cloudflare Pages custom headers |

## Key Assets
- `assets/bg_video.mp4` — Hero background video (~7.2MB), looping, muted autoplay
- `assets/logos/TopLeftLogo.png` — Sticky-note style header logo (cache: `?v=4`)
- `assets/logos/maingraphic.png` — Hero "7 Schools 1 Tradition" graphic
- `assets/logos/HP_image_EN.png` — About section image (tilted postcard style)
- `assets/logos/crowdchange-logo-white.png` — Footer CrowdChange logo

## Architecture
- Rendering: String concatenation in `render.js`, injected via `innerHTML` into `#app`
- Bilingual: `t('key')` helper, `?lang=fr` URL param, toggle button in header
- Video: Created via DOM `createElement` after 500ms delay (innerHTML video won't autoplay in Chrome)
- Scroll effects: `IntersectionObserver` for reveals + scroll listener for header state
- Count-up: `animateCountUp()` in app.js, triggered by IntersectionObserver on meter, 2s ease-out cubic

## Design Values

### Header Logo (TopLeftLogo.png)
| Breakpoint | Initial | Scrolled (>50px) |
|---|---|---|
| Desktop (>1024px) | 280px | 150px |
| Tablet (≤1024px) | 200px | 110px |
| Mobile (≤768px) | 140px | 75px |
| Small mobile (≤480px) | 110px | 60px |

### Fundraising Meter Font Sizes
| Element | Desktop | Tablet (≤1024) | Mobile (≤768) | Small (≤480) |
|---|---|---|---|---|
| Amount ($) | 3.8rem | 2.8rem | 2.4rem | 1.8rem |
| Sublabel | 1.2rem | 0.9rem | 0.8rem | 0.65rem |
| Pct number | 3rem | 2.2rem | 1.8rem | 1.4rem |
| Pct label | 1rem | 0.75rem | 0.65rem | 0.55rem |
| Goal value | 1.2rem | 0.9rem | 0.8rem | 0.65rem |
| Donors num | 3rem | 2.2rem | 1.8rem | 1.4rem |
| Donors label | 1rem | 0.75rem | 0.65rem | 0.55rem |

### Meter Ring Max-Width
- Desktop: 550px
- Tablet: 420px
- Mobile: 340px
- Small mobile: 280px

### About Section Layout
- Desktop: `grid 60fr 40fr`, max-width 1200px (text left, image right with 2deg tilt)
- Mobile (≤768px): Single column, image on top (`order: -1`), max 380px image
- Small mobile: Image max 300px

### CSS Breakpoints
- `1024px` — Tablet: meter/donors stack, school cards 3-col, stats bar stacks
- `768px` — Mobile: about stacks, school cards 2-col, countdown hidden, footer 1-col
- `480px` — Small mobile: school cards 1-col, partners stack

## Deploy Pipeline
```bash
# 1. Sync to clean deploy dir (exclude server.py)
rsync -av --exclude='server.py' --exclude='.git' --exclude='node_modules' \
  "/Users/habitat/Library/CloudStorage/Dropbox/GivingGateway/MONTREAL SCHOOLS/2026/dayofgiving-landing/" \
  /tmp/educationjuive-deploy/

# 2. Deploy to Cloudflare Pages
cd /tmp/educationjuive-deploy && npx wrangler pages deploy . --project-name=educationjuive --branch=main
```

## Cache Busting
Assets that change frequently use `?v=N` query params:
- `TopLeftLogo.png?v=4`
- `maingraphic.png?v=1`
- `HP_image_EN.png?v=1`
- `bg_video.mp4?v=2`

Bump the version number when the user says they've updated a file.

## Common Tasks
- **User updates a logo/image:** Re-copy from `../../2026 Playbook/` source, bump `?v=N` in render.js
- **User provides new copy:** Update `renderAbout()` in render.js (both EN and FR blocks)
- **Change i18n string:** Edit `js/i18n.js`
- **Adjust spacing/sizing:** Edit `css/style.css` — check responsive breakpoints too
- **Redeploy:** Run the deploy pipeline above
