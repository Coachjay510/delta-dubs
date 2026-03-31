import { useState, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

const AV = { Drive:'av-drive', Energy:'av-energy', Passion:'av-passion', Power:'av-power' }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }

export default function Teams() {
  const { players, orgTeams } = useStore()
  const { isPlayer, teamAccess, canSeeFinancials } = usePermissions()
  const navigate = useNavigate()

  const [active, setActive] = useState('')

  // Set active team once orgTeams loads
  useEffect(() => {
    if (orgTeams.length > 0 && !active) {
      setActive(isPlayer ? teamAccess : orgTeams[0]?.id || orgTeams[0]?.label || '')
    }
  }, [orgTeams])

  const availableTeams = isPlayer ? orgTeams.filter(t => t.id === teamAccess || t.label === teamAccess) : orgTeams
  const team    = orgTeams.find(t => t.id === active || t.label === active)
  const roster  = players.filter(p => p.team === active && p.status === 'On Roster')
  const pending = players.filter(p => p.team === active && p.status !== 'On Roster')
  const collected = roster.reduce((s,p) => s + ((p.isNew ? 385 : 320) - (p.balance||0)), 0)
  const projected = roster.reduce((s,p) => s + (p.isNew ? 385 : 320), 0)

  const fmtMoney = n => '$' + Number(n||0).toLocaleString()

  function payBadge(p) {
    if ((p.balance||0) === 0) return <span className="badge badge-green">✓ Paid</span>
    if (p.deposit) return <span className="badge badge-yellow">${p.balance} left</span>
    return <span className="badge badge-red">No deposit</span>
  }

  // Show loading state until teams are ready
  if (orgTeams.length === 0) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>◈</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:8 }}>Loading teams…</div>
      <div style={{ fontSize:13 }}>If this persists, add teams in the Admin portal or contact support.</div>
    </div>
  )

  // Guard against team not found
  if (!team) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>◈</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:8 }}>No teams found</div>
      <div style={{ fontSize:13 }}>Add your teams through the Admin portal.</div>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>

      {/* Team tabs — players only see their team */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {availableTeams.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${active === t.id ? t.color : 'var(--border2)'}`,
            background: active === t.id ? t.color + '18' : 'var(--bg3)',
            color: active === t.id ? t.color : 'var(--text2)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all .15s',
            borderLeft: `3px solid ${t.color}`,
          }}>
            {t.label}
            <span style={{ marginLeft:8, fontFamily:'var(--font-mono)', fontSize:11, opacity:.7 }}>
              {players.filter(p=>p.team===t.id && p.status==='On Roster').length}
            </span>
          </button>
        ))}
      </div>

      {/* Team header */}
      <div style={{
        background: `linear-gradient(135deg, ${team.color}12, ${team.color}06)`,
        border: `1px solid ${team.color}40`,
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:42, color: team.color, lineHeight:1 }}>{team.label}</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>{team.gender} · {team.age}</div>
        </div>
        {[
          ['Players', roster.length, team.color],
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
      <div className="card" style={{ marginBottom: 16 }}>
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
                      <div className={`avatar ${AV[p.team]||'av-drive'}`}>{initials(p.name)}</div>
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

      {/* Pending / not on roster */}
      {pending.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color:'var(--text3)' }}>Pending / Not on Roster — {pending.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Player</th><th>Status</th><th>Parent</th><th>Phone</th></tr></thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className={`avatar ${AV[p.team]||'av-drive'}`} style={{ opacity:.6 }}>{initials(p.name)}</div>
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
