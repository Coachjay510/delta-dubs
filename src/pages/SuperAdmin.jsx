import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SUPER_ADMIN_EMAILS = [
  'nextplaysports.ca@gmail.com',
]

const STATUS_COLOR = {
  active:    { bg: 'rgba(92,184,0,0.12)',   color: '#3b7a00',  border: 'rgba(92,184,0,0.3)' },
  trial:     { bg: 'rgba(234,179,8,0.12)',  color: '#a16207',  border: 'rgba(234,179,8,0.3)' },
  suspended: { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626',  border: 'rgba(239,68,68,0.3)' },
  inactive:  { bg: 'rgba(141,151,176,0.1)', color: '#4e576e',  border: 'rgba(141,151,176,0.2)' },
}

const TIER_COLOR = {
  Starter: '#5cb800',
  Pro:     '#3b82f6',
  Elite:   '#a855f7',
}

export default function SuperAdmin() {
  const { user } = useAuth()
  const [orgs,        setOrgs]        = useState([])
  const [users,       setUsers]       = useState([])
  const [playerCounts, setPlayerCounts] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [activeOrg,   setActiveOrg]   = useState(null)
  const [tab,         setTab]         = useState('orgs') // orgs | users | activity

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email)

  useEffect(() => { if (isSuperAdmin) fetchAll() }, [isSuperAdmin])

  async function fetchAll() {
    setLoading(true)
    try {
      const [{ data: orgData }, { data: orgUsers }, { data: playerData }] = await Promise.all([
        supabase.from('orgs').select('*').order('created_at', { ascending: false }),
        supabase.from('org_users').select('*').order('created_at', { ascending: false }),
        supabase.from('players').select('org_id, status'),
      ])
      setOrgs(orgData || [])
      setUsers(orgUsers || [])
      // Count players per org
      const counts = {}
      ;(playerData || []).forEach(p => {
        if (!counts[p.org_id]) counts[p.org_id] = { total: 0, onRoster: 0 }
        counts[p.org_id].total++
        if (p.status === 'On Roster') counts[p.org_id].onRoster++
      })
      setPlayerCounts(counts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrgStatus(orgId, status) {
    await supabase.from('orgs').update({ status }).eq('id', orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, status } : o))
  }

  async function updateOrgTier(orgId, tier) {
    await supabase.from('orgs').update({ tier }).eq('id', orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, tier } : o))
  }

  if (!isSuperAdmin) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--red)', marginBottom:10 }}>RESTRICTED</div>
      <div style={{ fontSize:13, color:'var(--text3)' }}>This area is for Next Play platform administrators only.</div>
    </div>
  )

  const totalPlayers = Object.values(playerCounts).reduce((s, c) => s + c.total, 0)
  const totalAdmins  = users.length
  const activeOrgs   = orgs.filter(o => o.status === 'active' || !o.status).length

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—'

  return (
    <div style={{ padding: 24 }}>

      {/* NP Super Admin Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.06))',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 'var(--radius)',
        padding: '16px 22px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{ fontSize:24 }}>🏢</div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'#a855f7', letterSpacing:.5 }}>
            NEXT PLAY — PLATFORM ADMIN
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>
            Signed in as {user?.email} · Full platform access
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }} onClick={fetchAll}>
          🔄 Refresh
        </button>
      </div>

      {/* Platform KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card sc-purple">
          <div className="stat-label">Total Orgs</div>
          <div className="stat-value">{orgs.length}</div>
          <div className="stat-sub">{activeOrgs} active</div>
        </div>
        <div className="stat-card sc-green">
          <div className="stat-label">Total Players</div>
          <div className="stat-value">{totalPlayers}</div>
          <div className="stat-sub">Across all orgs</div>
        </div>
        <div className="stat-card sc-blue">
          <div className="stat-label">Total Admins</div>
          <div className="stat-value">{totalAdmins}</div>
          <div className="stat-sub">Platform users</div>
        </div>
        <div className="stat-card sc-orange">
          <div className="stat-label">MRR</div>
          <div className="stat-value">$0</div>
          <div className="stat-sub">Add Stripe to track</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid var(--border2)' }}>
        {[['orgs','Organizations'], ['users','Platform Users'], ['activity','Activity']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'10px 20px', background:'none', border:'none',
            borderBottom: tab===id ? '2px solid #a855f7' : '2px solid transparent',
            color: tab===id ? '#a855f7' : 'var(--text3)',
            fontFamily:'var(--font-body)', fontSize:13, fontWeight:600,
            cursor:'pointer', transition:'all .15s', marginBottom:-1,
          }}>{label}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:40, color:'var(--text3)', fontSize:13 }}>Loading platform data…</div>
      )}

      {/* Orgs tab */}
      {!loading && tab === 'orgs' && (
        <div>
          {orgs.map(org => {
            const pc = playerCounts[org.id] || { total:0, onRoster:0 }
            const orgUsers = users.filter(u => u.org_id === org.id)
            const status = org.status || 'active'
            const tier = org.tier || 'Starter'
            const sc = STATUS_COLOR[status] || STATUS_COLOR.active
            const tc = TIER_COLOR[tier] || '#5cb800'
            const isExpanded = activeOrg === org.id

            return (
              <div key={org.id} className="card" style={{ marginBottom:12 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:14, padding:'16px 20px',
                  cursor:'pointer',
                }} onClick={() => setActiveOrg(isExpanded ? null : org.id)}>

                  {/* Org avatar */}
                  <div style={{
                    width:44, height:44, borderRadius:10, flexShrink:0,
                    background: 'linear-gradient(135deg,var(--np-green),var(--orange))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:18, color:'#fff',
                  }}>
                    {(org.name||'O')[0]}
                  </div>

                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:18, letterSpacing:.5 }}>{org.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, fontFamily:'var(--font-mono)' }}>
                      {org.id} · EIN: {org.ein || '—'} · Created {fmtDate(org.created_at)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--np-green2)' }}>{pc.onRoster}</div>
                      <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Players</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--blue)' }}>{orgUsers.length}</div>
                      <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Admins</div>
                    </div>
                  </div>

                  {/* Tier */}
                  <span style={{
                    padding:'3px 12px', borderRadius:20, fontSize:10, fontWeight:700,
                    background: tc + '20', color: tc, border: `1px solid ${tc}40`,
                    textTransform:'uppercase', letterSpacing:1,
                  }}>{tier}</span>

                  {/* Status */}
                  <span style={{
                    padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    textTransform:'uppercase', letterSpacing:1,
                  }}>{status}</span>

                  <span style={{ color:'var(--text3)', fontSize:16 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded org detail */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid var(--border2)', padding:'16px 20px' }}>
                    <div className="grid-2" style={{ gap:20, marginBottom:16 }}>
                      {/* Org settings */}
                      <div>
                        <div className="section-title" style={{ fontSize:12, marginBottom:12 }}>Org Controls</div>
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                          <div>
                            <div className="form-label" style={{ marginBottom:4 }}>Status</div>
                            <select className="filter-select" style={{ fontSize:12 }}
                              value={status}
                              onChange={e => updateOrgStatus(org.id, e.target.value)}>
                              <option value="active">Active</option>
                              <option value="trial">Trial</option>
                              <option value="suspended">Suspended</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                          <div>
                            <div className="form-label" style={{ marginBottom:4 }}>Tier</div>
                            <select className="filter-select" style={{ fontSize:12 }}
                              value={tier}
                              onChange={e => updateOrgTier(org.id, e.target.value)}>
                              <option value="Starter">Starter</option>
                              <option value="Pro">Pro</option>
                              <option value="Elite">Elite</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="btn btn-secondary btn-sm">📧 Email Org</button>
                          <button className="btn btn-secondary btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}>
                            ⏸ Suspend
                          </button>
                        </div>
                      </div>

                      {/* Org users */}
                      <div>
                        <div className="section-title" style={{ fontSize:12, marginBottom:12 }}>
                          Admins ({orgUsers.length})
                        </div>
                        <div style={{ maxHeight:160, overflowY:'auto' }}>
                          {orgUsers.map(u => (
                            <div key={u.id} style={{
                              display:'flex', alignItems:'center', gap:8,
                              padding:'6px 0', borderBottom:'1px solid var(--border2)',
                            }}>
                              <div style={{
                                width:28, height:28, borderRadius:'50%',
                                background:'var(--bg4)', border:'1px solid var(--border2)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:11, fontFamily:'var(--font-display)', color:'var(--text3)',
                              }}>{(u.email||'?')[0].toUpperCase()}</div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                                <div style={{ fontSize:10, color:'var(--text3)' }}>{u.role}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Users tab */}
      {!loading && tab === 'users' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th><th>Org</th><th>Role</th><th>Team</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontSize:13 }}>{u.email}</td>
                    <td><span className="badge badge-gray">{u.org_id}</span></td>
                    <td><span className="badge badge-blue">{u.role}</span></td>
                    <td style={{ fontSize:12, color:'var(--text3)' }}>{u.team_access || 'All Teams'}</td>
                    <td className="td-muted">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity tab */}
      {!loading && tab === 'activity' && (
        <div className="card">
          <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
            <div style={{ fontSize:24, marginBottom:10 }}>📊</div>
            Activity logging coming soon — wire Stripe webhooks and event tracking here.
          </div>
        </div>
      )}

    </div>
  )
}
