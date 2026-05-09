/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { createContext, useContext, useState, useCallback } from 'react'

const TeamContext = createContext(null)

export function TeamProvider({ children }) {
  const [selectedTeam, setSelectedTeamState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('selectedTeam')) ?? null } catch { return null }
  })

  const setSelectedTeam = useCallback((team) => {
    setSelectedTeamState(team)
    try { localStorage.setItem('selectedTeam', JSON.stringify(team)) } catch {}
  }, [])

  const fetchSquad = useCallback(async (teamId, leagueCode = 'PL') => {
    const res = await fetch(`/api/squad/${teamId}?league_code=${leagueCode}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      ...data,
      xi:       data.starting_xi ?? [],
      bench:    data.bench       ?? [],
      reserves: data.reserves    ?? [],
    }
  }, [])

  return (
    <TeamContext.Provider value={{ selectedTeam, setSelectedTeam, fetchSquad }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext)
