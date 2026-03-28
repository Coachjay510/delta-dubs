import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,      setSession]      = useState(undefined)
  const [user,         setUser]         = useState(null)
  const [authorized,   setAuthorized]   = useState(false)
  const [authChecking, setAuthChecking] = useState(false)

  async function checkAuthorization(userId, email) {
    if (!supabase || !userId) return false
    setAuthChecking(true)
    try {
      // Check org_users table first (auto-created on first sign in)
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('id')
        .eq('user_id', userId)
        .eq('org_id', 'delta-dubs')
        .single()

      if (orgUser) { setAuthorized(true); return true }

      // Also check admins table by email
      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .eq('org_id', 'delta-dubs')
        .single()

      if (admin) {
        // Insert into org_users so future logins are fast
        await supabase.from('org_users').insert({
          org_id: 'delta-dubs',
          user_id: userId,
          email,
          role: 'Admin',
        })
        setAuthorized(true)
        return true
      }

      setAuthorized(false)
      return false
    } catch {
      // If org_users trigger already created the record, this is fine
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
    await supabase?.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, user, authorized, authChecking,
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
