// =========================================================
//  world-engine.js — canvas, render, input, loop, collision
//  Exposes window.WorldEngine
// =========================================================

(function () {
  const W = window.WORLD;
  const T = W.TILES;

  // ─── Palettes ───
  const PAL = {
    grass:   ['#3b6b3f', '#447a48', '#356238'],
    grass2:  '#5a8a5a',
    flower:  ['#f0a8d0', '#fffba8', '#78d8f8'],
    path:    '#a89878',
    pathEdge:'#8a7858',
    sand:    '#d6c08a',
    wood:    '#8a6a3a',
    woodLn:  '#6a4a22',
    carpet:  '#a85068',
    treeT:   '#1e4628',
    treeL:   '#2a6638',
    treeS:   '#4a3a20',
    bigTreeT:'#163a20',
    bigTreeL:'#1f5a32',
    bigTreeS:'#3a2a10',
    rock:    '#7a7a8a',
    rockS:   '#4a4a5a',
    bush:    '#356a3a',
    bushS:   '#234828',
    water:   '#2a5a98',
    waterH:  '#3a7ac0',
    wall:    '#5a4632',
    wallS:   '#3a2a1e',
    roof:    '#9a4632',
    roofS:   '#6a2a1e',
    door:    '#3a2a1a',
    doorH:   '#fffba8',
    lampPost:'#3a2a1a',
    lampGlow:'#fffba8',
    sign:    '#6a4a22',
    signTxt: '#fffba8',
    fence:   '#8a6a3a',
    mushR:   '#c83a3a',
    mushS:   '#e8d8a8',
    bridge:  '#a87a4a',
    gravel:  '#8a8a9a',
  };

  // ─── Canvas setup ───
  const canvas = document.getElementById('world-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let viewW = 0, viewH = 0, scale = 2;

  function fit() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    viewW = rect.width;
    viewH = rect.height;
    // pick scale so we see ~22 tiles wide on big screens, ~14 on small
    const target = Math.min(viewW, viewH) < 480 ? 13 : (viewW < 900 ? 16 : 22);
    scale = Math.max(1.6, viewW / (target * W.TILE));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  fit();
  window.addEventListener('resize', fit);

  // ─── World state ───
  const state = {
    px: W.spawn.x * W.TILE + W.TILE / 2,
    py: W.spawn.y * W.TILE + W.TILE / 2,
    pdir: 'down',
    pmoving: false,
    pframe: 0,
    pframet: 0,
    npcs: [],
    items: [],
    particles: [],
    pickedItems: new Set(),
    questInventory: new Set(),
    completedQuests: new Set(),
    sceneId: 'overworld',
    sceneStack: [], // for returning to outdoors with spawn pos
    time: 0,
    timeSpeed: 1 / 180000,
    inputBlocked: false,
    coins: 0,
    onInteract: null,
    onPickup: null,
  };

  // Initialize state.npcs/items from current scene
  function adoptScene(scene, spawnTile, fromDir) {
    W.map = scene.map;
    W.WORLD_W = scene.W;
    W.WORLD_H = scene.H;
    W.npcs = scene.npcs;
    W.items = scene.items;
    W.signTexts = scene.signTexts || {};
    W.buildings = scene.buildings || [];
    W.exits = scene.exits || {};
    W.currentSceneId = scene.id;
    state.sceneId = scene.id;
    state.outdoor = !!scene.outdoor;

    state.npcs = (scene.npcs || []).map((n) => ({
      ...n,
      cx: n.x * W.TILE + W.TILE / 2,
      cy: n.y * W.TILE + W.TILE / 2,
      anchorX: n.x, anchorY: n.y,
      dir: 'down',
      frame: 0, frameT: 0,
      walkUntil: 0, walkVx: 0, walkVy: 0, idleUntil: performance.now() + Math.random() * 2000,
      // combat & conversation state
      combatState: 'idle', combatTarget: null, team: null,
      hitFlash: 0, fightUntil: 0, fleeUntil: 0,
      lastSparkT: 0, lastHitT: 0,
      speakBubble: null, convoLock: 0, lastConvoCheck: 0,
    }));
    state.items = (scene.items || []).map((it) => ({
      ...it,
      picked: state.pickedItems.has(scene.id + ':' + it.id) || state.questInventory.has(it.questId) || state.completedQuests.has(it.questId),
    }));
    state.particles = [];

    if (spawnTile) {
      state.px = spawnTile.x * W.TILE + W.TILE / 2;
      state.py = spawnTile.y * W.TILE + W.TILE / 2;
    } else if (scene.spawn) {
      state.px = scene.spawn.x * W.TILE + W.TILE / 2;
      state.py = scene.spawn.y * W.TILE + W.TILE / 2;
    }
    state.pdir = fromDir || 'down';
  }
  adoptScene(W.scenes.overworld);

  // ─── Day/night ───
  // 0.0 dawn, 0.25 day, 0.5 dusk, 0.75 night, 1.0 dawn
  function dayNightOverlay() {
    if (!state.outdoor) return { darkness: 0, tint: [0, 0, 0] };
    const t = state.time;
    // smooth curve: light during 0.1..0.4 (day), dark during 0.55..0.9 (night)
    let darkness = 0;
    let tint = [0, 0, 0];
    if (t < 0.1)      { darkness = (0.1 - t) * 4;   tint = [40, 30, 80]; }  // dawn fading
    else if (t < 0.4) { darkness = 0; }                                     // full day
    else if (t < 0.55){ darkness = (t - 0.4) * 3;   tint = [80, 40, 30]; }  // dusk
    else if (t < 0.9) { darkness = 0.55;             tint = [10, 10, 50]; } // night
    else              { darkness = (1.0 - t) * 4;    tint = [40, 30, 80]; } // pre-dawn
    return { darkness: Math.min(0.55, Math.max(0, darkness)), tint };
  }

  // ─── Input ───
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (state.inputBlocked) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        // dialog handles these
        return;
      }
      return;
    }
    const k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(k)) e.preventDefault();
    keys[k] = true;
    if (k === 'e' || k === ' ' || k === 'enter') {
      tryInteract();
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  // Touch dpad bindings exposed
  const touchDir = { up: false, down: false, left: false, right: false };
  window.WorldInput = {
    set: (d, v) => { touchDir[d] = !!v; },
    interact: () => tryInteract(),
  };

  // ─── Collision / movement ───
  function tileAt(px, py) {
    const tx = Math.floor(px / W.TILE);
    const ty = Math.floor(py / W.TILE);
    if (tx < 0 || ty < 0 || tx >= W.WORLD_W || ty >= W.WORLD_H) return T.TREE;
    return W.map[ty][tx];
  }
  function solidAt(px, py) {
    return W.SOLID.has(tileAt(px, py));
  }
  function canMoveTo(px, py, hitW, hitH) {
    // check 4 corners of a small hit box (smaller than tile)
    const half = hitW / 2;
    const halfH = hitH / 2;
    return !solidAt(px - half + 1, py - halfH + 1)
        && !solidAt(px + half - 1, py - halfH + 1)
        && !solidAt(px - half + 1, py + halfH - 1)
        && !solidAt(px + half - 1, py + halfH - 1);
  }

  // ─── Sprite drawing (procedural pixel art) ───
  function drawHumanoid(g, cx, cy, dir, frame, sprite, flash) {
    // 12px wide, 18px tall sprite scaled by tileScale
    const s = sprite || { hair: '#5a3a1a', skin: '#d8b89a', top: '#f0a8d0', bottom: '#3a3aa8' };
    const px = Math.floor(cx) - 6;
    const py = Math.floor(cy) - 12;
    g.save();
    g.translate(px, py);
    // shadow
    g.fillStyle = 'rgba(0,0,0,0.32)';
    g.beginPath(); g.ellipse(6, 14, 5, 1.6, 0, 0, Math.PI * 2); g.fill();
    // legs (animate)
    const legSwap = frame === 1 ? 1 : 0;
    g.fillStyle = s.bottom;
    if (dir === 'left' || dir === 'right') {
      g.fillRect(3, 10 - legSwap, 2, 4);
      g.fillRect(7, 10 + legSwap, 2, 4);
    } else {
      g.fillRect(3 + legSwap, 10, 2, 4);
      g.fillRect(7 - legSwap, 10, 2, 4);
    }
    // body / shirt
    g.fillStyle = s.top;
    g.fillRect(2, 6, 8, 5);
    // belt
    g.fillStyle = '#222';
    g.fillRect(2, 10, 8, 1);
    // cape (if any)
    if (s.cape) {
      g.fillStyle = '#101018';
      if (dir === 'down') g.fillRect(2, 6, 8, 6);
      else if (dir === 'up') g.fillRect(2, 6, 8, 7);
      else if (dir === 'left') g.fillRect(5, 6, 5, 7);
      else g.fillRect(0, 6, 5, 7);
    }
    // head
    g.fillStyle = s.skin;
    g.fillRect(3, 1, 6, 5);
    // hair
    g.fillStyle = s.hair;
    g.fillRect(2, 0, 8, 3);
    if (dir === 'left')  g.fillRect(2, 0, 4, 4);
    if (dir === 'right') g.fillRect(6, 0, 4, 4);
    // beard
    if (s.beard) { g.fillStyle = '#f0f0f0'; g.fillRect(3, 4, 6, 4); }
    // eyes
    g.fillStyle = '#000';
    if (dir === 'down')  { g.fillRect(4, 3, 1, 1); g.fillRect(7, 3, 1, 1); }
    if (dir === 'left')  { g.fillRect(4, 3, 1, 1); }
    if (dir === 'right') { g.fillRect(7, 3, 1, 1); }
    if (dir === 'up')    { /* hair covers eyes */ }
    g.restore();
    // hit-flash white silhouette
    if (flash) {
      g.save();
      g.translate(Math.floor(cx) - 6, Math.floor(cy) - 12);
      g.globalAlpha = 0.72;
      g.fillStyle = '#ffffff';
      g.fillRect(3, 1, 6, 13); // head + body
      g.fillRect(3, 10, 2, 4); g.fillRect(7, 10, 2, 4); // legs
      g.globalAlpha = 1;
      g.restore();
    }
  }

  // ─── Tile drawing ───
  function drawTile(g, type, x, y, tickT) {
    const s = W.TILE;
    const bg = state.outdoor ? PAL.grass[(x + y * 3) % 3] : PAL.wood;
    switch (type) {
      case T.GRASS: {
        g.fillStyle = PAL.grass[(x + y * 3) % 3];
        g.fillRect(x * s, y * s, s, s);
        // tiny grass blades
        g.fillStyle = '#5a8a5a';
        g.fillRect(x * s + 2, y * s + 4, 1, 2);
        g.fillRect(x * s + 11, y * s + 9, 1, 2);
        break;
      }
      case T.GRASS2: {
        g.fillStyle = PAL.grass[1];
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = '#7aa078';
        g.fillRect(x * s + 4, y * s + 6, 2, 1);
        g.fillRect(x * s + 9, y * s + 12, 2, 1);
        g.fillRect(x * s + 13, y * s + 4, 2, 1);
        break;
      }
      case T.FLOWER: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        const col = PAL.flower[(x + y) % 3];
        g.fillStyle = col;
        g.fillRect(x * s + 7, y * s + 7, 2, 2);
        g.fillRect(x * s + 6, y * s + 8, 1, 1);
        g.fillRect(x * s + 9, y * s + 8, 1, 1);
        g.fillRect(x * s + 8, y * s + 9, 1, 1);
        break;
      }
      case T.PATH: {
        g.fillStyle = PAL.path;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.pathEdge;
        g.fillRect(x * s + 3, y * s + 5, 2, 1);
        g.fillRect(x * s + 10, y * s + 11, 2, 1);
        break;
      }
      case T.SAND:
      case T.GRAVEL: {
        g.fillStyle = type === T.SAND ? PAL.sand : PAL.gravel;
        g.fillRect(x * s, y * s, s, s);
        break;
      }
      case T.WOOD: {
        g.fillStyle = PAL.wood;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.woodLn;
        g.fillRect(x * s, y * s + s / 2 - 1, s, 1);
        g.fillRect(x * s + s / 2 - 1, y * s, 1, s);
        break;
      }
      case T.CARPET: {
        g.fillStyle = PAL.carpet;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = '#7a3848';
        g.fillRect(x * s + 1, y * s + 1, s - 2, 1);
        g.fillRect(x * s + 1, y * s + s - 2, s - 2, 1);
        break;
      }
      case T.TREE: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.treeS;
        g.fillRect(x * s + 7, y * s + 12, 4, 5);
        g.fillStyle = PAL.treeL;
        g.fillRect(x * s + 2, y * s + 2, 14, 12);
        g.fillStyle = PAL.treeT;
        g.fillRect(x * s + 4, y * s + 1, 10, 4);
        g.fillRect(x * s + 1, y * s + 4, 16, 6);
        break;
      }
      case T.BIG_TREE: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.bigTreeS;
        g.fillRect(x * s + 7, y * s + 13, 4, 5);
        g.fillStyle = PAL.bigTreeL;
        g.fillRect(x * s + 1, y * s + 1, 16, 14);
        g.fillStyle = PAL.bigTreeT;
        g.fillRect(x * s + 3, y * s + 0, 12, 6);
        break;
      }
      case T.ROCK: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.rockS;
        g.fillRect(x * s + 2, y * s + 6, 14, 9);
        g.fillStyle = PAL.rock;
        g.fillRect(x * s + 3, y * s + 5, 12, 7);
        g.fillStyle = '#a8a8b8';
        g.fillRect(x * s + 5, y * s + 7, 3, 1);
        break;
      }
      case T.BUSH: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.bushS;
        g.fillRect(x * s + 2, y * s + 8, 14, 7);
        g.fillStyle = PAL.bush;
        g.fillRect(x * s + 3, y * s + 5, 12, 8);
        break;
      }
      case T.WATER: {
        g.fillStyle = PAL.water;
        g.fillRect(x * s, y * s, s, s);
        const wave = Math.floor(tickT / 250 + x + y) % 3;
        g.fillStyle = PAL.waterH;
        if (wave === 0) g.fillRect(x * s + 2, y * s + 4, 6, 1);
        if (wave === 1) g.fillRect(x * s + 8, y * s + 9, 6, 1);
        if (wave === 2) g.fillRect(x * s + 4, y * s + 13, 6, 1);
        break;
      }
      case T.WALL: {
        g.fillStyle = PAL.wall;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.wallS;
        g.fillRect(x * s, y * s + s - 2, s, 2);
        g.fillRect(x * s + s - 2, y * s, 2, s);
        // brick lines
        g.fillStyle = '#3a2a1e';
        g.fillRect(x * s, y * s + 6, s, 1);
        g.fillRect(x * s, y * s + 12, s, 1);
        break;
      }
      case T.ROOF: {
        g.fillStyle = PAL.roof;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.roofS;
        g.fillRect(x * s, y * s + s - 3, s, 3);
        g.fillRect(x * s, y * s + s / 2 - 1, s, 1);
        break;
      }
      case T.DOOR: {
        g.fillStyle = PAL.door;
        g.fillRect(x * s + 2, y * s + 1, s - 4, s - 1);
        g.fillStyle = PAL.doorH;
        g.fillRect(x * s + s - 5, y * s + s / 2, 1, 1);
        // pulse hint
        const pulse = (Math.sin(tickT / 400) + 1) / 2;
        g.fillStyle = `rgba(255, 251, 168, ${0.25 * pulse})`;
        g.fillRect(x * s + 1, y * s, s - 2, s);
        break;
      }
      case T.LAMP: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.lampPost;
        g.fillRect(x * s + 7, y * s + 6, 2, 11);
        g.fillStyle = '#fffba8';
        g.fillRect(x * s + 5, y * s + 2, 6, 4);
        g.fillStyle = '#222';
        g.fillRect(x * s + 5, y * s + 1, 6, 1);
        g.fillRect(x * s + 5, y * s + 6, 6, 1);
        break;
      }
      case T.SIGN: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.sign;
        g.fillRect(x * s + 8, y * s + 10, 2, 7);
        g.fillRect(x * s + 3, y * s + 4, 12, 7);
        g.fillStyle = PAL.signTxt;
        g.fillRect(x * s + 5, y * s + 6, 8, 1);
        g.fillRect(x * s + 5, y * s + 8, 6, 1);
        break;
      }
      case T.FENCE: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.fence;
        g.fillRect(x * s + 1, y * s + 8, s - 2, 2);
        g.fillRect(x * s + 3, y * s + 4, 2, 10);
        g.fillRect(x * s + 13, y * s + 4, 2, 10);
        break;
      }
      case T.MUSHROOM: {
        g.fillStyle = bg;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = PAL.mushS;
        g.fillRect(x * s + 7, y * s + 10, 2, 4);
        g.fillStyle = PAL.mushR;
        g.fillRect(x * s + 5, y * s + 6, 6, 5);
        g.fillStyle = '#fff';
        g.fillRect(x * s + 6, y * s + 7, 1, 1);
        g.fillRect(x * s + 9, y * s + 8, 1, 1);
        break;
      }
      case T.BRIDGE: {
        g.fillStyle = PAL.bridge;
        g.fillRect(x * s, y * s, s, s);
        g.fillStyle = '#6a4a22';
        g.fillRect(x * s, y * s + s / 2 - 1, s, 1);
        break;
      }
    }
  }

  function drawItem(g, it, tickT) {
    if (it.picked) return;
    const cx = it.x * W.TILE + W.TILE / 2;
    const cy = it.y * W.TILE + W.TILE / 2 + Math.sin(tickT / 300 + it.x) * 1.5;
    g.save();
    if (it.type === 'coin') {
      g.fillStyle = '#fffba8';
      g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c8a020';
      g.fillRect(cx - 1, cy - 1, 2, 2);
    } else if (it.type === 'gem') {
      g.fillStyle = '#78d8f8';
      g.beginPath();
      g.moveTo(cx, cy - 4);
      g.lineTo(cx + 3, cy);
      g.lineTo(cx, cy + 4);
      g.lineTo(cx - 3, cy);
      g.closePath();
      g.fill();
      g.fillStyle = '#fff';
      g.fillRect(cx - 1, cy - 2, 1, 1);
    } else if (it.type === 'potion') {
      g.fillStyle = '#f0a8d0';
      g.fillRect(cx - 2, cy - 1, 4, 4);
      g.fillStyle = '#fffba8';
      g.fillRect(cx - 1, cy - 3, 2, 2);
    }
    g.restore();
    // sparkle
    if (Math.random() < 0.04) {
      state.particles.push({
        x: cx + (Math.random() - 0.5) * 6,
        y: cy + (Math.random() - 0.5) * 6,
        vx: 0, vy: -0.2, life: 700, max: 700, color: '#fffba8', size: 1,
      });
    }
  }

  // ─── Update loop ───
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last);
    last = now;
    state.time = (state.time + dt * state.timeSpeed) % 1;
    if (!state.inputBlocked) updatePlayer(dt);
    updateNPCs(dt);
    updateItems();
    updateParticles(dt);
    render(now);
    requestAnimationFrame(loop);
  }

  function updatePlayer(dt) {
    const speed = 60 / 1000; // 60 px per second
    let vx = 0, vy = 0;
    if (keys['arrowleft'] || keys['a'] || touchDir.left)   vx -= 1;
    if (keys['arrowright']|| keys['d'] || touchDir.right)  vx += 1;
    if (keys['arrowup']   || keys['w'] || touchDir.up)     vy -= 1;
    if (keys['arrowdown'] || keys['s'] || touchDir.down)   vy += 1;
    const len = Math.hypot(vx, vy) || 1;
    vx = (vx / len) * speed * dt;
    vy = (vy / len) * speed * dt;
    state.pmoving = vx !== 0 || vy !== 0;
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) state.pdir = vx > 0 ? 'right' : 'left';
      else state.pdir = vy > 0 ? 'down' : 'up';
    }
    if (vx !== 0 && canMoveTo(state.px + vx, state.py, 10, 8)) state.px += vx;
    if (vy !== 0 && canMoveTo(state.px, state.py + vy, 10, 8)) state.py += vy;
    state.pframet += dt;
    if (state.pframet > 180) {
      state.pframet = 0;
      state.pframe = state.pmoving ? (state.pframe + 1) % 2 : 0;
      if (state.pmoving && Math.random() < 0.5) {
        state.particles.push({
          x: state.px + (Math.random() - 0.5) * 4, y: state.py + 6,
          vx: (Math.random() - 0.5) * 0.02, vy: -0.02,
          life: 400, max: 400, color: '#c8b890', size: 1,
        });
      }
    }
  }

  // Recruit nearby idle NPCs to each fighter's team when a brawl starts
  function assignTeams(npcA, npcB) {
    state.npcs.forEach((n) => {
      if (n === npcA || n === npcB || n.combatState !== 'idle') return;
      const dA = Math.hypot(n.cx - npcA.cx, n.cy - npcA.cy);
      const dB = Math.hypot(n.cx - npcB.cx, n.cy - npcB.cy);
      if (dA > W.TILE * 5 && dB > W.TILE * 5) return;
      if (dA <= dB) {
        n.team = 'A'; n.combatState = 'chasing'; n.combatTarget = npcB.id;
      } else {
        n.team = 'B'; n.combatState = 'chasing'; n.combatTarget = npcA.id;
      }
    });
  }

  function updateNPCs(dt) {
    const now = performance.now();
    state.npcs.forEach((n) => {
      // Fixed NPCs face the player when idle, but join combat like anyone else
      if (n.fixed && n.combatState === 'idle') { n.dir = facingPlayer(n); return; }

      // ── COMBAT STATE MACHINE ────────────────────────────────
      if (n.combatState === 'chasing') {
        const target = state.npcs.find((t) => t.id === n.combatTarget);
        if (!target || target.combatState === 'fleeing') {
          n.combatState = 'idle'; n.combatTarget = null; n.team = null;
          n.walkUntil = 0; n.idleUntil = now + 1000;
          return;
        }
        const dx = target.cx - n.cx, dy = target.cy - n.cy;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          const spd = (50 / 1000) * dt;
          n.cx += (dx / dist) * spd; n.cy += (dy / dist) * spd;
          n.frameT += dt; if (n.frameT > 140) { n.frameT = 0; n.frame = (n.frame + 1) % 2; }
          n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        }
        if (dist < W.TILE * 2) {
          // Enter fighting state for both
          n.combatState = 'fighting'; n.fightUntil = now + 4000; n.lastSparkT = 0; n.lastHitT = 0;
          if (target.combatState !== 'fighting') {
            target.combatState = 'fighting'; target.combatTarget = n.id;
            target.fightUntil = now + 4000; target.lastSparkT = 0; target.lastHitT = 0;
          }
          assignTeams(n, target);
        }
        return;
      }

      if (n.combatState === 'fighting') {
        const target = state.npcs.find((t) => t.id === n.combatTarget);
        // Spark particles at midpoint
        if (now - n.lastSparkT > 200) {
          n.lastSparkT = now;
          const mx = target ? (n.cx + target.cx) / 2 : n.cx;
          const my = target ? (n.cy + target.cy) / 2 - 6 : n.cy - 6;
          for (let i = 0; i < 4; i++) {
            state.particles.push({
              x: mx, y: my,
              vx: (Math.random() - 0.5) * 0.35, vy: -0.12 - Math.random() * 0.18,
              life: 450, max: 450,
              color: Math.random() < 0.5 ? '#fffba8' : '#ff8020', size: 2,
            });
          }
        }
        // Hit flash every 600ms
        if (now - n.lastHitT > 600) {
          n.lastHitT = now; n.hitFlash = now + 90;
          if (target) target.hitFlash = now + 90;
        }
        // Fight over?
        if (now > n.fightUntil) {
          const winnerIsN = Math.random() < 0.5;
          const winner = winnerIsN ? n : target;
          const loser  = winnerIsN ? target : n;
          if (winner) {
            winner.combatState = 'idle'; winner.combatTarget = null; winner.team = null;
            winner.walkUntil = 0; winner.idleUntil = now + 2000; winner.frame = 0;
            for (let i = 0; i < 8; i++) state.particles.push({
              x: winner.cx, y: winner.cy - 10,
              vx: (Math.random() - 0.5) * 0.2, vy: -0.2 - Math.random() * 0.15,
              life: 900, max: 900, color: '#fffba8', size: 2,
            });
          }
          if (loser) {
            loser.combatState = 'fleeing'; loser.fleeUntil = now + 2500;
            loser.combatTarget = null;
            const fx = winner ? loser.cx - winner.cx : (Math.random() - 0.5) * 2;
            const fy = winner ? loser.cy - winner.cy : (Math.random() - 0.5) * 2;
            const fl = Math.hypot(fx, fy) || 1;
            loser.walkVx = (fx / fl) * 55 / 1000; loser.walkVy = (fy / fl) * 55 / 1000;
          }
        }
        return;
      }

      if (n.combatState === 'fleeing') {
        const vx = n.walkVx * dt, vy = n.walkVy * dt;
        n.cx = Math.max(W.TILE, Math.min(W.WORLD_W * W.TILE - W.TILE, n.cx + vx));
        n.cy = Math.max(W.TILE, Math.min(W.WORLD_H * W.TILE - W.TILE, n.cy + vy));
        n.frameT += dt; if (n.frameT > 140) { n.frameT = 0; n.frame = (n.frame + 1) % 2; }
        n.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
        if (now > n.fleeUntil) {
          n.combatState = 'idle'; n.combatTarget = null; n.team = null;
          n.walkVx = 0; n.walkVy = 0; n.walkUntil = 0; n.idleUntil = now + 1500; n.frame = 0;
        }
        return;
      }
      // ── END COMBAT ─────────────────────────────────────────

      // ── SPY FOLLOWING ──────────────────────────────────────
      if (n.behavior === 'spy') {
        const sdx = state.px - n.cx, sdy = state.py - n.cy;
        const sdist = Math.hypot(sdx, sdy);
        if (sdist < W.TILE * 7 && sdist > W.TILE * 2.8) {
          // Creep toward player at a slightly slower pace
          const spd = (22 / 1000) * dt;
          n.cx += (sdx / sdist) * spd; n.cy += (sdy / sdist) * spd;
          n.frameT += dt; if (n.frameT > 220) { n.frameT = 0; n.frame = (n.frame + 1) % 2; }
          n.dir = Math.abs(sdx) > Math.abs(sdy) ? (sdx > 0 ? 'right' : 'left') : (sdy > 0 ? 'down' : 'up');
          return; // skip wander while tailing
        } else if (sdist <= W.TILE * 2.8) {
          // Caught up — look away innocently
          n.dir = sdx > 0 ? 'left' : 'right';
          n.frame = 0;
          // fall through to idle/wander
        }
      }

      // Spontaneous conversation trigger (idle wandering NPCs only)
      if (now > n.convoLock && now > n.lastConvoCheck + 8000) {
        n.lastConvoCheck = now;
        for (const m of state.npcs) {
          if (m === n || m.fixed || m.combatState !== 'idle' || now < m.convoLock) continue;
          if (Math.hypot(n.cx - m.cx, n.cy - m.cy) < W.TILE * 4 && Math.random() < 0.15) {
            n.convoLock = now + 12000; m.convoLock = now + 12000;
            if (state.onNPCConvoRequest) state.onNPCConvoRequest(n, m);
            break;
          }
        }
      }

      // ── WANDER (only when idle) ─────────────────────────────
      if (now > n.walkUntil && now > n.idleUntil) {
        n.walkVx = (Math.random() - 0.5) * 2;
        n.walkVy = (Math.random() - 0.5) * 2;
        const len = Math.hypot(n.walkVx, n.walkVy) || 1;
        n.walkVx = (n.walkVx / len) * 30 / 1000;
        n.walkVy = (n.walkVy / len) * 30 / 1000;
        n.walkUntil = now + 800 + Math.random() * 800;
      } else if (now < n.walkUntil) {
        const vx = n.walkVx * dt, vy = n.walkVy * dt;
        const tx = n.cx + vx, ty = n.cy + vy;
        const wx = n.wander ? n.wander.x : n.anchorX - 3;
        const wy = n.wander ? n.wander.y : n.anchorY - 3;
        const ww = n.wander ? n.wander.w : 6;
        const wh = n.wander ? n.wander.h : 6;
        const minX = wx * W.TILE + 6, maxX = (wx + ww) * W.TILE - 6;
        const minY = wy * W.TILE + 6, maxY = (wy + wh) * W.TILE - 6;
        let moved = false;
        if (tx > minX && tx < maxX && canMoveTo(tx, n.cy, 8, 6)) { n.cx = tx; moved = true; }
        else n.walkVx *= -1;
        if (ty > minY && ty < maxY && canMoveTo(n.cx, ty, 8, 6)) { n.cy = ty; moved = true; }
        else n.walkVy *= -1;
        if (!moved) { n.walkUntil = now; n.idleUntil = now + 400; }
        if (Math.abs(n.walkVx) > Math.abs(n.walkVy)) n.dir = n.walkVx > 0 ? 'right' : 'left';
        else n.dir = n.walkVy > 0 ? 'down' : 'up';
        n.frameT += dt; if (n.frameT > 180) { n.frameT = 0; n.frame = (n.frame + 1) % 2; }
      } else {
        n.idleUntil = now + 800 + Math.random() * 1500;
        n.walkUntil = now;
        n.frame = 0;
      }
    });
  }

  function facingPlayer(n) {
    const dx = state.px - n.cx, dy = state.py - n.cy;
    if (Math.hypot(dx, dy) > W.TILE * 2) return n.dir;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  function updateItems() {
    state.items.forEach((it) => {
      if (it.picked) return;
      const cx = it.x * W.TILE + W.TILE / 2;
      const cy = it.y * W.TILE + W.TILE / 2;
      if (Math.hypot(state.px - cx, state.py - cy) < 10) {
        it.picked = true;
        state.pickedItems.add(state.sceneId + ':' + it.id);
        if (it.questId) {
          // Quest item — adds to inventory, doesn't count as coin
          state.questInventory.add(it.questId);
          if (window.SFX) window.SFX.levelup();
          for (let i = 0; i < 14; i++) {
            state.particles.push({
              x: cx, y: cy,
              vx: (Math.random() - 0.5) * 0.25, vy: -0.08 - Math.random() * 0.15,
              life: 1000, max: 1000, color: '#fffba8', size: 1,
            });
          }
          if (state.onPickup) state.onPickup({ type: 'quest', questId: it.questId, itemType: it.type });
        } else {
          state.coins += it.type === 'gem' ? 5 : it.type === 'potion' ? 3 : 1;
          if (window.SFX) window.SFX.coin();
          for (let i = 0; i < 8; i++) {
            state.particles.push({
              x: cx, y: cy, vx: (Math.random() - 0.5) * 0.15, vy: -0.05 - Math.random() * 0.1,
              life: 700, max: 700, color: '#fffba8', size: 1,
            });
          }
          if (state.onPickup) state.onPickup({ type: it.type, total: state.coins });
        }
      }
    });
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) { state.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    // ambient sparkles at night
    const dn = dayNightOverlay();
    if (dn.darkness > 0.3 && Math.random() < 0.06) {
      state.particles.push({
        x: state.px + (Math.random() - 0.5) * 200,
        y: state.py + (Math.random() - 0.5) * 140,
        vx: 0, vy: -0.02, life: 1200, max: 1200, color: '#fffba8', size: 1,
      });
    }
  }

  // ─── Interact ───
  function tryInteract() {
    if (state.inputBlocked) return;
    // 1. nearby NPC
    for (const n of state.npcs) {
      if (Math.hypot(state.px - n.cx, state.py - n.cy) < W.TILE * 1.4) {
        if (window.SFX) window.SFX.select();
        if (state.onInteract) state.onInteract({ kind: 'npc', npc: n });
        return;
      }
    }
    // 2. door in front of player
    const fx = state.px + (state.pdir === 'right' ? 12 : state.pdir === 'left' ? -12 : 0);
    const fy = state.py + (state.pdir === 'down' ? 12 : state.pdir === 'up' ? -12 : 0);
    const ftile = tileAt(fx, fy);
    const tx = Math.floor(fx / W.TILE), ty = Math.floor(fy / W.TILE);
    if (ftile === T.DOOR) {
      // Check if interior exit door first
      if (W.exits && W.exits[`${tx},${ty}`]) {
        const target = W.exits[`${tx},${ty}`];
        if (window.SFX) window.SFX.open();
        if (state.onInteract) state.onInteract({ kind: 'exit', target });
        return;
      }
      // Else overworld building door → enter interior
      const b = W.buildings.find((bb) => bb.door.x === tx && bb.door.y === ty);
      if (b) {
        if (window.SFX) window.SFX.open();
        if (state.onInteract) state.onInteract({ kind: 'building', building: b });
        return;
      }
    }
    if (ftile === T.SIGN) {
      const text = W.signTexts[`${tx},${ty}`];
      if (text) {
        if (window.SFX) window.SFX.select();
        if (state.onInteract) state.onInteract({ kind: 'sign', text });
        return;
      }
    }
    // also check current tile (player overlapping non-solid interactive tiles)
    const onTile = tileAt(state.px, state.py);
    const otx = Math.floor(state.px / W.TILE), oty = Math.floor(state.py / W.TILE);
    if (onTile === T.DOOR) {
      if (W.exits && W.exits[`${otx},${oty}`]) {
        if (window.SFX) window.SFX.open();
        if (state.onInteract) state.onInteract({ kind: 'exit', target: W.exits[`${otx},${oty}`] });
        return;
      }
      const b2 = W.buildings.find((bb) => bb.door.x === otx && bb.door.y === oty);
      if (b2) {
        if (window.SFX) window.SFX.open();
        if (state.onInteract) state.onInteract({ kind: 'building', building: b2 });
        return;
      }
    }
    if (onTile === T.SIGN) {
      const text = W.signTexts[`${otx},${oty}`];
      if (text && state.onInteract) state.onInteract({ kind: 'sign', text });
    }
  }

  // ─── Render ───
  function render(tickT) {
    // Background
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, viewW, viewH);

    // camera follows player, clamped
    const worldPxW = W.WORLD_W * W.TILE;
    const worldPxH = W.WORLD_H * W.TILE;
    const viewTilesX = viewW / scale;
    const viewTilesY = viewH / scale;
    let camX = state.px - viewTilesX / 2;
    let camY = state.py - viewTilesY / 2;
    camX = Math.max(0, Math.min(worldPxW - viewTilesX, camX));
    camY = Math.max(0, Math.min(worldPxH - viewTilesY, camY));
    if (worldPxW < viewTilesX) camX = (worldPxW - viewTilesX) / 2;
    if (worldPxH < viewTilesY) camY = (worldPxH - viewTilesY) / 2;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    // Tiles in view
    const startX = Math.max(0, Math.floor(camX / W.TILE) - 1);
    const startY = Math.max(0, Math.floor(camY / W.TILE) - 1);
    const endX = Math.min(W.WORLD_W, startX + Math.ceil(viewTilesX / W.TILE) + 3);
    const endY = Math.min(W.WORLD_H, startY + Math.ceil(viewTilesY / W.TILE) + 3);
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        drawTile(ctx, W.map[y][x], x, y, tickT);
      }
    }

    // Items
    state.items.forEach((it) => drawItem(ctx, it, tickT));

    // NPCs + player drawn in y-sorted order
    const drawables = [];
    const _now = performance.now();
    state.npcs.forEach((n) => drawables.push({
      y: n.cy,
      fn: () => {
        const flash = n.hitFlash && _now < n.hitFlash;
        drawHumanoid(ctx, n.cx, n.cy, n.dir, n.frame, n.sprite, flash);
        // team colour dot above head
        if (n.team) {
          ctx.fillStyle = n.team === 'A' ? '#ff4040' : '#4080ff';
          ctx.fillRect(Math.floor(n.cx) - 2, Math.floor(n.cy) - 21, 4, 4);
        }
        // speech bubble ellipsis dots when NPC has an active speak bubble
        if (n.speakBubble && _now < n.speakBubble.until) {
          ctx.fillStyle = '#ffffff';
          for (let d = 0; d < 3; d++) ctx.fillRect(Math.floor(n.cx) + 4 + d * 3, Math.floor(n.cy) - 19, 2, 2);
        }
      },
    }));
    drawables.push({ y: state.py, fn: () => drawHumanoid(ctx, state.px, state.py, state.pdir, state.pframe, PLAYER_SPRITE) });
    drawables.sort((a, b) => a.y - b.y);
    drawables.forEach((d) => d.fn());

    // Particles
    state.particles.forEach((p) => {
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      ctx.globalAlpha = 1;
    });

    // Lamp glows at night
    const dn = dayNightOverlay();
    if (dn.darkness > 0.2) {
      // collect lamps near view
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (W.map[y][x] === T.LAMP) {
            const cx = x * W.TILE + W.TILE / 2;
            const cy = y * W.TILE + 4;
            const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 36);
            grd.addColorStop(0, `rgba(255,251,168,${0.45 + Math.sin(tickT / 600) * 0.05})`);
            grd.addColorStop(1, 'rgba(255,251,168,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - 36, cy - 36, 72, 72);
          }
        }
      }
    }

    ctx.restore();

    // Day/night tint overlay
    if (dn.darkness > 0.01) {
      ctx.fillStyle = `rgba(${dn.tint[0]}, ${dn.tint[1]}, ${dn.tint[2]}, ${dn.darkness})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }

    // Interact hint
    drawHint();

    // Public time read
    state.hudDarkness = dn.darkness;
    state.hudTime = state.time;
  }

  function drawHint() {
    // find nearest interactable
    let kind = '';
    let bestD = W.TILE * 1.5;
    for (const n of state.npcs) {
      const d = Math.hypot(state.px - n.cx, state.py - n.cy);
      if (d < bestD) { bestD = d; kind = 'TALK · ' + n.name; }
    }
    // tile in front
    const fx = state.px + (state.pdir === 'right' ? 12 : state.pdir === 'left' ? -12 : 0);
    const fy = state.py + (state.pdir === 'down' ? 12 : state.pdir === 'up' ? -12 : 0);
    const ft = tileAt(fx, fy);
    if (ft === T.DOOR) {
      const tx = Math.floor(fx / W.TILE), ty = Math.floor(fy / W.TILE);
      if (W.exits && W.exits[`${tx},${ty}`]) {
        kind = 'EXIT · BACK TO VILLAGE';
      } else {
        const b = W.buildings.find((bb) => bb.door.x === tx && bb.door.y === ty);
        if (b) kind = 'ENTER · ' + b.name;
      }
    } else if (ft === T.SIGN) {
      kind = 'READ';
    }
    // also: player standing on door/sign tile
    if (!kind) {
      const onTile = tileAt(state.px, state.py);
      const otx = Math.floor(state.px / W.TILE), oty = Math.floor(state.py / W.TILE);
      if (onTile === T.DOOR) {
        if (W.exits && W.exits[`${otx},${oty}`]) kind = 'EXIT · BACK TO VILLAGE';
        else {
          const b = W.buildings.find((bb) => bb.door.x === otx && bb.door.y === oty);
          if (b) kind = 'ENTER · ' + b.name;
        }
      } else if (onTile === T.SIGN) {
        kind = 'READ';
      }
    }
    const hint = document.getElementById('interact-hint');
    if (!hint) return;
    if (kind) {
      hint.textContent = kind + '  [E]';
      hint.classList.add('show');
    } else {
      hint.classList.remove('show');
    }
  }

  // ─── Public API ───
  window.WorldEngine = {
    setOnInteract: (fn) => { state.onInteract = fn; },
    setOnPickup: (fn) => { state.onPickup = fn; },
    setOnNPCConvoRequest: (fn) => { state.onNPCConvoRequest = fn; },
    getNPCs: () => state.npcs.map((n) => ({
      id: n.id, name: n.name, tag: n.tag, combatState: n.combatState,
    })),
    setNPCSpeakBubble: (npcId, text, duration) => {
      const npc = state.npcs.find((n) => n.id === npcId);
      if (npc) npc.speakBubble = { text, until: performance.now() + (duration || 5000) };
    },
    triggerCombat: (attackerId, targetId) => {
      const attacker = state.npcs.find((n) => n.id === attackerId);
      if (!attacker || attacker.combatState !== 'idle') return null;
      const target = targetId
        ? state.npcs.find((n) => n.id === targetId && n.combatState === 'idle')
        : state.npcs
            .filter((n) => n.id !== attackerId && n.combatState === 'idle')
            .sort((a, b) => Math.hypot(a.cx - attacker.cx, a.cy - attacker.cy)
                          - Math.hypot(b.cx - attacker.cx, b.cy - attacker.cy))[0];
      if (!target) return null;
      attacker.combatTarget = target.id;
      attacker.combatState = 'chasing';
      attacker.team = 'A';
      target.combatTarget = attacker.id;
      target.combatState = 'chasing';
      target.team = 'B';
      assignTeams(attacker, target);
      return { attackerName: attacker.name, targetName: target.name, attackerId: attacker.id, targetId: target.id };
    },
    setInputBlocked: (b) => { state.inputBlocked = !!b; },
    getState: () => ({
      coins: state.coins,
      time: state.time,
      darkness: state.hudDarkness,
      sceneId: state.sceneId,
      questInventory: Array.from(state.questInventory),
      completedQuests: Array.from(state.completedQuests),
    }),
    setTime: (t) => { state.time = t; },
    setDaySpeed: (ms) => { state.timeSpeed = 1 / ms; },
    teleport: (tx, ty) => { state.px = tx * W.TILE + W.TILE / 2; state.py = ty * W.TILE + W.TILE / 2; },
    loadScene: (sceneId, spawnTile, fromDir) => {
      const s = W.scenes[sceneId];
      if (!s) return;
      adoptScene(s, spawnTile, fromDir);
    },
    addCoins: (n) => { state.coins += n; if (state.onPickup) state.onPickup({ type: 'reward', total: state.coins }); },
    consumeQuestItem: (questId) => {
      state.questInventory.delete(questId);
      state.completedQuests.add(questId);
    },
    hasQuestItem: (questId) => state.questInventory.has(questId),
    isQuestDone: (questId) => state.completedQuests.has(questId),
  };

  // Player sprite palette
  const PLAYER_SPRITE = {
    hair:   '#5a3a1a',
    skin:   '#e8c2a0',
    top:    '#f0a8d0',
    bottom: '#3a3aa8',
  };

  // start
  requestAnimationFrame(loop);
})();
