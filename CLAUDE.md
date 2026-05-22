# PharmDC — Project Briefing for Claude Code

## What is PharmDC?
PharmDC is a personal pharmacist knowledge base web app built for DC (a New Zealand-registered pharmacist). The name is a play on DC's nickname and "Pharm" — it also works as a shorthand for a pharmacy document/knowledge centre.

It is NOT a product for other users or a replacement for NZF/MIMS. It is a personal, cloud-hosted reference tool that DC uses daily across all devices (phone, laptop, any computer with a browser). The core value proposition: instead of googling or switching between tabs, DC has one place where all clinical knowledge is structured, consistent, AI-generated, and NZ-contextualised.

---

## Design Philosophy
- **Consistency above all else** — every entry of the same type looks identical, forever
- **Simplicity** — nothing extraneous, no feature creep
- **AI does the writing** — DC reviews and approves, but never writes entries from scratch
- **NZ-first** — all content is contextualised for NZ practice: PHARMAC funding, Medsafe, BPAC NZ, NZF, NZ Medicines Act
- **Works everywhere** — fully responsive, phone and desktop, no install required

---

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript — multi-file, no frameworks, no build step
  - `index.html` — full app shell
  - `styles.css` — all styles
  - `app.js` — all frontend logic
- **Database + Auth**: Supabase
  - Project URL: `https://gakjmoiwsqfxdmmpfmga.supabase.co`
  - Anon key: stored in environment variable `SUPABASE_ANON_KEY`
  - Loaded via CDN: `@supabase/supabase-js@2`
- **AI generation**: Anthropic API
  - Model: `claude-sonnet-4-6`
  - API key: stored in environment variable `ANTHROPIC_API_KEY`
  - NEVER expose the API key in frontend code — always call via Vercel edge function
- **Hosting**: Vercel
  - Environment variables set in Vercel dashboard: `ANTHROPIC_API_KEY`, `SUPABASE_ANON_KEY`
  - `vercel.json` rewrites all non-API routes to `index.html`
- **CDN dependencies** (loaded in `index.html`):
  - `@supabase/supabase-js@2`
  - `marked` (markdown rendering)
  - `dompurify` (XSS sanitisation)

---

## Visual Design System
- **Accent colour**: `#1D9E75` (teal) — used for active states, primary buttons, highlights
- **Teal palette**:
  - `#E1F5EE` — light backgrounds, tags
  - `#9FE1CB` — subtle accents
  - `#5DCAA5` — mid tones
  - `#1D9E75` — primary
  - `#0F6E56` — hover/dark
  - `#085041` — deep
- **Typography**: DM Sans (Google Fonts). Weights: 300, 400, 500. Never 600 or 700.
- **Borders**: 0.5px, always. `border: 0.5px solid var(--border)`
- **Border radius**: `--radius-sm: 8px` (components), `--radius-md: 12px` (cards)
- **Backgrounds**: `--bg` (white/near-black), `--bg-secondary`, `--bg-hover`
- **No gradients, no shadows, no decorative effects** — completely flat UI
- **Dark mode**: all colours defined as CSS variables with `@media (prefers-color-scheme: dark)` override
- **Spacing**: rem for vertical rhythm, px for component internals
- **Sentence case everywhere** — never Title Case or ALL CAPS in UI

### CSS Variables
```css
:root {
  --bg:            #ffffff;
  --bg-secondary:  #f6f6f6;
  --bg-hover:      #f2f2f2;
  --text:          #111111;
  --text-2:        #555555;
  --text-muted:    #aaaaaa;
  --border:        #e8e8e8;
  --border-subtle: rgba(0,0,0,0.06);
  --accent:        #1D9E75;
  --accent-light:  #E1F5EE;
  --accent-mid:    #5DCAA5;
  --accent-hover:  #0F6E56;
  --danger:        #c0392b;
  --topnav-h:      52px;
  --content-max:   880px;
  --radius-sm:     8px;
  --radius-md:     12px;
}
```
Dark mode overrides `--bg`, `--bg-secondary`, `--bg-hover`, `--text`, `--text-2`, `--text-muted`, `--border`, `--border-subtle`, `--accent-light`, `--accent-hover`.

### Brand
```
PharmDC
```
"Pharm" rendered in `var(--text)`, "DC" in `var(--accent)`. Subtitle: "Personal knowledge base" in muted small text.

### Layout — Top nav
The app uses a **horizontal top navigation bar**, not a sidebar.

- **Height**: `var(--topnav-h)` = 52px
- **Left**: brand (`PharmDC`)
- **Centre**: horizontal nav tabs (Home, Drugs & Medicines, Health Conditions, Anatomy & Physiology, Clinical Skills, Law & Regulation)
- **Right**: ⌘K search button | Generate button (primary) | DC avatar (circle, opens dropdown)

