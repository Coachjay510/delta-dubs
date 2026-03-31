import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,      setSession]      = useState(undefined)
  const [user,         setUser]         = useState(null)
  const [role,         setRole]         = useState(null)
  const [teamAccess,   setTeamAccess]   = useState('All Teams')
  const [authorized,   setAuthorized]   = useState(false)
  const [authChecking, setAuthChecking] = useState(false)
  const [orgId,        setOrgId]        = useState(null)
  const [orgData,      setOrgData]      = useState(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  async function fetchOrgData(id) {
    const { data } = await supabase
      .from('orgs')
      .select('id, status, tier, trial_started_at, name')
      .eq('id', id)
      .single()
    if (data) setOrgData(data)
  }

  async function fetchRole(userId, email) {
    if (!supabase || !userId) return null
    try {
      // ── 1. Check org_users for ANY org this user belongs to ──
      const { data: orgUsers } = await supabase
        .from('org_users')
        .select('role, team_access, org_id')
        .eq('user_id', userId)
        .limit(1)

      if (orgUsers && orgUsers.length > 0) {
        const ou = orgUsers[0]
        setRole(ou.role || 'Volunteer')
        setTeamAccess(ou.team_access || 'All Teams')
        setOrgId(ou.org_id)
        fetchOrgData(ou.org_id)
        return ou.role
      }

      // ── 2. Check admins table by email (any org) ──
      const { data: adminRows } = await supabase
        .from('admins')
        .select('role, team_access, org_id')
        .eq('email', email)
        .limit(1)

      if (adminRows && adminRows.length > 0) {
        const a = adminRows[0]
        setRole(a.role || 'Coach')
        setTeamAccess(a.team_access || 'All Teams')
        setOrgId(a.org_id)
        fetchOrgData(a.org_id)
        await supabase.from('org_users').upsert({
          org_id: a.org_id, user_id: userId, email,
          role: a.role, team_access: a.team_access,
        }, { onConflict: 'org_id,user_id' })
        return a.role
      }

      // ── 3. Check players table by email (any org) ──
      const { data: playerRows } = await supabase
        .from('players')
        .select('id, team, org_id')
        .eq('player_email', email)
        .limit(1)

      if (playerRows && playerRows.length > 0) {
        const p = playerRows[0]
        setRole('Player')
        setTeamAccess(p.team)
        setOrgId(p.org_id)
        fetchOrgData(p.org_id)
        await supabase.from('org_users').upsert({
          org_id: p.org_id, user_id: userId, email,
          role: 'Player', team_access: p.team,
        }, { onConflict: 'org_id,user_id' })
        return 'Player'
      }

      // ── 4. No org found → needs onboarding ──
      return null
    } catch (err) {
      console.error('fetchRole error:', err)
      return null
    }
  }

  async function checkAuthorization(userId, email) {
    setAuthChecking(true)
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )
      const foundRole = await Promise.race([fetchRole(userId, email), timeoutPromise])
      if (foundRole) {
        setAuthorized(true)
        setNeedsOnboarding(false)
        return true
      }
      // No org found — send to onboarding
      setAuthorized(true) // allow render, but show onboarding
      setNeedsOnboarding(true)
      setRole('Head Admin') // will be org creator
      return 'onboarding'
    } catch (err) {
      console.warn('Auth check issue:', err.message)
      setAuthorized(true)
      setRole('Volunteer')
      setTeamAccess('All Teams')
      return true
    } finally {
      setAuthChecking(false)
    }
  }

  // Called after onboarding creates an org
  async function completeOnboarding(newOrgId) {
    setOrgId(newOrgId)
    setNeedsOnboarding(false)
    setRole('Head Admin')
    setTeamAccess('All Teams')
    fetchOrgData(newOrgId)
  }

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        checkAuthorization(data.session.user.id, data.session.user.email)
      } else {
        setSession(null)
      }
    })

    const { data: listener } = supabase?.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await checkAuthorization(session.user.id, session.user.email)
      } else {
        setAuthorized(false)
        setRole(null)
        setNeedsOnboarding(false)
        setOrgId(null)
        setOrgData(null)
        setTeamAccess('All Teams')
      }
    }) ?? { data: null }

    return () => listener?.subscription?.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase?.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

  const signOut = async () => {
    setAuthorized(false)
    setRole(null)
    setOrgId(null)
    setOrgData(null)
    setNeedsOnboarding(false)
    await supabase?.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, user, role, teamAccess, authorized, authChecking,
      orgId, orgData, needsOnboarding, completeOnboarding,
      signInWithGoogle, signOut,
      loading: session === undefined || authChecking,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
