import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { splitSquad } from '../utils/football'

const TeamContext = createContext(null)

export function TeamProvider({ children }) {
  const [selectedTeam, setSelectedTeamState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('selectedTeam')) ?? null } catch { return null }
  })
  const cache = useRef({})

  const setSelectedTeam = useCallback((team) => {
    setSelectedTeamState(team)
    try { localStorage.setItem('selectedTeam', JSON.stringify(team)) } catch {}
  }, [])

  const fetchSquad = useCallback(async (teamId, leagueCode = 'PL') => {
    const key = `${teamId}-${leagueCode}`
    if (cache.current[key]) return cache.current[key]
    const res = await fetch(`/api/squad/${teamId}?league_code=${leagueCode}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    // Pre-split squad into XI + bench
    const { xi, bench } = splitSquad(data.squad ?? [])
    const enriched = { ...data, xi, bench }
    cache.current[key] = enriched
    return enriched
  }, [])

  return (
    <TeamContext.Provider value={{ selectedTeam, setSelectedTeam, fetchSquad }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext)
