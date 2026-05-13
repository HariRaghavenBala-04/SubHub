/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */

/**
 * Slide-in recommendation panel.
 * Handles substitution, positional_swap, and hold recommendation types.
 *
 * Props:
 *  recs          : array from /api/recommend — mixed types
 *  urgencyMode   : "DESPERATION" | "CHASING" | "BALANCED" | "PROTECT" | "CONTROL" | null
 *  conflictWarning : null or conflict dict
 *  onClose       : fn
 *  onApply       : fn(rec)   — substitution apply
 *  onApplySwap   : fn(rec)   — positional swap apply
 *  onHoverRec    : fn(rec | null)
 */

// ── Urgency badge config ───────────────────────────────────────────────────────

const URGENCY_STYLE = {
  DESPERATION: { bg: 'rgba(255,50,50,0.14)',   border: 'rgba(255,80,80,0.5)',   color: '#ff5050', label: 'DESPERATION' },
  CHASING:     { bg: 'rgba(255,184,0,0.12)',   border: 'rgba(255,184,0,0.5)',   color: '#ffb800', label: 'CHASING'     },
  BALANCED:    { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.2)', color: '#e0e0e0', label: 'BALANCED'    },
  PROTECT:     { bg: 'rgba(74,158,255,0.12)',  border: 'rgba(74,158,255,0.45)', color: '#4a9eff', label: 'PROTECT'     },
  CONTROL:     { bg: 'rgba(0,255,135,0.10)',   border: 'rgba(0,255,135,0.4)',   color: '#00ff87', label: 'CONTROL'     },
}

// ── Monte Carlo confidence ─────────────────────────────────────────────────────

const CONF_STYLE = {
  HIGH:   { bg: 'rgba(0,255,135,0.12)',   border: 'rgba(0,255,135,0.4)',   color: 'var(--green)' },
  MEDIUM: { bg: 'rgba(255,184,0,0.10)',   border: 'rgba(255,184,0,0.4)',   color: 'var(--amber)' },
  LOW:    { bg: 'rgba(107,122,141,0.12)', border: 'rgba(107,122,141,0.4)', color: 'var(--muted)' },
}

// ── Position compatibility colours ────────────────────────────────────────────

