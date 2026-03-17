// ============================================================
// Section renderers — build HTML from state
// Mirroring RaiseDays 2025 layout
// ============================================================

(function() {
  'use strict';

  var lang = function() { return DOG_STATE.lang; };

  // ---- HEADER (sticky) ----
  window.renderHeader = function() {
    return '<header class="site-header">'
      + '<div class="header-inner">'
      + '<div class="header-right">'
      + '<div class="lang-switch' + (lang() === 'fr' ? ' is-fr' : '') + '" role="radiogroup" aria-label="Language">'
      + '<button class="lang-switch__opt' + (lang() === 'en' ? ' is-active' : '') + '" role="radio" aria-checked="' + (lang() === 'en') + '" data-lang="en">EN</button>'
      + '<button class="lang-switch__opt' + (lang() === 'fr' ? ' is-active' : '') + '" role="radio" aria-checked="' + (lang() === 'fr') + '" data-lang="fr">FR</button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</header>';
  };

  // ---- HERO ----
  window.renderHero = function() {
    var graphicFile = lang() === 'fr' ? 'maingraphic_fr.png' : 'maingraphic2.png';
    var altText = lang() === 'fr' ? '7 écoles. 1 tradition. Faites-en la vôtre.' : '7 Schools. 1 Tradition. Make it yours.';

    var logoFile = lang() === 'fr' ? 'TopLeftLogo_FR.png' : 'TopLeftLogo.png';
    var logoAlt = lang() === 'fr' ? 'Journée du don' : 'Day of Giving';

    return '<div class="header-logo"><img src="assets/hero/' + logoFile + '?v=12" alt="' + logoAlt + '"></div>'
      + '<section class="hero" id="hero">'
      + '<div class="hero-video-wrap" id="heroVideoWrap"></div>'
      + '<div class="hero-content">'
      + '<div class="hero-logo-wrap">'
      + '<img class="hero-graphic" src="assets/hero/' + graphicFile + '?v=12" alt="' + altText + '">'
      + '</div>'
      + '<a href="#schools" class="btn btn--primary header-cta hero-cta">' + t('header_cta_select') + ' <svg class="header-cta-chevron" viewBox="0 0 12 12" width="12" height="12"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>'
      + '</div>'
      + '</section>';
  };

  // ---- METER + DONOR ROLL SIDE BY SIDE ----
  window.renderMeterDonorSection = function() {
    var curSort = DOG_STATE.donors.sort;

    return '<section class="section section--meter-donors" id="meterDonors">'
      + '<div class="mesh-gradient" aria-hidden="true"><canvas id="meshCanvas"></canvas></div>'
      + '<svg class="section-grain" aria-hidden="true"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#grain)"/></svg>'
      + '<div class="meter-donors-layout">'
      + '<div class="meter-col" id="meterSection"></div>'
      + '<div class="donors-col">'
      + '<img class="donors-paperclip" src="assets/decor/paperclip.png" alt="" aria-hidden="true">'
      + '<div class="donors-wrap">'
      + '<div class="donors-countdown" id="headerCountdown"></div>'
      + '<div class="donors-title-bar">' + t('donors_heading') + '</div>'
      + '<div class="donors-controls">'
      + '<div class="donors-sort">'
      + '<button class="donors-sort__btn' + (curSort === 'recent' ? ' is-active' : '') + '" data-sort="recent" aria-pressed="' + (curSort === 'recent') + '">' + t('donors_recent') + '</button>'
      + '<button class="donors-sort__btn' + (curSort === 'alpha' ? ' is-active' : '') + '" data-sort="alpha" aria-pressed="' + (curSort === 'alpha') + '">' + t('donors_alpha') + '</button>'
      + '<button class="donors-sort__btn' + (curSort === 'amount' ? ' is-active' : '') + '" data-sort="amount" aria-pressed="' + (curSort === 'amount') + '">' + t('donors_top') + '</button>'
      + '</div>'
      + '<input class="donors-search" id="donorSearch" type="text" placeholder="' + t('donors_search_placeholder') + '" aria-label="' + t('donors_search_placeholder') + '" autocomplete="off">'
      + '</div>'
      + '<div class="donors-table-header">'
      + '<span>' + t('donors_supporters') + '</span>'
      + '<span>' + t('donors_effective_gift') + '</span>'
      + '</div>'
      + '<div class="donors-scroll" id="donorsScroll">'
      + '<div id="donorList"><div class="donors-loading"><svg class="donors-loading__icon" viewBox="0 0 100 100"><defs><radialGradient id="cFlare" cx="50%" cy="10%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity=".25"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="#01539d"/><ellipse cx="50" cy="16" rx="34" ry="14" fill="url(#cFlare)"/><path d="M59.4,82C61.8,81.6,63.7,80.6,64.9,78.9C65.4,78.3,66.1,77.1,66.1,76.9C66.1,76.8,66.2,76.6,66.2,76.4C66.4,76.1,66.6,75.4,66.7,74.6C66.8,74.3,66.8,70.4,66.9,65.9C66.9,59.1,66.9,57.8,66.8,57.7C66.7,57.6,65.6,58.1,61.8,60C59.1,61.4,56.8,62.6,56.7,62.6L56.5,62.8L56.4,67.6L56.4,72.4L50.2,72.4C45.8,72.4,44,72.4,43.9,72.3C43.8,72.2,43.8,68.6,43.8,50.1C43.8,29.6,43.8,28,44,27.8C44.1,27.6,44.4,27.6,50.2,27.6C55.7,27.6,56.3,27.6,56.3,27.8C56.4,27.8,56.4,30.4,56.4,33.4C56.4,36.4,56.4,39,56.5,39C56.5,39.1,56.6,39.2,56.7,39.2C56.9,39.2,66.6,34.3,66.8,34.1C66.9,34,66.9,33.1,66.9,30.7C66.9,27.1,66.8,25.4,66.5,24.5C66,22.7,65.8,22.1,65,21.1C64.4,20.3,63.7,19.7,63.2,19.3C62.5,18.8,61.2,18.2,60.8,18.1C60.6,18.1,60.2,18,60,17.9C59.6,17.8,58.6,17.8,50.1,17.8C41.3,17.8,40.6,17.8,40.2,17.9C40,18,39.7,18.1,39.6,18.1C39.4,18.1,39.3,18.1,38.1,18.7C36.7,19.3,35.1,20.9,34.5,22.3C34.4,22.5,34.2,22.9,34.2,23.1C33.9,23.7,33.7,24.5,33.5,25.8C33.3,27.1,33.3,28.3,33.3,50C33.3,70.4,33.3,72.9,33.5,74C33.6,74.7,33.7,75.5,33.8,75.8C33.9,76.1,34,76.5,34,76.6C34,76.7,34,76.8,34.1,76.8C34.2,76.8,34.2,76.9,34.2,76.9C34.2,77,34.3,77.3,34.5,77.6C34.7,78.1,34.9,78.4,35.6,79.3C36,79.8,37.3,80.8,37.9,81.1C39,81.6,39.3,81.7,39.5,81.7C39.6,81.7,39.9,81.8,40.1,81.9C40.3,81.9,41,82,41.6,82.1C43.1,82.2,58.7,82.1,59.4,82Z" fill="#fff"/></svg><div class="donors-loading__shadow"></div></div></div>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</section>';
  };

  // ---- FUNDRAISING METER (left col) ----
  window.renderMeter = function() {
    var el = document.getElementById('meterSection');
    if (!el) return;

    var s = DOG_STATE.stats.total;
    var pct = s.goal > 0 ? Math.round((s.raised / s.goal) * 100) : 0;
    var circumference = 2 * Math.PI * 130; // radius 130
    var offset = circumference - (circumference * Math.min(pct, 100) / 100);

    // Overflow ring (secondary arc shown when pct > 100)
    var overflowPct = Math.max(0, pct - 100);
    var overflowArc = circumference * overflowPct / 100;

    // After first animation, show actual values directly (polling updates)
    var animated = el.dataset.animated === 'true';
    var displayAmount = animated ? formatCurrency(s.raised) : formatCurrency(0);
    var displayPct = animated ? formatPct(pct) : formatPct(0);
    var displayDonors = animated ? s.donors.toLocaleString() : '0';
    // Ring: start empty for animation, or at target for polling updates
    var ringOffset = animated ? offset.toFixed(1) : circumference.toFixed(1);
    var capOffset = animated ? (offset - circumference).toFixed(1) : '0';
    var pulseAngle = animated ? ((Math.min(pct, 100) * 3.6) - 4).toFixed(1) : '0';
    // Overflow ring: start invisible for animation, or at target for polling updates
    var overflowTargetOffset = (circumference - overflowArc).toFixed(1);
    var overflowRingOffset = animated ? overflowTargetOffset : circumference.toFixed(1);

    el.innerHTML = '<div class="meter">'
      + '<div class="meter-ring-wrap">'
      + '<svg class="meter-svg" viewBox="0 0 300 300">'
      + '<defs>'
      + '<linearGradient id="ringDepthGrad" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="#5BC4FF"/>'
      + '<stop offset="50%" stop-color="#34B1FF"/>'
      + '<stop offset="100%" stop-color="#0d8bd6"/>'
      + '</linearGradient>'
      + '<linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="rgba(255,255,255,0.50)"/>'
      + '<stop offset="30%" stop-color="rgba(210,230,245,0.22)"/>'
      + '<stop offset="60%" stop-color="rgba(190,220,240,0.16)"/>'
      + '<stop offset="100%" stop-color="rgba(180,215,240,0.12)"/>'
      + '</linearGradient>'
      + '</defs>'
      + '<circle class="meter-ring-back" cx="150" cy="150" r="130" />'
      + '<circle class="meter-ring-glass" cx="150" cy="150" r="130" />'
      + '<circle class="meter-ring-edge" cx="150" cy="150" r="143" />'
      + '<circle class="meter-ring-edge" cx="150" cy="150" r="117" />'
      + '<circle class="meter-ring-fill" cx="150" cy="150" r="130" '
      + 'stroke-dasharray="' + circumference.toFixed(1) + '" '
      + 'stroke-dashoffset="' + ringOffset + '" '
      + 'data-target-offset="' + offset.toFixed(1) + '" '
      + 'style="--progress: ' + Math.min(pct, 100) + ';" />'
      + '<circle class="meter-ring-cap" cx="150" cy="150" r="130" '
      + 'stroke-dasharray="0.01 9999" stroke-dashoffset="' + capOffset + '" '
      + 'data-target-offset="' + (offset - circumference).toFixed(1) + '" />'
      + (overflowPct > 0
        ? '<circle cx="150" cy="150" r="130" '
          + 'style="fill:none;stroke:#111827;stroke-width:16;stroke-linecap:round;transform:rotate(-90deg);transform-origin:center" '
          + 'stroke-dasharray="' + circumference.toFixed(1) + '" '
          + 'stroke-dashoffset="' + overflowRingOffset + '" '
          + 'data-target-offset="' + overflowTargetOffset + '" />'
          + (function() {
            var midAngle = (overflowPct / 100 * 360) * 0.18;
            var rad = midAngle * Math.PI / 180;
            var lx = 150 + 130 * Math.sin(rad);
            var ly = 150 - 130 * Math.cos(rad);
            return '<g transform="translate(' + lx.toFixed(1) + ',' + ly.toFixed(1) + ') rotate(' + midAngle.toFixed(1) + ')">'
              + '<g class="overflow-pill-pulse">'
              + '<text x="0" y="5" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">+'
              + overflowPct + '%</text>'
              + '</g></g>';
          })()
        : '')
      + (overflowPct > 0 ? '' :
        '<g class="meter-ring-pulse" style="transform: rotate(' + pulseAngle + 'deg)" '
      + 'data-target-angle="' + ((Math.min(pct, 100) * 3.6) - 4).toFixed(1) + '">'
      + '<g class="meter-ring-rock">'
      + '<polygon points="162,20 153,14 153,26" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round" opacity="0.7" />'
      + '</g></g>')
      + '</svg>'
      + (overflowPct > 0 ? '<div class="meter-goal-exceeded">' + t('goal_exceeded') + '</div>' : '')
      + '<div class="meter-center">'
      + '<div class="meter-amount" id="meterAmount">' + displayAmount + '</div>'
      + '<div class="meter-sublabel">' + t('meter_donations_match') + '</div>'
      + '<div class="meter-divider"></div>'
      + '<div class="meter-pct">'
      + '<span class="meter-pct-num">' + displayPct + '</span>'
      + '<span class="meter-pct-right">'
      + '<span class="meter-pct-label">' + t('meter_goal') + '</span>'
      + '<span class="meter-goal">' + formatCurrency(s.goal) + '</span>'
      + '</span>'
      + '</div>'
      + '<div class="meter-divider"></div>'
      + '<div class="meter-donors">'
      + '<span class="meter-donors-num">' + displayDonors + '</span>'
      + '<span class="meter-donors-label">' + t('meter_gifts_made') + '</span>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  };

  // ---- SCHOOL CARDS ----
  window.renderSchoolCards = function() {
    var el = document.getElementById('schoolsGrid');
    if (!el) return;

    var html = '';
    DOG_SCHOOL_ORDER.forEach(function(slug, i) {
      var school = DOG_SCHOOLS[slug];
      var stats = DOG_STATE.stats.schools[slug] || { raised: 0, goal: 0, donors: 0 };
      var pct = stats.goal > 0 ? Math.round((stats.raised / stats.goal) * 100) : 0;
      var name = lang() === 'fr' ? school.name_fr : school.name_en;
      var miniR = 40;
      var miniC = 2 * Math.PI * miniR;
      var miniOff = miniC - (miniC * Math.min(pct, 100) / 100);
      var miniOverflowPct = Math.max(0, pct - 100);
      var outerR = 48;
      var outerC = 2 * Math.PI * outerR;
      var outerOverflowArc = outerC * miniOverflowPct / 100;
      // Dynamic label angle: tracks arc midpoint for small overflows, caps at 9° for larger ones
      var miniLabelDeg = miniOverflowPct > 0 ? Math.min(miniOverflowPct * 1.8, 9) : 9;
      var miniLabelRad = miniLabelDeg * Math.PI / 180;
      var miniLabelX = (50 + outerR * Math.cos(miniLabelRad)).toFixed(1);
      var miniLabelY = (50 + outerR * Math.sin(miniLabelRad)).toFixed(1);
      var miniLabelRot = (90 + miniLabelDeg).toFixed(1);
      // After first paint, render actual values to avoid 0% flash on re-render
      var alreadyLoaded = DOG_STATE.dataLoaded;
      var initOffset = alreadyLoaded ? miniOff.toFixed(1) : miniC.toFixed(1);
      var initPct = alreadyLoaded ? pct : 0;

      html += '<a href="' + school.campaign_url + '" target="_blank" rel="noopener" '
        + 'class="school-card reveal" style="--i: ' + i + '; --accent: ' + school.accent + ';">'
        + '<div class="school-card__logo-wrap">'
        + '<img class="school-card__logo" src="' + school.logo + '" alt="' + name + '" loading="lazy">'
        + '</div>'
        + '<div class="school-card__meter">'
        + '<svg class="school-card__meter-svg" viewBox="0 0 100 100" style="overflow:visible">'
        + '<circle class="school-card__meter-bg" cx="50" cy="50" r="' + miniR + '" />'
        + '<circle class="school-card__meter-fill" cx="50" cy="50" r="' + miniR + '" '
        + 'stroke-dasharray="' + miniC.toFixed(1) + '" '
        + 'stroke-dashoffset="' + initOffset + '" '
        + 'data-target-offset="' + miniOff.toFixed(1) + '" />'
        + (miniOverflowPct > 0
          ? '<circle cx="50" cy="50" r="' + outerR + '" '
            + 'style="fill:none;stroke:#111827;stroke-width:13;stroke-linecap:round" '
            + 'stroke-dasharray="' + outerC.toFixed(1) + '" '
            + 'stroke-dashoffset="' + (outerC - outerOverflowArc).toFixed(1) + '" />'
            // Label: positioned at arc midpoint for small overflows, fixed at 9° for larger ones
            + '<g transform="translate(' + miniLabelX + ',' + miniLabelY + ') rotate(' + miniLabelRot + ')">'
            + '<g class="overflow-pill-pulse">'
            + '<text x="0" y="1" text-anchor="start" font-size="7.5" font-weight="900" fill="#fff">+'
            + miniOverflowPct + '%</text>'
            + '</g></g>'
          : '')
        + '</svg>'
        + '<div class="school-card__meter-water"><div class="school-card__meter-wave"><div class="school-card__meter-blob"></div></div></div>'
        + '<div class="school-card__orbit-wrap"><div class="school-card__orbit-track"></div></div>'
        + '<span class="school-card__meter-pct">' + formatPct(initPct) + '</span>'
        + (function() {
            var dt = t('schools_card_donate');
            var dl = Math.min(55, Math.floor(700 / dt.length));
            return '<svg class="school-card__meter-label" viewBox="0 0 100 120">'
              + '<defs><path id="donate-arc-' + i + '" d="M 0.4 78 A 57 57 0 0 0 99.6 78" fill="none" /></defs>'
              + '<text><textPath href="#donate-arc-' + i + '" startOffset="50%" text-anchor="middle">'
              + dt.split('').map(function(ch, ci) {
                  return '<tspan class="dl" style="--dl:' + (ci * dl) + '">' + ch + '</tspan>';
                }).join('')
              + '</textPath></text></svg>';
          })()
        + (miniOverflowPct > 0 ? '<div class="school-card__goal-badge">' + t('goal_exceeded') + '</div>' : '')
        + '</div>'
        + '</a>';
    });

    // FCJA "All Schools" card
    if (DOG_CONFIG.showFcjaCard) {
      var fcjaUrl = DOG_CONFIG.fundraiserIds.fcja
        ? 'https://dayofgivingmtl.crowdchange.ca/' + DOG_CONFIG.fundraiserIds.fcja
        : '#';

      var fcjaCampaignLogo = lang() === 'fr' ? 'assets/logos/JourneeDeDon.png' : 'assets/logos/DayOfGiving.png';
      html += '<a href="' + fcjaUrl + '" target="_blank" rel="noopener" '
        + 'class="school-card school-card--fcja reveal" style="--i: 7;">'
        + '<div class="school-card__logo-wrap">'
        + '<img class="school-card__logo" src="' + fcjaCampaignLogo + '" alt="Day of Giving" loading="lazy">'
        + '</div>'
        + '<p class="school-card--fcja__label">' + t('schools_all') + '</p>'
        + '<img class="school-card--fcja__badge" src="assets/logos/FCJA.png" alt="Federation CJA" loading="lazy">'
        + '</a>';
    }

    el.innerHTML = html;
    observeReveals(el);
  };

  window.renderSchoolsSection = function() {
    return '<section class="section section--schools" id="schools">'
      + '<h2 class="section-heading reveal">' + t('schools_heading_select') + '</h2>'
      + '<div class="schools-grid" id="schoolsGrid"></div>'
      + '</section>';
  };

  // ---- STATS BAR ----
  window.renderStatsBarSection = function() {
    return '<div class="stats-bar" id="statsBar"></div>';
  };

  window.renderStatsBar = function() {
    var el = document.getElementById('statsBar');
    if (!el) return;
    var s = DOG_STATE.stats.total;
    var schoolCount = DOG_SCHOOL_ORDER.length;

    // Note: innerHTML used here with developer-controlled i18n strings only (no user input)
    el.innerHTML = '<div class="stats-bar__inner">'
      + '<div class="stats-bar__item">'
      + '<span class="stats-bar__num">' + formatCurrency(s.raised) + '</span>'
      + '<span class="stats-bar__label">' + t('stats_total_raised') + '<br>' + t('stats_from_schools', { n: schoolCount }) + '</span>'
      + '</div>'
      + '<div class="stats-bar__divider"></div>'
      + '<div class="stats-bar__item">'
      + '<span class="stats-bar__num">' + s.donors.toLocaleString() + '</span>'
      + '<span class="stats-bar__label">' + t('stats_total_contributions') + '</span>'
      + '</div>'
      + '</div>';
  };

  // ---- ABOUT SECTION ----
  window.renderAbout = function() {
    var img = lang() === 'fr' ? 'assets/hero/HP_image_FR.png' : 'assets/hero/HP_image_EN.png';
    var altText = lang() === 'fr' ? 'Journée du don' : 'Day of Giving';
    var imageCol = '<div class="about-image-col">'
      + '<img class="about-paperclip" src="assets/decor/paperclip.png" alt="" aria-hidden="true">'
      + '<img class="about-image" src="' + img + '?v=13" alt="' + altText + '">'
      + '</div>';

    if (lang() === 'fr') {
      return '<section class="section section--about">'
        + '<div class="about-layout">'
        + '<div class="about-text-col">'
        + '<div class="about-heading-row">'
        + '<div class="about-eyebrow"><span class="eyebrow-top"><span class="eyebrow-num">4</span><span class="eyebrow-ord">e</span></span><span class="eyebrow-label">\u00e9dition<br>annuelle</span></div>'
        + '<div class="about-heading-text">'
        + '<h2 class="about-title">Journ\u00e9e du don<br>des \u00e9coles juives de Montr\u00e9al</h2>'
        + '<p class="about-subtitle">Soutenir les \u00e9coles juives de Montr\u00e9al</p>'
        + '</div>'
        + '</div>'
        + '<div class="about-divider"></div>'
        + '<p class="about-hook">Il y a quatre ans, sept \u00e9coles ont lanc\u00e9 quelque chose de nouveau. Aujourd\u2019hui, c\u2019est devenu une tradition.</p>'
        + '<p>Chaque mois de mars, les \u00e9coles juives de Montr\u00e9al s\u2019unissent autour d\u2019une campagne commune. Des approches diff\u00e9rentes de la vie juive. Des histoires distinctes. Une seule communaut\u00e9 mobilis\u00e9e pour la prochaine g\u00e9n\u00e9ration.</p>'
        + '<p>La Journ\u00e9e du don permet de soutenir l\u2019aide aux frais de scolarit\u00e9, des programmes innovants, les infrastructures ainsi que le travail quotidien essentiel qui assure la vitalit\u00e9 de nos \u00e9coles.</p>'
        + '<p>Les 17 et 18 mars, nous vous invitons \u00e0 faire partie de cette tradition.</p>'
        + '<p class="about-highlight"><span class="hl-count">7 \u00e9coles.</span> <span class="hl-tradition">1 tradition.</span> <span class="hl-yours">Faites-la v\u00f4tre.</span></p>'
        + '</div>'
        + imageCol
        + '</div>'
        + '</section>';
    }
    return '<section class="section section--about">'
      + '<div class="about-layout">'
      + '<div class="about-text-col">'
      + '<div class="about-heading-row">'
      + '<div class="about-eyebrow"><span class="eyebrow-top"><span class="eyebrow-num">4</span><span class="eyebrow-ord">th</span></span><span class="eyebrow-label">Annual</span></div>'
      + '<div class="about-heading-text">'
      + '<h2 class="about-title">Montreal Jewish Day Schools<br>Day of Giving</h2>'
      + '<p class="about-subtitle">Supporting Montreal\u2019s Jewish Day Schools</p>'
      + '</div>'
      + '</div>'
      + '<div class="about-divider"></div>'
      + '<p class="about-hook">Four years ago, seven schools started something new. Today, it\u2019s tradition.</p>'
      + '<p>Each March, Jewish day schools across Montreal come together for one shared campaign. Different approaches to Jewish life. Different histories. One community showing up for the next generation.</p>'
      + '<p>Day of Giving support helps sustain tuition assistance, innovative programs, facilities, and the everyday work that keeps our schools strong.</p>'
      + '<p>On March 17 and 18, we invite you to be part of this tradition.</p>'
      + '<p class="about-highlight"><span class="hl-count">7 Schools.</span> <span class="hl-tradition">1 Tradition.</span> <span class="hl-yours">Make it yours.</span></p>'
      + '</div>'
      + imageCol
      + '</div>'
      + '</section>';
  };

  // ---- MATCH SECTION ----
  window.renderMatch = function() {
    if (!DOG_CONFIG.showMatchSection) return '';

    var tiers = [
      { give: 36,  impact: 72 },
      { give: 72,  impact: 144 },
      { give: 180, impact: 360 },
      { give: 500, impact: 1000 },
    ];

    var tierRows = '';
    tiers.forEach(function(tier) {
      tierRows += '<div class="match-tier">'
        + '<span class="match-tier__give">' + formatCurrency(tier.give) + '</span>'
        + '<span class="match-tier__eq">=</span>'
        + '<span class="match-tier__impact">' + formatCurrency(tier.impact) + '</span>'
        + '</div>';
    });

    var matchHeadingKey = lang() === 'fr' ? 'match_heading_fr' : 'match_heading_en';
    var matchBodyKey = lang() === 'fr' ? 'match_body_fr' : 'match_body_en';

    return '<section class="section section--match">'
      + '<div class="match-layout">'
      + '<div class="match-heading-block">'
      + '<h2 class="match-heading">' + t(matchHeadingKey) + '</h2>'
      + '<p class="match-body">' + t(matchBodyKey) + '</p>'
      + '</div>'
      + '<div class="match-visual">'
      + '<div class="match-multiplier">'
      + '<span class="match-2x">2x</span>'
      + '<span class="match-impact-label">IMPACT</span>'
      + '<span class="match-match-label">MATCH</span>'
      + '</div>'
      + '<div class="match-tiers">' + tierRows + '</div>'
      + '</div>'
      + '</div>'
      + '</section>';
  };

  // ---- PARTNERS ----
  window.renderPartners = function() {
    return '<section class="section section--partners">'
      + '<div class="partners">'
      + '<h3 class="partners__heading">'
      + (lang() === 'fr' ? t('partners_heading_fr') : t('partners_heading_en'))
      + '</h3>'
      + '<div class="partners__logos">'
      + '<div class="partners__logo-wrap"><img src="assets/logos/FCJA.png" alt="Federation CJA" loading="lazy"></div>'
      + '<div class="partners__logo-wrap"><img src="assets/logos/Azrieli-Foundation.png" alt="Azrieli Foundation" loading="lazy"></div>'
      + '</div>'
      + '</div>'
      + '</section>';
  };

  // ---- FOOTER ----
  window.renderFooter = function() {
    // Build school columns
    var schools1 = '', schools2 = '';
    var allSchools = DOG_SCHOOL_ORDER.slice();
    var half = Math.ceil(allSchools.length / 2);

    allSchools.forEach(function(slug, i) {
      var school = DOG_SCHOOLS[slug];
      var name = lang() === 'fr' ? school.name_fr : school.name_en;
      var link = '<a href="' + school.campaign_url + '" target="_blank" rel="noopener">' + name + '</a>';
      if (i < half) schools1 += link;
      else schools2 += link;
    });
    // Add "All Schools" to last column
    schools2 += '<a href="#schools">' + t('schools_all') + '</a>';

    return '<footer class="site-footer">'
      + '<div class="footer-inner">'
      + '<div class="footer-fcja-desc">'
      + '<p>' + (lang() === 'fr' ? t('footer_fcja_fr') : t('footer_fcja_en')) + '</p>'
      + '</div>'
      + '<div class="footer-school-links">'
      + '<div class="footer-school-col">' + schools1 + '</div>'
      + '<div class="footer-school-col">' + schools2 + '</div>'
      + '</div>'
      + '<div class="footer-bottom">'
      + '<p class="footer-copy">\u00a92026 <span id="diagTrigger">' + t('footer_tax') + '</span></p>'
      + '<p class="footer-powered">' + t('footer_powered') + ' <a href="https://www.crowdchange.co" target="_blank" rel="noopener"><img src="assets/logos/CrowdChange_logo.png" alt="CrowdChange" class="footer-cc-logo"></a></p>'
      + '</div>'
      + '</div>'
      + '</footer>';
  };

  // ---- DONOR HONOUR ROLL (rendered into right col) ----
  var donorEntranceDone = false;
  window.resetDonorEntrance = function() { donorEntranceDone = false; };
  window.renderDonorRoll = function(skipFade) {
    var el = document.getElementById('donorList');
    if (!el) return;

    var items = DOG_STATE.donors.items;
    var searchTerm = (DOG_STATE.donors.search || '').toLowerCase();
    if (searchTerm) {
      items = items.filter(function(d) {
        var name = (d.name || '').toLowerCase();
        if (name === 'anonymous' || name === 'supporter') return false;
        return name.indexOf(searchTerm) !== -1;
      });
    }

    // Crossfade on search — fade out, swap, fade in
    var scroll = el.closest('.donors-scroll');
    if (!skipFade && scroll && searchTerm !== (el.dataset.lastSearch || '')) {
      el.dataset.lastSearch = searchTerm;
      scroll.classList.remove('is-visible');
      scroll.classList.add('is-fading');
      setTimeout(function() { renderDonorRoll(true); }, 120);
      return;
    }
    if (scroll) {
      el.dataset.lastSearch = searchTerm;
      scroll.classList.remove('is-fading');
      scroll.classList.add('is-visible');
    }

    if (items.length === 0 && !DOG_STATE.donors.loading) {
      el.innerHTML = '<p class="donors-empty">' + (searchTerm ? t('donors_no_results') : t('donors_empty')) + '</p>';
      return;
    }

    var html = '';
    var shouldAnimate = !donorEntranceDone && !searchTerm;
    items.forEach(function(d, idx) {
      var rawName = (d.name || '').toLowerCase();
      var name = (!d.name || rawName === 'anonymous') ? t('donors_anonymous') : rawName === 'supporter' ? t('donors_supporter') : d.name;
      var school = DOG_SCHOOLS[d.school];
      var schoolName = school ? (lang() === 'fr' ? school.name_fr : school.name_en) : '';
      var timeStr = formatRelativeTime(d.created_at);

      var accent = school ? school.accent : 'var(--cc-blue)';
      var enterCls = shouldAnimate ? ' is-entering" style="--i:' + idx : '';

      html += '<div class="donor-row' + enterCls + '">'
        + '<div class="donor-row__left">'
        + '<div class="donor-row__heart" style="background:' + accent + '14;">'
        + '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="' + accent + '" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
        + '</div>'
        + '<div class="donor-row__info">'
        + '<span class="donor-row__name">' + escapeHtml(name) + '</span>';

      if (d.comment) {
        html += '<span class="donor-row__comment">' + escapeHtml(d.comment) + '</span>';
      }

      html += '<span class="donor-row__meta">' + escapeHtml(timeStr);
      if (schoolName) {
        html += ' ' + t('donors_to') + ' ' + escapeHtml(schoolName);
      }
      if (d.behalf) {
        html += ' ' + t('donors_on_behalf') + ' ' + escapeHtml(d.behalf);
      }
      html += '</span>'
        + '</div>'
        + '</div>';

      if (d.amount) {
        var matched = school && school.has_match;
        html += '<div class="donor-row__amount">'
          + '<span class="donor-row__amount-total">' + formatCurrency(d.amount) + '</span>';
        if (matched) {
          var half = Math.round(d.amount / 2);
          html += '<span class="donor-row__amount-detail">' + formatCurrency(half) + ' ' + t('donors_gift') + ' +</span>'
            + '<span class="donor-row__amount-detail">' + formatCurrency(half) + ' ' + t('donors_match') + '</span>';
        }
        html += '</div>';
      }

      html += '</div>';
    });

    if (DOG_STATE.donors.loading) {
      html += '<div class="donors-loading"><svg class="donors-loading__icon" viewBox="0 0 100 100"><defs><radialGradient id="cFlare2" cx="50%" cy="10%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity=".25"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="#01539d"/><ellipse cx="50" cy="16" rx="34" ry="14" fill="url(#cFlare2)"/><path d="M59.4,82C61.8,81.6,63.7,80.6,64.9,78.9C65.4,78.3,66.1,77.1,66.1,76.9C66.1,76.8,66.2,76.6,66.2,76.4C66.4,76.1,66.6,75.4,66.7,74.6C66.8,74.3,66.8,70.4,66.9,65.9C66.9,59.1,66.9,57.8,66.8,57.7C66.7,57.6,65.6,58.1,61.8,60C59.1,61.4,56.8,62.6,56.7,62.6L56.5,62.8L56.4,67.6L56.4,72.4L50.2,72.4C45.8,72.4,44,72.4,43.9,72.3C43.8,72.2,43.8,68.6,43.8,50.1C43.8,29.6,43.8,28,44,27.8C44.1,27.6,44.4,27.6,50.2,27.6C55.7,27.6,56.3,27.6,56.3,27.8C56.4,27.8,56.4,30.4,56.4,33.4C56.4,36.4,56.4,39,56.5,39C56.5,39.1,56.6,39.2,56.7,39.2C56.9,39.2,66.6,34.3,66.8,34.1C66.9,34,66.9,33.1,66.9,30.7C66.9,27.1,66.8,25.4,66.5,24.5C66,22.7,65.8,22.1,65,21.1C64.4,20.3,63.7,19.7,63.2,19.3C62.5,18.8,61.2,18.2,60.8,18.1C60.6,18.1,60.2,18,60,17.9C59.6,17.8,58.6,17.8,50.1,17.8C41.3,17.8,40.6,17.8,40.2,17.9C40,18,39.7,18.1,39.6,18.1C39.4,18.1,39.3,18.1,38.1,18.7C36.7,19.3,35.1,20.9,34.5,22.3C34.4,22.5,34.2,22.9,34.2,23.1C33.9,23.7,33.7,24.5,33.5,25.8C33.3,27.1,33.3,28.3,33.3,50C33.3,70.4,33.3,72.9,33.5,74C33.6,74.7,33.7,75.5,33.8,75.8C33.9,76.1,34,76.5,34,76.6C34,76.7,34,76.8,34.1,76.8C34.2,76.8,34.2,76.9,34.2,76.9C34.2,77,34.3,77.3,34.5,77.6C34.7,78.1,34.9,78.4,35.6,79.3C36,79.8,37.3,80.8,37.9,81.1C39,81.6,39.3,81.7,39.5,81.7C39.6,81.7,39.9,81.8,40.1,81.9C40.3,81.9,41,82,41.6,82.1C43.1,82.2,58.7,82.1,59.4,82Z" fill="#fff"/></svg><div class="donors-loading__shadow"></div></div>';
    }

    // Pop-out the loading icon before swapping in donor rows
    var loader = el.querySelector('.donors-loading');
    if (loader && !DOG_STATE.donors.loading && items.length > 0) {
      loader.classList.add('is-popping');
      // Spawn burst particles around the icon
      var iconRect = loader.querySelector('.donors-loading__icon');
      if (iconRect) {
        var rect = iconRect.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var colors = ['#34B1FF', '#1A8FDD', '#FCD34D', '#01539d', '#A3D9FF'];
        for (var pi = 0; pi < 10; pi++) {
          var dot = document.createElement('span');
          dot.setAttribute('aria-hidden', 'true');
          dot.style.cssText = 'position:fixed;width:8px;height:8px;border-radius:50%;pointer-events:none;z-index:999;'
            + 'left:' + cx + 'px;top:' + cy + 'px;'
            + 'background:' + colors[pi % colors.length] + ';'
            + 'transition:all 0.5s cubic-bezier(0.16,1,0.3,1);opacity:1;';
          document.body.appendChild(dot);
          var angle = (pi / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
          var dist = 40 + Math.random() * 50;
          // Force reflow then animate outward
          dot.offsetWidth; // eslint-disable-line no-unused-expressions
          dot.style.left = (cx + Math.cos(angle) * dist) + 'px';
          dot.style.top = (cy + Math.sin(angle) * dist) + 'px';
          dot.style.opacity = '0';
          dot.style.transform = 'scale(0.2)';
          setTimeout(function(d) { d.remove(); }.bind(null, dot), 600);
        }
      }
      var finalHtml = html;
      var didAnimate = shouldAnimate && items.length > 0;
      setTimeout(function() {
        el.innerHTML = finalHtml;
        if (didAnimate) donorEntranceDone = true;
        if (window.runTypewriter) window.runTypewriter();
      }, 420);
      return;
    }

    el.innerHTML = html;
    if (shouldAnimate && items.length > 0) donorEntranceDone = true;
    if (window.runTypewriter) window.runTypewriter();
  };

  // ---- FULL PAGE RENDER ----
  window.renderAll = function() {
    var main = document.getElementById('app');
    if (!main) return;

    // Preserve meter animation state across re-renders (e.g. language toggle)
    var meterEl = document.getElementById('meterSection');
    var wasAnimated = meterEl && meterEl.dataset.animated === 'true';

    main.innerHTML = renderHeader()
      + renderHero()
      + renderMeterDonorSection()
      + renderAbout()
      + renderSchoolsSection()
      // + renderStatsBarSection()  // hidden for now
      + renderPartners()
      + renderFooter();

    // Restore meter animation state so it shows current values, not zeros
    if (wasAnimated) {
      var newMeter = document.getElementById('meterSection');
      if (newMeter) newMeter.dataset.animated = 'true';
    }

    // Populate dynamic sections
    renderMeter();
    renderSchoolCards();
    renderDonorRoll();
    // renderStatsBar();  // hidden for now

    // Create hero background video via DOM
    setTimeout(function() {
        var vidWrap = document.getElementById('heroVideoWrap');
        if (vidWrap && !vidWrap.querySelector('video')) {
          var vid = document.createElement('video');
          vid.className = 'hero-video';
          vid.setAttribute('autoplay', '');
          vid.setAttribute('muted', '');
          vid.setAttribute('loop', '');
          vid.setAttribute('playsinline', '');
          vid.setAttribute('preload', 'auto');
          vid.muted = true;
          var source = document.createElement('source');
          source.src = 'assets/header.mp4?v=1';
          source.type = 'video/mp4';
          vid.appendChild(source);
          vidWrap.appendChild(vid);
          vid.addEventListener('canplay', function() {
            vid.classList.add('is-loaded');
          }, { once: true });
          vid.load();
          vid.play().catch(function() {});
        }
      }, 500);

    // Re-setup observers and events
    setupScrollObservers();
    setupDonorScroll();
    updateCountdown();
  };

  // ---- HELPERS ----
  var escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(ch) { return escapeMap[ch]; });
  }

  window.formatRelativeTime = function(dateStr) {
    if (!dateStr) return '';
    var now = new Date();
    var then = new Date(dateStr);
    if (isNaN(then.getTime())) return '';
    var diffMs = now - then;
    var diffMin = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMs / 3600000);
    var diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0 || diffMin < 1) return t('time_just_now');
    if (diffMin < 60) return t('time_min_ago', { n: diffMin });
    if (diffHours === 1) return t('time_hour_ago');
    if (diffHours < 24) return t('time_hours_ago', { n: diffHours });
    if (diffDays === 1) return t('time_day_ago');
    return t('time_days_ago', { n: diffDays });
  };

})();
