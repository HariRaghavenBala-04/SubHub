/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import Pitch from '../components/Pitch'
import BenchRow from '../components/BenchRow'
import RecommendPanel from '../components/RecommendPanel'
import PlayerCard from '../components/PlayerCard'
import { useTeam } from '../context/TeamContext'
import { FORMATIONS, FORMATION_KEYS } from '../data/formations'
import { computeStamina, computeClientRecs, isCompatibleDrop, getGameStatusText } from '../utils/football'
import { getSavedSquads } from '../utils/squadStorage'
import { UEFA_ELIGIBILITY } from '../utils/uefaEligibility'

const INTENTS = [
  { value: 'protect_lead', label: '🛡 Protect Lead' },
  { value: 'chase_game',   label: '⚔ Chase Game'   },
  { value: 'tactical',     label: '🔄 Tactical'     },
]

// ── Competition format — drives ET/PK rules ───────────────────────────────
const COMPETITION_FORMAT = {
  // Five major leagues — 90-minute, no knockout rules
  PL:   { name: 'Premier League',     hasET: false, straightToPKs: false },
  PD:   { name: 'La Liga',            hasET: false, straightToPKs: false },
  BL1:  { name: 'Bundesliga',         hasET: false, straightToPKs: false },
  SA:   { name: 'Serie A',            hasET: false, straightToPKs: false },
  FL1:  { name: 'Ligue 1',            hasET: false, straightToPKs: false },
  // European knockout cups — ET then PKs
  UCL:  { name: 'Champions League',   hasET: true,  straightToPKs: false },
  UEL:  { name: 'Europa League',      hasET: true,  straightToPKs: false },
  UECL: { name: 'Conference League',  hasET: true,  straightToPKs: false },
  // Domestic cups — ET then PKs
  FAC:  { name: 'FA Cup',             hasET: true,  straightToPKs: false },
  ELC:  { name: 'Carabao Cup',        hasET: true,  straightToPKs: false },
  DFB:  { name: 'DFB Pokal',          hasET: true,  straightToPKs: false },
  CDR:  { name: 'Copa del Rey',       hasET: true,  straightToPKs: false },
  CIT:  { name: 'Coppa Italia',       hasET: true,  straightToPKs: false },
  // Straight-to-PKs formats (no ET)
  CS:   { name: 'Community Shield',   hasET: false, straightToPKs: true  },
  SC:   { name: 'UEFA Super Cup',     hasET: false, straightToPKs: true  },
  // Full display string aliases — matched when dropdown sets competition state
  'Champions League':        { hasET: true,  straightToPKs: false },
  'Europa League':           { hasET: true,  straightToPKs: false },
  'Conference League':       { hasET: true,  straightToPKs: false },
  'FA Cup':                  { hasET: true,  straightToPKs: false },
  'Carabao Cup':             { hasET: true,  straightToPKs: false },
  'Coupe de France':         { hasET: true,  straightToPKs: false },
  'DFB Pokal':               { hasET: true,  straightToPKs: false },
  'Copa del Rey':            { hasET: true,  straightToPKs: false },
  'Coppa Italia':            { hasET: true,  straightToPKs: false },
  'KNVB Cup':                { hasET: true,  straightToPKs: false },
  'Taça de Portugal':        { hasET: true,  straightToPKs: false },
  'Community Shield':        { hasET: false, straightToPKs: true  },
  'UEFA Super Cup':          { hasET: false, straightToPKs: true  },
  'Trophée des Champions':   { hasET: false, straightToPKs: true  },
  'DFL Super Cup':           { hasET: false, straightToPKs: true  },
  'Supercopa de España':     { hasET: false, straightToPKs: true  },
  'Supercoppa Italiana':     { hasET: false, straightToPKs: true  },
  'Johan Cruyff Shield':     { hasET: false, straightToPKs: true  },
  'Supertaça':               { hasET: false, straightToPKs: true  },
  'Premier League':          { hasET: false, straightToPKs: false },
  'La Liga':                 { hasET: false, straightToPKs: false },
  'Bundesliga':              { hasET: false, straightToPKs: false },
  'Serie A':                 { hasET: false, straightToPKs: false },
  'Ligue 1':                 { hasET: false, straightToPKs: false },
  'Eredivisie':              { hasET: false, straightToPKs: false },
  'Primeira Liga':           { hasET: false, straightToPKs: false },
  'Friendly':                { hasET: false, straightToPKs: false },
}

function getCompetitionFormat(comp) {
  return COMPETITION_FORMAT[comp] ?? { name: comp || 'League', hasET: false, straightToPKs: false }
}

// ── Competitions allowed per league ───────────────────────────────────────────
const LEAGUE_COMPETITIONS = {
  PL:  ['Premier League','FA Cup','Carabao Cup','Community Shield'],
  PD:  ['La Liga','Copa del Rey','Supercopa de España'],
  BL1: ['Bundesliga','DFB Pokal','DFL Super Cup'],
  SA:  ['Serie A','Coppa Italia','Supercoppa Italiana'],
  FL1: ['Ligue 1','Coupe de France','Trophée des Champions'],
  DED: ['Eredivisie','KNVB Cup','Johan Cruyff Shield'],
  PPL: ['Primeira Liga','Taça de Portugal','Supertaça'],
}

function getMatchPhase(minute, hasET) {
  if (minute <= 45)              return { label: '1ST HALF',      color: 'var(--green)' }
  if (minute <= 90 || !hasET)   return { label: '2ND HALF',      color: 'var(--green)' }
  if (minute <= 105)             return { label: 'EXTRA TIME 1',  color: 'var(--amber)' }
  if (minute <= 120)             return { label: 'EXTRA TIME 2',  color: '#ff6464' }
  return                                { label: 'PENALTIES',     color: '#ff3d3d' }
}

function getMinuteDisplay(minute) {
  if (minute <= 90)  return `${minute}'`
  if (minute <= 105) return `90+${minute - 90}'`
  if (minute <= 120) return `105+${minute - 105}'`
  return 'PK'
}

// ── Formation slot order — defines pitchPlayers array index → slot mapping ──
const FORMATION_SLOT_ORDER = {
  '4-3-3':   ['GK','LB','CB','CB','RB','CM','CM','CM','LW','ST','RW'],
  '4-4-2':   ['GK','LB','CB','CB','RB','LM','CM','CM','RM','ST','ST'],
  '4-2-3-1': ['GK','LB','CB','CB','RB','CDM','CDM','LW','CAM','RW','ST'],
  '3-5-2':   ['GK','CB','CB','CB','LM','CM','CM','CM','RM','ST','ST'],
  '5-3-2':   ['GK','LB','CB','CB','CB','RB','CM','CM','CM','ST','ST'],
  '4-5-1':   ['GK','LB','CB','CB','RB','LM','CM','CM','CM','RM','ST'],
}

function sortXIByFormation(xi, slotOrder) {
  const used   = new Set()
  const result = slotOrder.map(slot => {
    const match = xi.find(p => p.assigned_slot === slot && !used.has(p.id))
    if (match) { used.add(match.id); return match }
    return null
  }).filter(Boolean)
  const remaining = xi.filter(p => !used.has(p.id))
  return [...result, ...remaining].slice(0, 11)
}

