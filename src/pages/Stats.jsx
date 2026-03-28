import { useState, useMemo } from 'react'
import { useStore, TEAMS } from '../hooks/useStore'

const AV = { Drive:'av-drive', Energy:'av-energy', Passion:'av-passion', Power:'av-power' }
function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }

const BLANK = { playerId:'', date:'', pts:0, reb:0, ast:0, stl:0, blk:0, tov:0, min:0, fgm:0, fga:0, p3m:0, p3a:0, ftm:0, fta:0 }

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

export default function Stats() {
  const { players, logStats } = useStore()
  const [teamF, setTeamF]       = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(BLANK)

  const onRoster = players.filter(p => p.status === 'On Roster')
  const filtered = useMemo(() =>
    onRoster.filter(p => teamF === 'all' || p.team === teamF)
      .sort((a,b) => {
        const ag = avg(a.games,'pts'), bg = avg(b.games,'pts')
        return (bg === '—' ? -1 : Number(bg)) - (ag === '—' ? -1 : Number(ag))
      }),
    [players, teamF]
  )

  function setF(k,v) { setForm(f => ({...f, [k]: v})) }

  function save() {
    const id = parseInt(form.playerId)
    if (!id) return
    const { playerId, ...stats } = form
    logStats(id, stats)
    setShowModal(false)
    setForm(BLANK)
  }

  const statCol = (label, val, highlight) => (
    <td style={{
      fontFamily:'var(--font-mono)', fontSize:12, textAlign:'center',
      color: highlight ? 'var(--np-green2)' : 'var(--text2)',
      fontWeight: highlight ? 700 : 400,
    }}>{val}</td>
  )

  return (
    <div style={{ padding: 24 }}>

      <div className="filter-bar">
        <select className="filter-select" value={teamF} onChange={e => setTeamF(e.target.value)}>
          <option value="all">All Players</option>
          {TEAMS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={() => setShowModal(true)}>
          + Log Game Stats
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th><th>Team</th>
                <th style={{textAlign:'center'}}>GP</th>
                <th style={{textAlign:'center'}}>MIN</th>
                <th style={{textAlign:'center'}}>PPG</th>
                <th style={{textAlign:'center'}}>RPG</th>
                <th style={{textAlign:'center'}}>APG</th>
                <th style={{textAlign:'center'}}>SPG</th>
                <th style={{textAlign:'center'}}>BPG</th>
                <th style={{textAlign:'center'}}>TOV</th>
                <th style={{textAlign:'center'}}>FG%</th>
                <th style={{textAlign:'center'}}>3P%</th>
                <th style={{textAlign:'center'}}>FT%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={13} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  No players found
                </td></tr>
              )}
              {filtered.map(p => {
                const g = p.games || []
                const gp = g.length
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className={`avatar ${AV[p.team]||'av-drive'}`}>{initials(p.name)}</div>
                        <span style={{ fontWeight:600, fontSize:13 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:11, fontWeight:700, color: TEAMS.find(t=>t.id===p.team)?.color||'var(--text2)' }}>
                      {p.team}
                    </td>
                    {statCol('GP',  gp || '—', false)}
                    {statCol('MIN', avg(g,'min'), false)}
                    {statCol('PPG', avg(g,'pts'), true)}
                    {statCol('RPG', avg(g,'reb'), false)}
                    {statCol('APG', avg(g,'ast'), false)}
                    {statCol('SPG', avg(g,'stl'), false)}
                    {statCol('BPG', avg(g,'blk'), false)}
                    {statCol('TOV', avg(g,'tov'), false)}
                    {statCol('FG%', pct(g,'fgm','fga'), false)}
                    {statCol('3P%', pct(g,'p3m','p3a'), false)}
                    {statCol('FT%', pct(g,'ftm','fta'), false)}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Stats Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ width:700 }}>
            <div className="modal-header">
              <div className="modal-title">📊 Log Game Stats</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom:14 }}>
                <div className="form-group">
                  <label className="form-label">Player</label>
                  <select className="form-select" value={form.playerId} onChange={e => setF('playerId', e.target.value)}>
                    <option value="">Select player…</option>
                    {onRoster.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.team}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:9 }}>
                {[['pts','PTS'],['reb','REB'],['ast','AST'],['stl','STL'],['blk','BLK'],['tov','TOV'],
                  ['min','MIN'],['fgm','FGM'],['fga','FGA'],['p3m','3PM'],['p3a','3PA'],['ftm','FTM'],['fta','FTA']
                ].map(([k,lbl]) => (
                  <div key={k} className="form-group">
                    <label className="form-label">{lbl}</label>
                    <input className="form-input" type="number" placeholder="0" min="0"
                      value={form[k]} onChange={e => setF(k, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Stats</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
