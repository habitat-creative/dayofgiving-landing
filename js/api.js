// ============================================================
// CrowdChange API layer — with polling and mock fallback
// ============================================================

(function() {
  'use strict';

  var pollTimer = null;
  var cache = {};
  var CACHE_TTL = 25000; // 25s cache (slightly less than poll interval)

  // ---- API Diagnostics ----
  // Note: innerHTML used here with developer-controlled diagnostic data only
  // (endpoint paths, status codes, timestamps — no user/API content injected)
  var API_LOG_MAX = 200;
  var API_LOG_KEY = 'dog_api_log';
  var API_LHR_KEY = 'dog_api_lhr';

  // Restore persisted log from localStorage
  var apiLog = [];
  try {
    var stored = localStorage.getItem(API_LOG_KEY);
    if (stored) apiLog = JSON.parse(stored);
  } catch(e) { /* ignore */ }

  // ---- School name mapping (reverse lookup: fundraiser ID -> slug) ----
  var fidToSchool = {};
  function buildSchoolMap() {
    var ids = DOG_CONFIG.fundraiserIds;
    for (var slug in ids) {
      if (ids.hasOwnProperty(slug)) fidToSchool[ids[slug]] = slug;
    }
  }

  function endpointLabel(endpoint) {
    if (endpoint === '/stats') return 'All Stats';
    if (endpoint.indexOf('/all-donors') === 0) return 'All Donors';
    var match = endpoint.match(/\/fundraiser\/(\d+)(\/donors)?/);
    if (match) {
      var slug = fidToSchool[match[1]];
      if (slug) {
        var school = window.DOG_SCHOOLS && window.DOG_SCHOOLS[slug];
        var name = school ? (school.short_en || slug.toUpperCase()) : slug.toUpperCase();
        return name + (match[2] ? ' donors' : '');
      }
    }
    return endpoint;
  }

  // ---- Last healthy refresh (all schools returned OK in one cycle) ----
  var lastHealthyRefresh = null;
  try { lastHealthyRefresh = localStorage.getItem(API_LHR_KEY); } catch(e) { /* ignore */ }

  function checkHealthyRefresh(count) {
    if (apiLog.length < count) return;
    var recent = apiLog.slice(-count);
    var allGood = recent.every(function(e) { return e.status === 'ok' || e.status === 'cached'; });
    if (allGood) {
      lastHealthyRefresh = new Date().toISOString();
      try { localStorage.setItem(API_LHR_KEY, lastHealthyRefresh); } catch(e) { /* quota */ }
    }
  }

  // ---- Response time percentiles ----
  function computePercentiles() {
    var times = apiLog.filter(function(e) { return e.status === 'ok' && e.ms > 0; })
      .map(function(e) { return e.ms; }).sort(function(a, b) { return a - b; });
    if (!times.length) return { median: 0, p95: 0, p99: 0 };
    return {
      median: times[Math.floor(times.length / 2)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.min(Math.floor(times.length * 0.99), times.length - 1)]
    };
  }

  function logApi(endpoint, status, ms, detail) {
    var entry = {
      time: new Date().toISOString(),
      endpoint: endpoint,
      status: status, // 'ok', 'fail', 'error', 'cached'
      ms: ms,
      detail: detail || ''
    };
    apiLog.push(entry);
    if (apiLog.length > API_LOG_MAX) apiLog.shift();
    try { localStorage.setItem(API_LOG_KEY, JSON.stringify(apiLog)); } catch(e) { /* quota */ }
    if (status === 'fail' || status === 'error') {
      console.warn('[API ' + status.toUpperCase() + '] ' + endpoint + ' (' + ms + 'ms) ' + (detail || ''));
    }
  }

  window.getApiLog = function() { return apiLog.slice(); };

  window.showApiDiagnostics = function() {
    var existing = document.getElementById('apiDiagPanel');
    if (existing) { existing.remove(); return; }

    var panel = document.createElement('div');
    panel.id = 'apiDiagPanel';
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:50vh;overflow:auto;background:#1a1a2e;color:#e0e0e0;font:11px/1.5 monospace;padding:12px 16px;z-index:99999;border-top:2px solid #34B1FF;';

    // Build header row with close button
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    var title = document.createElement('b');
    title.style.cssText = 'color:#34B1FF;font-size:13px;';
    title.textContent = 'API Diagnostics';
    var closeBtn = document.createElement('span');
    closeBtn.style.cssText = 'cursor:pointer;color:#888;font-size:16px;padding:4px 8px;';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('click', function() { panel.remove(); });
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Build stats + table via innerHTML (developer-controlled data only)
    var body = document.createElement('div');
    var fails = apiLog.filter(function(e) { return e.status === 'fail' || e.status === 'error'; });
    var total = apiLog.length;
    var okCount = apiLog.filter(function(e) { return e.status === 'ok'; }).length;
    var cachedCount = apiLog.filter(function(e) { return e.status === 'cached'; }).length;
    var liveCount = okCount + fails.length;
    var successRate = liveCount > 0 ? ((okCount / liveCount) * 100).toFixed(1) : '--';
    var perc = computePercentiles();
    var upstreamFails = apiLog.filter(function(e) { return e.status === 'fail'; }).length;
    var clientErrors = apiLog.filter(function(e) { return e.status === 'error'; }).length;
    var rateColor = successRate === '--' ? '#aaa' : parseFloat(successRate) >= 99 ? '#4ade80' : parseFloat(successRate) >= 90 ? '#fbbf24' : '#f87171';

    // Row 1: counts + success rate
    var html = '<div style="margin-bottom:4px;color:#aaa;">'
      + 'Total: ' + total + ' | OK: <span style="color:#4ade80;">' + okCount + '</span>'
      + ' | Cached: <span style="color:#60a5fa;">' + cachedCount + '</span>'
      + ' | Failed: <span style="color:' + (fails.length ? '#f87171' : '#4ade80') + ';">' + fails.length + '</span>'
      + ' | <b style="color:' + rateColor + ';">Success: ' + successRate + '%</b></div>';

    // Row 2: latency percentiles + error breakdown + last healthy refresh
    html += '<div style="margin-bottom:8px;color:#aaa;">'
      + 'Latency — Median: <span style="color:#e0e0e0;">' + perc.median + 'ms</span>'
      + ' | p95: <span style="color:#e0e0e0;">' + perc.p95 + 'ms</span>'
      + ' | p99: <span style="color:#e0e0e0;">' + perc.p99 + 'ms</span>';
    if (fails.length) {
      html += ' | Upstream (HTTP): <span style="color:#f87171;">' + upstreamFails + '</span>'
        + ' | Client (network): <span style="color:#fb923c;">' + clientErrors + '</span>';
    }
    if (lastHealthyRefresh) {
      var lhr = lastHealthyRefresh.split('T')[1].split('.')[0];
      html += ' | Last healthy: <span style="color:#4ade80;">' + lhr + '</span>';
    }
    html += '</div>';

    var recent = apiLog.slice(-50).reverse();
    html += '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      + '<tr style="color:#888;text-align:left;"><th style="padding:2px 8px;">Time</th><th style="padding:2px 8px;">School</th><th style="padding:2px 8px;">Status</th><th style="padding:2px 8px;">ms</th><th style="padding:2px 8px;">Detail</th></tr>';
    recent.forEach(function(e) {
      var color = e.status === 'ok' ? '#4ade80' : e.status === 'cached' ? '#60a5fa' : '#f87171';
      var t = e.time.split('T')[1].split('.')[0];
      var label = endpointLabel(e.endpoint);
      var errTag = e.status === 'fail' ? 'upstream ' : e.status === 'error' ? 'client ' : '';
      html += '<tr><td style="padding:2px 8px;color:#888;">' + t + '</td>'
        + '<td style="padding:2px 8px;">' + label + '</td>'
        + '<td style="padding:2px 8px;color:' + color + ';">' + e.status + '</td>'
        + '<td style="padding:2px 8px;">' + e.ms + '</td>'
        + '<td style="padding:2px 8px;color:#888;">' + errTag + e.detail + '</td></tr>';
    });
    html += '</table>';
    body.innerHTML = html;
    panel.appendChild(body);

    document.body.appendChild(panel);
  };

  // Core fetch wrapper (calls same-origin /api proxy — key is server-side)
  function ccFetch(endpoint) {
    if (DOG_CONFIG.useMockData || !DOG_CONFIG.apiKey) return Promise.resolve(null);

    var cacheKey = endpoint;
    var cached = cache[cacheKey];
    if (cached && (Date.now() - cached.time < CACHE_TTL)) {
      logApi(endpoint, 'cached', 0);
      return Promise.resolve(cached.data);
    }

    var t0 = Date.now();
    return fetch(DOG_CONFIG.apiBase + endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    .then(function(res) {
      var ms = Date.now() - t0;
      if (!res.ok) {
        logApi(endpoint, 'fail', ms, 'HTTP ' + res.status);
        return null;
      }
      return res.json().then(function(data) {
        logApi(endpoint, 'ok', ms);
        cache[cacheKey] = { data: data, time: Date.now() };
        return data;
      });
    })
    .catch(function(err) {
      logApi(endpoint, 'error', Date.now() - t0, err.message || 'Network error');
      return null;
    });
  }

  // Get stats for a single school
  window.getSchoolStats = function(slug) {
    var fid = DOG_CONFIG.fundraiserIds[slug];
    if (!DOG_CONFIG.useMockData && DOG_CONFIG.apiKey && fid) {
      return ccFetch('/fundraiser/' + fid).then(function(data) {
        if (data) return { raised: data.raised, goal: data.goal, donors: data.donors };
        return { raised: 0, goal: 0, donors: 0 };
      });
    }
    return Promise.resolve(DOG_MOCK.schools[slug] || { raised: 0, goal: 0, donors: 0 });
  };

  // Get aggregated stats for all schools (server-side aggregation)
  window.getAllStats = function() {
    if (DOG_CONFIG.useMockData || !DOG_CONFIG.apiKey) {
      // Mock path: use per-school fetches
      var slugs = DOG_SCHOOL_ORDER.slice();
      if (DOG_CONFIG.showFcjaCard && DOG_CONFIG.fundraiserIds.fcja) slugs.push('fcja');
      var promises = slugs.map(function(slug) {
        return getSchoolStats(slug).then(function(stats) { return { slug: slug, stats: stats }; });
      });
      return Promise.all(promises).then(function(results) {
        var total = { raised: 0, goal: 0, donors: 0 };
        var schools = {};
        results.forEach(function(r) {
          schools[r.slug] = r.stats;
          if (r.slug !== 'fcja') {
            total.raised += r.stats.raised;
            total.goal += r.stats.goal;
            total.donors += r.stats.donors;
          }
        });
        DOG_STATE.stats.total = total;
        DOG_STATE.stats.schools = schools;
        DOG_STATE.dataLoaded = true;
        return { total: total, schools: schools };
      });
    }

    // Live: single server-side endpoint
    return ccFetch('/stats').then(function(data) {
      if (data && data.schools) {
        DOG_STATE.stats.total = data.total;
        DOG_STATE.stats.schools = data.schools;
        DOG_STATE.dataLoaded = true;
        checkHealthyRefresh(1); // 1 aggregated call = 1 log entry to check
        return data;
      }
      return { total: { raised: 0, goal: 0, donors: 0 }, schools: {} };
    });
  };

  // Get merged donors across all schools (server-side aggregation)
  window.getAllDonors = function(page, sort) {
    // If using mock data, return from mock
    if (DOG_CONFIG.useMockData || !DOG_CONFIG.apiKey) {
      var mockDonors = DOG_MOCK.donors.slice();
      if (sort === 'amount') {
        mockDonors.sort(function(a, b) { return b.total_with_match - a.total_with_match; });
      } else if (sort === 'alpha') {
        mockDonors = mockDonors.filter(function(d) {
          var n = (d.donor_name || '').toLowerCase().trim();
          return n && n !== 'anonymous' && n !== 'supporter';
        });
        mockDonors.sort(function(a, b) {
          return (a.donor_name || '').toLowerCase().localeCompare((b.donor_name || '').toLowerCase());
        });
      }
      // Paginate mock data
      var start = (page - 1) * DOG_CONFIG.donorPageSize;
      var sliced = mockDonors.slice(start, start + DOG_CONFIG.donorPageSize);
      DOG_STATE.donors.hasMore = start + DOG_CONFIG.donorPageSize < mockDonors.length;
      return Promise.resolve(sliced.map(function(d) {
        return {
          name: d.donor_name || '',
          amount: d.total_with_match || 0,
          comment: d.comment || '',
          created_at: d.created_at,
          school: d.school || '',
        };
      }));
    }

    // Live: single server-side aggregation endpoint
    var endpoint = '/all-donors?page=' + page + '&limit=' + DOG_CONFIG.donorPageSize
      + '&sort=' + (sort || 'recent');

    return ccFetch(endpoint).then(function(data) {
      if (data && data.donors) {
        DOG_STATE.donors.hasMore = data.hasMore;
        return data.donors;
      }
      return [];
    });
  };

  // Polling (with new-donation detection, phase-gated)
  window.startPolling = function() {
    if (pollTimer) return;
    // Re-detect phase each poll cycle; only poll during live + post
    detectPhase();
    if (DOG_STATE.phase === 'pre') return;

    pollTimer = setInterval(function() {
      // Auto-transition phase if needed
      var phaseChanged = detectPhase();
      if (phaseChanged && typeof renderAll === 'function') renderAll();

      // Snapshot current donor counts before refresh
      var prev = {};
      var schools = DOG_STATE.stats.schools;
      for (var s in schools) {
        if (schools.hasOwnProperty(s)) prev[s] = schools[s].donors || 0;
      }

      getAllStats().then(function(result) {
        renderMeter();
        renderSchoolCards();

        // Detect which schools gained donors
        var changed = [];
        for (var slug in result.schools) {
          if (result.schools.hasOwnProperty(slug)) {
            var newCount = result.schools[slug].donors || 0;
            var oldCount = prev[slug] || 0;
            if (newCount > oldCount) changed.push(slug);
          }
        }
        if (changed.length && window.fireConfetti) {
          changed.forEach(function(slug) { window.fireConfetti(slug); });
        }

        // Refresh donor roll only if user is on page 1 and not searching
        if (changed.length && DOG_STATE.donors.page === 1 && !DOG_STATE.donors.search) {
          getAllDonors(1, DOG_STATE.donors.sort).then(function(donors) {
            if (donors && donors.length) {
              DOG_STATE.donors.items = donors;
              renderDonorRoll();
            }
          }).catch(function() { /* polling donor refresh failed, ignore */ });
        }
      }).catch(function() { /* polling stats refresh failed, ignore */ });
    }, DOG_CONFIG.pollInterval);
  };

  window.stopPolling = function() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  // Build school lookup map on load
  buildSchoolMap();

  // Pause polling when tab is hidden, resume when visible
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopPolling();
    } else {
      // Re-detect phase (handles pre->live or live->post transitions)
      var phaseChanged = detectPhase();
      if (phaseChanged && typeof renderAll === 'function') renderAll();

      startPolling();
      // Immediate refresh when tab becomes visible
      getAllStats().then(function() {
        renderMeter();
        renderSchoolCards();
      }).catch(function() { /* visibility refresh failed, ignore */ });
      // Refresh donor roll only if user is on page 1 and not searching
      if (DOG_STATE.donors.page === 1 && !DOG_STATE.donors.search) {
        getAllDonors(1, DOG_STATE.donors.sort).then(function(donors) {
          if (donors && donors.length) {
            DOG_STATE.donors.items = donors;
            renderDonorRoll();
          }
        }).catch(function() { /* visibility donor refresh failed, ignore */ });
      }
    }
  });

})();
