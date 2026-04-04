import { useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import { getSportConfig } from '../hooks/useSport'

function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }

function avg(games, key) {
  if (!games?.length) return '—'
  return (games.reduce((s,g) => s + (Number(g[key])||0), 0) / games.length).toFixed(1)
}
function total(games, key) {
  if (!games?.length) return '—'
  const t = games.reduce((s,g) => s + (Number(g[key])||0), 0)
  return t || '—'
}
function pct(games, made, att) {
  if (!games?.length) return '—'
  const m = games.reduce((s,g) => s + (Number(g[made])||0), 0)
  const a = games.reduce((s,g) => s + (Number(g[att])||0), 0)
  return a > 0 ? (m/a*100).toFixed(0)+'%' : '—'
}

// Sport-specific column configs
const SPORT_COLUMNS = {
  basketball: {
    summary: [
      { key:'pts', label:'PPG', fn: avg, highlight:true },
      { key:'reb', label:'RPG', fn: avg },
      { key:'ast', label:'APG', fn: avg },
      { key:'stl', label:'SPG', fn: avg },
      { key:'blk', label:'BPG', fn: avg },
      { key:'tov', label:'TOV', fn: avg },
      { key:'fgpct', label:'FG%', fn: (g) => pct(g,'fgm','fga') },
      { key:'p3pct', label:'3P%', fn: (g) => pct(g,'p3m','p3a') },
      { key:'ftpct', label:'FT%', fn: (g) => pct(g,'ftm','fta') },
    ],
    logFields: [
      ['pts','PTS'],['reb','REB'],['ast','AST'],['stl','STL'],['blk','BLK'],['tov','TOV'],
      ['min','MIN'],['fgm','FGM'],['fga','FGA'],['p3m','3PM'],['p3a','3PA'],['ftm','FTM'],['fta','FTA'],
    ],
    blank: { pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,min:0,fgm:0,fga:0,p3m:0,p3a:0,ftm:0,fta:0 },
    sortKey: 'pts',
  },
  football: {
    summary: [
      { key:'pass_yards', label:'PASS YDS', fn: total, highlight:true },
      { key:'pass_td',    label:'PASS TD',  fn: total },
      { key:'pass_int',   label:'INT',      fn: total },
      { key:'rush_yards', label:'RUSH YDS', fn: total },
      { key:'rush_td',    label:'RUSH TD',  fn: total },
      { key:'rec_yards',  label:'REC YDS',  fn: total },
      { key:'rec_td',     label:'REC TD',   fn: total },
      { key:'tackles',    label:'TCKL',     fn: total },
      { key:'sacks',      label:'SACKS',    fn: total },
    ],
    logFields: [
      ['pass_yards','Pass Yds'],['pass_td','Pass TD'],['pass_int','INT'],
      ['rush_yards','Rush Yds'],['rush_td','Rush TD'],
      ['rec_yards','Rec Yds'],['rec_td','Rec TD'],
      ['tackles','Tackles'],['sacks','Sacks'],
    ],
    blank: { pass_yards:0,pass_td:0,pass_int:0,rush_yards:0,rush_td:0,rec_yards:0,rec_td:0,tackles:0,sacks:0 },
    sortKey: 'pass_yards',
  },
  baseball: {
    summary: [
      { key:'hits',  label:'H',   fn: total, highlight:true },
      { key:'runs',  label:'R',   fn: total },
      { key:'rbi',   label:'RBI', fn: total },
      { key:'hr',    label:'HR',  fn: total },
      { key:'bb',    label:'BB',  fn: total },
      { key:'so',    label:'K',   fn: total },
      { key:'avg',   label:'AVG', fn: (g) => {
        const h = g.reduce((s,x) => s+(Number(x.hits)||0),0)
        const ab= g.reduce((s,x) => s+(Number(x.ab)||0),0)
        return ab>0 ? (h/ab).toFixed(3).replace(/^0/,'') : '—'
      }},
      { key:'era',   label:'ERA', fn: (g) => {
        const er = g.reduce((s,x) => s+(Number(x.earned_run)||0),0)
        const ip = g.reduce((s,x) => s+(Number(x.innings)||0),0)
        return ip>0 ? (er/ip*9).toFixed(2) : '—'
      }},
    ],
    logFields: [
      ['ab','AB'],['hits','H'],['runs','R'],['rbi','RBI'],['hr','HR'],
      ['bb','BB'],['so','K'],['innings','IP'],['earned_run','ER'],
    ],
    blank: { ab:0,hits:0,runs:0,rbi:0,hr:0,bb:0,so:0,innings:0,earned_run:0 },
    sortKey: 'hits',
  },
  softball: {
    summary: [
      { key:'hits',  label:'H',   fn: total, highlight:true },
      { key:'runs',  label:'R',   fn: total },
      { key:'rbi',   label:'RBI', fn: total },
      { key:'hr',    label:'HR',  fn: total },
      { key:'bb',    label:'BB',  fn: total },
      { key:'so',    label:'K',   fn: total },
      { key:'avg',   label:'AVG', fn: (g) => {
        const h = g.reduce((s,x) => s+(Number(x.hits)||0),0)
        const ab= g.reduce((s,x) => s+(Number(x.ab)||0),0)
        return ab>0 ? (h/ab).toFixed(3).replace(/^0/,'') : '—'
      }},
    ],
    logFields: [
      ['ab','AB'],['hits','H'],['runs','R'],['rbi','RBI'],['hr','HR'],
      ['bb','BB'],['so','K'],['innings','IP'],['earned_run','ER'],
    ],
    blank: { ab:0,hits:0,runs:0,rbi:0,hr:0,bb:0,so:0,innings:0,earned_run:0 },
    sortKey: 'hits',
  },
  soccer: {
    summary: [
      { key:'goals',    label:'G',   fn: total, highlight:true },
      { key:'assists',  label:'A',   fn: total },
      { key:'shots',    label:'SH',  fn: total },
      { key:'shots_on', label:'SOG', fn: total },
      { key:'saves',    label:'SV',  fn: total },
      { key:'fouls',    label:'F',   fn: total },
      { key:'yellow',   label:'YC',  fn: total },
    ],
    logFields: [
      ['goals','Goals'],['assists','Assists'],['shots','Shots'],['shots_on','Shots On'],
      ['saves','Saves'],['fouls','Fouls'],['yellow','Yellow'],['red','Red'],
    ],
    blank: { goals:0,assists:0,shots:0,shots_on:0,saves:0,fouls:0,yellow:0,red:0 },
    sortKey: 'goals',
  },
  volleyball: {
    summary: [
      { key:'kills',      label:'K',   fn: total, highlight:true },
      { key:'aces',       label:'ACE', fn: total },
      { key:'blocks',     label:'BLK', fn: total },
      { key:'digs',       label:'DIG', fn: total },
      { key:'assists_v',  label:'AST', fn: total },
      { key:'attack_err', label:'AE',  fn: total },
      { key:'serve_err',  label:'SE',  fn: total },
    ],
    logFields: [
      ['kills','Kills'],['aces','Aces'],['blocks','Blocks'],['digs','Digs'],
      ['assists_v','Assists'],['attack_err','Atk Err'],['serve_err','Serve Err'],
    ],
    blank: { kills:0,aces:0,blocks:0,digs:0,assists_v:0,attack_err:0,serve_err:0 },
    sortKey: 'kills',
  },
}

