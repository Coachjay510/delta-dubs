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
  Rookie:  '#8d97b0',
  Varsity: '#5cb800',
  Pro:     '#a855f7',
}

const TIER_PRICES = { Rookie: 0, Varsity: 150, Pro: 350 }

// Default landing page content
const DEFAULT_LANDING = {
  hero: {
    kicker: 'Built by a coach · Used by AAU programs',
    line1: 'RUN YOUR',
    line2: 'AAU ORG',
    line3: 'DIFFERENTLY',
    sub: 'Next Play Sports Media & Management is the all-in-one platform built exclusively for AAU and high school basketball — roster, payments, film room, stats, and recruiting in one place.',
    trialNote: '14 days free · No credit card required · Cancel anytime',
  },
  logos: {
    main: '',
    icon: '',
    font: '',
  },
  sections: {
    features: true,
    filmroom: true,
    howItWorks: true,
    pricing: true,
    cta: true,
  },
  pricing: {
    rookie:   { name: 'ROOKIE',  price: '$0',   yearlyPrice: '$0',   monthlyPrice: '$0',  period: 'forever free',  savings: 'Get started at no cost' },
    varsity:  { name: 'VARSITY', price: '$150', yearlyPrice: '$150', monthlyPrice: '$15', period: 'per year',       savings: '~$12.50/mo · Best for growing orgs' },
    pro:      { name: 'PRO',     price: '$350', yearlyPrice: '$350', monthlyPrice: '$32', period: 'per year',       savings: '~$29/mo · For serious programs' },
    filmroom: { price: '+$30',   yearlyPrice: '+$30/yr', monthlyPrice: '+$3/mo', label: 'NP Film Room Desktop — Add-on' },
  },
  cta: {
    headline1: 'READY TO',
    headline2: 'NEXT PLAY?',
    sub: 'Start your free 14-day trial today. No credit card. No setup fee. Your org could be live in the next 5 minutes.',
    btnText: 'Start Free Trial →',
  },
}

function Badge({ label, color, bg, border }) {
  return (
    <span style={{
      padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700,
      background: bg, color, border:`1px solid ${border}`,
      textTransform:'uppercase', letterSpacing:1,
    }}>{label}</span>
  )
}

