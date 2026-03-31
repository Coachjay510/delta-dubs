import { useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'

export default function Attendance() {
  const { players, orgTeams, schedule, showToast } = useStore()
  const [teamF, setTeamF]       = useState('Drive')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [records, setRecords]   = useState({})
  const [history, setHistory]   = useState({}) // { [eventId_playerId]: status }

  // Events from schedule that include this team, sorted by date
  const teamEvents = useMemo(() => {
    return [...schedule]
      .filter(e => !teamF || (e.teams || '').includes(teamF))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [schedule, teamF])

  const activeEvent = teamEvents.find(e => String(e.id) === selectedEvent)

  const roster = useMemo(() =>
    players.filter(p => p.team === teamF && p.status === 'On Roster'),
    [players, teamF]
  )

  function mark(playerId, status) {
    setRecords(r => ({ ...r, [playerId]: status }))
  }

  function markAll(status) {
    const all = {}
    roster.forEach(p => { all[p.id] = status })
    setRecords(all)
  }

  function save() {
    if (!selectedEvent) { showToast('⚠️ Select an event first'); return }
    // Save to history keyed by eventId
    const key = `att_${selectedEvent}`
    const saved = { ...records, _team: teamF, _date: activeEvent?.date, _event: activeEvent?.title }
    setHistory(h => ({ ...h, [key]: saved }))
    showToast(`✅ Attendance saved — ${activeEvent?.title || 'event'}`)
  }

  const presentCount = Object.values(records).filter(v => v === 'present').length
  const absentCount  = Object.values(records).filter(v => v === 'absent').length
  const lateCount    = Object.values(records).filter(v => v === 'late').length
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

  const fmtDate = d => {
    if (!d) return ''
    const dt = new Date(d + 'T12:00:00')
    return dt.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  }

  // Recent sessions that have saved attendance
  const savedSessions = Object.entries(history)
    .filter(([k, v]) => v._team === teamF)
    .sort((a, b) => (b[1]._date || '').localeCompare(a[1]._date || ''))
    .slice(0, 8)

  return (
    <div style={{ padding: 24 }}>

      {/* Controls */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'flex-end' }}>
        {/* Team selector */}
        <div>
          <div className="form-label" style={{ marginBottom:5 }}>Team</div>
          <select className="filter-select" value={teamF}
            onChange={e => { setTeamF(e.target.value); setSelectedEvent(''); setRecords({}) }}>
            {orgTeams.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* Event picker — synced from schedule */}
        <div style={{ flex:1, minWidth:260 }}>
          <div className="form-label" style={{ marginBottom:5 }}>
            Session — from schedule ({teamEvents.length} events)
          </div>
          <select className="filter-select" style={{ width:'100%' }}
            value={selectedEvent}
            onChange={e => { setSelectedEvent(e.target.value); setRecords({}) }}>
            <option value="">Select a practice or game…</option>
            {teamEvents.map(e => (
              <option key={e.id} value={String(e.id)}>
                {fmtDate(e.date)} — {e.time} ({e.type})
              </option>
            ))}
          </select>
        </div>

        {/* Quick mark all */}
        {selectedEvent && roster.length > 0 && (
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn-ghost btn-sm" style={{ color:'var(--np-green)', borderColor:'rgba(92,184,0,.3)' }}
              onClick={() => markAll('present')}>✓ All Present</button>
            <button className="btn-ghost btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}
              onClick={() => markAll('absent')}>✕ All Absent</button>
          </div>
        )}

        <button className="btn btn-primary btn-sm" onClick={save} style={{ marginLeft:'auto' }}>
          💾 Save Attendance
        </button>
      </div>

      {/* No event selected state */}
      {!selectedEvent && (
        <div className="card" style={{ marginBottom:18 }}>
          <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
            Select a session above to start marking attendance.
            <br />Events are pulled directly from your practice schedule.
            {teamEvents.length === 0 && (
              <div style={{ marginTop:10, color:'var(--red)', fontSize:12 }}>
                No schedule events found for {teamF} — add them in the Schedule tab first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active event header */}
      {selectedEvent && activeEvent && (
        <div style={{
          background: 'var(--np-green-dim)',
          border: '1px solid var(--np-green-mid)',
          borderRadius: 'var(--radius)',
          padding: '12px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--np-green2)' }}>
              {activeEvent.title || `${activeEvent.type} — ${teamF}`}
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
              {fmtDate(activeEvent.date)} · {activeEvent.time}
            </div>
          </div>
          {/* Summary pills */}
          <div style={{ display:'flex', gap:10, marginLeft:'auto', flexWrap:'wrap' }}>
            {[
              ['Present', presentCount, 'var(--np-green)'],
              ['Late',    lateCount,    'var(--yellow)'],
              ['Absent',  absentCount,  'var(--red)'],
              ['Unmarked',unmarked,     'var(--text3)'],
            ].map(([lbl, count, color]) => (
              <div key={lbl} style={{
                padding: '6px 14px',
                background: 'var(--bg2)',
                border: `1px solid ${color}35`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:20, color, lineHeight:1 }}>{count}</span>
                <span style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
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
                    <button style={statusStyle(p.id,'present')} onClick={() => mark(p.id,'present')}>✓</button>
                    <button style={statusStyle(p.id,'late')}    onClick={() => mark(p.id,'late')}>⏱</button>
                    <button style={statusStyle(p.id,'absent')}  onClick={() => mark(p.id,'absent')}>✕</button>
                  </div>
                  {records[p.id] && (
                    <span style={{
                      fontSize:10, fontWeight:700,
                      color: records[p.id]==='present' ? 'var(--np-green)' : records[p.id]==='late' ? 'var(--yellow)' : 'var(--red)',
                      minWidth:44, textAlign:'right', textTransform:'uppercase', letterSpacing:.5,
                    }}>{records[p.id]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent sessions */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Sessions</span>
            </div>
            <div style={{ padding:'0 18px', maxHeight:500, overflowY:'auto' }}>
              {savedSessions.length === 0 ? (
                <div style={{ color:'var(--text3)', fontSize:13, padding:'16px 0' }}>
                  No saved sessions yet — mark attendance and hit Save
                </div>
              ) : savedSessions.map(([key, data]) => {
                const present = Object.values(data).filter(v => v === 'present').length
                const absent  = Object.values(data).filter(v => v === 'absent').length
                const late    = Object.values(data).filter(v => v === 'late').length
                return (
                  <div key={key} style={{
                    padding:'10px 0', borderBottom:'1px solid var(--border2)',
                    cursor:'pointer',
                  }}
                    onClick={() => {
                      setSelectedEvent(key.replace('att_',''))
                      const { _team, _date, _event, ...playerRecs } = data
                      setRecords(playerRecs)
                    }}
                  >
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>
                      {fmtDate(data._date)}
                    </div>
                    <div style={{ display:'flex', gap:12, fontSize:11 }}>
                      <span style={{ color:'var(--np-green)' }}>✓ {present} present</span>
                      {late > 0 && <span style={{ color:'var(--yellow)' }}>⏱ {late} late</span>}
                      <span style={{ color:'var(--red)' }}>✕ {absent} absent</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
