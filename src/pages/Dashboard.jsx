import { useStore, TEAMS } from '../hooks/useStore'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

export default function Dashboard() {
  const { players, schedule, finance, projectedIncome, totalOutstanding, paidCount } = useStore()
  const { canSeeFinancials } = usePermissions()
  const navigate = useNavigate()

  const onRoster  = players.filter(p => p.status === 'On Roster')
  const collected = finance.collected || 0
  const outstanding = onRoster.filter(p => (p.balance || 0) > 0).length

  const teamCount     = (id) => onRoster.filter(p => p.team === id).length
  const teamCollected = (id) => onRoster
    .filter(p => p.team === id)
    .reduce((s, p) => s + ((p.isNew ? 385 : 320) - (p.balance || 0)), 0)

  const upcoming = [...schedule]
    .filter(e => e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const alerts = onRoster
    .filter(p => (p.balance || 0) > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 6)

  const teamAvClass = { Drive: 'av-drive', Energy: 'av-energy', Passion: 'av-passion', Power: 'av-power' }

  const fmtDate = (d) => {
    if (!d) return ['', '']
    const dt = new Date(d + 'T12:00:00')
    const parts = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ')
    return parts
  }
  const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString()

  return (
    <div style={{ padding: '24px' }}>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card sc-orange">
          <div className="stat-icon">○</div>
          <div className="stat-label">Players on Roster</div>
          <div className="stat-value">{onRoster.length}</div>
          <div className="stat-sub">Across 4 teams</div>
        </div>
        {canSeeFinancials && <>
          <div className="stat-card sc-green">
            <div className="stat-icon">$</div>
            <div className="stat-label">Actual Collected</div>
            <div className="stat-value">{fmtMoney(collected)}</div>
            <div className="stat-sub">Update in Budget & Finance</div>
          </div>
          <div className="stat-card sc-purple">
            <div className="stat-icon">▲</div>
            <div className="stat-label">Projected Income</div>
            <div className="stat-value">{fmtMoney(projectedIncome)}</div>
            <div className="stat-sub">If all fees paid in full</div>
          </div>
          <div className="stat-card sc-blue">
            <div className="stat-icon">!</div>
            <div className="stat-label">Outstanding Balances</div>
            <div className="stat-value">{outstanding}</div>
            <div className="stat-sub">Players with balance &gt; $0</div>
          </div>
        </>}
      </div>

      {/* Team Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {TEAMS.map(team => (
          <div
            key={team.id}
            onClick={() => navigate('/teams')}
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)',
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = team.color
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.borderColor = 'var(--border2)'
            }}
          >
            <div style={{
              display: 'inline-block', padding: '2px 9px', borderRadius: 20,
              fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
              background: team.color + '22', color: team.color, marginBottom: 7,
            }}>{team.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{team.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{team.gender} · {team.age}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: team.color, marginTop: 6, lineHeight: 1 }}>
              {teamCount(team.id)}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Collected</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--np-green2)' }}>{fmtMoney(teamCollected(team.id))}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid-2" style={{ marginBottom: 18 }}>

        {/* Upcoming */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upcoming Schedule</span>
            <button className="btn-ghost" onClick={() => navigate('/schedule')}>View All</button>
          </div>
          <div style={{ padding: '0 18px' }}>
            {upcoming.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13, padding: '16px 0' }}>No upcoming events — add one in Schedule</div>
            ) : upcoming.map(ev => {
              const [mon, day] = fmtDate(ev.date)
              const typeColor = { Game: 'orange', Tournament: 'purple', Practice: 'blue' }[ev.type] || 'blue'
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
                  <div style={{ minWidth: 46, textAlign: 'center', background: 'var(--bg4)', borderRadius: 8, padding: '5px 6px' }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: 1 }}>{mon}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--orange)', lineHeight: 1 }}>{day}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{ev.time}{ev.location ? ` · ${ev.location}` : ''}</div>
                  </div>
                  <span className={`badge badge-${typeColor}`}>{ev.type}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment Alerts — finance roles only */}
        {canSeeFinancials ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Payment Alerts</span>
            <button className="btn-ghost" onClick={() => navigate('/payments')}>View All</button>
          </div>
          {alerts.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, padding: 18 }}>🎉 All players paid in full!</div>
          ) : alerts.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border2)' }}>
              <div className={`avatar ${teamAvClass[p.team] || 'av-drive'}`}>
                {(p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.team}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red)', fontWeight: 700 }}>${p.balance}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>{p.deposit ? 'balance due' : 'no deposit'}</div>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="card">
            <div className="card-header"><span className="card-title">Team Roster Count</span></div>
            <div className="card-body">
              {TEAMS.map(team => (
                <div key={team.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border2)' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:team.color, width:70 }}>{team.label}</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:22, color:team.color }}>
                    {onRoster.filter(p=>p.team===team.id).length}
                  </span>
                  <span style={{ fontSize:11, color:'var(--text3)' }}>players</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Team Colors */}
      <div className="card">
        <div className="card-header"><span className="card-title">Team Colors</span></div>
        <div className="card-body" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['#5cb800','Green'],['#ee6730','Orange'],['#FFFFFF','White'],['#000000','Black'],['#552583','Purple']].map(([hex, label]) => (
            <div key={hex} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: hex, border: '1px solid rgba(255,255,255,.18)', verticalAlign: 'middle' }} />
              {label} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{hex}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
