/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useState, useEffect, useMemo } from 'react'
import { useTeam } from '../context/TeamContext'

// ── Country mapping ────────────────────────────────────────────────────────

const TEAM_COUNTRY = {
  // ENGLAND (PL 2025/26)
  57: 'ENG', 58: 'ENG', 61: 'ENG', 62: 'ENG',
  63: 'ENG', 64: 'ENG', 65: 'ENG', 66: 'ENG',
  67: 'ENG', 68: 'ENG', 71: 'ENG', 73: 'ENG',
  76: 'ENG', 328: 'ENG', 341: 'ENG', 351: 'ENG',
  354: 'ENG', 356: 'ENG', 380: 'ENG', 394: 'ENG',
  397: 'ENG', 402: 'ENG', 563: 'ENG', 715: 'ENG',
  1044: 'ENG',
  // GERMANY (BL1 2025/26)
  1: 'GER', 2: 'GER', 3: 'GER', 4: 'GER',
  5: 'GER', 7: 'GER', 10: 'GER', 11: 'GER',
  12: 'GER', 15: 'GER', 16: 'GER', 17: 'GER',
  18: 'GER', 19: 'GER', 20: 'GER', 28: 'GER',
  44: 'GER', 721: 'GER',
  // SPAIN (PD 2025/26)
  77: 'ESP', 78: 'ESP', 81: 'ESP', 82: 'ESP',
  83: 'ESP', 86: 'ESP', 87: 'ESP', 90: 'ESP',
  92: 'ESP', 94: 'ESP', 95: 'ESP', 96: 'ESP',
  559: 'ESP', 1048: 'ESP',
  // ITALY (SA 2025/26)
  98: 'ITA', 99: 'ITA', 100: 'ITA', 102: 'ITA',
  103: 'ITA', 104: 'ITA', 107: 'ITA', 108: 'ITA',
  109: 'ITA', 110: 'ITA', 112: 'ITA', 113: 'ITA',
  115: 'ITA', 450: 'ITA', 457: 'ITA', 471: 'ITA',
  487: 'ITA', 586: 'ITA', 5890: 'ITA', 7397: 'ITA',
  // FRANCE (FL1 2025/26)
  516: 'FRA', 518: 'FRA', 521: 'FRA', 522: 'FRA',
  523: 'FRA', 524: 'FRA', 527: 'FRA', 529: 'FRA',
  530: 'FRA', 532: 'FRA', 548: 'FRA',
  // NETHERLANDS (DED 2025/26)
  666: 'NED', 670: 'NED', 671: 'NED', 673: 'NED',
  674: 'NED', 675: 'NED', 676: 'NED', 677: 'NED',
  678: 'NED', 681: 'NED', 682: 'NED', 684: 'NED',
  718: 'NED', 1912: 'NED', 1915: 'NED', 1919: 'NED',
  1920: 'NED', 6806: 'NED',
  // PORTUGAL (PPL 2025/26)
  496: 'POR', 498: 'POR', 503: 'POR', 582: 'POR',
  583: 'POR', 712: 'POR', 1049: 'POR', 1903: 'POR',
  5529: 'POR', 5530: 'POR', 5531: 'POR', 5533: 'POR',
  5543: 'POR', 5613: 'POR', 6618: 'POR', 7822: 'POR',
  9136: 'POR', 10340: 'POR',
}

// ── UEFA eligibility ───────────────────────────────────────────────────────

const UEFA_ELIGIBILITY = {
  57: 'UCL', 58: 'UEL', 61: 'UCL', 64: 'UCL',
  65: 'UCL', 67: 'UCL', 73: 'UCL',
  354: 'UECL', 351: 'UEL',
  3: 'UCL', 4: 'UCL', 5: 'UCL', 10: 'UEL',
  17: 'UEL', 19: 'UCL', 721: 'UECL',
  78: 'UCL', 81: 'UCL', 86: 'UCL', 90: 'UEL',
  92: 'UECL', 94: 'UCL', 95: 'UCL', 558: 'UEL',
  516: 'UECL', 521: 'UEL', 523: 'UEL',
  524: 'UCL', 527: 'UCL', 548: 'UCL',
  99: 'UECL', 100: 'UEL', 102: 'UCL', 103: 'UEL',
  108: 'UCL', 109: 'UCL', 113: 'UCL',
  674: 'UCL', 675: 'UCL', 678: 'UCL',
  682: 'UECL', 718: 'UEL',
  495: 'UCL', 498: 'UCL', 503: 'UEL',
  5543: 'UECL', 5613: 'UEL',
}

