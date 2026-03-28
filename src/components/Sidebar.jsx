import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import styles from './Sidebar.module.css'

const NAV = [
  { section: 'Overview' },
  { to: '/',          icon: '⬡', label: 'Dashboard' },
  { section: 'Roster' },
  { to: '/players',   icon: '○', label: 'Players' },
  { to: '/teams',     icon: '◈', label: 'Teams' },
  { section: 'Operations' },
  { to: '/schedule',  icon: '◷', label: 'Schedule' },
  { to: '/attendance',icon: '✓', label: 'Attendance' },
  { to: '/stats',     icon: '◎', label: 'Stats' },
  { section: 'Admin' },
  { to: '/payments',  icon: '$', label: 'Payments',  badge: 'pay' },
  { to: '/finance',   icon: '▲', label: 'Budget & Finance' },
  { to: '/spending',  icon: '▸', label: 'Spending Tracker' },
  { to: '/history',   icon: '◫', label: 'Season History' },
  { to: '/college',   icon: '◉', label: 'College' },
  { to: '/messages',  icon: '◌', label: 'Messages' },
  { to: '/admin',     icon: '◆', label: 'Admin Portal' },
  { to: '/filmroom',  icon: '▶', label: 'Film Room', accent: true },
]

export default function Sidebar() {
  const { players, syncStatus, syncToSupabase, showToast } = useStore()
  const outstanding = players.filter(p => p.status === 'On Roster' && (p.balance || 0) > 0).length

  const { user, signOut } = useAuth()
  const syncLabel = { local: '💾 Local', syncing: '⏳ Syncing…', synced: '☁️ Synced', error: '❌ Error' }[syncStatus]

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>NP</div>
        <div className={styles.logoText}>
          <div className={styles.logoName}>Next Play</div>
          <div className={styles.logoSub}>Sports Media & Mgmt</div>
        </div>
      </div>

      {/* Org pill */}
      <div className={styles.orgPill}>
        <span className={styles.orgDot} />
        <span className={styles.orgName}>Delta Dubs</span>
        <span className={styles.orgTag}>AAU Org</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.section) return (
            <div key={i} className={styles.section}>{item.section}</div>
          )
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

      {/* Footer */}
      <div className={styles.footer}>
        {user && (
          <div className={styles.userRow}>
            <div className={styles.userAvatar}>
              {(user.email||'?')[0].toUpperCase()}
            </div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        )}
        <button className={styles.syncBtn} onClick={syncToSupabase}>
          {syncLabel}
        </button>
        <button className={styles.syncBtn} style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.25)' }} onClick={signOut}>
          Sign Out
        </button>
        <div className={styles.footerMeta}>
          <span className={styles.ein}>EIN: 92-3031048</span>
        </div>
      </div>
    </aside>
  )
}
