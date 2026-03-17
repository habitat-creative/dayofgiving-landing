// ============================================================
// Ambassadors — Cloudflare Pages Function
// Returns personal-page leaderboard for a single school.
// Used by the CrowdChange custom-content widget.
// ============================================================

var SCHOOLS = {
  ssa: '128031', akiva: '128030', ha: '128028', maimonide: '128026',
  hfs: '128029', tth: '128027', jppsbialik: '128011', fcja: '128018'
};

var SLUG_TO_KEY = {
  ssa: 'CC_KEY_SSA', akiva: 'CC_KEY_AKIVA', ha: 'CC_KEY_HA',
  maimonide: 'CC_KEY_MAIMONIDE', hfs: 'CC_KEY_HFS', tth: 'CC_KEY_TTH',
  jppsbialik: 'CC_KEY_JPPSBIALIK', fcja: 'CC_KEY_FCJA',
};

var API_BASE = 'https://api.crowdchange.ca';
var CACHE_TTL = 60;

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept',
    'Cache-Control': 'private, max-age=30',
  };
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var slug = (url.searchParams.get('school') || '').toLowerCase();

  if (!SCHOOLS[slug]) {
    return new Response(JSON.stringify({ error: 'Invalid school slug' }), {
      status: 400, headers: corsHeaders()
    });
  }

  var env = context.env;
  var fid = SCHOOLS[slug];
  var keyVar = SLUG_TO_KEY[slug];
  var apiKey = keyVar ? env[keyVar] : null;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: corsHeaders()
    });
  }

  // Edge cache (keyed by school slug)
  var cache = caches.default;
  var cacheUrl = new URL(context.request.url);
  cacheUrl.search = '?school=' + slug + '&v=1';
  var cacheKey = new Request(cacheUrl.toString());
  var cached = await cache.match(cacheKey);

  if (cached) {
    // Clone with CORS headers (cached response may lack them)
    var body = await cached.text();
    return new Response(body, { headers: corsHeaders() });
  }

  // Debug mode: ?debug=1 returns raw API response for troubleshooting
  var debugMode = url.searchParams.get('debug') === '1';

  // Fetch personal pages from CrowdChange, sorted by amount raised
  var ambassadors = [];
  var debugInfo = [];
  var page = 1;
  var maxPages = 5;

  while (page <= maxPages) {
    var searchUrl = API_BASE + '/v2/client/personal-pages/search'
      + '?fundraisers=' + fid
      + '&sort=amount_raised&direction=desc'
      + '&page=' + page + '&limit=50'
      + '&include_subsites=1';

    try {
      var resp = await fetchRetry(searchUrl, {
        headers: { 'Authorization': apiKey, 'Accept': 'application/json' },
        cf: { cacheTtl: 0 }
      });

      if (debugMode) {
        var raw = await resp.clone().json();
        debugInfo.push({ page: page, status: resp.status, url: searchUrl, rawKeys: raw ? Object.keys(raw) : [], count: Array.isArray(raw) ? raw.length : (raw.data ? raw.data.length : '?'), sample: Array.isArray(raw) && raw[0] ? Object.keys(raw[0]) : (raw.data && raw.data[0] ? Object.keys(raw.data[0]) : []) });
      }

      if (!resp.ok) break;

      var data = await resp.json();
      var batch = Array.isArray(data) ? data : (data.data || data.results || data.items || []);
      if (batch.length === 0) break;

      batch.forEach(function(p) {
        var raised = p.amount_raised || 0;
        var goal = p.amount_goal || 0;
        var pct = goal > 0 ? Math.round((raised / goal) * 100) : 0;

        ambassadors.push({
          name: p.name || '',
          raised: raised,
          raised_formatted: p.amount_raised_formatted || ('$' + raised.toLocaleString()),
          goal: goal,
          goal_formatted: p.amount_goal_formatted || ('$' + goal.toLocaleString()),
          donors: p.n_donors || 0,
          pct: pct,
          url: p.url || '',
        });
      });

      if (batch.length < 50) break;
      page++;
    } catch (e) {
      if (debugMode) debugInfo.push({ page: page, error: e.message });
      break;
    }
  }

  if (debugMode) {
    // Also try X-API-KEY header and teams endpoint
    var altTests = [];
    var tests = [
      { label: 'personal-pages + X-API-KEY', url: API_BASE + '/v2/client/personal-pages/search?fundraisers=' + fid + '&limit=5&include_subsites=1', header: 'X-API-KEY' },
      { label: 'teams + Authorization', url: API_BASE + '/v2/client/teams/search?fundraisers=' + fid + '&limit=5&include_subsites=1', header: 'Authorization' },
      { label: 'teams + X-API-KEY', url: API_BASE + '/v2/client/teams/search?fundraisers=' + fid + '&limit=5&include_subsites=1', header: 'X-API-KEY' },
    ];
    // Also try without fundraiser filter and with text search
    tests.push({ label: 'personal-pages NO filter', url: API_BASE + '/v2/client/personal-pages/search?limit=5&sort=amount_raised&direction=desc', header: 'Authorization' });
    tests.push({ label: 'personal-pages text=Randi', url: API_BASE + '/v2/client/personal-pages/search?text=Randi&limit=5', header: 'Authorization' });
    for (var t = 0; t < tests.length; t++) {
      try {
        var hdr = {};
        hdr[tests[t].header] = apiKey;
        hdr['Accept'] = 'application/json';
        var tr = await fetch(tests[t].url, { headers: hdr });
        var td = await tr.json();
        var tBatch = Array.isArray(td) ? td : (td.data || td.results || td.items || []);
        altTests.push({ label: tests[t].label, status: tr.status, count: tBatch.length, sampleKeys: tBatch.length > 0 ? Object.keys(tBatch[0]) : [], firstName: tBatch.length > 0 ? tBatch[0].name : null });
      } catch (e) {
        altTests.push({ label: tests[t].label, error: e.message });
      }
    }
    return new Response(JSON.stringify({ school: slug, fid: fid, debug: debugInfo, altTests: altTests, ambassadorCount: ambassadors.length, ambassadors: ambassadors }, null, 2), { headers: corsHeaders() });
  }

  var result = JSON.stringify({ ambassadors: ambassadors, school: slug });

  // Cache at edge
  var cacheResp = new Response(result, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=' + CACHE_TTL }
  });
  context.waitUntil(cache.put(cacheKey, cacheResp));

  return new Response(result, { headers: corsHeaders() });
}

async function fetchRetry(url, opts) {
  var resp;
  for (var i = 0; i < 2; i++) {
    resp = await fetch(url, opts);
    if (resp.ok) return resp;
    if (resp.status === 429) {
      if (i === 0) await new Promise(function(r) { setTimeout(r, 1000); });
      continue;
    }
    if (resp.status < 500) return resp;
    if (i === 0) await new Promise(function(r) { setTimeout(r, 300); });
  }
  return resp;
}
