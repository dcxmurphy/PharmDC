'use strict';

/* ============================================================
   SECTION CONFIGURATION
   ============================================================ */

const SUPABASE_URL = 'https://gakjmoiwsqfxdmmpfmga.supabase.co';

const SECTIONS = {
  drugs: {
    label: 'Drugs & Medicines',
    template: 'drug',
    dbSection: 'drugs',
    color: '#1D9E75',
    abbr: 'Rx',
    description: 'Monographs, dosing, interactions & NZ funding',
    azFilter: true,
    tabs: [
      { key: 'overview',          label: 'Overview' },
      { key: 'dosing',            label: 'Dosing' },
      { key: 'renal_dosing',      label: 'Renal Dosing' },
      { key: 'hepatic_dosing',    label: 'Hepatic Dosing' },
      { key: 'adverse_effects',   label: 'Adverse Effects' },
      { key: 'contraindications', label: 'Contraindications' },
      { key: 'interactions',      label: 'Interactions' },
      { key: 'counselling',       label: 'Counselling' },
      { key: 'nz_notes',          label: 'NZ Notes' },
    ],
    suggestions: ['Warfarin', 'Metformin', 'Atorvastatin', 'Ramipril', 'Amlodipine', 'Omeprazole'],
  },
  conditions: {
    label: 'Health Conditions',
    template: 'condition',
    dbSection: 'conditions',
    color: '#1D9E75',
    abbr: 'Dx',
    description: 'Pathophysiology, stepwise therapeutics & monitoring',
    azFilter: false,
    tabs: [
      { key: 'overview',            label: 'Overview' },
      { key: 'pathophysiology',     label: 'Pathophysiology' },
      { key: 'clinical_features',   label: 'Clinical Features' },
      { key: 'non_pharmacological', label: 'Non-Pharmacological' },
      { key: 'pharmacological',     label: 'Pharmacological' },
      { key: 'drug_summary',        label: 'Drug Summary' },
      { key: 'monitoring',          label: 'Monitoring' },
      { key: 'counselling',         label: 'Counselling' },
      { key: 'nz_notes',            label: 'NZ Notes' },
    ],
    suggestions: ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Atrial Fibrillation', 'GORD', 'Heart Failure'],
  },
  anatomy: {
    label: 'Anatomy & Physiology',
    template: 'anatomy',
    dbSection: 'anatomy',
    color: '#1D9E75',
    abbr: 'A&P',
    description: 'Body systems, key structures & clinical relevance',
    azFilter: false,
    tabs: [
      { key: 'overview',               label: 'Overview' },
      { key: 'key_structures',         label: 'Key Structures' },
      { key: 'physiological_function', label: 'Physiology' },
      { key: 'clinical_relevance',     label: 'Clinical Relevance' },
      { key: 'pathological_changes',   label: 'Pathological Changes' },
    ],
    suggestions: ['Renal System', 'Cardiovascular System', 'Respiratory System', 'Liver & Biliary'],
  },
  skills: {
    label: 'Clinical Skills',
    template: 'skill',
    dbSection: 'skills',
    color: '#1D9E75',
    abbr: 'Sk',
    description: 'Formulas, calculations, worked examples & TDM',
    azFilter: false,
    tabs: [
      { key: 'purpose',        label: 'Purpose' },
      { key: 'formula_method', label: 'Formula / Method' },
      { key: 'worked_example', label: 'Worked Example' },
      { key: 'interpretation', label: 'Interpretation' },
      { key: 'when_to_use',    label: 'When To Use' },
      { key: 'pitfalls',       label: 'Pitfalls' },
      { key: 'nz_context',     label: 'NZ Context' },
    ],
    suggestions: ['CrCl Calculation', 'eGFR', 'Warfarin TDM', 'Vancomycin Dosing', 'INR Interpretation'],
  },
  regulation: {
    label: 'Law & Regulation',
    template: 'regulation',
    dbSection: 'regulation',
    color: '#1D9E75',
    abbr: 'Law',
    description: 'Pharmacy law, scheduling & practice rules',
    azFilter: false,
    tabs: [
      { key: 'overview',         label: 'Overview' },
      { key: 'legal_basis',      label: 'Legal Basis' },
      { key: 'practical_rules',  label: 'Practical Rules' },
      { key: 'common_scenarios', label: 'Common Scenarios' },
      { key: 'recent_changes',   label: 'Recent Changes' },
    ],
    suggestions: ['Controlled Drugs', 'Special Authority', 'Standing Orders', 'Medicines Act 1981'],
  },
};

