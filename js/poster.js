// Version: 2.2.0 | Last Modified: 2026-11-14 10:17 HKT
/**
 * File: js/poster.js
 * Description: Multi-format (9:16 Story 1080x1920, 1:1 Square 1080x1080, 4:5 Portrait 1080x1350) & 4K (2160x3840) HTML5 Canvas Viral Share Poster generator.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial dark poster renderer.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Added circular user photo spotlight baking and 3 visual themes.
 *   - v1.2.0 (2026-11-13 08:15 HKT): Added 4th Gold Championship theme, custom winner quote banner, and visual Final-4 mini bracket cards.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Added 9:16 & 1:1 aspect ratios, NetHustle branding, contender graveyard, spice/hot-take badge, and QR share matrix.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Automatic fallback to Champion custom contender photo in poster spotlight when no separate poster selfie is uploaded.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Added 4K Ultra-HD export scaling (2x resolution: 2160x3840 Story, 2160x2160 Square, 2160x2700 Portrait) for POD2-204.
 */
window.VibePoster = (() => {
  const THEMES = {
    cyber: { bg1: '#090d16', bg2: '#111827', bg3: '#1e1b4b', accent: '#38bdf8', secondary: '#c084fc', badge: '#fbbf24' },
    magazine: { bg1: '#0a0a0a', bg2: '#171717', bg3: '#292524', accent: '#fbbf24', secondary: '#f59e0b', badge: '#f8fafc' },
    anime: { bg1: '#0f0714', bg2: '#1f102e', bg3: '#3b0764', accent: '#f43f5e', secondary: '#38bdf8', badge: '#fbbf24' },
    gold: { bg1: '#0c0a09', bg2: '#1c1917', bg3: '#422006', accent: '#facc15', secondary: '#fb923c', badge: '#fde047' }
  };

  const ASPECTS = {
    '9:16': { width: 1080, height: 1920, label: '9:16 Story (1080×1920)' },
    '1:1': { width: 1080, height: 1080, label: '1:1 Square (1080×1080)' },
    '4:5': { width: 1080, height: 1350, label: '4:5 Portrait (1080×1350)' }
  };

  /** Draws a circular clipped user/champion photo or stylized emblem. */
  function drawPhotoSpotlight(ctx, img, fallbackEmoji, cx, cy, radius, accentColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();

    if (img) {
      ctx.clip();
      const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.restore();
      ctx.font = '82px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fallbackEmoji || '👑', cx, cy + 28);
      ctx.textAlign = 'left';
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  /** Draws a deterministic visual QR-style share matrix from the topic ID. */
  function drawShareQrMatrix(ctx, seedStr, x, y, size, color) {
    const cells = 9;
    const cell = size / cells;
    let hash = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      hash ^= seedStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
    ctx.fillStyle = '#090d16';
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const isCorner = (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3);
        const bit = ((hash >>> ((r * cells + c) % 31)) & 1) === 1;
        if (isCorner || bit) {
          ctx.fillRect(x + c * cell, y + r * cell, cell - 1, cell - 1);
        }
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 6, y - 6, size + 12, size + 12);
  }

  /** Renders the viral poster in the selected aspect ratio and resolution scale (1x HD or 2x 4K) onto the target canvas element. */
  function render(canvas, topic, bracket, tierMap, options) {
    const spec = ASPECTS[options.aspect] || ASPECTS['9:16'];
    const scaleFactor = options.resolution === '4k' ? 2 : 1;
    const W = spec.width;
    const H = spec.height;
    canvas.width = W * scaleFactor;
    canvas.height = H * scaleFactor;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);
    const theme = THEMES[options.theme] || THEMES.cyber;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, theme.bg1);
    grad.addColorStop(0.5, theme.bg2);
    grad.addColorStop(1, theme.bg3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.arc(W - 160, 220, 260, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    ctx.fillStyle = theme.accent;
    ctx.font = '800 25px Inter, sans-serif';
    const headerBadge = scaleFactor === 2
      ? 'VIBEBRACKET ARENA · 4K PRO CHAMPIONSHIP POSTER'
      : 'VIBEBRACKET ARENA · OFFICIAL CHAMPIONSHIP POSTER';
    ctx.fillText(headerBadge, 78, 102);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 50px Inter, sans-serif';
    ctx.fillText(String(topic.title).slice(0, 27), 78, 174);

    // Champion Card
    const cardY = 212;
    const cardH = H <= 1080 ? 290 : 340;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(78, cardY, W - 156, cardH);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(78, cardY, W - 156, cardH);

    const champEmoji = bracket.champion ? bracket.champion.emoji : '👑';
    drawPhotoSpotlight(ctx, options.photoImg, champEmoji, 210, cardY + cardH / 2, 100, theme.accent);

    const textX = 345;
    ctx.fillStyle = theme.badge;
    ctx.font = '800 24px Inter, sans-serif';
    ctx.fillText(options.photoImg ? 'WINNER + CREATOR SPOTLIGHT' : 'CROWNED GRAND CHAMPION', textX, cardY + 68);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 48px Inter, sans-serif';
    const champText = bracket.champion ? bracket.champion.name : 'Tournament In Progress';
    ctx.fillText(champText.slice(0, 21), textX, cardY + 135);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 25px Inter, sans-serif';
    const runnerText = bracket.runnerUp ? 'Runner-Up: ' + bracket.runnerUp.name : 'Vote in 1v1 Arena to crown your #1 pick';
    ctx.fillText(runnerText.slice(0, 36), textX, cardY + 190);

    const quoteToShow = options.quote || (options.topHotTake ? options.topHotTake.text : '');
    if (quoteToShow) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'italic 600 24px Inter, sans-serif';
      ctx.fillText('"' + String(quoteToShow).slice(0, 38) + '"', textX, cardY + 240);
    }

    if (options.handle) {
      ctx.fillStyle = theme.secondary;
      ctx.font = '800 24px Inter, sans-serif';
      ctx.fillText('Curated by ' + options.handle, textX, cardY + 286);
    }

    // Final Four & Graveyard Grid
    const gridTitleY = cardY + cardH + 62;
    ctx.fillStyle = theme.secondary;
    ctx.font = '800 26px Inter, sans-serif';
    ctx.fillText('FINAL FOUR, GRAVEYARD & VERDICT', 78, gridTitleY);

    const sTier = topic.items.filter((i) => tierMap[i.id] === 'S').map((i) => i.name);
    const aTier = topic.items.filter((i) => tierMap[i.id] === 'A').map((i) => i.name);
    const defeated = topic.items.filter((i) => !bracket.champion || i.id !== bracket.champion.id).slice(0, 4).map((i) => i.name);

    const cards = [
      { label: 'GRAND CHAMPION', val: bracket.champion ? (bracket.champion.emoji || '🏆') + ' ' + bracket.champion.name : 'Pending' },
      { label: 'FINALIST (2ND PLACE)', val: bracket.runnerUp ? (bracket.runnerUp.emoji || '🥈') + ' ' + bracket.runnerUp.name : 'Pending' },
      { label: 'GRAVEYARD (FALLEN)', val: defeated.join(' · ') || 'No eliminations yet' },
      { label: 'S/A-TIER & SPICE', val: (sTier.concat(aTier)).slice(0, 3).join(' · ') || 'Assign in Tier List tab' }
    ];

    const boxH = H <= 1080 ? 130 : 165;
    const rowStep = boxH + 25;
    cards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 78 + col * 475;
      const by = gridTitleY + 28 + row * rowStep;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(bx, by, 445, boxH);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 445, boxH);

      ctx.fillStyle = theme.accent;
      ctx.font = '800 20px Inter, sans-serif';
      ctx.fillText(c.label, bx + 24, by + 44);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 26px Inter, sans-serif';
      ctx.fillText(String(c.val).slice(0, 24), bx + 24, by + (boxH - 36));
    });

    // Extra Story Mode Spotlight for 9:16 (1080x1920 / 2160x3840)
    if (H >= 1900) {
      const storyY = gridTitleY + 28 + rowStep * 2 + 24;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(78, storyY, W - 156, 390);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(78, storyY, W - 156, 390);

      ctx.fillStyle = theme.badge;
      ctx.font = '800 26px Inter, sans-serif';
      ctx.fillText('TOURNAMENT STATS & HOT TAKE', 112, storyY + 56);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 28px Inter, sans-serif';
      ctx.fillText('Contenders: ' + topic.items.length + '   ·   Matches Played: ' + bracket.history.length, 112, storyY + 115);

      const spiceIcons = options.topHotTake ? '🌶️'.repeat(options.topHotTake.spice || 2) : '🌶️🌶️';
      ctx.fillText('Community Spice Rating: ' + spiceIcons, 112, storyY + 170);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 600 26px Inter, sans-serif';
      const ht = options.topHotTake ? '"' + options.topHotTake.text.slice(0, 48) + '"' : '"Vote your bracket and drop a hot take to settle the debate."';
      ctx.fillText(ht, 112, storyY + 240);

      ctx.fillStyle = theme.accent;
      ctx.font = '800 24px Inter, sans-serif';
      ctx.fillText('SCAN OR TAP LINK TO CHALLENGE THIS BRACKET →', 112, storyY + 335);
    }

    // NetHustle Brand Footer + QR Matrix
    const footerH = 148;
    const footerY = H - footerH - 58;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(78, footerY, W - 156, footerH);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(78, footerY, W - 156, footerH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 34px Inter, sans-serif';
    ctx.fillText('VibeBracket Arena · by NETHUSTLE', 116, footerY + 64);
    ctx.fillStyle = theme.badge;
    ctx.font = '700 23px Inter, sans-serif';
    ctx.fillText('Bake your photo into the winner & challenge friends in 15s', 116, footerY + 112);

    drawShareQrMatrix(ctx, topic.id + ':' + (bracket.champion ? bracket.champion.name : 'live'), W - 216, footerY + 20, 108, theme.accent);
    ctx.restore();
  }

  return { render, ASPECTS };
})();
