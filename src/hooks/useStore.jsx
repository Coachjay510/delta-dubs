import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Default rates ──
export const RATES = { newPlayer: 385, returning: 320 }

// ── Teams config ──
export const TEAMS = [
  { id: 'Drive',   label: 'Drive',   age: '13–14u', gender: 'Boys',  color: '#3b82f6' },
  { id: 'Energy',  label: 'Energy',  age: '15–16u', gender: 'Boys',  color: '#ee6730' },
  { id: 'Passion', label: 'Passion', age: '14–17u', gender: 'Girls', color: '#a855f7' },
  { id: 'Power',   label: 'Power',   age: '16–17u', gender: 'Boys',  color: '#4ade80' },
]

const StoreContext = createContext(null)

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(`np_${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key, val) {
  try { localStorage.setItem(`np_${key}`, JSON.stringify(val)) } catch {}
}

export function StoreProvider({ children }) {
  const [players,       setPlayersRaw]  = useState(() => load('players', []))
  const [schedule,      setScheduleRaw] = useState(() => load('schedule', []))
  const [spending,      setSpendingRaw] = useState(() => load('spending', []))
  const [messages,      setMessagesRaw] = useState(() => load('messages', []))
  const [admins,        setAdminsRaw]   = useState(() => load('admins', []))
  const [seasonHistory, setHistoryRaw]  = useState(() => load('history', []))
  const [finance,       setFinanceRaw]  = useState(() => load('finance', {
    bankBalance: 0, bankUpdated: null,
    collected: 0,   collectedUpdated: null,
    projectedExpenses: 0,
  }))
  const [syncStatus, setSyncStatus] = useState('local') // 'local' | 'syncing' | 'synced' | 'error'
  const [toast, setToast] = useState({ msg: '', show: false })

  // ── Persist helpers ──
  const setPlayers  = v => { setPlayersRaw(v);  save('players', v) }
  const setSchedule = v => { setScheduleRaw(v); save('schedule', v) }
  const setSpending = v => { setSpendingRaw(v); save('spending', v) }
  const setMessages = v => { setMessagesRaw(v); save('messages', v) }
  const setAdmins   = v => { setAdminsRaw(v);   save('admins', v) }
  const setHistory  = v => { setHistoryRaw(v);  save('history', v) }
  const setFinance  = v => { setFinanceRaw(v);  save('finance', v) }

  // ── Toast ──
  const showToast = useCallback((msg) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }, [])

  // ── Next ID ──
  const nextId = (arr) => (arr.length ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1)

  // ── Players ──
  const addPlayer = (data) => {
    const fee = data.isNew ? RATES.newPlayer : RATES.returning
    const balance = isNaN(data.balance) ? fee : Number(data.balance)
    const p = { id: nextId(players), deposit: balance < fee, balance, ...data }
    const next = [...players, p]
    setPlayers(next)
    showToast('✅ Player added!')
    return p
  }
  const updatePlayer = (id, data) => {
    const next = players.map(p => p.id === id ? { ...p, ...data } : p)
    setPlayers(next)
    showToast('✅ Player updated!')
  }
  const deletePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id))
    showToast('🗑️ Player removed')
  }
  const logPayment = (playerId, amount, method, notes) => {
    const next = players.map(p => {
      if (p.id !== playerId) return p
      const newBalance = Math.max(0, (p.balance || 0) - amount)
      return { ...p, balance: newBalance, deposit: true,
        payments: [...(p.payments || []), { amount, method, notes, date: new Date().toISOString() }] }
    })
    setPlayers(next)
    showToast(`💰 Payment logged — $${amount}`)
  }

  // ── Schedule ──
  const addEvent = (data) => {
    const next = [...schedule, { id: nextId(schedule), ...data }]
    setSchedule(next)
    showToast('📅 Event added!')
  }
  const updateEvent = (id, data) => setSchedule(schedule.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteEvent = (id) => setSchedule(schedule.filter(e => e.id !== id))

  // ── Spending ──
  const addSpend = (data) => {
    const next = [...spending, { id: nextId(spending), date: new Date().toISOString().split('T')[0], ...data }]
    setSpending(next)
    showToast('🧾 Expense logged!')
  }
  const deleteSpend = (id) => setSpending(spending.filter(s => s.id !== id))

  // ── Finance computed ──
  const projectedIncome = players
    .filter(p => p.status === 'On Roster')
    .reduce((sum, p) => sum + (p.isNew ? RATES.newPlayer : RATES.returning), 0)
  const totalOutstanding = players.filter(p => (p.balance || 0) > 0).reduce((s, p) => s + p.balance, 0)
  const paidCount = players.filter(p => p.status === 'On Roster' && p.balance === 0).length
  const projectedNet = projectedIncome - finance.projectedExpenses

  // ── Stats helpers ──
  const logStats = (playerId, gameStats) => {
    const next = players.map(p => {
      if (p.id !== playerId) return p
      const games = [...(p.games || []), { ...gameStats, date: new Date().toISOString().split('T')[0] }]
      return { ...p, games }
    })
    setPlayers(next)
    showToast('📊 Stats logged!')
  }

  // ── Messages ──
  const sendMessage = (data) => {
    const next = [{ id: nextId(messages), date: new Date().toISOString(), ...data }, ...messages]
    setMessages(next)
    showToast('✉️ Message sent!')
  }

  // ── Admins ──
  const addAdmin = (data) => {
    const next = [...admins, { id: nextId(admins), ...data }]
    setAdmins(next)
    showToast('🔐 Admin added!')
  }
  const removeAdmin = (id) => setAdmins(admins.filter(a => a.id !== id))

  // ── Season archive ──
  const archiveSeason = (label, year, notes) => {
    const snapshot = {
      id: nextId(seasonHistory),
      label, year, notes,
      date: new Date().toISOString(),
      playerCount: players.filter(p => p.status === 'On Roster').length,
      collected: finance.collected,
      spent: spending.filter(s => s.status === 'paid').reduce((s, x) => s + Number(x.amount), 0),
      income: projectedIncome,
    }
    setHistory([snapshot, ...seasonHistory])
    showToast('📥 Season archived!')
  }

  // ── Supabase sync ──
  const syncToSupabase = async () => {
    if (!supabase) return showToast('⚠️ Supabase not configured')
    setSyncStatus('syncing')
    try {
      const org = 'delta-dubs'
      await supabase.from('np_players').upsert(
        players.map(p => ({ ...p, org_id: org })),
        { onConflict: 'id' }
      )
      setSyncStatus('synced')
      showToast('☁️ Synced to Supabase!')
    } catch (err) {
      console.error(err)
      setSyncStatus('error')
      showToast('❌ Sync failed — check console')
    }
  }

  const value = {
    // State
    players, schedule, spending, messages, admins, seasonHistory, finance,
    syncStatus, toast,
    // Config
    RATES, TEAMS,
    // Computed
    projectedIncome, totalOutstanding, paidCount, projectedNet,
    // Actions
    addPlayer, updatePlayer, deletePlayer, logPayment,
    addEvent, updateEvent, deleteEvent,
    addSpend, deleteSpend,
    setFinance,
    logStats,
    sendMessage,
    addAdmin, removeAdmin,
    archiveSeason,
    syncToSupabase,
    showToast,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
