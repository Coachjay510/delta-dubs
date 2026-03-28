import { useState, useMemo } from 'react'
import { useStore, TEAMS } from '../hooks/useStore'

const AV = { Drive:'av-drive', Energy:'av-energy', Passion:'av-passion', Power:'av-power' }

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Payments() {
  const { players, projectedIncome, paidCount, logPayment } = useStore()
  const [search, setSearch]   = useState('')
  const [teamF, setTeamF]     = useState('')
  const [statusF, setStatusF] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [payForm, setPayForm]   = useState({ playerId:'', amount:'', method:'Cash', notes:'' })

  const onRoster = players.filter(p => p.status === 'On Roster')
  const collected = onRoster.reduce((s, p) => {
    const fee = p.isNew ? 385 : 320
    return s + (fee - (p.balance || 0))
  }, 0)
  const outstanding = onRoster.filter(p => (p.balance || 0) > 0).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return onRoster.filter(p => {
      const matchQ = (p.name || '').toLowerCase().includes(q) || (p.parent || '').toLowerCase().includes(q)
      const matchT = !teamF || p.team === teamF
      const matchS = !statusF ||
        (statusF === 'paid'    && (p.balance || 0) === 0) ||
        (statusF === 'partial' && p.deposit && (p.balance || 0) > 0) ||
        (statusF === 'none'    && !p.deposit)
      return matchQ && matchT && matchS
    }).sort((a, b) => (b.balance || 0) - (a.balance || 0))
  }, [players, search, teamF, statusF])

  function payBadge(p) {
    if ((p.balance || 0) === 0) return <span className="badge badge-green">✓ Paid</span>
    if (p.deposit) return <span className="badge badge-yellow">${p.balance} left</span>
    return <span className="badge badge-red">No deposit</span>
  }

  function submitPayment() {
    const id = parseInt(payForm.playerId)
    const amt = parseFloat(payForm.amount)
    if (!id || !amt || amt <= 0) return
    logPayment(id, amt, payForm.method, payForm.notes)
    setShowModal(false)
    setPayForm({ playerId:'', amount:'', method:'Cash', notes:'' })
  }

  const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString()

  return (
    <div style={{ padding: 24 }}>

      {/* KPI */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card sc-green">
          <div className="stat-label">Deposits Collected</div>
          <div className="stat-value">{fmtMoney(collected)}</div>
          <div className="stat-sub">Actual received</div>
        </div>
        <div className="stat-card sc-orange">
          <div className="stat-label">Projected Total Income</div>
          <div className="stat-value">{fmtMoney(projectedIncome)}</div>
          <div className="stat-sub">If all fees paid in full</div>
        </div>
        <div className="stat-card sc-blue">
          <div className="stat-label">Outstanding Balances</div>
          <div className="stat-value">{outstanding}</div>
          <div className="stat-sub">Players with balance &gt; $0</div>
        </div>
        <div className="stat-card sc-purple">
          <div className="stat-label">Fully Paid</div>
          <div className="stat-value">{paidCount}</div>
          <div className="stat-sub">$0 balance remaining</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input className="search-input" placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={teamF} onChange={e => setTeamF(e.target.value)}>
          <option value="">All Teams</option>
          {TEAMS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Has Balance</option>
          <option value="none">No Deposit</option>
        </select>
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={() => setShowModal(true)}>
          + Log Payment
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th><th>Team</th><th>Status</th>
                <th>Fee</th><th>Balance</th><th>Payment Type</th>
                <th>Parent</th><th>Email</th><th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  No players match filters
                </td></tr>
              )}
              {filtered.map(p => {
                const fee = p.isNew ? 385 : 320
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className={`avatar ${AV[p.team] || 'av-drive'}`}>{initials(p.name)}</div>
                        <span style={{ fontWeight:600, fontSize:13 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:11, fontWeight:700, color: TEAMS.find(t=>t.id===p.team)?.color || 'var(--text2)' }}>
                      {p.team}
                    </td>
                    <td>{payBadge(p)}</td>
                    <td className="td-mono">${fee}</td>
                    <td className="td-mono" style={{ color: (p.balance||0) > 0 ? 'var(--red)' : 'var(--np-green2)' }}>
                      ${p.balance || 0}
                    </td>
                    <td><span className="badge badge-gray">{p.isNew ? 'New' : 'Returning'}</span></td>
                    <td style={{ fontSize:12 }}>{p.parent || '—'}</td>
                    <td style={{ fontSize:11, color:'var(--text3)' }}>{p.email || '—'}</td>
                    <td className="td-mono" style={{ fontSize:11 }}>{p.phone || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Payment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">💰 Log Payment</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Player</label>
                  <select className="form-select" value={payForm.playerId} onChange={e => setPayForm(f => ({ ...f, playerId: e.target.value }))}>
                    <option value="">Select player…</option>
                    {onRoster.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.team} (${p.balance || 0} left)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input className="form-input" type="number" placeholder="0" value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select className="form-select" value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                    <option>Cash</option><option>Venmo</option><option>Zelle</option><option>Check</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" placeholder="Receipt #, notes…" value={payForm.notes}
                    onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitPayment}>Log Payment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
