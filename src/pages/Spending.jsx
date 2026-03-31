import { useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'

const CATEGORIES = ['Gym Rental','Game / Tournament Entry','Jerseys & Bags','Equipment','Travel','Referee Fees','AAU Registration','Marketing / Website','Coaching Stipend','Other']
const BLANK = { desc:'', amount:'', date:'', category:'Gym Rental', team:'All', status:'paid', notes:'' }

export default function Spending() {
  const { spending, orgTeams, addSpend, deleteSpend } = useStore()
  const [catF, setCatF]     = useState('')
  const [teamF, setTeamF]   = useState('')
  const [statusF, setStatusF] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]     = useState(BLANK)

  const filtered = useMemo(() =>
    [...spending]
      .filter(s =>
        (!catF    || s.category === catF) &&
        (!teamF   || s.team === teamF || s.team === 'All') &&
        (!statusF || s.status === statusF)
      )
      .sort((a,b) => (b.date||'').localeCompare(a.date||'')),
    [spending, catF, teamF, statusF]
  )

  const totalPaid      = spending.filter(s=>s.status==='paid').reduce((s,x)=>s+Number(x.amount||0),0)
  const totalProjected = spending.reduce((s,x)=>s+Number(x.amount||0),0)

  function setF(k,v) { setForm(f=>({...f,[k]:v})) }
  function save() {
    addSpend(form)
    setShowModal(false)
    setForm(BLANK)
  }

  const fmtMoney = n => '$' + Number(n||0).toLocaleString()
  const fmtDate  = d => d ? new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'

  return (
    <div style={{ padding: 24 }}>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        <div className="stat-card sc-red">
          <div className="stat-label">Total Spent (Paid)</div>
          <div className="stat-value">{fmtMoney(totalPaid)}</div>
          <div className="stat-sub">Confirmed expenses</div>
        </div>
        <div className="stat-card sc-orange">
          <div className="stat-label">Total Projected</div>
          <div className="stat-value">{fmtMoney(totalProjected)}</div>
          <div className="stat-sub">Including projected</div>
        </div>
        <div className="stat-card sc-blue">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value">{spending.length}</div>
          <div className="stat-sub">Logged expenses</div>
        </div>
        <div className="stat-card sc-purple">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{new Set(spending.map(s=>s.category)).size || 0}</div>
          <div className="stat-sub">Unique categories</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="filter-select" value={catF} onChange={e=>setCatF(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={teamF} onChange={e=>setTeamF(e.target.value)}>
          <option value="">All Teams</option>
          {orgTeams.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select className="filter-select" value={statusF} onChange={e=>setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="projected">Projected</option>
        </select>
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={()=>setShowModal(true)}>
          + Log Expense
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th><th>Category</th><th>Team</th>
                <th>Date</th><th>Amount</th><th>Status</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  {spending.length === 0 ? 'No expenses logged yet' : 'No expenses match filters'}
                </td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight:600, fontSize:13 }}>{s.desc}</td>
                  <td><span className="badge badge-gray">{s.category}</span></td>
                  <td style={{ fontSize:12, color:'var(--text3)' }}>{s.team}</td>
                  <td className="td-muted">{fmtDate(s.date)}</td>
                  <td className="td-mono" style={{ color:'var(--red)', fontWeight:700 }}>{fmtMoney(s.amount)}</td>
                  <td>
                    {s.status === 'paid'
                      ? <span className="badge badge-green">✓ Paid</span>
                      : <span className="badge badge-yellow">Projected</span>}
                  </td>
                  <td style={{ fontSize:12, color:'var(--text3)' }}>{s.notes||'—'}</td>
                  <td>
                    <button className="btn-ghost btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}
                      onClick={() => deleteSpend(s.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border2)', display:'flex', justifyContent:'flex-end', gap:24 }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Filtered total:</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--red)', fontWeight:700 }}>
              {fmtMoney(filtered.reduce((s,x)=>s+Number(x.amount||0),0))}
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">🧾 Log Expense</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="e.g. Gym rental — March 25"
                    value={form.desc} onChange={e=>setF('desc',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input className="form-input" type="number" placeholder="0.00" step="0.01"
                    value={form.amount} onChange={e=>setF('amount',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={e=>setF('date',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e=>setF('category',e.target.value)}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Team</label>
                  <select className="form-select" value={form.team} onChange={e=>setF('team',e.target.value)}>
                    <option value="All">All Teams</option>
                    {orgTeams.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e=>setF('status',e.target.value)}>
                    <option value="paid">✓ Paid</option>
                    <option value="projected">Projected</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Receipt / Notes</label>
                  <input className="form-input" placeholder="Receipt #, vendor, notes…"
                    value={form.notes} onChange={e=>setF('notes',e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Log Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