### Nav active state (tab underline, not left border)
```css
.top-nav-tab.active {
  color: var(--accent);
  font-weight: 500;
  border-bottom: 2px solid var(--accent);
}
```

### Mobile layout
On small screens the top nav is hidden. Instead:
- **Mobile bar**: brand + hamburger menu button
- **Mobile drawer**: slides in from left, lists all nav items
- **Mobile overlay**: darkens content when drawer is open

---

## Information Architecture — Five Sections

### 1. Drugs & medicines
Drug monographs. Alphabetical list with A–Z filter strip. Template key: `drug`.

### 2. Health conditions & therapeutics
Disease entries. Includes pathophysiology, clinical features, severity grading, stepwise treatment, special populations, monitoring, NZ notes. Therapeutics is integrated INTO the condition entry. Template key: `condition`.

### 3. Anatomy & physiology
Foundational science entries. Organised by body system. The section list view shows 16 body system tiles (Cardiovascular, Respiratory, Neurology, Psychiatry, Endocrine, Gastroenterology, Renal, Musculoskeletal, Dermatology, Haematology, Infectious Disease, Ophthalmology, ENT, Immunology, Reproductive Health, Oncology). Template key: `anatomy`.

### 4. Clinical skills & calculations
Formulas, TDM guidance, dose converters, worked examples. Template key: `skill`.

### 5. NZ law & regulation
NZ-specific pharmacy practice law and regulation. Template key: `regulation`.

---

## Entry Templates

All templates return JSON from the AI. Each key's value is a markdown string.

### Drug entry (`drug`)
JSON keys (in this order):
1. `overview` — mechanism, drug class, clinical role
2. `dosing` — markdown table: Indication | Starting dose | Maintenance dose | Maximum dose
3. `renal_dosing` — markdown table with 🟢/🟡/🔴 status column by eGFR thresholds
4. `hepatic_dosing` — dose adjustments for hepatic impairment (or "No clinically significant adjustment required")
5. `adverse_effects` — **Common** and **Serious** subheadings
6. `contraindications` — absolute contraindications + cautions
7. `interactions` — markdown table: Drug or class | Mechanism | Clinical significance | Management
8. `counselling` — 8–12 patient counselling bullet points
9. `nz_notes` — PHARMAC funding, Special Authority, NZ scheduling, available formulations, NZ practice pearls

### Health condition entry (`condition`)
JSON keys (in this order):
1. `overview` — what it is, NZ prevalence, clinical significance
2. `pathophysiology` — mechanism of disease
3. `clinical_features` — signs/symptoms + severity grading table (Mild/Moderate/Severe)
4. `non_pharmacological` — lifestyle and non-drug interventions
5. `pharmacological` — stepwise treatment numbered by severity (e.g. **Step 1 (mild):**), including special populations
6. `drug_summary` — markdown table: Drug | Usual dose range | Key notes
7. `monitoring` — what to check, targets, frequency
8. `counselling` — patient counselling bullet points
9. `nz_notes` — BPAC NZ guidance, PHARMAC funding, NZ clinical guidelines

### Anatomy & physiology entry (`anatomy`)
JSON keys:
1. `overview`
2. `key_structures` — markdown table: Structure | Location | Function
3. `physiological_function`
4. `clinical_relevance`
5. `pathological_changes`

### Clinical skills & calculations entry (`skill`)
JSON keys:
1. `purpose`
2. `formula_method` — formula displayed prominently with units
3. `worked_example` — step-by-step with realistic patient values
4. `interpretation` — target ranges, thresholds, action points
5. `when_to_use` — include when NOT to use (limitations)
6. `pitfalls`
7. `nz_context`

### NZ law & regulation entry (`regulation`)
JSON keys:
1. `overview`
2. `legal_basis` — Act(s), regulation(s), section numbers
3. `practical_rules` — bullet list of must/cannot
4. `common_scenarios` — 3–4 worked examples as **Scenario:** ... **What to do:** ...
5. `recent_changes`

---

## AI Generation System

### Generate modal flow
1. User clicks "Generate" in the top nav
2. Modal opens with:
   - Section selector (dropdown: Drugs & Medicines / Health Conditions / Anatomy & Physiology / Clinical Skills / Law & Regulation)
   - Topic name input
   - Suggestion chips (pre-filled common topics per section)
3. On submit: loading spinner → AI generates entry → auto-saves to Supabase → navigates to new entry

