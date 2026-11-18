// Version: 2.9.0 | Last Modified: 2026-11-17 22:58 HKT | Module: js/packSanitizer.js
/**
 * File: js/packSanitizer.js
 * Description: UTF-8 safe URL-hash codec (#b=/#bracket= and #challenge=), 31-bit taste compatibility comparator, power-of-two tournament schema validator, and CSV/JSON pack import/export engine.
 * Change Log:
 *   - v1.0.0 (2026-11-14 01:55 HKT): Remediates BUG-P1-20261114-01 (CAR-20261114-01), BUG-P2-20261114-02 (CAR-20261114-02), and OBS-P3-01.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Added exportJsonPack(), exportCsvPack(), and parseImportedPack() for POD2-203 client-side tournament pack portability.
 *   - v2.3.0 (2026-11-14 22:35 HKT): Preserved imageSource attribution metadata and https:// imageUrl validation for 32-seed packs (POD2-301 & POD2-303).
 *   - v2.4.0 (2026-11-15 10:36 HKT): Added encodeChallengeHash(), decodeChallengeHash(), and computeTasteCompatibility() for POD2-404 "Beat My Bracket" Friend-vs-Friend Taste Compatibility Challenges (#challenge=).
 *   - v2.5.0 (2026-11-15 22:14 HKT): Added scrubGenericText() and purgeLegacyGenericState() for POD2-502 (FD-P0-20261115-02) to eradicate generic template suffixes across live inputs and historical localStorage/IndexedDB state.
 *   - v2.6.0 (2026-11-16 10:09 HKT): Synchronized OWASP 2025 pack sanitizer & challenge compatibility codec with v2.6.0 domain-pure 32-seed rosters.
 *   - v2.7.0 (2026-11-16 22:36 HKT): Synchronized OWASP 2025 pack sanitizer & challenge compatibility codec with v2.7.0 12-domain knowledge banks.
 *   - v2.8.0 (2026-11-17 10:47 HKT): Synchronized OWASP 2025 pack sanitizer with v2.8.0 canonical wikiTitle metadata.
 */
