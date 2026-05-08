import { useRef, useEffect, useState } from 'react'
import PlayerCard from './PlayerCard'
import FormationLines from './FormationLines'

/**
 * FIFA 15-style pitch with player cards at absolute % positions.
 *
 * Props:
 *  players          : array of player objects enriched with stamina_pct
 *  formation        : FORMATIONS[key].positions array
 *  highlightOffId   : player id to pulse red
 *  highlightOnId    : not used here (bench highlights in BenchRow)
 *  onPlayerClick    : fn(player)
 *  subArrow         : { from: {left,top}, to: {left,top} } | null
 */
export default function Pitch({
  players = [],
  formation = [],
  highlightOffId,
  onPlayerClick,
  subArrow,
}) {
  const pitchRef = useRef(null)
  const [dims, setDims] = useState({ w: 500, h: 700 })

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ w: width, h: height })
    })
    if (pitchRef.current) obs.observe(pitchRef.current)
    return () => obs.disconnect()
  }, [])

  // Merge formation slots with players
  const positioned = formation.map((slot, i) => ({
    ...slot,
    player: players[i] || null,
    stamina_pct: players[i]?.stamina_pct ?? 80,
  }))

  return (
    <div
      ref={pitchRef}
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: 400,
        borderRadius: 8,
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Pitch stripes */}
      <PitchStripes />

      {/* Pitch markings */}
      <PitchMarkings />

      {/* Formation connection lines */}
      <FormationLines
        players={positioned}
        pitchW={dims.w}
        pitchH={dims.h}
      />

      {/* Sub arrow overlay */}
      {subArrow && (
        <SubArrow
          from={subArrow.from}
          to={subArrow.to}
          pitchW={dims.w}
          pitchH={dims.h}
        />
      )}

      {/* Player cards */}
      {positioned.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${pos.left}%`,
            top:  `${pos.top}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.4s ease, top 0.4s ease',
            zIndex: 10,
          }}
        >
          <PlayerCard
            player={pos.player || { name: pos.slot, position: pos.slot, stamina_pct: 80, impact_score: 50 }}
            size="normal"
            highlight={pos.player?.id === highlightOffId ? 'red' : 'none'}
            onClick={() => pos.player && onPlayerClick?.(pos.player)}
          />
        </div>
      ))}
    </div>
  )
}

function PitchStripes() {
  const stripes = Array.from({ length: 10 }, (_, i) => i)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {stripes.map(i => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i % 2 === 0 ? 'var(--pitch-dark)' : 'var(--pitch-light)',
          }}
        />
      ))}
    </div>
  )
}

function PitchMarkings() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
    >
      {/* Outer border */}
      <rect x="2" y="2" width="96" height="136" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
      {/* Halfway line */}
      <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
      {/* Centre circle */}
      <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
      <circle cx="50" cy="70" r="0.6" fill="rgba(255,255,255,0.4)" />
      {/* Top penalty box */}
      <rect x="22" y="2" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
      {/* Top 6-yard box */}
      <rect x="34" y="2" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
      {/* Top penalty spot */}
      <circle cx="50" cy="16" r="0.6" fill="rgba(255,255,255,0.4)" />
      {/* Top penalty arc */}
      <path d="M 38 24 A 12 12 0 0 0 62 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
      {/* Bottom penalty box */}
      <rect x="22" y="116" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
      {/* Bottom 6-yard box */}
      <rect x="34" y="130" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
      {/* Bottom penalty spot */}
      <circle cx="50" cy="124" r="0.6" fill="rgba(255,255,255,0.4)" />
      {/* Bottom penalty arc */}
      <path d="M 38 116 A 12 12 0 0 1 62 116" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
    </svg>
  )
}

function SubArrow({ from, to, pitchW, pitchH }) {
  const x1 = (from.left / 100) * pitchW
  const y1 = (from.top  / 100) * pitchH
  const x2 = (to.left   / 100) * pitchW
  const y2 = (to.top    / 100) * pitchH

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15 }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="var(--green)" />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="var(--green)"
        strokeWidth="2"
        strokeDasharray="8 4"
        markerEnd="url(#arrowhead)"
        style={{ animation: 'dashFlow 0.8s linear infinite' }}
      />
    </svg>
  )
}
