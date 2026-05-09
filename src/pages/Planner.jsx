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
  // England
  57: 'ENG', 58: 'ENG', 61: 'ENG', 62: 'ENG',
  63: 'ENG', 64: 'ENG', 65: 'ENG', 66: 'ENG',
  67: 'ENG', 68: 'ENG', 73: 'ENG', 76: 'ENG',
  328: 'ENG', 341: 'ENG', 351: 'ENG', 354: 'ENG',
  356: 'ENG', 380: 'ENG', 394: 'ENG', 397: 'ENG',
  402: 'ENG', 563: 'ENG', 715: 'ENG', 71: 'ENG',
  1044: 'ENG',
  // Germany
  1: 'GER', 3: 'GER', 4: 'GER', 5: 'GER',
  6: 'GER', 9: 'GER', 10: 'GER', 11: 'GER',
  13: 'GER', 15: 'GER', 16: 'GER', 17: 'GER',
  19: 'GER', 721: 'GER',
  // Spain
  77: 'ESP', 78: 'ESP', 81: 'ESP', 82: 'ESP',
  83: 'ESP', 86: 'ESP', 87: 'ESP', 90: 'ESP',
  92: 'ESP', 94: 'ESP', 95: 'ESP', 96: 'ESP',
  1048: 'ESP', 559: 'ESP',
  // France
  516: 'FRA', 518: 'FRA', 521: 'FRA', 522: 'FRA',
  523: 'FRA', 524: 'FRA', 525: 'FRA', 527: 'FRA',
  529: 'FRA', 530: 'FRA', 532: 'FRA', 548: 'FRA',
  // Italy
  98: 'ITA', 99: 'ITA', 100: 'ITA', 102: 'ITA',
  103: 'ITA', 104: 'ITA', 107: 'ITA', 108: 'ITA',
  109: 'ITA', 110: 'ITA', 113: 'ITA', 115: 'ITA',
  586: 'ITA', 7397: 'ITA',
  // Portugal
  495: 'POR', 498: 'POR', 503: 'POR', 5613: 'POR',
  764: 'POR', 1903: 'POR',
  // Netherlands
  666: 'NED', 671: 'NED', 674: 'NED', 675: 'NED',
  676: 'NED', 678: 'NED', 682: 'NED', 683: 'NED',
}

const COMPETITIONS_BY_COUNTRY = {
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

const UEFA_COMPETITIONS = [
  { code: 'UCL', name: 'Champions League' },
  { code: 'UEL', name: 'Europa League' },
  { code: 'ECL', name: 'Conference League' },
  { code: 'USC', name: 'UEFA Super Cup' },
]

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

  const country      = TEAM_COUNTRY[teamId] || 'ENG'
  const domesticComps = COMPETITIONS_BY_COUNTRY[country] || []

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

            <div className="comp-group">
              <span className="comp-group-label">UEFA</span>
              <div className="competition-pills">
                {UEFA_COMPETITIONS.map(comp => (
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

        {/* Right: Formation + Playstyle */}
        <div className="planner-tactics">
          <div className="planner-formation-pills">
            {FORMATIONS.map(f => (
              <button
                key={f}
                className={`toggle-pill ${selectedFormation === f ? 'active' : ''}`}
                onClick={() => setSelectedFormation(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="planner-playstyle-pills">
            {PLAYSTYLES.map(ps => (
              <button
                key={ps.code}
                className={`toggle-pill ${selectedPlaystyle === ps.code ? 'active' : ''}`}
                onClick={() => setSelectedPlaystyle(ps.code)}
              >
                {ps.icon} {ps.label}
              </button>
            ))}
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
