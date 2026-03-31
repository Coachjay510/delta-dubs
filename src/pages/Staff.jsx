import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'

const ROLES = ['Head Admin', 'Coach', 'Team Manager', 'Volunteer']
const TEAMS_OPT = ['Drive', 'Energy', 'Passion', 'Power']
const TEAM_COLORS = { Drive:'#3b82f6', Energy:'#ee6730', Passion:'#a855f7', Power:'#4ade80' }

function parseTeams(teamAccess) {
  if (!teamAccess || teamAccess === 'All Teams') return []
  return teamAccess.split(',').map(t => t.trim()).filter(Boolean)
}

function formatTeams(selected) {
  if (selected.length === 0 || selected.length === TEAMS_OPT.length) return 'All Teams'
  return selected.join(', ')
}

function TeamCheckboxes({ value, onChange }) {
  const selected = parseTeams(value)
  const allSelected = selected.length === 0 || selected.length === TEAMS_OPT.length

  function toggle(team) {
    const cur = allSelected ? [...TEAMS_OPT] : [...selected]
    const next = cur.includes(team) ? cur.filter(t => t !== team) : [...cur, team]
    onChange(formatTeams(next))
  }

  function toggleAll() {
    onChange(allSelected ? '' : 'All Teams')
  }

  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', marginBottom:6, fontSize:12 }}>
        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
        <span style={{ fontWeight:600, color:'var(--text2)' }}>All Teams</span>
      </label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {TEAMS_OPT.map(team => {
          const checked = allSelected || selected.includes(team)
          const tc = TEAM_COLORS[team]
          return (
            <label key={team} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer',
              padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600,
              background: checked ? tc+'18' : 'var(--bg3)',
              border: `1px solid ${checked ? tc+'60' : 'var(--border2)'}`,
              color: checked ? tc : 'var(--text3)', transition:'all .15s' }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(team)} style={{ display:'none' }} />
              {team}
            </label>
          )
        })}
      </div>
    </div>
  )
}

const roleColor = {
  'Head Admin':   { bg: 'rgba(92,184,0,0.12)',    color: '#3b7a00',       border: 'rgba(92,184,0,0.3)' },
  'Coach':        { bg: 'rgba(59,130,246,0.12)',   color: '#1d4ed8',       border: 'rgba(59,130,246,0.3)' },
  'Team Manager': { bg: 'rgba(238,103,48,0.12)',   color: '#c2410c',       border: 'rgba(238,103,48,0.3)' },
  'Volunteer':    { bg: 'rgba(141,151,176,0.12)',  color: '#4e576e',       border: 'rgba(141,151,176,0.3)' },
}

const teamColor = {
  'All Teams': '#5cb800',
  'Drive':     '#3b82f6',
  'Energy':    '#ee6730',
  'Passion':   '#a855f7',
  'Power':     '#4ade80',
}

function initials(fname, lname) {
  return `${(fname||'?')[0]}${(lname||'')[0]}`.toUpperCase()
}