// ── Domestic competitions ──────────────────────────────────────────────────

const DOMESTIC_COMPS = {
  ENG: [
    { code: 'PL',  name: 'Premier League' },
    { code: 'FAC', name: 'FA Cup' },
    { code: 'CC',  name: 'Carabao Cup' },
    { code: 'FCS', name: 'Community Shield' },
  ],
  GER: [
    { code: 'BL',  name: 'Bundesliga' },
    { code: 'DFB', name: 'DFB Pokal' },
    { code: 'SPK', name: 'DFL Super Cup' },
  ],
  ESP: [
    { code: 'LL',  name: 'La Liga' },
    { code: 'CDR', name: 'Copa del Rey' },
    { code: 'SSP', name: 'Supercopa de España' },
  ],
  FRA: [
    { code: 'L1',  name: 'Ligue 1' },
    { code: 'CDF', name: 'Coupe de France' },
    { code: 'TSC', name: 'Trophée des Champions' },
  ],
  ITA: [
    { code: 'SA',  name: 'Serie A' },
    { code: 'CPI', name: 'Coppa Italia' },
    { code: 'SCI', name: 'Supercoppa Italiana' },
  ],
  POR: [
    { code: 'PPL', name: 'Liga Portugal' },
    { code: 'TCP', name: 'Taça de Portugal' },
    { code: 'TDL', name: 'Taça da Liga' },
    { code: 'SCP', name: 'Supertaça Cândido de Oliveira' },
  ],
  NED: [
    { code: 'ERE', name: 'Eredivisie' },
    { code: 'KNV', name: 'KNVB Cup' },
    { code: 'JCS', name: 'Johan Cruyff Schaal' },
  ],
}

const UEFA_COMPS = {
  UCL:  { code: 'UCL',  name: 'Champions League' },
  UEL:  { code: 'UEL',  name: 'Europa League' },
  UECL: { code: 'UECL', name: 'Conference League' },
  USC:  { code: 'USC',  name: 'UEFA Super Cup' },
}

const FRIENDLY = { code: 'FRN', name: 'Friendly' }

// ── Position grouping ──────────────────────────────────────────────────────

const POSITION_GROUPS = {
  'Goalkeepers': ['GK'],
  'Defenders':   ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  'Midfielders': ['CDM', 'CM', 'LM', 'RM', 'CAM', 'LAM', 'RAM'],
  'Forwards':    ['ST', 'CF', 'LW', 'RW'],
}

function groupPlayers(players) {
  const groups = {}
  Object.entries(POSITION_GROUPS).forEach(([group, positions]) => {
    groups[group] = players.filter(p =>
      positions.includes(p.api_position || p.position)
    )
  })
  return groups
}

// ── Stamina projection ─────────────────────────────────────────────────────

function projectStamina(player, minute) {
  const pos = player.assigned_slot || player.api_position || 'CM'
  const DECAY = {
    GK: 0.18, CB: 0.28, LB: 0.33, RB: 0.33,
    LWB: 0.35, RWB: 0.35, CDM: 0.38, CM: 0.43,
    LM: 0.48, RM: 0.48, LAM: 0.50, CAM: 0.50,
    RAM: 0.50, LW: 0.52, RW: 0.52, ST: 0.58, CF: 0.55,
  }
  const base = DECAY[pos] || 0.43
  const fc26s = player.power_stamina || 65
  const mod = 1.0 - ((fc26s - 50) / 200)
  const wr = player.work_rate_att || 'Medium'
  const wmod = { High: 1.12, Medium: 1.0, Low: 0.85 }[wr] || 1.0
  return Math.max(0, Math.round((100 - base * mod * wmod * minute) * 10) / 10)
}

