// Version: 2.2.0 | Last Modified: 2026-11-14 10:17 HKT
/**
 * File: js/packSanitizer.js
 * Description: UTF-8 safe URL-hash codec, power-of-two tournament schema validator, and CSV/JSON pack import/export engine.
 * Change Log:
 *   - v1.0.0 (2026-11-14 01:55 HKT): Remediates BUG-P1-20261114-01 (CAR-20261114-01), BUG-P2-20261114-02 (CAR-20261114-02), and OBS-P3-01.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Added exportJsonPack(), exportCsvPack(), and parseImportedPack() for POD2-203 client-side tournament pack portability.
 */
window.PackSanitizer = (() => {
  const VALID_SEED_COUNTS = new Set([4, 8, 16, 32]);
  const DANGEROUS_URI_RE = /^\s*(?:javascript|vbscript|data\s*:(?!image\/(?:png|jpeg|webp);base64,))/i;
  const CSV_FORMULA_PREFIX_RE = /^[=+-@\t\r]/;

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

  /** Validates and normalizes any inbound topic object from URL hash (#b=/#bracket=) or JSON/CSV import. */
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
      return { id: itemObj.id ? cleanText(itemObj.id, 32, true) : ('c_' + idx), name, tag, emoji, imageUrl };
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
    sanitizeTopicPayload,
    encodeShareTopic,
    decodeShareTopic,
    exportJsonPack,
    exportCsvPack,
    parseImportedPack
  };
})();
