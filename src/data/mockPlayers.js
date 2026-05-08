/**
 * Mock player data for demonstration when API is unavailable.
 * Structured as a starting XI + bench in a 4-3-3.
 */
export const MOCK_XI = [
  { id: 1,  name: 'Alisson',    position: 'GK', minutes_played: 60, impact_score: 72 },
  { id: 2,  name: 'Alexander-Arnold', position: 'RB', minutes_played: 60, impact_score: 78 },
  { id: 3,  name: 'Konaté',     position: 'CB', minutes_played: 60, impact_score: 65 },
  { id: 4,  name: 'Van Dijk',   position: 'CB', minutes_played: 60, impact_score: 70 },
  { id: 5,  name: 'Robertson',  position: 'LB', minutes_played: 60, impact_score: 74 },
  { id: 6,  name: 'Fabinho',    position: 'DM', minutes_played: 60, impact_score: 68 },
  { id: 7,  name: 'Henderson',  position: 'CM', minutes_played: 60, impact_score: 62 },
  { id: 8,  name: 'Thiago',     position: 'CM', minutes_played: 60, impact_score: 75 },
  { id: 9,  name: 'Salah',      position: 'RW', minutes_played: 60, impact_score: 91 },
  { id: 10, name: 'Firmino',    position: 'ST', minutes_played: 60, impact_score: 73 },
  { id: 11, name: 'Díaz',       position: 'LW', minutes_played: 60, impact_score: 82 },
]

export const MOCK_BENCH = [
  { id: 12, name: 'Kelleher',   position: 'GK', impact_score: 45 },
  { id: 13, name: 'Jota',       position: 'ST', impact_score: 84 },
  { id: 14, name: 'Núñez',      position: 'ST', impact_score: 79 },
  { id: 15, name: 'Elliott',    position: 'CM', impact_score: 67 },
  { id: 16, name: 'Keïta',      position: 'CM', impact_score: 60 },
  { id: 17, name: 'Gomez',      position: 'CB', impact_score: 58 },
  { id: 18, name: 'Tsimikas',   position: 'LB', impact_score: 55 },
]
