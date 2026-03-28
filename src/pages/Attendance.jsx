import { useState, useMemo } from 'react'
import { useStore, TEAMS } from '../hooks/useStore'

export default function Attendance() {
  const { players, showToast } = useStore()
  const [teamF, setTeamF] = useState('Drive')
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [records, setRecords] = useState({}) // { [playerId]: 'present'|'absent'|'late' }

  const roster = useMemo(() =>
    players.filter(p => p.team === teamF && p.status === 'On Roster'),
    [players, teamF]
  )

  function mark(id, status) {
    setRecords(r => ({ ...r, [id]: status }))
  }

  function save() {
    showToast('✅ Attendance saved!')
  }

  const presentCount = Object.values(records).filter(v=>v==='present').length
  const absentCount  = Object.values(records).filter(v=>v==='absent').length
  const lateCount    = Object.values(records).filter(v=>v==='late').length
  const unmarked     = roster.filter(p => !records[p.id]).length

  const statusStyle = (id, type) => {
    const active = records[id] === type
    const colors = { present: 'var(--np-green)', absent: 'var(--red)', late: 'var(--yellow)' }
    return {
      padding: '5px 12px',
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${active ? colors[type] : 'var(--border2)'}`,
      background: active ? colors[type] + '22' : 'var(--bg3)',
      color: active ? colors[type] : 'var(--text3)',
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all .12s',
    }
  }

  return (
    <div style={{ padding: 24 }}>

      {/* Controls */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <select className="filter-select" value={teamF} onChange={e => { setTeamF(e.target.value); setRecords({}) }}>
          {TEAMS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input className="form-input" type="date" style={{ width:160 }}
          value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={save}>
          💾 Save Attendance
        </button>
      </div>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {[
          ['Present', presentCount, 'var(--np-green)'],
          ['Absent',  absentCount,  'var(--red)'],
          ['Late',    lateCount,    'var(--yellow)'],
          ['Unmarked',unmarked,     'var(--text3)'],
        ].map(([lbl, count, color]) => (
          <div key={lbl} style={{
            padding: '8px 18px',
            background: 'var(--bg2)',
            border: `1px solid ${color}40`,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:24, color, lineHeight:1 }}>{count}</span>
            <span style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>{lbl}</span>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap:18 }}>
        {/* Mark attendance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mark Attendance</span>
            <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
              {roster.length} players
            </span>
          </div>
          <div style={{ padding:'0 18px', maxHeight:500, overflowY:'auto' }}>
            {roster.length === 0 ? (
              <div style={{ color:'var(--text3)', fontSize:13, padding:'16px 0' }}>
                No players on roster for {teamF}
              </div>
            ) : roster.map(p => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 0', borderBottom:'1px solid var(--border2)',
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>#{p.num||'—'}</div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <button style={statusStyle(p.id,'present')} onClick={() => mark(p.id,'present')}>✓ Present</button>
                  <button style={statusStyle(p.id,'late')}    onClick={() => mark(p.id,'late')}>⏱ Late</button>
                  <button style={statusStyle(p.id,'absent')}  onClick={() => mark(p.id,'absent')}>✕ Absent</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Season attendance % (mock) */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Season Attendance %</span>
          </div>
          <div style={{ padding:'0 18px', maxHeight:500, overflowY:'auto' }}>
            {roster.length === 0 ? (
              <div style={{ color:'var(--text3)', fontSize:13, padding:'16px 0' }}>No roster data</div>
            ) : roster.map(p => {
              // Mock attendance pct until real session data is stored
              const pct = Math.floor(70 + Math.random() * 30)
              const color = pct >= 90 ? 'var(--np-green)' : pct >= 75 ? 'var(--yellow)' : 'var(--red)'
              return (
                <div key={p.id} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 0', borderBottom:'1px solid var(--border2)',
                }}>
                  <div style={{ flex:1, fontSize:13 }}>{p.name}</div>
                  <div style={{ width:100, height:5, background:'var(--bg4)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:3 }} />
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color, width:36, textAlign:'right' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
