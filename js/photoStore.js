// Version: 2.7.0 | Last Modified: 2026-11-16 22:36 HKT
/**
 * File: js/photoStore.js
 * Description: Client-side IndexedDB photo vault with automatic localStorage, in-memory fallback, and topic-scoped multi-candidate seed URL array storage (POD2-201, POD2-401 & POD2-501).
 * Change Log:
 *   - v1.0.0 (2026-11-14 01:55 HKT): Initial Common Repo release by Victor Lin (03_CTO) & Nadia Al-Mansoor (04_CISO).
 *   - v2.2.0 (2026-11-14 10:17 HKT): Integrated into VibeBracket Arena v2.2.0 for >50MB local photo capacity with zero cloud burn.
 *   - v2.3.0 (2026-11-14 22:35 HKT): Added CORS-safe remote seed thumbnail caching support for POD2-303 real-time 32-seed image resolution.
 *   - v2.4.0 (2026-11-15 10:36 HKT): Added putCandidatePhotos() and getCandidatePhotosSync() storing up to 3 candidate https:// image URLs per seed for 1-tap photo cycling (POD2-401).
 *   - v2.5.0 (2026-11-15 22:14 HKT): Added topic-contextual cache key normalization buildContextualCacheKey(queryText, topicTitle) for POD2-501 (FD-P0-20261115-01) so polysemous seed names never collide across different arena topics.
 *   - v2.6.0 (2026-11-16 10:09 HKT): Upgraded to Common Repo v1.5.0: added pinContenderImageUrl(itemId, url) and getPinnedUrlSync(itemId) for 1-tap seed image URL pinning (POD2-601).
 *   - v2.7.0 (2026-11-16 22:36 HKT): Closed BUG-P1-20261116-02 (POD2-702 / Common Repo v1.6.0): added VALID_STORED_IMG_RE accepting both data:image/ and https:// URLs in putPhoto() and hydrateAll(), and exported pinContenderImageUrl and getPinnedUrlSync.
 */
window.NetHustlePhotoStore = (() => {
  const DB_NAME = 'NetHustle_VibeBracket_PhotoVault_v1';
  const STORE_NAME = 'contender_photos';
  const LEGACY_KEY = 'vibetrack_custom_images';
  const CANDIDATES_KEY = 'vibetrack_seed_candidates_v25';
  const VALID_STORED_IMG_RE = /^(?:data:image\/|https:\/\/[a-z0-9.\-_~:\/?#\[\]@!$&'()*+,;=%]+$)/i;
  const memoryCache = {};
  const memoryCandidates = {};
  let dbPromise = null;

  /** Builds a topic-contextual cache key (queryText + '|' + cleanTopic).toLowerCase() (POD2-501). */
  function buildContextualCacheKey(queryText, topicTitle) {
    const q = String(queryText || '').trim().toLowerCase();
    const t = String(topicTitle || '')
      .replace(/\(32-Seed Arena\)|\(32 Seeds\)|\b32-Seed\b|\bArena\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    return (q + '|' + t).slice(0, 120);
  }

  /** Opens or initializes the local IndexedDB database safely. */
  function getDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
    return dbPromise;
  }

  /** Stores up to 3 candidate https:// or data:image/ URLs per contender ID and optional contextual key (POD2-401 & POD2-501). */
  function putCandidatePhotos(itemId, urls, contextualKey = '') {
    const cleanId = String(itemId || '').slice(0, 64);
    if (!cleanId || !Array.isArray(urls)) return [];
    const filtered = urls
      .filter((u) => typeof u === 'string' && (u.startsWith('https://') || u.startsWith('data:image/')))
      .slice(0, 3);
    memoryCandidates[cleanId] = filtered;
    if (contextualKey) {
      memoryCandidates[String(contextualKey).slice(0, 120)] = filtered;
    }
    try {
      localStorage.setItem(CANDIDATES_KEY, JSON.stringify(memoryCandidates));
    } catch (_) {}
    return filtered;
  }

  /** Returns the cached candidate URL array for a contender ID or contextual key (POD2-401 & POD2-501). */
  function getCandidatePhotosSync(itemId, contextualKey = '') {
    if (contextualKey && memoryCandidates[contextualKey] && memoryCandidates[contextualKey].length) {
      return memoryCandidates[contextualKey];
    }
    const cleanId = String(itemId || '').slice(0, 64);
    return memoryCandidates[cleanId] || [];
  }

  /** Stores a compressed data:image/jpeg URI by contender ID across memory, IndexedDB, and best-effort localStorage. */
  async function putPhoto(itemId, dataUrl) {
    const cleanId = String(itemId || '').slice(0, 64);
    if (!cleanId) return false;
    if (!dataUrl) {
      delete memoryCache[cleanId];
    } else {
      if (!VALID_STORED_IMG_RE.test(String(dataUrl).trim())) return false;
      memoryCache[cleanId] = dataUrl;
    }
    try {
      localStorage.setItem(LEGACY_KEY, JSON.stringify(memoryCache));
    } catch (e) {
      // QuotaExceededError handled gracefully; IndexedDB and memoryCache retain full 32-seed set
    }
    const db = await getDb();
    if (!db) return true;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        if (!dataUrl) store.delete(cleanId);
        else store.put(dataUrl, cleanId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  /** Loads all stored photos and candidate URL arrays from IndexedDB / localStorage on startup. */
  async function hydrateAll() {
    try {
      const rawLegacy = localStorage.getItem(LEGACY_KEY);
      if (rawLegacy) {
        const parsed = JSON.parse(rawLegacy);
        if (parsed && typeof parsed === 'object') {
          Object.keys(parsed).forEach((k) => {
            if (typeof parsed[k] === 'string' && VALID_STORED_IMG_RE.test(parsed[k].trim())) {
              memoryCache[k] = parsed[k];
            }
          });
        }
      }
      const rawCand = localStorage.getItem(CANDIDATES_KEY);
      if (rawCand) {
        const parsedCand = JSON.parse(rawCand);
        if (parsedCand && typeof parsedCand === 'object') {
          Object.keys(parsedCand).forEach((k) => {
            if (Array.isArray(parsedCand[k])) {
              memoryCandidates[k] = parsedCand[k].slice(0, 3);
            }
          });
        }
      }
    } catch (e) {
      // Ignore legacy parse issues
    }
    const db = await getDb();
    if (!db) return { ...memoryCache };
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            if (typeof cursor.value === 'string' && VALID_STORED_IMG_RE.test(cursor.value.trim())) {
              memoryCache[cursor.key] = cursor.value;
            }
            cursor.continue();
          } else {
            resolve({ ...memoryCache });
          }
        };
        req.onerror = () => resolve({ ...memoryCache });
      } catch (e) {
        resolve({ ...memoryCache });
      }
    });
  }

  return {
    VALID_STORED_IMG_RE,
    buildContextualCacheKey,
    putPhoto,
    pinContenderImageUrl: putPhoto,
    putCandidatePhotos,
    getCandidatePhotosSync,
    hydrateAll,
    getPhotoSync: (id) => memoryCache[id] || null,
    getPinnedUrlSync: (id) => memoryCache[id] || null
  };
})();
