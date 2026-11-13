// Version: 1.1.0 | Last Modified: 2026-11-13 07:46 HKT
/**
 * File: js/state.js
 * Description: Starter templates, localStorage persistence, URL-hash sharing, and bracket progression engine.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial bracket and tier-list state engine.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Extracted to js/state.js; added support for AI-generated topics and user photo state.
 */
window.VibeState = (() => {
  const STARTER_TOPICS = [
    {
      id: 'manga-classics',
      title: 'Greatest Manga Series',
      subtitle: '8 iconic tankōbon legends — tap your winner in each 1v1 matchup.',
      items: [
        { id: 'm1', name: 'Dragon Ball', tag: 'Action / Adventure', emoji: '🐉' },
        { id: 'm2', name: 'Slam Dunk', tag: 'Sports Classic', emoji: '🏀' },
        { id: 'm3', name: 'Frieren', tag: 'Fantasy Drama', emoji: '🪄' },
        { id: 'm4', name: 'Doraemon', tag: 'Timeless Sci-Fi', emoji: '🔔' },
        { id: 'm5', name: 'Initial D', tag: 'Street Racing', emoji: '🚗' },
        { id: 'm6', name: 'Sakamoto Days', tag: 'Action Comedy', emoji: '🕶️' },
        { id: 'm7', name: 'Demon Slayer', tag: 'Dark Fantasy', emoji: '⚔️' },
        { id: 'm8', name: 'Mobile Suit Gundam', tag: 'Mecha Epic', emoji: '🤖' }
      ]
    },
    {
      id: 'anime-openings',
      title: 'Top Anime & J-Pop Anthems',
      subtitle: 'Head-to-head soundcheck across 8 unforgettable tracks.',
      items: [
        { id: 'a1', name: 'Gurenge — LiSA', tag: 'Demon Slayer OP', emoji: '🔥' },
        { id: 'a2', name: 'KICK BACK — Kenshi Yonezu', tag: 'Chainsaw Man OP', emoji: '⚡' },
        { id: 'a3', name: 'Bling-Bang-Bang-Born', tag: 'Creepy Nuts', emoji: '🎧' },
        { id: 'a4', name: 'Cry Baby — HIGE DANdism', tag: 'Tokyo Revengers OP', emoji: '🎸' },
        { id: 'a5', name: 'Idol — YOASOBI', tag: 'Oshi no Ko OP', emoji: '🌟' },
        { id: 'a6', name: 'The Brave — YOASOBI', tag: 'Frieren OP', emoji: '❄️' },
        { id: 'a7', name: 'A Cruel Angel Thesis', tag: 'Evangelion OP', emoji: '🪽' },
        { id: 'a8', name: 'Butter-Fly — Koji Wada', tag: 'Digimon OP', emoji: '🦋' }
      ]
    },
    {
      id: 'comfort-food',
      title: 'Ultimate Late-Night Eats',
      subtitle: '8 heavyweights enter — only one midnight champion leaves.',
      items: [
        { id: 'f1', name: 'Conveyor Belt Sushi', tag: 'Fresh & Fast', emoji: '🍣' },
        { id: 'f2', name: 'Solo Yakiniku Grill', tag: 'Charcoal Sear', emoji: '🥩' },
        { id: 'f3', name: 'Tonkotsu Ramen', tag: 'Rich Broth', emoji: '🍜' },
        { id: 'f4', name: 'Wonton Noodle Soup', tag: 'HK Classic', emoji: '🥟' },
        { id: 'f5', name: 'Crispy Roast Goose', tag: 'Cantonese', emoji: '🍗' },
        { id: 'f6', name: 'Spicy Hotpot', tag: 'Group Feast', emoji: '🍲' },
        { id: 'f7', name: 'Char Siu Rice', tag: 'Comfort Bowl', emoji: '🍚' },
        { id: 'f8', name: 'Takoyaki & Karaage', tag: 'Street Snack', emoji: '🐙' }
      ]
    }
  ];

  const state = {
    activeTopicId: STARTER_TOPICS[0].id,
    customTopics: [],
    brackets: {},
    tiers: {},
    posterTheme: 'cyber',
    userHandle: '',
    userPhotoDataUrl: null
  };

  /** Loads persisted state from localStorage and URL hash (#b=...) safely. */
  function load() {
    try {
      const raw = localStorage.getItem(window.VibeVersion.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') Object.assign(state, parsed);
      }
    } catch (e) {
      window.AppLogger.warn('localStorage unavailable; running in memory.');
    }

    try {
      if (window.location.hash && window.location.hash.startsWith('#b=')) {
        const shared = JSON.parse(atob(decodeURIComponent(window.location.hash.slice(3))));
        if (shared && shared.title && Array.isArray(shared.items) && shared.items.length >= 4) {
          if (!state.customTopics.find((t) => t.id === shared.id)) {
            state.customTopics.push(shared);
          }
          state.activeTopicId = shared.id;
          window.AppLogger.info('Loaded shared bracket: ' + shared.title);
        }
      }
    } catch (e) {
      window.AppLogger.warn('Could not parse shared bracket hash.');
    }
  }

  /** Persists state cleanly to localStorage. */
  function save() {
    try {
      localStorage.setItem(window.VibeVersion.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore quota errors
    }
  }

  function getAllTopics() { return [...STARTER_TOPICS, ...state.customTopics]; }
  function getActiveTopic() { return getAllTopics().find((t) => t.id === state.activeTopicId) || STARTER_TOPICS[0]; }

  /** Initializes a fresh knockout bracket for a given topic. */
  function initBracket(topic) {
    const pairs = [];
    for (let i = 0; i < topic.items.length; i += 2) {
      pairs.push({ left: topic.items[i], right: topic.items[i + 1], winner: null });
    }
    state.brackets[topic.id] = {
      rounds: [pairs],
      currentRoundIdx: 0,
      currentMatchIdx: 0,
      history: [],
      champion: null,
      runnerUp: null,
      semifinalists: []
    };
  }

  function getActiveBracket() {
    const topic = getActiveTopic();
    if (!state.brackets[topic.id]) initBracket(topic);
    return state.brackets[topic.id];
  }

  function addTopic(topicObj) {
    state.customTopics.push(topicObj);
    state.activeTopicId = topicObj.id;
    initBracket(topicObj);
    save();
  }

  return {
    data: state,
    load,
    save,
    getAllTopics,
    getActiveTopic,
    initBracket,
    getActiveBracket,
    addTopic
  };
})();
