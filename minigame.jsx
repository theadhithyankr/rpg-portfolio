// =========================================================
//  minigame.jsx — "SlotForge: Demo" — a tiny playable slot
//  Thematically tied to Adhithyan's SlotForge project.
// =========================================================

const { useState, useEffect, useCallback } = React;

const SYMBOLS = [
  { s: '7',  c: 'highlight', w: 1,  pay: 50 },  // jackpot
  { s: '$',  c: 'accent',    w: 2,  pay: 20 },
  { s: '★',  c: 'primary',   w: 4,  pay: 10 },
  { s: '♛',  c: 'secondary', w: 6,  pay: 5  },
  { s: '◆',  c: 'good',      w: 8,  pay: 3  },
  { s: '●',  c: 'text-dim',  w: 10, pay: 2  },
  { s: '✦',  c: 'text',      w: 12, pay: 1  },
];

function pickWeighted() {
  const total = SYMBOLS.reduce((a, s) => a + s.w, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) { if ((r -= s.w) <= 0) return s; }
  return SYMBOLS[SYMBOLS.length - 1];
}

function MiniGame({ onExit }) {
  const [reels, setReels] = useState([SYMBOLS[6], SYMBOLS[6], SYMBOLS[6]]);
  const [spinning, setSpinning] = useState(false);
  const [coins, setCoins] = useState(100);
  const [spinCount, setSpinCount] = useState(0);
  const [totalBet, setTotalBet] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [last, setLast] = useState(null); // { win, kind }
  const [history, setHistory] = useState([]);

  const bet = 5;

  const spin = useCallback(() => {
    if (spinning || coins < bet) return;
    setSpinning(true);
    setCoins((c) => c - bet);
    setTotalBet((t) => t + bet);
    setLast(null);
    if (window.SFX) window.SFX.coin();

    // animate reels
    const final = [pickWeighted(), pickWeighted(), pickWeighted()];
    const durations = [600, 900, 1200];
    let cleared = 0;

    durations.forEach((dur, idx) => {
      const tick = setInterval(() => {
        setReels((r) => {
          const nr = r.slice();
          nr[idx] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          return nr;
        });
        if (window.SFX && idx === 0) window.SFX.hit();
      }, 70);
      setTimeout(() => {
        clearInterval(tick);
        setReels((r) => { const nr = r.slice(); nr[idx] = final[idx]; return nr; });
        if (window.SFX) window.SFX.select();
        cleared++;
        if (cleared === 3) {
          // evaluate
          const [a, b, c] = final;
          let win = 0;
          let kind = '';
          if (a.s === b.s && b.s === c.s) {
            win = a.pay * bet;
            kind = a.s === '7' ? 'JACKPOT!' : '3-OF-A-KIND';
            if (window.SFX) window.SFX.levelup();
          } else if (a.s === b.s || b.s === c.s) {
            win = Math.floor(bet * 0.6);
            kind = 'PAIR';
            if (window.SFX) window.SFX.catch();
          }
          if (win > 0) setCoins((c0) => c0 + win);
          setTotalWon((t) => t + win);
          setSpinCount((n) => n + 1);
          setLast({ win, kind });
          setHistory((h) => [{ syms: final, win }, ...h].slice(0, 6));
          setSpinning(false);
        }
      }, dur);
    });
  }, [spinning, coins]);

  // keyboard
  useEffect(() => {
    const fn = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [spin]);

  const rtp = totalBet > 0 ? ((totalWon / totalBet) * 100).toFixed(1) : '—';

  return (
    <div className="r-split" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, padding: 12, minHeight: 0 }}>
      {/* Game */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="box-inner col" style={{ gap: 12, alignItems: 'stretch' }}>
          <div className="row between center">
            <div className="panel-title">☢ SLOTFORGE · DEMO</div>
            <span className="chip yellow">DEMO BUILD</span>
          </div>

          <div className="body-text sm dim" style={{ textAlign: 'center' }}>
            A tiny live demo of weighted-RNG slot logic — same engine concepts as the real <span style={{ color: 'var(--accent)' }}>SlotForge</span>.
          </div>

          {/* Reels */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            padding: 14,
            background: 'var(--bg-deep)',
            border: '4px solid var(--border)',
            boxShadow: 'inset 0 0 0 2px var(--bg)',
          }}>
            {reels.map((r, i) => (
              <div key={i} style={{
                aspectRatio: '1 / 1',
                display: 'grid', placeItems: 'center',
                background: 'var(--surface)',
                border: '3px solid var(--text-faded)',
                fontFamily: 'Press Start 2P, monospace',
                fontSize: 'clamp(36px, 6vw, 72px)',
                color: `var(--${r.c})`,
                textShadow: '3px 3px 0 var(--bg-deep)',
              }}>
                {r.s}
              </div>
            ))}
          </div>

          {/* Result line */}
          <div style={{
            height: 44, display: 'grid', placeItems: 'center',
            border: '3px solid var(--text-faded)', background: 'var(--bg-deep)',
          }}>
            {last ? (
              last.win > 0 ? (
                <div className="pixel" style={{ fontSize: 12, color: 'var(--highlight)' }}>
                  ★ {last.kind} · +{last.win} COINS
                </div>
              ) : (
                <div className="pixel" style={{ fontSize: 11, color: 'var(--text-dim)' }}>NO MATCH — TRY AGAIN</div>
              )
            ) : spinning ? (
              <div className="pixel blink" style={{ fontSize: 11, color: 'var(--accent)' }}>SPINNING...</div>
            ) : (
              <div className="pixel" style={{ fontSize: 11, color: 'var(--text-dim)' }}>PRESS SPIN OR <span style={{ color: 'var(--highlight)' }}>SPACE</span></div>
            )}
          </div>

          {/* Controls */}
          <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
            <button onClick={spin} disabled={spinning || coins < bet}
              className={'pixel ' + ((spinning || coins < bet) ? 'disabled' : '')}
              style={{
                padding: '14px 24px',
                background: 'var(--highlight)', color: 'var(--bg-deep)',
                border: '4px solid var(--bg-deep)',
                fontSize: 14, letterSpacing: 2,
                boxShadow: '0 4px 0 var(--primary)',
              }}>
              ▶ SPIN ({bet})
            </button>
            <button onClick={() => { setCoins(100); setTotalBet(0); setTotalWon(0); setSpinCount(0); setLast(null); setHistory([]); if (window.SFX) window.SFX.back(); }}
              className="pixel" style={{
                padding: '14px 16px',
                background: 'var(--surface)', color: 'var(--text)',
                border: '4px solid var(--border)',
                fontSize: 10,
              }}>
              ↻ RESET
            </button>
          </div>
        </div>
      </div>

      {/* Side panel: stats + paytable */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="box-inner col" style={{ gap: 12, minHeight: 0 }}>
          <div className="panel-title">▣ LIVE STATS</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Stat label="COINS" value={coins} color="highlight" />
            <Stat label="SPINS" value={spinCount} color="accent" />
            <Stat label="WAGER" value={totalBet} color="primary" />
            <Stat label="WON"   value={totalWon} color="good" />
          </div>

          <div className="win">
            <span className="c-bl" /><span className="c-br" />
            <div className="row between center">
              <span className="label" style={{ color: 'var(--highlight)' }}>LIVE RTP</span>
              <span className="pixel" style={{ fontSize: 16, color: 'var(--good)' }}>{rtp}{rtp !== '—' ? '%' : ''}</span>
            </div>
            <div className="body-text sm dim" style={{ marginTop: 4 }}>
              Target RTP = <span style={{ color: 'var(--accent)' }}>96.5%</span>. Variance is high at low spin counts — that's the point.
            </div>
          </div>

          <div className="label">▼ PAYTABLE (× BET)</div>
          <div className="col" style={{ gap: 2 }}>
            {SYMBOLS.map((s) => (
              <div key={s.s} className="row between center" style={{ padding: '2px 0' }}>
                <span className="row center" style={{ gap: 10 }}>
                  <span style={{
                    width: 24, height: 24, display: 'grid', placeItems: 'center',
                    background: 'var(--bg-deep)', color: `var(--${s.c})`,
                    border: '2px solid var(--text-faded)',
                    fontFamily: 'Press Start 2P, monospace', fontSize: 12,
                  }}>{s.s}</span>
                  <span className="pixel" style={{ fontSize: 9, color: 'var(--text-dim)' }}>× × ×</span>
                </span>
                <span className="pixel" style={{ fontSize: 10, color: 'var(--highlight)' }}>{s.pay}×</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {history.length > 0 && (
            <>
              <div className="label">▼ LAST SPINS</div>
              <div className="col" style={{ gap: 2 }}>
                {history.slice(0, 4).map((h, i) => (
                  <div key={i} className="row between center" style={{ padding: '2px 0' }}>
                    <span className="pixel" style={{ fontSize: 11, color: 'var(--text)', letterSpacing: 4 }}>
                      {h.syms.map((x, j) => <span key={j} style={{ color: `var(--${x.c})` }}>{x.s}</span>)}
                    </span>
                    <span className="body-text sm" style={{ color: h.win > 0 ? 'var(--good)' : 'var(--text-faded)' }}>
                      {h.win > 0 ? '+' + h.win : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      border: '3px solid var(--text-faded)', background: 'var(--bg-deep)',
      padding: 8, textAlign: 'center',
    }}>
      <div className="label" style={{ color: 'var(--text-dim)' }}>{label}</div>
      <div className="pixel" style={{ fontSize: 16, color: `var(--${color})`, marginTop: 4 }}>{value}</div>
    </div>
  );
}


Object.assign(window, { MiniGame });
