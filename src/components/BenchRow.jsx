/**
 * Droppable bench row — each slot is a drop target, each card is draggable.
 */
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { DraggableCard } from './Pitch'
import PlayerCard from './PlayerCard'

/**
 * Props:
 *  bench          : array of player objects
 *  label          : row label string (default 'BENCH')
 *  labelColour    : CSS colour for the label (default 'var(--muted)')
 *  opacity        : wrapper opacity (default 1 — use 0.6 for reserves)
 *  highlightId    : player id to pulse green
 *  onSelect       : fn(player) — omit for display-only rows
 *  onAdd          : fn(player) — when set, shows "+" button on hover (reserves row)
 */
export default function BenchRow({
  bench = [],
  label = 'BENCH',
  labelColour = 'var(--muted)',
  opacity = 1,
  highlightId,
  onSelect,
  onAdd,
}) {
  return (
    <div style={{ width: '100%', marginTop: 8, flexShrink: 0, opacity }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.14em', color: labelColour,
        fontFamily: 'Rajdhani', fontWeight: 600, marginBottom: 5,
        textTransform: 'uppercase', paddingLeft: 2,
      }}>
        {label}
        {onAdd && (
          <span style={{ marginLeft: 6, fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
            hover to promote
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
        {bench.map((p, i) => (
          <BenchSlot
            key={p?.id ?? i} index={i} player={p}
            highlightId={highlightId} onSelect={onSelect}
            interactive={!!onSelect}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  )
}

function BenchSlot({ index, player, highlightId, onSelect, interactive, onAdd }) {
  const [hovered, setHovered] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: `bench-${index}`, disabled: !interactive })

  return (
    <div
      ref={interactive ? setNodeRef : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 10, flexShrink: 0,
        border: isOver ? '1.5px dashed rgba(0,255,135,0.7)' : '1.5px solid transparent',
        background: isOver ? 'rgba(0,255,135,0.05)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {player ? (
        interactive ? (
          <DraggableCard
            player={player}
            id={`bench-player-${index}`}
            from="bench"
            fromIndex={index}
            size="small"
            highlight={player.id === highlightId ? 'green' : 'none'}
            onClick={() => onSelect?.(player)}
          />
        ) : (
          <PlayerCard player={player} size="small" />
        )
      ) : (
        <div style={{
          width: 72, height: 86, border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', fontSize: 10,
        }}>—</div>
      )}

      {/* Promote-to-bench button (reserves only) */}
      {onAdd && player && hovered && (
        <button
          onClick={() => onAdd(player)}
          title="Add to matchday bench"
          style={{
            position: 'absolute', top: 3, right: 3,
            background: 'rgba(0,255,135,0.85)', border: 'none',
            borderRadius: '50%', width: 18, height: 18,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: '#000',
            lineHeight: 1, zIndex: 5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >+</button>
      )}
    </div>
  )
}
