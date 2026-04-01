import { useState, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

function initials(name) {
  return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
}

export default function Teams() {
  const { players, orgTeams, loading } = useStore()
  const { isPlayer, teamAccess, canSeeFinancials } = usePermissions()
  const navigate = useNavigate()
  const [active, setActive] = useState(null)

  // Set active when orgTeams loads
  useEffect(() => {
    if (orgTeams.length > 0 && !active) {
      const first = isPlayer
        ? orgTeams.find(t => t.label === teamAccess || t.id === teamAccess)
        : orgTeams[0]
      setActive(first?.label || first?.id || null)
    }
  }, [orgTeams, isPlayer, teamAccess])

  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
      <div style={{ fontSize:13 }}>Loading teams…</div>
    </div>
  )

  if (!loading && orgTeams.length === 0) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8 }}>No teams yet</div>
      <div style={{ fontSize:13, marginBottom:20 }}>Add your teams to get started.</div>
      <button className="btn btn-primary" onClick={() => navigate('/admin')}>Go to Admin</button>
    </div>
  )

  const visibleTeams = isPlayer
    ? orgTeams.filter(t => t.label === teamAccess || t.id === teamAccess)
    : orgTeams

  const team      = orgTeams.find(t => t.label === active || t.id === active)
  const teamName  = team?.label || team?.id || active || ''
  const teamColor = team?.color || '#5cb800'

  // Match players by team name (stored as label in players table)
  const roster  = players.filter(p => p.team === teamName && p.status === 'On Roster')
  const pending = players.filter(p => p.team === teamName && p.status !== 'On Roster')

  const collected = roster.reduce((s,p) => s + ((p.isNew ? 385 : 320) - (p.balance||0)), 0)
  const projected = roster.reduce((s,p) => s + (p.isNew ? 385 : 320), 0)
  const fmtMoney  = n => '$' + Number(n||0).toLocaleString()

  function payBadge(p) {
    if ((p.balance||0) === 0) return <span className="badge badge-green">✓ Paid</span>
    if (p.deposit) return <span className="badge badge-yellow">${p.balance} left</span>
    return <span className="badge badge-red">No deposit</span>
  }

  return (
    <div style={{ padding: 24 }}>

      {/* Team tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {visibleTeams.map(t => {
          const tName  = t.label || t.id
          const tColor = t.color || '#5cb800'
          const isActive = active === tName || active === t.id
          return (
            <button key={tName} onClick={() => setActive(tName)} style={{
              padding:'8px 20px', borderRadius:'var(--radius-sm)',
              border:`1px solid ${isActive ? tColor : 'var(--border2)'}`,
              background: isActive ? tColor+'18' : 'var(--bg3)',
              color: isActive ? tColor : 'var(--text2)',
              fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s',
              borderLeft:`3px solid ${tColor}`,
            }}>
              {tName}
              <span style={{ marginLeft:8, fontFamily:'var(--font-mono)', fontSize:11, opacity:.7 }}>
                {players.filter(p => p.team === tName && p.status === 'On Roster').length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Team header */}
      <div style={{
        background:`linear-gradient(135deg, ${teamColor}12, ${teamColor}06)`,
        border:`1px solid ${teamColor}40`,
        borderRadius:'var(--radius)', padding:'20px 24px', marginBottom:20,
        display:'flex', alignItems:'center', gap:24, flexWrap:'wrap',
      }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:42, color:teamColor, lineHeight:1 }}>{teamName}</div>
          {team?.age && <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>{team.age}</div>}
        </div>
        {[
          ['Players', roster.length, teamColor],
          ...(canSeeFinancials ? [
            ['Collected', fmtMoney(collected), 'var(--np-green2)'],
            ['Projected', fmtMoney(projected), 'var(--text2)'],
            ['Outstanding', fmtMoney(projected - collected), 'var(--red)'],
          ] : []),
        ].map(([lbl, val, color]) => (
          <div key={lbl} style={{ borderLeft:'1px solid var(--border2)', paddingLeft:20 }}>
            <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:2, color:'var(--text3)', fontWeight:700, marginBottom:4 }}>{lbl}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, color, lineHeight:1 }}>{val}</div>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }} onClick={() => navigate('/players')}>
          Manage Players
        </button>
      </div>

      {/* Roster table */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title">Roster — {roster.length} players</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th><th>#</th><th>Age / Group</th>
                <th>Grad Year</th>
                {!isPlayer && <th>Parent</th>}
                {!isPlayer && <th>Phone</th>}
                {canSeeFinancials && <th>Payment</th>}
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:28 }}>
                  No players on roster — add players in the Players section
                </td></tr>
              )}
              {roster.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="avatar" style={{ background: teamColor+'25', color: teamColor }}>{initials(p.name)}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                        {p.colleges && <div style={{ fontSize:11, color:'var(--text3)' }}>{p.colleges}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="td-mono" style={{ color:'var(--text3)' }}>#{p.num||'—'}</td>
                  <td className="td-muted">{[p.age, p.ageGroup].filter(Boolean).join(' / ')||'—'}</td>
                  <td className="td-muted">{p.year||'—'}</td>
                  {!isPlayer && <td style={{ fontSize:12 }}>{p.parent||'—'}</td>}
                  {!isPlayer && <td className="td-mono" style={{ fontSize:11 }}>{p.phone||'—'}</td>}
                  {canSeeFinancials && <td>{payBadge(p)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color:'var(--text3)' }}>Pending — {pending.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Player</th><th>Status</th><th>Parent</th><th>Phone</th></tr></thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="avatar" style={{ opacity:.6, background:teamColor+'20', color:teamColor }}>{initials(p.name)}</div>
                        <span style={{ fontSize:13, color:'var(--text2)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{p.status}</span></td>
                    <td style={{ fontSize:12, color:'var(--text3)' }}>{p.parent||'—'}</td>
                    <td className="td-mono" style={{ fontSize:11, color:'var(--text3)' }}>{p.phone||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
