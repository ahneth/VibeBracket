// Version: 2.5.0 | Last Modified: 2026-11-15 22:14 HKT
/**
 * File: js/visuals.js
 * Description: Contextual <Seed Name> <Arena Topic> 3-Provider Real-Time Seed Image Resolver (Google Image Custom Search + Wikipedia PageImages/Wikimedia Commons + Openverse CC0/CC-BY REST API), 1-Tap Seed Photo Cycler, CORS-safe Canvas DataURL converter, procedural SVG fallback banner generator, and HTML5 Canvas particle/confetti & diagonal VS clash shockwave engine.
 * Change Log:
 *   - v1.2.0 (2026-11-13 08:15 HKT): Created module to render rich visual artwork banners on contender cards and celebratory particle bursts.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Track A release compatibility.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Added triggerClashSparks() canvas energy burst for 60fps Versus Clash transitions.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Closed OBS-P3-01 / CAR-20261114-02 by stripping [<>&"'] XML control characters on item.emoji before SVG interpolation.
 *   - v2.3.0 (2026-11-14 22:35 HKT): Implemented POD2-303 (FD-P0-20261114-03) real-time seed image lookup via Google Image API / Wikipedia REST pageimages / Wikimedia Commons with strict https:// validation and NetHustlePhotoStore IndexedDB caching.
 *   - v2.4.0 (2026-11-15 10:36 HKT): Implemented POD2-401 3-Provider CORS Image Fetcher cascading across Google Custom Search, Wikipedia/Wikimedia Commons, and Openverse CC REST API, caching up to 3 candidate URLs per seed and adding cycleSeedPhoto().
 *   - v2.5.0 (2026-11-15 22:14 HKT): Implemented POD2-501 (FD-P0-20261115-01) buildContextualImageQueries(item, topicTitle) ("<Seed Name> <Cleaned Arena Topic>" -> "<Seed Name> <Item Tag>" -> "<Seed Name>") across all 3 providers with topic-scoped cache keys, and upgraded triggerClashSparks() with diagonal cross-section VS lightning shockwaves (POD2-503).
 */
