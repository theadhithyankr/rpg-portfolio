// =========================================================
//  data.js — Adhithyan KR resume content
//  Loaded as a plain script; exposes window.PORTFOLIO_DATA.
// =========================================================

window.PORTFOLIO_DATA = {
  player: {
    name: 'ADHITHYAN K R',
    class: 'Software Engineer',
    subclass: 'Game Systems · Full-Stack · Mobile',
    level: 13,
    hp: 96, hpMax: 100,
    mp: 84, mpMax: 100,
    xp: 8650, xpMax: 10000,
    location: 'Ernakulam, IN',
    party: 'PARTY OF ONE',
    initials: 'AK',
    tagline:
      'Software engineer with a dual focus: game-systems engineering (social-casino architectures, RTP tuning, weighted RNG, real-time engagement loops) and production full-stack & mobile work in React, Next.js, React Native, and Flutter — from end-to-end SDLC to integration with REST and AI APIs.',
  },

  stats: [
    { key: 'STR', name: 'BACKEND',     value: 84, color: 'pink',     note: 'Node.js · REST · FastAPI · Postgres' },
    { key: 'INT', name: 'GAME LOGIC',  value: 94, color: 'yellow',   note: 'RNG · RTP · probability modeling' },
    { key: 'DEX', name: 'FRONTEND',    value: 90, color: 'cyan',     note: 'React · Next.js · Canvas · Tailwind' },
    { key: 'AGI', name: 'MOBILE',      value: 86, color: 'purple',   note: 'React Native · Flutter · Expo' },
    { key: 'WIS', name: 'SYSTEMS',     value: 88, color: 'good',     note: 'end-to-end SDLC, modular architecture' },
    { key: 'CHA', name: 'COLLAB',      value: 84, color: 'pink',     note: 'cross-functional, code review, comms' },
  ],

  skills: [
    {
      group: 'PROGRAMMING LANGUAGES',
      icon: '⌨',
      color: 'good',
      items: [
        { name: 'JavaScript / TS', lvl: 5 },
        { name: 'Python',          lvl: 4 },
        { name: 'Java',            lvl: 4 },
        { name: 'SQL',             lvl: 4 },
        { name: 'Dart (Flutter)',  lvl: 3 },
        { name: 'HTML5 / CSS3',    lvl: 5 },
      ],
    },
    {
      group: 'FRONTEND',
      icon: '▲',
      color: 'cyan',
      items: [
        { name: 'React.js',         lvl: 5 },
        { name: 'Next.js',          lvl: 4 },
        { name: 'React Native',     lvl: 4 },
        { name: 'Flutter',          lvl: 3 },
        { name: 'Tailwind CSS v4',  lvl: 4 },
        { name: 'HTML5 Canvas',     lvl: 5 },
      ],
    },
    {
      group: 'BACKEND & DATABASES',
      icon: '●',
      color: 'pink',
      items: [
        { name: 'Node.js',     lvl: 5 },
        { name: 'REST APIs',   lvl: 5 },
        { name: 'FastAPI',     lvl: 4 },
        { name: 'WebSockets',  lvl: 5 },
        { name: 'PostgreSQL',  lvl: 4 },
        { name: 'Supabase / Firebase', lvl: 4 },
      ],
    },
    {
      group: 'GAME SYSTEMS & LOGIC',
      icon: '◆',
      color: 'yellow',
      items: [
        { name: 'RNG Systems',          lvl: 5 },
        { name: 'RTP Tuning',           lvl: 5 },
        { name: 'Probability Modeling', lvl: 4 },
        { name: 'Game Loops',           lvl: 5 },
        { name: 'State Management',     lvl: 5 },
        { name: 'AI Heuristics',        lvl: 4 },
      ],
    },
    {
      group: 'ENGINES & GRAPHICS',
      icon: '✦',
      color: 'purple',
      items: [
        { name: 'Phaser 3',         lvl: 5 },
        { name: 'HTML5 Canvas API', lvl: 5 },
        { name: 'Tiled Map Editor', lvl: 3 },
        { name: 'Expo (Audio/Haptics)', lvl: 4 },
        { name: 'Three.js (basics)', lvl: 2 },
        { name: 'SVG / Pixel Art',   lvl: 3 },
      ],
    },
    {
      group: 'APIS, TOOLS & PRACTICES',
      icon: '■',
      color: 'pink',
      items: [
        { name: 'OpenAI API',         lvl: 4 },
        { name: 'Zoho API',           lvl: 3 },
        { name: 'Git · GitHub',       lvl: 5 },
        { name: 'Vite · Postman',     lvl: 5 },
        { name: 'Figma · VS Code',    lvl: 4 },
        { name: 'SDLC · Code Review', lvl: 5 },
      ],
    },
  ],

  quests: [
    {
      title: 'Freelance Software Engineer',
      org: 'Self-Employed · Remote',
      period: 'Sep 2024 — Present',
      role: 'Founder & Engineer',
      status: 'ACTIVE',
      xp: 4800,
      summary:
        'Leading product strategy and end-to-end SDLC across recruitment, finance, workforce-management, e-commerce, and game-systems domains. Build modular, reusable architectures and integrate with REST and AI APIs.',
      bullets: [
        { tag: 'SDLC',          text: 'Contributed to end-to-end software development lifecycle including requirement analysis, design, development, testing, deployment, and maintenance.' },
        { tag: 'Architecture',  text: 'Designed and maintained modular, reusable application components based on functional and system requirements.' },
        { tag: 'Cross-Team',    text: 'Collaborated with cross-functional and international teams, ensuring effective communication and timely delivery.' },
        { tag: 'Code Review',   text: 'Reviewed existing codebases to improve performance, maintainability, and adherence to best practices.' },
        { tag: 'Velai.eu',      text: 'Developed core recruitment modules using React and Supabase; implemented resume-analysis features to assist candidate screening.' },
        { tag: 'Akman Finance', text: 'Built financial-tracking modules using React Native; integrated third-party APIs for invoicing and data synchronisation.' },
        { tag: 'Wall2Walls',    text: 'Developed an internal workforce management system with role-based access and real-time task updates.' },
        { tag: 'Inspofashions', text: 'Designed and deployed a scalable e-commerce platform using Next.js with performance and SEO optimisation.' },
        { tag: 'Leadership',    text: 'Directed product strategy and technical execution as founder, delivering market-ready solutions for diverse industries.' },
      ],
    },
    {
      title: 'Flutter Developer Intern',
      org: 'Zoople Technologies · Kerala, India',
      period: 'Jul 2025 — Aug 2025',
      role: 'Intern, Mobile',
      status: 'COMPLETED',
      xp: 1200,
      summary:
        'Built cross-platform mobile applications in Flutter following team conventions and shipping cycles. Hands-on with API integration, testing, and team workflows.',
      bullets: [
        { tag: 'Cross-Platform', text: 'Developed cross-platform mobile applications using Flutter following standard development practices.' },
        { tag: 'APIs',           text: 'Integrated REST APIs and performed unit-level testing and debugging.' },
        { tag: 'Team',           text: 'Collaborated with senior developers and QA teams to resolve defects and improve application stability.' },
      ],
    },
  ],

  projects: [
    // ─────────────────────────────────────────────────────────────
    //  Add as many projects as you want. Schema:
    //  {
    //    id:      'unique-slug',
    //    name:    'PROJECT NAME',
    //    glyph:   '★',                // any single character / symbol
    //    color:   'yellow'|'cyan'|'pink'|'purple'|'good',
    //    type:    'Short category',   // e.g. 'Mobile Strategy'
    //    stack:   'Tech · Used · Here',
    //    rarity:  'LEGENDARY'|'EPIC'|'RARE'|'COMMON',
    //    tagline: 'One-liner shown under the name.',
    //    stats:   [ { k: 'LABEL', v: 'value' }, ... up to 3 ],
    //    details: [ 'paragraph or bullet', 'another bullet', ... ],
    //    url:     'https://github.com/... (optional)',
    //  }
    // ─────────────────────────────────────────────────────────────
    {
      id: 'slotforge',
      name: 'SlotForge',
      glyph: '$',
      color: 'yellow',
      type: 'Casino Engine',
      stack: 'Phaser 3 · Node.js',
      rarity: 'LEGENDARY',
      tagline: 'Configurable social casino engine.',
      stats: [
        { k: 'RTP',    v: '96.5%' },
        { k: 'Spins',  v: '100K+' },
        { k: 'Reels',  v: '3 × 5' },
      ],
      details: [
        'Engineered a 3-reel, 5-payline slot engine featuring weighted RNG per reel for independent symbol-strip configuration.',
        'Developed a Node.js simulation script that verified 96.5% RTP over 100,000+ spins, ensuring mathematical integrity.',
        'Architected scatter-triggered bonus rounds and engagement-focused Free Spin cycles with multipliers.',
      ],
    },
    {
      id: 'csgk',
      name: 'Coins, Slots, Guns & Keys',
      glyph: '⚔',
      color: 'pink',
      type: 'PvP Arena',
      stack: 'Phaser 3 · Vanilla JS',
      rarity: 'EPIC',
      tagline: '2-player PvP with dynamic RNG.',
      stats: [
        { k: 'Players', v: '2 PvP' },
        { k: 'Sync',    v: '<100ms' },
        { k: 'RNG',     v: 'Dynamic' },
      ],
      details: [
        'Developed a 2-player PvP engine with a dynamic Slot RNG system that adjusts odds based on global game state.',
        'Implemented complex state handling for weapon timers and sub-100ms state-sync latency for combat progression.',
      ],
    },
    {
      id: 'mctictactoe',
      name: 'Minecraft-Style Tic-Tac-Toe',
      glyph: '⛏',
      color: 'cyan',
      type: 'Mobile Strategy',
      stack: 'React Native · Expo',
      rarity: 'RARE',
      tagline: 'Scalable grid + heuristic AI.',
      stats: [
        { k: 'Players', v: '2–4' },
        { k: 'AI',      v: '3-tier' },
        { k: 'Grid',    v: 'Dynamic' },
      ],
      details: [
        'Built a scalable engine for 2–4 players with dynamic grid expansion and a 3-tier heuristic-based AI system.',
        'Integrated Expo Audio and Haptic feedback loops to enhance sensory-rich player engagement and UI responsiveness.',
      ],
    },
    {
      id: 'flappy',
      name: 'Flappy Goes to Space',
      glyph: '✦',
      color: 'purple',
      type: 'Arcade Engine',
      stack: 'React · HTML5 Canvas',
      rarity: 'RARE',
      tagline: 'Zero-G arcade with 60 FPS target.',
      stats: [
        { k: 'FPS',     v: '60' },
        { k: 'Lag',     v: '−30%' },
        { k: 'Gravity', v: 'Zero' },
      ],
      details: [
        'Built a custom arcade engine with zero-gravity physics logic and a difficulty-scaling algorithm targeting 60 FPS.',
        'Reduced render lag by 30% through optimized update cycles and manual memory management in the rendering loop.',
      ],
    },
    {
      id: 'fitnessai',
      name: 'FitnessAI',
      glyph: '♥',
      color: 'good',
      type: 'AI Web App',
      stack: 'React · OpenAI API',
      rarity: 'EPIC',
      tagline: 'Personalized fitness plans, AI-generated.',
      stats: [
        { k: 'AI',    v: 'OpenAI' },
        { k: 'Auth',  v: 'Secure' },
        { k: 'UI',    v: 'Responsive' },
      ],
      details: [
        'Developed a modular web application generating personalized fitness plans based on user inputs.',
        'Implemented secure authentication and responsive UI using modern frontend frameworks.',
      ],
    },
    {
      id: 'compareason',
      name: 'Compareason',
      glyph: '⇄',
      color: 'cyan',
      type: 'Mobile E-Commerce',
      stack: 'React Native · Node.js',
      rarity: 'RARE',
      tagline: 'Cross-platform price aggregator.',
      stats: [
        { k: 'Sources', v: 'Multi' },
        { k: 'Updates', v: 'Live' },
        { k: 'Mobile',  v: 'iOS+And' },
      ],
      details: [
        'Built a mobile application aggregating product prices from multiple e-commerce platforms.',
        'Implemented backend scripts for data extraction and real-time updates.',
      ],
    },
    {
      id: 'bunkit',
      name: 'BunkIt',
      glyph: '✎',
      color: 'pink',
      type: 'EdTech Web',
      stack: 'React · Legacy → Modern',
      rarity: 'RARE',
      tagline: 'Attendance tracker for students.',
      stats: [
        { k: 'Users',  v: 'Students' },
        { k: 'Stack',  v: 'React' },
        { k: 'Migrate', v: 'Legacy' },
      ],
      details: [
        'Developed a web-based attendance tracking system for students.',
        'Migrated legacy logic to a modern React-based architecture.',
      ],
    },
    {
      id: 'inspofashions',
      name: 'Inspofashions',
      glyph: '◈',
      color: 'purple',
      type: 'E-Commerce Web',
      stack: 'Next.js · SEO',
      rarity: 'RARE',
      tagline: 'Scalable storefront, SEO-tuned.',
      stats: [
        { k: 'Stack', v: 'Next.js' },
        { k: 'SEO',   v: 'Tuned' },
        { k: 'Perf',  v: 'Optimized' },
      ],
      details: [
        'Designed and deployed a scalable e-commerce platform using Next.js.',
        'Performance and SEO optimisation for organic traffic and conversion.',
      ],
    },
    {
      id: 'github-misc',
      name: 'Additional Projects',
      glyph: '◇',
      color: 'good',
      type: 'GitHub Portfolio',
      stack: 'Various',
      rarity: 'COMMON',
      tagline: 'Academic & personal repositories.',
      stats: [
        { k: 'Focus', v: 'Problem-Solving' },
        { k: 'Style', v: 'Modular' },
        { k: 'Where', v: 'GitHub' },
      ],
      details: [
        'Developed multiple academic and personal projects demonstrating problem-solving, modular design, and software-engineering fundamentals.',
        'Explore the full list on GitHub via the link below.',
      ],
      url: 'https://github.com/theadhithyankr',
    },
  ],

  records: {
    education: [
      {
        school: 'SCMS School of Engineering and Technology',
        location: 'Ernakulam, India',
        degree: 'B.Tech in Computer Science (Data Science)',
        period: '2022 — 2026 (Expected)',
      },
    ],
    achievements: [
      { title: 'INNOVATION MINDSET',  body: 'Constant drive to implement creative, performance-optimized solutions in gameplay mechanics and RNG probability systems.' },
      { title: 'MATHEMATICAL LOGIC',  body: 'Deep analytical focus on RTP, variance, and long-term game balance for engagement-heavy systems.' },
      { title: 'LEADERSHIP & SDLC',   body: 'Experienced leading high-stakes projects from conception to deployment as founder and technical innovator.' },
      { title: 'RTP VERIFIED',        body: 'Validated 96.5% return-to-player over 100,000+ simulated spins on a custom casino engine.' },
      { title: 'SUB-100MS COMBATANT', body: 'Achieved sub-100ms state-sync latency in a real-time 2-player PvP architecture.' },
      { title: '60 FPS BOSS',         body: 'Shipped a custom canvas arcade engine at a locked 60 FPS, cutting render lag by 30%.' },
      { title: 'STRONG COMMUNICATOR', body: 'Strong communication and interpersonal skills; effective across cross-functional and international teams.' },
      { title: 'TEAM PLAYER',         body: 'Effective collaboration in large and distributed teams, from QA to senior engineering.' },
      { title: 'ADAPTIVE LEARNER',    body: 'Ability to learn new technologies and adapt to changing environments — picked up Flutter in weeks for a shipping internship.' },
      { title: 'PROBLEM SOLVER',      body: 'Strong analytical and problem-solving skills, applied to systems debugging, performance tuning, and algorithmic design.' },
      { title: 'SELF-STARTER',        body: 'Ability to work independently and take initiative — operates solo as a freelance founder for international clients.' },
      { title: 'FULL-STACK SHIPPER',  body: 'Delivered production web and mobile builds across React, Next.js, React Native, and Flutter.' },
    ],
  },

  contact: {
    intro: "I'm available for game-systems contracts, real-time architecture work, and full-stack / mobile builds (React, Next.js, React Native, Flutter). Pick a line below.",
    lines: [
      { kind: 'EMAIL',    label: 'theadhithyankr@gmail.com',        href: 'mailto:theadhithyankr@gmail.com',         glyph: '✉' },
      { kind: 'PHONE',    label: '+91 87142 74576',                 href: 'tel:+918714274576',                       glyph: '☎' },
      { kind: 'LINKEDIN', label: 'linkedin.com/in/adhithyan-k-r',   href: 'https://linkedin.com/in/adhithyan-k-r',   glyph: 'in' },
      { kind: 'GITHUB',   label: 'github.com/theadhithyankr',       href: 'https://github.com/theadhithyankr',       glyph: '◇' },
    ],
  },
};
