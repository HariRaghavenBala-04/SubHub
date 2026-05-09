// Shared football logic — must stay in sync with backend engine

export const DECAY_RATES = {
  GK: 0.18, CB: 0.28, LCB: 0.28, RCB: 0.28,
  LB: 0.33, RB: 0.33, LWB: 0.36, RWB: 0.36, FB: 0.33,
  DM: 0.38, CDM: 0.38,
  CM: 0.43, LCM: 0.43, RCM: 0.43, LM: 0.45, RM: 0.45,
  CAM: 0.50, LAM: 0.50, RAM: 0.50, AM: 0.50,
  LW: 0.52, RW: 0.52, W: 0.52, SS: 0.55, ST: 0.58, CF: 0.58,
}

export const VALID_COVER = {
  ST:  ['ST','SS','CF','W','LW','RW'],
  CF:  ['CF','ST','SS','CAM'],
  SS:  ['SS','ST','CF','CAM'],
  LW:  ['LW','W','RW','CAM','ST'],
  RW:  ['RW','W','LW','CAM','ST'],
  W:   ['W','LW','RW','CAM','ST'],
  CAM: ['CAM','AM','CM','LW','RW'],
  LAM: ['LAM','CAM','CM','LW'],
  RAM: ['RAM','CAM','CM','RW'],
  AM:  ['AM','CAM','CM'],
  CM:  ['CM','LCM','RCM','DM','CDM','CAM'],
  LCM: ['LCM','CM','DM'],
  RCM: ['RCM','CM','DM'],
  LM:  ['LM','CM','LW','RM'],
  RM:  ['RM','CM','RW','LM'],
  DM:  ['DM','CDM','CM','CB'],
  CDM: ['CDM','DM','CM','CB'],
  LB:  ['LB','FB','LWB','DM'],
  RB:  ['RB','FB','RWB','DM'],
  FB:  ['FB','LB','RB','LWB','RWB','DM'],
  LWB: ['LWB','LB','FB','LM'],
  RWB: ['RWB','RB','FB','RM'],
  CB:  ['CB','LCB','RCB','DM','CDM'],
  LCB: ['LCB','CB','DM','LB'],
  RCB: ['RCB','CB','DM','RB'],
  GK:  ['GK'],
}

// Risk levels matching backend
const RISK_MAP = {
  ST:  {ST:'direct',SS:'direct',CF:'direct',W:'risky',LW:'risky',RW:'risky'},
  LW:  {LW:'direct',W:'direct',RW:'safe',CAM:'safe',ST:'risky',LB:'emergency'},
  RW:  {RW:'direct',W:'direct',LW:'safe',CAM:'safe',ST:'risky',RB:'emergency'},
  W:   {W:'direct',LW:'direct',RW:'direct',CAM:'safe',ST:'risky',FB:'emergency'},
  CAM: {CAM:'direct',AM:'direct',CM:'safe',LW:'risky',RW:'risky'},
  CM:  {CM:'direct',LCM:'direct',RCM:'direct',DM:'safe',CAM:'safe',CDM:'safe'},
  DM:  {DM:'direct',CDM:'direct',CM:'safe',CB:'risky'},
  CDM: {CDM:'direct',DM:'direct',CM:'safe',CB:'risky'},
  LB:  {LB:'direct',FB:'direct',LWB:'safe',DM:'safe',LW:'risky'},
  RB:  {RB:'direct',FB:'direct',RWB:'safe',DM:'safe',RW:'risky'},
  FB:  {FB:'direct',LB:'direct',RB:'direct',LWB:'safe',RWB:'safe',DM:'safe'},
  CB:  {CB:'direct',LCB:'direct',RCB:'direct',DM:'safe',CDM:'safe',FB:'risky'},
  LCB: {LCB:'direct',CB:'direct',DM:'safe',LB:'risky'},
  RCB: {RCB:'direct',CB:'direct',DM:'safe',RB:'risky'},
  GK:  {GK:'direct'},
}

