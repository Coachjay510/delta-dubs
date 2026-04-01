import { useState, useMemo } from 'react'
import { useStore, RATES } from '../hooks/useStore'
import { usePermissions } from '../hooks/usePermissions'

const BLANK = {
  name:'', team:'Drive', status:'On Roster', isNew:false, balance:320,
  num:'', age:'', dob:'', ageGroup:'', year:'', gender:'Male',
  jsize:'', ssize:'', parent:'', email:'', phone:'',
  playerPhone:'', playerEmail:'', drive:'', colleges:'', notes:'',
}

const AV = { Drive:'av-drive', Energy:'av-energy', Passion:'av-passion', Power:'av-power' }

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Players() {
  const { players, orgTeams, addPlayer, updatePlayer, deletePlayer } = useStore()
  const [search, setSearch]     = useState('')
  const [teamF, setTeamF]       = useState('')
  const [statusF, setStatusF]   = useState('')
  const [genderF, setGenderF]   = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm]           = useState(BLANK)
  const [editId, setEditId]       = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return players.filter(p =>
      (p.name || '').toLowerCase().includes(q) &&
      (!teamF   || p.team   === teamF) &&
      (!statusF || p.status === statusF) &&
      (!genderF || p.gender === genderF)
    )
  }, [players, search, teamF, statusF, genderF])

  function openAdd() {
    setForm({ ...BLANK, balance: RATES.returning })
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(p) {
    setForm({ ...BLANK, ...p })
    setEditId(p.id)
    setShowModal(true)
    setShowDetail(null)
  }

  function setField(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'isNew' && !editId) next.balance = v ? RATES.newPlayer : RATES.returning
      return next
    })
  }

  function save() {
    const data = { ...form, balance: parseFloat(form.balance) || 0 }
    if (editId) updatePlayer(editId, data)
    else addPlayer(data)
    setShowModal(false)
  }

  function payBadge(p) {
    if ((p.balance || 0) === 0) return <span className="badge badge-green">✓ Paid</span>
    if (p.deposit) return <span className="badge badge-yellow">${p.balance} left</span>
    return <span className="badge badge-red">No deposit</span>
  }

  function statusBadge(s) {
    if (s === 'On Roster') return <span className="badge badge-green">On Roster</span>
    if (s === 'Pending')   return <span className="badge badge-yellow">Pending</span>
    return <span className="badge badge-gray">Not on Roster</span>
  }

  const inp = (k, label, type='text', placeholder='') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} placeholder={placeholder}
        value={form[k] || ''} onChange={e => setField(k, e.target.value)} />
    </div>
  )

  const sel = (k, label, opts) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-select" value={form[k] || ''} onChange={e => setField(k, e.target.value)}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>

      {/* Filter bar */}
      <div className="filter-bar">
        <input className="search-input" placeholder="🔍 Search players…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={teamF} onChange={e => setTeamF(e.target.value)}>
          <option value="">All Teams</option>
          {orgTeams.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          <option>On Roster</option><option>Not on Roster</option><option>Pending</option>
        </select>
        <select className="filter-select" value={genderF} onChange={e => setGenderF(e.target.value)}>
          <option value="">All Genders</option>
          <option>Male</option><option>Female</option>
        </select>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={openAdd}>+ Add Player</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th><th>Team</th><th>Status</th><th>#</th>
                <th>Age</th><th>Parent</th><th>Phone</th><th>Payment</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  {players.length === 0 ? 'No players yet — click + Add Player to get started' : 'No players match your filters'}
                </td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => setShowDetail(p)}>
                      <div className={`avatar ${AV[p.team] || 'av-drive'}`}>{initials(p.name)}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                        {p.playerEmail && <div style={{ fontSize:11, color:'var(--text3)' }}>{p.playerEmail}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize:11, fontWeight:700, color: orgTeams.find(t=>t.id===p.team)?.color || 'var(--text2)' }}>
                      {p.team}
                    </span>
                  </td>
                  <td>{statusBadge(p.status)}</td>
                  <td className="td-mono" style={{ color:'var(--text3)' }}>#{p.num || '—'}</td>
                  <td className="td-muted">{p.age || '—'}</td>
                  <td style={{ fontSize:12 }}>{p.parent || '—'}</td>
                  <td className="td-mono" style={{ fontSize:11 }}>{p.phone || '—'}</td>
                  <td>{payBadge(p)}</td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn-ghost btn-sm" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }}
                        onClick={() => { if (window.confirm(`Remove ${p.name}?`)) deletePlayer(p.id) }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ width: 680 }}>
            <div className="modal-header">
              <div className="modal-title">{editId ? '✏️ Edit Player' : '➕ Add Player'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              <div style={{ marginBottom: 14, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--np-green2)', letterSpacing:'2px' }}>
                // IDENTITY
              </div>
              <div className="form-grid" style={{ marginBottom:14 }}>
                {inp('name', 'Full Name', 'text', 'First Last')}
                {sel('team', 'Team', orgTeams.map(t => t.id))}
                {sel('status', 'Status', ['On Roster','Pending','Not on Roster'])}
                {sel('gender', 'Gender', ['Male','Female'])}
                {inp('num', 'Jersey #', 'text', '00')}
                {inp('age', 'Age', 'text', '15')}
                {inp('dob', 'Date of Birth', 'date')}
                {inp('ageGroup', 'Age Group', 'text', '15u')}
                {inp('year', 'Grad Year', 'text', '2028')}
                {inp('jsize', 'Jersey Size', 'text', 'L')}
                {inp('ssize', 'Shorts Size', 'text', 'L')}
              </div>

              <div style={{ marginBottom: 14, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--np-green2)', letterSpacing:'2px' }}>
                // CONTACT
              </div>
              <div className="form-grid" style={{ marginBottom:14 }}>
                {inp('parent', 'Parent / Guardian', 'text', 'First Last')}
                {inp('email', 'Parent Email')}
                {inp('phone', 'Parent Phone', 'tel', '(925) 555-0100')}
                {inp('playerPhone', 'Player Phone', 'tel')}
                {inp('playerEmail', 'Player Email')}
                {inp('drive', 'Google Drive Link')}
              </div>

              <div style={{ marginBottom: 14, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--np-green2)', letterSpacing:'2px' }}>
                // FEES
              </div>
              <div className="form-grid" style={{ marginBottom:14 }}>
                <div className="form-group">
                  <label className="form-label">Player Type</label>
                  <select className="form-select" value={form.isNew ? 'new' : 'returning'}
                    onChange={e => setField('isNew', e.target.value === 'new')}>
                    <option value="returning">Returning (${RATES.returning})</option>
                    <option value="new">New Player (${RATES.newPlayer})</option>
                  </select>
                </div>
                {inp('balance', 'Balance Remaining ($)', 'number', '0')}
              </div>

              <div style={{ marginBottom: 14, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--np-green2)', letterSpacing:'2px' }}>
                // RECRUITING
              </div>
              <div className="form-grid">
                {inp('colleges', 'College Interests', 'text', 'UCLA, USC…')}
                <div className="form-group full">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes || ''} onChange={e => setField('notes', e.target.value)} placeholder="Any notes about this player…" />
                </div>
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Save Changes' : 'Add Player'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="modal" style={{ width: 680 }}>
            <div className="modal-header">
              <div className="modal-title">Player Profile</div>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
                <div className={`avatar ${AV[showDetail.team] || 'av-drive'}`} style={{ width:58, height:58, fontSize:22 }}>
                  {initials(showDetail.name)}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:26, letterSpacing:.5 }}>{showDetail.name}</div>
                  <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>
                    {showDetail.team} · #{showDetail.num || '—'} · {showDetail.ageGroup || showDetail.age || '—'}
                  </div>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  {payBadge(showDetail)}
                  {statusBadge(showDetail.status)}
                </div>
              </div>

              {/* Stat pills */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>
                {[
                  ['GP', showDetail.games?.length || 0],
                  ['PPG', showDetail.games?.length ? (showDetail.games.reduce((s,g)=>s+(g.pts||0),0)/showDetail.games.length).toFixed(1) : '—'],
                  ['RPG', showDetail.games?.length ? (showDetail.games.reduce((s,g)=>s+(g.reb||0),0)/showDetail.games.length).toFixed(1) : '—'],
                  ['APG', showDetail.games?.length ? (showDetail.games.reduce((s,g)=>s+(g.ast||0),0)/showDetail.games.length).toFixed(1) : '—'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{
                    display:'inline-flex', flexDirection:'column', alignItems:'center',
                    background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:9,
                    padding:'9px 16px', minWidth:66,
                  }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:24, color:'var(--orange)', lineHeight:1 }}>{val}</span>
                    <span style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>{lbl}</span>
                  </div>
                ))}
              </div>

              {/* Info grid */}
              <div className="grid-2" style={{ gap:16 }}>
                {[
                  ['Parent', showDetail.parent],
                  ['Parent Email', showDetail.email],
                  ['Parent Phone', showDetail.phone],
                  ['Player Phone', showDetail.playerPhone],
                  ['Player Email', showDetail.playerEmail],
                  ['DOB', showDetail.dob],
                  ['Grad Year', showDetail.year],
                  ['Jersey Size', showDetail.jsize],
                  ['Shorts Size', showDetail.ssize],
                  ['College Interests', showDetail.colleges],
                ].filter(([,v]) => v).map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', fontWeight:700, marginBottom:2 }}>{lbl}</div>
                    <div style={{ fontSize:13 }}>{val}</div>
                  </div>
                ))}
              </div>

              {showDetail.notes && (
                <div style={{ marginTop:16, padding:12, background:'var(--bg3)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--text2)' }}>
                  {showDetail.notes}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => openEdit(showDetail)}>Edit Player</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