export default function Stats() {
  const { players, logStats, orgTeams } = useStore()
  const { orgData } = useAuth()
  const sport    = orgData?.sport || 'basketball'
  const sportCfg = getSportConfig(sport)
  const cols     = SPORT_COLUMNS[sport] || SPORT_COLUMNS.basketball

  const [teamF,      setTeamF]      = useState('all')
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState({ playerId:'', date:'', ...cols.blank })
  const [viewMode,   setViewMode]   = useState('avg') // avg | game

  const onRoster = players.filter(p => p.status === 'On Roster')
  const filtered = useMemo(() =>
    onRoster
      .filter(p => teamF === 'all' || p.team === teamF)
      .sort((a,b) => {
        const ag = total(a.games, cols.sortKey)
        const bg = total(b.games, cols.sortKey)
        return (bg === '—' ? -1 : Number(bg)) - (ag === '—' ? -1 : Number(ag))
      }),
    [players, teamF, sport]
  )

  function setF(k,v) { setForm(f => ({...f, [k]: v})) }

  function save() {
    const id = parseInt(form.playerId)
    if (!id) return
    const { playerId, ...stats } = form
    logStats(id, stats)
    setShowModal(false)
    setForm({ playerId:'', date:'', ...cols.blank })
  }

  const statCell = (val, highlight) => (
    <td style={{ fontFamily:'var(--font-mono)', fontSize:12, textAlign:'center',
      color: highlight ? 'var(--np-green2)' : 'var(--text2)',
      fontWeight: highlight ? 700 : 400 }}>{val}</td>
  )

  return (
    <div style={{ padding:24 }}>

      <div className="filter-bar">
        {/* Sport badge */}
        <span style={{ fontSize:18 }}>{sportCfg.icon}</span>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{sportCfg.label} Stats</span>
        <div style={{ width:1, height:16, background:'var(--border2)', margin:'0 4px' }}/>
        <select className="filter-select" value={teamF} onChange={e => setTeamF(e.target.value)}>
          <option value="all">All Players</option>
          {orgTeams.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <div style={{ display:'flex', gap:0, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:5, overflow:'hidden', marginLeft:4 }}>
          {[['avg','Averages'],['game','Per Game']].map(([v,l]) => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding:'5px 12px', border:'none', fontSize:11, fontWeight:600, cursor:'pointer',
              background: viewMode===v ? 'var(--bg2)' : 'transparent',
              color: viewMode===v ? 'var(--text)' : 'var(--text3)',
              borderRight:'1px solid var(--border)',
            }}>{l}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }} onClick={() => setShowModal(true)}>
          + Log Game Stats
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th style={{ textAlign:'center' }}>GP</th>
                {cols.summary.map(c => (
                  <th key={c.key} style={{ textAlign:'center' }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={cols.summary.length + 3} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  No players on roster
                </td></tr>
              )}
              {filtered.map(p => {
                const g  = p.games || []
                const gp = g.length
                const teamColor = orgTeams.find(t => t.id === p.team || t.label === p.team)?.color || 'var(--text2)'
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="avatar" style={{ background:teamColor+'25', color:teamColor }}>
                          {initials(p.name)}
                        </div>
                        <span style={{ fontWeight:600, fontSize:13 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:11, fontWeight:700, color:teamColor }}>{p.team}</td>
                    {statCell(gp||'—', false)}
                    {cols.summary.map(c => {
                      const val = c.fn(g, c.key)
                      return statCell(val, c.highlight)
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Stats Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ width:680 }}>
            <div className="modal-header">
              <div className="modal-title">{sportCfg.icon} Log Game Stats — {sportCfg.label}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom:14 }}>
                <div className="form-group">
                  <label className="form-label">Player</label>
                  <select className="form-select" value={form.playerId} onChange={e => setF('playerId', e.target.value)}>
                    <option value="">Select player…</option>
                    {onRoster.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.team}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:9 }}>
                {cols.logFields.map(([k, lbl]) => (
                  <div key={k} className="form-group">
                    <label className="form-label">{lbl}</label>
                    <input className="form-input" type="number" placeholder="0" min="0"
                      value={form[k] ?? ''} onChange={e => setF(k, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Stats</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
