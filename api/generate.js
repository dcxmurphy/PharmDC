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

Return a JSON object with EXACTLY these keys (values are markdown strings):
{
  "overview": "Drug class, mechanism of action, clinical role and main indications. 2-3 paragraphs.",
  "dosing": "Markdown table with columns: Indication | Starting dose | Maintenance dose | Maximum dose. Include all major indications.",
  "renal_dosing": "Markdown table: eGFR (mL/min) | Dose adjustment | Notes. Add a Status column using 🟢 Normal dose, 🟡 Reduce dose, 🔴 Avoid/contraindicated.",
  "hepatic_dosing": "Dose adjustments for hepatic impairment. Write 'No clinically significant adjustment required' if not relevant.",
  "adverse_effects": "List common (>1%) effects then serious/rare effects. Use markdown subheadings **Common** and **Serious**.",
  "contraindications": "Markdown list of absolute contraindications, then a list of important cautions/relative contraindications.",
  "interactions": "Markdown table: Drug or class | Mechanism | Clinical significance | Management. Cover the most important interactions only.",
  "counselling": "Markdown bullet list of 8-12 patient counselling points in plain language.",
  "nz_notes": "PHARMAC funding status (fully subsidised / part charge / not funded), Special Authority criteria if applicable, NZ Medicine schedule classification, formulations available in NZ, any NZ practice pearls."
}

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
        model: 'claude-sonnet-4-20250514',
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