const BODY_SYSTEMS = [
  { name: 'Cardiovascular',    icon: `<path d="M8 13.5C8 13.5 1.5 9.5 1.5 5.5a3.2 3.2 0 016.5-1 3.2 3.2 0 016.5 1c0 4-6.5 8-6.5 8z" stroke="#1D9E75" stroke-width="1.35" stroke-linejoin="round"/>` },
  { name: 'Respiratory',       icon: `<path d="M8 2v4" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M5 6C3 6 2 7.5 2 9.5c0 1.5.8 2.8 2 3l1 .5V6H5z" stroke="#1D9E75" stroke-width="1.35" stroke-linejoin="round"/><path d="M11 6v7l1-.5c1.2-.2 2-1.5 2-3 0-2-1-3.5-3-3.5h-1z" stroke="#1D9E75" stroke-width="1.35" stroke-linejoin="round"/>` },
  { name: 'Neurology',         icon: `<path d="M5 13V9.5C5 9.5 3 9 3 6.5a4.5 4.5 0 019 0C12 9 10 9.5 10 9.5V13" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 11h5" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M6 13h4" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/>` },
  { name: 'Psychiatry',        icon: `<circle cx="8" cy="5.5" r="3" stroke="#1D9E75" stroke-width="1.35"/><path d="M5.5 9.5C4 10 3 11 3 12.5h10c0-1.5-1-2.5-2.5-3" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M6.5 8.5c0 1 .5 2 1.5 2s1.5-1 1.5-2" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/>` },
  { name: 'Endocrine',         icon: `<circle cx="8" cy="8" r="2.5" stroke="#1D9E75" stroke-width="1.35"/><circle cx="8" cy="2.5" r="1.2" stroke="#1D9E75" stroke-width="1.2"/><circle cx="8" cy="13.5" r="1.2" stroke="#1D9E75" stroke-width="1.2"/><circle cx="2.5" cy="8" r="1.2" stroke="#1D9E75" stroke-width="1.2"/><circle cx="13.5" cy="8" r="1.2" stroke="#1D9E75" stroke-width="1.2"/>` },
  { name: 'Gastroenterology',  icon: `<path d="M4 4h8a1 1 0 011 1v1.5c0 3-1.5 5.5-5 6-3.5-.5-5-3-5-6V5a1 1 0 011-1z" stroke="#1D9E75" stroke-width="1.35" stroke-linejoin="round"/><path d="M8 8v3M6.5 9.5h3" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/>` },
  { name: 'Renal',             icon: `<path d="M5 3.5C3.5 3.5 2.5 5 2.5 6.5c0 1 .5 1.5.5 2.5 0 2 1 4 2.5 4.5C7 14 8 12.5 8 11V9c0-1 .5-1.5.5-2.5 0-1.5-1-3-2.5-3H5z" stroke="#1D9E75" stroke-width="1.35" stroke-linejoin="round"/><path d="M11 3.5c1.5 0 2.5 1.5 2.5 3 0 1-.5 1.5-.5 2.5 0 2-1 4-2.5 4.5C9 14 8 12.5 8 11V9c0-1-.5-1.5-.5-2.5 0-1.5 1-3 2.5-3H11z" stroke="#1D9E75" stroke-width="1.35" stroke-linejoin="round"/>` },
  { name: 'Musculoskeletal',   icon: `<rect x="6" y="2" width="4" height="4" rx="1" stroke="#1D9E75" stroke-width="1.35"/><rect x="6" y="10" width="4" height="4" rx="1" stroke="#1D9E75" stroke-width="1.35"/><path d="M8 6v4" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M3 8h3M10 8h3" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/>` },
  { name: 'Dermatology',       icon: `<path d="M2 12.5C2 12.5 4 11 8 11s6 1.5 6 1.5" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M2 9.5C2 9.5 4 8 8 8s6 1.5 6 1.5" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M2 6.5C2 6.5 4 5 8 5s6 1.5 6 1.5" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/>` },
  { name: 'Haematology',       icon: `<path d="M8 2.5L9.5 6h3.5l-2.8 2 1 3.5L8 9.5 4.8 11.5l1-3.5L3 6h3.5z" stroke="#1D9E75" stroke-width="1.3" stroke-linejoin="round"/>` },
  { name: 'Infectious Disease',icon: `<circle cx="8" cy="8" r="3" stroke="#1D9E75" stroke-width="1.35"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><circle cx="8" cy="8" r="1" fill="#1D9E75"/>` },
  { name: 'Ophthalmology',     icon: `<path d="M8 3C5 3 2.5 5.5 2.5 8S5 13 8 13s5.5-2.5 5.5-5S11 3 8 3z" stroke="#1D9E75" stroke-width="1.35"/><path d="M5 8c0-1.7 1.3-3 3-3" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><circle cx="8" cy="8" r="1" fill="#1D9E75"/>` },
  { name: 'ENT',               icon: `<path d="M10 4C10 4 13 5 13 8c0 2.5-1.5 4-3 4.5" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M10 4C8 4 6.5 5.5 6.5 7.5c0 1.5.8 2.8 2 3.3" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/><path d="M8.5 10.5L7 13M6 13h3" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/>` },
  { name: 'Immunology',        icon: `<path d="M8 2L3 5v4c0 2.5 2 4.5 5 5 3-.5 5-2.5 5-5V5L8 2z" stroke="#1D9E75" stroke-width="1.35" stroke-linejoin="round"/><path d="M5.5 8l2 2 3-3" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>` },
  { name: 'Reproductive Health', icon: `<circle cx="5.5" cy="5.5" r="2.5" stroke="#1D9E75" stroke-width="1.35"/><circle cx="10.5" cy="10.5" r="2.5" stroke="#1D9E75" stroke-width="1.35"/><path d="M7.5 7.5l1 1" stroke="#1D9E75" stroke-width="1.35" stroke-linecap="round"/>` },
  { name: 'Oncology',          icon: `<path d="M8 2L6 6H2l3.5 2.5-1.5 4.5L8 10.5l4 2.5-1.5-4.5L14 6h-4z" stroke="#1D9E75" stroke-width="1.3" stroke-linejoin="round"/>` },
];

