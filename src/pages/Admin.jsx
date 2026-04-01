import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const BLANK = { fname:'', lname:'', email:'', role:'Coach', team:'All Teams', phone:'' }
const ROLES  = ['Head Admin','Coach','Team Manager','Volunteer']

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'

async function callEmail(endpoint, body) {
  try {
    const res = await fetch(`${API}/api/email/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch { return false }
}

export default function Admin() {
  const { admins, addAdmin, removeAdmin, showToast, orgTeams } = useStore()
  const { orgData, orgId } = useAuth()
  const TEAMS_OPT = ['All Teams', ...orgTeams.map(t => t.id || t.label || t.name).filter(Boolean)]
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState(BLANK)
  const [sendingReset, setSendingReset] = useState(null)
  const [sendEmail, setSendEmail]   = useState(true)
  const [editingSettings, setEditingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    name: '', city: '', state: '', type: '', website: '', ein: '', season: '2025-26',
  })
  const [savingSettings, setSavingSettings] = useState(false)

  function setF(k,v) { setForm(f=>({...f,[k]:v})) }

  async function save() {
    if (!form.fname || !form.email) return
    addAdmin({ ...form, name: `${form.fname} ${form.lname}`.trim() })
    setShowModal(false)

    // Send admin created email
    if (sendEmail) {
      const ok = await callEmail('admin-created', {
        adminName:  `${form.fname} ${form.lname}`.trim(),
        adminEmail: form.email,
        role:       form.role,
        teamAccess: form.team,
        orgName:    orgData?.name || 'Your Org',
      })
      showToast(ok ? '✅ Admin added & email sent!' : '✅ Admin added (email failed — check backend)')
    } else {
      showToast('✅ Admin added!')
    }
    setForm(BLANK)
  }

  async function sendPasswordReset(email) {
    setSendingReset(email)
    const ok = await callEmail('password-reset', { email, orgName: orgData?.name || 'Your Org' })
    setSendingReset(null)
    showToast(ok ? `📧 Password reset sent to ${email}` : '❌ Failed to send reset — check backend')
  }

  const roleColor = { 'Head Admin':'green', 'Coach':'blue', 'Team Manager':'orange', 'Volunteer':'gray' }

  return (
    <div style={{ padding: 24 }}>

      {/* Info banner */}
      <div style={{
        background: 'var(--np-green-dim)', border: '1px solid var(--np-green-mid)',
        borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize:18 }}>🔐</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--np-green2)' }}>
            Admin Portal — {orgData?.name || 'My Org'}
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>
            Manage who has access to this platform.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={()=>setShowModal(true)}>
          + Add Admin
        </button>
      </div>

      {/* Admin list */}
      <div className="card" style={{ marginBottom: 18 }}>
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
            <span className="badge badge-gray">{a.team || a.team_access}</span>
            {a.phone && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>{a.phone}</span>}
            {a.email && (
              <button
                className="btn-ghost btn-sm"
                style={{ color:'var(--blue)', borderColor:'rgba(59,130,246,.3)', fontSize:11 }}
                disabled={sendingReset === a.email}
                onClick={() => sendPasswordReset(a.email)}
              >
                {sendingReset === a.email ? '…' : '🔑 Reset'}
              </button>
            )}
            <button className="btn-ghost btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}
              onClick={()=>removeAdmin(a.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Org Settings */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Organization Settings</span>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            setSettingsForm({
              name:    orgData?.name    || '',
              city:    orgData?.city    || '',
              state:   orgData?.state   || '',
              type:    orgData?.type    || 'AAU',
              website: orgData?.website || '',
              ein:     orgData?.ein     || '',
              season:  orgData?.season  || '2025-26',
            })
            setEditingSettings(true)
          }}>✏️ Edit</button>
        </div>
        <div className="card-body">
          {!editingSettings ? (
            <div className="grid-2" style={{ gap:16 }}>
              {[
                ['Organization', orgData?.name || '—'],
                ['Type',         orgData?.type || 'AAU'],
                ['City / State', [orgData?.city, orgData?.state].filter(Boolean).join(', ') || '—'],
                ['EIN',          orgData?.ein || '—'],
                ['Website',      orgData?.website || '—'],
                ['Season',       orgData?.season || '2025-26'],
                ['Platform',     'Next Play Sports Media & Management'],
              ].map(([lbl,val]) => (
                <div key={lbl}>
                  <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:3 }}>{lbl}</div>
                  <div style={{ fontSize:13, color:'var(--text2)' }}>{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="grid-2" style={{ gap:12, marginBottom:16 }}>
                {[
                  ['name',    'Org Name',    'text', 'Delta Dubs AAU'],
                  ['city',    'City',        'text', 'Antioch'],
                  ['state',   'State',       'text', 'CA'],
                  ['ein',     'EIN',         'text', '92-XXXXXXX'],
                  ['website', 'Website',     'text', 'yourorg.com'],
                  ['season',  'Season',      'text', '2025-26'],
                ].map(([key, label, type, placeholder]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="form-input" type={type} placeholder={placeholder}
                      value={settingsForm[key] || ''}
                      onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary" disabled={savingSettings} onClick={async () => {
                  setSavingSettings(true)
                  await supabase.from('orgs').update({
                    name:    settingsForm.name,
                    city:    settingsForm.city,
                    state:   settingsForm.state,
                    ein:     settingsForm.ein,
                    website: settingsForm.website,
                    season:  settingsForm.season,
                  }).eq('id', orgId)
                  setSavingSettings(false)
                  setEditingSettings(false)
                  showToast('✅ Org settings saved!')
                }}>
                  {savingSettings ? 'Saving…' : '💾 Save Settings'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingSettings(false)}>Cancel</button>
              </div>
            </div>
          )}
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
                  <label className="form-label">Email (must match their Google account)</label>
                  <input className="form-input" type="email" placeholder="coach@gmail.com" value={form.email} onChange={e=>setF('email',e.target.value)} />
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
                <div className="form-group full">
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
                    <input type="checkbox" checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)} />
                    Send welcome email to this admin
                  </label>
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
