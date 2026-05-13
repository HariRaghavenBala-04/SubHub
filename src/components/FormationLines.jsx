/**
 * SVG formation connection lines — chemistry-style coloring.
 * Same-group connections: gold. Adjacent-group: green. Cross-group: amber.
 * Critical stamina override: red.
 */
import { useMemo } from 'react'

const GROUP = {
  GK: 0,
  CB: 1, LCB: 1, RCB: 1, LB: 1, RB: 1, LWB: 1, RWB: 1,
  DM: 2, CDM: 2, CM: 2, LM: 2, RM: 2, LCM: 2, RCM: 2,
  AM: 3, CAM: 3, LAM: 3, RAM: 3,
  LW: 4, RW: 4, W: 4, ST: 4, SS: 4,
}

const GROUP_NAME = {
  0: 'GK', 1: 'DEF', 2: 'MID', 3: 'MID', 4: 'ATT',
}

function posGroup(slot) { return GROUP[slot?.toUpperCase()] ?? 2 }

function minStamina(a, b) { return Math.min(a?.stamina_pct ?? 80, b?.stamina_pct ?? 80) }

function lineStyle(a, b) {
  const pct = minStamina(a, b)

  // Critical stamina override — red pulsing
  if (pct < 40) return { stroke: 'rgba(255,61,61,0.45)',  strokeWidth: '1.5', dasharray: '3 3' }

  const ga = posGroup(a.slot)
  const gb = posGroup(b.slot)

  // Same group → gold (chemistry)
  if (ga === gb) return { stroke: 'rgba(200,150,60,0.40)', strokeWidth: '1.2', dasharray: '3 5' }

  // Adjacent groups (GK-DEF, DEF-MID, MID-ATT)
  const diff = Math.abs(ga - gb)
  if (diff === 1) return { stroke: 'rgba(0,255,135,0.25)', strokeWidth: '1.0', dasharray: '3 5' }

  // Cross-group (GK-MID, DEF-ATT etc)
  return { stroke: 'rgba(255,184,0,0.20)', strokeWidth: '0.8', dasharray: '3 5' }
}

export default function FormationLines({ players, highlightSlots = [] }) {
  const lines = useMemo(() => {
    if (!players || players.length < 2) return []

    const groupMap = {}
    for (const p of players) {
      const g = posGroup(p.slot)
      if (!groupMap[g]) groupMap[g] = []
      groupMap[g].push(p)
    }

    const groupKeys = Object.keys(groupMap).map(Number).sort((a, b) => a - b)
    const result = []

    // Horizontal within each group
    for (const gk of groupKeys) {
      const row = [...groupMap[gk]].sort((a, b) => a.left - b.left)
      for (let i = 0; i < row.length - 1; i++) {
        if (Math.abs(row[i].left - row[i + 1].left) <= 65) {
          result.push({ from: row[i], to: row[i + 1], key: `h-${gk}-${i}` })
        }
      }
    }

    // Vertical: each player → nearest in next group
    const CB_SLOTS = new Set(['CB', 'LCB', 'RCB'])
    for (let gi = 0; gi < groupKeys.length - 1; gi++) {
      const fromGroup = groupMap[groupKeys[gi]]
      const toGroup   = groupMap[groupKeys[gi + 1]]
      for (const fp of fromGroup) {
        const sorted = [...toGroup].sort((a, b) => Math.abs(a.left - fp.left) - Math.abs(b.left - fp.left))
        let targets
        if (gi === 0) {
          // GK → DEF: connect only to CB positions; fall back to nearest if no CBs
          const cbs = sorted.filter(p => CB_SLOTS.has(p.slot?.toUpperCase()))
          targets = cbs.length > 0 ? cbs : sorted.slice(0, 1)
        } else {
          targets = (fromGroup.length === 1 && toGroup.length >= 2) ? sorted.slice(0, 2) : sorted.slice(0, 1)
        }
        targets.forEach((tp, ti) => {
          result.push({ from: fp, to: tp, key: `v-${gi}-${fp.slot}-${fp.left}-${ti}` })
        })
      }
    }

    return result
  }, [players])

  if (!lines.length) return null

  return (
    <svg
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 3,
        overflow: 'hidden',
      }}
    >
      <defs>
        <clipPath id="pitch-clip">
          <rect x="0" y="0" width="100%" height="100%" />
        </clipPath>
      </defs>
      <g clipPath="url(#pitch-clip)">
        {lines.map(({ from, to, key }) => {
          const ls = lineStyle(from, to)
          const isHighlighted = highlightSlots.includes(from.slot) || highlightSlots.includes(to.slot)
          return (
            <line
              key={key}
              x1={`${from.left}%`} y1={`${from.top}%`}
              x2={`${to.left}%`}   y2={`${to.top}%`}
              stroke={isHighlighted ? 'rgba(255,61,61,0.6)' : ls.stroke}
              strokeWidth={isHighlighted ? '1.5' : ls.strokeWidth}
              strokeDasharray={ls.dasharray}
              style={{ animation: 'dashFlow 1.8s linear infinite' }}
            />
          )
        })}
      </g>
    </svg>
  )
}
