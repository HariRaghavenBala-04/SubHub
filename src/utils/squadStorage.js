const STORAGE_KEY = 'subhub_concept_squads'
const MAX_SQUADS  = 12

export function getSavedSquads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function saveSquad(squadData) {
  // squadData: { name, competition, formation, playstyle, xi, bench, teamId, teamName }
  const squads = getSavedSquads()
  if (squads.length >= MAX_SQUADS) {
    return { error: 'LIMIT_REACHED', squads }
  }
  const newSquad = {
    ...squadData,
    id:      Date.now().toString(),
    savedAt: new Date().toISOString(),
  }
  squads.push(newSquad)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(squads))
  return { success: true, squad: newSquad }
}

export function deleteSquad(id) {
  const squads = getSavedSquads().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(squads))
}

export function updateSquad(id, squadData) {
  const squads = getSavedSquads().map(s =>
    s.id === id
      ? { ...s, ...squadData, savedAt: new Date().toISOString() }
      : s
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(squads))
}
