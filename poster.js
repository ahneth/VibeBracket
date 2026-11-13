// Version: 1.1.0 | Last Modified: 2026-11-13 07:46 HKT
/**
 * File: js/poster.js
 * Description: 1080x1350 HTML5 Canvas Viral Share Poster generator with user photo baking and multi-theme styling.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial dark poster renderer.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Extracted to js/poster.js; added user photo circular spotlight baking, 3 visual themes, and handle stamping.
 */
window.VibePoster = (() => {
  const THEMES = {
    cyber: { bg1: '#090d16', bg2: '#111827', bg3: '#1e1b4b', accent: '#38bdf8', secondary: '#c084fc', badge: '#fbbf24' },
    magazine: { bg1: '#0a0a0a', bg2: '#171717', bg3: '#292524', accent: '#fbbf24', secondary: '#f59e0b', badge: '#f8fafc' },
    anime: { bg1: '#0f0714', bg2: '#1f102e', bg3: '#3b0764', accent: '#f43f5e', secondary: '#38bdf8', badge: '#fbbf24' }
  };

  /** Draws a circular clipped user photo inside the Champion spotlight card. */
  function drawPhotoSpotlight(ctx, img, cx, cy, radius, accentColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  /** Renders the 1080x1350 viral poster onto the target canvas element. */
  function render(canvas, topic, bracket, tierMap, options) {
    const ctx = canvas.getContext('2d');
    const theme = THEMES[options.theme] || THEMES.cyber;

    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, theme.bg1);
    grad.addColorStop(0.5, theme.bg2);
    grad.addColorStop(1, theme.bg3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Outer frame
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(36, 36, 1008, 1278);

    // Top Header
    ctx.fillStyle = theme.accent;
    ctx.font = '800 26px Inter, sans-serif';
    ctx.fillText('VIBEBRACKET ARENA · OFFICIAL VERDICT', 80, 108);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 54px Inter, sans-serif';
    ctx.fillText(String(topic.title).slice(0, 26), 80, 182);

    // Champion Card with optional baked user photo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(80, 230, 920, 320);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 230, 920, 320);

    const hasPhoto = Boolean(options.photoImg);
    const textX = hasPhoto ? 340 : 120;

    if (hasPhoto) {
      drawPhotoSpotlight(ctx, options.photoImg, 205, 390, 95, theme.accent);
    }

    ctx.fillStyle = theme.badge;
    ctx.font = '800 26px Inter, sans-serif';
    ctx.fillText('CROWNED CHAMPION', textX, 310);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 50px Inter, sans-serif';
    const champText = bracket.champion ? (bracket.champion.emoji || '👑') + ' ' + bracket.champion.name : 'Bracket In Progress...';
    ctx.fillText(champText.slice(0, hasPhoto ? 18 : 26), textX, 385);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 26px Inter, sans-serif';
    const runnerText = bracket.runnerUp ? 'Runner-Up: ' + bracket.runnerUp.name : 'Tap through 1v1 Arena to crown your winner';
    ctx.fillText(runnerText.slice(0, hasPhoto ? 34 : 48), textX, 445);

    if (options.handle) {
      ctx.fillStyle = theme.secondary;
      ctx.font = '700 26px Inter, sans-serif';
      ctx.fillText('Voted by ' + options.handle, textX, 498);
    }

    // Podium & Tier List Summary
    ctx.fillStyle = theme.secondary;
    ctx.font = '800 28px Inter, sans-serif';
    ctx.fillText('PODIUM & TIER BREAKDOWN', 80, 635);

    const sTier = topic.items.filter((i) => tierMap[i.id] === 'S').map((i) => i.name);
    const aTier = topic.items.filter((i) => tierMap[i.id] === 'A').map((i) => i.name);

    const rows = [
      'Semifinalists: ' + (bracket.semifinalists.length ? bracket.semifinalists.map((s) => s.name).join(' vs. ') : 'Pending'),
      'S-Tier Picks: ' + (sTier.length ? sTier.join(', ') : 'Unassigned'),
      'A-Tier Picks: ' + (aTier.length ? aTier.join(', ') : 'Unassigned'),
      'Matches Decided: ' + bracket.history.length + ' / ' + (topic.items.length - 1)
    ];

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 28px Inter, sans-serif';
    rows.forEach((line, idx) => {
      ctx.fillText(line.slice(0, 52), 80, 705 + idx * 74);
    });

    // Hustle Brand Footer
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(80, 1130, 920, 125);
    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 1130, 920, 125);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 34px Inter, sans-serif';
    ctx.fillText('Powered by HUSTLE · VibeBracket Arena', 120, 1185);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 23px Inter, sans-serif';
    ctx.fillText('Bake your own winner photo & challenge friends in 15s', 120, 1228);
  }

  return { render };
})();
