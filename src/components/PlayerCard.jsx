/**
 * PlayerCard — FIFA Rare Gold card design.
 * size: 'normal' → pitch card (72×92), 'small' → bench card (58×74), 'reserve' → reserve card (52×64)
 */
import { staminaColour } from '../utils/football'

const RADIUS = 14
const CIRC   = 2 * Math.PI * RADIUS

// Slot group → badge colour (used for the slot badge border/bg tint only)
function slotColour(slot) {
  if (!slot) return '#6b7a8d'
  const s = slot.toUpperCase()
  if (s === 'GK') return '#f59e0b'
  if (['CB','LCB','RCB','LB','RB','LWB','RWB','FB'].includes(s)) return '#3b82f6'
  if (['DM','CDM','CM','LCM','RCM','LM','RM','LAM','CAM','RAM','AM'].includes(s)) return '#8b5cf6'
  if (['LW','RW','W','ST','CF','SS'].includes(s)) return '#ef4444'
  return '#6b7a8d'
}

// Position-fit dot colour
function fitDotColour(fit) {
  if (fit === 'stretched')   return '#ef4444'
  if (fit === 'comfortable') return '#facc15'
  return null
}

export default function PlayerCard({
  player,
  size            = 'normal',
  highlight       = 'none',
  isInjured       = false,
  dragHandleProps = {},
  onClick,
  style           = {},
}) {
  if (!player) return null

  const {
    name, position, stamina_pct = 80, impact_score = 50,
    overall, tactical_profile,
    assigned_slot, best_slot, position_fit,
  } = player

  const displaySlot = assigned_slot ?? best_slot ?? position ?? '?'
  const dotColour   = assigned_slot ? fitDotColour(position_fit) : null
  const colour      = staminaColour(stamina_pct)
  const dashOffset  = CIRC - (CIRC * Math.min(impact_score, 100)) / 100

  // Card type → CSS class
  const baseClass =
    size === 'reserve' ? 'reserve-card' :
    size === 'small'   ? 'bench-card'   :
                         'player-card'

  // Stamina glow class (pitch cards only — bench/reserve don't pulse)
  const glowClass =
    size === 'normal' && stamina_pct < 40   ? 'stamina-critical' :
    size === 'normal' && stamina_pct >= 95  ? 'bench-fresh'      :
                                              ''

  // Highlight class (sub-off/on visual feedback)
  const hlClass =
    highlight === 'red'   ? 'pulse-red'   :
    highlight === 'green' ? 'pulse-green' : ''

  // Name: show last word only (keeps cards compact)
  const displayName = name?.split(' ').pop() ?? name ?? '?'
  const isLongName  = displayName.length > 10
  const nameClass   = `card-name${isLongName ? ' long-name' : ''}`

  // Stamina fill class
  const staminaFillClass =
    stamina_pct >= 70 ? 'stamina-green' :
    stamina_pct >= 40 ? 'stamina-amber' :
                        'stamina-red'

  // Ring dimensions by size
  const ringSize  = size === 'normal' ? 38 : size === 'small' ? 30 : 26
  const ringMt    = size === 'normal' ? 14 : 10

  // Border override for highlight/injury states (takes precedence over CSS class border)
  const borderOverride =
    highlight === 'red'   ? { border: '1.5px solid rgba(255,61,61,0.85)' } :
    highlight === 'green' ? { border: '1.5px solid rgba(0,255,135,0.85)' } :
    isInjured             ? { border: '1.5px solid rgba(255,61,61,0.6)'  } :
    {}

  return (
    <div
      className={`${baseClass} ${glowClass} ${hlClass}`.trim()}
      onClick={onClick}
      style={{ ...borderOverride, ...style }}
      {...dragHandleProps}
    >
      {/* Injured overlay */}
      {isInjured && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 5,
          background: 'rgba(255,61,61,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 6,
        }}>
          <span style={{ fontSize: size === 'normal' ? 20 : 16 }}>🚑</span>
        </div>
      )}

      {/* Position badge — top left */}
      <span className="card-position-badge">
        {displaySlot}
        {dotColour && (
          <span style={{
            position: 'absolute', top: -2, right: -3,
            width: 5, height: 5, borderRadius: '50%',
            background: dotColour,
            border: '1px solid rgba(8,12,16,0.5)',
          }} />
        )}
      </span>

      {/* Overall rating — top right */}
      {overall && (
        <span className="card-overall">{overall}</span>
      )}

      {/* Impact ring (SVG) */}
      <svg
        width={ringSize} height={ringSize}
        viewBox="0 0 32 32"
        style={{ marginTop: ringMt, flexShrink: 0, position: 'relative', zIndex: 2 }}
      >
        <circle cx="16" cy="16" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
        <circle
          cx="16" cy="16" r={RADIUS} fill="none"
          stroke={colour} strokeWidth="2.5"
          strokeDasharray={CIRC} strokeDashoffset={dashOffset}
          strokeLinecap="round" transform="rotate(-90 16 16)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="16" y="16" textAnchor="middle" dominantBaseline="central"
          fill="var(--card-text)"
          style={{ fontSize: size === 'normal' ? 9 : 8, fontFamily: 'Rajdhani', fontWeight: 700 }}
        >
          {Math.round(impact_score)}
        </text>
      </svg>

      {/* Tactical profile icon (pitch cards only) */}
      {tactical_profile && size === 'normal' && (
        <div style={{
          fontSize: 9, lineHeight: 1, marginTop: 1,
          color: 'var(--card-text-muted)', zIndex: 2,
        }} title={tactical_profile}>
          {tactical_profile.split(' ')[0]}
        </div>
      )}

      {/* Player name */}
      <div className="card-name-wrapper">
        <span className={nameClass}>{displayName}</span>
      </div>

      {/* Stamina bar */}
      <div className="card-stamina-bar">
        <div
          className={`card-stamina-fill ${staminaFillClass}`}
          style={{ width: `${Math.max(2, stamina_pct)}%` }}
        />
      </div>
    </div>
  )
}
