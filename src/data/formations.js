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
  // Engine slots: ["GK","LB","LCB","RCB","RB","LDM","RDM","LM","CAM","RM","ST"]
  '4-2-3-1 Wide': {
    label: '4-2-3-1 Wide',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'LDM',  left: 35, top: 55 },
      { slot: 'RDM',  left: 65, top: 55 },
      { slot: 'LM',   left: 15, top: 30 },
      { slot: 'CAM',  left: 50, top: 32 },
      { slot: 'RM',   left: 85, top: 30 },
      { slot: 'ST',   left: 50, top: 12 },
    ],
  },
  // Engine slots: ["GK","LB","LCB","RCB","RB","LDM","RDM","LCAM","CAM","RCAM","ST"]
  '4-2-3-1 Narrow': {
    label: '4-2-3-1 Narrow',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'LDM',  left: 35, top: 55 },
      { slot: 'RDM',  left: 65, top: 55 },
      { slot: 'LCAM', left: 30, top: 32 },
      { slot: 'CAM',  left: 50, top: 35 },
      { slot: 'RCAM', left: 70, top: 32 },
      { slot: 'ST',   left: 50, top: 12 },
    ],
  },
  // Engine slots: ["GK","LB","LCB","RCB","RB","CDM","LM","RM","CAM","LST","RST"]
  '4-1-2-1-2 Wide': {
    label: '4-1-2-1-2 Wide',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'CDM',  left: 50, top: 58 },
      { slot: 'LM',   left: 15, top: 42 },
      { slot: 'RM',   left: 85, top: 42 },
      { slot: 'CAM',  left: 50, top: 30 },
      { slot: 'LST',  left: 40, top: 12 },
      { slot: 'RST',  left: 60, top: 12 },
    ],
  },
  // Engine slots: ["GK","LB","LCB","RCB","RB","CDM","LCM","RCM","CAM","LST","RST"]
  '4-1-2-1-2 Narrow': {
    label: '4-1-2-1-2 Narrow',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'CDM',  left: 50, top: 58 },
      { slot: 'LCM',  left: 32, top: 45 },
      { slot: 'RCM',  left: 68, top: 45 },
      { slot: 'CAM',  left: 50, top: 30 },
      { slot: 'LST',  left: 40, top: 12 },
      { slot: 'RST',  left: 60, top: 12 },
    ],
  },
  // Engine slots: ["GK","LB","LCB","RCB","RB","LM","LCM","RCM","RM","CF","ST"]
  '4-4-1-1': {
    label: '4-4-1-1',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'LM',   left: 15, top: 45 },
      { slot: 'LCM',  left: 38, top: 48 },
      { slot: 'RCM',  left: 62, top: 48 },
      { slot: 'RM',   left: 85, top: 45 },
      { slot: 'CF',   left: 50, top: 28 },
      { slot: 'ST',   left: 50, top: 12 },
    ],
  },
  // Engine slots: ["GK","LB","LCB","RCB","RB","LCDM","RCDM","LCAM","RCAM","LST","RST"]
  '4-2-2-2': {
    label: '4-2-2-2',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'LCDM', left: 35, top: 55 },
      { slot: 'RCDM', left: 65, top: 55 },
      { slot: 'LCAM', left: 30, top: 30 },
      { slot: 'RCAM', left: 70, top: 30 },
      { slot: 'LST',  left: 40, top: 12 },
      { slot: 'RST',  left: 60, top: 12 },
    ],
  },
  // Engine slots: ["GK","LB","LCB","RCB","RB","LCM","CM","RCM","CAM","LST","RST"]
  '4-3-1-2': {
    label: '4-3-1-2',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'LCM',  left: 30, top: 50 },
      { slot: 'CM',   left: 50, top: 54 },
      { slot: 'RCM',  left: 70, top: 50 },
      { slot: 'CAM',  left: 50, top: 32 },
      { slot: 'LST',  left: 40, top: 12 },
      { slot: 'RST',  left: 60, top: 12 },
    ],
  },
  // Engine slots: ["GK","LB","LCB","RCB","RB","LCM","CM","RCM","LCF","RCF","ST"]
  '4-3-2-1': {
    label: '4-3-2-1',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LB',   left: 15, top: 70 },
      { slot: 'LCB',  left: 38, top: 72 },
      { slot: 'RCB',  left: 62, top: 72 },
      { slot: 'RB',   left: 85, top: 70 },
      { slot: 'LCM',  left: 30, top: 50 },
      { slot: 'CM',   left: 50, top: 54 },
      { slot: 'RCM',  left: 70, top: 50 },
      { slot: 'LCF',  left: 35, top: 28 },
      { slot: 'RCF',  left: 65, top: 28 },
      { slot: 'ST',   left: 50, top: 12 },
    ],
  },
  // Engine slots: ["GK","LCB","CB","RCB","LM","LCM","RCM","RM","CAM","LST","RST"]
  '3-4-1-2': {
    label: '3-4-1-2',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LCB',  left: 25, top: 75 },
      { slot: 'CB',   left: 50, top: 78 },
      { slot: 'RCB',  left: 75, top: 75 },
      { slot: 'LM',   left: 12, top: 45 },
      { slot: 'LCM',  left: 38, top: 48 },
      { slot: 'RCM',  left: 62, top: 48 },
      { slot: 'RM',   left: 88, top: 45 },
      { slot: 'CAM',  left: 50, top: 28 },
      { slot: 'LST',  left: 40, top: 12 },
      { slot: 'RST',  left: 60, top: 12 },
    ],
  },
  // Engine slots: ["GK","LCB","CB","RCB","LM","LCM","RCM","RM","LCF","RCF","ST"]
  '3-4-2-1': {
    label: '3-4-2-1',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LCB',  left: 25, top: 75 },
      { slot: 'CB',   left: 50, top: 78 },
      { slot: 'RCB',  left: 75, top: 75 },
      { slot: 'LM',   left: 12, top: 45 },
      { slot: 'LCM',  left: 38, top: 48 },
      { slot: 'RCM',  left: 62, top: 48 },
      { slot: 'RM',   left: 88, top: 45 },
      { slot: 'LCF',  left: 35, top: 25 },
      { slot: 'RCF',  left: 65, top: 25 },
      { slot: 'ST',   left: 50, top: 10 },
    ],
  },
  // Engine slots: ["GK","LCB","CB","RCB","CDM","LM","LCM","RCM","RM","LST","RST"]
  '3-1-4-2': {
    label: '3-1-4-2',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LCB',  left: 25, top: 75 },
      { slot: 'CB',   left: 50, top: 78 },
      { slot: 'RCB',  left: 75, top: 75 },
      { slot: 'CDM',  left: 50, top: 60 },
      { slot: 'LM',   left: 12, top: 40 },
      { slot: 'LCM',  left: 35, top: 42 },
      { slot: 'RCM',  left: 65, top: 42 },
      { slot: 'RM',   left: 88, top: 40 },
      { slot: 'LST',  left: 40, top: 12 },
      { slot: 'RST',  left: 60, top: 12 },
    ],
  },
  // Engine slots: ["GK","LCB","CB","RCB","LM","LCM","RCM","RM","LW","ST","RW"]
  '3-4-3': {
    label: '3-4-3',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LCB',  left: 25, top: 75 },
      { slot: 'CB',   left: 50, top: 78 },
      { slot: 'RCB',  left: 75, top: 75 },
      { slot: 'LM',   left: 12, top: 48 },
      { slot: 'LCM',  left: 38, top: 50 },
      { slot: 'RCM',  left: 62, top: 50 },
      { slot: 'RM',   left: 88, top: 48 },
      { slot: 'LW',   left: 20, top: 18 },
      { slot: 'ST',   left: 50, top: 12 },
      { slot: 'RW',   left: 80, top: 18 },
    ],
  },
  // Engine slots: ["GK","LWB","LCB","CB","RCB","RWB","LCM","RCM","CAM","LST","RST"]
  '5-2-1-2': {
    label: '5-2-1-2',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LWB',  left: 12, top: 65 },
      { slot: 'LCB',  left: 32, top: 72 },
      { slot: 'CB',   left: 50, top: 75 },
      { slot: 'RCB',  left: 68, top: 72 },
      { slot: 'RWB',  left: 88, top: 65 },
      { slot: 'LCM',  left: 38, top: 48 },
      { slot: 'RCM',  left: 62, top: 48 },
      { slot: 'CAM',  left: 50, top: 30 },
      { slot: 'LST',  left: 40, top: 12 },
      { slot: 'RST',  left: 60, top: 12 },
    ],
  },
  // Engine slots: ["GK","LWB","LCB","CB","RCB","RWB","LCM","RCM","LCF","RCF","ST"]
  '5-2-2-1': {
    label: '5-2-2-1',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LWB',  left: 12, top: 65 },
      { slot: 'LCB',  left: 32, top: 72 },
      { slot: 'CB',   left: 50, top: 75 },
      { slot: 'RCB',  left: 68, top: 72 },
      { slot: 'RWB',  left: 88, top: 65 },
      { slot: 'LCM',  left: 38, top: 48 },
      { slot: 'RCM',  left: 62, top: 48 },
      { slot: 'LCF',  left: 35, top: 25 },
      { slot: 'RCF',  left: 65, top: 25 },
      { slot: 'ST',   left: 50, top: 10 },
    ],
  },
  // Engine slots: ["GK","LWB","LCB","CB","RCB","RWB","LM","LCM","RCM","RM","ST"]
  '5-4-1 Flat': {
    label: '5-4-1 Flat',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LWB',  left: 12, top: 65 },
      { slot: 'LCB',  left: 32, top: 72 },
      { slot: 'CB',   left: 50, top: 75 },
      { slot: 'RCB',  left: 68, top: 72 },
      { slot: 'RWB',  left: 88, top: 65 },
      { slot: 'LM',   left: 15, top: 42 },
      { slot: 'LCM',  left: 38, top: 45 },
      { slot: 'RCM',  left: 62, top: 45 },
      { slot: 'RM',   left: 85, top: 42 },
      { slot: 'ST',   left: 50, top: 15 },
    ],
  },
  // Engine slots: ["GK","LWB","LCB","CB","RCB","RWB","CDM","LM","RM","CAM","ST"]
  '5-4-1 Diamond': {
    label: '5-4-1 Diamond',
    positions: [
      { slot: 'GK',   left: 50, top: 90 },
      { slot: 'LWB',  left: 12, top: 65 },
      { slot: 'LCB',  left: 32, top: 72 },
      { slot: 'CB',   left: 50, top: 75 },
      { slot: 'RCB',  left: 68, top: 72 },
      { slot: 'RWB',  left: 88, top: 65 },
      { slot: 'CDM',  left: 50, top: 55 },
      { slot: 'LM',   left: 15, top: 40 },
      { slot: 'RM',   left: 85, top: 40 },
      { slot: 'CAM',  left: 50, top: 28 },
      { slot: 'ST',   left: 50, top: 12 },
    ],
  },
}

export const FORMATION_KEYS = Object.keys(FORMATIONS)
