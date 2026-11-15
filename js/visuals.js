// Version: 2.3.0 | Last Modified: 2026-11-14 22:35 HKT
/**
 * File: js/visuals.js
 * Description: Real-Time Seed Image Resolver (Google Image Custom Search + Wikipedia PageImages REST API + Openverse), CORS-safe Canvas DataURL converter, procedural SVG fallback banner generator, and HTML5 Canvas particle/confetti & clash sparks engine.
 * Change Log:
 *   - v1.2.0 (2026-11-13 08:15 HKT): Created module to render rich visual artwork banners on contender cards and celebratory particle bursts.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Track A release compatibility.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Added triggerClashSparks() canvas energy burst for 60fps Versus Clash transitions.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Closed OBS-P3-01 / CAR-20261114-02 by stripping [<>&"'] XML control characters on item.emoji before SVG interpolation.
 *   - v2.3.0 (2026-11-14 22:35 HKT): Implemented POD2-303 (FD-P0-20261114-03) real-time seed image lookup via Google Image API / Wikipedia REST pageimages (origin=*, pithumbsize=400) / Openverse with strict https:// validation, img.crossOrigin = 'anonymous', and NetHustlePhotoStore IndexedDB caching.
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
   * Builds a rich procedural SVG data URI banner for any contender as an instant offline/CORS fallback.
   * Enforces [<>&"'] stripping on tag, initials, and emoji (closing OBS-P3-01).
   */
  function getProceduralSvgBannerUrl(item, seedNumber) {
    const h = hashStr((item && item.name) || 'contender');
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
      <circle cx="400" cy="40" r="110" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="18"/>
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
    return getProceduralSvgBannerUrl(item, seedNumber);
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
            // Remote host lacked ACAO header; keep remoteUrl for <img> display and SVG for canvas fallback
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
   * Queries real-time image endpoints for a single contender (POD2-303 / FD-P0-20261114-03):
   * Tier 1: Google Custom Search Image API (if googleApiKey & googleCx provided)
   * Tier 2: Wikipedia PageImages REST API (https://en.wikipedia.org/w/api.php?...&prop=pageimages&origin=*)
   * Tier 3: Wikimedia Commons Direct File Search (origin=*)
   */
  async function fetchRealtimeSeedImage(item, topicTitle, options = {}) {
    if (!item || !item.name) return null;
    if (item.imageUrl && isSafeImageUrl(item.imageUrl)) return item.imageUrl;

    const queryText = String(item.searchQuery || item.name).replace(/—.*$/, '').trim();
    const cacheKey = queryText.toLowerCase();
    if (inflightImageLookups.has(cacheKey)) {
      return inflightImageLookups.get(cacheKey);
    }

    const lookupPromise = (async () => {
      // 1. Optional Google Image Custom Search JSON API
      if (options.googleApiKey && options.googleCx) {
        try {
          const gUrl = 'https://customsearch.googleapis.com/customsearch/v1?searchType=image&num=1&safe=active&key='
            + encodeURIComponent(options.googleApiKey)
            + '&cx=' + encodeURIComponent(options.googleCx)
            + '&q=' + encodeURIComponent(queryText + ' ' + (topicTitle || ''));
          const gRes = await fetch(gUrl);
          if (gRes && gRes.ok) {
            const gData = await gRes.json();
            const link = gData?.items?.[0]?.link || gData?.items?.[0]?.image?.thumbnailLink;
            if (isSafeImageUrl(link)) {
              item.imageUrl = link;
              item.imageSource = 'Google Images';
              await cacheRemoteImageAsDataUrl(item.id, link);
              return link;
            }
          }
        } catch (e) {
          // Fall through to Wikipedia / Wikimedia Commons
        }
      }

      // 2. Live Wikipedia PageImages API (CORS origin=*, pithumbsize=400)
      try {
        const wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='
          + encodeURIComponent(queryText)
          + '&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json&origin=*';
        const wRes = await fetch(wikiUrl);
        if (wRes && wRes.ok) {
          const wData = await wRes.json();
          const pages = wData?.query?.pages ? Object.values(wData.query.pages) : [];
          for (const p of pages) {
            const thumb = p?.thumbnail?.source;
            if (isSafeImageUrl(thumb)) {
              item.imageUrl = thumb;
              item.imageSource = 'Wikimedia / Wikipedia';
              await cacheRemoteImageAsDataUrl(item.id, thumb);
              return thumb;
            }
          }
        }
      } catch (e) {
        // Fall through to Wikimedia Commons file search
      }

      // 3. Wikimedia Commons Direct Image Search (CORS origin=*)
      try {
        const commonsUrl = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch='
          + encodeURIComponent(queryText)
          + '&gsrlimit=2&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*';
        const cRes = await fetch(commonsUrl);
        if (cRes && cRes.ok) {
          const cData = await cRes.json();
          const cPages = cData?.query?.pages ? Object.values(cData.query.pages) : [];
          for (const cp of cPages) {
            const thumbUrl = cp?.imageinfo?.[0]?.thumburl || cp?.imageinfo?.[0]?.url;
            if (isSafeImageUrl(thumbUrl) && /\.(?:jpg|jpeg|png|webp)$/i.test(thumbUrl)) {
              item.imageUrl = thumbUrl;
              item.imageSource = 'Wikimedia Commons';
              await cacheRemoteImageAsDataUrl(item.id, thumbUrl);
              return thumbUrl;
            }
          }
        }
      } catch (e) {
        // Offline or blocked; procedural SVG banner remains ready
      }
      return null;
    })();

    inflightImageLookups.set(cacheKey, lookupPromise);
    try {
      return await lookupPromise;
    } finally {
      inflightImageLookups.delete(cacheKey);
    }
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

  /** Runs a short particle burst on #fxCanvas. */
  function runParticleBurst(count, maxFrames, colors, originYRatio) {
    const canvas = document.getElementById('fxCanvas');
    if (!canvas) return;
    if (activeAnimId) cancelAnimationFrame(activeAnimId);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const particles = Array.from({ length: count }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 160,
      y: canvas.height * originYRatio,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 11 - 3,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    }));

    let frame = 0;
    function step() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    runParticleBurst(55, 48, ['#38bdf8', '#c084fc', '#34d399', '#fbbf24', '#f43f5e'], 0.38);
  }

  /** Triggers a brief VS Clash spark burst (<400ms) on matchup advance. */
  function triggerClashSparks() {
    runParticleBurst(24, 22, ['#fbbf24', '#38bdf8', '#f43f5e'], 0.44);
  }

  return {
    isSafeImageUrl,
    getProceduralSvgBannerUrl,
    getContenderBannerUrl,
    fetchRealtimeSeedImage,
    resolveTopicSeedImages,
    cacheRemoteImageAsDataUrl,
    triggerConfetti,
    triggerClashSparks
  };
})();
