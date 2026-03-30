const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/mo',
    color: '#3b82f6',
    features: ['1 team, up to 15 players', 'Roster + schedule', 'Attendance tracking', 'Basic stats'],
    cta: 'Start Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/mo',
    color: '#5cb800',
    badge: 'Most Popular',
    features: ['Up to 4 teams, 60 players', 'Full stats + film room', 'College profiles', 'Player portal'],
    cta: 'Start Pro',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$149',
    period: '/mo',
    color: '#a855f7',
    features: ['Unlimited teams + players', 'Full film room + exports', 'Parent portal', 'Analytics dashboard'],
    cta: 'Start Elite',
  },
]

export default function PaywallScreen({ orgName, onSelectPlan }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '40px 24px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 520 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏀</div>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 28, letterSpacing: 1, marginBottom: 12 }}>
          YOUR TRIAL HAS ENDED
        </div>
        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
          {orgName ? `${orgName}'s` : 'Your'} 14-day free trial is up. Choose a plan to keep access to your
          roster, schedule, stats, and film room — no data is lost.
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            width: 220,
            background: 'var(--bg2)',
            border: `2px solid ${plan.badge ? plan.color : 'var(--border)'}`,
            borderRadius: 14,
            padding: '24px 20px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {plan.badge && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: plan.color, color: '#fff', borderRadius: 20,
                padding: '3px 14px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                {plan.badge}
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 8 }}>
              {plan.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-d)', fontSize: 32, color: 'var(--text)' }}>{plan.price}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{plan.period}</span>
            </div>
            <div style={{ flex: 1, marginBottom: 20 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{
                  fontSize: 12, color: 'var(--text2)', padding: '4px 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ color: plan.color, fontSize: 10 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => onSelectPlan(plan.id)}
              style={{
                background: plan.badge ? plan.color : 'transparent',
                color: plan.badge ? '#fff' : plan.color,
                border: `2px solid ${plan.color}`,
                borderRadius: 8, padding: '10px 0',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%',
              }}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Film Room add-on */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 20px', maxWidth: 500, width: '100%',
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
      }}>
        <div style={{ fontSize: 24 }}>🎬</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>NP Film Room Desktop</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Dual-camera editing, stat logging, shot charts. Mac + Windows.
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, color: 'var(--text)' }}>+$20</div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>/mo add-on</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        All plans include a 14-day free trial. Cancel anytime. Your data is always yours.
      </div>
    </div>
  )
}
