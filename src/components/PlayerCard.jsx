/**
 * PlayerCard — glassmorphism card with FC26 overall + formation slot badge.
 *
 * Badge shows assigned_slot (formation position) — NOT player.position.
 * Colour by slot group. Position-fit dot for out-of-position warnings.
 */
import { staminaColour } from '../utils/football'

const RADIUS = 14
const CIRC   = 2 * Math.PI * RADIUS

// Slot group → colour (FIX 4 spec colours)
function slotColour(slot) {
  if (!slot) return '#6b7a8d'
  const s = slot.toUpperCase()
  if (s === 'GK') return '#f59e0b'
  if (['CB','LCB','RCB','LB','RB','LWB','RWB','FB'].includes(s)) return '#3b82f6'
  if (['DM','CDM','CM','LCM','RCM','LM','RM','LAM','CAM','RAM','AM'].includes(s)) return '#8b5cf6'
  if (['LW','RW','W','ST','CF','SS'].includes(s)) return '#ef4444'
  return '#6b7a8d'
}

// Position-fit dot colour (null = no dot for natural)
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

  // Badge label: formation slot > bench best_slot > raw position
  const displaySlot = assigned_slot ?? best_slot ?? position ?? '?'
  const posColour   = slotColour(displaySlot)
  const dotColour   = assigned_slot ? fitDotColour(position_fit) : null

  const colour     = staminaColour(stamina_pct)
  const dashOffset = CIRC - (CIRC * Math.min(impact_score, 100)) / 100

  const isSmall = size === 'small'
  const W = isSmall ? 70 : 86
  const H = isSmall ? 90 : 110

  const border =
    highlight === 'red'   ? '1.5px solid rgba(255,61,61,0.85)' :
    highlight === 'green' ? '1.5px solid rgba(0,255,135,0.85)' :
    isInjured             ? '1.5px solid rgba(255,61,61,0.6)'  :
                            '1px solid rgba(255,255,255,0.09)'

  const hlClass =
    highlight === 'red'   ? 'pulse-red'   :
    highlight === 'green' ? 'pulse-green' : ''

  return (
    <div
      className={`glass ${hlClass}`}
      onClick={onClick}
      style={{
        width: W, height: H,
        padding: isSmall ? '3px 4px 3px' : '5px 5px 3px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        cursor: 'grab', position: 'relative',
        border, userSelect: 'none', ...style,
      }}
      {...dragHandleProps}
    >
      {/* Injured overlay */}
      {isInjured && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 9,
          background: 'rgba(255,61,61,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 5,
        }}>
          <span style={{ fontSize: 22 }}>🚑</span>
        </div>
      )}

      {/* Slot badge (top-left) — shows assigned_slot, coloured by slot group */}
      <div style={{
        position: 'absolute', top: 3, left: 3,
        background: `${posColour}22`,
        border: `1px solid ${posColour}66`,
        borderRadius: 3, padding: '0 3px',
        fontSize: isSmall ? 7.5 : 8.5,
        color: posColour, fontFamily: 'Rajdhani', fontWeight: 700,
        lineHeight: '13px',
      }}>
        {displaySlot}
        {/* Position-fit dot: yellow = comfortable, red = stretched */}
        {dotColour && (
          <span style={{
            position: 'absolute', top: -2, right: -3,
            width: 5, height: 5, borderRadius: '50%',
            background: dotColour,
            border: '1px solid rgba(8,12,16,0.5)',
          }} />
        )}
      </div>

      {/* FC26 overall (top-right) */}
      {overall && (
        <div style={{
          position: 'absolute', top: 3, right: 3,
          fontSize: isSmall ? 7.5 : 8.5,
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'Rajdhani', fontWeight: 700,
          lineHeight: '13px',
        }}>
          {overall}
        </div>
      )}

      {/* Impact ring (SVG) */}
      <svg
        width={isSmall ? 34 : 40} height={isSmall ? 34 : 40}
        viewBox="0 0 32 32"
        style={{ marginTop: isSmall ? 12 : 14, flexShrink: 0 }}
      >
        <circle cx="16" cy="16" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
        <circle
          cx="16" cy="16" r={RADIUS} fill="none"
          stroke={colour} strokeWidth="2.5"
          strokeDasharray={CIRC} strokeDashoffset={dashOffset}
          strokeLinecap="round" transform="rotate(-90 16 16)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="16" y="16" textAnchor="middle" dominantBaseline="central"
          fill="var(--text)"
          style={{ fontSize: isSmall ? 8 : 9, fontFamily: 'Rajdhani', fontWeight: 700 }}>
          {Math.round(impact_score)}
        </text>
      </svg>

      {/* Tactical profile icon (normal size only) */}
      {tactical_profile && !isSmall && (
        <div style={{ fontSize: 10, lineHeight: 1, marginTop: 1 }} title={tactical_profile}>
          {tactical_profile.split(' ')[0]}
        </div>
      )}

      {/* Last name */}
      <div style={{
        fontSize: isSmall ? 7.5 : 9, color: 'var(--text)',
        textAlign: 'center', fontFamily: 'DM Sans', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: '100%', padding: '0 2px', lineHeight: 1.2,
      }} title={name}>
        {name?.split(' ').pop() ?? name}
      </div>

      {/* Stamina bar */}
      <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${stamina_pct}%`, height: '100%', background: colour, borderRadius: 2,
          transition: 'width 0.5s ease, background 0.3s',
        }} />
      </div>
      <div style={{ fontSize: 6, color: 'var(--muted)', marginTop: 1 }}>
        {Math.round(stamina_pct)}% sta
      </div>
    </div>
  )
}
