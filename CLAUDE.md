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
- **Frontend**: Vanilla HTML, CSS, JavaScript — single `index.html` or minimal multi-file. No frameworks, no build step.
- **Database + Auth**: Supabase
  - Project URL: `https://gakjmoiwsqfxdmmpfmga.supabase.co`
  - Anon key: stored in environment variable `SUPABASE_ANON_KEY`
- **AI generation**: Anthropic API
  - Model: `claude-sonnet-4-20250514`
  - API key: stored in environment variable `ANTHROPIC_API_KEY`
  - Note: the API key is called from a backend/edge function — NEVER expose it in frontend code
- **Hosting**: Vercel
  - Environment variables set in Vercel dashboard: `ANTHROPIC_API_KEY`, `SUPABASE_ANON_KEY`

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
- **Typography**: system-ui / sans-serif. Two weights only: 400 (regular) and 500 (medium). Never 600 or 700.
- **Borders**: 0.5px, always. `border: 0.5px solid` with low-opacity border colours.
- **Border radius**: 8px (components), 12px (cards)
- **Backgrounds**: white primary surface, light grey secondary surface
- **No gradients, no shadows, no decorative effects** — completely flat UI
- **Dark mode**: all colours must work in both light and dark mode using CSS variables
- **Spacing**: rem for vertical rhythm, px for component internals
- **Sentence case everywhere** — never Title Case or ALL CAPS in UI

### Brand
```
PharmDC
```
The "Pharm" is rendered in `--color-text-primary` and "DC" in `#1D9E75` (teal). Subtitle: "Personal knowledge base" in muted small text.

### Sidebar layout
- Width: 230px
- Brand at top
- Global search input
- Nav items with left border active indicator (2px teal)
- User chip at bottom (avatar initials "DC", name, role "Pharmacist · NZ")

### Nav active state
```css
border-left: 2px solid #1D9E75;
color: #0F6E56;
font-weight: 500;
background: var(--color-background-primary);
```

---

## Information Architecture — Five Sections

### 1. Drugs & medicines
Drug monographs. Alphabetical list with A–Z filter strip. Each entry has a consistent template (see below).

### 2. Health conditions & therapeutics
Disease entries. Includes pathophysiology, clinical features, severity grading, stepwise treatment, special populations, monitoring, NZ notes. Therapeutics is integrated INTO the condition entry — not a separate section.

### 3. Anatomy & physiology
Foundational science entries. DC wants to be able to refresh background knowledge without googling. Organised by body system.

### 4. Clinical skills & calculations
Formulas, TDM guidance, dose converters, worked examples. Each entry has a purpose, formula/method, worked example, when to use it, common pitfalls.

### 5. NZ law & regulation
NZ-specific pharmacy practice law and regulation. PHARMAC, Medicines Act, controlled drugs, scope of practice, Special Authority, standing orders.

---

## Entry Templates

### Drug entry template
Sections (in this order, always):
1. **Overview** — mechanism, drug class, clinical role
2. **Dosing** — initial, titration, maintenance, maximum; presented as a clean table
3. **Renal dosing** — traffic light table (green/amber/red dots with eGFR thresholds)
4. **Hepatic dosing** — if clinically relevant
5. **Adverse effects** — common and serious, in plain language
6. **Contraindications & cautions**
7. **Key interactions** — only clinically significant ones, with management note
8. **Counselling points** — bullet list of what to tell the patient
9. **NZ-specific notes** — PHARMAC funding status, Special Authority if applicable, available formulations, NZ scheduling, any NZ practice pearls

### Health condition entry template
Sections (in this order, always):
1. **Overview** — what it is, prevalence, clinical significance
2. **Pathophysiology** — mechanism of disease
3. **Clinical features** — signs, symptoms, severity grading (visual cards if applicable)
4. **Non-pharmacological management**
5. **Pharmacological management** — stepwise (numbered steps, severity-tagged), including special populations (pregnancy, renal, paediatric, elderly)
6. **Drug summary table** — key medicines at a glance (drug | dose | key notes)
7. **Monitoring** — what to check, how often
8. **Counselling points**
9. **NZ-specific notes** — relevant NZ guidelines (BPAC NZ), funding, local practice context

