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
      { slot: 'GK',  left: 50, top: 87 },
      { slot: 'LB',  left: 16, top: 70 },
      { slot: 'CB',  left: 37, top: 70 },
      { slot: 'CB',  left: 63, top: 70 },
      { slot: 'RB',  left: 84, top: 70 },
      { slot: 'CM',  left: 25, top: 50 },
      { slot: 'CM',  left: 50, top: 48 },
      { slot: 'CM',  left: 75, top: 50 },
      { slot: 'LW',  left: 16, top: 26 },
      { slot: 'ST',  left: 50, top: 22 },
      { slot: 'RW',  left: 84, top: 26 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"]
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { slot: 'GK',  left: 50, top: 87 },
      { slot: 'LB',  left: 14, top: 70 },
      { slot: 'CB',  left: 36, top: 70 },
      { slot: 'CB',  left: 64, top: 70 },
      { slot: 'RB',  left: 86, top: 70 },
      { slot: 'LM',  left: 10, top: 50 },
      { slot: 'CM',  left: 36, top: 50 },
      { slot: 'CM',  left: 64, top: 50 },
      { slot: 'RM',  left: 90, top: 50 },
      { slot: 'ST',  left: 36, top: 24 },
      { slot: 'ST',  left: 64, top: 24 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","CDM","CDM","LAM","CAM","RAM","ST"]
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { slot: 'GK',  left: 50, top: 87 },
      { slot: 'LB',  left: 14, top: 72 },
      { slot: 'CB',  left: 36, top: 72 },
      { slot: 'CB',  left: 64, top: 72 },
      { slot: 'RB',  left: 86, top: 72 },
      { slot: 'CDM', left: 36, top: 58 },
      { slot: 'CDM', left: 64, top: 58 },
      { slot: 'LAM', left: 16, top: 40 },
      { slot: 'CAM', left: 50, top: 38 },
      { slot: 'RAM', left: 84, top: 40 },
      { slot: 'ST',  left: 50, top: 20 },
    ],
  },
  // Engine slots: ["GK","CB","CB","CB","LM","CM","CM","CM","RM","ST","ST"]
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { slot: 'GK',  left: 50, top: 87 },
      { slot: 'CB',  left: 25, top: 70 },
      { slot: 'CB',  left: 50, top: 70 },
      { slot: 'CB',  left: 75, top: 70 },
      { slot: 'LM',  left:  8, top: 50 },
      { slot: 'CM',  left: 30, top: 50 },
      { slot: 'CM',  left: 50, top: 48 },
      { slot: 'CM',  left: 70, top: 50 },
      { slot: 'RM',  left: 92, top: 50 },
      { slot: 'ST',  left: 36, top: 24 },
      { slot: 'ST',  left: 64, top: 24 },
    ],
  },
  // Engine slots: ["GK","LWB","CB","CB","CB","RWB","CM","CM","CM","ST","ST"]
  '5-3-2': {
    label: '5-3-2',
    positions: [
      { slot: 'GK',  left: 50, top: 87 },
      { slot: 'LWB', left:  8, top: 66 },
      { slot: 'CB',  left: 27, top: 72 },
      { slot: 'CB',  left: 50, top: 74 },
      { slot: 'CB',  left: 73, top: 72 },
      { slot: 'RWB', left: 92, top: 66 },
      { slot: 'CM',  left: 28, top: 50 },
      { slot: 'CM',  left: 50, top: 48 },
      { slot: 'CM',  left: 72, top: 50 },
      { slot: 'ST',  left: 36, top: 24 },
      { slot: 'ST',  left: 64, top: 24 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","LM","CM","CM","CM","RM","ST"]
  '4-5-1': {
    label: '4-5-1',
    positions: [
      { slot: 'GK',  left: 50, top: 87 },
      { slot: 'LB',  left: 14, top: 72 },
      { slot: 'CB',  left: 36, top: 72 },
      { slot: 'CB',  left: 64, top: 72 },
      { slot: 'RB',  left: 86, top: 72 },
      { slot: 'LM',  left:  8, top: 50 },
      { slot: 'CM',  left: 28, top: 50 },
      { slot: 'CM',  left: 50, top: 48 },
      { slot: 'CM',  left: 72, top: 50 },
      { slot: 'RM',  left: 92, top: 50 },
      { slot: 'ST',  left: 50, top: 22 },
    ],
  },
}

export const FORMATION_KEYS = Object.keys(FORMATIONS)