export function getCompatibility(posOff, posOn) {
  const map = RISK_MAP[(posOff||'CM').toUpperCase()] ?? {}
  return map[(posOn||'CM').toUpperCase()] ?? 'invalid'
}

export const POS_ORDER = [
  'GK','LCB','CB','RCB','LB','LWB','RB','RWB',
  'DM','CDM','LCM','CM','RCM','LM','RM',
  'LAM','CAM','RAM','AM','LW','RW','W','ST','SS','CF',
]

export const URGENCY = {
  GK:  { level: 'CRITICAL', label: 'Immediate change needed', colour: 'var(--red)' },
  CB:  { level: 'CRITICAL', label: 'Immediate change needed', colour: 'var(--red)' },
  LCB: { level: 'CRITICAL', label: 'Immediate change needed', colour: 'var(--red)' },
  RCB: { level: 'CRITICAL', label: 'Immediate change needed', colour: 'var(--red)' },
  DM:  { level: 'HIGH',     label: 'Change within 5 mins',   colour: 'var(--amber)' },
  CDM: { level: 'HIGH',     label: 'Change within 5 mins',   colour: 'var(--amber)' },
  LB:  { level: 'MEDIUM',   label: 'Can hold 10 mins',       colour: 'var(--muted)' },
  RB:  { level: 'MEDIUM',   label: 'Can hold 10 mins',       colour: 'var(--muted)' },
  LWB: { level: 'MEDIUM',   label: 'Can hold 10 mins',       colour: 'var(--muted)' },
  RWB: { level: 'MEDIUM',   label: 'Can hold 10 mins',       colour: 'var(--muted)' },
}

export const FORMATION_SUGGESTIONS = {
  GK:  'No alternative — GK sub is mandatory.',
  CB:  'No CB on bench — switch to 3-5-2: push FBs inside.',
  LCB: 'No CB on bench — switch to 3-5-2: push FBs inside.',
  RCB: 'No CB on bench — switch to 3-5-2: push FBs inside.',
  LB:  'No LB — move DM/CM to LB or switch to 5-3-2 with LWB.',
  RB:  'No RB — move DM/CM to RB or switch to 5-3-2 with RWB.',
  DM:  'No DM — drop a CM to holding role.',
  CDM: 'No CDM — drop a CM to holding role.',
  CM:  'No CM — bring on AM to play deeper, or 4-4-2.',
  LW:  'No winger — use AM as LW or shift ST wide.',
  RW:  'No winger — use AM as RW or shift ST wide.',
  W:   'No winger — use AM as wide forward.',
  ST:  'No striker — play AM as false 9 or 4-4-1-1.',
  CAM: 'No CAM — push CM forward or switch to 4-4-2.',
  AM:  'No AM — use CM in advanced role.',
}

export function computeStamina(position, minutesPlayed, fc26Stamina = null) {
  const rate = DECAY_RATES[(position || 'CM').toUpperCase()] ?? 0.43
  const sm = fc26Stamina !== null ? 1.0 - (fc26Stamina - 50) / 200.0 : 1.0
  return Math.max(0, Math.round(100 - rate * sm * minutesPlayed))
}

export function staminaColour(pct) {
  if (pct >= 75) return 'var(--green)'
  if (pct >= 60) return '#c8e600'   // yellow-green for MONITOR
  if (pct >= 40) return 'var(--amber)'
  return 'var(--red)'
}

export function staminaStatus(pct) {
  if (pct >= 75) return 'FRESH'
  if (pct >= 60) return 'MONITOR'
  if (pct >= 40) return 'WARNING'
  return 'CRITICAL'
}

