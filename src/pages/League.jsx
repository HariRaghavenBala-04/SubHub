import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'

const LEAGUE_META = {
  PL:  { name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  BL1: { name: 'Bundesliga',     flag: '🇩🇪' },
  PD:  { name: 'La Liga',        flag: '🇪🇸' },
  SA:  { name: 'Serie A',        flag: '🇮🇹' },
  FL1: { name: 'Ligue 1',        flag: '🇫🇷' },
  PPL: { name: 'Primeira Liga',  flag: '🇵🇹' },
  DED: { name: 'Eredivisie',     flag: '🇳🇱' },
}

export default function League() {
  const { code }           = useParams()
  const meta               = LEAGUE_META[code] || { name: code, flag: '⚽' }
  const { setSelectedTeam } = useTeam()
  const navigate           = useNavigate()
  const [teams, setTeams]  = useState([])
  const [loading, setLoad] = useState(true)
  const [error, setError]  = useState(null)

  useEffect(() => {
    setLoad(true)
    fetch(`/api/teams/${code}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d  => { setTeams(d); setLoad(false) })
      .catch(e => { setError(e.message); setLoad(false) })
  }, [code])

  function handleTeamClick(team) {
    setSelectedTeam({ id: team.id, name: team.name, shortName: team.shortName, crestUrl: team.crestUrl, leagueCode: code })
    navigate(`/squad/${team.id}?league=${code}`)
  }

  return (
    <main style={{ padding: '40px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>← Leagues</Link>
        <span style={{ color: 'var(--muted)' }}>•</span>
        <span style={{ fontSize: 28 }}>{meta.flag}</span>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 32, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {meta.name}
        </h1>
      </div>

      {loading && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>Loading teams…</div>}
      {error && (
        <div style={{ color: 'var(--amber)', background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
          API error: {error} — check backend is running.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        {teams.map(team => (
          <div
            key={team.id}
            className="glass glow-hover"
            onClick={() => handleTeamClick(team)}
            style={{
              padding: '20px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {team.crestUrl ? (
              <img src={team.crestUrl} alt={team.name} style={{ width: 64, height: 64, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <div style={{ width: 64, height: 64, background: 'rgba(0,255,135,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>⚽</div>
            )}
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>
              {team.shortName || team.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {team.tla}
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}
