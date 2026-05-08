import PlayerCard from './PlayerCard'

/**
 * Horizontal bench row below the pitch.
 * Props:
 *  bench          : array of player objects
 *  highlightId    : id of bench player to pulse green
 *  onSelect       : fn(player)
 */
export default function BenchRow({ bench = [], highlightId, onSelect }) {
  return (
    <div style={{ width: '100%', marginTop: 8 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.15em',
          color: 'var(--muted)',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600,
          marginBottom: 6,
          textTransform: 'uppercase',
          paddingLeft: 4,
        }}
      >
        Bench
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {bench.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            size="small"
            highlight={p.id === highlightId ? 'green' : 'none'}
            onClick={() => onSelect?.(p)}
          />
        ))}
      </div>
    </div>
  )
}
