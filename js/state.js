// Version: 3.1.0 | Last Modified: 2026-11-18 22:28 HKT | File: js/state.js | App: VibeBracket Arena
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
 *   - v2.4.0 (2026-11-15 10:36 HKT): Added autoTiers snapshot & getTierPromotionDelta() for Robbery Fixed badges (POD2-403), posterPreset/scale/offset/rimGlow sliders (POD2-402), and #challenge= activeChallenge hydration (POD2-404).
 *   - v2.5.0 (2026-11-15 22:14 HKT): Implemented POD2-502 historical generic-suffix state scrubbing in load() and starter packs, and POD2-504 (FD-P0-20261115-04) exact 2-6-8-8-8 Tier Assignment (S:2, A:6, B:8, C:8, D:8) + 8-match Round-of-32 Loser-Bracket Placement Battles.
 *   - v2.6.0 (2026-11-16 10:09 HKT): Implemented FD-P0-20261116-03 & POD2-603: added getSeedTournamentProvenance(topic, bracket, itemId) for 39-match provenance inspection and reopenPlacementOrBracketMatch() for 1-tap counterfactual re-fights.
 *   - v2.7.0 (2026-11-16 22:36 HKT): Closed BUG-P1-20261116-02 (POD2-702): updated getContenderPhoto(itemId) to check state.customPhotos[itemId] first so user-pinned https:// URLs immediately override any cached data:image/ thumbnail.
 *   - v2.8.0 (2026-11-17 10:47 HKT): Implemented FD-P0-20261117-03 (POD2-803 & POD2-804): added computePlayerTasteArchetype(topic, bracket) for Spotify-Wrapped-style Taste Archetype Verdict Cards and updateSeedItemName(topicId, itemId, newName) for 32-Seed Draft Board customization.
 */
