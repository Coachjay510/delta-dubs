import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,      setSession]      = useState(undefined)
  const [user,         setUser]         = useState(null)
  const [role,         setRole]         = useState(null)  // 'Head Admin' | 'Coach' | 'Team Manager' | 'Volunteer' | 'Player'
  const [teamAccess,   setTeamAccess]   = useState('All Teams')
  const [authorized,   setAuthorized]   = useState(false)
  const [authChecking, setAuthChecking] = useState(false)

  async function fetchRole(userId, email) {
    if (!supabase || !userId) return
    try {
      // Check org_users first
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('role, team_access')
        .eq('user_id', userId)
        .eq('org_id', 'delta-dubs')
        .single()

      if (orgUser) {
        setRole(orgUser.role || 'Volunteer')
        setTeamAccess(orgUser.team_access || 'All Teams')
        return orgUser.role
      }

      // Fall back to admins table by email
      const { data: admin } = await supabase
        .from('admins')
        .select('role, team_access')
        .eq('email', email)
        .eq('org_id', 'delta-dubs')
        .single()

      if (admin) {
        setRole(admin.role || 'Coach')
        setTeamAccess(admin.team_access || 'All Teams')
        // Create org_users record
        await supabase.from('org_users').insert({
          org_id: 'delta-dubs', user_id: userId, email,
          role: admin.role, team_access: admin.team_access,
        }).then(() => {})
        return admin.role
      }

      // Check players table by email
      const { data: player } = await supabase
        .from('players')
        .select('id, team, name')
        .eq('player_email', email)
        .eq('org_id', 'delta-dubs')
        .single()

      if (player) {
        setRole('Player')
        setTeamAccess(player.team)
        await supabase.from('org_users').insert({
          org_id: 'delta-dubs', user_id: userId, email,
          role: 'Player', team_access: player.team,
        }).then(() => {})
        return 'Player'
      }

      return null
    } catch { return null }
  }

  async function checkAuthorization(userId, email) {
    setAuthChecking(true)
    try {
      const foundRole = await fetchRole(userId, email)
      if (foundRole) { setAuthorized(true); return true }
      setAuthorized(false)
      return false
    } catch {
      setAuthorized(true)
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
