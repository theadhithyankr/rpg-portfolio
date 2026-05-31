// Tiny chiptune SFX engine. WebAudio square waves, no assets.
(function () {
  let ctx = null;
  let muted = false;

  function ac() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq, dur, type, vol) {
    if (muted) return;
    const a = ac();
    if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(a.destination);
    const t = a.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.08, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function seq(notes, gap) {
    if (muted) return;
    const a = ac();
    if (!a) return;
    let t = 0;
    notes.forEach((n) => {
      setTimeout(() => beep(n[0], n[1], n[2] || 'square', n[3]), t);
      t += (gap || 80);
    });
  }

  window.SFX = {
    move: () => beep(440, 0.04, 'square', 0.05),
    select: () => seq([[660, 0.05], [880, 0.08]], 60),
    back: () => beep(220, 0.08, 'square', 0.06),
    open: () => seq([[523, 0.05], [659, 0.05], [784, 0.08]], 50),
    error: () => beep(110, 0.15, 'sawtooth', 0.08),
    coin: () => seq([[988, 0.05], [1318, 0.12]], 60),
    levelup: () => seq([[523, 0.06], [659, 0.06], [784, 0.06], [1046, 0.18]], 70),
    hit: () => beep(150, 0.06, 'sawtooth', 0.08),
    catch: () => seq([[784, 0.04], [1046, 0.06]], 40),
    text: () => beep(880, 0.012, 'square', 0.025),
    setMuted: (m) => { muted = !!m; },
    isMuted: () => muted,
  };
})();
