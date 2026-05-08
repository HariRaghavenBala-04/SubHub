/**
 * PlayerCard — glassmorphism card used on pitch and bench.
 * Stateless display only; drag wiring is handled by the parent via useDraggable.
 *
 * Props:
 *  player      : { name, position, stamina_pct, impact_score }
 *  size        : 'normal' | 'small'
 *  highlight   : 'none' | 'red' | 'green'
 *  isInjured   : bool — shows red ✕ overlay
 *  isFlash     : bool — one-shot green flash after swap
 *  dragHandleProps : spread onto the card (listeners + attributes from useDraggable)
 *  onClick     : fn
 *  style       : extra CSS
 */
import { staminaColour } from '../utils/football'

const RADIUS = 15
const CIRC   = 2 * Math.PI * RADIUS

export default function PlayerCard({
  player,
  size        = 'normal',
  highlight   = 'none',
  isInjured   = false,
  dragHandleProps = {},
  onClick,
  style       = {},
}) {
  if (!player) return null
  const { name, position, stamina_pct = 80, impact_score = 50 } = player

  const colour     = staminaColour(stamina_pct)
  const dashOffset = CIRC - (CIRC * Math.min(impact_score, 100)) / 100

  const isSmall = size === 'small'
  const W = isSmall ? 72 : 88
  const H = isSmall ? 86 : 104

  const border =
    highlight === 'red'   ? '1.5px solid rgba(255,61,61,0.8)' :
    highlight === 'green' ? '1.5px solid rgba(0,255,135,0.8)' :
    isInjured             ? '1.5px solid rgba(255,61,61,0.6)' :
                            '1px solid rgba(255,255,255,0.09)'

  const hlClass =
    highlight === 'red'   ? 'pulse-red' :
    highlight === 'green' ? 'pulse-green' : ''

  return (
    <div
      className={`glass ${hlClass}`}
      onClick={onClick}
      style={{
        width: W, height: H,
        padding: isSmall ? '4px 5px 3px' : '5px 6px 4px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        cursor: 'grab',
        position: 'relative',
        border,
        userSelect: 'none',
        ...style,
      }}
      {...dragHandleProps}
    >
      {/* Injured overlay */}
      {isInjured && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 9,
          background: 'rgba(255,61,61,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 5,
        }}>
          <span style={{ fontSize: 26, filter: 'drop-shadow(0 0 4px red)' }}>🚑</span>
        </div>
      )}

      {/* Position badge */}
      <div style={{
        position: 'absolute', top: 3, left: 4,
        background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.35)',
        borderRadius: 3, padding: '0 3px',
        fontSize: isSmall ? 8 : 9,
        color: 'var(--green)', fontFamily: 'Rajdhani', fontWeight: 700,
        lineHeight: '14px',
      }}>
        {position}
      </div>

      {/* Impact ring */}
      <svg
        width={isSmall ? 36 : 42} height={isSmall ? 36 : 42}
        viewBox="0 0 34 34"
        style={{ marginTop: isSmall ? 11 : 13, flexShrink: 0 }}
      >
        <circle cx="17" cy="17" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
        <circle
          cx="17" cy="17" r={RADIUS} fill="none"
          stroke={colour} strokeWidth="2.5"
          strokeDasharray={CIRC} strokeDashoffset={dashOffset}
          strokeLinecap="round" transform="rotate(-90 17 17)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="17" y="17" textAnchor="middle" dominantBaseline="central"
          fill="var(--text)"
          style={{ fontSize: isSmall ? 8 : 9, fontFamily: 'Rajdhani', fontWeight: 700 }}>
          {Math.round(impact_score)}
        </text>
      </svg>

      {/* Last name */}
      <div style={{
        fontSize: isSmall ? 8 : 9, color: 'var(--text)',
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
      <div style={{ fontSize: 6.5, color: 'var(--muted)', marginTop: 1 }}>
        {Math.round(stamina_pct)}% sta
      </div>
    </div>
  )
}
