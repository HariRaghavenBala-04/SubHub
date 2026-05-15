import React from 'react'

// Per-formation explicit connection maps.
// Each pair is [slotA, slotB] using exact slot
// label strings from formations.js.
// Duplicate slot labels (e.g. two CBs) are matched
// by index — first occurrence = index 0, second = 1.

const FORMATION_LINKS = {
  '4-3-3': [
    ['GK','CB'],['GK','CB'],
    ['LB','LW'],['RB','RW'],
    ['LB','CB'],['RB','CB'],
    ['CB','CM'],['CB','CM'],
    ['LCM','LW'],['RCM','RW'],
    ['CM','ST'],
  ],
  '4-4-2': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LM'],['RB','RM'],
    ['LCB','LCM'],['RCB','RCM'],
    ['LM','LST'],['RM','RST'],
    ['LCM','LST'],['RCM','RST'],
  ],
  '4-2-3-1': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','CDM'],['RB','CDM'],
    ['LCB','CDM'],['RCB','CDM'],
    ['CDM','CAM'],['CDM','CAM'],
    ['LW','ST'],['RW','ST'],['CAM','ST'],
  ],
  '4-2-3-1 Wide': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LM'],['RB','RM'],
    ['LCB','LDM'],['RCB','RDM'],
    ['LDM','CAM'],['RDM','CAM'],
    ['LM','ST'],['RM','ST'],
  ],
  '4-2-3-1 Narrow': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LCAM'],['RB','RCAM'],
    ['LCB','LDM'],['RCB','RDM'],
    ['LDM','CAM'],['RDM','CAM'],
    ['LCAM','ST'],['RCAM','ST'],
  ],
  '4-1-2-1-2 Wide': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LM'],['RB','RM'],
    ['LCB','CDM'],['RCB','CDM'],
    ['CDM','CAM'],
    ['LM','LST'],['RM','RST'],
    ['CAM','LST'],['CAM','RST'],
  ],
  '4-1-2-1-2 Narrow': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LCM'],['RB','RCM'],
    ['LCB','CDM'],['RCB','CDM'],
    ['CDM','CAM'],
    ['LCM','LST'],['RCM','RST'],
  ],
  '4-4-1-1': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LM'],['RB','RM'],
    ['LCB','LCM'],['RCB','RCM'],
    ['LM','CF'],['RM','CF'],
    ['CF','ST'],
  ],
  '4-2-2-2': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LCDM'],['RB','RCDM'],
    ['LCB','LCDM'],['RCB','RCDM'],
    ['LCDM','LCAM'],['RCDM','RCAM'],
    ['LCAM','LST'],['RCAM','RST'],
  ],
  '4-3-1-2': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LCM'],['RB','RCM'],
    ['LCB','CM'],['RCB','CM'],
    ['CM','CAM'],
    ['CAM','LST'],['CAM','RST'],
  ],
  '4-3-2-1': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LCM'],['RB','RCM'],
    ['LCB','CM'],['RCB','CM'],
    ['CM','LCF'],['CM','RCF'],
    ['LCF','ST'],['RCF','ST'],
  ],
  '4-5-1': [
    ['GK','LCB'],['GK','RCB'],
    ['LB','LM'],['RB','RM'],
    ['LCB','LCM'],['RCB','RCM'],
    ['LCM','CM'],['RCM','CM'],
    ['CM','ST'],
  ],
  '3-4-1-2': [
    ['GK','CB'],
    ['LCB','LM'],['RCB','RM'],
    ['CB','LCM'],['CB','RCM'],
    ['LCM','CAM'],['RCM','CAM'],
    ['CAM','LST'],['CAM','RST'],
  ],
  '3-4-2-1': [
    ['GK','CB'],
    ['LCB','LM'],['RCB','RM'],
    ['CB','LCM'],['CB','RCM'],
    ['LCM','LCF'],['RCM','RCF'],
    ['LCF','ST'],['RCF','ST'],
  ],
  '3-1-4-2': [
    ['GK','CB'],
    ['LCB','CDM'],['RCB','CDM'],
    ['CDM','LCM'],['CDM','RCM'],
    ['LM','LST'],['RM','RST'],
    ['LCM','LST'],['RCM','RST'],
  ],
  '3-4-3': [
    ['GK','CB'],
    ['LCB','LM'],['RCB','RM'],
    ['CB','LCM'],['CB','RCM'],
    ['LM','LW'],['RM','RW'],
    ['LCM','ST'],['RCM','ST'],
  ],
  '3-5-2': [
    ['GK','CB'],
    ['LCB','CDM'],['RCB','CDM'],
    ['LM','LST'],['RM','RST'],
    ['CDM','CAM'],['CDM','CAM'],
    ['CAM','LST'],['CAM','RST'],
  ],
  '5-2-1-2': [
    ['GK','CB'],
    ['LWB','LCM'],['RWB','RCM'],
    ['LCB','CB'],['RCB','CB'],
    ['LCM','CAM'],['RCM','CAM'],
    ['CAM','LST'],['CAM','RST'],
  ],
  '5-2-2-1': [
    ['GK','CB'],
    ['LWB','LCM'],['RWB','RCM'],
    ['LCB','CB'],['RCB','CB'],
    ['LCM','LCF'],['RCM','RCF'],
    ['LCF','ST'],['RCF','ST'],
  ],
  '5-3-2': [
    ['GK','CB'],
    ['LWB','LCM'],['RWB','RCM'],
    ['LCB','CB'],['RCB','CB'],
    ['LCM','LST'],['RCM','RST'],
    ['CM','LST'],
  ],
  '5-4-1 Flat': [
    ['GK','CB'],
    ['LWB','LM'],['RWB','RM'],
    ['LCB','LCM'],['RCB','RCM'],
    ['LM','ST'],['RM','ST'],
  ],
  '5-4-1 Diamond': [
    ['GK','CB'],
    ['LWB','CDM'],['RWB','CDM'],
    ['LCB','CB'],['RCB','CB'],
    ['CDM','CAM'],
    ['LM','ST'],['RM','ST'],
    ['CAM','ST'],
  ],
}

