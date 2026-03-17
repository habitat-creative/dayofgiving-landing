// ============================================================
// Centralized state store
// ============================================================

window.DOG_STATE = {
  // Language
  lang: 'en',

  // Campaign phase: 'pre' | 'live' | 'post'
  phase: 'pre',

  // Fundraiser data (populated by API or mock)
  stats: {
    total: { raised: 0, goal: 0, donors: 0 },
    schools: {},  // keyed by slug: { raised, goal, donors }
  },

  // Donor honour roll
  donors: {
    items: [],
    page: 1,
    hasMore: true,
    sort: 'recent',   // 'recent' | 'amount' | 'alpha'
    search: '',
    loading: false,
  },

  // UI flags
  initialized: false,
  dataLoaded: false,
};

// Detect campaign phase (call periodically to auto-transition)
window.detectPhase = function() {
  var now = new Date();
  var prev = DOG_STATE.phase;
  if (now >= DOG_CONFIG.campaignEnd) {
    DOG_STATE.phase = 'post';
  } else if (now >= DOG_CONFIG.campaignStart) {
    DOG_STATE.phase = 'live';
  } else {
    DOG_STATE.phase = 'pre';
  }
  return DOG_STATE.phase !== prev; // true if phase changed
};

// Detect language from URL param, localStorage, or default
window.detectLanguage = function() {
  var params;
  try { params = new URLSearchParams(window.location.search); } catch(e) { params = null; }
  var urlLang = params ? params.get('lang') : null;
  if (urlLang === 'fr' || urlLang === 'en') {
    DOG_STATE.lang = urlLang;
  } else {
    try { DOG_STATE.lang = localStorage.getItem('dog_lang') || 'en'; } catch(e) { DOG_STATE.lang = 'en'; }
  }
  document.documentElement.lang = DOG_STATE.lang;
  try { localStorage.setItem('dog_lang', DOG_STATE.lang); } catch(e) { /* quota or private browsing */ }
};

// Toggle language
window.toggleLanguage = function() {
  DOG_STATE.lang = DOG_STATE.lang === 'en' ? 'fr' : 'en';
  document.documentElement.lang = DOG_STATE.lang;
  try { localStorage.setItem('dog_lang', DOG_STATE.lang); } catch(e) { /* quota or private browsing */ }
};