// ── LANDING EDITOR ──────────────────────────────────────────────
function LandingEditor() {
  const [content, setContent] = useState(DEFAULT_LANDING)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    // Load from Supabase if stored
    supabase.from('orgs').select('landing_content').eq('id', 'np-platform').single().then(({ data }) => {
      if (data?.landing_content) {
        try { setContent({ ...DEFAULT_LANDING, ...JSON.parse(data.landing_content) }) } catch {}
      }
    })
  }, [])

  async function save() {
    setSaving(true)
    await supabase.from('orgs').upsert({ id: 'np-platform', landing_content: JSON.stringify(content) }, { onConflict: 'id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function update(path, value) {
    const keys = path.split('.')
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  const sectionTabs = [
    { id: 'hero',      label: '🎯 Hero' },
    { id: 'logos',     label: '🖼 Logos' },
    { id: 'sections',  label: '📋 Sections' },
    { id: 'pricing',   label: '💰 Pricing' },
    { id: 'cta',       label: '📢 CTA' },
  ]

  const inputStyle = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 6, padding: '9px 12px', color: 'var(--text)',
    fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
    marginTop: 4,
  }
  const textareaStyle = { ...inputStyle, minHeight: 80, resize: 'vertical' }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase' }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(92,184,0,0.1),rgba(92,184,0,0.04))',
        border: '1px solid rgba(92,184,0,0.25)', borderRadius: 'var(--radius)',
        padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--np-green2)', letterSpacing: .5 }}>
            LANDING PAGE EDITOR
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            Changes save to Supabase. Push updated landing page to deploy live.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="https://np-landing-seven.vercel.app/" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            👁 Preview Live
          </a>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border2)' }}>
        {sectionTabs.map(t => (
          <button key={t.id} onClick={() => setActiveSection(t.id)} style={{
            padding: '9px 18px', background: 'none', border: 'none',
            borderBottom: activeSection === t.id ? '2px solid var(--np-green2)' : '2px solid transparent',
            color: activeSection === t.id ? 'var(--np-green2)' : 'var(--text3)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all .15s', marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── HERO ── */}
      {activeSection === 'hero' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Hero Section</span></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group full" style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Kicker text</label>
              <input style={inputStyle} value={content.hero.kicker}
                onChange={e => update('hero.kicker', e.target.value)} />
            </div>
            <div className="form-group">
              <label style={labelStyle}>Headline Line 1</label>
              <input style={inputStyle} value={content.hero.line1}
                onChange={e => update('hero.line1', e.target.value)} />
            </div>
            <div className="form-group">
              <label style={labelStyle}>Headline Line 2 (outline)</label>
              <input style={inputStyle} value={content.hero.line2}
                onChange={e => update('hero.line2', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Headline Line 3 (green)</label>
              <input style={inputStyle} value={content.hero.line3}
                onChange={e => update('hero.line3', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Subheadline</label>
              <textarea style={textareaStyle} value={content.hero.sub}
                onChange={e => update('hero.sub', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Trial note (below buttons)</label>
              <input style={inputStyle} value={content.hero.trialNote}
                onChange={e => update('hero.trialNote', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ── SECTIONS TOGGLE ── */}
      {activeSection === 'sections' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Show / Hide Sections</span></div>
          <div className="card-body">
            {[
              { key: 'features',   label: 'Features Grid',     desc: 'The 9-card features overview' },
              { key: 'filmroom',   label: 'Film Room Showcase', desc: 'Screenshot + feature list' },
              { key: 'howItWorks', label: 'How It Works',       desc: '4-step onboarding flow' },
              { key: 'pricing',    label: 'Pricing',            desc: 'Tier cards + Film Room add-on' },
              { key: 'cta',        label: 'CTA Banner',         desc: 'Final call-to-action section' },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0', borderBottom: '1px solid var(--border2)',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{desc}</div>
                </div>
                <button
                  onClick={() => update(`sections.${key}`, !content.sections[key])}
                  style={{
                    width: 48, height: 26, borderRadius: 13,
                    background: content.sections[key] ? 'var(--np-green)' : 'var(--bg4)',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: content.sections[key] ? 24 : 4,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left .2s', display: 'block',
                  }} />
                </button>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 6, fontSize: 12, color: 'var(--text3)' }}>
              ⚠️ Section toggles save to Supabase but require the landing page to read from your API to take effect live. Connect your landing page to fetch this config to enable live toggling.
            </div>
          </div>
        </div>
      )}

      {/* ── LOGOS ── */}
      {activeSection === 'logos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'main',  label: 'Main Logo (NP_Main.png)',  desc: 'Large logo used in hero and footer' },
            { key: 'icon',  label: 'Icon Logo (NP_Logo_abrev.png)', desc: 'Small square icon used in nav' },
            { key: 'font',  label: 'Font Logo (NP_Font.png)',  desc: 'Text wordmark used in nav and footer' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="card">
              <div className="card-header"><span className="card-title">{label}</span></div>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                {/* Preview */}
                <div style={{
                  width: 120, height: 80, background: 'var(--bg3)', border: '1px solid var(--border2)',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {content.logos[key]
                    ? <img src={content.logos[key]} alt={label} style={{ maxWidth: 110, maxHeight: 70, objectFit: 'contain' }} />
                    : <span style={{ fontSize: 11, color: 'var(--text3)' }}>No image</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>{desc}</div>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '9px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text2)',
                    transition: 'border-color .2s',
                  }}>
                    📁 Upload Image
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = ev => update(`logos.${key}`, ev.target.result)
                      reader.readAsDataURL(file)
                    }} />
                  </label>
                  {content.logos[key] && (
                    <button onClick={() => update(`logos.${key}`, '')} style={{
                      marginLeft: 8, padding: '9px 14px', background: 'none',
                      border: '1px solid rgba(239,68,68,.3)', borderRadius: 6,
                      color: 'var(--red)', fontSize: 13, cursor: 'pointer',
                    }}>Remove</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding: '12px 14px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 6, fontSize: 12, color: 'var(--text3)' }}>
            ⚠️ Logo changes save to Supabase as base64. To apply them live, the landing page needs to fetch this config from Supabase on load.
          </div>
        </div>
      )}

      {/* ── PRICING ── */}
      {activeSection === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'rookie',  label: 'Rookie Plan (Free)', color: 'var(--text2)' },
            { key: 'varsity', label: 'Varsity Plan',       color: '#5cb800' },
            { key: 'pro',     label: 'Pro Plan',           color: '#a855f7' },
          ].map(({ key, label, color }) => (
            <div key={key} className="card">
              <div className="card-header">
                <span className="card-title" style={{ color }}>{label}</span>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Plan Name</label>
                  <input style={inputStyle} value={content.pricing[key].name}
                    onChange={e => update(`pricing.${key}.name`, e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Yearly Price (e.g. $150)</label>
                  <input style={inputStyle} value={content.pricing[key].yearlyPrice}
                    onChange={e => update(`pricing.${key}.yearlyPrice`, e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Monthly Price (e.g. $15)</label>
                  <input style={inputStyle} value={content.pricing[key].monthlyPrice}
                    onChange={e => update(`pricing.${key}.monthlyPrice`, e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Savings note</label>
                  <input style={inputStyle} value={content.pricing[key].savings}
                    onChange={e => update(`pricing.${key}.savings`, e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <div className="card">
            <div className="card-header"><span className="card-title" style={{ color: '#a855f7' }}>Film Room Add-on</span></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Yearly Price (e.g. +$30/yr)</label>
                <input style={inputStyle} value={content.pricing.filmroom.yearlyPrice}
                  onChange={e => update('pricing.filmroom.yearlyPrice', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Monthly Price (e.g. +$3/mo)</label>
                <input style={inputStyle} value={content.pricing.filmroom.monthlyPrice}
                  onChange={e => update('pricing.filmroom.monthlyPrice', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Label</label>
                <input style={inputStyle} value={content.pricing.filmroom.label}
                  onChange={e => update('pricing.filmroom.label', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      {activeSection === 'cta' && (
        <div className="card">
          <div className="card-header"><span className="card-title">CTA Section</span></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Headline Line 1</label>
              <input style={inputStyle} value={content.cta.headline1}
                onChange={e => update('cta.headline1', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Headline Line 2 (green)</label>
              <input style={inputStyle} value={content.cta.headline2}
                onChange={e => update('cta.headline2', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Subtext</label>
              <textarea style={textareaStyle} value={content.cta.sub}
                onChange={e => update('cta.sub', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Button Text</label>
              <input style={inputStyle} value={content.cta.btnText}
                onChange={e => update('cta.btnText', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN SUPERADMIN ─────────────────────────────────────────────
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
  const [inviteForm, setInviteForm] = useState({ orgName:'', orgId:'', adminName:'', adminEmail:'', tier:'Starter', ein:'' })
  const [newSuperEmail, setNewSuperEmail] = useState('')
  const [saving, setSaving]         = useState(false)
  const [emailTarget, setEmailTarget] = useState(null)
  const [emailBody, setEmailBody]   = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const isSuperAdmin = SUPER_ADMINS.includes(user?.email)

  useEffect(() => { if (isSuperAdmin) fetchAll() }, [isSuperAdmin])

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
      await supabase.from('orgs').insert({
        id: orgId, name: inviteForm.orgName,
        ein: inviteForm.ein, tier: inviteForm.tier, status: 'trial',
        trial_started_at: new Date().toISOString(),
      })
      await supabase.from('admins').insert({
        org_id: orgId, fname: inviteForm.adminName.split(' ')[0],
        lname: inviteForm.adminName.split(' ').slice(1).join(' '),
        email: inviteForm.adminEmail, role: 'Head Admin', team_access: 'All Teams',
      })
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

  const mrr = orgs.filter(o => o.status === 'active').reduce((s, o) => s + (TIER_PRICES[o.tier||'Starter']||49), 0)
  const activeOrgs = orgs.filter(o => !o.status || o.status === 'active').length
  const trialOrgs  = orgs.filter(o => o.status === 'trial').length
  const totalPlayers = Object.values(playerCounts).reduce((s,c) => s + c.onRoster, 0)
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'

  const TABS = [
    { id:'overview',       label:'Overview' },
    { id:'orgs',           label:`Orgs (${orgs.length})` },
    { id:'users',          label:`Users (${orgUsers.length})` },
    { id:'superadmins',    label:'Super Admins' },
    { id:'landing-editor', label:'🌐 Landing Editor' },
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
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid var(--border2)', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'10px 20px', background:'none', border:'none',
            borderBottom: tab===t.id ? '2px solid #a855f7' : '2px solid transparent',
            color: tab===t.id ? '#a855f7' : 'var(--text3)',
            fontFamily:'var(--font-body)', fontSize:13, fontWeight:600,
            cursor:'pointer', transition:'all .15s', marginBottom:-1, whiteSpace:'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {loading && tab !== 'landing-editor' && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading…</div>}

      {/* ── LANDING EDITOR TAB ── */}
      {tab === 'landing-editor' && <LandingEditor />}

      {/* ── OVERVIEW TAB ── */}
      {!loading && tab === 'overview' && (
        <div>
          <div className="grid-4" style={{ marginBottom:24 }}>
            {[
              ['MRR', `$${mrr.toLocaleString()}`, 'sc-purple', 'Monthly recurring'],
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
            const tier   = org.tier   || 'Starter'
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
                      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:tc }}>${TIER_PRICES[tier]}</div>
                      <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>/mo</div>
                    </div>
                  </div>
                  <Badge label={tier} bg={tc+'20'} color={tc} border={tc+'40'} />
                  <Badge label={status} {...sc} />
                  <span style={{ color:'var(--text3)' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop:'1px solid var(--border2)', padding:'20px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20 }}>
                      <div>
                        <div className="section-title" style={{ fontSize:12 }}>Controls</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          <div>
                            <div className="form-label" style={{ marginBottom:4 }}>Tier</div>
                            <select className="filter-select" style={{ width:'100%', fontSize:12 }}
                              value={tier} onChange={e => updateOrg(org.id, { tier: e.target.value })}>
                              {['Rookie','Varsity','Pro'].map(t => <option key={t} value={t}>{t} — ${TIER_PRICES[t]}/yr</option>)}
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
                              onClick={() => window.open(`${window.location.origin}?impersonate=${org.id}`, '_blank')}>
                              👁 View as Org
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="section-title" style={{ fontSize:12 }}>Details</div>
                        {[['EIN', org.ein],['Season', org.season],['Website', org.website]].filter(([,v])=>v).map(([l,v])=>(
                          <div key={l} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:2 }}>{l}</div>
                            <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text2)' }}>{v}</div>
                          </div>
                        ))}
                      </div>

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

      {/* ── ADD SUPER ADMIN MODAL ── */}
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
