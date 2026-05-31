// =========================================================
//  shared.jsx — shared atoms used by all screens
//  Loaded BEFORE screens / minigame / app.
// =========================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---------- Tiny pixel avatar (initials in a frame) ---------- */
function PixelAvatar({ initials, size }) {
  const s = size || 88;
  return (
    <div className="avatar" style={{ width: s, height: s, borderWidth: 3 }}>
      <div style={{
        position: 'absolute', inset: 4,
        background: 'linear-gradient(180deg, var(--surface-2) 0 50%, var(--surface) 50% 100%)',
      }} />
      <svg viewBox="0 0 16 16" width={s - 16} height={s - 16}
        style={{ position: 'relative', imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
        <rect x="4" y="2" width="8" height="2" fill="var(--secondary)" />
        <rect x="3" y="3" width="10" height="2" fill="var(--secondary)" />
        <rect x="4" y="4" width="8" height="5" fill="var(--highlight)" />
        <rect x="6" y="6" width="1" height="1" fill="var(--bg-deep)" />
        <rect x="9" y="6" width="1" height="1" fill="var(--bg-deep)" />
        <rect x="7" y="8" width="2" height="1" fill="var(--bg-deep)" />
        <rect x="3" y="10" width="10" height="6" fill="var(--primary)" />
        <rect x="6" y="12" width="4" height="2" fill="var(--bg-deep)" />
      </svg>
      <div style={{
        position: 'absolute', bottom: 2, right: 3,
        fontFamily: 'Press Start 2P, monospace', fontSize: 8,
        color: 'var(--highlight)', textShadow: '1px 1px 0 var(--bg-deep)',
      }}>{initials}</div>
    </div>
  );
}

/* ---------- Typewriter text ---------- */
function Typewriter({ text, speed, onDone, className, style }) {
  const [i, setI] = useState(0);
  const t = text || '';
  useEffect(() => { setI(0); }, [t]);
  useEffect(() => {
    if (i >= t.length) { onDone && onDone(); return; }
    const id = setTimeout(() => {
      setI(i + 1);
      if (i % 2 === 0 && t[i] && t[i] !== ' ' && window.SFX) window.SFX.text();
    }, speed || 18);
    return () => clearTimeout(id);
  }, [i, t]);
  return <span className={className} style={style}>{t.slice(0, i)}{i < t.length && <span className="blink">▌</span>}</span>;
}

/* ---------- HP/MP/XP meter ---------- */
function Meter({ label, value, max, color, suffix }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="row between" style={{ alignItems: 'baseline' }}>
        <span className="label">{label}</span>
        <span className="body-text sm" style={{ color: 'var(--text-dim)' }}>
          {value.toLocaleString()}<span style={{ color: 'var(--text-faded)' }}>/{max.toLocaleString()}</span>{suffix || ''}
        </span>
      </div>
      <div className="bar"><div className={'bar-fill ' + (color || '')} style={{ width: pct + '%' }} /></div>
    </div>
  );
}

/* color name helper for chip colors */
function chipColor(c) {
  return c === 'yellow' ? 'highlight' : c === 'cyan' ? 'accent' : c === 'pink' ? 'primary' : c === 'good' ? 'good' : 'secondary';
}

/* Stars rating */
function Stars({ n }) {
  return (
    <span className="pixel" style={{ fontSize: 12, letterSpacing: 2 }}>
      {[0,1,2,3,4].map((i) => (
        <span key={i} style={{ color: i < n ? 'var(--highlight)' : 'var(--text-faded)' }}>{i < n ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

/* Starfield bg for title */
function Starfield() {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        x: Math.random() * 100, y: Math.random() * 100,
        s: Math.random() < 0.7 ? 2 : 3, d: Math.random() * 4,
      });
    }
    return arr;
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {stars.map((st, i) => (
        <div key={i} className="blink" style={{
          position: 'absolute',
          left: st.x + '%', top: st.y + '%',
          width: st.s, height: st.s,
          background: 'var(--text)',
          animationDelay: st.d + 's',
          opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

Object.assign(window, { PixelAvatar, Typewriter, Meter, chipColor, Stars, Starfield });