window.PackSanitizer = (() => {
  const VALID_SEED_COUNTS = new Set([4, 8, 16, 32]);
  const DANGEROUS_URI_RE = /^\s*(?:javascript|vbscript|data\s*:(?!image\/(?:png|jpeg|webp);base64,))/i;
  const CSV_FORMULA_PREFIX_RE = /^[=+-@\t\r]/;
  const VALID_TIERS = new Set(['S', 'A', 'B', 'C', 'D']);
  const LEGACY_GENERIC_RE = /\b(?:classic\s+legends?|legends?|classics?|fan\s+favorites?|top\s+contenders?|hall\s+of\s+fame|crowd\s+pleasers?|underrated\s+gems?|all-time\s+icons?|rising\s+challengers?|defending\s+champs?)\b|(?:pick|selection|choice|contender|candidate|entry)\s*#?\d+/i;

  /**
   * FD-P0-20261115-02 (POD2-502): Scrubs generic template suffixes ("Classic Legends", "Legends",
   * "Classics", "Fan Favorite", etc.) while preserving legitimate proper nouns such as "The Legend of Zelda".
   */
  function scrubGenericText(text, fallback = '') {
    const s = String(text == null ? '' : text).trim();
    const protectedZelda = s.replace(/The Legend of Zelda/gi, '__ZELDA_PROPER__');
    const cleaned = protectedZelda
      .replace(/\s*[—\-:|·]\s*(?:classic\s+legends?|legends?|classics?|fan\s+favorites?|top\s+contenders?|hall\s+of\s+fame).*$/i, '')
      .replace(/\b(?:classic\s+legends?|legends?|classics?)\b/gi, '')
      .replace(/__ZELDA_PROPER__/g, 'The Legend of Zelda')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || fallback;
  }

  /**
   * FD-P0-20261115-02 (POD2-502): Inspects and purges any cached localStorage / IndexedDB topics,
   * brackets, or seeds tainted by legacy generic suffixes from v1.x-v2.4.
   */
  function purgeLegacyGenericState(stateObj) {
    if (!stateObj || typeof stateObj !== 'object') return false;
    let mutated = false;
    if (Array.isArray(stateObj.customTopics)) {
      const beforeLen = stateObj.customTopics.length;
      stateObj.customTopics = stateObj.customTopics.filter((t) => {
        if (!t || !Array.isArray(t.items) || !VALID_SEED_COUNTS.has(t.items.length)) return false;
        const hasGenericSeed = t.items.some((it) => {
          const checkStr = String(it?.name || '').replace(/The Legend of Zelda/gi, '');
          return LEGACY_GENERIC_RE.test(checkStr);
        });
        if (hasGenericSeed) {
          if (stateObj.brackets) delete stateObj.brackets[t.id];
          if (stateObj.tiers) delete stateObj.tiers[t.id];
          if (stateObj.autoTiers) delete stateObj.autoTiers[t.id];
          return false;
        }
        const newTitle = scrubGenericText(t.title, '32-Seed Arena');
        const newSub = scrubGenericText(t.subtitle, '32 Authentic Contenders · 5-Round Knockout Arena');
        if (newTitle !== t.title || newSub !== t.subtitle) mutated = true;
        t.title = newTitle;
        t.subtitle = newSub;
        t.items.forEach((it, idx) => {
          const cleanedName = scrubGenericText(it.name, 'Seed #' + (idx + 1));
          const cleanedTag = scrubGenericText(it.tag, 'Seed #' + (idx + 1));
          if (cleanedName !== it.name || cleanedTag !== it.tag) mutated = true;
          it.name = cleanedName;
          it.tag = cleanedTag;
        });
        return true;
      });
      if (stateObj.customTopics.length !== beforeLen) mutated = true;
    }
    return mutated;
  }

  /** Strips XML/SVG control characters and neutralizes CSV spreadsheet formula prefixes. */
  function cleanText(val, maxLen = 60, stripXml = false) {
    let s = String(val == null ? '' : val).trim();
    if (CSV_FORMULA_PREFIX_RE.test(s)) {
      s = "'" + s;
    }
    if (stripXml) {
      s = s.replace(/[<>&"']/g, '');
    }
    return s.slice(0, maxLen);
  }

  /** Validates and normalizes any inbound topic object from URL hash (#b=/#bracket=/#challenge=) or JSON/CSV import. */
  function sanitizeTopicPayload(rawObj) {
    if (!rawObj || typeof rawObj !== 'object' || !Array.isArray(rawObj.items)) return null;
    if (!VALID_SEED_COUNTS.has(rawObj.items.length)) return null;
    const title = cleanText(rawObj.title, 80, false);
    if (!title) return null;
    const id = cleanText(rawObj.id || ('shared-' + Date.now()), 48, true).replace(/[^A-Za-z0-9_-]/g, '');
    const subtitle = cleanText(rawObj.subtitle || ('Custom ' + rawObj.items.length + '-contender tournament'), 120, false);
    const items = rawObj.items.map((it, idx) => {
      const itemObj = typeof it === 'string' ? { name: it } : (it || {});
      const name = cleanText(itemObj.name || ('Contender #' + (idx + 1)), 60, false);
      const tag = cleanText(itemObj.tag || ('Seed #' + (idx + 1)), 28, true);
      const emoji = cleanText(itemObj.emoji || '⚡', 4, true) || '⚡';
      const imageUrl = (typeof itemObj.imageUrl === 'string' && !DANGEROUS_URI_RE.test(itemObj.imageUrl))
        ? itemObj.imageUrl
        : undefined;
      const imageSource = itemObj.imageSource ? cleanText(itemObj.imageSource, 60, true) : undefined;
      const searchQuery = itemObj.searchQuery ? cleanText(itemObj.searchQuery, 80, true) : undefined;
      return { id: itemObj.id ? cleanText(itemObj.id, 32, true) : ('c_' + idx), name, tag, emoji, imageUrl, imageSource, searchQuery };
    });
    return { id: id || ('shared-' + Date.now()), title, subtitle, items };
  }

  /** UTF-8 safe Base64 URL-hash encoder (fixes BUG-P1-20261114-01 InvalidCharacterError on emojis/CJK). */
  function encodeShareTopic(topicObj) {
    const clean = sanitizeTopicPayload(topicObj);
    if (!clean) return '';
    const utf8Bytes = unescape(encodeURIComponent(JSON.stringify(clean)));
    return encodeURIComponent(btoa(utf8Bytes));
  }

  /** UTF-8 safe Base64 URL-hash decoder with backward compatibility for ASCII btoa payloads. */
  function decodeShareTopic(hashStr) {
    const h = String(hashStr || '');
    const prefix = h.startsWith('#bracket=') ? '#bracket=' : (h.startsWith('#b=') ? '#b=' : null);
    if (!prefix) return null;
    try {
      const b64 = decodeURIComponent(h.slice(prefix.length));
      const bin = atob(b64);
      let jsonStr;
      try {
        jsonStr = decodeURIComponent(escape(bin));
      } catch (_) {
        jsonStr = bin;
      }
      return sanitizeTopicPayload(JSON.parse(jsonStr));
    } catch (e) {
      return null;
    }
  }

  /**
   * POD2-404: Encodes a completed or in-progress bracket into a compact, PII-free UTF-8 Base64 #challenge= payload.
   * Packs the 31-match outcome bitstring ('0' = left won, '1' = right won), Champion ID/Name, and S-D tier overrides.
   */
  function encodeChallengeHash(topicObj, bracketObj, tierMap = {}, challengerHandle = '') {
    const cleanTopic = sanitizeTopicPayload(topicObj);
    if (!cleanTopic) return '';
    // Keep challenge URL compact by stripping bulky data:image URIs from items
    const compactTopic = {
      ...cleanTopic,
      items: cleanTopic.items.map((it) => ({
        id: it.id,
        name: it.name,
        tag: it.tag,
        emoji: it.emoji
      }))
    };

    let bits = '';
    const rounds = Array.isArray(bracketObj?.rounds) ? bracketObj.rounds : [];
    rounds.forEach((roundMatches) => {
      if (!Array.isArray(roundMatches)) return;
      roundMatches.forEach((m) => {
        if (m && m.winner && m.left && m.right) {
          bits += (m.winner.id === m.right.id ? '1' : '0');
        }
      });
    });

    const cleanTiers = {};
    if (tierMap && typeof tierMap === 'object') {
      Object.keys(tierMap).forEach((k) => {
        const t = String(tierMap[k] || '').toUpperCase();
        if (VALID_TIERS.has(t)) {
          cleanTiers[cleanText(k, 32, true)] = t;
        }
      });
    }

    const payload = {
      v: '2.4.0',
      topic: compactTopic,
      bits: bits.slice(0, 63),
      champId: cleanText(bracketObj?.champion?.id || '', 32, true),
      champName: cleanText(bracketObj?.champion?.name || '', 60, true),
      tiers: cleanTiers,
      handle: cleanText(challengerHandle || '@Challenger', 32, true) || '@Challenger'
    };

    const utf8Bytes = unescape(encodeURIComponent(JSON.stringify(payload)));
    return encodeURIComponent(btoa(utf8Bytes));
  }

  /**
   * POD2-404: Decodes and sanitizes an inbound #challenge=<base64> URL hash.
   */
  function decodeChallengeHash(hashStr) {
    const h = String(hashStr || '');
    if (!h.startsWith('#challenge=')) return null;
    try {
      const b64 = decodeURIComponent(h.slice('#challenge='.length));
      const bin = atob(b64);
      let jsonStr;
      try {
        jsonStr = decodeURIComponent(escape(bin));
      } catch (_) {
        jsonStr = bin;
      }
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return null;
      const cleanTopic = sanitizeTopicPayload(parsed.topic);
      if (!cleanTopic) return null;
      const rawBits = String(parsed.bits || '').replace(/[^01]/g, '').slice(0, 63);
      const cleanTiers = {};
      if (parsed.tiers && typeof parsed.tiers === 'object') {
        Object.keys(parsed.tiers).forEach((k) => {
          const t = String(parsed.tiers[k] || '').toUpperCase();
          if (VALID_TIERS.has(t)) {
            cleanTiers[cleanText(k, 32, true)] = t;
          }
        });
      }
      return {
        topic: cleanTopic,
        bits: rawBits,
        champId: cleanText(parsed.champId || '', 32, true),
        champName: cleanText(parsed.champName || '', 60, true),
        tiers: cleanTiers,
        handle: cleanText(parsed.handle || '@Challenger', 32, true) || '@Challenger'
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * POD2-404: Computes Friend-vs-Friend Taste Compatibility (0% to 100%) weighted by round depth
   * and identifies the #1 Biggest Hot-Take Disagreement matchup.
   */
  function computeTasteCompatibility(challengeData, localBracket, localTierMap = {}, topicObj = null) {
    if (!challengeData || !localBracket) return null;
    const topic = topicObj || challengeData.topic;
    const cBits = String(challengeData.bits || '');
    const rounds = Array.isArray(localBracket.rounds) ? localBracket.rounds : [];

    let totalWeight = 0;
    let earnedWeight = 0;
    let agreedMatches = 0;
    let comparedMatches = 0;
    let biggestDisagreement = null;
    let bitCursor = 0;

    const roundLabelForCount = (cnt) => {
      if (cnt === 1) return 'Grand Final';
      if (cnt === 2) return 'Semifinals';
      if (cnt === 4) return 'Quarterfinals';
      return 'Round of ' + (cnt * 2);
    };

    rounds.forEach((roundMatches, rIdx) => {
      const roundWeight = Math.pow(2, rIdx); // 1, 2, 4, 8, 16
      const rName = roundLabelForCount(roundMatches.length);
      roundMatches.forEach((m) => {
        const cBit = cBits[bitCursor];
        bitCursor++;
        if (!m || !m.winner || (cBit !== '0' && cBit !== '1')) return;
        const myBit = m.winner.id === m.right.id ? '1' : '0';
        totalWeight += roundWeight;
        comparedMatches += 1;
        if (myBit === cBit) {
          earnedWeight += roundWeight;
          agreedMatches += 1;
        } else {
          const challengerPick = cBit === '1' ? m.right.name : m.left.name;
          const myPick = m.winner.name;
          if (!biggestDisagreement || roundWeight >= biggestDisagreement.weight) {
            biggestDisagreement = {
              weight: roundWeight,
              roundName: rName,
              matchup: m.left.name + ' vs ' + m.right.name,
              challengerPick,
              myPick
            };
          }
        }
      });
    });

    // Also include tier-list alignment bonus if both have tier assignments
    const tierRank = { S: 5, A: 4, B: 3, C: 2, D: 1 };
    const cTiers = challengeData.tiers || {};
    Object.keys(cTiers).forEach((itemId) => {
      if (localTierMap && localTierMap[itemId] && tierRank[cTiers[itemId]] && tierRank[localTierMap[itemId]]) {
        const diff = Math.abs(tierRank[cTiers[itemId]] - tierRank[localTierMap[itemId]]);
        totalWeight += 2;
        earnedWeight += Math.max(0, 2 - diff * 0.75);
      }
    });

    const compatibilityPct = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    const challengerChampion = challengeData.champName
      || (topic && topic.items && topic.items.find((i) => i.id === challengeData.champId)?.name)
      || 'Pending';
    const myChampion = localBracket.champion ? localBracket.champion.name : 'In Progress';

    return {
      compatibilityPct,
      agreedMatches,
      comparedMatches,
      challengerHandle: challengeData.handle || '@Challenger',
      challengerChampion,
      myChampion,
      biggestDisagreement: biggestDisagreement || {
        roundName: 'All Decided Rounds',
        matchup: '100% Bracket Alignment',
        challengerPick: challengerChampion,
        myPick: myChampion
      }
    };
  }

  /** Serializes a tournament topic to a clean JSON string for POD2-203 export. */
  function exportJsonPack(topicObj) {
    const clean = sanitizeTopicPayload(topicObj);
    if (!clean) return '';
    return JSON.stringify(clean, null, 2);
  }

  /** Serializes a tournament topic to a CSV string with OWASP formula-injection defense for POD2-203 export. */
  function exportCsvPack(topicObj) {
    const clean = sanitizeTopicPayload(topicObj);
    if (!clean) return '';
    const escapeCsvCell = (val) => {
      const safe = cleanText(val, 120, false).replace(/"/g, '""');
      return '"' + safe + '"';
    };
    const rows = [
      ['Title', 'Subtitle', 'Seed', 'Contender_Name', 'Category_Tag', 'Emoji'].join(',')
    ];
    clean.items.forEach((it, idx) => {
      rows.push([
        escapeCsvCell(clean.title),
        escapeCsvCell(clean.subtitle),
        String(idx + 1),
        escapeCsvCell(it.name),
        escapeCsvCell(it.tag || ('Seed #' + (idx + 1))),
        escapeCsvCell(it.emoji || '⚡')
      ].join(','));
    });
    return rows.join('\n');
  }

  /** Parses a single CSV line handling double-quoted fields. */
  function parseCsvLine(line) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          out.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
    }
    out.push(cur.trim());
    return out;
  }

  /** Parses an imported .json or .csv tournament pack text and validates via sanitizeTopicPayload (POD2-203). */
  function parseImportedPack(rawText, fallbackTitle = 'Imported Bracket Pack') {
    const text = String(rawText || '').trim();
    if (!text) return null;
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        return sanitizeTopicPayload({ ...parsed, id: 'pack-' + Date.now() });
      } catch (e) {
        return null;
      }
    }
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const firstCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
    const hasHeader = firstCols.includes('contender_name') || firstCols.includes('name') || firstCols.includes('contender') || firstCols.includes('title');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    let packTitle = fallbackTitle;
    let packSubtitle = 'Imported CSV Tournament Pack';
    const items = [];
    dataLines.forEach((line, idx) => {
      const cols = parseCsvLine(line);
      if (cols.length >= 4 && hasHeader && firstCols[0] === 'title') {
        if (idx === 0 && cols[0]) packTitle = cols[0];
        if (idx === 0 && cols[1]) packSubtitle = cols[1];
        items.push({
          id: 'csv_' + idx,
          name: cols[3] || cols[0],
          tag: cols[4] || ('Seed #' + (idx + 1)),
          emoji: cols[5] || '🎯'
        });
      } else {
        items.push({
          id: 'csv_' + idx,
          name: cols[0] || ('Contender #' + (idx + 1)),
          tag: cols[1] || ('Seed #' + (idx + 1)),
          emoji: cols[2] || '🎯'
        });
      }
    });
    return sanitizeTopicPayload({
      id: 'pack-' + Date.now(),
      title: packTitle,
      subtitle: packSubtitle,
      items
    });
  }

  return {
    cleanText,
    scrubGenericText,
    purgeLegacyGenericState,
    sanitizeTopicPayload,
    encodeShareTopic,
    decodeShareTopic,
    encodeChallengeHash,
    decodeChallengeHash,
    computeTasteCompatibility,
    exportJsonPack,
    exportCsvPack,
    parseImportedPack
  };
})();