window.VibeVisuals = (() => {
  const PALETTES = [
    ['#0ea5e9', '#6366f1', '#1e1b4b'],
    ['#ec4899', '#8b5cf6', '#2e1065'],
    ['#f59e0b', '#ef4444', '#450a0a'],
    ['#10b981', '#06b6d4', '#042f2e'],
    ['#a855f7', '#ec4899', '#3b0764'],
    ['#3b82f6', '#2dd4bf', '#0f172a'],
    ['#f97316', '#eab308', '#422006'],
    ['#14b8a6', '#6366f1', '#1e1b4b']
  ];

  const SAFE_IMAGE_URL_RE = /^(?:https:\/\/[^\s"'<>]+|data:image\/(?:png|jpeg|webp|svg\+xml)[;,][^\s"'<>]*)$/i;
  let activeAnimId = null;
  const inflightImageLookups = new Map();

  /** Deterministic hash from a string to pick a consistent visual palette and pattern. */
  function hashStr(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  /** Validates that an image URL is strictly https:// or a safe data:image/ URI (OWASP Top 10:2025). */
  function isSafeImageUrl(url) {
    return typeof url === 'string' && SAFE_IMAGE_URL_RE.test(url.trim());
  }

  /**
   * FD-P0-20261115-01 (POD2-501): Builds contextual search query candidates combining
   * the seed name with the cleaned arena topic/category and item tag so Wikipedia PageImages,
   * Wikimedia Commons, Openverse CC API, and Google Custom Search return accurate, topic-specific seed photos.
   */
  function buildContextualImageQueries(item, topicTitle) {
    const cleanName = String((item && (item.searchQuery || item.name)) || '').replace(/\s*—.*$/, '').trim();
    const cleanTopic = String(topicTitle || '')
      .replace(/\(32-Seed Arena\)|\(32 Seeds\)|\b32-Seed\b|\bArena\b|\bUltimate\b|\bGreatest\b|\bIconic\b|\bTop\b|\bShowdown\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanTag = String((item && item.tag) || '').replace(/^Seed #\d+$/i, '').trim();
    const queries = [];
    if (cleanName && cleanTopic && !cleanName.toLowerCase().includes(cleanTopic.toLowerCase())) {
      queries.push(cleanName + ' ' + cleanTopic);
    }
    if (cleanName && cleanTag && !queries.includes(cleanName + ' ' + cleanTag)) {
      queries.push(cleanName + ' ' + cleanTag);
    }
    if (cleanName && !queries.includes(cleanName)) {
      queries.push(cleanName);
    }
    return queries;
  }

  /**
   * Builds a rich procedural SVG data URI banner for any contender as an instant offline/CORS fallback.
   * Supports variantOffset (0, 1, 2) so cycling photos offline also shifts visual palette & geometry.
   */
  function getProceduralSvgBannerUrl(item, seedNumber, variantOffset = 0) {
    const h = hashStr((item && item.name) || 'contender') + Number(variantOffset || 0);
    const [c1, c2, c3] = PALETTES[h % PALETTES.length];
    const emoji = String((item && item.emoji) || '⚡').replace(/[<>&"']/g, '').slice(0, 4) || '⚡';
    const tag = String((item && item.tag) || 'SEED #' + (seedNumber || 1)).toUpperCase().replace(/[<>&"']/g, '');
    const nameClean = String((item && item.name) || 'Contender').replace(/[<>&"']/g, '').slice(0, 28);
    const initials = String((item && item.name) || 'VB')
      .split(/\s+/)
      .map((w) => w[0] || '')
      .join('')
      .slice(0, 3)
      .toUpperCase()
      .replace(/[<>&"']/g, '');

    const ringCx = 395 - (Number(variantOffset || 0) * 35);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240" width="480" height="240">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="55%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${c3}"/>
        </linearGradient>
        <radialGradient id="glow" cx="75%" cy="25%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="480" height="240" rx="20" fill="url(#g)"/>
      <rect width="480" height="240" rx="20" fill="url(#glow)"/>
      <circle cx="${ringCx}" cy="40" r="110" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="18"/>
      <circle cx="80" cy="210" r="85" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="12"/>
      <text x="365" y="195" font-family="Inter, sans-serif" font-size="96" font-weight="900" fill="rgba(255,255,255,0.11)" text-anchor="middle">${initials}</text>
      <rect x="22" y="20" width="160" height="32" rx="16" fill="rgba(9,13,22,0.65)"/>
      <text x="102" y="41" font-family="Inter, sans-serif" font-size="13" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="1">${tag.slice(0, 18)}</text>
      <circle cx="240" cy="116" r="52" fill="rgba(9,13,22,0.45)" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
      <text x="240" y="135" font-size="52" text-anchor="middle">${emoji}</text>
      <text x="240" y="212" font-family="Inter, sans-serif" font-size="16" font-weight="800" fill="rgba(248,250,252,0.9)" text-anchor="middle">${nameClean}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /**
   * Returns the best available visual banner URL for a contender:
   * 1. Cached or custom photo in NetHustlePhotoStore / VibeState
   * 2. Real-time resolved https:// item.imageUrl
   * 3. Procedural SVG banner fallback
   */
  function getContenderBannerUrl(item, seedNumber) {
    if (item && item.id && window.VibeState && window.VibeState.getContenderPhoto) {
      const vaultImg = window.VibeState.getContenderPhoto(item.id);
      if (vaultImg && isSafeImageUrl(vaultImg)) return vaultImg;
    }
    if (item && item.imageUrl && isSafeImageUrl(item.imageUrl)) {
      return item.imageUrl;
    }
    return getProceduralSvgBannerUrl(item, seedNumber, item && item.imageCandidateIdx ? item.imageCandidateIdx : 0);
  }

  /**
   * Converts a remote https:// image URL into a CORS-safe data:image/jpeg URI using img.crossOrigin = 'anonymous'
   * and caches it in NetHustlePhotoStore so HTML5 <canvas> poster exports never taint.
   */
  function cacheRemoteImageAsDataUrl(itemId, remoteUrl) {
    return new Promise((resolve) => {
      if (!isSafeImageUrl(remoteUrl) || typeof Image === 'undefined' || typeof document === 'undefined') {
        resolve(null);
        return;
      }
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => resolve(remoteUrl), 3500);
        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            const scale = Math.min(1, maxDim / Math.max(img.width || 400, img.height || 400));
            canvas.width = Math.max(1, Math.round((img.width || 400) * scale));
            canvas.height = Math.max(1, Math.round((img.height || 400) * scale));
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            if (window.NetHustlePhotoStore && itemId) {
              window.NetHustlePhotoStore.putPhoto(itemId, dataUrl);
            }
            resolve(dataUrl);
          } catch (taintErr) {
            resolve(remoteUrl);
          }
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
        img.src = remoteUrl;
      } catch (e) {
        resolve(null);
      }
    });
  }

  /**
   * POD2-401 & POD2-501 (FD-P0-20261115-01): Contextual Multi-Provider Real-Time Seed Image Resolver.
   * Uses buildContextualImageQueries(item, topicTitle) ("<Seed Name> <Arena Topic>" -> "<Seed Name> <Tag>" -> "<Seed Name>")
   * across Google Custom Search, Wikipedia PageImages (gsrlimit=6), Wikimedia Commons (gsrlimit=6), and Openverse CC API,
   * scoping cache keys by (queryText + '|' + cleanTopic).toLowerCase().
   */
  async function fetchRealtimeSeedImage(item, topicTitle, options = {}) {
    if (!item || !item.name) return null;
    const queries = buildContextualImageQueries(item, topicTitle);
    const primaryQuery = queries[0] || String(item.name).trim();
    const contextualKey = (window.NetHustlePhotoStore && window.NetHustlePhotoStore.buildContextualCacheKey)
      ? window.NetHustlePhotoStore.buildContextualCacheKey(item.searchQuery || item.name, topicTitle)
      : (primaryQuery + '|' + String(topicTitle || '')).toLowerCase();

    if (!options.forceRefresh && item.imageUrl && isSafeImageUrl(item.imageUrl) && Array.isArray(item.imageCandidates) && item.imageCandidates.length > 0 && item.contextualCacheKey === contextualKey) {
      return item.imageUrl;
    }

    if (inflightImageLookups.has(contextualKey)) {
      return inflightImageLookups.get(contextualKey);
    }

    const lookupPromise = (async () => {
      const candidates = [];
      const addCandidate = (url, sourceLabel) => {
        if (isSafeImageUrl(url) && !candidates.some((c) => c.url === url) && candidates.length < 3) {
          candidates.push({ url: url.trim(), source: sourceLabel });
        }
      };

      // Provider 1: Optional Google Image Custom Search JSON API (with contextual query)
      if (options.googleApiKey && options.googleCx) {
        try {
          const gUrl = 'https://customsearch.googleapis.com/customsearch/v1?searchType=image&num=3&safe=active&key='
            + encodeURIComponent(options.googleApiKey)
            + '&cx=' + encodeURIComponent(options.googleCx)
            + '&q=' + encodeURIComponent(primaryQuery);
          const gRes = await fetch(gUrl);
          if (gRes && gRes.ok) {
            const gData = await gRes.json();
            const gItems = Array.isArray(gData?.items) ? gData.items : [];
            gItems.forEach((gi) => {
              const link = gi?.link || gi?.image?.thumbnailLink;
              addCandidate(link, 'Google Images');
            });
          }
        } catch (_) {}
      }

      // Provider 2A: Live Wikipedia PageImages API using contextual queries (origin=*, gsrlimit=6, pithumbsize=400)
      for (const qStr of queries) {
        if (candidates.length >= 3) break;
        try {
          const wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='
            + encodeURIComponent(qStr)
            + '&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json&origin=*';
          const wRes = await fetch(wikiUrl);
          if (wRes && wRes.ok) {
            const wData = await wRes.json();
            const pages = wData?.query?.pages ? Object.values(wData.query.pages) : [];
            pages.sort((a, b) => (a.index || 999) - (b.index || 999));
            for (const p of pages) {
              const thumb = p?.thumbnail?.source;
              addCandidate(thumb, 'Wikimedia / Wikipedia');
            }
          }
        } catch (_) {}
      }

      // Provider 2B: Wikimedia Commons Direct Image Search using contextual queries (origin=*, gsrlimit=6)
      for (const qStr of queries) {
        if (candidates.length >= 3) break;
        try {
          const commonsUrl = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch='
            + encodeURIComponent(qStr)
            + '&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*';
          const cRes = await fetch(commonsUrl);
          if (cRes && cRes.ok) {
            const cData = await cRes.json();
            const cPages = cData?.query?.pages ? Object.values(cData.query.pages) : [];
            for (const cp of cPages) {
              const thumbUrl = cp?.imageinfo?.[0]?.thumburl || cp?.imageinfo?.[0]?.url;
              if (thumbUrl && /\.(?:jpg|jpeg|png|webp)$/i.test(thumbUrl)) {
                addCandidate(thumbUrl, 'Wikimedia Commons');
              }
            }
          }
        } catch (_) {}
      }

      // Provider 3: Openverse CC0 / CC-BY Public REST API using contextual query (POD2-401 & POD2-501)
      if (candidates.length < 3) {
        const openverseEndpoints = [
          'https://api.openverse.org/v1/images/?q=' + encodeURIComponent(primaryQuery) + '&page_size=4&format=json',
          'https://api.openverse.engineering/v1/images/?q=' + encodeURIComponent(primaryQuery) + '&page_size=4&format=json'
        ];
        for (const ovUrl of openverseEndpoints) {
          if (candidates.length >= 3) break;
          try {
            const ovRes = await fetch(ovUrl);
            if (ovRes && ovRes.ok) {
              const ovData = await ovRes.json();
              const results = Array.isArray(ovData?.results) ? ovData.results : [];
              for (const r of results) {
                const thumb = r?.thumbnail || r?.url;
                const creator = r?.creator ? ('Openverse CC (' + String(r.creator).slice(0, 20) + ')') : 'Openverse CC';
                addCandidate(thumb, creator);
              }
            }
          } catch (_) {}
        }
      }

      if (candidates.length > 0) {
        item.imageCandidates = candidates.map((c) => c.url);
        item.imageSources = candidates.map((c) => c.source);
        item.imageCandidateIdx = 0;
        item.imageUrl = candidates[0].url;
        item.imageSource = candidates[0].source;
        item.contextualCacheKey = contextualKey;
        if (window.NetHustlePhotoStore && window.NetHustlePhotoStore.putCandidatePhotos) {
          window.NetHustlePhotoStore.putCandidatePhotos(item.id, item.imageCandidates, contextualKey);
        }
        await cacheRemoteImageAsDataUrl(item.id, item.imageUrl);
        return item.imageUrl;
      }
      return null;
    })();

    inflightImageLookups.set(contextualKey, lookupPromise);
    try {
      return await lookupPromise;
    } finally {
      inflightImageLookups.delete(contextualKey);
    }
  }

  /**
   * POD2-401 & POD2-501: Cycles a contender's active banner photo across up to 3 cached remote candidates
   * (plus procedural SVG style variants so 1-tap cycling always gives immediate visual feedback).
   */
  async function cycleSeedPhoto(item, seedNumber = 1, topicTitle = '') {
    if (!item) return null;
    const contextualKey = item.contextualCacheKey || (
      window.NetHustlePhotoStore && window.NetHustlePhotoStore.buildContextualCacheKey
        ? window.NetHustlePhotoStore.buildContextualCacheKey(item.searchQuery || item.name, topicTitle)
        : ''
    );
    let cands = Array.isArray(item.imageCandidates) ? item.imageCandidates.filter(isSafeImageUrl) : [];
    if (!cands.length && window.NetHustlePhotoStore && window.NetHustlePhotoStore.getCandidatePhotosSync) {
      cands = window.NetHustlePhotoStore.getCandidatePhotosSync(item.id, contextualKey).filter(isSafeImageUrl);
    }
    if (!cands.length && item.imageUrl && isSafeImageUrl(item.imageUrl)) {
      cands = [item.imageUrl];
    }

    const pool = cands.slice(0, 3);
    while (pool.length < 3) {
      pool.push(getProceduralSvgBannerUrl(item, seedNumber, pool.length));
    }

    const nextIdx = ((typeof item.imageCandidateIdx === 'number' ? item.imageCandidateIdx : 0) + 1) % pool.length;
    item.imageCandidateIdx = nextIdx;
    const chosenUrl = pool[nextIdx];
    item.imageUrl = chosenUrl;
    const sourceList = Array.isArray(item.imageSources) ? item.imageSources : [];
    item.imageSource = sourceList[nextIdx] || (chosenUrl.startsWith('https://') ? 'Wikimedia / Openverse CC' : 'Procedural Cyber SVG #' + (nextIdx + 1));

    if (chosenUrl.startsWith('https://')) {
      await cacheRemoteImageAsDataUrl(item.id, chosenUrl);
    } else if (window.VibeState && window.VibeState.setContenderPhoto) {
      window.VibeState.setContenderPhoto(item.id, chosenUrl);
    }
    if (window.VibeState && window.VibeState.save) {
      window.VibeState.save();
    }
    return {
      url: chosenUrl,
      index: nextIdx + 1,
      total: pool.length,
      source: item.imageSource
    };
  }

  /**
   * Resolves real-time seed images across all items in a topic in batches of 6,
   * invoking onProgress(resolvedCount, totalCount) as thumbnails arrive.
   */
  async function resolveTopicSeedImages(topic, onProgress, options = {}) {
    if (!topic || !Array.isArray(topic.items)) return 0;
    const items = topic.items;
    let resolvedCount = 0;
    const batchSize = 6;
    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize);
      const results = await Promise.all(slice.map((it) => fetchRealtimeSeedImage(it, topic.title, options)));
      results.forEach((r) => { if (r) resolvedCount++; });
      if (typeof onProgress === 'function') {
        try { onProgress(resolvedCount, items.length); } catch (_) {}
      }
    }
    if (window.VibeState && window.VibeState.save) window.VibeState.save();
    return resolvedCount;
  }

  /** Runs a short particle burst + optional diagonal VS slash shockwave on #fxCanvas (POD2-503). */
  function runParticleBurst(count, maxFrames, colors, originYRatio, drawDiagonalSlash = false) {
    const canvas = document.getElementById('fxCanvas');
    if (!canvas) return;
    if (activeAnimId) cancelAnimationFrame(activeAnimId);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const particles = Array.from({ length: count }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 180,
      y: canvas.height * originYRatio,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 12 - 3,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    }));

    let frame = 0;
    function step() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (drawDiagonalSlash && frame <= 14) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - frame / 14) * 0.75;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = Math.max(2, 12 - frame * 0.7);
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.54, canvas.height * 0.16);
        ctx.lineTo(canvas.width * 0.46, canvas.height * 0.78);
        ctx.stroke();
        ctx.restore();
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.42;
        p.alpha = Math.max(0, 1 - frame / maxFrames);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.65);
      });
      if (frame < maxFrames) {
        activeAnimId = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
        activeAnimId = null;
      }
    }
    activeAnimId = requestAnimationFrame(step);
  }

  /** Triggers a celebratory confetti burst when a Champion is crowned. */
  function triggerConfetti() {
    runParticleBurst(55, 48, ['#38bdf8', '#c084fc', '#34d399', '#fbbf24', '#f43f5e'], 0.38, false);
  }

  /** Triggers a brief VS Clash spark + diagonal cross-slash shockwave (<400ms) on matchup advance (POD2-503). */
  function triggerClashSparks() {
    runParticleBurst(28, 22, ['#fbbf24', '#38bdf8', '#f43f5e'], 0.44, true);
  }

  return {
    isSafeImageUrl,
    buildContextualImageQueries,
    getProceduralSvgBannerUrl,
    getContenderBannerUrl,
    fetchRealtimeSeedImage,
    cycleSeedPhoto,
    resolveTopicSeedImages,
    cacheRemoteImageAsDataUrl,
    triggerConfetti,
    triggerClashSparks
  };
})();