### Anatomy & physiology entry template
Sections:
1. **Overview**
2. **Key structures**
3. **Physiological function**
4. **Clinical relevance to pharmacy**
5. **Common pathological changes**

### Clinical skills & calculations entry template
Sections:
1. **Purpose** — what this is used for clinically
2. **Formula / method** — clearly displayed
3. **Worked example** — step by step
4. **Interpretation** — what the result means clinically
5. **When to use / when not to**
6. **Common pitfalls**
7. **NZ context** — if relevant (e.g. which eGFR equation NZ labs use)

### NZ law & regulation entry template
Sections:
1. **Overview** — what this regulation covers
2. **Legal basis** — which Act or regulation
3. **Practical rules** — what a pharmacist must do / cannot do
4. **Common scenarios** — worked examples of real practice situations
5. **Recent changes** — any updates to be aware of

---

## AI Generation System

When DC clicks "Generate entry", a form appears asking for the topic name. DC types e.g. "Warfarin" or "Atrial fibrillation" or "Renal system" and hits Generate.

The app automatically detects which template to use based on the topic (drug → drug template, disease → condition template, etc.) and sends a request to the Anthropic API via a Vercel edge function.

### System prompt for AI generation (use this exactly):
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

### API call (Vercel edge function):
```javascript
// /api/generate.js
export default async function handler(req, res) {
  const { topic, template } = req.body;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT, // as above
      messages: [{
        role: 'user',
        content: `Generate a complete PharmDC ${template} entry for: "${topic}". 
        Return a JSON object with keys matching the template sections exactly.
        Each section value should be a string of well-formatted prose or structured data as appropriate.`
      }]
    })
  });
  
  const data = await response.json();
  res.json({ content: data.content[0].text });
}
```

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

-- Row level security: users can only see their own entries
alter table entries enable row level security;

create policy "Users can manage their own entries"
  on entries for all
  using (auth.uid() = user_id);

-- Index for fast search and section filtering
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
- Search bar at top
- A–Z filter strip (for drugs section)
- Alphabetical grouping with group labels
- Each row: entry name (bold) | metadata/class (muted) | chevron right
- Hover: entry name turns teal

### Entry detail view
- Header: icon in teal rounded square | title | subtitle | tags row
- Horizontal tab strip for sections (underline active indicator in teal)
- Each tab's content in consistent block components
- Footer buttons: Edit | Regenerate | Bookmark | Back

### Generate flow
- Centred empty state with sparkle icon
- Single text input + Generate button
- Suggestion chips below (quick-fire common topics)
- On submit: loading state → entry populates → auto-save to Supabase

### Home dashboard
- Welcome message with DC's name
- 4 stat cards (entry count per section)
- Browse by section (4 category cards)
- Recently viewed list (pulled from recent_views table)

---

## Existing Generated Entry Example
A complete acne vulgaris condition entry has already been designed and approved. It demonstrates the correct depth, structure, NZ contextualisation, and visual treatment for condition entries. Use it as the gold standard for quality.

Key quality markers from that entry:
- Pathophysiology explains mechanism clearly without being a textbook
- Severity grading uses visual colour-coded cards (mild/moderate/severe)
- Treatment is stepwise and numbered with severity tags
- Drug summary table gives a quick at-a-glance reference
- NZ notes section covers PHARMAC funding pills (colour-coded: OTC/funded/SA/prescription), BPAC NZ guidance, and pharmacist-specific practice notes

---

## What Has Been Built So Far
- Full interactive UI prototype (built in Claude.ai chat as a widget)
- Complete app shell with all five sections navigable
- Metformin drug entry (fully populated, demonstrates drug template)
- Acne vulgaris condition entry (fully populated, demonstrates condition template)
- Renal dosing calculator widget

## What Needs Building Next
1. Set up Supabase schema (run the SQL above in Supabase SQL editor)
2. Build the real multi-file web app:
   - `index.html` — full app shell matching the prototype design
   - `api/generate.js` — Vercel edge function for AI generation
   - `vercel.json` — Vercel config
3. Wire up Supabase auth (email/password login)
4. Wire up entry CRUD (create, read, update, delete from `entries` table)
5. Wire up AI generation → auto-save flow
6. Deploy to Vercel

