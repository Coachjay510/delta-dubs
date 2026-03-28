import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Toast from './components/Toast'
import { useAuth } from './hooks/useAuth'

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
import FilmRoom   from './pages/FilmRoom'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
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

export default function App() {
  const { session, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Login />

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <TopBar />
        <main style={{ flex: 1, padding: 0 }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/players"    element={<Players />} />
            <Route path="/teams"      element={<Teams />} />
            <Route path="/schedule"   element={<Schedule />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/stats"      element={<Stats />} />
            <Route path="/payments"   element={<Payments />} />
            <Route path="/finance"    element={<Finance />} />
            <Route path="/spending"   element={<Spending />} />
            <Route path="/history"    element={<History />} />
            <Route path="/college"    element={<College />} />
            <Route path="/messages"   element={<Messages />} />
            <Route path="/admin"      element={<Admin />} />
            <Route path="/filmroom"   element={<FilmRoom />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </div>
  )
}
