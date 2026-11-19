// Version: 3.2.0 | Last Modified: 2026-11-19 22:56 HKT | File: js/app.js | App: VibeBracket Arena
/**
 * File: js/app.js
 * Description: Main UI controller, 32-seed real-time image lookup wiring, Bracket Tree renderer, Auto-Populated & Drag-and-Drop Tier List controller, GenAI Co-Star Poster Studio, Streamer HUD, JSON/CSV pack portability, and modal/toast orchestration.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial monolithic script.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Modularized into js/app.js; added Bracket Tree rendering, GenAI studio wiring, and photo upload baking.
 *   - v1.2.0 (2026-11-13 08:15 HKT): Wired SVG/photo contender banners, celebratory confetti burst on Champion crown, and winner quote poster input.
 *   - v2.0.0 (2026-11-13 17:55 HKT): Wired contender photo uploads, Spice Meter, Hot-Takes, Pan/Zoom tree, and 9:16/1:1 posters.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Added drag-and-drop contender photo support, mobile pinch-to-zoom & touch pan on Bracket Tree, live vote percentage split in Spice Card, and champion custom photo fallback in poster spotlight.
 *   - v2.2.0 (2026-11-14 10:17 HKT): Closed CAR-20261114-01 & CAR-20261114-02 via PackSanitizer.encodeShareTopic(), added IndexedDB vault boot hydration (POD2-201), added Live Streamer HUD & keyboard shortcuts (1, 2, Space, Z) (POD2-202), added JSON/CSV Pack Export & Import (POD2-203), and added 4K Creator Pro Poster Export & transparent pricing modal (POD2-204).
 *   - v2.3.0 (2026-11-14 22:35 HKT): Wired 32-Seed Arena defaults (POD2-301), 3-Tier Authentic 32-Seed AI/Wikimedia generation (POD2-302), real-time CORS-safe seed image resolution with onerror SVG fallback (POD2-303), GenAI / Smart Canvas Hero Scene Co-Star Photo Fusion with HK PDPO/GDPR consent gate (POD2-304), automatic S/A/B/C/D Tier List population on Champion crown + HTML5 Drag-and-Drop & WCAG keyboard reordering (POD2-305), and locked $9.99/mo & $79.00/yr Creator Pro pricing disclosures (POD2-306).
 *   - v2.4.0 (2026-11-15 10:36 HKT): Wired 3-Provider CORS Image Fetcher & 1-Tap Seed Photo Cycler (#btnLeftCyclePhoto / #btnRightCyclePhoto, POD2-401), 4 Co-Star Hero Scene Presets & Live Sliders (#posterPresetSelect / #posterPhotoScaleSlider / #posterPhotoOffsetSlider / #posterRimGlowSlider, POD2-402), 1080p/4K Tier-List Share Poster export with Robbery Fixed badges (#btnExportTierPoster / #btnExportTierPoster4k, POD2-403), and #challenge= Beat-My-Bracket Taste Compatibility Scorecard (#btnCopyChallengeLink / #challengeScorecard, POD2-404).
 *   - v2.5.0 (2026-11-15 22:14 HKT): Wired contextual <Seed Name> <Arena Topic> photo fetching & cycling (POD2-501), removed remaining 'Classics' prompt hint (POD2-502), wired overlapping diagonal VS battle stage shockwaves (POD2-503), and wired the 8-match Round-of-32 Loser-Bracket Placement Battles & exact 2-6-8-8-8 Tier List (POD2-504).
 *   - v2.6.0 (2026-11-16 10:09 HKT): Wired FD-P0-20261116-01..04 & POD2-601..605: 1-tap Pin Image URL (#btnLeftPinUrl / #btnRightPinUrl), 3D diagonal battle card tilt, Vibe Streak HUD (#vibeStreakBadge), Battle of Losers redemption banner, 39-Match Tier Provenance Inspector (#tierProvenanceBar / #btnRefightPlacementMatch), and Dual-Slide / 3s Clash Video exporters.
 *   - v2.7.0 (2026-11-16 22:36 HKT): Implemented POD2-704: wired #photoProgressPill live completion percentage and #btnRetryMissingPhotos 1-tap retry for uncached seeds.
 *   - v2.8.0 (2026-11-17 10:47 HKT): Implemented FD-P0-20261117-03 (POD2-803 & POD2-804): wired 32-Seed Interactive Draft Board (#draftBoardGrid), mobile touch-swipe voting, live Upset Alert / Cinderella Run callouts (#upsetAlertBanner), seed rank pills (#leftSeedPill / #rightSeedPill), and Spotify-Wrapped Taste Archetype Verdict card (#tasteArchetypeCard).
 */
