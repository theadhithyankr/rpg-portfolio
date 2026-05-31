// =========================================================
//  screens.jsx — Stats, Skills, Quests, Items, Records, Contact
// =========================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;
const { PixelAvatar, Typewriter, Meter, chipColor, Stars } = window;

/* ---------- STATS / STATUS ---------- */
function StatsScreen({ data }) {
  const p = data.player;
  return (
    <div className="r-split" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.05fr 1.45fr', gap: 12, padding: 12, minHeight: 0 }}>
      {/* Avatar + identity */}
      <div className="box">
        <div className="box-inner col" style={{ gap: 14 }}>
          <div className="panel-title">▣ STATUS</div>

          <div className="row center" style={{ gap: 16 }}>
            <PixelAvatar initials={p.initials} size={128} />
            <div className="col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
              <div className="pixel" style={{ fontSize: 14, color: 'var(--highlight)' }}>{p.name}</div>
              <div className="body-text" style={{ color: 'var(--accent)' }}>{p.class}</div>
              <div className="body-text dim sm">{p.subclass}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span className="chip yellow">LV {p.level}</span>
                <span className="chip cyan">{p.location}</span>
                <span className="chip pink">FOUNDER</span>
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 6 }}>
            <Meter label="HP" value={p.hp} max={p.hpMax} color="good" />
            <Meter label="MP" value={p.mp} max={p.mpMax} color="purple" />
            <Meter label="XP" value={p.xp} max={p.xpMax} color="pink" suffix=" / NEXT LV" />
          </div>

          <div className="win">
            <span className="c-bl" /><span className="c-br" />
            <div className="body-text sm" style={{ lineHeight: 1.3 }}>
              <span style={{ color: 'var(--highlight)' }}>► </span>{p.tagline}
            </div>
          </div>
        </div>
      </div>

      {/* Core stats */}
      <div className="box">
        <div className="box-inner col" style={{ gap: 10 }}>
          <div className="panel-title">★ CORE STATS</div>
          <div className="r-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            {data.stats.map((s) => (
              <div key={s.key} className="col" style={{ gap: 4 }}>
                <div className="row between center">
                  <div className="row center" style={{ gap: 8 }}>
                    <span className="chip purple" style={{ minWidth: 28, textAlign: 'center' }}>{s.key}</span>
                    <span className="pixel" style={{ fontSize: 9, color: 'var(--text)' }}>{s.name}</span>
                  </div>
                  <span className="pixel" style={{ fontSize: 11, color: 'var(--highlight)' }}>{s.value}</span>
                </div>
                <div className="bar"><div className={'bar-fill ' + s.color} style={{ width: s.value + '%' }} /></div>
                <div className="body-text dim sm">{s.note}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="chip">RNG SYSTEMS</span>
            <span className="chip">RTP TUNING</span>
            <span className="chip">REAL-TIME</span>
            <span className="chip">PHASER 3</span>
            <span className="chip">REACT</span>
            <span className="chip">NODE.JS</span>
            <span className="chip">WEBSOCKETS</span>
            <span className="chip">FASTAPI</span>
          </div>

          <div className="label">▼ PRESS ESC OR ◀ MENU TO RETURN</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SKILLS ---------- */
