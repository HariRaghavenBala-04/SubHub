/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { FORMATION_KEYS } from '../data/formations'

// ── Builder formation slots (mirrors Planner) ─────────────────────────────────

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

// ── Position compatibility (mirrors Planner) ──────────────────────────────────

function isCompatibleForSlot(player, slotType) {
  const pos = player.api_position || player.position || 'CM'
  const COMPAT = {
    GK:  ['GK'],
    LB:  ['LB', 'LWB', 'CB', 'RB'],
    RB:  ['RB', 'RWB', 'CB', 'LB'],
    CB:  ['CB', 'LB', 'RB', 'CDM', 'CM'],
    LWB: ['LWB', 'LB', 'LM', 'RWB'],
    RWB: ['RWB', 'RB', 'RM', 'LWB'],
    CDM: ['CDM', 'CM', 'CB', 'CAM'],
    CM:  ['CM', 'CDM', 'CAM', 'LM', 'RM'],
    LM:  ['LM', 'LW', 'CM', 'LWB', 'RM'],
    RM:  ['RM', 'RW', 'CM', 'RWB', 'LM'],
    CAM: ['CAM', 'CM', 'LW', 'RW', 'CDM', 'ST', 'CF'],
    LAM: ['LAM', 'CAM', 'LW', 'CM'],
    RAM: ['RAM', 'CAM', 'RW', 'CM'],
    LW:  ['LW', 'LM', 'CAM', 'ST', 'RW'],
    RW:  ['RW', 'RM', 'CAM', 'ST', 'LW'],
    ST:  ['ST', 'CF', 'LW', 'RW', 'CAM'],
    CF:  ['CF', 'ST', 'CAM', 'LW', 'RW'],
  }
  if (slotType === 'GK') return pos === 'GK'
  if (pos === 'GK') return slotType === 'GK'
  const allowed = COMPAT[slotType] || [slotType]
  return allowed.includes(pos)
}

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

// ── Main component ────────────────────────────────────────────────────────────

