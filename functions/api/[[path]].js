// ============================================================
// CrowdChange API Proxy — Cloudflare Pages Function
// Keeps the API key server-side, never exposed to the client.
// Per-school API keys (one per CrowdChange subsite).
// ============================================================

// Allowed fundraiser IDs (prevent enumeration of other campaigns)
var ALLOWED_IDS = ['128031','128030','128028','128026','128029','128027','128011','128018'];
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

export async function onRequestGet(context) {
  var path = context.params.path;
  if (!path || !path.length) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  var joined = path.join('/');

  // Validate path shape: fundraiser/{id} or fundraiser/{id}/donors
  var match = joined.match(/^fundraiser\/(\d+)(\/donors)?$/);
  if (!match) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  var fundraiserId = match[1];
  if (ALLOWED_IDS.indexOf(fundraiserId) === -1) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  // Build upstream URL
  var upstream = API_BASE + '/v2/client/' + joined;

  // Whitelist query params for /donors endpoint
  if (match[2]) {
    var url = new URL(context.request.url);
    var params = new URLSearchParams();
    var page = url.searchParams.get('page');
    var limit = url.searchParams.get('limit');
    var sort = url.searchParams.get('sort');
    var direction = url.searchParams.get('direction');
    var onlyReceived = url.searchParams.get('only_received');

    if (page) { var p = parseInt(page, 10); if (p > 0 && p <= 1000) params.set('page', p.toString()); }
    if (limit) { var l = parseInt(limit, 10); if (l > 0) params.set('limit', Math.min(l, 50).toString()); }
    if (sort === 'amount') { params.set('sort', 'amount'); params.set('direction', 'desc'); }
    if (onlyReceived === '0') params.set('only_received', '0');

    var qs = params.toString();
    if (qs) upstream += '?' + qs;
  }

  // Look up per-school API key
  var keyVar = FID_TO_KEY[fundraiserId];
  var apiKey = keyVar ? context.env[keyVar] : null;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  var attempts = 2;
  for (var i = 0; i < attempts; i++) {
    try {
      var resp = await fetch(upstream, {
        headers: { 'Authorization': apiKey, 'Accept': 'application/json' },
        cf: { cacheTtl: 0 }
      });

      if (resp.ok) {
        var body = await resp.text();
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=25',
          }
        });
      }
      // 429 rate-limited: wait longer and retry
      if (resp.status === 429) {
        if (i < attempts - 1) await new Promise(function(r) { setTimeout(r, 1000); });
        continue;
      }
      // 4xx (not 429): return the actual upstream status code
      if (resp.status < 500) {
        return new Response(JSON.stringify({ error: 'Upstream error' }), {
          status: resp.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // 5xx: retry
      if (i < attempts - 1) await new Promise(function(r) { setTimeout(r, 300); });
    } catch (e) {
      if (i < attempts - 1) await new Promise(function(r) { setTimeout(r, 300); });
    }
  }
  return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
}
