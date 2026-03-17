// ============================================================
// Stats Aggregation — Cloudflare Pages Function
// Fetches fundraiser stats for all schools in one call,
// edge-cached for 25s. Returns per-school + totals.
// Per-school API keys (one per CrowdChange subsite).
// ============================================================

var SCHOOLS = {
  ssa: '128031', akiva: '128030', ha: '128028', maimonide: '128026',
  hfs: '128029', tth: '128027', jppsbialik: '128011'
};

var FCJA_ID = '128018'; // umbrella fundraiser (not counted in totals)
var CACHE_TTL = 25;
var API_BASE = 'https://api.crowdchange.ca';

// Map fundraiser ID → env var name for per-school keys
var FID_TO_KEY = {
  '128031': 'CC_KEY_SSA',
  '128030': 'CC_KEY_AKIVA',
  '128028': 'CC_KEY_HA',
  '128026': 'CC_KEY_MAIMONIDE',
  '128029': 'CC_KEY_HFS',
  '128027': 'CC_KEY_TTH',
  '128011': 'CC_KEY_JPPSBIALIK',
  '128018': 'CC_KEY_FCJA',
};

function getKey(fid, env) {
  var varName = FID_TO_KEY[fid];
  return varName ? env[varName] : null;
}

export async function onRequestGet(context) {
  // Diagnostic mode: ?debug=TOKEN shows raw CrowdChange responses
  // Only enabled when DEBUG_TOKEN env var is set and matches the query param
  var reqUrl = new URL(context.request.url);
  var debugParam = reqUrl.searchParams.get('debug');
  var debugToken = context.env.DEBUG_TOKEN;
  var debugMode = !!(debugToken && debugParam && debugParam === debugToken);

  // Declare cache variables at function scope (used later for edge caching)
  var cache = caches.default;
  var cacheUrl = new URL(context.request.url);
  cacheUrl.search = ''; // normalize
  var cacheKey = new Request(cacheUrl.toString());

  if (!debugMode) {
    // Check edge cache (skip for debug)
    var cached = await cache.match(cacheKey);

    if (cached) {
      return new Response(cached.body, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=20' }
      });
    }
  }

  var env = context.env;

  // Fetch all schools + FCJA in parallel
  var slugs = Object.keys(SCHOOLS);
  var fetches = slugs.map(function(slug) {
    var fid = SCHOOLS[slug];
    var apiKey = getKey(fid, env);
    return fetchStats(fid, apiKey, debugMode).then(function(stats) {
      return { slug: slug, stats: stats };
    });
  });

  // Also fetch FCJA
  var fcjaKey = getKey(FCJA_ID, env);
  fetches.push(
    fetchStats(FCJA_ID, fcjaKey, debugMode).then(function(stats) {
      return { slug: 'fcja', stats: stats };
    })
  );

  var results = await Promise.all(fetches);

  var schools = {};
  var total = { raised: 0, goal: 0, donors: 0 };

  results.forEach(function(r) {
    schools[r.slug] = r.stats;
    // Only sum the 7 main schools (not FCJA to avoid double-counting)
    if (r.slug !== 'fcja' && !r.stats._error) {
      total.raised += r.stats.raised || 0;
      total.goal += r.stats.goal || 0;
      total.donors += r.stats.donors || 0;
    }
  });

  var body = JSON.stringify({ schools: schools, total: total });

  // Cache at edge (skip for debug mode)
  if (!debugMode) {
    var cacheResp = new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=' + CACHE_TTL,
      }
    });
    context.waitUntil(cache.put(cacheKey, cacheResp));
  }

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': debugMode ? 'no-store' : 'private, max-age=20',
    }
  });
}

async function fetchStats(fid, apiKey, debugMode) {
  if (!apiKey) {
    if (debugMode) return { raised: 0, goal: 0, donors: 0, _error: true, _fid: fid, _httpStatus: 0, _body: 'No API key configured for this school' };
    return { raised: 0, goal: 0, donors: 0 };
  }

  var url = API_BASE + '/v2/client/fundraiser/' + fid;
  var opts = { headers: { 'Authorization': apiKey, 'Accept': 'application/json' }, cf: { cacheTtl: 0 } };
  var attempts = 2;
  for (var i = 0; i < attempts; i++) {
    try {
      var resp = await fetch(url, opts);
      if (resp.ok) {
        var data = await resp.json();
        var result = {
          raised: data.raised || 0,
          goal: data.goal || 0,
          donors: data.donors || 0,
        };
        if (debugMode) { result._fid = fid; result._status = resp.status; }
        return result;
      }
      if (debugMode && i === attempts - 1) {
        var errBody = '';
        try { errBody = await resp.text(); } catch(e2) {}
        return { raised: 0, goal: 0, donors: 0, _error: true, _fid: fid, _httpStatus: resp.status, _body: errBody };
      }
      // 429 rate-limited: wait longer and retry
      if (resp.status === 429) {
        if (i < attempts - 1) await new Promise(function(r) { setTimeout(r, 1000); });
        continue;
      }
      // Retry on 5xx, give up on other 4xx
      if (resp.status < 500) {
        if (debugMode) {
          var errBody4 = '';
          try { errBody4 = await resp.text(); } catch(e3) {}
          return { raised: 0, goal: 0, donors: 0, _error: true, _fid: fid, _httpStatus: resp.status, _body: errBody4 };
        }
        return { raised: 0, goal: 0, donors: 0 };
      }
      if (i < attempts - 1) await new Promise(function(r) { setTimeout(r, 300); });
    } catch (e) {
      if (debugMode && i === attempts - 1) {
        return { raised: 0, goal: 0, donors: 0, _error: true, _fid: fid, _exception: e.message };
      }
      if (i < attempts - 1) await new Promise(function(r) { setTimeout(r, 300); });
    }
  }
  return { raised: 0, goal: 0, donors: 0 };
}
