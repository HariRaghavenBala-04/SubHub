/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useState } from 'react'
import { useTeam } from '../context/TeamContext'

// ── Constants ──────────────────────────────────────────────────────────────

const COMPETITIONS = [
  // English
  { code: 'PL',  name: 'Premier League',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'FAC', name: 'FA Cup',               flag: '🏆' },
  { code: 'CC',  name: 'Carabao Cup',          flag: '🥤' },
  { code: 'FCS', name: 'Community Shield',     flag: '🛡' },
  // UEFA
  { code: 'UCL', name: 'Champions League',     flag: '⭐' },
  { code: 'UEL', name: 'Europa League',        flag: '🟠' },
  { code: 'ECL', name: 'Conference League',    flag: '🟢' },
  { code: 'USC', name: 'UEFA Super Cup',       flag: '🏅' },
  // Spain
  { code: 'LL',  name: 'La Liga',              flag: '🇪🇸' },
  { code: 'CDR', name: 'Copa del Rey',         flag: '👑' },
  { code: 'SSP', name: 'Supercopa España',     flag: '🌟' },
  // Germany
  { code: 'BL',  name: 'Bundesliga',           flag: '🇩🇪' },
  { code: 'DFB', name: 'DFB Pokal',            flag: '🌿' },
  { code: 'SPK', name: 'Super Pokal',          flag: '🔴' },
  // France
  { code: 'L1',  name: 'Ligue 1',              flag: '🇫🇷' },
  { code: 'CDF', name: 'Coupe de France',      flag: '🔵' },
  { code: 'TSC', name: 'Trophée des Champions',flag: '🥇' },
  // Netherlands
  { code: 'ERE', name: 'Eredivisie',           flag: '🇳🇱' },
  { code: 'KNV', name: 'KNVB Cup',             flag: '🟠' },
  // Italy
  { code: 'SA',  name: 'Serie A',              flag: '🇮🇹' },
  { code: 'CPI', name: 'Coppa Italia',         flag: '🇮🇹' },
  { code: 'SCI', name: 'Supercoppa Italia',    flag: '🏆' },
  // Portugal
  { code: 'PPL', name: 'Liga Portugal',        flag: '🇵🇹' },
  { code: 'TCP', name: 'Taça de Portugal',     flag: '🟢' },
  // Friendly
  { code: 'FRN', name: 'Friendly',             flag: '🤝' },
]

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

  const [activeTab,          setActiveTab]          = useState('readiness')
  const [selectedComp,       setSelectedComp]       = useState('PL')
  const [selectedFormation,  setSelectedFormation]  = useState('4-3-3')
  const [selectedPlaystyle,  setSelectedPlaystyle]  = useState('high_press')

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
          <div className="competition-pills">
            {COMPETITIONS.map(comp => (
              <button
                key={comp.code}
                className={`comp-pill ${selectedComp === comp.code ? 'active' : ''}`}
                onClick={() => setSelectedComp(comp.code)}
              >
                {comp.flag} {comp.name}
              </button>
            ))}
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
