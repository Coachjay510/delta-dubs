import { useState, useEffect, useMemo } from 'react'
import { supabasePlayers } from '../lib/supabasePlayers'
import ddLogo from '../assets/dd-logo.png'

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
  if (!url) return false
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
}

// ── Brand colors ──────────────────────────────────────────────────────────────
const G = {
  bg:      '#04090a',
  card:    '#0b1410',
  card2:   '#111e16',
  border:  'rgba(34,197,94,.12)',
  green:   '#22c55e',
  green2:  '#16a34a',
  orange:  '#f97316',
  orange2: '#ea6d0e',
  text1:   '#f0faf4',
  text2:   '#9ab8a4',
  text3:   '#556b5e',
}

// ── OVR ──────────────────────────────────────────────────────────────────────
function calcOvr(statsArr) {
  if (!statsArr?.length) return null
  const s = statsArr[0]
  const ppg = +s.ppg||0, rpg=+s.rpg||0, apg=+s.apg||0
  const spg=+s.spg||0, bpg=+s.bpg||0
  const fg=+s.fg_pct||0, ft=+s.ft_pct||0, tp=+s.fg3_pct||0
  const w = (v,mx,wt) => Math.min(v/mx,1)*wt
  const raw = w(ppg,35,.32)+w(rpg,15,.14)+w(apg,12,.13)+w(spg+bpg,6,.1)
            + w(fg,.65,.12)+w(ft,.95,.09)+w(tp,.45,.1)
  return Math.round(60 + raw*39)
}

function ovrColor(ovr) {
  if (!ovr) return G.text3
  if (ovr >= 85) return '#f59e0b'
  if (ovr >= 78) return G.green
  if (ovr >= 70) return '#38bdf8'
  return G.text2
}

function heightStr(inches) {
  if (!inches) return null
  return `${Math.floor(inches/12)}'${inches%12}"`
}

function fmtPct(v) {
  if (v == null || v === '') return '—'
  return `${Math.round(+v * 100)}%`
}