/* ============================================================
   STATE
   ============================================================ */

let sb = null;

const state = {
  user: null,
  entriesCache: {},
  activeTab: {},
  azFilter: null,
  sectionSearch: '',
};

/* ============================================================
   INIT
   ============================================================ */

async function init() {
  try {
    const cfg = await fetch('/api/config').then(r => r.json());
    sb = supabase.createClient(SUPABASE_URL, cfg.supabaseAnonKey);

    marked.setOptions({ breaks: true });

    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      state.user = session.user;
      showApp();
    } else {
      showLogin();
    }

    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') { state.user = session.user; showApp(); }
      else if (event === 'SIGNED_OUT') { state.user = null; state.entriesCache = {}; showLogin(); }
    });

    setupListeners();

  } catch (err) {
    document.body.innerHTML =
      `<div style="padding:2rem;color:#c0392b;font-family:system-ui">Failed to initialise: ${esc(err.message)}</div>`;
  }
}

/* ============================================================
   AUTH
   ============================================================ */

async function signIn(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error;
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  route();
}

/* ============================================================
   ROUTING
   ============================================================ */

function route() {
  if (!state.user) return;

  const hash = window.location.hash.replace('#', '') || 'home';
  const [section, entryId] = hash.split('/');
  const isHome = !section || section === 'home';

  updateNavActive(section || 'home');
  closeMobileNav();

  if (!entryId) state.sectionSearch = '';

  if (isHome) {
    document.getElementById('main-content').innerHTML = '';
    renderHome();
  } else if (SECTIONS[section] && entryId) {
    setLoading();
    renderEntry(section, entryId);
  } else if (SECTIONS[section]) {
    setLoading();
    renderList(section);
  } else {
    document.getElementById('main-content').innerHTML = '';
    renderHome();
  }
}