export function isValidCover(posOff, posOn) {
  const valid = VALID_COVER[(posOff || 'CM').toUpperCase()] ?? []
  return valid.map(v => v.toUpperCase()).includes((posOn || 'CM').toUpperCase())
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

/** Client-side fallback recommender — uses sub_off/sub_on field names matching backend */
// ── Position group helpers for drop validation ────────────────────────────

const _GROUPS = {
  GK:  ['GK'],
  DEF: ['CB','LCB','RCB','LB','RB','LWB','RWB','FB'],
  MID: ['CDM','DM','CM','LCM','RCM','LM','RM','LAM','CAM','RAM','AM'],
  ATT: ['ST','CF','LW','RW','W','SS'],
}

function _group(pos) {
  const p = (pos || 'CM').toUpperCase()
  for (const [g, members] of Object.entries(_GROUPS)) {
    if (members.includes(p)) return g
  }
  return 'MID'
}

/**
 * Returns true if a player at `playerPos` is tactically compatible
 * filling a `targetSlot`. Prevents DEF↔ATT swaps and GK mismatches.
 */
export function isCompatibleDrop(playerPos, targetSlot) {
  if (!playerPos || !targetSlot) return true
  const pp = (playerPos || '').toUpperCase()
  const ts = (targetSlot || '').toUpperCase()
  if (ts === 'GK') return pp === 'GK'
  if (pp === 'GK') return false
  const pg = _group(pp)
  const sg = _group(ts)
  if (pg === 'DEF' && sg === 'ATT') return false
  if (pg === 'ATT' && sg === 'DEF') return false
  return true
}

// ── Player archetype inference from FC26 attributes ───────────────────────

export function getPlayerArchetype(player) {
  if (!player) return { label: 'Player', icon: '⚽' }

  const pace       = player.pace                        || 65
  const shooting   = player.shooting                    || 65
  const passing    = player.passing                     || 65
  const dribbling  = player.dribbling                   || 65
  const defending  = player.defending                   || 65
  const physic     = player.physic                      || 65
  const vision     = player.mentality_vision            || 65
  const stamina    = player.power_stamina               || 65
  const finishing  = player.attacking_finishing         || 65
  const heading    = player.attacking_heading_accuracy  || 65
  const strength   = player.power_strength              || 65
  const aggression = player.mentality_aggression        || 65
  const intercept  = player.mentality_interceptions     || 65
  const sprint     = player.movement_sprint_speed       || 65
  const positioning= player.mentality_positioning       || 65

  const pos = (player.api_position || player.position || 'CM').toUpperCase()

  if (pos === 'GK') return { label: 'Goalkeeper', icon: '🧤' }

  if (['CB','LCB','RCB','LB','RB','LWB','RWB','FB'].includes(pos)) {
    if (pace > 80 && sprint > 80)           return { label: 'Marauding',   icon: '⚡' }
    if (defending > 85 && strength > 80)    return { label: 'Rock Solid',  icon: '🛡' }
    if (passing > 80 && vision > 78)        return { label: 'Ball Playing', icon: '🎯' }
    return { label: 'Defender', icon: '🛡' }
  }

  if (['CDM','DM','CM','LM','RM','LCM','RCM'].includes(pos)) {
    if (stamina > 85 && aggression > 78 && intercept > 78) return { label: 'Engine',    icon: '⚙️' }
    if (vision > 85 && passing > 85)                        return { label: 'Playmaker', icon: '🧠' }
    if (pace > 80 && dribbling > 80)                        return { label: 'Box-to-Box',icon: '💨' }
    if (defending > 78 && intercept > 78)                   return { label: 'Enforcer',  icon: '💪' }
    return { label: 'Midfielder', icon: '⚙️' }
  }

  if (['CAM','LAM','RAM','AM'].includes(pos)) {
    if (vision > 87 && passing > 85)     return { label: 'Creator',        icon: '🎨' }
    if (dribbling > 85 && pace > 80)     return { label: 'Dribbler',       icon: '💨' }
    if (finishing > 82)                  return { label: 'Second Striker',  icon: '⚡' }
    return { label: 'Playmaker', icon: '🧠' }
  }

  if (['LW','RW','W'].includes(pos)) {
    if (pace > 88 && sprint > 88)            return { label: 'Pace Merchant',   icon: '⚡' }
    if (dribbling > 85 && finishing > 80)    return { label: 'Inverted Winger', icon: '🎯' }
    if (passing > 80 && vision > 78)         return { label: 'Wide Creator',    icon: '🎨' }
    return { label: 'Winger', icon: '💨' }
  }

  if (['ST','CF','SS'].includes(pos)) {
    if (finishing > 88 && positioning > 85)  return { label: 'Clinical',     icon: '🎯' }
    if (pace > 85 && sprint > 85)            return { label: 'Pace Striker', icon: '⚡' }
    if (heading > 80 && strength > 80)       return { label: 'Target Man',   icon: '💪' }
    if (dribbling > 82 && vision > 80)       return { label: 'False 9',      icon: '🧠' }
    return { label: 'Striker', icon: '⚡' }
  }

  return { label: 'Player', icon: '⚽' }
}

export function computeClientRecs(pitchPlayers, benchPlayers, intent, manualSwapIds = new Set()) {
  const PRIO = {
    protect_lead:   ['CB','LCB','RCB','CDM','DM','GK','LB','RB','FB','CM','LW','RW','W','ST'],
    chase_game:     ['ST','CF','SS','LW','RW','W','CAM','AM','CM','DM','LB','RB','CB'],
    tactical_change:['CM','DM','CAM','LW','RW','ST','LB','RB','CB'],
  }
  const prio = PRIO[intent] ?? []
  const candidates = []

  for (const off of pitchPlayers) {
    if (manualSwapIds.has(off.id)) continue
    if ((off.stamina_pct ?? 80) >= 75) continue
    for (const on of benchPlayers) {
      const valid    = isValidCover(off.position, on.position)
      const urgency  = Math.max(0, 100 - (off.stamina_pct ?? 80))
      const impact   = on.impact_score ?? 50
      const prioRank = prio.indexOf((on.position || 'CM').toUpperCase())
      const risk     = getCompatibility(off.position, on.position)
      const riskPen  = risk === 'direct' ? 0 : risk === 'safe' ? 5 : risk === 'risky' ? 15 : 25
      const composite = urgency * 0.6 + impact * 0.4 * (valid ? 1 : 0.5)
                        - riskPen - (prioRank >= 0 ? prioRank : 15) * 0.5
      candidates.push({
        sub_off: {
          name: off.name, position: off.position,
          stamina_pct: Math.round(off.stamina_pct ?? 80),
          stamina_status: staminaStatus(off.stamina_pct ?? 80),
          reason: `${Math.round(off.stamina_pct ?? 80)}% stamina`,
        },
        sub_on: {
          name: on.name, position: on.position,
          impact_score: impact,
          confidence: confidenceLevel(off.stamina_pct ?? 80, valid),
          tactical_profile: on.tactical_profile ?? null,
          pos_rating: on.pos_rating ?? null,
          overall: on.overall ?? null,
          best_upgrade: null,
          fc26_found: on.fc26_found ?? false,
        },
        position_compatibility: risk,
        compatibility_warning: risk === 'risky' ? `${on.position} covering ${off.position} — risky` :
                               risk === 'emergency' ? `Emergency cover only` : null,
        attribute_comparison: [],
        reasoning: `${off.name?.split(' ').pop()} (${Math.round(off.stamina_pct ?? 80)}% stamina) → ${on.name?.split(' ').pop()} (Impact: ${impact}, ${off.position}→${on.position} ${valid ? 'valid' : 'mismatch'})`,
        confidence: confidenceLevel(off.stamina_pct ?? 80, valid),
        win_probability_delta: 0.05,
        tactical_note: null,
        _composite: composite,
        // Keep for applyRec lookup
        _subOffId: off.id,
        _subOnId: on.id,
      })
    }
  }

  candidates.sort((a, b) => b._composite - a._composite)
  const seenOff = new Set(), seenOn = new Set()
  const top3 = []
  for (const c of candidates) {
    if (!seenOff.has(c._subOffId) && !seenOn.has(c._subOnId)) {
      seenOff.add(c._subOffId); seenOn.add(c._subOnId)
      top3.push({ ...c, rank: top3.length + 1 })
    }
    if (top3.length === 3) break
  }
  return top3
}
