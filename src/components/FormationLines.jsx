/**
 * SVG overlay that draws formation connection lines between players.
 * Props:
 *  players   : array of { left, top, stamina_pct }  (% coords on pitch)
 *  pitchW    : number (px)
 *  pitchH    : number (px)
 */

function staminaColour(pct) {
  if (pct >= 70) return '#00ff87'
  if (pct >= 40) return '#ffb800'
  return '#ff3d3d'
}

function lowestStamina(a, b) {
  const min = Math.min(a?.stamina_pct ?? 80, b?.stamina_pct ?? 80)
  return staminaColour(min)
}

export default function FormationLines({ players, pitchW, pitchH }) {
  if (!players || players.length < 2) return null

  // Group players into rows by top% bands
  const rows = {}
  for (const p of players) {
    const band = Math.round(p.top / 20) * 20
    if (!rows[band]) rows[band] = []
    rows[band].push(p)
  }

  const sortedBands = Object.keys(rows).map(Number).sort((a, b) => a - b)
  const lines = []

  // Connect within same row
  for (const band of sortedBands) {
    const row = rows[band].sort((a, b) => a.left - b.left)
    for (let i = 0; i < row.length - 1; i++) {
      lines.push({ from: row[i], to: row[i + 1], key: `row-${band}-${i}` })
    }
  }

  // Connect across adjacent rows (nearest player)
  for (let bi = 0; bi < sortedBands.length - 1; bi++) {
    const upperRow = rows[sortedBands[bi]]
    const lowerRow = rows[sortedBands[bi + 1]]
    for (const up of upperRow) {
      let nearest = lowerRow[0]
      let bestDist = Infinity
      for (const lo of lowerRow) {
        const d = Math.abs(up.left - lo.left)
        if (d < bestDist) { bestDist = d; nearest = lo }
      }
      lines.push({ from: up, to: nearest, key: `cross-${bi}-${up.left}` })
    }
  }

  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }}
      viewBox={`0 0 ${pitchW} ${pitchH}`}
      preserveAspectRatio="none"
    >
      {lines.map(({ from, to, key }) => {
        const x1 = (from.left / 100) * pitchW
        const y1 = (from.top  / 100) * pitchH
        const x2 = (to.left   / 100) * pitchW
        const y2 = (to.top    / 100) * pitchH
        const colour = lowestStamina(from, to)
        return (
          <line
            key={key}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={colour}
            strokeWidth="1"
            strokeOpacity="0.25"
            strokeDasharray="4 4"
            style={{ animation: 'dashFlow 1.5s linear infinite' }}
          />
        )
      })}
    </svg>
  )
}