function getStaminaColor(stamina) {
  if (stamina >= 70) return '#00ff87'
  if (stamina >= 45) return '#ffb800'
  return '#ff3d3d'
}

// ── Surname helper (for builder cards) ────────────────────────────────────

function getSurname(name) {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].toUpperCase()
  const prefixes = ['van', 'de', 'di', 'da', 'mac', 'mc', 'dos', 'del', 'der', 'le', 'la']
  if (parts.length >= 3) {
    const secondLast = parts[parts.length - 2].toLowerCase()
    if (prefixes.includes(secondLast))
      return parts.slice(-2).join(' ').toUpperCase()
  }
  return parts[parts.length - 1].toUpperCase()
}

// ── Builder formation slots ────────────────────────────────────────────────

const BUILDER_SLOTS = {
  '4-3-3': [
    { key: 'GK_0',  slot: 'GK',  left: '50%', top: '88%' },
    { key: 'LB_0',  slot: 'LB',  left: '16%', top: '71%' },
    { key: 'CB_0',  slot: 'CB',  left: '37%', top: '71%' },
    { key: 'CB_1',  slot: 'CB',  left: '63%', top: '71%' },
    { key: 'RB_0',  slot: 'RB',  left: '84%', top: '71%' },
    { key: 'CM_0',  slot: 'CM',  left: '24%', top: '51%' },
    { key: 'CM_1',  slot: 'CM',  left: '50%', top: '49%' },
    { key: 'CM_2',  slot: 'CM',  left: '76%', top: '51%' },
    { key: 'LW_0',  slot: 'LW',  left: '14%', top: '26%' },
    { key: 'ST_0',  slot: 'ST',  left: '50%', top: '22%' },
    { key: 'RW_0',  slot: 'RW',  left: '86%', top: '26%' },
  ],
  '4-4-2': [
    { key: 'GK_0',  slot: 'GK',  left: '50%', top: '88%' },
    { key: 'LB_0',  slot: 'LB',  left: '13%', top: '71%' },
    { key: 'CB_0',  slot: 'CB',  left: '36%', top: '71%' },
    { key: 'CB_1',  slot: 'CB',  left: '64%', top: '71%' },
    { key: 'RB_0',  slot: 'RB',  left: '87%', top: '71%' },
    { key: 'LM_0',  slot: 'LM',  left: '9%',  top: '51%' },
    { key: 'CM_0',  slot: 'CM',  left: '36%', top: '51%' },
    { key: 'CM_1',  slot: 'CM',  left: '64%', top: '51%' },
    { key: 'RM_0',  slot: 'RM',  left: '91%', top: '51%' },
    { key: 'ST_0',  slot: 'ST',  left: '36%', top: '24%' },
    { key: 'ST_1',  slot: 'ST',  left: '64%', top: '24%' },
  ],
  '4-2-3-1': [
    { key: 'GK_0',  slot: 'GK',  left: '50%', top: '88%' },
    { key: 'LB_0',  slot: 'LB',  left: '13%', top: '73%' },
    { key: 'CB_0',  slot: 'CB',  left: '36%', top: '73%' },
    { key: 'CB_1',  slot: 'CB',  left: '64%', top: '73%' },
    { key: 'RB_0',  slot: 'RB',  left: '87%', top: '73%' },
    { key: 'CDM_0', slot: 'CDM', left: '36%', top: '59%' },
    { key: 'CDM_1', slot: 'CDM', left: '64%', top: '59%' },
    { key: 'LAM_0', slot: 'LAM', left: '14%', top: '41%' },
    { key: 'CAM_0', slot: 'CAM', left: '50%', top: '39%' },
    { key: 'RAM_0', slot: 'RAM', left: '86%', top: '41%' },
    { key: 'ST_0',  slot: 'ST',  left: '50%', top: '21%' },
  ],
  '3-5-2': [
    { key: 'GK_0',  slot: 'GK',  left: '50%', top: '88%' },
    { key: 'CB_0',  slot: 'CB',  left: '24%', top: '71%' },
    { key: 'CB_1',  slot: 'CB',  left: '50%', top: '71%' },
    { key: 'CB_2',  slot: 'CB',  left: '76%', top: '71%' },
    { key: 'LM_0',  slot: 'LM',  left: '7%',  top: '51%' },
    { key: 'CM_0',  slot: 'CM',  left: '29%', top: '51%' },
    { key: 'CM_1',  slot: 'CM',  left: '50%', top: '49%' },
    { key: 'CM_2',  slot: 'CM',  left: '71%', top: '51%' },
    { key: 'RM_0',  slot: 'RM',  left: '93%', top: '51%' },
    { key: 'ST_0',  slot: 'ST',  left: '36%', top: '24%' },
    { key: 'ST_1',  slot: 'ST',  left: '64%', top: '24%' },
  ],
  '5-3-2': [
    { key: 'GK_0',  slot: 'GK',  left: '50%', top: '88%' },
    { key: 'LWB_0', slot: 'LWB', left: '7%',  top: '67%' },
    { key: 'CB_0',  slot: 'CB',  left: '26%', top: '73%' },
    { key: 'CB_1',  slot: 'CB',  left: '50%', top: '75%' },
    { key: 'CB_2',  slot: 'CB',  left: '74%', top: '73%' },
    { key: 'RWB_0', slot: 'RWB', left: '93%', top: '67%' },
    { key: 'CM_0',  slot: 'CM',  left: '27%', top: '51%' },
    { key: 'CM_1',  slot: 'CM',  left: '50%', top: '49%' },
    { key: 'CM_2',  slot: 'CM',  left: '73%', top: '51%' },
    { key: 'ST_0',  slot: 'ST',  left: '36%', top: '24%' },
    { key: 'ST_1',  slot: 'ST',  left: '64%', top: '24%' },
  ],
  '4-5-1': [
    { key: 'GK_0',  slot: 'GK',  left: '50%', top: '88%' },
    { key: 'LB_0',  slot: 'LB',  left: '13%', top: '73%' },
    { key: 'CB_0',  slot: 'CB',  left: '36%', top: '73%' },
    { key: 'CB_1',  slot: 'CB',  left: '64%', top: '73%' },
    { key: 'RB_0',  slot: 'RB',  left: '87%', top: '73%' },
    { key: 'LM_0',  slot: 'LM',  left: '7%',  top: '51%' },
    { key: 'CM_0',  slot: 'CM',  left: '27%', top: '51%' },
    { key: 'CM_1',  slot: 'CM',  left: '50%', top: '49%' },
    { key: 'CM_2',  slot: 'CM',  left: '73%', top: '51%' },
    { key: 'RM_0',  slot: 'RM',  left: '93%', top: '51%' },
    { key: 'ST_0',  slot: 'ST',  left: '50%', top: '22%' },
  ],
}

