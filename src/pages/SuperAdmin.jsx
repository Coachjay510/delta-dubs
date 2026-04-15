import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SUPER_ADMINS = ['nextplaysports.ca@gmail.com']

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'

const STATUS_COLORS = {
  active:    { bg:'rgba(92,184,0,0.12)',   color:'#3b7a00',  border:'rgba(92,184,0,0.3)' },
  trial:     { bg:'rgba(234,179,8,0.12)',  color:'#a16207',  border:'rgba(234,179,8,0.3)' },
  suspended: { bg:'rgba(239,68,68,0.12)',  color:'#dc2626',  border:'rgba(239,68,68,0.3)' },
  inactive:  { bg:'rgba(141,151,176,0.1)', color:'#4e576e',  border:'rgba(141,151,176,0.2)' },
}

const TIER_COLORS = {
  Rookie:  '#5cb800',
  Varsity: '#3b82f6',
  Pro:     '#a855f7',
}

const TIER_PRICES = { Rookie: 0, Varsity: 150, Pro: 350 }

function Badge({ label, color, bg, border }) {
  return (
    <span style={{
      padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700,
      background: bg, color, border:`1px solid ${border}`,
      textTransform:'uppercase', letterSpacing:1,
    }}>{label}</span>
  )
}

export default function SuperAdmin() {
  const { user } = useAuth()
  const [tab, setTab]               = useState('overview')
  const [orgs, setOrgs]             = useState([])
  const [orgUsers, setOrgUsers]     = useState([])
  const [playerCounts, setPlayerCounts] = useState({})
  const [superAdmins, setSuperAdmins] = useState([])
  const [loading, setLoading]       = useState(true)
  const [expandedOrg, setExpandedOrg] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false)

  // Login editor
  const [appCardSettings, setAppCardSettings] = useState({
    modal_title: 'SIGN IN TO\nYOUR APP',
    modal_subtitle: 'Choose an app to continue.',
    app1_name: 'NP Manager', app1_desc: 'Roster, payments, recruiting & org tools', app1_icon: '🏀', app1_badge: 'Live', app1_url: 'https://delta-dubs.vercel.app', app1_enabled: 'true',
    app2_name: 'NP Tournaments', app2_desc: 'Bracket & event management', app2_icon: '🏆', app2_badge: 'Live', app2_url: 'https://np-tournaments.vercel.app', app2_enabled: 'true',
    app3_name: 'NP Film Room', app3_desc: 'Video editing, clips & game stats', app3_icon: '▶', app3_badge: 'Desktop', app3_url: 'np-filmroom://auth/callback', app3_enabled: 'true',
  })
  const [appCardSaving, setAppCardSaving] = useState(false)
  const [loginSettings, setLoginSettings] = useState({
    login_heading:    'Sign in',
    login_subheading: 'Access your org dashboard',
    login_tagline:    'Sign in with your Google account to continue.',
    login_footer:     '© 2026 NEXT PLAY SPORTS MEDIA & MANAGEMENT',
  })
  const [loginSaving, setLoginSaving] = useState(false)

  // Landing page editor
  const [landingSettings, setLandingSettings] = useState({
    landing_hero_title:      'RUN YOUR AAU ORG DIFFERENTLY',
    landing_hero_sub:        'The all-in-one platform built for AAU basketball organizations.',
    landing_cta_text:        'Start Free Trial',
    landing_cta_url:         'https://nextplaymm.vercel.app',
    landing_email:           'nextplaysports.ca@gmail.com',
    landing_filmroom_price:  '+$30/yr',
    landing_primary_color:   '#5cb800',
    landing_accent_color:    '#7ae600',
    landing_logo_main_url:   '',
    landing_logo_icon_url:   '',
    landing_logo_font_url:   '',
    landing_logo_main_size:  '120',
    landing_logo_icon_size:  '80',
    login_logo_size:         '52',
    login_bg_color:          '#04060a',
    login_card_color:        '#080c12',
  })
  const [landingSaving,   setLandingSaving]   = useState(false)
  const [uploadingLogo,   setUploadingLogo]   = useState(null)
  const [inviteForm, setInviteForm] = useState({ orgName:'', orgId:'', adminName:'', adminEmail:'', tier:'Rookie', ein:'' })
  const [newSuperEmail, setNewSuperEmail] = useState('')
  const [saving, setSaving]         = useState(false)
  const [emailTarget, setEmailTarget] = useState(null)
  const [emailBody, setEmailBody]   = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const isSuperAdmin = SUPER_ADMINS.includes(user?.email)

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAll()
      fetchLoginSettings()
    }
  }, [isSuperAdmin])

  async function fetchLoginSettings() {
    const { data } = await supabase.from('platform_settings')
      .select('key, value')
      .in('key', [
        'login_heading','login_subheading','login_tagline','login_footer',
        'landing_hero_title','landing_hero_sub','landing_cta_text','landing_cta_url',
        'landing_email','landing_filmroom_price','landing_primary_color','landing_accent_color',
        'landing_logo_main_url','landing_logo_icon_url','landing_logo_font_url',
        'landing_logo_main_size','landing_logo_icon_size',
        'login_logo_size','login_bg_color','login_card_color',
        'modal_title','modal_subtitle',
        'app1_name','app1_desc','app1_icon','app1_badge','app1_url','app1_enabled',
        'app2_name','app2_desc','app2_icon','app2_badge','app2_url','app2_enabled',
        'app3_name','app3_desc','app3_icon','app3_badge','app3_url','app3_enabled',
      ])
    if (data?.length) {
      const map = {}
      data.forEach(r => { map[r.key] = r.value })
      setLoginSettings(prev => ({ ...prev, ...map }))
      setLandingSettings(prev => ({ ...prev, ...map }))
      setAppCardSettings(prev => ({ ...prev, ...map }))
    }
  }

  async function uploadLogo(file, key) {
    if (!file) return
    setUploadingLogo(key)
    try {
      const ext  = file.name.split('.').pop()
      const path = `logos/${key}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('platform-assets')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('platform-assets').getPublicUrl(path)
      const url = data.publicUrl
      setLandingSettings(prev => ({ ...prev, [key]: url }))
      // auto-save this key
      await supabase.from('platform_settings').upsert({ key, value: url }, { onConflict: 'key' })
      alert(`Logo uploaded! URL saved. Redeploy landing page to see it.`)
    } catch(e) {
      alert('Upload failed: ' + e.message + '\n\nMake sure you have a "platform-assets" storage bucket in Supabase with public access.')
    } finally {
      setUploadingLogo(null)
    }
  }

  async function saveLoginSettings() {
    setLoginSaving(true)
    const rows = Object.entries(loginSettings).map(([key, value]) => ({ key, value }))
    await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' })
    setLoginSaving(false)
    alert('Login page updated!')
  }

  async function saveAppCardSettings() {
    setAppCardSaving(true)
    const rows = Object.entries(appCardSettings).map(([key, value]) => ({ key, value }))
    await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' })
    setAppCardSaving(false)
    alert('Sign-in modal updated! Changes live on next page load.')
  }

  async function saveLandingSettings() {
    setLandingSaving(true)
    const rows = Object.entries(landingSettings).map(([key, value]) => ({ key, value }))
    await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' })
    setLandingSaving(false)
    alert('Landing page settings saved! Redeploy landing/index.html to see changes, or connect it to Supabase.')
  }

  async function fetchAll() {
    setLoading(true)
    try {
      const [{ data: orgData }, { data: users }, { data: players }, { data: admData }] = await Promise.all([
        supabase.from('orgs').select('*').order('created_at', { ascending: false }),
        supabase.from('org_users').select('*').order('created_at', { ascending: false }),
        supabase.from('players').select('org_id, status'),
        supabase.from('admins').select('*').eq('org_id', 'np-platform').limit(50),
      ])
      setOrgs(orgData || [])
      setOrgUsers(users || [])
      setSuperAdmins(admData || [])
      const counts = {}
      ;(players || []).forEach(p => {
        if (!counts[p.org_id]) counts[p.org_id] = { total:0, onRoster:0 }
        counts[p.org_id].total++
        if (p.status === 'On Roster') counts[p.org_id].onRoster++
      })
      setPlayerCounts(counts)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function updateOrg(orgId, updates) {
    await supabase.from('orgs').update(updates).eq('id', orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, ...updates } : o))
  }

  async function inviteOrg() {
    if (!inviteForm.orgName || !inviteForm.adminEmail) return
    setSaving(true)
    try {
      const orgId = inviteForm.orgId || inviteForm.orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      // Create org
      await supabase.from('orgs').insert({
        id: orgId, name: inviteForm.orgName,
        ein: inviteForm.ein, tier: inviteForm.tier, status: 'trial',
        trial_started_at: new Date().toISOString(),
      })
      // Create admin record
      await supabase.from('admins').insert({
        org_id: orgId, fname: inviteForm.adminName.split(' ')[0],
        lname: inviteForm.adminName.split(' ').slice(1).join(' '),
        email: inviteForm.adminEmail, role: 'Head Admin', team_access: 'All Teams',
      })
      // Send welcome email
      await fetch(`${API}/api/email/welcome`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: inviteForm.adminName, orgName: inviteForm.orgName, email: inviteForm.adminEmail }),
      })
      await fetchAll()
      setShowInviteModal(false)
      setInviteForm({ orgName:'', orgId:'', adminName:'', adminEmail:'', tier:'Rookie', ein:'' })
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function sendOrgEmail() {
    if (!emailTarget || !emailSubject || !emailBody) return
    setSendingEmail(true)
    const orgAdmins = orgUsers.filter(u => u.org_id === emailTarget.id)
    await Promise.all(orgAdmins.map(a =>
      fetch(`${API}/api/email/admin-created`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: a.email, adminName: a.email, role: 'Admin', orgName: emailTarget.name }),
      })
    ))
    setSendingEmail(false)
    setEmailTarget(null)
    setEmailSubject('')
    setEmailBody('')
  }

  async function addSuperAdmin() {
    if (!newSuperEmail) return
    await supabase.from('admins').insert({
      org_id: 'np-platform', fname: 'Super', lname: 'Admin',
      email: newSuperEmail, role: 'Head Admin', team_access: 'All Teams',
    })
    setNewSuperEmail('')
    fetchAll()
  }

  if (!isSuperAdmin) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--red)', marginBottom:10 }}>RESTRICTED</div>
      <div style={{ fontSize:13, color:'var(--text3)' }}>Next Play platform administrators only.</div>
    </div>
  )

  const mrr = orgs.filter(o => o.status === 'active').reduce((s, o) => s + (TIER_PRICES[o.tier||'Rookie']||0), 0)
  const activeOrgs = orgs.filter(o => !o.status || o.status === 'active').length
  const trialOrgs  = orgs.filter(o => o.status === 'trial').length
  const totalPlayers = Object.values(playerCounts).reduce((s,c) => s + c.onRoster, 0)
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'

  const TABS = [
    { id:'overview',   label:'Overview' },
    { id:'orgs',       label:`Orgs (${orgs.length})` },
    { id:'users',      label:`Users (${orgUsers.length})` },
    { id:'superadmins',label:'Super Admins' },
    { id:'logineditor',label:'Login & Landing' },
  ]

  return (
    <div style={{ padding:24 }}>

      {/* Platform banner */}
      <div style={{
        background:'linear-gradient(135deg,rgba(168,85,247,0.12),rgba(168,85,247,0.06))',
        border:'1px solid rgba(168,85,247,0.3)', borderRadius:'var(--radius)',
        padding:'16px 22px', marginBottom:24,
        display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
      }}>
        <div style={{ fontSize:24 }}>🏢</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'#a855f7', letterSpacing:.5 }}>
            NEXT PLAY — PLATFORM CONTROL CENTER
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>{user?.email}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}>🔄 Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowInviteModal(true)}>+ Invite Org</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid var(--border2)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'10px 20px', background:'none', border:'none',
            borderBottom: tab===t.id ? '2px solid #a855f7' : '2px solid transparent',
            color: tab===t.id ? '#a855f7' : 'var(--text3)',
            fontFamily:'var(--font-body)', fontSize:13, fontWeight:600,
            cursor:'pointer', transition:'all .15s', marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading…</div>}

      {/* ── OVERVIEW TAB ── */}
      {!loading && tab === 'overview' && (
        <div>
          <div className="grid-4" style={{ marginBottom:24 }}>
            {[
              ['ARR', `$${mrr.toLocaleString()}`, 'sc-purple', 'Annual recurring revenue'],
              ['Active Orgs', activeOrgs, 'sc-green', `${trialOrgs} on trial`],
              ['Total Players', totalPlayers, 'sc-blue', 'On roster across all orgs'],
              ['Platform Users', orgUsers.length, 'sc-orange', 'Admins + coaches'],
            ].map(([label, val, cls, sub]) => (
              <div key={label} className={`stat-card ${cls}`}>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{val}</div>
                <div className="stat-sub">{sub}</div>
              </div>
            ))}
          </div>

          {/* Tier breakdown */}
          <div className="grid-2" style={{ gap:18, marginBottom:18 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Orgs by Tier</span></div>
              <div className="card-body">
                {['Rookie','Varsity','Pro'].map(tier => {
                  const count = orgs.filter(o => (o.tier||'Rookie') === tier).length
                  const tc = TIER_COLORS[tier]
                  const revenue = count * TIER_PRICES[tier]
                  return (
                    <div key={tier} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:16, color:tc, width:60 }}>{tier}</span>
                      <div style={{ flex:1, height:6, background:'var(--bg4)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${orgs.length ? (count/orgs.length*100) : 0}%`, height:'100%', background:tc, borderRadius:3 }} />
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text3)', width:16, textAlign:'center' }}>{count}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:tc, width:60, textAlign:'right' }}>
                        ${revenue.toLocaleString()}/mo
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Orgs by Status</span></div>
              <div className="card-body">
                {['active','trial','suspended','inactive'].map(status => {
                  const count = orgs.filter(o => (o.status||'active') === status).length
                  const sc = STATUS_COLORS[status]
                  return (
                    <div key={status} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                      <Badge label={status} {...sc} />
                      <div style={{ flex:1, height:6, background:'var(--bg4)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${orgs.length ? (count/orgs.length*100) : 0}%`, height:'100%', background:sc.color, borderRadius:3 }} />
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text3)' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ORGS TAB ── */}
      {!loading && tab === 'orgs' && (
        <div>
          {orgs.map(org => {
            const pc = playerCounts[org.id] || { total:0, onRoster:0 }
            const members = orgUsers.filter(u => u.org_id === org.id)
            const status = org.status || 'active'
            const tier   = org.tier   || 'Rookie'
            const sc = STATUS_COLORS[status] || STATUS_COLORS.active
            const tc = TIER_COLORS[tier] || '#5cb800'
            const isExpanded = expandedOrg === org.id

            return (
              <div key={org.id} className="card" style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', cursor:'pointer' }}
                  onClick={() => setExpandedOrg(isExpanded ? null : org.id)}>
                  <div style={{
                    width:44, height:44, borderRadius:10, flexShrink:0,
                    background:'linear-gradient(135deg,var(--np-green),var(--orange))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:18, color:'#fff',
                  }}>{(org.name||'O')[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:18 }}>{org.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, fontFamily:'var(--font-mono)' }}>
                      {org.id} · Created {fmtDate(org.created_at)}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--np-green2)' }}>{pc.onRoster}</div>
                      <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Players</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--blue)' }}>{members.length}</div>
                      <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Admins</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:tc }}>
                        {TIER_PRICES[tier] === 0 ? 'Free' : `$${TIER_PRICES[tier]}/yr`}
                      </div>
                      <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Plan</div>
                    </div>
                  </div>
                  <Badge label={tier} bg={tc+'20'} color={tc} border={tc+'40'} />
                  <Badge label={status} {...sc} />
                  <span style={{ color:'var(--text3)' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop:'1px solid var(--border2)', padding:'20px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20 }}>

                      {/* Controls */}
                      <div>
                        <div className="section-title" style={{ fontSize:12 }}>Controls</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          <div>
                            <div className="form-label" style={{ marginBottom:4 }}>Tier</div>
                            <select className="filter-select" style={{ width:'100%', fontSize:12 }}
                              value={tier} onChange={e => updateOrg(org.id, { tier: e.target.value })}>
                              <option value="Rookie">Rookie — Free</option><option value="Varsity">Varsity — $150/yr</option><option value="Pro">Pro — $350/yr</option>
                            </select>
                          </div>
                          <div>
                            <div className="form-label" style={{ marginBottom:4 }}>Status</div>
                            <select className="filter-select" style={{ width:'100%', fontSize:12 }}
                              value={status} onChange={e => updateOrg(org.id, { status: e.target.value })}>
                              {['active','trial','suspended','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => {
                              setEmailTarget(org)
                              setEmailSubject(`Message from Next Play — ${org.name}`)
                            }}>📧 Email Org</button>
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => window.location.href = `${window.location.origin}?impersonate=${org.id}`}>
                              👁 View as Org
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Org details */}
                      <div>
                        <div className="section-title" style={{ fontSize:12 }}>Details</div>
                        {[['EIN', org.ein],['Season', org.season],['Website', org.website]].filter(([,v])=>v).map(([l,v])=>(
                          <div key={l} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:2 }}>{l}</div>
                            <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text2)' }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Admins */}
                      <div>
                        <div className="section-title" style={{ fontSize:12 }}>Admins ({members.length})</div>
                        <div style={{ maxHeight:150, overflowY:'auto' }}>
                          {members.map(u => (
                            <div key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border2)' }}>
                              <div style={{
                                width:26, height:26, borderRadius:'50%', background:'var(--bg4)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:11, fontFamily:'var(--font-display)', color:'var(--text3)', flexShrink:0,
                              }}>{(u.email||'?')[0].toUpperCase()}</div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                                <div style={{ fontSize:10, color:'var(--text3)' }}>{u.role}</div>
                              </div>
                            </div>
                          ))}
                          {members.length === 0 && <div style={{ fontSize:12, color:'var(--text3)' }}>No admins yet</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {orgs.length === 0 && (
            <div className="card">
              <div style={{ padding:40, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                No orgs yet — invite your first org above
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {!loading && tab === 'users' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Email</th><th>Org</th><th>Role</th><th>Team</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {orgUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontSize:13 }}>{u.email}</td>
                    <td><span className="badge badge-gray">{u.org_id}</span></td>
                    <td><span className="badge badge-blue">{u.role}</span></td>
                    <td style={{ fontSize:12, color:'var(--text3)' }}>{u.team_access||'All Teams'}</td>
                    <td className="td-muted">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUPER ADMINS TAB ── */}
      {!loading && tab === 'superadmins' && (
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-header">
              <span className="card-title">Platform Super Admins</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSuperAdminModal(true)}>+ Add Super Admin</button>
            </div>
            <div style={{ padding:'0 18px' }}>
              {/* Always show current user */}
              {SUPER_ADMINS.map(email => (
                <div key={email} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border2)' }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background:'linear-gradient(135deg,#a855f7,#5cb800)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:14, color:'#fff',
                  }}>{email[0].toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{email}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Platform Owner</div>
                  </div>
                  <span className="badge badge-purple">Super Admin</span>
                  {email === user?.email && <span className="badge badge-green">You</span>}
                </div>
              ))}
              {superAdmins.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border2)' }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background:'linear-gradient(135deg,#a855f7,#3b82f6)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:14, color:'#fff',
                  }}>{(a.fname||'?')[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{a.fname} {a.lname}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{a.email}</div>
                  </div>
                  <span className="badge badge-purple">Super Admin</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:'12px 18px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', fontSize:12, color:'var(--text3)' }}>
            ⚠️ Super admins have full platform access. Add only trusted Next Play team members.
          </div>
        </div>
      )}

      {/* ── INVITE ORG MODAL ── */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowInviteModal(false)}>
          <div className="modal" style={{ width:580 }}>
            <div className="modal-header">
              <div className="modal-title">🏢 Invite New Organization</div>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Organization Name</label>
                  <input className="form-input" placeholder="Bay Area Elite Basketball"
                    value={inviteForm.orgName} onChange={e => setInviteForm(f=>({...f,orgName:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Org ID (auto-generated)</label>
                  <input className="form-input" placeholder="bay-area-elite"
                    value={inviteForm.orgId || inviteForm.orgName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}
                    onChange={e => setInviteForm(f=>({...f,orgId:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">EIN (optional)</label>
                  <input className="form-input" placeholder="XX-XXXXXXX"
                    value={inviteForm.ein} onChange={e => setInviteForm(f=>({...f,ein:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Name</label>
                  <input className="form-input" placeholder="First Last"
                    value={inviteForm.adminName} onChange={e => setInviteForm(f=>({...f,adminName:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Email</label>
                  <input className="form-input" type="email" placeholder="admin@orgemail.com"
                    value={inviteForm.adminEmail} onChange={e => setInviteForm(f=>({...f,adminEmail:e.target.value}))} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Subscription Tier</label>
                  <select className="form-select" value={inviteForm.tier} onChange={e => setInviteForm(f=>({...f,tier:e.target.value}))}>
                    <option value="Rookie">Rookie — Free</option>
                    <option value="Varsity">Varsity — $150/yr</option>
                    <option value="Pro">Pro — $350/yr</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop:14, padding:'12px 14px', background:'var(--np-green-dim)', border:'1px solid var(--np-green-mid)', borderRadius:'var(--radius-sm)', fontSize:12, color:'var(--text2)' }}>
                ✅ This will create the org, add the admin, and send them a welcome email with login instructions.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={inviteOrg} disabled={saving}>
                {saving ? 'Creating…' : '🏢 Create Org & Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'logineditor' && (
        <div style={{ maxWidth:640 }}>

          {/* ── LOGIN PAGE EDITOR ── */}
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:6 }}>Login Page Editor</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>
            Edit the text that appears on the sign-in page. Changes go live immediately.
          </div>
          {[
            { key:'login_heading',    label:'Heading',    placeholder:'Sign in' },
            { key:'login_subheading', label:'Subheading', placeholder:'Access your org dashboard' },
            { key:'login_tagline',    label:'Tagline',    placeholder:'Sign in with your Google account to continue.' },
            { key:'login_footer',     label:'Footer',     placeholder:'© 2026 NEXT PLAY SPORTS MEDIA & MANAGEMENT' },
          ].map(field => (
            <div key={field.key} className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">{field.label}</label>
              <input className="form-input" placeholder={field.placeholder}
                value={loginSettings[field.key] || ''}
                onChange={e => setLoginSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:10, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', marginBottom:10, fontFamily:'var(--font-mono)' }}>Preview</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:4 }}>{loginSettings.login_heading}</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:10 }}>{loginSettings.login_subheading}</div>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', fontSize:12, color:'var(--text3)', marginBottom:6 }}>[Continue with Google button]</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{loginSettings.login_tagline}</div>
            <div style={{ marginTop:10, fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{loginSettings.login_footer}</div>
          </div>
          <button className="btn btn-primary" onClick={saveLoginSettings} disabled={loginSaving} style={{ marginBottom:32 }}>
            {loginSaving ? 'Saving…' : '💾 Save Login Page'}
          </button>

          {/* ── APP CARD EDITOR ── */}
          <div style={{ borderTop:'1px solid var(--border2)', paddingTop:28, marginTop:8, marginBottom:32 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:6 }}>Sign-In Modal Editor</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>
              Edit the app cards that appear in the "SIGN IN TO YOUR APP" modal.
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div className="form-group">
                <label className="form-label">Modal Title</label>
                <input className="form-input" value={appCardSettings.modal_title||''} onChange={e=>setAppCardSettings(p=>({...p,modal_title:e.target.value}))} placeholder="SIGN IN TO YOUR APP"/>
              </div>
              <div className="form-group">
                <label className="form-label">Modal Subtitle</label>
                <input className="form-input" value={appCardSettings.modal_subtitle||''} onChange={e=>setAppCardSettings(p=>({...p,modal_subtitle:e.target.value}))} placeholder="Choose an app to continue."/>
              </div>
            </div>

            {[1,2,3].map(n => (
              <div key={n} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', marginBottom:12, fontFamily:'var(--font-mono)' }}>App {n}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={appCardSettings[`app${n}_name`]||''} onChange={e=>setAppCardSettings(p=>({...p,[`app${n}_name`]:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Icon (emoji)</label>
                    <input className="form-input" value={appCardSettings[`app${n}_icon`]||''} onChange={e=>setAppCardSettings(p=>({...p,[`app${n}_icon`]:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Badge</label>
                    <input className="form-input" value={appCardSettings[`app${n}_badge`]||''} onChange={e=>setAppCardSettings(p=>({...p,[`app${n}_badge`]:e.target.value}))} placeholder="Live / Beta / Desktop"/>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label className="form-label">Description</label>
                  <input className="form-input" value={appCardSettings[`app${n}_desc`]||''} onChange={e=>setAppCardSettings(p=>({...p,[`app${n}_desc`]:e.target.value}))}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
                  <div className="form-group">
                    <label className="form-label">Redirect URL</label>
                    <input className="form-input" value={appCardSettings[`app${n}_url`]||''} onChange={e=>setAppCardSettings(p=>({...p,[`app${n}_url`]:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Enabled</label>
                    <select className="form-select" value={appCardSettings[`app${n}_enabled`]||'true'} onChange={e=>setAppCardSettings(p=>({...p,[`app${n}_enabled`]:e.target.value}))}>
                      <option value="true">Visible</option>
                      <option value="false">Hidden</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Preview */}
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:10, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', marginBottom:12, fontFamily:'var(--font-mono)' }}>Preview</div>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4, whiteSpace:'pre-line' }}>{appCardSettings.modal_title}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>{appCardSettings.modal_subtitle}</div>
              {[1,2,3].filter(n => appCardSettings[`app${n}_enabled`] !== 'false').map(n => (
                <div key={n} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, marginBottom:8 }}>
                  <div style={{ fontSize:22 }}>{appCardSettings[`app${n}_icon`]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--green2)' }}>{appCardSettings[`app${n}_name`]}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{appCardSettings[`app${n}_desc`]}</div>
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(92,184,0,0.1)', color:'var(--green2)', border:'1px solid rgba(92,184,0,0.3)' }}>{appCardSettings[`app${n}_badge`]}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={saveAppCardSettings} disabled={appCardSaving}>
              {appCardSaving ? 'Saving…' : '💾 Save Sign-In Modal'}
            </button>
          </div>

          {/* ── LANDING PAGE EDITOR ── */}
          <div style={{ borderTop:'1px solid var(--border2)', paddingTop:28, marginTop:8 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:6 }}>Landing Page Editor</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>
              Edit text, colors, logos, and layout. Save here — redeploy the landing folder once to apply all changes.
            </div>

            {/* LOGOS */}
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>// Logos</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
              {[
                { key:'landing_logo_main_url',  label:'Main Logo (hero)',    sizeKey:'landing_logo_main_size',  placeholder:'https://...' },
                { key:'landing_logo_icon_url',  label:'Icon Logo (nav)',     sizeKey:'landing_logo_icon_size',  placeholder:'https://...' },
                { key:'landing_logo_font_url',  label:'Font Logo (footer)',  sizeKey:null,                      placeholder:'https://...' },
              ].map(({ key, label, sizeKey, placeholder }) => (
                <div key={key} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>{label}</div>
                  {/* Preview */}
                  {landingSettings[key] && (
                    <img src={landingSettings[key]} alt={label}
                      style={{ width:'100%', height:60, objectFit:'contain', marginBottom:8,
                        filter:'brightness(0) invert(1)', mixBlendMode:'screen' }}/>
                  )}
                  {/* Upload */}
                  <label style={{ display:'block', marginBottom:6 }}>
                    <div style={{ background:'var(--np-green-dim)', border:'1px solid var(--np-green-mid)',
                      borderRadius:6, padding:'6px 10px', fontSize:11, color:'var(--np-green2)',
                      cursor:'pointer', textAlign:'center', fontWeight:600 }}>
                      {uploadingLogo===key ? 'Uploading…' : '⬆️ Upload Image'}
                    </div>
                    <input type="file" accept="image/*" style={{ display:'none' }}
                      onChange={e => uploadLogo(e.target.files?.[0], key)} disabled={!!uploadingLogo}/>
                  </label>
                  {/* Or paste URL */}
                  <input className="form-input" placeholder={placeholder} style={{ fontSize:11 }}
                    value={landingSettings[key] || ''}
                    onChange={e => setLandingSettings(p => ({ ...p, [key]: e.target.value }))}/>
                  {/* Size */}
                  {sizeKey && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>Size (px): {landingSettings[sizeKey] || '120'}</div>
                      <input type="range" min="40" max="300"
                        value={landingSettings[sizeKey] || '120'}
                        onChange={e => setLandingSettings(p => ({ ...p, [sizeKey]: e.target.value }))}
                        style={{ width:'100%' }}/>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* COLORS */}
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>// Colors</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
              {[
                { key:'landing_primary_color', label:'Primary Green',  defaultVal:'#5cb800' },
                { key:'landing_accent_color',  label:'Accent Green',   defaultVal:'#7ae600' },
                { key:'login_bg_color',         label:'Login BG',       defaultVal:'#04060a' },
                { key:'login_card_color',       label:'Login Card',     defaultVal:'#080c12' },
              ].map(({ key, label, defaultVal }) => (
                <div key={key} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>{label}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="color"
                      value={landingSettings[key] || defaultVal}
                      onChange={e => setLandingSettings(p => ({ ...p, [key]: e.target.value }))}
                      style={{ width:40, height:32, border:'none', borderRadius:4, cursor:'pointer', background:'none' }}/>
                    <input className="form-input" style={{ fontSize:12, flex:1 }}
                      value={landingSettings[key] || defaultVal}
                      onChange={e => setLandingSettings(p => ({ ...p, [key]: e.target.value }))}/>
                  </div>
                </div>
              ))}
            </div>

            {/* LOGIN LOGO SIZE */}
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>// Login Page Layout</div>
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:16, marginBottom:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Logo Size on Login (px): {landingSettings.login_logo_size || '52'}</div>
                  <input type="range" min="24" max="120"
                    value={landingSettings.login_logo_size || '52'}
                    onChange={e => setLandingSettings(p => ({ ...p, login_logo_size: e.target.value }))}
                    style={{ width:'100%' }}/>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width: Number(landingSettings.login_logo_size||52), height: Number(landingSettings.login_logo_size||52),
                    borderRadius: '50%', background:'var(--np-green-dim)', border:'1px solid var(--np-green-mid)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize: Math.max(12, Number(landingSettings.login_logo_size||52)/2.5),
                    color:'var(--np-green2)', flexShrink:0,
                  }}>NP</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Preview</div>
                </div>
              </div>
            </div>

            {/* TEXT */}
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>// Text Content</div>
            {[
              { key:'landing_hero_title',     label:'Hero Title',         placeholder:'RUN YOUR AAU ORG DIFFERENTLY' },
              { key:'landing_hero_sub',        label:'Hero Subheading',    placeholder:'The all-in-one platform...' },
              { key:'landing_cta_text',        label:'CTA Button Text',    placeholder:'Start Free Trial' },
              { key:'landing_cta_url',         label:'CTA Button URL',     placeholder:'https://nextplaymm.vercel.app' },
              { key:'landing_email',           label:'Contact Email',       placeholder:'nextplaysports.ca@gmail.com' },
              { key:'landing_filmroom_price',  label:'Film Room Price',     placeholder:'+$30/yr' },
            ].map(field => (
              <div key={field.key} className="form-group" style={{ marginBottom:12 }}>
                <label className="form-label">{field.label}</label>
                <input className="form-input" placeholder={field.placeholder}
                  value={landingSettings[field.key] || ''}
                  onChange={e => setLandingSettings(prev => ({ ...prev, [field.key]: e.target.value }))}/>
              </div>
            ))}

            <div style={{ background:'rgba(92,184,0,.06)', border:'1px solid rgba(92,184,0,.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'var(--text2)' }}>
              💡 To use logos on landing page without redeploy — connect <code>landing/index.html</code> to fetch from Supabase <code>platform_settings</code> on load. Or just redeploy after saving.
            </div>
            <button className="btn btn-primary" onClick={saveLandingSettings} disabled={landingSaving}>
              {landingSaving ? 'Saving…' : '💾 Save Landing Settings'}
            </button>
          </div>

        </div>
      )}

      {showSuperAdminModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowSuperAdminModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">🔐 Add Super Admin</div>
              <button className="modal-close" onClick={() => setShowSuperAdminModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="team@nextplaysports.com"
                  value={newSuperEmail} onChange={e => setNewSuperEmail(e.target.value)} />
              </div>
              <div style={{ marginTop:12, fontSize:12, color:'var(--text3)', lineHeight:1.6 }}>
                ⚠️ Super admins have full access to all orgs, all data, and all platform controls.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSuperAdminModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { addSuperAdmin(); setShowSuperAdminModal(false) }}>Add Super Admin</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL ORG MODAL ── */}
      {emailTarget && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setEmailTarget(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">📧 Email — {emailTarget.name}</div>
              <button className="modal-close" onClick={() => setEmailTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom:12 }}>
                <label className="form-label">Subject</label>
                <input className="form-input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" style={{ minHeight:120 }} value={emailBody}
                  onChange={e => setEmailBody(e.target.value)} placeholder="Write your message to this org's admins…" />
              </div>
              <div style={{ marginTop:10, fontSize:12, color:'var(--text3)' }}>
                Sends to {orgUsers.filter(u=>u.org_id===emailTarget.id).length} admin(s) in this org.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEmailTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendOrgEmail} disabled={sendingEmail}>
                {sendingEmail ? 'Sending…' : '📧 Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
