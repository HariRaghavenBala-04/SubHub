/**
 * PlayerCard — FIFA Rare Gold card design.
 * size: 'normal' → pitch card (72×92), FIFA card layout with stats
 *       'small'  → bench card (impact ring)
 *       'reserve'→ reserve card
 */
import { useEffect, useRef } from 'react'
import { staminaColour, getPlayerArchetype } from '../utils/football'


const RADIUS = 14
const CIRC   = 2 * Math.PI * RADIUS

function slotColour(slot) {
  if (!slot) return '#6b7a8d'
  const s = slot.toUpperCase()
  if (s === 'GK') return '#f59e0b'
  if (['CB','LCB','RCB','LB','RB','LWB','RWB','FB'].includes(s)) return '#3b82f6'
  if (['DM','CDM','CM','LCM','RCM','LM','RM','LAM','CAM','RAM','AM'].includes(s)) return '#8b5cf6'
  if (['LW','RW','W','ST','CF','SS'].includes(s)) return '#ef4444'
  return '#6b7a8d'
}

// ── Archetype SVG icons — inline, single-stroke, no external assets ─────────

function ArchetypeIcon({ pos }) {
  const p   = (pos || 'CM').toUpperCase()
  const str = '#FFD700'
  const sw  = 1.15

  // Striker / CF / SS → crosshair
  if (['ST','CF','SS'].includes(p)) return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4" stroke={str} strokeWidth={sw} />
      <line x1="6" y1="1" x2="6" y2="11"   stroke={str} strokeWidth={sw} strokeLinecap="round" />
      <line x1="1" y1="6" x2="11" y2="6"   stroke={str} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  )

  // Winger → diagonal arrow ↗
  if (['LW','RW','W'].includes(p)) return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line x1="2" y1="10" x2="10" y2="2"  stroke={str} strokeWidth={sw} strokeLinecap="round" />
      <polyline points="5,2 10,2 10,7"      stroke={str} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  // CAM / AM → 4-point compass rose
  if (['CAM','LAM','RAM','AM'].includes(p)) return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line x1="6" y1="1"   x2="6" y2="11"  stroke={str} strokeWidth={sw}        strokeLinecap="round" />
      <line x1="1" y1="6"   x2="11" y2="6"  stroke={str} strokeWidth={sw}        strokeLinecap="round" />
      <line x1="3" y1="3"   x2="9"  y2="9"  stroke={str} strokeWidth={sw * 0.45} strokeLinecap="round" opacity="0.55" />
      <line x1="9" y1="3"   x2="3"  y2="9"  stroke={str} strokeWidth={sw * 0.45} strokeLinecap="round" opacity="0.55" />
    </svg>
  )

  // Box-to-box / CM / LM / RM → sine pulse wave
  if (['CM','LM','RM','LCM','RCM'].includes(p)) return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M1,6 C2.5,6 2.5,2 4,2 C5.5,2 5.5,10 7,10 C8.5,10 8.5,6 10,6 C10.5,6 11,6 11,6"
        stroke={str} strokeWidth={sw} strokeLinecap="round" fill="none"
      />
    </svg>
  )

  // CDM / DM → shield with horizontal slash
  if (['CDM','DM','LCDM','RCDM'].includes(p)) return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6,1 L11,3 L11,6.5 C11,9.5 6,11.5 6,11.5 C6,11.5 1,9.5 1,6.5 L1,3 Z"
        stroke={str} strokeWidth={sw} fill="none" />
      <line x1="3" y1="6" x2="9" y2="6" stroke={str} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  )

  // CB / LB / RB → anchor
  if (['CB','LCB','RCB','LB','RB','LWB','RWB','FB'].includes(p)) return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="3"  r="1.5" stroke={str} strokeWidth={sw} />
      <line x1="6" y1="4.5" x2="6"  y2="11"  stroke={str} strokeWidth={sw} strokeLinecap="round" />
      <line x1="3" y1="7.5" x2="9"  y2="7.5" stroke={str} strokeWidth={sw} strokeLinecap="round" />
      <path d="M2,10.5 Q3,8.5 4,9.5"  stroke={str} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <path d="M10,10.5 Q9,8.5 8,9.5" stroke={str} strokeWidth={sw} fill="none" strokeLinecap="round" />
    </svg>
  )

  // GK → goalpost silhouette
  if (p === 'GK') return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line x1="2"  y1="11" x2="2"  y2="3" stroke={str} strokeWidth={sw} strokeLinecap="round" />
      <line x1="10" y1="11" x2="10" y2="3" stroke={str} strokeWidth={sw} strokeLinecap="round" />
      <line x1="2"  y1="3"  x2="10" y2="3" stroke={str} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  )

  // Default → diamond
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6,1 L11,6 L6,11 L1,6 Z" stroke={str} strokeWidth={sw} fill="none" />
    </svg>
  )
}

// ── Bench name slide — isolated component so useEffect/useRef are hook-safe ──

