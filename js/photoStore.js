// Version: 2.2.0 | Last Modified: 2026-11-14 10:17 HKT
/**
 * File: js/photoStore.js
 * Description: Client-side IndexedDB photo vault with automatic localStorage and in-memory fallback (POD2-201).
 * Change Log:
 *   - v1.0.0 (2026-11-14 01:55 HKT): Initial Common Repo release by Victor Lin (03_CTO) & Nadia Al-Mansoor (04_CISO).
 *   - v2.2.0 (2026-11-14 10:17 HKT): Integrated into VibeBracket Arena v2.2.0 for >50MB local photo capacity with zero cloud burn.
 */
window.NetHustlePhotoStore = (() => {
  const DB_NAME = 'NetHustle_VibeBracket_PhotoVault_v1';
  const STORE_NAME = 'contender_photos';
  const LEGACY_KEY = 'vibetrack_custom_images';
  const memoryCache = {};
  let dbPromise = null;

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

  /** Stores a compressed data:image/jpeg URI by contender ID across memory, IndexedDB, and best-effort localStorage. */
  async function putPhoto(itemId, dataUrl) {
    const cleanId = String(itemId || '').slice(0, 64);
    if (!cleanId) return false;
    if (!dataUrl) {
      delete memoryCache[cleanId];
    } else {
      if (!String(dataUrl).startsWith('data:image/')) return false;
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

  /** Loads all stored photos from IndexedDB (hydrating memoryCache) on startup. */
  async function hydrateAll() {
    try {
      const rawLegacy = localStorage.getItem(LEGACY_KEY);
      if (rawLegacy) {
        const parsed = JSON.parse(rawLegacy);
        if (parsed && typeof parsed === 'object') {
          Object.keys(parsed).forEach((k) => {
            if (typeof parsed[k] === 'string' && parsed[k].startsWith('data:image/')) {
              memoryCache[k] = parsed[k];
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
            if (typeof cursor.value === 'string' && cursor.value.startsWith('data:image/')) {
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
    putPhoto,
    hydrateAll,
    getPhotoSync: (id) => memoryCache[id] || null
  };
})();
