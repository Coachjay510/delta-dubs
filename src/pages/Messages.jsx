import { useState } from 'react'
import { useStore, TEAMS } from '../hooks/useStore'

const BLANK = { to:'All Teams', subject:'', body:'' }

export default function Messages() {
  const { messages, sendMessage } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(BLANK)
  const [selected, setSelected]   = useState(null)

  function setF(k,v) { setForm(f=>({...f,[k]:v})) }
  function send() {
    if (!form.subject || !form.body) return
    sendMessage(form)
    setShowModal(false)
    setForm(BLANK)
  }

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : ''

  return (
    <div style={{ padding: 24 }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--np-green2)', letterSpacing:'3px', textTransform:'uppercase' }}>
          // {messages.length} messages
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          ✉️ Compose
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="card">
          <div style={{ padding:40, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
            No messages yet — compose your first message to the team
          </div>
        </div>
      ) : (
        <div className="grid-2" style={{ gap:18, alignItems:'flex-start' }}>
          {/* Thread list */}
          <div>
            {messages.map(m => (
              <div key={m.id}
                onClick={() => setSelected(m)}
                style={{
                  background: selected?.id===m.id ? 'var(--bg3)' : 'var(--bg2)',
                  border: `1px solid ${selected?.id===m.id ? 'var(--np-green-mid)' : 'var(--border2)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  marginBottom: 7,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { if(selected?.id!==m.id) e.currentTarget.style.borderColor='var(--border3)' }}
                onMouseLeave={e => { if(selected?.id!==m.id) e.currentTarget.style.borderColor='var(--border2)' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{m.subject}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{fmtDate(m.date)}</div>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>To: {m.to}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {m.body}
                </div>
              </div>
            ))}
          </div>

          {/* Message detail */}
          <div className="card" style={{ position:'sticky', top:70 }}>
            {!selected ? (
              <div style={{ padding:40, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                Select a message to read
              </div>
            ) : (
              <>
                <div className="card-header">
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:16 }}>{selected.subject}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                      To: {selected.to} · {fmtDate(selected.date)}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ fontSize:14, lineHeight:1.7, color:'var(--text2)', whiteSpace:'pre-wrap' }}>
                    {selected.body}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">✉️ Compose Message</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">To</label>
                  <select className="form-select" value={form.to} onChange={e=>setF('to',e.target.value)}>
                    <option>All Teams</option>
                    {TEAMS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Subject</label>
                  <input className="form-input" placeholder="Subject…" value={form.subject} onChange={e=>setF('subject',e.target.value)} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" style={{ minHeight:130 }} placeholder="Write your message…"
                    value={form.body} onChange={e=>setF('body',e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={send}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
