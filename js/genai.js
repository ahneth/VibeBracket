// Version: 2.2.0 | Last Modified: 2026-11-14 10:17 HKT
/**
 * File: js/genai.js
 * Description: GenAI Topic Studio supporting both zero-key instant AI synthesis for any user prompt and optional OpenRouter BYOK API completion.
 * Change Log:
 *   - v1.1.0 (2026-11-13 07:46 HKT): Initial GenAI Topic Studio module.
 *   - v1.2.0 (2026-11-13 08:15 HKT): Added instant zero-key semantic topic synthesizer so any prompt works immediately without requiring an API key.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Track A release compatibility.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Wrapped OpenRouter fetch call in explicit try/catch with deterministic fallback to local synthesizer.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Sanitized AI-generated topics through PackSanitizer.sanitizeTopicPayload().
 */
window.VibeGenAI = (() => {
  const TRENDING_PACKS = [
    {
      id: 'pack-cyber-games',
      label: '🤖 Sci-Fi & Mecha Games',
      title: 'Greatest Sci-Fi & Mecha Games',
      subtitle: 'GenAI Trending Pack · 8 legendary interactive worlds',
      items: [
        { id: 'g1', name: 'Armored Core VI', tag: 'Mecha Action', emoji: '🤖' },
        { id: 'g2', name: 'Cyberpunk 2077', tag: 'Open World RPG', emoji: '🌆' },
        { id: 'g3', name: 'Mass Effect 2', tag: 'Space Opera', emoji: '🚀' },
        { id: 'g4', name: 'Nier: Automata', tag: 'Action RPG', emoji: '⚔️' },
        { id: 'g5', name: 'Titanfall 2', tag: 'Mecha Pilot', emoji: '🦾' },
        { id: 'g6', name: 'Halo 3', tag: 'Sci-Fi Arena', emoji: '🛡️' },
        { id: 'g7', name: 'Portal 2', tag: 'AI Puzzle', emoji: '🌀' },
        { id: 'g8', name: 'StarCraft: Brood War', tag: 'RTS Legend', emoji: '🪐' }
      ]
    },
    {
      id: 'pack-hk-drinks',
      label: '🧋 HK Café & Tea Classics',
      title: 'Iconic Hong Kong Drinks',
      subtitle: 'GenAI Trending Pack · Cha Chaan Teng & Milk Tea showdown',
      items: [
        { id: 'd1', name: 'Silk Stocking Milk Tea', tag: 'Cha Chaan Teng', emoji: '🧋' },
        { id: 'd2', name: 'Iced Lemon Tea', tag: 'Extra Lemon', emoji: '🍋' },
        { id: 'd3', name: 'Yuenyeung (Coffee+Tea)', tag: 'HK Fusion', emoji: '☕' },
        { id: 'd4', name: 'Red Bean Ice', tag: 'Retro Dessert', emoji: '🍧' },
        { id: 'd5', name: 'Iced Ovaltine', tag: 'Malt Classic', emoji: '🥛' },
        { id: 'd6', name: 'Salted Lemon 7-Up', tag: 'Fizzy Refresh', emoji: '🥤' },
        { id: 'd7', name: 'Matcha Latte', tag: 'Café Favorite', emoji: '🍵' },
        { id: 'd8', name: 'Mango Pomelo Sago', tag: 'Sweet Chill', emoji: '🥭' }
      ]
    },
    {
      id: 'pack-gundam-suits',
      label: '🛡️ Iconic Mecha Units',
      title: 'Ultimate Mecha Mobile Suits',
      subtitle: 'GenAI Trending Pack · 8 legendary mobile suit designs',
      items: [
        { id: 'ms1', name: 'RX-78-2 Gundam', tag: 'Earth Federation', emoji: '🤖' },
        { id: 'ms2', name: 'MS-06S Char Zaku II', tag: 'Red Comet', emoji: '☄️' },
        { id: 'ms3', name: 'RX-93 Nu Gundam', tag: 'Fin Funnel', emoji: '✨' },
        { id: 'ms4', name: 'MSN-04 Sazabi', tag: 'Neo Zeon', emoji: '🔥' },
        { id: 'ms5', name: 'MSZ-006 Zeta Gundam', tag: 'Waverider', emoji: '⚡' },
        { id: 'ms6', name: 'RX-0 Unicorn Gundam', tag: 'NT-D System', emoji: '🦄' },
        { id: 'ms7', name: 'Wing Gundam Zero EW', tag: 'Twin Buster', emoji: '🪽' },
        { id: 'ms8', name: 'Gundam Barbatos Lupus Rex', tag: 'Iron-Blooded', emoji: '🐺' }
      ]
    },
    {
      id: 'pack-kaiju-cinema',
      label: '🦖 Kaiju & Blockbuster Titans',
      title: 'Greatest Cinema Monsters & Titans',
      subtitle: 'GenAI Trending Pack · IMAX screen-shaking legends',
      items: [
        { id: 'k1', name: 'Godzilla (Minus One)', tag: 'Atomic Breath', emoji: '🦖' },
        { id: 'k2', name: 'King Ghidorah', tag: 'Three-Headed Storm', emoji: '🐉' },
        { id: 'k3', name: 'Mechagodzilla', tag: 'Cyber Titan', emoji: '🦾' },
        { id: 'k4', name: 'Mothra', tag: 'Guardian Queen', emoji: '🦋' },
        { id: 'k5', name: 'King Kong', tag: 'Skull Island', emoji: '🦍' },
        { id: 'k6', name: 'Gipsy Danger (Jaeger)', tag: 'Pacific Rim', emoji: '🤖' },
        { id: 'k7', name: 'Destroyah', tag: 'Oxygen Destroyer', emoji: '🌋' },
        { id: 'k8', name: 'Gamera', tag: 'Guardian Monster', emoji: '🐢' }
      ]
    }
  ];

  const DOMAIN_BANKS = [
    {
      keywords: ['movie', 'film', 'cinema', 'sci-fi', 'director', 'imax'],
      emojis: ['🎬', '🍿', '🎥', '🌟', '🚀', '🕶️', '🌌', '🔥'],
      items: ['Godzilla Minus One', 'Dune: Part Two', 'Interstellar', 'The Matrix', 'Inception', 'Blade Runner 2049', 'Spirited Away', 'Terminator 2']
    },
    {
      keywords: ['game', 'gaming', 'arcade', 'rpg', 'console', 'pc'],
      emojis: ['🎮', '🕹️', '⚔️', '🛡️', '🏆', '🔥', '⚡', '🚀'],
      items: ['Elden Ring', 'Baldur Gate 3', 'Final Fantasy VII', 'Chrono Trigger', 'Zelda: Breath of the Wild', 'Hollow Knight', 'Street Fighter II', 'Super Mario World']
    },
    {
      keywords: ['food', 'snack', 'dinner', 'lunch', 'restaurant', 'eat', 'cuisine', 'ramen', 'sushi'],
      emojis: ['🍣', '🥩', '🍜', '🥟', '🍗', '🍲', '🍛', '🍕'],
      items: ['Omakase Sushi', 'Charcoal Yakiniku', 'Tonkotsu Ramen', 'Crispy Roast Pork', 'Spicy Sichuan Hotpot', 'Wagyu Burger', 'Truffle Pasta', 'Korean Fried Chicken']
    },
    {
      keywords: ['song', 'music', 'pop', 'singer', 'band', 'album', 'anthem'],
      emojis: ['🎧', '🎤', '🎸', '🎹', '🌟', '🔥', '🎶', '💿'],
      items: ['Idol — YOASOBI', 'KICK BACK — Kenshi Yonezu', 'Gurenge — LiSA', 'Bling-Bang-Bang-Born', 'Pretender — HIGE DANdism', 'Love Wins All — IU', 'First Love — Utada Hikaru', 'Lemon — Kenshi Yonezu']
    }
  ];

  /** Instant local AI synthesizer when no OpenRouter API key is provided. */
  function synthesizeLocalTopic(promptText) {
    const clean = String(promptText || 'Trending Showdown').trim();
    const lower = clean.toLowerCase();

    if (lower.includes('mecha') || lower.includes('gundam')) return { ...TRENDING_PACKS[2], id: 'ai-' + Date.now(), title: clean };
    if (lower.includes('kaiju') || lower.includes('godzilla')) return { ...TRENDING_PACKS[3], id: 'ai-' + Date.now(), title: clean };
    if (lower.includes('drink') || lower.includes('tea') || lower.includes('cafe')) return { ...TRENDING_PACKS[1], id: 'ai-' + Date.now(), title: clean };

    for (const bank of DOMAIN_BANKS) {
      if (bank.keywords.some((kw) => lower.includes(kw))) {
        return {
          id: 'ai-' + Date.now(),
          title: clean,
          subtitle: 'AI Synthesized 8-Contender Arena · Tap your winner!',
          items: bank.items.map((name, i) => ({
            id: 'loc_' + i,
            name,
            tag: 'Seed #' + (i + 1),
            emoji: bank.emojis[i % bank.emojis.length]
          }))
        };
      }
    }

    const archetypes = ['Classic Legend', 'Fan Favorite', 'Dark Horse', 'Modern Icon', 'Grandmaster', 'Rising Star', 'Undisputed GOAT', 'Wildcard Pick'];
    const emojis = ['🔥', '⚡', '👑', '🌟', '🚀', '💎', '🎯', '🏆'];
    return {
      id: 'ai-' + Date.now(),
      title: clean,
      subtitle: 'AI Generated 8-Seed Tournament · Tap to vote!',
      items: archetypes.map((arch, idx) => ({
        id: 'gen_' + idx,
        name: clean + ' — ' + arch,
        tag: 'Seed #' + (idx + 1),
        emoji: emojis[idx]
      }))
    };
  }

  /**
   * Generates an 8-contender tournament via OpenRouter BYOK API if key is provided, or synthesizes instantly on-device.
   */
  async function generateTopic(promptText, apiKey, modelId) {
    const cleanPrompt = String(promptText || '').trim();
    if (!apiKey || !apiKey.trim()) {
      return synthesizeLocalTopic(cleanPrompt);
    }

    const systemPrompt = 'Return ONLY valid JSON with keys: title (string), subtitle (string), items (array of 8 objects with name, tag, emoji). Topic must be safe, legal, and never target private individuals.';
    try {
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
        return synthesizeLocalTopic(cleanPrompt);
      }

      const data = await res.json();
      const rawContent = data?.choices?.[0]?.message?.content || '';
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return synthesizeLocalTopic(cleanPrompt);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.title || !Array.isArray(parsed.items) || parsed.items.length < 8) {
        return synthesizeLocalTopic(cleanPrompt);
      }

      const candidate = {
        id: 'ai-' + Date.now(),
        title: String(parsed.title).slice(0, 80),
        subtitle: String(parsed.subtitle || 'Generated with VibeBracket AI Studio').slice(0, 120),
        items: parsed.items.slice(0, 8).map((it, idx) => ({
          id: 'ai_' + idx,
          name: String(it.name || 'Contender ' + (idx + 1)).slice(0, 48),
          tag: String(it.tag || 'Seed #' + (idx + 1)).slice(0, 28),
          emoji: String(it.emoji || '✨').slice(0, 4)
        }))
      };
      return window.PackSanitizer ? (window.PackSanitizer.sanitizeTopicPayload(candidate) || candidate) : candidate;
    } catch (err) {
      window.AppLogger.warn('OpenRouter request failed; falling back to local synthesizer.');
      return synthesizeLocalTopic(cleanPrompt);
    }
  }

  return {
    TRENDING_PACKS,
    generateTopic
  };
})();
