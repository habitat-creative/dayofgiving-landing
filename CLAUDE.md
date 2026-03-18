# Day of Giving Montreal — Landing Page

Public-facing campaign landing page for **educationjuive.com** (2026 Montreal Jewish Day Schools Day of Giving). Vanilla JS SPA, bilingual EN/FR, Cloudflare Pages. Sister project to the PlayBook (`campaign-playbooks` repo).

## Session Continuity

This project shares the PlayBook's memory system. Read these on session start:
- `WORKSTATE.md` at `/Users/habitat/.claude/projects/-Users-habitat-Library-CloudStorage-Dropbox-GivingGateway-MONTREAL-SCHOOLS-2026-2026-Playbook/memory/`
- The landing page also has its own memory dir at `/Users/habitat/.claude/projects/-Users-habitat-Library-CloudStorage-Dropbox-GivingGateway-MONTREAL-SCHOOLS-2026-dayofgiving-landing/memory/` — check both.

**Never full-read large files.** `css/style.css` (~2400 lines) and `js/app.js` (~1600 lines) — grep first, read with offset/limit.

## Deploy Pipeline

**Git push does NOT auto-deploy.** The `educationjuive` Cloudflare Pages project has no git connection. Deploy is a two-step process:

```bash
# 1. Commit and push
git add <files> && git commit -m "description" && git push origin main

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy . --project-name=educationjuive
```

**TODO:** Connect `educationjuive` Pages project to `habitat-creative/dayofgiving-landing` GitHub repo for auto-deploy. Until then, always run step 2.

## Cache Busting

**index.html** references all JS/CSS with `?v=N`. Bump the version when editing a file:

| File | Tag in index.html |
|------|-------------------|
| `css/style.css` | `?v=` (bump on CSS changes) |
| `js/config.js` | `?v=` (bump on config changes) |
| `js/schools.js` | `?v=` (bump on school data changes) |
| `js/mock-data.js` | `?v=` (bump on mock data changes) |
| `js/state.js` | `?v=` (bump on state changes) |
| `js/i18n.js` | `?v=` (bump on translation changes) |
| `js/api.js` | `?v=` (bump on API changes) |
| `js/render.js` | `?v=` (bump on render changes) |
| `js/app.js` | `?v=` (bump on app logic changes) |

**Asset cache versions** are in `js/render.js` (e.g., `TopLeftLogo.png?v=4`). Bump when replacing an asset file.

## File Map

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~53 | Shell — fonts, CSS, JS, OptinMonster embed |
| `css/style.css` | ~2354 | All styles, 3 breakpoints (1024/768/480) |
| `js/render.js` | ~664 | Section renderers: header, hero, meter, school cards, about, partners, footer |
| `js/app.js` | ~1568 | Init, countdown, scroll observers, count-up animation, donor scroll, header effects |
| `js/i18n.js` | ~139 | Bilingual strings. `t('key')` helper |
| `js/config.js` | ~44 | Campaign dates, fundraiser IDs, feature flags |
| `js/schools.js` | ~87 | School data (names, logos, campaign URLs) |
| `js/state.js` | ~66 | `DOG_STATE` global state object |
| `js/api.js` | ~388 | CrowdChange API calls + mock data fallback |
| `js/mock-data.js` | ~54 | Mock stats/donors for dev |
| `server.py` | — | Python HTTP server with range requests (for video) |
| `_headers` | — | Cloudflare Pages custom headers (security, caching) |
| `functions/api/` | — | Pages Functions: stats, all-donors, ambassadors |
| `studio/ambassador-widget.html` | — | Standalone ambassador embed widget (iframeable) |

## Architecture

- **Rendering:** String concatenation in render.js, injected via innerHTML into `#app`
- **Bilingual:** `t('key')` helper, `?lang=fr` URL param, toggle button in header
- **Video:** Created via `createElement` (not innerHTML — Chrome won't autoplay innerHTML video)
- **Scroll effects:** IntersectionObserver for reveals + scroll listener for header
- **Count-up:** `animateCountUp()` in app.js, 2s ease-out cubic, triggers on meter visible
- **Overflow ring:** Secondary black arc for goal exceeded (>100%), animates 2s after primary ring
- **API:** `useMockData` flag in config.js (currently `false` — live CrowdChange API)

## Known Issues

- **CSP vs OptinMonster:** `_headers` has `script-src 'self' https://static.cloudflareinsights.com` which may block the OptinMonster script from `a.omappapi.com`. If OptinMonster isn't working, add `https://a.omappapi.com` to the CSP `script-src` directive.
- **No git auto-deploy:** See Deploy Pipeline above.

## Dev Server

```bash
# Option 1: npx serve (used by Claude Code launch.json)
npx serve -l 3456 .

# Option 2: Python (supports video range requests)
python3 server.py 8088
```

## Repo

- **GitHub:** `github.com/habitat-creative/dayofgiving-landing`
- **Branch:** `main` (only branch)
- **Cloudflare Pages project:** `educationjuive`
- **Live URL:** https://educationjuive.com
