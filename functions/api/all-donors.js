// ============================================================
// All-Donors Aggregation — Cloudflare Pages Function
// Fetches ALL donors from all 7 schools:
//   1. Direct donors from main fundraisers (parallel, 7 calls)
//   2. Donors from personal pages & teams (sequential, avoids rate limits)
// Merges, deduplicates, sorts, caches at edge, returns paginated slice.
// Per-school API keys (one per CrowdChange subsite).
// ============================================================

var SCHOOLS = {
  ssa: '128031', akiva: '128030', ha: '128028', maimonide: '128026',
  hfs: '128029', tth: '128027', jppsbialik: '128011'
};

// Public subdomain origins — used for the public donor API (no auth required)
// Same URLs as the PlayBook worker's FUNDRAISER_MAP
var SCHOOL_ORIGINS = {
  ssa:        'https://dayofgivingmtl-solomonschechteracademy.crowdchange.ca',
  akiva:      'https://dayofgivingmtl-akivaschool.crowdchange.ca',
  ha:         'https://dayofgivingmtl-hebrewacademy.crowdchange.ca',
  maimonide:  'https://dayofgivingmtl-ecolemaimonide.crowdchange.ca',
  hfs:        'https://dayofgivingmtl-hebrewfoundationschool.crowdchange.ca',
  tth:        'https://dayofgivingmtl-tth.crowdchange.ca',
  jppsbialik: 'https://dayofgivingmtl-jppsbialik.crowdchange.ca',
};

var FETCH_LIMIT = 50;
var CACHE_TTL = 60;
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

// Slug → env var name (for sub-entity lookups where we have slug, not fid)
var SLUG_TO_KEY = {
  ssa: 'CC_KEY_SSA', akiva: 'CC_KEY_AKIVA', ha: 'CC_KEY_HA',
  maimonide: 'CC_KEY_MAIMONIDE', hfs: 'CC_KEY_HFS', tth: 'CC_KEY_TTH',
  jppsbialik: 'CC_KEY_JPPSBIALIK', fcja: 'CC_KEY_FCJA',
};

function normalizeTimestamp(raw) {
  if (!raw) return null;
  var iso = raw.replace(' ', 'T');
  if (iso.indexOf('Z') === -1 && iso.indexOf('+') === -1 && iso.indexOf('-', 11) === -1) iso += 'Z';
  var t = new Date(iso);
  return isNaN(t.getTime()) ? null : t.toISOString();
}

function getKeyForFid(fid, env) {
  var varName = FID_TO_KEY[fid];
  return varName ? env[varName] : null;
}

function getKeyForSlug(slug, env) {
  var varName = SLUG_TO_KEY[slug];
  return varName ? env[varName] : null;
}

// Retry fetch on 5xx or 429 (CrowdChange intermittent 503s / rate limits)
async function fetchRetry(url, opts) {
  for (var i = 0; i < 2; i++) {
    var resp = await fetch(url, opts);
    if (resp.ok) return resp;
    // 429 rate-limited: wait longer and retry
    if (resp.status === 429) {
      if (i === 0) await new Promise(function(r) { setTimeout(r, 1000); });
      continue;
    }
    // Retry on 5xx, give up on other 4xx
    if (resp.status < 500) return resp;
    if (i === 0) await new Promise(function(r) { setTimeout(r, 300); });
  }
  return resp;
}

