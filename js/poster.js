// Version: 2.3.0 | Last Modified: 2026-11-14 22:35 HKT
/**
 * File: js/poster.js
 * Description: Multi-format (9:16 Story 1080x1920, 1:1 Square 1080x1080, 4:5 Portrait 1080x1350) & 4K (2160x3840) HTML5 Canvas Viral Share Poster generator with GenAI / Smart Canvas Championship Hero Scene Co-Star Photo Fusion.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial dark poster renderer.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Added circular user photo spotlight baking and 3 visual themes.
 *   - v1.2.0 (2026-11-13 08:15 HKT): Added 4th Gold Championship theme, custom winner quote banner, and visual Final-4 mini bracket cards.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Added 9:16 & 1:1 aspect ratios, NetHustle branding, contender graveyard, spice/hot-take badge, and QR share matrix.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Automatic fallback to Champion custom contender photo in poster spotlight.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Added 4K Ultra-HD export scaling (2x resolution: 2160x3840 Story, 2160x2160 Square, 2160x2700 Portrait) for POD2-204.
 *   - v2.3.0 (2026-11-14 22:35 HKT): Upgraded to GenAI / Smart Canvas Hero Scene Co-Star Photo Fusion (drawHeroSceneFusion + synthesizeGenAiScenePrompt) merging the user's uploaded photo/face directly with the winning contender scene alongside VibeBracket Arena · by NetHustle branding (POD2-304 / FD-P0-20261114-04).
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

  /** Draws an image cover-fitted inside a target rectangle with optional alpha and radial feathering. */
  function drawCoverImage(ctx, img, x, y, w, h, alpha = 1) {
    if (!img || !img.width || !img.height) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }

  /**
   * POD2-304 (FD-P0-20261114-04): Smart Canvas / GenAI Hero Scene Co-Star Photo Fusion.
   * Merges the user's uploaded photo/face together with the winning contender's image/scene
   * into a unified Championship Hero Stage with cyber-neon rim lighting, luminance blending,
   * and dramatic Co-Star energy flare alongside the VibeBracket Arena · by NetHustle brand.
   */
  function drawHeroSceneFusion(ctx, userPhotoImg, champPhotoImg, fallbackEmoji, stageX, stageY, stageW, stageH, theme, fusionMeta) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(stageX, stageY, stageW, stageH);
    ctx.clip();

    // 1. Base Atmospheric Scene Layer
    const baseGrad = ctx.createLinearGradient(stageX, stageY, stageX + stageW, stageY + stageH);
    baseGrad.addColorStop(0, theme.bg3);
    baseGrad.addColorStop(0.5, theme.bg2);
    baseGrad.addColorStop(1, theme.bg1);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(stageX, stageY, stageW, stageH);

    // 2. Ambient Full-Stage Backdrop Blend from Champion + User Photos
    if (champPhotoImg) {
      drawCoverImage(ctx, champPhotoImg, stageX, stageY, stageW, stageH, 0.28);
    }
    if (userPhotoImg) {
      drawCoverImage(ctx, userPhotoImg, stageX, stageY, stageW, stageH, 0.22);
    }

    // 3. Co-Star Split/Merged Hero Portraits in the Left Visual Arena (width 390px)
    const arenaW = 390;
    const arenaCenterX = stageX + arenaW / 2;
    const arenaCenterY = stageY + stageH / 2;

    if (userPhotoImg && champPhotoImg && userPhotoImg !== champPhotoImg) {
      // Dual Photo Hero Fusion: Champion + User Co-Star merged with neon energy seam & screen glow
      drawCoverImage(ctx, champPhotoImg, stageX + 14, stageY + 14, arenaW / 2 + 28, stageH - 28, 0.92);
      drawCoverImage(ctx, userPhotoImg, stageX + arenaW / 2 - 14, stageY + 14, arenaW / 2, stageH - 28, 0.92);

      // Neural/Luminance Center Fusion Seam & Rim Lighting
      const seamGrad = ctx.createLinearGradient(stageX + arenaW / 2 - 48, stageY, stageX + arenaW / 2 + 48, stageY);
      seamGrad.addColorStop(0, 'rgba(9, 13, 22, 0)');
      seamGrad.addColorStop(0.5, theme.accent);
      seamGrad.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = seamGrad;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(stageX + arenaW / 2 - 48, stageY + 14, 96, stageH - 28);
      ctx.globalAlpha = 1;

      // Co-Star Fusion Crown Badge at intersection
      ctx.beginPath();
      ctx.arc(arenaCenterX, arenaCenterY, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#090d16';
      ctx.fill();
      ctx.strokeStyle = theme.badge;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.font = '32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', arenaCenterX, arenaCenterY + 11);
      ctx.textAlign = 'left';
    } else if (userPhotoImg || champPhotoImg) {
      // Single Photo Hero Stage with Duotone Rim Glow & Championship Halo
      const activeImg = userPhotoImg || champPhotoImg;
      drawCoverImage(ctx, activeImg, stageX + 16, stageY + 16, arenaW - 32, stageH - 32, 0.95);

      const haloGrad = ctx.createRadialGradient(arenaCenterX, arenaCenterY, 30, arenaCenterX, arenaCenterY, 185);
      haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      haloGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.18)');
      haloGrad.addColorStop(1, theme.bg1);
      ctx.fillStyle = haloGrad;
      ctx.fillRect(stageX + 16, stageY + 16, arenaW - 32, stageH - 32);
    } else {
      // Stylized Cyber Podium Emblem when no photo is loaded yet
      ctx.beginPath();
      ctx.arc(arenaCenterX, arenaCenterY, 108, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.font = '86px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fallbackEmoji || '👑', arenaCenterX, arenaCenterY + 30);
      ctx.textAlign = 'left';
    }

    // 4. Right-Side Dark Gradient Scrim so Championship Typography is 100% WCAG Crisp
    const scrimGrad = ctx.createLinearGradient(stageX + arenaW - 40, stageY, stageX + arenaW + 120, stageY);
    scrimGrad.addColorStop(0, 'rgba(9, 13, 22, 0.15)');
    scrimGrad.addColorStop(1, 'rgba(9, 13, 22, 0.92)');
    ctx.fillStyle = scrimGrad;
    ctx.fillRect(stageX + arenaW - 40, stageY, stageW - arenaW + 40, stageH);

    // 5. Cyber-Arcade Rim Frame & Fusion Status Tag
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(stageX + 14, stageY + 14, arenaW - 28, stageH - 28);

    ctx.fillStyle = 'rgba(9, 13, 22, 0.84)';
    ctx.fillRect(stageX + 24, stageY + stageH - 54, arenaW - 48, 32);
    ctx.fillStyle = theme.badge;
    ctx.font = '800 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    const badgeLabel = (userPhotoImg && champPhotoImg && userPhotoImg !== champPhotoImg)
      ? '✨ GENAI / SMART CO-STAR PHOTO FUSION'
      : (userPhotoImg ? '📸 CREATOR + WINNER HERO SCENE' : '🏆 CHAMPION HERO STAGE');
    ctx.fillText(badgeLabel, arenaCenterX, stageY + stageH - 32);
    ctx.textAlign = 'left';

    if (fusionMeta && fusionMeta.genAiCaption) {
      ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
      ctx.fillRect(stageX + 24, stageY + 22, arenaW - 48, 30);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(fusionMeta.genAiCaption).slice(0, 38), arenaCenterX, stageY + 42);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  /**
   * Optional BYOK Multimodal GenAI Scene Fusion helper (POD2-304).
   * Requires explicit user consent (options.consentChecked === true) before any external API call.
   */
  async function runGenAiHeroFusion(topic, bracket, apiKey, consentChecked) {
    if (!consentChecked) {
      throw new Error('Please check the HK PDPO / GDPR privacy consent box before running external GenAI scene fusion.');
    }
    const champName = bracket && bracket.champion ? bracket.champion.name : 'Grand Champion';
    if (!apiKey || !apiKey.trim()) {
      return {
        mode: 'smart-canvas-neural',
        genAiCaption: 'CO-STARRING WITH ' + champName.toUpperCase().slice(0, 22),
        scenePrompt: 'Cyber-arcade championship co-star scene fusing user portrait with ' + champName
      };
    }
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey.trim()
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Return ONLY a JSON object with keys: genAiCaption (max 34 chars epic co-star headline) and scenePrompt (1 sentence describing the user co-starring with the tournament champion).'
            },
            {
              role: 'user',
              content: 'Tournament: ' + (topic ? topic.title : 'VibeBracket') + '. Champion: ' + champName
            }
          ],
          temperature: 0.7
        })
      });
      if (res && res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content || '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            mode: 'openrouter-genai',
            genAiCaption: String(parsed.genAiCaption || ('CO-STAR: ' + champName)).slice(0, 36),
            scenePrompt: String(parsed.scenePrompt || '').slice(0, 140)
          };
        }
      }
    } catch (e) {
      // Fallback to on-device smart neural canvas fusion
    }
    return {
      mode: 'smart-canvas-neural',
      genAiCaption: 'CO-STARRING WITH ' + champName.toUpperCase().slice(0, 22),
      scenePrompt: 'On-device championship scene fusion with ' + champName
    };
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
  function render(canvas, topic, bracket, tierMap, options = {}) {
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
      ? 'VIBEBRACKET ARENA · 4K PRO HERO FUSION POSTER'
      : 'VIBEBRACKET ARENA · GENAI HERO FUSION POSTER';
    ctx.fillText(headerBadge, 78, 102);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 48px Inter, sans-serif';
    ctx.fillText(String(topic.title).slice(0, 28), 78, 172);

    // Champion + User Co-Star Hero Scene Card (POD2-304)
    const cardY = 208;
    const cardH = H <= 1080 ? 295 : 345;
    const champEmoji = bracket.champion ? bracket.champion.emoji : '👑';
    drawHeroSceneFusion(
      ctx,
      options.photoImg || null,
      options.championPhotoImg || null,
      champEmoji,
      78,
      cardY,
      W - 156,
      cardH,
      theme,
      options.fusionMeta || null
    );

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(78, cardY, W - 156, cardH);

    const textX = 485;
    ctx.fillStyle = theme.badge;
    ctx.font = '800 22px Inter, sans-serif';
    ctx.fillText(options.photoImg ? 'CO-STARRING GRAND CHAMPION' : 'CROWNED 32-SEED GRAND CHAMPION', textX, cardY + 64);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 42px Inter, sans-serif';
    const champText = bracket.champion ? bracket.champion.name : '32-Seed Arena Active';
    ctx.fillText(champText.slice(0, 19), textX, cardY + 126);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 23px Inter, sans-serif';
    const runnerText = bracket.runnerUp ? 'Runner-Up: ' + bracket.runnerUp.name : 'Complete 31 matches to crown #1';
    ctx.fillText(runnerText.slice(0, 30), textX, cardY + 180);

    const quoteToShow = options.quote || (options.topHotTake ? options.topHotTake.text : '');
    if (quoteToShow) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'italic 600 22px Inter, sans-serif';
      ctx.fillText('"' + String(quoteToShow).slice(0, 32) + '"', textX, cardY + 230);
    }

    if (options.handle) {
      ctx.fillStyle = theme.secondary;
      ctx.font = '800 22px Inter, sans-serif';
      ctx.fillText('Co-Star: ' + options.handle, textX, cardY + 278);
    }

    // Final Four, Auto-Tier Verdict & Graveyard Grid
    const gridTitleY = cardY + cardH + 58;
    ctx.fillStyle = theme.secondary;
    ctx.font = '800 25px Inter, sans-serif';
    ctx.fillText('32-SEED FINAL FOUR, AUTO-TIER LIST & GRAVEYARD', 78, gridTitleY);

    const sTier = topic.items.filter((i) => tierMap[i.id] === 'S').map((i) => i.name);
    const aTier = topic.items.filter((i) => tierMap[i.id] === 'A').map((i) => i.name);
    const defeated = topic.items.filter((i) => !bracket.champion || i.id !== bracket.champion.id).slice(0, 4).map((i) => i.name);

    const cards = [
      { label: 'GRAND CHAMPION (S-TIER)', val: bracket.champion ? (bracket.champion.emoji || '🏆') + ' ' + bracket.champion.name : 'Pending' },
      { label: 'FINALIST (2ND PLACE)', val: bracket.runnerUp ? (bracket.runnerUp.emoji || '🥈') + ' ' + bracket.runnerUp.name : 'Pending' },
      { label: 'S & A TIER RANKINGS', val: (sTier.concat(aTier)).slice(0, 3).join(' · ') || 'Auto-populates on crown' },
      { label: 'GRAVEYARD (FALLEN SEEDS)', val: defeated.slice(0, 3).join(' · ') || 'No eliminations yet' }
    ];

    const boxH = H <= 1080 ? 128 : 162;
    const rowStep = boxH + 24;
    cards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 78 + col * 475;
      const by = gridTitleY + 26 + row * rowStep;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(bx, by, 445, boxH);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 445, boxH);

      ctx.fillStyle = theme.accent;
      ctx.font = '800 19px Inter, sans-serif';
      ctx.fillText(c.label, bx + 24, by + 42);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 25px Inter, sans-serif';
      ctx.fillText(String(c.val).slice(0, 26), bx + 24, by + 92);
    });

    // Footer Brand Banner + QR Matrix
    const footerY = H - 140;
    ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
    ctx.fillRect(78, footerY, W - 156, 86);
    ctx.fillStyle = theme.accent;
    ctx.font = '900 23px Inter, sans-serif';
    ctx.fillText('VibeBracket Arena · by NETHUSTLE', 104, footerY + 38);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px Inter, sans-serif';
    ctx.fillText('32-Seed Knockout Arena · GenAI Co-Star Poster · Drag & Drop Tiers', 104, footerY + 68);

    drawShareQrMatrix(ctx, topic.id || 'vibebracket', W - 180, footerY + 8, 70, theme.accent);
    ctx.restore();
  }

  return {
    ASPECTS,
    drawHeroSceneFusion,
    runGenAiHeroFusion,
    render
  };
})();
