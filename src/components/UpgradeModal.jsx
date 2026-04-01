const PLANS = [
  {
    id: 'Rookie',
    name: 'Rookie',
    price: '$0',
    period: 'forever free',
    color: '#5cb800',
    current: true,
    features: [
      '1 team, up to 12 players',
      'Roster management',
      'Basic schedule',
      'Google SSO login',
      'Player portal (read-only)',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'Varsity',
    name: 'Varsity',
    price: '$150',
    period: '/year · ~$12.50/mo',
    color: '#3b82f6',
    badge: 'Most Popular',
    features: [
      'Up to 4 teams, 60 players',
      'Everything in Rookie',
      'Payment tracking',
      'Stats + recruiting profiles',
      'Player portal (full access)',
      'Budget & finance tools',
      'Role-based access',
      'Priority email support',
    ],
    cta: 'Upgrade to Varsity',
  },
  {
    id: 'Pro',
    name: 'Pro',
    price: '$350',
    period: '/year · ~$29/mo',
    color: '#a855f7',
    features: [
      'Unlimited teams + players',
      'Everything in Varsity',
      'Advanced analytics dashboard',
      'Parent portal',
      'Season history & archiving',
      'Custom branding',
      'College recruiting tools',
      'Priority phone + email support',
    ],
    cta: 'Upgrade to Pro',
  },
]

export default function UpgradeModal({ currentTier, orgName, onClose }) {
  const email = 'nextplaysports.ca@gmail.com'

  function handleUpgrade(plan) {
    const subject = encodeURIComponent(`Upgrade Request — ${orgName} → ${plan.name}`)
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to upgrade ${orgName} to the ${plan.name} plan ($${plan.price}/year).\n\nPlease send me payment instructions.\n\nThanks!`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.75)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:24, overflowY:'auto',
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border2)',
        borderRadius:16, padding:32, maxWidth:860, width:'100%',
        position:'relative',
      }}>
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16,
          background:'none', border:'none', color:'var(--text3)',
          fontSize:20, cursor:'pointer',
        }}>✕</button>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:26, marginBottom:6 }}>
            Upgrade Your Plan
          </div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>
            You're currently on the <strong style={{ color:'var(--np-green2)' }}>{currentTier || 'Rookie'}</strong> plan.
            Email us to upgrade — we'll get you set up within 24 hours.
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
          {PLANS.map(plan => {
            const isCurrent = (currentTier || 'Rookie') === plan.id
            return (
              <div key={plan.id} style={{
                background:'var(--bg3)',
                border:`2px solid ${plan.badge ? plan.color : isCurrent ? plan.color+'40' : 'var(--border)'}`,
                borderRadius:12, padding:'22px 18px',
                position:'relative', display:'flex', flexDirection:'column',
                opacity: isCurrent ? 0.7 : 1,
              }}>
                {plan.badge && (
                  <div style={{
                    position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                    background:plan.color, color:'#fff', borderRadius:20,
                    padding:'3px 14px', fontSize:10, fontWeight:700, whiteSpace:'nowrap',
                  }}>{plan.badge}</div>
                )}
                {isCurrent && (
                  <div style={{
                    position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                    background:'var(--bg3)', border:`1px solid ${plan.color}`,
                    color:plan.color, borderRadius:20,
                    padding:'3px 14px', fontSize:10, fontWeight:700, whiteSpace:'nowrap',
                  }}>Current Plan</div>
                )}

                <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:plan.color, marginBottom:4 }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:32 }}>{plan.price}</span>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>{plan.period}</div>

                <div style={{ flex:1, marginBottom:20 }}>
                  {plan.features.map((f,i) => (
                    <div key={i} style={{
                      fontSize:12, color:'var(--text2)', padding:'5px 0',
                      borderBottom:'1px solid var(--border)',
                      display:'flex', alignItems:'center', gap:8,
                    }}>
                      <span style={{ color:plan.color, fontSize:10 }}>✓</span>{f}
                    </div>
                  ))}
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => !isCurrent && handleUpgrade(plan)}
                  style={{
                    background: isCurrent ? 'transparent' : plan.badge ? plan.color : 'transparent',
                    color: isCurrent ? 'var(--text3)' : plan.badge ? '#fff' : plan.color,
                    border: `2px solid ${isCurrent ? 'var(--border)' : plan.color}`,
                    borderRadius:8, padding:'10px 0',
                    fontSize:13, fontWeight:700,
                    cursor: isCurrent ? 'default' : 'pointer',
                    width:'100%',
                  }}>
                  {isCurrent ? 'Current Plan' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Film Room add-on */}
        <div style={{
          background:'rgba(168,85,247,.06)', border:'1px solid rgba(168,85,247,.2)',
          borderRadius:10, padding:'14px 18px',
          display:'flex', alignItems:'center', gap:16,
        }}>
          <div style={{ fontSize:24 }}>🎬</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>NP Film Room Desktop — Add-on</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>
              Dual-camera editing, live stat logging, shot chart, graphic overlays. Mac now · Windows Q2 2026.
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'#a855f7' }}>+$30</div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>/year add-on</div>
          </div>
          <button onClick={() => handleUpgrade({ id:'filmroom', name:'Film Room Add-on', price:'30' })}
            style={{
              background:'transparent', color:'#a855f7',
              border:'1px solid rgba(168,85,247,.4)', borderRadius:6,
              padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer',
            }}>Add to Plan</button>
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--text3)' }}>
          Upgrades are handled via email — we'll respond within 24 hours ·{' '}
          <a href={`mailto:${email}`} style={{ color:'var(--np-green2)' }}>{email}</a>
        </div>
      </div>
    </div>
  )
}
