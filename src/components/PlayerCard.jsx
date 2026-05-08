import { useMemo } from 'react'

const RADIUS = 16
const CIRC   = 2 * Math.PI * RADIUS

function staminaColour(pct) {
  if (pct >= 70) return 'var(--green)'
  if (pct >= 40) return 'var(--amber)'
  return 'var(--red)'
}

/**
 * Props:
 *  player       : { id, name, position, stamina_pct, impact_score }
 *  size         : 'normal' | 'small'
 *  highlight    : 'none' | 'red' | 'green'
 *  onClick      : fn
 *  style        : extra CSS
 */
export default function PlayerCard({
  player,
  size = 'normal',
  highlight = 'none',
  onClick,
  style = {},
}) {
  if (!player) return null
  const { name, position, stamina_pct = 80, impact_score = 50 } = player
  const colour = staminaColour(stamina_pct)
  const dashOffset = CIRC - (CIRC * Math.min(impact_score, 100)) / 100

  const isSmall   = size === 'small'
  const cardW     = isSmall ? 72 : 90
  const cardH     = isSmall ? 88 : 108
  const fontSize  = isSmall ? 9  : 11
  const nameFz    = isSmall ? 8  : 10

  const hlClass = highlight === 'red'
    ? 'pulse-red'
    : highlight === 'green'
    ? 'pulse-green'
    : ''

  const borderStyle = highlight === 'red'
    ? '1px solid rgba(255,61,61,0.7)'
    : highlight === 'green'
    ? '1px solid rgba(0,255,135,0.7)'
    : '1px solid rgba(255,255,255,0.1)'

  return (
    <div
      className={`glass flex flex-col items-center justify-between cursor-pointer select-none ${hlClass}`}
      onClick={onClick}
      style={{
        width: cardW,
        height: cardH,
        padding: isSmall ? '4px 5px' : '6px 7px',
        border: borderStyle,
        position: 'relative',
        ...style,
      }}
    >
      {/* Position badge */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 5,
          background: 'rgba(0,255,135,0.15)',
          border: '1px solid rgba(0,255,135,0.4)',
          borderRadius: 4,
          padding: '0 4px',
          fontSize: fontSize - 1,
          color: 'var(--green)',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          lineHeight: '16px',
        }}
      >
        {position}
      </div>

      {/* Impact ring (SVG) */}
      <svg
        width={isSmall ? 38 : 46}
        height={isSmall ? 38 : 46}
        viewBox="0 0 40 40"
        style={{ marginTop: isSmall ? 10 : 14, flexShrink: 0 }}
      >
        <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={RADIUS}
          fill="none"
          stroke={colour}
          strokeWidth="3"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="20" y="20"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text)"
          style={{ fontSize: isSmall ? 9 : 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}
        >
          {Math.round(impact_score)}
        </text>
      </svg>

      {/* Name */}
      <div
        style={{
          fontSize: nameFz,
          color: 'var(--text)',
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 500,
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          padding: '0 2px',
        }}
        title={name}
      >
        {name.split(' ').pop()}
      </div>

      {/* Stamina bar */}
      <div
        style={{
          width: '100%',
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: 2,
        }}
      >
        <div
          style={{
            width: `${stamina_pct}%`,
            height: '100%',
            background: colour,
            borderRadius: 2,
            transition: 'width 0.5s ease, background 0.3s',
          }}
        />
      </div>
      <div style={{ fontSize: 7, color: 'var(--muted)', marginTop: 1 }}>
        {Math.round(stamina_pct)}% sta
      </div>
    </div>
  )
}
