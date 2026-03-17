// ============================================================
// Day of Giving 2026 — Landing Page Configuration
// ============================================================
// Drop in API credentials below when ready.
// Set useMockData to false to switch from mock to live.
// ============================================================

window.DOG_CONFIG = {
  // API proxy (Pages Function at /api proxies to CrowdChange server-side)
  apiBase: '/api',

  // API key is stored server-side in Cloudflare Pages secret CC_API_KEY
  apiKey: 'proxy',

  // Fundraiser IDs — one per school (from CrowdChange campaign URLs)
  fundraiserIds: {
    ssa:        '128031',
    akiva:      '128030',
    ha:         '128028',
    maimonide:  '128026',
    hfs:        '128029',
    tth:        '128027',
    jppsbialik: '128011',
    fcja:       '128018',   // "All Schools" umbrella fundraiser
  },

  // Campaign timing (Eastern Daylight Time, UTC-4)
  // March 17 8 AM EDT = 12:00 UTC | March 18 12 PM EDT = 16:00 UTC
  campaignStart: new Date('2026-03-17T12:00:00Z'),
  campaignEnd:   new Date('2026-03-18T16:00:00Z'),

  // Polling interval in ms (during live campaign only)
  pollInterval: 30000,

  // Feature flags
  useMockData:      false,
  showDonorRoll:    true,
  showMatchSection: true,
  showCountdown:    true,
  showFcjaCard:     true,

  // Donor list page size
  donorPageSize: 20,
};