// ── Position compatibility tiers ──────────────────────────────────────────
// Returns: 'natural' | 'stretched' | 'tactical' | 'blocked'
function getPositionCompatibility(playerPos, slotPos) {
  if (!playerPos || !slotPos) return 'natural'
  const pp = playerPos.toUpperCase()
  const sp = slotPos.toUpperCase()
  if (pp === sp) return 'natural'

  const ATTACKERS = ['ST','CF','LW','RW','LM','RM','CAM','SS']
  const DEFENDERS = ['CB','LB','RB','LWB','RWB']
  const isAttacker   = ATTACKERS.includes(pp)
  const isDefender   = DEFENDERS.includes(pp)
  const slotDefender = DEFENDERS.includes(sp)
  const slotAttacker = ATTACKERS.includes(sp)

  if (pp === 'GK' || sp === 'GK') return 'blocked'
  if (isAttacker && slotDefender)  return 'blocked'
  if (isDefender && slotAttacker)  return 'tactical'

  const NATURAL_SWAPS = [
    ['LB','RB'],   ['LW','RW'],   ['LM','RM'],
    ['CM','CDM'],  ['CM','CAM'],  ['CDM','CAM'],
    ['CM','LM'],   ['CM','RM'],
    ['CAM','LM'],  ['CAM','RM'],
    ['CDM','LM'],  ['CDM','RM'],
    ['LWB','LB'],  ['RWB','RB'],
    ['LWB','LM'],  ['RWB','RM'],
    ['ST','CF'],   ['CF','ST'],
  ]
  if (NATURAL_SWAPS.some(([a, b]) => (pp === a && sp === b) || (pp === b && sp === a)))
    return 'natural'

  const STRETCHED = [
    ['CB','CDM'],  ['CB','CM'],
    ['LB','LM'],   ['RB','RM'],
    ['LB','LW'],   ['RB','RW'],
    ['CAM','ST'],  ['CAM','CF'],
    ['LW','ST'],   ['RW','ST'],
    ['LM','LW'],   ['RM','RW'],
  ]
  if (STRETCHED.some(([a, b]) => (pp === a && sp === b) || (pp === b && sp === a)))
    return 'stretched'

  return 'tactical'
}

