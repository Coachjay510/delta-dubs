import { useState, useEffect, useRef, useMemo } from 'react'
import { supabasePlayers } from '../lib/supabasePlayers'
import { useAuth } from '../hooks/useAuth'

const SUPER_ADMINS = ['nextplaysports.ca@gmail.com']
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

const BLANK_PLAYER = {
  name: '', position: '', jersey_number: '', grad_year: '',
  school_name: '', np_team_name: '', bio: '',
}
const BLANK_GAME = {
  game_date: '', opponent: '', source: 'aau',
  pts: '', reb: '', ast: '', stl: '', blk: '', turnovers: '',
  fg_made: '', fg_att: '', fg3_made: '', fg3_att: '', ft_made: '', ft_att: '',
}

function calcOvr(statsArr) {
  if (!statsArr?.length) return null
  const s = statsArr.find(x => x.source === 'aau' || !x.source) ?? statsArr[0]
  const ppg = +s.ppg || 0, rpg = +s.rpg || 0, apg = +s.apg || 0
  const spg = +s.spg || 0, bpg = +s.bpg || 0
  const fg  = +s.fg_pct || 0, ft = +s.ft_pct || 0, tp = +s.fg3_pct || 0
  const w   = (v, mx, wt) => Math.min(v / mx, 1) * wt
  const raw = w(ppg,35,.32) + w(rpg,15,.14) + w(apg,12,.13) + w(spg+bpg,6,.1)
            + w(fg,.65,.12) + w(ft,.95,.09) + w(tp,.45,.1)
  return Math.round(60 + raw * 39)
}

function getOvrColor(ovr) {
  if (!ovr) return 'var(--text3)'
  if (ovr >= 90) return '#f59e0b'
  if (ovr >= 80) return 'var(--np-green2)'
  if (ovr >= 70) return 'var(--blue)'
  return 'var(--text2)'
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: '▣',  label: 'Dashboard' },
  { id: 'players',   icon: '◉',  label: 'Players' },
  { id: 'orgs',      icon: '⬡',  label: 'Organizations' },
  { id: 'teams',     icon: '◈',  label: 'Teams' },
  { id: 'gamelogs',  icon: '◎',  label: 'Game Logs' },
]

// ─────────────────────────────────────────────────────────────
// Shared style helpers
// ─────────────────────────────────────────────────────────────
const TH = {
  padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 9,
  letterSpacing: 1.5, color: 'var(--text3)', textTransform: 'uppercase',
  whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
}
const TD = { padding: '10px 12px', verticalAlign: 'middle' }

function chip(active) {
  return {
    padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    border: `1px solid ${active ? 'var(--np-green)' : 'var(--border)'}`,
    background: active ? 'var(--np-green)' : 'var(--bg3)',
    color: active ? '#000' : 'var(--text2)',
    cursor: 'pointer', transition: 'all .12s',
  }
}

// ─────────────────────────────────────────────────────────────
// Main export — access guard
// ─────────────────────────────────────────────────────────────
export default function NpPlayersAdmin() {
  const { user } = useAuth()
  if (!SUPER_ADMINS.includes(user?.email ?? '')) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--red)', marginBottom: 12 }}>ACCESS DENIED</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Super admin access required.</div>
      </div>
    )
  }
  return <AdminInner />
}