(function () {
  'use strict';

  let cachedPhotoImg = null;
  let cachedChampionImg = null;
  let cachedChampionPhotoUrl = null;
  let activeFusionMeta = null;
  let draggedTierItemId = null;
  let vibeStreakCount = 0;
  let lastVoteTs = 0;
  let inspectedItemId = null;

  /** Creates a DOM element safely using textContent (OWASP A05 XSS prevention). */
  function createSafeEl(tag, text, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function copyTextSafe(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (e) {
      showToast('Copy not supported in this browser.');
    }
    document.body.removeChild(ta);
  }

  function getRoundName(matchCount) {
    if (matchCount === 1) return 'Grand Final';
    if (matchCount === 2) return 'Semifinals';
    if (matchCount === 4) return 'Quarterfinals';
    return 'Round of ' + (matchCount * 2);
  }

  function updateSeedImageStatusText() {
    const statusEl = document.getElementById('seedImgStatusText');
    const pillEl = document.getElementById('photoProgressPill');
    const topic = window.VibeState.getActiveTopic();
    const total = topic.items.length || 32;
    const withPhotoCount = topic.items.filter((it) => Boolean(window.VibeState.getContenderPhoto(it.id) || it.imageUrl)).length;
    const pct = Math.round((withPhotoCount / total) * 100);
    if (statusEl) {
      statusEl.textContent = '🖼️ Seed Visuals: ' + withPhotoCount + ' / ' + total + ' real photos cached (' + total + '-Seed Arena)';
    }
    if (pillEl) {
      pillEl.textContent = pct + '% Live Coverage (' + withPhotoCount + '/' + total + ')';
    }
  }

  function renderTopicPills() {
    const container = document.getElementById('topicPills');
    if (!container) return;
    container.textContent = '';
    window.VibeState.getAllTopics().forEach((topic) => {
      const btn = createSafeEl('button', topic.title, 'topic-pill' + (topic.id === window.VibeState.data.activeTopicId ? ' active' : ''));
      btn.type = 'button';
      btn.addEventListener('click', () => {
        window.VibeState.data.activeTopicId = topic.id;
        window.VibeState.save();
        renderAll();
      });
      container.appendChild(btn);
    });
  }

  function renderStreamerHud() {
    const hud = document.getElementById('streamerHudBar');
    const btn = document.getElementById('btnToggleStreamer');
    const on = Boolean(window.VibeState.data.streamerMode);
    if (hud) hud.style.display = on ? 'flex' : 'none';
    if (btn) {
      btn.textContent = on ? 'Streamer: ON' : 'Streamer: OFF';
      btn.classList.toggle('btn-primary', on);
    }
  }

  /** Binds a contender banner <img> with crossOrigin='anonymous' and automatic procedural SVG fallback (POD2-303). */
  function bindBannerImageWithFallback(imgEl, item, seedNumber) {
    if (!imgEl || !item) return;
    const customOrVault = window.VibeState.getContenderPhoto(item.id);
    const svgFallback = window.VibeVisuals.getProceduralSvgBannerUrl(item, seedNumber);
    const targetSrc = customOrVault || (item.imageUrl && window.VibeVisuals.isSafeImageUrl(item.imageUrl) ? item.imageUrl : svgFallback);

    if (targetSrc.startsWith('https://')) {
      imgEl.crossOrigin = 'anonymous';
    } else {
      imgEl.removeAttribute('crossorigin');
    }
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.removeAttribute('crossorigin');
      imgEl.src = svgFallback;
    };
    imgEl.src = targetSrc;
    const pillId = imgEl.id === 'leftBannerImg' ? 'leftSourcePill' : (imgEl.id === 'rightBannerImg' ? 'rightSourcePill' : null);
    if (pillId) {
      const pillEl = document.getElementById(pillId);
      if (pillEl) {
        if (customOrVault) {
          pillEl.textContent = customOrVault.startsWith('data:') ? '📌 Pinned Photo' : '📌 Pinned URL';
        } else if (item.imageUrl && window.VibeVisuals.isSafeImageUrl(item.imageUrl)) {
          pillEl.textContent = '🌐 ' + (item.imageSource || 'Live Photo');
        } else {
          pillEl.textContent = '🎨 Cyber Vector';
        }
      }
    }
  }

  /** POD2-404: Renders the Friend-vs-Friend Beat-My-Bracket Taste Compatibility Scorecard when a #challenge= is active. */
  function renderChallengeScorecard() {
    const box = document.getElementById('challengeScorecard');
    if (!box) return;
    const chall = window.VibeState.data.activeChallenge;
    if (!chall) {
      box.style.display = 'none';
      box.textContent = '';
      return;
    }
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    const tierMap = window.VibeState.data.tiers[topic.id] || {};
    const stats = window.PackSanitizer.computeTasteCompatibility(chall, b, tierMap, topic);
    if (!stats) {
      box.style.display = 'none';
      return;
    }
    box.style.display = 'flex';
    box.textContent = '';

    const header = createSafeEl('div', null, 'challenge-scorecard-header');
    header.appendChild(createSafeEl('strong', '⚔️ Beat My Bracket Challenge vs ' + stats.challengerHandle, null));
    header.appendChild(createSafeEl('span', 'Vibe Compatibility: ' + stats.compatibilityPct + '% (' + stats.agreedMatches + '/' + stats.comparedMatches + ' matches)', 'challenge-pct-pill'));
    box.appendChild(header);

    const grid = createSafeEl('div', null, 'challenge-meta-grid');
    grid.appendChild(createSafeEl('div', '🏆 Challenger Crown: ' + stats.challengerChampion + ' | Your Crown: ' + stats.myChampion, null));
    const dis = stats.biggestDisagreement;
    grid.appendChild(createSafeEl('div', '🌶️ #1 Hot-Take Split (' + dis.roundName + '): ' + dis.matchup + ' — ' + stats.challengerHandle + ' picked ' + dis.challengerPick + ', you picked ' + dis.myPick, null));
    box.appendChild(grid);
  }

  function renderArena() {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();

    document.getElementById('arenaBracketTitle').textContent = topic.title;
    document.getElementById('arenaBracketSubtitle').textContent = topic.subtitle || 'Tap a contender card to advance through all 31 matches.';
    document.getElementById('btnUndoVote').disabled = b.history.length === 0;
    renderStreamerHud();
    updateSeedImageStatusText();
    renderChallengeScorecard();

    const totalMatches = topic.items.length - 1;
    const completed = b.history.length;
    const pct = totalMatches > 0 ? Math.round((completed / totalMatches) * 100) : 0;

    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';

    if (b.champion) {
      if (window.VibeState && typeof window.VibeState.recordChampionToCabinet === 'function') {
        window.VibeState.recordChampionToCabinet();
      }
      document.getElementById('roundBadge').textContent = 'Tournament Complete';
      document.getElementById('matchCounter').textContent = totalMatches + ' of ' + totalMatches + ' Matches';
      document.getElementById('matchupStage').style.display = 'none';
      document.getElementById('championStage').style.display = 'block';
      document.getElementById('championName').textContent = (b.champion.emoji || '👑') + ' ' + b.champion.name;
      document.getElementById('championSub').textContent = 'Crowned Grand Champion of "' + topic.title + '" · 2-6-8-8-8 Tier List Active (S:2 · A:6 · B:8 · C:8 · D:8)!';

      // Render Loser-Bracket C/D Placement Battles (POD2-504)
      const placementBox = document.getElementById('loserPlacementStage');
      if (placementBox) {
        if (!Array.isArray(b.placementMatches) || !b.placementMatches.length) {
          window.VibeState.initLoserPlacementRound(b);
        }
        const placements = b.placementMatches || [];
        const nextIdx = placements.findIndex((pm) => !pm.winner);
        const badgeEl = document.getElementById('placementBadge');
        const statusEl = document.getElementById('placementStatusText');
        const rowEl = document.getElementById('placementMatchRow');
        const btnLeft = document.getElementById('btnPlacementLeft');
        const btnRight = document.getElementById('btnPlacementRight');

        if (nextIdx === -1 || !placements.length) {
          if (badgeEl) badgeEl.textContent = '✅ All 8 C/D Loser Placement Battles Complete (Exact 2-6-8-8-8 Locked)';
          if (statusEl) statusEl.textContent = '8 Round-of-32 placement winners promoted to C-Tier (8) and 8 placement losers assigned to D-Tier (8).';
          if (rowEl) rowEl.style.display = 'none';
        } else {
          const curPm = placements[nextIdx];
          if (badgeEl) badgeEl.textContent = curPm.roundLabel || ('C/D Tier Placement Battle ' + (nextIdx + 1) + ' of ' + placements.length);
          if (statusEl) statusEl.textContent = 'Winner earns C-Tier (top 8 R32 survivors); loser lands in D-Tier (8):';
          if (rowEl) rowEl.style.display = 'grid';
          if (btnLeft) btnLeft.textContent = (curPm.left.emoji || '⚡') + ' ' + curPm.left.name + ' → C-Tier';
          if (btnRight) btnRight.textContent = (curPm.right.emoji || '🔥') + ' ' + curPm.right.name + ' → C-Tier';
        }
      }

      // POD2-804: Render Spotify-Wrapped-Style Taste Archetype Verdict Card
      if (window.VibeState.computePlayerTasteArchetype) {
        const arch = window.VibeState.computePlayerTasteArchetype(topic, b);
        if (arch) {
          const tTitle = document.getElementById('tasteArchetypeTitle');
          const tDesc = document.getElementById('tasteArchetypeDesc');
          const tStats = document.getElementById('tasteArchetypeStats');
          if (tTitle) tTitle.textContent = arch.archetypeTitle;
          if (tDesc) tDesc.textContent = arch.archetypeVibe;
          if (tStats) tStats.textContent = 'Bracket Upset Rate: ' + arch.upsetPct + '% (' + arch.upsetsPicked + '/' + arch.totalDecided + ' bouts) · Champion Seed: #' + arch.champSeed + ' · Defining Call: ' + arch.biggestUpsetWinner;
        }
      }

      const podium = document.getElementById('podiumGrid');
      podium.textContent = '';
      [
        { label: 'S-Tier (2 Seeds: Champion & Runner-Up)', val: b.champion.name + (b.runnerUp ? ' · ' + b.runnerUp.name : '') },
        { label: 'A-Tier (6 Seeds: 2 SF + 4 QF Losers)', val: b.semifinalists.length ? b.semifinalists.map((s) => s.name).join(' · ') : 'Auto-Ranked' },
        { label: 'B / C / D Tiers (8 · 8 · 8 Seeds)', val: '8 R16 Losers (B) · 8 R32 Placement Winners (C) · 8 R32 Losers (D)' }
      ].forEach((c) => {
        const card = createSafeEl('div', null, 'stat-card');
        card.appendChild(createSafeEl('div', c.label, 'stat-label'));
        card.appendChild(createSafeEl('div', c.val, 'stat-val'));
        podium.appendChild(card);
      });
      return;
    }

    document.getElementById('matchupStage').style.display = 'block';
    document.getElementById('championStage').style.display = 'none';

    const round = b.rounds[b.currentRoundIdx];
    const match = round[b.currentMatchIdx];
    document.getElementById('roundBadge').textContent = getRoundName(round.length);
    document.getElementById('matchCounter').textContent = 'Match ' + (completed + 1) + ' of ' + totalMatches;

    document.getElementById('leftEmoji').textContent = match.left.emoji || '⚡';
    bindBannerImageWithFallback(document.getElementById('leftBannerImg'), match.left, b.currentMatchIdx * 2 + 1);
    const leftSeedRank = Math.max(1, topic.items.findIndex((it) => it.id === match.left.id) + 1);
    const rightSeedRank = Math.max(1, topic.items.findIndex((it) => it.id === match.right.id) + 1);
    const leftSeedEl = document.getElementById('leftSeedPill');
    const rightSeedEl = document.getElementById('rightSeedPill');
    if (leftSeedEl) leftSeedEl.textContent = 'SEED #' + leftSeedRank;
    if (rightSeedEl) rightSeedEl.textContent = 'SEED #' + rightSeedRank;
    const tapeBar = document.getElementById('taleOfTheTapeBar');
    const tapeHype = document.getElementById('tapeHypeBadge');
    const tapeDomain = document.getElementById('tapeDomainLabel');
    const tapeSplit = document.getElementById('tapeWinSplitLabel');
    if (tapeBar && match && match.left && match.right) {
      const diff = Math.abs(leftSeedRank - rightSeedRank);
      let hypeText = '⚖️ Coin-Flip Clash';
      if (diff >= 12) hypeText = '👑 Goliath vs David (#' + Math.min(leftSeedRank, rightSeedRank) + ' vs #' + Math.max(leftSeedRank, rightSeedRank) + ')';
      else if (diff <= 3) hypeText = '🌶️ Rivalry Derby (#' + leftSeedRank + ' vs #' + rightSeedRank + ')';
      else hypeText = '⚡ High-Stakes Bout (#' + leftSeedRank + ' vs #' + rightSeedRank + ')';
      if (tapeHype) tapeHype.textContent = hypeText;
      if (tapeDomain) tapeDomain.textContent = (match.left.tag || topic.subtitle || topic.title || '32-Seed Showdown').slice(0, 48);
      const rawLeftPct = Math.max(22, Math.min(78, Math.round(50 + (rightSeedRank - leftSeedRank) * 1.15)));
      if (tapeSplit) tapeSplit.textContent = 'Community Split: ' + rawLeftPct + '% vs ' + (100 - rawLeftPct) + '%';
      const tickerTextEl = document.getElementById('commentaryTickerText');
      if (tickerTextEl) {
        if (diff >= 12) {
          tickerTextEl.textContent = '🎙️ Broadcast Desk: #' + Math.min(leftSeedRank, rightSeedRank) + ' heavy favorite faces dark-horse #' + Math.max(leftSeedRank, rightSeedRank) + ' — upset radar active!';
        } else if (diff <= 3) {
          tickerTextEl.textContent = '🎙️ Broadcast Desk: Razor-thin seeding gap (#' + leftSeedRank + ' vs #' + rightSeedRank + ') — community split is ' + rawLeftPct + '% / ' + (100 - rawLeftPct) + '%!';
        } else {
          tickerTextEl.textContent = '🎙️ Broadcast Desk: ' + match.left.name + ' (#' + leftSeedRank + ') clashes with ' + match.right.name + ' (#' + rightSeedRank + ') in ' + getRoundName(round.length) + '!';
        }
      }
    }

    document.getElementById('leftName').textContent = match.left.name;
    document.getElementById('leftTag').textContent = match.left.tag || 'Contender';

    document.getElementById('rightEmoji').textContent = match.right.emoji || '🔥';
    bindBannerImageWithFallback(document.getElementById('rightBannerImg'), match.right, b.currentMatchIdx * 2 + 2);
    document.getElementById('rightName').textContent = match.right.name;
    document.getElementById('rightTag').textContent = match.right.tag || 'Contender';

    // Lazily fetch real-time images for the active matchup if not yet resolved (POD2-303)
    [match.left, match.right].forEach((contender) => {
      if (!window.VibeState.getContenderPhoto(contender.id) && !contender.imageUrl && window.VibeVisuals.fetchRealtimeSeedImage) {
        window.VibeVisuals.fetchRealtimeSeedImage(contender, topic.title).then((resolvedUrl) => {
          if (resolvedUrl) {
            updateSeedImageStatusText();
            const curB = window.VibeState.getActiveBracket();
            if (!curB.champion) {
              const curMatch = curB.rounds[curB.currentRoundIdx][curB.currentMatchIdx];
              if (curMatch.left.id === contender.id) bindBannerImageWithFallback(document.getElementById('leftBannerImg'), curMatch.left, 1);
              if (curMatch.right.id === contender.id) bindBannerImageWithFallback(document.getElementById('rightBannerImg'), curMatch.right, 2);
            }
          }
        }).catch(() => {});
      }
    });

    window.VibeClash.triggerClash(document.querySelector('.matchup-grid'));
    renderSpiceAndHotTakes(topic.id, b.currentRoundIdx, b.currentMatchIdx, match);
  }

  function renderSpiceAndHotTakes(topicId, roundIdx, matchIdx, matchObj) {
    const htData = window.VibeState.getMatchHotTakeData(topicId, roundIdx, matchIdx);
    document.querySelectorAll('#spicePills .spice-btn').forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.spice) === htData.spice);
    });

    const splitEl = document.getElementById('spiceVoteSplit');
    if (splitEl && matchObj) {
      const totalV = (htData.leftVotes || 0) + (htData.rightVotes || 0);
      if (totalV === 0) {
        splitEl.textContent = 'Local Session Split: 0 votes recorded on this matchup yet.';
      } else {
        const lPct = Math.round(((htData.leftVotes || 0) / totalV) * 100);
        const rPct = 100 - lPct;
        splitEl.textContent = 'Local Session Split: ' + matchObj.left.name + ' ' + lPct + '% vs ' + matchObj.right.name + ' ' + rPct + '% (' + totalV + ' vote' + (totalV > 1 ? 's' : '') + ')';
      }
    }

    const list = document.getElementById('hotTakeList');
    if (!list) return;
    list.textContent = '';
    if (!htData.takes.length) {
      const hint = createSafeEl('div', 'No hot takes yet for this matchup — drop the first zinger!', 'hot-take-item');
      hint.style.opacity = '0.7';
      list.appendChild(hint);
    } else {
      htData.takes.forEach((t) => {
        const prefix = '🌶️'.repeat(t.spice || 2) + ' ';
        list.appendChild(createSafeEl('div', prefix + t.text, 'hot-take-item'));
      });
    }
  }

  function renderBracketTree() {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    document.getElementById('treeTitle').textContent = topic.title + ' — Bracket Tree';
    const grid = document.getElementById('bracketTreeGrid');
    grid.textContent = '';

    b.rounds.forEach((round) => {
      const col = createSafeEl('div', null, 'tree-col');
      col.appendChild(createSafeEl('div', getRoundName(round.length), 'tree-col-title'));
      round.forEach((m) => {
        const box = createSafeEl('div', null, 'tree-match');
        const leftSlot = createSafeEl('div', (m.left.emoji || '') + ' ' + m.left.name, 'tree-slot' + (m.winner && m.winner.id === m.left.id ? ' winner' : ''));
        const rightSlot = createSafeEl('div', (m.right.emoji || '') + ' ' + m.right.name, 'tree-slot' + (m.winner && m.winner.id === m.right.id ? ' winner' : ''));
        box.appendChild(leftSlot);
        box.appendChild(rightSlot);
        col.appendChild(box);
      });
      grid.appendChild(col);
    });

    if (b.champion) {
      const champCol = createSafeEl('div', null, 'tree-col');
      champCol.appendChild(createSafeEl('div', 'Champion', 'tree-col-title'));
      const box = createSafeEl('div', null, 'tree-match');
      box.appendChild(createSafeEl('div', '👑 ' + b.champion.name, 'tree-slot winner'));
      champCol.appendChild(box);
      grid.appendChild(champCol);
    }
  }

  /**
   * POD2-305 (FD-P0-20261114-05): Renders the S / A / B / C / D Tier List with
   * interactive HTML5 Drag-and-Drop (draggable="true", dragstart, dragover, drop)
   * AND WCAG 2.1 Level AA keyboard/button controls.
   */
  function renderTierList() {
    const topic = window.VibeState.getActiveTopic();
    document.getElementById('tierTitle').textContent = topic.title + ' — Tier List';
    const tierMap = window.VibeState.data.tiers[topic.id] || {};
    const tierDefs = ['S', 'A', 'B', 'C', 'D'];

    const rowsEl = document.getElementById('tierRows');
    rowsEl.textContent = '';

    tierDefs.forEach((t, tIdx) => {
      const row = createSafeEl('div', null, 'tier-row');
      row.dataset.tier = t;
      const targetCounts = { S: 2, A: 6, B: 8, C: 8, D: 8 };
      const matchedForCount = topic.items.filter((it) => tierMap[it.id] === t);
      const labelBox = createSafeEl('div', t, 'tier-label tier-' + t);
      labelBox.appendChild(createSafeEl('span', matchedForCount.length + '/' + targetCounts[t], 'tier-count-sub'));
      row.appendChild(labelBox);
      const itemsWrap = createSafeEl('div', null, 'tier-items');
      itemsWrap.dataset.tier = t;

      // Wire HTML5 dropzone handlers on both row and itemsWrap
      const handleDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        row.classList.add('tier-drop-active');
      };
      const handleDragLeave = () => {
        row.classList.remove('tier-drop-active');
      };
      const handleDrop = (e) => {
        e.preventDefault();
        row.classList.remove('tier-drop-active');
        const droppedId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || draggedTierItemId;
        if (!droppedId) return;
        window.VibeState.setItemTier(topic.id, droppedId, t);
        window.VibeAudio.tap();
        renderTierList();
        refreshPosterCanvas();
        showToast('Moved contender to ' + t + '-Tier!');
      };

      row.addEventListener('dragover', handleDragOver);
      row.addEventListener('dragleave', handleDragLeave);
      row.addEventListener('drop', handleDrop);

      const matched = topic.items.filter((it) => tierMap[it.id] === t);
      if (!matched.length) {
        const hint = createSafeEl('span', 'Drag contenders here or tap "' + t + '" below', null);
        hint.style.color = '#64748b';
        itemsWrap.appendChild(hint);
      } else {
        matched.forEach((it) => {
          const promoDelta = window.VibeState.getTierPromotionDelta ? window.VibeState.getTierPromotionDelta(topic.id, it.id) : 0;
          const chip = createSafeEl('span', (it.emoji || '') + ' ' + it.name, 'tier-chip');
          if (promoDelta > 0) {
            const robBadge = createSafeEl('span', '🔥 Robbery Fixed (+' + promoDelta + ')', 'robbery-badge');
            chip.appendChild(robBadge);
          }
          chip.setAttribute('draggable', 'true');
          chip.setAttribute('tabindex', '0');
          chip.setAttribute('role', 'button');
          chip.setAttribute('aria-label', it.name + ' in ' + t + ' tier. Drag to another tier or press ArrowUp/ArrowDown to move.');
          chip.dataset.itemId = it.id;

          chip.addEventListener('dragstart', (e) => {
            draggedTierItemId = it.id;
            chip.classList.add('dragging');
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', it.id);
            }
          });
          chip.addEventListener('dragend', () => {
            draggedTierItemId = null;
            chip.classList.remove('dragging');
          });
          // WCAG 2.1 AA Keyboard Reordering (ArrowUp promotes tier, ArrowDown demotes tier, Delete unassigns)
          chip.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' && tIdx > 0) {
              e.preventDefault();
              window.VibeState.setItemTier(topic.id, it.id, tierDefs[tIdx - 1]);
              renderTierList();
              refreshPosterCanvas();
            } else if (e.key === 'ArrowDown' && tIdx < tierDefs.length - 1) {
              e.preventDefault();
              window.VibeState.setItemTier(topic.id, it.id, tierDefs[tIdx + 1]);
              renderTierList();
              refreshPosterCanvas();
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault();
              window.VibeState.setItemTier(topic.id, it.id, null);
              renderTierList();
              refreshPosterCanvas();
            }
          });

          chip.addEventListener('click', () => inspectContenderProvenance(it.id));
          itemsWrap.appendChild(chip);
        });
      }
      row.appendChild(itemsWrap);
      rowsEl.appendChild(row);
    });

    const poolEl = document.getElementById('tierPool');
    poolEl.textContent = '';
    poolEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      poolEl.classList.add('tier-drop-active');
    });
    poolEl.addEventListener('dragleave', () => poolEl.classList.remove('tier-drop-active'));
    poolEl.addEventListener('drop', (e) => {
      e.preventDefault();
      poolEl.classList.remove('tier-drop-active');
      const droppedId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || draggedTierItemId;
      if (!droppedId) return;
      window.VibeState.setItemTier(topic.id, droppedId, null);
      renderTierList();
      refreshPosterCanvas();
      showToast('Returned contender to unranked pool.');
    });

    topic.items.forEach((it) => {
      const pr = createSafeEl('div', null, 'pool-row');
      pr.setAttribute('draggable', 'true');
      pr.dataset.itemId = it.id;
      pr.addEventListener('dragstart', (e) => {
        draggedTierItemId = it.id;
        pr.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', it.id);
        }
      });
      pr.addEventListener('dragend', () => {
        draggedTierItemId = null;
        pr.classList.remove('dragging');
      });

      const currentTier = tierMap[it.id] ? ' [' + tierMap[it.id] + '-Tier]' : '';
      const promoDelta = window.VibeState.getTierPromotionDelta ? window.VibeState.getTierPromotionDelta(topic.id, it.id) : 0;
      const rowLabelWrap = createSafeEl('span', '⠿ ' + (it.emoji || '•') + ' ' + it.name + currentTier + ' ', null);
      if (promoDelta > 0) {
        rowLabelWrap.appendChild(createSafeEl('span', '🔥 Robbery Fixed (+' + promoDelta + ')', 'robbery-badge'));
      }
      pr.appendChild(rowLabelWrap);
      const btnGroup = createSafeEl('div', null, 'tier-btn-group');
      tierDefs.forEach((t) => {
        const b = createSafeEl('button', t, 'tier-assign-btn' + (tierMap[it.id] === t ? ' selected' : ''));
        b.type = 'button';
        b.addEventListener('click', () => {
          window.VibeAudio.tap();
          const nextTier = tierMap[it.id] === t ? null : t;
          window.VibeState.setItemTier(topic.id, it.id, nextTier);
          renderTierList();
          refreshPosterCanvas();
        });
        btnGroup.appendChild(b);
      });
      pr.appendChild(btnGroup);
      poolEl.appendChild(pr);
    });
  }

  function renderAiPacks() {
    const wrap = document.getElementById('aiPackButtons');
    if (!wrap) return;
    wrap.textContent = '';
    window.VibeGenAI.TRENDING_PACKS.forEach((pack) => {
      const btn = createSafeEl('button', pack.label, 'topic-pill');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        const copyPack = {
          ...pack,
          id: pack.id + '-' + Date.now(),
          items: pack.items.map((it) => ({ ...it }))
        };
        window.VibeState.addTopic(copyPack);
        renderAll();
        document.querySelector('.nav-tab[data-tab="arena"]').click();
        showToast('Loaded 32-Seed Pack: "' + pack.title + '"!');
        if (window.VibeVisuals && window.VibeVisuals.resolveTopicSeedImages) {
          window.VibeVisuals.resolveTopicSeedImages(copyPack, () => {
            updateSeedImageStatusText();
            renderArena();
          }).catch(() => {});
        }
      });
      wrap.appendChild(btn);
    });
  }

  function refreshPosterCanvas(overrideResolution) {
    const canvas = document.getElementById('posterCanvas');
    if (!canvas) return;
    const topic = window.VibeState.getActiveTopic();
    const bracket = window.VibeState.getActiveBracket();
    const tierMap = window.VibeState.data.tiers[topic.id] || {};

    let champPhoto = null;
    if (bracket.champion) {
      const champUrl = window.VibeState.getContenderPhoto(bracket.champion.id) || bracket.champion.imageUrl;
      if (champUrl && window.VibeVisuals.isSafeImageUrl(champUrl)) {
        if (cachedChampionPhotoUrl === champUrl && cachedChampionImg) {
          champPhoto = cachedChampionImg;
        } else {
          cachedChampionPhotoUrl = champUrl;
          const img = new Image();
          if (champUrl.startsWith('https://')) img.crossOrigin = 'anonymous';
          img.onload = () => {
            cachedChampionImg = img;
            refreshPosterCanvas();
          };
          img.onerror = () => {
            cachedChampionImg = null;
          };
          img.src = champUrl;
        }
      }
    }

    const resMode = overrideResolution || window.VibeState.data.posterResolution || '1x';
    window.VibePoster.render(canvas, topic, bracket, tierMap, {
      theme: window.VibeState.data.posterTheme,
      aspect: window.VibeState.data.posterAspect || '9:16',
      resolution: resMode,
      preset: window.VibeState.data.posterPreset || 'rivals',
      photoScale: window.VibeState.data.posterPhotoScale ?? 100,
      photoOffset: window.VibeState.data.posterPhotoOffset ?? 0,
      rimGlow: window.VibeState.data.posterRimGlow ?? 75,
      handle: window.VibeState.data.userHandle,
      quote: window.VibeState.data.userQuote || '',
      topHotTake: window.VibeState.getTopicTopHotTake(topic.id),
      photoImg: cachedPhotoImg || champPhoto,
      championPhotoImg: champPhoto,
      fusionMeta: activeFusionMeta
    });
  }

  function renderAll() {
    renderTopicPills();
    renderArena();
    renderBracketTree();
    renderTierList();
    refreshPosterCanvas();
  }

  function pickWinner(side) {
    const nowTs = Date.now();
    if (lastVoteTs > 0 && (nowTs - lastVoteTs) <= 6500) {
      vibeStreakCount += 1;
    } else {
      vibeStreakCount = 1;
    }
    lastVoteTs = nowTs;
    const streakEl = document.getElementById('vibeStreakBadge');
    if (streakEl) {
      streakEl.textContent = '⚡ Vibe Streak: ' + vibeStreakCount + 'x' + (vibeStreakCount >= 3 ? ' 🔥' : '');
    }
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    if (b.champion) return;

    const round = b.rounds[b.currentRoundIdx];
    const match = round[b.currentMatchIdx];
    const winner = side === 'left' ? match.left : match.right;
    const loser = side === 'left' ? match.right : match.left;

    const prevRoundIdx = b.currentRoundIdx;
    const curRoundArr = b.rounds[b.currentRoundIdx] || [];
    const curMatchObj = curRoundArr[b.currentMatchIdx];
    if (curMatchObj && curMatchObj.left && curMatchObj.right) {
      const lR = Math.max(1, topic.items.findIndex((it) => it.id === curMatchObj.left.id) + 1);
      const rR = Math.max(1, topic.items.findIndex((it) => it.id === curMatchObj.right.id) + 1);
      const leftConsensusPct = Math.max(22, Math.min(78, Math.round(50 + (rR - lR) * 1.15)));
      const pickedPct = side === 'left' ? leftConsensusPct : (100 - leftConsensusPct);
      const pickedSeed = side === 'left' ? curMatchObj.left : curMatchObj.right;
      const pulseEl = document.getElementById('crowdConsensusToast');
      if (pulseEl) {
        if (pickedPct >= 50) {
          pulseEl.textContent = '👑 ' + pickedPct + '% Fan Consensus Choice — You backed ' + pickedSeed.name + '!';
        } else {
          pulseEl.textContent = '🔥 Bold Contrarian Pick — Only ' + pickedPct + '% backed underdog ' + pickedSeed.name + '!';
        }
        pulseEl.style.display = 'flex';
      }
    }
    window.VibeState.recordMatchVote(topic.id, b.currentRoundIdx, b.currentMatchIdx, side);
    b.history.push({ roundIdx: b.currentRoundIdx, matchIdx: b.currentMatchIdx, side });
    match.winner = winner;
    window.AppLogger.info('Advanced "' + winner.name + '" over "' + loser.name + '"');
    const winRank = Math.max(1, topic.items.findIndex((it) => it.id === winner.id) + 1);
    const loseRank = Math.max(1, topic.items.findIndex((it) => it.id === loser.id) + 1);
    const upsetBanner = document.getElementById('upsetAlertBanner');
    const upsetText = document.getElementById('upsetAlertText');
    if (upsetBanner && upsetText) {
      if (winRank - loseRank >= 4) {
        upsetBanner.style.display = 'flex';
        upsetText.textContent = (winRank >= 16 ? '🔥 CINDERELLA RUN! ' : '🚨 UPSET ALERT! ') + 'Seed #' + winRank + ' ' + winner.name + ' knocked out Seed #' + loseRank + ' ' + loser.name + '!';
      } else {
        upsetBanner.style.display = 'none';
      }
    }

    if (round.length === 2) {
      b.semifinalists.push(loser);
    } else if (round.length === 1) {
      b.runnerUp = loser;
      b.champion = winner;
      // POD2-504 (FD-P0-20261115-04): Initialize 8 Round-of-32 Loser-Bracket Placement Battles & populate 2-6-8-8-8 Tier List!
      window.VibeState.initLoserPlacementRound(b);
      window.VibeState.autoPopulateTiers26888(topic, b);
      window.VibeAudio.win();
      window.VibeVisuals.triggerConfetti();
      window.VibeState.save();
      renderAll();
      showToast('Champion Crowned: ' + winner.name + '! Tier List auto-populated (S/A/B/C/D).');
      return;
    }

    window.VibeAudio.tap();
    if (b.currentMatchIdx + 1 < round.length) {
      b.currentMatchIdx += 1;
    } else {
      const nextRound = [];
      for (let i = 0; i < round.length; i += 2) {
        nextRound.push({ left: round[i].winner, right: round[i + 1].winner, winner: null });
      }
      b.rounds.push(nextRound);
      b.currentRoundIdx += 1;
      b.currentMatchIdx = 0;
    }

    window.VibeState.save();
    renderArena();
    renderBracketTree();
  }

  function undoLastVote() {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    if (!b.history.length) return;

    const prevHistory = b.history.slice(0, -1);
    window.VibeState.initBracket(topic);
    const fresh = window.VibeState.data.brackets[topic.id];
    prevHistory.forEach((step) => {
      const r = fresh.rounds[fresh.currentRoundIdx];
      const m = r[fresh.currentMatchIdx];
      const winner = step.side === 'left' ? m.left : m.right;
      const loser = step.side === 'left' ? m.right : m.left;
      m.winner = winner;
      fresh.history.push(step);
      if (r.length === 2) fresh.semifinalists.push(loser);
      if (fresh.currentMatchIdx + 1 < r.length) {
        fresh.currentMatchIdx += 1;
      } else {
        const nextRound = [];
        for (let i = 0; i < r.length; i += 2) {
          nextRound.push({ left: r[i].winner, right: r[i + 1].winner, winner: null });
        }
        fresh.rounds.push(nextRound);
        fresh.currentRoundIdx += 1;
        fresh.currentMatchIdx = 0;
      }
    });
    window.VibeState.save();
    renderAll();
    showToast('Reverted last vote.');
  }

  function openModal(title, paragraphs) {
    document.getElementById('modalTitle').textContent = title;
    const body = document.getElementById('modalBody');
    body.textContent = '';
    paragraphs.forEach((pText) => {
      const p = createSafeEl('p', pText, null);
      p.style.marginBottom = '0.75rem';
      body.appendChild(p);
    });
    document.getElementById('modalBackdrop').classList.add('open');
  }

  // Wire Navigation
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'poster') refreshPosterCanvas();
      if (tab.dataset.tab === 'tree') renderBracketTree();
      if (tab.dataset.tab === 'tiers') renderTierList();
    });
  });

  document.getElementById('btnJumpArena').addEventListener('click', () => {
    document.querySelector('.nav-tab[data-tab="arena"]').click();
  });

  document.getElementById('btnPickLeft').addEventListener('click', () => pickWinner('left'));
  document.getElementById('btnPickRight').addEventListener('click', () => pickWinner('right'));
  document.getElementById('btnUndoVote').addEventListener('click', undoLastVote);
  document.getElementById('btnResetBracket').addEventListener('click', () => {
    window.VibeState.initBracket(window.VibeState.getActiveTopic());
    window.VibeState.save();
    renderAll();
    showToast('32-Seed Bracket restarted.');
  });

  // POD2-303: Manual / On-Demand Real-Time 32-Seed Image Fetch Button
  const btnFetchSeedImages = document.getElementById('btnFetchSeedImages');
  if (btnFetchSeedImages) {
    btnFetchSeedImages.addEventListener('click', async () => {
      const topic = window.VibeState.getActiveTopic();
      btnFetchSeedImages.disabled = true;
      btnFetchSeedImages.textContent = '⏳ Fetching 32 Seed Photos...';
      try {
        const count = await window.VibeVisuals.resolveTopicSeedImages(topic, (done, total) => {
          const statusEl = document.getElementById('seedImgStatusText');
          if (statusEl) statusEl.textContent = '🖼️ Resolving real-time seed photos: ' + done + ' / ' + total + ' cached...';
        });
        renderArena();
        refreshPosterCanvas();
        showToast('Resolved ' + count + ' real-time contender photos into IndexedDB vault!');
      } catch (e) {
        showToast('Using cached / procedural visuals while offline.');
      } finally {
        btnFetchSeedImages.disabled = false;
        btnFetchSeedImages.textContent = '🔍 Fetch Live Seed Photos';
        updateSeedImageStatusText();
      }
    });
  }

  document.getElementById('btnToggleSfx').addEventListener('click', (e) => {
    const on = window.VibeAudio.toggle();
    e.target.textContent = on ? 'SFX: ON' : 'SFX: OFF';
  });

  // POD2-202: Live Streamer Mode Toggle & Keyboard Shortcuts (1, 2, Space, Z)
  const btnStreamer = document.getElementById('btnToggleStreamer');
  if (btnStreamer) {
    btnStreamer.addEventListener('click', () => {
      window.VibeState.data.streamerMode = !window.VibeState.data.streamerMode;
      window.VibeState.save();
      renderStreamerHud();
      showToast(window.VibeState.data.streamerMode ? 'Streamer HUD enabled! Use keys 1, 2, Space, Z.' : 'Streamer HUD hidden.');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (!window.VibeState.data.streamerMode) return;
    const arenaPanel = document.getElementById('panel-arena');
    if (!arenaPanel || !arenaPanel.classList.contains('active')) return;
    if (e.key === '1') {
      e.preventDefault();
      pickWinner('left');
    } else if (e.key === '2') {
      e.preventDefault();
      pickWinner('right');
    } else if (e.key === ' ') {
      e.preventDefault();
      window.VibeClash.triggerClash(document.querySelector('.matchup-grid'));
      showToast('Replayed Versus Clash!');
    } else if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      undoLastVote();
    }
  });

  document.getElementById('btnGoPoster').addEventListener('click', () => {
    document.querySelector('.nav-tab[data-tab="poster"]').click();
  });

  const btnGoTiersFromChampion = document.getElementById('btnGoTiersFromChampion');
  if (btnGoTiersFromChampion) {
    btnGoTiersFromChampion.addEventListener('click', () => {
      document.querySelector('.nav-tab[data-tab="tiers"]').click();
      showToast('Drag and drop any contender chip to customize your S/A/B/C/D tiers!');
    });
  }

  const btnAutoRankTiers = document.getElementById('btnAutoRankTiers');
  if (btnAutoRankTiers) {
    btnAutoRankTiers.addEventListener('click', () => {
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      if (b.history.length > 0) {
        window.VibeState.autoPopulateTiersFromBracket(topic, b);
      } else {
        // Exact 2-6-8-8-8 seed-order preview distribution (2 S, 6 A, 8 B, 8 C, 8 D) if no matches played yet (POD2-504)
        const previewMap = {};
        topic.items.forEach((it, idx) => {
          if (idx < 2) previewMap[it.id] = 'S';
          else if (idx < 8) previewMap[it.id] = 'A';
          else if (idx < 16) previewMap[it.id] = 'B';
          else if (idx < 24) previewMap[it.id] = 'C';
          else previewMap[it.id] = 'D';
        });
        window.VibeState.data.tiers[topic.id] = previewMap;
        window.VibeState.save();
      }
      renderTierList();
      refreshPosterCanvas();
      showToast('Auto-populated S / A / B / C / D tiers! Drag and drop chips to adjust.');
    });
  }

  function buildCaptionText() {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    if (!b.champion) return 'Playing "' + topic.title + '" (32-Seed Arena) on VibeBracket Arena by NetHustle!';
    return '👑 My 32-Seed "' + topic.title + '" Champion: ' + b.champion.name + ' (Runner-up: ' + (b.runnerUp ? b.runnerUp.name : '—') + ') — Built on VibeBracket Arena by NetHustle!';
  }

  document.getElementById('btnCopySummary').addEventListener('click', () => copyTextSafe(buildCaptionText(), 'Results copied!'));
  document.getElementById('btnCopyShareText').addEventListener('click', () => copyTextSafe(buildCaptionText(), 'Viral caption copied!'));

  // POD2-304: GenAI Co-Star Hero Scene Fusion Button + HK PDPO / GDPR Consent Gate
  const btnRunPosterGenAiFusion = document.getElementById('btnRunPosterGenAiFusion');
  const posterFusionModeSelect = document.getElementById('posterFusionModeSelect');
  const posterGenAiConsentCheck = document.getElementById('posterGenAiConsentCheck');

  if (posterFusionModeSelect) {
    posterFusionModeSelect.addEventListener('change', (e) => {
      window.VibeState.data.posterFusionMode = e.target.value;
      window.VibeState.save();
      refreshPosterCanvas();
    });
  }

  if (posterGenAiConsentCheck) {
    posterGenAiConsentCheck.addEventListener('change', (e) => {
      window.VibeState.data.posterGenAiConsent = Boolean(e.target.checked);
    });
  }

  if (btnRunPosterGenAiFusion) {
    btnRunPosterGenAiFusion.addEventListener('click', async () => {
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      const mode = posterFusionModeSelect ? posterFusionModeSelect.value : 'canvas-fusion';
      const consent = posterGenAiConsentCheck ? posterGenAiConsentCheck.checked : false;
      const apiKey = document.getElementById('aiApiKeyInput') ? document.getElementById('aiApiKeyInput').value : '';

      if (mode === 'genai-fusion' && !consent) {
        showToast('Please check the HK PDPO / GDPR consent box before external GenAI scene synthesis.');
        return;
      }

      btnRunPosterGenAiFusion.disabled = true;
      btnRunPosterGenAiFusion.textContent = '✨ Fusing Co-Star Hero Scene...';
      try {
        if (mode === 'genai-fusion') {
          activeFusionMeta = await window.VibePoster.runGenAiHeroFusion(topic, b, apiKey, consent);
        } else {
          const champName = b.champion ? b.champion.name : topic.items[0].name;
          activeFusionMeta = {
            mode: 'smart-canvas-neural',
            genAiCaption: 'CO-STARRING WITH ' + champName.toUpperCase().slice(0, 22),
            scenePrompt: '100% On-Device Smart Canvas Co-Star Scene Fusion'
          };
        }
        refreshPosterCanvas();
        showToast('Co-Star Hero Scene fused on Poster Canvas!');
      } catch (err) {
        showToast(err.message || 'Could not run scene fusion.');
      } finally {
        btnRunPosterGenAiFusion.disabled = false;
        btnRunPosterGenAiFusion.textContent = '✨ Run GenAI Co-Star Scene Fusion';
      }
    });
  }

  document.getElementById('btnDownloadPoster').addEventListener('click', () => {
    refreshPosterCanvas('1x');
    const link = document.createElement('a');
    link.download = 'VibeBracket_Poster_NetHustle.png';
    link.href = document.getElementById('posterCanvas').toDataURL('image/png');
    link.click();
    const aspect = window.VibeState.data.posterAspect || '9:16';
    showToast(aspect + ' Hero Fusion Poster PNG downloaded!');
  });

  // POD2-204: 4K Creator Pro Poster Export (2160x3840 Story / 2160x2160 Square / 2160x2700 Portrait)
  const btnDownload4k = document.getElementById('btnDownloadPoster4k');
  if (btnDownload4k) {
    btnDownload4k.addEventListener('click', () => {
      refreshPosterCanvas('4k');
      const canvas = document.getElementById('posterCanvas');
      const link = document.createElement('a');
      link.download = 'VibeBracket_4K_Pro_Poster_NetHustle.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('4K Ultra-HD (' + canvas.width + '×' + canvas.height + ') Poster PNG downloaded!');
      refreshPosterCanvas();
    });
  }

  document.getElementById('posterThemeSelect').addEventListener('change', (e) => {
    window.VibeState.data.posterTheme = e.target.value;
    window.VibeState.save();
    refreshPosterCanvas();
  });

  document.getElementById('posterQuoteInput').addEventListener('input', (e) => {
    window.VibeState.data.userQuote = e.target.value.trim();
    window.VibeState.save();
    refreshPosterCanvas();
  });

  document.getElementById('posterHandleInput').addEventListener('input', (e) => {
    window.VibeState.data.userHandle = e.target.value.trim();
    window.VibeState.save();
    refreshPosterCanvas();
  });

  document.getElementById('posterPhotoInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        cachedPhotoImg = img;
        refreshPosterCanvas();
        showToast('Your photo is now fused into the Championship Hero Scene!');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnClearPhoto').addEventListener('click', () => {
    cachedPhotoImg = null;
    activeFusionMeta = null;
    document.getElementById('posterPhotoInput').value = '';
    refreshPosterCanvas();
    showToast('Photo removed from poster.');
  });

  document.getElementById('btnClearTiers').addEventListener('click', () => {
    window.VibeState.data.tiers[window.VibeState.getActiveTopic().id] = {};
    window.VibeState.save();
    renderTierList();
    refreshPosterCanvas();
    showToast('Tiers cleared.');
  });

  document.getElementById('genaiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const promptVal = document.getElementById('aiPromptInput').value;
    const keyVal = document.getElementById('aiApiKeyInput').value;
    const modelVal = document.getElementById('aiModelSelect').value;
    const btn = document.getElementById('btnRunGenAI');
    btn.disabled = true;
    btn.textContent = 'Synthesizing 32 Seeds & Live Photos...';
    try {
      const topicObj = await window.VibeGenAI.generateTopic(promptVal, keyVal, modelVal, () => {
        updateSeedImageStatusText();
        renderArena();
      });
      window.VibeState.addTopic(topicObj);
      renderAll();
      document.querySelector('.nav-tab[data-tab="arena"]').click();
      showToast('32-Seed AI Bracket "' + topicObj.title + '" ready!');
    } catch (err) {
      showToast(err.message || 'Could not generate AI bracket.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate AI Bracket';
    }
  });

  const btnFillSample32 = document.getElementById('btnFillSample32');
  if (btnFillSample32) {
    btnFillSample32.addEventListener('click', () => {
      const titleInput = document.getElementById('customTitle');
      const promptHint = (titleInput && titleInput.value.trim()) || 'Sci-Fi & Mecha Masterpieces';
      const generated = window.VibeGenAI.synthesizeLocalTopic(promptHint);
      if (titleInput && !titleInput.value.trim()) titleInput.value = generated.title;
      document.getElementById('customSize').value = '32';
      document.getElementById('customItems').value = generated.items.map((it) => it.name).join('\n');
      showToast('Populated 32 authentic contenders! Click Launch 32-Seed Bracket.');
    });
  }

  document.getElementById('createBracketForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('customTitle').value.trim();
    const size = Number(document.getElementById('customSize').value);
    const lines = document.getElementById('customItems').value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== size) {
      showToast('Enter exactly ' + size + ' contenders (currently ' + lines.length + ').');
      return;
    }
    const newTopic = {
      id: 'custom-' + Date.now(),
      title,
      subtitle: 'Custom ' + size + '-contender tournament',
      items: lines.map((name, idx) => ({ id: 'c' + idx, name, tag: 'Seed #' + (idx + 1), emoji: '🎯', searchQuery: name }))
    };
    window.VibeState.addTopic(newTopic);
    renderAll();
    document.querySelector('.nav-tab[data-tab="arena"]').click();
    showToast('Launched "' + title + '" (' + size + ' seeds)!');
    if (window.VibeVisuals && window.VibeVisuals.resolveTopicSeedImages) {
      window.VibeVisuals.resolveTopicSeedImages(newTopic, () => {
        updateSeedImageStatusText();
        renderArena();
      }).catch(() => {});
    }
  });

  // POD2-205: Close CAR-20261114-01 (BUG-P1-20261114-01) via UTF-8 safe PackSanitizer.encodeShareTopic
  document.getElementById('btnExportBracketLink').addEventListener('click', () => {
    const topic = window.VibeState.getActiveTopic();
    const encoded = window.PackSanitizer.encodeShareTopic(topic);
    if (!encoded) {
      showToast('Could not encode bracket link.');
      return;
    }
    copyTextSafe(window.location.origin + window.location.pathname + '#b=' + encoded, 'UTF-8 shareable bracket link copied!');
  });

  // POD2-203: JSON / CSV Tournament Pack Export & Import
  function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const btnExportJson = document.getElementById('btnExportJsonPack');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const topic = window.VibeState.getActiveTopic();
      const jsonStr = window.PackSanitizer.exportJsonPack(topic);
      downloadTextFile((topic.id || 'bracket') + '_pack.json', jsonStr, 'application/json;charset=utf-8');
      showToast('Exported tournament pack (.json)!');
    });
  }

  const btnExportCsv = document.getElementById('btnExportCsvPack');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const topic = window.VibeState.getActiveTopic();
      const csvStr = window.PackSanitizer.exportCsvPack(topic);
      downloadTextFile((topic.id || 'bracket') + '_pack.csv', csvStr, 'text/csv;charset=utf-8');
      showToast('Exported formula-safe tournament pack (.csv)!');
    });
  }

  const btnImportPack = document.getElementById('btnImportPackTrigger');
  const inpImportPack = document.getElementById('importPackFileInput');
  if (btnImportPack && inpImportPack) {
    btnImportPack.addEventListener('click', () => inpImportPack.click());
    inpImportPack.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const fallbackName = file.name.replace(/\.(json|csv)$/i, '');
        const imported = window.PackSanitizer.parseImportedPack(reader.result, fallbackName);
        if (!imported) {
          showToast('Invalid pack: must contain 4, 8, 16, or 32 contenders.');
          return;
        }
        window.VibeState.addTopic(imported);
        renderAll();
        document.querySelector('.nav-tab[data-tab="arena"]').click();
        showToast('Imported "' + imported.title + '" (' + imported.items.length + ' seeds)!');
      };
      reader.readAsText(file);
      inpImportPack.value = '';
    });
  }

  document.getElementById('btnOpenLogs').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'AppLogger Diagnostics (v' + window.VibeVersion.VERSION + ')';
    const body = document.getElementById('modalBody');
    body.textContent = '';
    const list = createSafeEl('div', null, 'log-list');
    const entries = window.AppLogger.getEntries();
    if (!entries.length) list.appendChild(createSafeEl('div', 'No events recorded yet.', null));
    else entries.forEach((e) => list.appendChild(createSafeEl('div', '[' + e.ts.slice(11, 19) + '] ' + e.level + ': ' + e.msg, null)));
    body.appendChild(list);
    document.getElementById('modalBackdrop').classList.add('open');
  });

  // POD2-306 (FIN-OBS-20261114-01): Strict CFO-Approved Creator Pro Pricing ($9.99/mo or $79.00/yr)
  document.getElementById('btnOpenPro').addEventListener('click', () => {
    openModal('VibeBracket Creator Pro — Transparent Pricing ($9.99/mo or $79.00/yr)', [
      'Free Tier ($0.00 forever): Unlimited 32-seed knockout tournaments, real-time seed image lookup (Wikimedia / Google Image CORS pipeline), local IndexedDB photo vault (>50MB), auto-populated drag-and-drop S/A/B/C/D Tier Lists, Live Streamer HUD hotkeys (1/2/Space/Z), JSON/CSV pack import/export, and 1080p Hero Scene Co-Star Posters.',
      'Creator Pro ($9.99 USD/month or $79.00 USD/year — save 34%): Unlocks 4K Ultra-HD (2160×3840 Story / 2160×2160 Square / 2160×2700 Portrait) Championship Hero Fusion Poster exports (available to preview & test now in the Photo Poster tab!), custom studio brand watermarks, and priority cloud pack hosting.',
      'No Dark Patterns Guarantee: Zero hidden fees, zero forced sign-ups, and 1-click cancellation at any time in full compliance with the Hong Kong Trade Descriptions Ordinance (Cap. 362).'
    ]);
  });

  document.getElementById('btnOpenLegal').addEventListener('click', () => {
    openModal('Terms, Privacy, IP Attribution & Anti-Harassment Policy', [
      'NetHustle Software Labs Ltd. operates under: "Make money, Legally, NEVER HARM ANY HUMAN."',
      'Privacy & Biometric Data Guarantee (GDPR, CCPA & HK PDPO Cap. 486): Uploaded contender photos and selfie Co-Star Hero Posters are processed and stored 100% locally on your device inside IndexedDB (NetHustlePhotoStore). Optional external BYOK GenAI scene synthesis is strictly gated behind an unchecked-by-default explicit user consent checkbox.',
      'Real-Time Seed Image Attribution & Fair Use: Live contender thumbnails retrieved from Wikimedia Commons / Wikipedia PageImages / Openverse are loaded over HTTPS with crossOrigin="anonymous" for transformative community commentary.',
      'Anti-Harassment & Security Rule: Custom brackets and imported JSON/CSV packs are sanitized via PackSanitizer and restricted to public media, topics, food, and ideas—never private individuals.'
    ]);
  });

  document.getElementById('btnCloseModal').addEventListener('click', () => document.getElementById('modalBackdrop').classList.remove('open'));
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') document.getElementById('modalBackdrop').classList.remove('open');
  });

  // Custom Contender Photo Uploads via NetHustlePhotoStore IndexedDB Vault (POD2-201)
  async function handleContenderFile(file, side) {
    if (!file) return;
    try {
      const b = window.VibeState.getActiveBracket();
      if (b.champion) return;
      const match = b.rounds[b.currentRoundIdx][b.currentMatchIdx];
      const targetItem = side === 'left' ? match.left : match.right;
      await window.VibeClash.compressAndStoreContenderPhoto(targetItem.id, file);
      renderArena();
      refreshPosterCanvas();
      showToast('Custom photo saved to local IndexedDB vault for ' + targetItem.name + '!');
    } catch (err) {
      showToast(err.message || 'Could not process image.');
    }
  }

  function wireContenderPhoto(btnId, inputId, cardId, side) {
    const btn = document.getElementById(btnId);
    const inp = document.getElementById(inputId);
    const cardEl = document.getElementById(cardId);
    if (!btn || !inp) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      inp.click();
    });
    inp.addEventListener('click', (e) => e.stopPropagation());
    inp.addEventListener('change', async (e) => {
      e.stopPropagation();
      const file = e.target.files && e.target.files[0];
      await handleContenderFile(file, side);
      inp.value = '';
    });
    if (cardEl && window.VibeClash.bindDropZone) {
      window.VibeClash.bindDropZone(cardEl, (file) => handleContenderFile(file, side));
    }
  }
  wireContenderPhoto('btnLeftPhoto', 'leftPhotoInput', 'leftCardWrap', 'left');
  wireContenderPhoto('btnRightPhoto', 'rightPhotoInput', 'rightCardWrap', 'right');

  // Spice Meter & Hot Takes
  document.querySelectorAll('#spicePills .spice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const b = window.VibeState.getActiveBracket();
      if (b.champion) return;
      const topic = window.VibeState.getActiveTopic();
      const match = b.rounds[b.currentRoundIdx][b.currentMatchIdx];
      window.VibeState.setMatchSpice(topic.id, b.currentRoundIdx, b.currentMatchIdx, Number(btn.dataset.spice));
      renderSpiceAndHotTakes(topic.id, b.currentRoundIdx, b.currentMatchIdx, match);
    });
  });

  document.getElementById('hotTakeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('hotTakeInput');
    const val = input.value.trim();
    if (!val) return;
    const b = window.VibeState.getActiveBracket();
    if (b.champion) return;
    const topic = window.VibeState.getActiveTopic();
    const match = b.rounds[b.currentRoundIdx][b.currentMatchIdx];
    window.VibeState.addMatchHotTake(topic.id, b.currentRoundIdx, b.currentMatchIdx, val);
    input.value = '';
    renderSpiceAndHotTakes(topic.id, b.currentRoundIdx, b.currentMatchIdx, match);
    refreshPosterCanvas();
    showToast('Hot take recorded locally!');
  });

  // Bracket Tree Pan & Zoom + Mobile Touch Pinch/Pan + Mini-Map
  let treeScale = 1;
  let treeX = 0;
  let treeY = 0;
  let isDraggingTree = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialPinchDist = null;
  let initialPinchScale = 1;

  function applyTreeTransform() {
    const inner = document.getElementById('treeCanvasInner');
    const miniBox = document.getElementById('treeMinimapBox');
    if (inner) {
      inner.style.transform = 'translate(' + treeX + 'px, ' + treeY + 'px) scale(' + treeScale + ')';
    }
    if (miniBox) {
      const mx = Math.max(0, Math.min(60, 24 - treeX * 0.08));
      const my = Math.max(0, Math.min(34, 14 - treeY * 0.08));
      miniBox.style.transform = 'translate(' + mx + 'px, ' + my + 'px) scale(' + Math.max(0.5, 1 / treeScale) + ')';
    }
  }

  document.getElementById('btnZoomIn').addEventListener('click', () => {
    treeScale = Math.min(2.2, +(treeScale + 0.2).toFixed(2));
    applyTreeTransform();
  });
  document.getElementById('btnZoomOut').addEventListener('click', () => {
    treeScale = Math.max(0.45, +(treeScale - 0.2).toFixed(2));
    applyTreeTransform();
  });
  document.getElementById('btnZoomReset').addEventListener('click', () => {
    treeScale = 1; treeX = 0; treeY = 0;
    applyTreeTransform();
  });

  const treeViewport = document.getElementById('treeViewport');
  if (treeViewport) {
    treeViewport.addEventListener('mousedown', (e) => {
      isDraggingTree = true;
      dragStartX = e.clientX - treeX;
      dragStartY = e.clientY - treeY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDraggingTree) return;
      treeX = e.clientX - dragStartX;
      treeY = e.clientY - dragStartY;
      applyTreeTransform();
    });
    window.addEventListener('mouseup', () => { isDraggingTree = false; });
    treeViewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      treeScale = Math.max(0.45, Math.min(2.2, +(treeScale + delta).toFixed(2)));
      applyTreeTransform();
    }, { passive: false });

    treeViewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDraggingTree = true;
        dragStartX = e.touches[0].clientX - treeX;
        dragStartY = e.touches[0].clientY - treeY;
      } else if (e.touches.length === 2) {
        isDraggingTree = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchScale = treeScale;
      }
    }, { passive: true });

    treeViewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDraggingTree) {
        treeX = e.touches[0].clientX - dragStartX;
        treeY = e.touches[0].clientY - dragStartY;
        applyTreeTransform();
      } else if (e.touches.length === 2 && initialPinchDist) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / initialPinchDist;
        treeScale = Math.max(0.45, Math.min(2.2, +(initialPinchScale * ratio).toFixed(2)));
        applyTreeTransform();
      }
    }, { passive: false });

    treeViewport.addEventListener('touchend', () => {
      isDraggingTree = false;
      initialPinchDist = null;
    });
  }

  // Poster Aspect Ratio & Web Share API
  document.getElementById('posterAspectSelect').addEventListener('change', (e) => {
    window.VibeState.data.posterAspect = e.target.value;
    window.VibeState.save();
    refreshPosterCanvas();
  });

  document.getElementById('btnSharePoster').addEventListener('click', async () => {
    refreshPosterCanvas();
    const canvas = document.getElementById('posterCanvas');
    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        try {
          const file = new File([blob], 'VibeBracket_Poster_NetHustle.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'VibeBracket Arena', text: buildCaptionText(), files: [file] });
            return;
          }
        } catch (err) {
          // Fallback to caption copy
        }
        copyTextSafe(buildCaptionText(), 'Viral caption copied for sharing!');
      }, 'image/png');
    } else {
      copyTextSafe(buildCaptionText(), 'Viral caption copied for sharing!');
    }
  });


  // POD2-401: 1-Tap Seed Photo Cycler on Left & Right Contender Cards
  function wireCyclePhotoBtn(btnId, side) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const b = window.VibeState.getActiveBracket();
      if (b.champion) return;
      const match = b.rounds[b.currentRoundIdx][b.currentMatchIdx];
      const contender = side === 'left' ? match.left : match.right;
      const seedNum = side === 'left' ? (b.currentMatchIdx * 2 + 1) : (b.currentMatchIdx * 2 + 2);
      const topic = window.VibeState.getActiveTopic();
      const res = await window.VibeVisuals.cycleSeedPhoto(contender, seedNum, topic.title);
      if (res) {
        renderArena();
        refreshPosterCanvas();
        showToast('Cycled photo (' + res.index + '/' + res.total + ' · ' + res.source + ') for ' + contender.name + '!');
      }
    });
  }
  wireCyclePhotoBtn('btnLeftCyclePhoto', 'left');
  wireCyclePhotoBtn('btnRightCyclePhoto', 'right');

  // POD2-402: Co-Star Hero Scene Composition Presets & Live Blend Sliders
  const posterPresetSelect = document.getElementById('posterPresetSelect');
  if (posterPresetSelect) {
    posterPresetSelect.addEventListener('change', (e) => {
      window.VibeState.data.posterPreset = e.target.value;
      window.VibeState.save();
      refreshPosterCanvas();
      showToast('Co-Star Hero Scene preset: ' + e.target.options[e.target.selectedIndex].text);
    });
  }

  const scaleSlider = document.getElementById('posterPhotoScaleSlider');
  const offsetSlider = document.getElementById('posterPhotoOffsetSlider');
  const rimGlowSlider = document.getElementById('posterRimGlowSlider');
  if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      window.VibeState.data.posterPhotoScale = val;
      const lbl = document.getElementById('posterScaleVal');
      if (lbl) lbl.textContent = val + '%';
      refreshPosterCanvas();
    });
  }
  if (offsetSlider) {
    offsetSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      window.VibeState.data.posterPhotoOffset = val;
      const lbl = document.getElementById('posterOffsetVal');
      if (lbl) lbl.textContent = val + 'px';
      refreshPosterCanvas();
    });
  }
  if (rimGlowSlider) {
    rimGlowSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      window.VibeState.data.posterRimGlow = val;
      const lbl = document.getElementById('posterRimGlowVal');
      if (lbl) lbl.textContent = val + '%';
      refreshPosterCanvas();
    });
  }

  // POD2-403: 1080p & 4K 32-Seed Tier-List Share Poster Exporter with "🔥 Robbery Fixed (+N)" Badges
  function exportTierListPoster(resolutionMode) {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    let tierMap = window.VibeState.data.tiers[topic.id] || {};
    if (!Object.keys(tierMap).length) {
      tierMap = window.VibeState.autoPopulateTiersFromBracket(topic, b);
    }
    const autoTierMap = (window.VibeState.data.autoTiers && window.VibeState.data.autoTiers[topic.id]) || {};
    const offscreen = document.createElement('canvas');
    window.VibePoster.renderTierPoster(offscreen, topic, b, tierMap, autoTierMap, {
      theme: window.VibeState.data.posterTheme || 'cyber',
      resolution: resolutionMode
    });
    const link = document.createElement('a');
    link.download = resolutionMode === '4k'
      ? 'VibeBracket_4K_TierList_Poster_NetHustle.png'
      : 'VibeBracket_TierList_Poster_NetHustle.png';
    link.href = offscreen.toDataURL('image/png');
    link.click();
    showToast((resolutionMode === '4k' ? '4K (2160×2700)' : '1080×1350') + ' Tier-List Verdict Poster PNG downloaded!');
  }

  const btnExportTierPoster = document.getElementById('btnExportTierPoster');
  if (btnExportTierPoster) {
    btnExportTierPoster.addEventListener('click', () => exportTierListPoster('1x'));
  }
  const btnExportTierPoster4k = document.getElementById('btnExportTierPoster4k');
  if (btnExportTierPoster4k) {
    btnExportTierPoster4k.addEventListener('click', () => exportTierListPoster('4k'));
  }

  // POD2-404: Beat-My-Bracket #challenge= Link Generator & Friend-vs-Friend Compatibility Preview
  const btnCopyChallengeLink = document.getElementById('btnCopyChallengeLink');
  if (btnCopyChallengeLink) {
    btnCopyChallengeLink.addEventListener('click', () => {
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      const tierMap = window.VibeState.data.tiers[topic.id] || {};
      const handle = window.VibeState.data.userHandle || '@Creator';
      const encoded = window.PackSanitizer.encodeChallengeHash(topic, b, tierMap, handle);
      if (!encoded) {
        showToast('Could not encode Beat-My-Bracket challenge link.');
        return;
      }
      const url = window.location.origin + window.location.pathname + '#challenge=' + encoded;
      copyTextSafe(url, '⚔️ Beat-My-Bracket #challenge= link copied! Send to a friend to compare Vibe Compatibility %.');
    });
  }

  const btnSimulateChallenge = document.getElementById('btnSimulateChallenge');
  if (btnSimulateChallenge) {
    btnSimulateChallenge.addEventListener('click', () => {
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      // Create a deterministic rival challenge bitstring (alternating some picks) so the user can preview the live scorecard immediately
      const rivalBits = Array.from({ length: Math.max(1, topic.items.length - 1) }, (_, idx) => (idx % 3 === 0 ? '1' : '0')).join('');
      const rivalChamp = topic.items[Math.min(1, topic.items.length - 1)];
      window.VibeState.data.activeChallenge = {
        topic,
        bits: rivalBits,
        champId: rivalChamp.id,
        champName: rivalChamp.name,
        tiers: { [rivalChamp.id]: 'S' },
        handle: '@RivalChamp'
      };
      renderChallengeScorecard();
      showToast('⚔️ Loaded Rival Challenge Scorecard! Play matches to watch live Vibe Compatibility %.');
    });
  }


  // POD2-504: Wire Round-of-32 Loser-Bracket Placement Battles (C-Tier vs D-Tier)
  function handlePlacementVote(side) {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    if (!b.champion) return;
    if (!Array.isArray(b.placementMatches) || !b.placementMatches.length) {
      window.VibeState.initLoserPlacementRound(b);
    }
    const nextIdx = b.placementMatches.findIndex((pm) => !pm.winner);
    if (nextIdx === -1) return;
    const winner = window.VibeState.resolvePlacementMatch(topic, b, nextIdx, side);
    window.VibeAudio.tap();
    renderAll();
    if (winner) {
      showToast('Promoted "' + winner.name + '" to C-Tier (Placement Battle ' + (nextIdx + 1) + '/8)!');
    }
  }

  const btnPlacementLeft = document.getElementById('btnPlacementLeft');
  if (btnPlacementLeft) {
    btnPlacementLeft.addEventListener('click', () => handlePlacementVote('left'));
  }
  const btnPlacementRight = document.getElementById('btnPlacementRight');
  if (btnPlacementRight) {
    btnPlacementRight.addEventListener('click', () => handlePlacementVote('right'));
  }
  const btnAutoResolvePlacements = document.getElementById('btnAutoResolvePlacements');
  if (btnAutoResolvePlacements) {
    btnAutoResolvePlacements.addEventListener('click', () => {
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      window.VibeState.autoResolveAllPlacementMatches(topic, b);
      window.VibeAudio.win();
      renderAll();
      showToast('⚡ All 8 C/D Loser Placement Battles resolved — Exact 2-6-8-8-8 Tier List locked!');
    });
  }

  // Boot & IndexedDB Vault Hydration

  // POD2-601: 1-Tap Pin Custom Image URL for Left / Right Contender via In-Page Modal
  function wirePinUrlBtn(btnId, side) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = window.VibeState.getActiveBracket();
      if (b.champion) return;
      const match = b.rounds[b.currentRoundIdx][b.currentMatchIdx];
      const contender = side === 'left' ? match.left : match.right;
      const currentUrl = window.VibeState.getContenderPhoto(contender.id) || contender.imageUrl || '';
      document.getElementById('modalTitle').textContent = '📌 Pin Custom Image URL — ' + contender.name;
      const body = document.getElementById('modalBody');
      body.textContent = '';
      const desc = createSafeEl('p', 'Paste any direct https:// image URL below to permanently pin the portrait for "' + contender.name + '" in your local IndexedDB vault:', null);
      desc.style.marginBottom = '0.65rem';
      body.appendChild(desc);
      const urlInput = createSafeEl('input', null, 'input');
      urlInput.type = 'url';
      urlInput.placeholder = 'https://upload.wikimedia.org/...';
      urlInput.value = currentUrl.startsWith('https://') ? currentUrl : '';
      urlInput.style.marginBottom = '0.75rem';
      body.appendChild(urlInput);
      const saveBtn = createSafeEl('button', '📌 Save & Pin Image URL', 'btn btn-primary');
      saveBtn.type = 'button';
      saveBtn.addEventListener('click', () => {
        const trimmed = (urlInput.value || '').trim();
        if (!window.VibeVisuals.isSafeImageUrl(trimmed)) {
          showToast('Please enter a valid https:// image URL.');
          return;
        }
        contender.imageUrl = trimmed;
        contender.imageSource = 'Pinned Image URL';
        window.VibeState.setContenderPhoto(contender.id, trimmed);
        if (window.NetHustlePhotoStore && window.NetHustlePhotoStore.pinContenderImageUrl) {
          window.NetHustlePhotoStore.pinContenderImageUrl(contender.id, trimmed);
        }
        document.getElementById('modalBackdrop').classList.remove('open');
        renderArena();
        refreshPosterCanvas();
        showToast('📌 Pinned image URL for ' + contender.name + '!');
      });
      body.appendChild(saveBtn);
      document.getElementById('modalBackdrop').classList.add('open');
    });
  }
  wirePinUrlBtn('btnLeftPinUrl', 'left');
  wirePinUrlBtn('btnRightPinUrl', 'right');

  // FD-P0-20261116-03 & POD2-603: 39-Match Tournament & Redemption Provenance Inspector
  function inspectContenderProvenance(itemId) {
    if (!itemId || !window.VibeState.getSeedTournamentProvenance) return;
    inspectedItemId = itemId;
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    const prov = window.VibeState.getSeedTournamentProvenance(topic, b, itemId);
    const titleEl = document.getElementById('tierProvenanceTitle');
    const summaryEl = document.getElementById('tierProvenanceSummary');
    const ruleEl = document.getElementById('tierProvenanceRule');
    const btnRefight = document.getElementById('btnRefightPlacementMatch');
    if (!prov || !titleEl || !summaryEl) return;

    const itemObj = topic.items.find((x) => x.id === itemId);
    const label = itemObj ? ((itemObj.emoji || '🌟') + ' ' + itemObj.name) : itemId;
    titleEl.textContent = '🔍 ' + label + ' → ' + prov.assignedTier + '-Tier (' + prov.wins + 'W - ' + prov.losses + 'L across 39-Match Arena)';
    if (prov.history && prov.history.length > 0) {
      summaryEl.textContent = prov.history.map((h) => h.stage + ': ' + (h.won ? '✅ Beat ' : '❌ Lost to ') + (h.opponent ? h.opponent.name : 'Opponent')).join(' · ');
    } else {
      summaryEl.textContent = 'No completed matches recorded yet for this contender — play or auto-rank the bracket to view match provenance.';
    }
    if (ruleEl) ruleEl.textContent = prov.tierRule;
    if (btnRefight) {
      if (prov.decisiveMatch && prov.decisiveMatch.isPlacement) {
        btnRefight.style.display = 'inline-flex';
        btnRefight.textContent = '⚔️ Flip ' + prov.decisiveMatch.stage;
      } else {
        btnRefight.style.display = 'none';
      }
    }
  }

  const btnRefightPlacementMatch = document.getElementById('btnRefightPlacementMatch');
  if (btnRefightPlacementMatch) {
    btnRefightPlacementMatch.addEventListener('click', () => {
      if (!inspectedItemId || !window.VibeState.flipDecisivePlacementOutcome) return;
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      const res = window.VibeState.flipDecisivePlacementOutcome(topic, b, inspectedItemId);
      if (res) {
        window.VibeAudio.tap();
        renderTierList();
        inspectContenderProvenance(inspectedItemId);
        refreshPosterCanvas();
        showToast('⚔️ Re-fought Battle of Losers Match #' + (res.matchIndex + 1) + ' — promoted ' + res.newWinner.name + ' to C-Tier (Exact 2-6-8-8-8 maintained)!');
      }
    });
  }

  // POD2-602: Pointer-Reactive 3D Diagonal Battle Card Tilt
  ['btnPickLeft', 'btnPickRight'].forEach((id) => {
    const cardBtn = document.getElementById(id);
    if (!cardBtn) return;
    cardBtn.addEventListener('pointermove', (e) => {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = cardBtn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 7;
      const ry = (0.5 - (e.clientY - rect.top) / rect.height) * 5;
      cardBtn.style.transform = 'perspective(950px) rotateX(' + ry.toFixed(2) + 'deg) rotateY(' + rx.toFixed(2) + 'deg) translateY(-3px)';
    });
    cardBtn.addEventListener('pointerleave', () => {
      cardBtn.style.transform = '';
    });
  });

  // POD2-604: Dual-Slide Social Pack & 3-Second Diagonal VS Clash Video Exporters
  const btnExportDualPack = document.getElementById('btnExportDualPack');
  if (btnExportDualPack) {
    btnExportDualPack.addEventListener('click', () => {
      const canvas = document.getElementById('posterCanvas');
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      const tierMap = window.VibeState.data.tiers[topic.id] || {};
      const autoTierMap = (window.VibeState.data.autoTiers && window.VibeState.data.autoTiers[topic.id]) || {};
      if (canvas && window.VibePoster.exportDualSlidePack) {
        window.VibePoster.exportDualSlidePack(canvas, topic, b, tierMap, autoTierMap, {
          theme: window.VibeState.data.posterTheme || 'cyber',
          aspect: window.VibeState.data.posterAspect || '9:16',
          resolution: '1x',
          preset: window.VibeState.data.posterPreset || 'rivals',
          photoScale: window.VibeState.data.posterPhotoScale ?? 100,
          photoOffset: window.VibeState.data.posterPhotoOffset ?? 0,
          rimGlow: window.VibeState.data.posterRimGlow ?? 75,
          handle: window.VibeState.data.userHandle,
          quote: window.VibeState.data.userQuote || '',
          topHotTake: window.VibeState.getTopicTopHotTake(topic.id),
          photoImg: cachedPhotoImg || cachedChampionImg,
          championPhotoImg: cachedChampionImg,
          fusionMeta: activeFusionMeta
        });
        showToast('🖼️ Exported 2-Slide Social Pack (Slide 1: Co-Star Hero Fusion + Slide 2: 2-6-8-8-8 Tier Verdict)!');
      }
    });
  }

  const btnExportClashVideo = document.getElementById('btnExportClashVideo');
  if (btnExportClashVideo) {
    btnExportClashVideo.addEventListener('click', async () => {
      const canvas = document.getElementById('posterCanvas');
      const topic = window.VibeState.getActiveTopic();
      const b = window.VibeState.getActiveBracket();
      if (!canvas || !window.VibePoster.exportDiagonalClashVideo) return;
      btnExportClashVideo.disabled = true;
      btnExportClashVideo.textContent = '🎬 Recording 3s Clash Clip...';
      try {
        const res = await window.VibePoster.exportDiagonalClashVideo(canvas, topic, b, {
          theme: window.VibeState.data.posterTheme || 'cyber'
        });
        refreshPosterCanvas();
        showToast('🎬 Exported 3-Second Diagonal VS Clash Clip (' + (res && res.format ? res.format.toUpperCase() : 'WEBM') + ')!');
      } finally {
        btnExportClashVideo.disabled = false;
        btnExportClashVideo.textContent = '🎬 Export 3s Diagonal VS Clash Clip (.webm)';
      }
    });
  }


  // POD2-704: 1-Tap Retry Missing Seed Photos (#btnRetryMissingPhotos)
  const btnRetryMissingPhotos = document.getElementById('btnRetryMissingPhotos');
  if (btnRetryMissingPhotos) {
    btnRetryMissingPhotos.addEventListener('click', async () => {
      const topic = window.VibeState.getActiveTopic();
      const missing = topic.items.filter((it) => !window.VibeState.getContenderPhoto(it.id) && !it.imageUrl);
      if (!missing.length) {
        showToast('All ' + topic.items.length + ' seed photos are already cached!');
        updateSeedImageStatusText();
        return;
      }
      btnRetryMissingPhotos.disabled = true;
      btnRetryMissingPhotos.textContent = '⏳ Retrying ' + missing.length + ' Seeds...';
      try {
        let resolvedNow = 0;
        for (const it of missing) {
          const u = await window.VibeVisuals.fetchRealtimeSeedImage(it, topic.title, { forceRefresh: true });
          if (u) resolvedNow++;
          updateSeedImageStatusText();
        }
        renderArena();
        refreshPosterCanvas();
        showToast('Resolved ' + resolvedNow + ' additional seed photos via Wikidata & Wikimedia!');
      } finally {
        btnRetryMissingPhotos.disabled = false;
        btnRetryMissingPhotos.textContent = '🔄 Retry Missing Photos';
        updateSeedImageStatusText();
      }
    });
  }


  // FD-P0-20261117-03 (POD2-803): Interactive 32-Seed Roster / Draft Board Preview & Editor
  function renderDraftBoard() {
    const grid = document.getElementById('draftBoardGrid');
    const wrap = document.getElementById('draftBoardWrap');
    if (!grid || !wrap || wrap.style.display === 'none') return;
    const topic = window.VibeState.getActiveTopic();
    grid.textContent = '';
    topic.items.forEach((item, idx) => {
      const card = createSafeEl('div', null, 'draft-seed-card');
      const img = createSafeEl('img', null, 'draft-seed-thumb');
      img.alt = item.name;
      bindBannerImageWithFallback(img, item, idx + 1);
      card.appendChild(img);
      card.appendChild(createSafeEl('div', '#' + (idx + 1) + ' · ' + item.name, 'draft-seed-title'));
      const actRow = createSafeEl('div', null, 'draft-seed-actions');
      const rerollBtn = document.createElement('button');
      rerollBtn.type = 'button';
      rerollBtn.className = 'btn btn-sm';
      rerollBtn.textContent = '🎲 Reroll';
      rerollBtn.title = 'Swap this contender with a domain-verified reserve seed';
      rerollBtn.addEventListener('click', () => {
        if (window.VibeState && typeof window.VibeState.rerollDraftSeed === 'function') {
          const rep = window.VibeState.rerollDraftSeed(idx);
          if (rep) {
            if (window.VibeVisuals && typeof window.VibeVisuals.fetchRealtimeSeedImage === 'function') {
              window.VibeVisuals.fetchRealtimeSeedImage(rep, topic.title, { forceRefresh: true }).then(() => {
                renderDraftBoard();
                renderArena();
              });
            }
            renderDraftBoard();
            renderArena();
            showToast('🎲 Rerolled Seed #' + (idx + 1) + ' -> ' + rep.name);
          }
        }
      });

      const editBtn = createSafeEl('button', '✏️ Edit Seed', 'btn btn-sm');
      editBtn.type = 'button';
      editBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = '✏️ Customize Seed #' + (idx + 1) + ' — ' + item.name;
        const body = document.getElementById('modalBody');
        body.textContent = '';
        const nameInput = createSafeEl('input', null, 'input');
        nameInput.type = 'text';
        nameInput.value = item.name;
        nameInput.style.marginBottom = '0.65rem';
        body.appendChild(nameInput);
        const saveBtn = createSafeEl('button', 'Save & Resolve Live Photo', 'btn btn-primary');
        saveBtn.type = 'button';
        saveBtn.addEventListener('click', async () => {
          const nextName = (nameInput.value || '').trim();
          if (!nextName) return;
          window.VibeState.updateSeedItemName(topic.id, item.id, nextName);
          document.getElementById('modalBackdrop').classList.remove('open');
          renderAll();
          renderDraftBoard();
          showToast('Updated Seed #' + (idx + 1) + ' to "' + nextName + '"!');
          if (window.VibeVisuals && window.VibeVisuals.fetchRealtimeSeedImage) {
            await window.VibeVisuals.fetchRealtimeSeedImage(item, topic.title, { forceRefresh: true });
            updateSeedImageStatusText();
            renderArena();
            renderDraftBoard();
          }
        });
        body.appendChild(saveBtn);
        document.getElementById('modalBackdrop').classList.add('open');
      });
      actRow.appendChild(rerollBtn);
      actRow.appendChild(editBtn);
      card.appendChild(actRow);
      grid.appendChild(card);
    });
    const statusEl = document.getElementById('draftBoardPhotoStatus');
    if (statusEl && topic && Array.isArray(topic.items)) {
      let readyCount = 0;
      topic.items.forEach(it => {
        const p = (window.VibeState && window.VibeState.getContenderPhoto(it.id)) || it.imageUrl;
        if (p) readyCount++;
      });
      statusEl.textContent = readyCount + ' / ' + topic.items.length + ' Verified Photos';
      statusEl.classList.toggle('photo-health-ok', readyCount === topic.items.length);
      statusEl.classList.toggle('photo-health-warn', readyCount < topic.items.length);
    }
  }

  const btnToggleDraftBoard = document.getElementById('btnToggleDraftBoard');
    const btnPrefetchDraftBoard = document.getElementById('btnPrefetchDraftBoard');
    if (btnPrefetchDraftBoard) {
      btnPrefetchDraftBoard.addEventListener('click', async () => {
        const topic = window.VibeState.getActiveTopic();
        const statusEl = document.getElementById('draftBoardPhotoStatus');
        if (!topic || !window.VibeVisuals || typeof window.VibeVisuals.prefetchDraftBoardVisuals !== 'function') return;
        btnPrefetchDraftBoard.disabled = true;
        await window.VibeVisuals.prefetchDraftBoardVisuals(topic, 4, (done, total) => {
          if (statusEl) statusEl.textContent = 'Prefetching: ' + done + ' / ' + total + ' Visuals...';
        });
        btnPrefetchDraftBoard.disabled = false;
        renderDraftBoard();
        renderArena();
        showToast('⚡ 32-Seed Draft Board Visuals Prefetched!');
      });
    }
    function renderTrophyCabinetModal() {
      const grid = document.getElementById('trophyCabinetGrid');
      if (!grid || !window.VibeState || typeof window.VibeState.getTrophyCabinet !== 'function') return;
      grid.textContent = '';
      const list = window.VibeState.getTrophyCabinet();
      if (!list.length) {
        const empty = createSafeEl('div', 'Complete a 32-seed tournament to enshrine your first Grand Champion & Taste Archetype here!', 'trophy-cabinet-card');
        grid.appendChild(empty);
        return;
      }
      list.forEach((tr) => {
        const card = createSafeEl('div', null, 'trophy-cabinet-card');
        card.appendChild(createSafeEl('strong', (tr.championEmoji || '👑') + ' ' + tr.championName, null));
        card.appendChild(createSafeEl('div', 'Arena: ' + tr.topicTitle, null));
        card.appendChild(createSafeEl('div', tr.archetypeTitle + ' · Upset Rate: ' + tr.upsetPct + '%', null));
        card.appendChild(createSafeEl('div', tr.duelSummary + ' · ' + tr.timestamp, null));
        grid.appendChild(card);
      });
    }

    // POD2-1103: 1-Tap 3-Skin Arena Theme Switcher (Obsidian Aurora -> Cyber Arcade -> Golden Championship)
    const SKINS = [
      { id: 'obsidian', label: '🎨 Skin: Obsidian' },
      { id: 'cyber', label: '🎨 Skin: Cyber' },
      { id: 'gold', label: '🎨 Skin: Gold' }
    ];
    let skinIdx = 0;
    try {
      const savedSkin = localStorage.getItem((window.VibeVersion && window.VibeVersion.SKIN_STORAGE_KEY) || 'vibebracket_arena_v3_skin');
      const foundIdx = SKINS.findIndex(s => s.id === savedSkin);
      if (foundIdx >= 0) skinIdx = foundIdx;
    } catch (e) {}
    const btnCycleThemeSkin = document.getElementById('btnCycleThemeSkin');
    function applyArenaSkin(idx) {
      const sk = SKINS[idx % SKINS.length];
      document.documentElement.setAttribute('data-arena-skin', sk.id);
      if (btnCycleThemeSkin) btnCycleThemeSkin.textContent = sk.label;
      try {
        localStorage.setItem((window.VibeVersion && window.VibeVersion.SKIN_STORAGE_KEY) || 'vibebracket_arena_v3_skin', sk.id);
      } catch (e) {}
    }
    applyArenaSkin(skinIdx);
    if (btnCycleThemeSkin) {
      btnCycleThemeSkin.addEventListener('click', () => {
        skinIdx = (skinIdx + 1) % SKINS.length;
        applyArenaSkin(skinIdx);
        showToast('🎨 Switched Arena Theme: ' + SKINS[skinIdx].label.replace('🎨 Skin: ', ''));
      });
    }

    // POD2-1104: Transparent Creator Pro 4K Upgrade Preview Modal
    const btnOpenCreatorPro = document.getElementById('btnOpenCreatorPro');
    const creatorProModal = document.getElementById('creatorProModal');
    const btnCloseCreatorPro = document.getElementById('btnCloseCreatorPro');
    const btnCreatorProCheckoutPreview = document.getElementById('btnCreatorProCheckoutPreview');
    if (btnOpenCreatorPro && creatorProModal) {
      btnOpenCreatorPro.addEventListener('click', () => {
        creatorProModal.style.display = creatorProModal.style.display === 'block' ? 'none' : 'block';
      });
    }
    if (btnCloseCreatorPro && creatorProModal) {
      btnCloseCreatorPro.addEventListener('click', () => {
        creatorProModal.style.display = 'none';
      });
    }
    if (btnCreatorProCheckoutPreview) {
      btnCreatorProCheckoutPreview.addEventListener('click', () => {
        showToast('👑 Creator Pro ($4.99 / $9.99 mo / $79 yr) — Stripe Checkout ready for Stage G5 launch!');
      });
    }

    // POD2-1102: 1-Click "✨ Suggest Viral Topics" Studio Chips
    document.querySelectorAll('.viral-topic-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const promptVal = chip.getAttribute('data-viral-prompt');
        if (!promptVal || !window.VibeGenAI || !window.VibeState) return;
        const topic = window.VibeGenAI.synthesizeLocalTopic(promptVal);
        if (topic && Array.isArray(topic.items) && topic.items.length === 32) {
          window.VibeState.addTopic(topic);
          renderArena();
          renderDraftBoard();
          showToast('✨ Loaded 32-Seed Viral Arena: ' + topic.title);
        }
      });
    });

    const btnOpenTrophyCabinet = document.getElementById('btnOpenTrophyCabinet');
    const trophyCabinetModal = document.getElementById('trophyCabinetModal');
    const btnCloseTrophyCabinet = document.getElementById('btnCloseTrophyCabinet');
    if (btnOpenTrophyCabinet && trophyCabinetModal) {
      btnOpenTrophyCabinet.addEventListener('click', () => {
        renderTrophyCabinetModal();
        trophyCabinetModal.style.display = trophyCabinetModal.style.display === 'block' ? 'none' : 'block';
      });
    }
    if (btnCloseTrophyCabinet && trophyCabinetModal) {
      btnCloseTrophyCabinet.addEventListener('click', () => {
        trophyCabinetModal.style.display = 'none';
      });
    }

    const btnExportVerdictReel = document.getElementById('btnExportVerdictReel');
    if (btnExportVerdictReel) {
      btnExportVerdictReel.addEventListener('click', () => {
        if (window.VibePoster && typeof window.VibePoster.exportAnimatedVerdictReel === 'function') {
          window.VibePoster.exportAnimatedVerdictReel().then(() => {
            showToast('🎬 4-Second Animated Clash & Verdict Story Reel Exported!');
          });
        }
      });
    }

    const btnExportDuelPoster = document.getElementById('btnExportDuelPoster');
    if (btnExportDuelPoster) {
      btnExportDuelPoster.addEventListener('click', () => {
        if (window.VibePoster && typeof window.VibePoster.exportFriendDuelPoster === 'function') {
          const duel = window.VibeState.computeFriendDuelComparison ? window.VibeState.computeFriendDuelComparison() : null;
          window.VibePoster.exportFriendDuelPoster(duel, 'feed');
          showToast('🖼️ Exported Split-Screen Friend-Duel Verdict Poster!');
        }
      });
    }
    const btnCloseDraftBoard = document.getElementById('btnCloseDraftBoard');
  if (btnToggleDraftBoard) {
    btnToggleDraftBoard.addEventListener('click', () => {
      const wrap = document.getElementById('draftBoardWrap');
      if (!wrap) return;
      const showing = wrap.style.display !== 'none';
      wrap.style.display = showing ? 'none' : 'block';
      if (!showing) renderDraftBoard();
    });
  }
  if (btnCloseDraftBoard) {
    btnCloseDraftBoard.addEventListener('click', () => {
      const wrap = document.getElementById('draftBoardWrap');
      if (wrap) wrap.style.display = 'none';
    });
  }

  // FD-P0-20261117-03 (POD2-804): Mobile Touch-Swipe Left/Right Voting on .matchup-grid
  const matchupStageEl = document.getElementById('matchupStage');
  if (matchupStageEl) {
    let touchStartX = null;
    let touchStartY = null;
    matchupStageEl.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    matchupStageEl.addEventListener('touchend', (e) => {
      if (touchStartX === null || !e.changedTouches || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;
      if (Math.abs(dx) > 68 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        if (dx < 0) pickWinner('left');
        else pickWinner('right');
      }
    }, { passive: true });
  }

  window.VibeState.load();
  if (document.getElementById('posterAspectSelect')) document.getElementById('posterAspectSelect').value = window.VibeState.data.posterAspect || '9:16';
  if (document.getElementById('posterPresetSelect')) document.getElementById('posterPresetSelect').value = window.VibeState.data.posterPreset || 'rivals';
  document.getElementById('brandVersionLabel').textContent = 'by NetHustle · v' + window.VibeVersion.VERSION;
  document.getElementById('btnToggleSfx').textContent = window.VibeAudio.isEnabled() ? 'SFX: ON' : 'SFX: OFF';
  document.getElementById('posterThemeSelect').value = window.VibeState.data.posterTheme || 'cyber';
  document.getElementById('posterQuoteInput').value = window.VibeState.data.userQuote || '';
  document.getElementById('posterHandleInput').value = window.VibeState.data.userHandle || '';
  renderAiPacks();
  renderAll();
  window.VibeState.hydratePhotosFromVault().then(() => {
    renderArena();
    refreshPosterCanvas();
  });
  window.AppLogger.info('VibeBracket Arena v' + window.VibeVersion.VERSION + ' (' + window.VibeVersion.BUILD_ID + ') ready.');

  // === v3.2.0: POD2-1202 Share 32-Seed Lineup, POD2-1203 Championship Receipt, POD2-1204 Rivalry Roast ===
  (function initV320Hooks() {
    const btnShareLineup = document.getElementById('btnShareDraftLineup');
    if (btnShareLineup) {
      btnShareLineup.addEventListener('click', () => {
        const topic = window.VibeState && window.VibeState.getActiveTopic ? window.VibeState.getActiveTopic() : null;
        if (!topic) return;
        const hashStr = (window.VibeState && typeof window.VibeState.encodeLineupHash === 'function')
          ? window.VibeState.encodeLineupHash(topic)
          : '';
        const url = window.location.href.split('#')[0] + (hashStr ? hashStr : '');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).catch(() => {});
        }
        if (typeof showToast === 'function') showToast('🔗 32-Seed Lineup Link Copied!');
      });
    }

    const btnReceipt = document.getElementById('btnExportReceipt');
    if (btnReceipt) {
      btnReceipt.addEventListener('click', () => {
        if (!window.VibePoster || typeof window.VibePoster.exportChampionshipReceipt !== 'function') return;
        const topic = window.VibeState && window.VibeState.getActiveTopic ? window.VibeState.getActiveTopic() : null;
        const champEl = document.getElementById('championName');
        const statsEl = document.getElementById('tasteArchetypeStats');
        const res = window.VibePoster.exportChampionshipReceipt({
          topicTitle: topic ? topic.title : 'VibeBracket Arena',
          championName: champEl ? champEl.textContent.trim() : 'Grand Champion',
          runnerUpName: 'Bracket Finalist',
          biggestUpset: statsEl ? statsEl.textContent.trim() : '31 Clashes Decided',
          spicePct: 35
        });
        if (res && res.dataUrl) {
          const a = document.createElement('a');
          a.href = res.dataUrl;
          a.download = res.filename || 'vibebracket_championship_receipt.png';
          a.click();
        }
        if (typeof showToast === 'function') showToast('🧾 Championship Receipt Exported (1080×1920)!');
      });
    }

    let roastIdx = 0;
    function getRoastLines() {
      const champEl = document.getElementById('championName');
      const champ = (champEl && champEl.textContent.trim()) || 'this champion';
      return [
        '"' + champ + ' cleared 31 clashes with zero mercy — argue with the bracket, not me."',
        '"If your favorite got bounced before the Final 4, blame the 32-seed gauntlet."',
        '"Certified spicy bracket: ' + champ + ' survived every upset alert on the board."'
      ];
    }
    const btnCycleRoast = document.getElementById('btnCycleRoastLine');
    const roastQuoteEl = document.getElementById('rivalryRoastQuote');
    if (btnCycleRoast && roastQuoteEl) {
      btnCycleRoast.addEventListener('click', () => {
        const lines = getRoastLines();
        roastIdx = (roastIdx + 1) % lines.length;
        roastQuoteEl.textContent = lines[roastIdx];
      });
    }
    const btnCopyRoast = document.getElementById('btnCopyRoastCard');
    if (btnCopyRoast && roastQuoteEl) {
      btnCopyRoast.addEventListener('click', () => {
        const txt = roastQuoteEl.textContent + ' — via VibeBracket Arena (NetHustle)';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).catch(() => {});
        }
        if (typeof showToast === 'function') showToast('📋 Hot Take Copied for TikTok / IG / Threads!');
      });
    }
  })();

})();
