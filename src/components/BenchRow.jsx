/**
 * Droppable bench/reserve row — each slot is a drop target, each card is draggable.
 *
 * Props:
 *  bench          : array of player objects
 *  label          : row label string
 *  labelColour    : CSS colour for the label
 *  opacity        : wrapper opacity (use 0.6 for reserves)
 *  highlightId    : player id to pulse green
 *  onSelect       : fn(player) — omit for display-only rows
 *  onAdd          : fn(player) — reserve row: shows "+" on hover; also makes cards draggable
 *  collapsible    : bool — collapses cards section until hover
 */
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { DraggableCard } from './Pitch'
import PlayerCard from './PlayerCard'

export default function BenchRow({
  bench = [],
  label = 'BENCH',
  labelColour = 'var(--muted)',
  opacity = 1,
  highlightId,
  onSelect,
  onAdd,
  collapsible = false,
  subbedOffNames = null,  // Set of player names that have been subbed off
}) {
  const [expanded, setExpanded] = useState(!collapsible)

  return (
    <div
      className="bench-section"
      style={{ opacity }}
      onMouseEnter={collapsible ? () => setExpanded(true) : undefined}
      onMouseLeave={collapsible ? () => setExpanded(false) : undefined}
    >
      <div style={{
        fontSize: 10, letterSpacing: '0.14em', color: labelColour,
        fontFamily: 'Rajdhani', fontWeight: 600, marginBottom: 5,
        textTransform: 'uppercase', paddingLeft: 2,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {label}
        {collapsible && (
          <span className="bench-hint">
            {expanded ? '▼' : '▲ hover to expand'}
          </span>
        )}
        {!collapsible && onAdd && (
          <span style={{ marginLeft: 2, fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
            hover card to promote
          </span>
        )}
      </div>

      <div className={collapsible
        ? `bench-cards-container ${expanded ? 'expanded' : 'collapsed'}`
        : undefined}
      >
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {bench.map((p, i) => (
            <BenchSlot
              key={p?.id ?? i}
              index={i}
              player={p}
              highlightId={highlightId}
              onSelect={onSelect}
              interactive={!!onSelect}
              onAdd={onAdd}
              subbedOff={subbedOffNames ? subbedOffNames.has(p?.name) : false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BenchSlot({ index, player, highlightId, onSelect, interactive, onAdd, subbedOff = false }) {
  const [hovered, setHovered] = useState(false)

  // Bench slots are droppable; reserve slots are also droppable (for bench/pitch→reserve drops)
  const slotId   = onAdd ? `reserve-${index}` : `bench-${index}`
  const { setNodeRef, isOver } = useDroppable({ id: slotId })

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={subbedOff ? undefined : () => setHovered(true)}
      onMouseLeave={subbedOff ? undefined : () => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 8, flexShrink: 0,
        border: isOver && !subbedOff ? '1.5px dashed rgba(200,150,60,0.7)' : '1.5px solid transparent',
        background: isOver && !subbedOff ? 'rgba(200,150,60,0.07)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
        // FIX 5: dim subbed-off players
        opacity:        subbedOff ? 0.4 : 1,
        filter:         subbedOff ? 'grayscale(80%)' : 'none',
        pointerEvents:  subbedOff ? 'none' : 'auto',
      }}
    >
      {/* FIX 5: OFF badge */}
      {subbedOff && (
        <div style={{
          position: 'absolute', top: 3, left: 3, zIndex: 10,
          background: 'rgba(255,50,50,0.85)', borderRadius: 2,
          fontSize: 7, fontFamily: 'Rajdhani', fontWeight: 800,
          color: '#fff', padding: '1px 3px', letterSpacing: '0.06em',
          pointerEvents: 'none',
        }}>OFF</div>
      )}
      {player ? (
        onAdd ? (
          // Reserve: draggable out (from="reserve") + "+" promote button on hover
          <>
            <DraggableCard
              player={player}
              id={`reserve-player-${index}`}
              from="reserve"
              fromIndex={index}
              size="reserve"
            />
            {hovered && (
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
                  lineHeight: 1, zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >+</button>
            )}
          </>
        ) : subbedOff ? (
          // Subbed-off: static display only, no drag/hover interaction
          <PlayerCard player={player} size="small" />
        ) : interactive ? (
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
          width: 60, height: 76,
          border: '1px dashed rgba(200,150,60,0.12)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', fontSize: 10,
        }}>—</div>
      )}
    </div>
  )
}
