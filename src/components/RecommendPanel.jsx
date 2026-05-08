/**
 * Slide-in right panel showing top-3 sub recommendations.
 * Props:
 *  recs    : array from /api/recommend
 *  onClose : fn
 */
export default function RecommendPanel({ recs = [], onClose }) {
  if (!recs.length) return null

  return (
    <div
      className="slide-in glass"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 300,
        height: '100%',
        overflowY: 'auto',
        zIndex: 20,
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderLeft: '1px solid rgba(0,255,135,0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--green)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          ⚡ Recommendations
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontSize: 18,
            cursor: 'pointer',
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>

      {recs.map((rec, i) => (
        <RecCard key={i} rec={rec} rank={i + 1} />
      ))}
    </div>
  )
}

function RecCard({ rec, rank }) {
  const { subOff, subOn, stamina_pct, impact_score, position_valid, reasoning } = rec

  const rankColour = rank === 1 ? 'var(--green)' : rank === 2 ? 'var(--amber)' : 'var(--muted)'

  return (
    <div
      className="glass"
      style={{
        padding: '10px 12px',
        border: `1px solid ${rank === 1 ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 800,
            fontSize: 18,
            color: rankColour,
            minWidth: 24,
          }}
        >
          #{rank}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            <span style={{ color: 'var(--red)' }}>▼ {subOff?.name?.split(' ').pop()}</span>
            {'  '}
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>→</span>
            {'  '}
            <span style={{ color: 'var(--green)' }}>▲ {subOn?.name?.split(' ').pop()}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Chip label={`${stamina_pct}% sta`} colour="var(--red)" />
        <Chip label={`Impact ${impact_score}`} colour="var(--green)" />
        <Chip
          label={position_valid ? 'Valid' : 'Mismatch'}
          colour={position_valid ? 'var(--green)' : 'var(--amber)'}
        />
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--muted)',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}
      >
        {reasoning}
      </div>
    </div>
  )
}

function Chip({ label, colour }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.05em',
        padding: '1px 6px',
        borderRadius: 4,
        background: `${colour}18`,
        border: `1px solid ${colour}55`,
        color: colour,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