function updateNavActive(section) {
  document.querySelectorAll('.top-nav-tab, .mobile-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });
}

function go(path) { window.location.hash = path; }

function setLoading() {
  document.getElementById('main-content').innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';
}

/* ============================================================
   DATA LAYER
   ============================================================ */

async function getEntries(section) {
  if (state.entriesCache[section]) return state.entriesCache[section];
  const { data, error } = await sb
    .from('entries')
    .select('id, title, template, tags, is_favourite, created_at')
    .eq('section', section)
    .order('title');
  if (error) throw error;
  state.entriesCache[section] = data || [];
  return state.entriesCache[section];
}

async function getEntry(id) {
  const { data, error } = await sb.from('entries').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function createEntry(payload) {
  const { data, error } = await sb
    .from('entries')
    .insert({ ...payload, user_id: state.user.id })
    .select()
    .single();
  if (error) throw error;
  state.entriesCache[payload.section] = null;
  return data;
}

async function updateEntry(id, updates) {
  const { data, error } = await sb
    .from('entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteEntry(id, section) {
  const { error } = await sb.from('entries').delete().eq('id', id);
  if (error) throw error;
  state.entriesCache[section] = null;
}

async function toggleFav(id, current) {
  const { error } = await sb.from('entries').update({ is_favourite: !current }).eq('id', id);
  if (error) throw error;
}

async function recordView(entryId) {
  await sb.from('recent_views').upsert(
    { user_id: state.user.id, entry_id: entryId, viewed_at: new Date().toISOString() },
    { onConflict: 'user_id,entry_id' }
  );
}

async function getRecentViews(limit = 8) {
  const { data, error } = await sb
    .from('recent_views')
    .select('viewed_at, entries(id, title, section)')
    .order('viewed_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map(r => ({ ...r.entries, viewed_at: r.viewed_at })).filter(Boolean);
}

async function getCounts() {
  const sections = Object.keys(SECTIONS);
  const results = await Promise.all(
    sections.map(s =>
      sb.from('entries').select('*', { count: 'exact', head: true }).eq('section', s)
    )
  );
  return Object.fromEntries(sections.map((s, i) => [s, results[i].count || 0]));
}

/* ============================================================
   RENDER: HOME
   ============================================================ */

async function renderHome() {
  const [counts, recent] = await Promise.all([getCounts(), getRecentViews()]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const dateStr = new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  document.getElementById('main-content').innerHTML = `
    <div class="home-wrap">

      <div class="home-greeting">Good ${greeting}, <strong>DC</strong></div>
      <div class="home-date">${dateStr}</div>

      <div class="home-search-bar" id="home-search-bar">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="#ccc" stroke-width="1.5"/>
          <path d="M11 11l3 3" stroke="#ccc" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input type="text" id="home-search-input" placeholder="Search your knowledge base…" autocomplete="off">
        <span class="home-search-hint">⌘K</span>
      </div>

      <div class="home-section-label">Browse by body system</div>
      <div class="systems-grid">
        ${BODY_SYSTEMS.map(sys => `
          <a class="system-tile" href="#" data-system="${esc(sys.name)}">
            <div class="system-icon">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">${sys.icon}</svg>
            </div>
            <span class="system-name">${esc(sys.name)}</span>
          </a>
        `).join('')}
      </div>

      <div class="home-section-label">Sections</div>
      <div class="home-sections-grid">
        ${Object.entries(SECTIONS).map(([key, cfg]) => `
          <a class="home-section-tile" href="#${key}">
            <div class="hst-count">${counts[key] ?? 0}</div>
            <div class="hst-name">${cfg.label}</div>
            <div class="hst-desc">${cfg.description}</div>
          </a>
        `).join('')}
      </div>

      ${recent.length ? `
        <div class="home-section-label">Recently viewed</div>
        <div class="home-recent-list">
          ${recent.map(e => `
            <a href="#${e.section}/${e.id}" class="home-recent-row">
              <div class="home-recent-name">${esc(e.title)}</div>
              <div class="home-recent-section">${SECTIONS[e.section]?.label ?? e.section}</div>
              <div class="home-recent-time">${timeAgo(e.viewed_at)}</div>
              <span class="home-recent-chev">›</span>
            </a>
          `).join('')}
        </div>
      ` : ''}

    </div>
  `;

  document.getElementById('home-search-input').addEventListener('input', e => {
    const q = e.target.value.trim();
    if (q.length >= 2) doSearch(q);
  });
  document.getElementById('home-search-bar').addEventListener('click', () => {
    document.getElementById('home-search-input').focus();
  });

  document.querySelectorAll('.system-tile').forEach(tile => {
    tile.addEventListener('click', e => {
      e.preventDefault();
      doSystemSearch(tile.dataset.system);
    });
  });
}

/* ============================================================
   RENDER: SECTION LIST
   ============================================================ */

async function renderList(section) {
  const cfg = SECTIONS[section];
  let entries;

  try {
    entries = await getEntries(section);
  } catch (err) {
    showError(`Failed to load entries: ${err.message}`);
    return;
  }

  const query = state.sectionSearch.toLowerCase();
  const filtered = query
    ? entries.filter(e => e.title.toLowerCase().includes(query))
    : entries;

  const displayed = state.azFilter
    ? filtered.filter(e => e.title.toUpperCase().startsWith(state.azFilter))
    : filtered;

  const groups = {};
  displayed.forEach(e => {
    const letter = e.title[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(e);
  });

  document.getElementById('main-content').innerHTML = `
    <div class="section-wrap">
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1>${cfg.label}</h1>
            <p class="page-subtitle">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <button class="btn-primary" id="gen-btn">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
            Generate entry
          </button>
        </div>
        <input type="search" id="sec-search" class="section-search-input"
          placeholder="Search ${cfg.label}…"
          value="${esc(state.sectionSearch)}" autocomplete="off">
      </div>

      ${cfg.azFilter ? renderAZ() : ''}

      <div class="entry-list">
        ${displayed.length === 0
          ? renderEmpty(section)
          : Object.entries(groups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, items]) => `
                <div class="letter-group">
                  <div class="letter-label">${letter}</div>
                  ${items.map(e => entryRowHtml(e, section)).join('')}
                </div>
              `).join('')
        }
      </div>
    </div>
  `;

  document.getElementById('gen-btn').addEventListener('click', () => openModal(section));
  document.getElementById('sec-search').addEventListener('input', e => {
    state.sectionSearch = e.target.value;
    renderList(section);
  });

  if (cfg.azFilter) {
    document.querySelectorAll('.az-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const letter = btn.dataset.letter || null;
        state.azFilter = state.azFilter === letter ? null : letter;
        renderList(section);
      });
    });
  }
}

function renderAZ() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return `
    <div class="az-strip">
      <button class="az-btn ${!state.azFilter ? 'active' : ''}" data-letter="">All</button>
      ${letters.map(l => `
        <button class="az-btn ${state.azFilter === l ? 'active' : ''}" data-letter="${l}">${l}</button>
      `).join('')}
    </div>
  `;
}

function entryRowHtml(entry, section) {
  return `
    <a href="#${section}/${entry.id}" class="entry-row">
      <div class="entry-row-main">
        <span class="entry-title">${esc(entry.title)}</span>
        ${entry.tags?.length ? `<span class="entry-tag">${esc(entry.tags[0])}</span>` : ''}
      </div>
      ${entry.is_favourite ? '<span class="entry-fav">★</span>' : ''}
      <span class="entry-chevron">›</span>
    </a>
  `;
}

function renderEmpty(section) {
  const cfg = SECTIONS[section];
  return `
    <div class="empty-state">
      <p>No entries yet</p>
      <p class="empty-hint">Generate your first ${cfg.label.toLowerCase()} entry using the button above</p>
    </div>
  `;
}

/* ============================================================
   RENDER: ENTRY DETAIL
   ============================================================ */

async function renderEntry(section, entryId) {
  const cfg = SECTIONS[section];
  let entry;

  try { entry = await getEntry(entryId); }
  catch { showError('Entry not found.'); return; }

  recordView(entryId);

  function build(e) {
    const tab = state.activeTab[e.id] ?? cfg.tabs[0].key;
    const content = e.content?.[tab] ?? '';
    return `
      <div class="entry-detail-wrap">
        <div class="breadcrumb">
          <a href="#home">Home</a>
          <span class="breadcrumb-sep">›</span>
          <a href="#${section}">${cfg.label}</a>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">${esc(e.title)}</span>
        </div>

        <div class="entry-header">
          <h1 class="entry-main-title">${esc(e.title)}</h1>
          <div class="entry-meta">
            <span class="entry-tag-badge accent">${cfg.template}</span>
            ${(e.tags || []).map(t => `<span class="entry-tag-badge">${esc(t)}</span>`).join('')}
          </div>
          <div class="entry-actions">
            <button class="btn-icon ${e.is_favourite ? 'active' : ''}" id="fav-btn"
              title="${e.is_favourite ? 'Remove from favourites' : 'Add to favourites'}">
              ${e.is_favourite ? '★' : '☆'}
            </button>
            <button class="btn-icon" id="regen-btn" title="Regenerate entry">↻</button>
            <button class="btn-icon btn-danger" id="del-btn" title="Delete entry">✕</button>
          </div>
        </div>

        <div class="tab-strip">
          ${cfg.tabs.map(t => `
            <button class="tab-btn ${t.key === tab ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>
          `).join('')}
        </div>

        <div class="markdown-content" id="tab-panel">${md(content)}</div>

        <div class="entry-footer">
          <span class="entry-date">Created ${fmtDate(e.created_at)}${e.updated_at && e.updated_at !== e.created_at ? ` · Updated ${fmtDate(e.updated_at)}` : ''}</span>
        </div>
      </div>
    `;
  }

  function attach(e) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab[e.id] = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.getElementById('tab-panel').innerHTML = md(e.content?.[btn.dataset.tab] ?? '');
      });
    });

    document.getElementById('fav-btn')?.addEventListener('click', async () => {
      await toggleFav(e.id, e.is_favourite);
      e.is_favourite = !e.is_favourite;
      state.entriesCache[section] = null;
      document.getElementById('main-content').innerHTML = build(e);
      attach(e);
    });

    document.getElementById('regen-btn')?.addEventListener('click', () => openModal(section, e.title, e.id));

    document.getElementById('del-btn')?.addEventListener('click', async () => {
      if (!confirm(`Delete "${e.title}"? This cannot be undone.`)) return;
      try { await deleteEntry(e.id, section); go(section); }
      catch (err) { alert(`Delete failed: ${err.message}`); }
    });
  }

  document.getElementById('main-content').innerHTML = build(entry);
  attach(entry);
}