const COMPAT_STYLE = {
  direct:    { color: 'var(--green)',  label: '✓ Direct'    },
  safe:      { color: '#c8e600',       label: '~ Safe'       },
  risky:     { color: 'var(--amber)',  label: '⚠ Risky'     },
  emergency: { color: 'var(--red)',    label: '⚡ Emergency' },
  invalid:   { color: 'var(--red)',    label: '✕ Invalid'   },
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function RecommendPanel({
  recs = [], urgencyMode = null, groupedWindow = null, conflictWarning = null,
  onClose, onApply, onApplySwap, onHoverRec,
}) {
  const subs   = recs.filter(r => r.type !== 'positional_swap' && r.type !== 'hold' && r.type !== 'bench_alert')
  const swaps  = recs.filter(r => r.type === 'positional_swap')
  const holds  = recs.filter(r => r.type === 'hold')
  const alerts = recs.filter(r => r.type === 'bench_alert')

  if (!subs.length && !swaps.length && !holds.length && !alerts.length && !conflictWarning) return null

  // Collect sub names that are part of the grouped window for banner rendering
  const groupedIds = new Set(groupedWindow?.player_ids ?? [])

  const us = urgencyMode ? (URGENCY_STYLE[urgencyMode] ?? null) : null

  return (
    <div
      className="slide-in recommend-panel"
      style={{
        position: 'absolute', top: 0, right: 0,
        width: 296, height: '100%',
        overflowY: 'auto', zIndex: 20,
        padding: '14px 12px',
        display: 'flex', flexDirection: 'column', gap: 10,
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        background: 'linear-gradient(90deg, rgba(200,150,60,0.15), transparent)',
        borderBottom: '1px solid rgba(200,150,60,0.2)',
        margin: '-14px -12px 0', padding: '12px 16px',
      }}>
        <span style={{
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15,
          color: 'var(--card-gold-top)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          ⚡ Sub Recommendations
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 17, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
        }}>✕</button>
      </div>

      {/* Urgency mode badge */}
      {us && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 11,
            letterSpacing: '0.14em', padding: '3px 9px', borderRadius: 4,
            background: us.bg, border: `1px solid ${us.border}`, color: us.color,
            textTransform: 'uppercase',
          }}>
            {us.label}
          </span>
          <span style={{ fontSize: 9, color: 'var(--card-text-muted)' }}>
            FC26 2025/26 intelligence engine
          </span>
        </div>
      )}
      {!us && (
        <div style={{ fontSize: 10, color: 'var(--card-text-muted)', flexShrink: 0 }}>
          FC26 2025/26 intelligence engine
        </div>
      )}

      {/* Conflict warning */}
      {conflictWarning && (
        <div style={{
          background: 'rgba(255,50,50,0.09)', border: '1px solid rgba(255,80,80,0.35)',
          borderRadius: 6, padding: '8px 10px', flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11, color: '#ff6464', marginBottom: 4 }}>
            ❌ TACTICAL CONFLICT
          </div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,100,100,0.9)', lineHeight: 1.4, marginBottom: 4 }}>
            {conflictWarning.message}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: 4 }}>
            {conflictWarning.reason}
          </div>
          <div style={{ fontSize: 9, color: 'var(--amber)' }}>
            Recommended: {conflictWarning.recommended_formation}
            {' · '}Win modifier: {Math.round((conflictWarning.win_probability_modifier - 1) * 100)}% active
          </div>
        </div>
      )}

      {/* Grouped window banner */}
      {groupedWindow && subs.length >= 2 && (
        <div style={{
          background: 'rgba(200,150,60,0.08)',
          border: '1px solid rgba(200,150,60,0.35)',
          borderRadius: 5, padding: '6px 10px', flexShrink: 0,
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 10,
          color: 'var(--card-gold-top)', letterSpacing: '0.06em',
        }}>
          SUGGESTED: Make these {groupedWindow.suggested_count} changes together
          <div style={{ fontWeight: 400, fontSize: 8.5, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 0 }}>
            {groupedWindow.reasoning}
          </div>
        </div>
      )}

      {/* Substitution recommendations */}
      {subs.map((rec, i) => (
        <RecCard
          key={i}
          rec={rec}
          rank={rec.rank ?? i + 1}
          onApply={onApply}
          onHoverRec={onHoverRec}
        />
      ))}

      {/* Hold card */}
      {holds.length > 0 && subs.length === 0 && (
        <HoldCard hold={holds[0]} />
      )}

      {/* Positional swap section */}
      {swaps.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            borderTop: '1px solid rgba(74,158,255,0.2)', paddingTop: 6,
          }}>
            <span style={{
              fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 10,
              color: '#4a9eff', letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              ↔ Tactical Reshuffles
            </span>
            <span style={{ flex: 1, height: 1, background: 'rgba(74,158,255,0.15)' }} />
          </div>
          {swaps.map((rec, i) => (
            <SwapCard key={`swap-${i}`} rec={rec} onApplySwap={onApplySwap} />
          ))}
        </>
      )}
      {/* Bench alert cards */}
      {alerts.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            borderTop: '1px solid rgba(255,184,0,0.2)', paddingTop: 6,
          }}>
            <span style={{
              fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 10,
              color: 'var(--amber)', letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              ⚠ Unused Impact
            </span>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,184,0,0.15)' }} />
          </div>
          {alerts.map((a, i) => (
            <BenchAlertCard key={`alert-${i}`} alert={a} />
          ))}
        </>
      )}
    </div>
  )
}

// ── RecCard — substitution recommendation ─────────────────────────────────────