export default function Squad() {
  const { teamId }    = useParams()
  const [search]      = useSearchParams()
  const league        = search.get('league') || 'PL'
  const navigate      = useNavigate()

  // API data
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // XI Builder
  const [builtXI,          setBuiltXI]          = useState({})
  const [builderFormation,  setBuilderFormation]  = useState('4-3-3')
  const [draggedInfo,       setDraggedInfo]       = useState(null)
  const [bslSearch,         setBslSearch]         = useState('')
  const [bslFilter,         setBslFilter]         = useState('ALL')
  const invalidTimers = useRef({})

  // Bench (7 slots)
  const [benchSlots, setBenchSlots] = useState(Array(7).fill(null))

  // Reserves collapsible
  const [reservesExpanded, setReservesExpanded] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/squad/${teamId}?league_code=${league}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d  => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [teamId, league])

  // ── Derived ─────────────────────────────────────────────────────────────────

  const allPlayers = useMemo(() => data?.squad ?? [], [data])

  const placedXIIds = useMemo(
    () => new Set(Object.values(builtXI).filter(Boolean).map(p => p.id)),
    [builtXI]
  )
  const benchIds = useMemo(
    () => new Set(benchSlots.filter(Boolean).map(p => p.id)),
    [benchSlots]
  )

  const placedCount = Object.values(builtXI).filter(Boolean).length
  const benchCount  = benchSlots.filter(Boolean).length

  const availablePlayers = useMemo(
    () => allPlayers.filter(p => !placedXIIds.has(p.id) && !benchIds.has(p.id)),
    [allPlayers, placedXIIds, benchIds]
  )

  const reservePlayers = availablePlayers  // same — everyone not in XI or bench

  const kickOffReady = placedCount === 11

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  function flashInvalidSlot(key) {
    const el = document.querySelector(`[data-slot-key="${key}"]`)
    if (!el) return
    el.classList.add('invalid')
    clearTimeout(invalidTimers.current[key])
    invalidTimers.current[key] = setTimeout(() => el.classList.remove('invalid'), 600)
  }

  // ── Formation change ─────────────────────────────────────────────────────────

  function handleFormationChange(f) {
    if (f === builderFormation) return
    setBuilderFormation(f)
    setBuiltXI({})
  }

  // ── Drag handlers ────────────────────────────────────────────────────────────

  function onListDragStart(player) {
    setDraggedInfo({ player, from: 'list' })
  }

  function onPitchCardDragStart(player, key) {
    setDraggedInfo({ player, from: 'pitch', key })
  }

  function onBenchCardDragStart(player, benchIdx) {
    setDraggedInfo({ player, from: 'bench', benchIdx })
  }

  // Drop onto a pitch slot
  function onPitchSlotDrop(e, slotDef) {
    e.preventDefault()
    if (!draggedInfo) return
    const { player, from, key: srcKey, benchIdx: srcBenchIdx } = draggedInfo

    if (!isCompatibleForSlot(player, slotDef.slot)) {
      flashInvalidSlot(slotDef.key)
      showToast(`${player.short_name || player.name} can't play ${slotDef.slot}`)
      setDraggedInfo(null)
      return
    }

    setBuiltXI(prev => {
      const next = { ...prev }
      // Where was this player before?
      const existingKey = Object.keys(prev).find(k => prev[k]?.id === player.id)
      const displaced   = prev[slotDef.key] || null

      if (existingKey) {
        // Player was already on pitch — swap slots
        next[existingKey] = displaced
      } else if (from === 'bench') {
        // Coming from bench — remove from bench
        setBenchSlots(b => b.map((p, i) => (i === srcBenchIdx ? null : p)))
      }
      next[slotDef.key] = player
      return next
    })
    setDraggedInfo(null)
  }

  // Drop onto a bench slot
  function onBenchSlotDrop(e, benchIdx) {
    e.preventDefault()
    if (!draggedInfo) return
    const { player, from, key: srcKey, benchIdx: srcBenchIdx } = draggedInfo

    const displaced = benchSlots[benchIdx]

    setBenchSlots(prev => {
      const next = [...prev]
      if (from === 'bench') {
        // Swap within bench
        next[srcBenchIdx] = displaced
      } else if (from === 'pitch') {
        // Remove from pitch, put displaced back on pitch if there was one
        setBuiltXI(b => {
          const nb = { ...b }
          nb[srcKey] = displaced || null
          return nb
        })
      }
      // from 'list': nothing extra to do
      next[benchIdx] = player
      return next
    })
    setDraggedInfo(null)
  }

  // ── Remove from pitch ────────────────────────────────────────────────────────

  function removeFromPitch(key) {
    setBuiltXI(prev => ({ ...prev, [key]: null }))
  }

  // ── Remove from bench ────────────────────────────────────────────────────────

  function removeFromBench(benchIdx) {
    setBenchSlots(prev => prev.map((p, i) => (i === benchIdx ? null : p)))
  }

  // ── AUTO-FILL BENCH ──────────────────────────────────────────────────────────

  function autoFillBench() {
    const emptyCount = benchSlots.filter(s => s === null).length
    if (emptyCount === 0) return

    const sorted = [...availablePlayers].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))

    // Check if bench already has a GK
    const benchHasGK = benchSlots.some(p => p?.api_position === 'GK' || p?.position === 'GK')

    const picks = []
    let gkAdded = false

    // First pass: try to include a backup GK if bench doesn't have one
    if (!benchHasGK) {
      const backupGK = sorted.find(p => (p.api_position || p.position) === 'GK')
      if (backupGK) {
        picks.push(backupGK)
        gkAdded = true
      }
    }

    // Fill remaining slots from sorted (non-GK priority unless GK already handled)
    for (const p of sorted) {
      if (picks.length >= emptyCount) break
      if (picks.some(x => x.id === p.id)) continue
      picks.push(p)
    }

    setBenchSlots(prev => {
      const next = [...prev]
      let pickIdx = 0
      for (let i = 0; i < next.length && pickIdx < picks.length; i++) {
        if (next[i] === null) {
          next[i] = picks[pickIdx++]
        }
      }
      return next
    })
  }

  // ── KICK OFF ─────────────────────────────────────────────────────────────────

  function handleKickOff() {
    if (!kickOffReady) return
    const confirmedXI = BUILDER_SLOTS[builderFormation]
      .map(slotDef => {
        const p = builtXI[slotDef.key]
        if (!p) return null
        return { ...p, assigned_slot: slotDef.slot, minute_entered: 0 }
      })
      .filter(Boolean)
    const confirmedBench    = benchSlots.filter(Boolean)
    const takenIds          = new Set([...placedXIIds, ...benchIds])
    const confirmedReserves = allPlayers.filter(p => !takenIds.has(p.id))

    navigate(`/match/${teamId}`, {
      state: {
        confirmedXI,
        confirmedBench,
        confirmedReserves,
        formation: builderFormation,
        teamId,
        league,
      },
    })
  }

  // ── Filtered squad list ──────────────────────────────────────────────────────

  const filteredList = useMemo(() =>
    availablePlayers.filter(p => {
      const name    = (p.short_name || p.name).toLowerCase()
      const pos     = p.api_position || p.position || 'CM'
      const matchSr = !bslSearch || name.includes(bslSearch)
      const matchFl =
        bslFilter === 'ALL' ||
        (bslFilter === 'GK'  && pos === 'GK') ||
        (bslFilter === 'DEF' && ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) ||
        (bslFilter === 'MID' && ['CDM', 'CM', 'LM', 'RM', 'CAM', 'LAM', 'RAM'].includes(pos)) ||
        (bslFilter === 'ATT' && ['ST', 'CF', 'LW', 'RW'].includes(pos))
      return matchSr && matchFl
    }),
    [availablePlayers, bslSearch, bslFilter]
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 52px)', overflow: 'hidden',
      padding: '12px 20px', gap: 10,
      boxSizing: 'border-box',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <Link to={`/league/${league}`} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 13 }}>
          ← {league}
        </Link>
        {data?.team?.crestUrl && (
          <img src={data.team.crestUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        )}
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {data?.team?.name ?? 'Squad'}
        </h1>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Progress counters */}
          <span style={{
            fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: '0.08em',
            color: kickOffReady ? 'var(--green)' : '#FFD700',
          }}>
            {placedCount}/11 XI
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>·</span>
          <span style={{
            fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: '0.08em',
            color: benchCount === 7 ? '#4a9eff' : 'var(--muted)',
          }}>
            {benchCount}/7 Bench
          </span>

          {/* KICK OFF button */}
          {data?.team && (
            <button
              onClick={handleKickOff}
              disabled={!kickOffReady}
              style={{
                background:    kickOffReady ? '#FFD700' : 'rgba(255,255,255,0.05)',
                color:         kickOffReady ? '#000' : 'var(--muted)',
                fontFamily:    'Rajdhani', fontWeight: 800, fontSize: 13,
                padding:       '7px 18px', borderRadius: 6, letterSpacing: '0.09em',
                textTransform: 'uppercase',
                border:        kickOffReady ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor:        kickOffReady ? 'pointer' : 'not-allowed',
                whiteSpace:    'nowrap',
                transition:    'background 0.18s, color 0.18s',
              }}
            >
              {kickOffReady ? 'KICK OFF →' : `SELECT XI (${placedCount}/11)`}
            </button>
          )}
        </div>
      </div>

      {/* ── Formation controls ───────────────────────────────────────────────── */}
      <div className="builder-controls" style={{ marginBottom: 0, flexShrink: 0 }}>
        <div className="builder-formation-label">FORMATION</div>
        <div className="builder-formation-pills">
          {FORMATION_KEYS.map(f => (
            <button
              key={f}
              className={`toggle-pill${builderFormation === f ? ' active' : ''}`}
              onClick={() => handleFormationChange(f)}
            >{f}</button>
          ))}
        </div>
        <button className="builder-clear-btn" onClick={() => setBuiltXI({})}>
          Clear XI
        </button>
      </div>

      {loading && (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading squad…</div>
      )}
      {error && (
        <div style={{
          color: 'var(--amber)', background: 'rgba(255,184,0,0.08)',
          border: '1px solid rgba(255,184,0,0.2)', borderRadius: 8, padding: '10px 14px',
        }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Section 1: XI Builder layout ──────────────────────────────────── */}
          <div className="builder-layout" style={{ flex: 1, minHeight: 0, height: 'auto' }}>

            {/* LEFT — Pitch */}
            <div className="builder-pitch-wrapper">
              <div className="builder-pitch">
                {BUILDER_SLOTS[builderFormation].map(slotDef => {
                  const player = builtXI[slotDef.key]
                  return (
                    <div
                      key={slotDef.key}
                      data-slot-key={slotDef.key}
                      className={`builder-slot ${player ? 'filled' : 'empty'}`}
                      style={{ position: 'absolute', left: slotDef.left, top: slotDef.top, transform: 'translate(-50%, -50%)' }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => onPitchSlotDrop(e, slotDef)}
                    >
                      {player ? (
                        <div
                          className="builder-filled-card"
                          draggable
                          onDragStart={() => onPitchCardDragStart(player, slotDef.key)}
                          onClick={() => removeFromPitch(slotDef.key)}
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
              <div className="bsl-header">SQUAD — drag to pitch or bench</div>
              <input
                className="bsl-search"
                placeholder="Search player..."
                value={bslSearch}
                onChange={e => setBslSearch(e.target.value.toLowerCase())}
              />
              <div className="bsl-filter">
                {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(f => (
                  <button
                    key={f}
                    className={`bsl-filter-btn ${bslFilter === f ? 'active' : ''}`}
                    onClick={() => setBslFilter(f)}
                  >{f}</button>
                ))}
              </div>
              <div className="bsl-players">
                {filteredList.map(player => (
                  <div
                    key={player.id}
                    className="bsl-player-row"
                    draggable
                    onDragStart={() => onListDragStart(player)}
                  >
                    <span className="bsl-pos">{player.api_position || player.position}</span>
                    <span className="bsl-name">{player.short_name || player.name}</span>
                    <span className="bsl-ovr">{player.overall}</span>
                  </div>
                ))}
                {filteredList.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: 'Rajdhani', padding: '16px 8px', textAlign: 'center' }}>
                    {availablePlayers.length === 0 ? 'All players placed' : 'No matches'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 2: Bench ──────────────────────────────────────────────── */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 8,
            }}>
              <span style={{
                fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700,
                letterSpacing: '0.14em', color: 'rgba(200,150,60,0.7)',
                textTransform: 'uppercase',
              }}>
                MATCHDAY BENCH — drag players here
              </span>
              <button
                onClick={autoFillBench}
                disabled={availablePlayers.length === 0 && benchCount === 7}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: '1px solid rgba(200,150,60,0.45)',
                  color: 'rgba(200,150,60,0.85)',
                  fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 10,
                  padding: '3px 12px', borderRadius: 4,
                  letterSpacing: '0.09em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(200,150,60,0.85)'
                  e.currentTarget.style.color = '#FFD700'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(200,150,60,0.45)'
                  e.currentTarget.style.color = 'rgba(200,150,60,0.85)'
                }}
              >
                AUTO-FILL BENCH
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {benchSlots.map((player, benchIdx) => (
                <div
                  key={benchIdx}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => onBenchSlotDrop(e, benchIdx)}
                  style={{
                    width: 64, height: 80, flexShrink: 0,
                    borderRadius: 6, position: 'relative',
                    border: player
                      ? '1.5px solid rgba(74,158,255,0.55)'
                      : '1.5px dashed rgba(200,150,60,0.25)',
                    background: player
                      ? 'rgba(74,158,255,0.07)'
                      : 'rgba(200,150,60,0.03)',
                    transition: 'border-color 0.15s, background 0.15s',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 2, cursor: player ? 'grab' : 'default',
                  }}
                >
                  {player ? (
                    <>
                      <div
                        draggable
                        onDragStart={() => onBenchCardDragStart(player, benchIdx)}
                        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
                      >
                        <span style={{
                          fontSize: 7, fontWeight: 800, fontFamily: 'Rajdhani',
                          color: '#080c10',
                          background: 'linear-gradient(135deg, #4a9eff, #2d7dd6)',
                          padding: '1px 4px', borderRadius: 2, letterSpacing: '0.5px',
                        }}>
                          {player.api_position || player.position}
                        </span>
                        <span style={{
                          fontSize: 16, fontWeight: 900, fontFamily: 'Rajdhani',
                          color: '#4a9eff', lineHeight: 1,
                        }}>
                          {player.overall}
                        </span>
                        <span style={{
                          fontSize: 7, fontWeight: 700, fontFamily: 'Rajdhani',
                          color: '#c8e4ff', textTransform: 'uppercase',
                          maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', textAlign: 'center',
                        }}>
                          {getSurname(player.short_name || player.name)}
                        </span>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromBench(benchIdx)}
                        style={{
                          position: 'absolute', top: 2, right: 4,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(255,61,61,0.7)', fontSize: 11, lineHeight: 1,
                          padding: 0, opacity: 0,
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = 0 }}
                        className="bench-slot-remove"
                      >×</button>
                    </>
                  ) : (
                    <>
                      <span style={{
                        fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700,
                        color: 'rgba(200,150,60,0.3)', letterSpacing: '0.5px',
                      }}>
                        SUB {benchIdx + 1}
                      </span>
                      <span style={{
                        fontSize: 7, color: 'rgba(255,255,255,0.12)',
                        fontFamily: 'Rajdhani',
                      }}>
                        drop here
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 3: Reserves ────────────────────────────────────────────── */}
          {reservePlayers.length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <button
                onClick={() => setReservesExpanded(x => !x)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                }}
              >
                <span style={{
                  fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700,
                  color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                  RESERVES — not available for matchday ({reservePlayers.length})
                </span>
                <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                  {reservesExpanded ? '▼' : '▲ hover'}
                </span>
              </button>

              {reservesExpanded && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {reservePlayers.map(player => (
                    <div
                      key={player.id}
                      style={{
                        width: 58, height: 72, flexShrink: 0, borderRadius: 5,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, opacity: 0.5, cursor: 'default',
                      }}
                    >
                      <span style={{
                        fontSize: 7, fontWeight: 800, fontFamily: 'Rajdhani',
                        color: 'rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.07)',
                        padding: '1px 4px', borderRadius: 2,
                      }}>
                        {player.api_position || player.position}
                      </span>
                      <span style={{
                        fontSize: 14, fontWeight: 900, fontFamily: 'Rajdhani',
                        color: 'rgba(255,255,255,0.4)', lineHeight: 1,
                      }}>
                        {player.overall}
                      </span>
                      <span style={{
                        fontSize: 6, fontWeight: 700, fontFamily: 'Rajdhani',
                        color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                        maxWidth: 54, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {getSurname(player.short_name || player.name)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,61,61,0.12)', border: '1px solid rgba(255,61,61,0.45)',
          borderRadius: 8, padding: '8px 22px', zIndex: 9999,
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
          color: 'var(--red)', letterSpacing: '0.07em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)', pointerEvents: 'none',
        }}>
          ⚠ {toast}
        </div>
      )}
    </div>
  )
}
