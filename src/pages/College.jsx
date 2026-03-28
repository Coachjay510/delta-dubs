import { useMemo, useState } from 'react'
import { useStore, TEAMS } from '../hooks/useStore'

const AV = { Drive:'av-drive', Energy:'av-energy', Passion:'av-passion', Power:'av-power' }
function initials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }

export default function College() {
  const { players } = useStore()
  const [search, setSearch] = useState('')
  const [teamF, setTeamF]   = useState('')

  const prospects = useMemo(() =>
    players
      .filter(p => p.status === 'On Roster')
      .filter(p =>
        (!teamF || p.team === teamF) &&
        ((p.name||'').toLowerCase().includes(search.toLowerCase()) ||
         (p.colleges||'').toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a,b) => (a.name||'').localeCompare(b.name||'')),
    [players, search, teamF]
  )

  const withColleges = prospects.filter(p => p.colleges)

  return (
    <div style={{ padding: 24 }}>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card sc-green">
          <div className="stat-label">Total Prospects</div>
          <div className="stat-value">{players.filter(p=>p.status==='On Roster').length}</div>
          <div className="stat-sub">On roster</div>
        </div>
        <div className="stat-card sc-blue">
          <div className="stat-label">With College Interest</div>
          <div className="stat-value">{players.filter(p=>p.colleges).length}</div>
          <div className="stat-sub">Colleges listed</div>
        </div>
        <div className="stat-card sc-orange">
          <div className="stat-label">Senior Class</div>
          <div className="stat-value">{players.filter(p=>p.year==='2026'||p.year==='2025').length}</div>
          <div className="stat-sub">Class of '25/'26</div>
        </div>
        <div className="stat-card sc-purple">
          <div className="stat-label">Avg Grad Year</div>
          <div className="stat-value" style={{ fontSize:28 }}>
            {(() => {
              const years = players.filter(p=>p.year).map(p=>Number(p.year)).filter(Boolean)
              return years.length ? Math.round(years.reduce((a,b)=>a+b,0)/years.length) : '—'
            })()}
          </div>
          <div className="stat-sub">Across all teams</div>
        </div>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="🔍 Search player or college…"
          value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="filter-select" value={teamF} onChange={e=>setTeamF(e.target.value)}>
          <option value="">All Teams</option>
          {TEAMS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th><th>Team</th><th>Grad Year</th>
                <th>Age Group</th><th>College Interests</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {prospects.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  No prospects found
                </td></tr>
              )}
              {prospects.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className={`avatar ${AV[p.team]||'av-drive'}`}>{initials(p.name)}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{p.position||''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:11, fontWeight:700, color:TEAMS.find(t=>t.id===p.team)?.color||'var(--text2)' }}>
                    {p.team}
                  </td>
                  <td>
                    {p.year
                      ? <span className="badge badge-blue">{p.year}</span>
                      : <span style={{ color:'var(--text3)' }}>—</span>}
                  </td>
                  <td className="td-muted">{p.ageGroup||p.age||'—'}</td>
                  <td>
                    {p.colleges ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {p.colleges.split(',').map(c => (
                          <span key={c} className="badge badge-purple">{c.trim()}</span>
                        ))}
                      </div>
                    ) : <span style={{ color:'var(--text3)', fontSize:12 }}>None listed</span>}
                  </td>
                  <td style={{ fontSize:12, color:'var(--text3)', maxWidth:200 }}>{p.notes||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
