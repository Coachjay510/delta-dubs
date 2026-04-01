export default function TrialBanner({ daysLeft, tier, onUpgrade }) {
  const isFree   = tier === 'Rookie' || tier === 'Free'
  const urgent   = !isFree && daysLeft <= 3
  const expiring = !isFree && daysLeft <= 7

  // Free tier — no trial countdown, just a soft upgrade nudge
  if (isFree) {
    return (
      <div style={{
        background: 'rgba(92,184,0,.06)',
        borderBottom: '1px solid rgba(92,184,0,.15)',
        padding: '6px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:'#5cb800', flexShrink:0 }}/>
        <span style={{ fontSize:12, color:'#5cb800', fontWeight:600 }}>Free Plan</span>
        <span style={{ fontSize:12, color:'var(--text3)' }}>
          Upgrade to Varsity or Pro for more teams, stats, film room, and recruiting tools.
        </span>
        <div style={{ flex:1 }}/>
        <button onClick={onUpgrade} style={{
          background:'transparent', color:'var(--np-green2)',
          border:'1px solid rgba(92,184,0,.4)', borderRadius:6,
          padding:'5px 14px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0,
        }}>View Plans</button>
      </div>
    )
  }

  // Paid trial
  return (
    <div style={{
      background: urgent ? 'rgba(239,68,68,.1)' : 'rgba(92,184,0,.08)',
      borderBottom: `1px solid ${urgent ? 'rgba(239,68,68,.3)' : 'rgba(92,184,0,.25)'}`,
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
    }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background: urgent?'#ef4444':'#5cb800', flexShrink:0 }}/>
      <span style={{ fontSize:12, color: urgent?'#ef4444':'#5cb800', fontWeight:600 }}>
        {daysLeft === 1 ? 'Last day' : `${daysLeft} days`} left in your free trial
      </span>
      <span style={{ fontSize:12, color:'var(--text3)' }}>
        {urgent
          ? 'Upgrade now to keep access to your data and features.'
          : 'Explore all features free — no credit card required.'}
      </span>
      <div style={{ flex:1 }}/>
      <button onClick={onUpgrade} style={{
        background: urgent ? '#ef4444' : 'var(--green)',
        color: '#fff', border:'none', borderRadius:6,
        padding:'6px 16px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0,
      }}>
        {urgent ? 'Upgrade Now' : 'View Plans'}
      </button>
    </div>
  )
}
