// Version: 2.3.0 | Last Modified: 2026-11-14 22:35 HKT
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
 */
(function () {
  'use strict';

  let cachedPhotoImg = null;
  let cachedChampionImg = null;
  let cachedChampionPhotoUrl = null;
  let activeFusionMeta = null;
  let draggedTierItemId = null;

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
    if (!statusEl) return;
    const topic = window.VibeState.getActiveTopic();
    const withPhotoCount = topic.items.filter((it) => Boolean(window.VibeState.getContenderPhoto(it.id) || it.imageUrl)).length;
    statusEl.textContent = '🖼️ Seed Visuals: ' + withPhotoCount + ' / ' + topic.items.length + ' real photos cached (' + topic.items.length + '-Seed Arena)';
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
  }

  function renderArena() {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();

    document.getElementById('arenaBracketTitle').textContent = topic.title;
    document.getElementById('arenaBracketSubtitle').textContent = topic.subtitle || 'Tap a contender card to advance through all 31 matches.';
    document.getElementById('btnUndoVote').disabled = b.history.length === 0;
    renderStreamerHud();
    updateSeedImageStatusText();

    const totalMatches = topic.items.length - 1;
    const completed = b.history.length;
    const pct = totalMatches > 0 ? Math.round((completed / totalMatches) * 100) : 0;

    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';

    if (b.champion) {
      document.getElementById('roundBadge').textContent = 'Tournament Complete';
      document.getElementById('matchCounter').textContent = totalMatches + ' of ' + totalMatches + ' Matches';
      document.getElementById('matchupStage').style.display = 'none';
      document.getElementById('championStage').style.display = 'block';
      document.getElementById('championName').textContent = (b.champion.emoji || '👑') + ' ' + b.champion.name;
      document.getElementById('championSub').textContent = 'Crowned Grand Champion of "' + topic.title + '" · Tier List Auto-Populated (S/A/B/C/D)!';

      const podium = document.getElementById('podiumGrid');
      podium.textContent = '';
      [
        { label: '1st Place (Champion · S-Tier)', val: b.champion.name },
        { label: '2nd Place (Runner-Up · S-Tier)', val: b.runnerUp ? b.runnerUp.name : '—' },
        { label: 'Semifinalists (A-Tier)', val: b.semifinalists.length ? b.semifinalists.map((s) => s.name).join(' · ') : '—' }
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
      row.appendChild(createSafeEl('div', t, 'tier-label tier-' + t));
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
          const chip = createSafeEl('span', (it.emoji || '') + ' ' + it.name, 'tier-chip');
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
      pr.appendChild(createSafeEl('span', '⠿ ' + (it.emoji || '•') + ' ' + it.name + currentTier, null));
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
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    if (b.champion) return;

    const round = b.rounds[b.currentRoundIdx];
    const match = round[b.currentMatchIdx];
    const winner = side === 'left' ? match.left : match.right;
    const loser = side === 'left' ? match.right : match.left;

    window.VibeState.recordMatchVote(topic.id, b.currentRoundIdx, b.currentMatchIdx, side);
    b.history.push({ roundIdx: b.currentRoundIdx, matchIdx: b.currentMatchIdx, side });
    match.winner = winner;
    window.AppLogger.info('Advanced "' + winner.name + '" over "' + loser.name + '"');

    if (round.length === 2) {
      b.semifinalists.push(loser);
    } else if (round.length === 1) {
      b.runnerUp = loser;
      b.champion = winner;
      // POD2-305 (FD-P0-20261114-05): Automatically populate S/A/B/C/D Tier List on Champion Crown!
      window.VibeState.autoPopulateTiersFromBracket(topic, b);
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
        // Seed-order preview distribution (2 S, 2 A, 4 B, 8 C, 16 D) if no matches played yet
        const previewMap = {};
        topic.items.forEach((it, idx) => {
          if (idx < 2) previewMap[it.id] = 'S';
          else if (idx < 4) previewMap[it.id] = 'A';
          else if (idx < 8) previewMap[it.id] = 'B';
          else if (idx < 16) previewMap[it.id] = 'C';
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
      const promptHint = (titleInput && titleInput.value.trim()) || 'Sci-Fi & Mecha Classics';
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

  // Boot & IndexedDB Vault Hydration
  window.VibeState.load();
  if (document.getElementById('posterAspectSelect')) document.getElementById('posterAspectSelect').value = window.VibeState.data.posterAspect || '9:16';
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
})();