/* ============================================================
   SYSTEM SEARCH
   ============================================================ */

async function doSystemSearch(systemName) {
  setLoading();
  try {
    const { data, error } = await sb
      .from('entries')
      .select('id, title, section, tags')
      .or(`tags.cs.{"${systemName}"},tags.cs.{"${systemName.toLowerCase()}"}`)
      .limit(40);

    if (error) throw error;

    const titleMatches = await sb
      .from('entries')
      .select('id, title, section, tags')
      .ilike('title', `%${systemName}%`)
      .limit(20);

    const combined = [...(data || [])];
    (titleMatches.data || []).forEach(r => {
      if (!combined.find(c => c.id === r.id)) combined.push(r);
    });

    renderSearchResults(`${systemName} system`, combined);
  } catch (err) {
    showError(`Search failed: ${err.message}`);
  }
}

/* ============================================================
   SEARCH
   ============================================================ */

async function doSearch(query) {
  try {
    const { data, error } = await sb
      .from('entries')
      .select('id, title, section')
      .ilike('title', `%${query}%`)
      .limit(25);
    if (error) throw error;
    renderSearchResults(query, data, true);
  } catch (err) {
    showError(`Search failed: ${err.message}`);
  }
}

function renderSearchResults(query, data, isTextSearch = false) {
  document.getElementById('main-content').innerHTML = `
    <div class="section-wrap">
      <div class="page-header">
        <h1>${isTextSearch ? 'Search Results' : esc(query)}</h1>
        <p class="page-subtitle">${data.length} result${data.length !== 1 ? 's' : ''}${isTextSearch ? ` for "${esc(query)}"` : ''}</p>
      </div>
      ${data.length === 0
        ? `<div class="empty-state"><p>No entries found</p></div>`
        : `<div class="entry-list">
            ${data.map(e => `
              <a href="#${e.section}/${e.id}" class="entry-row">
                <div class="entry-row-main">
                  <span class="entry-title">${esc(e.title)}</span>
                </div>
                <span class="entry-section-badge">${SECTIONS[e.section]?.label ?? e.section}</span>
                <span class="entry-chevron">›</span>
              </a>
            `).join('')}
          </div>`
      }
    </div>
  `;
}

