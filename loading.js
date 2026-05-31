// =========================================================
//  loading.js — Breakout-style mini-game as loading screen
//  Player breaks bricks; loading % drops as bricks fall.
//  Auto-completes after ~8s or 80% bricks destroyed.
// =========================================================

(function () {
  // ── DOM refs ──
  const overlay = document.getElementById('loader');
  const canvas = document.getElementById('loader-canvas');
  const bar = document.getElementById('loader-bar');
  const pct = document.getElementById('loader-pct');
  const status = document.getElementById('loader-status');
  const skipBtn = document.getElementById('loader-skip');
  const continueBtn = document.getElementById('loader-continue');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ── Canvas sizing ──
  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  fit();
  window.addEventListener('resize', fit);

  const CW = () => canvas.getBoundingClientRect().width;
  const CH = () => canvas.getBoundingClientRect().height;

  // ── Game state ──
  const COLS = 10, ROWS = 4;
  const BRICK_PAD = 4;
  let bricks = [];
  function resetBricks() {
    const w = CW(), h = CH();
    const brickW = (w - (COLS + 1) * BRICK_PAD) / COLS;
    const brickH = 14;
    const top = 40;
    bricks = [];
    const colors = ['#fffba8', '#f0a8d0', '#a890f0', '#78d8f8'];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({
          x: BRICK_PAD + c * (brickW + BRICK_PAD),
          y: top + r * (brickH + BRICK_PAD),
          w: brickW, h: brickH,
          color: colors[r % colors.length],
          alive: true,
          life: 800, // for shrink animation when killed
        });
      }
    }
  }

  const paddle = { x: 0, y: 0, w: 80, h: 8, vx: 0 };
  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 4, launched: false };

  function resetPaddle() {
    const w = CW(), h = CH();
    paddle.x = w / 2 - paddle.w / 2;
    paddle.y = h - 28;
  }
  function resetBall() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 2;
    ball.vx = 0; ball.vy = 0;
    ball.launched = false;
  }
  function launchBall() {
    if (ball.launched) return;
    ball.vx = (Math.random() < 0.5 ? -1 : 1) * 0.16;
    ball.vy = -0.22;
    ball.launched = true;
    if (window.SFX) window.SFX.coin();
  }

  resetBricks();
  resetPaddle();
  resetBall();

  // Block engine input while loader is up
  if (window.WorldEngine && window.WorldEngine.setInputBlocked) {
    window.WorldEngine.setInputBlocked(true);
  }

  // ── Input ──
  const keys = {};
  let mouseX = null;
  window.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('done')) return;
    const k = e.key.toLowerCase();
    if (['arrowleft','arrowright','a','d',' '].includes(k)) e.preventDefault();
    keys[k] = true;
    if (k === ' ' || k === 'enter') launchBall();
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = (e.clientX - r.left);
  });
  canvas.addEventListener('mousedown', launchBall);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - r.left;
    launchBall();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - r.left;
  }, { passive: false });

  // ── Loading state ──
  const START_T = performance.now();
  const MIN_TIME = 2500;    // can't continue before this
  const AUTO_DONE = 8500;   // auto-finishes at this time
  let bricksKilled = 0;
  let finished = false;
  let lives = 3;
  let phase = 'play'; // 'play' | 'done'

  function update(dt) {
    const w = CW();
    // Paddle movement
    let target = mouseX;
    if (keys['arrowleft'] || keys['a']) paddle.vx = -0.5;
    else if (keys['arrowright'] || keys['d']) paddle.vx = 0.5;
    else paddle.vx *= 0.85;
    if (target == null) {
      paddle.x += paddle.vx * dt;
    } else {
      paddle.x += (target - paddle.w / 2 - paddle.x) * 0.25;
    }
    paddle.x = Math.max(4, Math.min(w - paddle.w - 4, paddle.x));

    if (!ball.launched) {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 2;
      return;
    }
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // wall bounce
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; if (window.SFX) window.SFX.hit(); }
    if (ball.x > w - ball.r) { ball.x = w - ball.r; ball.vx *= -1; if (window.SFX) window.SFX.hit(); }
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; if (window.SFX) window.SFX.hit(); }

    // paddle bounce
    if (
      ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.w &&
      ball.vy > 0
    ) {
      ball.y = paddle.y - ball.r;
      // bounce angle based on hit position
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const sp = Math.hypot(ball.vx, ball.vy);
      ball.vx = hit * sp * 0.9;
      ball.vy = -Math.abs(ball.vy);
      // speed up slightly with each hit
      const factor = 1.02;
      ball.vx *= factor;
      ball.vy *= factor;
      if (window.SFX) window.SFX.select();
    }

    // brick hits
    for (const b of bricks) {
      if (!b.alive) continue;
      if (
        ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h
      ) {
        // determine bounce side
        const dx = (ball.x) - (b.x + b.w / 2);
        const dy = (ball.y) - (b.y + b.h / 2);
        if (Math.abs(dx) * b.h > Math.abs(dy) * b.w) ball.vx *= -1;
        else ball.vy *= -1;
        b.alive = false;
        bricksKilled++;
        if (window.SFX) window.SFX.catch();
        break;
      }
    }

    // miss: ball below paddle
    if (ball.y > CH() + 20) {
      lives--;
      if (lives <= 0) {
        // refill bricks AT MAX, just keep going — never block
        lives = 3;
      }
      resetBall();
    }
  }

  function loadingFraction() {
    const t = performance.now() - START_T;
    const timePct = Math.min(1, t / AUTO_DONE);
    const brickPct = bricksKilled / (COLS * ROWS);
    return Math.max(timePct, brickPct);
  }

  function maybeFinish() {
    if (finished) return;
    const t = performance.now() - START_T;
    if (loadingFraction() >= 0.999 || (t > AUTO_DONE) || bricksKilled >= COLS * ROWS) {
      finished = true;
      phase = 'done';
      continueBtn.classList.add('show');
      status.textContent = 'LOADING COMPLETE — PRESS CONTINUE';
      if (window.SFX) window.SFX.levelup();
    }
  }

  function render() {
    const w = CW(), h = CH();
    ctx.fillStyle = '#0e0e25';
    ctx.fillRect(0, 0, w, h);

    // subtle grid
    ctx.fillStyle = 'rgba(168, 144, 240, 0.06)';
    for (let x = 0; x < w; x += 12) ctx.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y += 12) ctx.fillRect(0, y, w, 1);

    // bricks
    for (const b of bricks) {
      if (b.alive) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(b.x, b.y + b.h - 2, b.w, 2);
        ctx.fillRect(b.x + b.w - 2, b.y, 2, b.h);
      }
    }

    // paddle
    ctx.fillStyle = '#fffba8';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = '#c8a020';
    ctx.fillRect(paddle.x, paddle.y + paddle.h - 2, paddle.w, 2);

    // ball
    ctx.fillStyle = '#f0a8d0';
    ctx.fillRect(Math.floor(ball.x - ball.r), Math.floor(ball.y - ball.r), ball.r * 2, ball.r * 2);

    // launch hint
    if (!ball.launched) {
      ctx.fillStyle = '#fffba8';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const blink = Math.floor(performance.now() / 500) % 2 === 0;
      if (blink) ctx.fillText('▶ CLICK / SPACE TO LAUNCH', w / 2, h - 50);
    }

    // lives
    ctx.fillStyle = '#a890f0';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('LIVES ' + lives, w - 8, 16);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#78d8f8';
    ctx.fillText('BRICKS ' + bricksKilled + '/' + (COLS * ROWS), 8, 16);
  }

  // ── Main loop ──
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(33, now - last);
    last = now;
    if (phase === 'play') update(dt);
    render();

    // loading bar
    const frac = loadingFraction();
    bar.style.width = (frac * 100).toFixed(0) + '%';
    pct.textContent = Math.floor(frac * 100) + '%';
    maybeFinish();

    if (overlay.classList.contains('hide')) return; // stop loop after hide
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ── Controls ──
  function continueToWorld() {
    overlay.classList.add('hide');
    setTimeout(() => { overlay.style.display = 'none'; }, 700);
    if (window.WorldEngine && window.WorldEngine.setInputBlocked) {
      window.WorldEngine.setInputBlocked(false);
    }
    if (window.SFX) window.SFX.coin();
  }
  skipBtn.addEventListener('click', () => {
    // allow skip after MIN_TIME
    if (performance.now() - START_T < MIN_TIME) {
      status.textContent = 'BREAK A FEW BRICKS FIRST...';
      return;
    }
    continueToWorld();
  });
  continueBtn.addEventListener('click', continueToWorld);

  window.addEventListener('keydown', (e) => {
    if (phase === 'done' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      continueToWorld();
    }
  });
})();
