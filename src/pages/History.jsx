import { useState } from 'react'
import { useStore } from '../hooks/useStore'

export default function History() {
  const { players, seasonHistory, archiveSeason, spending, projectedIncome, showToast } = useStore()
  const [showArchive, setShowArchive] = useState(false)
  const [showWizard, setShowWizard]   = useState(false)
  const [archForm, setArchForm]       = useState({ label:'', year: new Date().getFullYear(), notes:'' })
  const [wizStep, setWizStep]         = useState(1)

  function doArchive() {
    archiveSeason(archForm.label, archForm.year, archForm.notes)
    setShowArchive(false)
    setArchForm({ label:'', year: new Date().getFullYear(), notes:'' })
  }

  const fmtMoney = n => '$' + Number(n||0).toLocaleString()
  const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : ''

  return (
    <div style={{ padding: 24 }}>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <button className="btn btn-secondary" onClick={()=>setShowArchive(true)}>
          📥 Archive Current Season
        </button>
        <button className="btn btn-secondary" style={{ borderColor:'var(--red)', color:'var(--red)' }}
          onClick={()=>setShowWizard(true)}>
          🔄 New Season Wizard
        </button>
      </div>

      {/* History list */}
      {seasonHistory.length === 0 ? (
        <div className="card">
          <div style={{ padding:40, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
            No archived seasons yet — use "Archive Current Season" to save a snapshot
          </div>
        </div>
      ) : seasonHistory.map(s => (
        <div key={s.id} className="card" style={{ marginBottom:14 }}>
          <div className="card-header">
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20 }}>{s.label}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Archived {fmtDate(s.date)}</div>
            </div>
            <span className="badge badge-gray">{s.year}</span>
          </div>
          <div className="card-body">
            <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom: s.notes ? 14 : 0 }}>
              {[
                ['Players', s.playerCount, 'var(--np-green2)'],
                ['Collected', fmtMoney(s.collected), 'var(--orange)'],
                ['Expenses', fmtMoney(s.spent), 'var(--red)'],
                ['Projected Income', fmtMoney(s.income), 'var(--blue)'],
                ['Net', fmtMoney((s.income||0)-(s.spent||0)), (s.income||0)>=(s.spent||0)?'var(--np-green2)':'var(--red)'],
              ].map(([lbl,val,color])=>(
                <div key={lbl}>
                  <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1.5, color:'var(--text3)', fontWeight:700, marginBottom:3 }}>{lbl}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:22, color, lineHeight:1 }}>{val}</div>
                </div>
              ))}
            </div>
            {s.notes && (
              <div style={{ fontSize:13, color:'var(--text2)', background:'var(--bg3)', padding:'10px 14px', borderRadius:'var(--radius-sm)' }}>
                {s.notes}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Archive Modal */}
      {showArchive && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowArchive(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">📥 Archive Current Season</div>
              <button className="modal-close" onClick={()=>setShowArchive(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16, lineHeight:1.6 }}>
                Save a snapshot of this season's financials, roster, and spending to Season History. This does <strong>not</strong> reset anything.
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Season Label</label>
                  <input className="form-input" placeholder="e.g. 2025-26 Season"
                    value={archForm.label} onChange={e=>setArchForm(f=>({...f,label:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Season Year</label>
                  <input className="form-input" type="number" placeholder="2026"
                    value={archForm.year} onChange={e=>setArchForm(f=>({...f,year:e.target.value}))} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Notes / Summary</label>
                  <textarea className="form-textarea" placeholder="Any highlights or notes about this season…"
                    value={archForm.notes} onChange={e=>setArchForm(f=>({...f,notes:e.target.value}))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowArchive(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={doArchive}>📥 Save to History</button>
            </div>
          </div>
        </div>
      )}

      {/* New Season Wizard */}
      {showWizard && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowWizard(false)}>
          <div className="modal" style={{ width:680 }}>
            <div className="modal-header" style={{ background:'rgba(239,68,68,.06)', borderBottomColor:'rgba(239,68,68,.2)' }}>
              <div className="modal-title" style={{ color:'var(--red)' }}>🔄 New Season Wizard</div>
              <button className="modal-close" onClick={()=>setShowWizard(false)}>✕</button>
            </div>
            <div className="modal-body">

              {/* Step tabs */}
              <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid var(--border2)', marginBottom:20 }}>
                {[['1','Set Year'],['2','Select Players'],['3','Confirm']].map(([n,lbl])=>(
                  <div key={n} onClick={()=>setWizStep(Number(n))} style={{
                    flex:1, padding:'9px', textAlign:'center', fontSize:12, fontWeight:600,
                    background: wizStep===Number(n) ? 'var(--orange)' : 'var(--bg3)',
                    color: wizStep===Number(n) ? '#fff' : 'var(--text3)',
                    cursor:'pointer', transition:'all .15s',
                  }}>{n} · {lbl}</div>
                ))}
              </div>

              {wizStep === 1 && (
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, marginBottom:8 }}>What season are you starting?</div>
                  <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16 }}>
                    This labels all your new financial data and schedule going forward.
                  </div>
                  <div className="form-grid" style={{ marginBottom:16 }}>
                    <div className="form-group">
                      <label className="form-label">New Season Year</label>
                      <input className="form-input" type="number" placeholder="e.g. 2027" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Season Label</label>
                      <input className="form-input" placeholder="e.g. 2026-27 Season" />
                    </div>
                  </div>
                  <div style={{ padding:'12px 14px', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, fontSize:12.5, color:'var(--text2)', marginBottom:16 }}>
                    ⚠️ <strong>The following will be cleared:</strong> All payments & balances, all spending & transactions, all finance history, all schedule events, attendance records.
                    <br /><strong>Player profiles and stats are preserved for selected players.</strong>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <button className="btn btn-primary" onClick={()=>setWizStep(2)}>Next: Select Players →</button>
                  </div>
                </div>
              )}

              {wizStep === 2 && (
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, marginBottom:8 }}>Which players are returning?</div>
                  <div style={{ fontSize:13, color:'var(--text3)', marginBottom:14 }}>
                    Selected players carry over. Unselected are removed.
                  </div>
                  <div style={{ maxHeight:320, overflowY:'auto', border:'1px solid var(--border2)', borderRadius:8, marginBottom:16 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ background:'var(--bg3)' }}>
                          <th style={{ padding:'8px 12px', textAlign:'left', fontSize:9, textTransform:'uppercase', color:'var(--text3)', fontWeight:700 }}>Include</th>
                          <th style={{ padding:'8px 12px', textAlign:'left', fontSize:9, textTransform:'uppercase', color:'var(--text3)', fontWeight:700 }}>Player</th>
                          <th style={{ padding:'8px 12px', textAlign:'left', fontSize:9, textTransform:'uppercase', color:'var(--text3)', fontWeight:700 }}>Team</th>
                          <th style={{ padding:'8px 12px', textAlign:'left', fontSize:9, textTransform:'uppercase', color:'var(--text3)', fontWeight:700 }}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.filter(p=>p.status==='On Roster').map(p=>(
                          <tr key={p.id} style={{ borderBottom:'1px solid var(--border2)' }}>
                            <td style={{ padding:'8px 12px' }}><input type="checkbox" defaultChecked /></td>
                            <td style={{ padding:'8px 12px', fontWeight:600 }}>{p.name}</td>
                            <td style={{ padding:'8px 12px', fontSize:12, color:'var(--text3)' }}>{p.team}</td>
                            <td style={{ padding:'8px 12px' }}>
                              <select className="filter-select" style={{ padding:'3px 6px', fontSize:11 }}>
                                <option>Returning</option><option>New</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>setWizStep(1)}>← Back</button>
                    <button className="btn btn-primary" onClick={()=>setWizStep(3)}>Next: Confirm →</button>
                  </div>
                </div>
              )}

              {wizStep === 3 && (
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, marginBottom:8, color:'var(--red)' }}>Confirm & Start New Season</div>
                  <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16, lineHeight:1.7 }}>
                    This action will archive the current season and reset all financial data, payments, spending, schedule, and attendance. Player profiles for selected returning players will be preserved.
                  </div>
                  <div style={{ padding:'14px', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, marginBottom:16, fontSize:13, color:'var(--red)' }}>
                    ⚠️ This cannot be undone. Make sure you have archived the current season first.
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>setWizStep(2)}>← Back</button>
                    <button className="btn btn-danger" onClick={()=>{ showToast('🔄 New season started!'); setShowWizard(false); setWizStep(1) }}>
                      🔄 Start New Season
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