/* ============================================================
   SEARCH OVERLAY
   ============================================================ */

function openSearchOverlay() {
  const overlay = document.getElementById('search-overlay');
  overlay.classList.remove('hidden');
  document.getElementById('search-overlay-input').focus();
  document.getElementById('search-overlay-results').innerHTML = '';
}

function closeSearchOverlay() {
  document.getElementById('search-overlay').classList.add('hidden');
  document.getElementById('search-overlay-input').value = '';
}

let overlaySearchTimer;
async function handleOverlaySearch(query) {
  const results = document.getElementById('search-overlay-results');
  if (!query || query.length < 2) { results.innerHTML = ''; return; }
  try {
    const { data } = await sb
      .from('entries')
      .select('id, title, section')
      .ilike('title', `%${query}%`)
      .limit(12);
    if (!data?.length) {
      results.innerHTML = `<div class="search-no-results">No entries match "${esc(query)}"</div>`;
      return;
    }
    results.innerHTML = data.map(e => `
      <a href="#${e.section}/${e.id}" class="search-result-item" id="sr-${e.id}">
        <span class="search-result-title">${esc(e.title)}</span>
        <span class="search-result-badge">${SECTIONS[e.section]?.label ?? e.section}</span>
      </a>
    `).join('');
    results.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', closeSearchOverlay);
    });
  } catch { /* silent */ }
}

