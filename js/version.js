// Version: 2.1.0 | Last Modified: 2026-11-13 19:29 HKT
/**
 * File: js/version.js
 * Description: Central application version, build metadata, and configurable runtime constants.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial release metadata.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Modularized version manifest and added SFX/AI defaults.
 *   - v1.2.0 (2026-11-13 08:15 HKT): Added visual card themes, confetti particle settings, and zero-key AI synthesizer config.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Rebranded to NetHustle Software Labs Ltd.; Track A release (custom contender photos, clash FX, pan/zoom tree, spice meter, 9:16 & 1:1 posters).
 *   - v2.1.0 (2026-11-13 19:29 HKT): Fixed nested <button> invalid HTML markup, added drag-and-drop contender photo upload, mobile pinch-to-zoom & touch pan on Bracket Tree, Canvas energy spark particles on Versus Clash, 4-seed Custom Builder option, wrapped OpenRouter fetch in try/catch, and compiled standalone bundle passing check_web_app.py (0 errors, 0 warnings).
 */
window.VibeVersion = Object.freeze({
  APP_NAME: 'VibeBracket Arena',
  COMPANY: 'NetHustle Software Labs Ltd.',
  VERSION: '2.1.0',
  BUILD_ID: '20261113_1929',
  STORAGE_KEY: 'NETHUSTLE_VIBEBRACKET_STATE_V2',
  MAX_LOG_ENTRIES: 120,
  MAX_PHOTO_DIM: 400,
  PHOTO_QUALITY: 0.82
});
