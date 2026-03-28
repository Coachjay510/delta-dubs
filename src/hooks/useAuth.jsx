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

  async function fetchRole(userId, email) {
    if (!supabase || !userId) return null
    try {
      // Check org_users — use limit(1) not single() to avoid throwing on no rows
      const { data: orgUsers } = await supabase
        .from('org_users')
        .select('role, team_access')
        .eq('user_id', userId)
        .eq('org_id', 'delta-dubs')
        .limit(1)

      if (orgUsers && orgUsers.length > 0) {
        setRole(orgUsers[0].role || 'Volunteer')
        setTeamAccess(orgUsers[0].team_access || 'All Teams')
        return orgUsers[0].role
      }

      // Fall back to admins table by email
      const { data: adminRows } = await supabase
        .from('admins')
        .select('role, team_access')
        .eq('email', email)
        .eq('org_id', 'delta-dubs')
        .limit(1)

      if (adminRows && adminRows.length > 0) {
        const a = adminRows[0]
        setRole(a.role || 'Coach')
        setTeamAccess(a.team_access || 'All Teams')
        await supabase.from('org_users').upsert({
          org_id: 'delta-dubs', user_id: userId, email,
          role: a.role, team_access: a.team_access,
        }, { onConflict: 'org_id,user_id' })
        return a.role
      }

      // Check players table by email
      const { data: playerRows } = await supabase
        .from('players')
        .select('id, team')
        .eq('player_email', email)
        .eq('org_id', 'delta-dubs')
        .limit(1)

      if (playerRows && playerRows.length > 0) {
        setRole('Player')
        setTeamAccess(playerRows[0].team)
        await supabase.from('org_users').upsert({
          org_id: 'delta-dubs', user_id: userId, email,
          role: 'Player', team_access: playerRows[0].team,
        }, { onConflict: 'org_id,user_id' })
        return 'Player'
      }

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
      if (foundRole) { setAuthorized(true); return true }
      setAuthorized(false)
      return false
    } catch (err) {
      console.warn('Auth check issue:', err.message)
      // On timeout or error, let them in as Head Admin
      setAuthorized(true)
      setRole('Head Admin')
      setTeamAccess('All Teams')
      return true
    } finally {
      setAuthChecking(false)
    }
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
    await supabase?.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, user, role, teamAccess, authorized, authChecking,
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