/* ============================================================
   GENERATE MODAL
   ============================================================ */

function openModal(section, prefill = '', existingId = null) {
  const cfg = SECTIONS[section];
  const modal = document.getElementById('generate-modal');

  const select = document.getElementById('modal-section-select');
  select.value = section;
  updateModalTemplate(section);

  document.getElementById('generate-topic').value = prefill;
  document.getElementById('generate-progress').classList.add('hidden');
  document.getElementById('generate-error').classList.add('hidden');
  document.getElementById('generate-submit-btn').disabled = false;

  const chips = document.getElementById('generate-chips');
  chips.innerHTML = cfg.suggestions.map(s =>
    `<button class="chip" data-topic="${esc(s)}">${esc(s)}</button>`
  ).join('');
  chips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('generate-topic').value = chip.dataset.topic;
    });
  });

  modal.dataset.section = section;
  modal.dataset.existingId = existingId ?? '';
  modal.classList.remove('hidden');
  setTimeout(() => document.getElementById('generate-topic').focus(), 50);
}

function updateModalTemplate(section) {
  const cfg = SECTIONS[section];
  document.getElementById('modal-template-name').textContent = cfg?.template ?? '';
  const chips = document.getElementById('generate-chips');
  if (cfg && chips.children.length) {
    chips.innerHTML = cfg.suggestions.map(s =>
      `<button class="chip" data-topic="${esc(s)}">${esc(s)}</button>`
    ).join('');
    chips.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('generate-topic').value = chip.dataset.topic;
      });
    });
  }
}

function closeModal() {
  const modal = document.getElementById('generate-modal');
  modal.classList.add('hidden');
  modal.dataset.existingId = '';
}

async function submitGenerate() {
  const modal = document.getElementById('generate-modal');
  const section = document.getElementById('modal-section-select').value;
  const existingId = modal.dataset.existingId || null;
  const topic = document.getElementById('generate-topic').value.trim();

  if (!topic) { document.getElementById('generate-topic').focus(); return; }

  const cfg = SECTIONS[section];
  const progressEl = document.getElementById('generate-progress');
  const errorEl = document.getElementById('generate-error');
  const submitBtn = document.getElementById('generate-submit-btn');

  progressEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, template: cfg.template, section }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? `API error ${res.status}`);

    let content;
    try { content = JSON.parse(body.content); }
    catch { throw new Error('Failed to parse AI response — please try again.'); }

    let saved;
    if (existingId) {
      saved = await updateEntry(existingId, { title: topic, content });
      state.entriesCache[section] = null;
    } else {
      saved = await createEntry({ title: topic, section, template: cfg.template, content, tags: [] });
    }

    closeModal();
    go(`${section}/${saved.id}`);

  } catch (err) {
    document.getElementById('generate-error').textContent = err.message;
    document.getElementById('generate-error').classList.remove('hidden');
    submitBtn.disabled = false;
    progressEl.classList.add('hidden');
  }
}

/* ============================================================
   AI WIDGET
   ============================================================ */

function toggleAiPanel() {
  const panel = document.getElementById('ai-panel');
  const trigger = document.getElementById('ai-trigger');
  const isOpen = panel.classList.toggle('is-open');
  trigger.classList.toggle('is-open', isOpen);
  trigger.setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
  if (isOpen) document.getElementById('ai-input').focus();
}

