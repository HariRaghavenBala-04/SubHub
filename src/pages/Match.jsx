import { useState, useMemo, useCallback } from 'react'
import Pitch from '../components/Pitch'
import BenchRow from '../components/BenchRow'
import RecommendPanel from '../components/RecommendPanel'
import { MOCK_XI, MOCK_BENCH } from '../data/mockPlayers'
import { FORMATIONS, FORMATION_KEYS } from '../data/formations'

const DECAY_RATES = { GK:0.20, CB:0.30, FB:0.35, LB:0.35, RB:0.35, DM:0.40, CM:0.45, W:0.55, LW:0.55, RW:0.55, AM:0.50, ST:0.60, SS:0.55, LWB:0.40, RWB:0.40, LCB:0.30, RCB:0.30, CAM:0.50, LAM:0.50, RAM:0.50 }

function computeStamina(position, minutes) {
  const rate = DECAY_RATES[position?.toUpperCase()] ?? 0.45
  return Math.max(0, Math.round(100 - rate * minutes))
}

const INTENTS = [
  { value: 'protect_lead', label: '🛡 Protect Lead' },
  { value: 'chase_game',   label: '⚔ Chase Game'   },
  { value: 'tactical',     label: '🔄 Tactical Change' },
]

export default function Match() {
  const [formation,   setFormation]   = useState('4-3-3')
  const [minute,      setMinute]      = useState(60)
  const [homeScore,   setHomeScore]   = useState(0)
  const [awayScore,   setAwayScore]   = useState(0)
  const [intent,      setIntent]      = useState('tactical')
  const [recs,        setRecs]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [showPanel,   setShowPanel]   = useState(false)
  const [highlightOff, setHighOff]    = useState(null)
  const [highlightOn,  setHighOn]     = useState(null)
  const [subArrow,    setSubArrow]    = useState(null)

  // Enrich XI with computed stamina
  const xi = useMemo(() =>
    MOCK_XI.map(p => ({
      ...p,
      stamina_pct: computeStamina(p.position, minute),
    })),
    [minute]
  )

  const bench = useMemo(() =>
    MOCK_BENCH.map(p => ({ ...p, stamina_pct: 100 })),
    []
  )

  const formationPositions = FORMATIONS[formation]?.positions ?? FORMATIONS['4-3-3'].positions

  const handleAnalyse = useCallback(async () => {
    setLoading(true)
    setShowPanel(false)
    setHighOff(null)
    setHighOn(null)
    setSubArrow(null)

    try {
      const body = {
        starting_xi: xi.map(p => ({ ...p, minutes_played: minute })),
        bench:        bench,
        home_score:   homeScore,
        away_score:   awayScore,
        minute,
        manager_intent: intent,
      }
      const res  = await fetch('/api/recommend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      setRecs(data)

      // Highlight top recommendation
      if (data.length) {
        const top = data[0]
        setHighOff(top.subOff?.id)
        setHighOn(top.subOn?.id)

        // Find positions for arrow
        const offIdx = xi.findIndex(p => p.id === top.subOff?.id)
        if (offIdx !== -1 && formationPositions[offIdx]) {
          const pitchPos = formationPositions[offIdx]
          // bench arrow starts from bottom
          setSubArrow({
            from: { left: 50, top: 100 },
            to:   { left: pitchPos.left, top: pitchPos.top },
          })
        }
      }
    } catch (e) {
      // Use client-side fallback
      const fallback = computeClientRecs(xi, bench, intent)
      setRecs(fallback)
      if (fallback.length) {
        setHighOff(fallback[0].subOff?.id)
        setHighOn(fallback[0].subOn?.id)
      }
    } finally {
      setLoading(false)
      setShowPanel(true)
    }
  }, [xi, bench, minute, homeScore, awayScore, intent, formationPositions])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 52px)',
        overflow: 'hidden',
      }}
    >
      {/* Controls bar */}
      <div
        className="glass"
        style={{
          padding: '10px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 0,
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        {/* Scoreline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>HOME</span>
          <ScoreInput value={homeScore} onChange={setHomeScore} />
          <span style={{ color: 'var(--muted)', fontSize: 16, fontWeight: 700 }}>–</span>
          <ScoreInput value={awayScore} onChange={setAwayScore} />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>AWAY</span>
        </div>

        {/* Minute slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {minute >= 90 ? `90+${minute - 90}'` : `${minute}'`}
          </span>
          <input
            type="range" min={1} max={100} value={minute}
            onChange={e => setMinute(Number(e.target.value))}
            style={{ width: 100, accentColor: 'var(--green)', cursor: 'pointer' }}
          />
        </div>

        {/* Intent */}
        <div style={{ display: 'flex', gap: 4 }}>
          {INTENTS.map(i => (
            <button
              key={i.value}
              onClick={() => setIntent(i.value)}
              style={{
                background: intent === i.value ? 'rgba(0,255,135,0.15)' : 'transparent',
                border: intent === i.value ? '1px solid rgba(0,255,135,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5,
                color: intent === i.value ? 'var(--green)' : 'var(--muted)',
                fontSize: 11,
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                padding: '4px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {i.label}
            </button>
          ))}
        </div>

        {/* Formation toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {FORMATION_KEYS.map(f => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              style={{
                background: formation === f ? 'rgba(0,255,135,0.15)' : 'transparent',
                border: formation === f ? '1px solid rgba(0,255,135,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5,
                color: formation === f ? 'var(--green)' : 'var(--muted)',
                fontSize: 10,
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                padding: '4px 8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Analyse button */}
        <button
          onClick={handleAnalyse}
          disabled={loading}
          style={{
            marginLeft: 'auto',
            background: loading ? 'rgba(0,255,135,0.3)' : 'var(--green)',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            padding: '8px 22px',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '…' : '⚡ Analyse Subs'}
        </button>
      </div>

      {/* Main content: pitch + side panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Pitch + bench column */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 16px',
            gap: 8,
            overflow: 'hidden',
            transition: 'margin-right 0.35s ease',
            marginRight: showPanel ? 308 : 0,
          }}
        >
          <Pitch
            players={xi}
            formation={formationPositions}
            highlightOffId={highlightOff}
            onPlayerClick={p => {
              setHighOff(prev => prev === p.id ? null : p.id)
            }}
            subArrow={showPanel ? subArrow : null}
          />
          <BenchRow
            bench={bench}
            highlightId={highlightOn}
            onSelect={p => setHighOn(prev => prev === p.id ? null : p.id)}
          />
        </div>

        {/* Recommend panel */}
        {showPanel && (
          <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 308, zIndex: 20 }}>
            <RecommendPanel recs={recs} onClose={() => { setShowPanel(false); setHighOff(null); setHighOn(null); setSubArrow(null) }} />
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreInput({ value, onChange }) {
  return (
    <input
      type="number"
      min={0} max={20}
      value={value}
      onChange={e => onChange(Math.max(0, Number(e.target.value)))}
      style={{
        width: 36,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 4,
        color: 'var(--text)',
        fontSize: 16,
        fontWeight: 700,
        fontFamily: 'Rajdhani, sans-serif',
        textAlign: 'center',
        padding: '3px 2px',
        outline: 'none',
      }}
    />
  )
}

// Client-side fallback recommendation engine
function computeClientRecs(xi, bench, intent) {
  const VALID_COVER = {
    ST:['ST','SS','W'], W:['W','AM','ST','FB'], AM:['AM','CM','W'],
    CM:['CM','DM','AM'], DM:['DM','CM','CB'], FB:['FB','DM','W'],
    CB:['CB','DM','FB'], GK:['GK'],
    LW:['W','AM','ST','FB'], RW:['W','AM','ST','FB'],
    LB:['FB','DM','W'], RB:['FB','DM','W'],
    CAM:['AM','CM','W'], LAM:['AM','CM','W'], RAM:['AM','CM','W'],
  }
  const PRIO = {
    protect_lead: ['CB','DM','GK','FB','CM','W','AM','ST'],
    chase_game:   ['ST','W','AM','CM','DM','FB','CB'],
    tactical:     [],
  }

  const candidates = []
  for (const off of xi) {
    const valid = VALID_COVER[off.position?.toUpperCase()] ?? []
    for (const on of bench) {
      const isValid   = valid.includes(on.position?.toUpperCase())
      const urgency   = Math.max(0, 100 - (off.stamina_pct ?? 80))
      const impact    = on.impact_score ?? 50
      const prio      = PRIO[intent] ?? []
      const prioRank  = prio.indexOf((on.position || 'CM').toUpperCase())
      const composite = urgency * 0.6 + impact * 0.4 * (isValid ? 1 : 0.5) - (prioRank >= 0 ? prioRank : 10) * 0.5
      candidates.push({
        subOff: off,
        subOn:  on,
        stamina_pct:    Math.round(off.stamina_pct ?? 80),
        impact_score:   impact,
        position_valid: isValid,
        composite,
        reasoning: `${off.name.split(' ').pop()} (${Math.round(off.stamina_pct ?? 80)}% stamina) → ${on.name.split(' ').pop()} (Impact: ${impact}, ${off.position}→${on.position} ${isValid ? 'valid' : 'mismatch'})`,
      })
    }
  }
  candidates.sort((a, b) => b.composite - a.composite)
  const seen = new Set()
  const top3 = []
  for (const c of candidates) {
    const key = `${c.subOff.id}-${c.subOn.id}`
    if (!seen.has(c.subOff.id) && !seen.has(`on-${c.subOn.id}`)) {
      seen.add(c.subOff.id)
      seen.add(`on-${c.subOn.id}`)
      top3.push(c)
    }
    if (top3.length === 3) break
  }
  return top3
}
