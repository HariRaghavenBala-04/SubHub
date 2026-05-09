/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useState, useEffect } from 'react'
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
  // ENGLAND
  57:   'UCL',   // Arsenal
  58:   'UEL',   // Aston Villa
  61:   'UCL',   // Chelsea
  64:   'UCL',   // Liverpool
  65:   'UCL',   // Man City
  67:   'UCL',   // Newcastle
  73:   'UCL',   // Tottenham
  354:  'UECL',  // Crystal Palace
  351:  'UEL',   // Nottingham Forest

  // GERMANY
  3:    'UCL',   // Leverkusen
  4:    'UCL',   // Dortmund
  5:    'UCL',   // Bayern
  10:   'UEL',   // Stuttgart
  17:   'UEL',   // Freiburg
  19:   'UCL',   // Frankfurt
  721:  'UECL',  // RB Leipzig

  // SPAIN
  78:   'UCL',   // Atletico
  81:   'UCL',   // Barcelona
  86:   'UCL',   // Real Madrid
  90:   'UEL',   // Real Betis
  92:   'UECL',  // Real Sociedad
  94:   'UCL',   // Villarreal
  95:   'UCL',   // Athletic Bilbao
  558:  'UEL',   // Celta Vigo

  // FRANCE
  516:  'UECL',  // Lens
  521:  'UEL',   // Lille
  523:  'UEL',   // Lyon
  524:  'UCL',   // PSG
  527:  'UCL',   // Nice
  548:  'UCL',   // Monaco

  // ITALY
  99:   'UECL',  // Fiorentina
  100:  'UEL',   // Roma
  102:  'UCL',   // Atalanta
  103:  'UEL',   // Bologna
  108:  'UCL',   // Inter
  109:  'UCL',   // Juventus
  113:  'UCL',   // Napoli

  // NETHERLANDS
  674:  'UCL',   // PSV
  675:  'UCL',   // Feyenoord
  678:  'UCL',   // Ajax
  682:  'UECL',  // AZ
  718:  'UEL',   // Go Ahead Eagles

  // PORTUGAL
  495:  'UCL',   // Sporting CP
  498:  'UCL',   // Benfica
  503:  'UEL',   // Porto
  5543: 'UECL',  // Vitoria Guimaraes
  5613: 'UEL',   // Braga
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

// ── Other constants ────────────────────────────────────────────────────────

const FORMATIONS = [
  '4-3-3', '4-4-2', '4-2-3-1',
  '3-5-2', '5-3-2', '4-5-1',
]

const PLAYSTYLES = [
  { code: 'high_press',       icon: '⚡', label: 'High Press' },
  { code: 'positional',       icon: '🔷', label: 'Positional' },
  { code: 'low_block',        icon: '🛡', label: 'Low Block' },
  { code: 'counter_attack',   icon: '⚔', label: 'Counter' },
  { code: 'direct_play',      icon: '🎯', label: 'Direct' },
  { code: 'structured_press', icon: '🔄', label: 'Structured' },
]

// ── Page ───────────────────────────────────────────────────────────────────

export default function Planner() {
  const { selectedTeam } = useTeam()
  const teamName = selectedTeam?.name ?? null
  const teamId   = selectedTeam?.id ?? null

  const country       = TEAM_COUNTRY[teamId] || 'ENG'
  const domesticComps = DOMESTIC_COMPS[country] || []
  const uefaStatus    = UEFA_ELIGIBILITY[teamId]

  // Build UEFA section based on eligibility
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

  const [activeTab,         setActiveTab]         = useState('readiness')
  const [selectedComp,      setSelectedComp]      = useState(domesticComps[0]?.code || 'PL')
  const [selectedFormation, setSelectedFormation] = useState('4-3-3')
  const [selectedPlaystyle, setSelectedPlaystyle] = useState('high_press')

  // Auto-select first domestic comp when team changes
  useEffect(() => {
    if (domesticComps.length > 0) {
      setSelectedComp(domesticComps[0].code)
    }
  }, [teamId])

  return (
    <div className="planner-page">

      {/* TOP BAR */}
      <div className="planner-topbar">

        {/* Left: Team name */}
        <div className="planner-team">
          <span className="planner-team-name">
            {teamName || '← Select a team first'}
          </span>
        </div>

        {/* Centre: Competition selector */}
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

        {activeTab === 'readiness' && (
          <div className="tab-readiness">
            <div className="tab-placeholder">
              <span>🩺</span>
              <h3>Squad Readiness</h3>
              <p>Flag injured, suspended and doubtful players
                 before the game. Coming in Sprint 2.</p>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="tab-builder">
            <div className="tab-placeholder">
              <span>⚽</span>
              <h3>XI Builder</h3>
              <p>Drag players onto the pitch to set your
                 starting lineup. Coming in Sprint 3.</p>
            </div>
          </div>
        )}

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
