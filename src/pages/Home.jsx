import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const FALLBACK = [
  { code: 'PL',  name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England' },
  { code: 'BL1', name: 'Bundesliga',     flag: '🇩🇪',       country: 'Germany' },
  { code: 'PD',  name: 'La Liga',        flag: '🇪🇸',       country: 'Spain' },
  { code: 'SA',  name: 'Serie A',        flag: '🇮🇹',       country: 'Italy' },
  { code: 'FL1', name: 'Ligue 1',        flag: '🇫🇷',       country: 'France' },
  { code: 'PPL', name: 'Primeira Liga',  flag: '🇵🇹',       country: 'Portugal' },
  { code: 'DED', name: 'Eredivisie',     flag: '🇳🇱',       country: 'Netherlands' },
]

export default function Home() {
  const [leagues, setLeagues] = useState(FALLBACK)

  useEffect(() => {
    fetch('/api/competitions')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setLeagues(data) })
      .catch(() => {})
  }, [])

  return (
    <main style={{ padding: '48px 32px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 48,
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          SubHub <span style={{ color: 'var(--green)' }}>⚽</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16 }}>
          Football Substitution Intelligence Engine
        </p>
      </div>

      <h2
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        Select League
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {leagues.map(l => (
          <Link
            key={l.code}
            to={`/league/${l.code}`}
            style={{ textDecoration: 'none' }}
          >
            <div
              className="glass glow-hover"
              style={{
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
                userSelect: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: 42 }}>{l.flag}</span>
              <span
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--text)',
                  textAlign: 'center',
                }}
              >
                {l.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{l.country}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
