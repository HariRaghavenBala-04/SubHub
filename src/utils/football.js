// Shared football logic used across Match, Planner, and engine

export const DECAY_RATES = {
  GK: 0.20, CB: 0.30, LCB: 0.30, RCB: 0.30,
  LB: 0.35, RB: 0.35, LWB: 0.40, RWB: 0.40, FB: 0.35,
  DM: 0.40, CM: 0.45, LCM: 0.45, RCM: 0.45, LM: 0.50, RM: 0.50,
  AM: 0.50, CAM: 0.50, LAM: 0.50, RAM: 0.50,
  LW: 0.55, RW: 0.55, W: 0.55, SS: 0.55, ST: 0.60,
}

export const VALID_COVER = {
  ST:  ['ST','SS','W'], W:   ['W','AM','ST','FB'],
  AM:  ['AM','CM','W'], CM:  ['CM','DM','AM'],
  DM:  ['DM','CM','CB'], FB: ['FB','DM','W'],
  CB:  ['CB','DM','FB'], GK: ['GK'],
  LW:  ['W','AM','ST','LB'], RW: ['W','AM','ST','RB'],
  LB:  ['FB','DM','W'],  RB: ['FB','DM','W'],
  CAM: ['AM','CM','W'],  LAM: ['AM','CM','W'], RAM: ['AM','CM','W'],
  LWB: ['FB','DM','W'],  RWB: ['FB','DM','W'],
  LCB: ['CB','DM','FB'], RCB: ['CB','DM','FB'],
  LCM: ['CM','DM','AM'], RCM: ['CM','DM','AM'],
  LM:  ['CM','LW','W'],  RM:  ['CM','RW','W'],
  SS:  ['ST','SS','W'],
}

export const POS_ORDER = [
  'GK',
  'LCB','CB','RCB','LB','LWB','RB','RWB',
  'DM','LCM','CM','RCM','LM','RM',
  'LAM','CAM','RAM','AM',
  'LW','RW','W','ST','SS',
]

