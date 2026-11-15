// Version: 2.3.0 | Last Modified: 2026-11-14 22:35 HKT
/**
 * File: js/state.js
 * Description: 32-Seed Starter Templates, localStorage + IndexedDB persistence, UTF-8 URL-hash sharing, custom contender photos, hot-takes, bracket progression engine, and automatic Tournament-to-Tier-List mapping.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial bracket and tier-list state engine.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Extracted to js/state.js; added support for AI-generated topics and user photo state.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Added customPhotos map, hotTakes & Spice Meter storage, posterAspect setting, and 32-seed support.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Synced vibetrack_custom_images storage alias per PRD Feature 1 and added match vote tally tracking for Spice Meter cards.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Wired PackSanitizer.decodeShareTopic() & sanitizeTopicPayload() (closing CAR-20261114-01 & CAR-20261114-02), wired NetHustlePhotoStore IndexedDB vault (POD2-201), and added streamerMode & posterResolution state fields.
 *   - v2.3.0 (2026-11-14 22:35 HKT): Standardized all STARTER_TOPICS to 32 authentic seeds (5 rounds, 31 matches) per POD2-301 (FD-P0-20261114-01) and added autoPopulateTiersFromBracket() mapping tournament elimination rounds to S/A/B/C/D tiers (2/2/4/8/16 seeds) per POD2-305 (FD-P0-20261114-05).
 */
