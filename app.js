'use strict';

/* ============================================================
   SECTION CONFIGURATION
   ============================================================ */

const SUPABASE_URL = 'https://gakjmoiwsqfxdmmpfmga.supabase.co';

const SECTIONS = {
  drugs: {
    label: 'Drugs & medicines',
    template: 'drug',
    dbSection: 'drugs',
    icon: '💊',
    azFilter: true,
    tabs: [
      { key: 'overview',          label: 'Overview' },
      { key: 'dosing',            label: 'Dosing' },
      { key: 'renal_dosing',      label: 'Renal dosing' },
      { key: 'hepatic_dosing',    label: 'Hepatic dosing' },
      { key: 'adverse_effects',   label: 'Adverse effects' },
      { key: 'contraindications', label: 'Contraindications' },
      { key: 'interactions',      label: 'Interactions' },
      { key: 'counselling',       label: 'Counselling' },
      { key: 'nz_notes',          label: 'NZ notes' },
    ],
    suggestions: ['Warfarin', 'Metformin', 'Atorvastatin', 'Ramipril', 'Amlodipine', 'Omeprazole'],
  },
  conditions: {
    label: 'Health conditions',
    template: 'condition',
    dbSection: 'conditions',
    icon: '🩺',
    azFilter: false,
    tabs: [
      { key: 'overview',             label: 'Overview' },
      { key: 'pathophysiology',      label: 'Pathophysiology' },
      { key: 'clinical_features',    label: 'Clinical features' },
      { key: 'non_pharmacological',  label: 'Non-pharmacological' },
      { key: 'pharmacological',      label: 'Pharmacological' },
      { key: 'drug_summary',         label: 'Drug summary' },
      { key: 'monitoring',           label: 'Monitoring' },
      { key: 'counselling',          label: 'Counselling' },
      { key: 'nz_notes',             label: 'NZ notes' },
    ],
    suggestions: ['Hypertension', 'Type 2 diabetes', 'Asthma', 'Atrial fibrillation', 'GORD', 'Heart failure'],
  },
  anatomy: {
    label: 'Anatomy & physiology',
    template: 'anatomy',
    dbSection: 'anatomy',
    icon: '🫁',
    azFilter: false,
    tabs: [
      { key: 'overview',              label: 'Overview' },
      { key: 'key_structures',        label: 'Key structures' },
      { key: 'physiological_function',label: 'Physiology' },
      { key: 'clinical_relevance',    label: 'Clinical relevance' },
      { key: 'pathological_changes',  label: 'Pathological changes' },
    ],
    suggestions: ['Renal system', 'Cardiovascular system', 'Respiratory system', 'Liver & biliary'],
  },
  skills: {
    label: 'Clinical skills',
    template: 'skill',
    dbSection: 'skills',
    icon: '🧮',
    azFilter: false,
    tabs: [
      { key: 'purpose',        label: 'Purpose' },
      { key: 'formula_method', label: 'Formula / method' },
      { key: 'worked_example', label: 'Worked example' },
      { key: 'interpretation', label: 'Interpretation' },
      { key: 'when_to_use',    label: 'When to use' },
      { key: 'pitfalls',       label: 'Pitfalls' },
      { key: 'nz_context',     label: 'NZ context' },
    ],
    suggestions: ['CrCl calculation', 'eGFR', 'Warfarin TDM', 'Vancomycin dosing', 'INR interpretation'],
  },
  regulation: {
    label: 'NZ law & regulation',
    template: 'regulation',
    dbSection: 'regulation',
    icon: '⚖️',
    azFilter: false,
    tabs: [
      { key: 'overview',         label: 'Overview' },
      { key: 'legal_basis',      label: 'Legal basis' },
      { key: 'practical_rules',  label: 'Practical rules' },
      { key: 'common_scenarios', label: 'Common scenarios' },
      { key: 'recent_changes',   label: 'Recent changes' },
    ],
    suggestions: ['Controlled drugs', 'Special Authority', 'Standing orders', 'Medicines Act 1981'],
  },
};