function RecCard({ rec, rank, onApply, onHoverRec }) {
  const {
    sub_off, sub_on,
    upgrade_delta, monte_carlo,
    compatibility, reasoning, timing_advice, game_context,
    confidence, below_threshold,
    // legacy fields
    position_compatibility, compatibility_warning,
    attribute_comparison = [],
  } = rec

  const conf   = (monte_carlo?.confidence_label || sub_on?.confidence || 'LOW').toUpperCase()
  const cs     = CONF_STYLE[conf] ?? CONF_STYLE.LOW
  const compat = (compatibility || position_compatibility || 'direct').toLowerCase()
  const cs2    = COMPAT_STYLE[compat] ?? COMPAT_STYLE.invalid

  const rankColour  = rank === 1 ? 'var(--green)' : rank === 2 ? 'var(--amber)' : 'var(--muted)'
  const staminaPct  = sub_off?.stamina_pct ?? 0
  const effRating   = sub_off?.effective_rating ?? null
  const wpDelta     = monte_carlo?.win_probability_delta ?? rec.win_probability_delta ?? 0
  const delta       = sub_on?.delta ?? null
  const psfit       = sub_on?.playstyle_fit ?? null
  const attrRows    = upgrade_delta?.comparisons ?? attribute_comparison ?? []
  const staColor    = staminaPct < 40 ? 'var(--red)' : staminaPct < 60 ? 'var(--amber)' : '#ffb800'

  return (
    <div
      className="rec-card-gold"
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        flexShrink: 0, cursor: 'default',
        border: rank === 1
          ? '1px solid rgba(200,150,60,0.5)'
          : '1px solid rgba(200,150,60,0.25)',
        boxShadow: rank === 1 ? '0 0 12px rgba(200,150,60,0.15)' : 'none',
      }}
      onMouseEnter={() => onHoverRec?.(rec)}
      onMouseLeave={() => onHoverRec?.(null)}
    >
      {/* Rank header */}
      <div className="rec-card-gold-header" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 900, fontSize: 18, color: 'var(--card-gold-top)', minWidth: 24 }}>
          #{rank}
        </span>
        <div style={{ flex: 1, lineHeight: 1.3 }}>
          <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12 }}>
            ▼ {sub_off?.name?.split(' ').pop() ?? '?'}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 11, margin: '0 4px' }}>→</span>
          <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 12 }}>
            ▲ {sub_on?.name?.split(' ').pop() ?? '?'}
          </span>
        </div>
        {sub_on?.overall && (
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
            title="FC26 Overall">{sub_on.overall}</span>
        )}
        <span style={{
          fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
          padding: '1px 5px', borderRadius: 3,
          background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{conf}</span>
      </div>

      {/* Card body */}
      <div style={{ padding: '0 10px 9px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* STAMINA ALERT badge */}
        {rec.stamina_override && (
          <div style={{
            background: 'rgba(255,120,0,0.10)', border: '1px solid rgba(255,140,0,0.45)',
            borderRadius: 3, padding: '3px 7px',
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 8.5,
            color: '#ff8c00', letterSpacing: '0.06em',
          }}>
            ⚡ STAMINA ALERT — physical liability, sub required
          </div>
        )}

        {/* BEST AVAILABLE warning */}
        {below_threshold && !rec.stamina_override && (
          <div style={{
            background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.35)',
            borderRadius: 3, padding: '3px 7px',
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 8.5,
            color: 'var(--amber)', letterSpacing: '0.06em',
          }}>
            ⚠ BEST AVAILABLE — below normal threshold
          </div>
        )}

        {/* SUB OFF */}
        <div style={{ borderTop: '1px solid rgba(200,150,60,0.12)', paddingTop: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <div style={{ fontSize: 8, color: 'var(--red)', fontFamily: 'Rajdhani', fontWeight: 700 }}>
              SUB OFF · {sub_off?.name} · {sub_off?.slot ?? sub_off?.position}
            </div>
            {effRating != null && (
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: 'Rajdhani' }}>
                eff {effRating.toFixed(1)}
              </span>
            )}
          </div>
          {/* Stamina bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{ width: `${Math.max(2, staminaPct)}%`, height: '100%', background: staColor, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 8.5, color: staColor, minWidth: 32 }}>{Math.round(staminaPct)}%</span>
          </div>
          {/* Sub reasons */}
          {(sub_off?.reasons ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
              {sub_off.reasons.slice(0, 2).map((r, i) => (
                <span key={i} style={{
                  fontSize: 7.5, fontFamily: 'Rajdhani', fontWeight: 600,
                  padding: '1px 4px', borderRadius: 3,
                  background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
                  color: '#ff8080',
                }}>{r}</span>
              ))}
            </div>
          )}
          {sub_off?.press_flag && (
            <div style={{ fontSize: 8, color: 'var(--amber)', marginTop: 2 }}>⚠ {sub_off.press_flag}</div>
          )}
        </div>

        {/* SUB ON */}
        <div style={{ borderTop: '1px solid rgba(200,150,60,0.12)', paddingTop: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 8, color: 'var(--green)', fontFamily: 'Rajdhani', fontWeight: 700 }}>
              SUB ON · {sub_on?.name} · {sub_on?.slot ?? sub_on?.position}
            </div>
            {sub_on?.tactical_profile && (
              <span style={{
                fontSize: 8, padding: '1px 4px', borderRadius: 3,
                background: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.35)',
                color: '#b57bee',
              }} title={sub_on.tactical_profile}>
                {sub_on.tactical_profile.split(' ')[0]}
              </span>
            )}
          </div>
          {/* Delta + playstyle fit row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {delta != null && (
              <span style={{ fontSize: 8, color: delta >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'Rajdhani', fontWeight: 700 }}>
                Δ {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
              </span>
            )}
            {psfit != null && (
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontFamily: 'Rajdhani' }}>
                fit {psfit.toFixed(0)}/100
              </span>
            )}
            {sub_on?.key_upgrade && (
              <span style={{ fontSize: 8, color: 'var(--green)' }}>↑ {sub_on.key_upgrade}</span>
            )}
          </div>
        </div>

        {/* Attribute comparison (top 3) */}
        {attrRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 4 }}>
            {attrRows.slice(0, 3).map((row, i) => (
              <AttrRow key={i} row={row} />
            ))}
          </div>
        )}

        {/* Upgrade verdict */}
        {upgrade_delta?.verdict && (
          <div style={{ fontSize: 8, color: upgrade_delta.verdict_color === 'green' ? 'var(--green)' : upgrade_delta.verdict_color === 'red' ? 'var(--red)' : 'var(--amber)' }}>
            {upgrade_delta.verdict}
            {upgrade_delta.upgrade_count != null && ` (${upgrade_delta.upgrade_count}/${upgrade_delta.total_attrs} attrs)`}
          </div>
        )}

        {/* Reasoning — manager-voice chain */}
        <div style={{
          fontSize: 9, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.55,
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 4,
        }}>
          {reasoning}
        </div>

        {/* Timing advice */}
        {timing_advice && (
          <div style={{
            fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 600,
            color: timing_advice.startsWith('⚡') ? 'var(--red)'
                 : timing_advice.startsWith('⏱') ? 'rgba(255,255,255,0.35)'
                 : 'var(--amber)',
            letterSpacing: '0.04em',
          }}>
            {timing_advice}
          </div>
        )}

        {/* Win probability + compat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: wpDelta >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'Rajdhani', fontWeight: 700 }}>
              Win prob: {wpDelta >= 0 ? '+' : ''}{wpDelta}%
            </span>
            <span style={{
              fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
              padding: '1px 5px', borderRadius: 3,
              background: `${cs2.color}15`, border: `1px solid ${cs2.color}55`,
              color: cs2.color, textTransform: 'uppercase',
            }}>{cs2.label}</span>
          </div>
          {game_context && (
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
              {String(game_context).slice(0, 80)}
            </div>
          )}
        </div>

        {/* Legacy compatibility warning */}
        {compatibility_warning && (
          <div style={{ fontSize: 8.5, color: 'var(--amber)', background: 'rgba(255,184,0,0.07)', borderRadius: 3, padding: '3px 6px', lineHeight: 1.4 }}>
            ⚠ {compatibility_warning}
          </div>
        )}

        {/* Apply Sub button */}
        <button className="apply-sub-btn" onClick={() => onApply?.(rec)}>
          ✓ Apply Sub
        </button>

      </div>
    </div>
  )
}

