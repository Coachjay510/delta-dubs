import { useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'

const BLANK_EVENT = { title:'', type:'Practice', teams:'', date:'', time:'', location:'', notes:'' }

export default function Schedule() {
  const { schedule, orgTeams, addEvent, updateEvent, deleteEvent } = useStore()
  const [typeF, setTypeF]   = useState('')
  const [teamF, setTeamF]   = useState('')
  const [monthF, setMonthF] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]     = useState(BLANK_EVENT)
  const [editId, setEditId] = useState(null)

  const filtered = useMemo(() => {
    return [...schedule]
      .filter(e =>
        (!typeF  || e.type  === typeF) &&
        (!teamF  || (e.teams || '').includes(teamF)) &&
        (!monthF || (e.date || '').startsWith(monthF))
      )
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [schedule, typeF, teamF, monthF])

  const months = [
    ['2026-03','March 2026'],['2026-04','April 2026'],['2026-05','May 2026'],
    ['2026-06','June 2026'],['2026-07','July 2026'],['2026-08','August 2026'],
    ['2026-09','September 2026'],['2026-10','October 2026'],
  ]

  function openAdd() { setForm(BLANK_EVENT); setEditId(null); setShowModal(true) }
  function openEdit(e) { setForm({ ...e }); setEditId(e.id); setShowModal(true) }
  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function save() {
    if (editId) updateEvent(editId, form)
    else addEvent(form)
    setShowModal(false)
  }

  const fmtDate = (d) => {
    if (!d) return ['', '']
    const dt = new Date(d + 'T12:00:00')
    return [dt.toLocaleDateString('en-US', { month: 'short' }), dt.getDate()]
  }

  const typeColor = { Game: 'orange', Tournament: 'purple', Practice: 'blue' }

  return (
    <div style={{ padding: 24 }}>
      <div className="filter-bar">
        <select className="filter-select" value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All Types</option>
          <option>Practice</option><option>Game</option><option>Tournament</option>
        </select>
        <select className="filter-select" value={teamF} onChange={e => setTeamF(e.target.value)}>
          <option value="">All Teams</option>
          {orgTeams.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select className="filter-select" value={monthF} onChange={e => setMonthF(e.target.value)}>
          <option value="">All Months</option>
          {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={openAdd}>+ Add Event</button>
      </div>

      <div className="card">
        <div style={{ padding: '12px 18px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ color:'var(--text3)', fontSize:13, padding: '20px 0', textAlign:'center' }}>
              {schedule.length === 0 ? 'No events yet — add your first event above' : 'No events match your filters'}
            </div>
          ) : filtered.map(ev => {
            const [mon, day] = fmtDate(ev.date)
            const tc = typeColor[ev.type] || 'blue'
            return (
              <div key={ev.id} style={{
                display:'flex', alignItems:'center', gap:14, padding:'12px 0',
                borderBottom:'1px solid var(--border2)', transition:'background .1s',
              }}>
                <div style={{ minWidth:50, textAlign:'center', background:'var(--bg4)', borderRadius:8, padding:'5px 8px', flexShrink:0 }}>
                  <div style={{ fontSize:9, textTransform:'uppercase', color:'var(--text3)', letterSpacing:1 }}>{mon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:24, color:'var(--orange)', lineHeight:1 }}>{day || '—'}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{ev.title}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                    {[ev.time, ev.location, ev.teams].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span className={`badge badge-${tc}`}>{ev.type}</span>
                <div style={{ display:'flex', gap:5 }}>
                  <button className="btn-ghost btn-sm" onClick={() => openEdit(ev)}>Edit</button>
                  <button className="btn-ghost btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}
                    onClick={() => deleteEvent(ev.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editId ? '✏️ Edit Event' : '📅 Add Event'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Title</label>
                  <input className="form-input" placeholder="Event name" value={form.title} onChange={e => setF('title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setF('type', e.target.value)}>
                    <option>Practice</option><option>Game</option><option>Tournament</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Teams</label>
                  <input className="form-input" placeholder="Drive, Energy…" value={form.teams} onChange={e => setF('teams', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" placeholder="3:30pm – 5:00pm" value={form.time} onChange={e => setF('time', e.target.value)} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="Gym name / address" value={form.location} onChange={e => setF('location', e.target.value)} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setF('notes', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Save Changes' : 'Add Event'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
