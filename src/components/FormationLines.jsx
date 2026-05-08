/**
 * SVG formation connection lines, clipped to pitch boundary.
 * Uses percentage coordinates — no viewBox distortion.
 * Groups: GK(0) → Defense(1) → Mid(2) → AM(3) → Attack(4)
 */
import { useMemo } from 'react'

const GROUP = {
  GK: 0,
  CB: 1, LCB: 1, RCB: 1, LB: 1, RB: 1, LWB: 1, RWB: 1,
  DM: 2, CM: 2, LM: 2, RM: 2, LCM: 2, RCM: 2,
  AM: 3, CAM: 3, LAM: 3, RAM: 3,
  LW: 4, RW: 4, W: 4, ST: 4, SS: 4,
}

function posGroup(slot) { return GROUP[slot?.toUpperCase()] ?? 2 }

function minStamina(a, b) { return Math.min(a?.stamina_pct ?? 80, b?.stamina_pct ?? 80) }

function lineColour(a, b) {
  const pct = minStamina(a, b)
  if (pct >= 70) return '#00ff87'
  if (pct >= 40) return '#ffb800'
  return '#ff3d3d'
}

export default function FormationLines({ players }) {
  const lines = useMemo(() => {
    if (!players || players.length < 2) return []

    // Build group map
    const groupMap = {}
    for (const p of players) {
      const g = posGroup(p.slot)
      if (!groupMap[g]) groupMap[g] = []
      groupMap[g].push(p)
    }

    const groupKeys = Object.keys(groupMap).map(Number).sort((a, b) => a - b)
    const result = []

    // Horizontal connections within each group (adjacent players sorted by left%)
    for (const gk of groupKeys) {
      const row = [...groupMap[gk]].sort((a, b) => a.left - b.left)
      for (let i = 0; i < row.length - 1; i++) {
        // Only connect if not too far apart (avoid GK→GK type issues in wide formations)
        if (Math.abs(row[i].left - row[i + 1].left) <= 65) {
          result.push({ from: row[i], to: row[i + 1], key: `h-${gk}-${i}` })
        }
      }
    }

    // Vertical connections: each player → nearest in the next group
    for (let gi = 0; gi < groupKeys.length - 1; gi++) {
      const fromGroup = groupMap[groupKeys[gi]]
      const toGroup   = groupMap[groupKeys[gi + 1]]
      for (const fp of fromGroup) {
        let nearest = toGroup[0], bestDist = Infinity
        for (const tp of toGroup) {
          const d = Math.abs(tp.left - fp.left)
          if (d < bestDist) { bestDist = d; nearest = tp }
        }
        result.push({ from: fp, to: nearest, key: `v-${gi}-${fp.slot}-${fp.left}` })
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
        pointerEvents: 'none', zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <defs>
        {/* clipPath prevents any line from escaping the pitch rect */}
        <clipPath id="pitch-clip">
          <rect x="0" y="0" width="100%" height="100%" />
        </clipPath>
      </defs>
      <g clipPath="url(#pitch-clip)">
        {lines.map(({ from, to, key }) => {
          const colour = lineColour(from, to)
          return (
            <line
              key={key}
              x1={`${from.left}%`} y1={`${from.top}%`}
              x2={`${to.left}%`}   y2={`${to.top}%`}
              stroke={colour}
              strokeWidth="1"
              strokeOpacity="0.28"
              strokeDasharray="5 4"
              style={{ animation: 'dashFlow 1.8s linear infinite' }}
            />
          )
        })}
      </g>
    </svg>
  )
}
