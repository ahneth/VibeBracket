// Version: 3.5.0 | Last Modified: 2026-11-21 10:38 HKT | File: js/version.js | App: VibeBracket Arena
/**
 * File: js/version.js
 * Description: Canonical version, build metadata, storage key, and Creator Pro pricing constants for VibeBracket Arena.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial version telemetry.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Bumped to Track A v2.0.0.
 *   - v2.9.0 (2026-11-17 22:58 HKT): Bumped to v2.9.0 (POD2-901..905).
 *   - v3.0.0 (2026-11-18 10:28 HKT): Bumped to v3.0.0 (POD2-1001..1005: Closed BUG-P1-20261118-01 & OBS-P3-20261118-01).
 *   - v3.5.0 (2026-11-21 10:38 HKT): Implemented POD2-1501..1505 (Run It Back Top-8 Rematch & Flipped-Seed Replay, Arcade Announcer Synth Pack, Sanitized .vibebracket.json Save/Resume, Mobile Safe-Area Polish & Creator Pro Watermark Toggle).
 *   - v3.4.0 (2026-11-20 22:12 HKT): Implemented POD2-1401..1405 (Draft Board 1v32 Preview & Seed Toggle, Roast My Bracket 3-Bullet Verdict, Full 32-Seed Bracket Tree Poster Export, CJK & Emoji Canvas Typography Polish).
 *   - v3.3.0 (2026-11-20 10:06 HKT): Implemented FD-P0-20261120-01 (Standard 1v32 recursive tournament seeding) & POD2-1301..1305 (BUILD_ID parity, Vibe Wrapped Passport, Smart 1-Tap Fix Missing Photos, Scannable Canvas QR Matrix on Championship Receipt).
 *   - v3.2.0 (2026-11-19 22:56 HKT): Shipped POD2-1201..1205 (Export-Contract Gate, Draft Board Photo Health & Lineup Share, Championship Receipt Canvas Renderer, Rivalry Roast Quote Card).
 *   - v3.1.1 (2026-11-19 07:45 HKT): Bumped to v3.1.1 (POD2-1101..1105: Closed BUG-P1-20261118-02 via getActiveTiers() helper, added 1-Click "✨ Suggest Viral Topics" chips + OpenRouter BYOK 32-seed JSON validator + 34 Rosters / 20-Topic 640/640 Simulation, 3-Skin Arena Theme Switcher, and Transparent Creator Pro 4K Upgrade Preview Modal).
 */
window.VibeVersion = Object.freeze({
  APP_NAME: 'VibeBracket_Arena',
  VERSION: '3.5.0',
  APP_VERSION: '3.5.0',
  BUILD_ID: '20261121_1038',
  LAST_MODIFIED: '2026-11-21 10:38 HKT',
  BUILD_TIMESTAMP: '2026-11-21 10:38 HKT',
  COMPANY: 'NetHustle Software Labs Ltd.',
  MOTTO: 'Make money, Legally, NEVER HARM ANY HUMAN',
  STORAGE_KEY: 'vibebracket_arena_v2_state',
  TROPHY_CABINET_KEY: 'vibebracket_arena_v3_trophies',
  SKIN_STORAGE_KEY: 'vibebracket_arena_v3_skin',
  MAX_LOG_ENTRIES: 120,
  MAX_PHOTO_DIM: 400,
  PHOTO_QUALITY: 0.82,
  PRO_ONETIME_USD: 4.99,
  PRO_MONTHLY_USD: 9.99,
  PRO_ANNUAL_USD: 79.00
});
