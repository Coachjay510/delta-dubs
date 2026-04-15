import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const SUPER_ADMIN = 'nextplaysports.ca@gmail.com'

export function AuthProvider({ children }) {
  const [session,          setSession]          = useState(undefined)
  const [user,             setUser]             = useState(null)
  const [role,             setRole]             = useState(null)
  const [teamAccess,       setTeamAccess]       = useState('All Teams')
  const [authorized,       setAuthorized]       = useState(false)
  const [authChecking,     setAuthChecking]     = useState(false)
  const [orgId,            setOrgId]            = useState(null)
  const [orgData,          setOrgData]          = useState(null)
  const [needsOnboarding,  setNeedsOnboarding]  = useState(false)

  async function fetchOrgData(id) {
    if (!id) return
    const { data } = await supabase
      .from('orgs')
      .select('id, status, tier, trial_started_at, name, sport, city, state, type')
      .eq('id', id)
      .maybeSingle()
    if (data) setOrgData(data)
  }

  // Look up which org this user belongs to — no hardcoding
  async function resolveUserOrg(userId, email) {
    console.log('[useAuth] resolving org for:', email, userId)

    // 1. Check org_users by user_id (most reliable — set after first login)
    const { data: byUserId } = await supabase
      .from('org_users')
      .select('org_id, role, team_access')
      .eq('user_id', userId)
      .limit(1)

    if (byUserId?.length > 0) {
      console.log('[useAuth] found in org_users by user_id:', byUserId[0])
      return byUserId[0]
    }

    // 2. Check org_users by email
    const { data: byEmail } = await supabase
      .from('org_users')
      .select('org_id, role, team_access')
      .eq('email', email)
      .limit(1)

    if (byEmail?.length > 0) {
      console.log('[useAuth] found in org_users by email:', byEmail[0])
      // Backfill user_id so next login is faster
      await supabase.from('org_users')
        .update({ user_id: userId })
        .eq('email', email)
        .eq('org_id', byEmail[0].org_id)
      return byEmail[0]
    }

    // 3. Check admins table by email
    const { data: adminRows } = await supabase
      .from('admins')
      .select('org_id, role, team_access')
      .eq('email', email)
      .limit(1)

    if (adminRows?.length > 0) {
      console.log('[useAuth] found in admins:', adminRows[0])
      const a = adminRows[0]
      // Create org_users entry for faster future lookups
      await supabase.from('org_users').upsert({
        org_id: a.org_id, user_id: userId, email,
        role: a.role, team_access: a.team_access,
      }, { onConflict: 'org_id,user_id' })
      return a
    }

    // 4. Check players by email
    const { data: playerRows } = await supabase
      .from('players')
      .select('org_id, team')
      .eq('player_email', email)
      .limit(1)

    if (playerRows?.length > 0) {
      console.log('[useAuth] found in players:', playerRows[0])
      const p = playerRows[0]
      await supabase.from('org_users').upsert({
        org_id: p.org_id, user_id: userId, email,
        role: 'Player', team_access: p.team,
      }, { onConflict: 'org_id,user_id' })
      return { org_id: p.org_id, role: 'Player', team_access: p.team }
    }

    // 5. No org found — new user
    console.log('[useAuth] no org found — needs onboarding')
    return null
  }

  async function checkAuthorization(userId, email) {
    setAuthChecking(true)

    // Super admin impersonating another org via ?impersonate= param
    const params = new URLSearchParams(window.location.search)
    const impersonateOrg = params.get('impersonate')
    if (email === SUPER_ADMIN && impersonateOrg) {
      console.log('[useAuth] super admin impersonating:', impersonateOrg)
      setOrgId(impersonateOrg)
      setRole('Head Admin')
      setTeamAccess('All Teams')
      setAuthorized(true)
      setNeedsOnboarding(false)
      fetchOrgData(impersonateOrg)
      setAuthChecking(false)
      return
    }
    try {
      const result = await Promise.race([
        resolveUserOrg(userId, email),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ])

      if (result) {
        const oid = result.org_id || result.orgId
        setOrgId(oid)
        setRole(result.role || 'Volunteer')
        setTeamAccess(result.team_access || result.teamAccess || 'All Teams')
        setAuthorized(true)
        setNeedsOnboarding(false)
        fetchOrgData(oid)
      } else {
        // New user — show onboarding
        setAuthorized(true)
        setNeedsOnboarding(true)
        setRole('Head Admin')
        setOrgId(null)
      }
    } catch (err) {
      console.warn('[useAuth] error/timeout:', err.message)
      // On timeout — don't default to delta-dubs, show error state
      setAuthorized(false)
      setNeedsOnboarding(false)
    } finally {
      setAuthChecking(false)
    }
  }

  async function completeOnboarding(newOrgId) {
    // Wait for any pending auth operations to settle
    await new Promise(r => setTimeout(r, 600))
    setOrgId(newOrgId)
    setNeedsOnboarding(false)
    setRole('Head Admin')
    setTeamAccess('All Teams')
    await fetchOrgData(newOrgId)
  }

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        checkAuthorization(data.session.user.id, data.session.user.email)
      } else {
        setSession(null)
        setAuthChecking(false)
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
        setOrgId(null)
        setOrgData(null)
        setNeedsOnboarding(false)
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
      isSuperAdmin: user?.email === SUPER_ADMIN,
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
