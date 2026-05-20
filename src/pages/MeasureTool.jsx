import { useState, useRef, useEffect, useCallback } from 'react'
import { supabasePlayers } from '../lib/supabasePlayers'

const DOOR_HEIGHT_INCHES = 80

function dist(a, b) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

function toFeetInches(inches) {
  const ft = Math.floor(inches / 12)
  const inc = Math.round(inches % 12)
  return `${ft}'${inc}"`
}

const STEPS = [
  { group: 'Calibrate', color: '#facc15', instruction: 'Tap the TOP of a standard door frame (80" tall)' },
  { group: 'Calibrate', color: '#facc15', instruction: 'Tap the BOTTOM of the same door frame' },
  { group: 'Height',    color: '#4ade80', instruction: "Tap the very TOP of the player's head" },
  { group: 'Height',    color: '#4ade80', instruction: "Tap the floor at the player's feet" },
  { group: 'Wingspan',  color: '#60a5fa', instruction: 'Player extends arms wide — tap the LEFT fingertip' },
  { group: 'Wingspan',  color: '#60a5fa', instruction: 'Tap the RIGHT fingertip' },
]

export default function MeasureTool() {
  const params     = new URLSearchParams(window.location.search)
  const playerId   = params.get('playerId')
  const playerName = params.get('name') ? decodeURIComponent(params.get('name')) : null

  const videoRef   = useRef(null)
  const overlayRef = useRef(null)
  const streamRef  = useRef(null)

  const [step,    setStep]    = useState(0)
  const [points,  setPoints]  = useState([])
  const [results, setResults] = useState(null)
  const [camErr,  setCamErr]  = useState(null)
  const [vidSize, setVidSize] = useState({ w: 1280, h: 720 })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Start back camera
  useEffect(() => {
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            const { videoWidth: w, videoHeight: h } = videoRef.current
            setVidSize({ w, h })
          }
        }
      } catch {
        setCamErr('Camera access denied — please allow camera permission and reload.')
      }
    }
    start()
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // Redraw overlay whenever points change
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const colors = ['#facc15', '#4ade80', '#60a5fa']

    // Lines between each pair
    for (let pair = 0; pair < 3; pair++) {
      const a = points[pair * 2]
      const b = points[pair * 2 + 1]
      if (a && b) {
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = colors[pair]
        ctx.lineWidth = 2
        ctx.setLineDash([8, 5])
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Dots
    points.forEach((p, i) => {
      const color = colors[Math.floor(i / 2)]
      ctx.beginPath()
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = color + '33'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  }, [points])

  const handleTap = useCallback((e) => {
    if (step >= 6) return
    e.preventDefault()
    const canvas = overlayRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    const x = (src.clientX - rect.left) * scaleX
    const y = (src.clientY - rect.top)  * scaleY

    const newPts  = [...points, { x, y }]
    const nextStep = step + 1
    setPoints(newPts)
    setStep(nextStep)

    if (nextStep === 6) {
      const [doorTop, doorBot, headTop, footBot, leftTip, rightTip] = newPts
      const doorPx  = dist(doorTop, doorBot)
      const ppi     = doorPx / DOOR_HEIGHT_INCHES
      const height  = dist(headTop, footBot) / ppi
      const wingspan = dist(leftTip, rightTip) / ppi
      setResults({ height, wingspan })
    }
  }, [step, points])

  const reset = () => { setStep(0); setPoints([]); setResults(null); setSaved(false) }

  async function saveToProfile() {
    if (!playerId || !results) return
    setSaving(true)
    await supabasePlayers.from('players').update({
      height_inches:  Math.round(results.height),
      wingspan_inches: Math.round(results.wingspan),
    }).eq('id', playerId)
    setSaving(false)
    setSaved(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (camErr) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--red)', marginBottom: 12 }}>{camErr}</div>
      <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  )

  const current = STEPS[step] || null

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 40px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => window.history.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: 0 }}>
          ←
        </button>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text1)', letterSpacing: 1 }}>
            MEASURE
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {playerName ? `${playerName} — height & wingspan` : 'Height & Wingspan — door frame calibration'}
          </div>
        </div>
      </div>

      {/* Camera + overlay */}
      <div style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden',
        background: '#000', boxShadow: '0 4px 24px rgba(0,0,0,.4)',
      }}>
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: '100%', display: 'block', maxHeight: '55vh', objectFit: 'cover' }}
        />
        <canvas
          ref={overlayRef}
          width={vidSize.w}
          height={vidSize.h}
          onMouseDown={handleTap}
          onTouchStart={handleTap}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            cursor: step < 6 ? 'crosshair' : 'default',
            touchAction: 'none',
          }}
        />

        {/* Step badge overlay */}
        {current && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(0,0,0,.7)', borderRadius: 8,
            padding: '4px 10px', backdropFilter: 'blur(4px)',
          }}>
            <span style={{ fontSize: 11, color: current.color, fontWeight: 700, letterSpacing: 1 }}>
              {current.group.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>
              {step + 1}/6
            </span>
          </div>
        )}
      </div>

      {/* Instruction card */}
      {step < 6 && (
        <div style={{
          marginTop: 14, background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 11, color: current.color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
            {current.group} — tap to place point
          </div>
          <div style={{ fontSize: 15, color: 'var(--text1)', fontWeight: 600, lineHeight: 1.4 }}>
            {current.instruction}
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 4,
                background: i < step ? s.color : i === step ? s.color + '66' : 'var(--border)',
                transition: 'background .2s',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{
          marginTop: 14, background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 12, padding: 20,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Results
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Height</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, color: 'var(--text1)', lineHeight: 1 }}>
                {toFeetInches(results.height)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{Math.round(results.height)}" total</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Wingspan</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, color: 'var(--text1)', lineHeight: 1 }}>
                {toFeetInches(results.wingspan)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{Math.round(results.wingspan)}" total</div>
            </div>
          </div>

          {/* Ratio note */}
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'var(--bg)', borderRadius: 8,
            fontSize: 12, color: 'var(--text3)',
          }}>
            Wingspan ratio: <span style={{ color: 'var(--text1)', fontWeight: 600 }}>
              {(results.wingspan / results.height).toFixed(2)}
            </span>
            <span style={{ marginLeft: 8, color: 'var(--text3)' }}>
              {results.wingspan > results.height ? `+${Math.round(results.wingspan - results.height)}" above height` : `${Math.round(results.height - results.wingspan)}" below height`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={reset} style={{ flex: 1 }}>
              Measure Again
            </button>
            {playerId && (
              <button
                className="btn btn-primary"
                onClick={saveToProfile}
                disabled={saving || saved}
                style={{ flex: 1 }}
              >
                {saved ? '✓ Saved' : saving ? 'Saving…' : `Save to ${playerName ? playerName.split(' ')[0] : 'Profile'}`}
              </button>
            )}
          </div>
          {saved && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--np-green2)', textAlign: 'center' }}>
              Height & wingspan saved to {playerName}'s profile.
            </div>
          )}
        </div>
      )}

      {/* Tips — only on first step */}
      {step === 0 && (
        <div style={{
          marginTop: 14, padding: '12px 16px',
          background: 'var(--card)', borderRadius: 10,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Tips</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text3)', lineHeight: 2 }}>
            <li>Use a standard interior door — most are exactly 80"</li>
            <li>Player stands flat against the wall next to the door</li>
            <li>Hold the phone steady, fit the full body in frame</li>
            <li>Good lighting = better accuracy (±1–2")</li>
          </ul>
        </div>
      )}
    </div>
  )
}