function addAiMessage(role, content, sources = []) {
  const msgs = document.getElementById('ai-messages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg--${role}`;

  const sourcesHtml = sources.length
    ? `<div class="ai-msg-source">From ${sources.map(s =>
        `<a href="#${s.section}/${s.id}" class="ai-source-chip">${esc(s.title)}</a>`
      ).join(' ')}</div>`
    : '';

  div.innerHTML = `
    <div class="ai-msg-avatar">${role === 'assistant' ? 'AI' : 'DC'}</div>
    <div>
      <div class="ai-msg-bubble">${content}</div>
      ${sourcesHtml}
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function showAiTyping() {
  const msgs = document.getElementById('ai-messages');
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg--assistant';
  div.id = 'ai-typing-indicator';
  div.innerHTML = `
    <div class="ai-msg-avatar">AI</div>
    <div class="ai-msg-bubble ai-typing">
      <span></span><span></span><span></span>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeAiTyping() {
  document.getElementById('ai-typing-indicator')?.remove();
}

async function sendAiMessage(query) {
  if (!query.trim()) return;

  document.getElementById('ai-suggestions').classList.add('hidden');
  document.getElementById('ai-input').value = '';

  addAiMessage('user', esc(query));
  showAiTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const body = await res.json();
    removeAiTyping();

    if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);

    addAiMessage('assistant', body.answer, body.sources || []);

  } catch (err) {
    removeAiTyping();
    addAiMessage('assistant', `Sorry, I couldn't search the knowledge base right now. <em>${esc(err.message)}</em>`);
  }
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function setupListeners() {
  // Login
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    btn.disabled = true; btn.textContent = 'Signing in…';
    errEl.classList.add('hidden');

    const error = await signIn(email, password);
    if (error) {
      errEl.textContent = error.message;
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });

  // Sign out (avatar dropdown)
  document.getElementById('signout-btn').addEventListener('click', () => sb.auth.signOut());
  document.getElementById('mobile-signout-btn')?.addEventListener('click', () => sb.auth.signOut());

  // Avatar dropdown
  const avatarBtn = document.getElementById('nav-avatar-btn');
  const dropdown  = document.getElementById('avatar-dropdown');
  avatarBtn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('hidden');
    avatarBtn.setAttribute('aria-expanded', !open);
  });
  document.addEventListener('click', () => dropdown?.classList.add('hidden'));

  // Top nav generate button
  document.getElementById('nav-gen-btn')?.addEventListener('click', () => {
    const hash    = window.location.hash.replace('#', '') || 'home';
    const section = hash.split('/')[0];
    openModal(SECTIONS[section] ? section : 'drugs');
  });

  // Modal section selector
  document.getElementById('modal-section-select')?.addEventListener('change', e => {
    const section = e.target.value;
    document.getElementById('generate-modal').dataset.section = section;
    updateModalTemplate(section);
  });

  // Routing
  window.addEventListener('hashchange', route);

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.getElementById('generate-submit-btn').addEventListener('click', submitGenerate);
  document.getElementById('generate-topic').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitGenerate();
    if (e.key === 'Escape') closeModal();
  });

  // Search overlay
  const cmdBtn = document.getElementById('cmd-search-btn');
  cmdBtn?.addEventListener('click', openSearchOverlay);

  document.getElementById('search-backdrop')?.addEventListener('click', closeSearchOverlay);
  document.getElementById('search-overlay-input')?.addEventListener('input', e => {
    clearTimeout(overlaySearchTimer);
    overlaySearchTimer = setTimeout(() => handleOverlaySearch(e.target.value.trim()), 200);
  });
  document.getElementById('search-overlay-input')?.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearchOverlay();
  });

  // ⌘K shortcut
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const overlay = document.getElementById('search-overlay');
      if (overlay.classList.contains('hidden')) openSearchOverlay();
      else closeSearchOverlay();
    }
    if (e.key === 'Escape') {
      closeSearchOverlay();
      closeModal();
    }
  });

  // Mobile menu
  document.getElementById('menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-drawer').classList.toggle('open');
    document.getElementById('mobile-overlay').classList.toggle('show');
  });
  document.getElementById('mobile-overlay')?.addEventListener('click', closeMobileNav);
  document.querySelectorAll('.mobile-nav-item').forEach(el => {
    el.addEventListener('click', closeMobileNav);
  });

  // AI widget
  document.getElementById('ai-trigger').addEventListener('click', toggleAiPanel);
  document.getElementById('ai-close').addEventListener('click', toggleAiPanel);

  document.getElementById('ai-send-btn').addEventListener('click', () => {
    sendAiMessage(document.getElementById('ai-input').value);
  });
  document.getElementById('ai-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendAiMessage(document.getElementById('ai-input').value);
  });
  document.querySelectorAll('.ai-sugg-chip').forEach(chip => {
    chip.addEventListener('click', () => sendAiMessage(chip.textContent));
  });
}

function closeMobileNav() {
  document.getElementById('mobile-drawer').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('show');
}

/* ============================================================
   UTILITY
   ============================================================ */

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function md(text) {
  if (!text) return '<p class="content-empty">No content for this section.</p>';
  return DOMPurify.sanitize(marked.parse(String(text)));
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins < 2 ? 'Just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

function showError(msg) {
  document.getElementById('main-content').innerHTML =
    `<div class="error-state">${esc(msg)}</div>`;
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */

document.addEventListener('DOMContentLoaded', init);
