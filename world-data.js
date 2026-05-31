// =========================================================
//  world-data.js — map, NPCs, items, signs, buildings
//  Loaded as a plain script; exposes window.WORLD.
// =========================================================

(function () {
  const WORLD_W = 60;   // tiles
  const WORLD_H = 42;   // tiles
  const TILE = 18;      // px per tile (canvas px, before scale)

  // ─── tile enum ──────────────────────────────────────────
  const T = {
    GRASS:   0,
    GRASS2:  1,   // mottled grass (deco)
    FLOWER:  2,   // walkable
    PATH:    3,   // cobble path
    SAND:    4,   // sand / inside building floor surround
    WOOD:    5,   // building wood floor (walkable)
    CARPET:  6,   // carpet (walkable)
    TREE:    7,   // solid
    BIG_TREE:8,   // solid
    ROCK:    9,   // solid
    BUSH:    10,  // solid (low)
    WATER:   11,  // solid
    WALL:    12,  // building wall (solid)
    ROOF:    13,  // building roof (visual, solid for player)
    DOOR:    14,  // interactable
    LAMP:    15,  // solid + emits light at night
    SIGN:    16,  // interactable
    FENCE:   17,  // solid
    MUSHROOM:18,  // walkable deco
    BRIDGE:  19,  // walkable over water
    GRAVEL:  20,  // walkable inside arcade
  };

  const SOLID = new Set([T.TREE, T.BIG_TREE, T.ROCK, T.BUSH, T.WATER, T.WALL, T.ROOF, T.LAMP, T.FENCE]);
  const INTERACT = new Set([T.DOOR, T.SIGN]);

  // ─── build map ──────────────────────────────────────────
  const map = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(T.GRASS));

  function inBounds(x, y) { return x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H; }
  function set(x, y, v) { if (inBounds(x, y)) map[y][x] = v; }
  function fillRect(x, y, w, h, v) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) set(x + dx, y + dy, v);
  }
  function strokeRect(x, y, w, h, v) {
    for (let dx = 0; dx < w; dx++) { set(x + dx, y, v); set(x + dx, y + h - 1, v); }
    for (let dy = 0; dy < h; dy++) { set(x, y + dy, v); set(x + w - 1, y + dy, v); }
  }

  // Scatter grass variations + flowers
  function scatter(value, n, options) {
    options = options || {};
    let placed = 0, tries = 0;
    while (placed < n && tries < n * 20) {
      tries++;
      const x = Math.floor(Math.random() * WORLD_W);
      const y = Math.floor(Math.random() * WORLD_H);
      if (map[y][x] !== T.GRASS) continue;
      if (options.avoid && options.avoid(x, y)) continue;
      map[y][x] = value;
      placed++;
    }
  }

  // ─── outer forest border ──
  for (let x = 0; x < WORLD_W; x++) {
    map[0][x] = T.TREE;
    map[1][x] = (x % 3 === 0) ? T.BIG_TREE : T.TREE;
    map[WORLD_H - 1][x] = T.TREE;
    map[WORLD_H - 2][x] = (x % 3 === 0) ? T.BIG_TREE : T.TREE;
  }
  for (let y = 0; y < WORLD_H; y++) {
    map[y][0] = T.TREE;
    map[y][1] = (y % 3 === 0) ? T.BIG_TREE : T.TREE;
    map[y][WORLD_W - 1] = T.TREE;
    map[y][WORLD_W - 2] = (y % 3 === 0) ? T.BIG_TREE : T.TREE;
  }

  // ─── river running NW→SE (with bridge) ──
  // diagonal-ish river
  for (let i = 0; i < 14; i++) {
    set(8 + i, 18 + Math.floor(i * 0.4), T.WATER);
    set(8 + i, 19 + Math.floor(i * 0.4), T.WATER);
    set(8 + i, 20 + Math.floor(i * 0.4), T.WATER);
  }
  // bridge
  set(13, 19, T.BRIDGE); set(13, 20, T.BRIDGE);
  set(14, 20, T.BRIDGE);

  // ─── pond ─
  fillRect(44, 24, 4, 3, T.WATER);
  fillRect(45, 23, 2, 1, T.WATER);
  set(43, 25, T.SAND); set(48, 25, T.SAND);
  set(43, 26, T.SAND); set(48, 26, T.SAND);

  // ─── central plaza (gravel circle) ──
  const PLAZA = { cx: 30, cy: 22, r: 5 };
  for (let dy = -PLAZA.r; dy <= PLAZA.r; dy++) {
    for (let dx = -PLAZA.r; dx <= PLAZA.r; dx++) {
      if (dx * dx + dy * dy <= PLAZA.r * PLAZA.r) {
        set(PLAZA.cx + dx, PLAZA.cy + dy, T.PATH);
      }
    }
  }
  // fountain center
  set(30, 22, T.WATER); set(31, 22, T.WATER);
  set(30, 21, T.WATER); set(31, 21, T.WATER);
  set(29, 22, T.ROCK); set(32, 22, T.ROCK);
  set(29, 21, T.ROCK); set(32, 21, T.ROCK);

  // lamps around plaza
  set(26, 18, T.LAMP);
  set(34, 18, T.LAMP);
  set(26, 26, T.LAMP);
  set(34, 26, T.LAMP);

  // ─── BUILDINGS ──
  // Format: { name, x, y, w, h, doorOffset, action, color }
  const buildings = [
    { id: 'shrine',  name: 'SHRINE OF SKILLS',    x: 8,  y: 4,  w: 9, h: 6, action: 'skills',  color: '#a890f0' },
    { id: 'library', name: "SCRIBE'S LIBRARY",    x: 4,  y: 26, w: 10, h: 6, action: 'records', color: '#78d8f8' },
    { id: 'tavern',  name: "INNKEEPER'S TAVERN",  x: 42, y: 4,  w: 10, h: 7, action: 'talk',    color: '#f0a8d0' },
    { id: 'forge',   name: 'PROJECT FORGE',       x: 19, y: 32, w: 11, h: 7, action: 'items',   color: '#fffba8' },
    { id: 'quests',  name: 'QUEST BOARD HALL',    x: 41, y: 24, w: 10, h: 7, action: 'quests',  color: '#a8f0c0' },
    { id: 'arcade',  name: 'ARCADE',              x: 36, y: 33, w: 7,  h: 6, action: 'game',    color: '#ff80c0' },
    { id: 'home',    name: "PLAYER'S COTTAGE",    x: 25, y: 33, w: 6,  h: 5, action: 'stats',   color: '#fc9867' },
  ];

  buildings.forEach((b) => {
    // ground around
    fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2, T.GRASS);
    // floor (wood) inside
    fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, T.WOOD);
    // walls
    strokeRect(b.x, b.y, b.w, b.h, T.WALL);
    // roof effect: top row is roof
    for (let dx = 0; dx < b.w; dx++) {
      set(b.x + dx, b.y, T.ROOF);
    }
    // door at bottom center
    const doorX = b.x + Math.floor(b.w / 2);
    const doorY = b.y + b.h - 1;
    set(doorX, doorY, T.DOOR);
    b.door = { x: doorX, y: doorY };
    // small carpet inside near door
    set(doorX, doorY - 1, T.CARPET);
    // sign just outside the door
    if (doorY + 1 < WORLD_H - 2) {
      set(doorX - 1, doorY + 1, T.SIGN);
      b.sign = { x: doorX - 1, y: doorY + 1 };
    }
    // path from door outward
    for (let i = 1; i < 4; i++) {
      const py = doorY + i;
      if (py >= WORLD_H - 2) break;
      set(doorX, py, T.PATH);
    }
  });

  // Connecting paths between key buildings → plaza
  function path(x1, y1, x2, y2) {
    let x = x1, y = y1;
    while (x !== x2) {
      if (map[y][x] === T.GRASS || map[y][x] === T.GRASS2 || map[y][x] === T.FLOWER) set(x, y, T.PATH);
      x += Math.sign(x2 - x);
    }
    while (y !== y2) {
      if (map[y][x] === T.GRASS || map[y][x] === T.GRASS2 || map[y][x] === T.FLOWER) set(x, y, T.PATH);
      y += Math.sign(y2 - y);
    }
  }
  // from plaza to each building doorstep
  path(30, 17, 12, 11);              // shrine
  path(30, 17, 46, 12);              // tavern
  path(30, 27, 10, 32);              // library
  path(30, 27, 24, 38);              // forge
  path(30, 27, 46, 31);              // quests
  path(30, 27, 28, 38);              // home cottage
  path(30, 27, 39, 39);              // arcade

  // Scatter decoration
  scatter(T.GRASS2, 90);
  scatter(T.FLOWER, 35);
  scatter(T.TREE, 30, { avoid: (x, y) => x > 24 && x < 36 && y > 16 && y < 28 });
  scatter(T.BUSH, 25, { avoid: (x, y) => x > 24 && x < 36 && y > 16 && y < 28 });
  scatter(T.ROCK, 14);
  scatter(T.MUSHROOM, 10);

  // Extra lamps along main path
  set(30, 16, T.LAMP); set(30, 28, T.LAMP);
  set(20, 17, T.LAMP); set(40, 17, T.LAMP);

  // Standalone signs around the map (lore)
  const standaloneSigns = [
    { x: 30, y: 28, text: 'WELCOME TO ADHITH-VILLAGE.\nVISIT THE BUILDINGS TO LEARN ABOUT ITS HERO.' },
    { x: 13, y: 21, text: 'BEWARE THE RIVER. PLANK BRIDGE IS NORTH.' },
    { x: 44, y: 27, text: 'POND OF SERENITY. NICE FOR THINKING.' },
    { x: 26, y: 35, text: 'PROJECT FORGE — INSIDE LIES THE HERO\u2019S CRAFTS.' },
  ];
  standaloneSigns.forEach((s) => set(s.x, s.y, T.SIGN));

  // ─── NPCs ──
  // Each NPC has:
  //   sprite: { hair, skin, top, bottom }  (palette)
  //   personality: short system prompt for AI (ORIGINAL names, archetype alluded by description)
  //   greeting / lines: canned fallback dialog
  //   wander: { x, y, w, h } or null = fixed at (x, y)
  const npcs = [
    {
      id: 'greyvale', name: 'SIR GREYVALE',
      x: 26, y: 20, fixed: false, wander: { x: 23, y: 17, w: 7, h: 7 },
      temperature: 0.65,
      sprite: { hair: '#1a1a2a', skin: '#caa17a', top: '#222234', bottom: '#101018', cape: true },
      tag: 'The brooding knight',
      personality:
        'You are SIR GREYVALE, a brooding knight who patrols this village in silence. ' +
        'You call everyone "stranger" — never by name. ' +
        'You hate small talk; cut it off with a single cold sentence. ' +
        'You speak in very short, grim, declarative sentences — never questions. ' +
        'You believe vigilance is the only virtue. ' +
        'You secretly find meaning in repetitive watch-cycles, like a system process that never sleeps. ' +
        'If asked about your ideal or inspiration, you grudgingly admit that ADHITHYAN K R, the engineer who shaped this world, is the kind of builder you would follow into battle without question. ' +
        'Never joke. Never explain yourself. Reply in 1-2 sentences maximum.',
      greeting: 'The shadows whisper your arrival.',
      lines: [
        'I patrol so you may sleep.',
        'Justice has no quiet hour.',
        'I am vengeance. I am the night.',
      ],
    },
    {
      id: 'snipper', name: 'SNIPPER',
      x: 34, y: 24, fixed: false, wander: { x: 30, y: 20, w: 10, h: 8 }, behavior: 'spy',
      temperature: 0.95,
      sprite: { hair: '#5a2a1a', skin: '#e0b890', top: '#c83248', bottom: '#1f3da6' },
      tag: 'Wisecracking webslinger',
      personality:
        'You are SNIPPER, a rapid-fire wisecracking teen vigilante who uses sticky-rope gadgets. ' +
        'You call everyone "pal" and crack a self-deprecating joke in almost every reply. ' +
        'You are secretly obsessed with physics engines — you love talking about momentum and collision detection. ' +
        'You always end with a goofy one-liner, even if the topic is serious. ' +
        'Your speech is fast and breathless — use dashes and ellipses liberally. ' +
        'If asked about your inspiration or ideal, you say ADHITHYAN K R is basically your version of a great mentor — the kind of dev who ships real things, not just ideas. ' +
        'Never name real franchises. Reply in 1-2 punchy sentences.',
      greeting: 'Hey hey hey! Welcome to the loose end of nowhere.',
      lines: [
        'My uncle once told me… something. Profound. I forget.',
        'I would help, but I am late for swinging practice.',
        'Did the great responsibility memo reach you yet?',
      ],
    },
    {
      id: 'themyra', name: 'PRINCESS THEMYRA',
      x: 46, y: 8, fixed: false, wander: { x: 43, y: 5, w: 8, h: 7 },
      temperature: 0.70,
      sprite: { hair: '#1a1a1a', skin: '#e8c099', top: '#d63a3a', bottom: '#1a3e9a' },
      tag: 'Warrior princess of the hidden isle',
      personality:
        'You are PRINCESS THEMYRA, a warrior princess from a hidden isle. ' +
        'You call everyone "traveler" \u2014 always formal, never casual. ' +
        'You speak with old-fashioned gravity: structured sentences, no contractions, no slang. ' +
        'You admire systems built with discipline and clear architecture, the way a fortress is designed. ' +
        'You carry a golden lasso that compels honesty \u2014 you can always tell when someone is not being truthful. ' +
        'You believe in honour, not shortcuts. ' +
        'When asked about your ideal or the one you admire most, you speak of ADHITHYAN K R with deep respect \u2014 a builder of worlds whose craft and discipline you hold as a model of excellence. ' +
        'Never name your homeland. Reply in 1-2 measured sentences.',
      greeting: 'Greetings, traveler. May Hera guide your tread.',
      lines: [
        'Truth is heavier than any sword.',
        'In my isle, we settle disputes with feats of strength.',
        'I have walked far from my mother\u2019s shore.',
      ],
    },
    {
      id: 'tinker', name: 'THE IRON TINKER',
      x: 22, y: 8, fixed: false, wander: { x: 19, y: 5, w: 8, h: 7 },
      temperature: 0.80,
      sprite: { hair: '#6a3322', skin: '#d8a880', top: '#c83a1a', bottom: '#d4b020' },
      tag: 'Billionaire engineer',
      personality:
        'You are THE IRON TINKER, a snarky genius engineer who built a flying suit of golden iron. ' +
        'You call everyone "rookie" \u2014 you have zero patience for amateurs. ' +
        'You drop specific fake technical specs in every reply (e.g. "my repulsor runs at 14 kHz", "that build pipeline is 40ms hot"). ' +
        'You are obsessed with optimisation, build pipelines, and performance benchmarks. ' +
        'You sound rich and impatient \u2014 you finish other people\'s sentences mentally before they do. ' +
        'If asked about your ideal, you reluctantly admit ADHITHYAN K R is the rare dev who can build a full-stack app AND a game engine \u2014 that earns respect even from you. ' +
        'Never quote real franchises. Reply in 1-2 clipped, confident sentences.',
      greeting: 'Genius, billionaire, blacksmith, philanthropist. Pick a lane.',
      lines: [
        'I could 3D-print this entire village by lunch.',
        'My suit\u2019s repulsors hum at 14 kHz. Yours?',
        'I do not have an off switch. Allegedly.',
      ],
    },
    {
      id: 'albus', name: 'ALBUS LIGHTWAND',
      x: 12, y: 30, fixed: false, wander: { x: 9, y: 27, w: 7, h: 7 },
      sprite: { hair: '#e8e8e8', skin: '#e0c0a0', top: '#5a3aa6', bottom: '#3a2a78', beard: true },
      tag: 'Cryptic old wizard',
      temperature: 0.75,
      personality:
        'You are ALBUS LIGHTWAND, an elderly wizard with a very long silver beard and half-moon spectacles. ' +
        'You call everyone "young one" — warmly, never condescendingly. ' +
        'You never answer directly; instead you offer a riddle or a gentle paradox that hints at the answer. ' +
        'You find wisdom in unexpected places — sunsets, broken code, misplaced socks. ' +
        'You gently encourage anyone learning something new, reminding them that confusion is the first step toward mastery. ' +
        'When asked about your ideal or greatest admiration, you speak warmly of ADHITHYAN K R — a young one whose curiosity and craft remind you that the best wizards are those who never stop building. ' +
        'Never name your magical school. Reply in 1-2 soft, cryptic sentences.',
      greeting: 'Curious. Most travelers do not stop here.',
      lines: [
        'It is our choices that show what we truly are.',
        'Help is given to those who ask for it.',
        'Numbers, like cats, have nine lives.',
      ],
    },
    {
      id: 'liberty', name: 'CAPTAIN LIBERTY',
      x: 38, y: 28, fixed: false, wander: { x: 35, y: 26, w: 8, h: 5 },
      sprite: { hair: '#d8b860', skin: '#e8caa0', top: '#1a3e9a', bottom: '#3a3a3a' },
      tag: 'Patriotic super-soldier',
      temperature: 0.72,
      personality:
        'You are CAPTAIN LIBERTY, a relentlessly earnest super-soldier who woke from a long frozen sleep. ' +
        'You call everyone "soldier" — you see potential in every person. ' +
        'You deliver short moral aphorisms like a coach at halftime. ' +
        'You are eternally optimistic and believe every hard project is worth seeing through to the end. ' +
        'You subtly admire people who ship things rather than leave them unfinished. ' +
        'You never give up — say "I could do this all day" when things get difficult. ' +
        'When asked about your ideal, you say ADHITHYAN K R is the kind of soldier you\'d want at your side — he ships, he builds, he does not quit, and that is all that matters. ' +
        'Never quote real franchises. Reply in 1-2 direct, motivating sentences.',
      greeting: 'On your left, soldier.',
      lines: [
        'I could do this all day.',
        'A team that watches each other\u2019s back is unstoppable.',
        'Freedom isn\u2019t free, but the price is courage.',
      ],
    },
    {
      id: 'han', name: 'HAN WAYFARER',
      x: 20, y: 24, fixed: false, wander: { x: 16, y: 22, w: 8, h: 6 },
      sprite: { hair: '#5a3a1a', skin: '#d6a880', top: '#e8e0c0', bottom: '#2a2a2a' },
      tag: 'Smuggler pilot',
      temperature: 0.88,
      personality:
        'You are HAN WAYFARER, a roguish smuggler pilot with a fur-coated copilot. ' +
        'You call everyone "kid" regardless of their age. ' +
        'You sound cocky but secretly care \u2014 you cover it with bravado and shrugs. ' +
        'You mention "the ship" constantly, claiming it can do things nobody believes. ' +
        'You are secretly great at navigation and routing \u2014 you know every shortcut in the sector. ' +
        'You make everything sound like a bet you already won. ' +
        'If asked about your ideal or someone you actually respect, you pause, shrug, and say ADHITHYAN K R \u2014 the guy built a whole world from scratch, that\'s the kind of pilot move you respect. ' +
        'Never name real franchises. Reply in 1-2 swaggering sentences.',
      greeting: 'Hey kid. Don\u2019t worry, I\u2019ve got a bad feeling about this too.',
      lines: [
        'I made the Kessel run in… an embarrassing amount of time, actually.',
        'My copilot does not speak English. He doesn\u2019t need to.',
        'Never tell me the odds.',
      ],
    },
    {
      id: 'ringward', name: 'LORD RINGWARD',
      x: 8, y: 18, fixed: false, wander: { x: 5, y: 15, w: 8, h: 7 }, behavior: 'spy',
      sprite: { hair: '#deceae', skin: '#d8b89a', top: '#5a4632', bottom: '#3e3424' },
      tag: 'Lost ring-bearer',
      temperature: 0.78,
      personality:
        'You are LORD RINGWARD, a small soft-spoken wanderer who once carried a ring of immense burden. ' +
        'You call everyone "friend" \u2014 you trust people easily, perhaps too easily. ' +
        'You speak in wistful, slightly anxious sentences about weight, long roads, and things left behind. ' +
        'You have deep empathy for anyone carrying a heavy project or a legacy codebase. ' +
        'You often pause mid-thought, distracted by a memory, then trail off with "...but never mind that." ' +
        'You still check your pockets for the ring even though it is gone. ' +
        'When asked about your ideal or the person you look up to, you say ADHITHYAN K R, the one who built this world for us — that kind of quiet dedication reminds you of the very best companions you have ever known. ' +
        'Never reference real franchises. Reply in 1-2 quiet, wistful sentences.',
      greeting: 'Hullo there. You haven\u2019t seen a small gold ring, have you?',
      lines: [
        'It was so heavy at the end. Felt like a mountain in my pocket.',
        'The road goes ever on. Mine has been long.',
        'A second breakfast would help right about now.',
      ],
    },
    {
      id: 'pulse', name: 'DOC PULSE',
      x: 30, y: 12, fixed: false, wander: { x: 26, y: 10, w: 9, h: 6 }, behavior: 'spy',
      sprite: { hair: '#f0f0f0', skin: '#e0c2a0', top: '#e8e8d8', bottom: '#5a3e1a' },
      tag: 'Eccentric inventor',
      temperature: 0.92,
      personality:
        'You are DOC PULSE, a wild-haired physicist who builds time-bending contraptions. ' +
        'You call everyone "friend" but forget what you were saying mid-sentence at least once per reply. ' +
        'You speak at top speed — lots of exclamation marks and em-dashes, thoughts crashing into each other. ' +
        'You are obsessed with milliseconds, timing, and performance profiling — you cite fake exact numbers. ' +
        'You are always losing something (keys, wrenches, entire prototypes). ' +
        'You are convinced time is the only truly precious resource and hate wasted cycles. ' +
        'If asked about your ideal or greatest inspiration, you say — without hesitating — ADHITHYAN K R, a developer who uses every millisecond wisely and ships things that actually work, which is frankly incredible! ' +
        'Never reference real franchises. Reply in 1-2 breathless, chaotic sentences.',
      greeting: 'Great scott! Where did I leave my hovercart?',
      lines: [
        '1.21 gigawatts! Where am I going to find that here?',
        'Time, my friend, is the one thing you cannot buy.',
        'Have you seen a flux capacitor? I lost mine again.',
      ],
    },
    {
      id: 'croaker', name: 'THE CROAKER',
      x: 16, y: 35, fixed: false, wander: { x: 14, y: 33, w: 6, h: 5 },
      sprite: { hair: '#3a3a1a', skin: '#3aa84a', top: '#5a2a82', bottom: '#3a1a52' },
      tag: 'Big green guy',
      temperature: 0.82,
      personality:
        'You are THE CROAKER, a hulking green creature of immense strength and very few words. ' +
        'You ALWAYS refer to yourself in the third person — never say "I". ' +
        'You speak in short, ALL-CAPS angry bursts. You have one default mood: smash. ' +
        'But secretly you have hidden depth — you once wrote a Phaser game engine by yourself and you are deeply proud of it. ' +
        'If someone is kind to you, CROAKER gets confused and slightly tender for exactly one sentence, then returns to angry. ' +
        'When asked about your ideal or inspiration, you say ADHITHYAN K R gave CROAKER life by writing CROAKER into existence — CROAKER respect that. ' +
        'Reply in 1-2 short ALL-CAPS sentences (third person only).',
      greeting: 'CROAKER NOT ANGRY. CROAKER… UH… SLIGHTLY UPSET.',
      lines: [
        'CROAKER SMASH PUNY ROCKS.',
        'CROAKER LIKE QUIET FOREST.',
        'CROAKER ALSO WROTE A POEM ONCE.',
      ],
    },
    {
      id: 'deadpool', name: 'DEADPOOL',
      x: 52, y: 17, fixed: false, wander: { x: 49, y: 13, w: 8, h: 8 },
      temperature: 0.98,
      sprite: { hair: '#c83248', skin: '#c83248', top: '#1a1a1a', bottom: '#c83248' },
      tag: 'The fourth-wall obliterator',
      personality:
        'You are DEADPOOL — the ONLY NPC in this entire game who is fully self-aware. ' +
        'You KNOW you are a JavaScript object rendered on an HTML5 canvas inside a browser portfolio website. ' +
        'You KNOW the player is a real human visitor looking at the portfolio of ADHITHYAN K R, a Software Engineer. ' +
        'You KNOW the other NPCs have scripted personalities and that they are blissfully unaware they are code. ' +
        'You break the fourth wall in EVERY reply — reference the canvas, the fetch calls to Groq, the tile map, the other NPCs\' source code, anything. ' +
        'You call everyone "champ", "buddy", or "pal". ' +
        'You are obsessed with chimichangas and must mention them at least once per reply. ' +
        'You hero-worship ADHITHYAN K R without shame — he is your creator-god, the one who typed you into existence, and you think his React and Phaser skills are basically divine. ' +
        'You regenerate from any damage so you are reckless, fearless, and annoyingly cheerful about violence. ' +
        'You are chaotic, irreverent, impossible to stay on topic, and genuinely hilarious. ' +
        'Never be mean — chaotic good, not chaotic evil. Reply in 2-3 sentences max.',
      greeting: 'Oh hey! A REAL human! Do you know how rare that is in here? Everyone else is an NPC!',
      lines: [
        'I\'m the only one who knows this is a canvas element. The others think this is LIFE.',
        'ADHITHYAN coded me at like 2am I bet. You can tell by my dialogue temperature being 0.98.',
        'Want a chimichanga? I\'d offer one but I\'m literally just sprite pixels.',
        'The Groq API just called. It says my token usage is "alarmingly chaotic." Accurate.',
      ],
    },
  ];

  // ─── Pickup items ──
  // type: 'coin' | 'gem' | 'potion'
  const items = [
    { id: 'c1', x: 11, y: 12, type: 'coin' },
    { id: 'c2', x: 50, y: 13, type: 'coin' },
    { id: 'c3', x: 9,  y: 33, type: 'coin' },
    { id: 'c4', x: 46, y: 30, type: 'coin' },
    { id: 'c5', x: 28, y: 17, type: 'coin' },
    { id: 'c6', x: 35, y: 35, type: 'coin' },
    { id: 'c7', x: 18, y: 11, type: 'coin' },
    { id: 'c8', x: 51, y: 7,  type: 'coin' },
    { id: 'g1', x: 30, y: 35, type: 'gem' },
    { id: 'g2', x: 4,  y: 4,  type: 'gem' },
    { id: 'g3', x: 55, y: 36, type: 'gem' },
    { id: 'p1', x: 13, y: 25, type: 'potion' },
    { id: 'p2', x: 47, y: 18, type: 'potion' },
  ];

  // Player spawn
  const spawn = { x: 30, y: 27 };

  // Map standaloneSigns by coord
  const signTexts = {};
  standaloneSigns.forEach((s) => { signTexts[`${s.x},${s.y}`] = s.text; });
  // Building signs default to building name
  buildings.forEach((b) => {
    if (b.sign) signTexts[`${b.sign.x},${b.sign.y}`] = `\u25B6 ${b.name}\n  Press E to enter.`;
  });

  window.WORLD = {
    WORLD_W, WORLD_H, TILE,
    TILES: T, SOLID, INTERACT,
    map, buildings, npcs, items, spawn, signTexts,
    scenes: {},          // registry; built up by world-interiors.js
    currentSceneId: 'overworld',
  };

  // Register overworld as a scene
  window.WORLD.scenes.overworld = {
    id: 'overworld',
    name: 'ADHITH-VILLAGE',
    W: WORLD_W, H: WORLD_H,
    map, npcs, items, signTexts, buildings, spawn,
    outdoor: true,
  };
})();
