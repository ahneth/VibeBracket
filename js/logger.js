// Version: 2.2.0 | Last Modified: 2026-11-14 10:17 HKT
/**
 * File: js/logger.js
 * Description: Deterministic in-app diagnostic ring-buffer logger and Web Audio SFX synthesizer.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial AppLogger implementation.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Extracted to js/logger.js and added Web Audio SFX feedback.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Updated version header for Track A release.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Added clash impact sound effect (clash()).
 *   - v2.2.0 (2026-11-14 10:17 HKT): Maintained ring-buffer cap (120 entries) and Web Audio SFX for v2.2.0 Streamer HUD & 4K export.
 */
window.AppLogger = (() => {
  const entries = [];

  /** Records a timestamped diagnostic entry in memory. */
  function log(level, msg) {
    const maxEntries = window.VibeVersion ? window.VibeVersion.MAX_LOG_ENTRIES : 120;
    entries.unshift({ ts: new Date().toISOString(), level, msg: String(msg) });
    if (entries.length > maxEntries) entries.pop();
  }

  return {
    info: (msg) => log('INFO', msg),
    warn: (msg) => log('WARN', msg),
    error: (msg) => log('ERROR', msg),
    getEntries: () => [...entries]
  };
})();

window.VibeAudio = (() => {
  let ctx = null;
  let enabled = true;

  /** Plays a crisp synthesized tone on user tap, clash, or champion crown without external audio files. */
  function playTone(freq, durationSec, type = 'sine') {
    if (!enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctx) ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch (e) {
      // Audio blocked or unsupported
    }
  }

  return {
    isEnabled: () => enabled,
    toggle: () => { enabled = !enabled; return enabled; },
    tap: () => playTone(520, 0.09, 'triangle'),
    clash: () => {
      playTone(220, 0.08, 'sawtooth');
      setTimeout(() => playTone(440, 0.11, 'triangle'), 45);
    },
    win: () => {
      playTone(523.25, 0.14, 'triangle');
      setTimeout(() => playTone(659.25, 0.16, 'triangle'), 90);
      setTimeout(() => playTone(783.99, 0.25, 'sine'), 180);
    }
  };
})();
