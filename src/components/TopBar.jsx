import { useLocation } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import styles from './TopBar.module.css'

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/players':    'Players',
  '/teams':      'Teams',
  '/schedule':   'Schedule',
  '/attendance': 'Attendance',
  '/stats':      'Stats',
  '/payments':   'Payments',
  '/finance':    'Budget & Finance',
  '/spending':   'Spending Tracker',
  '/history':    'Season History',
  '/college':    'College',
  '/messages':   'Messages',
  '/admin':      'Admin Portal',
  '/staff':      'Staff',
  '/filmroom':   'Film Room',
}

export default function TopBar({ onAddPlayer }) {
  const { pathname } = useLocation()
  const { syncStatus, syncToSupabase } = useStore()
  const title = PAGE_TITLES[pathname] || 'Dashboard'

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.title}>{title}</div>
        <div className={styles.kicker}>Next Play Sports Media</div>
      </div>
      <div className={styles.right}>
        <div className={styles.syncInfo}>
          <span className={`${styles.syncDot} ${styles[syncStatus]}`} />
          <span className={styles.syncLabel}>
            {{ local: 'Local only', syncing: 'Syncing…', synced: 'Synced', error: 'Sync error' }[syncStatus]}
          </span>
        </div>
        {pathname === '/players' && (
          <button className="btn btn-primary btn-sm" onClick={onAddPlayer}>
            + Add Player
          </button>
        )}
        {pathname === '/schedule' && (
          <button className="btn btn-primary btn-sm" onClick={() => {}}>
            + Add Event
          </button>
        )}
      </div>
    </header>
  )
}
