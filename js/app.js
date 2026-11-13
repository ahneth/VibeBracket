// Version: 1.1.0 | Last Modified: 2026-11-13 07:46 HKT
/**
 * File: js/app.js
 * Description: Main UI controller, event wiring, Bracket Tree renderer, and modal/toast orchestration.
 * Change Log:
 *   - v1.0.0 (2026-11-13 07:26 HKT): Initial monolithic script.
 *   - v1.1.0 (2026-11-13 07:46 HKT): Modularized into js/app.js; added Bracket Tree rendering, GenAI studio wiring, and photo upload baking.
 */
(function () {
  'use strict';

  let cachedPhotoImg = null;

  /** Creates a DOM element safely using textContent (OWASP A05 XSS prevention). */
  function createSafeEl(tag, text, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
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

  function renderTopicPills() {
    const container = document.getElementById('topicPills');
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

  function renderArena() {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();

    document.getElementById('arenaBracketTitle').textContent = topic.title;
    document.getElementById('arenaBracketSubtitle').textContent = topic.subtitle || 'Tap a contender to advance.';
    document.getElementById('btnUndoVote').disabled = b.history.length === 0;

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
      document.getElementById('championSub').textContent = 'Crowned Champion of "' + topic.title + '"';

      const podium = document.getElementById('podiumGrid');
      podium.textContent = '';
      [
        { label: '1st Place (Champion)', val: b.champion.name },
        { label: '2nd Place (Runner-Up)', val: b.runnerUp ? b.runnerUp.name : '—' },
        { label: 'Semifinalists', val: b.semifinalists.length ? b.semifinalists.map((s) => s.name).join(' · ') : '—' }
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
    document.getElementById('leftName').textContent = match.left.name;
    document.getElementById('leftTag').textContent = match.left.tag || 'Contender';

    document.getElementById('rightEmoji').textContent = match.right.emoji || '🔥';
    document.getElementById('rightName').textContent = match.right.name;
    document.getElementById('rightTag').textContent = match.right.tag || 'Contender';
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

  function renderTierList() {
    const topic = window.VibeState.getActiveTopic();
    document.getElementById('tierTitle').textContent = topic.title + ' — Tier List';
    const tierMap = window.VibeState.data.tiers[topic.id] || {};
    const tierDefs = ['S', 'A', 'B', 'C', 'D'];

    const rowsEl = document.getElementById('tierRows');
    rowsEl.textContent = '';
    tierDefs.forEach((t) => {
      const row = createSafeEl('div', null, 'tier-row');
      row.appendChild(createSafeEl('div', t, 'tier-label tier-' + t));
      const itemsWrap = createSafeEl('div', null, 'tier-items');
      const matched = topic.items.filter((it) => tierMap[it.id] === t);
      if (!matched.length) {
        const hint = createSafeEl('span', 'Tap "' + t + '" below to assign', null);
        hint.style.color = '#64748b';
        itemsWrap.appendChild(hint);
      } else {
        matched.forEach((it) => {
          itemsWrap.appendChild(createSafeEl('span', (it.emoji || '') + ' ' + it.name, 'tier-chip'));
        });
      }
      row.appendChild(itemsWrap);
      rowsEl.appendChild(row);
    });

    const poolEl = document.getElementById('tierPool');
    poolEl.textContent = '';
    topic.items.forEach((it) => {
      const pr = createSafeEl('div', null, 'pool-row');
      pr.appendChild(createSafeEl('span', (it.emoji || '•') + ' ' + it.name, null));
      const btnGroup = createSafeEl('div', null, 'tier-btn-group');
      tierDefs.forEach((t) => {
        const b = createSafeEl('button', t, 'tier-assign-btn' + (tierMap[it.id] === t ? ' selected' : ''));
        b.type = 'button';
        b.addEventListener('click', () => {
          window.VibeAudio.tap();
          if (!window.VibeState.data.tiers[topic.id]) window.VibeState.data.tiers[topic.id] = {};
          window.VibeState.data.tiers[topic.id][it.id] = window.VibeState.data.tiers[topic.id][it.id] === t ? null : t;
          window.VibeState.save();
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
    wrap.textContent = '';
    window.VibeGenAI.TRENDING_PACKS.forEach((pack) => {
      const btn = createSafeEl('button', pack.label, 'topic-pill');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        const copyPack = { ...pack, id: pack.id + '-' + Date.now() };
        window.VibeState.addTopic(copyPack);
        renderAll();
        document.querySelector('.nav-tab[data-tab="arena"]').click();
        showToast('Loaded "' + pack.title + '"!');
      });
      wrap.appendChild(btn);
    });
  }

  function refreshPosterCanvas() {
    const canvas = document.getElementById('posterCanvas');
    const topic = window.VibeState.getActiveTopic();
    const bracket = window.VibeState.getActiveBracket();
    const tierMap = window.VibeState.data.tiers[topic.id] || {};
    window.VibePoster.render(canvas, topic, bracket, tierMap, {
      theme: window.VibeState.data.posterTheme,
      handle: window.VibeState.data.userHandle,
      photoImg: cachedPhotoImg
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
    const b = window.VibeState.getActiveBracket();
    if (b.champion) return;

    const round = b.rounds[b.currentRoundIdx];
    const match = round[b.currentMatchIdx];
    const winner = side === 'left' ? match.left : match.right;
    const loser = side === 'left' ? match.right : match.left;

    b.history.push({ roundIdx: b.currentRoundIdx, matchIdx: b.currentMatchIdx, side });
    match.winner = winner;
    window.AppLogger.info('Advanced "' + winner.name + '" over "' + loser.name + '"');

    if (round.length === 2) {
      b.semifinalists.push(loser);
    } else if (round.length === 1) {
      b.runnerUp = loser;
      b.champion = winner;
      window.VibeAudio.win();
      window.VibeState.save();
      renderAll();
      showToast('Champion Crowned: ' + winner.name + '!');
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
    showToast('Bracket restarted.');
  });

  document.getElementById('btnToggleSfx').addEventListener('click', (e) => {
    const on = window.VibeAudio.toggle();
    e.target.textContent = on ? 'SFX: ON' : 'SFX: OFF';
  });

  document.getElementById('btnGoPoster').addEventListener('click', () => {
    document.querySelector('.nav-tab[data-tab="poster"]').click();
  });

  function buildCaptionText() {
    const topic = window.VibeState.getActiveTopic();
    const b = window.VibeState.getActiveBracket();
    if (!b.champion) return 'Playing "' + topic.title + '" on VibeBracket Arena by Hustle!';
    return '👑 My "' + topic.title + '" Champion: ' + b.champion.name + ' (Runner-up: ' + (b.runnerUp ? b.runnerUp.name : '—') + ') — Built on VibeBracket Arena by Hustle!';
  }

  document.getElementById('btnCopySummary').addEventListener('click', () => copyTextSafe(buildCaptionText(), 'Results copied!'));
  document.getElementById('btnCopyShareText').addEventListener('click', () => copyTextSafe(buildCaptionText(), 'Viral caption copied!'));

  document.getElementById('btnDownloadPoster').addEventListener('click', () => {
    refreshPosterCanvas();
    const link = document.createElement('a');
    link.download = 'VibeBracket_Poster_Hustle.png';
    link.href = document.getElementById('posterCanvas').toDataURL('image/png');
    link.click();
    showToast('1080×1350 Poster PNG downloaded!');
  });

  document.getElementById('posterThemeSelect').addEventListener('change', (e) => {
    window.VibeState.data.posterTheme = e.target.value;
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
        showToast('Photo baked into Winner Poster!');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnClearPhoto').addEventListener('click', () => {
    cachedPhotoImg = null;
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
    btn.textContent = 'Generating...';
    try {
      const topicObj = await window.VibeGenAI.generateTopic(promptVal, keyVal, modelVal);
      window.VibeState.addTopic(topicObj);
      renderAll();
      document.querySelector('.nav-tab[data-tab="arena"]').click();
      showToast('AI Bracket "' + topicObj.title + '" ready!');
    } catch (err) {
      showToast(err.message || 'Could not generate AI bracket.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate AI Bracket';
    }
  });

  document.getElementById('createBracketForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('customTitle').value.trim();
    const size = Number(document.getElementById('customSize').value);
    const lines = document.getElementById('customItems').value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== size) {
      showToast('Enter exactly ' + size + ' contenders (currently ' + lines.length + ').');
      return;
    }
    window.VibeState.addTopic({
      id: 'custom-' + Date.now(),
      title,
      subtitle: 'Custom ' + size + '-contender tournament',
      items: lines.map((name, idx) => ({ id: 'c' + idx, name, tag: 'Seed #' + (idx + 1), emoji: '🎯' }))
    });
    renderAll();
    document.querySelector('.nav-tab[data-tab="arena"]').click();
    showToast('Launched "' + title + '"!');
  });

  document.getElementById('btnExportBracketLink').addEventListener('click', () => {
    const topic = window.VibeState.getActiveTopic();
    const encoded = encodeURIComponent(btoa(JSON.stringify(topic)));
    copyTextSafe(window.location.origin + window.location.pathname + '#b=' + encoded, 'Shareable bracket link copied!');
  });

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

  document.getElementById('btnOpenPro').addEventListener('click', () => {
    openModal('VibeBracket Creator Pro ($9.99/mo or $79/yr)', [
      'Free Tier includes unlimited 8/16-contender brackets, live Bracket Tree, Tier-List mode, 1-Click Trending AI Packs, and Photo-Baked PNG Posters.',
      'Creator Pro unlocks 64-contender mega-brackets, managed AI topic generation credits, custom brand watermarks, and audience sentiment analytics.'
    ]);
  });

  document.getElementById('btnOpenLegal').addEventListener('click', () => {
    openModal('Terms, Privacy & Anti-Harassment Policy', [
      'Hustle Software Labs Ltd. operates under: "Make money, Legally, NEVER HARM ANY HUMAN."',
      'Privacy Guarantee: Uploaded photos, brackets, and BYOK API keys are processed 100% locally in your browser.',
      'Anti-Harassment Rule: Custom brackets are restricted to public media, topics, food, and ideas—never private individuals.'
    ]);
  });

  document.getElementById('btnCloseModal').addEventListener('click', () => document.getElementById('modalBackdrop').classList.remove('open'));
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') document.getElementById('modalBackdrop').classList.remove('open');
  });

  // Boot
  window.VibeState.load();
  document.getElementById('brandVersionLabel').textContent = 'by Hustle · v' + window.VibeVersion.VERSION;
  document.getElementById('posterThemeSelect').value = window.VibeState.data.posterTheme || 'cyber';
  document.getElementById('posterHandleInput').value = window.VibeState.data.userHandle || '';
  renderAiPacks();
  renderAll();
  window.AppLogger.info('VibeBracket Arena v' + window.VibeVersion.VERSION + ' (' + window.VibeVersion.BUILD_ID + ') ready.');
})();
