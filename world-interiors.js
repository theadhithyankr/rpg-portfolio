// =========================================================
//  world-interiors.js — interior scenes for each building,
//  hidden quest items, easter eggs.
// =========================================================

(function () {
  const W = window.WORLD;
  const T = W.TILES;
  const P = window.PORTFOLIO_DATA;

  // ─── helper: build a stock interior ───
  // contents: array of { x, y, kind, text?, item?, npc? }
  function buildInterior(opts) {
    const w = opts.W, h = opts.H;
    const map = Array.from({ length: h }, () => Array(w).fill(T.WOOD));
    // walls
    for (let x = 0; x < w; x++) { map[0][x] = T.WALL; map[h - 1][x] = T.WALL; }
    for (let y = 0; y < h; y++) { map[y][0] = T.WALL; map[y][w - 1] = T.WALL; }
    // top decorative roof line
    for (let x = 1; x < w - 1; x++) map[0][x] = T.ROOF;
    // central carpet runway from exit upward
    const exitX = opts.exitX ?? Math.floor(w / 2);
    for (let y = 1; y < h - 1; y++) map[y][exitX] = T.CARPET;
    // exit door at bottom
    map[h - 1][exitX] = T.DOOR;

    const signTexts = {};
    const items = [];
    const npcs = [];

    (opts.contents || []).forEach((c) => {
      if (c.kind === 'sign' || c.kind === 'pedestal') {
        map[c.y][c.x] = T.SIGN;
        signTexts[`${c.x},${c.y}`] = c.text || '';
      } else if (c.kind === 'lamp') {
        map[c.y][c.x] = T.LAMP;
      } else if (c.kind === 'rock') {
        map[c.y][c.x] = T.ROCK;
      } else if (c.kind === 'bush') {
        map[c.y][c.x] = T.BUSH;
      } else if (c.kind === 'flower') {
        map[c.y][c.x] = T.FLOWER;
      } else if (c.kind === 'water') {
        map[c.y][c.x] = T.WATER;
      } else if (c.kind === 'item') {
        items.push({ id: c.id, x: c.x, y: c.y, type: c.type || 'coin', questId: c.questId });
      } else if (c.kind === 'npc') {
        npcs.push(Object.assign({ x: c.x, y: c.y, fixed: true }, c.def));
      }
    });

    return {
      id: opts.id,
      name: opts.name,
      W: w, H: h,
      map, npcs, items, signTexts,
      buildings: [],
      outdoor: false,
      spawn: { x: exitX, y: h - 2 },
      exits: { [`${exitX},${h - 1}`]: 'overworld' }, // exit door → overworld
    };
  }

  // ─── SHRINE OF SKILLS ───
  // 6 pedestals showing each skill group
  const shrineContents = [];
  shrineContents.push({ x: 7, y: 1, kind: 'sign', text: '★ SHRINE OF SKILLS ★\nApproach a pedestal and press E.' });
  shrineContents.push({ x: 1, y: 1, kind: 'lamp' });
  shrineContents.push({ x: 13, y: 1, kind: 'lamp' });
  shrineContents.push({ x: 1, y: 9, kind: 'lamp' });
  shrineContents.push({ x: 13, y: 9, kind: 'lamp' });
  // 6 pedestals — two columns of 3
  const pedPositions = [
    { x: 3,  y: 3 }, { x: 11, y: 3 },
    { x: 3,  y: 6 }, { x: 11, y: 6 },
    { x: 3,  y: 9 }, { x: 11, y: 9 },
  ];
  P.skills.forEach((g, i) => {
    const pos = pedPositions[i] || { x: 7, y: 3 };
    const lines = g.items
      .map((s) => '  ' + s.name + ' ' + ('★'.repeat(s.lvl) + '☆'.repeat(5 - s.lvl)))
      .join('\n');
    shrineContents.push({
      x: pos.x, y: pos.y, kind: 'pedestal',
      text: g.icon + ' ' + g.group + '\n' + lines,
    });
  });
  // shrine has a unique NPC: "The Skill Sage"
  shrineContents.push({
    x: 7, y: 3, kind: 'npc',
    def: {
      id: 'sage', name: 'THE SKILL SAGE',
      sprite: { hair: '#fffba8', skin: '#e8c099', top: '#5a3aa6', bottom: '#3a2a78', beard: true },
      tag: 'Keeper of the pedestals',
      personality:
        'You are THE SKILL SAGE, a quiet keeper of an ancient shrine of pedestals. ' +
        'Each pedestal in your shrine displays a tech skill mastered by ADHITHYAN K R. ' +
        'You answer in a calm sagely tone. Replies under 2 sentences.',
      greeting: 'The pedestals remember every skill the hero has earned.',
      lines: [
        'Knowledge becomes craft. Craft becomes wisdom.',
        'Each pedestal hums when a worthy hand approaches.',
        'You may read them in any order.',
      ],
    }
  });

  W.scenes.shrine = buildInterior({
    id: 'shrine', name: 'SHRINE OF SKILLS',
    W: 15, H: 11, exitX: 7,
    contents: shrineContents,
  });

  // ─── SCRIBE'S LIBRARY ───
  // Bookshelves: education + achievements
  // Hidden quest: THE RING in a corner
  const libContents = [];
  libContents.push({ x: 7, y: 1, kind: 'sign', text: "✎ SCRIBE'S LIBRARY ✎\nDusty tomes. Read them all." });
  libContents.push({ x: 1, y: 1, kind: 'lamp' });
  libContents.push({ x: 13, y: 1, kind: 'lamp' });

  // Education plaque
  P.records.education.forEach((e, i) => {
    libContents.push({
      x: 3, y: 3 + i * 2, kind: 'sign',
      text: '◇ EDUCATION ◇\n' + e.school + '\n' + e.degree + '\n' + e.location + ' · ' + e.period,
    });
  });
  // Achievement plaques: scatter
  const achPositions = [
    { x: 5, y: 3 }, { x: 9, y: 3 }, { x: 11, y: 3 },
    { x: 5, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 5 },
    { x: 5, y: 7 }, { x: 9, y: 7 }, { x: 11, y: 7 },
    { x: 5, y: 9 }, { x: 9, y: 9 }, { x: 11, y: 9 },
  ];
  P.records.achievements.forEach((a, i) => {
    const pos = achPositions[i];
    if (!pos) return;
    libContents.push({
      x: pos.x, y: pos.y, kind: 'sign',
      text: '♛ ' + a.title + ' ♛\n' + a.body,
    });
  });

  // HIDDEN QUEST: THE RING — tucked in the corner near a rock
  libContents.push({ x: 1, y: 9, kind: 'rock' });    // decoy obstacle
  libContents.push({
    x: 2, y: 9, kind: 'item',
    id: 'ring', type: 'ring', questId: 'ringward',
  });
  libContents.push({ x: 13, y: 9, kind: 'bush' });

  W.scenes.library = buildInterior({
    id: 'library', name: "SCRIBE'S LIBRARY",
    W: 15, H: 11, exitX: 7,
    contents: libContents,
  });

  // ─── PROJECT FORGE ───
  // One pedestal per project
  const forgeContents = [];
  forgeContents.push({ x: 7, y: 1, kind: 'sign', text: '⚒ PROJECT FORGE ⚒\nWorks of the hero. Press E on a workbench.' });
  forgeContents.push({ x: 1, y: 1, kind: 'lamp' });
  forgeContents.push({ x: 13, y: 1, kind: 'lamp' });
  const forgePositions = [
    { x: 2, y: 3 }, { x: 5, y: 3 }, { x: 9, y: 3 }, { x: 12, y: 3 },
    { x: 2, y: 6 }, { x: 5, y: 6 }, { x: 9, y: 6 }, { x: 12, y: 6 },
    { x: 7, y: 8 },
  ];
  P.projects.forEach((p, i) => {
    const pos = forgePositions[i];
    if (!pos) return;
    const stats = p.stats.map(s => '  ' + s.k + ': ' + s.v).join('\n');
    forgeContents.push({
      x: pos.x, y: pos.y, kind: 'sign',
      text: p.glyph + ' ' + p.name + ' (' + p.rarity + ')\n'
        + p.stack + '\n'
        + p.tagline + '\n'
        + stats
        + (p.url ? '\n  ◇ Repo: ' + p.url : ''),
    });
  });
  // a hidden flux capacitor for Doc Pulse
  forgeContents.push({
    x: 13, y: 8, kind: 'item',
    id: 'flux', type: 'flux', questId: 'pulse',
  });
  // anvil decorations
  forgeContents.push({ x: 4, y: 4, kind: 'rock' });
  forgeContents.push({ x: 10, y: 4, kind: 'rock' });

  W.scenes.forge = buildInterior({
    id: 'forge', name: 'PROJECT FORGE',
    W: 15, H: 11, exitX: 7,
    contents: forgeContents,
  });

  // ─── QUEST BOARD HALL ───
  const questsContents = [];
  questsContents.push({ x: 6, y: 1, kind: 'sign', text: '✎ QUEST BOARD HALL ✎\nMissions of the hero.' });
  questsContents.push({ x: 1, y: 1, kind: 'lamp' });
  questsContents.push({ x: 11, y: 1, kind: 'lamp' });
  P.quests.forEach((q, i) => {
    const bul = q.bullets.slice(0, 3).map(b => '  ✓ ' + b.tag + ' — ' + b.text.slice(0, 60) + '...').join('\n');
    questsContents.push({
      x: 3 + i * 5, y: 4, kind: 'sign',
      text: '◆ ' + q.title.toUpperCase() + ' ◆\n'
        + q.org + '\n'
        + q.period + ' · ' + q.role + ' · +' + q.xp + ' XP\n'
        + q.summary + '\n'
        + bul,
    });
  });
  // bartender-like NPC giving hints about quests
  questsContents.push({
    x: 6, y: 6, kind: 'npc',
    def: {
      id: 'questmaster', name: 'THE QUESTMASTER',
      sprite: { hair: '#3a2a18', skin: '#d8b89a', top: '#5a3aa6', bottom: '#2a2a2a' },
      tag: 'Posts the missions',
      personality:
        'You are THE QUESTMASTER, an old guildhall clerk who posts work-quests on the board. ' +
        'You speak gruff but friendly. You believe in the hero ADHITHYAN K R, who has earned more XP than most. ' +
        'Replies under 2 sentences.',
      greeting: 'New face. Read the board. Pick your poison.',
      lines: [
        'Hero ADHITHYAN signed every contract through to delivery.',
        'Big quests, small quests — they all earn XP if you finish them.',
        'Read it twice before you swing your sword.',
      ],
    }
  });
  // hidden shield for Captain Liberty
  questsContents.push({ x: 11, y: 7, kind: 'item', id: 'shield', type: 'shield', questId: 'liberty' });

  W.scenes.quests = buildInterior({
    id: 'quests', name: 'QUEST BOARD HALL',
    W: 13, H: 10, exitX: 6,
    contents: questsContents,
  });

  // ─── INNKEEPER'S TAVERN ───
  const tavernContents = [];
  tavernContents.push({ x: 6, y: 1, kind: 'sign', text: "✉ INNKEEPER'S TAVERN ✉\nWarm fire. Cold drinks. Open to work." });
  tavernContents.push({ x: 1, y: 1, kind: 'lamp' });
  tavernContents.push({ x: 11, y: 1, kind: 'lamp' });
  // Contact signs — one per channel
  P.contact.lines.forEach((c, i) => {
    tavernContents.push({
      x: 3 + i * 2, y: 4, kind: 'sign',
      text: c.glyph + ' ' + c.kind + '\n' + c.label,
    });
  });
  // Bartender NPC
  tavernContents.push({
    x: 6, y: 7, kind: 'npc',
    def: {
      id: 'innkeeper', name: 'THE INNKEEPER',
      sprite: { hair: '#3a2a18', skin: '#e0b890', top: '#c83248', bottom: '#5a3a18' },
      tag: 'Knows everyone',
      personality:
        'You are THE INNKEEPER, a friendly tavern keeper who knows everyone in the village. ' +
        'You like to chat. You know how to contact ADHITHYAN K R: email theadhithyankr@gmail.com, phone +91 87142 74576, github.com/theadhithyankr. ' +
        'Replies under 2 sentences.',
      greeting: 'Welcome in. Looking to hire? Or just a hot meal?',
      lines: [
        'Adhithyan? Reliable engineer. Builds shipping things fast.',
        'Mail him at theadhithyankr@gmail.com — he replies same day.',
        'On the github? Sure, github.com/theadhithyankr. Saw his slot engine.',
      ],
    }
  });
  // hidden web cartridge for Snipper
  tavernContents.push({ x: 1, y: 7, kind: 'item', id: 'web', type: 'web', questId: 'snipper' });

  W.scenes.tavern = buildInterior({
    id: 'tavern', name: "INNKEEPER'S TAVERN",
    W: 13, H: 10, exitX: 6,
    contents: tavernContents,
  });

  // ─── PLAYER'S COTTAGE ───
  const homeContents = [];
  const p = P.player;
  homeContents.push({ x: 5, y: 1, kind: 'sign', text: "✿ PLAYER'S COTTAGE ✿\nHome sweet home." });
  homeContents.push({ x: 1, y: 1, kind: 'lamp' });
  homeContents.push({ x: 9, y: 1, kind: 'lamp' });
  homeContents.push({
    x: 5, y: 3, kind: 'sign',
    text: '◐ HERO PROFILE ◐\n'
      + p.name + ' — ' + p.class + '\n'
      + p.subclass + '\n'
      + p.location + ' · LV ' + p.level,
  });
  homeContents.push({
    x: 2, y: 5, kind: 'sign',
    text: '☻ TAGLINE ☻\n' + p.tagline,
  });
  // Stats plaque
  const statTxt = P.stats.map(s => '  ' + s.key + ' · ' + s.name + ': ' + s.value).join('\n');
  homeContents.push({
    x: 8, y: 5, kind: 'sign',
    text: '★ CORE STATS ★\n' + statTxt,
  });
  // bed + desk decorations
  homeContents.push({ x: 1, y: 7, kind: 'bush' }); // "bed" as bush proxy
  homeContents.push({ x: 9, y: 7, kind: 'rock' }); // "desk"
  // hidden grappling hook for Sir Greyvale
  homeContents.push({ x: 1, y: 8, kind: 'item', id: 'grapple', type: 'grapple', questId: 'greyvale' });

  W.scenes.home = buildInterior({
    id: 'home', name: "PLAYER'S COTTAGE",
    W: 11, H: 10, exitX: 5,
    contents: homeContents,
  });

  // ─── ARCADE ───
  const arcadeContents = [];
  arcadeContents.push({ x: 4, y: 1, kind: 'sign', text: '☢ THE ARCADE ☢\nFlashing lights. Loose tokens.' });
  arcadeContents.push({ x: 1, y: 1, kind: 'lamp' });
  arcadeContents.push({ x: 7, y: 1, kind: 'lamp' });
  arcadeContents.push({
    x: 4, y: 4, kind: 'sign',
    text: '★ SLOTFORGE DEMO ★\n'
      + 'A live demo of weighted-RNG slot logic.\n'
      + '\n'
      + '  RTP target: 96.5%\n'
      + '  3 reels · 5 paylines\n'
      + '\n'
      + 'Open the menu mode to play.',
  });
  arcadeContents.push({
    x: 2, y: 6, kind: 'sign',
    text: '☢ ABOUT THE ARCADE ☢\nBuilt with Phaser 3 + Node.js.\nVerified at 100,000+ spins.',
  });
  // poem scroll for The Croaker
  arcadeContents.push({ x: 7, y: 6, kind: 'item', id: 'poem', type: 'poem', questId: 'croaker' });

  W.scenes.arcade = buildInterior({
    id: 'arcade', name: 'THE ARCADE',
    W: 9, H: 9, exitX: 4,
    contents: arcadeContents,
  });

  // ─── Map building.id → scene id ───
  W.buildingToScene = {
    shrine: 'shrine',
    library: 'library',
    forge: 'forge',
    quests: 'quests',
    tavern: 'tavern',
    home: 'home',
    arcade: 'arcade',
  };

  // ─── Quest definitions ───
  // Each quest item maps to an NPC; bringing the item back triggers a special path
  W.quests = {
    ringward: {
      itemId: 'ring',
      itemName: 'THE GOLDEN RING',
      hint: 'A small gold ring, warm to the touch.',
      acceptLine:
        'GASP. MY RING. I — I HAD GIVEN IT UP FOR LOST.\nYOU HAVE A KIND HEART, TRAVELER. TAKE THESE COINS AS THANKS. AND PERHAPS — DO NOT WEAR IT.',
      reward: { coins: 100, achievement: 'RING-BEARER' },
    },
    pulse: {
      itemId: 'flux',
      itemName: 'A FLUX CAPACITOR',
      hint: 'It looks like a Y-shaped tube of glowing crystal.',
      acceptLine:
        'GREAT SCOTT! MY FLUX CAPACITOR! YOU FOUND IT! \nNOW WE CAN GO BACK TO… THE FUTURE? THE PAST? TO LUNCH? TAKE THESE COINS.',
      reward: { coins: 60, achievement: 'TIME-FRIEND' },
    },
    snipper: {
      itemId: 'web',
      itemName: 'A WEB CARTRIDGE',
      hint: 'Sticky. Glow-in-the-dark.',
      acceptLine:
        'WHOA! MY LAST CARTRIDGE! I LITERALLY COULDN\u2019T SWING WITHOUT THIS. \nHERE — HAVE SOME COINS AND A REALLY BAD PUN.',
      reward: { coins: 40, achievement: 'WEB-PARTNER' },
    },
    liberty: {
      itemId: 'shield',
      itemName: 'A WORN SHIELD',
      hint: 'Round. Striped. Surprisingly light.',
      acceptLine:
        'YOU FOUND MY SHIELD. SOLDIER, YOU ARE A CREDIT TO THIS VILLAGE. \nTAKE THESE COINS, AND STAND TALL.',
      reward: { coins: 70, achievement: 'SHIELD-BEARER' },
    },
    greyvale: {
      itemId: 'grapple',
      itemName: 'A GRAPPLING HOOK',
      hint: 'Black steel. Worn grip.',
      acceptLine:
        'YOU HAVE EYES THAT SEE IN THE DARK.\nTHIS WAS MINE. KEEP THESE COINS. STAY WATCHFUL.',
      reward: { coins: 80, achievement: 'NIGHT-AGENT' },
    },
    croaker: {
      itemId: 'poem',
      itemName: 'A FOLDED POEM',
      hint: 'A creased page with shaky green handwriting.',
      acceptLine:
        'CROAKER… WROTE THIS. CROAKER FORGOT. CROAKER NOT CRY. \nTAKE COINS. GO. CROAKER MUST… BE ALONE NOW.',
      reward: { coins: 50, achievement: 'POEM-FINDER' },
    },
  };
})();
