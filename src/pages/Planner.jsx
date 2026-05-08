import { useState, useCallback } from 'react'
import { MOCK_XI, MOCK_BENCH } from '../data/mockPlayers'

const DECAY_RATES = { GK:0.20, CB:0.30, FB:0.35, LB:0.35, RB:0.35, DM:0.40, CM:0.45, W:0.55, LW:0.55, RW:0.55, AM:0.50, ST:0.60, SS:0.55 }

function computeStamina(pos, min) {
  return Math.max(0, Math.round(100 - (DECAY_RATES[pos?.toUpperCase()] ?? 0.45) * min))
}

function staminaColour(pct) {
  if (pct >= 70) return 'var(--green)'
  if (pct >= 40) return 'var(--amber)'
  return 'var(--red)'
}

const SCENARIOS = [
  { key: 'WINNING', label: 'Winning',  icon: '🏆', intent: 'protect_lead' },
  { key: 'DRAWING', label: 'Drawing',  icon: '⚖️',  intent: 'tactical' },
  { key: 'LOSING',  label: 'Losing',   icon: '⬇️',  intent: 'chase_game' },
]

export default function Planner() {
  const [minute,   setMinute]   = useState(60)
  const [results,  setResults]  = useState(null)
  const [loading,  setLoading]  = useState(false)

  const xi    = MOCK_XI.map(p => ({ ...p, minutes_played: minute, stamina_pct: computeStamina(p.position, minute) }))
  const bench = MOCK_BENCH.map(p => ({ ...p, stamina_pct: 100 }))

  const handleRun = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scenarios', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ starting_xi: xi, bench, minute }),
      })
      const data = await res.json()
      setResults(data)
    } catch {
      // Client-side fallback
      const VALID_COVER = {
        ST:['ST','SS','W'], W:['W','AM','ST','FB'], AM:['AM','CM','W'],
        CM:['CM','DM','AM'], DM:['DM','CM','CB'], FB:['FB','DM','W'],
        CB:['CB','DM','FB'], GK:['GK'],
        LW:['W','AM','ST','FB'], RW:['W','AM','ST','FB'],
        LB:['FB','DM','W'], RB:['FB','DM','W'],
      }
      const makeRec = (off, on) => ({
        subOff: off,
        subOn:  on,
        stamina_pct: off.stamina_pct,
        impact_score: on.impact_score,
        position_valid: (VALID_COVER[off.position?.toUpperCase()] ?? []).includes(on.position?.toUpperCase()),
        reasoning: `${off.name.split(' ').pop()} → ${on.name.split(' ').pop()} (Impact: ${on.impact_score})`,
      })
      const sortedXi    = [...xi].sort((a, b) => a.stamina_pct - b.stamina_pct)
      const sortedBench = [...bench].sort((a, b) => b.impact_score - a.impact_score)
      const fallback = {}
      for (const sc of SCENARIOS) {
        fallback[sc.key] = {
          intent: sc.intent,
          top2_subs: [makeRec(sortedXi[0], sortedBench[0]), makeRec(sortedXi[1], sortedBench[1])],
          win_probability_delta: 0.06,
        }
      }
      setResults(fallback)
    } finally {
      setLoading(false)
    }
  }, [xi, bench, minute])

  return (
    <main style={{ padding: '40px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <h1
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 34,
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}
      >
        Scenario Planner
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
        Simulate substitution decisions across winning, drawing, and losing scenarios.
      </p>

      {/* Controls */}
      <div className="glass" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>
            MINUTE {minute}'
          </span>
          <input
            type="range" min={1} max={100} value={minute}
            onChange={e => setMinute(Number(e.target.value))}
            style={{ width: 140, accentColor: 'var(--green)' }}
          />
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          style={{
            background: loading ? 'rgba(0,255,135,0.3)' : 'var(--green)',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 800,
            fontSize: 15,
            padding: '10px 28px',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {loading ? 'Running…' : '⚡ Run Scenarios'}
        </button>
      </div>

      {/* Squad overview */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Current XI — Stamina at {minute}'
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {xi.map(p => (
            <div
              key={p.id}
              className="glass"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--green)', minWidth: 28 }}>{p.position}</span>
              <span style={{ fontSize: 12, color: 'var(--text)' }}>{p.name.split(' ').pop()}</span>
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${p.stamina_pct}%`, height: '100%', background: staminaColour(p.stamina_pct) }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.stamina_pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario columns */}
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {SCENARIOS.map(sc => {
            const res = results[sc.key]
            if (!res) return null
            const delta = (res.win_probability_delta * 100).toFixed(1)
            return (
              <div
                key={sc.key}
                className="glass"
                style={{ padding: '20px 16px', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 24 }}>{sc.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                      {sc.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{res.intent.replace('_', ' ')}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>
                      +{delta}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>win Δ</div>
                  </div>
                </div>

                {(res.top2_subs ?? []).map((sub, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        <span style={{ color: 'var(--red)' }}>▼ {sub.subOff?.name?.split(' ').pop()}</span>
                        {' → '}
                        <span style={{ color: 'var(--green)' }}>▲ {sub.subOn?.name?.split(' ').pop()}</span>
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: sub.position_valid ? 'rgba(0,255,135,0.1)' : 'rgba(255,184,0,0.1)',
                          border: `1px solid ${sub.position_valid ? 'rgba(0,255,135,0.3)' : 'rgba(255,184,0,0.3)'}`,
                          color: sub.position_valid ? 'var(--green)' : 'var(--amber)',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        {sub.position_valid ? 'Valid' : 'Mismatch'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
                      {sub.reasoning}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--red)' }}>{sub.stamina_pct}% sta</span>
                      <span style={{ fontSize: 10, color: 'var(--green)' }}>Impact {sub.impact_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
