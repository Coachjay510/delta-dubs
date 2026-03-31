import { NavLink } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

const NAV_ITEMS = [
  { to: '/',          icon: '⬡', label: 'Home' },
  { to: '/players',   icon: '○', label: 'Players' },
  { to: '/schedule',  icon: '◷', label: 'Schedule' },
  { to: '/stats',     icon: '◎', label: 'Stats' },
  { to: '/payments',  icon: '$', label: 'Payments' },
]

export default function MobileNav() {
  const { canAccess } = usePermissions()
  const visible = NAV_ITEMS.filter(item => canAccess(item.to))

  return (
    <nav className="mobile-nav" style={{ display: 'none' }}>
      {visible.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `mobile-nav-item${isActive ? ' active' : ''}`
          }
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
