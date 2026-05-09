/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'

const RADIUS = 18
const CIRC   = 2 * Math.PI * RADIUS

function staminaColour(pct) {
  if (pct >= 70) return 'var(--green)'
  if (pct >= 40) return 'var(--amber)'
  return 'var(--red)'
}

const POS_ORDER = ['GK','CB','LCB','RCB','LB','RB','LWB','RWB','DM','CM','LCM','RCM','AM','LAM','CAM','RAM','LM','RM','LW','RW','W','ST','SS']

export default function Squad() {
  const { teamId }         = useParams()
  const [search]           = useSearchParams()
  const league             = search.get('league') || 'PL'
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)
  const [error, setError]  = useState(null)

  useEffect(() => {
    setLoad(true)
    fetch(`/api/squad/${teamId}?league_code=${league}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setData(d); setLoad(false) })
      .catch(e => { setError(e.message); setLoad(false) })
  }, [teamId, league])

  const squad = data?.squad ?? []
  const sorted = [...squad].sort((a, b) => {
    const ai = POS_ORDER.indexOf(a.position)
    const bi = POS_ORDER.indexOf(b.position)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <main style={{ padding: '40px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link to={`/league/${league}`} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>
          ← {league}
        </Link>
        {data?.team?.crestUrl && (
          <img src={data.team.crestUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        )}
        <h1
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          {data?.team?.name ?? 'Squad'}
        </h1>
        {data?.team && (
          <Link
            to={`/match/${teamId}`}
            style={{
              marginLeft: 'auto',
              background: 'var(--green)',
              color: '#000',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              padding: '8px 20px',
              borderRadius: 6,
              textDecoration: 'none',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ⚡ Open Match View
          </Link>
        )}
      </div>

      {loading && <div style={{ color: 'var(--muted)', padding: 60, textAlign: 'center' }}>Loading squad…</div>}
      {error && (
        <div style={{ color: 'var(--amber)', background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
        {sorted.map(p => <SquadCard key={p.id} player={p} />)}
      </div>
    </main>
  )
}

function SquadCard({ player }) {
  const { name, position, stamina_pct = 80, impact_score = 50 } = player
  const colour     = staminaColour(stamina_pct)
  const dashOffset = CIRC - (CIRC * Math.min(impact_score, 100)) / 100

  return (
    <div
      className="glass"
      style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            background: 'rgba(0,255,135,0.1)',
            border: '1px solid rgba(0,255,135,0.3)',
            borderRadius: 5,
            padding: '1px 6px',
            fontSize: 11,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            color: 'var(--green)',
          }}
        >
          {position}
        </span>
        <svg width="44" height="44" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="20" cy="20" r={RADIUS}
            fill="none" stroke={colour} strokeWidth="3"
            strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform="rotate(-90 20 20)"
          />
          <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fill="var(--text)"
            style={{ fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}
          >
            {Math.round(impact_score)}
          </text>
        </svg>
      </div>

      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
        {name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${stamina_pct}%`, height: '100%', background: colour, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 30 }}>{Math.round(stamina_pct)}%</span>
      </div>
    </div>
  )
}
