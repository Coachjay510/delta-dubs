export default function TrialBanner({ daysLeft, onUpgrade }) {
  const urgent = daysLeft <= 3

  return (
    <div style={{
      background: urgent ? 'rgba(239,68,68,.1)' : 'rgba(92,184,0,.08)',
      borderBottom: `1px solid ${urgent ? 'rgba(239,68,68,.3)' : 'rgba(92,184,0,.25)'}`,
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: urgent ? '#ef4444' : '#5cb800',
        flexShrink: 0,
      }}/>
      <span style={{ fontSize: 12, color: urgent ? '#ef4444' : '#5cb800', fontWeight: 600 }}>
        {daysLeft === 1 ? 'Last day' : `${daysLeft} days`} left in your free trial
      </span>
      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
        {urgent
          ? 'Subscribe now to keep access to your data and features.'
          : 'Explore all features free — no credit card required.'}
      </span>
      <div style={{ flex: 1 }}/>
      <button
        onClick={onUpgrade}
        style={{
          background: urgent ? '#ef4444' : 'var(--green)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 16px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}>
        {urgent ? 'Subscribe Now' : 'View Plans'}
      </button>
    </div>
  )
}
