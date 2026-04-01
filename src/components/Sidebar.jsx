import { NavLink } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import styles from './Sidebar.module.css'

const NAV = [
  { section: 'Overview' },
  { to: '/',           icon: '⬡', label: 'Dashboard',       hideFor: ['Player'] },
  { to: '/portal',     icon: '⬡', label: 'My Profile',      showFor: ['Player'] },
  { to: '/parent',     icon: '👨‍👩‍👧', label: 'Parent Portal',    showFor: ['Parent'] },
  { section: 'Roster' },
  { to: '/players',    icon: '○', label: 'Players' },
  { to: '/teams',      icon: '◈', label: 'Teams' },
  { section: 'Schedule & Stats' },
  { to: '/schedule',   icon: '◷', label: 'Schedule' },
  { to: '/attendance', icon: '✓', label: 'Attendance' },
  { to: '/stats',      icon: '◎', label: 'Stats' },
  { to: '/college',    icon: '◉', label: 'College' },
  { section: 'Admin' },
  { to: '/payments',   icon: '$', label: 'Payments',         badge: 'pay' },
  { to: '/finance',    icon: '▲', label: 'Budget & Finance' },
  { to: '/spending',   icon: '▸', label: 'Spending Tracker' },
  { to: '/history',    icon: '◫', label: 'Season History' },
  { to: '/messages',   icon: '◌', label: 'Messages' },
  { to: '/admin',      icon: '◆', label: 'Admin Portal' },
  { to: '/staff',      icon: '👥', label: 'Staff' },
  { to: '/filmroom',   icon: '▶', label: 'Film Room',        accent: true },
  { to: '/superadmin', icon: '🏢', label: 'NP Platform',     superOnly: true },
]

export default function Sidebar() {
  const { players, syncStatus, syncToSupabase } = useStore()
  const { user, signOut, role, teamAccess, orgData } = useAuth()
  const { canAccess }                            = usePermissions()

  const outstanding = players.filter(p => p.status === 'On Roster' && (p.balance || 0) > 0).length
  const syncLabel   = { local: '💾 Local', syncing: '⏳ Syncing…', synced: '☁️ Synced', error: '❌ Error' }[syncStatus]

  const roleColor = {
    'Head Admin':   '#5cb800',
    'Coach':        '#3b82f6',
    'Team Manager': '#ee6730',
    'Volunteer':    '#8d97b0',
    'Player':       '#a855f7',
  }[role] || '#4e576e'

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>NP</div>
        <div className={styles.logoText}>
          <div className={styles.logoName}>Next Play</div>
          <div className={styles.logoSub}>Sports Media & Mgmt</div>
        </div>
      </div>

      <div className={styles.orgPill}>
        <span className={styles.orgDot} />
        <span className={styles.orgName}>{orgData?.name || 'My Org'}</span>
        <span className={styles.orgTag}>AAU Org</span>
      </div>

      {role && (
        <div style={{
          margin: '0 12px 6px',
          padding: '5px 10px',
          background: roleColor + '15',
          border: `1px solid ${roleColor}35`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color: roleColor }}>
            {role}
          </span>
          {teamAccess && teamAccess !== 'All Teams' && (
            <span style={{ fontSize:9, color:'var(--text3)', marginLeft:'auto' }}>{teamAccess}</span>
          )}
        </div>
      )}

      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.section) return (
            <div key={i} className={styles.section}>{item.section}</div>
          )
          if (item.hideFor?.includes(role)) return null
          if (item.showFor && !item.showFor.includes(role)) return null
          if (!canAccess(item.to) && !item.superOnly && !item.showFor) return null
          if (item.superOnly && user?.email !== 'nextplaysports.ca@gmail.com') return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.active : '', item.accent ? styles.accent : ''].join(' ')
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge === 'pay' && outstanding > 0 && (
                <span className={styles.badge}>{outstanding}</span>
              )}
              {item.accent && <span className={styles.filmBadge}>DESKTOP</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className={styles.footer}>
        {user && (
          <div className={styles.userRow}>
            <div className={styles.userAvatar}>
              {(user.email||'?')[0].toUpperCase()}
            </div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        )}
        <button className={styles.syncBtn} onClick={syncToSupabase}>{syncLabel}</button>
        <button className={styles.syncBtn} style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.25)' }} onClick={signOut}>
          Sign Out
        </button>
        <div className={styles.footerMeta}>
          {orgData?.name && <span className={styles.ein}>{orgData.name}</span>}
        </div>
      </div>
    </aside>
  )
}
