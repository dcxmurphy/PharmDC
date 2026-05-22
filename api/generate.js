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
  drug: (topic) => `Generate a clinical drug monograph for: "${topic}".

OUTPUT FORMAT — Use this exact delimiter structure. NO JSON, NO CODE FENCES, NO PREAMBLE:

---FIELD_START: drug_class
One-line format: [Class] · [Role]
---FIELD_END

---FIELD_START: overview
2-3 paragraphs on class, mechanism, indications. Start with blockquote: > ⚡ **Mechanism:** [one sentence]. Then: ### Detailed mechanism of action, followed by 3-5 paragraphs. Add warning blockquotes (> ⚠️ or > 🚨) if needed.
---FIELD_END

---FIELD_START: dosing
Markdown table: Indication | Starting dose | Maintenance dose | Maximum dose
---FIELD_END

---FIELD_START: renal_dosing
Markdown table: Status | eGFR | Dose adjustment | Notes. MUST start each row with 🟢🟡🟠🔴 emoji.
---FIELD_END

---FIELD_START: hepatic_dosing
Markdown table: Status | Severity | Dose adjustment | Notes with emoji, OR: "No clinically significant adjustment required"
---FIELD_END

---FIELD_START: adverse_effects
Markdown: **Common** heading with bullet list, **Serious** heading with bullet list.
---FIELD_END

---FIELD_START: contraindications
### Absolute contraindications (bullet list), then ### Cautions and relative contraindications (bullet list)
---FIELD_END

---FIELD_START: interactions
Markdown table: Drug | Mechanism | Significance | Management
---FIELD_END

---FIELD_START: counselling
8-12 bullet points in plain language
---FIELD_END

---FIELD_START: nz_notes
**Funding:** [status], **Special Authority:** [criteria], **Schedule:** [class], **Formulations:** [list], **Practice notes:** [pearls]
---FIELD_END

---FIELD_START: body_systems
Comma-separated list of 1-3 from: Cardiovascular, Respiratory, Neurology, Psychiatry, Endocrine, Gastroenterology, Renal, Musculoskeletal, Dermatology, Haematology, Infectious Disease, Ophthalmology, ENT, Immunology, Reproductive Health, Oncology
---FIELD_END`,

  condition: (topic) => `Generate a complete PharmDC health condition & therapeutics entry for: "${topic}".

OUTPUT FORMAT — Use delimiter structure, NO JSON:

---FIELD_START: overview
What it is, NZ prevalence/epidemiology, clinical significance. 2-3 paragraphs.
---FIELD_END

---FIELD_START: pathophysiology
Mechanism of disease. Focus on pharmacotherapy relevance.
---FIELD_END

---FIELD_START: clinical_features
Signs and symptoms. Include severity table: Severity | Defining features | Typical picture (rows: Mild/Moderate/Severe)
---FIELD_END

---FIELD_START: non_pharmacological
Lifestyle and non-drug interventions with evidence summary
---FIELD_END

---FIELD_START: pharmacological
Stepwise algorithm numbered by severity (e.g. **Step 1 (mild):**). Include special populations.
---FIELD_END

---FIELD_START: drug_summary
Markdown table: Drug | Usual dose range | Key notes. All first- and second-line agents.
---FIELD_END

---FIELD_START: monitoring
What to monitor, target values, frequency. Table or list.
---FIELD_END

---FIELD_START: counselling
Markdown bullet list of patient counselling points
---FIELD_END

---FIELD_START: nz_notes
BPAC NZ guidance, PHARMAC funding, NZ guidelines (Heart Foundation, Diabetes NZ, etc.), local context
---FIELD_END`,

  anatomy: (topic) => `Generate a complete PharmDC anatomy & physiology entry for: "${topic}".

OUTPUT FORMAT — Use delimiter structure, NO JSON:

---FIELD_START: overview
What this system/structure is, its anatomical location, and clinical significance to pharmacy.
---FIELD_END

---FIELD_START: key_structures
Key anatomical structures, their location, and functional relationships. Use markdown table: Structure | Location | Function
---FIELD_END

---FIELD_START: physiological_function
Normal function and regulatory mechanisms. Include physiological parameters (normal ranges, feedback loops).
---FIELD_END

---FIELD_START: clinical_relevance
How this system is relevant to pharmacy practice — diseases, drug classes, pharmacokinetic effects.
---FIELD_END

---FIELD_START: pathological_changes
Common pathological changes — what goes wrong, mechanism of damage, consequences for drug therapy.
---FIELD_END`,

  skill: (topic) => `Generate a complete PharmDC clinical skill/calculation entry for: "${topic}".

OUTPUT FORMAT — Use delimiter structure, NO JSON:

---FIELD_START: purpose
What this skill or calculation is used for clinically and when it applies.
---FIELD_END

---FIELD_START: formula_method
The formula or step-by-step method. Display formula prominently using markdown bold or code block. Include units.
---FIELD_END

---FIELD_START: worked_example
Step-by-step worked example with realistic patient values (age, weight, serum creatinine, etc.). Show each step.
---FIELD_END

---FIELD_START: interpretation
What the result means clinically. Include target ranges, thresholds, and action points.
---FIELD_END

---FIELD_START: when_to_use
Clinical situations where this should be applied. Note when NOT to use it (limitations, edge cases).
---FIELD_END

---FIELD_START: pitfalls
Common errors, limitations of the method, and edge cases that trip people up.
---FIELD_END

---FIELD_START: nz_context
NZ-specific context — which equation NZ labs use, NZ dosing guidelines that reference this, NZ reference ranges or thresholds.
---FIELD_END`,

  regulation: (topic) => `Generate a complete PharmDC NZ pharmacy law & regulation entry for: "${topic}".

OUTPUT FORMAT — Use delimiter structure, NO JSON:

---FIELD_START: overview
What this regulation covers, who it applies to, and why it exists.
---FIELD_END

---FIELD_START: legal_basis
Which Act(s), regulation(s), or code(s) this derives from. Include section numbers. Example: Medicines Act 1981, Pharmacy Council Code of Ethics.
---FIELD_END

---FIELD_START: practical_rules
What a pharmacist must do / cannot do — plain, clear language. Markdown bullet list.
---FIELD_END

---FIELD_START: common_scenarios
3-4 worked examples of real pharmacy practice situations. Format: **Scenario:** [situation], **What to do:** [action]
---FIELD_END

---FIELD_START: recent_changes
Any recent or upcoming changes. Include dates where known. Or: "No significant recent changes"
---FIELD_END`,
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

    // Parse delimiter-based format: ---FIELD_START: fieldname ... ---FIELD_END
    const fields = {};
    const fieldRegex = /---FIELD_START:\s*(\w+)\s*\n([\s\S]*?)\n---FIELD_END/g;
    let match;

    while ((match = fieldRegex.exec(raw)) !== null) {
      const fieldName = match[1];
      let fieldValue = match[2].trim();

      // Special handling for body_systems: parse comma-separated list into array
      if (fieldName === 'body_systems') {
        fields[fieldName] = fieldValue
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      } else {
        fields[fieldName] = fieldValue;
      }
    }

    // Validate we got some fields
    if (Object.keys(fields).length === 0) {
      throw new Error('No fields found in AI response. Response may be malformed.');
    }

    // Convert to JSON string for client
    const jsonStr = JSON.stringify(fields);

    res.json({ content: jsonStr });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
