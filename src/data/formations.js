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
      { slot: 'LB',  left: 16, top: 71 },
      { slot: 'CB',  left: 37, top: 71 },
      { slot: 'CB',  left: 63, top: 71 },
      { slot: 'RB',  left: 84, top: 71 },
      { slot: 'CM',  left: 24, top: 51 },
      { slot: 'CM',  left: 50, top: 49 },
      { slot: 'CM',  left: 76, top: 51 },
      { slot: 'LW',  left: 14, top: 26 },
      { slot: 'ST',  left: 50, top: 22 },
      { slot: 'RW',  left: 86, top: 26 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"]
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LB',  left: 13, top: 71 },
      { slot: 'CB',  left: 36, top: 71 },
      { slot: 'CB',  left: 64, top: 71 },
      { slot: 'RB',  left: 87, top: 71 },
      { slot: 'LM',  left:  9, top: 51 },
      { slot: 'CM',  left: 36, top: 51 },
      { slot: 'CM',  left: 64, top: 51 },
      { slot: 'RM',  left: 91, top: 51 },
      { slot: 'ST',  left: 36, top: 24 },
      { slot: 'ST',  left: 64, top: 24 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","CDM","CDM","LAM","CAM","RAM","ST"]
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LB',  left: 13, top: 73 },
      { slot: 'CB',  left: 36, top: 73 },
      { slot: 'CB',  left: 64, top: 73 },
      { slot: 'RB',  left: 87, top: 73 },
      { slot: 'CDM', left: 36, top: 59 },
      { slot: 'CDM', left: 64, top: 59 },
      { slot: 'LAM', left: 14, top: 41 },
      { slot: 'CAM', left: 50, top: 39 },
      { slot: 'RAM', left: 86, top: 41 },
      { slot: 'ST',  left: 50, top: 21 },
    ],
  },
  // Engine slots: ["GK","CB","CB","CB","LM","CM","CM","CM","RM","ST","ST"]
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'CB',  left: 24, top: 71 },
      { slot: 'CB',  left: 50, top: 71 },
      { slot: 'CB',  left: 76, top: 71 },
      { slot: 'LM',  left:  7, top: 51 },
      { slot: 'CM',  left: 29, top: 51 },
      { slot: 'CM',  left: 50, top: 49 },
      { slot: 'CM',  left: 71, top: 51 },
      { slot: 'RM',  left: 93, top: 51 },
      { slot: 'ST',  left: 36, top: 24 },
      { slot: 'ST',  left: 64, top: 24 },
    ],
  },
  // Engine slots: ["GK","LWB","CB","CB","CB","RWB","CM","CM","CM","ST","ST"]
  '5-3-2': {
    label: '5-3-2',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LWB', left:  7, top: 67 },
      { slot: 'CB',  left: 26, top: 73 },
      { slot: 'CB',  left: 50, top: 75 },
      { slot: 'CB',  left: 74, top: 73 },
      { slot: 'RWB', left: 93, top: 67 },
      { slot: 'CM',  left: 27, top: 51 },
      { slot: 'CM',  left: 50, top: 49 },
      { slot: 'CM',  left: 73, top: 51 },
      { slot: 'ST',  left: 36, top: 24 },
      { slot: 'ST',  left: 64, top: 24 },
    ],
  },
  // Engine slots: ["GK","LB","CB","CB","RB","LM","CM","CM","CM","RM","ST"]
  '4-5-1': {
    label: '4-5-1',
    positions: [
      { slot: 'GK',  left: 50, top: 88 },
      { slot: 'LB',  left: 13, top: 73 },
      { slot: 'CB',  left: 36, top: 73 },
      { slot: 'CB',  left: 64, top: 73 },
      { slot: 'RB',  left: 87, top: 73 },
      { slot: 'LM',  left:  7, top: 51 },
      { slot: 'CM',  left: 27, top: 51 },
      { slot: 'CM',  left: 50, top: 49 },
      { slot: 'CM',  left: 73, top: 51 },
      { slot: 'RM',  left: 93, top: 51 },
      { slot: 'ST',  left: 50, top: 22 },
    ],
  },
}

export const FORMATION_KEYS = Object.keys(FORMATIONS)