// ── Position compatibility ─────────────────────────────────────────────────

function isCompatibleForSlot(player, slotType) {
  const pos = player.api_position || player.position || 'CM'
  const COMPAT = {
    GK:  ['GK'],
    LB:  ['LB', 'LWB', 'CB'],
    RB:  ['RB', 'RWB', 'CB'],
    CB:  ['CB', 'LB', 'RB', 'CDM'],
    LWB: ['LWB', 'LB', 'LM'],
    RWB: ['RWB', 'RB', 'RM'],
    CDM: ['CDM', 'CM', 'CB'],
    CM:  ['CM', 'CDM', 'CAM', 'LM', 'RM'],
    LM:  ['LM', 'LW', 'CM', 'LWB'],
    RM:  ['RM', 'RW', 'CM', 'RWB'],
    CAM: ['CAM', 'CM', 'LW', 'RW'],
    LAM: ['LAM', 'CAM', 'LW', 'CM'],
    RAM: ['RAM', 'CAM', 'RW', 'CM'],
    LW:  ['LW', 'LM', 'CAM', 'ST'],
    RW:  ['RW', 'RM', 'CAM', 'ST'],
    ST:  ['ST', 'CF', 'LW', 'RW'],
    CF:  ['CF', 'ST', 'CAM'],
  }
  if (slotType === 'GK') return pos === 'GK'
  if (pos === 'GK') return slotType === 'GK'
  const allowed = COMPAT[slotType] || [slotType]
  return allowed.includes(pos)
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Planner() {
  const { selectedTeam, fetchSquad } = useTeam()
  const teamName = selectedTeam?.name ?? null
  const teamId   = selectedTeam?.id ?? null

  const country       = TEAM_COUNTRY[teamId] || 'ENG'
  const domesticComps = DOMESTIC_COMPS[country] || []
  const uefaStatus    = UEFA_ELIGIBILITY[teamId]

  const uefaComps = []
  if (uefaStatus === 'UCL') {
    uefaComps.push(UEFA_COMPS.UCL)
    uefaComps.push(UEFA_COMPS.USC)
  } else if (uefaStatus === 'UEL') {
    uefaComps.push(UEFA_COMPS.UEL)
    uefaComps.push(UEFA_COMPS.USC)
  } else if (uefaStatus === 'UECL') {
    uefaComps.push(UEFA_COMPS.UECL)
  }

  // ── Tab / competition state ──────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('readiness')
  const [selectedComp, setSelectedComp] = useState(domesticComps[0]?.code || 'PL')

  useEffect(() => {
    if (domesticComps.length > 0) setSelectedComp(domesticComps[0].code)
  }, [teamId])

  // ── Squad data ───────────────────────────────────────────────────────────
  const [startingXI,    setStartingXI]    = useState([])
  const [matchdayBench, setMatchdayBench] = useState([])
  const [squadReserves, setSquadReserves] = useState([])
  const [squadLoading,  setSquadLoading]  = useState(false)

  useEffect(() => {
    if (!teamId) return
    setSquadLoading(true)
    fetchSquad(teamId, selectedTeam?.leagueCode || 'PL')
      .then(data => {
        setStartingXI(data.starting_xi ?? data.xi ?? [])
        setMatchdayBench(data.bench ?? [])
        setSquadReserves(data.reserves ?? [])
      })
      .catch(() => {})
      .finally(() => setSquadLoading(false))
  }, [teamId])

  const fullSquad = useMemo(() => [
    ...startingXI,
    ...matchdayBench,
    ...squadReserves,
  ], [startingXI, matchdayBench, squadReserves])

  const groupedSquad = useMemo(() => groupPlayers(fullSquad), [fullSquad])

  // ── Player statuses (Readiness tab) ─────────────────────────────────────
  const [playerStatuses, setPlayerStatuses] = useState({})

  const updateStatus = (playerName, status) => {
    setPlayerStatuses(prev => ({ ...prev, [playerName]: status }))
  }

  const getStatus = (playerName) => playerStatuses[playerName] || 'available'

  const excludedPlayers = useMemo(() =>
    Object.entries(playerStatuses)
      .filter(([, s]) => s === 'injured' || s === 'suspended')
      .map(([name]) => name),
    [playerStatuses]
  )

  useEffect(() => {
    try { localStorage.setItem('subhub_excluded_players', JSON.stringify(excludedPlayers)) } catch {}
  }, [excludedPlayers])

  useEffect(() => { setPlayerStatuses({}) }, [teamId])

  // ── XI Builder state ─────────────────────────────────────────────────────
  const [builderFormation, setBuilderFormation] = useState('4-3-3')
  const [builtXI,          setBuiltXI]          = useState({})
  const [draggedPlayer,    setDraggedPlayer]    = useState(null)
  const [bslSearch,        setBslSearch]        = useState('')
  const [bslFilter,        setBslFilter]        = useState('ALL')

  const placedPlayerNames = useMemo(() =>
    Object.values(builtXI).filter(Boolean).map(p => p.name),
    [builtXI]
  )

  const availablePlayers = useMemo(() =>
    fullSquad.filter(p =>
      !placedPlayerNames.includes(p.name) &&
      !excludedPlayers.includes(p.name)
    ),
    [fullSquad, placedPlayerNames, excludedPlayers]
  )

  const placedCount = Object.values(builtXI).filter(Boolean).length

  const handleLoadIntoConsole = () => {
    const xi = Object.entries(builtXI)
      .filter(([, p]) => p !== null && p !== undefined)
      .map(([key, player]) => {
        const slotDef = BUILDER_SLOTS[builderFormation].find(s => s.key === key)
        return { ...player, assigned_slot: slotDef?.slot || player.api_position }
      })
    if (xi.length < 11) return
    try {
      localStorage.setItem('subhub_custom_xi', JSON.stringify(xi))
      localStorage.setItem('subhub_custom_formation', builderFormation)
    } catch {}
    window.location.href = '/match'
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="planner-page">

      {/* TOP BAR */}
      <div className="planner-topbar">

        <div className="planner-team">
          <span className="planner-team-name">
            {teamName || '← Select a team first'}
          </span>
        </div>

        <div className="planner-competition">
          <span className="planner-label">COMPETITION</span>
          <div className="comp-groups">

            <div className="comp-group">
              <span className="comp-group-label">DOMESTIC</span>
              <div className="competition-pills">
                {domesticComps.map(comp => (
                  <button
                    key={comp.code}
                    className={`comp-pill ${selectedComp === comp.code ? 'active' : ''}`}
                    onClick={() => setSelectedComp(comp.code)}
                  >
                    {comp.name}
                  </button>
                ))}
              </div>
            </div>

            {uefaComps.length > 0 && (
              <div className="comp-group">
                <span className="comp-group-label">UEFA</span>
                <div className="competition-pills">
                  {uefaComps.map(comp => (
                    <button
                      key={comp.code}
                      className={`comp-pill ${selectedComp === comp.code ? 'active' : ''}`}
                      onClick={() => setSelectedComp(comp.code)}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="comp-group">
              <span className="comp-group-label"> </span>
              <div className="competition-pills">
                <button
                  className={`comp-pill ${selectedComp === FRIENDLY.code ? 'active' : ''}`}
                  onClick={() => setSelectedComp(FRIENDLY.code)}
                >
                  {FRIENDLY.name}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* TAB NAVIGATION */}
      <div className="planner-tabs">
        <button
          className={`planner-tab ${activeTab === 'readiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          🩺 Squad Readiness
        </button>
        <button
          className={`planner-tab ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          ⚽ XI Builder
        </button>
        <button
          className={`planner-tab ${activeTab === 'doctrine' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctrine')}
        >
          📋 Sub Doctrine
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="planner-content">

        {/* ── SQUAD READINESS ── */}
        {activeTab === 'readiness' && (
          <div className="tab-readiness">

            {squadLoading && (
              <div className="readiness-loading">Loading squad…</div>
            )}

            {!squadLoading && fullSquad.length === 0 && (
              <div className="tab-placeholder">
                <span>🩺</span>
                <h3>Squad Readiness</h3>
                <p>Select a team to see the full squad and flag players.</p>
              </div>
            )}

            {!squadLoading && fullSquad.length > 0 && (
              <>
                <div className="readiness-header">
                  <div className="readiness-title">
                    <h2>SQUAD READINESS</h2>
                    <p>Flag players before the game. Injured and suspended
                       players are excluded from sub recommendations.</p>
                  </div>
                  <div className="readiness-summary">
                    <div className="summary-pill available">
                      🟢 {fullSquad.filter(p => getStatus(p.name) === 'available').length} Available
                    </div>
                    <div className="summary-pill injured">
                      🔴 {excludedPlayers.length} Excluded
                    </div>
                    <div className="summary-pill doubtful">
                      🟡 {fullSquad.filter(p => getStatus(p.name) === 'doubtful').length} Doubtful
                    </div>
                  </div>
                </div>

                {fullSquad.filter(p =>
                  projectStamina(p, 75) < 40 &&
                  getStatus(p.name) === 'available'
                ).length > 0 && (
                  <div className="redline-warning">
                    ⚠ {fullSquad.filter(p =>
                      projectStamina(p, 75) < 40 &&
                      getStatus(p.name) === 'available'
                    ).length} players projected critical before 75'
                  </div>
                )}

                <div className="status-legend-bar">
                  <span>🟢 Available</span>
                  <span>🔴 Injured</span>
                  <span>🟡 Doubtful</span>
                  <span>🟠 Suspended</span>
                  <span>🔵 Managed mins</span>
                </div>

                {Object.entries(groupedSquad).map(([group, players]) =>
                  players.length > 0 && (
                    <div key={group} className="readiness-group">
                      <div className="readiness-group-label">{group.toUpperCase()}</div>
                      <div className="readiness-players">
                        {players.map(player => {
                          const status     = getStatus(player.name)
                          const stamina60  = projectStamina(player, 60)
                          const stamina90  = projectStamina(player, 90)
                          const isRedline  = stamina60 < 45
                          const isExcluded = status === 'injured' || status === 'suspended'

                          return (
                            <div
                              key={player.name}
                              className={[
                                'readiness-player-row',
                                isExcluded ? 'excluded' : '',
                                isRedline && !isExcluded ? 'redline' : '',
                              ].join(' ').trim()}
                            >
                              <div className="rp-position">
                                {player.api_position || player.position}
                              </div>
                              <div className="rp-info">
                                <span className="rp-name">{player.short_name || player.name}</span>
                                <span className="rp-overall">{player.overall}</span>
                              </div>
                              {!isExcluded && (
                                <div className="rp-stamina">
                                  <div className="rp-stamina-item">
                                    <span className="rp-stamina-label">60'</span>
                                    <span className="rp-stamina-value" style={{ color: getStaminaColor(stamina60) }}>
                                      {stamina60}%
                                    </span>
                                  </div>
                                  <div className="rp-stamina-item">
                                    <span className="rp-stamina-label">90'</span>
                                    <span className="rp-stamina-value" style={{ color: getStaminaColor(stamina90) }}>
                                      {stamina90}%
                                    </span>
                                  </div>
                                  {isRedline && <span className="rp-redline-flag">⚠ Redline</span>}
                                </div>
                              )}
                              <div className="rp-status">
                                <span className="status-legend">STATUS</span>
                                {[
                                  ['available', '🟢', 'Available — fully fit'],
                                  ['injured',   '🔴', 'Injured — excluded from subs'],
                                  ['doubtful',  '🟡', 'Doubtful — 50/50 fitness'],
                                  ['suspended', '🟠', 'Suspended — excluded from subs'],
                                  ['managed',   '🔵', 'Managed — limited minutes'],
                                ].map(([s, icon, tip]) => (
                                  <button
                                    key={s}
                                    className={`status-btn status-${s} ${status === s ? 'active' : ''}`}
                                    onClick={() => updateStatus(player.name, s)}
                                    title={tip}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                )}

                {excludedPlayers.length > 0 && (
                  <div className="readiness-footer">
                    Excluded: {excludedPlayers.join(', ')}
                    — these will not appear in Console recommendations
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── XI BUILDER ── */}
        {activeTab === 'builder' && (
          <div className="tab-builder">

            {/* Builder controls */}
            <div className="builder-controls">
              <div className="builder-formation-label">FORMATION</div>
              <div className="builder-formation-pills">
                {['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1'].map(f => (
                  <button
                    key={f}
                    className={`toggle-pill ${builderFormation === f ? 'active' : ''}`}
                    onClick={() => { setBuilderFormation(f); setBuiltXI({}) }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="builder-actions">
                <button className="builder-clear-btn" onClick={() => setBuiltXI({})}>
                  Clear XI
                </button>
                <button
                  className="builder-load-btn"
                  disabled={placedCount < 11}
                  onClick={handleLoadIntoConsole}
                >
                  ⚡ Load into Console
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="builder-progress">
              <span className="builder-progress-count">{placedCount}/11</span>
              <span className="builder-progress-label">players placed</span>
              {placedCount === 11 && (
                <span className="builder-complete">✓ XI Complete — ready to load</span>
              )}
            </div>

            {/* Main layout */}
            <div className="builder-layout">

              {/* LEFT — Pitch */}
              <div className="builder-pitch-wrapper">
                <div className="builder-pitch">
                  {BUILDER_SLOTS[builderFormation].map(slotDef => {
                    const player = builtXI[slotDef.key]
                    return (
                      <div
                        key={slotDef.key}
                        className={`builder-slot ${player ? 'filled' : 'empty'}`}
                        style={{
                          position: 'absolute',
                          left: slotDef.left,
                          top: slotDef.top,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault()
                          if (!draggedPlayer) return
                          if (!isCompatibleForSlot(draggedPlayer, slotDef.slot)) {
                            e.currentTarget.classList.add('invalid')
                            setTimeout(() => e.currentTarget.classList.remove('invalid'), 600)
                            return
                          }
                          const existingKey = Object.keys(builtXI)
                            .find(k => builtXI[k]?.name === draggedPlayer.name)
                          if (existingKey) {
                            const displaced = builtXI[slotDef.key]
                            setBuiltXI(prev => ({
                              ...prev,
                              [existingKey]: displaced || null,
                              [slotDef.key]: draggedPlayer,
                            }))
                          } else {
                            setBuiltXI(prev => ({ ...prev, [slotDef.key]: draggedPlayer }))
                          }
                          setDraggedPlayer(null)
                        }}
                      >
                        {player ? (
                          <div
                            className="builder-filled-card"
                            draggable
                            onDragStart={() => setDraggedPlayer(player)}
                            onClick={() => setBuiltXI(prev => ({ ...prev, [slotDef.key]: null }))}
                          >
                            <span className="bfc-slot">{slotDef.slot}</span>
                            <span className="bfc-overall">{player.overall}</span>
                            <span className="bfc-name">{getSurname(player.short_name || player.name)}</span>
                            <div className="bfc-remove">×</div>
                          </div>
                        ) : (
                          <div className="builder-empty-slot">
                            <span className="bes-slot">{slotDef.slot}</span>
                            <span className="bes-hint">drop here</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* RIGHT — Squad list */}
              <div className="builder-squad-list">
                <div className="bsl-header">SQUAD — drag to pitch</div>

                <input
                  className="bsl-search"
                  placeholder="Search player..."
                  onChange={e => setBslSearch(e.target.value.toLowerCase())}
                />

                <div className="bsl-filter">
                  {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(f => (
                    <button
                      key={f}
                      className={`bsl-filter-btn ${bslFilter === f ? 'active' : ''}`}
                      onClick={() => setBslFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="bsl-players">
                  {availablePlayers
                    .filter(p => {
                      const name = (p.short_name || p.name).toLowerCase()
                      const matchSearch = !bslSearch || name.includes(bslSearch)
                      const pos = p.api_position || 'CM'
                      const matchFilter =
                        bslFilter === 'ALL' ||
                        (bslFilter === 'GK'  && pos === 'GK') ||
                        (bslFilter === 'DEF' && ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) ||
                        (bslFilter === 'MID' && ['CDM', 'CM', 'LM', 'RM', 'CAM', 'LAM', 'RAM'].includes(pos)) ||
                        (bslFilter === 'ATT' && ['ST', 'CF', 'LW', 'RW'].includes(pos))
                      return matchSearch && matchFilter
                    })
                    .map(player => (
                      <div
                        key={player.name}
                        className="bsl-player-row"
                        draggable
                        onDragStart={() => setDraggedPlayer(player)}
                      >
                        <span className="bsl-pos">{player.api_position}</span>
                        <span className="bsl-name">{player.short_name || player.name}</span>
                        <span className="bsl-ovr">{player.overall}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── SUB DOCTRINE ── */}
        {activeTab === 'doctrine' && (
          <div className="tab-doctrine">
            <div className="tab-placeholder">
              <span>📋</span>
              <h3>Sub Doctrine</h3>
              <p>Plan your substitutions before kickoff.
                 Coming in Sprint 4.</p>
            </div>
          </div>
        )}

      </div>

      {/* No team selected overlay */}
      {!teamName && (
        <div className="planner-no-team">
          <span>⚽</span>
          <h2>No Team Selected</h2>
          <p>Select a team from the leagues page first</p>
          <a href="/leagues" className="planner-select-btn">
            ← Select a Team
          </a>
        </div>
      )}

    </div>
  )
}
