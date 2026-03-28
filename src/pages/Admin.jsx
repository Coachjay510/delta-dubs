import { useState } from 'react'
import { useStore } from '../hooks/useStore'

const BLANK = { fname:'', lname:'', email:'', role:'Coach', team:'All Teams', phone:'' }
const ROLES  = ['Head Admin','Coach','Team Manager','Volunteer']
const TEAMS_OPT = ['All Teams','Drive','Energy','Passion','Power']

export default function Admin() {
  const { admins, addAdmin, removeAdmin } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(BLANK)

  function setF(k,v) { setForm(f=>({...f,[k]:v})) }
  function save() {
    if (!form.fname || !form.email) return
    addAdmin({ ...form, name: `${form.fname} ${form.lname}`.trim() })
    setShowModal(false)
    setForm(BLANK)
  }

  const roleColor = { 'Head Admin':'green', 'Coach':'blue', 'Team Manager':'orange', 'Volunteer':'gray' }

  return (
    <div style={{ padding: 24 }}>

      {/* Info banner */}
      <div style={{
        background: 'var(--np-green-dim)',
        border: '1px solid var(--np-green-mid)',
        borderRadius: 'var(--radius)',
        padding: '14px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize:18 }}>🔐</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--np-green2)' }}>Admin Portal — Delta Dubs</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>
            Manage who has access to this platform. EIN: 92-3031048
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={()=>setShowModal(true)}>
          + Add Admin
        </button>
      </div>

      {/* Admin list */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Admins & Staff — {admins.length}</span>
        </div>
        {admins.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
            No admins added yet — add your coaching staff above
          </div>
        ) : admins.map(a => (
          <div key={a.id} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 18px', borderBottom:'1px solid var(--border2)',
          }}>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background:'linear-gradient(135deg,var(--np-green),var(--orange))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontWeight:900, fontSize:13, color:'#fff',
              flexShrink:0,
            }}>
              {(a.fname||'?')[0]}{(a.lname||'')[0]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{a.name || `${a.fname} ${a.lname}`}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{a.email}</div>
            </div>
            <span className={`badge badge-${roleColor[a.role]||'gray'}`}>{a.role}</span>
            <span className="badge badge-gray">{a.team}</span>
            {a.phone && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>{a.phone}</span>}
            <button className="btn-ghost btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}
              onClick={()=>removeAdmin(a.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Settings section */}
      <div className="card" style={{ marginTop:18 }}>
        <div className="card-header"><span className="card-title">Organization Settings</span></div>
        <div className="card-body">
          <div className="grid-2" style={{ gap:16 }}>
            {[
              ['Organization','Delta Dubs AAU Basketball'],
              ['EIN','92-3031048'],
              ['Platform','Next Play Sports Media & Management'],
              ['Website','deltadubs.com'],
              ['Season','2025–26'],
              ['Supabase Project','mwefsjrdukmcpijcurqo'],
            ].map(([lbl,val])=>(
              <div key={lbl}>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:3 }}>{lbl}</div>
                <div style={{ fontSize:13, fontFamily: lbl==='EIN'||lbl==='Supabase Project' ? 'var(--font-mono)' : 'inherit', color:'var(--text2)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">🔐 Add Admin</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" placeholder="First" value={form.fname} onChange={e=>setF('fname',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" placeholder="Last" value={form.lname} onChange={e=>setF('lname',e.target.value)} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="admin@email.com" value={form.email} onChange={e=>setF('email',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e=>setF('role',e.target.value)}>
                    {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Team Access</label>
                  <select className="form-select" value={form.team} onChange={e=>setF('team',e.target.value)}>
                    {TEAMS_OPT.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" placeholder="(925) 555-0100" value={form.phone} onChange={e=>setF('phone',e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Add Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
