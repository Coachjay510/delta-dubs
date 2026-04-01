import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Toast from './components/Toast'
import MobileNav from './components/MobileNav'
import TrialBanner from './components/TrialBanner'
import PaywallScreen from './components/PaywallScreen'
import UpgradeModal from './components/UpgradeModal'
import { useAuth } from './hooks/useAuth'
import { useStore } from './hooks/useStore'
import { usePermissions } from './hooks/usePermissions'
import { useTrial } from './hooks/useTrial'

import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Players    from './pages/Players'
import Teams      from './pages/Teams'
import Schedule   from './pages/Schedule'
import Attendance from './pages/Attendance'
import Stats      from './pages/Stats'
import Payments   from './pages/Payments'
import Finance    from './pages/Finance'
import Spending   from './pages/Spending'
import History    from './pages/History'
import College    from './pages/College'
import Messages   from './pages/Messages'
import Admin      from './pages/Admin'
import Staff       from './pages/Staff'
import PlayerPortal from './pages/PlayerPortal'
import ParentPortal from './pages/ParentPortal'
import SuperAdmin  from './pages/SuperAdmin'
import FilmRoom    from './pages/FilmRoom'
import Onboarding  from './pages/Onboarding'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', width: '100%', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:42, color:'var(--np-green2)', letterSpacing:4 }}>NP</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', letterSpacing:3, textTransform:'uppercase' }}>
        Loading…
      </div>
    </div>
  )
}

function RouteGuard({ path, children }) {
  const { canAccess } = usePermissions()
  if (!canAccess(path)) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--red)', marginBottom:10 }}>ACCESS DENIED</div>
      <div style={{ fontSize:13, color:'var(--text3)' }}>You don't have permission to view this page.</div>
    </div>
  )
  return children
}

export default function App() {
  const { session, loading, authorized, signOut, role, orgId, orgData, needsOnboarding, isSuperAdmin } = useAuth()
  const { loading: dataLoading } = useStore()
  const trial = useTrial(orgId)
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (loading || dataLoading) return <LoadingScreen />
  if (!session) return <Login />

  // New user with no org — show onboarding
  if (authorized && needsOnboarding) return <Onboarding />

  if (!authorized) return (
    <div style={{
      minHeight: '100vh', width: '100%', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:42, color:'var(--red)', letterSpacing:2 }}>ACCESS DENIED</div>
      <div style={{ fontSize:14, color:'var(--text3)', maxWidth:400, lineHeight:1.7 }}>
        Your account isn't linked to an organization yet.
        Contact your admin to get access, or sign in with a different account.
      </div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', marginBottom:8 }}>
        Signed in as: {session.user?.email}
      </div>
      <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
    </div>
  )

  // Super admins bypass trial checks (from context)

  // Paywall — trial expired and not paid (skip for super admin)
  if (!isSuperAdmin && !trial.loading && trial.isTrialExpired && !trial.isPaid) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', width:'100%' }}>
        <Sidebar />
        <div style={{ marginLeft:'var(--sidebar-w)', flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
          <PaywallScreen
            orgName={orgData?.name}
            onSelectPlan={() => setShowUpgrade(true)}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <div style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Trial/Free banner */}
        {!isSuperAdmin && (trial.showBanner || trial.tier === 'Rookie' || trial.tier === 'Free') && (
          <TrialBanner
            daysLeft={trial.trialDaysLeft}
            tier={trial.tier}
            onUpgrade={() => setShowUpgrade(true)}
          />
        )}

        {/* Upgrade modal */}
        {showUpgrade && (
          <UpgradeModal
            currentTier={trial.tier}
            orgName={orgData?.name}
            onClose={() => setShowUpgrade(false)}
          />
        )}
        <TopBar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"           element={role === 'Player' ? <Navigate to="/portal" replace /> : <Dashboard />} />
            <Route path="/players"    element={<Players />} />
            <Route path="/teams"      element={<Teams />} />
            <Route path="/schedule"   element={<Schedule />} />
            <Route path="/attendance" element={<RouteGuard path="/attendance"><Attendance /></RouteGuard>} />
            <Route path="/stats"      element={<Stats />} />
            <Route path="/payments"   element={<RouteGuard path="/payments"><Payments /></RouteGuard>} />
            <Route path="/finance"    element={<RouteGuard path="/finance"><Finance /></RouteGuard>} />
            <Route path="/spending"   element={<RouteGuard path="/spending"><Spending /></RouteGuard>} />
            <Route path="/history"    element={<RouteGuard path="/history"><History /></RouteGuard>} />
            <Route path="/college"    element={<College />} />
            <Route path="/messages"   element={<RouteGuard path="/messages"><Messages /></RouteGuard>} />
            <Route path="/admin"      element={<RouteGuard path="/admin"><Admin /></RouteGuard>} />
            <Route path="/staff"      element={<RouteGuard path="/admin"><Staff /></RouteGuard>} />
            <Route path="/portal"     element={<PlayerPortal />} />
            <Route path="/parent"     element={<ParentPortal />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toast />
      <MobileNav />
    </div>
  )
}
