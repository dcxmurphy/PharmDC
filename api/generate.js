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

---FIELD_START: header_badges
Comma-separated list of "Label|colour" pairs for display badges. colour is teal (funded/subsidised), amber (prescription/controlled), or slate (indications/conditions). Example: Funded|teal, Prescription only|amber, Type 2 diabetes|slate, PCOS|slate. Include funding status, scheduling, and 2-3 key indications.
---FIELD_END

---FIELD_START: overview
1-2 paragraphs introducing the drug class, therapeutic role, and clinical significance FIRST. Then: blockquote > ⚡ **Mechanism:** [one-sentence summary]. Then: ### Detailed mechanism of action, followed by 3-4 detailed paragraphs explaining HOW the drug works. Then: any warning blockquotes (> ⚠️ **Note:** [warning] or > 🚨 **Warning:** [serious warning]) if relevant. Do NOT repeat warning information in the detailed mechanism.
---FIELD_END

---FIELD_START: dosing
Markdown table with exactly 3 columns: Indication | Dose | Notes. Indication entries are plain text (no bold, no formatting). Dose column: synthesise starting dose, titration, and maintenance/target range into one concise string (e.g. "500 mg once daily, titrate to 1000–2000 mg/day over 2–4 weeks"). Notes column: clinical nuance, NZ-specific caveats, timing, food interactions, off-label status, or any other relevant context. Include all major indications.
---FIELD_END

---FIELD_START: renal_dosing
Markdown table with exactly these 4 columns in this order: eGFR (mL/min/1.73m²) | Status | Recommendation | Notes. The Status column must contain ONLY plain text — no emoji: use "Normal dose", "Use with caution", "Reduce dose", "Avoid", or "Contraindicated".
---FIELD_END

---FIELD_START: hepatic_dosing
Markdown table with exactly these 4 columns in this order: Hepatic function | Status | Recommendation | Notes. Status must be PLAIN TEXT only — no emoji: "Normal dose", "Use with caution", "Avoid", or "Contraindicated". OR if not applicable: "No clinically significant adjustment required"
---FIELD_END

---FIELD_START: adverse_effects
Markdown table: Severity | Effect | Action if it occurs. Severity is "Common" (>1%), "Serious", or "Rare". List common effects first, then serious/rare. Each row shows the effect and what to do about it.
---FIELD_END

---FIELD_START: contraindications
Two sections: ### Absolute contraindications with bullet list, then ### Cautions and relative contraindications with bullet list. Keep lists simple with one item per line.
---FIELD_END

---FIELD_START: interactions
ALWAYS GENERATE. Markdown table: Drug or class | Mechanism | Severity | Management. Severity MUST be formatted EXACTLY as: "🔴 CRITICAL" (major risk, contraindicated), "🟠 HIGH" (significant interaction, dose adjustment), "🟡 MODERATE" (monitor), or "🟢 MINOR". Sort rows by severity (CRITICAL first). Generate at least 3 interactions.
---FIELD_END

---FIELD_START: counselling
ALWAYS GENERATE. 8-12 markdown bullet points in plain language for patients. Cover: how to take the drug, common side effects, what to watch for, when to contact doctor.
---FIELD_END

---FIELD_START: nz_notes
ALWAYS GENERATE. Short format: **Funding:** [status], **Schedule:** [Rx/other], **SA:** [yes/no], **Formulations:** [NZ available]. One sentence max per section.
---FIELD_END

---FIELD_START: body_systems
REQUIRED. Comma-separated list of 1-3 body systems that this drug primarily acts on or is relevant to. Choose from ONLY: Cardiovascular, Respiratory, Neurology, Psychiatry, Endocrine, Gastroenterology, Renal, Musculoskeletal, Dermatology, Haematology, Infectious Disease, Ophthalmology, ENT, Immunology, Reproductive Health, Oncology. Example: Endocrine, Renal
---FIELD_END`,

  condition: (topic) => `Generate a complete PharmDC health condition & therapeutics entry for: "${topic}".

OUTPUT FORMAT — Use delimiter structure, NO JSON:

---FIELD_START: condition_subtitle
One-line format: [Condition category] · [Brief clinical significance]
---FIELD_END

---FIELD_START: header_badges
Comma-separated "Label|colour" pairs. colour is teal (NZ guideline or funded treatment), amber (notifiable/emergent), or slate (body system/category/prevalence). Example: BPAC NZ guideline|teal, Skin & soft tissue|slate, NZ incidence: common|slate. Include 1 teal badge for the primary NZ guideline and 2-3 slate badges for body system, category, and prevalence.
---FIELD_END

---FIELD_START: overview
2-3 paragraphs: what the condition is, NZ prevalence/epidemiology, and clinical significance to pharmacy practice. Then: blockquote > ⚡ **Key point:** [one sentence clinical pearl most useful to a pharmacist]. Then any warning blockquotes if relevant (> ⚠️ **Note:** or > 🚨 **Warning:**). Then: ### Detailed pathophysiology, followed by 3-4 paragraphs covering the core mechanism, relevant pathways, and how the pathophysiology directly informs pharmacotherapy choices (e.g. why certain drug classes work, what goes wrong at a molecular/cellular level).
---FIELD_END

---FIELD_START: clinical_features
Severity classification table FIRST — EXACTLY these columns: Severity | Defining features | Typical presentation. Row labels MUST be exactly: Mild / Moderate / Severe. Then use ### h3 headings for each category of features (e.g. ### Symptoms, ### Signs, ### Investigations). Then end with a ### Red flags section as a bullet list of features requiring urgent review or hospital referral.
---FIELD_END

---FIELD_START: pharmacological
Stepwise treatment algorithm. Use ### Step 1 (mild) / ### Step 2 (moderate) / ### Step 3 (severe) as h3 headings (no colon). Under each step, list recommended agents as bullet points: **Drug name** dose and frequency — rationale/notes. Use NZ drug names and PHARMAC-funded agents where available. End with ### Special populations as an h3, with bullet points covering pregnancy, renal impairment, elderly, and paediatrics as relevant.
---FIELD_END

---FIELD_START: drug_summary
Markdown table with exactly these columns: Drug | Class | Usual dose range | Key notes. Drug column: plain drug name only. Class: short drug class. Include all first- and second-line agents.
---FIELD_END

---FIELD_START: monitoring
Markdown table with exactly these columns: Parameter | Target | Frequency | Action if outside target. Cover clinical, biochemical, and symptom parameters relevant to the condition and its pharmacological treatment.
---FIELD_END

---FIELD_START: counselling
12-16 markdown bullet points combining lifestyle advice AND patient counselling. Cover: understanding the condition, lifestyle and non-drug measures (diet, exercise, smoking, weight, alcohol as relevant), how medications work, adherence, side effects to watch for, when to seek help, NZ-specific resources or support. Write in plain language appropriate for patients.
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
        max_tokens: 8000,
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
      console.error('No fields parsed. Raw response sample:', raw.substring(0, 500));
      throw new Error('No fields found in AI response. Response may be malformed.');
    }

    // Log which fields were parsed (for debugging)
    const parsedFields = Object.keys(fields);
    console.log('Parsed fields:', parsedFields);
    if (!parsedFields.includes('counselling')) console.warn('WARNING: counselling field missing');
    if (!parsedFields.includes('nz_notes')) console.warn('WARNING: nz_notes field missing');
    if (!parsedFields.includes('interactions')) console.warn('WARNING: interactions field missing');

    // Convert to JSON string for client
    const jsonStr = JSON.stringify(fields);

    res.json({ content: jsonStr });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