function BenchNameSlide({ displayName }) {
  const nameRef = useRef(null)

  function getNameFontSize(s) {
    const len = s.length
    if (len <= 8)  return '8.5px'
    if (len <= 11) return '7.5px'
    if (len <= 14) return '6.5px'
    return '8px'
  }

  useEffect(() => {
    const el = nameRef.current
    if (!el) return
    const container = el.parentElement
    const dist = Math.max(0, el.scrollWidth - container.clientWidth)
    el.style.setProperty('--slide-distance', `${dist}px`)
    if (dist > 0) {
      el.style.animation = 'nameSlide 3s linear infinite alternate'
    } else {
      el.style.animation = 'none'
    }
  }, [displayName])

  return (
    <div className="card-name-wrapper">
      <span
        ref={nameRef}
        className="card-name-text"
        style={{ fontSize: getNameFontSize(displayName) }}
      >
        {displayName}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

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
    name, short_name, position, stamina_pct = 80, impact_score = 50,
    overall, tactical_profile, outOfPosition,
    assigned_slot, best_slot, position_fit,
    // Outfield stats
    pace, shooting, passing, dribbling, defending, physic,
    // GK stats
    goalkeeping_diving, goalkeeping_handling, goalkeeping_kicking,
    goalkeeping_reflexes, goalkeeping_positioning, movement_sprint_speed,
  } = player

  const displaySlot = assigned_slot ?? best_slot ?? position ?? '?'
  const colour      = staminaColour(stamina_pct)
  const isPitch     = size === 'normal'
  const isBench     = size === 'small'
  const isGK        = displaySlot === 'GK' || position === 'GK'

  // Bench / reserve ring
  const ringFill   = isPitch ? stamina_pct : Math.min(impact_score, 100)
  const ringColor  = isPitch ? colour : 'var(--card-rating)'
  const ringCenter = isPitch ? (overall ?? Math.round(impact_score)) : Math.round(impact_score)
  const dashOffset = CIRC - (CIRC * ringFill) / 100

  const baseClass =
    size === 'reserve' ? 'reserve-card' :
    size === 'small'   ? 'bench-card'   :
                         'player-card'

  const glowClass =
    size === 'normal' && stamina_pct < 40   ? 'stamina-critical' :
    size === 'normal' && stamina_pct >= 95  ? 'bench-fresh'      :
                                              ''

  const hlClass =
    highlight === 'red'   ? 'pulse-red'   :
    highlight === 'green' ? 'pulse-green' : ''

  const displayName = short_name || name || ''

  const staminaFillClass =
    stamina_pct >= 70 ? 'stamina-green' :
    stamina_pct >= 40 ? 'stamina-amber' :
                        'stamina-red'

  const borderOverride =
    highlight === 'red'        ? { border: '1.5px solid rgba(255,61,61,0.85)' } :
    highlight === 'green'      ? { border: '1.5px solid rgba(0,255,135,0.85)' } :
    isInjured                  ? { border: '1.5px solid rgba(255,61,61,0.6)'  } :
    outOfPosition === 'stretched' ? { border: '1.5px solid #ffb800' } :
    outOfPosition === 'tactical'  ? { border: '1.5px solid #ff3d3d' } :
    {}

  const archetype = getPlayerArchetype(player)

  // ── PITCH CARD — FIFA card layout ─────────────────────────────────────────
  if (isPitch) {
    const fmt = (v) => (v != null && v !== 65 ? v : v ?? '—')

    const leftStats  = isGK ? [
      { val: fmt(goalkeeping_diving),   label: 'DIV' },
      { val: fmt(goalkeeping_handling), label: 'HAN' },
      { val: fmt(goalkeeping_kicking),  label: 'KIC' },
    ] : [
      { val: fmt(pace),     label: 'PAC' },
      { val: fmt(shooting), label: 'SHO' },
      { val: fmt(passing),  label: 'PAS' },
    ]
    const rightStats = isGK ? [
      { val: fmt(goalkeeping_reflexes),    label: 'REF' },
      { val: fmt(movement_sprint_speed),   label: 'SPD' },
      { val: fmt(goalkeeping_positioning), label: 'POS' },
    ] : [
      { val: fmt(dribbling), label: 'DRI' },
      { val: fmt(defending), label: 'DEF' },
      { val: fmt(physic),    label: 'PHY' },
    ]

    function getNameFontSize(s) {
      const len = s.length
      if (len <= 8)  return '8px'
      if (len <= 12) return '6.5px'
      if (len <= 16) return '5.5px'
      return '5px'
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const pitchNameRef = useRef(null)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const el = pitchNameRef.current
      if (!el) return
      const container = el.parentElement
      const dist = Math.max(0, el.scrollWidth - container.clientWidth)
      el.style.setProperty('--slide-distance', `${dist}px`)
      if (dist > 0) {
        el.style.animation = 'nameSlide 3s linear infinite alternate'
      } else {
        el.style.animation = 'none'
      }
    }, [displayName])

    return (
      <div className="card-wrapper">
        <div
          className={`${baseClass} ${glowClass} ${hlClass} pc-fifa`.trim()}
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
              <span style={{ fontSize: 18 }}>🚑</span>
            </div>
          )}

          {/* OOP badge — tiered: stretched=amber, tactical=red */}
          {(outOfPosition === 'stretched' || outOfPosition === 'tactical') && (
            <div
              title={outOfPosition === 'stretched' ? 'Stretched role — manageable' : 'Tactical gamble — unconventional'}
              style={{
                position: 'absolute', top: 3, right: 3, zIndex: 10,
                background: outOfPosition === 'stretched' ? 'rgba(255,184,0,0.9)' : 'rgba(255,61,61,0.85)',
                borderRadius: 2,
                fontSize: 7, fontFamily: 'Rajdhani', fontWeight: 800,
                color: outOfPosition === 'tactical' ? '#fff' : '#000',
                padding: '1px 3px', letterSpacing: '0.06em',
                pointerEvents: 'none',
              }}
            >{outOfPosition === 'stretched' ? 'OOP' : 'GAMBLE'}</div>
          )}

          {/* TOP: OVR + pos left │ name right */}
          <div className="pc-top-row">
            <div className="pc-top-left">
              <span className="pc-ovr">{overall ?? '—'}</span>
              <span className="pc-pos" style={{ color: slotColour(displaySlot) }}>{displaySlot}</span>
            </div>
            <div className="pc-surname-wrap">
              <span
                ref={pitchNameRef}
                className="pc-surname-text"
                style={{ fontSize: getNameFontSize(displayName) }}
              >
                {displayName}
              </span>
            </div>
          </div>

          {/* STATS: two columns with divider */}
          <div className="pc-stats">
            <div className="pc-stats-col">
              {leftStats.map(s => (
                <div key={s.label} className="pc-stat-row">
                  <span className="pc-stat-val">{s.val}</span>
                  <span className="pc-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="pc-stats-divider" />
            <div className="pc-stats-col">
              {rightStats.map(s => (
                <div key={s.label} className="pc-stat-row">
                  <span className="pc-stat-val">{s.val}</span>
                  <span className="pc-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ARCHETYPE ICON — always visible at bottom */}
          <div className="pc-icon-row">
            <ArchetypeIcon pos={displaySlot} />
          </div>

        </div>

        {/* HOVER PANEL — sibling of card inside card-wrapper, escapes overflow:hidden */}
        <div className="pc-hover-panel">
          <span className="pc-hover-archetype">{archetype?.label ?? 'Player'}</span>
          <div className="card-stamina-bar pc-hover-stamina">
            <div
              className={`card-stamina-fill ${staminaFillClass}`}
              style={{ width: `${Math.max(2, stamina_pct)}%` }}
            />
          </div>
        </div>

      </div>
    )
  }

  // ── BENCH / RESERVE CARDS — unchanged ─────────────────────────────────────

  const ringSize = size === 'small' ? 30 : 26
  const ringMt   = 10

  return (
    <div className="card-wrapper">
      <div
        className={`${baseClass} ${hlClass}`.trim()}
        onClick={onClick}
        style={{ ...borderOverride, ...style }}
        {...dragHandleProps}
      >
        {/* Position badge */}
        <span className="card-position-badge">
          {displaySlot}
          {position_fit && (
            <span style={{
              position: 'absolute', top: -2, right: -3,
              width: 5, height: 5, borderRadius: '50%',
              background: position_fit === 'stretched' ? '#ef4444' : position_fit === 'comfortable' ? '#facc15' : 'transparent',
              border: '1px solid rgba(8,12,16,0.5)',
            }} />
          )}
        </span>

        {/* Overall rating */}
        {overall && (
          <span className="card-overall">{overall}</span>
        )}

        {/* Impact ring */}
        <svg
          width={ringSize} height={ringSize}
          viewBox="0 0 32 32"
          style={{ marginTop: ringMt, flexShrink: 0, position: 'relative', zIndex: 2 }}
          title={`Impact: ${Math.round(impact_score)}`}
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
            fill="var(--card-rating)"
            style={{ fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700 }}
          >
            {ringCenter}
          </text>
        </svg>

        {isBench && (
          <div className="bench-impact-label">IMPACT</div>
        )}

        {/* Name */}
        <BenchNameSlide displayName={displayName} />

        {/* Stamina bar */}
        <div className="card-stamina-bar">
          <div
            className={`card-stamina-fill ${staminaFillClass}`}
            style={{ width: `${Math.max(2, stamina_pct)}%` }}
          />
        </div>
      </div>

      {/* Archetype badge on bench cards */}
      {archetype && size !== 'reserve' && (
        <div className="card-archetype">
          {archetype.icon} {archetype.label}
        </div>
      )}
    </div>
  )
}