// ── PlayerCard ────────────────────────────────────────────────────────────────
function PlayerCard({ player, stats, onClick }) {
  const ovr     = calcOvr(stats)
  const latest  = stats?.[0]
  const isSr    = player.grad_year === 2027
  const initials = [player.first_name?.[0], player.last_name?.[0]].filter(Boolean).join('') || '?'

  return (
    <div onClick={onClick} style={{
      background: G.card, borderRadius: 16,
      border: `1px solid ${G.border}`,
      cursor: 'pointer', overflow: 'hidden',
      transition: 'transform .15s, box-shadow .15s',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 40px rgba(34,197,94,.12)` }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
    >
      {/* Photo */}
      <div style={{ position:'relative', aspectRatio:'3/4', overflow:'hidden', background: G.card2 }}>
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }} />
        ) : (
          <div style={{
            width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
            background:`linear-gradient(135deg, ${G.card2}, #0d2018)`,
          }}>
            <span style={{ fontFamily:'var(--font-display,monospace)', fontSize:52, color:G.text3, letterSpacing:2 }}>
              {initials}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(4,9,10,.95) 0%, rgba(4,9,10,.3) 50%, transparent 100%)',
        }}/>

        {/* OVR badge */}
        {ovr && (
          <div style={{
            position:'absolute', top:10, right:10,
            background:'rgba(4,9,10,.8)', backdropFilter:'blur(8px)',
            border:`1.5px solid ${ovrColor(ovr)}`,
            borderRadius:8, padding:'4px 8px', textAlign:'center', minWidth:44,
          }}>
            <div style={{ fontSize:9, color:G.text3, letterSpacing:2, textTransform:'uppercase' }}>OVR</div>
            <div style={{ fontFamily:'monospace', fontSize:20, fontWeight:700, color:ovrColor(ovr), lineHeight:1 }}>{ovr}</div>
          </div>
        )}

        {/* Class badge */}
        <div style={{
          position:'absolute', top:10, left:10,
          background: isSr ? G.orange : '#1d4ed8',
          borderRadius:6, padding:'3px 8px',
          fontSize:10, fontWeight:700, color:'#fff', letterSpacing:.5,
        }}>
          {isSr ? "SR '27" : "JR '28"}
        </div>

        {/* Name overlay */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 14px 10px' }}>
          <div style={{ fontSize:16, fontWeight:700, color:G.text1, lineHeight:1.2 }}>
            {player.first_name} {player.last_name}
          </div>
          <div style={{ fontSize:12, color:G.green, marginTop:2, fontWeight:600 }}>
            {player.position || 'N/A'}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
        padding:'10px 0', borderTop:`1px solid ${G.border}`,
      }}>
        {[
          ['PPG', latest?.ppg != null ? (+latest.ppg).toFixed(1) : '—'],
          ['RPG', latest?.rpg != null ? (+latest.rpg).toFixed(1) : '—'],
          ['APG', latest?.apg != null ? (+latest.apg).toFixed(1) : '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ textAlign:'center', padding:'4px 0' }}>
            <div style={{ fontSize:14, fontWeight:700, color:G.text1 }}>{val}</div>
            <div style={{ fontSize:9, color:G.text3, letterSpacing:1.5, textTransform:'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PlayerModal ───────────────────────────────────────────────────────────────
function PlayerModal({ player, stats, onClose }) {
  const ovr    = calcOvr(stats)
  const isSr   = player.grad_year === 2027
  const ht     = heightStr(player.height_inches)
  const ws     = heightStr(player.wingspan_inches)
  const initials = [player.first_name?.[0], player.last_name?.[0]].filter(Boolean).join('') || '?'

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.85)',
      backdropFilter:'blur(6px)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, overflowY:'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: G.card, border:`1px solid ${G.border}`,
        borderRadius:20, width:'100%', maxWidth:780,
        overflow:'hidden', position:'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position:'absolute', top:14, right:14, zIndex:10,
          background:'rgba(255,255,255,.08)', border:'none', borderRadius:8,
          color:G.text2, fontSize:18, width:34, height:34, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>✕</button>

        <div style={{ display:'flex', flexWrap:'wrap' }}>
          {/* Photo */}
          <div style={{ width:'min(280px,100%)', background:G.card2, flexShrink:0, position:'relative', minHeight:320 }}>
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.name}
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', minHeight:320 }} />
            ) : (
              <div style={{ width:'100%', minHeight:320, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:'monospace', fontSize:72, color:G.text3 }}>{initials}</span>
              </div>
            )}
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(to right, transparent 60%, rgba(11,20,16,.95) 100%)',
            }}/>

            {/* Class badge */}
            <div style={{
              position:'absolute', top:14, left:14,
              background: isSr ? G.orange : '#1d4ed8',
              borderRadius:8, padding:'5px 12px',
              fontSize:11, fontWeight:700, color:'#fff',
            }}>
              {isSr ? "SENIOR · CLASS OF 2027" : "JUNIOR · CLASS OF 2028"}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:280, padding:'28px 28px 24px' }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:28, fontWeight:800, color:G.text1, lineHeight:1.1 }}>
                {player.first_name} {player.last_name}
              </div>
              <div style={{ fontSize:14, color:G.green, fontWeight:600, marginTop:4 }}>
                {player.position} · {player.np_team_name}
              </div>
              {player.school_name && (
                <div style={{ fontSize:12, color:G.text3, marginTop:2 }}>{player.school_name}</div>
              )}
            </div>

            {/* OVR + physical */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
              {ovr && (
                <div style={{
                  background:G.card2, border:`1.5px solid ${ovrColor(ovr)}22`,
                  borderRadius:12, padding:'10px 18px', textAlign:'center',
                }}>
                  <div style={{ fontSize:11, color:G.text3, letterSpacing:2, textTransform:'uppercase' }}>Overall</div>
                  <div style={{ fontSize:38, fontWeight:800, color:ovrColor(ovr), lineHeight:1 }}>{ovr}</div>
                </div>
              )}
              {(ht || ws) && (
                <div style={{ background:G.card2, border:`1px solid ${G.border}`, borderRadius:12, padding:'10px 18px' }}>
                  {ht && <div style={{ fontSize:13, color:G.text1, fontWeight:600 }}>Height: <span style={{color:G.green}}>{ht}</span></div>}
                  {ws && <div style={{ fontSize:13, color:G.text1, fontWeight:600, marginTop:4 }}>Wingspan: <span style={{color:G.green}}>{ws}</span></div>}
                  {!ht && !ws && <div style={{ fontSize:12, color:G.text3 }}>Measurements pending</div>}
                </div>
              )}
              {player.gpa && (
                <div style={{ background:G.card2, border:`1px solid ${G.border}`, borderRadius:12, padding:'10px 18px', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:G.text3, letterSpacing:2, textTransform:'uppercase' }}>GPA</div>
                  <div style={{ fontSize:28, fontWeight:800, color:G.orange, lineHeight:1.1 }}>{player.gpa}</div>
                </div>
              )}
            </div>

            {/* Stats table */}
            {stats?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:G.text3, letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Stats</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr>
                        {['Season','GP','PPG','RPG','APG','SPG','FG%','3P%'].map(h => (
                          <th key={h} style={{ padding:'5px 8px', color:G.text3, textAlign:'left',
                            fontFamily:'monospace', fontSize:10, letterSpacing:1, borderBottom:`1px solid ${G.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((s, i) => (
                        <tr key={i} style={{ borderBottom:`1px solid ${G.border}22` }}>
                          <td style={{ padding:'7px 8px', color:G.green, fontWeight:700, fontSize:11 }}>{s.season}</td>
                          <td style={{ padding:'7px 8px', color:G.text1 }}>{s.gp}</td>
                          <td style={{ padding:'7px 8px', color:G.text1, fontWeight:700 }}>{s.ppg != null ? (+s.ppg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'7px 8px', color:G.text1 }}>{s.rpg != null ? (+s.rpg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'7px 8px', color:G.text1 }}>{s.apg != null ? (+s.apg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'7px 8px', color:G.text1 }}>{s.spg != null ? (+s.spg).toFixed(1) : '—'}</td>
                          <td style={{ padding:'7px 8px', color:G.text1 }}>{fmtPct(s.fg_pct)}</td>
                          <td style={{ padding:'7px 8px', color:G.text1 }}>{fmtPct(s.fg3_pct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Film embed */}
            {player.film_url && (() => {
              const embedUrl = getYouTubeEmbedUrl(player.film_url)
              const isDirect = isDirectVideo(player.film_url)
              return (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:G.text3, letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Film</div>
                  {embedUrl ? (
                    <div style={{ position:'relative', paddingBottom:'56.25%', borderRadius:12, overflow:'hidden', background:'#000' }}>
                      <iframe
                        src={embedUrl}
                        title="Player Film"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
                      />
                    </div>
                  ) : isDirect ? (
                    <video controls style={{ width:'100%', borderRadius:12, background:'#000' }}>
                      <source src={player.film_url} />
                    </video>
                  ) : (
                    <a href={player.film_url} target="_blank" rel="noopener noreferrer" style={{
                      background:G.green2, color:'#fff', borderRadius:10,
                      padding:'10px 20px', fontSize:13, fontWeight:700,
                      textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6,
                    }}>▶ View Film</a>
                  )}
                </div>
              )
            })()}

            {/* Contact */}
            <a href={`mailto:deltadubs.aau@gmail.com?subject=Recruiting Inquiry — ${player.first_name} ${player.last_name}&body=Hello Coach Johnson,%0A%0AI am interested in learning more about ${player.first_name} ${player.last_name}.%0A%0A`}
              style={{
                background: G.orange, color:'#fff', border:'none', borderRadius:10,
                padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer',
                textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6,
              }}>✉ Request Info — Coach Johnson</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Showcase ─────────────────────────────────────────────────────────────
export default function Showcase() {
  const [players,   setPlayers]   = useState([])
  const [statsMap,  setStatsMap]  = useState({})
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [teamFilter,setTeamFilter]= useState('All')
  const [yearFilter,setYearFilter]= useState('All')
  const [posFilter, setPosFilter] = useState('All')

  useEffect(() => {
    async function load() {
      const { data: ps } = await supabasePlayers
        .from('players')
        .select('*')
        .ilike('np_team_name', '%delta dubs%')
        .order('last_name')

      const { data: ss } = await supabasePlayers
        .from('stats')
        .select('*')
        .order('season', { ascending: false })

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

  const teams = useMemo(() => {
    const set = new Set(players.map(p => p.np_team_name?.replace('Delta Dubs ', '') || '').filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [players])

  const filtered = useMemo(() => players.filter(p => {
    if (teamFilter !== 'All' && !p.np_team_name?.includes(teamFilter)) return false
    if (yearFilter === '2027' && p.grad_year !== 2027) return false
    if (yearFilter === '2028' && p.grad_year !== 2028) return false
    if (posFilter !== 'All' && p.position !== posFilter) return false
    return true
  }), [players, teamFilter, yearFilter, posFilter])

  const selectedStats = selected ? (statsMap[selected.id] || []) : []

  return (
    <div style={{ minHeight:'100vh', background:G.bg, color:G.text1, fontFamily:'system-ui,sans-serif' }}>

      {/* Hero */}
      <div style={{
        textAlign:'center', padding:'60px 20px 40px',
        background:`linear-gradient(180deg, rgba(34,197,94,.06) 0%, transparent 100%)`,
        borderBottom:`1px solid ${G.border}`,
      }}>
        <img src={ddLogo} alt="Delta Dubs" style={{ height:100, marginBottom:20, filter:'drop-shadow(0 4px 24px rgba(34,197,94,.3))' }} />
        <div style={{ fontFamily:'monospace', fontSize:32, fontWeight:800, letterSpacing:6, color:G.text1, textTransform:'uppercase' }}>
          Delta Dubs
        </div>
        <div style={{ fontSize:14, color:G.green, letterSpacing:4, textTransform:'uppercase', marginTop:6, fontWeight:600 }}>
          AAU Basketball · Antioch, CA · Est. 2023
        </div>
        <div style={{
          marginTop:16, display:'inline-block',
          background:'rgba(249,115,22,.1)', border:'1px solid rgba(249,115,22,.25)',
          borderRadius:20, padding:'6px 20px',
          fontSize:13, color:G.orange, fontWeight:700, letterSpacing:1,
        }}>
          CLASS OF 2027 & 2028 — AVAILABLE RECRUITS
        </div>
        <div style={{ marginTop:12, fontSize:13, color:G.text3 }}>
          Contact: Coach Reggie Johnson · (510) 759-3709 · deltadubs.aau@gmail.com
        </div>
      </div>

      {/* Filters */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:`${G.bg}ee`, backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${G.border}`,
        padding:'12px 20px', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center',
        justifyContent:'center',
      }}>
        {/* Team */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {teams.map(t => (
            <button key={t} onClick={() => setTeamFilter(t)} style={{
              padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700,
              border:`1px solid ${teamFilter===t ? G.green : G.border}`,
              background: teamFilter===t ? `${G.green}22` : 'transparent',
              color: teamFilter===t ? G.green : G.text3,
              cursor:'pointer', transition:'all .12s',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ width:1, height:20, background:G.border }}/>
        {/* Year */}
        {['All','2027','2028'].map(y => (
          <button key={y} onClick={() => setYearFilter(y)} style={{
            padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700,
            border:`1px solid ${yearFilter===y ? G.orange : G.border}`,
            background: yearFilter===y ? `${G.orange}22` : 'transparent',
            color: yearFilter===y ? G.orange : G.text3,
            cursor:'pointer', transition:'all .12s',
          }}>{y === 'All' ? 'All Years' : `'${y.slice(2)}`}</button>
        ))}
        <div style={{ width:1, height:20, background:G.border }}/>
        {/* Position */}
        {['All','PG','SG','SF','PF','C','Guard','Forward','Point Guard','Small Forward','Center'].filter(pos => {
          if (pos === 'All') return true
          return players.some(p => p.position === pos)
        }).slice(0,6).map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)} style={{
            padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700,
            border:`1px solid ${posFilter===pos ? '#38bdf8' : G.border}`,
            background: posFilter===pos ? 'rgba(56,189,248,.15)' : 'transparent',
            color: posFilter===pos ? '#38bdf8' : G.text3,
            cursor:'pointer', transition:'all .12s',
          }}>{pos}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px 60px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:G.text3, fontSize:14, letterSpacing:2 }}>
            LOADING ROSTER…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:80, color:G.text3, fontSize:14 }}>
            No players match those filters.
          </div>
        ) : (
          <>
            <div style={{ fontSize:12, color:G.text3, marginBottom:20, letterSpacing:1 }}>
              {filtered.length} PLAYER{filtered.length !== 1 ? 'S' : ''}
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
              gap:16,
            }}>
              {filtered.map(p => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  stats={statsMap[p.id] || []}
                  onClick={() => setSelected(p)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign:'center', padding:'24px 20px',
        borderTop:`1px solid ${G.border}`,
        fontSize:12, color:G.text3,
      }}>
        <div style={{ marginBottom:6 }}>
          <span style={{ color:G.green, fontWeight:700 }}>Delta Dubs Basketball</span> · Antioch, CA · Est. 2023 · 501(c)(3) Nonprofit
        </div>
        <div>Coach Reggie Johnson · (510) 759-3709 · deltadubs.aau@gmail.com</div>
        <div style={{ marginTop:6, fontSize:11, color:G.text3 }}>© 2026 Delta Dubs · All rights reserved</div>
      </div>

      {/* Modal */}
      {selected && (
        <PlayerModal
          player={selected}
          stats={statsMap[selected.id] || []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
