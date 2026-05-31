// =========================================================
//  app.jsx — root, CRT shell, title screen, main menu router
// =========================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;
const { PixelAvatar, Typewriter, Meter, chipColor, Stars, Starfield } = window;
const { StatsScreen, SkillsScreen, QuestsScreen, ItemsScreen, RecordsScreen, ContactScreen } = window;
const { MiniGame } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle } = window;

/* ---------- Tweak defaults (persisted via host) ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "default",
  "soundOn": true
}/*EDITMODE-END*/;

/* ---------- TITLE SCREEN ---------- */
function TitleScreen({ onStart }) {
  const [phase, setPhase] = useState('intro');
  useEffect(() => {
    const id = setTimeout(() => setPhase('ready'), 1100);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        if (window.SFX) window.SFX.coin();
        onStart();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onStart]);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28, padding: 32, background: 'var(--bg)',
      backgroundImage:
        'radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--secondary) 16%, transparent), transparent 35%),'
        + 'radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 40%)',
    }}>
      <Starfield />
      <div className="flicker" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div className="pixel" style={{
          fontSize: 'clamp(20px, 3.6vw, 44px)',
          color: 'var(--highlight)',
          textShadow: '4px 4px 0 var(--primary), 8px 8px 0 var(--bg-deep)',
          letterSpacing: 2, lineHeight: 1.1,
        }}>
          ADHITHYAN<br />— K R —
        </div>
        <div className="pixel" style={{
          marginTop: 18, fontSize: 'clamp(8px, 1.1vw, 12px)',
          color: 'var(--accent)', letterSpacing: 3,
        }}>
          GAME SYSTEMS · FULL-STACK · MOBILE
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ width: 60, height: 2, background: 'var(--text-faded)' }} />
        <div className="pixel" style={{ fontSize: 9, color: 'var(--text-dim)' }}>PORTFOLIO · 202X</div>
        <div style={{ width: 60, height: 2, background: 'var(--text-faded)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, height: 60, display: 'flex', alignItems: 'center' }}>
        {phase === 'ready' ? (
          <button onClick={() => { if (window.SFX) window.SFX.coin(); onStart(); }}
            className="title-press blink" style={{ padding: '14px 22px' }}>
            ▶ PRESS START
          </button>
        ) : (
          <div className="pixel" style={{ fontSize: 12, color: 'var(--text-dim)' }}>LOADING<span className="blink">...</span></div>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 14 }}>
        <span className="kbd">↑↓</span>
        <span className="kbd">↵ ENTER</span>
        <span className="kbd">ESC</span>
        <span className="kbd">CLICK</span>
      </div>

      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Press Start 2P, monospace', fontSize: 8, color: 'var(--text-faded)',
        letterSpacing: 2,
      }}>
        © {new Date().getFullYear()} ADHITHYAN K R · ALL RIGHTS RESERVED
      </div>
    </div>
  );
}

/* ---------- TOP HUD ---------- */
const SCREEN_LABELS = {
  menu: 'MAIN MENU',
  stats: 'STATUS',
  skills: 'SKILL TREE',
  quests: 'QUEST LOG',
  items: 'INVENTORY',
  records: 'RECORDS',
  talk: 'CONTACT',
  game:  'MINI-GAME',
};

function TopHUD({ player, screen, soundOn, onToggleSound, onHome }) {
  const screenName = SCREEN_LABELS[screen] || '';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 10, padding: '8px 10px',
      borderBottom: '3px solid var(--border)', background: 'var(--bg-deep)',
      flexWrap: 'wrap',
    }}>
      <button onClick={onHome} title="Home" className="pixel" style={{
        padding: '6px 10px', background: 'var(--surface)',
        border: '2px solid var(--border)', color: 'var(--highlight)', fontSize: 9,
      }}>
        ◀ MENU
      </button>
      <div className="pixel" style={{
        padding: '6px 12px', background: 'var(--surface)',
        border: '2px solid var(--text-faded)', color: 'var(--text-dim)', fontSize: 9,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: 'var(--highlight)' }}>►</span>
        {screenName || 'MAIN MENU'}
      </div>

      <div className="grow" />

      <a href="world.html" className="pixel" style={{
        padding: '6px 10px', background: 'var(--surface)',
        border: '2px solid var(--accent)', color: 'var(--accent)', fontSize: 9,
        textDecoration: 'none',
      }}>
        🌍 WORLD MODE
      </a>

      <div className="pixel" style={{
        padding: '6px 12px', background: 'var(--surface)',
        border: '2px solid var(--text-faded)', color: 'var(--text-dim)', fontSize: 9,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: 'var(--accent)' }}>LV</span>
        <span style={{ color: 'var(--highlight)' }}>{player.level}</span>
        <span style={{ color: 'var(--text-faded)' }}>|</span>
        <span style={{ color: 'var(--text-dim)' }}>HP</span>
        <span style={{ color: 'var(--good)' }}>{player.hp}/{player.hpMax}</span>
        <span style={{ color: 'var(--text-faded)' }}>|</span>
        <span style={{ color: 'var(--text-dim)' }}>XP</span>
        <span style={{ color: 'var(--primary)' }}>{player.xp.toLocaleString()}</span>
      </div>

      <button onClick={onToggleSound} title="Sound" className="pixel" style={{
        padding: '6px 10px', background: 'var(--surface)',
        border: '2px solid var(--border)', color: soundOn ? 'var(--good)' : 'var(--text-faded)', fontSize: 9,
      }}>
        {soundOn ? '♪ SFX ON' : 'SFX OFF'}
      </button>
    </div>
  );
}