export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var sortParam = url.searchParams.get('sort');
  var sort = sortParam === 'amount' ? 'amount' : sortParam === 'alpha' ? 'alpha' : sortParam === 'school' ? 'school' : 'recent';
  var page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  var limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

  // Optional single-school filter (e.g. ?school=ssa)
  var schoolParam = url.searchParams.get('school');
  if (schoolParam && !SCHOOLS[schoolParam]) schoolParam = null;

  // CORS: allow worker origin for school-filtered widget requests
  var corsOrigin = schoolParam ? '*' : 'https://educationjuive.com';

  if (page > 500) return new Response(JSON.stringify({ donors: [], total: 0, hasMore: false }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
  });

  var env = context.env;

  // Check edge cache (keyed by sort order + school filter)
  var cache = caches.default;
  var cacheUrl = new URL(context.request.url);
  cacheUrl.search = '?sort=' + sort + (schoolParam ? '&school=' + schoolParam : '') + '&v=12';
  var cacheKey = new Request(cacheUrl.toString());
  var cached = await cache.match(cacheKey);

  var allDonors;
  if (cached) {
    allDonors = await cached.json();
  } else {
    try {
      allDonors = await fetchAllDonors(env, sort, schoolParam);
    } catch (e) {
      return new Response(JSON.stringify({ donors: [], total: 0, hasMore: false }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }

    var cacheResp = new Response(JSON.stringify(allDonors), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=' + CACHE_TTL,
      }
    });
    context.waitUntil(cache.put(cacheKey, cacheResp));
  }

  // For alpha sort, filter out anonymous/supporter entries at response time
  // (not in the cached data, so all sorts share the same complete cache)
  if (sort === 'alpha') {
    allDonors = allDonors.filter(function(d) {
      var n = (d.name || '').toLowerCase().trim();
      return n && n !== 'anonymous' && n !== 'supporter';
    });
  }

  // Paginate
  var start = (page - 1) * limit;
  var sliced = allDonors.slice(start, start + limit);

  return new Response(JSON.stringify({
    donors: sliced,
    total: allDonors.length,
    hasMore: start + limit < allDonors.length,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=25',
      'Access-Control-Allow-Origin': corsOrigin,
    }
  });
}

