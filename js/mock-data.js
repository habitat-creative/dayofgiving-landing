// ============================================================
// Mock data — realistic fallback when API keys are not configured
// ============================================================

(function() {
  // Helper: ISO string for N minutes ago
  function ago(minutes) {
    return new Date(Date.now() - minutes * 60000).toISOString();
  }

  window.DOG_MOCK = {
    // Per-school fundraiser stats
    schools: {
      ssa:        { raised: 120000, goal: 200000, donors: 412 },
      akiva:      { raised: 52500,  goal: 150000, donors: 287 },
      ha:         { raised: 175000, goal: 250000, donors: 489 },
      maimonide:  { raised: 78750,  goal: 175000, donors: 356 },
      hfs:        { raised: 31250,  goal: 125000, donors: 248 },
      tth:        { raised: 140000, goal: 200000, donors: 398 },
      jppsbialik: { raised: 168750, goal: 225000, donors: 534 },
      fcja:       { raised: 22500,  goal: 75000,  donors: 123 },
    },

    // Mock donor list — timestamps relative to page load
    donors: [
      // Just now / minutes ago
      { donor_name: 'The Goldberg Family',     total_with_match: 500,  comment: 'For our children\u2019s future!', created_at: ago(2),    school: 'ssa' },
      { donor_name: 'Anonymous',               total_with_match: 180,  comment: '',                                 created_at: ago(6),    school: 'akiva' },
      { donor_name: 'Sarah & Michael Levy',    total_with_match: 360,  comment: 'Proud Hebrew Academy parents',     created_at: ago(14),   school: 'ha' },
      // ~1 hour ago
      { donor_name: 'Michel et Nathalie Cohen',total_with_match: 250,  comment: '',                                 created_at: ago(48),   school: 'maimonide' },
      { donor_name: 'Rabbi Jonathan Stern',    total_with_match: 500,  comment: 'Am Yisrael Chai',                  created_at: ago(75),   school: 'tth' },
      { donor_name: 'Anonymous',               total_with_match: 72,   comment: '',                                 created_at: ago(92),   school: 'hfs' },
      // ~3-5 hours ago
      { donor_name: 'The Kaplan Foundation',   total_with_match: 1800, comment: 'Matching our community\u2019s generosity', created_at: ago(200),  school: 'jppsbialik' },
      { donor_name: 'Jennifer Rosen',          total_with_match: 180,  comment: '',                                 created_at: ago(235),  school: 'ssa' },
      { donor_name: 'David & Rachel Abitbol',  total_with_match: 360,  comment: 'L\u2019\u00e9ducation juive, notre priorit\u00e9', created_at: ago(268),  school: 'maimonide' },
      { donor_name: 'The Sands Family',        total_with_match: 720,  comment: 'We support SSA!',                  created_at: ago(302),  school: 'ssa' },
      // Earlier today (morning)
      { donor_name: 'Anonymous',               total_with_match: 100,  comment: '',                                 created_at: ago(350),  school: 'jppsbialik' },
      { donor_name: 'Myer Bick',              total_with_match: 360,  comment: 'Good luck!',                       created_at: ago(435),  school: 'hfs' },
      { donor_name: 'Oren Toledano',           total_with_match: 250,  comment: '',                                 created_at: ago(510),  school: 'ha' },
      // Yesterday
      { donor_name: 'The Miller Family',       total_with_match: 500,  comment: 'Every child deserves a great education', created_at: ago(1600), school: 'tth' },
      { donor_name: 'Danny Ritter',            total_with_match: 180,  comment: '',                                 created_at: ago(1920), school: 'akiva' },
      { donor_name: 'Alerte Protection Incendie', total_with_match: 1000, comment: 'Corporate match',              created_at: ago(2300), school: 'tth' },
      // 2-3 days ago
      { donor_name: 'Anonymous',               total_with_match: 50,   comment: '',                                 created_at: ago(3100), school: 'jppsbialik' },
      { donor_name: 'Armand Afilalo',          total_with_match: 3600, comment: '',                                 created_at: ago(3500), school: 'ssa' },
      { donor_name: 'Helena Miller',           total_with_match: 180,  comment: 'From our family to yours',         created_at: ago(4300), school: 'ha' },
      { donor_name: 'Yair Reuveni Salzmann',   total_with_match: 360,  comment: '',                                 created_at: ago(4800), school: 'ssa' },
    ],
  };
})();
