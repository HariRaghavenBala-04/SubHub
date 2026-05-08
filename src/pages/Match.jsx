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
import { computeStamina, computeClientRecs } from '../utils/football'

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
  const [pitchPlayers, setPitchPlayers]   = useState([])
  const [benchPlayers, setBenchPlayers]   = useState([])
  const [originalPitch, setOriginalPitch] = useState([])
  const [originalBench, setOriginalBench] = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)

  // Match controls
  const [formation,  setFormation]  = useState('4-3-3')
  const [minute,     setMinute]     = useState(60)
  const [homeScore,  setHomeScore]  = useState(0)
  const [awayScore,  setAwayScore]  = useState(0)
  const [intent,     setIntent]     = useState('tactical')

  // Recommendation state
  const [recs,        setRecs]        = useState([])
  const [recLoading,  setRecLoading]  = useState(false)
  const [showPanel,   setShowPanel]   = useState(false)
  const [highlightOff, setHighOff]    = useState(null)
  const [highlightOn,  setHighOn]     = useState(null)
  const [subArrow,    setSubArrow]    = useState(null)

  // Drag state
  const [activeDrag,  setActiveDrag]  = useState(null)
  const [swapFlashIdx, setFlashIdx]   = useState(null)
  const [manualSwaps, setManualSwaps] = useState(new Set())
  const flashTimer = useRef(null)

  // ── Load squad ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTeam) return
    setLoading(true)
    setError(null)
    fetchSquad(selectedTeam.id, selectedTeam.leagueCode)
      .then(data => {
        const { xi, bench } = data
        setPitchPlayers(xi)
        setBenchPlayers(bench)
        setOriginalPitch(xi)
        setOriginalBench(bench)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [selectedTeam?.id])

  // ── Enrich with live stamina ──────────────────────────────────────────
  const enrichedPitch = useMemo(() =>
    pitchPlayers.map(p => ({
      ...p,
      stamina_pct: computeStamina(p.position, p.minutes_played ?? minute),
    })),
    [pitchPlayers, minute]
  )

  const enrichedBench = useMemo(() =>
    benchPlayers.map(p => ({ ...p, stamina_pct: 100 })),
    [benchPlayers]
  )

  const formationSlots = FORMATIONS[formation]?.positions ?? FORMATIONS['4-3-3'].positions

  // ── Flash helper ──────────────────────────────────────────────────────
  function flashGreen(idx) {
    clearTimeout(flashTimer.current)
    setFlashIdx(idx)
    flashTimer.current = setTimeout(() => setFlashIdx(null), 900)
  }

  // ── Swap helpers ──────────────────────────────────────────────────────
  function doBenchToPitch(benchIdx, pitchIdx) {
    const np = [...pitchPlayers], nb = [...benchPlayers]
    const bPlayer = { ...nb[benchIdx] }
    const pPlayer = { ...np[pitchIdx] }
    np[pitchIdx] = bPlayer
    nb[benchIdx] = pPlayer
    setPitchPlayers(np)
    setBenchPlayers(nb)
    setManualSwaps(prev => new Set([...prev, pPlayer?.id]))
    flashGreen(pitchIdx)
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

  // ── dnd-kit handlers ──────────────────────────────────────────────────
  function handleDragStart({ active }) {
    setActiveDrag(active.data.current)
  }

  function handleDragEnd({ active, over }) {
    setActiveDrag(null)
    if (!over) return
    const { from, fromIndex } = active.data.current
    const toId = over.id

    if (toId.startsWith('pitch-')) {
      const toIdx = parseInt(toId.slice(6))
      if (from === 'bench') doBenchToPitch(fromIndex, toIdx)
      else if (from === 'pitch' && fromIndex !== toIdx) doPitchToPitch(fromIndex, toIdx)
    } else if (toId.startsWith('bench-')) {
      const toIdx = parseInt(toId.slice(6))
      if (from === 'pitch') doPitchToBench(fromIndex, toIdx)
      else if (from === 'bench' && fromIndex !== toIdx) doBenchToBench(fromIndex, toIdx)
    }
  }

  // ── Apply recommendation ──────────────────────────────────────────────
  function applyRec(rec) {
    const pitchIdx = pitchPlayers.findIndex(p => p.id === rec.subOff?.id)
    const benchIdx = benchPlayers.findIndex(p => p.id === rec.subOn?.id)
    if (pitchIdx === -1 || benchIdx === -1) return
    doBenchToPitch(benchIdx, pitchIdx)

    // Update highlights
    const newPitch = [...pitchPlayers]
    newPitch[pitchIdx] = benchPlayers[benchIdx]
    setHighOff(null)
    setHighOn(null)
    setSubArrow(null)
  }

  // ── Reset lineup ──────────────────────────────────────────────────────
  function resetLineup() {
    setPitchPlayers(originalPitch)
    setBenchPlayers(originalBench)
    setManualSwaps(new Set())
    setHighOff(null); setHighOn(null)
    setSubArrow(null); setShowPanel(false)
    setFlashIdx(null); setRecs([])
  }

  // ── Analyse subs ──────────────────────────────────────────────────────
  const handleAnalyse = useCallback(async () => {
    setRecLoading(true)
    setShowPanel(false)
    setHighOff(null); setHighOn(null); setSubArrow(null)

    const xiPayload = enrichedPitch.map(p => ({
      ...p, minutes_played: p.minutes_played ?? minute,
    }))

    let results
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starting_xi:   xiPayload,
          bench:         enrichedBench,
          home_score:    homeScore,
          away_score:    awayScore,
          minute,
          manager_intent: intent,
        }),
      })
      results = await res.json()
    } catch {
      results = computeClientRecs(enrichedPitch, enrichedBench, intent, manualSwaps)
    }

    // Filter to stamina < 65 (API should handle this, but enforce on client too)
    results = results.filter(r => (r.stamina_pct ?? 100) < 65)

    setRecs(results)

    if (results.length) {
      const top = results[0]
      setHighOff(top.subOff?.id)
      setHighOn(top.subOn?.id)

      // Sub arrow: from bottom of pitch to player's pitch position
      const pitchIdx = pitchPlayers.findIndex(p => p.id === top.subOff?.id)
      if (pitchIdx !== -1 && formationSlots[pitchIdx]) {
        const slot = formationSlots[pitchIdx]
        setSubArrow({ fromLeft: 50, fromTop: 98, toLeft: slot.left, toTop: slot.top })
      }
    }

    setRecLoading(false)
    setShowPanel(true)
  }, [enrichedPitch, enrichedBench, minute, homeScore, awayScore, intent, manualSwaps, pitchPlayers, formationSlots])

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
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

        {/* Controls bar */}
        <div className="glass" style={{
          padding: '8px 14px', display: 'flex', flexWrap: 'wrap',
          gap: 10, alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
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

          {/* Scoreline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>HOME</span>
            <ScoreInput value={homeScore} onChange={setHomeScore} />
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>–</span>
            <ScoreInput value={awayScore} onChange={setAwayScore} />
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>AWAY</span>
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
              <button key={i.value} onClick={() => setIntent(i.value)} style={{
                background: intent === i.value ? 'rgba(0,255,135,0.15)' : 'transparent',
                border: intent === i.value ? '1px solid rgba(0,255,135,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5, color: intent === i.value ? 'var(--green)' : 'var(--muted)',
                fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 600,
                padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{i.label}</button>
            ))}
          </div>

          {/* Formation toggle */}
          <div style={{ display: 'flex', gap: 3 }}>
            {FORMATION_KEYS.map(f => (
              <button key={f} onClick={() => setFormation(f)} style={{
                background: formation === f ? 'rgba(0,255,135,0.15)' : 'transparent',
                border: formation === f ? '1px solid rgba(0,255,135,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5, color: formation === f ? 'var(--green)' : 'var(--muted)',
                fontSize: 10, fontFamily: 'Rajdhani', fontWeight: 700,
                padding: '4px 7px', cursor: 'pointer',
              }}>{f}</button>
            ))}
          </div>

          {/* Reset */}
          {manualSwaps.size > 0 && (
            <button onClick={resetLineup} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 5, color: 'var(--muted)', fontSize: 10,
              fontFamily: 'Rajdhani', fontWeight: 600,
              padding: '4px 10px', cursor: 'pointer',
            }}>↺ Reset</button>
          )}

          {/* Analyse */}
          <button onClick={handleAnalyse} disabled={recLoading || loading} style={{
            marginLeft: 'auto',
            background: (recLoading || loading) ? 'rgba(0,255,135,0.3)' : 'var(--green)',
            color: '#000', border: 'none', borderRadius: 6,
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
            padding: '7px 18px', cursor: (recLoading || loading) ? 'not-allowed' : 'pointer',
            letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            {recLoading ? '…' : '⚡ Analyse Subs'}
          </button>
        </div>

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
              <Pitch
                pitchPlayers={enrichedPitch}
                formation={formationSlots}
                highlightOffId={highlightOff}
                swapFlashIdx={swapFlashIdx}
                onPlayerClick={p => setHighOff(prev => prev === p.id ? null : p.id)}
                subArrow={showPanel ? subArrow : null}
              />
              <BenchRow
                bench={enrichedBench}
                highlightId={highlightOn}
                onSelect={p => setHighOn(prev => prev === p.id ? null : p.id)}
              />
            </div>

            {/* Recommendation panel */}
            {showPanel && (
              <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 304, zIndex: 20 }}>
                <RecommendPanel
                  recs={recs}
                  onClose={() => { setShowPanel(false); setHighOff(null); setHighOn(null); setSubArrow(null) }}
                  onApply={rec => { applyRec(rec); setShowPanel(false) }}
                />
              </div>
            )}
          </div>
        )}
      </div>

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
