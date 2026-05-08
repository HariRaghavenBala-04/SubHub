/**
 * FIFA 15-style football pitch with droppable slots.
 * Each position slot is a useDroppable zone.
 * Each player card is wrapped with useDraggable.
 */
import { useDraggable, useDroppable } from '@dnd-kit/core'
import PlayerCard from './PlayerCard'
import FormationLines from './FormationLines'

/**
 * Props:
 *  pitchPlayers     : array[11] of player objects (enriched with stamina_pct)
 *  formation        : array[11] of { slot, left, top }
 *  highlightOffId   : player id to pulse red (pending sub-off)
 *  swapFlashIdx     : pitch index to flash green briefly after swap
 *  onPlayerClick    : fn(player)
 *  subArrow         : { fromLeft, fromTop, toLeft, toTop } | null
 */
export default function Pitch({
  pitchPlayers = [],
  formation    = [],
  highlightOffId,
  swapFlashIdx,
  onPlayerClick,
  subArrow,
}) {
  // Merge formation coords with players, pass stamina to line renderer
  const positioned = formation.map((slot, i) => ({
    ...slot,
    stamina_pct: pitchPlayers[i]?.stamina_pct ?? 80,
    player: pitchPlayers[i] ?? null,
  }))

  return (
    <div style={{
      position: 'relative', width: '100%', flex: 1, minHeight: 420,
      borderRadius: 8, overflow: 'hidden',
      border: '2px solid rgba(255,255,255,0.1)',
    }}>
      <PitchStripes />
      <PitchMarkings />

      {/* Formation connection lines — clipped inside pitch */}
      <FormationLines players={positioned} />

      {/* Sub arrow */}
      {subArrow && <SubArrow {...subArrow} />}

      {/* Player slots */}
      {positioned.map((pos, i) => (
        <PitchSlot
          key={i}
          index={i}
          left={pos.left}
          top={pos.top}
          slot={pos.slot}
          player={pos.player}
          isHighlightOff={pos.player?.id === highlightOffId}
          isFlash={swapFlashIdx === i}
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  )
}

// ── Individual droppable + draggable pitch slot ───────────────────────────

function PitchSlot({ index, left, top, slot, player, isHighlightOff, isFlash, onPlayerClick }) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `pitch-${index}` })

  return (
    <div
      ref={dropRef}
      style={{
        position: 'absolute',
        left: `${left}%`, top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.4s ease, top 0.4s ease',
        zIndex: isOver ? 20 : 10,
      }}
    >
      {/* Drop target highlight when hovering */}
      {isOver && (
        <div style={{
          position: 'absolute', inset: -6, borderRadius: 14,
          border: '2px dashed rgba(0,255,135,0.7)',
          background: 'rgba(0,255,135,0.08)',
          pointerEvents: 'none', zIndex: -1,
        }} />
      )}
      {player ? (
        <DraggableCard
          player={player}
          id={`pitch-player-${index}`}
          from="pitch"
          fromIndex={index}
          highlight={isHighlightOff ? 'red' : isFlash ? 'green' : 'none'}
          onClick={() => onPlayerClick?.(player)}
        />
      ) : (
        <EmptySlot label={slot} />
      )}
    </div>
  )
}

// ── Draggable card wrapper ────────────────────────────────────────────────

export function DraggableCard({ player, id, from, fromIndex, size = 'normal', highlight = 'none', onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { from, fromIndex, player, size },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.25 : 1, transition: 'opacity 0.15s' }}
    >
      <PlayerCard
        player={player}
        size={size}
        highlight={highlight}
        dragHandleProps={{ ...attributes, ...listeners }}
        onClick={onClick}
      />
    </div>
  )
}

// ── Empty slot placeholder ─────────────────────────────────────────────────

function EmptySlot({ label }) {
  return (
    <div style={{
      width: 88, height: 104,
      border: '1.5px dashed rgba(255,255,255,0.15)',
      borderRadius: 10, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--muted)', fontSize: 11,
      fontFamily: 'Rajdhani', fontWeight: 600,
    }}>
      {label}
    </div>
  )
}

// ── Pitch graphics ────────────────────────────────────────────────────────

function PitchStripes() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ flex: 1, background: i % 2 === 0 ? 'var(--pitch-dark)' : 'var(--pitch-light)' }} />
      ))}
    </div>
  )
}

function PitchMarkings() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      viewBox="0 0 100 140" preserveAspectRatio="none">
      <rect x="2" y="2" width="96" height="136" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" />
      <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" />
      <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      <circle cx="50" cy="70" r="0.6" fill="rgba(255,255,255,0.5)" />
      {/* Top penalty box */}
      <rect x="22" y="2" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      <rect x="34" y="2" width="32" height="8"  fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <circle cx="50" cy="16" r="0.6" fill="rgba(255,255,255,0.4)" />
      <path d="M 38 24 A 12 12 0 0 0 62 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      {/* Bottom penalty box */}
      <rect x="22" y="116" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      <rect x="34" y="130" width="32" height="8"  fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <circle cx="50" cy="124" r="0.6" fill="rgba(255,255,255,0.4)" />
      <path d="M 38 116 A 12 12 0 0 1 62 116" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
    </svg>
  )
}

function SubArrow({ fromLeft, fromTop, toLeft, toTop }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15 }}>
      <defs>
        <marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="var(--green)" />
        </marker>
      </defs>
      <line
        x1={`${fromLeft}%`} y1={`${fromTop}%`}
        x2={`${toLeft}%`}   y2={`${toTop}%`}
        stroke="var(--green)" strokeWidth="2"
        strokeDasharray="8 4" markerEnd="url(#arr)"
        style={{ animation: 'dashFlow 0.8s linear infinite' }}
      />
    </svg>
  )
}