/* ============================================================
   APP STATE
   ============================================================ */

let sb = null;

const state = {
  user: null,
  entriesCache: {},   // section -> array
  activeTab: {},      // entryId -> tab key
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
      if (event === 'SIGNED_IN') {
        state.user = session.user;
        showApp();
      } else if (event === 'SIGNED_OUT') {
        state.user = null;
        state.entriesCache = {};
        showLogin();
      }
    });

    setupListeners();

  } catch (err) {
    document.body.innerHTML = `<div style="padding:2rem;color:#d93025;font-family:system-ui">
      Failed to initialise: ${esc(err.message)}</div>`;
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

  updateNavActive(section || 'home');
  closeMobileSidebar();

  // Reset section search when navigating away from a list
  if (!entryId) state.sectionSearch = '';

  setLoading();

  if (!section || section === 'home') {
    renderHome();
  } else if (SECTIONS[section] && entryId) {
    renderEntry(section, entryId);
  } else if (SECTIONS[section]) {
    renderList(section);
  } else {
    renderHome();
  }
}

function updateNavActive(section) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });
}

function go(path) {
  window.location.hash = path;
}

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
  const { data, error } = await sb
    .from('entries')
    .select('*')
    .eq('id', id)
    .single();

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
  const { error } = await sb
    .from('entries')
    .update({ is_favourite: !current })
    .eq('id', id);
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
  return (data || []).map(r => r.entries).filter(Boolean);
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
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  document.getElementById('main-content').innerHTML = `
    <div class="home">
      <div class="page-header">
        <h1>Good ${greeting}, DC</h1>
        <p class="page-subtitle">Your personal pharmacist knowledge base</p>
      </div>

      <div class="stat-cards">
        ${Object.entries(SECTIONS).map(([key, cfg]) => `
          <a href="#${key}" class="stat-card">
            <div class="stat-icon">${cfg.icon}</div>
            <div class="stat-count">${counts[key] ?? 0}</div>
            <div class="stat-label">${cfg.label}</div>
          </a>
        `).join('')}
      </div>

      <div class="home-section">
        <h2>Browse by section</h2>
        <div class="section-cards">
          ${Object.entries(SECTIONS).map(([key, cfg]) => `
            <a href="#${key}" class="section-card">
              <div class="section-card-icon">${cfg.icon}</div>
              <div class="section-card-label">${cfg.label}</div>
              <div class="section-card-count">${counts[key] ?? 0} entries</div>
            </a>
          `).join('')}
        </div>
      </div>

      ${recent.length ? `
        <div class="home-section">
          <h2>Recently viewed</h2>
          <div class="recent-list">
            ${recent.map(e => `
              <a href="#${e.section}/${e.id}" class="recent-item">
                <div class="recent-icon">${SECTIONS[e.section]?.icon ?? '📄'}</div>
                <div class="recent-text">
                  <div class="recent-title">${esc(e.title)}</div>
                  <div class="recent-section">${SECTIONS[e.section]?.label ?? e.section}</div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
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

  // Group alphabetically
  const groups = {};
  displayed.forEach(e => {
    const letter = e.title[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(e);
  });

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="section-view">
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1>${cfg.label}</h1>
            <p class="page-subtitle">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <button class="btn-primary" id="gen-btn">Generate entry</button>
        </div>
        <div class="section-search">
          <input type="search" id="sec-search" class="search-input"
            placeholder="Search ${cfg.label.toLowerCase()}…"
            value="${esc(state.sectionSearch)}" autocomplete="off">
        </div>
      </div>

      ${cfg.azFilter ? renderAZ() : ''}

      <div class="entry-list" id="entry-list">
        ${displayed.length === 0
          ? renderEmpty(section)
          : Object.entries(groups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, items]) => `
                <div class="letter-group">
                  <div class="letter-label">${letter}</div>
                  ${items.map(e => renderEntryRow(e, section)).join('')}
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

function renderEntryRow(entry, section) {
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
      <div class="empty-icon">${cfg.icon}</div>
      <p>No entries yet</p>
      <p class="empty-hint">Click "Generate entry" to create your first ${cfg.template} entry</p>
    </div>
  `;
}

/* ============================================================
   RENDER: ENTRY DETAIL
   ============================================================ */

async function renderEntry(section, entryId) {
  const cfg = SECTIONS[section];
  let entry;

  try {
    entry = await getEntry(entryId);
  } catch {
    showError('Entry not found.');
    return;
  }

  recordView(entryId);

  const activeTab = state.activeTab[entryId] ?? cfg.tabs[0].key;

  function buildDetail(e) {
    const tab = state.activeTab[e.id] ?? cfg.tabs[0].key;
    const content = e.content?.[tab] ?? '';

    return `
      <div class="entry-detail">
        <a href="#${section}" class="back-link">← Back to ${cfg.label}</a>

        <div class="entry-header">
          <div class="entry-header-content">
            <div class="entry-icon-square">${cfg.icon}</div>
            <div class="entry-title-block">
              <h1 class="entry-main-title">${esc(e.title)}</h1>
              <div class="entry-tags">
                <span class="entry-template-badge">${cfg.template}</span>
                ${(e.tags || []).map(t => `<span class="entry-tag">${esc(t)}</span>`).join('')}
              </div>
            </div>
            <div class="entry-actions">
              <button class="btn-icon ${e.is_favourite ? 'active' : ''}" id="fav-btn"
                title="${e.is_favourite ? 'Remove from favourites' : 'Add to favourites'}">
                ${e.is_favourite ? '★' : '☆'}
              </button>
              <button class="btn-icon" id="regen-btn" title="Regenerate entry">↻</button>
              <button class="btn-icon btn-danger" id="del-btn" title="Delete entry">🗑</button>
            </div>
          </div>
        </div>

        <div class="tab-strip">
          ${cfg.tabs.map(t => `
            <button class="tab-btn ${t.key === tab ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>
          `).join('')}
        </div>

        <div class="tab-content">
          <div class="markdown-content" id="tab-panel">
            ${md(content)}
          </div>
        </div>

        <div class="entry-footer">
          <span class="entry-date">Created ${fmtDate(e.created_at)}
            ${e.updated_at !== e.created_at ? ` · Updated ${fmtDate(e.updated_at)}` : ''}
          </span>
        </div>
      </div>
    `;
  }

  document.getElementById('main-content').innerHTML = buildDetail(entry);

  // Tab switching (no re-render, just swap content)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab[entry.id] = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
      document.getElementById('tab-panel').innerHTML = md(entry.content?.[btn.dataset.tab] ?? '');
    });
  });

  // Favourite
  document.getElementById('fav-btn').addEventListener('click', async () => {
    await toggleFav(entry.id, entry.is_favourite);
    entry.is_favourite = !entry.is_favourite;
    state.entriesCache[section] = null;
    document.getElementById('main-content').innerHTML = buildDetail(entry);
    attachEntryListeners(entry, section, buildDetail);
  });

  // Regenerate
  document.getElementById('regen-btn').addEventListener('click', () => {
    openModal(section, entry.title, entry.id);
  });

  // Delete
  document.getElementById('del-btn').addEventListener('click', async () => {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    try {
      await deleteEntry(entry.id, section);
      go(section);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  });

  function attachEntryListeners(e, sec, builder) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab[e.id] = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
        document.getElementById('tab-panel').innerHTML = md(e.content?.[btn.dataset.tab] ?? '');
      });
    });

    document.getElementById('fav-btn')?.addEventListener('click', async () => {
      await toggleFav(e.id, e.is_favourite);
      e.is_favourite = !e.is_favourite;
      state.entriesCache[sec] = null;
      document.getElementById('main-content').innerHTML = builder(e);
      attachEntryListeners(e, sec, builder);
    });

    document.getElementById('regen-btn')?.addEventListener('click', () => {
      openModal(sec, e.title, e.id);
    });

    document.getElementById('del-btn')?.addEventListener('click', async () => {
      if (!confirm(`Delete "${e.title}"? This cannot be undone.`)) return;
      try {
        await deleteEntry(e.id, sec);
        go(sec);
      } catch (err2) {
        alert(`Delete failed: ${err2.message}`);
      }
    });
  }
}

/* ============================================================
   GENERATE MODAL
   ============================================================ */

function openModal(section, prefill = '', existingId = null) {
  const cfg = SECTIONS[section];
  const modal = document.getElementById('generate-modal');

  document.getElementById('modal-template-name').textContent = cfg.template;
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
  document.getElementById('generate-topic').focus();
}

function closeModal() {
  const modal = document.getElementById('generate-modal');
  modal.classList.add('hidden');
  modal.dataset.existingId = '';
}

async function submitGenerate() {
  const modal = document.getElementById('generate-modal');
  const section = modal.dataset.section;
  const existingId = modal.dataset.existingId || null;
  const topic = document.getElementById('generate-topic').value.trim();

  if (!topic) {
    document.getElementById('generate-topic').focus();
    return;
  }

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
    try {
      content = JSON.parse(body.content);
    } catch {
      throw new Error('Failed to parse AI response — please try again.');
    }

    let saved;
    if (existingId) {
      saved = await updateEntry(existingId, { title: topic, content });
      state.entriesCache[section] = null;
    } else {
      saved = await createEntry({
        title: topic,
        section,
        template: cfg.template,
        content,
        tags: [],
      });
    }

    closeModal();
    go(`${section}/${saved.id}`);

  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    submitBtn.disabled = false;
    progressEl.classList.add('hidden');
  }
}

/* ============================================================
   GLOBAL SEARCH
   ============================================================ */

async function doSearch(query) {
  setLoading();

  try {
    const { data, error } = await sb
      .from('entries')
      .select('id, title, section')
      .ilike('title', `%${query}%`)
      .limit(25);

    if (error) throw error;

    document.getElementById('main-content').innerHTML = `
      <div class="section-view">
        <div class="page-header">
          <h1>Search results</h1>
          <p class="page-subtitle">
            ${data.length} result${data.length !== 1 ? 's' : ''} for "${esc(query)}"
          </p>
        </div>
        ${data.length === 0
          ? `<div class="empty-state"><p>No entries match "${esc(query)}"</p></div>`
          : `<div class="entry-list">
              ${data.map(e => `
                <a href="#${e.section}/${e.id}" class="entry-row">
                  <div class="entry-row-main">
                    <span class="search-result-icon">${SECTIONS[e.section]?.icon ?? '📄'}</span>
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
  } catch (err) {
    showError(`Search failed: ${err.message}`);
  }
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function setupListeners() {
  // Login
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.textContent = 'Signing in…';
    errEl.classList.add('hidden');

    const error = await signIn(email, password);
    if (error) {
      errEl.textContent = error.message;
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });

  // Sign out
  document.getElementById('signout-btn').addEventListener('click', () => sb.auth.signOut());

  // Hash routing
  window.addEventListener('hashchange', route);

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.getElementById('generate-submit-btn').addEventListener('click', submitGenerate);
  document.getElementById('generate-topic').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitGenerate();
    if (e.key === 'Escape') closeModal();
  });

  // Global search
  let searchTimer;
  document.getElementById('global-search').addEventListener('input', e => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length >= 2) {
      searchTimer = setTimeout(() => doSearch(q), 300);
    } else if (!q) {
      route();
    }
  });

  // Mobile sidebar
  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('show');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', closeMobileSidebar);
  });
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

/* ============================================================
   UTILITY
   ============================================================ */

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function md(text) {
  if (!text) return '<p class="content-empty">No content for this section.</p>';
  const html = marked.parse(String(text));
  return DOMPurify.sanitize(html);
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function showError(msg) {
  document.getElementById('main-content').innerHTML =
    `<div class="error-state">${esc(msg)}</div>`;
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */

document.addEventListener('DOMContentLoaded', init);
