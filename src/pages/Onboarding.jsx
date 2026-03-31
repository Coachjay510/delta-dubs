import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STEPS = ['Your Org', 'Your Teams', 'Import Roster', 'You']

export default function Onboarding() {
  const { user, completeOnboarding } = useAuth()
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const fileInputRef = useRef(null)

  // Step 0
  const [orgName,  setOrgName]  = useState('')
  const [orgCity,  setOrgCity]  = useState('')
  const [orgState, setOrgState] = useState('')
  const [orgType,  setOrgType]  = useState('AAU')

  // Step 1
  const [teams, setTeams] = useState([{ name:'', ageGroup:'15U', color:'#3b82f6' }])

  // Step 2 — roster import
  const [rosterPlayers, setRosterPlayers] = useState([])
  const [importError,   setImportError]   = useState(null)
  const [importSkip,    setImportSkip]    = useState(false)

  // Step 3
  const [adminName,  setAdminName]  = useState(user?.user_metadata?.full_name || '')
  const [adminTitle, setAdminTitle] = useState('Head Coach')

  const AGE_GROUPS  = ['8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','Varsity','JV']
  const TEAM_COLORS = ['#3b82f6','#ee6730','#a855f7','#4ade80','#ef4444','#f59e0b','#06b6d4','#ec4899']
  const ORG_TYPES   = ['AAU','High School','Club','Travel']

  function addTeam() {
    if (teams.length >= 8) return
    setTeams([...teams, { name:'', ageGroup:'15U', color: TEAM_COLORS[teams.length % TEAM_COLORS.length] }])
  }
  function removeTeam(i) { setTeams(teams.filter((_,idx) => idx !== i)) }
  function updateTeam(i, field, val) {
    setTeams(teams.map((t,idx) => idx===i ? {...t,[field]:val} : t))
  }

  // ── CSV / Spreadsheet import ──
  function handleFileImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) { setImportError('File appears empty'); return }

        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g,''))
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''))
          const obj = {}
          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
          return obj
        }).filter(r => r.name || r.firstname || r.player)

        // Map common column names
        const mapped = rows.map(r => ({
          name:   r.name || `${r.firstname||r.first||''} ${r.lastname||r.last||''}`.trim() || r.player || 'Unknown',
          team:   r.team || r.teamname || '',
          num:    r.num || r.number || r.jersey || '',
          ageGroup: r.agegroup || r.age || r.division || '15U',
          email:  r.email || r.parentemail || '',
          phone:  r.phone || r.parentphone || '',
          status: 'On Roster',
        })).filter(r => r.name && r.name !== 'Unknown')

        setRosterPlayers(mapped)
      } catch(err) {
        setImportError('Could not parse file. Make sure it\'s a CSV with headers.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function canNext() {
    if (step === 0) return orgName.trim().length >= 2
    if (step === 1) return teams.some(t => t.name.trim())
    if (step === 2) return true // roster import is optional
    if (step === 3) return adminName.trim().length >= 2
    return false
  }

  async function handleFinish() {
    setLoading(true); setError(null)
    try {
      const orgId = orgName.toLowerCase()
        .replace(/[^a-z0-9\s]/g,'').trim().replace(/\s+/g,'-').slice(0,40)
        + '-' + Date.now().toString(36)

      // 1. Create org
      const { error: orgErr } = await supabase.from('orgs').insert({
        id: orgId, name: orgName.trim(),
        city: orgCity.trim() || null, state: orgState.trim() || null,
        type: orgType, status: 'trial', tier: 'Pro',
        trial_started_at: new Date().toISOString(),
      })
      if (orgErr) throw orgErr

      // 2. Create teams
      const validTeams = teams.filter(t => t.name.trim())
      if (validTeams.length > 0) {
        await supabase.from('teams').insert(
          validTeams.map(t => ({ org_id: orgId, name: t.name.trim(), age_group: t.ageGroup, color: t.color }))
        )
      }

      // 3. Import roster players
      if (rosterPlayers.length > 0 && !importSkip) {
        const playerRows = rosterPlayers.map(p => ({
          org_id: orgId, name: p.name, team: p.team || (validTeams[0]?.name || ''),
          num: p.num || null, age_group: p.ageGroup || '15U',
          email: p.email || null, phone: p.phone || null,
          status: 'On Roster', balance: 0, is_new: false,
        }))
        await supabase.from('players').insert(playerRows)
      }

      // 4. Create admin record
      const nameParts = adminName.trim().split(' ')
      await supabase.from('admins').insert({
        org_id: orgId, fname: nameParts[0], lname: nameParts.slice(1).join(' ') || '',
        email: user.email, role: 'Head Admin', team_access: 'All Teams', title: adminTitle,
      })

      // 5. Create org_users record
      await supabase.from('org_users').insert({
        org_id: orgId, user_id: user.id, email: user.email,
        role: 'Head Admin', team_access: 'All Teams',
      })

      await completeOnboarding(orgId)
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const stepBar = (
    <div style={{ display:'flex', gap:0, marginBottom:32 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ flex:1, textAlign:'center' }}>
          <div style={{ height:3, background: i<=step?'var(--green)':'var(--border2)',
            marginBottom:8, transition:'background .3s',
            borderRadius: i===0?'2px 0 0 2px':i===STEPS.length-1?'0 2px 2px 0':0 }}/>
          <div style={{ fontSize:10, fontFamily:'var(--font-m)', letterSpacing:1,
            color: i===step?'var(--green2)':'var(--text3)', textTransform:'uppercase' }}>
            {i < step ? '✓ ' : ''}{s}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'24px', fontFamily:'var(--font-b)' }}>
      <div style={{ width:'100%', maxWidth:560 }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--font-d)', fontSize:32, color:'var(--green2)', letterSpacing:3 }}>NP</div>
          <div style={{ fontFamily:'var(--font-m)', fontSize:9, color:'var(--text3)', letterSpacing:3, textTransform:'uppercase' }}>
            Next Play Sports — Setup Wizard
          </div>
        </div>

        {stepBar}

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:14, padding:32 }}>

          {/* ── STEP 0: Org Info ── */}
          {step === 0 && (
            <div>
              <div style={{ fontFamily:'var(--font-d)', fontSize:24, marginBottom:6 }}>Set up your organization</div>
              <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>
                You'll be the Head Admin. Invite coaches and staff after setup.
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:6 }}>Org Name *</label>
                <input className="form-input" placeholder="e.g. Bay Area Elite, Delta Dubs AAU"
                  value={orgName} onChange={e => setOrgName(e.target.value)} autoFocus/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:12, marginBottom:16 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:6 }}>City</label>
                  <input className="form-input" placeholder="Antioch" value={orgCity} onChange={e => setOrgCity(e.target.value)}/>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:6 }}>State</label>
                  <input className="form-input" placeholder="CA" maxLength={2} value={orgState} onChange={e => setOrgState(e.target.value.toUpperCase())}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:8 }}>Organization Type</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {ORG_TYPES.map(t => (
                    <button key={t} onClick={() => setOrgType(t)}
                      style={{ padding:'8px 18px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer',
                        border:`1px solid ${orgType===t?'var(--green)':'var(--border2)'}`,
                        background: orgType===t?'rgba(92,184,0,.12)':'var(--bg3)',
                        color: orgType===t?'var(--green2)':'var(--text2)' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Teams ── */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily:'var(--font-d)', fontSize:24, marginBottom:6 }}>Add your teams</div>
              <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>Add at least one team. You can add more later.</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                {teams.map((team, i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'center',
                    background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                      {TEAM_COLORS.map(c => (
                        <button key={c} onClick={() => updateTeam(i,'color',c)}
                          style={{ width:14, height:14, borderRadius:'50%', background:c, border:'none',
                            cursor:'pointer', outline: team.color===c?`2px solid ${c}`:'none', outlineOffset:2 }}/>
                      ))}
                    </div>
                    <input className="form-input" placeholder="Team name (e.g. Drive)"
                      value={team.name} onChange={e => updateTeam(i,'name',e.target.value)} style={{ flex:1 }}/>
                    <select className="form-select" value={team.ageGroup}
                      onChange={e => updateTeam(i,'ageGroup',e.target.value)} style={{ width:80 }}>
                      {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {teams.length > 1 && (
                      <button onClick={() => removeTeam(i)}
                        style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              {teams.length < 8 && (
                <button className="btn btn-ghost btn-sm" onClick={addTeam} style={{ width:'100%' }}>+ Add another team</button>
              )}
            </div>
          )}

          {/* ── STEP 2: Roster Import ── */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily:'var(--font-d)', fontSize:24, marginBottom:6 }}>Import your roster</div>
              <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>
                Upload a CSV or spreadsheet export. You can also skip and add players manually.
              </div>

              <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={handleFileImport}/>

              {rosterPlayers.length === 0 ? (
                <div>
                  <div style={{ border:'2px dashed var(--border2)', borderRadius:10, padding:'32px 24px',
                    textAlign:'center', marginBottom:16, cursor:'pointer' }}
                    onClick={() => fileInputRef.current?.click()}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
                    <div style={{ fontWeight:600, marginBottom:4 }}>Drop a CSV file or click to browse</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>Supports CSV exports from Google Sheets, Excel, or any spreadsheet</div>
                  </div>
                  <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Expected columns (any order)</div>
                    <div style={{ fontFamily:'var(--font-m)', fontSize:11, color:'var(--green2)', lineHeight:1.8 }}>
                      name, team, num (jersey), ageGroup, email, phone
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
                      Only "name" is required. Everything else is optional.
                    </div>
                  </div>
                  {importError && (
                    <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
                      borderRadius:6, padding:'10px 14px', fontSize:12, color:'#ef4444' }}>
                      {importError}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ background:'rgba(92,184,0,.08)', border:'1px solid rgba(92,184,0,.25)',
                    borderRadius:8, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>✓</span>
                    <div>
                      <div style={{ fontWeight:600, color:'var(--green2)' }}>{rosterPlayers.length} players ready to import</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>They'll be added to your org when you finish setup</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }}
                      onClick={() => setRosterPlayers([])}>Clear</button>
                  </div>
                  <div style={{ maxHeight:200, overflowY:'auto', border:'1px solid var(--border)', borderRadius:8 }}>
                    {rosterPlayers.slice(0,20).map((p, i) => (
                      <div key={i} style={{ display:'flex', gap:12, padding:'8px 12px',
                        borderBottom:'1px solid var(--border)', fontSize:13,
                        background: i%2===0?'var(--bg2)':'var(--bg3)' }}>
                        <span style={{ fontWeight:600, flex:1 }}>{p.name}</span>
                        <span style={{ color:'var(--text3)' }}>{p.team || '—'}</span>
                        <span style={{ color:'var(--text3)', fontFamily:'var(--font-m)', fontSize:11 }}>#{p.num||'—'}</span>
                      </div>
                    ))}
                    {rosterPlayers.length > 20 && (
                      <div style={{ padding:'8px 12px', fontSize:12, color:'var(--text3)', textAlign:'center' }}>
                        +{rosterPlayers.length - 20} more players…
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Admin Info ── */}
          {step === 3 && (
            <div>
              <div style={{ fontFamily:'var(--font-d)', fontSize:24, marginBottom:6 }}>Almost done!</div>
              <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>
                Signing in as <strong style={{ color:'var(--text)' }}>{user?.email}</strong>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:6 }}>Your Name *</label>
                <input className="form-input" placeholder="First Last" value={adminName} onChange={e => setAdminName(e.target.value)} autoFocus/>
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:8 }}>Your Title</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['Head Coach','Director','Program Manager','Owner'].map(t => (
                    <button key={t} onClick={() => setAdminTitle(t)}
                      style={{ padding:'7px 14px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer',
                        border:`1px solid ${adminTitle===t?'var(--green)':'var(--border2)'}`,
                        background: adminTitle===t?'rgba(92,184,0,.12)':'var(--bg3)',
                        color: adminTitle===t?'var(--green2)':'var(--text2)' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'14px 16px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', marginBottom:10, fontFamily:'var(--font-m)' }}>Summary</div>
                <div style={{ fontSize:13, color:'var(--text2)', lineHeight:2.2 }}>
                  <div><span style={{ color:'var(--text3)' }}>Org:</span> <strong style={{ color:'var(--text)' }}>{orgName}</strong>{orgCity && ` · ${orgCity}, ${orgState}`}</div>
                  <div><span style={{ color:'var(--text3)' }}>Type:</span> {orgType}</div>
                  <div><span style={{ color:'var(--text3)' }}>Teams:</span> {teams.filter(t=>t.name).map(t=>t.name).join(', ')||'None'}</div>
                  <div><span style={{ color:'var(--text3)' }}>Roster:</span> {rosterPlayers.length > 0 ? `${rosterPlayers.length} players from import` : 'Add manually after setup'}</div>
                  <div><span style={{ color:'var(--text3)' }}>Plan:</span> <span style={{ color:'var(--green2)' }}>Pro — 14-day free trial</span></div>
                </div>
              </div>
              {error && (
                <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
                  borderRadius:6, padding:'10px 14px', fontSize:12, color:'#ef4444', marginTop:12 }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {step > 0 && (
            <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setStep(s => s-1)} disabled={loading}>← Back</button>
          )}
          {step === 2 && rosterPlayers.length === 0 && (
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setStep(s => s+1)}>Skip →</button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" style={{ flex:2 }} disabled={!canNext()} onClick={() => setStep(s => s+1)}>Next →</button>
          ) : (
            <button className="btn btn-primary" style={{ flex:2, fontSize:15 }}
              disabled={!canNext() || loading} onClick={handleFinish}>
              {loading ? 'Setting up your org…' : '🏀 Launch My Dashboard'}
            </button>
          )}
        </div>
        <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'var(--text3)' }}>
          14-day free trial · No credit card required
        </div>
      </div>
    </div>
  )
}