async function fetchAllDonors(env, sort, schoolFilter) {
  // When schoolFilter is set, only fetch from that one school
  var slugs = schoolFilter ? [schoolFilter] : Object.keys(SCHOOLS);

  // ---- PASS 1: Direct donors from main fundraisers (parallel, public API) ----
  // Uses the same public endpoint as the PlayBook honour roll widget — no auth needed,
  // correctly returns offline donations with proper name fields.
  var directResults = await Promise.all(slugs.map(function(slug) {
    var fid = SCHOOLS[slug];
    var origin = SCHOOL_ORIGINS[slug];
    return fetchDonorsFromPublicAPI(slug, fid, origin);
  }));

  var merged = [];
  directResults.forEach(function(donors) { merged = merged.concat(donors); });

  // ---- PASS 2: Discover personal pages & teams, fetch their donors (sequential) ----
  // Sequential to avoid CrowdChange rate limits (429)
  for (var i = 0; i < slugs.length; i++) {
    var slug = slugs[i];
    var fid = SCHOOLS[slug];
    var apiKey = getKeyForSlug(slug, env);

    // Personal pages for this school
    var ppDonors = await fetchSubEntityDonors(slug, fid, apiKey, sort, 'personal-pages');
    merged = merged.concat(ppDonors);

    // Teams for this school
    var teamDonors = await fetchSubEntityDonors(slug, fid, apiKey, sort, 'teams');
    merged = merged.concat(teamDonors);
  }

  // ---- Deduplicate by donor ID ----
  // When a duplicate is found and the newer record has behalf (ambassador attribution),
  // merge it into the existing record so we don't lose personal-page attribution.
  var seen = {};
  var byId = {};
  merged = merged.filter(function(d) {
    if (d.id && seen[d.id]) {
      if (d.behalf && byId[d.id] && !byId[d.id].behalf) {
        byId[d.id].behalf = d.behalf;
      }
      return false;
    }
    if (d.id) {
      seen[d.id] = true;
      byId[d.id] = d;
    }
    return true;
  });

  // ---- Sort ----
  if (sort === 'amount') {
    merged.sort(function(a, b) { return b.amount - a.amount; });
  } else if (sort === 'alpha') {
    merged.sort(function(a, b) {
      var nameA = (a.name || '').toLowerCase();
      var nameB = (b.name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  } else if (sort === 'school') {
    merged.sort(function(a, b) {
      var schoolA = (a.school || '').toLowerCase();
      var schoolB = (b.school || '').toLowerCase();
      if (schoolA < schoolB) return -1;
      if (schoolA > schoolB) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  } else {
    merged.sort(function(a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  return merged;
}

// Fetch direct donors from a school's public CrowdChange endpoint (no auth).
// Same approach as the PlayBook honour roll widget — handles offline donations correctly.
async function fetchDonorsFromPublicAPI(slug, fid, origin, behalf) {
  if (!origin) return [];

  var all = [];
  var page = 1;

  while (page <= 100) {
    var url = origin + '/api/fundraiser/' + fid + '/donor?limit=' + FETCH_LIMIT + '&page=' + page;

    try {
      var resp = await fetchRetry(url, { headers: { 'Accept': 'application/json' }, cf: { cacheTtl: 0 } });
      if (!resp.ok) break;

      var json = await resp.json();
      var donors = json.data || [];
      if (donors.length === 0) break;

      donors.forEach(function(d) {
        var record = {
          id: d.id || null,
          name: d.name || '',
          amount: parseFloat(d.total_with_match || d.amount || 0),
          comment: d.comment || '',
          created_at: normalizeTimestamp(d.created_at),
          school: slug,
          matched: (d.total_with_match || 0) > (d.amount || 0),
          is_amount_hidden: d.is_amount_hidden || false,
        };
        if (behalf) record.behalf = behalf;
        all.push(record);
      });

      if (donors.length < FETCH_LIMIT) break;
      page++;
    } catch (e) {
      break;
    }
  }

  return all;
}

// Fetch donors from a sub-entity (personal page or team) via v2 auth API
// Optional behalf param: ambassador/personal-page owner name
async function fetchDonorsFromFundraiser(slug, fid, apiKey, sort, behalf) {
  if (!apiKey) return [];

  var all = [];
  var page = 1;

  while (page <= 100) {
    var params = 'page=' + page + '&limit=' + FETCH_LIMIT;
    if (sort === 'amount') params += '&sort=amount&direction=desc';

    var url = API_BASE + '/v2/client/fundraiser/' + fid + '/donors?' + params;

    try {
      var resp = await fetchRetry(url, {
        headers: { 'Authorization': apiKey, 'Accept': 'application/json' },
        cf: { cacheTtl: 0 }
      });

      if (!resp.ok) break;

      var donors = await resp.json();
      if (!Array.isArray(donors) || donors.length === 0) break;

      donors.forEach(function(d) {
        var record = {
          id: d.id || null,
          name: d.donor_name || d.name || [d.first_name, d.last_name].filter(Boolean).join(' ') || '',
          amount: d.total_with_match || 0,
          comment: d.comment || '',
          created_at: normalizeTimestamp(d.created_at),
          school: slug,
          matched: (d.total_with_match || 0) > (d.total || d.amount || 0),
          is_amount_hidden: d.is_amount_hidden || false,
        };
        if (behalf) record.behalf = behalf;
        all.push(record);
      });

      if (donors.length < FETCH_LIMIT) break;
      page++;
    } catch (e) {
      break;
    }
  }

  return all;
}

// Discover sub-entities (personal pages or teams) for a school, then fetch their donors
// Paginates the search endpoint (up to 5 pages) to handle schools with >50 sub-entities
async function fetchSubEntityDonors(slug, fid, apiKey, sort, entityType) {
  if (!apiKey) return [];

  try {
    var entities = [];
    var maxPages = 5;

    for (var pg = 1; pg <= maxPages; pg++) {
      var searchUrl = API_BASE + '/v2/client/' + entityType + '/search?page=' + pg + '&limit=50&fundraisers=' + fid;

      var resp = await fetchRetry(searchUrl, {
        headers: { 'Authorization': apiKey, 'Accept': 'application/json' },
        cf: { cacheTtl: 0 }
      });

      if (!resp.ok) break;

      var data = await resp.json();
      var batch = Array.isArray(data) ? data : (data.data || data.results || data.items || []);
      if (batch.length === 0) break;

      entities = entities.concat(batch);

      // If we got fewer than 50, we've exhausted all pages
      if (batch.length < 50) break;
    }

    if (entities.length === 0) return [];

    // Fetch donors from each sub-entity sequentially (rate-limit safe)
    // Pass entity name as behalf (ambassador/personal-page/team attribution)
    var all = [];
    for (var i = 0; i < entities.length; i++) {
      if (!entities[i].id) continue;
      var entityName = entities[i].name || entities[i].title || entities[i].full_name || '';
      var donors = await fetchDonorsFromFundraiser(slug, entities[i].id, apiKey, sort, entityName || null);
      all = all.concat(donors);
    }
    return all;
  } catch (e) {
    return [];
  }
}