function SkillsScreen({ data }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 12, minHeight: 0 }}>
      <div className="box">
        <div className="box-inner row between center">
          <div className="panel-title">✦ SKILL TREE</div>
          <div className="body-text dim sm">FILLED ★ = MASTERED · ☆ = LEARNING</div>
        </div>
      </div>

      <div className="grow scroll r-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, paddingRight: 4 }}>
        {data.skills.map((g) => (
          <div key={g.group} className="box">
            <div className="box-inner col" style={{ gap: 8 }}>
              <div className="row between center">
                <div className="row center" style={{ gap: 8 }}>
                  <span style={{ color: `var(--${chipColor(g.color)})`, fontSize: 18, lineHeight: 1 }}>{g.icon}</span>
                  <span className="pixel" style={{ fontSize: 11, color: 'var(--highlight)' }}>{g.group}</span>
                </div>
                <span className={'chip ' + g.color}>{g.items.length} SKILLS</span>
              </div>

              <div className="col" style={{ gap: 6, marginTop: 4 }}>
                {g.items.map((s) => (
                  <div key={s.name} className="row between center" style={{ padding: '4px 0', borderBottom: '1px dashed color-mix(in srgb, var(--text-faded) 60%, transparent)' }}>
                    <span className="body-text" style={{ color: 'var(--text)' }}>{s.name}</span>
                    <Stars n={s.lvl} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- QUESTS / EXPERIENCE ---------- */
function QuestsScreen({ data }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="r-split" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 12, padding: 12, minHeight: 0 }}>
      {/* Quest list */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="box-inner col" style={{ gap: 8 }}>
          <div className="panel-title">✎ QUEST LOG</div>
          <div className="col" style={{ gap: 4 }}>
            {data.quests.map((q, i) => (
              <div key={q.title} className={'menu-item ' + (open === i ? 'active' : '')}
                onClick={() => { setOpen(i); if (window.SFX) window.SFX.select(); }}>
                <span className="arrow-prefix">▶</span>
                <span className="glyph" style={{ color: q.status === 'ACTIVE' ? 'var(--good)' : 'var(--accent)' }}>◆</span>
                <span style={{ flex: 1 }}>{q.title.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div className="win" style={{ marginTop: 4 }}>
            <span className="c-bl" /><span className="c-br" />
            <div className="label" style={{ color: 'var(--highlight)' }}>QUEST SUMMARY</div>
            <div className="body-text sm" style={{ marginTop: 6 }}>
              {data.quests.length} ACTIVE QUEST{data.quests.length !== 1 ? 'S' : ''} · {data.quests.reduce((a, q) => a + (q.xp || 0), 0).toLocaleString()} XP EARNED
            </div>
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="box-inner col" style={{ gap: 10, minHeight: 0 }}>
          <QuestDetail q={data.quests[open]} />
        </div>
      </div>
    </div>
  );
}

function QuestDetail({ q }) {
  if (!q) return null;
  return (
    <>
      <div className="row between center">
        <div>
          <div className="pixel" style={{ fontSize: 13, color: 'var(--highlight)' }}>{q.title.toUpperCase()}</div>
          <div className="body-text" style={{ color: 'var(--accent)' }}>{q.org}</div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
          <span className="chip yellow">{q.status}</span>
          <span className="body-text dim sm">{q.period}</span>
        </div>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <span className="chip pink">{q.role}</span>
        <span className="chip cyan">+ {q.xp.toLocaleString()} XP</span>
      </div>

      <div className="win">
        <span className="c-bl" /><span className="c-br" />
        <div className="body-text sm">
          <span style={{ color: 'var(--highlight)' }}>► </span>{q.summary}
        </div>
      </div>

      <div className="label">▼ OBJECTIVES COMPLETED</div>

      <div className="col scroll" style={{ gap: 8, flex: 1, paddingRight: 4, minHeight: 0 }}>
        {q.bullets.map((b, i) => (
          <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--good)', fontFamily: 'Press Start 2P, monospace', fontSize: 10, marginTop: 4 }}>✓</span>
            <div className="body-text" style={{ lineHeight: 1.3 }}>
              <span className="pixel" style={{ fontSize: 9, color: 'var(--accent)', marginRight: 6 }}>{b.tag.toUpperCase()}</span>
              {b.text}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- INVENTORY / PROJECTS ---------- */
function ItemsScreen({ data }) {
  const [open, setOpen] = useState(0);
  const list = data.projects;
  const rarityCounts = list.reduce((acc, p) => {
    acc[p.rarity] = (acc[p.rarity] || 0) + 1; return acc;
  }, {});
  return (
    <div className="r-split" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, padding: 12, minHeight: 0 }}>
      {/* Grid */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="box-inner col" style={{ gap: 10, minHeight: 0 }}>
          <div className="row between center" style={{ flexWrap: 'wrap', gap: 6 }}>
            <div className="panel-title">★ INVENTORY</div>
            <span className="label">{list.length} ITEMS</span>
          </div>

          <div className="scroll r-grid-2" style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8, flex: 1, minHeight: 0, paddingRight: 4, alignContent: 'start',
          }}>
            {list.map((p, i) => (
              <button key={p.id} onClick={() => { setOpen(i); if (window.SFX) window.SFX.select(); }}
                style={{
                  background: open === i ? 'var(--surface-2)' : 'var(--bg-deep)',
                  border: `3px solid ${open === i ? 'var(--highlight)' : 'var(--border)'}`,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  textAlign: 'left',
                  minHeight: 96,
                }}>
                <div className="row between center" style={{ gap: 6 }}>
                  <span style={{
                    width: 32, height: 32, display: 'grid', placeItems: 'center',
                    background: `var(--${chipColor(p.color)})`, color: 'var(--bg-deep)',
                    fontFamily: 'Press Start 2P, monospace', fontSize: 14, border: '2px solid var(--bg-deep)',
                    flexShrink: 0,
                  }}>{p.glyph}</span>
                  <span className={'chip ' + p.color} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.rarity}</span>
                </div>
                <div className="pixel" style={{ fontSize: 9, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name.toUpperCase()}</div>
                <div className="body-text dim sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.type}</div>
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {rarityCounts['LEGENDARY'] && <span className="chip yellow">{rarityCounts['LEGENDARY']} LEGENDARY</span>}
            {rarityCounts['EPIC']      && <span className="chip pink">{rarityCounts['EPIC']} EPIC</span>}
            {rarityCounts['RARE']      && <span className="chip cyan">{rarityCounts['RARE']} RARE</span>}
            {rarityCounts['COMMON']    && <span className="chip">{rarityCounts['COMMON']} COMMON</span>}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="box-inner col" style={{ gap: 12, minHeight: 0 }}>
          <ProjectDetail p={list[open]} />
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ p }) {
  if (!p) return null;
  return (
    <>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 80, height: 80, display: 'grid', placeItems: 'center',
          background: `var(--${chipColor(p.color)})`, color: 'var(--bg-deep)',
          fontFamily: 'Press Start 2P, monospace', fontSize: 36, border: '4px solid var(--border)',
        }}>{p.glyph}</div>

        <div className="col" style={{ gap: 6, flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className={'chip ' + p.color}>{p.rarity}</span>
            <span className="chip">{p.type.toUpperCase()}</span>
          </div>
          <div className="pixel" style={{ fontSize: 14, color: 'var(--highlight)', lineHeight: 1.2 }}>{p.name.toUpperCase()}</div>
          <div className="body-text" style={{ color: 'var(--accent)' }}>{p.stack}</div>
          <div className="body-text sm" style={{ color: 'var(--text-dim)' }}>{p.tagline}</div>
          {p.url && (
            <a href={p.url} target="_blank" rel="noreferrer"
              onClick={() => { if (window.SFX) window.SFX.coin(); }}
              className="pixel"
              style={{
                marginTop: 4, alignSelf: 'flex-start',
                textDecoration: 'none',
                padding: '6px 10px', fontSize: 9,
                background: 'var(--highlight)', color: 'var(--bg-deep)',
                border: '3px solid var(--bg-deep)',
              }}>
              ◇ VIEW REPO
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {p.stats.map((s) => (
          <div key={s.k} style={{
            border: '3px solid var(--text-faded)', background: 'var(--bg-deep)',
            padding: 8, textAlign: 'center',
          }}>
            <div className="label" style={{ color: 'var(--text-dim)' }}>{s.k}</div>
            <div className="pixel" style={{ fontSize: 14, color: 'var(--highlight)', marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="win" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <span className="c-bl" /><span className="c-br" />
        <div className="label" style={{ color: 'var(--highlight)' }}>▼ ITEM DESCRIPTION</div>
        <div className="col scroll" style={{ gap: 8, marginTop: 8, flex: 1, paddingRight: 4 }}>
          {p.details.map((d, i) => (
            <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'Press Start 2P, monospace', fontSize: 10, marginTop: 4 }}>►</span>
              <div className="body-text" style={{ lineHeight: 1.3 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- RECORDS (Education + Achievements) ---------- */
function RecordsScreen({ data }) {
  return (
    <div className="r-split" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, padding: 12, minHeight: 0 }}>
      {/* Education */}
      <div className="box">
        <div className="box-inner col" style={{ gap: 10 }}>
          <div className="panel-title">✎ EDUCATION</div>
          <div className="col" style={{ gap: 12 }}>
            {data.records.education.map((e, i) => (
              <div key={i} className="win">
                <span className="c-bl" /><span className="c-br" />
                <div className="row between center">
                  <div className="pixel" style={{ fontSize: 11, color: 'var(--highlight)' }}>{e.school.toUpperCase()}</div>
                </div>
                <div className="body-text" style={{ color: 'var(--accent)', marginTop: 6 }}>{e.degree}</div>
                <div className="row between" style={{ marginTop: 6 }}>
                  <span className="body-text dim sm">{e.location}</span>
                  <span className="body-text dim sm">{e.period}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div className="label" style={{ marginTop: 6 }}>▼ COMPETENCIES</div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className="chip yellow">INNOVATION</span>
            <span className="chip cyan">MATH LOGIC</span>
            <span className="chip pink">LEADERSHIP</span>
            <span className="chip">SDLC</span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="box-inner col" style={{ gap: 10, minHeight: 0 }}>
          <div className="row between center" style={{ flexWrap: 'wrap', gap: 6 }}>
            <div className="panel-title">♛ ACHIEVEMENTS</div>
            <span className="label">{data.records.achievements.length} UNLOCKED</span>
          </div>

          <div className="scroll r-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, paddingRight: 4 }}>
            {data.records.achievements.map((a, i) => (
              <div key={i} style={{
                border: '3px solid var(--border)', background: 'var(--bg-deep)',
                padding: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  background: 'var(--highlight)', color: 'var(--bg-deep)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'Press Start 2P, monospace', fontSize: 16,
                  border: '3px solid var(--bg-deep)',
                  boxShadow: '0 0 0 2px var(--highlight)',
                }}>♛</div>
                <div className="col" style={{ gap: 4 }}>
                  <div className="pixel" style={{ fontSize: 9, color: 'var(--highlight)', lineHeight: 1.3 }}>{a.title}</div>
                  <div className="body-text sm">{a.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- CONTACT / TALK ---------- */
function ContactScreen({ data }) {
  const c = data.contact;
  const [page, setPage] = useState(0);
  const dialog = [
    "OH! A TRAVELER. ARE YOU HIRING A SOFTWARE ENGINEER?",
    "I BUILD GAME SYSTEMS — CASINO ENGINES, REAL-TIME PVP, RNG — AND THE FULL-STACK & MOBILE AROUND THEM (REACT, NEXT.JS, REACT NATIVE, FLUTTER).",
    "PICK A CHANNEL BELOW. I REPLY FAST.",
  ];

  return (
    <div className="r-split" style={{ flex: 1, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12, padding: 12, minHeight: 0 }}>
      {/* NPC dialog */}
      <div className="box">
        <div className="box-inner row" style={{ gap: 16, alignItems: 'center' }}>
          <div className="floaty">
            <PixelAvatar initials="AK" size={88} />
          </div>
          <div className="col grow" style={{ gap: 6 }}>
            <div className="label" style={{ color: 'var(--highlight)' }}>ADHITHYAN K R</div>
            <div className="body-text" style={{ lineHeight: 1.3, minHeight: 50 }}>
              <Typewriter key={page} text={dialog[page]} speed={22} onDone={() => {}} />
            </div>
            <div className="row between center">
              <div className="row" style={{ gap: 6 }}>
                {dialog.map((_, i) => (
                  <span key={i} style={{
                    width: 10, height: 10,
                    background: i === page ? 'var(--highlight)' : 'var(--text-faded)',
                    border: '2px solid var(--bg-deep)',
                  }} />
                ))}
              </div>
              <button onClick={() => { if (window.SFX) window.SFX.select(); setPage((p) => (p + 1) % dialog.length); }}
                className="pixel" style={{
                  padding: '8px 14px', background: 'var(--surface-2)',
                  border: '3px solid var(--highlight)', color: 'var(--highlight)', fontSize: 10,
                }}>
                ▶ NEXT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact channels */}
      <div className="box" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="box-inner col" style={{ gap: 12 }}>
          <div className="panel-title">✉ CONTACT CHANNELS</div>
          <div className="body-text sm dim">{c.intro}</div>

          <div className="r-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            {c.lines.map((l, i) => (
              <a key={i} href={l.href} target="_blank" rel="noreferrer"
                onClick={() => { if (window.SFX) window.SFX.coin(); }}
                style={{
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-deep)', border: '3px solid var(--border)',
                  padding: 10,
                  color: 'var(--text)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--highlight)'; if (window.SFX) window.SFX.move(); }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-deep)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{
                  width: 40, height: 40, display: 'grid', placeItems: 'center',
                  background: 'var(--highlight)', color: 'var(--bg-deep)',
                  fontFamily: 'Press Start 2P, monospace', fontSize: 14,
                  border: '3px solid var(--bg-deep)',
                }}>{l.glyph}</div>
                <div className="col" style={{ gap: 2, minWidth: 0 }}>
                  <div className="label" style={{ color: 'var(--accent)' }}>{l.kind}</div>
                  <div className="body-text" style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.label}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="win" style={{ marginTop: 6 }}>
            <span className="c-bl" /><span className="c-br" />
            <div className="body-text sm">
              <span className="label" style={{ color: 'var(--highlight)' }}>STATUS </span>
              <span style={{ color: 'var(--good)' }}>● OPEN TO WORK</span> — freelance, contract, full-time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


Object.assign(window, { StatsScreen, SkillsScreen, QuestsScreen, ItemsScreen, RecordsScreen, ContactScreen });
