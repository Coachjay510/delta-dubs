import { useState } from 'react'
import { useStore } from '../hooks/useStore'

export default function Finance() {
  const { players, finance, setFinance, projectedIncome, projectedNet, spending } = useStore()
  const [bankInput, setBankInput]   = useState('')
  const [collInput, setCollInput]   = useState('')

  const onRoster = players.filter(p => p.status === 'On Roster')
  const collected = onRoster.reduce((s, p) => s + ((p.isNew ? 385 : 320) - (p.balance || 0)), 0)
  const projExpenses = spending.filter(s => s.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0)
  const projectedSpend = spending.reduce((s, x) => s + Number(x.amount || 0), 0)

  const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString()
  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null

  function updateBank() {
    const v = parseFloat(bankInput)
    if (isNaN(v)) return
    setFinance({ ...finance, bankBalance: v, bankUpdated: new Date().toISOString() })
    setBankInput('')
  }
  function updateCollected() {
    const v = parseFloat(collInput)
    if (isNaN(v)) return
    setFinance({ ...finance, collected: v, collectedUpdated: new Date().toISOString() })
    setCollInput('')
  }

  // Income breakdown by team
  const byTeam = ['Drive','Energy','Passion','Power'].map(team => {
    const tPlayers = onRoster.filter(p => p.team === team)
    const tIncome  = tPlayers.reduce((s, p) => s + (p.isNew ? 385 : 320), 0)
    const tCollect = tPlayers.reduce((s, p) => s + ((p.isNew ? 385 : 320) - (p.balance || 0)), 0)
    return { team, count: tPlayers.length, income: tIncome, collected: tCollect }
  })

  const spendByCategory = spending.reduce((acc, s) => {
    const cat = s.category || 'Other'
    acc[cat] = (acc[cat] || 0) + Number(s.amount || 0)
    return acc
  }, {})

  return (
    <div style={{ padding: 24 }}>

      {/* Bank / Collected banner */}
      <div style={{
        background: 'linear-gradient(135deg,#0d1f0a,#162b10)',
        border: '1px solid rgba(92,184,0,.3)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 24,
      }}>
        {/* Bank balance */}
        <div>
          <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:2, color:'var(--np-green2)', fontWeight:700, marginBottom:4 }}>
            Current Bank Balance
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:48, color:'var(--np-green2)', lineHeight:1 }}>
            {fmtMoney(finance.bankBalance)}
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>
            {finance.bankUpdated ? `Updated ${fmtDate(finance.bankUpdated)}` : 'Not set — update below'}
          </div>
        </div>
        {/* Actual collected */}
        <div style={{ borderLeft:'1px solid rgba(92,184,0,.25)', paddingLeft:24 }}>
          <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:2, color:'var(--orange)', fontWeight:700, marginBottom:4 }}>
            Actual Collected
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:48, color:'var(--orange)', lineHeight:1 }}>
            {fmtMoney(finance.collected)}
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>
            {finance.collectedUpdated ? `Updated ${fmtDate(finance.collectedUpdated)}` : 'Not set — update below'}
          </div>
        </div>
        {/* Update inputs */}
        <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap', marginLeft:'auto' }}>
          <div>
            <label className="form-label" style={{ display:'block', marginBottom:4 }}>Update Bank Balance ($)</label>
            <div style={{ display:'flex', gap:7 }}>
              <input className="form-input" type="number" placeholder="0.00" step="0.01" style={{ width:140 }}
                value={bankInput} onChange={e => setBankInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={updateBank}>Update</button>
            </div>
          </div>
          <div>
            <label className="form-label" style={{ display:'block', marginBottom:4 }}>Update Collected ($)</label>
            <div style={{ display:'flex', gap:7 }}>
              <input className="form-input" type="number" placeholder="0.00" step="0.01" style={{ width:140 }}
                value={collInput} onChange={e => setCollInput(e.target.value)} />
              <button className="btn btn-secondary btn-sm" onClick={updateCollected}>Update</button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card sc-green">
          <div className="stat-icon">📥</div>
          <div className="stat-label">Projected Total Income</div>
          <div className="stat-value">{fmtMoney(projectedIncome)}</div>
          <div className="stat-sub">All fees if collected in full</div>
        </div>
        <div className="stat-card sc-orange">
          <div className="stat-icon">📤</div>
          <div className="stat-label">Projected Total Expenses</div>
          <div className="stat-value">{fmtMoney(projectedSpend)}</div>
          <div className="stat-sub">From spending tracker</div>
        </div>
        <div className="stat-card sc-blue">
          <div className="stat-icon">💵</div>
          <div className="stat-label">Fees Collected (calc)</div>
          <div className="stat-value">{fmtMoney(collected)}</div>
          <div className="stat-sub">From player balances</div>
        </div>
        <div className="stat-card sc-purple">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Projected Net</div>
          <div className="stat-value" style={{ color: projectedIncome - projectedSpend >= 0 ? 'var(--np-green2)' : 'var(--red)' }}>
            {fmtMoney(projectedIncome - projectedSpend)}
          </div>
          <div className="stat-sub">Income minus expenses</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Income by team */}
        <div className="card">
          <div className="card-header"><span className="card-title">💚 Income by Team</span></div>
          <div className="card-body" style={{ padding:0 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  {['Team','Players','Projected','Collected','Remaining'].map(h => (
                    <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:9, textTransform:'uppercase', letterSpacing:1.5, color:'var(--text3)', fontWeight:700, background:'var(--bg3)', borderBottom:'1px solid var(--border2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byTeam.map(t => (
                  <tr key={t.team} style={{ borderBottom:'1px solid var(--border2)' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600 }}>{t.team}</td>
                    <td style={{ padding:'10px 14px', color:'var(--text3)' }}>{t.count}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:12 }}>{fmtMoney(t.income)}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--np-green2)' }}>{fmtMoney(t.collected)}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--red)' }}>{fmtMoney(t.income - t.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spending by category */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🧾 Expenses by Category</span>
          </div>
          <div className="card-body" style={{ padding: '12px 18px' }}>
            {Object.keys(spendByCategory).length === 0 ? (
              <div style={{ color:'var(--text3)', fontSize:13, padding:'8px 0' }}>No expenses logged yet — use Spending Tracker</div>
            ) : Object.entries(spendByCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => {
              const pct = projectedSpend > 0 ? (amt / projectedSpend * 100).toFixed(0) : 0
              return (
                <div key={cat} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13 }}>{cat}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--orange)' }}>{fmtMoney(amt)}</span>
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-bar" style={{ width:`${pct}%`, background:'var(--orange)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
