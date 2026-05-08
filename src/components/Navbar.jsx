import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/',        label: 'Leagues' },
  { to: '/match',   label: 'Match' },
  { to: '/planner', label: 'Planner' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ background: 'var(--bg-panel)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <Link to="/" className="flex items-center gap-2 no-underline">
        <span className="text-2xl">⚽</span>
        <span
          className="text-xl font-bold tracking-widest uppercase"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--green)' }}
        >
          SubHub
        </span>
      </Link>
      <div className="flex gap-6">
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className="text-sm font-medium tracking-wide uppercase transition-colors"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: pathname === l.to ? 'var(--green)' : 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
