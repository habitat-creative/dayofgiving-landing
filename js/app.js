// ============================================================
// App initialization — events, countdown, scroll, language
// ============================================================

(function() {
  'use strict';

  var countdownTimer = null;
  var headerScrollBound = false;
  var smoothScrollBound = false;
  var langToggleBound = false;
  var lang = function() { return DOG_STATE.lang; };

  // ---- COUNTDOWN ----
  // Note: innerHTML used here with developer-controlled i18n strings only (no user input)
  window.updateCountdown = function() {
    var el = document.getElementById('headerCountdown');
    if (!el) return;

    var now = new Date();
    var target, labelKey;

    if (now < DOG_CONFIG.campaignStart) {
      target = DOG_CONFIG.campaignStart;
      labelKey = 'header_countdown_pre';
    } else if (now < DOG_CONFIG.campaignEnd) {
      target = DOG_CONFIG.campaignEnd;
      labelKey = 'header_countdown_live';
    } else {
      el.innerHTML = '<span class="cd-label">' + t('header_countdown_post') + '</span>';
      return;
    }

    var diff = target - now;
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);

    el.innerHTML = '<span class="cd-label">' + t(labelKey) + '</span>'
      + '<span class="cd-digits">'
      + '<span class="cd-unit"><span class="cd-num">' + pad(d) + '</span><span class="cd-suffix">' + t('cd_days') + '</span></span>'
      + '<span class="cd-sep">:</span>'
      + '<span class="cd-unit"><span class="cd-num">' + pad(h) + '</span><span class="cd-suffix">' + t('cd_hours') + '</span></span>'
      + '<span class="cd-sep">:</span>'
      + '<span class="cd-unit"><span class="cd-num">' + pad(m) + '</span><span class="cd-suffix">' + t('cd_minutes') + '</span></span>'
      + '<span class="cd-sep">:</span>'
      + '<span class="cd-unit"><span class="cd-num">' + pad(s) + '</span><span class="cd-suffix">' + t('cd_seconds') + '</span></span>'
      + '<span class="cd-stopwatch">'
      + '<svg viewBox="0 0 28 28" width="28" height="28">'
      + '<circle cx="14" cy="14" r="12" fill="none" stroke="rgba(52,177,255,0.2)" stroke-width="1.5"/>'
      + '<circle cx="14" cy="14" r="12" fill="none" stroke="var(--cc-blue)" stroke-width="1.5" stroke-dasharray="' + (2 * Math.PI * 12).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 12 * (1 - s / 60)).toFixed(1) + '" stroke-linecap="round" transform="rotate(-90 14 14)" class="cd-stopwatch-arc"/>'
      + '<line x1="14" y1="14" x2="14" y2="4" stroke="var(--cc-blue)" stroke-width="1.5" stroke-linecap="round" transform="rotate(' + (s * 6) + ' 14 14)"/>'
      + '<circle cx="14" cy="14" r="2" fill="var(--cc-blue)"/>'
      + '</svg>'
      + '</span>'
      + '</span>';
  };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // ---- SCROLL OBSERVERS ----

  function revealInViewport() {
    var vh = window.innerHeight;
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) {
        el.classList.add('is-visible');
      }
    });
  }

  // Header scroll — bound once, never duplicated
  function setupHeaderScroll() {
    if (headerScrollBound) return;
    headerScrollBound = true;

    window.addEventListener('scroll', function() {
      var header = document.querySelector('.site-header');
      if (!header) return;
      if (window.scrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, { passive: true });

    var header = document.querySelector('.site-header');
    if (header && window.scrollY > 50) {
      header.classList.add('is-scrolled');
    }
  }

  window.setupScrollObservers = function() {
    requestAnimationFrame(function() {
      revealInViewport();
    });

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function(el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    document.querySelectorAll('.reveal:not(.is-visible)').forEach(function(el) {
      observer.observe(el);
    });

    var scrollHandler = function() {
      revealInViewport();
      var remaining = document.querySelectorAll('.reveal:not(.is-visible)');
      if (remaining.length === 0) {
        window.removeEventListener('scroll', scrollHandler);
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
  };

  window.observeReveals = function(parent) {
    requestAnimationFrame(function() {
      var vh = window.innerHeight;
      parent.querySelectorAll('.reveal:not(.is-visible)').forEach(function(el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
          el.classList.add('is-visible');
        }
      });
    });

    if (!('IntersectionObserver' in window)) {
      parent.querySelectorAll('.reveal').forEach(function(el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    parent.querySelectorAll('.reveal:not(.is-visible)').forEach(function(el) {
      observer.observe(el);
    });
  };

  // ---- DONOR SCROLL (infinite scroll) ----
  window.setupDonorScroll = function() {
    var scrollEl = document.getElementById('donorsScroll');
    if (!scrollEl) return;

    scrollEl.addEventListener('scroll', function() {
      if (DOG_STATE.donors.loading || !DOG_STATE.donors.hasMore) return;

      var nearBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 20;
      if (nearBottom) {
        loadMoreDonors();
      }
    });

    var sortBtns = document.querySelectorAll('.donors-sort__btn');
    sortBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var newSort = btn.getAttribute('data-sort');
        if (newSort === DOG_STATE.donors.sort) return;

        DOG_STATE.donors.sort = newSort;
        DOG_STATE.donors.items = [];
        DOG_STATE.donors.page = 1;
        DOG_STATE.donors.hasMore = true;
        DOG_STATE.donors.search = '';
        var searchInput = document.getElementById('donorSearch');
        if (searchInput) searchInput.value = '';

        sortBtns.forEach(function(b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        // Re-trigger slide-in animation for the new sort order
        if (typeof resetDonorEntrance === 'function') resetDonorEntrance();
        loadDonors();
      });
    });

    // ---- DONOR SEARCH ----
    var searchInput = document.getElementById('donorSearch');
    if (searchInput) {
      var searchTimer = null;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
          DOG_STATE.donors.search = searchInput.value.trim().toLowerCase();
          renderDonorRoll();
        }, 200);
      });
    }
  };

  var loadSeq = 0; // sequence counter to prevent race conditions on sort switching
  function loadDonors() {
    var seq = ++loadSeq;
    DOG_STATE.donors.loading = true;
    renderDonorRoll();

    getAllDonors(DOG_STATE.donors.page, DOG_STATE.donors.sort).then(function(donors) {
      if (seq !== loadSeq) return; // stale request, discard
      DOG_STATE.donors.items = donors;
      DOG_STATE.donors.loading = false;
      renderDonorRoll();
    }).catch(function() {
      if (seq !== loadSeq) return;
      DOG_STATE.donors.loading = false;
      renderDonorRoll();
    });
  }

  function loadMoreDonors() {
    if (DOG_STATE.donors.loading) return; // prevent double-fire
    var seq = ++loadSeq;
    DOG_STATE.donors.page++;
    DOG_STATE.donors.loading = true;
    renderDonorRoll();

    getAllDonors(DOG_STATE.donors.page, DOG_STATE.donors.sort).then(function(donors) {
      if (seq !== loadSeq) return;
      DOG_STATE.donors.items = DOG_STATE.donors.items.concat(donors);
      DOG_STATE.donors.loading = false;
      renderDonorRoll();
    }).catch(function() {
      if (seq !== loadSeq) return;
      DOG_STATE.donors.page--; // rollback page increment
      DOG_STATE.donors.loading = false;
      renderDonorRoll();
    });
  }

  // ---- TYPEWRITER EFFECT (donor comments) ----
  var typedSet = new Set();
  var twTimers = [];

  window.runTypewriter = function() {
    // Cancel any in-progress animations
    twTimers.forEach(function(id) { clearInterval(id); });
    twTimers = [];

    var els = document.querySelectorAll('.donor-row__comment');
    var newEls = [];

    els.forEach(function(el) {
      var text = el.textContent;
      if (!text) return;
      if (typedSet.has(text)) {
        el.classList.add('is-typed');
        return;
      }
      newEls.push({ el: el, text: text });
    });

    newEls.forEach(function(item, i) {
      var el = item.el;
      var text = item.text;
      el.textContent = '';
      el.classList.add('is-typing');

      var charIndex = 0;
      setTimeout(function() {
        var id = setInterval(function() {
          charIndex++;
          el.textContent = text.substring(0, charIndex);
          if (charIndex >= text.length) {
            clearInterval(id);
            el.classList.remove('is-typing');
            el.classList.add('is-typed');
            typedSet.add(text);
          }
        }, 60);
        twTimers.push(id);
      }, 350 + i * 500);
    });
  };

  // ---- CONFETTI — side cannons across meter+donors, piles up ----
  var confettiCanvas = null;
  var confettiCtx = null;
  var landedPieces = [];
  var activePieces = [];
  var confettiRunning = false;
  var MAX_LANDED = 600; // cap landed pieces to prevent unbounded growth

  function drawPiece(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation * Math.PI / 180);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    if (p.shape === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  function confettiLoop() {
    if (!confettiCanvas || !confettiCanvas.parentNode) {
      confettiRunning = false;
      return;
    }
    var ctx = confettiCtx;
    var W = confettiCanvas.width;
    var H = confettiCanvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw landed pile
    landedPieces.forEach(function(p) { drawPiece(ctx, p); });

    // Update active pieces
    var still = [];
    activePieces.forEach(function(p) {
      p.age++;
      if (p.age < p.delay) { still.push(p); return; }

      // Landed?
      if (p.y >= p.landY) {
        p.y = p.landY;
        p.rotation = Math.round(p.rotation / 90) * 90 + (Math.random() - 0.5) * 20;
        p.opacity = 1;
        if (landedPieces.length < MAX_LANDED) landedPieces.push(p);
        drawPiece(ctx, p);
        return;
      }

      // Physics
      p.vy += 0.28;
      p.vx *= p.drag;
      p.vy *= (p.vy > 0 ? 0.993 : 1);
      p.x += p.vx + Math.sin(p.age * p.wobbleSpeed + p.wobblePhase) * p.wobbleAmp * 0.3;
      p.y += p.vy;
      p.rotation += p.rotSpeed * 0.4;

      drawPiece(ctx, p);
      still.push(p);
    });
    activePieces = still;

    if (activePieces.length > 0) {
      requestAnimationFrame(confettiLoop);
    } else {
      confettiRunning = false;
      // Final redraw of landed pile
      ctx.clearRect(0, 0, W, H);
      landedPieces.forEach(function(p) { drawPiece(ctx, p); });
    }
  }

  window.fireConfetti = function(schoolSlug) {
    var section = document.getElementById('meterDonors');
    if (!section) return;

    var school = DOG_SCHOOLS[schoolSlug];
    var accent = school ? school.accent : '#34B1FF';
    var colors = [accent, accent, lightenHex(accent, 50), darkenHex(accent, 30), '#FFFFFF', '#FCD34D', '#F9A825'];

    // Create or reuse persistent canvas over the full section
    if (!confettiCanvas || !confettiCanvas.parentNode) {
      confettiCanvas = document.createElement('canvas');
      var rect = section.getBoundingClientRect();
      confettiCanvas.width = rect.width * 2;
      confettiCanvas.height = rect.height * 2;
      confettiCanvas.setAttribute('aria-hidden', 'true');
      confettiCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
      section.style.position = 'relative';
      section.appendChild(confettiCanvas);
      confettiCtx = confettiCanvas.getContext('2d');
      landedPieces = [];
    }

    var W = confettiCanvas.width;
    var H = confettiCanvas.height;
    // Floor: right at bottom edge of section
    var groundBase = H - 6;

    var shapes = [0, 0, 0, 1, 2, 2];
    var HALF = 75; // 75 from each side = 150 total
    for (var i = 0; i < HALF * 2; i++) {
      var fromLeft = i < HALF;
      // Launch from edges, slight vertical spread in upper half
      var startX = fromLeft ? W * 0.02 : W * 0.98;
      var startY = H * (0.15 + Math.random() * 0.30);
      // Arc inward and slightly upward
      var speed = Math.random() * 18 + 14;
      var angle = Math.random() * 0.6 + 0.3; // 0.3–0.9 rad upward
      var shape = shapes[Math.floor(Math.random() * shapes.length)];
      activePieces.push({
        x: startX + (Math.random() - 0.5) * W * 0.03,
        y: startY,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        w: shape === 2 ? Math.random() * 30 + 16 : Math.random() * 20 + 8,
        h: shape === 1 ? 0 : (shape === 2 ? Math.random() * 7 + 3 : Math.random() * 10 + 5),
        r: shape === 1 ? Math.random() * 8 + 4 : 0,
        shape: shape,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        wobbleAmp: Math.random() * 2 + 1,
        wobbleSpeed: Math.random() * 0.04 + 0.02,
        wobblePhase: Math.random() * Math.PI * 2,
        drag: 0.98 - Math.random() * 0.02,
        opacity: 1,
        delay: Math.random() * 4,
        age: 0,
        landY: groundBase + Math.random() * 12 - 6,
      });
    }

    // Start loop if not running
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(confettiLoop);
    }
  };

  function lightenHex(hex, amt) {
    hex = hex.replace('#', '');
    var r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amt);
    var g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amt);
    var b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function darkenHex(hex, amt) {
    hex = hex.replace('#', '');
    var r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amt);
    var g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amt);
    var b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ---- COUNT-UP ANIMATION ----
  window.animateCountUp = function() {
    var meterSection = document.getElementById('meterSection');
    if (!meterSection || meterSection.dataset.animated === 'true') return;

    var rect = meterSection.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    meterSection.dataset.animated = 'true';

    // Sweep the main ring — trigger CSS transition from empty to target
    var ringFill = meterSection.querySelector('.meter-ring-fill');
    if (ringFill && ringFill.dataset.targetOffset) {
      ringFill.getBoundingClientRect(); // force reflow
      ringFill.style.strokeDashoffset = ringFill.dataset.targetOffset;
    }
    // Animate round cap dot to leading end (synced with fill transition)
    var ringCap = meterSection.querySelector('.meter-ring-cap');
    if (ringCap && ringCap.dataset.targetOffset) {
      ringCap.getBoundingClientRect();
      ringCap.style.strokeDashoffset = ringCap.dataset.targetOffset;
    }
    // Animate pulse arrow to leading end
    var ringPulse = meterSection.querySelector('.meter-ring-pulse');
    if (ringPulse && ringPulse.dataset.targetAngle) {
      ringPulse.getBoundingClientRect();
      ringPulse.style.transform = 'rotate(' + ringPulse.dataset.targetAngle + 'deg)';
    }
    // Animate overflow ring (if goal exceeded)
    var ringOverflow = meterSection.querySelector('.meter-ring-overflow');
    if (ringOverflow && ringOverflow.dataset.targetOffset) {
      ringOverflow.getBoundingClientRect();
      ringOverflow.style.strokeDashoffset = ringOverflow.dataset.targetOffset;
    }

    var duration = 2000;
    var fps = 60;
    var totalFrames = Math.round(duration / (1000 / fps));

    var s = DOG_STATE.stats.total;
    var pct = s.goal > 0 ? Math.round((s.raised / s.goal) * 100) : 0;

    var amountEl = meterSection.querySelector('.meter-amount');
    var pctNumEl = meterSection.querySelector('.meter-pct-num');
    var donorsNumEl = meterSection.querySelector('.meter-donors-num');

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    var frame = 0;
    var timer = setInterval(function() {
      frame++;
      var progress = easeOut(frame / totalFrames);

      if (amountEl) amountEl.textContent = formatCurrency(Math.round(s.raised * progress));
      if (pctNumEl) pctNumEl.textContent = formatPct(Math.round(pct * progress));
      if (donorsNumEl) donorsNumEl.textContent = Math.round(s.donors * progress).toLocaleString();

      if (frame >= totalFrames) {
        clearInterval(timer);
        if (amountEl) amountEl.textContent = formatCurrency(s.raised);
        if (pctNumEl) pctNumEl.textContent = formatPct(pct);
        if (donorsNumEl) donorsNumEl.textContent = s.donors.toLocaleString();
      }
    }, 1000 / fps);
  };

  // ---- SCHOOL CARD ENTRANCE ANIMATION ----
  window.animateSchoolCards = function() {
    var cards = document.querySelectorAll('.school-card');
    if (!cards.length) return;

    cards.forEach(function(card, i) {
      var fill = card.querySelector('.school-card__meter-fill');
      var pctEl = card.querySelector('.school-card__meter-pct');
      if (!fill || !fill.dataset.targetOffset) return;

      // Stagger: each card's ring starts 120ms after the previous
      setTimeout(function() {
        fill.getBoundingClientRect(); // force reflow
        fill.style.strokeDashoffset = fill.dataset.targetOffset;

        // Count up the percentage text too
        var slug = DOG_SCHOOL_ORDER[i];
        if (!slug) return;
        var stats = DOG_STATE.stats.schools[slug] || { raised: 0, goal: 0 };
        var targetPct = stats.goal > 0 ? Math.round((stats.raised / stats.goal) * 100) : 0;

        var duration = 1200;
        var fpsCard = 40;
        var totalF = Math.round(duration / (1000 / fpsCard));
        var f = 0;
        function ease(t) { return 1 - Math.pow(1 - t, 3); }
        var cardTimer = setInterval(function() {
          f++;
          var p = ease(f / totalF);
          if (pctEl) pctEl.textContent = formatPct(Math.round(targetPct * p));
          if (f >= totalF) {
            clearInterval(cardTimer);
            if (pctEl) pctEl.textContent = formatPct(targetPct);
          }
        }, 1000 / fpsCard);
      }, i * 120);
    });
  };

  // ---- FLOATING HEARTS ----
  // Hearts trickle out one at a time as you move your mouse over a school card.
  // The more you move, the more hearts appear.

  function spawnHeart(sourceEl, color, spread, sizeBase) {
    var rect = sourceEl.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var el = document.createElement('span');
    el.className = 'floating-heart';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '\u2665';
    if (color) el.style.color = color;

    // spread: 0 = tight from center top, 1 = full circle perimeter
    var s = spread || 0;
    var angle = Math.random() * Math.PI * 2;
    var radius = rect.width / 2 * s;
    var ox = Math.cos(angle) * radius + (Math.random() * 20 - 10);
    var oy = Math.sin(angle) * radius;

    el.style.left = (cx + ox - 8) + 'px';
    el.style.top = (cy + oy + window.scrollY - 8) + 'px';
    var sb = sizeBase || 0.9;
    el.style.fontSize = (sb + Math.random() * sb * 0.5) + 'rem';
    el.style.animationDuration = (1.8 + Math.random() * 1.0) + 's';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 3500);
  }

  function spawnHeartFromButton(btn) {
    spawnHeart(btn, '#34B1FF');
  }

  // Parse hex to RGB, mix toward white or black
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return { r: parseInt(hex.substring(0,2),16), g: parseInt(hex.substring(2,4),16), b: parseInt(hex.substring(4,6),16) };
  }
  function rgbToHex(r, g, b) {
    return '#' + [r,g,b].map(function(v) { return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); }).join('');
  }
  function lighten(hex, amt) {
    var c = hexToRgb(hex);
    return rgbToHex(c.r + (255 - c.r) * amt, c.g + (255 - c.g) * amt, c.b + (255 - c.b) * amt);
  }
  function darken(hex, amt) {
    var c = hexToRgb(hex);
    return rgbToHex(c.r * (1 - amt), c.g * (1 - amt), c.b * (1 - amt));
  }

  // Giant shape SVG configs — heart, Magen David, open book
  var giantShapes = [
    { // Heart balloon
      viewBox: '0 0 200 330',
      path: 'M92 164 C38 128 0 88 0 55 C0 25 22 0 50 0 C70 0 88 14 100 32 C112 14 130 0 150 0 C178 0 200 25 200 55 C200 88 162 128 108 164 Q100 174 92 164Z',
      string: 'M100 174 C102 188 95 200 104 212 C112 222 93 234 100 246 C107 258 94 268 102 280 C108 290 95 300 100 320',
      shine: { cx: '38%', cy: '28%', r: '30%' },
      shine2: { cx: '68%', cy: '30%', r: '18%' },
    },
    { // Magen David balloon
      viewBox: '10 5 180 310',
      path: 'M95 24 Q100 15 105 24 L122 53 Q125 58 131 58 L164 58 Q174 58 169 67 L152 95 Q149 100 152 105 L169 133 Q174 142 164 142 L131 142 Q125 142 122 147 L105 176 Q100 185 95 176 L78 147 Q75 142 69 142 L36 142 Q26 142 31 133 L48 105 Q51 100 48 95 L31 67 Q26 58 36 58 L69 58 Q75 58 78 53 Z',
      string: 'M100 185 C102 199 95 211 104 223 C112 233 93 245 100 257 C107 269 94 279 102 291 C108 301 95 311 100 330',
      soft: true,
      shine: { cx: '45%', cy: '35%', r: '35%' },
      shine2: { cx: '58%', cy: '38%', r: '20%' },
    },
    { // Round balloon
      viewBox: '0 0 200 370',
      path: 'M100 8 C48 8 10 55 10 112 C10 165 50 195 94 200 L100 214 L106 200 C150 195 190 165 190 112 C190 55 152 8 100 8 Z',
      string: 'M100 214 C102 228 95 240 104 252 C112 262 93 274 100 286 C107 298 94 308 102 320 C108 330 95 340 100 360',
      soft: true,
      shine: { cx: '36%', cy: '25%', r: '26%' },
      shine2: { cx: '62%', cy: '28%', r: '14%' },
    },
    { // Star-struck emoji balloon — just the emoji + string
      viewBox: '0 0 200 340',
      emoji: '\uD83E\uDD29',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Bagel emoji balloon
      viewBox: '0 0 200 340',
      emoji: '\uD83E\uDD6F',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Disco ball emoji balloon
      viewBox: '0 0 200 340',
      emoji: '\uD83E\uDEA9',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Thumbs-up 3D emoji PNG balloon
      viewBox: '0 0 200 340',
      imgSrc: 'assets/balloons/emoji1.png',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Israel flag heart PNG balloon
      viewBox: '0 0 200 340',
      imgSrc: 'assets/balloons/flag.png',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Pencil sharpener PNG balloon
      viewBox: '0 0 200 340',
      imgSrc: 'assets/balloons/eraser.png',
      string: 'M100 163 C102 177 95 189 104 201 C112 211 93 223 100 235 C107 247 94 257 102 269 C108 279 95 289 100 330',
    },
    { // Books stack PNG balloon
      viewBox: '0 0 200 360',
      imgSrc: 'assets/balloons/books.png',
      imgRect: { x: -12, y: -12, w: 225, h: 225 },
      string: 'M100 159 C102 173 95 185 104 197 C112 207 93 219 100 231 C107 243 94 253 102 265 C108 275 95 285 100 335',
    },
    { // Canada flag balloon
      viewBox: '0 0 200 340',
      imgSrc: 'assets/balloons/canada.png',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Gift box balloon
      viewBox: '0 0 200 340',
      imgSrc: 'assets/balloons/present.png',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Mystery box balloon
      viewBox: '0 0 200 340',
      imgSrc: 'assets/balloons/box.png',
      string: 'M100 170 C102 184 95 196 104 208 C112 218 93 230 100 242 C107 254 94 264 102 276 C108 286 95 296 100 330',
    },
    { // Thumbs up balloon
      viewBox: '0 0 200 340',
      imgSrc: 'assets/balloons/thumb.png',
      string: 'M100 158 C102 172 95 184 104 196 C112 206 93 218 100 230 C107 242 94 252 102 264 C108 274 95 284 100 330',
    }
  ];

  function pickGiantShape() {
    return giantShapes[Math.floor(Math.random() * giantShapes.length)];
  }

  var ghIdCounter = 0;
  function spawnGiantHeart(sourceEl, color) {
    var rect = sourceEl.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var el = document.createElement('span');
    el.className = 'floating-heart floating-heart--giant';
    el.setAttribute('aria-hidden', 'true');

    var c = color || '#34B1FF';
    var cLight = lighten(c, 0.45);
    var cDark = darken(c, 0.45);
    var cDeep = darken(c, 0.7);
    var cRgb = hexToRgb(c);
    var rimRgba = 'rgba(' + cRgb.r + ',' + cRgb.g + ',' + cRgb.b + ',0.35)';
    var rimRgba0 = 'rgba(' + cRgb.r + ',' + cRgb.g + ',' + cRgb.b + ',0)';

    var uid = 'gh' + (++ghIdCounter);
    var shape = pickGiantShape();
    var fr = shape.fillRule ? ' fill-rule="' + shape.fillRule + '"' : '';

    // Soft shapes get dialed-down shine/rim
    var shineAlpha = shape.soft ? '0.6' : '0.95';
    var shineMid   = shape.soft ? '0.2' : '0.4';
    var shine2Alpha = shape.soft ? '0.3' : '0.6';

    var svg;

    if (shape.imgSrc) {
      // PNG image balloon — string behind, then image on top
      svg = '<svg class="giant-heart-svg" viewBox="' + shape.viewBox + '" xmlns="http://www.w3.org/2000/svg">';
      if (shape.string) {
        svg += '<path d="' + shape.string + '" fill="none" stroke="' + cDark + '" stroke-width="2" stroke-linecap="round" opacity="0.6"/>';
      }
      var ir = shape.imgRect || { x: 10, y: 10, w: 180, h: 180 };
      svg += '<image href="' + shape.imgSrc + '" x="' + ir.x + '" y="' + ir.y + '" width="' + ir.w + '" height="' + ir.h + '" />'
        + '</svg>';
    } else if (shape.emoji) {
      // Emoji balloon — string behind, then emoji on top
      svg = '<svg class="giant-heart-svg" viewBox="' + shape.viewBox + '" xmlns="http://www.w3.org/2000/svg">';
      if (shape.string) {
        svg += '<path d="' + shape.string + '" fill="none" stroke="' + cDark + '" stroke-width="2" stroke-linecap="round" opacity="0.6"/>';
      }
      svg += '<text x="100" y="145" text-anchor="middle" font-size="150" dominant-baseline="central">' + shape.emoji + '</text>'
        + '</svg>';
    } else {
      svg = '<svg class="giant-heart-svg" viewBox="' + shape.viewBox + '" xmlns="http://www.w3.org/2000/svg">'
        + '<defs>'
        + '<radialGradient id="' + uid + '-body" cx="40%" cy="35%" r="65%" fx="35%" fy="30%">'
        + '<stop offset="0%" stop-color="' + cLight + '"/>'
        + '<stop offset="35%" stop-color="' + c + '"/>'
        + '<stop offset="75%" stop-color="' + cDark + '"/>'
        + '<stop offset="100%" stop-color="' + cDeep + '"/>'
        + '</radialGradient>'
        + '<radialGradient id="' + uid + '-shine" cx="' + shape.shine.cx + '" cy="' + shape.shine.cy + '" r="' + shape.shine.r + '">'
        + '<stop offset="0%" stop-color="rgba(255,255,255,' + shineAlpha + ')"/>'
        + '<stop offset="50%" stop-color="rgba(255,255,255,' + shineMid + ')"/>'
        + '<stop offset="100%" stop-color="rgba(255,255,255,0)"/>'
        + '</radialGradient>'
        + '<radialGradient id="' + uid + '-shine2" cx="' + shape.shine2.cx + '" cy="' + shape.shine2.cy + '" r="' + shape.shine2.r + '">'
        + '<stop offset="0%" stop-color="rgba(255,255,255,' + shine2Alpha + ')"/>'
        + '<stop offset="100%" stop-color="rgba(255,255,255,0)"/>'
        + '</radialGradient>'
        + '<radialGradient id="' + uid + '-rim" cx="50%" cy="85%" r="40%">'
        + '<stop offset="0%" stop-color="' + rimRgba + '"/>'
        + '<stop offset="100%" stop-color="' + rimRgba0 + '"/>'
        + '</radialGradient>'
        + '</defs>'
        + '<g style="filter:drop-shadow(1px 1px 0 rgba(255,255,255,0.9)) drop-shadow(2px 2px 0 rgba(255,255,255,0.7)) drop-shadow(3px 3px 1px rgba(255,255,255,0.5)) drop-shadow(4px 4px 2px rgba(255,255,255,0.35)) drop-shadow(0 6px 30px rgba(255,255,255,0.85)) drop-shadow(0 0 60px rgba(255,255,255,0.5))">'
        + '<path d="' + shape.path + '"' + fr + ' fill="url(#' + uid + '-body)" />'
        + '<path d="' + shape.path + '"' + fr + ' fill="url(#' + uid + '-shine)" />'
        + '<path d="' + shape.path + '"' + fr + ' fill="url(#' + uid + '-shine2)" />';

      // Rim glow only on non-soft shapes
      if (!shape.soft) {
        svg += '<path d="' + shape.path + '"' + fr + ' fill="url(#' + uid + '-rim)" />';
      }

      svg += '</g>';

      // Balloon string — outside the glow group
      if (shape.string) {
        svg += '<path d="' + shape.string + '" fill="none" stroke="' + cDark + '" stroke-width="2" stroke-linecap="round" opacity="0.6"/>';
      }

      svg += '</svg>';
    }

    el.innerHTML = svg;

    el.style.left = (cx - 125) + 'px';
    el.style.top = (cy + window.scrollY - 120) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 4500);
  }

  // Mousemove-driven hearts — two modes:
  // REGULAR: gentle hearts trickle on hover (velocity-responsive)
  // FRENZY:  sustained fast movement → progressive shading → giant heart payoff
  var schoolHoverBound = false;
  var lastHeartTime = 0;
  var lastMoveX = 0;
  var lastMoveY = 0;
  var lastMoveTime = 0;
  var giantHeartReady = true;
  var frenzyCooldown = 3000;
  // Circular motion detection state
  var circleAngle = null;        // last atan2 angle from meter center
  var circleTotalRotation = 0;   // cumulative absolute angular rotation (radians)
  var circleTarget = Math.PI * 20; // ~10 full circles to fill water
  var circleCard = null;         // card being circled
  var circleIdleTimer = null;    // timeout before decay starts
  var circleDecayId = null;      // interval for gradual decay

  function clearCircle() {
    if (circleCard) {
      var wave = circleCard.querySelector('.school-card__meter-wave');
      if (wave) {
        wave.style.transition = 'height 0.4s ease-out, opacity 0.2s ease';
        wave.style.height = '0%';
        wave.style.opacity = '0';
      }
      var pctEl = circleCard.querySelector('.school-card__meter-pct');
      if (pctEl) pctEl.style.color = '';
      circleCard = null;
    }
    circleAngle = null;
    circleTotalRotation = 0;
    if (circleIdleTimer) { clearTimeout(circleIdleTimer); circleIdleTimer = null; }
    if (circleDecayId) { clearInterval(circleDecayId); circleDecayId = null; }
  }

  function startCircleDecay() {
    if (circleDecayId) return;
    circleDecayId = setInterval(function() {
      circleTotalRotation = Math.max(0, circleTotalRotation - 3.0);
      if (circleCard) {
        var progress = Math.min(circleTotalRotation / circleTarget, 1);
        var wave = circleCard.querySelector('.school-card__meter-wave');
        if (wave) {
          wave.style.transition = 'none';
          wave.style.height = Math.round(progress * 100) + '%';
          wave.style.opacity = progress > 0 ? '1' : '0';
        }
        var pctEl = circleCard.querySelector('.school-card__meter-pct');
        if (pctEl) pctEl.style.color = progress > 0.45 ? '#fff' : '';
      }
      if (circleTotalRotation <= 0) {
        clearCircle();
      }
    }, 50);
  }

  function resetCircleIdleTimer() {
    if (circleDecayId) { clearInterval(circleDecayId); circleDecayId = null; }
    if (circleIdleTimer) clearTimeout(circleIdleTimer);
    circleIdleTimer = setTimeout(function() {
      startCircleDecay();
    }, 300);
  }

  function setupSchoolHoverHearts() {
    if (schoolHoverBound) return;
    schoolHoverBound = true;

    // Clear circle state when mouse leaves a card
    document.addEventListener('mouseout', function(e) {
      if (!e.target || !e.target.closest) return;
      var card = e.target.closest('.school-card');
      if (card && card === circleCard) {
        var related = e.relatedTarget;
        if (!related || !card.contains(related)) {
          clearCircle();
        }
      }
    });

    document.addEventListener('mousemove', function(e) {
      if (!e.target || !e.target.closest) return;
      var card = e.target.closest('.school-card');
      if (!card) { clearCircle(); return; }

      var now = Date.now();
      var dt = now - lastMoveTime;
      if (dt < 16) return;

      var dx = e.clientX - lastMoveX;
      var dy = e.clientY - lastMoveY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var speed = dt > 0 ? dist / dt : 0;

      lastMoveX = e.clientX;
      lastMoveY = e.clientY;
      lastMoveTime = now;

      var meter = card.querySelector('.school-card__meter');
      if (!meter) return;
      var accent = getComputedStyle(card).getPropertyValue('--accent').trim();

      // ---- CIRCULAR MOTION DETECTION ----
      var mRect = meter.getBoundingClientRect();
      var mcx = mRect.left + mRect.width / 2;
      var mcy = mRect.top + mRect.height / 2;
      var dmx = e.clientX - mcx;
      var dmy = e.clientY - mcy;
      var distFromCenter = Math.sqrt(dmx * dmx + dmy * dmy);

      // Donut zone: 15–70px from meter center — trace circles here
      if (distFromCenter >= 15 && distFromCenter <= 70) {
        var angle = Math.atan2(dmy, dmx);

        if (circleCard !== card) {
          clearCircle();
          circleCard = card;
          circleAngle = angle;
          resetCircleIdleTimer();
          return;
        }

        if (circleAngle !== null) {
          var angleDelta = angle - circleAngle;
          // Normalize to [-PI, PI]
          if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
          if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

          circleTotalRotation += Math.abs(angleDelta);
          var progress = Math.min(circleTotalRotation / circleTarget, 1);

          var wave = card.querySelector('.school-card__meter-wave');
          if (wave) {
            wave.style.transition = 'none';
            wave.style.height = Math.round(progress * 100) + '%';
            wave.style.opacity = '1';
          }

          // Fade pct text to white as water rises for contrast
          var pctEl = card.querySelector('.school-card__meter-pct');
          if (pctEl) {
            pctEl.style.color = progress > 0.45 ? '#fff' : '';
          }

          // Circle complete → giant heart!
          if (progress >= 1 && giantHeartReady) {
            spawnGiantHeart(meter, accent);
            giantHeartReady = false;

            card.classList.add('school-card--shake');
            setTimeout(function() { card.classList.remove('school-card--shake'); }, 500);

            if (pctEl) pctEl.style.color = '';
            if (wave) {
              wave.style.transition = 'height 0.4s ease-out, opacity 0.2s ease';
              wave.style.height = '0%';
              wave.style.opacity = '0';
            }
            clearCircle();
            setTimeout(function() { giantHeartReady = true; }, frenzyCooldown);
            return;
          }
        }

        circleAngle = angle;
        resetCircleIdleTimer();
        // No regular hearts while actively circling
        return;
      }

      // ---- REGULAR MODE (outside donut zone) ----
      var gap, spread, sizeBase;
      if (speed < 0.2)      { gap = 800; spread = 0;    sizeBase = 0.7; }
      else if (speed < 0.5) { gap = 500; spread = 0.15; sizeBase = 0.85; }
      else if (speed < 1.0) { gap = 250; spread = 0.3;  sizeBase = 1.1; }
      else                  { gap = 120; spread = 0.7;  sizeBase = 1.5; }

      if (now - lastHeartTime < gap) return;
      lastHeartTime = now;

      spawnHeart(meter, accent, spread, sizeBase);
    });
  }

  // ---- SMOOTH SCROLL (bound once via delegation) ----
  function setupSmoothScroll() {
    if (smoothScrollBound) return;
    smoothScrollBound = true;

    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').substring(1);
      if (id === 'schools') { spawnHeartFromButton(link); }
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ---- DRAGGABLE STICKY NOTE (mouse + touch) ----
  var stickyDragBound = false;
  function setupStickyDrag() {
    if (stickyDragBound) return;
    stickyDragBound = true;

    var logo = document.querySelector('.header-logo');
    if (!logo) return;

    // Move logo out of header flex flow into body so it roams freely
    document.body.appendChild(logo);
    logo.style.position = 'fixed';
    logo.style.cursor = 'grab';
    logo.style.zIndex = '200';
    logo.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';

    var isTouch = 'ontouchstart' in window;

    // Default position
    function positionLogoDefault() {
      if (isTouch) {
        logo.style.left = '4px';
        logo.style.top = '0px';
      } else {
        var meter = document.querySelector('.meter-ring-wrap');
        if (meter) {
          var meterRect = meter.getBoundingClientRect();
          logo.style.left = (meterRect.left - 20) + 'px';
        } else {
          logo.style.left = '20px';
        }
        logo.style.top = '0px';
      }
    }
    requestAnimationFrame(positionLogoDefault);

    var dragging = false;
    var offsetX = 0;
    var offsetY = 0;
    var startX = 0;
    var startY = 0;
    var hasMoved = false;

    function getXY(e) {
      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      var pt = getXY(e);
      dragging = true;
      hasMoved = false;
      var rect = logo.getBoundingClientRect();
      offsetX = pt.x - rect.left;
      offsetY = pt.y - rect.top;
      startX = pt.x;
      startY = pt.y;
      logo.style.cursor = 'grabbing';
      logo.style.animation = 'none';
      logo.style.transform = 'rotate(-2deg) scale(1.05)';
      logo.style.filter = 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))';
      logo.style.transition = 'none';
      if (!e.touches) e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      var pt = getXY(e);
      var dx = pt.x - startX;
      var dy = pt.y - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
      if (!hasMoved) return;

      if (e.touches) e.preventDefault();

      var x = pt.x - offsetX;
      var y = pt.y - offsetY;

      var vpW = window.innerWidth;
      var vpH = window.innerHeight;
      x = Math.max(0, Math.min(x, vpW - logo.offsetWidth));
      y = Math.max(0, Math.min(y, vpH - logo.offsetHeight));

      var tilt = Math.max(-6, Math.min(6, dx * 0.03));
      logo.style.left = x + 'px';
      logo.style.top = y + 'px';
      logo.style.transform = 'rotate(' + tilt + 'deg) scale(1.05)';
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      logo.style.cursor = 'grab';
      logo.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease';
      logo.style.transform = 'rotate(0deg) scale(1)';
      logo.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))';
      setTimeout(function() { logo.style.animation = ''; }, 500);

      // If dragged to a new spot, pin it to the page (not viewport)
      if (hasMoved) {
        var currentTop = parseFloat(logo.style.top) || 0;
        var currentLeft = parseFloat(logo.style.left) || 0;
        logo.style.position = 'absolute';
        logo.style.top = (currentTop + window.scrollY) + 'px';
        logo.style.left = currentLeft + 'px';
      }
    }

    // Mouse events
    logo.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // Touch events
    logo.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);

  }

  // ---- API DIAGNOSTICS TRIGGER (triple-click footer "Tax" text) ----
  var diagBound = false;
  function setupDiagTrigger() {
    if (diagBound) return;
    diagBound = true;
    var tapCount = 0;
    var tapTimer = null;
    document.addEventListener('click', function(e) {
      var trigger = document.getElementById('diagTrigger');
      if (!trigger || !trigger.contains(e.target)) return;
      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);
      if (tapCount >= 3) {
        tapCount = 0;
        if (window.showApiDiagnostics) window.showApiDiagnostics();
      } else {
        tapTimer = setTimeout(function() { tapCount = 0; }, 600);
      }
    });
  }

  // ---- PAPERCLIP DROP (falls from language toggle) ----
  var paperclipImages = ['assets/decor/HeartPaperclip.png?v=2', 'assets/decor/StarPaperclip.png?v=2'];
  var MAX_DROPPED_CLIPS = 4;

  function dropPaperclip() {
    var toggle = document.querySelector('.lang-switch');
    if (!toggle) return;

    // Cap at 4 — remove oldest (clean up its document-level drag listeners first)
    var existing = document.querySelectorAll('.dropped-paperclip');
    if (existing.length >= MAX_DROPPED_CLIPS) {
      if (existing[0]._cleanupDrag) existing[0]._cleanupDrag();
      existing[0].remove();
    }

    var rect = toggle.getBoundingClientRect();
    var src = paperclipImages[Math.floor(Math.random() * paperclipImages.length)];

    var clip = document.createElement('img');
    clip.src = src;
    clip.alt = '';
    clip.setAttribute('aria-hidden', 'true');
    clip.className = 'dropped-paperclip';
    clip.style.position = 'fixed';
    clip.style.width = '90px';
    clip.style.zIndex = '199';
    clip.style.pointerEvents = 'none';
    clip.style.filter = 'drop-shadow(1px 2px 4px rgba(0,0,0,0.2))';
    clip.style.left = (rect.left + rect.width / 2 - 45) + 'px';
    clip.style.top = rect.bottom + 'px';
    document.body.appendChild(clip);

    function startPhysics() {
      var clipW = clip.offsetWidth || 72;
      var clipH = clip.offsetHeight || 60;
      var x = rect.left + rect.width / 2 - clipW / 2;
      var y = rect.bottom;
      var vx = (Math.random() - 0.5) * 3;
      var vy = -2;
      var gravity = 0.55;
      var restitution = 0.38;
      var rotation = (Math.random() - 0.5) * 15;
      var angularV = vx * 2;
      var floor = window.innerHeight - clipH - 12;

      // Honour roll as a shelf
      var honourRoll = document.querySelector('.donors-wrap');
      var block = null;
      if (honourRoll) {
        var hr = honourRoll.getBoundingClientRect();
        block = { left: hr.left, right: hr.right, top: hr.top };
      }

      function settle() {
        clip.style.left = x + 'px';
        clip.style.top = y + 'px';
        clip.style.transform = 'rotate(' + rotation + 'deg)';
        makePaperclipDraggable(clip);
      }

      function animate() {
        vy += gravity;
        var nx = x + vx;
        var ny = y + vy;

        // Land on honour roll top
        if (block) {
          var prevBottom = y + clipH;
          if (prevBottom <= block.top && ny + clipH > block.top
              && nx + clipW > block.left && nx < block.right) {
            ny = block.top - clipH;
            vy *= -restitution;
            vx *= 0.7;
            angularV *= 0.4;
            if (Math.abs(vy) < 1) { x = nx; y = ny; settle(); return; }
          }
        }

        x = nx;
        y = ny;
        rotation += angularV;

        // Bounce off floor
        if (y >= floor) {
          y = floor;
          vy *= -restitution;
          vx *= 0.7;
          angularV *= 0.4;
          if (Math.abs(vy) < 1) { settle(); return; }
        }

        // Bounce off walls
        if (x < 0) { x = 0; vx *= -0.4; }
        if (x > window.innerWidth - clipW) { x = window.innerWidth - clipW; vx *= -0.4; }

        clip.style.left = x + 'px';
        clip.style.top = y + 'px';
        clip.style.transform = 'rotate(' + rotation + 'deg)';
        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    }

    if (clip.complete && clip.naturalWidth) { startPhysics(); }
    else { clip.onload = startPhysics; }
  }

  function pinToPage(clip) {
    // Convert from fixed (viewport) to absolute (page) so it doesn't follow scroll
    var left = parseFloat(clip.style.left) || 0;
    var top = parseFloat(clip.style.top) || 0;
    clip.style.position = 'absolute';
    clip.style.left = left + 'px';
    clip.style.top = (top + window.scrollY) + 'px';
  }

  function makePaperclipDraggable(clip) {
    pinToPage(clip);
    clip.style.pointerEvents = 'auto';
    clip.style.cursor = 'grab';
    clip.style.transition = 'filter 0.15s ease';

    var dragging = false;
    var offsetX = 0, offsetY = 0;
    var startX = 0, startY = 0;
    var hasMoved = false;

    function getXY(e) {
      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      var pt = getXY(e);
      dragging = true;
      hasMoved = false;
      var r = clip.getBoundingClientRect();
      offsetX = pt.x - r.left;
      offsetY = pt.y - r.top;
      startX = pt.x;
      startY = pt.y;
      // Switch to fixed for smooth drag tracking
      clip.style.position = 'fixed';
      clip.style.left = r.left + 'px';
      clip.style.top = r.top + 'px';
      clip.style.cursor = 'grabbing';
      clip.style.zIndex = '201';
      clip.style.filter = 'drop-shadow(0 6px 14px rgba(0,0,0,0.22))';
      clip.style.transition = 'none';
      if (!e.touches) e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      var pt = getXY(e);
      if (Math.abs(pt.x - startX) > 3 || Math.abs(pt.y - startY) > 3) hasMoved = true;
      if (!hasMoved) return;
      if (e.touches) e.preventDefault();

      var nx = pt.x - offsetX;
      var ny = pt.y - offsetY;
      nx = Math.max(0, Math.min(nx, window.innerWidth - clip.offsetWidth));
      ny = Math.max(0, Math.min(ny, window.innerHeight - clip.offsetHeight));

      clip.style.left = nx + 'px';
      clip.style.top = ny + 'px';
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      clip.style.cursor = 'grab';
      clip.style.zIndex = '199';
      clip.style.transition = 'filter 0.3s ease';
      clip.style.filter = 'drop-shadow(1px 2px 3px rgba(0,0,0,0.15))';
      // Pin back to page so it doesn't follow scroll
      pinToPage(clip);
    }

    clip.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    clip.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);

    // Store cleanup so document-level listeners can be removed when clip is removed
    clip._cleanupDrag = function() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }

  // ---- 3D TILT ON SCHOOL CARDS ----
  var cardTiltBound = false;
  function setupCardTilt() {
    if (cardTiltBound) return;
    cardTiltBound = true;

    document.addEventListener('mousemove', function(e) {
      var card = e.target.closest('.school-card');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var rx = (0.5 - y) * 14;
      var ry = (x - 0.5) * 14;
      // Bypass CSS transition for instant tilt response
      card.style.transition = 'box-shadow 0.4s ease';
      card.style.transform = 'translateY(-10px) scale(1.03) perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    });

    // Reset tilt on mouse leave — restore CSS transition for spring-back
    document.addEventListener('mouseout', function(e) {
      var card = e.target.closest('.school-card');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.transition = '';
        card.style.transform = '';
      }
    });
  }

  // ---- LANGUAGE TOGGLE (bound once via delegation) ----
  function setupLangToggle() {
    if (langToggleBound) return;
    langToggleBound = true;

    document.addEventListener('click', function(e) {
      var toggle = e.target.closest('.lang-switch');
      if (toggle) {
          // Animate the pill slider before re-rendering
          var langSwitch = document.querySelector('.lang-switch');
          if (langSwitch) {
            langSwitch.classList.toggle('is-fr');
            var opts = langSwitch.querySelectorAll('.lang-switch__opt');
            opts.forEach(function(opt) { opt.classList.toggle('is-active'); });
          }
          // Drop a paperclip from the toggle
          dropPaperclip();
          // Short delay so the pill slide is visible, then re-render
          setTimeout(function() {
            toggleLanguage();
            renderAll();
            // Update the draggable logo on body and remove the duplicate from #app
            var bodyLogo = document.body.querySelector(':scope > .header-logo');
            var appLogo = document.querySelector('#app .header-logo');
            if (bodyLogo && appLogo) {
              var newSrc = appLogo.querySelector('img').src;
              bodyLogo.querySelector('img').src = newSrc;
              appLogo.remove();
            }
            initMeshGradient();
            // Re-land static paperclips after re-render
            var staticClips = document.querySelectorAll('.donors-paperclip, .about-paperclip');
            staticClips.forEach(function(c) { c.classList.add('clip-landed'); });
          }, 250);
        return;
      }
    });
  }

  // ---- MESH GRADIENT (canvas) ----
  var meshCleanup = null;

  function initMeshGradient() {
    // Clean up previous instance (prevents listener accumulation on language toggle)
    if (meshCleanup) {
      meshCleanup();
      meshCleanup = null;
    }

    var canvas = document.getElementById('meshCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var blobs = [
      { x: 0.15, y: 0.45, r: 0.45, color: [52, 177, 255], alpha: 0.40, sx: 0.4, sy: 0.2, ox: 0, oy: 0 },
      { x: 0.85, y: 0.35, r: 0.40, color: [20, 60, 160], alpha: 0.30, sx: 0.3, sy: 0.3, ox: 2, oy: 1 },
      { x: 0.5, y: 0.7, r: 0.50, color: [52, 177, 255], alpha: 0.32, sx: 0.35, sy: 0.2, ox: 4, oy: 3 },
      { x: 0.1, y: 0.85, r: 0.35, color: [56, 189, 248], alpha: 0.30, sx: 0.45, sy: 0.25, ox: 1, oy: 5 },
      { x: 0.9, y: 0.6, r: 0.38, color: [13, 71, 140], alpha: 0.22, sx: 0.25, sy: 0.3, ox: 3, oy: 2 }
    ];

    var w, h;
    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var t0 = Date.now();
    var frameId;

    function draw() {
      var elapsed = (Date.now() - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var bx = b.x * w + Math.sin(elapsed * b.sx + b.ox) * w * 0.12;
        var by = b.y * h + Math.cos(elapsed * b.sy + b.oy) * h * 0.08;
        var br = b.r * Math.min(w, h);

        var grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',' + b.alpha + ')');
        grad.addColorStop(1, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ',0)');
        ctx.fillStyle = grad;
        ctx.fillRect(bx - br, by - br, br * 2, br * 2);
      }

      if (!reducedMotion) {
        frameId = requestAnimationFrame(draw);
      }
    }

    draw();

    // Pause when tab hidden
    var visHandler = function() {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
      } else if (!reducedMotion) {
        draw();
      }
    };
    document.addEventListener('visibilitychange', visHandler);

    // Store cleanup for re-init
    meshCleanup = function() {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }

  // ---- INITIALIZATION ----
  document.addEventListener('DOMContentLoaded', function() {
    detectLanguage();
    detectPhase();

    renderAll();
    initMeshGradient();

    // Drift paperclips into place
    var clips = document.querySelectorAll('.donors-paperclip, .about-paperclip');
    clips.forEach(function(clip, i) {
      setTimeout(function() { clip.classList.add('clip-landed'); }, 200 + i * 250);
    });

    // Setup interactions (bound once, never duplicated)
    setupSmoothScroll();
    setupHeaderScroll();
    setupLangToggle();
    setupStickyDrag();
    setupDiagTrigger();
    setupSchoolHoverHearts();
    setupCardTilt();

    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);

    getAllStats().then(function() {
      renderMeter();
      renderSchoolCards();
      renderStatsBar();

      if ('IntersectionObserver' in window) {
        var meterEl = document.getElementById('meterSection');
        if (meterEl) {
          var meterObs = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
              animateCountUp();
              meterObs.disconnect();
            }
          }, { threshold: 0.3 });
          meterObs.observe(meterEl);
        }

        var schoolsEl = document.getElementById('schoolsGrid');
        if (schoolsEl) {
          var schoolsObs = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
              animateSchoolCards();
              schoolsObs.disconnect();
            }
          }, { threshold: 0.15 });
          schoolsObs.observe(schoolsEl);
        }
      } else {
        animateCountUp();
        animateSchoolCards();
      }
    }).catch(function(err) {
      console.warn('Initial stats load failed:', err);
    });

    loadDonors();

    // Always poll — donations can come in before, during, and after campaign
    startPolling();

    DOG_STATE.initialized = true;
  });

  // Re-fetch stats on bfcache restore (back/forward navigation skips DOMContentLoaded)
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      getAllStats().then(function() {
        renderMeter();
        renderSchoolCards();
        renderStatsBar();
      }).catch(function() {});
    }
  });

})();
