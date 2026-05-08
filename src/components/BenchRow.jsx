/**
 * Droppable bench row — each slot is a drop target, each card is draggable.
 */
import { useDroppable } from '@dnd-kit/core'
import { DraggableCard } from './Pitch'

/**
 * Props:
 *  bench          : array of player objects
 *  highlightId    : player id to pulse green
 *  onSelect       : fn(player)
 */
export default function BenchRow({ bench = [], highlightId, onSelect }) {
  return (
    <div style={{ width: '100%', marginTop: 8, flexShrink: 0 }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)',
        fontFamily: 'Rajdhani', fontWeight: 600, marginBottom: 5,
        textTransform: 'uppercase', paddingLeft: 2,
      }}>
        Bench
      </div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
        {bench.map((p, i) => (
          <BenchSlot key={p?.id ?? i} index={i} player={p} highlightId={highlightId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function BenchSlot({ index, player, highlightId, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: `bench-${index}` })

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative', borderRadius: 10, flexShrink: 0,
        border: isOver ? '1.5px dashed rgba(0,255,135,0.7)' : '1.5px solid transparent',
        background: isOver ? 'rgba(0,255,135,0.05)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {player ? (
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
        <div style={{
          width: 72, height: 86, border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', fontSize: 10,
        }}>—</div>
      )}
    </div>
  )
}
