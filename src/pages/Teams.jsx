import { useState, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import { useTrial } from '../hooks/useTrial'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { supabase } from '../lib/supabase'

function initials(name) {
  return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
}

// Team limits per tier
const TIER_LIMITS = {
  Rookie:  1,
  Free:    1,
  Starter: 2,
  Varsity: 4,
  Pro:     999,
  Elite:   999,
}

const AGE_GROUPS = ['8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','Varsity','JV']
const TEAM_COLORS = ['#3b82f6','#ee6730','#a855f7','#4ade80','#ef4444','#f59e0b','#06b6d4','#ec4899','#5cb800','#fff']

export default function Teams() {
  const { players, orgTeams, loading, showToast } = useStore()
  const { orgId, orgData, role } = useAuth()
  const { tier } = useTrial(orgId)
  const { isPlayer, teamAccess, canSeeFinancials } = usePermissions()
  const navigate = useNavigate()

  const [active,       setActive]       = useState(null)
  const [managing,     setManaging]     = useState(false)
  const [editingTeam,  setEditingTeam]  = useState(null) // { id, name, age_group, color }
  const [addingTeam,   setAddingTeam]   = useState(false)
  const [newTeam,      setNewTeam]      = useState({ name:'', ageGroup:'15U', color:'#3b82f6' })
  const [saving,       setSaving]       = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const canManage = ['Head Admin','Coach','Team Manager'].includes(role)
  const maxTeams  = TIER_LIMITS[tier] || 1
  const atLimit   = orgTeams.length >= maxTeams

  // Set active team once orgTeams loads
  useEffect(() => {
    if (orgTeams.length > 0 && !active) {
      const first = isPlayer
        ? orgTeams.find(t => t.label === teamAccess || t.id === teamAccess)
        : orgTeams[0]
      setActive(first?.label || first?.id || null)
    }
  }, [orgTeams, isPlayer, teamAccess])

  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
      <div style={{ fontSize:13 }}>Loading teams…</div>
    </div>
  )

  if (!loading && orgTeams.length === 0) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8 }}>No teams yet</div>
      <div style={{ fontSize:13, marginBottom:20 }}>Add your first team to get started.</div>
      {canManage && (
        <button className="btn btn-primary" onClick={() => setManaging(true)}>+ Add Team</button>
      )}
    </div>
  )

  const visibleTeams = isPlayer
    ? orgTeams.filter(t => t.label === teamAccess || t.id === teamAccess)
    : orgTeams

  const team      = orgTeams.find(t => t.label === active || t.id === active)
  const teamName  = team?.label || team?.id || active || ''
  const teamColor = team?.color || '#5cb800'
  const roster    = players.filter(p => p.team === teamName && p.status === 'On Roster')
  const pending   = players.filter(p => p.team === teamName && p.status !== 'On Roster')
  const collected = roster.reduce((s,p) => s + ((p.isNew ? 385 : 320) - (p.balance||0)), 0)
  const projected = roster.reduce((s,p) => s + (p.isNew ? 385 : 320), 0)
  const fmtMoney  = n => '$' + Number(n||0).toLocaleString()

  function payBadge(p) {
    if ((p.balance||0) === 0) return <span className="badge badge-green">✓ Paid</span>
    if (p.deposit) return <span className="badge badge-yellow">${p.balance} left</span>
    return <span className="badge badge-red">No deposit</span>
  }

  // ── Save edited team ──
  async function saveEditTeam() {
    if (!editingTeam?.name?.trim()) return
    setSaving(true)
    try {
      await supabase.from('teams')
        .update({ name: editingTeam.name.trim(), age_group: editingTeam.age_group, color: editingTeam.color })
        .eq('id', editingTeam.id)
      showToast('✅ Team updated!')
      setEditingTeam(null)
      // Refresh page
      window.location.reload()
    } catch(e) {
      showToast('❌ Error updating team')
    } finally { setSaving(false) }
  }

  // ── Delete team ──
  async function deleteTeam(teamId, teamName) {
    setSaving(true)
    try {
      await supabase.from('teams').delete().eq('id', teamId)
      showToast(`🗑️ ${teamName} removed`)
      setDeleteConfirm(null)
      window.location.reload()
    } catch(e) {
      showToast('❌ Error deleting team')
    } finally { setSaving(false) }
  }

  // ── Add new team ──
  async function addTeam() {
    if (!newTeam.name.trim() || !orgId) return
    if (atLimit) { showToast(`⛔ Your ${tier} plan allows ${maxTeams} team${maxTeams===1?'':'s'}. Upgrade to add more.`); return }
    setSaving(true)
    try {
      await supabase.from('teams').insert({
        org_id: orgId, name: newTeam.name.trim(),
        age_group: newTeam.ageGroup, color: newTeam.color,
      })
      showToast('✅ Team added!')
      setAddingTeam(false)
      setNewTeam({ name:'', ageGroup:'15U', color:'#3b82f6' })
      window.location.reload()
    } catch(e) {
      showToast('❌ Error adding team')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ padding:24 }}>

      {/* Team tabs + manage button */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {visibleTeams.map(t => {
          const tName  = t.label || t.id
          const tColor = t.color || '#5cb800'
          const isActive = active === tName || active === t.id
          return (
            <button key={tName} onClick={() => { setActive(tName); setManaging(false) }} style={{
              padding:'8px 20px', borderRadius:'var(--radius-sm)',
              border:`1px solid ${isActive ? tColor : 'var(--border2)'}`,
              background: isActive ? tColor+'18' : 'var(--bg3)',
              color: isActive ? tColor : 'var(--text2)',
              fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s',
              borderLeft:`3px solid ${tColor}`,
            }}>
              {tName}
              <span style={{ marginLeft:8, fontFamily:'var(--font-mono)', fontSize:11, opacity:.7 }}>
                {players.filter(p => p.team === tName && p.status === 'On Roster').length}
              </span>
            </button>
          )
        })}
        {canManage && !isPlayer && (
          <button onClick={() => setManaging(!managing)} style={{
            padding:'8px 16px', borderRadius:'var(--radius-sm)',
            border:`1px solid ${managing ? 'var(--np-green2)' : 'var(--border2)'}`,
            background: managing ? 'rgba(92,184,0,.1)' : 'var(--bg3)',
            color: managing ? 'var(--np-green2)' : 'var(--text2)',
            fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            ⚙️ Manage Teams
          </button>
        )}
      </div>

      {/* ── MANAGE TEAMS PANEL ── */}
      {managing && canManage && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18 }}>Manage Teams</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, fontFamily:'var(--font-mono)' }}>
                {orgTeams.length} / {maxTeams === 999 ? '∞' : maxTeams} teams · {tier} plan
                {atLimit && maxTeams !== 999 && (
                  <span style={{ color:'var(--orange)', marginLeft:8 }}>
                    · <a href="#pricing" style={{ color:'var(--orange)' }}>Upgrade to add more</a>
                  </span>
                )}
              </div>
            </div>
            {!atLimit && (
              <button className="btn btn-primary btn-sm" onClick={() => setAddingTeam(!addingTeam)}>
                + Add Team
              </button>
            )}
          </div>

          {/* Add team form */}
          {addingTeam && (
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:12 }}>New Team</div>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <input className="form-input" placeholder="Team name (e.g. Surge)" style={{ flex:1, minWidth:160 }}
                  value={newTeam.name} onChange={e => setNewTeam(t=>({...t,name:e.target.value}))} autoFocus/>
                <select className="form-select" style={{ width:90 }}
                  value={newTeam.ageGroup} onChange={e => setNewTeam(t=>({...t,ageGroup:e.target.value}))}>
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <div style={{ display:'flex', gap:4 }}>
                  {TEAM_COLORS.map(c => (
                    <button key={c} onClick={() => setNewTeam(t=>({...t,color:c}))}
                      style={{ width:18, height:18, borderRadius:'50%', background:c, border:'none',
                        cursor:'pointer', outline: newTeam.color===c?`2px solid ${c}`:'none', outlineOffset:2 }}/>
                  ))}
                </div>
                <button className="btn btn-primary btn-sm" disabled={saving || !newTeam.name.trim()} onClick={addTeam}>
                  {saving ? '…' : 'Add'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAddingTeam(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Team list */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {orgTeams.map(t => {
              const tName  = t.label || t.id
              const tColor = t.color || '#5cb800'
              const isEditing = editingTeam?.id === t.dbId || editingTeam?.id === t.id
              const playerCount = players.filter(p => p.team === tName).length

              return (
                <div key={tName} style={{
                  background:'var(--bg3)', border:`1px solid ${isEditing ? tColor+'50' : 'var(--border)'}`,
                  borderRadius:8, padding:'12px 14px',
                }}>
                  {isEditing ? (
                    <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                      <input className="form-input" style={{ flex:1, minWidth:140 }}
                        value={editingTeam.name}
                        onChange={e => setEditingTeam(et=>({...et,name:e.target.value}))}
                        autoFocus/>
                      <select className="form-select" style={{ width:90 }}
                        value={editingTeam.age_group || '15U'}
                        onChange={e => setEditingTeam(et=>({...et,age_group:e.target.value}))}>
                        {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <div style={{ display:'flex', gap:4 }}>
                        {TEAM_COLORS.map(c => (
                          <button key={c} onClick={() => setEditingTeam(et=>({...et,color:c}))}
                            style={{ width:18, height:18, borderRadius:'50%', background:c, border:'none',
                              cursor:'pointer', outline: editingTeam.color===c?`2px solid ${c}`:'none', outlineOffset:2 }}/>
                        ))}
                      </div>
                      <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveEditTeam}>
                        {saving ? '…' : '💾 Save'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingTeam(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:tColor, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <span style={{ fontWeight:600, fontSize:13 }}>{tName}</span>
                        {t.age && <span style={{ fontSize:11, color:'var(--text3)', marginLeft:8 }}>{t.age}</span>}
                      </div>
                      <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                        {playerCount} player{playerCount!==1?'s':''}
                      </span>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingTeam({
                        id: t.dbId || t.id, name: tName, age_group: t.age || '15U', color: tColor,
                      })}>✏️ Edit</button>
                      {deleteConfirm === tName ? (
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <span style={{ fontSize:11, color:'var(--red)' }}>Delete {tName}?</span>
                          <button className="btn btn-sm" style={{ background:'var(--red)', color:'#fff', border:'none' }}
                            disabled={saving} onClick={() => deleteTeam(t.dbId || t.id, tName)}>Yes, delete</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)', background:'transparent' }}
                          onClick={() => setDeleteConfirm(tName)}>🗑️</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {atLimit && maxTeams !== 999 && (
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:8, fontSize:12, color:'var(--orange)' }}>
              ⚠️ You've reached the {maxTeams}-team limit on the {tier} plan. Upgrade to Varsity (4 teams) or Pro (unlimited) to add more.
            </div>
          )}
        </div>
      )}

      {/* Team header */}
      {team && (
        <div style={{
          background:`linear-gradient(135deg, ${teamColor}12, ${teamColor}06)`,
          border:`1px solid ${teamColor}40`,
          borderRadius:'var(--radius)', padding:'20px 24px', marginBottom:20,
          display:'flex', alignItems:'center', gap:24, flexWrap:'wrap',
        }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:42, color:teamColor, lineHeight:1 }}>{teamName}</div>
            {team?.age && <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>{team.age}</div>}
          </div>
          {[
            ['Players', roster.length, teamColor],
            ...(canSeeFinancials ? [
              ['Collected', fmtMoney(collected), 'var(--np-green2)'],
              ['Projected', fmtMoney(projected), 'var(--text2)'],
              ['Outstanding', fmtMoney(projected - collected), 'var(--red)'],
            ] : []),
          ].map(([lbl, val, color]) => (
            <div key={lbl} style={{ borderLeft:'1px solid var(--border2)', paddingLeft:20 }}>
              <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:2, color:'var(--text3)', fontWeight:700, marginBottom:4 }}>{lbl}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, color, lineHeight:1 }}>{val}</div>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }} onClick={() => navigate('/players')}>
            Manage Players
          </button>
        </div>
      )}

      {/* Roster table */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title">Roster — {roster.length} players</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th><th>#</th><th>Age / Group</th>
                <th>Grad Year</th>
                {!isPlayer && <th>Parent</th>}
                {!isPlayer && <th>Phone</th>}
                {canSeeFinancials && <th>Payment</th>}
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:28 }}>
                  No players on roster — add players in the Players section
                </td></tr>
              )}
              {roster.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="avatar" style={{ background:teamColor+'25', color:teamColor }}>{initials(p.name)}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                        {p.colleges && <div style={{ fontSize:11, color:'var(--text3)' }}>{p.colleges}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="td-mono" style={{ color:'var(--text3)' }}>#{p.num||'—'}</td>
                  <td className="td-muted">{[p.age, p.ageGroup].filter(Boolean).join(' / ')||'—'}</td>
                  <td className="td-muted">{p.year||'—'}</td>
                  {!isPlayer && <td style={{ fontSize:12 }}>{p.parent||'—'}</td>}
                  {!isPlayer && <td className="td-mono" style={{ fontSize:11 }}>{p.phone||'—'}</td>}
                  {canSeeFinancials && <td>{payBadge(p)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color:'var(--text3)' }}>Pending — {pending.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Player</th><th>Status</th><th>Parent</th><th>Phone</th></tr></thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="avatar" style={{ opacity:.6, background:teamColor+'20', color:teamColor }}>{initials(p.name)}</div>
                        <span style={{ fontSize:13, color:'var(--text2)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{p.status}</span></td>
                    <td style={{ fontSize:12, color:'var(--text3)' }}>{p.parent||'—'}</td>
                    <td className="td-mono" style={{ fontSize:11, color:'var(--text3)' }}>{p.phone||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
