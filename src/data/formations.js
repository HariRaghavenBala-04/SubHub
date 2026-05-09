/**
 * Formation position coordinates as [left%, top%] on the pitch.
 * Origin: top-left. 0% top = attacking end, 100% top = defensive end (GK side).
 *
 * CRITICAL: The positions array order must exactly match FORMATION_SLOTS in
 * backend/engine/formation_slots.py, because the engine returns players in slot
 * order and the Pitch component renders pitchPlayers[i] at positions[i].
 *
 * LW/LAM/LM/LWB/LB → left side (left < 50)
 * RW/RAM/RM/RWB/RB  → right side (left > 50)
 */
export const FORMATIONS = {
  // Engine slots: ["GK","LB","CB","CB","RB","CM","CM","CM","LW","ST","RW"]
  '4-3-3': {
    label: '4-3-3',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LB',  left: 15, top: 72 },
      { slot: 'CB',  left: 37, top: 72 },
      { slot: 'CB',  left: 63, top: 72 },
      { slot: 'RB',  left: 85, top: 72 },
      { slot: 'CM',  left: 25, top: 52 },
      { slot: 'CM',  left: 50, top: 50 },
      { slot: 'CM',  left: 75, top: 52 },
      { slot: 'LW',  left: 15, top: 28 },
      { slot: 'ST',  left: 50, top: 24 },
      { slot: 'RW',  left: 85, top: 28 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"]
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LB',  left: 15, top: 72 },
      { slot: 'CB',  left: 37, top: 72 },
      { slot: 'CB',  left: 63, top: 72 },
      { slot: 'RB',  left: 85, top: 72 },
      { slot: 'LM',  left: 10, top: 52 },
      { slot: 'CM',  left: 37, top: 52 },
      { slot: 'CM',  left: 63, top: 52 },
      { slot: 'RM',  left: 90, top: 52 },
      { slot: 'ST',  left: 37, top: 28 },
      { slot: 'ST',  left: 63, top: 28 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","CDM","CDM","LAM","CAM","RAM","ST"]
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LB',  left: 15, top: 72 },
      { slot: 'CB',  left: 37, top: 72 },
      { slot: 'CB',  left: 63, top: 72 },
      { slot: 'RB',  left: 85, top: 72 },
      { slot: 'CDM', left: 37, top: 60 },
      { slot: 'CDM', left: 63, top: 60 },
      { slot: 'LAM', left: 18, top: 44 },
      { slot: 'CAM', left: 50, top: 42 },
      { slot: 'RAM', left: 82, top: 44 },
      { slot: 'ST',  left: 50, top: 24 },
    ],
  },
  // Engine slots: ["GK","CB","CB","CB","LM","CM","CM","CM","RM","ST","ST"]
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'CB',  left: 25, top: 72 },
      { slot: 'CB',  left: 50, top: 70 },
      { slot: 'CB',  left: 75, top: 72 },
      { slot: 'LM',  left:  8, top: 54 },
      { slot: 'CM',  left: 28, top: 52 },
      { slot: 'CM',  left: 50, top: 50 },
      { slot: 'CM',  left: 72, top: 52 },
      { slot: 'RM',  left: 92, top: 54 },
      { slot: 'ST',  left: 35, top: 28 },
      { slot: 'ST',  left: 65, top: 28 },
    ],
  },
  // Engine slots: ["GK","LWB","CB","CB","CB","RWB","CM","CM","CM","ST","ST"]
  '5-3-2': {
    label: '5-3-2',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LWB', left:  8, top: 68 },
      { slot: 'CB',  left: 28, top: 72 },
      { slot: 'CB',  left: 50, top: 74 },
      { slot: 'CB',  left: 72, top: 72 },
      { slot: 'RWB', left: 92, top: 68 },
      { slot: 'CM',  left: 25, top: 52 },
      { slot: 'CM',  left: 50, top: 50 },
      { slot: 'CM',  left: 75, top: 52 },
      { slot: 'ST',  left: 35, top: 28 },
      { slot: 'ST',  left: 65, top: 28 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","LM","CM","CM","CM","RM","ST"]
  '4-5-1': {
    label: '4-5-1',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LB',  left: 15, top: 72 },
      { slot: 'CB',  left: 37, top: 72 },
      { slot: 'CB',  left: 63, top: 72 },
      { slot: 'RB',  left: 85, top: 72 },
      { slot: 'LM',  left:  8, top: 52 },
      { slot: 'CM',  left: 28, top: 50 },
      { slot: 'CM',  left: 50, top: 48 },
      { slot: 'CM',  left: 72, top: 50 },
      { slot: 'RM',  left: 92, top: 52 },
      { slot: 'ST',  left: 50, top: 24 },
    ],
  },
}

export const FORMATION_KEYS = Object.keys(FORMATIONS)
