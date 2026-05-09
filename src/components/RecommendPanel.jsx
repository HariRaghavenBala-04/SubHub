/**
 * Slide-in recommendation panel — top-3 subs with FC26 enrichment + Apply Sub.
 *
 * Props:
 *  recs       : array from /api/recommend (or client fallback) — new sub_off/sub_on format
 *  onClose    : fn
 *  onApply    : fn(rec)
 *  onHoverRec : fn(rec | null) — highlight sub-off/sub-on on hover
 */

const CONF_STYLE = {
  HIGH:   { bg: 'rgba(0,255,135,0.12)',   border: 'rgba(0,255,135,0.4)',   color: 'var(--green)' },
  MEDIUM: { bg: 'rgba(255,184,0,0.1)',    border: 'rgba(255,184,0,0.4)',   color: 'var(--amber)' },
  LOW:    { bg: 'rgba(107,122,141,0.12)', border: 'rgba(107,122,141,0.4)', color: 'var(--muted)' },
}

const COMPAT_STYLE = {
  direct:    { color: 'var(--green)',  label: '✓ Direct'    },
  safe:      { color: '#c8e600',       label: '~ Safe'       },
  risky:     { color: 'var(--amber)',  label: '⚠ Risky'     },
  emergency: { color: 'var(--red)',    label: '⚡ Emergency' },
  invalid:   { color: 'var(--red)',    label: '✕ Invalid'   },
}

export default function RecommendPanel({ recs = [], conflictWarning = null, onClose, onApply, onHoverRec }) {
  if (!recs.length && !conflictWarning) return null

  return (
    <div
      className="slide-in glass"
      style={{
        position: 'absolute', top: 0, right: 0,
        width: 296, height: '100%',
        overflowY: 'auto', zIndex: 20,
        padding: '14px 12px',
        display: 'flex', flexDirection: 'column', gap: 10,
        borderLeft: '2px solid rgba(0,255,135,0.3)',
        borderRadius: 0,
        background: '#0f1318',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15,
          color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          ⚡ Sub Recommendations
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 17, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
        }}>✕</button>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: -4, flexShrink: 0 }}>
        FC26 2025/26 intelligence engine
      </div>

      {/* Conflict warning card */}
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

      {recs.map((rec, i) => (
        <RecCard
          key={i}
          rec={rec}
          rank={rec.rank ?? i + 1}
          onApply={onApply}
          onHoverRec={onHoverRec}
        />
      ))}
    </div>
  )
}

function RecCard({ rec, rank, onApply, onHoverRec }) {
  const {
    sub_off, sub_on,
    upgrade_delta, monte_carlo,
    compatibility, reasoning, game_context,
    // legacy fields
    position_compatibility, compatibility_warning,
    attribute_comparison = [], confidence, tactical_note,
  } = rec

  // Support both new (monte_carlo.confidence_label) and legacy (confidence) format
  const conf     = (monte_carlo?.confidence_label || sub_on?.confidence || confidence || 'LOW').toUpperCase()
  const cs       = CONF_STYLE[conf] ?? CONF_STYLE.LOW
  const compat   = (compatibility || position_compatibility || 'direct').toLowerCase()
  const cs2      = COMPAT_STYLE[compat] ?? COMPAT_STYLE.invalid
  const rankColour = rank === 1 ? 'var(--green)' : rank === 2 ? 'var(--amber)' : 'var(--muted)'

  const staminaPct  = sub_off?.stamina_pct ?? 0
  const wpDelta     = monte_carlo?.win_probability_delta ?? rec.win_probability_delta ?? 0
  const impactScore = sub_on?.impact_score ?? 0

  // Attribute rows: prefer new upgrade_delta.comparisons, fall back to legacy attribute_comparison
  const attrRows = upgrade_delta?.comparisons ?? attribute_comparison ?? []

  // Stamina bar colour
  const staColor = staminaPct < 40 ? 'var(--red)' : staminaPct < 60 ? 'var(--amber)' : '#ffb800'

  return (
    <div
      className="glass"
      style={{
        padding: '9px 10px',
        border: rank === 1 ? '1px solid rgba(0,255,135,0.25)' : '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', gap: 6,
        flexShrink: 0, cursor: 'default',
      }}
      onMouseEnter={() => onHoverRec?.(rec)}
      onMouseLeave={() => onHoverRec?.(null)}
    >
      {/* Rank row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 17, color: rankColour, minWidth: 22 }}>
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
        {/* Monte Carlo confidence */}
        <span style={{
          fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
          padding: '1px 5px', borderRadius: 3,
          background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{conf}</span>
      </div>

      {/* SUB OFF section */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 5 }}>
        <div style={{ fontSize: 8, color: 'var(--red)', fontFamily: 'Rajdhani', fontWeight: 700, marginBottom: 3 }}>
          SUB OFF · {sub_off?.name} · {sub_off?.slot ?? sub_off?.position}
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
            {(sub_off.reasons).slice(0, 2).map((r, i) => (
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

      {/* SUB ON section */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 5 }}>
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
        {sub_on?.key_upgrade && (
          <div style={{ fontSize: 8.5, color: 'var(--green)', marginTop: 2 }}>↑ {sub_on.key_upgrade}</div>
        )}
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
          {upgrade_delta.verdict} ({upgrade_delta.upgrade_count}/{upgrade_delta.total_attrs} attrs)
        </div>
      )}

      {/* Reasoning */}
      <div style={{
        fontSize: 9, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5,
        borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 4,
      }}>
        {reasoning}
      </div>

      {/* Win probability + position + game context */}
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
        {(game_context) && (
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
            {(game_context || '').slice(0, 80)}
          </div>
        )}
      </div>

      {/* Compatibility warning (legacy) */}
      {compatibility_warning && (
        <div style={{ fontSize: 8.5, color: 'var(--amber)', background: 'rgba(255,184,0,0.07)', borderRadius: 3, padding: '3px 6px', lineHeight: 1.4 }}>
          ⚠ {compatibility_warning}
        </div>
      )}

      {/* Apply Sub button */}
      <button
        onClick={() => onApply?.(rec)}
        style={{
          marginTop: 2, width: '100%',
          background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.4)',
          borderRadius: 5, color: 'var(--green)',
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11,
          padding: '5px 0', cursor: 'pointer',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(0,255,135,0.22)' }}
        onMouseLeave={e => { e.target.style.background = 'rgba(0,255,135,0.12)' }}
      >
        ✓ Apply Sub
      </button>
    </div>
  )
}

function AttrRow({ row }) {
  const { attr, bench_val, starter_val, delta, is_upgrade } = row
  const colour = is_upgrade ? 'var(--green)' : 'var(--red)'
  const arrow  = is_upgrade ? '↑' : '↓'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5 }}>
      <span style={{ color: 'var(--muted)', minWidth: 52, textTransform: 'capitalize' }}>{attr}</span>
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{starter_val}</span>
      <span style={{ color: 'var(--muted)', fontSize: 7 }}>→</span>
      <span style={{ color, fontWeight: 700 }}>{bench_val}</span>
      <span style={{ color, fontWeight: 700 }}>{arrow}</span>
      {delta !== undefined && (
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7.5 }}>({delta > 0 ? '+' : ''}{delta})</span>
      )}
    </div>
  )
}

function Chip({ label, colour }) {
  return (
    <span style={{
      fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
      letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 3,
      background: `${colour}15`, border: `1px solid ${colour}50`,
      color: colour, textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