export default function Match() {
  const { selectedTeam, fetchSquad } = useTeam()
  const location = useLocation()

  // Reserve IDs + excluded (injured/suspended) players — cannot be subbed on during a match
  const reserveIds = useMemo(
    () => new Set([
      ...(location.state?.confirmedReserves ?? []).map(p => p.id),
      ...(location.state?.excludedPlayerIds  ?? []),
    ]),
    [location.state]
  )

  // Competition — overridden by route state when arriving from Planner
  const [competition, setCompetition] = useState(
    location.state?.competition || ''
  )

  // Competition format — drives ET/PK rules
  const compFormat = useMemo(() => getCompetitionFormat(competition), [competition])
  const sliderMax  = compFormat.hasET ? 130 : 100

  // ET 6th-sub slot tracking
  const [etSubUsed, setEtSubUsed] = useState(false)

  // Competition selector dropdown
  const [showCompSelector, setShowCompSelector] = useState(false)

  useEffect(() => {
    if (!showCompSelector) return
    const handler = (e) => {
      if (!e.target.closest('.comp-selector-wrap')) setShowCompSelector(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCompSelector])

  // Saved squads panel — shown when user arrives without a confirmed XI
  const [showSavedSquadsPanel, setShowSavedSquadsPanel] = useState(
    !location.state?.confirmedXI
  )
  const [savedSquads, setSavedSquads] = useState(() =>
    getSavedSquads().filter(s => s.teamId === selectedTeam?.id)
  )

  useEffect(() => {
    setSavedSquads(getSavedSquads().filter(s => s.teamId === selectedTeam?.id))
  }, [selectedTeam?.id])

  // matchStarted gates the sub counter.
  // True on first render when arriving from Squad.jsx with a confirmed 11-player XI —
  // every bench→pitch drag immediately counts as a real substitution.
  // False on direct navigation to /match — START MATCH button flips it manually.
  const [matchStarted, setMatchStarted] = useState(
    !!(location.state?.confirmedXI && location.state.confirmedXI.length === 11)
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  // Squad state
  const [pitchPlayers,   setPitchPlayers]   = useState([])
  const [benchPlayers,   setBenchPlayers]   = useState([])
  const [reservePlayers, setReservePlayers] = useState([])
  const [originalPitch,  setOriginalPitch]  = useState([])
  const [originalBench,  setOriginalBench]  = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)

  // Match controls
  const [formation,      setFormation]      = useState('4-3-3')
  const [minute,         setMinute]         = useState(60)
  const [ourScore,       setOurScore]       = useState(0)
  const [opponentScore,  setOpponentScore]  = useState(0)
  const [isHome,         setIsHome]         = useState(true)
  const [opponentName,   setOpponentName]   = useState('Opponent')
  const [intent,         setIntent]         = useState('tactical')
  const [playstyle,      setPlaystyle]      = useState('high_press')
  const [injuredPlayers, setInjuredPlayers] = useState([])

  // Playstyle data + compatibility
  const [playstyles,    setPlaystyles]    = useState({})
  const [compatibility, setCompatibility] = useState(null)
  const [conflictData,  setConflictData]  = useState(null)

  // Recommendation state
  const [recs,           setRecs]           = useState([])
  const [recLoading,     setRecLoading]     = useState(false)
  const [showPanel,      setShowPanel]      = useState(false)
  const [highlightOff,   setHighOff]        = useState(null)
  const [highlightOn,    setHighOn]         = useState(null)
  const [subArrow,       setSubArrow]       = useState(null)
  const [toast,          setToast]          = useState(null)
  const [shouldReanalyse, setShouldReanalyse] = useState(false)
  const [urgencyMode,    setUrgencyMode]    = useState(null)
  const [groupedWindow,  setGroupedWindow]  = useState(null)

  // Drag state
  const [activeDrag,      setActiveDrag]      = useState(null)
  const [swapFlashIdx,    setFlashIdx]         = useState(null)
  const [invalidFlashIdx, setInvalidFlashIdx]  = useState(null)
  const [manualSwaps,     setManualSwaps]      = useState(new Set())
  const flashTimer       = useRef(null)
  const handleAnalyseRef = useRef(null)

  // Sub counter + undo
  const [subsUsed,        setSubsUsed]        = useState(0)
  const [subHistory,      setSubHistory]      = useState([]) // stack of { pitch, bench, subsUsed }
  const [appliedSubNames, setAppliedSubNames] = useState(new Set())

  // Bench expand / formation preview
  const [benchExpanded,     setBenchExpanded]     = useState(false)
  const [previewFormation,  setPreviewFormation]  = useState(null)
  const [previewPos,        setPreviewPos]        = useState({ x: 0, y: 0 })

  // Stale-data disclaimer (Rule 7)
  const [showDisclaimer, setShowDisclaimer] = useState(
    () => sessionStorage.getItem('subhub_disclaimer_dismissed') !== '1'
  )
  function dismissDisclaimer() {
    sessionStorage.setItem('subhub_disclaimer_dismissed', '1')
    setShowDisclaimer(false)
  }

  // ── Load squad ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTeam) return
    setLoading(true)
    setError(null)
    fetchSquad(selectedTeam.id, selectedTeam.leagueCode)
      .then(data => {
        const { xi, bench, reserves } = data

        // Prioritise the lineup confirmed on the Squad page over the API default split
        const confirmedXI       = location.state?.confirmedXI
        const confirmedBench    = location.state?.confirmedBench
        const confirmedReserves = location.state?.confirmedReserves

        if (confirmedXI && confirmedXI.length === 11) {
          const incomingFormation = location.state?.formation || '4-3-3'
          const slotOrder = FORMATION_SLOT_ORDER[incomingFormation] || FORMATION_SLOT_ORDER['4-3-3']
          const sorted = sortXIByFormation(confirmedXI, slotOrder)
          const xiWithEntry = sorted.map(p => ({
            ...p,
            minute_entered: 0,
            outOfPosition: getPositionCompatibility(p.api_position || p.position, p.assigned_slot || p.position),
          }))
          setPitchPlayers(xiWithEntry)
          setOriginalPitch(xiWithEntry)
          setBenchPlayers(confirmedBench ?? bench)
          setOriginalBench(confirmedBench ?? bench)
          setReservePlayers(confirmedReserves ?? reserves ?? [])
        } else {
          const xiWithEntry = xi.map(p => ({
            ...p,
            minute_entered: 0,
            outOfPosition: getPositionCompatibility(p.api_position || p.position, p.assigned_slot || p.position),
          }))
          setPitchPlayers(xiWithEntry)
          setOriginalPitch(xiWithEntry)
          setBenchPlayers(bench)
          setOriginalBench(bench)
          setReservePlayers(reserves ?? [])
        }

        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [selectedTeam?.id])

  // ── Apply incoming route state (formation / playstyle / competition) ──
  useEffect(() => {
    const s = location.state
    if (!s) return
    if (s.playstyle)   setPlaystyle(s.playstyle)
    if (s.competition) setCompetition(s.competition)
    if (s.formation)   setFormation(s.formation)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch playstyle catalogue once on mount ───────────────────────────
  useEffect(() => {
    fetch('/api/playstyles').then(r => r.json()).then(setPlaystyles).catch(() => {})
  }, [])

  // ── Live compatibility check on playstyle or formation change ─────────
  useEffect(() => {
    fetch(`/api/compatibility?playstyle=${playstyle}&formation=${formation}`)
      .then(r => r.json())
      .then(data => {
        setCompatibility(data)
        setConflictData(data.is_conflict ? data : null)
      })
      .catch(() => {})
  }, [playstyle, formation])

  // ── Live stamina — wired to minute slider ────────────────────────────
  // matchMinute drives ET amplification; minuteOnPitch is actual time played
  function calculateStamina(player, minuteOnPitch, matchMinute = minuteOnPitch) {
    const pos = player.assigned_slot || player.api_position || 'CM'
    const DECAY = {
      GK:0.18, CB:0.28, LB:0.33, RB:0.33,
      LWB:0.35, RWB:0.35, CDM:0.38, CM:0.43,
      LM:0.48, RM:0.48, LAM:0.50, CAM:0.50,
      RAM:0.50, LW:0.52, RW:0.52, ST:0.58, CF:0.55
    }
    const base  = DECAY[pos] || 0.43
    const fc26s = player.power_stamina || 65
    const mod   = 1.0 - ((fc26s - 50) / 200)
    const wr    = player.work_rate_att || 'Medium'
    const wmod  = {High:1.12, Medium:1.0, Low:0.85}[wr] || 1.0
    // ET amplification: legs are burning in extra time
    let etMult = 1.0
    if (matchMinute > 90) {
      const etMins = matchMinute - 90
      etMult = etMins <= 15 ? 1.4 : 1.8
    }
    return Math.max(0, Math.round((100 - base * mod * wmod * minuteOnPitch * etMult) * 10) / 10)
  }

  const liveXI = useMemo(() =>
    pitchPlayers.map(p => ({
      ...p,
      stamina_pct: calculateStamina(
        p,
        Math.max(0, minute - (p.minute_entered ?? 0)),
        minute,
      ),
    }))
  , [pitchPlayers, minute])

  const liveBench = useMemo(() =>
    benchPlayers.map(p => ({ ...p, stamina_pct: 100 })),
    [benchPlayers]
  )

  const formationSlots = FORMATIONS[formation]?.positions ?? FORMATIONS['4-3-3'].positions

  // ── Formation change: re-assign slots via engine ─────────────────────
  async function handleFormationChange(newFormation) {
    if (newFormation === formation) return
    setFormation(newFormation)
    if (!pitchPlayers.length) return
    try {
      const res = await fetch('/api/assign-formation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: pitchPlayers, formation: newFormation }),
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.players) && data.players.length === pitchPlayers.length) {
          setPitchPlayers(data.players)
        }
      }
    } catch {
      // Backend unreachable — formation visual still switches, slot data stays as-is
    }
  }

  // ── Flash helpers ─────────────────────────────────────────────────────
  function flashGreen(idx) {
    clearTimeout(flashTimer.current)
    setFlashIdx(idx)
    flashTimer.current = setTimeout(() => setFlashIdx(null), 900)
  }

  function flashInvalid(idx) {
    setInvalidFlashIdx(idx)
    setTimeout(() => setInvalidFlashIdx(null), 600)
  }

  // ── Derived match phase constants ────────────────────────────────────
  const inET    = compFormat.hasET && minute > 90 && minute <= 120
  const pkMode  = compFormat.straightToPKs ? minute > 90 : (compFormat.hasET && minute > 120)
  const maxSubs = inET ? 6 : 5

  // ── Swap helpers ──────────────────────────────────────────────────────
  function doBenchToPitch(benchIdx, pitchIdx, skipSubCount = false) {
    // CRITICAL: pre-kickoff drags never count against the sub allowance.
    // matchStarted=true when arriving from Squad.jsx kick-off (already confirmed).
    // matchStarted=false on direct navigation until user explicitly starts the match.
    const effectiveSkip = skipSubCount || !matchStarted

    if (!effectiveSkip && subsUsed >= maxSubs) {
      showToast(
        inET
          ? '⚠ ET substitution already used'
          : '⚠ Maximum 5 substitutions reached'
      )
      return false
    }
    const np = [...pitchPlayers], nb = [...benchPlayers]
    const bPlayer = { ...nb[benchIdx], minute_entered: minute }  // FIX 1: track when sub came on

    // FIX 4: reserve players cannot be subbed on during a match
    if (reserveIds.has(bPlayer.id)) {
      showToast('⚠ Reserve players cannot be subbed on during a match')
      return false
    }
    const pPlayer = { ...np[pitchIdx] }
    const pitchSlot = pPlayer.assigned_slot || pPlayer.position || 'CM'
    const compat    = getPositionCompatibility(bPlayer.api_position || bPlayer.position, pitchSlot)
    if (compat === 'blocked') {
      showToast('⚠ Invalid position swap')
      return false
    }
    bPlayer.outOfPosition = compat === 'natural' ? false : compat

    np[pitchIdx] = bPlayer
    nb[benchIdx] = pPlayer

    if (!effectiveSkip) {
      // Push undo snapshot before applying
      setSubHistory(prev => [...prev, { pitch: pitchPlayers, bench: benchPlayers, count: subsUsed }])
      setSubsUsed(c => c + 1)
      if (pPlayer?.name) setAppliedSubNames(prev => new Set([...prev, pPlayer.name]))
      // Track ET 6th-sub slot usage
      if (inET && subsUsed === 5 && !etSubUsed) setEtSubUsed(true)
    }
    setPitchPlayers(np)
    setBenchPlayers(nb)
    setManualSwaps(prev => new Set([...prev, pPlayer?.id]))
    flashGreen(pitchIdx)
    return true
  }

  function doPitchToPitch(fromIdx, toIdx) {
    const np      = [...pitchPlayers]
    const playerA = np[fromIdx]
    const playerB = np[toIdx]
    const slotA   = playerA.assigned_slot || playerA.position || 'CM'
    const slotB   = playerB.assigned_slot || playerB.position || 'CM'

    const compatA = getPositionCompatibility(playerA.api_position || playerA.position, slotB)
    const compatB = getPositionCompatibility(playerB.api_position || playerB.position, slotA)

    if (compatA === 'blocked' || compatB === 'blocked') {
      showToast('⚠ Invalid position — goalkeepers and attackers cannot play as defenders')
      return
    }
    if (compatA === 'tactical' || compatB === 'tactical') {
      showToast('⚠ Tactical gamble — unconventional move applied')
    }

    np[fromIdx] = { ...playerB, assigned_slot: slotA, outOfPosition: compatB }
    np[toIdx]   = { ...playerA, assigned_slot: slotB, outOfPosition: compatA }
    setPitchPlayers(np)
    flashGreen(toIdx)
  }

  function doPitchToBench(pitchIdx, benchIdx) {
    const np = [...pitchPlayers], nb = [...benchPlayers]
    const pPlayer = { ...np[pitchIdx] }
    const bPlayer = { ...nb[benchIdx] }
    np[pitchIdx] = bPlayer
    nb[benchIdx] = pPlayer
    setPitchPlayers(np)
    setBenchPlayers(nb)
    setManualSwaps(prev => new Set([...prev, pPlayer?.id]))
    flashGreen(pitchIdx)
  }

  function loadSavedSquad(squad) {
    if (!squad?.xi?.length) return

    const formation = squad.formation || '4-3-3'
    const slotOrder = FORMATION_SLOT_ORDER[formation] || FORMATION_SLOT_ORDER['4-3-3']
    const sorted    = sortXIByFormation(squad.xi, slotOrder)

    // Deduplicate — each player appears exactly once
    const seen    = new Set()
    const deduped = sorted.filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    const remaining = squad.xi.filter(p => !seen.has(p.id))
    const finalXI   = [...deduped, ...remaining].slice(0, 11)

    const xiWithEntry = finalXI.map(p => ({
      ...p,
      minute_entered: 0,
      outOfPosition: getPositionCompatibility(
        p.api_position || p.position,
        p.assigned_slot || p.position
      ),
    }))

    setPitchPlayers(xiWithEntry)
    setOriginalPitch(xiWithEntry)
    setBenchPlayers(squad.bench ?? [])
    setOriginalBench(squad.bench ?? [])
    if (squad.formation)   setFormation(squad.formation)
    if (squad.playstyle)   setPlaystyle(squad.playstyle)
    if (squad.competition) setCompetition(squad.competition)
    setMatchStarted(true)
    setShowSavedSquadsPanel(false)
  }

  function doBenchToBench(fromIdx, toIdx) {
    const nb = [...benchPlayers]
    ;[nb[fromIdx], nb[toIdx]] = [nb[toIdx], nb[fromIdx]]
    setBenchPlayers(nb)
  }

  // ── Reserve ↔ pitch / bench swap helpers ──────────────────────────────

  function doReserveToPitch(reserveIdx, pitchIdx) {
    const reservePlayer = reservePlayers[reserveIdx]
    const pitchPlayer   = pitchPlayers[pitchIdx]
    if (!reservePlayer) return
    const targetSlot = pitchPlayer?.assigned_slot || pitchPlayer?.position || 'CM'
    if (!isCompatibleDrop(reservePlayer.position, targetSlot)) {
      showToast(`⚠ ${reservePlayer.name?.split(' ').pop() ?? 'Player'} can't play ${targetSlot}`)
      flashInvalid(pitchIdx)
      return
    }
    const np = [...pitchPlayers]
    const nr = [...reservePlayers]
    np[pitchIdx] = { ...reservePlayer }
    nr.splice(reserveIdx, 1)
    if (pitchPlayer) nr.push(pitchPlayer)
    setPitchPlayers(np)
    setReservePlayers(nr)
    flashGreen(pitchIdx)
    showToast(`${reservePlayer.name?.split(' ').pop()} moved to pitch`)
  }

  function doReserveToBench(reserveIdx, benchIdx) {
    const reservePlayer = reservePlayers[reserveIdx]
    if (!reservePlayer) return
    const nb = [...benchPlayers]
    const nr = [...reservePlayers]
    const benchPlayer = nb[benchIdx]
    nb[benchIdx] = { ...reservePlayer }
    nr.splice(reserveIdx, 1)
    if (benchPlayer) nr.push(benchPlayer)
    setBenchPlayers(nb)
    setReservePlayers(nr)
    showToast(`${reservePlayer.name?.split(' ').pop()} added to bench`)
  }

  function doPitchToReserve(pitchIdx, reserveIdx) {
    const np = [...pitchPlayers]
    const nr = [...reservePlayers]
    const pitchPlayer   = np[pitchIdx]
    const reservePlayer = nr[reserveIdx]
    np[pitchIdx] = reservePlayer ? { ...reservePlayer } : null
    if (reservePlayer) nr.splice(reserveIdx, 1, pitchPlayer)
    else if (pitchPlayer) nr.push(pitchPlayer)
    setPitchPlayers(np)
    setReservePlayers(nr)
  }

  function doBenchToReserve(benchIdx, reserveIdx) {
    const nb = [...benchPlayers]
    const nr = [...reservePlayers]
    const benchPlayer   = nb[benchIdx]
    const reservePlayer = nr[reserveIdx]
    nb[benchIdx] = reservePlayer ? { ...reservePlayer } : null
    if (reservePlayer) nr.splice(reserveIdx, 1, benchPlayer)
    else if (benchPlayer) nr.push(benchPlayer)
    setBenchPlayers(nb)
    setReservePlayers(nr)
  }

  function doReserveToReserve(fromIdx, toIdx) {
    const nr = [...reservePlayers]
    ;[nr[fromIdx], nr[toIdx]] = [nr[toIdx], nr[fromIdx]]
    setReservePlayers(nr)
  }

  // ── dnd-kit handlers ──────────────────────────────────────────────────
  function handleDragStart({ active }) {
    setActiveDrag(active.data.current)
  }

  function handleDragEnd({ active, over }) {
    setActiveDrag(null)
    if (!over) return
    const { from, fromIndex, player: draggedPlayer } = active.data.current
    const toId = over.id

    if (toId.startsWith('pitch-')) {
      const toIdx = parseInt(toId.slice(6))
      if (from === 'bench') {
        const targetSlot = pitchPlayers[toIdx]?.assigned_slot || pitchPlayers[toIdx]?.position || 'CM'
        if (!isCompatibleDrop(draggedPlayer?.position, targetSlot)) {
          showToast(`⚠ ${draggedPlayer?.name?.split(' ').pop() ?? 'Player'} can't play ${targetSlot}`)
          flashInvalid(toIdx)
          return
        }
        doBenchToPitch(fromIndex, toIdx)
      } else if (from === 'pitch' && fromIndex !== toIdx) {
        doPitchToPitch(fromIndex, toIdx)
      } else if (from === 'reserve') {
        doReserveToPitch(fromIndex, toIdx)
      }
    } else if (toId.startsWith('bench-')) {
      const toIdx = parseInt(toId.slice(6))
      if (from === 'pitch') doPitchToBench(fromIndex, toIdx)
      else if (from === 'bench' && fromIndex !== toIdx) doBenchToBench(fromIndex, toIdx)
      else if (from === 'reserve') doReserveToBench(fromIndex, toIdx)
    } else if (toId.startsWith('reserve-')) {
      const toIdx = parseInt(toId.slice(8))
      if (from === 'pitch') doPitchToReserve(fromIndex, toIdx)
      else if (from === 'bench') doBenchToReserve(fromIndex, toIdx)
      else if (from === 'reserve' && fromIndex !== toIdx) doReserveToReserve(fromIndex, toIdx)
    }
  }

  // ── Apply recommendation ──────────────────────────────────────────────
  function applyRec(rec) {
    const offName = rec.sub_off?.name ?? rec.subOff?.name
    const onName  = rec.sub_on?.name  ?? rec.subOn?.name
    const offId   = rec._subOffId ?? rec.sub_off?.id ?? rec.subOff?.id
    const onId    = rec._subOnId  ?? rec.sub_on?.id  ?? rec.subOn?.id

    const pitchIdx = offId != null
      ? pitchPlayers.findIndex(p => p.id === offId)
      : pitchPlayers.findIndex(p => p.name === offName)
    const benchIdx = onId != null
      ? benchPlayers.findIndex(p => p.id === onId)
      : benchPlayers.findIndex(p => p.name === onName)

    if (pitchIdx === -1 || benchIdx === -1) return
    const applied = doBenchToPitch(benchIdx, pitchIdx)
    if (!applied) return

    // Track that this player has been subbed off so re-analyse excludes them
    if (offName) setAppliedSubNames(prev => new Set([...prev, offName]))

    // Toast notification
    showToast(`${onName ?? 'Player'} replaces ${offName ?? 'Player'}`)

    setHighOff(null)
    setHighOn(null)
    setSubArrow(null)

    // Remove this rec card, keep panel open, auto-reanalyse with new XI
    setRecs(prev => prev.filter(r => r !== rec))
    setShouldReanalyse(true)
  }

  // ── Apply positional swap (no sub counter) ────────────────────────────
  function applySwap(rec) {
    const { player_a, player_b } = rec
    // Support both new (swap_to) and legacy (new_slot) field names
    const aNewSlot = player_a.swap_to || player_a.new_slot
    const bNewSlot = player_b.swap_to || player_b.new_slot
    setPitchPlayers(prev => prev.map(p => {
      if (p.name === player_a.name) return { ...p, assigned_slot: aNewSlot }
      if (p.name === player_b.name) return { ...p, assigned_slot: bNewSlot }
      return p
    }))
    const aLast = player_a.name.split(' ').pop()
    const bLast = player_b.name.split(' ').pop()
    showToast(`${aLast} ↔ ${bLast} swapped positions`)
    setRecs(prev => prev.filter(r => r !== rec))
  }

  // ── Reserve → matchday bench ──────────────────────────────────────────
  function addReserveToBench(reserve) {
    if (!reserve) return
    // Bump the lowest-rated bench player back to reserves
    const lowestIdx = benchPlayers.reduce(
      (minI, p, i, arr) => (p?.overall ?? 0) < (arr[minI]?.overall ?? 0) ? i : minI,
      0
    )
    const nb = [...benchPlayers]
    const nr = [...reservePlayers]
    const bumped = nb[lowestIdx]
    nb[lowestIdx] = { ...reserve }
    const reserveIdx = nr.findIndex(r => r.id === reserve.id)
    if (reserveIdx !== -1) {
      nr.splice(reserveIdx, 1)
      if (bumped) nr.push(bumped)
    }
    setBenchPlayers(nb)
    setReservePlayers(nr)
    showToast(`${reserve.name} added to matchday bench`)
  }

  const enrichedReserves = useMemo(() =>
    reservePlayers.map(p => ({ ...p, stamina_pct: 100 })),
    [reservePlayers]
  )

  // ── Undo last sub ─────────────────────────────────────────────────────
  function undoLastSub() {
    setSubHistory(prev => {
      if (!prev.length) return prev
      const snapshot = prev[prev.length - 1]
      setPitchPlayers(snapshot.pitch)
      setBenchPlayers(snapshot.bench)
      setSubsUsed(snapshot.count)
      setRecs([])
      setHighOff(null); setHighOn(null); setSubArrow(null)
      showToast('Sub undone')
      return prev.slice(0, -1)
    })
  }

  // ── Reset lineup ──────────────────────────────────────────────────────
  function resetLineup() {
    setPitchPlayers(originalPitch)
    setBenchPlayers(originalBench)
    setManualSwaps(new Set())
    setSubsUsed(0); setSubHistory([])
    setAppliedSubNames(new Set())
    setUrgencyMode(null)
    setGroupedWindow(null)
    setHighOff(null); setHighOn(null)
    setSubArrow(null); setShowPanel(false)
    setFlashIdx(null); setRecs([])
  }

  // ── Toast helper ──────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Analyse subs ──────────────────────────────────────────────────────
  const handleAnalyse = useCallback(async () => {
    setRecLoading(true)
    setHighOff(null); setHighOn(null); setSubArrow(null)

    const homeScoreVal = isHome ? ourScore : opponentScore
    const awayScoreVal = isHome ? opponentScore : ourScore

    let results = []
    let fullResponse = null
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // New canonical keys
          on_pitch:           liveXI,
          bench_available:    liveBench,
          subbed_off:         [...appliedSubNames],
          current_minute:     minute,
          current_score_home: homeScoreVal,
          current_score_away: awayScoreVal,
          is_home:            isHome,
          subs_remaining:     maxSubs - subsUsed,
          formation,
          playstyle,
          competition:        competition || selectedTeam?.leagueCode || 'PL',
          pk_mode:            pkMode,
          straight_to_pks:    compFormat.straightToPKs,
        }),
      })
      const data = await res.json()
      if (data.recommendations) {
        results      = data.recommendations  // already contains subs + swaps + hold
        fullResponse = data
        setUrgencyMode(data.urgency_mode ?? null)
        setGroupedWindow(data.grouped_window ?? null)
      } else if (Array.isArray(data)) {
        results = data
      }
    } catch {
      results = computeClientRecs(liveXI, liveBench, intent, manualSwaps)
    }

    setRecs(results)
    setConflictData(fullResponse?.conflict_warning ?? null)

    if (results.length) {
      const top     = results[0]
      const offName = top.sub_off?.name ?? top.subOff?.name
      const onName  = top.sub_on?.name  ?? top.subOn?.name
      const offId   = top._subOffId ?? top.sub_off?.id ?? top.subOff?.id
      const onId    = top._subOnId  ?? top.sub_on?.id  ?? top.subOn?.id

      const offPlayer = offId != null
        ? pitchPlayers.find(p => p.id === offId)
        : pitchPlayers.find(p => p.name === offName)
      const onPlayer = onId != null
        ? benchPlayers.find(p => p.id === onId)
        : benchPlayers.find(p => p.name === onName)

      setHighOff(offPlayer?.id ?? null)
      setHighOn(onPlayer?.id ?? null)

      const pitchIdx = pitchPlayers.findIndex(p => p.id === offPlayer?.id)
      if (pitchIdx !== -1 && formationSlots[pitchIdx]) {
        const slot = formationSlots[pitchIdx]
        setSubArrow({ fromLeft: 50, fromTop: 98, toLeft: slot.left, toTop: slot.top })
      }
    }

    setRecLoading(false)
    setShowPanel(true)
  }, [liveXI, liveBench, minute, ourScore, opponentScore, isHome, injuredPlayers, intent, playstyle, formation, manualSwaps, pitchPlayers, formationSlots, appliedSubNames, subsUsed, competition, compFormat, maxSubs, pkMode])

  // ── Keep handleAnalyse ref fresh (must be after the useCallback above) ──
  useEffect(() => { handleAnalyseRef.current = handleAnalyse }, [handleAnalyse])

  // ── Auto-reanalyse after apply sub ───────────────────────────────────
  useEffect(() => {
    if (shouldReanalyse && !recLoading) {
      setShouldReanalyse(false)
      handleAnalyseRef.current?.()
    }
  }, [shouldReanalyse, recLoading])

  // ── No team selected ──────────────────────────────────────────────────
  if (!selectedTeam) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', gap: 16 }}>
        <div style={{ fontSize: 40 }}>⚽</div>
        <h2 style={{ fontFamily: 'Rajdhani', fontSize: 28, color: 'var(--text)', margin: 0 }}>No team selected</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Pick a team first to load their squad.</p>
        <Link to="/" style={{
          background: 'var(--green)', color: '#000', padding: '10px 24px',
          borderRadius: 6, textDecoration: 'none',
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, letterSpacing: '0.08em',
        }}>
          ← Select a Team
        </Link>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="match-console" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

        {/* Controls bar */}
        <div className="console-topbar" style={{
          padding: '8px 14px', display: 'flex', flexWrap: 'wrap',
          gap: 10, alignItems: 'center',
          borderRadius: 0, zIndex: 30, flexShrink: 0,
        }}>
          {/* Team name */}
          <Link to={`/league/${selectedTeam.leagueCode}`} style={{
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15,
            color: 'var(--green)', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            {selectedTeam.shortName ?? selectedTeam.name}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>

          {/* Competition selector */}
          <div className="comp-selector-wrap" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <button
              onClick={() => setShowCompSelector(p => !p)}
              style={{
                background: 'transparent',
                border: '1px solid var(--comp-primary, #c8963e)',
                borderRadius: 4,
                color: 'var(--comp-primary, #c8963e)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 8px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {competition || 'SET COMPETITION'}
            </button>

            {showCompSelector && (
              <div style={{
                position: 'absolute',
                top: 28,
                left: 0,
                zIndex: 100,
                background: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: 6,
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 200,
                maxHeight: 320,
                overflowY: 'auto',
              }}>
                {(() => {
                  const uefaStatus   = UEFA_ELIGIBILITY[selectedTeam?.id]
                  const uefaComps    = uefaStatus === 'UCL'  ? ['UCL', 'UEFA Super Cup']
                                     : uefaStatus === 'UEL'  ? ['UEL', 'UEFA Super Cup']
                                     : uefaStatus === 'UECL' ? ['UECL']
                                     : []
                  const domestic     = LEAGUE_COMPETITIONS[selectedTeam?.leagueCode]
                                     ?? Object.values(LEAGUE_COMPETITIONS).flat()
                  return [...uefaComps, ...domestic, 'Friendly']
                })().map(comp => (
                  <button
                    key={comp}
                    onClick={() => { setCompetition(comp); setShowCompSelector(false) }}
                    style={{
                      background: competition === comp ? 'var(--comp-primary, #c8963e)' : 'transparent',
                      border: 'none',
                      borderRadius: 3,
                      color: competition === comp ? '#000' : '#ccc',
                      fontSize: '11px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: competition === comp ? 700 : 400,
                    }}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scoreline — OUR TEAM vs OPPONENT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Our side */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <ScoreInput value={ourScore} onChange={setOurScore} />
              <button
                onClick={() => setIsHome(h => !h)}
                title="Toggle home/away"
                style={{
                  background: isHome ? 'rgba(0,255,135,0.15)' : 'rgba(255,184,0,0.12)',
                  border: isHome ? '1px solid rgba(0,255,135,0.45)' : '1px solid rgba(255,184,0,0.45)',
                  borderRadius: 3, color: isHome ? 'var(--green)' : 'var(--amber)',
                  fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 700,
                  padding: '1px 5px', cursor: 'pointer', letterSpacing: '0.08em',
                }}
              >{isHome ? 'HOME' : 'AWAY'}</button>
            </div>
            <span style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: 14 }}>–</span>
            {/* Opponent side */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <ScoreInput value={opponentScore} onChange={setOpponentScore} />
              <input
                value={opponentName}
                onChange={e => setOpponentName(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--muted)', fontSize: 8, fontFamily: 'Rajdhani', fontWeight: 600,
                  width: 58, textAlign: 'center', outline: 'none', letterSpacing: '0.06em',
                  padding: '1px 2px',
                }}
              />
            </div>
          </div>

          {/* Minute */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Rajdhani', fontWeight: 600, minWidth: 34 }}>
                {getMinuteDisplay(minute)}
              </span>
              {(inET || pkMode) && (() => {
                const ph = getMatchPhase(minute, compFormat.hasET)
                return (
                  <span style={{ fontSize: 7, fontFamily: 'Rajdhani', fontWeight: 800, letterSpacing: '0.08em', color: ph.color }}>
                    {ph.label}
                  </span>
                )
              })()}
            </div>
            <input type="range" min={1} max={sliderMax} value={minute}
              onChange={e => { setMinute(Number(e.target.value)); if (!matchStarted) setMatchStarted(true) }}
              style={{ width: 90, accentColor: inET ? 'var(--amber)' : pkMode ? '#ff3d3d' : 'var(--green)', cursor: 'pointer' }} />
          </div>

          {/* Intent */}
          <div style={{ display: 'flex', gap: 3 }}>
            {INTENTS.map(i => (
              <button
                key={i.value}
                onClick={() => setIntent(i.value)}
                className={`toggle-pill${intent === i.value ? ' active' : ''}`}
              >{i.label}</button>
            ))}
          </div>

          {/* Playstyle selector */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {Object.entries(playstyles).map(([key, ps]) => (
              <button
                key={key}
                onClick={() => setPlaystyle(key)}
                title={ps.description}
                className={`toggle-pill${playstyle === key ? ' active' : ''}`}
              >
                {ps.icon} {ps.label}
              </button>
            ))}
          </div>

          {/* Formation toggle + preview */}
          <div style={{ display: 'flex', gap: 3 }}>
            {FORMATION_KEYS.map(f => (
              <button
                key={f}
                onClick={() => handleFormationChange(f)}
                className={`toggle-pill${formation === f ? ' active' : ''}`}
                onMouseEnter={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setPreviewFormation(f)
                  setPreviewPos({ x: rect.left, y: rect.bottom + 8 })
                }}
                onMouseLeave={() => setPreviewFormation(null)}
              >{f}</button>
            ))}
          </div>

          {/* Compatibility indicator */}
          {compatibility && (
            <CompatBadge compat={compatibility} />
          )}

          {/* Reset */}
          {manualSwaps.size > 0 && (
            <button onClick={resetLineup} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 5, color: 'var(--muted)', fontSize: 10,
              fontFamily: 'Rajdhani', fontWeight: 600,
              padding: '4px 10px', cursor: 'pointer',
            }}>↺ Reset</button>
          )}

          {/* Sub counter + undo */}
          {!pkMode && (
            <div className="sub-counter-wrap">
              <span className={`sub-counter${subsUsed >= maxSubs ? ' maxed' : subsUsed >= 3 ? ' warning' : ''}`}>
                <span className="sub-counter-num">{subsUsed}</span>
                <span className="sub-counter-sep">/</span>
                <span className="sub-counter-max">{maxSubs}</span>
                <span className="sub-counter-label">{inET ? 'SUBS (ET)' : 'SUBS'}</span>
              </span>
              {subHistory.length > 0 && (
                <button className="undo-btn" onClick={undoLastSub} title="Undo last substitution">
                  ↩ UNDO
                </button>
              )}
            </div>
          )}

          {/* START MATCH — only shown when arriving without Squad.jsx kick-off state */}
          {!matchStarted && (
            <button
              onClick={() => setMatchStarted(true)}
              style={{
                background: 'rgba(0,255,135,0.12)',
                border: '1px solid rgba(0,255,135,0.4)',
                borderRadius: 5, color: 'var(--green)',
                fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700,
                padding: '4px 12px', cursor: 'pointer',
                letterSpacing: '0.08em', whiteSpace: 'nowrap',
              }}
              title="Lock lineup and start counting substitutions"
            >
              ⚽ START MATCH
            </button>
          )}

          {/* Analyse */}
          <button
            onClick={handleAnalyse}
            disabled={recLoading || loading}
            className={`analyse-btn${recLoading || loading ? ' loading' : ''}${pkMode ? ' pk-mode' : ''}`}
          >
            {recLoading ? 'Analysing…' : pkMode ? '⚡ PK SUBS' : '⚡ Analyse Subs'}
          </button>
        </div>

        {/* Saved squads panel — shown when arriving without a confirmed XI */}
        {showSavedSquadsPanel && savedSquads.length > 0 && (
          <div style={{
            flexShrink: 0, padding: '8px 14px',
            borderBottom: '1px solid rgba(200,150,60,0.18)',
            background: 'rgba(10,14,8,0.95)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 11, color: '#c8963e', letterSpacing: '0.12em' }}>
                SAVED SQUADS
              </span>
              <button
                onClick={() => setShowSavedSquadsPanel(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--muted)',
                  fontSize: 11, fontFamily: 'Rajdhani', cursor: 'pointer', padding: '0 4px',
                }}
              >✕ dismiss</button>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {savedSquads.map(squad => (
                <div
                  key={squad.id}
                  onClick={() => loadSavedSquad(squad)}
                  style={{
                    flexShrink: 0, border: '1px solid rgba(200,150,60,0.4)',
                    borderRadius: 7, padding: '7px 12px', cursor: 'pointer',
                    background: 'rgba(200,150,60,0.06)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,150,60,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,150,60,0.06)'}
                >
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 12, color: '#c8963e' }}>
                    {squad.name}
                  </div>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: 10, color: 'var(--muted)' }}>
                    {squad.teamName} · {squad.formation}
                  </div>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {squad.competition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game status bar */}
        <div className="game-status-bar">
          <span className="game-status-text">
            {getGameStatusText(ourScore, opponentScore, minute)}
          </span>
          <span className="game-status-minute">
            {getMinuteDisplay(minute)}
          </span>
        </div>

        {/* Conflict warning banner — live, below controls */}
        {compatibility?.is_conflict && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,80,80,0.3)',
            borderRadius: 0, padding: '6px 14px', flexShrink: 0, gap: 8,
            zIndex: 29,
          }}>
            <div style={{ fontSize: 10, color: '#ff6464', fontFamily: 'Rajdhani', fontWeight: 600, lineHeight: 1.5 }}>
              ❌ {playstyles[playstyle]?.label ?? playstyle} + {formation} — {compatibility.reason}
              {' '}
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                Recommended: switch to {compatibility.recommended_formation}
                {' '}· Win modifier: {Math.round((compatibility.win_probability_modifier - 1) * 100)}% active
              </span>
            </div>
          </div>
        )}

        {/* PK banner */}
        {pkMode && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, flexShrink: 0, padding: '6px 14px',
            background: 'rgba(255,20,20,0.12)', borderBottom: '1px solid rgba(255,50,50,0.45)',
            zIndex: 28,
          }}>
            <span style={{
              fontFamily: 'Rajdhani', fontWeight: 900, fontSize: 13,
              letterSpacing: '0.18em', color: '#ff3d3d',
            }}>
              ⚡ PENALTY SHOOTOUT — Analyse PK subs
            </span>
          </div>
        )}

        {/* ET indicator banner */}
        {inET && !pkMode && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, flexShrink: 0, padding: '4px 14px',
            background: 'rgba(255,184,0,0.08)', borderBottom: '1px solid rgba(255,184,0,0.25)',
            zIndex: 28,
          }}>
            <span style={{
              fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 11,
              letterSpacing: '0.12em', color: 'var(--amber)',
            }}>
              {getMatchPhase(minute, compFormat.hasET).label} — 1 additional substitution available
            </span>
          </div>
        )}

        {/* Loading / error */}
        {loading && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading squad…</div>
        )}
        {error && (
          <div style={{ color: 'var(--amber)', background: 'rgba(255,184,0,0.06)', padding: '10px 16px', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Main area */}
        {!loading && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
            {/* Pitch + bench */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              padding: '10px 14px', gap: 8, overflow: 'hidden',
              transition: 'margin-right 0.32s ease',
              marginRight: showPanel ? 304 : 0,
            }}>
              {/* Stale data disclaimer (Rule 7) */}
              {showDisclaimer && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)',
                  borderRadius: 6, padding: '5px 10px', flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 10, color: '#ffb800', fontFamily: 'Rajdhani', fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}>
                    ⚠ Squad data from football-data.org. Transfers after July 2025 may not be reflected.
                  </span>
                  <button onClick={dismissDisclaimer} style={{
                    background: 'none', border: 'none', color: '#ffb800',
                    cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 0 0 8px',
                    opacity: 0.7,
                  }}>✕</button>
                </div>
              )}

              <Pitch
                pitchPlayers={liveXI}
                formation={formationSlots}
                highlightOffId={highlightOff}
                swapFlashIdx={swapFlashIdx}
                invalidFlashIdx={invalidFlashIdx}
                onPlayerClick={p => setHighOff(prev => prev === p.id ? null : p.id)}
                subArrow={showPanel ? subArrow : null}
              />
              {/* Matchday bench — collapsible on hover */}
              <BenchRow
                bench={liveBench}
                label="MATCHDAY BENCH"
                labelColour="var(--card-gold-top)"
                highlightId={highlightOn}
                onSelect={p => setHighOn(prev => prev === p.id ? null : p.id)}
                subbedOffNames={appliedSubNames}
                collapsible
              />
              {/* Squad / reserves — collapsible, hover "+" to promote.
                  FIX 4: when reserves came from Squad.jsx kick-off, dim the row
                  (they cannot be subbed on — only promoted to matchday bench). */}
              {enrichedReserves.length > 0 && (
                <BenchRow
                  bench={enrichedReserves}
                  label="SQUAD"
                  labelColour="var(--muted)"
                  onAdd={reserveIds.size > 0 ? undefined : addReserveToBench}
                  opacity={reserveIds.size > 0 ? 0.5 : 1}
                  collapsible
                />
              )}
            </div>

            {/* Recommendation panel */}
            {showPanel && (
              <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 304, zIndex: 20 }}>
                <RecommendPanel
                  recs={recs}
                  urgencyMode={urgencyMode}
                  groupedWindow={groupedWindow}
                  conflictWarning={conflictData}
                  onClose={() => { setShowPanel(false); setHighOff(null); setHighOn(null); setSubArrow(null) }}
                  onApply={applyRec}
                  onApplySwap={applySwap}
                  onHoverRec={rec => {
                    if (!rec) {
                      // Restore to top rec highlights
                      if (recs.length) {
                        const top = recs[0]
                        const offName = top.sub_off?.name ?? top.subOff?.name
                        const onName  = top.sub_on?.name  ?? top.subOn?.name
                        const offP = pitchPlayers.find(p => p.name === offName || p.id === top._subOffId)
                        const onP  = benchPlayers.find(p => p.name === onName  || p.id === top._subOnId)
                        setHighOff(offP?.id ?? null)
                        setHighOn(onP?.id ?? null)
                      }
                      return
                    }
                    const offName = rec.sub_off?.name ?? rec.subOff?.name
                    const onName  = rec.sub_on?.name  ?? rec.subOn?.name
                    const offP = pitchPlayers.find(p => p.name === offName || p.id === rec._subOffId)
                    const onP  = benchPlayers.find(p => p.name === onName  || p.id === rec._subOnId)
                    setHighOff(offP?.id ?? null)
                    setHighOn(onP?.id ?? null)
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formation preview overlay */}
      {previewFormation && (
        <FormationPreviewOverlay
          formation={previewFormation}
          currentFormation={formation}
          pos={previewPos}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: toast.startsWith('⚠')
            ? 'rgba(255,61,61,0.12)' : 'rgba(0,255,135,0.14)',
          border: toast.startsWith('⚠')
            ? '1px solid rgba(255,61,61,0.45)' : '1px solid rgba(0,255,135,0.45)',
          borderRadius: 8, padding: '8px 22px', zIndex: 9999,
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
          color: toast.startsWith('⚠') ? 'var(--red)' : 'var(--green)',
          letterSpacing: '0.07em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          {toast.startsWith('⚠') ? toast : `✓ ${toast}`}
        </div>
      )}

      {/* DragOverlay — floating card while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeDrag?.player ? (
          <PlayerCard
            player={{ ...activeDrag.player, stamina_pct: activeDrag.player.stamina_pct ?? 80 }}
            size={activeDrag.size ?? 'normal'}
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)', transform: 'rotate(2deg)' }}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function ScoreInput({ value, onChange }) {
  return (
    <input type="number" min={0} max={20} value={value}
      onChange={e => onChange(Math.max(0, Number(e.target.value)))}
      style={{
        width: 34, background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
        color: 'var(--text)', fontSize: 15, fontWeight: 700,
        fontFamily: 'Rajdhani', textAlign: 'center', padding: '2px',
        outline: 'none',
      }}
    />
  )
}

function FormationPreviewOverlay({ formation, currentFormation, pos }) {
  const positions        = FORMATIONS[formation]?.positions        ?? []
  const currentPositions = FORMATIONS[currentFormation]?.positions ?? []
  const isSame = formation === currentFormation

  return (
    <div
      className="formation-preview"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="preview-pitch">
        {/* Current formation dots (white, only when different) */}
        {!isSame && currentPositions.map((p, i) => (
          <div
            key={`cur-${i}`}
            className="preview-dot-current"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
          />
        ))}
        {/* Preview formation dots (gold) */}
        {positions.map((p, i) => (
          <div
            key={`new-${i}`}
            className="preview-dot-new"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
          />
        ))}
      </div>
      <div className="preview-label">{formation}</div>
    </div>
  )
}

