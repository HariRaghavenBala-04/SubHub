/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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

const INTENTS = [
  { value: 'protect_lead', label: '🛡 Protect Lead' },
  { value: 'chase_game',   label: '⚔ Chase Game'   },
  { value: 'tactical',     label: '🔄 Tactical'     },
]

export default function Match() {
  const { selectedTeam, fetchSquad } = useTeam()
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

  // Drag state
  const [activeDrag,      setActiveDrag]      = useState(null)
  const [swapFlashIdx,    setFlashIdx]         = useState(null)
  const [invalidFlashIdx, setInvalidFlashIdx]  = useState(null)
  const [manualSwaps,     setManualSwaps]      = useState(new Set())
  const flashTimer       = useRef(null)
  const handleAnalyseRef = useRef(null)

  // Sub counter + undo
  const [subsUsed,    setSubsUsed]    = useState(0)
  const [subHistory,  setSubHistory]  = useState([]) // stack of { pitch, bench, subsUsed }

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
        setPitchPlayers(xi)
        setBenchPlayers(bench)
        setReservePlayers(reserves ?? [])
        setOriginalPitch(xi)
        setOriginalBench(bench)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [selectedTeam?.id])

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
  const liveXI = useMemo(() =>
    pitchPlayers.map(p => ({
      ...p,
      stamina_pct: computeStamina(
        p.assigned_slot ?? p.position,
        p.minutes_played ?? minute,
        p.power_stamina ?? null,
      ),
    })),
    [pitchPlayers, minute]
  )

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

  // ── Swap helpers ──────────────────────────────────────────────────────
  function doBenchToPitch(benchIdx, pitchIdx, skipSubCount = false) {
    if (!skipSubCount && subsUsed >= 5) {
      showToast('⚠ Maximum 5 substitutions reached')
      return false
    }
    const np = [...pitchPlayers], nb = [...benchPlayers]
    const bPlayer = { ...nb[benchIdx] }
    const pPlayer = { ...np[pitchIdx] }
    np[pitchIdx] = bPlayer
    nb[benchIdx] = pPlayer

    if (!skipSubCount) {
      // Push undo snapshot before applying
      setSubHistory(prev => [...prev, { pitch: pitchPlayers, bench: benchPlayers, count: subsUsed }])
      setSubsUsed(c => c + 1)
    }
    setPitchPlayers(np)
    setBenchPlayers(nb)
    setManualSwaps(prev => new Set([...prev, pPlayer?.id]))
    flashGreen(pitchIdx)
    return true
  }

  function doPitchToPitch(fromIdx, toIdx) {
    const np = [...pitchPlayers]
    ;[np[fromIdx], np[toIdx]] = [np[toIdx], np[fromIdx]]
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

    // Toast notification
    showToast(`${onName ?? 'Player'} replaces ${offName ?? 'Player'}`)

    setHighOff(null)
    setHighOn(null)
    setSubArrow(null)

    // Remove this rec card, keep panel open, auto-reanalyse with new XI
    setRecs(prev => prev.filter(r => r !== rec))
    setShouldReanalyse(true)
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

    const xiPayload = liveXI.map(p => ({
      ...p, minutes_played: p.minutes_played || minute,
    }))

    const homeScoreVal = isHome ? ourScore : opponentScore
    const awayScoreVal = isHome ? opponentScore : ourScore

    console.log('[SubHub] Analyse payload:', {
      xi:     xiPayload.map(p => ({ name: p.name, pos: p.assigned_slot ?? p.position, stamina: p.stamina_pct })),
      bench:  liveBench.map(p => ({ name: p.name, pos: p.position })),
      minute, score: `${homeScoreVal}-${awayScoreVal}`, intent, formation,
    })

    let results = []
    let fullResponse = null
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starting_xi:     xiPayload,
          bench:           liveBench,
          home_score:      homeScoreVal,
          away_score:      awayScoreVal,
          is_home:         isHome,
          minute,
          manager_intent:  intent,
          playstyle,
          formation,
          injured_players: injuredPlayers,
        }),
      })
      const data = await res.json()
      if (data.recommendations) {
        results      = data.recommendations
        fullResponse = data
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
  }, [liveXI, liveBench, minute, ourScore, opponentScore, isHome, injuredPlayers, intent, playstyle, formation, manualSwaps, pitchPlayers, formationSlots])

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
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Rajdhani', fontWeight: 600, minWidth: 34 }}>
              {minute >= 90 ? `90+${minute - 90}'` : `${minute}'`}
            </span>
            <input type="range" min={1} max={100} value={minute}
              onChange={e => setMinute(Number(e.target.value))}
              style={{ width: 90, accentColor: 'var(--green)', cursor: 'pointer' }} />
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
          <div className="sub-counter-wrap">
            <span className={`sub-counter${subsUsed >= 5 ? ' maxed' : subsUsed >= 3 ? ' warning' : ''}`}>
              <span className="sub-counter-num">{subsUsed}</span>
              <span className="sub-counter-sep">/</span>
              <span className="sub-counter-max">5</span>
              <span className="sub-counter-label">SUBS</span>
            </span>
            {subHistory.length > 0 && (
              <button className="undo-btn" onClick={undoLastSub} title="Undo last substitution">
                ↩ UNDO
              </button>
            )}
          </div>

          {/* Analyse */}
          <button
            onClick={handleAnalyse}
            disabled={recLoading || loading}
            className={`analyse-btn${recLoading || loading ? ' loading' : ''}`}
          >
            {recLoading ? 'Analysing…' : '⚡ Analyse Subs'}
          </button>
        </div>

        {/* Game status bar */}
        <div className="game-status-bar">
          <span className="game-status-text">
            {getGameStatusText(ourScore, opponentScore, minute)}
          </span>
          <span className="game-status-minute">
            {minute >= 90 ? `90+${minute - 90}'` : `${minute}'`}
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
                collapsible
              />
              {/* Squad / reserves — collapsible, hover "+" to promote */}
              {enrichedReserves.length > 0 && (
                <BenchRow
                  bench={enrichedReserves}
                  label="SQUAD"
                  labelColour="var(--muted)"
                  onAdd={addReserveToBench}
                  collapsible
                />
              )}
            </div>

            {/* Recommendation panel */}
            {showPanel && (
              <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 304, zIndex: 20 }}>
                <RecommendPanel
                  recs={recs}
                  conflictWarning={conflictData}
                  onClose={() => { setShowPanel(false); setHighOff(null); setHighOn(null); setSubArrow(null) }}
                  onApply={applyRec}
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