window.VibeState = (() => {
  const PHOTO_STORAGE_KEY = 'vibetrack_custom_images';

  const STARTER_TOPICS = [
    {
      id: 'manga-classics',
      title: 'Greatest Manga Series (32-Seed Arena)',
      subtitle: '32 iconic tankōbon masterpieces — 31 matchups across 5 rounds to crown your GOAT.',
      items: [
        { id: 'm1', name: 'Dragon Ball', tag: 'Shōnen Pioneer', emoji: '🐉' },
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
        { id: 'm24', name: 'Ashita no Joe', tag: 'Boxing Masterpiece', emoji: '🥊' },
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
      subtitle: '32 iconic anime & J-Pop tracks — 31 head-to-head soundchecks.',
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
        { id: 'f31', name: 'Salted Fish & Chicken Fried Rice', tag: 'Cantonese Wok Staple', emoji: '🍳' },
        { id: 'f32', name: 'Mango Pomelo Sago (Yeung Ji Gam Lo)', tag: 'Chilled Dessert', emoji: '🥭' }
      ]
    }
  ];

  const state = {
    activeTopicId: STARTER_TOPICS[0].id,
    customTopics: [],
    brackets: {},
    tiers: {},
    autoTiers: {},
    activeChallenge: null,
    customPhotos: {},
    hotTakes: {},
    posterTheme: 'cyber',
    posterAspect: '9:16',
    posterResolution: '1x',
    posterPreset: 'rivals',
    posterPhotoScale: 100,
    posterPhotoOffset: 0,
    posterRimGlow: 75,
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
          if (window.PackSanitizer && window.PackSanitizer.purgeLegacyGenericState) {
            window.PackSanitizer.purgeLegacyGenericState(state);
          }
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
        if (window.location.hash.startsWith('#challenge=')) {
          const chall = window.PackSanitizer.decodeChallengeHash(window.location.hash);
          if (chall && chall.topic) {
            if (!STARTER_TOPICS.find((t) => t.id === chall.topic.id) && !state.customTopics.find((t) => t.id === chall.topic.id)) {
              state.customTopics.push(chall.topic);
            }
            state.activeTopicId = chall.topic.id;
            state.activeChallenge = chall;
            window.AppLogger.info('Loaded Beat-My-Bracket challenge from ' + chall.handle + ' on "' + chall.topic.title + '"');
          }
        } else {
          const shared = window.PackSanitizer.decodeShareTopic(window.location.hash);
          if (shared) {
            if (!state.customTopics.find((t) => t.id === shared.id)) {
              state.customTopics.push(shared);
            }
            state.activeTopicId = shared.id;
            window.AppLogger.info('Loaded verified shared bracket: ' + shared.title);
          }
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
      semifinalists: [],
      placementMatches: [],
      currentPlacementIdx: 0
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
  /**
   * FD-P0-20261115-04 (POD2-504): Initializes the 8-match Loser-Bracket Placement Round
   * pairing the 16 Round-of-32 losers so the 8 placement winners earn C-Tier (8)
   * and the 8 placement losers land in D-Tier (8).
   */
  function initLoserPlacementRound(bracket) {
    if (!bracket) return [];
    const r32Matches = (bracket.rounds && bracket.rounds[0]) ? bracket.rounds[0] : [];
    const r32Losers = r32Matches
      .map((m) => (m && m.winner ? (m.winner.id === m.left.id ? m.right : m.left) : null))
      .filter(Boolean);
    const placementMatches = [];
    for (let i = 0; i + 1 < r32Losers.length; i += 2) {
      placementMatches.push({
        id: 'placement_cd_' + (i / 2),
        roundLabel: 'C/D Tier Placement Battle ' + ((i / 2) + 1) + ' of ' + Math.floor(r32Losers.length / 2),
        left: r32Losers[i],
        right: r32Losers[i + 1],
        winner: null
      });
    }
    bracket.placementMatches = placementMatches;
    bracket.currentPlacementIdx = 0;
    return placementMatches;
  }

  /**
   * FD-P0-20261115-04 (POD2-504): Populates the exact 2-6-8-8-8 Tier List for 32-seed brackets:
   *   - S-Tier: 2 (Champion + Runner-Up)
   *   - A-Tier: 6 (2 Semifinalists + 4 Quarterfinalists)
   *   - B-Tier: 8 (8 Round-of-16 Losers)
   *   - C-Tier: 8 (8 Winners of Round-of-32 Loser Placement Battles)
   *   - D-Tier: 8 (8 Losers of Round-of-32 Loser Placement Battles)
   */
  function autoPopulateTiers26888(topic, bracket) {
    if (!topic || !bracket || !Array.isArray(bracket.rounds)) return {};
    const tierMap = {};
    const totalRounds = bracket.rounds.length;

    if (bracket.champion && bracket.champion.id) tierMap[bracket.champion.id] = 'S';
    if (bracket.runnerUp && bracket.runnerUp.id) tierMap[bracket.runnerUp.id] = 'S';

    if (totalRounds >= 5 || topic.items.length === 32) {
      // A-Tier (6): 2 Semifinalists (Round 3) + 4 Quarterfinalists (Round 2)
      [...(bracket.rounds[3] || []), ...(bracket.rounds[2] || [])].forEach((m) => {
        if (!m || !m.winner) return;
        const loser = m.winner.id === m.left.id ? m.right : m.left;
        if (loser && loser.id) tierMap[loser.id] = 'A';
      });

      // B-Tier (8): 8 Round-of-16 Losers (Round 1)
      (bracket.rounds[1] || []).forEach((m) => {
        if (!m || !m.winner) return;
        const loser = m.winner.id === m.left.id ? m.right : m.left;
        if (loser && loser.id) tierMap[loser.id] = 'B';
      });

      // C-Tier (8) & D-Tier (8): From the 8 Round-of-32 Loser-Bracket Placement Battles
      const placements = (Array.isArray(bracket.placementMatches) && bracket.placementMatches.length > 0)
        ? bracket.placementMatches
        : initLoserPlacementRound(bracket);
      placements.forEach((pm) => {
        if (!pm || !pm.left || !pm.right) return;
        const winner = pm.winner || pm.left;
        const loser = (winner && winner.id === pm.left.id) ? pm.right : pm.left;
        if (winner && winner.id) tierMap[winner.id] = 'C';
        if (loser && loser.id) tierMap[loser.id] = 'D';
      });
    } else {
      // Fallback proportional distribution for 4/8/16-seed custom brackets
      bracket.rounds.forEach((roundMatches, rIdx) => {
        const roundsFromFinal = (totalRounds - 1) - rIdx;
        let loserTier = 'D';
        if (roundsFromFinal === 0) loserTier = 'S';
        else if (roundsFromFinal <= 2) loserTier = 'A';
        else if (roundsFromFinal === 3) loserTier = 'B';
        else loserTier = 'C';
        roundMatches.forEach((m) => {
          if (!m || !m.winner) return;
          const loser = m.winner.id === m.left.id ? m.right : m.left;
          if (loser && loser.id) tierMap[loser.id] = loserTier;
        });
      });
    }

    if (!state.autoTiers) state.autoTiers = {};
    state.autoTiers[topic.id] = { ...tierMap };
    state.tiers[topic.id] = { ...tierMap };
    save();
    return tierMap;
  }

  function autoPopulateTiersFromBracket(topic, bracket) {
    return autoPopulateTiers26888(topic, bracket);
  }

  /** Records a user vote on a C/D Loser-Bracket Placement Battle and refreshes the 2-6-8-8-8 Tier List (POD2-504). */
  function resolvePlacementMatch(topic, bracket, matchIdx, side) {
    if (!bracket) return null;
    if (!Array.isArray(bracket.placementMatches) || !bracket.placementMatches.length) {
      initLoserPlacementRound(bracket);
    }
    const pm = bracket.placementMatches[matchIdx];
    if (!pm) return null;
    pm.winner = side === 'right' ? pm.right : pm.left;
    if (matchIdx + 1 < bracket.placementMatches.length) {
      bracket.currentPlacementIdx = matchIdx + 1;
    } else {
      bracket.currentPlacementIdx = bracket.placementMatches.length;
    }
    autoPopulateTiers26888(topic, bracket);
    return pm.winner;
  }

  /** Auto-resolves all remaining undecided C/D Loser-Bracket Placement Battles in 1 tap (POD2-504). */
  function autoResolveAllPlacementMatches(topic, bracket) {
    if (!bracket) return {};
    if (!Array.isArray(bracket.placementMatches) || !bracket.placementMatches.length) {
      initLoserPlacementRound(bracket);
    }
    bracket.placementMatches.forEach((pm, idx) => {
      if (!pm.winner) {
        pm.winner = (idx % 2 === 0) ? pm.left : pm.right;
      }
    });
    bracket.currentPlacementIdx = bracket.placementMatches.length;
    return autoPopulateTiers26888(topic, bracket);
  }

  /**
   * POD2-403: Calculates how many tiers (+1 to +4) a user manually promoted a contender
   * above its initial bracket elimination tier (autoTiers) to award "🔥 Robbery Fixed (+N)" badges.
   */
  function getTierPromotionDelta(topicId, itemId) {
    const order = ['S', 'A', 'B', 'C', 'D'];
    const autoMap = (state.autoTiers && state.autoTiers[topicId]) || {};
    const curMap = (state.tiers && state.tiers[topicId]) || {};
    const origTier = autoMap[itemId];
    const nowTier = curMap[itemId];
    if (!origTier || !nowTier) return 0;
    const origIdx = order.indexOf(origTier);
    const nowIdx = order.indexOf(nowTier);
    if (origIdx === -1 || nowIdx === -1) return 0;
    return origIdx > nowIdx ? (origIdx - nowIdx) : 0;
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
    if (state.customPhotos && state.customPhotos[itemId]) {
      return state.customPhotos[itemId];
    }
    if (window.NetHustlePhotoStore) {
      const fromVault = window.NetHustlePhotoStore.getPhotoSync(itemId);
      if (fromVault) return fromVault;
    }
    return null;
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


  /**
   * FD-P0-20261116-03 & POD2-603: Returns the complete 39-match (31 Main Bracket +
   * 8 Battle of Losers Redemption) match provenance for a specific contender, explaining
   * why it landed in S (2), A (6), B (8), C (8), or D (8) and identifying its decisive match.
   */
  function getSeedTournamentProvenance(topic, bracket, itemId) {
    if (!topic || !bracket || !itemId) return null;
    const roundNames = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Grand Final'];
    const history = [];
    let decisiveMatch = null;
    let wins = 0;
    let losses = 0;

    (bracket.rounds || []).forEach((roundMatches, rIdx) => {
      (roundMatches || []).forEach((m, mIdx) => {
        if (!m || !m.left || !m.right) return;
        if (m.left.id === itemId || m.right.id === itemId) {
          const isLeft = m.left.id === itemId;
          const opp = isLeft ? m.right : m.left;
          if (m.winner) {
            const won = m.winner.id === itemId;
            if (won) wins++; else losses++;
            const rec = {
              stage: roundNames[rIdx] || ('Round ' + (rIdx + 1)),
              roundIdx: rIdx,
              matchIdx: mIdx,
              isPlacement: false,
              won,
              opponent: opp
            };
            history.push(rec);
            decisiveMatch = rec;
          }
        }
      });
    });

    (bracket.placementMatches || []).forEach((pm, pIdx) => {
      if (!pm || !pm.left || !pm.right) return;
      if (pm.left.id === itemId || pm.right.id === itemId) {
        const isLeft = pm.left.id === itemId;
        const opp = isLeft ? pm.right : pm.left;
        const effectiveWinner = pm.winner || pm.left;
        const won = effectiveWinner.id === itemId;
        if (pm.winner) {
          if (won) wins++; else losses++;
        }
        const rec = {
          stage: 'Battle of Losers #' + (pIdx + 1) + ' (C vs D Redemption)',
          roundIdx: 5,
          matchIdx: pIdx,
          isPlacement: true,
          won,
          opponent: opp
        };
        history.push(rec);
        decisiveMatch = rec;
      }
    });

    const tierMap = (state.tiers && state.tiers[topic.id]) || autoPopulateTiers26888(topic, bracket);
    const assignedTier = tierMap[itemId] || 'B';
    const ruleTextMap = {
      S: 'S-Tier (2 Seeds): Reached the Grand Final (Champion or Runner-Up).',
      A: 'A-Tier (6 Seeds): Top-8 Finisher (2 Semifinalists + 4 Quarterfinalists).',
      B: 'B-Tier (8 Seeds): Won Round of 32 match, eliminated in Round of 16.',
      C: 'C-Tier (8 Seeds): Lost in Round of 32, then WON Battle of Losers Redemption Match.',
      D: 'D-Tier (8 Seeds): Lost in Round of 32, then LOST Battle of Losers Redemption Match.'
    };

    return {
      itemId,
      assignedTier,
      tierRule: ruleTextMap[assignedTier] || 'Auto-ranked from 39-match tournament.',
      wins,
      losses,
      history,
      decisiveMatch
    };
  }

  /**
   * POD2-603: Flips or re-opens a contender's decisive placement match so the user
   * can immediately re-fight / toggle its C-Tier vs D-Tier redemption outcome.
   */
  function flipDecisivePlacementOutcome(topic, bracket, itemId) {
    if (!topic || !bracket || !itemId) return null;
    if (!Array.isArray(bracket.placementMatches) || !bracket.placementMatches.length) {
      initLoserPlacementRound(bracket);
    }
    for (let i = 0; i < bracket.placementMatches.length; i++) {
      const pm = bracket.placementMatches[i];
      if (pm && (pm.left.id === itemId || pm.right.id === itemId)) {
        const curWinner = pm.winner || pm.left;
        pm.winner = (curWinner.id === pm.left.id) ? pm.right : pm.left;
        bracket.currentPlacementIdx = i;
        autoPopulateTiers26888(topic, bracket);
        return { matchIndex: i, newWinner: pm.winner };
      }
    }
    return null;
  }


  /**
   * FD-P0-20261117-03 (POD2-803): Updates a contender's display name & search query
   * from the interactive 32-Seed Roster / Draft Board and refreshes the active bracket.
   */
  function updateSeedItemName(topicId, itemId, newName) {
    const topic = getAllTopics().find((t) => t.id === topicId) || getActiveTopic();
    if (!topic || !itemId || !newName) return false;
    const cleanName = String(newName).trim().slice(0, 56);
    if (!cleanName) return false;
    const item = topic.items.find((it) => it.id === itemId);
    if (!item) return false;
    item.name = cleanName;
    item.searchQuery = cleanName;
    item.wikiTitle = cleanName;
    delete item.imageUrl;
    delete state.customPhotos[itemId];
    initBracket(topic);
    save();
    return true;
  }

  /**
   * FD-P0-20261117-03 (POD2-804): Computes a Spotify-Wrapped-style "Your Arena Taste
   * Archetype" Verdict Card from the player's 39-match voting history, upset rate,
   * and C/D Redemption saves.
   */
  function computePlayerTasteArchetype(topic, bracket) {
    if (!topic || !bracket) return null;
    const seedIndexMap = {};
    (topic.items || []).forEach((it, idx) => { seedIndexMap[it.id] = idx + 1; });

    let totalDecided = 0;
    let upsetsPicked = 0;
    let biggestUpsetDiff = 0;
    let biggestUpsetWinner = null;

    (bracket.rounds || []).forEach((roundMatches) => {
      (roundMatches || []).forEach((m) => {
        if (!m || !m.winner || !m.left || !m.right) return;
        totalDecided++;
        const winSeed = seedIndexMap[m.winner.id] || 16;
        const loseItem = m.winner.id === m.left.id ? m.right : m.left;
        const loseSeed = seedIndexMap[loseItem.id] || 16;
        const diff = winSeed - loseSeed;
        if (diff >= 4) {
          upsetsPicked++;
          if (diff > biggestUpsetDiff) {
            biggestUpsetDiff = diff;
            biggestUpsetWinner = m.winner.name + ' (#' + winSeed + ') over ' + loseItem.name + ' (#' + loseSeed + ')';
          }
        }
      });
    });

    const upsetPct = totalDecided > 0 ? Math.round((upsetsPicked / totalDecided) * 100) : 0;
    const champSeed = (bracket.champion && seedIndexMap[bracket.champion.id]) || 1;

    let archetypeTitle = '👑 Chalk Purist Taktician';
    let archetypeVibe = 'You respect championship pedigree and dominant #1 seeds — zero gimmicks, pure powerhouse supremacy.';
    if (upsetPct >= 35 || champSeed >= 12) {
      archetypeTitle = '⚡ Chaos Giant-Killer';
      archetypeVibe = 'You thrive on bracket-busting upsets and Cinderella runs, toppling heavyweights without hesitation!';
    } else if (upsetPct >= 18 || champSeed >= 5) {
      archetypeTitle = '🔥 Dark-Horse Whisperer';
      archetypeVibe = 'You balance elite contenders with clutch sleeper picks that outlast overrated favorites.';
    }

    return {
      archetypeTitle,
      archetypeVibe,
      upsetsPicked,
      totalDecided,
      upsetPct,
      champSeed,
      biggestUpsetWinner: biggestUpsetWinner || (bracket.champion ? bracket.champion.name + ' (Undisputed Run)' : 'Pending')
    };
  }

  
  // POD2-902: 1-Tap Draft Board Seed Reroll drawing from Domain-Verified Reserve Pool

  // =========================================================================
  // POD2-1004: Hall of Champions Local Trophy Cabinet (v3.0.0)
  // =========================================================================
  function getTrophyCabinet() {
    try {
      const key = (window.VibeVersion && window.VibeVersion.TROPHY_CABINET_KEY) || 'vibebracket_arena_v3_trophies';
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function recordChampionToCabinet(customEntry) {
    try {
      const topic = getActiveTopic();
      const b = getActiveBracket();
      if (!customEntry && (!topic || !b || !b.champion)) return getTrophyCabinet();
      const arch = (!customEntry && typeof computePlayerTasteArchetype === 'function')
        ? computePlayerTasteArchetype(topic, b)
        : null;
      const duel = (!customEntry && typeof computeFriendDuelComparison === 'function' && state.activeChallenge)
        ? computeFriendDuelComparison(state.activeChallenge)
        : null;
      const entry = customEntry || {
        id: 'trophy_' + (topic ? topic.id : 'custom') + '_' + Date.now(),
        topicId: topic ? topic.id : 'custom',
        topicTitle: String((topic && topic.title) || 'Arena Tournament').slice(0, 80),
        championName: String((b && b.champion && b.champion.name) || 'Grand Champion').slice(0, 60),
        championEmoji: (b && b.champion && b.champion.emoji) || '👑',
        runnerUpName: String((b && b.runnerUp && b.runnerUp.name) || 'Runner-Up').slice(0, 60),
        bummerName: String((b && b.ultimateBummer && b.ultimateBummer.name) || 'D-Tier Anchor').slice(0, 60),
        archetypeTitle: (arch && arch.archetypeTitle) || '👑 Purist Taktician',
        upsetPct: (arch && typeof arch.upsetPct === 'number') ? arch.upsetPct : 0,
        duelSummary: duel ? (duel.badge + ' (' + duel.agreementPct + '% vs @' + duel.challengerHandle + ')') : 'Solo Crown',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
      };
      const current = getTrophyCabinet().filter(t => !(t.topicId === entry.topicId && t.championName === entry.championName));
      current.unshift(entry);
      const trimmed = current.slice(0, 24);
      const key = (window.VibeVersion && window.VibeVersion.TROPHY_CABINET_KEY) || 'vibebracket_arena_v3_trophies';
      localStorage.setItem(key, JSON.stringify(trimmed));
      return trimmed;
    } catch (e) {
      return getTrophyCabinet();
    }
  }

  function rerollDraftSeed(seedIndex) {
    const topic = getActiveTopic();
    if (!topic || !Array.isArray(topic.items)) return null;
    const idx = Number(seedIndex);
    if (isNaN(idx) || idx < 0 || idx >= topic.items.length) return null;
    const currentNames = topic.items.map(it => it.name);
    const oldItem = topic.items[idx];
    let replacement = null;
    if (window.VibeGenAI && typeof window.VibeGenAI.getReserveSeedForTopic === 'function') {
      replacement = window.VibeGenAI.getReserveSeedForTopic(topic.title, currentNames, idx);
    }
    if (!replacement) {
      replacement = {
        id: 'reroll_' + Date.now() + '_' + idx,
        name: topic.title + ' Reserve #' + (idx + 1),
        tag: 'Rerolled Seed #' + (idx + 1),
        emoji: '🎲',
        searchQuery: topic.title,
        wikiTitle: topic.title
      };
    }
    // Preserve stable slot ID if bracket hasn't started voting so bracket slots stay synced
    replacement.id = oldItem.id || replacement.id;
    topic.items[idx] = replacement;
    if (state.customPhotos && state.customPhotos[replacement.id]) {
      delete state.customPhotos[replacement.id];
    }
    // Rebuild bracket if 0 votes cast so Round of 32 reflects the new seed immediately (BUG-P1-20261118-01 Fixed)
    const b = getActiveBracket();
    if (b && (!b.history || b.history.length === 0)) {
      initBracket(topic);
    }
    save();
    return Object.assign({}, replacement, {
      ok: true,
      index: idx,
      previous: oldItem,
      replacement
    });
  }

  // POD2-904: Stateless #challenge= Friend-Duel Encoder, Parser & Agreement Calculator
  // BUG-P1-20261118-02 / ACT-P2-20261118-02 Fix: Define getActiveTiers() helper for encodeChallengeLink & computeFriendDuelComparison
  function getActiveTiers() {
    const topic = getActiveTopic();
    const b = getActiveBracket();
    if (!topic) return { S: [], A: [], B: [], C: [], D: [] };
    const tMap = (state.tiers && state.tiers[topic.id]) || (b ? autoPopulateTiers26888(topic, b) : {});
    const grouped = { S: [], A: [], B: [], C: [], D: [] };
    (topic.items || []).forEach((it) => {
      const t = tMap[it.id];
      if (t && grouped[t]) grouped[t].push(it);
    });
    return grouped;
  }

  function encodeChallengeLink(challengerHandle) {
    const topic = getActiveTopic();
    const b = getActiveBracket();
    if (!topic || !b) return '';
    const arch = computePlayerTasteArchetype(topic, b);
    const tiers = getActiveTiers() || { S: [], A: [], B: [], C: [], D: [] };
    const champName = b.champion ? b.champion.name : (topic.items[0] ? topic.items[0].name : 'Champion');
    const cWinners = ((b.loserPlacement && b.loserPlacement.matches) || [])
      .filter(m => m && m.winner)
      .map(m => m.winner.name);
    const payload = {
      v: '2.9.0',
      h: (window.PackSanitizer ? window.PackSanitizer.cleanText(challengerHandle || 'Arena Challenger', 32) : String(challengerHandle || 'Arena Challenger').slice(0, 32)),
      tid: topic.id,
      tt: (window.PackSanitizer ? window.PackSanitizer.cleanText(topic.title, 70) : String(topic.title).slice(0, 70)),
      ch: champName,
      rk: cWinners[0] || (tiers.C && tiers.C[0] && tiers.C[0].name) || 'Redemption Hero',
      ar: arch.title,
      up: arch.upsetPct,
      s: (tiers.S || []).slice(0, 2).map(x => x.name || String(x)),
      a: (tiers.A || []).slice(0, 6).map(x => x.name || String(x))
    };
    try {
      const json = JSON.stringify(payload);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      return '#challenge=' + encoded;
    } catch (err) {
      return '';
    }
  }

  function parseChallengeLink(rawHashOrUrl) {
    const str = String(rawHashOrUrl || '');
    const m = str.match(/(?:[#?&]challenge=)([A-Za-z0-9+/=%_-]+)/);
    if (!m || !m[1]) return null;
    try {
      const rawB64 = decodeURIComponent(m[1]);
      const json = decodeURIComponent(escape(atob(rawB64)));
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      const clean = window.PackSanitizer && typeof window.PackSanitizer.cleanText === 'function'
        ? (txt, max) => window.PackSanitizer.cleanText(txt, max)
        : (txt, max) => String(txt || '').replace(/[<>]/g, '').slice(0, max || 60);
      return {
        version: clean(parsed.v || '2.9.0', 12),
        handle: clean(parsed.h || 'Rival Challenger', 32),
        topicId: clean(parsed.tid || '', 40),
        topicTitle: clean(parsed.tt || '32-Seed Showdown', 70),
        champion: clean(parsed.ch || 'Unknown Champion', 60),
        redemptionKing: clean(parsed.rk || 'Redemption Hero', 60),
        archetype: clean(parsed.ar || '👑 Chalk Purist Taktician', 50),
        upsetPct: Math.max(0, Math.min(100, Number(parsed.up) || 0)),
        sTier: Array.isArray(parsed.s) ? parsed.s.slice(0, 2).map(x => clean(x, 60)) : [],
        aTier: Array.isArray(parsed.a) ? parsed.a.slice(0, 6).map(x => clean(x, 60)) : []
      };
    } catch (err) {
      return null;
    }
  }

  function computeFriendDuelComparison(challengerPayload) {
    const topic = getActiveTopic();
    const b = getActiveBracket();
    const tiers = getActiveTiers() || { S: [], A: [], B: [], C: [], D: [] };
    const myArch = computePlayerTasteArchetype(topic, b);
    const myChamp = (b && b.champion && b.champion.name) || (tiers.S && tiers.S[0] && tiers.S[0].name) || (topic && topic.items[0] && topic.items[0].name) || 'Contender #1';
    const rival = challengerPayload || {
      handle: 'Rival Friend',
      topicTitle: topic ? topic.title : 'Arena Showdown',
      champion: (topic && topic.items[1] && topic.items[1].name) || 'Contender #2',
      redemptionKing: (topic && topic.items[16] && topic.items[16].name) || 'Contender #17',
      archetype: '🔥 Dark-Horse Whisperer',
      upsetPct: 35,
      sTier: [(topic && topic.items[1] && topic.items[1].name) || 'Seed #2', (topic && topic.items[0] && topic.items[0].name) || 'Seed #1'],
      aTier: (topic ? topic.items.slice(2, 8).map(x => x.name) : [])
    };

    let score = 0;
    const sameChampion = String(myChamp).toLowerCase() === String(rival.champion).toLowerCase();
    if (sameChampion) score += 42;

    const myTopSet = new Set(
      [].concat(tiers.S || [], tiers.A || [])
        .map(x => String((x && x.name) || x || '').toLowerCase())
        .filter(Boolean)
    );
    const rivalTopList = [].concat(rival.sTier || [], rival.aTier || []);
    let overlapCount = 0;
    rivalTopList.forEach(name => {
      if (myTopSet.has(String(name || '').toLowerCase())) overlapCount++;
    });
    const maxTop = Math.max(1, rivalTopList.length);
    score += Math.round((overlapCount / maxTop) * 38);

    const upsetGap = Math.abs((myArch.upsetPct || 0) - (rival.upsetPct || 0));
    score += Math.max(0, 20 - Math.round(upsetGap * 0.4));
    const agreementPct = Math.max(8, Math.min(100, score));

    let badge = '💥 Arch-Rivals';
    let verdictLine = 'Total bracket warfare — your S-Tier picks sparked maximum group-chat controversy!';
    if (agreementPct >= 75) {
      badge = '🔥 Vibe Twin';
      verdictLine = 'Elite taste synchronization — you both crowned the same upper-echelon legends!';
    } else if (agreementPct >= 48) {
      badge = '⚔️ Friendly Rivals';
      verdictLine = 'Respectable overlap in the Quarterfinals, but a dramatic clash at the throne!';
    }

    const biggestDisagreement = sameChampion
      ? ('Redemption Clash: ' + rival.redemptionKing + ' vs your C-Tier picks')
      : ('Throne Clash: Your ' + myChamp + ' vs ' + rival.handle + '\'s ' + rival.champion);

    return {
      agreementPct,
      badge,
      verdictLine,
      sameChampion,
      myChampion: myChamp,
      rivalChampion: rival.champion,
      myArchetype: myArch.title,
      rivalArchetype: rival.archetype,
      rivalHandle: rival.handle,
      topicTitle: topic ? topic.title : rival.topicTitle,
      biggestDisagreement
    };
  }

  return {
    getTrophyCabinet,
    recordChampionToCabinet,
    rerollDraftSeed,
    getActiveTiers,
    encodeChallengeLink,
    parseChallengeLink,
    computeFriendDuelComparison,

    data: state,
    updateSeedItemName,
    computePlayerTasteArchetype,
    getSeedTournamentProvenance,
    flipDecisivePlacementOutcome,
    STARTER_TOPICS,
    load,
    hydratePhotosFromVault,
    save,
    getAllTopics,
    getActiveTopic,
    initBracket,
    getActiveBracket,
    initLoserPlacementRound,
    autoPopulateTiers26888,
    autoPopulateTiersFromBracket,
    resolvePlacementMatch,
    autoResolveAllPlacementMatches,
    getTierPromotionDelta,
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