/* ---------- MAIN MENU ---------- */
const MENU_ITEMS = [
  { id: 'stats',   label: 'STATUS',     glyph: '☻', desc: 'View player profile and stats.' },
  { id: 'skills',  label: 'SKILL TREE', glyph: '✦', desc: 'Tech skills and proficiency levels.' },
  { id: 'quests',  label: 'QUEST LOG',  glyph: '✎', desc: 'Work history and completed missions.' },
  { id: 'items',   label: 'INVENTORY',  glyph: '★', desc: 'Projects and weapons crafted.' },
  { id: 'records', label: 'RECORDS',    glyph: '♛', desc: 'Education, achievements, awards.' },
  { id: 'talk',    label: 'CONTACT',    glyph: '✉', desc: 'Hire / collaborate / message me.' },
  { id: 'game',    label: 'MINI-GAME',  glyph: '☢', desc: 'Easter egg: SlotForge demo.' },
];

function MainMenu({ player, onSelect, focusIdx, setFocusIdx }) {
  return (
    <div className="r-split" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.05fr 1.6fr', gap: 12, padding: 12, minHeight: 0 }}>
      {/* LEFT — player card */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="box-inner col" style={{ gap: 12 }}>
          <div className="row center" style={{ gap: 14 }}>
            <PixelAvatar initials={player.initials} size={104} />
            <div className="col" style={{ gap: 6, flex: 1, minWidth: 0 }}>
              <div className="pixel" style={{ fontSize: 13, color: 'var(--highlight)', lineHeight: 1.25 }}>
                {player.name}
              </div>
              <div className="body-text" style={{ color: 'var(--accent)' }}>{player.class}</div>
              <div className="body-text dim sm">{player.subclass}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                <span className="chip yellow">LV {player.level}</span>
                <span className="chip cyan">{player.location}</span>
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 6, marginTop: 2 }}>
            <Meter label="HP" value={player.hp} max={player.hpMax} color="good" />
            <Meter label="MP" value={player.mp} max={player.mpMax} color="purple" />
            <Meter label="XP" value={player.xp} max={player.xpMax} color="pink" suffix=" / NEXT LV" />
          </div>

          <div className="win" style={{ marginTop: 4 }}>
            <span className="c-bl" /><span className="c-br" />
            <div className="body-text sm" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--highlight)' }}>► </span>
              {player.tagline}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div className="label" style={{ marginTop: 4 }}>NAVIGATION</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            <span className="kbd">↑ ↓</span><span className="body-text dim sm">move</span>
            <span className="kbd">↵</span><span className="body-text dim sm">select</span>
            <span className="kbd">ESC</span><span className="body-text dim sm">back</span>
          </div>
        </div>
      </div>

      {/* RIGHT — menu list */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="box-inner col" style={{ gap: 6 }}>
          <div className="row between center">
            <div className="panel-title">★ MAIN MENU</div>
            <div className="label">USE ↑↓ + ↵</div>
          </div>

          <div className="col" style={{ gap: 2, marginTop: 6 }}>
            {MENU_ITEMS.map((m, i) => (
              <div key={m.id}
                className={'menu-item ' + (focusIdx === i ? 'active' : '')}
                onMouseEnter={() => { setFocusIdx(i); if (window.SFX) window.SFX.move(); }}
                onClick={() => { if (window.SFX) window.SFX.select(); onSelect(m.id); }}>
                <span className="arrow-prefix">▶</span>
                <span className="glyph" style={{ color: 'var(--accent)' }}>{m.glyph}</span>
                <span style={{ flex: 1 }}>{m.label}</span>
                <span className="body-text dim sm" style={{ fontSize: 14 }}>{m.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div className="win" style={{ marginTop: 6 }}>
            <span className="c-bl" /><span className="c-br" />
            <div className="body-text sm" style={{ color: 'var(--text-dim)' }}>
              <span className="label" style={{ color: 'var(--highlight)' }}>TIP </span>
              Try the <span style={{ color: 'var(--accent)' }}>MINI-GAME</span> — a live demo of weighted-RNG slot logic.
              Or jump to <span style={{ color: 'var(--primary)' }}>CONTACT</span> if you're hiring.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- TWEAKS PANEL ---------- */
function PortfolioTweaks() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', tweaks.palette === 'default' ? '' : tweaks.palette);
  }, [tweaks.palette]);

  useEffect(() => {
    if (window.SFX) window.SFX.setMuted(!tweaks.soundOn);
    window.dispatchEvent(new CustomEvent('sound-changed', { detail: !!tweaks.soundOn }));
  }, [tweaks.soundOn]);

  return (
    <TweaksPanel title="TWEAKS">
      <TweakSection title="Palette">
        <TweakRadio
          value={tweaks.palette}
          onChange={(v) => setTweak('palette', v)}
          options={[
            { label: 'Pastel', value: 'default' },
            { label: 'NES',    value: 'nes' },
            { label: 'GB',     value: 'gameboy' },
          ]}
        />
        <div style={{ height: 6 }} />
        <TweakRadio
          value={tweaks.palette}
          onChange={(v) => setTweak('palette', v)}
          options={[
            { label: 'Mono',      value: 'mono' },
            { label: 'Bubblegum', value: 'bubblegum' },
          ]}
        />
      </TweakSection>
      <TweakSection title="Sound">
        <TweakToggle value={tweaks.soundOn} onChange={(v) => setTweak('soundOn', v)} label="Chiptune SFX" />
      </TweakSection>
    </TweaksPanel>
  );
}

/* ---------- ROOT APP ---------- */
function App() {
  const data = window.PORTFOLIO_DATA;
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState('menu');
  const [focusIdx, setFocusIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const f = (e) => setSoundOn(!!e.detail);
    window.addEventListener('sound-changed', f);
    return () => window.removeEventListener('sound-changed', f);
  }, []);

  useEffect(() => {
    if (window.SFX) window.SFX.setMuted(!soundOn);
  }, [soundOn]);

  // global keyboard
  useEffect(() => {
    if (!started) return;
    const fn = (e) => {
      // ignore key events from inputs (tweaks panel etc.)
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (screen === 'menu') {
        if (e.key === 'ArrowDown') { setFocusIdx((i) => (i + 1) % MENU_ITEMS.length); if (window.SFX) window.SFX.move(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { setFocusIdx((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length); if (window.SFX) window.SFX.move(); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
          if (window.SFX) window.SFX.select();
          setScreen(MENU_ITEMS[focusIdx].id); e.preventDefault();
        }
      } else {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'x' || e.key === 'X') {
          if (window.SFX) window.SFX.back();
          setScreen('menu'); e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [started, screen, focusIdx]);

  const goHome = useCallback(() => { if (window.SFX) window.SFX.back(); setScreen('menu'); }, []);
  const selectMenu = useCallback((id) => setScreen(id), []);

  return (
    <div className="cabinet" data-screen-label={`01 ${SCREEN_LABELS[started ? screen : 'menu'] || 'TITLE'}`}>
      <div className="crt">
        <div className="screen">
          {!started && <TitleScreen onStart={() => setStarted(true)} />}
          {started && (
            <>
              <TopHUD
                player={data.player}
                screen={screen}
                soundOn={soundOn}
                onToggleSound={() => { const v = !soundOn; setSoundOn(v); if (window.SFX) window.SFX.select(); }}
                onHome={goHome}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {screen === 'menu'    && <MainMenu player={data.player} onSelect={selectMenu} focusIdx={focusIdx} setFocusIdx={setFocusIdx} />}
                {screen === 'stats'   && <StatsScreen data={data} />}
                {screen === 'skills'  && <SkillsScreen data={data} />}
                {screen === 'quests'  && <QuestsScreen data={data} />}
                {screen === 'items'   && <ItemsScreen data={data} />}
                {screen === 'records' && <RecordsScreen data={data} />}
                {screen === 'talk'    && <ContactScreen data={data} />}
                {screen === 'game'    && <MiniGame onExit={goHome} />}
              </div>
            </>
          )}
        </div>
      </div>
      <PortfolioTweaks />
    </div>
  );
}

/* mount */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
