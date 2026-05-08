import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import {
  computeStamina, staminaColour, isValidCover,
  URGENCY, FORMATION_SUGGESTIONS, confidenceLevel, computeClientRecs,
} from '../utils/football'

// ── Top-level ─────────────────────────────────────────────────────────────

export default function Planner() {
  const { selectedTeam, fetchSquad } = useTeam()
  const [tab, setTab] = useState('injury')   // 'injury' | 'scenario'
  const [xi, setXi]   = useState([])
  const [bench, setBench] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]    = useState(null)

  useEffect(() => {
    if (!selectedTeam) return
    setLoading(true)
    fetchSquad(selectedTeam.id, selectedTeam.leagueCode)
      .then(data => { setXi(data.xi ?? []); setBench(data.bench ?? []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [selectedTeam?.id])

  if (!selectedTeam) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', gap: 14 }}>
        <span style={{ fontSize: 40 }}>📋</span>
        <h2 style={{ fontFamily: 'Rajdhani', fontSize: 26, color: 'var(--text)', margin: 0 }}>No team selected</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Select a team first to use the planner.</p>
        <Link to="/" style={{ background: 'var(--green)', color: '#000', padding: '10px 24px', borderRadius: 6, textDecoration: 'none', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14 }}>
          ← Select a Team
        </Link>
      </div>
    )
  }

  return (
    <main style={{ padding: '28px 28px', maxWidth: 1150, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        {selectedTeam.crestUrl && (
          <img src={selectedTeam.crestUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        )}
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          {selectedTeam.name} — Planner
        </h1>
      </div>

      {loading && <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>Loading squad…</div>}
      {error && <div style={{ color: 'var(--amber)', background: 'rgba(255,184,0,0.06)', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>{error}</div>}

      {!loading && xi.length > 0 && (
        <>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key: 'injury',   label: '🚑 Injury Management' },
              { key: 'scenario', label: '📊 Scenario Planner'  },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: 'none', border: 'none',
                borderBottom: tab === t.key ? '2px solid var(--green)' : '2px solid transparent',
                color: tab === t.key ? 'var(--green)' : 'var(--muted)',
                fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15,
                padding: '8px 20px', cursor: 'pointer',
                letterSpacing: '0.06em', transition: 'color 0.15s',
                marginBottom: -1,
              }}>{t.label}</button>
            ))}
          </div>

          {tab === 'injury'   && <InjuryTab   xi={xi} bench={bench} />}
          {tab === 'scenario' && <ScenarioTab xi={xi} bench={bench} />}
        </>
      )}
    </main>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — INJURY MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

function InjuryTab({ xi, bench }) {
  const [injuredIds, setInjuredIds] = useState(new Set())
  const [minute, setMinute]         = useState(60)

  const enriched = useMemo(() =>
    xi.map(p => ({ ...p, stamina_pct: computeStamina(p.position, minute) })),
    [xi, minute]
  )

  function toggleInjury(id) {
    setInjuredIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Minute slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>Match minute:</span>
        <input type="range" min={1} max={90} value={minute}
          onChange={e => setMinute(Number(e.target.value))}
          style={{ width: 140, accentColor: 'var(--green)' }} />
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text)', minWidth: 32 }}>{minute}'</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {enriched.map(player => (
          <InjuryCard
            key={player.id}
            player={player}
            injured={injuredIds.has(player.id)}
            onToggleInjury={() => toggleInjury(player.id)}
            bench={bench}
          />
        ))}
      </div>
    </div>
  )
}

function InjuryCard({ player, injured, onToggleInjury, bench }) {
  const urgency = URGENCY[player.position] ?? URGENCY.CM
  const colour  = staminaColour(player.stamina_pct)

  // Find best replacement
  const replacement = useMemo(() => {
    const directMatches = bench.filter(b =>
      b.position?.toUpperCase() === player.position?.toUpperCase()
    )
    const coverMatches  = bench.filter(b =>
      isValidCover(player.position, b.position) &&
      b.position?.toUpperCase() !== player.position?.toUpperCase()
    )
    const candidates = [...directMatches, ...coverMatches]
      .sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0))
    return candidates[0] ?? null
  }, [bench, player.position])

  const direct  = replacement?.position?.toUpperCase() === player.position?.toUpperCase()
  const noSub   = !replacement

  return (
    <div
      className="glass"
      style={{
        padding: '12px 14px',
        border: injured
          ? '1px solid rgba(255,61,61,0.4)'
          : '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Player row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <PosBadge pos={player.position} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{player.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{ width: 72, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${player.stamina_pct}%`, height: '100%', background: colour }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{player.stamina_pct}%</span>
          </div>
        </div>
        <button
          onClick={onToggleInjury}
          style={{
            background: injured ? 'rgba(255,61,61,0.15)' : 'rgba(255,255,255,0.05)',
            border: injured ? '1px solid rgba(255,61,61,0.5)' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6, padding: '5px 9px',
            color: injured ? 'var(--red)' : 'var(--muted)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700,
            transition: 'all 0.15s',
          }}
        >
          {injured ? '✕ Injured' : '🚑 Injure'}
        </button>
      </div>

      {/* Injury panel */}
      {injured && (
        <div style={{
          background: 'rgba(255,61,61,0.06)', borderRadius: 6,
          border: '1px solid rgba(255,61,61,0.15)', padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {/* Urgency */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${urgency.colour}15`,
            border: `1px solid ${urgency.colour}50`,
            borderRadius: 4, padding: '2px 8px',
            color: urgency.colour, fontSize: 10,
            fontFamily: 'Rajdhani', fontWeight: 700,
            alignSelf: 'flex-start',
          }}>
            {urgency.label}
          </div>

          {noSub ? (
            <div>
              <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 4 }}>
                ✗ No direct or cover replacement on bench
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
                💡 {FORMATION_SUGGESTIONS[player.position] ?? 'Consider a tactical adjustment.'}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 2 }}>
                ✓ Best replacement available
              </div>
              <div style={{
                background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.15)',
                borderRadius: 5, padding: '7px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PosBadge pos={replacement.position} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{replacement.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>
                    Impact {replacement.impact_score ?? '—'}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>
                  {replacement.name?.split(' ').pop()} ({replacement.position}) → replaces {player.name?.split(' ').pop()} ({player.position})
                  {direct
                    ? ' — direct position match'
                    : ` — cover role (${player.position}→${replacement.position})`
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — SCENARIO PLANNER
// ══════════════════════════════════════════════════════════════════════════════

const SCENARIOS = [
  { key: 'WINNING', label: 'Winning', icon: '🏆', colour: 'var(--green)', intent: 'protect_lead' },
  { key: 'DRAWING', label: 'Drawing', icon: '⚖️',  colour: 'var(--amber)', intent: 'tactical'     },
  { key: 'LOSING',  label: 'Losing',  icon: '⬇️',  colour: 'var(--red)',   intent: 'chase_game'   },
]

function ScenarioTab({ xi, bench }) {
  const [minute,   setMinute]   = useState(60)
  const [results,  setResults]  = useState(null)
  const [running,  setRunning]  = useState(false)
  // Per-player "what if injured?" toggles
  const [injuredSet, setInjuredSet] = useState(new Set())

  const enrichedXi = useMemo(() =>
    xi
      .filter(p => !injuredSet.has(p.id))
      .map(p => ({ ...p, minutes_played: minute, stamina_pct: computeStamina(p.position, minute) })),
    [xi, minute, injuredSet]
  )

  async function runScenarios() {
    setRunning(true)
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starting_xi: enrichedXi, bench, minute }),
      })
      setResults(await res.json())
    } catch {
      // Client-side fallback
      const fallback = {}
      for (const sc of SCENARIOS) {
        const subs = computeClientRecs(enrichedXi, bench, sc.intent)
        const avg  = subs.length ? subs.reduce((s, r) => s + r.impact_score, 0) / subs.length : 50
        fallback[sc.key] = {
          intent: sc.intent,
          top2_subs: subs.slice(0, 2),
          win_probability_delta: parseFloat((0.05 + 0.001 * avg).toFixed(4)),
        }
      }
      setResults(fallback)
    } finally {
      setRunning(false)
    }
  }

  function toggleInjured(id) {
    setInjuredSet(prev => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
    })
  }

  return (
    <div>
      {/* Controls row */}
      <div className="glass" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>Minute</span>
          <input type="range" min={1} max={90} value={minute}
            onChange={e => setMinute(Number(e.target.value))}
            style={{ width: 130, accentColor: 'var(--green)' }} />
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text)', minWidth: 30 }}>{minute}'</span>
        </div>
        <button onClick={runScenarios} disabled={running} style={{
          background: running ? 'rgba(0,255,135,0.3)' : 'var(--green)',
          color: '#000', border: 'none', borderRadius: 6,
          fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 14,
          padding: '9px 24px', cursor: running ? 'not-allowed' : 'pointer',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {running ? 'Running…' : '⚡ Run Scenarios'}
        </button>
      </div>

      {/* "What if injured?" player grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Rajdhani', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          What if injured? (removes from XI for scenario calculation)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {xi.map(p => (
            <button
              key={p.id}
              onClick={() => toggleInjured(p.id)}
              style={{
                background: injuredSet.has(p.id) ? 'rgba(255,61,61,0.15)' : 'rgba(255,255,255,0.04)',
                border: injuredSet.has(p.id) ? '1px solid rgba(255,61,61,0.5)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 5, padding: '4px 10px',
                color: injuredSet.has(p.id) ? 'var(--red)' : 'var(--muted)',
                fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {injuredSet.has(p.id) ? '✕ ' : ''}{p.name?.split(' ').pop()} ({p.position})
            </button>
          ))}
        </div>
        {injuredSet.size > 0 && (
          <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 6 }}>
            {injuredSet.size} player{injuredSet.size > 1 ? 's' : ''} excluded from scenarios
          </div>
        )}
      </div>

      {/* Scenario columns */}
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          {SCENARIOS.map(sc => (
            <ScenarioColumn
              key={sc.key}
              sc={sc}
              result={results[sc.key]}
              xiAtMinute={enrichedXi}
              bench={bench}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ScenarioColumn({ sc, result, xiAtMinute, bench }) {
  const [overrideId, setOverrideId] = useState('')
  if (!result) return null

  const delta = (result.win_probability_delta * 100).toFixed(1)
  const overridePlayer = bench.find(b => String(b.id) === overrideId)

  return (
    <div className="glass" style={{ padding: '16px 14px', border: `1px solid ${sc.colour}22` }}>
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{sc.icon}</span>
        <div>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 17, color: sc.colour }}>{sc.label}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{result.intent.replace('_', ' ')}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 20, color: sc.colour }}>+{delta}%</div>
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>win Δ</div>
        </div>
      </div>

      {/* Mini stamina list */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>XI Stamina at {xiAtMinute[0]?.minutes_played ?? 60}'</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
          {xiAtMinute.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 8, color: 'var(--muted)', minWidth: 24, fontFamily: 'Rajdhani', fontWeight: 600 }}>{p.position}</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${p.stamina_pct}%`, height: '100%', background: staminaColour(p.stamina_pct) }} />
              </div>
              <span style={{ fontSize: 8, color: 'var(--muted)', minWidth: 22 }}>{p.stamina_pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 2 subs */}
      {(result.top2_subs ?? []).length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 10 }}>
          No fatigued players at this minute.
        </div>
      )}
      {(result.top2_subs ?? []).map((sub, i) => {
        const conf = confidenceLevel(sub.stamina_pct, sub.position_valid)
        return (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 7, padding: '9px 10px', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: 'var(--red)' }}>▼ {sub.subOff?.name?.split(' ').pop()}</span>
                <span style={{ color: 'var(--muted)', margin: '0 4px', fontSize: 10 }}>→</span>
                <span style={{ color: 'var(--green)' }}>▲ {sub.subOn?.name?.split(' ').pop()}</span>
              </span>
              <ConfBadge level={conf} />
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
              {sub.reasoning}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--red)' }}>{sub.stamina_pct}% sta</span>
              <span style={{ fontSize: 9, color: 'var(--green)' }}>Impact {sub.impact_score}</span>
              <span style={{ fontSize: 9, color: sub.position_valid ? 'var(--green)' : 'var(--amber)' }}>
                {sub.position_valid ? '✓ valid' : '⚠ mismatch'}
              </span>
            </div>
          </div>
        )
      })}

      {/* Manual override */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
        <div style={{ fontSize: 9.5, color: 'var(--muted)', marginBottom: 5 }}>Force a specific sub instead:</div>
        <select
          value={overrideId}
          onChange={e => setOverrideId(e.target.value)}
          style={{
            background: 'var(--bg-deep)', color: 'var(--text)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5,
            padding: '5px 8px', fontSize: 11, width: '100%', outline: 'none',
          }}
        >
          <option value="">— Select bench player —</option>
          {bench.map(b => (
            <option key={b.id} value={b.id}>{b.name} ({b.position})</option>
          ))}
        </select>

        {overridePlayer && (() => {
          // Find lowest-stamina player in XI matching the override's cover
          const targets = xiAtMinute
            .filter(p => isValidCover(p.position, overridePlayer.position))
            .sort((a, b) => a.stamina_pct - b.stamina_pct)
          const target = targets[0]
          const valid  = !!target
          return (
            <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.5 }}>
              {valid ? (
                <>
                  <span style={{ color: 'var(--green)' }}>✓ {overridePlayer.position} can cover </span>
                  <span style={{ color: 'var(--text)' }}>
                    → suggested target: {target.name?.split(' ').pop()} ({target.position}, {target.stamina_pct}% sta)
                  </span>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                    Impact comparison: Override={overridePlayer.impact_score ?? '—'} vs Rec={result.top2_subs?.[0]?.subOn?.impact_score ?? '—'}
                  </div>
                </>
              ) : (
                <span style={{ color: 'var(--amber)' }}>
                  ⚠ No valid target for {overridePlayer.position} in this XI
                </span>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Shared small components ────────────────────────────────────────────────

function PosBadge({ pos }) {
  return (
    <span style={{
      background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)',
      borderRadius: 4, padding: '1px 6px',
      fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--green)',
      flexShrink: 0,
    }}>
      {pos}
    </span>
  )
}

function ConfBadge({ level }) {
  const colours = {
    HIGH:   { bg: 'rgba(0,255,135,0.1)',   border: 'rgba(0,255,135,0.4)',   color: 'var(--green)' },
    MEDIUM: { bg: 'rgba(255,184,0,0.1)',   border: 'rgba(255,184,0,0.4)',   color: 'var(--amber)' },
    LOW:    { bg: 'rgba(107,122,141,0.1)', border: 'rgba(107,122,141,0.4)', color: 'var(--muted)' },
  }
  const c = colours[level] ?? colours.LOW
  return (
    <span style={{
      fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
      padding: '1px 5px', borderRadius: 3,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
    }}>
      {level}
    </span>
  )
}
