import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const RATES = { newPlayer: 385, returning: 320 }

// Default teams — overridden by org's actual teams from DB
export const TEAMS = []

const StoreContext = createContext(null)

function load(key, fallback) {
  try { const raw = localStorage.getItem(`np_${key}`); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function saveLocal(key, val) {
  try { localStorage.setItem(`np_${key}`, JSON.stringify(val)) } catch {}
}

export function StoreProvider({ children }) {
  const { orgId, needsOnboarding } = useAuth()

  const [players,       setPlayersRaw]  = useState([])
  const [schedule,      setScheduleRaw] = useState([])
  const [spending,      setSpendingRaw] = useState([])
  const [messages,      setMessagesRaw] = useState([])
  const [admins,        setAdminsRaw]   = useState([])
  const [seasonHistory, setHistoryRaw]  = useState([])
  const [orgTeams,      setOrgTeams]    = useState([])
  const [finance,       setFinanceRaw]  = useState({
    bankBalance: 0, bankUpdated: null, collected: 0, collectedUpdated: null, projectedExpenses: 0,
  })
  const [loading,    setLoading]    = useState(true)
  const [syncStatus, setSyncStatus] = useState('synced')
  const [toast,      setToast]      = useState({ msg: '', show: false })

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }, [])

  // Re-fetch whenever orgId changes
  useEffect(() => {
    if (needsOnboarding) { setLoading(false); return }
    if (!orgId) { setLoading(false); return }
    if (!supabase) {
      setPlayersRaw(load('players', []))
      setScheduleRaw(load('schedule', []))
      setSpendingRaw(load('spending', []))
      setMessagesRaw(load('messages', []))
      setAdminsRaw(load('admins', []))
      setHistoryRaw(load('history', []))
      setFinanceRaw(load('finance', { bankBalance:0, collected:0, projectedExpenses:0 }))
      setSyncStatus('local')
      setLoading(false)
      return
    }
    fetchAll(orgId)
  }, [orgId, needsOnboarding])

  async function fetchAll(oid) {
    if (!oid) return
    setLoading(true)
    try {
      const [
        { data: p }, { data: s }, { data: sp }, { data: m },
        { data: a }, { data: h }, { data: f }, { data: stats },
        { data: payments }, { data: teams },
      ] = await Promise.all([
        supabase.from('players').select('*').eq('org_id', oid).order('name'),
        supabase.from('schedule').select('*').eq('org_id', oid).order('date'),
        supabase.from('spending').select('*').eq('org_id', oid).order('date', { ascending: false }),
        supabase.from('messages').select('*').eq('org_id', oid).order('created_at', { ascending: false }),
        supabase.from('admins').select('*').eq('org_id', oid).order('created_at'),
        supabase.from('season_history').select('*').eq('org_id', oid).order('archived_at', { ascending: false }),
        supabase.from('finance').select('*').eq('org_id', oid).maybeSingle(),
        supabase.from('player_stats').select('*').eq('org_id', oid),
        supabase.from('player_payments').select('*').eq('org_id', oid),
        supabase.from('teams').select('*').eq('org_id', oid).order('name'),
      ])

      const mappedPlayers = (p || []).map(pl => ({
        ...pl, isNew: pl.is_new, ageGroup: pl.age_group,
        playerPhone: pl.player_phone, playerEmail: pl.player_email,
        games:    (stats    || []).filter(st => st.player_id === pl.id),
        payments: (payments || []).filter(pay => pay.player_id === pl.id),
      }))

      setPlayersRaw(mappedPlayers)
      setScheduleRaw((s || []).map(e => ({ ...e, teams: e.teams || '' })))
      setSpendingRaw((sp || []).map(x => ({ ...x, desc: x.description })))
      setMessagesRaw((m || []).map(x => ({ ...x, to: x.to_team })))
      setAdminsRaw(a || [])
      setHistoryRaw((h || []).map(x => ({ ...x, date: x.archived_at, playerCount: x.player_count })))
      setOrgTeams((teams || []).map(t => ({ id: t.name, label: t.name, age: t.age_group, color: t.color || '#3b82f6' })))
      if (f) setFinanceRaw({
        bankBalance: f.bank_balance || 0, bankUpdated: f.bank_updated,
        collected: f.collected || 0, collectedUpdated: f.collected_updated,
        projectedExpenses: f.projected_expenses || 0,
      })
      setSyncStatus('synced')
    } catch (err) {
      console.error('Fetch error:', err)
      setSyncStatus('error')
      showToast('⚠️ Could not load data')
    } finally {
      setLoading(false)
    }
  }

  // ── Players ──
  const addPlayer = async (data) => {
    const fee = data.isNew ? RATES.newPlayer : RATES.returning
    const balance = isNaN(data.balance) ? fee : Number(data.balance)
    if (supabase && orgId) {
      const { data: inserted, error } = await supabase.from('players').insert({
        org_id: orgId, name: data.name, team: data.team, status: data.status,
        is_new: data.isNew || false, balance, deposit: balance < fee,
        num: data.num, age: data.age, dob: data.dob || null,
        age_group: data.ageGroup, year: data.year, gender: data.gender,
        jsize: data.jsize, ssize: data.ssize, parent: data.parent,
        email: data.email, phone: data.phone,
        player_phone: data.playerPhone, player_email: data.playerEmail,
        drive: data.drive, colleges: data.colleges, notes: data.notes,
      }).select().single()
      if (error) { showToast('❌ Error adding player'); return }
      const mapped = { ...inserted, isNew: inserted.is_new, ageGroup: inserted.age_group,
        playerPhone: inserted.player_phone, playerEmail: inserted.player_email, games: [], payments: [] }
      setPlayersRaw(prev => [...prev, mapped])
      showToast('✅ Player added!')
      return mapped
    }
    const p = { id: Date.now(), deposit: balance < fee, balance, ...data, games: [], payments: [] }
    setPlayersRaw(prev => { const next = [...prev, p]; saveLocal('players', next); return next })
    showToast('✅ Player added!')
  }

  const updatePlayer = async (id, data) => {
    if (supabase) {
      const { error } = await supabase.from('players').update({
        name: data.name, team: data.team, status: data.status,
        is_new: data.isNew || false, balance: Number(data.balance) || 0, deposit: data.deposit,
        num: data.num, age: data.age, dob: data.dob || null,
        age_group: data.ageGroup, year: data.year, gender: data.gender,
        jsize: data.jsize, ssize: data.ssize, parent: data.parent,
        email: data.email, phone: data.phone,
        player_phone: data.playerPhone, player_email: data.playerEmail,
        drive: data.drive, colleges: data.colleges, notes: data.notes,
      }).eq('id', id)
      if (error) { showToast('❌ Error updating player'); return }
    }
    setPlayersRaw(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    showToast('✅ Player updated!')
  }

  const deletePlayer = async (id) => {
    if (supabase) await supabase.from('players').delete().eq('id', id)
    setPlayersRaw(prev => prev.filter(p => p.id !== id))
    showToast('🗑️ Player removed')
  }

  const logPayment = async (playerId, amount, method, notes) => {
    if (supabase && orgId) {
      await supabase.from('player_payments').insert({
        org_id: orgId, player_id: playerId, amount: Number(amount), method, notes,
        date: new Date().toISOString().split('T')[0],
      })
      const player = players.find(p => p.id === playerId)
      const newBal = Math.max(0, (player?.balance || 0) - amount)
      await supabase.from('players').update({ balance: newBal, deposit: true }).eq('id', playerId)
    }
    setPlayersRaw(prev => prev.map(p => {
      if (p.id !== playerId) return p
      const newBalance = Math.max(0, (p.balance || 0) - amount)
      return { ...p, balance: newBalance, deposit: true,
        payments: [...(p.payments || []), { amount, method, notes, date: new Date().toISOString() }] }
    }))
    showToast(`💰 Payment logged — $${amount}`)
  }

  // ── Schedule ──
  const addEvent = async (data) => {
    if (supabase && orgId) {
      const { data: inserted, error } = await supabase.from('schedule').insert({
        org_id: orgId, title: data.title, type: data.type, teams: data.teams,
        date: data.date || null, time: data.time, location: data.location, notes: data.notes,
      }).select().single()
      if (error) { showToast('❌ Error adding event'); return }
      setScheduleRaw(prev => [...prev, { ...inserted, teams: inserted.teams || '' }])
      showToast('📅 Event added!')
      return
    }
    setScheduleRaw(prev => { const next = [...prev, { id: Date.now(), ...data }]; saveLocal('schedule', next); return next })
    showToast('📅 Event added!')
  }

  const updateEvent = async (id, data) => {
    if (supabase) {
      await supabase.from('schedule').update({
        title: data.title, type: data.type, teams: data.teams,
        date: data.date || null, time: data.time, location: data.location, notes: data.notes,
      }).eq('id', id)
    }
    setScheduleRaw(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    showToast('📅 Event updated!')
  }

  const deleteEvent = async (id) => {
    if (supabase) await supabase.from('schedule').delete().eq('id', id)
    setScheduleRaw(prev => prev.filter(e => e.id !== id))
    showToast('🗑️ Event removed')
  }

  // ── Spending ──
  const addSpend = async (data) => {
    if (supabase && orgId) {
      const { data: inserted, error } = await supabase.from('spending').insert({
        org_id: orgId, description: data.desc, amount: Number(data.amount),
        date: data.date || new Date().toISOString().split('T')[0],
        category: data.category, team: data.team, status: data.status, notes: data.notes,
      }).select().single()
      if (error) { showToast('❌ Error logging expense'); return }
      setSpendingRaw(prev => [{ ...inserted, desc: inserted.description }, ...prev])
      showToast('🧾 Expense logged!')
      return
    }
    setSpendingRaw(prev => { const next = [{ id: Date.now(), ...data }, ...prev]; saveLocal('spending', next); return next })
    showToast('🧾 Expense logged!')
  }

  const deleteSpend = async (id) => {
    if (supabase) await supabase.from('spending').delete().eq('id', id)
    setSpendingRaw(prev => prev.filter(s => s.id !== id))
    showToast('🗑️ Expense removed')
  }

  // ── Finance ──
  const setFinance = async (data) => {
    setFinanceRaw(data)
    if (supabase && orgId) {
      await supabase.from('finance').upsert({
        org_id: orgId, bank_balance: data.bankBalance, bank_updated: data.bankUpdated,
        collected: data.collected, collected_updated: data.collectedUpdated,
        projected_expenses: data.projectedExpenses, updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' })
    }
  }

  // ── Stats ──
  const logStats = async (playerId, gameStats) => {
    if (supabase && orgId) {
      await supabase.from('player_stats').insert({
        org_id: orgId, player_id: playerId,
        date: gameStats.date || new Date().toISOString().split('T')[0],
        pts: gameStats.pts || 0, reb: gameStats.reb || 0, ast: gameStats.ast || 0,
        stl: gameStats.stl || 0, blk: gameStats.blk || 0, tov: gameStats.tov || 0,
        min: gameStats.min || 0, fgm: gameStats.fgm || 0, fga: gameStats.fga || 0,
        p3m: gameStats.p3m || 0, p3a: gameStats.p3a || 0,
        ftm: gameStats.ftm || 0, fta: gameStats.fta || 0,
      })
    }
    setPlayersRaw(prev => prev.map(p => p.id !== playerId ? p :
      { ...p, games: [...(p.games || []), { ...gameStats, date: new Date().toISOString().split('T')[0] }] }
    ))
    showToast('📊 Stats logged!')
  }

  // ── Messages ──
  const sendMessage = async (data) => {
    if (supabase && orgId) {
      const { data: inserted, error } = await supabase.from('messages').insert({
        org_id: orgId, to_team: data.to, subject: data.subject, body: data.body,
      }).select().single()
      if (error) { showToast('❌ Error sending message'); return }
      setMessagesRaw(prev => [{ ...inserted, to: inserted.to_team }, ...prev])
      showToast('✉️ Message sent!')
      return
    }
    setMessagesRaw(prev => [{ id: Date.now(), date: new Date().toISOString(), ...data }, ...prev])
    showToast('✉️ Message sent!')
  }

  // ── Admins ──
  const addAdmin = async (data) => {
    if (supabase && orgId) {
      const { data: inserted, error } = await supabase.from('admins').insert({
        org_id: orgId, fname: data.fname, lname: data.lname,
        email: data.email, role: data.role, team_access: data.team, phone: data.phone,
      }).select().single()
      if (error) { showToast('❌ Error adding admin'); return }
      setAdminsRaw(prev => [...prev, { ...inserted, name: `${inserted.fname} ${inserted.lname}` }])
      showToast('🔐 Admin added!')
      return
    }
    setAdminsRaw(prev => [...prev, { id: Date.now(), ...data, name: `${data.fname} ${data.lname}` }])
    showToast('🔐 Admin added!')
  }

  const removeAdmin = async (id) => {
    if (supabase) await supabase.from('admins').delete().eq('id', id)
    setAdminsRaw(prev => prev.filter(a => a.id !== id))
    showToast('🗑️ Admin removed')
  }

  // ── Season archive ──
  const archiveSeason = async (label, year, notes) => {
    const spent = spending.filter(s => s.status === 'paid').reduce((s, x) => s + Number(x.amount), 0)
    const snapshot = {
      org_id: orgId, label, year: Number(year), notes,
      player_count: players.filter(p => p.status === 'On Roster').length,
      collected: finance.collected, spent, income: projectedIncome,
    }
    if (supabase) {
      const { data: inserted, error } = await supabase.from('season_history').insert(snapshot).select().single()
      if (error) { showToast('❌ Error archiving season'); return }
      setHistoryRaw(prev => [{ ...inserted, date: inserted.archived_at, playerCount: inserted.player_count }, ...prev])
      showToast('📥 Season archived!')
      return
    }
    setHistoryRaw(prev => [{ id: Date.now(), date: new Date().toISOString(), playerCount: snapshot.player_count, ...snapshot }, ...prev])
    showToast('📥 Season archived!')
  }

  const syncToSupabase = async () => {
    showToast('🔄 Refreshing data…')
    await fetchAll(orgId)
    showToast('☁️ Data refreshed!')
  }

  const projectedIncome  = players.filter(p => p.status === 'On Roster').reduce((s, p) => s + (p.isNew ? RATES.newPlayer : RATES.returning), 0)
  const totalOutstanding = players.filter(p => (p.balance || 0) > 0).reduce((s, p) => s + p.balance, 0)
  const paidCount        = players.filter(p => p.status === 'On Roster' && (p.balance || 0) === 0).length
  const projectedNet     = projectedIncome - finance.projectedExpenses

  const value = {
    players, schedule, spending, messages, admins, seasonHistory, finance,
    loading, syncStatus, toast,
    RATES, TEAMS: orgTeams, orgTeams,
    projectedIncome, totalOutstanding, paidCount, projectedNet,
    addPlayer, updatePlayer, deletePlayer, logPayment,
    addEvent, updateEvent, deleteEvent,
    addSpend, deleteSpend,
    setFinance, logStats, sendMessage,
    addAdmin, removeAdmin, archiveSeason, syncToSupabase, showToast,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