window.VibeState = (() => {
  const PHOTO_STORAGE_KEY = 'vibetrack_custom_images';

  const STARTER_TOPICS = [
    {
      id: 'manga-classics',
      title: 'Greatest Manga Series (32-Seed Arena)',
      subtitle: '32 iconic tankōbon masterpieces — 31 matchups across 5 rounds to crown your GOAT.',
      items: [
        { id: 'm1', name: 'Dragon Ball', tag: 'Shōnen Legend', emoji: '🐉' },
        { id: 'm2', name: 'One Piece', tag: 'Grand Line Epic', emoji: '🏴‍☠️' },
        { id: 'm3', name: 'Slam Dunk', tag: 'Basketball GOAT', emoji: '🏀' },
        { id: 'm4', name: 'Vagabond', tag: 'Samurai Seinen', emoji: '⚔️' },
        { id: 'm5', name: 'Frieren: Beyond Journey End', tag: 'Fantasy Drama', emoji: '🪄' },
        { id: 'm6', name: 'Sakamoto Days', tag: 'Hitman Action', emoji: '🕶️' },
        { id: 'm7', name: 'Mobile Suit Gundam: The Origin', tag: 'Universal Century', emoji: '🤖' },
        { id: 'm8', name: 'Doraemon', tag: 'Timeless Sci-Fi', emoji: '🔔' },
        { id: 'm9', name: 'Fullmetal Alchemist', tag: 'Alchemy Epic', emoji: '⚙️' },
        { id: 'm10', name: 'Berserk', tag: 'Dark Fantasy', emoji: '🗡️' },
        { id: 'm11', name: 'Monster', tag: 'Psychological Thriller', emoji: '🕵️' },
        { id: 'm12', name: 'Hunter x Hunter', tag: 'Strategic Shōnen', emoji: '⚡' },
        { id: 'm13', name: 'YuYu Hakusho', tag: 'Spirit Detective', emoji: '👉' },
        { id: 'm14', name: 'Akira', tag: 'Cyberpunk Landmark', emoji: '🏍️' },
        { id: 'm15', name: 'Vinland Saga', tag: 'Historical Epic', emoji: '🛡️' },
        { id: 'm16', name: 'Kingdom', tag: 'Warring States', emoji: '🐎' },
        { id: 'm17', name: 'Attack on Titan', tag: 'Survival Epic', emoji: '🧱' },
        { id: 'm18', name: 'Jujutsu Kaisen', tag: 'Cursed Energy', emoji: '🤞' },
        { id: 'm19', name: 'Chainsaw Man', tag: 'Devil Hunter', emoji: '🪚' },
        { id: 'm20', name: 'Demon Slayer', tag: 'Breathing Styles', emoji: '🌊' },
        { id: 'm21', name: 'Death Note', tag: 'Mind Games', emoji: '📓' },
        { id: 'm22', name: 'Haikyu!!', tag: 'Volleyball Peak', emoji: '🏐' },
        { id: 'm23', name: 'Initial D', tag: 'Touge Drifting', emoji: '🚗' },
        { id: 'm24', name: 'Ashita no Joe', tag: 'Boxing Classic', emoji: '🥊' },
        { id: 'm25', name: '20th Century Boys', tag: 'Sci-Fi Mystery', emoji: '👁️' },
        { id: 'm26', name: 'Pluto', tag: 'Astro Boy Noir', emoji: '🦾' },
        { id: 'm27', name: 'Dandadan', tag: 'Occult Sci-Fi', emoji: '🛸' },
        { id: 'm28', name: 'Delicious in Dungeon', tag: 'Fantasy Gourmet', emoji: '🍲' },
        { id: 'm29', name: 'Kagurabachi', tag: 'Enchanted Blade', emoji: '🗡️' },
        { id: 'm30', name: 'Blue Lock', tag: 'Striker Ego', emoji: '⚽' },
        { id: 'm31', name: 'Mob Psycho 100', tag: 'Psychic Heart', emoji: '💯' },
        { id: 'm32', name: 'One-Punch Man', tag: 'Hero Parody', emoji: '👊' }
      ]
    },
    {
      id: 'anime-openings',
      title: 'Top Anime & J-Pop Anthems (32-Seed Arena)',
      subtitle: '32 legendary anime & J-Pop tracks — 31 head-to-head soundchecks.',
      items: [
        { id: 'a1', name: 'Idol — YOASOBI', tag: 'Oshi no Ko OP', emoji: '🌟' },
        { id: 'a2', name: 'KICK BACK — Kenshi Yonezu', tag: 'Chainsaw Man OP', emoji: '⚡' },
        { id: 'a3', name: 'Gurenge — LiSA', tag: 'Demon Slayer OP', emoji: '🔥' },
        { id: 'a4', name: 'Bling-Bang-Bang-Born — Creepy Nuts', tag: 'Mashle OP 2', emoji: '🎧' },
        { id: 'a5', name: 'Otonoke — Creepy Nuts', tag: 'Dandadan OP', emoji: '👻' },
        { id: 'a6', name: 'Yuusha (The Brave) — YOASOBI', tag: 'Frieren OP 1', emoji: '🪄' },
        { id: 'a7', name: 'A Cruel Angel Thesis — Yoko Takahashi', tag: 'Evangelion OP', emoji: '🪽' },
        { id: 'a8', name: 'Cry Baby — Official HIGE DANdism', tag: 'Tokyo Revengers OP', emoji: '🎸' },
        { id: 'a9', name: 'SPECIALZ — King Gnu', tag: 'Jujutsu Kaisen S2', emoji: '👁️' },
        { id: 'a10', name: 'Kaikai Kitan — Eve', tag: 'Jujutsu Kaisen OP 1', emoji: '🌀' },
        { id: 'a11', name: 'Unravel — TK from Ling tosite sigure', tag: 'Tokyo Ghoul OP', emoji: '🥀' },
        { id: 'a12', name: 'Guren no Yumiya — Linked Horizon', tag: 'Attack on Titan OP 1', emoji: '⚔️' },
        { id: 'a13', name: 'Shinzou wo Sasageyo! — Linked Horizon', tag: 'Attack on Titan OP 3', emoji: '🛡️' },
        { id: 'a14', name: 'The Rumbling — SiM', tag: 'Attack on Titan Final', emoji: '🌋' },
        { id: 'a15', name: 'Tank! — Seatbelts', tag: 'Cowboy Bebop OP', emoji: '🎷' },
        { id: 'a16', name: 'Butter-Fly — Koji Wada', tag: 'Digimon Adventure OP', emoji: '🦋' },
        { id: 'a17', name: 'CHA-LA HEAD-CHA-LA — Hironobu Kageyama', tag: 'Dragon Ball Z OP', emoji: '🐉' },
        { id: 'a18', name: 'We Are! — Hiroshi Kitadani', tag: 'One Piece OP 1', emoji: '🏴‍☠️' },
        { id: 'a19', name: 'Kimi ga Suki da to Sakebitai — BAAD', tag: 'Slam Dunk OP 1', emoji: '🏀' },
        { id: 'a20', name: 'Sekai ga Owaru Made wa — WANDS', tag: 'Slam Dunk ED 2', emoji: '🎶' },
        { id: 'a21', name: 'Tobe! Gundam — Koh Ikeda', tag: 'Mobile Suit Gundam OP', emoji: '🤖' },
        { id: 'a22', name: 'Invoke — T.M.Revolution', tag: 'Gundam SEED OP 1', emoji: '✨' },
        { id: 'a23', name: 'The Blessing (Shukufuku) — YOASOBI', tag: 'Witch from Mercury', emoji: '🛰️' },
        { id: 'a24', name: 'Again — YUI', tag: 'Fullmetal Alchemist', emoji: '⚙️' },
        { id: 'a25', name: 'Silhouette — KANA-BOON', tag: 'Naruto Shippuden OP 16', emoji: '🍃' },
        { id: 'a26', name: 'Blue Bird — Ikimonogakari', tag: 'Naruto Shippuden OP 3', emoji: '🐦' },
        { id: 'a27', name: 'Departure! — Masatoshi Ono', tag: 'Hunter x Hunter OP', emoji: '🧭' },
        { id: 'a28', name: 'Hohoemi no Bakudan — Matsuko Mawatari', tag: 'YuYu Hakusho OP', emoji: '💥' },
        { id: 'a29', name: 'Mixed Nuts — Official HIGE DANdism', tag: 'Spy x Family OP 1', emoji: '🥜' },
        { id: 'a30', name: 'Zankyosanka — Aimer', tag: 'Entertainment District', emoji: '🎆' },
        { id: 'a31', name: 'Homura — LiSA', tag: 'Mugen Train Theme', emoji: '🔥' },
        { id: 'a32', name: 'Haru (Sunny) — Yorushika', tag: 'Frieren OP 2', emoji: '🌤️' }
      ]
    },
    {
      id: 'comfort-food',
      title: 'Ultimate Hong Kong & Asian Comfort Eats (32-Seed Arena)',
      subtitle: '32 culinary heavyweights enter — 31 matchups to crown the ultimate meal.',
      items: [
        { id: 'f1', name: 'Conveyor Belt Salmon & Toro Sushi', tag: 'Sushiro / Genki', emoji: '🍣' },
        { id: 'f2', name: 'Solo Charcoal Yakiniku Set', tag: 'Karubi & Harami', emoji: '🥩' },
        { id: 'f3', name: 'Stewed Beef Tomato Broth Noodles', tag: 'Rich Tomato Soup', emoji: '🍅' },
        { id: 'f4', name: 'Crispy Chicken Fillet Tomato Noodles', tag: 'Golden Cutlet', emoji: '🍗' },
        { id: 'f5', name: 'Shanghainese Xiao Long Bao', tag: 'Steamed Soup Dumpling', emoji: '🥟' },
        { id: 'f6', name: 'Shanghainese Hot & Sour Soup', tag: 'Peppery & Tangy', emoji: '🥣' },
        { id: 'f7', name: 'Shanghainese Fried Thick Noodles', tag: 'Dark Soy Wok Hei', emoji: '🍜' },
        { id: 'f8', name: 'HK Wonton Noodle Soup', tag: 'Shrimp & Bamboo Noodle', emoji: '🦐' },
        { id: 'f9', name: 'Cantonese Crispy Roast Goose', tag: 'Plum Sauce Glaze', emoji: '🦆' },
        { id: 'f10', name: 'Honey Glazed Char Siu Rice', tag: 'Half-Fat Pork', emoji: '🍚' },
        { id: 'f11', name: 'Crispy Skin Siu Yuk (Roast Pork)', tag: 'Crackling Belly', emoji: '🥓' },
        { id: 'f12', name: 'Claypot Rice with Cured Sausage', tag: 'Crispy Rice Crust', emoji: '🍲' },
        { id: 'f13', name: 'Satay Beef Instant Noodles', tag: 'Cha Chaan Teng', emoji: '🍜' },
        { id: 'f14', name: 'Pineapple Bun with Thick Butter', tag: 'Bo Lo Yau', emoji: '🍍' },
        { id: 'f15', name: 'HK French Toast with Peanut Butter', tag: 'Golden Syrup', emoji: '🍞' },
        { id: 'f16', name: 'Baked Pork Chop Rice', tag: 'Tomato & Cheese', emoji: '🧀' },
        { id: 'f17', name: 'Swiss Sauce Chicken Wings', tag: 'Sweet Soy Braise', emoji: '🍗' },
        { id: 'f18', name: 'Curry Fishballs & Siu Mai', tag: 'HK Street Skewers', emoji: '🍢' },
        { id: 'f19', name: 'Egg Waffle (Gai Daan Jai)', tag: 'Crispy Bubble Grid', emoji: '🧇' },
        { id: 'f20', name: 'Hakata Tonkotsu Ramen', tag: '18-Hour Pork Bone', emoji: '🍜' },
        { id: 'f21', name: 'Japanese Wagyu Sukiyaki', tag: 'Raw Egg Dip', emoji: '🥘' },
        { id: 'f22', name: 'Crispy Tonkatsu Pork Cutlet', tag: 'Sesame & Cabbage', emoji: '🐖' },
        { id: 'f23', name: 'Unagi Kabayaki Donburi', tag: 'Charcoal Grilled Eel', emoji: '🍱' },
        { id: 'f24', name: 'Sapporo Miso Butter Corn Ramen', tag: 'Hokkaido Style', emoji: '🌽' },
        { id: 'f25', name: 'Takoyaki & Tori Karaage', tag: 'Izakaya Duo', emoji: '🐙' },
        { id: 'f26', name: 'Cantonese Dim Sum Har Gow', tag: 'Crystal Shrimp', emoji: '🥟' },
        { id: 'f27', name: 'Cheung Fun with Sweet & Sesame Sauce', tag: 'Silky Rice Roll', emoji: '🥢' },
        { id: 'f28', name: 'Beef Brisket in Clear Broth Noodles', tag: 'Chu Hou Radish', emoji: '🥩' },
        { id: 'f29', name: 'Chiu Chow Marinated Goose Slices', tag: 'Master Soy Brine', emoji: '🦢' },
        { id: 'f30', name: 'Dry-Fried Beef Ho Fun', tag: 'Supreme Wok Hei', emoji: '🔥' },
        { id: 'f31', name: 'Salted Fish & Chicken Fried Rice', tag: 'Cantonese Classic', emoji: '🍳' },
        { id: 'f32', name: 'Mango Pomelo Sago (Yeung Ji Gam Lo)', tag: 'Chilled Dessert', emoji: '🥭' }
      ]
    }
  ];

  const state = {
    activeTopicId: STARTER_TOPICS[0].id,
    customTopics: [],
    brackets: {},
    tiers: {},
    customPhotos: {},
    hotTakes: {},
    posterTheme: 'cyber',
    posterAspect: '9:16',
    posterResolution: '1x',
    posterFusionMode: 'canvas-fusion',
    posterGenAiConsent: false,
    streamerMode: false,
    userHandle: '',
    userQuote: ''
  };

  /** Loads persisted state from localStorage and UTF-8 safe URL hash (#b=... or #bracket=...) via PackSanitizer. */
  function load() {
    try {
      const raw = localStorage.getItem(window.VibeVersion.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          Object.assign(state, parsed);
          // Always reset external biometric consent to false on reload per HK PDPO / GDPR
          state.posterGenAiConsent = false;
        }
      }
      const rawPhotos = localStorage.getItem(PHOTO_STORAGE_KEY);
      if (rawPhotos) {
        const parsedPhotos = JSON.parse(rawPhotos);
        if (parsedPhotos && typeof parsedPhotos === 'object') {
          state.customPhotos = Object.assign({}, state.customPhotos, parsedPhotos);
        }
      }
    } catch (e) {
      window.AppLogger.warn('localStorage unavailable; running in memory.');
    }

    try {
      if (window.location.hash && window.PackSanitizer) {
        const shared = window.PackSanitizer.decodeShareTopic(window.location.hash);
        if (shared) {
          if (!state.customTopics.find((t) => t.id === shared.id)) {
            state.customTopics.push(shared);
          }
          state.activeTopicId = shared.id;
          window.AppLogger.info('Loaded verified shared bracket: ' + shared.title);
        }
      }
    } catch (e) {
      window.AppLogger.warn('Could not parse shared bracket hash.');
    }
  }

  /** Asynchronously hydrates custom contender photos from NetHustlePhotoStore IndexedDB vault (POD2-201). */
  async function hydratePhotosFromVault() {
    if (!window.NetHustlePhotoStore) return state.customPhotos;
    try {
      const vaultPhotos = await window.NetHustlePhotoStore.hydrateAll();
      if (vaultPhotos && typeof vaultPhotos === 'object') {
        state.customPhotos = Object.assign({}, state.customPhotos, vaultPhotos);
      }
    } catch (e) {
      window.AppLogger.warn('IndexedDB vault hydration skipped.');
    }
    return state.customPhotos;
  }

  /** Persists state cleanly to localStorage. */
  function save() {
    try {
      localStorage.setItem(window.VibeVersion.STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(state.customPhotos));
    } catch (e) {
      window.AppLogger.warn('Storage quota reached; keeping latest state in memory/IndexedDB.');
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
    const existing = state.brackets[topic.id];
    // Upgrade legacy 8-seed cached starter brackets to 32-seed arena automatically
    if (!existing || (existing.rounds && existing.rounds[0] && existing.rounds[0].length * 2 !== topic.items.length && existing.history.length === 0)) {
      initBracket(topic);
    }
    return state.brackets[topic.id];
  }

  /**
   * POD2-305 (FD-P0-20261114-05): Automatically populates S / A / B / C / D tiers
   * from a completed tournament's elimination rounds:
   *   - S-Tier: Champion + Runner-Up (2 items)
   *   - A-Tier: Semifinal losers (round with 2 matches -> 2 items)
   *   - B-Tier: Quarterfinal losers (round with 4 matches -> 4 items)
   *   - C-Tier: Round of 16 losers (round with 8 matches -> 8 items)
   *   - D-Tier: Round of 32 losers (round with 16 matches -> 16 items)
   */
  function autoPopulateTiersFromBracket(topic, bracket) {
    if (!topic || !bracket || !Array.isArray(bracket.rounds)) return {};
    const tierMap = {};
    const totalRounds = bracket.rounds.length;

    bracket.rounds.forEach((roundMatches, rIdx) => {
      const roundsFromFinal = (totalRounds - 1) - rIdx;
      let loserTier = 'D';
      if (roundsFromFinal === 0) loserTier = 'S';      // Runner-Up in Grand Final -> S
      else if (roundsFromFinal === 1) loserTier = 'A'; // Semifinalist -> A
      else if (roundsFromFinal === 2) loserTier = 'B'; // Quarterfinalist -> B
      else if (roundsFromFinal === 3) loserTier = 'C'; // Round of 16 -> C
      else loserTier = 'D';                            // Round of 32 -> D

      roundMatches.forEach((m) => {
        if (!m || !m.winner) return;
        const loser = m.winner.id === m.left.id ? m.right : m.left;
        if (loser && loser.id) {
          tierMap[loser.id] = loserTier;
        }
      });
    });

    if (bracket.champion && bracket.champion.id) {
      tierMap[bracket.champion.id] = 'S';
    }
    if (bracket.runnerUp && bracket.runnerUp.id) {
      tierMap[bracket.runnerUp.id] = 'S';
    }

    state.tiers[topic.id] = tierMap;
    save();
    return tierMap;
  }

  /** Moves or assigns a contender item to a specific tier ('S', 'A', 'B', 'C', 'D', or null for unranked pool). */
  function setItemTier(topicId, itemId, targetTier) {
    if (!topicId || !itemId) return;
    if (!state.tiers[topicId]) state.tiers[topicId] = {};
    if (!targetTier || targetTier === 'POOL') {
      delete state.tiers[topicId][itemId];
    } else if (['S', 'A', 'B', 'C', 'D'].includes(targetTier)) {
      state.tiers[topicId][itemId] = targetTier;
    }
    save();
  }

  function addTopic(topicObj) {
    const sanitized = window.PackSanitizer ? (window.PackSanitizer.sanitizeTopicPayload(topicObj) || topicObj) : topicObj;
    state.customTopics.push(sanitized);
    state.activeTopicId = sanitized.id;
    initBracket(sanitized);
    save();
  }

  function setContenderPhoto(itemId, dataUrl) {
    if (!dataUrl) delete state.customPhotos[itemId];
    else state.customPhotos[itemId] = dataUrl;
    if (window.NetHustlePhotoStore) {
      window.NetHustlePhotoStore.putPhoto(itemId, dataUrl);
    }
    save();
  }

  function getContenderPhoto(itemId) {
    if (window.NetHustlePhotoStore) {
      const fromVault = window.NetHustlePhotoStore.getPhotoSync(itemId);
      if (fromVault) return fromVault;
    }
    return state.customPhotos[itemId] || null;
  }

  function getMatchKey(topicId, roundIdx, matchIdx) {
    return topicId + ':r' + roundIdx + ':m' + matchIdx;
  }

  function getMatchHotTakeData(topicId, roundIdx, matchIdx) {
    const key = getMatchKey(topicId, roundIdx, matchIdx);
    if (!state.hotTakes[key]) {
      state.hotTakes[key] = { spice: 2, takes: [], leftVotes: 0, rightVotes: 0 };
    }
    if (typeof state.hotTakes[key].leftVotes !== 'number') state.hotTakes[key].leftVotes = 0;
    if (typeof state.hotTakes[key].rightVotes !== 'number') state.hotTakes[key].rightVotes = 0;
    return state.hotTakes[key];
  }

  function recordMatchVote(topicId, roundIdx, matchIdx, side) {
    const entry = getMatchHotTakeData(topicId, roundIdx, matchIdx);
    if (side === 'left') entry.leftVotes += 1;
    else entry.rightVotes += 1;
    save();
  }

  function setMatchSpice(topicId, roundIdx, matchIdx, spiceLevel) {
    const entry = getMatchHotTakeData(topicId, roundIdx, matchIdx);
    entry.spice = spiceLevel;
    save();
  }

  function addMatchHotTake(topicId, roundIdx, matchIdx, text) {
    const entry = getMatchHotTakeData(topicId, roundIdx, matchIdx);
    entry.takes.unshift({ text: text.slice(0, 140), spice: entry.spice, ts: new Date().toISOString() });
    if (entry.takes.length > 20) entry.takes.length = 20;
    save();
  }

  function getTopicTopHotTake(topicId) {
    const prefix = topicId + ':';
    let best = null;
    Object.keys(state.hotTakes).forEach((k) => {
      if (k.startsWith(prefix) && state.hotTakes[k].takes.length) {
        if (!best || state.hotTakes[k].spice >= best.spice) {
          best = state.hotTakes[k].takes[0];
        }
      }
    });
    return best;
  }

  return {
    data: state,
    STARTER_TOPICS,
    load,
    hydratePhotosFromVault,
    save,
    getAllTopics,
    getActiveTopic,
    initBracket,
    getActiveBracket,
    autoPopulateTiersFromBracket,
    setItemTier,
    addTopic,
    setContenderPhoto,
    getContenderPhoto,
    getMatchHotTakeData,
    recordMatchVote,
    setMatchSpice,
    addMatchHotTake,
    getTopicTopHotTake
  };
})();