// ─────────────────────────────────────────────────────────────
// Inner admin — all state lives here
// ─────────────────────────────────────────────────────────────
function AdminInner() {
  const [section,     setSection]     = useState('players')
  const [players,     setPlayers]     = useState([])
  const [orgs,        setOrgs]        = useState([])
  const [teams,       setTeams]       = useState([])
  const [gameLogs,    setGameLogs]    = useState([])
  const [loading,     setLoading]     = useState(true)

  // players view
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState('all')
  const [sortKey,     setSortKey]     = useState('name')
  const [sortDir,     setSortDir]     = useState('asc')
  const [selected,    setSelected]    = useState(new Set())

  // edit/add player modal
  const [editPlayer,  setEditPlayer]  = useState(null)
  const [draft,       setDraft]       = useState(BLANK_PLAYER)
  const [saving,      setSaving]      = useState(false)
  const [photoFile,   setPhotoFile]   = useState(null)
  const photoRef = useRef()

  // add game modal
  const [gameTarget,  setGameTarget]  = useState(null)
  const [gameDraft,   setGameDraft]   = useState(BLANK_GAME)
  const [savingGame,  setSavingGame]  = useState(false)

  // org expand
  const [expandedOrg, setExpandedOrg] = useState(null)

  // stats view
  const [editStats,   setEditStats]   = useState(null)   // player for stats editing
  const [statsDraft,  setStatsDraft]  = useState([])
  const [savingStats, setSavingStats] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [pRes, oRes, tRes, gRes] = await Promise.all([
      supabasePlayers
        .from('players')
        .select('id, name, position, jersey_number, grad_year, school_name, np_team_name, photo_url, bio, stats(*)')
        .not('name', 'is', null)
        .order('name'),
      supabasePlayers.from('bt_organizations').select('*').order('org_name'),
      supabasePlayers.from('bt_master_teams')
        .select('id, display_name, age_group, gender, ranking_division_key, organization_id, grad_year, contact_name, contact_email, logo_url')
        .order('display_name'),
      supabasePlayers
        .from('player_game_logs')
        .select('*, players(name, photo_url)')
        .order('game_date', { ascending: false })
        .limit(200),
    ])
    setPlayers(pRes.data ?? [])
    setOrgs(oRes.data ?? [])
    setTeams(tRes.data ?? [])
    setGameLogs(gRes.data ?? [])
    setLoading(false)
  }

  // Enrich players with computed OVR
  const enriched = useMemo(() =>
    players.map(p => ({ ...p, _ovr: calcOvr(p.stats) })), [players])

  // Filter + sort players
  const filtered = useMemo(() => {
    let list = enriched
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.np_team_name ?? '').toLowerCase().includes(q) ||
        (p.school_name ?? '').toLowerCase().includes(q)
      )
    }
    if (filter === 'has_photo') list = list.filter(p => p.photo_url)
    if (filter === 'no_stats')  list = list.filter(p => !p.stats?.length)
    if (filter === 'ranked')    list = list.filter(p => p._ovr && p._ovr > 60)
    return [...list].sort((a, b) => {
      const av = sortKey === '_ovr' ? (a._ovr ?? 0) : (a[sortKey] ?? '')
      const bv = sortKey === '_ovr' ? (b._ovr ?? 0) : (b[sortKey] ?? '')
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [enriched, search, filter, sortKey, sortDir])

  function handleSort(key) {
    setSortKey(k => { if (k === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return k } setSortDir('asc'); return key })
  }

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))
  }

  function openEdit(player) {
    setDraft({
      name: player.name ?? '', position: player.position ?? '',
      jersey_number: player.jersey_number ?? '', grad_year: player.grad_year ?? '',
      school_name: player.school_name ?? '', np_team_name: player.np_team_name ?? '',
      bio: player.bio ?? '',
    })
    setPhotoFile(null)
    setEditPlayer(player)
  }
  function openNew() { setDraft(BLANK_PLAYER); setPhotoFile(null); setEditPlayer('new') }

  async function savePlayer() {
    setSaving(true)
    const payload = {
      name:          draft.name.trim(),
      position:      draft.position || null,
      jersey_number: draft.jersey_number !== '' ? Number(draft.jersey_number) : null,
      grad_year:     draft.grad_year !== '' ? Number(draft.grad_year) : null,
      school_name:   draft.school_name.trim() || null,
      np_team_name:  draft.np_team_name.trim() || null,
      bio:           draft.bio.trim() || null,
    }
    let pid = editPlayer === 'new' ? null : editPlayer.id
    if (editPlayer === 'new') {
      const { data } = await supabasePlayers.from('players').insert(payload).select('id').single()
      pid = data?.id
    } else {
      await supabasePlayers.from('players').update(payload).eq('id', pid)
    }
    if (photoFile && pid) {
      const buf = await photoFile.arrayBuffer()
      const KEY = import.meta.env.VITE_PLAYERS_SUPABASE_ANON_KEY
      const SB  = import.meta.env.VITE_PLAYERS_SUPABASE_URL
      await fetch(`${SB}/storage/v1/object/player-photos/${pid}/photo.png`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
        body: buf,
      })
      const photoUrl = `${SB}/storage/v1/object/public/player-photos/${pid}/photo.png`
      await supabasePlayers.from('players').update({ photo_url: photoUrl }).eq('id', pid)
    }
    setEditPlayer(null)
    setSaving(false)
    fetchAll()
  }

  function openAddGame(player) { setGameTarget(player); setGameDraft(BLANK_GAME) }

  async function saveGame() {
    setSavingGame(true)
    const n = v => v !== '' ? parseFloat(v) : null
    await supabasePlayers.from('player_game_logs').insert({
      player_id:  gameTarget.id,
      game_date:  gameDraft.game_date || null,
      opponent:   gameDraft.opponent.trim() || null,
      source:     gameDraft.source,
      pts: n(gameDraft.pts), reb: n(gameDraft.reb), ast: n(gameDraft.ast),
      stl: n(gameDraft.stl), blk: n(gameDraft.blk), turnovers: n(gameDraft.turnovers),
      fg_made: n(gameDraft.fg_made), fg_att: n(gameDraft.fg_att),
      fg3_made: n(gameDraft.fg3_made), fg3_att: n(gameDraft.fg3_att),
      ft_made: n(gameDraft.ft_made), ft_att: n(gameDraft.ft_att),
    })
    setGameTarget(null)
    setSavingGame(false)
    fetchAll()
  }

  function openEditStats(player) {
    setStatsDraft(player.stats?.length
      ? player.stats.map(s => ({ ...s }))
      : [{ source: 'aau', season: '2025-26', gp: '', ppg: '', rpg: '', apg: '', spg: '', bpg: '', tpg: '', fg_pct: '', ft_pct: '', fg3_pct: '' }]
    )
    setEditStats(player)
  }

  async function saveStats() {
    setSavingStats(true)
    for (const row of statsDraft) {
      const payload = {
        player_id: editStats.id,
        source: row.source, season: row.season,
        gp: row.gp !== '' ? Number(row.gp) : null,
        ppg: row.ppg !== '' ? Number(row.ppg) : null,
        rpg: row.rpg !== '' ? Number(row.rpg) : null,
        apg: row.apg !== '' ? Number(row.apg) : null,
        spg: row.spg !== '' ? Number(row.spg) : null,
        bpg: row.bpg !== '' ? Number(row.bpg) : null,
        tpg: row.tpg !== '' ? Number(row.tpg) : null,
        fg_pct:  row.fg_pct  !== '' ? Number(row.fg_pct)  / 100 : null,
        ft_pct:  row.ft_pct  !== '' ? Number(row.ft_pct)  / 100 : null,
        fg3_pct: row.fg3_pct !== '' ? Number(row.fg3_pct) / 100 : null,
      }
      if (row.id) {
        await supabasePlayers.from('stats').update(payload).eq('id', row.id)
      } else {
        await supabasePlayers.from('stats').insert(payload)
      }
    }
    setEditStats(null)
    setSavingStats(false)
    fetchAll()
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--topbar-h))', background: 'var(--bg)' }}>

      {/* ── Left nav ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: 'calc(100vh - var(--topbar-h))',
        overflowY: 'auto',
      }}>
        {/* Brand header */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3,
            color: 'var(--np-green2)', textTransform: 'uppercase', marginBottom: 4,
          }}>NP Platform</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1 }}>
            Admin Console
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '10px 0', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = section === item.id
            return (
              <button key={item.id} onClick={() => setSection(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', width: '100%', border: 'none',
                background: active ? 'rgba(92,184,0,.1)' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--np-green)' : 'transparent'}`,
                color: active ? 'var(--np-green2)' : 'var(--text2)',
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: 'pointer', textAlign: 'left', transition: 'all .1s',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, width: 18, textAlign: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.id === 'players' && players.length > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)',
                    background: 'var(--bg4)', padding: '1px 7px', borderRadius: 10,
                    color: 'var(--text3)',
                  }}>{players.length}</span>
                )}
                {item.id === 'gamelogs' && gameLogs.length > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)',
                    background: 'var(--bg4)', padding: '1px 7px', borderRadius: 10,
                    color: 'var(--text3)',
                  }}>{gameLogs.length}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          <a href="/superadmin" style={{
            fontSize: 11, color: 'var(--text3)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>←</span> Back to Super Admin
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', minWidth: 0 }}>
        {section === 'dashboard' && (
          <DashboardSection
            players={players} orgs={orgs} teams={teams}
            gameLogs={gameLogs} loading={loading} setSection={setSection}
          />
        )}
        {section === 'players' && (
          <PlayersSection
            filtered={filtered} players={players}
            search={search} setSearch={setSearch}
            filter={filter} setFilter={setFilter}
            sortKey={sortKey} sortDir={sortDir} handleSort={handleSort}
            selected={selected} toggleSelect={toggleSelect} toggleAll={toggleAll}
            loading={loading}
            openEdit={openEdit} openNew={openNew}
            openAddGame={openAddGame} openEditStats={openEditStats}
          />
        )}
        {section === 'orgs' && (
          <OrgsSection
            orgs={orgs} teams={teams} loading={loading}
            expandedOrg={expandedOrg} setExpandedOrg={setExpandedOrg}
          />
        )}
        {section === 'teams' && (
          <TeamsSection orgs={orgs} teams={teams} loading={loading} />
        )}
        {section === 'gamelogs' && (
          <GameLogsSection
            gameLogs={gameLogs} loading={loading}
            players={players} openAddGame={openAddGame}
          />
        )}
      </main>

      {/* ══ Edit / Add Player Modal ══ */}
      {editPlayer && (
        <div className="modal-overlay" onClick={() => setEditPlayer(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editPlayer === 'new' ? '+ Add Player' : `Edit — ${editPlayer.name}`}
              </div>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 12 }}>
                {[
                  ['Full Name',    'name',          'text',   'Calvin Bailey III'],
                  ['Jersey #',     'jersey_number', 'number', '4'],
                  ['Grad Year',    'grad_year',     'number', '2027'],
                  ['High School',  'school_name',   'text',   'Lincoln High'],
                  ['NP Team Name', 'np_team_name',  'text',   'Delta Dubs Energy'],
                ].map(([label, key, type, ph]) => (
                  <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{label}</label>
                    <input className="form-input" type={type} placeholder={ph}
                      value={draft[key]}
                      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Position</label>
                  <select className="form-input" value={draft.position}
                    onChange={e => setDraft(d => ({ ...d, position: e.target.value }))}>
                    <option value="">— Select —</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Bio</label>
                <textarea className="form-input" rows={2} placeholder="Player bio…"
                  value={draft.bio}
                  onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(photoFile || (editPlayer !== 'new' && editPlayer.photo_url)) && (
                    <img
                      src={photoFile ? URL.createObjectURL(photoFile) : editPlayer.photo_url}
                      alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top' }}
                    />
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => photoRef.current.click()}>
                    {photoFile ? '✓ Photo selected' : 'Choose Photo'}
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => setPhotoFile(e.target.files[0] || null)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditPlayer(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePlayer} disabled={saving || !draft.name.trim()}>
                {saving ? 'Saving…' : editPlayer === 'new' ? 'Add Player' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Add Game Log Modal ══ */}
      {gameTarget && (
        <div className="modal-overlay" onClick={() => setGameTarget(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Game — {gameTarget.name}</div>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={gameDraft.game_date}
                    onChange={e => setGameDraft(d => ({ ...d, game_date: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Opponent</label>
                  <input className="form-input" placeholder="vs. Team" value={gameDraft.opponent}
                    onChange={e => setGameDraft(d => ({ ...d, opponent: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Source</label>
                  <select className="form-input" value={gameDraft.source}
                    onChange={e => setGameDraft(d => ({ ...d, source: e.target.value }))}>
                    <option value="aau">AAU</option>
                    <option value="highschool">High School</option>
                  </select>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 10 }}>
                Box Score
              </div>
              <div className="grid-3" style={{ gap: 10 }}>
                {[
                  ['PTS','pts'],['REB','reb'],['AST','ast'],
                  ['STL','stl'],['BLK','blk'],['TO','turnovers'],
                  ['FG Made','fg_made'],['FG Att','fg_att'],
                  ['3P Made','fg3_made'],['3P Att','fg3_att'],
                  ['FT Made','ft_made'],['FT Att','ft_att'],
                ].map(([label, key]) => (
                  <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{label}</label>
                    <input className="form-input" type="number" min="0" placeholder="0"
                      value={gameDraft[key]}
                      onChange={e => setGameDraft(d => ({ ...d, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setGameTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveGame} disabled={savingGame}>
                {savingGame ? 'Saving…' : '+ Add Game Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Edit Stats Modal ══ */}
      {editStats && (
        <div className="modal-overlay" onClick={() => setEditStats(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Stats — {editStats.name}</div>
            </div>
            <div className="modal-body">
              {statsDraft.map((row, i) => (
                <div key={i} style={{ marginBottom: 20, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label className="form-label">Source</label>
                      <select className="form-input" value={row.source}
                        onChange={e => setStatsDraft(d => d.map((r, j) => j===i ? { ...r, source: e.target.value } : r))}>
                        <option value="aau">AAU</option>
                        <option value="highschool">High School</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label className="form-label">Season</label>
                      <input className="form-input" placeholder="2025-26" value={row.season ?? ''}
                        onChange={e => setStatsDraft(d => d.map((r, j) => j===i ? { ...r, season: e.target.value } : r))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, width: 80 }}>
                      <label className="form-label">GP</label>
                      <input className="form-input" type="number" min="0" value={row.gp ?? ''}
                        onChange={e => setStatsDraft(d => d.map((r, j) => j===i ? { ...r, gp: e.target.value } : r))} />
                    </div>
                  </div>
                  <div className="grid-3" style={{ gap: 10 }}>
                    {[
                      ['PPG','ppg'],['RPG','rpg'],['APG','apg'],
                      ['SPG','spg'],['BPG','bpg'],['TPG','tpg'],
                    ].map(([label, key]) => (
                      <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{label}</label>
                        <input className="form-input" type="number" step="0.1" min="0" placeholder="0.0"
                          value={row[key] ?? ''}
                          onChange={e => setStatsDraft(d => d.map((r, j) => j===i ? { ...r, [key]: e.target.value } : r))} />
                      </div>
                    ))}
                    {[['FG%','fg_pct'],['FT%','ft_pct'],['3P%','fg3_pct']].map(([label, key]) => (
                      <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{label} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(0–100)</span></label>
                        <input className="form-input" type="number" step="1" min="0" max="100" placeholder="0"
                          value={row[key] != null ? Math.round(row[key] * 100) : ''}
                          onChange={e => setStatsDraft(d => d.map((r, j) => j===i ? { ...r, [key]: e.target.value } : r))} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() =>
                setStatsDraft(d => [...d, { source: 'highschool', season: '2025-26', gp: '', ppg: '', rpg: '', apg: '', spg: '', bpg: '', tpg: '', fg_pct: '', ft_pct: '', fg3_pct: '' }])
              }>+ Add Season</button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditStats(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveStats} disabled={savingStats}>
                {savingStats ? 'Saving…' : 'Save Stats'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Section: Dashboard
// ─────────────────────────────────────────────────────────────
function DashboardSection({ players, orgs, teams, gameLogs, loading, setSection }) {
  const ranked    = players.filter(p => { const o = calcOvr(p.stats); return o && o > 60 }).length
  const withPhoto = players.filter(p => p.photo_url).length
  const withStats = players.filter(p => p.stats?.length > 0).length

  return (
    <div>
      <PageHeader title="Dashboard" sub="NP Players platform overview" />
      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Players', value: players.length, sub: `${withStats} with stats`, accent: 'var(--np-green2)' },
              { label: 'Ranked',        value: ranked,         sub: 'OVR > 60' },
              { label: 'With Photos',   value: withPhoto,      sub: `${players.length - withPhoto} missing` },
              { label: 'Organizations', value: orgs.length,    sub: 'program orgs' },
              { label: 'Teams',         value: teams.length,   sub: 'all divisions' },
              { label: 'Game Logs',     value: gameLogs.length, sub: 'recorded' },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: accent ?? 'var(--text)', lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Quick actions */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Quick Actions</div>
              {[
                ['◉  Manage Players',    'players'],
                ['⬡  Organizations',     'orgs'],
                ['◈  Teams & Groups',    'teams'],
                ['◎  Add Game Logs',     'gamelogs'],
              ].map(([label, id]) => (
                <button key={id} onClick={() => setSection(id)} style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  padding: '9px 14px', marginBottom: 6,
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text)', textAlign: 'left',
                  transition: 'background .1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}
                >{label}</button>
              ))}
            </div>

            {/* Recent game logs */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Recent Games</div>
              {gameLogs.slice(0, 6).map(g => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{g.players?.name ?? '—'}</span>
                  <span style={{ color: 'var(--text3)' }}>vs {g.opponent ?? '?'} · <span style={{ color: 'var(--np-green2)', fontWeight: 700 }}>{g.pts ?? 0} pts</span></span>
                </div>
              ))}
              {!gameLogs.length && (
                <div style={{ fontSize: 12, color: 'var(--text3)', paddingTop: 8 }}>No game logs recorded yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Section: Players
// ─────────────────────────────────────────────────────────────
function PlayersSection({ filtered, players, search, setSearch, filter, setFilter, sortKey, sortDir, handleSort, selected, toggleSelect, toggleAll, loading, openEdit, openNew, openAddGame, openEditStats }) {
  const allSelected = filtered.length > 0 && selected.size === filtered.length

  function SortTh({ k, label, left }) {
    const active = sortKey === k
    return (
      <th onClick={() => handleSort(k)} style={{
        ...TH, textAlign: left ? 'left' : 'center',
        cursor: 'pointer', userSelect: 'none',
        color: active ? 'var(--np-green2)' : 'var(--text3)',
        background: active ? 'rgba(92,184,0,.06)' : undefined,
      }}>
        {label}
        {active && <span style={{ marginLeft: 3, fontSize: 8 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </th>
    )
  }

  return (
    <div>
      <PageHeader
        title="Players"
        sub={`${players.length} total · ${filtered.length} shown`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="form-input" placeholder="Search name, team, school…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 230, marginBottom: 0 }} />
            <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Player</button>
          </div>
        }
      />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          ['all',       'All Players'],
          ['ranked',    'Ranked'],
          ['has_photo', 'Has Photo'],
          ['no_stats',  'No Stats'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={chip(filter === key)}>{label}</button>
        ))}
        {selected.size > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {selected.size} selected
          </span>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          {loading ? <LoadingState /> : (
            <table style={{ fontSize: 13, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  <th style={{ ...TH, width: 40, textAlign: 'center' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <SortTh k="name" label="Player" left />
                  <SortTh k="position" label="Pos" />
                  <SortTh k="np_team_name" label="Team" left />
                  <SortTh k="grad_year" label="Class" />
                  <SortTh k="school_name" label="School" left />
                  <SortTh k="_ovr" label="OVR" />
                  <th style={{ ...TH, textAlign: 'center' }}>Stats</th>
                  <th style={{ ...TH, width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const color = getOvrColor(p._ovr)
                  const isSelected = selected.has(p.id)
                  return (
                    <tr key={p.id} style={{
                      background: isSelected ? 'rgba(92,184,0,.07)' : i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)',
                      borderTop: '1px solid var(--border)', transition: 'background .1s',
                    }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(92,184,0,.04)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)' }}
                    >
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer' }} />
                      </td>

                      {/* Avatar + name */}
                      <td style={{ ...TD, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.photo_url
                            ? <img src={p.photo_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, border: `2px solid ${color}40` }} />
                            : <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
                                {p.jersey_number ?? p.name?.[0] ?? '?'}
                              </div>
                          }
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            {p.jersey_number != null && (
                              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>#{p.jersey_number}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ ...TD, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>{p.position ?? '—'}</td>
                      <td style={{ ...TD, textAlign: 'left', color: 'var(--text2)', fontSize: 12, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.np_team_name ?? '—'}</td>
                      <td style={{ ...TD, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                        {p.grad_year ? `'${String(p.grad_year).slice(-2)}` : '—'}
                      </td>
                      <td style={{ ...TD, textAlign: 'left', color: 'var(--text3)', fontSize: 11, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.school_name ?? '—'}</td>

                      {/* OVR */}
                      <td style={{ ...TD, textAlign: 'center' }}>
                        {p._ovr
                          ? <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 900, color }}>{p._ovr}</span>
                          : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>
                        }
                      </td>

                      {/* Stat sources */}
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {(p.stats ?? []).map(s => (
                            <span key={s.id} style={{
                              fontSize: 9, fontFamily: 'var(--font-mono)', padding: '2px 6px',
                              borderRadius: 10, background: s.source === 'highschool' ? 'rgba(59,130,246,.15)' : 'rgba(92,184,0,.12)',
                              color: s.source === 'highschool' ? 'var(--blue)' : 'var(--np-green2)',
                              fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              {s.source === 'highschool' ? 'HS' : 'AAU'}
                            </span>
                          ))}
                          {!p.stats?.length && <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <ActionBtn onClick={() => openEdit(p)}>Edit</ActionBtn>
                          <ActionBtn onClick={() => openEditStats(p)}>Stats</ActionBtn>
                          <ActionBtn onClick={() => openAddGame(p)}>+Game</ActionBtn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Section: Organizations
// ─────────────────────────────────────────────────────────────
function OrgsSection({ orgs, teams, loading, expandedOrg, setExpandedOrg }) {
  const [search, setSearch] = useState('')

  const teamsByOrg = useMemo(() => {
    const m = {}
    teams.forEach(t => { if (t.organization_id) m[t.organization_id] = (m[t.organization_id] ?? 0) + 1 })
    return m
  }, [teams])

  const filtered = useMemo(() => {
    if (!search) return orgs
    const q = search.toLowerCase()
    return orgs.filter(o => (o.org_name ?? '').toLowerCase().includes(q) || (o.city ?? '').toLowerCase().includes(q) || (o.state ?? '').toLowerCase().includes(q))
  }, [orgs, search])

  return (
    <div>
      <PageHeader
        title="Organizations"
        sub={`${orgs.length} program organizations`}
        action={
          <input className="form-input" placeholder="Search orgs…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 200, marginBottom: 0 }} />
        }
      />
      {loading ? <LoadingState /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
          {filtered.map(org => {
            const tc       = teamsByOrg[org.id] ?? 0
            const expanded = expandedOrg === org.id
            const orgTeams = teams.filter(t => t.organization_id === org.id)
            return (
              <div key={org.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => setExpandedOrg(expanded ? null : org.id)}>
                  {org.logo_url
                    ? <img src={org.logo_url} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain', background: 'var(--bg3)', padding: 3, flexShrink: 0 }} />
                    : <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(92,184,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                        ⬡
                      </div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {org.org_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {[org.city, org.state].filter(Boolean).join(', ') || 'Location unknown'}
                      {tc > 0 && ` · ${tc} team${tc !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {/* Color swatches */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {org.primary_color && <div style={{ width: 12, height: 12, borderRadius: 3, background: org.primary_color, border: '1px solid rgba(255,255,255,.1)' }} />}
                    {org.secondary_color && <div style={{ width: 12, height: 12, borderRadius: 3, background: org.secondary_color, border: '1px solid rgba(255,255,255,.1)' }} />}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text3)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
                </div>

                {expanded && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {org.contact_name  && <div style={{ fontSize: 12, color: 'var(--text2)' }}>👤 {org.contact_name}</div>}
                      {org.contact_email && <a href={`mailto:${org.contact_email}`} style={{ fontSize: 12, color: 'var(--np-green2)', textDecoration: 'none' }}>✉ {org.contact_email}</a>}
                      {org.contact_phone && <div style={{ fontSize: 12, color: 'var(--text2)' }}>📞 {org.contact_phone}</div>}
                      {org.website && <a href={org.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--np-green2)', textDecoration: 'none' }}>🌐 {org.website}</a>}
                    </div>
                    {orgTeams.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>
                          Teams
                        </div>
                        {orgTeams.slice(0, 8).map(t => (
                          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <span style={{ color: 'var(--text2)' }}>{t.display_name}</span>
                            <span style={{ color: 'var(--text3)', fontSize: 11 }}>{t.age_group} {t.gender}</span>
                          </div>
                        ))}
                        {orgTeams.length > 8 && (
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>+{orgTeams.length - 8} more teams</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Section: Teams
// ─────────────────────────────────────────────────────────────
function TeamsSection({ orgs, teams, loading }) {
  const [search,     setSearch]     = useState('')
  const [ageFilter,  setAgeFilter]  = useState('all')
  const [sortKey,    setSortKey]    = useState('display_name')
  const [sortDir,    setSortDir]    = useState('asc')

  const orgMap = useMemo(() => {
    const m = {}
    orgs.forEach(o => { m[o.id] = o })
    return m
  }, [orgs])

  const ageGroups = useMemo(() =>
    [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort((a, b) => {
      const n = s => parseInt(s) || 0
      return n(a) - n(b)
    }), [teams])

  const filtered = useMemo(() => {
    let list = teams
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.display_name ?? '').toLowerCase().includes(q) ||
        (orgMap[t.organization_id]?.org_name ?? '').toLowerCase().includes(q)
      )
    }
    if (ageFilter !== 'all') list = list.filter(t => t.age_group === ageFilter)
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
  }, [teams, search, ageFilter, sortKey, sortDir, orgMap])

  function SortTh({ k, label }) {
    const active = sortKey === k
    return (
      <th onClick={() => { setSortKey(k); setSortDir(d => sortKey === k ? (d === 'asc' ? 'desc' : 'asc') : 'asc') }}
        style={{ ...TH, textAlign: 'left', cursor: 'pointer', userSelect: 'none', color: active ? 'var(--np-green2)' : 'var(--text3)' }}>
        {label}{active && <span style={{ marginLeft: 3, fontSize: 8 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </th>
    )
  }

  return (
    <div>
      <PageHeader
        title="Teams"
        sub={`${teams.length} teams · ${filtered.length} shown`}
        action={
          <input className="form-input" placeholder="Search teams or orgs…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: 220, marginBottom: 0 }} />
        }
      />
      {/* Age filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={chip(ageFilter === 'all')} onClick={() => setAgeFilter('all')}>All Ages</button>
        {ageGroups.map(ag => (
          <button key={ag} style={chip(ageFilter === ag)} onClick={() => setAgeFilter(ag)}>{ag}</button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table style={{ fontSize: 13, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  <SortTh k="display_name" label="Team" />
                  <th style={{ ...TH, textAlign: 'left' }}>Age / Division</th>
                  <SortTh k="organization_id" label="Organization" />
                  <th style={{ ...TH, textAlign: 'left' }}>Grad Year</th>
                  <th style={{ ...TH, textAlign: 'left' }}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const org = orgMap[t.organization_id]
                  return (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
                      <td style={{ ...TD, textAlign: 'left', fontWeight: 600 }}>{t.display_name}</td>
                      <td style={{ ...TD, textAlign: 'left' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: 'rgba(92,184,0,.1)', color: 'var(--np-green2)',
                        }}>
                          {t.age_group ?? '?'} {t.gender ?? ''}
                        </span>
                        {t.ranking_division_key && (
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                            {t.ranking_division_key}
                          </div>
                        )}
                      </td>
                      <td style={{ ...TD, textAlign: 'left', color: 'var(--text2)', fontSize: 12 }}>
                        {org
                          ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {org.logo_url && <img src={org.logo_url} alt="" style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'contain', background: 'var(--bg3)' }} />}
                              {org.org_name}
                            </div>
                          : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ ...TD, textAlign: 'left', color: 'var(--text3)', fontSize: 12 }}>{t.grad_year ?? '—'}</td>
                      <td style={{ ...TD, textAlign: 'left', fontSize: 11 }}>
                        {t.contact_name
                          ? <div>
                              <div style={{ color: 'var(--text2)' }}>{t.contact_name}</div>
                              {t.contact_email && <div style={{ color: 'var(--text3)' }}>{t.contact_email}</div>}
                            </div>
                          : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Section: Game Logs
// ─────────────────────────────────────────────────────────────
function GameLogsSection({ gameLogs, loading, players, openAddGame }) {
  const [search,      setSearch]      = useState('')
  const [srcFilter,   setSrcFilter]   = useState('all')

  const filtered = useMemo(() => {
    let list = gameLogs
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(g =>
        (g.players?.name ?? '').toLowerCase().includes(q) ||
        (g.opponent ?? '').toLowerCase().includes(q)
      )
    }
    if (srcFilter !== 'all') list = list.filter(g => g.source === srcFilter)
    return list
  }, [gameLogs, search, srcFilter])

  return (
    <div>
      <PageHeader
        title="Game Logs"
        sub={`${gameLogs.length} games recorded`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="form-input" placeholder="Search player or opponent…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 240, marginBottom: 0 }} />
          </div>
        }
      />

      {/* Source filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['all','All'],['aau','AAU'],['highschool','High School']].map(([key, label]) => (
          <button key={key} style={chip(srcFilter === key)} onClick={() => setSrcFilter(key)}>{label}</button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table style={{ fontSize: 12, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  {[
                    ['Player', true], ['Date', true], ['Opp', true], ['Src', true],
                    ['PTS',false],['REB',false],['AST',false],['STL',false],
                    ['BLK',false],['TO',false],['FG',false],['3P',false],['FT',false],
                  ].map(([h, left]) => (
                    <th key={h} style={{ ...TH, textAlign: left ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  const fg = g.fg_att  ? `${g.fg_made}/${g.fg_att}`   : '—'
                  const tp = g.fg3_att ? `${g.fg3_made}/${g.fg3_att}` : '—'
                  const ft = g.ft_att  ? `${g.ft_made}/${g.ft_att}`   : '—'
                  return (
                    <tr key={g.id} style={{ background: i%2===0?'var(--bg)':'var(--bg2)', borderTop:'1px solid var(--border)' }}>
                      <td style={{ ...TD, textAlign:'left', fontWeight:600 }}>{g.players?.name ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'left', color:'var(--text3)', whiteSpace:'nowrap', fontSize:11 }}>{fmtDate(g.game_date)}</td>
                      <td style={{ ...TD, textAlign:'left', color:'var(--text2)' }}>vs {g.opponent ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'left' }}>
                        <span style={{
                          fontSize: 9, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 10,
                          background: g.source === 'highschool' ? 'rgba(59,130,246,.15)' : 'rgba(92,184,0,.12)',
                          color: g.source === 'highschool' ? 'var(--blue)' : 'var(--np-green2)',
                          fontWeight: 700, textTransform: 'uppercase',
                        }}>{g.source === 'highschool' ? 'HS' : 'AAU'}</span>
                      </td>
                      <td style={{ ...TD, textAlign:'center', fontWeight: g.pts >= 20 ? 700 : 400, color: g.pts >= 20 ? 'var(--np-green2)' : 'var(--text)' }}>{g.pts ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'center' }}>{g.reb ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'center' }}>{g.ast ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'center' }}>{g.stl ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'center' }}>{g.blk ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'center', color: g.turnovers >= 4 ? 'var(--red)' : 'var(--text)' }}>{g.turnovers ?? '—'}</td>
                      <td style={{ ...TD, textAlign:'center', color:'var(--text3)' }}>{fg}</td>
                      <td style={{ ...TD, textAlign:'center', color:'var(--text3)' }}>{tp}</td>
                      <td style={{ ...TD, textAlign:'center', color:'var(--text3)' }}>{ft}</td>
                    </tr>
                  )
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={13} style={{ ...TD, textAlign:'center', color:'var(--text3)', padding:48 }}>
                      No game logs yet.
                      {players.length > 0 && ' Go to Players and click + Game to add one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────
function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: .5, margin: 0 }}>{title}</h1>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

function ActionBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 9px', fontSize: 11, borderRadius: 5,
      background: 'var(--bg3)', border: '1px solid var(--border)',
      color: 'var(--text2)', cursor: 'pointer', fontWeight: 600,
      transition: 'all .1s', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text2)' }}
    >{children}</button>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2 }}>
      LOADING…
    </div>
  )
}