### Vercel edge function: `api/generate.js`
Receives `{ topic, template, section }` via POST. Selects the matching template prompt from `TEMPLATE_PROMPTS`, calls Anthropic API, strips any markdown fences, validates JSON, and returns `{ content: rawJsonString }`.

Model: `claude-sonnet-4-6`, max_tokens: 4096.

### Vercel edge function: `api/chat.js`
Powers the AI chat widget. Receives `{ query }` via POST. Searches Supabase for relevant entries (title ilike match), builds context string, calls Anthropic API with `CHAT_SYSTEM_PROMPT`, returns `{ answer, sources }`.

Model: `claude-sonnet-4-6`, max_tokens: 1024.

### System prompt for generation (in `api/generate.js`):
```
You are a clinical knowledge base writer for PharmDC, a personal reference tool for a New Zealand-registered pharmacist.

Write entries that are:
- Clinically accurate and evidence-based
- Contextualised for New Zealand practice (PHARMAC funding, Medsafe, BPAC NZ guidelines, NZF, NZ Medicines Act where relevant)
- Consistent in writing style: clear, professional, direct. No fluff. No excessive hedging.
- Written at the level of a registered pharmacist — not a patient, not a medical student
- Formatted as structured JSON matching the template schema provided

Do not include disclaimers. Do not say "consult a doctor". Write as a knowledgeable colleague.
NZ-specific context to always apply:
- Drug funding: reference PHARMAC schedule where relevant
- Guidelines: prefer BPAC NZ, NZF, Heart Foundation NZ, Diabetes NZ, Ministry of Health NZ
- Scheduling: use NZ Medicine classification (Prescription, Pharmacist-only, Restricted, General sale)
- Spell correctly for NZ English (e.g. "colour" not "color", "recognise" not "recognize")
```

---

## AI Chat Widget

A floating button (bottom-right, teal sparkle icon) opens a slide-in panel (`ai-panel`) anchored to the right side of the screen. The widget:
- Greets DC by name
- Shows 3 suggestion chips on load (e.g. "Metformin renal dosing", "Acne treatment steps", "Warfarin interactions")
- Sends queries to `api/chat.js`
- Displays assistant responses as markdown (via `marked` + `dompurify`)
- Shows source entry titles when the answer is based on knowledge base entries

---

## Search

⌘K (or the search button in the top nav) opens a **full-screen search overlay**:
- Blurred backdrop
- Input field with search icon
- Results list (entry title + section)
- Esc to close
- Clicking a result navigates to that entry

---

## Database Schema (Supabase)

### Table: `entries`
```sql
create table entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  section text not null check (section in ('drugs', 'conditions', 'anatomy', 'skills', 'regulation')),
  template text not null check (template in ('drug', 'condition', 'anatomy', 'skill', 'regulation')),
  content jsonb not null,
  tags text[] default '{}',
  is_favourite boolean default false
);

alter table entries enable row level security;

create policy "Users can manage their own entries"
  on entries for all
  using (auth.uid() = user_id);

create index entries_user_section on entries(user_id, section);
create index entries_title_search on entries using gin(to_tsvector('english', title));
```

### Table: `recent_views`
```sql
create table recent_views (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  entry_id uuid references entries(id) on delete cascade,
  viewed_at timestamp with time zone default now(),
  unique(user_id, entry_id)
);

alter table recent_views enable row level security;

create policy "Users can manage their own recent views"
  on recent_views for all
  using (auth.uid() = user_id);
```

---

## UI Patterns

### Entry list view
- Section-level search bar
- A–Z filter strip (drugs section only)
- Body system tiles (anatomy section only)
- Alphabetical grouping with group labels
- Each row: entry name | metadata/class (muted) | chevron right
- Hover: entry name turns teal

### Entry detail view
- Header: teal rounded-square icon | title | subtitle | tags row
- Horizontal tab strip, bottom-border active indicator in teal
- Each tab renders its markdown content via `marked` + `dompurify`
- Footer: Edit | Regenerate | Bookmark | Back

### Home dashboard
- Welcome message with DC's name
- 5 stat cards (entry count per section)
- Browse by section tiles
- Recently viewed list

---

## What Has Been Built
- Full app shell: top nav (desktop), mobile bar + drawer
- Supabase auth (email/password login, row-level security)
- All five sections navigable with entry list + detail views
- A–Z filter (drugs), body system tiles (anatomy)
- AI entry generation via `api/generate.js` with template-specific JSON prompts
- AI chat widget via `api/chat.js`
- ⌘K search overlay
- Generate modal with section selector + suggestion chips
- Supabase CRUD for entries
- Vercel deployment (`vercel.json`)
- Supabase schema (`supabase/schema.sql`)