function CompatBadge({ compat }) {
  const { score, verdict, reason } = compat
  let bg, border, color, prefix
  if (score >= 85)      { bg = 'rgba(0,255,135,0.10)'; border = 'rgba(0,255,135,0.4)';  color = 'var(--green)'; prefix = '✅' }
  else if (score >= 70) { bg = 'rgba(0,255,135,0.07)'; border = 'rgba(0,255,135,0.3)';  color = 'var(--green)'; prefix = '✅' }
  else if (score >= 55) { bg = 'rgba(255,184,0,0.08)'; border = 'rgba(255,184,0,0.35)'; color = 'var(--amber)'; prefix = '⚠' }
  else if (score >= 40) { bg = 'rgba(255,184,0,0.08)'; border = 'rgba(255,184,0,0.35)'; color = 'var(--amber)'; prefix = '⚠' }
  else                  { bg = 'rgba(255,60,60,0.08)';  border = 'rgba(255,60,60,0.4)';  color = '#ff6464';      prefix = '❌' }

  return (
    <span
      title={reason}
      style={{
        fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700,
        padding: '3px 7px', borderRadius: 4,
        background: bg, border: `1px solid ${border}`, color,
        letterSpacing: '0.06em', whiteSpace: 'nowrap', cursor: 'help',
      }}
    >
      {prefix} {verdict} {score}/100
    </span>
  )
}
