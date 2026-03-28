import { useAuth } from './useAuth'

// ── Role hierarchy ──────────────────────────────────────────────────
const ROLES = ['Player', 'Volunteer', 'Team Manager', 'Coach', 'Head Admin']

const roleLevel = (role) => ROLES.indexOf(role ?? 'Volunteer')

// ── Page permissions ────────────────────────────────────────────────
const PAGE_ACCESS = {
  '/':           ['Player', 'Volunteer', 'Team Manager', 'Coach', 'Head Admin'],
  '/players':    ['Player', 'Volunteer', 'Team Manager', 'Coach', 'Head Admin'],
  '/teams':      ['Player', 'Volunteer', 'Team Manager', 'Coach', 'Head Admin'],
  '/schedule':   ['Volunteer', 'Team Manager', 'Coach', 'Head Admin'],
  '/attendance': ['Team Manager', 'Coach', 'Head Admin'],
  '/stats':      ['Player', 'Volunteer', 'Team Manager', 'Coach', 'Head Admin'],
  '/payments':   ['Team Manager', 'Head Admin'],
  '/finance':    ['Head Admin'],
  '/spending':   ['Team Manager', 'Head Admin'],
  '/history':    ['Team Manager', 'Head Admin'],
  '/college':    ['Player', 'Volunteer', 'Team Manager', 'Coach', 'Head Admin'],
  '/messages':   ['Team Manager', 'Coach', 'Head Admin'],
  '/admin':      ['Head Admin'],
  '/filmroom':   ['Coach', 'Head Admin'],
}

// ── Finance cards on dashboard ──────────────────────────────────────
const CAN_SEE_FINANCIALS = ['Team Manager', 'Head Admin']

export function usePermissions() {
  const { role, teamAccess } = useAuth()

  const canAccess = (path) => {
    const allowed = PAGE_ACCESS[path] || ['Head Admin']
    return allowed.includes(role)
  }

  const canSeeFinancials = CAN_SEE_FINANCIALS.includes(role)

  const isHeadAdmin   = role === 'Head Admin'
  const isCoach       = role === 'Coach'
  const isTeamManager = role === 'Team Manager'
  const isVolunteer   = role === 'Volunteer'
  const isPlayer      = role === 'Player'

  // Whether this user can only see their own team
  const teamOnly = ['Coach', 'Team Manager', 'Player'].includes(role) && teamAccess !== 'All Teams'

  // Filter a list of players to only show allowed ones
  const filterByTeam = (players) => {
    if (!teamOnly) return players
    return players.filter(p => p.team === teamAccess)
  }

  // Can edit (not read-only)
  const canEdit = (path) => {
    if (role === 'Player' || role === 'Volunteer') return false
    return canAccess(path)
  }

  return {
    role,
    teamAccess,
    canAccess,
    canSeeFinancials,
    isHeadAdmin,
    isCoach,
    isTeamManager,
    isVolunteer,
    isPlayer,
    teamOnly,
    filterByTeam,
    canEdit,
  }
}
