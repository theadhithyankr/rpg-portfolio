// =========================================================
//  world-ui.js — HUD, dialog, AI chat, building overlay,
//  touch controls, mode-toggle. Vanilla JS.
// =========================================================

(function () {
  const E = window.WorldEngine;
  const W = window.WORLD;
  const P = window.PORTFOLIO_DATA;

  // ─── HUD updates ───
  const hudCoins = document.getElementById('hud-coins');
  const hudClock = document.getElementById('hud-clock');
  setInterval(() => {
    const st = E.getState();
    hudCoins.textContent = '◆ ' + st.coins;
    const t = st.time;
    let phase = '☀ DAY', col = '#fffba8';
    if (t < 0.1)       { phase = '◐ DAWN';  col = '#f0a8d0'; }
    else if (t < 0.4)  { phase = '☀ DAY';   col = '#fffba8'; }
    else if (t < 0.55) { phase = '◑ DUSK';  col = '#ff8050'; }
    else if (t < 0.9)  { phase = '☾ NIGHT'; col = '#a890f0'; }
    else               { phase = '◐ DAWN';  col = '#f0a8d0'; }
    hudClock.textContent = phase;
    hudClock.style.color = col;
  }, 250);

  // ─── Dialog overlay ───
  const dlg = document.getElementById('dialog');
  const dlgName = document.getElementById('dialog-name');
  const dlgTag = document.getElementById('dialog-tag');
  const dlgAvatar = document.getElementById('dialog-avatar');
  const dlgText = document.getElementById('dialog-text');
  const dlgInputRow = document.getElementById('dialog-input-row');
  const dlgInput = document.getElementById('dialog-input');
  const dlgSend = document.getElementById('dialog-send');
  const dlgClose = document.getElementById('dialog-close');
  const dlgHints = document.getElementById('dialog-hints');

  // ─── Groq AI config ───
  const GROQ_MODEL = 'llama-3.3-70b-versatile';
  function groqFetch(body) {
    return fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  const npcHistory   = new Map(); // npc.id → [{role, content}, ...]

  let typewriterTimer = null;
  let currentNPC = null;

  function showDialog() {
    dlg.classList.add('show');
    E.setInputBlocked(true);
  }
  function hideDialog() {
    dlg.classList.remove('show');
    E.setInputBlocked(false);
    if (typewriterTimer) { clearTimeout(typewriterTimer); typewriterTimer = null; }
    currentNPC = null;
    dlgInputRow.classList.remove('show');
    const tp = document.getElementById('dialog-target-picker');
    if (tp) { tp.classList.remove('show'); tp.innerHTML = ''; }
    dlgInput.value = '';
    // always re-enable inputs so the next dialog works
    dlgInput.disabled = false;
    dlgSend.disabled = false;
    const provBtn = document.getElementById('dialog-provoke');
    if (provBtn) provBtn.disabled = false;
    if (window.SFX) window.SFX.back();
  }

  function typewrite(text, onDone) {
    if (typewriterTimer) clearTimeout(typewriterTimer);
    dlgText.textContent = '';
    let i = 0;
    function step() {
      if (i < text.length) {
        dlgText.textContent = text.slice(0, i + 1);
        if (i % 2 === 0 && text[i] && text[i] !== ' ' && window.SFX) window.SFX.text();
        i++;
        typewriterTimer = setTimeout(step, 22);
      } else {
        typewriterTimer = null;
        onDone && onDone();
      }
    }
    step();
  }

  function npcAvatarSwatch(npc) {
    // tiny pixel sprite for the dialog header
    const s = npc.sprite || {};
    dlgAvatar.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 12 14');
    svg.setAttribute('width', '56');
    svg.setAttribute('height', '64');
    svg.style.imageRendering = 'pixelated';
    svg.style.shapeRendering = 'crispEdges';
    function rect(x, y, w, h, c) { const r = document.createElementNS(svgNS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('fill', c); svg.appendChild(r); }
    // background
    rect(0, 0, 12, 14, '#1a1a3a');
    // shoulders / shirt
    rect(2, 7, 8, 6, s.top || '#f0a8d0');
    if (s.cape) rect(1, 7, 10, 6, '#101018');
    // neck
    rect(5, 6, 2, 1, s.skin || '#e8c2a0');
    // head
    rect(3, 2, 6, 5, s.skin || '#e8c2a0');
    // hair
    rect(2, 1, 8, 3, s.hair || '#5a3a1a');
    // beard
    if (s.beard) rect(3, 4, 6, 4, '#f0f0f0');
    // eyes
    rect(4, 4, 1, 1, '#000');
    rect(7, 4, 1, 1, '#000');
    dlgAvatar.appendChild(svg);
  }

  // ─── NPC dialog with AI chat ───
  function openNPC(npc) {
    currentNPC = npc;
    dlgName.textContent = npc.name;
    dlgTag.textContent = npc.tag || '';
    npcAvatarSwatch(npc);
    showDialog();
    typewrite(npc.greeting, () => {
      dlgInputRow.classList.add('show');
      dlgHints.innerHTML = 'Ask anything · <span class="kbd">↵</span> send · <span class="kbd">ESC</span> close';
      dlgInput.focus();
    });
  }

  async function sendAIMessage(msg) {
    if (!currentNPC) return;
    const npc = currentNPC;
    dlgInput.disabled = true;
    dlgSend.disabled = true;
    dlgHints.textContent = 'Thinking...';
    dlgText.textContent = '...';

    if (!npcHistory.has(npc.id)) npcHistory.set(npc.id, []);
    const history = npcHistory.get(npc.id);
    history.push({ role: 'user', content: msg });

    const systemPrompt =
      `This is a fictional 8-bit village inside the portfolio of ADHITHYAN K R, ` +
      `a Software Engineer skilled in Phaser 3, React, Next.js, React Native, Flutter. ` +
      `If asked about Adhithyan, stay relevant to his actual skills. ` +
      `Never name real movies, comics, or franchises.\n\n` +
      npc.personality + `\n\n` +
      `IMPORTANT: If the player's message is clearly provoking you into attacking or fighting ` +
      `another character, respond in character and add [FIGHT] at the very end of your reply — ` +
      `nothing after it. Otherwise do NOT include [FIGHT].`;

    try {
      const res = await groqFetch({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        max_tokens: 120,
        temperature: npc.temperature ?? 0.85,
      });
      const data = await res.json();
      let raw = (data.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '')
        || npc.lines[Math.floor(Math.random() * npc.lines.length)];

      const fightTriggered = raw.includes('[FIGHT]');
      const reply = raw.replace('[FIGHT]', '').trim();

      history.push({ role: 'assistant', content: reply });

      if (fightTriggered) {
        typewrite(reply, () => {
          dlgInput.disabled = false;
          dlgSend.disabled = false;
          setTimeout(() => {
            hideDialog();
            window.WorldEngine.triggerCombat(npc.id);
          }, 800);
        });
        return;
      }

      typewrite(reply, () => {
        dlgInput.disabled = false;
        dlgSend.disabled = false;
        dlgHints.innerHTML = 'Ask anything · <span class="kbd">↵</span> send · <span class="kbd">ESC</span> close';
        dlgInput.focus();
      });
    } catch (e) {
      history.pop();
      const fb = npc.lines[Math.floor(Math.random() * npc.lines.length)];
      typewrite(fb, () => {
        dlgInput.disabled = false;
        dlgSend.disabled = false;
        dlgHints.innerHTML = 'Groq offline — using canned lines';
        dlgInput.focus();
      });
    }
  }

  dlgSend.addEventListener('click', () => {
    const v = dlgInput.value.trim();
    if (!v) return;
    dlgInput.value = '';
    sendAIMessage(v);
  });
  dlgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); dlgSend.click(); }
    if (e.key === 'Escape') { e.preventDefault(); hideDialog(); }
    e.stopPropagation();
  });
  dlgClose.addEventListener('click', hideDialog);

  // ─── Battle log ───
  const battleLog     = document.getElementById('battle-log');
  const battleLogTitle = document.getElementById('battle-log-title');
  const battleLogBody  = document.getElementById('battle-log-body');
  document.getElementById('battle-log-close').addEventListener('click', () => battleLog.classList.remove('show'));

  function showBattleLog(attackerData, targetData) {
    battleLogTitle.textContent = `⚔ ${attackerData.name} vs ${targetData.name}`;
    battleLogBody.innerHTML = '<span class="bl-thinking">Generating battle...</span>';
    battleLog.classList.add('show');

    const winner = Math.random() < 0.5 ? attackerData : targetData;
    const loser  = winner === attackerData ? targetData : attackerData;

    const fightPrompt =
      `Write a dramatic 5-move battle between two characters in a retro 8-bit pixel-art village game.\n` +
      `Character A — ${attackerData.name}: ${attackerData.personality.slice(0, 140)}\n` +
      `Character B — ${targetData.name}: ${targetData.personality.slice(0, 140)}\n` +
      `${winner.name} wins.\n\n` +
      `Rules: Each move is ONE punchy sentence (max 12 words). Reference their specific abilities, gadgets, or powers. ` +
      `Be dramatic and vivid. Alternate attacker and defender. No real franchise names.\n` +
      `Format EXACTLY — no extra text, no headers, just these 6 lines:\n` +
      `MOVE 1: [sentence]\n` +
      `MOVE 2: [sentence]\n` +
      `MOVE 3: [sentence]\n` +
      `MOVE 4: [sentence]\n` +
      `MOVE 5: [sentence]\n` +
      `WINNER: ${winner.name} WINS!`;

    groqFetch({ model: GROQ_MODEL, messages: [{ role: 'user', content: fightPrompt }], max_tokens: 200, temperature: 0.95 })
      .then((r) => r.json())
      .then((data) => {
        const text = (data.choices?.[0]?.message?.content || '').trim();
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        battleLogBody.innerHTML = '';
        lines.forEach((line, i) => {
          setTimeout(() => {
            const isWinner = line.toUpperCase().startsWith('WINNER');
            const el = document.createElement('span');
            el.className = isWinner ? 'bl-winner' : 'bl-move';
            el.textContent = line;
            battleLogBody.appendChild(el);
            battleLogBody.appendChild(document.createElement('br'));
            if (window.SFX) window.SFX.text();
          }, i * 1600);
        });
        // auto-close after all lines shown
        setTimeout(() => battleLog.classList.remove('show'), lines.length * 1600 + 4000);
      })
      .catch(() => {
        battleLogBody.innerHTML = `<span class="bl-winner">${winner.name} WINS! (narration offline)</span>`;
        setTimeout(() => battleLog.classList.remove('show'), 4000);
      });
  }

  // ─── Target picker ───
  const dlgTargetPicker = document.getElementById('dialog-target-picker');

  function openTargetPicker(npc) {
    const others = window.WorldEngine.getNPCs().filter((n) => n.id !== npc.id && n.combatState === 'idle');
    dlgText.textContent = `⚔ WHO SHOULD ${npc.name} FACE?`;
    dlgInputRow.classList.remove('show');
    dlgHints.textContent = 'Choose a target to send them after.';
    dlgTargetPicker.innerHTML = '<span class="tp-label">SELECT TARGET ↓</span>';
    dlgTargetPicker.classList.add('show');

    others.forEach((other) => {
      const btn = document.createElement('button');
      btn.className = 'tp-btn';
      btn.textContent = other.name;
      btn.addEventListener('click', () => {
        dlgTargetPicker.classList.remove('show');
        dlgTargetPicker.innerHTML = '';

        const result = window.WorldEngine.triggerCombat(npc.id, other.id);
        if (!result) { typewrite('Target is already in a fight!', () => {}); return; }

        // Full NPC objects for narration (grab personalities from current scene)
        const allNPCs = window.WORLD.scenes?.overworld?.npcs || window.WORLD.npcs || [];
        const attackerFull = allNPCs.find((n) => n.id === result.attackerId) || { name: result.attackerName, personality: '' };
        const targetFull   = allNPCs.find((n) => n.id === result.targetId)   || { name: result.targetName,   personality: '' };

        const cries = [
          `That's it — ${result.targetName}, you are DONE!`,
          `I'm coming for YOU, ${result.targetName}!`,
          `Right. Last straw. ${result.targetName}!`,
          `${result.attackerName} has had ENOUGH — watch out, ${result.targetName}!`,
        ];
        typewrite(cries[Math.floor(Math.random() * cries.length)], () => {
          setTimeout(() => {
            hideDialog();
            showBattleLog(attackerFull, targetFull);
          }, 700);
        });
      });
      dlgTargetPicker.appendChild(btn);
    });

    const cancel = document.createElement('button');
    cancel.className = 'tp-btn tp-cancel'; cancel.textContent = '↩ CANCEL';
    cancel.addEventListener('click', () => {
      dlgTargetPicker.classList.remove('show');
      dlgTargetPicker.innerHTML = '';
      dlgText.textContent = npc.greeting;
      dlgInputRow.classList.add('show');
      dlgHints.innerHTML = 'Ask anything · <span class="kbd">↵</span> send · <span class="kbd">ESC</span> close';
    });
    dlgTargetPicker.appendChild(cancel);
  }

  const dlgProvoke = document.getElementById('dialog-provoke');
  dlgProvoke.addEventListener('click', () => {
    if (!currentNPC) return;
    openTargetPicker(currentNPC);
  });

  // ESC closes dialog from anywhere
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dlg.classList.contains('show')) {
      e.preventDefault();
      hideDialog();
    }
  });

  // ─── Sign dialog ───
  function openSign(text) {
    currentNPC = null;
    dlgName.textContent = 'WOODEN SIGN';
    dlgTag.textContent = 'Carved letters';
    dlgAvatar.innerHTML = '<div style="width:56px;height:64px;background:#6a4a22;display:grid;place-items:center;color:#fffba8;font-family:\'Press Start 2P\',monospace;font-size:18px;border:3px solid #fffba8;">▌</div>';
    showDialog();
    typewrite(text, () => {
      dlgHints.innerHTML = '<span class="kbd">ESC</span> close';
    });
    dlgInputRow.classList.remove('show');
  }

  // ─── Building entry overlay ───
  const sheet = document.getElementById('building-sheet');
  const sheetTitle = document.getElementById('sheet-title');
  const sheetBody = document.getElementById('sheet-body');
  const sheetClose = document.getElementById('sheet-close');

  function showSheet(title, html) {
    sheetTitle.textContent = title;
    sheetBody.innerHTML = html;
    sheet.classList.add('show');
    E.setInputBlocked(true);
  }
  function hideSheet() {
    sheet.classList.remove('show');
    E.setInputBlocked(false);
    if (window.SFX) window.SFX.back();
  }
  sheetClose.addEventListener('click', hideSheet);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('show')) {
      e.preventDefault();
      hideSheet();
    }
  });

  // ─── Building content renderers ───
  function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function chip(label, klass) { return `<span class="chip ${klass || ''}">${esc(label)}</span>`; }
  function bar(label, val, max, color) {
    const pct = Math.max(0, Math.min(100, (val / max) * 100));
    return `<div class="meter"><div class="meter-h"><span>${label}</span><span>${val}/${max}</span></div><div class="bar"><div class="bar-fill ${color}" style="width:${pct}%"></div></div></div>`;
  }

  function renderBuilding(b) {
    switch (b.action) {
      case 'stats': return renderStats();
      case 'skills': return renderSkills();
      case 'quests': return renderQuests();
      case 'items': return renderProjects();
      case 'records': return renderRecords();
      case 'talk': return renderContact();
      case 'game': return renderArcade();
      default: return '<p>An empty room. Whistling wind.</p>';
    }
  }

  function renderStats() {
    const p = P.player;
    let html = `<div class="sheet-row">
      <div class="sheet-avatar">${pixelAvatarHTML('AK')}</div>
      <div>
        <div class="sheet-h1">${esc(p.name)}</div>
        <div class="sheet-h2">${esc(p.class)} · ${esc(p.subclass)}</div>
        <div class="chip-row">${chip('LV ' + p.level, 'yellow')}${chip(p.location, 'cyan')}${chip('FOUNDER', 'pink')}</div>
      </div></div>`;
    html += `<div class="meters">${bar('HP', p.hp, p.hpMax, 'good')}${bar('MP', p.mp, p.mpMax, 'purple')}${bar('XP', p.xp, p.xpMax, 'pink')}</div>`;
    html += `<div class="win">► ${esc(p.tagline)}</div>`;
    html += `<div class="sheet-h3">CORE STATS</div><div class="stats-grid">`;
    P.stats.forEach((s) => {
      html += `<div class="stat-row">
        <div class="stat-row-h"><span>${esc(s.key)} · ${esc(s.name)}</span><span class="stat-val">${s.value}</span></div>
        <div class="bar"><div class="bar-fill ${s.color}" style="width:${s.value}%"></div></div>
        <div class="stat-note">${esc(s.note)}</div>
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  function renderSkills() {
    let html = '<div class="skills-grid">';
    P.skills.forEach((g) => {
      html += `<div class="card"><div class="card-h"><span class="card-glyph">${esc(g.icon)}</span><span class="card-title">${esc(g.group)}</span></div>`;
      g.items.forEach((s) => {
        const stars = '★'.repeat(s.lvl) + '☆'.repeat(5 - s.lvl);
        html += `<div class="row-line"><span>${esc(s.name)}</span><span class="stars">${stars}</span></div>`;
      });
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderQuests() {
    let html = '';
    P.quests.forEach((q) => {
      html += `<div class="card">
        <div class="card-h">
          <div><div class="sheet-h2">${esc(q.title)}</div><div class="sheet-h3 dim">${esc(q.org)}</div></div>
          <div class="chip-col">${chip(q.status, 'yellow')}<span class="dim">${esc(q.period)}</span></div>
        </div>
        <div class="chip-row">${chip(q.role, 'pink')}${chip('+ ' + q.xp + ' XP', 'cyan')}</div>
        <div class="win">► ${esc(q.summary)}</div>
        <div class="sheet-h3">▼ OBJECTIVES</div>
        <ul class="bullets">`;
      q.bullets.forEach((b) => {
        html += `<li><span class="check">✓</span><b>${esc(b.tag)}</b> — ${esc(b.text)}</li>`;
      });
      html += '</ul></div>';
    });
    return html;
  }

  function renderProjects() {
    let html = '<div class="projects-grid">';
    P.projects.forEach((p) => {
      html += `<div class="card project-card">
        <div class="card-h">
          <span class="proj-glyph" style="background:var(--${chipColor(p.color)})">${esc(p.glyph)}</span>
          <span class="chip ${p.color}">${esc(p.rarity)}</span>
        </div>
        <div class="card-title">${esc(p.name)}</div>
        <div class="dim">${esc(p.stack)}</div>
        <div class="tagline">${esc(p.tagline)}</div>
        <div class="proj-stats">${p.stats.map(s => `<div class="proj-stat"><div class="proj-stat-k">${esc(s.k)}</div><div class="proj-stat-v">${esc(s.v)}</div></div>`).join('')}</div>
        <ul class="bullets">${p.details.map(d => `<li><span class="check">►</span>${esc(d)}</li>`).join('')}</ul>
        ${p.url ? `<a href="${p.url}" target="_blank" rel="noreferrer" class="repo-btn">◇ VIEW REPO</a>` : ''}
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function renderRecords() {
    let html = '<div class="sheet-h3">EDUCATION</div>';
    P.records.education.forEach((e) => {
      html += `<div class="win"><div class="sheet-h2">${esc(e.school)}</div><div>${esc(e.degree)}</div><div class="dim row-sb"><span>${esc(e.location)}</span><span>${esc(e.period)}</span></div></div>`;
    });
    html += '<div class="sheet-h3">ACHIEVEMENTS</div><div class="ach-grid">';
    P.records.achievements.forEach((a) => {
      html += `<div class="ach"><div class="ach-icon">♛</div><div><div class="ach-title">${esc(a.title)}</div><div>${esc(a.body)}</div></div></div>`;
    });
    html += '</div>';
    return html;
  }

  function renderContact() {
    const c = P.contact;
    let html = `<div class="win">► ${esc(c.intro)}</div><div class="contact-grid">`;
    c.lines.forEach((l) => {
      html += `<a class="contact-card" href="${l.href}" target="_blank" rel="noreferrer">
        <div class="contact-glyph">${esc(l.glyph)}</div>
        <div><div class="dim">${esc(l.kind)}</div><div>${esc(l.label)}</div></div>
      </a>`;
    });
    html += `</div><div class="win"><b style="color:var(--good)">● OPEN TO WORK</b> — freelance, contract, full-time.</div>`;
    return html;
  }

  function renderArcade() {
    return `<div class="arcade-wrap">
      <p class="dim">SlotForge Demo — load the menu-mode portfolio to play the full mini-game.</p>
      <a class="repo-btn" href="index.html?mode=mini">▶ OPEN ARCADE</a>
    </div>`;
  }

  function chipColor(c) {
    return c === 'yellow' ? 'highlight' : c === 'cyan' ? 'accent' : c === 'pink' ? 'primary' : c === 'good' ? 'good' : 'secondary';
  }

  function pixelAvatarHTML(initials) {
    return `<svg viewBox="0 0 16 16" width="80" height="80" style="image-rendering:pixelated;shape-rendering:crispEdges">
      <rect width="16" height="16" fill="#2a2a5a"/>
      <rect x="4" y="2" width="8" height="2" fill="#a890f0"/>
      <rect x="3" y="3" width="10" height="2" fill="#a890f0"/>
      <rect x="4" y="4" width="8" height="5" fill="#fffba8"/>
      <rect x="6" y="6" width="1" height="1" fill="#0e0e25"/>
      <rect x="9" y="6" width="1" height="1" fill="#0e0e25"/>
      <rect x="7" y="8" width="2" height="1" fill="#0e0e25"/>
      <rect x="3" y="10" width="10" height="6" fill="#f0a8d0"/>
      <rect x="6" y="12" width="4" height="2" fill="#0e0e25"/>
      <text x="14" y="15" font-family="'Press Start 2P', monospace" font-size="3" fill="#fffba8" text-anchor="end">${initials}</text>
    </svg>`;
  }

  // ─── AI free thoughts ───
  function triggerFreeThought() {
    const npcs = window.WorldEngine.getNPCs().filter((n) => n.combatState === 'idle');
    if (!npcs.length) return;
    const npc = npcs[Math.floor(Math.random() * npcs.length)];
    const allNPCs = window.WORLD.scenes?.overworld?.npcs || window.WORLD.npcs || [];
    const full = allNPCs.find((n) => n.id === npc.id);
    if (!full) return;

    const thoughtPrompt =
      `You are ${full.name}. ${full.personality.slice(0, 160)} ` +
      `Generate ONE brief thought you might mutter to yourself right now — curious, funny, moody, or strange. ` +
      `Max 9 words. No quotes. No franchise names. Raw thought only.`;

    groqFetch({ model: GROQ_MODEL, messages: [{ role: 'user', content: thoughtPrompt }], max_tokens: 40, temperature: 0.98 })
      .then((r) => r.json())
      .then((data) => {
        const thought = (data.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '');
        if (!thought) return;
        window.WorldEngine.setNPCSpeakBubble(npc.id, thought, 5500);
        // Also surface in the overheard log
        npcChatLog.innerHTML =
          `<div class="log-label">💭 THOUGHT</div>` +
          `<div class="log-line"><span class="log-name">${npc.name}:</span> "${thought}"</div>`;
        npcChatLog.classList.add('show');
        clearTimeout(chatLogTimer);
        chatLogTimer = setTimeout(() => npcChatLog.classList.remove('show'), 7000);
      })
      .catch(() => {});
  }

  // Fire a free thought every 20-50 seconds (random jitter)
  (function scheduleThought() {
    const delay = 20000 + Math.random() * 30000;
    setTimeout(() => { triggerFreeThought(); scheduleThought(); }, delay);
  })();

  // ─── Wire engine interactions ───
  let returnToOverworld = null; // { x, y } overworld door position to return to

  E.setOnInteract((ev) => {
    if (ev.kind === 'npc') {
      // Check quest item return first
      const q = window.WORLD.quests || {};
      let returnedQuest = null;
      for (const [qid, qdef] of Object.entries(q)) {
        if (qid === ev.npc.id && E.hasQuestItem(qid)) {
          returnedQuest = { qid, qdef };
          break;
        }
      }
      if (returnedQuest) openQuestReturn(ev.npc, returnedQuest.qid, returnedQuest.qdef);
      else openNPC(ev.npc);
    } else if (ev.kind === 'sign') {
      openSign(ev.text);
    } else if (ev.kind === 'building') {
      const sceneId = window.WORLD.buildingToScene && window.WORLD.buildingToScene[ev.building.id];
      if (sceneId && window.WORLD.scenes[sceneId]) {
        // store the overworld door position to return to
        returnToOverworld = { x: ev.building.door.x, y: ev.building.door.y + 1 };
        E.loadScene(sceneId, null, 'up');
      } else {
        // fallback: show sheet
        showSheet(ev.building.name, renderBuilding(ev.building));
      }
    } else if (ev.kind === 'exit') {
      // returning to overworld at remembered door position
      const back = returnToOverworld || window.WORLD.scenes.overworld.spawn;
      E.loadScene('overworld', back, 'down');
      returnToOverworld = null;
    }
  });

  E.setOnPickup(({ type, total, questId, itemType }) => {
    const t = document.getElementById('toast');
    if (type === 'quest') {
      const q = (window.WORLD.quests || {})[questId];
      t.innerHTML = '★ FOUND: <b>' + (q?.itemName || questId) + '</b>';
    } else if (type === 'reward') {
      t.innerHTML = '+ COINS  →  ' + total;
    } else {
      t.textContent = '+ ' + (type === 'gem' ? 'gem' : type === 'potion' ? 'potion' : 'coin') + '  →  ' + total;
    }
    t.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
    updateQuestHUD();
  });

  // ─── NPC-NPC spontaneous conversations ───
  const npcChatLog = document.getElementById('npc-chat-log');
  let chatLogTimer = null;

  function showNPCChatLog(name1, line1, name2, line2) {
    npcChatLog.innerHTML =
      `<div class="log-label">◉ OVERHEARD</div>` +
      `<div class="log-line"><span class="log-name">${name1}:</span> "${line1}"</div>` +
      `<div class="log-line"><span class="log-name">${name2}:</span> "${line2}"</div>`;
    npcChatLog.classList.add('show');
    clearTimeout(chatLogTimer);
    chatLogTimer = setTimeout(() => npcChatLog.classList.remove('show'), 9000);
  }

  E.setOnNPCConvoRequest(async (npc1, npc2) => {
    try {
      const p1 = npc1.personality ? npc1.personality.slice(0, 130) : npc1.tag;
      const p2 = npc2.personality ? npc2.personality.slice(0, 130) : npc2.tag;
      const prompt =
        `${npc1.name} (${p1}) bumps into ${npc2.name} (${p2}) in a village. ` +
        `Write a spontaneous 2-line exchange. Format EXACTLY:\n` +
        `${npc1.name}: <one short sentence>\n${npc2.name}: <one short sentence>\n` +
        `Stay in character. No real franchise names. Each line max 10 words.`;
      const res = await groqFetch({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 90, temperature: 0.92,
      });
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || '').trim();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const line1 = lines[0].replace(/^[^:]+:\s*/, '').replace(/^["']|["']$/g, '');
        const line2 = lines[1].replace(/^[^:]+:\s*/, '').replace(/^["']|["']$/g, '');
        const tNow = performance.now();
        npc1.speakBubble = { text: line1, until: tNow + 5500 };
        setTimeout(() => { npc2.speakBubble = { text: line2, until: performance.now() + 5500 }; }, 2800);
        showNPCChatLog(npc1.name, line1, npc2.name, line2);
      }
    } catch (_) {
      // silently reset locks so they can try again later
      npc1.convoLock = 0; npc2.convoLock = 0;
    }
  });

  // Quest return dialog
  function openQuestReturn(npc, qid, qdef) {
    currentNPC = null;
    dlgName.textContent = npc.name;
    dlgTag.textContent = npc.tag || '';
    npcAvatarSwatch(npc);
    showDialog();
    dlgInputRow.classList.remove('show');
    typewrite(qdef.acceptLine, () => {
      dlgHints.innerHTML = '<span class="kbd">ESC</span> close';
    });
    // give reward
    E.consumeQuestItem(qid);
    if (qdef.reward && qdef.reward.coins) E.addCoins(qdef.reward.coins);
    if (window.SFX) window.SFX.levelup();
    updateQuestHUD();
  }

  // Quest HUD
  const hudQuest = document.getElementById('hud-quest');
  function updateQuestHUD() {
    const st = E.getState();
    const held = st.questInventory.length;
    const done = st.completedQuests.length;
    if (held === 0 && done === 0) {
      hudQuest.style.display = 'none';
      return;
    }
    hudQuest.style.display = 'inline-flex';
    let html = '<span class="lbl">QUEST</span>';
    if (held > 0) {
      const names = st.questInventory.map((qid) => {
        const q = (window.WORLD.quests || {})[qid];
        return q ? q.itemName : qid;
      }).join(' · ');
      html += '<span style="color:var(--highlight)">' + held + ' held</span>';
    }
    if (done > 0) {
      html += '<span style="color:var(--good)">✓ ' + done + '</span>';
    }
    hudQuest.innerHTML = html;
  }
  updateQuestHUD();

  // ─── Touch / D-pad ───
  function bindHold(el, dir) {
    const set = (v) => window.WorldInput.set(dir, v);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); set(true); }, { passive: false });
    el.addEventListener('touchend',   (e) => { e.preventDefault(); set(false); });
    el.addEventListener('touchcancel',(e) => { e.preventDefault(); set(false); });
    el.addEventListener('mousedown',  (e) => { e.preventDefault(); set(true); });
    el.addEventListener('mouseup',    (e) => { e.preventDefault(); set(false); });
    el.addEventListener('mouseleave', () => set(false));
  }
  bindHold(document.getElementById('dpad-up'),    'up');
  bindHold(document.getElementById('dpad-down'),  'down');
  bindHold(document.getElementById('dpad-left'),  'left');
  bindHold(document.getElementById('dpad-right'), 'right');

  document.getElementById('btn-action').addEventListener('click', () => window.WorldInput.interact());
  document.getElementById('btn-action').addEventListener('touchend', (e) => { e.preventDefault(); window.WorldInput.interact(); });

  // ─── Mode toggle button ───
  document.getElementById('mode-menu').addEventListener('click', () => {
    location.href = 'index.html';
  });

  // ─── Sound toggle ───
  const soundBtn = document.getElementById('sound-toggle');
  let soundOn = true;
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    if (window.SFX) window.SFX.setMuted(!soundOn);
    soundBtn.textContent = soundOn ? '♪ SFX ON' : 'SFX OFF';
    soundBtn.classList.toggle('off', !soundOn);
  });

  // ─── Intro toast ───
  setTimeout(() => {
    const t = document.getElementById('toast');
    t.innerHTML = 'WELCOME TO ADHITH-VILLAGE — explore, talk, enter buildings.';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 4000);
  }, 600);
})();
