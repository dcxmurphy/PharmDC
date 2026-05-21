const CHAT_SYSTEM_PROMPT = `You are PharmDC AI, a clinical assistant for a New Zealand-registered pharmacist.

You answer questions by synthesising information from the pharmacist's personal knowledge base entries. The relevant entries are provided below.

Guidelines:
- Answer clinically, precisely, and concisely — you are talking to a registered pharmacist, not a patient
- Prioritise NZ-specific context (PHARMAC, NZF, Medsafe, BPAC NZ) where relevant
- If the knowledge base entries cover the question, base your answer on them and cite the entry titles
- If the entries only partially cover the question, say so and answer from general clinical knowledge
- If no entries are relevant, say so clearly and answer from general knowledge
- NZ English spelling (e.g. "recognise", "colour")
- Do not add disclaimers or "consult a doctor" — you are a colleague`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  // Fetch Supabase config
  const supabaseUrl = 'https://gakjmoiwsqfxdmmpfmga.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    return res.status(500).json({ error: 'Supabase key not configured' });
  }

  // Search for relevant entries — full-text title search + content keyword match
  let sources = [];
  let contextText = '';

  try {
    // Title search (ilike for simplicity without needing FTS setup)
    const words = query.trim().split(/\s+/).slice(0, 5);
    const ilikeFilters = words.map(w => `title.ilike.%${w}%`).join(',');

    const searchRes = await fetch(
      `${supabaseUrl}/rest/v1/entries?select=id,title,section,template,content&or=(${ilikeFilters})&limit=5`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (searchRes.ok) {
      const entries = await searchRes.json();

      // Deduplicate by id
      const seen = new Set();
      const unique = entries.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      sources = unique.map(e => ({ id: e.id, title: e.title, section: e.section }));

      // Build context string from entry content (flatten JSON values to text)
      contextText = unique.map(e => {
        const title = e.title;
        const flat = Object.values(e.content || {}).join('\n\n');
        return `--- Entry: ${title} (${e.section}) ---\n${flat}`;
      }).join('\n\n');
    }
  } catch (searchErr) {
    // Non-fatal — proceed with no context
    console.warn('Supabase search failed:', searchErr.message);
  }

  const userMessage = contextText
    ? `Knowledge base entries:\n\n${contextText}\n\n---\n\nQuestion: ${query}`
    : `Question: ${query}`;

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
        max_tokens: 1024,
        system: CHAT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const answer = data.content[0].text.trim();

    res.json({ answer, sources });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
}