// ── HoldCard ───────────────────────────────────────────────────────────────────

function HoldCard({ hold }) {
  const { reasoning, best_delta_available } = hold
  return (
    <div style={{
      background: 'rgba(107,122,141,0.08)',
      border: '1px solid rgba(107,122,141,0.3)',
      borderRadius: 6, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0,
    }}>
      <div style={{
        fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12,
        color: 'var(--muted)', letterSpacing: '0.08em',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ⏸ HOLD
        {best_delta_available != null && (
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
            best Δ {best_delta_available >= 0 ? '+' : ''}{best_delta_available.toFixed(1)}
          </span>
        )}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55, fontStyle: 'italic' }}>
        {reasoning}
      </div>
    </div>
  )
}

// ── SwapCard ───────────────────────────────────────────────────────────────────

function SwapCard({ rec, onApplySwap }) {
  const { player_a, player_b, confidence, gain_pct, gain } = rec
  // Support both new (current_position/swap_to) and legacy (current_slot/new_slot) fields
  const aFrom = player_a.current_position || player_a.current_slot
  const aTo   = player_a.swap_to          || player_a.new_slot
  const bFrom = player_b.current_position || player_b.current_slot
  const bTo   = player_b.swap_to          || player_b.new_slot

  const confStyle = confidence === 'HIGH'
    ? { bg: 'rgba(74,158,255,0.12)', border: 'rgba(74,158,255,0.4)', color: '#4a9eff' }
    : { bg: 'rgba(74,158,255,0.07)', border: 'rgba(74,158,255,0.25)', color: '#7ab8ff' }

  return (
    <div style={{
      background: 'rgba(74,158,255,0.06)',
      border: '1px solid rgba(74,158,255,0.3)',
      borderRadius: 6, flexShrink: 0,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(74,158,255,0.14), transparent)',
        borderBottom: '1px solid rgba(74,158,255,0.18)',
        padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 900, fontSize: 14, color: '#4a9eff' }}>↔</span>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11, color: '#4a9eff', letterSpacing: '0.06em', flex: 1 }}>
          POSITIONAL SWAP
        </span>
        <span style={{
          fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
          padding: '1px 5px', borderRadius: 3,
          background: confStyle.bg, border: `1px solid ${confStyle.border}`, color: confStyle.color,
          letterSpacing: '0.06em',
        }}>{confidence}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Player A */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', minWidth: 80 }}>
            {player_a.name?.split(' ').pop()}
          </span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{aFrom}</span>
          <span style={{ fontSize: 8, color: '#4a9eff' }}>→</span>
          <span style={{ fontSize: 8, color: '#4a9eff', fontWeight: 700 }}>{aTo}</span>
          <span style={{
            fontSize: 8, marginLeft: 'auto',
            color: player_a.rating_after >= player_a.rating_now ? 'var(--green)' : 'var(--amber)',
          }}>
            {player_a.rating_now} → {player_a.rating_after}
          </span>
        </div>
        {/* Player B */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', minWidth: 80 }}>
            {player_b.name?.split(' ').pop()}
          </span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{bFrom}</span>
          <span style={{ fontSize: 8, color: '#4a9eff' }}>→</span>
          <span style={{ fontSize: 8, color: '#4a9eff', fontWeight: 700 }}>{bTo}</span>
          <span style={{
            fontSize: 8, marginLeft: 'auto',
            color: player_b.rating_after >= player_b.rating_now ? 'var(--green)' : 'var(--amber)',
          }}>
            {player_b.rating_now} → {player_b.rating_after}
          </span>
        </div>

        {/* Gain */}
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          Combined positional gain:{' '}
          <span style={{ color: '#4a9eff', fontWeight: 700 }}>
            {gain_pct != null ? `+${gain_pct}%` : gain != null ? `+${gain} pts` : ''}
          </span>
        </div>

        {/* Reasoning */}
        {rec.reasoning && (
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', lineHeight: 1.45 }}>
            {rec.reasoning}
          </div>
        )}

        {/* Apply button */}
        <button
          onClick={() => onApplySwap?.(rec)}
          style={{
            marginTop: 2,
            background: 'rgba(74,158,255,0.12)', border: '1px solid rgba(74,158,255,0.4)',
            borderRadius: 4, color: '#4a9eff',
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 10,
            padding: '5px 0', cursor: 'pointer', width: '100%',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          Apply Swap
        </button>
      </div>
    </div>
  )
}

// ── BenchAlertCard ─────────────────────────────────────────────────────────────

function BenchAlertCard({ alert }) {
  const { player, reasoning } = alert
  return (
    <div style={{
      background: 'rgba(255,184,0,0.05)',
      border: '1px solid rgba(255,184,0,0.2)',
      borderRadius: 6, padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 4,
      flexShrink: 0, opacity: 0.85,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11, color: 'var(--amber)' }}>
          {player.name?.split(' ').pop()}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{player.position}</span>
        {player.overall && (
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
            OVR {player.overall}
          </span>
        )}
      </div>
      <div style={{ fontSize: 8.5, color: 'rgba(255,184,0,0.7)', fontStyle: 'italic', lineHeight: 1.45 }}>
        {reasoning}
      </div>
    </div>
  )
}

// ── AttrRow ────────────────────────────────────────────────────────────────────

function AttrRow({ row }) {
  const { attr, bench_val, starter_val, delta, is_upgrade } = row
  const colour = is_upgrade ? 'var(--green)' : 'var(--red)'
  const arrow  = is_upgrade ? '↑' : '↓'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5 }}>
      <span style={{ color: 'var(--muted)', minWidth: 52, textTransform: 'capitalize' }}>{attr}</span>
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{starter_val}</span>
      <span style={{ color: 'var(--muted)', fontSize: 7 }}>→</span>
      <span style={{ color: colour, fontWeight: 700 }}>{bench_val}</span>
      <span style={{ color: colour, fontWeight: 700 }}>{arrow}</span>
      {delta !== undefined && (
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7.5 }}>({delta > 0 ? '+' : ''}{delta})</span>
      )}
    </div>
  )
}
