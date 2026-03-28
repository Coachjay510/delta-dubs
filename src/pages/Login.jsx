import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(92,184,0,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(92,184,0,.03) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
        pointerEvents: 'none',
      }} />

      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 500,
        background: 'radial-gradient(ellipse, rgba(92,184,0,.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 440,
        margin: '0 auto',
        padding: '0 24px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 52,
            letterSpacing: 4,
            color: 'var(--np-green2)',
            lineHeight: 1,
            marginBottom: 8,
          }}>NP</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            letterSpacing: 2,
            color: 'var(--text)',
            marginBottom: 4,
          }}>NEXT PLAY</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 3,
            color: 'var(--text3)',
            textTransform: 'uppercase',
          }}>Sports Media & Management</div>
        </div>

        {/* Sign in box */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 14,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,.5)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            letterSpacing: .5,
            marginBottom: 6,
          }}>Sign in</div>
          <div style={{
            fontSize: 13,
            color: 'var(--text3)',
            marginBottom: 28,
            lineHeight: 1.6,
          }}>
            Access your Delta Dubs org dashboard
          </div>

          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              padding: '13px 20px',
              background: '#fff',
              border: '1px solid rgba(255,255,255,.15)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#1a1a1a',
              fontFamily: 'var(--font-body)',
              transition: 'all .15s',
              marginBottom: 16,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f5f5f5'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Google SVG icon */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            fontSize: 11,
            color: 'var(--text3)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            Only authorized Delta Dubs admins and staff can sign in.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text3)',
          letterSpacing: 1,
        }}>
          © 2026 NEXT PLAY SPORTS MEDIA
        </div>

      </div>
    </div>
  )
}