export const URGENCY = {
  GK:  { level: 'immediate', label: 'Immediate change needed', colour: 'var(--red)' },
  CB:  { level: 'immediate', label: 'Immediate change needed', colour: 'var(--red)' },
  LCB: { level: 'immediate', label: 'Immediate change needed', colour: 'var(--red)' },
  RCB: { level: 'immediate', label: 'Immediate change needed', colour: 'var(--red)' },
  DM:  { level: 'soon',      label: 'Change within 5 mins',   colour: 'var(--amber)' },
  LB:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  RB:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  LWB: { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  RWB: { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  CM:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  LM:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  RM:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  AM:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  CAM: { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  LAM: { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  RAM: { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  LW:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  RW:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  W:   { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  ST:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
  SS:  { level: 'can_hold',  label: 'Can hold for 5 mins',    colour: 'var(--muted)' },
}

export const FORMATION_SUGGESTIONS = {
  GK:  'No alternative — GK substitution is mandatory.',
  CB:  'No CB on bench — consider 3-5-2: shift both FBs inside as CBs.',
  LCB: 'No CB on bench — consider 3-5-2: shift both FBs inside as CBs.',
  RCB: 'No CB on bench — consider 3-5-2: shift both FBs inside as CBs.',
  LB:  'No LB on bench — move a LM/DM to LB, or switch to 5-3-2 with LWB.',
  RB:  'No RB on bench — move a RM/DM to RB, or switch to 5-3-2 with RWB.',
  DM:  'No DM on bench — drop a CM to the holding role or switch to 4-3-3.',
  CM:  'No CM on bench — bring on AM to play deeper, or switch to 4-4-2.',
  LM:  'No LM on bench — shift a LW/AM to LM or switch to 4-3-3.',
  RM:  'No RM on bench — shift a RW/AM to RM or switch to 4-3-3.',
  LW:  'No winger on bench — use an AM as left winger or shift ST wide.',
  RW:  'No winger on bench — use an AM as right winger or shift ST wide.',
  W:   'No winger on bench — use AM as wide forward.',
  ST:  'No striker on bench — play AM as false 9 or switch to 4-4-1-1.',
  SS:  'No striker on bench — play AM as shadow striker.',
  AM:  'No AM on bench — use CM in advanced role, switch to 4-3-3.',
  CAM: 'No CAM on bench — push a CM forward or switch to 4-4-2.',
  LAM: 'No LAM on bench — use LW/CM in the role.',
  RAM: 'No RAM on bench — use RW/CM in the role.',
  LWB: 'No LWB on bench — move a LB to LWB or switch to 4-3-3.',
  RWB: 'No RWB on bench — move a RB to RWB or switch to 4-3-3.',
}

export function computeStamina(position, minutesPlayed) {
  const rate = DECAY_RATES[position?.toUpperCase()] ?? 0.45
  return Math.max(0, Math.round(100 - rate * minutesPlayed))
}

export function staminaColour(pct) {
  if (pct >= 70) return 'var(--green)'
  if (pct >= 40) return 'var(--amber)'
  return 'var(--red)'
}

export function isValidCover(posOff, posOn) {
  const valid = VALID_COVER[posOff?.toUpperCase()] ?? []
  return valid.map(v => v.toUpperCase()).includes(posOn?.toUpperCase())
}

export function confidenceLevel(stamina, positionValid) {
  if (stamina < 45 && positionValid) return 'HIGH'
  if (stamina < 65 && positionValid) return 'MEDIUM'
  return 'LOW'
}

export function splitSquad(squad) {
  const sorted = [...squad].sort((a, b) => {
    const ai = POS_ORDER.indexOf(a.position)
    const bi = POS_ORDER.indexOf(b.position)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  return { xi: sorted.slice(0, 11), bench: sorted.slice(11) }
}

export function computeClientRecs(pitchPlayers, benchPlayers, intent, manualSwapIds = new Set()) {
  const PRIO = {
    protect_lead: ['CB','DM','GK','FB','LCB','RCB','LB','RB','CM','LM','RM','W','LW','RW','AM','CAM','LAM','RAM','ST','SS'],
    chase_game:   ['ST','W','LW','RW','SS','AM','CAM','LAM','RAM','CM','LM','RM','DM','FB','LB','RB','CB','LCB','RCB'],
    tactical:     [],
  }
  const prio = PRIO[intent] ?? []
  const candidates = []

  for (const off of pitchPlayers) {
    if (manualSwapIds.has(off.id)) continue
    if ((off.stamina_pct ?? 80) >= 65) continue  // Only sub fatigued players
    for (const on of benchPlayers) {
      const valid    = isValidCover(off.position, on.position)
      const urgency  = Math.max(0, 100 - (off.stamina_pct ?? 80))
      const impact   = on.impact_score ?? 50
      const prioRank = prio.indexOf(on.position?.toUpperCase())
      const composite = urgency * 0.6 + impact * 0.4 * (valid ? 1 : 0.5) - (prioRank >= 0 ? prioRank : 15) * 0.5
      candidates.push({
        subOff: off, subOn: on,
        stamina_pct: Math.round(off.stamina_pct ?? 80),
        impact_score: impact,
        position_valid: valid,
        composite,
        reasoning: `${off.name?.split(' ').pop()} (${Math.round(off.stamina_pct ?? 80)}% stamina) → ${on.name?.split(' ').pop()} (Impact: ${impact}, ${off.position}→${on.position} ${valid ? 'valid' : 'mismatch'})`,
      })
    }
  }

  candidates.sort((a, b) => b.composite - a.composite)
  const seenOff = new Set(), seenOn = new Set()
  const top3 = []
  for (const c of candidates) {
    if (!seenOff.has(c.subOff.id) && !seenOn.has(c.subOn.id)) {
      seenOff.add(c.subOff.id)
      seenOn.add(c.subOn.id)
      top3.push(c)
    }
    if (top3.length === 3) break
  }
  return top3
}
