// Version: 2.1.0 | Last Modified: 2026-11-13 19:29 HKT
/**
 * File: js/visuals.js
 * Description: Procedural SVG contender artwork generator and HTML5 Canvas particle/confetti & clash sparks engine.
 * Change Log:
 *   - v1.2.0 (2026-11-13 08:15 HKT): Created module to render rich visual artwork banners on contender cards and celebratory particle bursts.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Track A release compatibility.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Added triggerClashSparks() canvas energy burst for 60fps Versus Clash transitions.
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

  let activeAnimId = null;

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

  /**
   * Builds a rich SVG data URI banner for any contender (or returns custom uploaded image DataURL if present).
   */
  function getContenderBannerUrl(item, seedNumber) {
    if (item && item.imageUrl) return item.imageUrl;
    const h = hashStr((item && item.name) || 'contender');
    const [c1, c2, c3] = PALETTES[h % PALETTES.length];
    const emoji = (item && item.emoji) || '⚡';
    const tag = String((item && item.tag) || 'SEED #' + seedNumber).toUpperCase().replace(/[<>&"']/g, '');
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
      <rect x="22" y="20" width="150" height="32" rx="16" fill="rgba(9,13,22,0.65)"/>
      <text x="97" y="41" font-family="Inter, sans-serif" font-size="13" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="1">${tag.slice(0, 16)}</text>
      <circle cx="240" cy="128" r="56" fill="rgba(9,13,22,0.45)" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
      <text x="240" y="148" font-size="58" text-anchor="middle">${emoji}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
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
    getContenderBannerUrl,
    triggerConfetti,
    triggerClashSparks
  };
})();
