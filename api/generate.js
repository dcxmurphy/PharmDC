const SYSTEM_PROMPT = `You are a clinical knowledge base writer for PharmDC, a personal reference tool for a New Zealand-registered pharmacist.

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
- Spell correctly for NZ English (e.g. "colour" not "color", "recognise" not "recognize")`;

const TEMPLATE_PROMPTS = {
  drug: (topic) => `Generate a complete PharmDC drug monograph for: "${topic}".

Return a JSON object with EXACTLY these keys:
{
  "drug_class": "One-line string: drug class and therapeutic role. Format: '[Class] · [Role]', e.g. 'Biguanide · Oral antidiabetic' or 'ACE inhibitor · Antihypertensive'. No markdown.",
  "overview": "Drug class, mechanism of action, clinical role and main indications. 2-3 paragraphs. REQUIRED STRUCTURE:\n\n1. Simple mechanism callout: Include on its own line — '> ⚡ **Mechanism:** [one concise sentence]'\n\n2. Detailed MOA: Immediately after, include a markdown h3 heading '### Detailed mechanism of action' followed by 3-5 detailed paragraphs covering molecular targets, signaling cascades, key tissue effects, any feedback loops, and clinical relevance. (This section will be auto-converted to an expandable dropdown by the app.)\n\n3. Warning callouts (if needed): Include '> ⚠️ **Note:** [important note]' or '> 🚨 **Warning:** [serious warning]' as separate blockquotes within the overview text.",
  "dosing": "Markdown table with columns: Indication | Starting dose | Maintenance dose | Maximum dose. Include all major indications.",
  "renal_dosing": "Markdown table with columns: Status | eGFR (mL/min) | Dose adjustment | Notes. The Status column is REQUIRED and MUST use EXACTLY one of these four emoji per row — 🟢 (Normal dose, eGFR ≥60), 🟡 (Use with caution, eGFR 30–60), 🟠 (Significant reduction required, eGFR 15–30), 🔴 (Avoid / Contraindicated, eGFR <15 or dialysis). Every single row must begin with the appropriate emoji. Do not omit or substitute the emoji.",
  "hepatic_dosing": "If dose adjustments are required: markdown table with columns: Status | Severity | Dose adjustment | Notes. Status column MUST use 🟢 (Child-Pugh A — normal dose), 🟡 (Child-Pugh B — use with caution), 🔴 (Child-Pugh C — avoid). If not relevant, write the single line: 'No clinically significant adjustment required'.",
  "adverse_effects": "List common (>1%) effects then serious/rare effects. Use markdown subheadings **Common** and **Serious**.",
  "contraindications": "Format EXACTLY as: First, a markdown heading '### Absolute contraindications' followed by a markdown list of contraindications. Then, a markdown heading '### Cautions and relative contraindications' followed by another markdown list. These sections will be automatically styled in the app.",
  "interactions": "Markdown table: Drug or class | Mechanism | Clinical significance | Management. Cover the most important interactions only.",
  "counselling": "Markdown bullet list of 8-12 patient counselling points in plain language.",
  "nz_notes": "Format with bold labels on separate lines: **Funding:** [PHARMAC status — fully subsidised, part charge, or not funded]. **Special Authority:** [SA criteria summary, or 'None']. **Schedule:** [NZ Medicine classification: Prescription / Pharmacist-only / Restricted / General sale]. **Formulations:** [available NZ formulations and strengths]. **Practice notes:** [NZ-specific clinical pearls, BPAC NZ or NZF guidance references].",
  "body_systems": ["array", "of", "1-3 strings"]
}

For "body_systems", return a JSON array of 1–3 body system names that this drug primarily acts on or is clinically relevant to. Choose ONLY from this exact list: Cardiovascular, Respiratory, Neurology, Psychiatry, Endocrine, Gastroenterology, Renal, Musculoskeletal, Dermatology, Haematology, Infectious Disease, Ophthalmology, ENT, Immunology, Reproductive Health, Oncology. Example: ["Endocrine", "Renal"].

Return ONLY valid JSON. No preamble, no code fences.`,

  condition: (topic) => `Generate a complete PharmDC health condition & therapeutics entry for: "${topic}".

Return a JSON object with EXACTLY these keys (values are markdown strings):
{
  "overview": "What it is, NZ prevalence/epidemiology, clinical significance. 2-3 paragraphs.",
  "pathophysiology": "Mechanism of disease. Focus on what's clinically relevant to pharmacotherapy.",
  "clinical_features": "Signs and symptoms. Include severity grading as a markdown table: Severity | Defining features | Typical clinical picture (rows: Mild / Moderate / Severe).",
  "non_pharmacological": "Lifestyle and non-drug interventions with evidence summary.",
  "pharmacological": "Stepwise treatment algorithm. Use numbered steps tagged by severity, e.g. **Step 1 (mild):**. Include special populations (pregnancy, renal impairment, elderly, paediatric where relevant).",
  "drug_summary": "Markdown table: Drug | Usual dose range | Key notes. Cover all first- and second-line agents.",
  "monitoring": "What to monitor, target values, and how often. Markdown table or structured list.",
  "counselling": "Markdown bullet list of patient counselling points.",
  "nz_notes": "Relevant BPAC NZ guidance, PHARMAC funding for key drugs, applicable NZ clinical guidelines (Heart Foundation NZ, Diabetes NZ, Asthma and Respiratory Foundation NZ, etc.), local practice context."
}

Return ONLY valid JSON. No preamble, no code fences.`,

  anatomy: (topic) => `Generate a complete PharmDC anatomy & physiology entry for: "${topic}".

Return a JSON object with EXACTLY these keys (values are markdown strings):
{
  "overview": "What this system/structure is, its anatomical location, and clinical significance to pharmacy.",
  "key_structures": "Key anatomical structures, their location, and functional relationships. Use a markdown table where helpful: Structure | Location | Function.",
  "physiological_function": "Normal function and regulatory mechanisms. Include relevant physiological parameters (normal ranges, feedback loops).",
  "clinical_relevance": "How this system is relevant to pharmacy practice — what diseases affect it, what drug classes act on it, how disease here alters pharmacokinetics.",
  "pathological_changes": "Common pathological changes — what goes wrong, mechanism of damage, and consequences for drug therapy."
}

Return ONLY valid JSON. No preamble, no code fences.`,

  skill: (topic) => `Generate a complete PharmDC clinical skill/calculation entry for: "${topic}".

Return a JSON object with EXACTLY these keys (values are markdown strings):
{
  "purpose": "What this skill or calculation is used for clinically and when it applies.",
  "formula_method": "The formula or step-by-step method. Display the formula prominently using markdown bold or a code block. Include units.",
  "worked_example": "Step-by-step worked example with realistic patient values (age, weight, serum creatinine, etc.). Show each step clearly.",
  "interpretation": "What the result means clinically. Include target ranges, thresholds, and action points.",
  "when_to_use": "Clinical situations where this should be applied. Also note when NOT to use it (limitations, edge cases).",
  "pitfalls": "Common errors, limitations of the method, and edge cases that trip people up.",
  "nz_context": "NZ-specific context — which equation NZ labs use, NZ dosing guidelines that reference this calculation, any NZ-specific reference ranges or thresholds."
}

Return ONLY valid JSON. No preamble, no code fences.`,

  regulation: (topic) => `Generate a complete PharmDC NZ pharmacy law & regulation entry for: "${topic}".

Return a JSON object with EXACTLY these keys (values are markdown strings):
{
  "overview": "What this regulation covers, who it applies to, and why it exists.",
  "legal_basis": "Which Act(s), regulation(s), or code(s) this derives from (e.g. Medicines Act 1981, Misuse of Drugs Act 1975, Pharmacy Council Code of Ethics). Include section numbers where helpful.",
  "practical_rules": "What a pharmacist must do / cannot do — in plain, clear language. Use a markdown bullet list.",
  "common_scenarios": "3-4 worked examples of real pharmacy practice situations involving this regulation. Format each as **Scenario:** ... then **What to do:** ...",
  "recent_changes": "Any recent or upcoming changes to this regulation. Include dates where known. Write 'No significant recent changes' if none."
}

Return ONLY valid JSON. No preamble, no code fences.`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, template, section } = req.body;

  if (!topic || !template) {
    return res.status(400).json({ error: 'topic and template are required' });
  }

  const buildPrompt = TEMPLATE_PROMPTS[template];
  if (!buildPrompt) {
    return res.status(400).json({ error: `Unknown template: ${template}` });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(topic) }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    let raw = data.content[0].text.trim();

    // Strip markdown code fences if the model wrapped the JSON
    raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    // Validate it's parseable JSON before sending
    JSON.parse(raw);

    res.json({ content: raw });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
}