export default function Staff() {
  const { admins, addAdmin, removeAdmin, showToast, orgTeams } = useStore()
  const TEAMS_OPT = orgTeams.map(t => t.id || t.label || t.name).filter(Boolean)
  const { user } = useAuth()
  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm]       = useState({ fname:'', lname:'', email:'', role:'Coach', team:'All Teams', phone:'' })
  const [sendEmail, setSendEmail]   = useState(true)
  const [filter, setFilter]         = useState('')

  const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'

  async function callEmail(endpoint, body) {
    try {
      const res = await fetch(`${API}/api/email/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return res.ok
    } catch { return false }
  }

  const filtered = admins.filter(a =>
    !filter ||
    (a.name||`${a.fname} ${a.lname}`).toLowerCase().includes(filter.toLowerCase()) ||
    (a.email||'').toLowerCase().includes(filter.toLowerCase()) ||
    (a.role||'').toLowerCase().includes(filter.toLowerCase())
  )

  // Group by role
  const grouped = ROLES.reduce((acc, role) => {
    acc[role] = filtered.filter(a => a.role === role)
    return acc
  }, {})

  function startEdit(a) {
    setEditingId(a.id)
    setEditForm({ role: a.role || 'Coach', team: a.team || a.team_access || 'All Teams', phone: a.phone || '' })
  }

  async function saveEdit(a) {
    // Update in store
    const updated = admins.map(x => x.id === a.id ? { ...x, ...editForm, team_access: editForm.team } : x)
    // Direct update via store — we'll use removeAdmin + addAdmin pattern
    removeAdmin(a.id)
    addAdmin({ ...a, ...editForm, team_access: editForm.team, fname: a.fname, lname: a.lname, email: a.email })
    setEditingId(null)
    showToast('✅ Role updated!')
  }

  async function handleAdd() {
    if (!addForm.fname || !addForm.email) return
    addAdmin({ ...addForm, name: `${addForm.fname} ${addForm.lname}`.trim() })
    if (sendEmail) {
      const ok = await callEmail('admin-created', {
        adminName: `${addForm.fname} ${addForm.lname}`.trim(),
        adminEmail: addForm.email, role: addForm.role,
        teamAccess: addForm.team, orgName: 'Delta Dubs',
      })
      showToast(ok ? '✅ Staff added & email sent!' : '✅ Staff added (email failed)')
    } else {
      showToast('✅ Staff member added!')
    }
    setShowAddModal(false)
    setAddForm({ fname:'', lname:'', email:'', role:'Coach', team:'All Teams', phone:'' })
  }

  async function handleReset(email) {
    const ok = await callEmail('password-reset', { email, orgName: 'Delta Dubs' })
    showToast(ok ? `📧 Reset sent to ${email}` : '❌ Reset failed')
  }

  const rc = (role) => roleColor[role] || roleColor['Volunteer']

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
        <input className="search-input" placeholder="🔍 Search staff…"
          value={filter} onChange={e => setFilter(e.target.value)} style={{ width:220 }} />
        <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleReset(user?.email)}>
            🔑 Reset My Password
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Staff
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {ROLES.map(role => {
          const count = admins.filter(a => a.role === role).length
          const c = rc(role)
          return (
            <div key={role} style={{
              background: 'var(--bg2)', border: `1px solid ${c.border}`,
              borderRadius: 'var(--radius)', padding: '14px 18px',
              borderTop: `3px solid ${c.color}`,
            }}>
              <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1.5, color:'var(--text3)', fontWeight:700, marginBottom:6 }}>{role}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:32, color: c.color, lineHeight:1 }}>{count}</div>
            </div>
          )
        })}
      </div>

      {/* Staff by role */}
      {ROLES.map(role => {
        const members = grouped[role]
        if (members.length === 0) return null
        const c = rc(role)
        return (
          <div key={role} className="card" style={{ marginBottom:16 }}>
            <div className="card-header">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{
                  padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                  background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  letterSpacing:1, textTransform:'uppercase',
                }}>{role}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {members.map(a => {
              const isEditing = editingId === a.id
              const name = a.name || `${a.fname||''} ${a.lname||''}`.trim()
              const team = a.team || a.team_access || 'All Teams'
              const tc = teamColor[isEditing ? editForm.team : team] || '#5cb800'

              return (
                <div key={a.id} style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'14px 18px', borderBottom:'1px solid var(--border2)',
                  background: isEditing ? 'var(--bg3)' : 'transparent',
                  transition: 'background .15s',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width:44, height:44, borderRadius:'50%', flexShrink:0,
                    background: `linear-gradient(135deg, ${c.color}40, ${c.color}20)`,
                    border: `2px solid ${c.color}50`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:16, color: c.color,
                  }}>
                    {initials(a.fname || name.split(' ')[0], a.lname || name.split(' ')[1])}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{name}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>{a.email}</div>
                    {a.phone && <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{a.phone}</div>}
                  </div>

                  {/* Team badge */}
                  {!isEditing && (
                    <span style={{
                      padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                      background: tc + '20', color: tc, border: `1px solid ${tc}40`,
                      textTransform:'uppercase', letterSpacing:1,
                    }}>{team}</span>
                  )}

                  {/* Edit mode */}
                  {isEditing ? (
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <div>
                        <div className="form-label" style={{ marginBottom:3 }}>Role</div>
                        <select className="filter-select" style={{ fontSize:12 }}
                          value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div style={{ minWidth:200 }}>
                        <div className="form-label" style={{ marginBottom:3 }}>Team Access</div>
                        <TeamCheckboxes value={editForm.team} onChange={v => setEditForm(f => ({ ...f, team: v }))} />
                      </div>
                      <div style={{ display:'flex', gap:6, marginTop:16 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => saveEdit(a)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => startEdit(a)}>✏️ Edit</button>
                      {a.email && (
                        <button className="btn-ghost btn-sm" style={{ color:'var(--blue)', borderColor:'rgba(59,130,246,.3)' }}
                          onClick={() => handleReset(a.email)}>🔑</button>
                      )}
                      <button className="btn-ghost btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}
                        onClick={() => { if(window.confirm(`Remove ${name}?`)) removeAdmin(a.id) }}>✕</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {admins.length === 0 && (
        <div className="card">
          <div style={{ padding:40, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
            No staff added yet — click + Add Staff to get started
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">➕ Add Staff Member</div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" placeholder="First"
                    value={addForm.fname} onChange={e => setAddForm(f=>({...f,fname:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" placeholder="Last"
                    value={addForm.lname} onChange={e => setAddForm(f=>({...f,lname:e.target.value}))} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Email (must match their Google account)</label>
                  <input className="form-input" type="email" placeholder="coach@gmail.com"
                    value={addForm.email} onChange={e => setAddForm(f=>({...f,email:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={addForm.role} onChange={e => setAddForm(f=>({...f,role:e.target.value}))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Team Access</label>
                  <TeamCheckboxes value={addForm.team} onChange={v => setAddForm(f=>({...f,team:v}))} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" placeholder="(925) 555-0100"
                    value={addForm.phone} onChange={e => setAddForm(f=>({...f,phone:e.target.value}))} />
                </div>
                <div className="form-group full">
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
                    <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
                    Send welcome email to this staff member
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add Staff Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
