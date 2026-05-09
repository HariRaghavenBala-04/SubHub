/**
 * PlayerCard — FIFA Rare Gold card design.
 * size: 'normal' → pitch card (72×90), 'small' → bench card (60×76), 'reserve' → reserve card (52×66)
 */
import { staminaColour, getPlayerArchetype } from '../utils/football'

function getSurname(name) {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length === 1)
    return parts[0].toUpperCase()
  const prefixes = ['van','de','di','da','mac','mc',
                    'dos','del','der','le','la']
  if (parts.length >= 3) {
    const secondLast = parts[parts.length - 2].toLowerCase()
    if (prefixes.includes(secondLast))
      return parts.slice(-2).join(' ').toUpperCase()
  }
  return parts[parts.length - 1].toUpperCase()
}

const RADIUS = 14
const CIRC   = 2 * Math.PI * RADIUS

// Slot group → badge colour (tint on slot badge)
function slotColour(slot) {
  if (!slot) return '#6b7a8d'
  const s = slot.toUpperCase()
  if (s === 'GK') return '#f59e0b'
  if (['CB','LCB','RCB','LB','RB','LWB','RWB','FB'].includes(s)) return '#3b82f6'
  if (['DM','CDM','CM','LCM','RCM','LM','RM','LAM','CAM','RAM','AM'].includes(s)) return '#8b5cf6'
  if (['LW','RW','W','ST','CF','SS'].includes(s)) return '#ef4444'
  return '#6b7a8d'
}

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

  // Pitch ring: fill = stamina, center = overall rating
  // Bench ring: fill = impact_score, center = impact_score, color = gold
  const isPitch      = size === 'normal'
  const isBench      = size === 'small'
  const ringFill     = isPitch ? stamina_pct : Math.min(impact_score, 100)
  const ringColor    = isPitch ? colour : 'var(--card-rating)'
  const ringCenter   = isPitch ? (overall ?? Math.round(impact_score)) : Math.round(impact_score)
  const dashOffset   = CIRC - (CIRC * ringFill) / 100

  // Card type → CSS class
  const baseClass =
    size === 'reserve' ? 'reserve-card' :
    size === 'small'   ? 'bench-card'   :
                         'player-card'

  // Stamina glow class (pitch cards only)
  const glowClass =
    size === 'normal' && stamina_pct < 40   ? 'stamina-critical' :
    size === 'normal' && stamina_pct >= 95  ? 'bench-fresh'      :
                                              ''

  // Highlight (sub-off/on visual feedback)
  const hlClass =
    highlight === 'red'   ? 'pulse-red'   :
    highlight === 'green' ? 'pulse-green' : ''

  // Display surname only (compact)
  const displayName = getSurname(name)

  // Stamina fill class
  const staminaFillClass =
    stamina_pct >= 70 ? 'stamina-green' :
    stamina_pct >= 40 ? 'stamina-amber' :
                        'stamina-red'

  // Ring dimensions by size
  const ringSize = size === 'normal' ? 38 : size === 'small' ? 30 : 26
  const ringMt   = size === 'normal' ? 14 : 10

  // Border override for highlight/injury states
  const borderOverride =
    highlight === 'red'   ? { border: '1.5px solid rgba(255,61,61,0.85)' } :
    highlight === 'green' ? { border: '1.5px solid rgba(0,255,135,0.85)' } :
    isInjured             ? { border: '1.5px solid rgba(255,61,61,0.6)'  } :
    {}

  // Archetype badge (pitch cards only)
  const archetype = size === 'normal' ? getPlayerArchetype(player) : null

  return (
    <div className="card-wrapper">
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

        {/* Ring (SVG) — pitch: stamina ring + overall center; bench: impact ring gold */}
        <svg
          width={ringSize} height={ringSize}
          viewBox="0 0 32 32"
          style={{ marginTop: ringMt, flexShrink: 0, position: 'relative', zIndex: 2 }}
          title={isPitch ? `Stamina: ${Math.round(stamina_pct)}%` : `Impact: ${Math.round(impact_score)}`}
        >
          <circle cx="16" cy="16" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
          <circle
            cx="16" cy="16" r={RADIUS} fill="none"
            stroke={ringColor} strokeWidth="2.5"
            strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform="rotate(-90 16 16)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text
            x="16" y="16" textAnchor="middle" dominantBaseline="central"
            fill={isBench ? 'var(--card-rating)' : 'var(--card-text)'}
            style={{ fontSize: size === 'normal' ? 9 : 8, fontFamily: 'Rajdhani', fontWeight: 700 }}
          >
            {ringCenter}
          </text>
        </svg>

        {/* IMPACT label for bench cards */}
        {isBench && (
          <div className="bench-impact-label">IMPACT</div>
        )}

        {/* Tactical profile icon (pitch cards only) */}
        {tactical_profile && size === 'normal' && (
          <div style={{
            fontSize: 9, lineHeight: 1, marginTop: 1,
            color: 'var(--card-text-muted)', zIndex: 2,
          }} title={tactical_profile}>
            {tactical_profile.split(' ')[0]}
          </div>
        )}

        {/* Player name — ping-pong marquee when name overflows card */}
        {(() => {
          const nameWidth = displayName.length * 5.5
          const cardUsableWidth = 77  // ~14 chars × 5.5px
          const overflows = nameWidth > cardUsableWidth
          const scrollPx = overflows ? Math.round(nameWidth - cardUsableWidth) : 0
          return (
            <div className="card-name-wrapper">
              <span
                className="card-name-text"
                style={overflows ? {
                  '--scroll-px': `-${scrollPx}px`,
                  animation: 'pingPongScroll 3.5s ease-in-out infinite',
                  display: 'inline-block',
                  width: 'auto',
                  textAlign: 'left',
                } : {}}
              >
                {displayName}
              </span>
            </div>
          )
        })()}

        {/* Stamina bar */}
        <div className="card-stamina-bar">
          <div
            className={`card-stamina-fill ${staminaFillClass}`}
            style={{ width: `${Math.max(2, stamina_pct)}%` }}
          />
        </div>
      </div>

      {/* Archetype badge — appears below card on hover (pitch cards only) */}
      {archetype && (
        <div className="card-archetype">
          {archetype.icon} {archetype.label}
        </div>
      )}
    </div>
  )
}
