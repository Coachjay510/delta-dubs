import { useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'

const AV = { Drive:'av-drive', Energy:'av-energy', Passion:'av-passion', Power:'av-power' }
function initials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }

function avg(games, key) {
  if (!games?.length) return '—'
  return (games.reduce((s,g) => s + (Number(g[key])||0), 0) / games.length).toFixed(1)
}
function pct(games, made, att) {
  if (!games?.length) return '—'
  const m = games.reduce((s,g) => s + (Number(g[made])||0), 0)
  const a = games.reduce((s,g) => s + (Number(g[att])||0), 0)
  return a > 0 ? (m/a*100).toFixed(0)+'%' : '—'
}

const teamColor = { Drive:'#3b82f6', Energy:'#ee6730', Passion:'#a855f7', Power:'#4ade80' }

export default function PlayerPortal() {
  const { players, schedule } = useStore()
  const { user, teamAccess }  = useAuth()

  // Find this player's record by email
  const player = useMemo(() =>
    players.find(p => p.player_email?.toLowerCase() === user?.email?.toLowerCase() ||
                      p.email?.toLowerCase() === user?.email?.toLowerCase()),
    [players, user]
  )

  // Upcoming schedule for their team
  const upcoming = useMemo(() => {
    const team = player?.team || teamAccess
    return [...schedule]
      .filter(e => (e.teams||'').includes(team) && (e.date||'') >= new Date().toISOString().split('T')[0])
      .sort((a,b) => (a.date||'').localeCompare(b.date||''))
      .slice(0, 8)
  }, [schedule, player, teamAccess])

  // Team roster
  const roster = useMemo(() => {
    const team = player?.team || teamAccess
    return players.filter(p => p.team === team && p.status === 'On Roster')
  }, [players, player, teamAccess])

  const fmtDate = (d) => {
    if (!d) return ['','']
    const dt = new Date(d + 'T12:00:00')
    return [dt.toLocaleDateString('en-US',{month:'short'}), dt.getDate()]
  }

  const tc = teamColor[player?.team || teamAccess] || '#5cb800'
  const games = player?.games || []

  if (!player) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--np-green2)', marginBottom:12 }}>
        WELCOME
      </div>
      <div style={{ fontSize:14, color:'var(--text3)', lineHeight:1.7 }}>
        Your player profile hasn't been linked to this account yet.<br/>
        Contact your coach to get set up.
      </div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', marginTop:12 }}>
        Signed in as: {user?.email}
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>

      {/* Player hero card */}
      <div style={{
        background: `linear-gradient(135deg, ${tc}15, ${tc}06)`,
        border: `1px solid ${tc}40`,
        borderRadius: 'var(--radius)',
        padding: '24px 28px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: `${tc}25`, border: `3px solid ${tc}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 28, color: tc,
        }}>
          {initials(player.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:32, letterSpacing:1, lineHeight:1 }}>
            {player.name}
          </div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:6, display:'flex', gap:16, flexWrap:'wrap' }}>
            <span style={{ color: tc, fontWeight:700 }}>{player.team}</span>
            {player.num && <span>#{player.num}</span>}
            {player.ageGroup && <span>{player.ageGroup}</span>}
            {player.year && <span>Class of {player.year}</span>}
          </div>
        </div>
        {/* Season stats summary */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {[
            ['GP',  games.length || '—'],
            ['PPG', avg(games,'pts')],
            ['RPG', avg(games,'reb')],
            ['APG', avg(games,'ast')],
          ].map(([lbl,val]) => (
            <div key={lbl} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, color: tc, lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1.5, marginTop:3 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ gap:18, marginBottom:18 }}>

        {/* Full Stats */}
        <div className="card">
          <div className="card-header"><span className="card-title">Season Stats</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>{games.length} games</span>
          </div>
          {games.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
              No stats logged yet
            </div>
          ) : (
            <div style={{ padding:'0 18px' }}>
              {[
                ['Points',   avg(games,'pts'),  'PPG'],
                ['Rebounds', avg(games,'reb'),  'RPG'],
                ['Assists',  avg(games,'ast'),  'APG'],
                ['Steals',   avg(games,'stl'),  'SPG'],
                ['Blocks',   avg(games,'blk'),  'BPG'],
                ['Turnovers',avg(games,'tov'),  'TOV'],
                ['Minutes',  avg(games,'min'),  'MIN'],
                ['FG%',      pct(games,'fgm','fga'), ''],
                ['3P%',      pct(games,'p3m','p3a'), ''],
                ['FT%',      pct(games,'ftm','fta'), ''],
              ].map(([label, val, abbr]) => (
                <div key={label} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 0', borderBottom:'1px solid var(--border2)',
                }}>
                  <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {abbr && <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{abbr}</span>}
                    <span style={{ fontFamily:'var(--font-display)', fontSize:22, color: tc, lineHeight:1 }}>{val}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upcoming Practices</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>{player.team}</span>
          </div>
          <div style={{ padding:'0 18px', maxHeight:420, overflowY:'auto' }}>
            {upcoming.length === 0 ? (
              <div style={{ padding:'20px 0', color:'var(--text3)', fontSize:13, textAlign:'center' }}>
                No upcoming events
              </div>
            ) : upcoming.map(ev => {
              const [mon, day] = fmtDate(ev.date)
              const typeColor = { Game:'orange', Tournament:'purple', Practice:'blue' }[ev.type] || 'blue'
              return (
                <div key={ev.id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 0', borderBottom:'1px solid var(--border2)',
                }}>
                  <div style={{ minWidth:44, textAlign:'center', background:'var(--bg4)', borderRadius:8, padding:'5px' }}>
                    <div style={{ fontSize:9, textTransform:'uppercase', color:'var(--text3)', letterSpacing:1 }}>{mon}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--orange)', lineHeight:1 }}>{day}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{ev.type}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{ev.time}</div>
                  </div>
                  <span className={`badge badge-${typeColor}`}>{ev.type}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <div className="grid-2" style={{ gap:18 }}>

        {/* Team Roster */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{player.team} Roster</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>{roster.length} players</span>
          </div>
          <div style={{ padding:'0 18px', maxHeight:340, overflowY:'auto' }}>
            {roster.map(p => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 0', borderBottom:'1px solid var(--border2)',
              }}>
                <div className={`avatar ${AV[p.team]||'av-drive'}`}>{initials(p.name)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight: p.id === player.id ? 700 : 400 }}>
                    {p.name} {p.id === player.id && <span style={{ color: tc, fontSize:10 }}>● you</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{p.ageGroup || p.age}</div>
                </div>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text3)' }}>#{p.num||'—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* College Profile */}
        <div className="card">
          <div className="card-header"><span className="card-title">College Profile</span></div>
          <div className="card-body">
            {[
              ['Name',             player.name],
              ['Grad Year',        player.year],
              ['Age Group',        player.ageGroup || player.age],
              ['Position',         player.position],
              ['College Interests',player.colleges],
              ['Height',           player.height],
              ['GPA',              player.gpa],
            ].filter(([,v]) => v).map(([lbl, val]) => (
              <div key={lbl} style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:2 }}>{lbl}</div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>
                  {lbl === 'College Interests' ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {val.split(',').map(c => (
                        <span key={c} className="badge badge-purple">{c.trim()}</span>
                      ))}
                    </div>
                  ) : val}
                </div>
              </div>
            ))}
            {!player.colleges && !player.year && (
              <div style={{ color:'var(--text3)', fontSize:13 }}>
                No college profile info yet — contact your coach to update your profile.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
