/**
 * Slide-in recommendation panel — top-3 subs with confidence + Apply Sub.
 *
 * Props:
 *  recs       : array from /api/recommend (or client fallback)
 *  onClose    : fn
 *  onApply    : fn(rec) — executes the swap on pitch
 */
import { confidenceLevel } from '../utils/football'

const CONF_STYLE = {
  HIGH:   { bg: 'rgba(0,255,135,0.12)',  border: 'rgba(0,255,135,0.4)',  color: 'var(--green)' },
  MEDIUM: { bg: 'rgba(255,184,0,0.1)',   border: 'rgba(255,184,0,0.4)',  color: 'var(--amber)' },
  LOW:    { bg: 'rgba(107,122,141,0.12)',border: 'rgba(107,122,141,0.4)',color: 'var(--muted)' },
}

export default function RecommendPanel({ recs = [], onClose, onApply }) {
  if (!recs.length) return null

  return (
    <div
      className="slide-in glass"
      style={{
        position: 'absolute', top: 0, right: 0,
        width: 296, height: '100%',
        overflowY: 'auto', zIndex: 20,
        padding: '14px 12px',
        display: 'flex', flexDirection: 'column', gap: 10,
        borderLeft: '1px solid rgba(0,255,135,0.18)',
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15,
          color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          ⚡ Sub Recommendations
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 17, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
        }}>✕</button>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: -4, flexShrink: 0 }}>
        Only players with stamina &lt;65% are shown.
      </div>

      {recs.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
          No fatigued players found at this minute.
        </div>
      )}

      {recs.map((rec, i) => (
        <RecCard key={i} rec={rec} rank={i + 1} onApply={onApply} />
      ))}
    </div>
  )
}

function RecCard({ rec, rank, onApply }) {
  const { subOff, subOn, stamina_pct, impact_score, position_valid, reasoning } = rec
  const conf = confidenceLevel(stamina_pct, position_valid)
  const cs   = CONF_STYLE[conf]
  const rankColour = rank === 1 ? 'var(--green)' : rank === 2 ? 'var(--amber)' : 'var(--muted)'

  return (
    <div
      className="glass"
      style={{
        padding: '9px 10px',
        border: rank === 1 ? '1px solid rgba(0,255,135,0.25)' : '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', gap: 5,
        flexShrink: 0,
      }}
    >
      {/* Rank + names */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 17, color: rankColour, minWidth: 22 }}>
          #{rank}
        </span>
        <div style={{ flex: 1, lineHeight: 1.3 }}>
          <span style={{ color: 'var(--red)',  fontWeight: 600, fontSize: 12 }}>
            ▼ {subOff?.name?.split(' ').pop()}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 11, margin: '0 4px' }}>→</span>
          <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 12 }}>
            ▲ {subOn?.name?.split(' ').pop()}
          </span>
        </div>
      </div>

      {/* Chips row */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <Chip label={`${stamina_pct}% sta`}        colour="var(--red)" />
        <Chip label={`Impact ${impact_score}`}      colour="var(--green)" />
        <Chip
          label={position_valid ? '✓ Valid' : '⚠ Mismatch'}
          colour={position_valid ? 'var(--green)' : 'var(--amber)'}
        />
        {/* Confidence */}
        <span style={{
          fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
          padding: '1px 5px', borderRadius: 3,
          background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {conf}
        </span>
      </div>

      {/* Reasoning */}
      <div style={{ fontSize: 9.5, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
        {reasoning}
      </div>

      {/* Position details row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 1 }}>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>
          {subOff?.position} → {subOn?.position}
          {!position_valid && <span style={{ color: 'var(--amber)', marginLeft: 4 }}>⚠ position mismatch</span>}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
          est. data
        </span>
      </div>

      {/* Apply Sub button */}
      <button
        onClick={() => onApply?.(rec)}
        style={{
          marginTop: 3, width: '100%',
          background: 'rgba(0,255,135,0.12)',
          border: '1px solid rgba(0,255,135,0.4)',
          borderRadius: 5, color: 'var(--green)',
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11,
          padding: '5px 0', cursor: 'pointer',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(0,255,135,0.22)' }}
        onMouseLeave={e => { e.target.style.background = 'rgba(0,255,135,0.12)' }}
      >
        ✓ Apply Sub
      </button>
    </div>
  )
}

function Chip({ label, colour }) {
  return (
    <span style={{
      fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
      letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 3,
      background: `${colour}15`, border: `1px solid ${colour}50`,
      color: colour, textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
