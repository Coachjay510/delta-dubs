import { useState, useEffect, useMemo } from 'react'
import { supabasePlayers } from '../lib/supabasePlayers'
import ddLogo from '../assets/dd-logo.png'

const G = {
  bg:     '#04090a',
  card:   '#0b1410',
  card2:  '#111e16',
  border: 'rgba(34,197,94,.12)',
  green:  '#22c55e',
  green2: '#16a34a',
  orange: '#f97316',
  text1:  '#f0faf4',
  text2:  '#9ab8a4',
  text3:  '#556b5e',
}

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`
  }
  return null
}

function isDirectVideo(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || '')
}

function heightStr(inches) {
  if (!inches) return null
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function fmtPct(v) {
  if (v == null || v === '') return '—'
  return `${Math.round(+v * 100)}%`
}

function classLabel(gradYear) {
  if (!gradYear) return null
  const map = { 2027:'SR', 2028:'JR', 2029:'SO', 2030:'FR', 2031:"7th" }
  return map[gradYear] ? `${map[gradYear]} · '${String(gradYear).slice(2)}` : `'${String(gradYear).slice(2)}`
}

function classBg(gradYear) {
  if (gradYear === 2027) return G.orange
  if (gradYear === 2028) return '#7c3aed'
  if (gradYear === 2029) return '#1d4ed8'
  if (gradYear === 2030) return '#0369a1'
  return '#374151'
}

function Initials({ name, first, last, size = 80 }) {
  const display = name || `${first || ''} ${last || ''}`
  const parts = display.trim().split(' ')
  const ini = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0]?.[0] || '?')
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${G.card2}, #0d2018)`,
      border: `1.5px solid ${G.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: G.text3,
      flexShrink: 0,
    }}>
      {ini.toUpperCase()}
    </div>
  )
}

// ── Player Modal ──────────────────────────────────────────────────────────────
function PlayerModal({ player, stats, onClose }) {
  const ht  = heightStr(player.height_inches)
  const ws  = heightStr(player.wingspan_inches)
  const cls = classLabel(player.grad_year)

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])

  const embedUrl = getYouTubeEmbedUrl(player.film_url)
  const isDirect = isDirectVideo(player.film_url)

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.88)',
      backdropFilter:'blur(8px)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, overflowY:'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:G.card, border:`1px solid ${G.border}`,
        borderRadius:20, width:'100%', maxWidth:820,
        overflow:'hidden', position:'relative', maxHeight:'92vh', overflowY:'auto',
      }}>
        <button onClick={onClose} style={{
          position:'absolute', top:14, right:14, zIndex:10,
          background:'rgba(255,255,255,.08)', border:'none', borderRadius:8,
          color:G.text2, fontSize:16, width:32, height:32, cursor:'pointer',
        }}>✕</button>

        <div style={{ display:'flex', flexWrap:'wrap' }}>
          {/* Photo */}
          <div style={{ width:'min(260px,100%)', flexShrink:0, position:'relative', minHeight:300, background:G.card2 }}>
            {player.photo_url
              ? <img src={player.photo_url} alt={player.name} style={{ width:'100%', minHeight:300, objectFit:'cover', objectPosition:'top', display:'block' }} />
              : <div style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Initials name={player.name} first={player.first_name} last={player.last_name} size={90} />
                </div>
            }
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, transparent 50%, rgba(11,20,16,.98) 100%)' }}/>
            {cls && (
              <div style={{
                position:'absolute', top:14, left:14,
                background:classBg(player.grad_year), borderRadius:8,
                padding:'4px 12px', fontSize:11, fontWeight:700, color:'#fff',
              }}>{cls}</div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:260, padding:'26px 26px 22px' }}>
            <div style={{ fontSize:26, fontWeight:800, color:G.text1, lineHeight:1.1 }}>
              {player.first_name} {player.last_name}
            </div>
            <div style={{ fontSize:13, color:G.green, fontWeight:600, marginTop:3 }}>
              {[player.position, player.np_team_name].filter(Boolean).join(' · ')}
            </div>
            {player.school_name && <div style={{ fontSize:12, color:G.text3, marginTop:2 }}>{player.school_name}</div>}

            {/* Accolade */}
            {player.accolade && (
              <div style={{
                marginTop:12, display:'inline-flex', alignItems:'center', gap:6,
                background:'rgba(249,115,22,.1)', border:'1px solid rgba(249,115,22,.25)',
                borderRadius:8, padding:'5px 12px', fontSize:12, color:G.orange, fontWeight:600,
              }}>⭐ {player.accolade}</div>
            )}

            {/* Physical */}
            {(ht || ws || player.gpa) && (
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:14 }}>
                {ht && <div style={{ background:G.card2, border:`1px solid ${G.border}`, borderRadius:10, padding:'8px 14px', fontSize:13, color:G.text1 }}>
                  📏 <strong style={{color:G.green}}>{ht}</strong>
                </div>}
                {ws && <div style={{ background:G.card2, border:`1px solid ${G.border}`, borderRadius:10, padding:'8px 14px', fontSize:13, color:G.text1 }}>
                  ↔ <strong style={{color:G.green}}>{ws}</strong>
                </div>}
                {player.gpa && <div style={{ background:G.card2, border:`1px solid ${G.border}`, borderRadius:10, padding:'8px 14px', fontSize:13, color:G.text1 }}>
                  GPA <strong style={{color:G.orange}}>{player.gpa}</strong>
                </div>}
              </div>
            )}

            {/* Stats */}
            {stats?.length > 0 && (
              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:10, color:G.text3, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Stats</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr>{['Season','GP','PPG','RPG','APG','SPG','FG%','3P%'].map(h =>
                        <th key={h} style={{ padding:'4px 8px', color:G.text3, textAlign:'left', fontFamily:'monospace', fontSize:10, letterSpacing:1, borderBottom:`1px solid ${G.border}` }}>{h}</th>
                      )}</tr>
                    </thead>
                    <tbody>
                      {stats.map((s, i) => (
                        <tr key={i} style={{ borderBottom:`1px solid ${G.border}22` }}>
                          <td style={{ padding:'6px 8px', color:G.green, fontWeight:700, fontSize:11 }}>{s.season}</td>
                          <td style={{ padding:'6px 8px', color:G.text1 }}>{s.gp}</td>
                          <td style={{ padding:'6px 8px', color:G.text1, fontWeight:700 }}>{s.ppg != null ? (+s.ppg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'6px 8px', color:G.text1 }}>{s.rpg != null ? (+s.rpg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'6px 8px', color:G.text1 }}>{s.apg != null ? (+s.apg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'6px 8px', color:G.text1 }}>{s.spg != null ? (+s.spg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'6px 8px', color:G.text1 }}>{fmtPct(s.fg_pct)}</td>
                          <td style={{ padding:'6px 8px', color:G.text1 }}>{fmtPct(s.fg3_pct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Film */}
            {player.film_url && (
              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:10, color:G.text3, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Film</div>
                {embedUrl
                  ? <div style={{ position:'relative', paddingBottom:'56.25%', borderRadius:10, overflow:'hidden', background:'#000' }}>
                      <iframe src={embedUrl} title="Film" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} />
                    </div>
                  : isDirect
                    ? <video controls style={{ width:'100%', borderRadius:10 }}><source src={player.film_url}/></video>
                    : <a href={player.film_url} target="_blank" rel="noopener noreferrer" style={{
                        background:G.green2, color:'#fff', borderRadius:10, padding:'10px 18px',
                        fontSize:13, fontWeight:700, textDecoration:'none', display:'inline-block',
                      }}>▶ View Film</a>
                }
              </div>
            )}

            {/* CTA */}
            <a href={`mailto:deltadubs.aau@gmail.com?subject=Recruiting Inquiry — ${player.first_name} ${player.last_name}&body=Hello Coach Johnson,%0A%0AI am interested in learning more about ${player.first_name} ${player.last_name}.%0A%0A`}
              style={{
                marginTop:18, display:'inline-flex', alignItems:'center', gap:6,
                background:G.orange, color:'#fff', borderRadius:10,
                padding:'11px 22px', fontSize:13, fontWeight:700, textDecoration:'none',
              }}>✉ Request Info — Coach Johnson</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Spotlight Card (large, premium) ──────────────────────────────────────────
function SpotlightCard({ player, stats, onClick }) {
  const latest = stats?.[0]
  const cls    = classLabel(player.grad_year)
  const hasStats = latest && (+latest.ppg || +latest.rpg || +latest.apg)

  return (
    <div onClick={onClick} style={{
      background:G.card, border:`1px solid ${G.border}`,
      borderRadius:18, overflow:'hidden', cursor:'pointer',
      transition:'transform .15s, box-shadow .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 20px 48px rgba(34,197,94,.1)` }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      {/* Photo */}
      <div style={{ position:'relative', aspectRatio:'3/4', background:G.card2, overflow:'hidden' }}>
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Initials name={player.name} first={player.first_name} last={player.last_name} size={72}/>
            </div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(4,9,10,.98) 0%, rgba(4,9,10,.2) 55%, transparent 100%)' }}/>

        {cls && (
          <div style={{
            position:'absolute', top:10, left:10,
            background:classBg(player.grad_year), borderRadius:6,
            padding:'3px 10px', fontSize:10, fontWeight:700, color:'#fff',
          }}>{cls}</div>
        )}

        {player.film_url && (
          <div style={{
            position:'absolute', top:10, right:10,
            background:'rgba(0,0,0,.7)', border:'1px solid rgba(249,115,22,.4)',
            borderRadius:6, padding:'3px 8px', fontSize:10, color:G.orange, fontWeight:700,
          }}>▶ Film</div>
        )}

        {/* Name + accolade overlay */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 14px 12px' }}>
          <div style={{ fontSize:17, fontWeight:800, color:G.text1, lineHeight:1.2 }}>
            {player.first_name} {player.last_name}
          </div>
          <div style={{ fontSize:12, color:G.green, fontWeight:600, marginTop:2 }}>
            {player.position || '—'}
          </div>
          {player.accolade && (
            <div style={{
              marginTop:6, fontSize:11, color:G.orange, fontWeight:600,
              display:'flex', alignItems:'center', gap:4,
            }}>⭐ {player.accolade}</div>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {hasStats && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:`1px solid ${G.border}` }}>
          {[['PPG', latest.ppg], ['RPG', latest.rpg], ['APG', latest.apg]].map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign:'center', padding:'9px 0' }}>
              <div style={{ fontSize:15, fontWeight:700, color:G.text1 }}>
                {val != null ? (+val).toFixed(1) : '—'}
              </div>
              <div style={{ fontSize:9, color:G.text3, letterSpacing:1.5, textTransform:'uppercase' }}>{lbl}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Roster Card (compact) ─────────────────────────────────────────────────────
function RosterCard({ player, stats, onClick }) {
  const latest = stats?.[0]
  const cls    = classLabel(player.grad_year)

  return (
    <div onClick={onClick} style={{
      background:G.card, border:`1px solid ${G.border}`,
      borderRadius:14, overflow:'hidden', cursor:'pointer',
      transition:'transform .15s, box-shadow .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 32px rgba(34,197,94,.08)` }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      <div style={{ position:'relative', aspectRatio:'3/4', background:G.card2, overflow:'hidden' }}>
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Initials name={player.name} first={player.first_name} last={player.last_name} size={52}/>
            </div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(4,9,10,.95) 0%, transparent 60%)' }}/>
        {cls && (
          <div style={{
            position:'absolute', top:8, left:8,
            background:classBg(player.grad_year), borderRadius:5,
            padding:'2px 8px', fontSize:9, fontWeight:700, color:'#fff',
          }}>{cls}</div>
        )}
        <div style={{ position:'absolute', bottom:0, padding:'10px 10px 8px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:G.text1, lineHeight:1.2 }}>
            {player.first_name} {player.last_name}
          </div>
          <div style={{ fontSize:11, color:G.green, fontWeight:600, marginTop:1 }}>{player.position || '—'}</div>
        </div>
      </div>

      {latest && (+latest.ppg || +latest.rpg || +latest.apg) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:`1px solid ${G.border}` }}>
          {[['PPG', latest.ppg], ['RPG', latest.rpg], ['APG', latest.apg]].map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign:'center', padding:'7px 0' }}>
              <div style={{ fontSize:13, fontWeight:700, color:G.text1 }}>{val != null ? (+val).toFixed(1) : '—'}</div>
              <div style={{ fontSize:9, color:G.text3, letterSpacing:1.5, textTransform:'uppercase' }}>{lbl}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Showcase() {
  const [players,    setPlayers]    = useState([])
  const [statsMap,   setStatsMap]   = useState({})
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [tab,        setTab]        = useState('spotlight')
  const [teamFilter, setTeamFilter] = useState('All')
  const [yearFilter, setYearFilter] = useState('All')
  const [posFilter,  setPosFilter]  = useState('All')

  useEffect(() => {
    async function load() {
      const { data: ps } = await supabasePlayers
        .from('players').select('*')
        .ilike('np_team_name', '%delta%')
        .order('last_name')

      const { data: ss } = await supabasePlayers
        .from('stats').select('*').order('season', { ascending: false })

      const map = {}
      for (const s of ss || []) {
        if (!map[s.player_id]) map[s.player_id] = []
        map[s.player_id].push(s)
      }
      setPlayers(ps || [])
      setStatsMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const spotlight = useMemo(() => players.filter(p => p.is_featured), [players])

  const teams = useMemo(() => {
    const set = new Set(players.map(p => p.np_team_name?.replace('Delta Dubs ', '') || '').filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [players])

  const roster = useMemo(() => players.filter(p => {
    if (teamFilter !== 'All' && !p.np_team_name?.includes(teamFilter)) return false
    if (yearFilter !== 'All' && String(p.grad_year) !== yearFilter) return false
    if (posFilter !== 'All' && p.position !== posFilter) return false
    return true
  }), [players, teamFilter, yearFilter, posFilter])

  const selectedStats = selected ? (statsMap[selected.id] || []) : []

  const TabBtn = ({ id, label, count }) => (
    <button onClick={() => setTab(id)} style={{
      padding:'10px 24px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer',
      border:`1px solid ${tab===id ? G.green : G.border}`,
      background: tab===id ? `${G.green}18` : 'transparent',
      color: tab===id ? G.green : G.text3,
      transition:'all .15s',
    }}>
      {label} {count != null && <span style={{ fontSize:11, opacity:.7 }}>({count})</span>}
    </button>
  )

  return (
    <div style={{ minHeight:'100vh', background:G.bg, color:G.text1, fontFamily:'system-ui,sans-serif' }}>

      {/* Hero */}
      <div style={{
        textAlign:'center', padding:'56px 20px 36px',
        background:`linear-gradient(180deg, rgba(34,197,94,.05) 0%, transparent 100%)`,
        borderBottom:`1px solid ${G.border}`,
      }}>
        <img src={ddLogo} alt="Delta Dubs" style={{ height:90, marginBottom:16, filter:'drop-shadow(0 4px 20px rgba(34,197,94,.28))' }}/>
        <div style={{ fontFamily:'monospace', fontSize:30, fontWeight:800, letterSpacing:6, color:G.text1, textTransform:'uppercase' }}>
          Delta Dubs
        </div>
        <div style={{ fontSize:13, color:G.green, letterSpacing:4, textTransform:'uppercase', marginTop:5, fontWeight:600 }}>
          AAU Basketball · Antioch, CA · Est. 2023
        </div>
        <div style={{
          marginTop:14, display:'inline-block',
          background:'rgba(249,115,22,.1)', border:'1px solid rgba(249,115,22,.22)',
          borderRadius:20, padding:'5px 18px',
          fontSize:12, color:G.orange, fontWeight:700, letterSpacing:1,
        }}>CLASS OF 2027–2031 · BAY AREA TALENT</div>
        <div style={{ marginTop:10, fontSize:12, color:G.text3 }}>
          Coach Reggie Johnson · (510) 759-3709 · deltadubs.aau@gmail.com
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:`${G.bg}ee`, backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${G.border}`,
        padding:'12px 20px', display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap',
      }}>
        <TabBtn id="spotlight" label="⭐ Spotlight" count={spotlight.length}/>
        <TabBtn id="roster"    label="Roster"      count={players.length}/>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px 64px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:G.text3, letterSpacing:2 }}>LOADING…</div>
        ) : tab === 'spotlight' ? (

          /* ── SPOTLIGHT ── */
          <>
            <div style={{ fontSize:12, color:G.text3, marginBottom:24, letterSpacing:1 }}>
              {spotlight.length} FEATURED PLAYER{spotlight.length !== 1 ? 'S' : ''}
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',
              gap:20,
            }}>
              {spotlight.map(p => (
                <SpotlightCard key={p.id} player={p} stats={statsMap[p.id]||[]} onClick={() => setSelected(p)}/>
              ))}
            </div>
          </>

        ) : (

          /* ── ROSTER ── */
          <>
            {/* Roster filters */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:24 }}>
              {teams.map(t => (
                <button key={t} onClick={() => setTeamFilter(t)} style={{
                  padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
                  border:`1px solid ${teamFilter===t ? G.green : G.border}`,
                  background: teamFilter===t ? `${G.green}18` : 'transparent',
                  color: teamFilter===t ? G.green : G.text3, transition:'all .12s',
                }}>{t}</button>
              ))}
              <div style={{ width:1, height:20, background:G.border, alignSelf:'center' }}/>
              {['All','2027','2028','2029','2030','2031'].map(y => (
                <button key={y} onClick={() => setYearFilter(y)} style={{
                  padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
                  border:`1px solid ${yearFilter===y ? G.orange : G.border}`,
                  background: yearFilter===y ? `${G.orange}18` : 'transparent',
                  color: yearFilter===y ? G.orange : G.text3, transition:'all .12s',
                }}>{y === 'All' ? 'All Years' : `'${y.slice(2)}`}</button>
              ))}
            </div>
            <div style={{ fontSize:12, color:G.text3, marginBottom:20, letterSpacing:1 }}>
              {roster.length} PLAYER{roster.length !== 1 ? 'S' : ''}
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',
              gap:14,
            }}>
              {roster.map(p => (
                <RosterCard key={p.id} player={p} stats={statsMap[p.id]||[]} onClick={() => setSelected(p)}/>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign:'center', padding:'20px', borderTop:`1px solid ${G.border}`,
        fontSize:12, color:G.text3,
      }}>
        <div><span style={{ color:G.green, fontWeight:700 }}>Delta Dubs Basketball</span> · Antioch, CA · Est. 2023 · 501(c)(3)</div>
        <div style={{ marginTop:4 }}>Coach Reggie Johnson · (510) 759-3709 · deltadubs.aau@gmail.com</div>
        <div style={{ marginTop:4, fontSize:11 }}>© 2026 Delta Dubs · All rights reserved</div>
      </div>

      {selected && (
        <PlayerModal player={selected} stats={selectedStats} onClose={() => setSelected(null)}/>
      )}
    </div>
  )
}
