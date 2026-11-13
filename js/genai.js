// Version: 1.1.0 | Last Modified: 2026-11-13 07:46 HKT
/**
 * File: js/genai.js
 * Description: GenAI Topic Generator supporting OpenRouter BYOK API calls and curated 1-click trending packs.
 * Change Log:
 *   - v1.1.0 (2026-11-13 07:46 HKT): Initial GenAI Topic Studio module.
 */
window.VibeGenAI = (() => {
  const TRENDING_PACKS = [
    {
      id: 'pack-cyber-games',
      label: 'Sci-Fi & Mecha Games',
      title: 'Greatest Sci-Fi & Mecha Games',
      subtitle: 'Curated GenAI Pack · 8 legendary interactive worlds',
      items: [
        { id: 'g1', name: 'Armored Core VI', tag: 'Mecha Action', emoji: '🤖' },
        { id: 'g2', name: 'Cyberpunk 2077', tag: 'Open World RPG', emoji: '🌆' },
        { id: 'g3', name: 'Mass Effect 2', tag: 'Space Opera', emoji: '🚀' },
        { id: 'g4', name: 'Nier: Automata', tag: 'Action Philosophy', emoji: '⚔️' },
        { id: 'g5', name: 'Titanfall 2', tag: 'Mecha FPS', emoji: '🦾' },
        { id: 'g6', name: 'Halo 3', tag: 'Arena Sci-Fi', emoji: '🛡️' },
        { id: 'g7', name: 'Portal 2', tag: 'Puzzle Classic', emoji: '🌀' },
        { id: 'g8', name: 'Dead Space', tag: 'Sci-Fi Survival', emoji: '👾' }
      ]
    },
    {
      id: 'pack-hk-drinks',
      label: 'HK Café & Tea Classics',
      title: 'Iconic Hong Kong Drinks',
      subtitle: 'Curated GenAI Pack · Cha Chaan Teng & Milk Tea showdown',
      items: [
        { id: 'd1', name: 'Silk Stocking Milk Tea', tag: 'Cha Chaan Teng', emoji: '🧋' },
        { id: 'd2', name: 'Iced Lemon Tea', tag: 'Extra Lemon', emoji: '🍋' },
        { id: 'd3', name: 'Yuenyeung (Coffee+Tea)', tag: 'HK Fusion', emoji: '☕' },
        { id: 'd4', name: 'Red Bean Ice', tag: 'Retro Dessert', emoji: '🍧' },
        { id: 'd5', name: 'Horlicks / Ovaltine', tag: 'Malt Classic', emoji: '🥛' },
        { id: 'd6', name: 'Salted Lemon 7-Up', tag: 'Fizzy Refresh', emoji: '🥤' },
        { id: 'd7', name: 'Matcha Latte', tag: 'Café Favorite', emoji: '🍵' },
        { id: 'd8', name: 'Fresh Mango Pomelo Sago', tag: 'Sweet Cup', emoji: '🥭' }
      ]
    }
  ];

  /**
   * Generates an 8-contender tournament via OpenRouter BYOK API, or falls back to smart matching packs if no key is provided.
   */
  async function generateTopic(promptText, apiKey, modelId) {
    const cleanPrompt = String(promptText || '').trim();
    if (!apiKey) {
      throw new Error('Enter your OpenRouter API key for live AI generation, or tap a 1-Click Trending Pack below.');
    }

    const systemPrompt = 'Return ONLY valid JSON with keys: title (string), subtitle (string), items (array of 8 objects with name, tag, emoji). Topic must be safe, legal, and never target private individuals.';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey.trim()
      },
      body: JSON.stringify({
        model: modelId || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Create an 8-contender tournament bracket for: ' + cleanPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!res.ok) {
      throw new Error('AI API returned status ' + res.status);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.title || !Array.isArray(parsed.items) || parsed.items.length < 8) {
      throw new Error('AI response missing 8 contenders.');
    }

    return {
      id: 'ai-' + Date.now(),
      title: String(parsed.title).slice(0, 80),
      subtitle: String(parsed.subtitle || 'Generated with VibeBracket AI Studio').slice(0, 120),
      items: parsed.items.slice(0, 8).map((it, idx) => ({
        id: 'ai_' + idx,
        name: String(it.name || 'Contender ' + (idx + 1)).slice(0, 48),
        tag: String(it.tag || 'AI Pick').slice(0, 28),
        emoji: String(it.emoji || '✨').slice(0, 4)
      }))
    };
  }

  return {
    TRENDING_PACKS,
    generateTopic
  };
})();