// Positional group for colour logic — unchanged
function getGroup(slot) {
  if (!slot) return 2
  const s = slot.toUpperCase()
  if (s === 'GK') return 0
  if (['CB','LCB','RCB','LB','RB','LWB','RWB'].includes(s)) return 1
  if (['CDM','LCDM','RCDM','LDM','RDM','CM','LCM','RCM','LM','RM'].includes(s)) return 2
  if (['CAM','LCAM','RCAM'].includes(s)) return 3
  return 4
}

export default function FormationLines({
  players,
  formation,
  highlightSlots = []
}) {
  if (!players || players.length < 2) return null

  const links = FORMATION_LINKS[formation]
  if (!links) return null

  // Build lookup: slotLabel → list of players
  // (handles duplicate slot labels by index)
  const slotMap = {}
  for (const p of players) {
    const key = p.slot
    if (!slotMap[key]) slotMap[key] = []
    slotMap[key].push(p)
  }

  // Track how many times each slot label has been
  // consumed so duplicate slots resolve correctly
  const slotUsage = {}

  const lines = []
  for (const [slotA, slotB] of links) {
    const idxA = slotUsage[slotA] || 0
    const idxB = slotUsage[slotB] || 0
    const pA = slotMap[slotA]?.[idxA]
    const pB = slotMap[slotB]?.[idxB]
    if (!pA || !pB) continue

    slotUsage[slotA] = idxA + 1
    slotUsage[slotB] = idxB + 1

    const x1 = pA.left
    const y1 = pA.top
    const x2 = pB.left
    const y2 = pB.top

    const gA = getGroup(pA.slot)
    const gB = getGroup(pB.slot)
    const diff = Math.abs(gA - gB)

    const isHighlighted =
      highlightSlots.includes(pA.slot) ||
      highlightSlots.includes(pB.slot)
    const isLowStamina =
      (pA.stamina_pct != null && pA.stamina_pct < 40) ||
      (pB.stamina_pct != null && pB.stamina_pct < 40)

    let stroke, strokeWidth, strokeOpacity, animate
    if (isHighlighted || isLowStamina) {
      stroke = 'rgba(255,61,61,0.7)'
      strokeWidth = 1.5
      strokeOpacity = 1
      animate = true
    } else if (diff === 0) {
      stroke = 'rgba(200,150,60,0.5)'
      strokeWidth = 1.2
      strokeOpacity = 1
      animate = false
    } else if (diff === 1) {
      stroke = 'rgba(0,255,135,0.35)'
      strokeWidth = 1.0
      strokeOpacity = 1
      animate = false
    } else {
      stroke = 'rgba(255,184,0,0.25)'
      strokeWidth = 0.8
      strokeOpacity = 1
      animate = false
    }

    lines.push({
      x1, y1, x2, y2,
      stroke, strokeWidth, strokeOpacity, animate,
      diff,
      key: `${slotA}-${slotB}-${lines.length}`
    })
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {lines.map(l => (
        <line
          key={l.key}
          x1={`${l.x1}%`} y1={`${l.y1}%`}
          x2={`${l.x2}%`} y2={`${l.y2}%`}
          stroke={l.stroke}
          strokeWidth={l.strokeWidth}
          strokeOpacity={l.strokeOpacity}
          strokeDasharray={l.animate ? '3 3' : '4 6'}
          filter={
            l.animate
              ? 'url(#glow-red)'
              : l.diff === 0
                ? 'none'
                : 'url(#glow-green)'
          }
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
