import { useState, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

function initials(name) {
  return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
}

export default function ParentPortal() {
  const { players, schedule, orgTeams } = useStore()
  const { user, orgId } = useAuth()
  const [myPlayers, setMyPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  // Find players linked to this parent's email
  useEffect(() => {
    if (!user?.email || !players.length) { setLoading(false); return }
    const linked = players.filter(p =>
      p.email?.toLowerCase() === user.email.toLowerCase() ||
      p.player_email?.toLowerCase() === user.email.toLowerCase()
    )
    setMyPlayers(linked)
    if (linked.length > 0) setSelected(linked[0])
    setLoading(false)
  }, [user, players])

  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>Loading…</div>
  )

  if (myPlayers.length === 0) return (
    <div style={{ padding:40, maxWidth:520 }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:24, marginBottom:8 }}>Parent Portal</div>
      <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.7, marginBottom:20 }}>
        No players are linked to <strong style={{ color:'var(--text)' }}>{user?.email}</strong>.
        Contact your org admin to link your account to your child's player profile.
      </div>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:10, padding:'16px 20px', fontSize:12, color:'var(--text2)' }}>
        <strong>How to get access:</strong> Ask your Head Admin to add your email to your child's player profile in the Players section.
      </div>
    </div>
  )

  const player = selected
  if (!player) return null

  const team = orgTeams.find(t => t.label === player.team || t.id === player.team)
  const teamColor = team?.color || '#5cb800'

  const upcoming = [...schedule]
    .filter(e => {
      if (!e.date) return false
      const matchesTeam = !e.teams || e.teams === 'All Teams' || e.teams?.includes(player.team)
      return matchesTeam && e.date >= new Date().toISOString().split('T')[0]
    })
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0, 8)

  const fmtDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d + 'T12:00:00')
    return dt.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  }

  const balance = player.balance || 0
  const fee = player.isNew ? 385 : 320
  const paid = fee - balance
  const pctPaid = fee > 0 ? Math.min(100, Math.round((paid / fee) * 100)) : 100

  const stats = player.games || []
  const avgStat = (key) => stats.length ? (stats.reduce((s,g) => s + (g[key]||0), 0) / stats.length).toFixed(1) : '—'

  return (
    <div style={{ padding:24, maxWidth:900 }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:4 }}>Parent Portal</div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>Viewing as {user?.email}</div>
      </div>

      {/* Player selector if multiple kids */}
      {myPlayers.length > 1 && (
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {myPlayers.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} style={{
              padding:'8px 18px', borderRadius:'var(--radius-sm)',
              border:`1px solid ${selected?.id===p.id ? teamColor : 'var(--border2)'}`,
              background: selected?.id===p.id ? teamColor+'18' : 'var(--bg3)',
              color: selected?.id===p.id ? teamColor : 'var(--text2)',
              fontSize:13, fontWeight:600, cursor:'pointer',
            }}>{p.name}</button>
          ))}
        </div>
      )}

      {/* Player card */}
      <div style={{
        background:`linear-gradient(135deg, ${teamColor}10, transparent)`,
        border:`1px solid ${teamColor}35`,
        borderRadius:'var(--radius)', padding:'20px 24px', marginBottom:20,
        display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
      }}>
        <div style={{
          width:64, height:64, borderRadius:'50%',
          background: teamColor+'25', border:`2px solid ${teamColor}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-display)', fontSize:24, color:teamColor, flexShrink:0,
        }}>{initials(player.name)}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:26, lineHeight:1 }}>{player.name}</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>
            {player.team} · #{player.num||'—'} · {player.ageGroup||player.age||'—'}
            {player.year && ` · Class of ${player.year}`}
          </div>
        </div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          {[
            ['Status', player.status || 'Active'],
            ['Position', player.drive || '—'],
            ['Games', stats.length],
          ].map(([lbl,val]) => (
            <div key={lbl} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:teamColor }}>{val}</div>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Payment status */}
        <div className="card">
          <div className="card-header"><span className="card-title">💰 Payment Status</span></div>
          <div className="card-body">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>Season Fee</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13 }}>${fee}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>Paid</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--np-green2)' }}>${paid}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>Remaining</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color: balance>0?'var(--red)':'var(--np-green2)' }}>
                {balance > 0 ? `$${balance}` : '✓ Paid in full'}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:`${pctPaid}%`, height:'100%', background:balance>0?'var(--np-green2)':'var(--np-green2)', borderRadius:3, transition:'width .4s' }}/>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>{pctPaid}% paid</div>
            {balance > 0 && (
              <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:6, fontSize:12, color:'#ef4444' }}>
                ${balance} outstanding — contact your coach or admin to log a payment.
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Season Stats</span></div>
          <div className="card-body">
            {stats.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--text3)', padding:'12px 0' }}>No stats logged yet.</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                {[
                  ['PPG',  avgStat('pts')],
                  ['RPG',  avgStat('reb')],
                  ['APG',  avgStat('ast')],
                  ['STL',  avgStat('stl')],
                  ['BLK',  avgStat('blk')],
                  ['TOV',  avgStat('tov')],
                ].map(([lbl,val]) => (
                  <div key={lbl} style={{ textAlign:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--np-green2)' }}>{val}</div>
                    <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming schedule */}
      <div className="card">
        <div className="card-header"><span className="card-title">📅 Upcoming Schedule</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Event</th><th>Type</th><th>Location</th><th>Time</th></tr>
            </thead>
            <tbody>
              {upcoming.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text3)', padding:24 }}>
                  No upcoming events for {player.team}
                </td></tr>
              )}
              {upcoming.map(e => (
                <tr key={e.id}>
                  <td className="td-mono" style={{ fontSize:12 }}>{fmtDate(e.date)}</td>
                  <td style={{ fontWeight:600, fontSize:13 }}>{e.title}</td>
                  <td><span className="badge badge-gray">{e.type}</span></td>
                  <td style={{ fontSize:12, color:'var(--text2)' }}>{e.location||'—'}</td>
                  <td style={{ fontSize:12, color:'var(--text3)' }}>{e.time||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* College profile if exists */}
      {(player.colleges || player.year) && (
        <div className="card" style={{ marginTop:16 }}>
          <div className="card-header"><span className="card-title">🎓 College Recruiting</span></div>
          <div className="card-body" style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {player.year && (
              <div>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:3 }}>Grad Year</div>
                <div style={{ fontSize:15, fontWeight:600 }}>{player.year}</div>
              </div>
            )}
            {player.colleges && (
              <div>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:3 }}>College Interests</div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>{player.colleges}</div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
