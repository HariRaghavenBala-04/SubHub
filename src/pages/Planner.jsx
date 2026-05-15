/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import { getSavedSquads, saveSquad, deleteSquad, updateSquad } from '../utils/squadStorage'
import { UEFA_ELIGIBILITY } from '../utils/uefaEligibility'

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

// Maps planner comp codes → /api/teams-by-competition keys.
// Cups in the same country reuse the domestic league's team pool.
const COMP_TO_API_KEY = {
  PL: 'premier_league', FAC: 'premier_league', CC: 'premier_league', FCS: 'premier_league',
  BL: 'bundesliga',     DFB: 'bundesliga',     SPK: 'bundesliga',
  LL: 'la_liga',        CDR: 'la_liga',        SSP: 'la_liga',
  L1: 'ligue_1',        CDF: 'ligue_1',        TSC: 'ligue_1',
  SA: 'serie_a',        CPI: 'serie_a',        SCI: 'serie_a',
  UCL: 'ucl', UEL: 'uel',
}

// ── Competition Theme Engine ───────────────────────────────────────────────

const COMPETITION_THEMES = {
  // ENGLAND
  PL:   { primary: '#380151', accent: '#00ff87', cardBorder: '#6d0fd0', cardBg: 'rgba(55,1,80,0.35)',    cardGlow: 'rgba(109,15,208,0.4)',  pitchTint: 'rgba(55,1,80,0.12)',    textAccent: '#00ff87', pillActive: 'rgba(109,15,208,0.35)', pillBorder: '#6d0fd0', label: 'Premier League',             vibe: 'Intensity. Pace. No rest.' },
  FAC:  { primary: '#002147', accent: '#f5c518', cardBorder: '#f5c518', cardBg: 'rgba(0,33,71,0.35)',    cardGlow: 'rgba(245,197,24,0.4)',  pitchTint: 'rgba(0,33,71,0.12)',    textAccent: '#f5c518', pillActive: 'rgba(245,197,24,0.2)',  pillBorder: '#f5c518', label: 'FA Cup',                      vibe: 'The beautiful upset.' },
  CC:   { primary: '#003366', accent: '#aaccff', cardBorder: '#6699cc', cardBg: 'rgba(0,51,102,0.35)',   cardGlow: 'rgba(102,153,204,0.4)', pitchTint: 'rgba(0,51,102,0.12)',   textAccent: '#aaccff', pillActive: 'rgba(102,153,204,0.2)', pillBorder: '#6699cc', label: 'Carabao Cup',                 vibe: 'League Cup drama.' },
  FCS:  { primary: '#1a2040', accent: '#f0c060', cardBorder: '#c8963c', cardBg: 'rgba(26,32,64,0.35)',   cardGlow: 'rgba(200,150,60,0.4)',  pitchTint: 'rgba(26,32,64,0.12)',   textAccent: '#f0c060', pillActive: 'rgba(200,150,60,0.2)',  pillBorder: '#c8963c', label: 'Community Shield',            vibe: 'Season opener glory.' },
  // GERMANY
  BL:   { primary: '#1a0008', accent: '#ff4466', cardBorder: '#d00027', cardBg: 'rgba(208,0,39,0.18)',   cardGlow: 'rgba(208,0,39,0.45)',   pitchTint: 'rgba(208,0,39,0.08)',   textAccent: '#ff6680', pillActive: 'rgba(208,0,39,0.28)',   pillBorder: '#d00027', label: 'Bundesliga',                  vibe: 'Gegenpressing territory.' },
  DFB:  { primary: '#1e1e1e', accent: '#cccccc', cardBorder: '#888888', cardBg: 'rgba(46,46,46,0.35)',   cardGlow: 'rgba(136,136,136,0.3)', pitchTint: 'rgba(46,46,46,0.10)',   textAccent: '#cccccc', pillActive: 'rgba(136,136,136,0.2)', pillBorder: '#888888', label: 'DFB Pokal',                   vibe: 'Cup upset season.' },
  SPK:  { primary: '#111111', accent: '#e8c84a', cardBorder: '#e8c84a', cardBg: 'rgba(26,26,26,0.35)',   cardGlow: 'rgba(232,200,74,0.4)',  pitchTint: 'rgba(26,26,26,0.10)',   textAccent: '#e8c84a', pillActive: 'rgba(232,200,74,0.2)',  pillBorder: '#e8c84a', label: 'DFL Super Cup',               vibe: 'Domestic supremacy.' },
  // SPAIN
  LL:   { primary: '#1a0003', accent: '#ffd700', cardBorder: '#ee1623', cardBg: 'rgba(238,22,35,0.18)',  cardGlow: 'rgba(238,22,35,0.4)',   pitchTint: 'rgba(238,22,35,0.07)',  textAccent: '#ffd700', pillActive: 'rgba(238,22,35,0.25)', pillBorder: '#ee1623', label: 'La Liga',                     vibe: 'Tiki-taka. Classics.' },
  CDR:  { primary: '#1a0038', accent: '#cc99ff', cardBorder: '#9933ff', cardBg: 'rgba(26,0,56,0.35)',    cardGlow: 'rgba(153,51,255,0.4)',  pitchTint: 'rgba(26,0,56,0.12)',    textAccent: '#cc99ff', pillActive: 'rgba(153,51,255,0.25)', pillBorder: '#9933ff', label: 'Copa del Rey',                vibe: 'Royal knockout.' },
  SSP:  { primary: '#1a0003', accent: '#f1bf00', cardBorder: '#c60b1e', cardBg: 'rgba(198,11,30,0.2)',   cardGlow: 'rgba(198,11,30,0.4)',   pitchTint: 'rgba(198,11,30,0.08)',  textAccent: '#f1bf00', pillActive: 'rgba(198,11,30,0.25)', pillBorder: '#c60b1e', label: 'Supercopa de España',         vibe: 'El Clásico en Riad.' },
  // FRANCE
  L1:   { primary: '#000d2e', accent: '#6699ff', cardBorder: '#0033cc', cardBg: 'rgba(0,20,137,0.25)',   cardGlow: 'rgba(0,51,204,0.4)',    pitchTint: 'rgba(0,20,137,0.10)',   textAccent: '#6699ff', pillActive: 'rgba(0,51,204,0.25)',  pillBorder: '#0033cc', label: 'Ligue 1',                     vibe: 'Paris nights.' },
  CDF:  { primary: '#000f22', accent: '#6699cc', cardBorder: '#002e6e', cardBg: 'rgba(0,46,110,0.35)',   cardGlow: 'rgba(0,46,110,0.4)',    pitchTint: 'rgba(0,46,110,0.12)',   textAccent: '#6699cc', pillActive: 'rgba(0,46,110,0.3)',   pillBorder: '#002e6e', label: 'Coupe de France',             vibe: 'Cup surprise incoming.' },
  TSC:  { primary: '#101020', accent: '#f0c060', cardBorder: '#c8963c', cardBg: 'rgba(26,26,46,0.35)',   cardGlow: 'rgba(200,150,60,0.4)',  pitchTint: 'rgba(26,26,46,0.12)',   textAccent: '#f0c060', pillActive: 'rgba(200,150,60,0.2)',  pillBorder: '#c8963c', label: 'Trophée des Champions',      vibe: 'Season curtain raiser.' },
  // ITALY
  SA:   { primary: '#00112e', accent: '#66aaff', cardBorder: '#0057b7', cardBg: 'rgba(0,63,138,0.22)',   cardGlow: 'rgba(0,87,183,0.4)',    pitchTint: 'rgba(0,63,138,0.10)',   textAccent: '#66aaff', pillActive: 'rgba(0,87,183,0.3)',   pillBorder: '#0057b7', label: 'Serie A',                     vibe: 'Catenaccio reborn.' },
  CPI:  { primary: '#051508', accent: '#00cc55', cardBorder: '#004422', cardBg: 'rgba(10,32,64,0.35)',   cardGlow: 'rgba(0,68,34,0.4)',     pitchTint: 'rgba(10,32,64,0.12)',   textAccent: '#00cc55', pillActive: 'rgba(0,68,34,0.25)',   pillBorder: '#004422', label: 'Coppa Italia',                vibe: 'Italian cup fire.' },
  SCI:  { primary: '#0d0800', accent: '#f5c518', cardBorder: '#8b7300', cardBg: 'rgba(26,10,0,0.35)',    cardGlow: 'rgba(139,115,0,0.4)',   pitchTint: 'rgba(26,10,0,0.10)',    textAccent: '#f5c518', pillActive: 'rgba(139,115,0,0.2)',  pillBorder: '#8b7300', label: 'Supercoppa Italiana',         vibe: 'Italian prestige.' },
  // NETHERLANDS
  ERE:  { primary: '#1a0a00', accent: '#ff8833', cardBorder: '#ff6200', cardBg: 'rgba(255,98,0,0.15)',   cardGlow: 'rgba(255,98,0,0.45)',   pitchTint: 'rgba(255,98,0,0.06)',   textAccent: '#ff8833', pillActive: 'rgba(255,98,0,0.25)',  pillBorder: '#ff6200', label: 'Eredivisie',                  vibe: 'Total football lives here.' },
  KNV:  { primary: '#001030', accent: '#6699ff', cardBorder: '#00338d', cardBg: 'rgba(0,51,141,0.25)',   cardGlow: 'rgba(0,51,141,0.4)',    pitchTint: 'rgba(0,51,141,0.10)',   textAccent: '#6699ff', pillActive: 'rgba(0,51,141,0.3)',   pillBorder: '#00338d', label: 'KNVB Cup',                    vibe: 'Dutch knockout.' },
  JCS:  { primary: '#101010', accent: '#f0c060', cardBorder: '#c8963c', cardBg: 'rgba(26,26,26,0.35)',   cardGlow: 'rgba(200,150,60,0.4)',  pitchTint: 'rgba(26,26,26,0.10)',   textAccent: '#f0c060', pillActive: 'rgba(200,150,60,0.2)',  pillBorder: '#c8963c', label: 'Johan Cruyff Schaal',         vibe: 'Legacy of the master.' },
  // PORTUGAL
  PPL:  { primary: '#001800', accent: '#00cc44', cardBorder: '#009900', cardBg: 'rgba(0,102,0,0.2)',     cardGlow: 'rgba(0,153,0,0.4)',     pitchTint: 'rgba(0,102,0,0.08)',    textAccent: '#00cc44', pillActive: 'rgba(0,153,0,0.25)',   pillBorder: '#009900', label: 'Liga Portugal',               vibe: 'Dragon country.' },
  TCP:  { primary: '#000d22', accent: '#6699ff', cardBorder: '#003399', cardBg: 'rgba(0,51,153,0.25)',   cardGlow: 'rgba(0,51,153,0.4)',    pitchTint: 'rgba(0,51,153,0.10)',   textAccent: '#6699ff', pillActive: 'rgba(0,51,153,0.3)',   pillBorder: '#003399', label: 'Taça de Portugal',            vibe: 'Portuguese cup pride.' },
  TDL:  { primary: '#101020', accent: '#f0c060', cardBorder: '#c8963c', cardBg: 'rgba(26,26,46,0.35)',   cardGlow: 'rgba(200,150,60,0.4)',  pitchTint: 'rgba(26,26,46,0.12)',   textAccent: '#f0c060', pillActive: 'rgba(200,150,60,0.2)',  pillBorder: '#c8963c', label: 'Taça da Liga',                vibe: 'League Cup Iberia.' },
  SCP:  { primary: '#060010', accent: '#f5c518', cardBorder: '#8b7300', cardBg: 'rgba(10,10,30,0.35)',   cardGlow: 'rgba(139,115,0,0.4)',   pitchTint: 'rgba(10,10,30,0.10)',   textAccent: '#f5c518', pillActive: 'rgba(139,115,0,0.2)',  pillBorder: '#8b7300', label: 'Supertaça Cândido de Oliveira', vibe: 'Portuguese prestige.' },
  // UEFA
  UCL:  { primary: '#000d2a', accent: '#4d88ff', cardBorder: '#1c4fd8', cardBg: 'rgba(0,13,42,0.55)',   cardGlow: 'rgba(28,79,216,0.6)',   pitchTint: 'rgba(0,13,42,0.22)',    textAccent: '#6a9fff', pillActive: 'rgba(28,79,216,0.35)', pillBorder: '#1c4fd8', label: 'Champions League',            vibe: 'The pinnacle. No mercy.' },
  UEL:  { primary: '#140800', accent: '#ff8844', cardBorder: '#cc4400', cardBg: 'rgba(26,13,0,0.45)',   cardGlow: 'rgba(204,68,0,0.5)',    pitchTint: 'rgba(26,13,0,0.15)',    textAccent: '#ff8844', pillActive: 'rgba(204,68,0,0.3)',   pillBorder: '#cc4400', label: 'Europa League',               vibe: 'Thursday night stories.' },
  UECL: { primary: '#001208', accent: '#00ee66', cardBorder: '#008833', cardBg: 'rgba(0,26,13,0.45)',   cardGlow: 'rgba(0,136,51,0.5)',    pitchTint: 'rgba(0,26,13,0.15)',    textAccent: '#00ee66', pillActive: 'rgba(0,136,51,0.3)',   pillBorder: '#008833', label: 'Conference League',           vibe: 'The road less travelled.' },
  USC:  { primary: '#0a0020', accent: '#cc77ff', cardBorder: '#6600cc', cardBg: 'rgba(10,0,32,0.50)',   cardGlow: 'rgba(102,0,204,0.55)',  pitchTint: 'rgba(10,0,32,0.18)',    textAccent: '#cc77ff', pillActive: 'rgba(102,0,204,0.3)',  pillBorder: '#6600cc', label: 'UEFA Super Cup',              vibe: 'Champions vs Champions.' },
  // FRIENDLY
  FRN:  { primary: '#8a8a8a', accent: '#c0c0c0', cardBorder: 'rgba(180,180,180,0.35)', cardBg: 'linear-gradient(160deg, rgba(60,60,60,0.4), rgba(20,20,20,0.6))', cardGlow: 'rgba(180,180,180,0.12)', pitchTint: 'rgba(180,180,180,0.04)', textAccent: '#b0b0b0', pillActive: 'rgba(180,180,180,0.1)', pillBorder: 'rgba(180,180,180,0.35)', label: 'Friendly', vibe: 'CONCEPT SQUAD' },
}

const DEFAULT_THEME = COMPETITION_THEMES.FRN

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
  '4-2-3-1 Wide': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'LDM_0',  slot: 'LDM',  left: '35%', top: '55%' },
    { key: 'RDM_0',  slot: 'RDM',  left: '65%', top: '55%' },
    { key: 'LM_0',   slot: 'LM',   left: '15%', top: '30%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '32%' },
    { key: 'RM_0',   slot: 'RM',   left: '85%', top: '30%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '12%' },
  ],
  '4-2-3-1 Narrow': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'LDM_0',  slot: 'LDM',  left: '35%', top: '55%' },
    { key: 'RDM_0',  slot: 'RDM',  left: '65%', top: '55%' },
    { key: 'LCAM_0', slot: 'LCAM', left: '30%', top: '32%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '35%' },
    { key: 'RCAM_0', slot: 'RCAM', left: '70%', top: '32%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '12%' },
  ],
  '4-1-2-1-2 Wide': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'CDM_0',  slot: 'CDM',  left: '50%', top: '58%' },
    { key: 'LM_0',   slot: 'LM',   left: '15%', top: '42%' },
    { key: 'RM_0',   slot: 'RM',   left: '85%', top: '42%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '30%' },
    { key: 'LST_0',  slot: 'LST',  left: '40%', top: '12%' },
    { key: 'RST_0',  slot: 'RST',  left: '60%', top: '12%' },
  ],
  '4-1-2-1-2 Narrow': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'CDM_0',  slot: 'CDM',  left: '50%', top: '58%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '32%', top: '45%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '68%', top: '45%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '30%' },
    { key: 'LST_0',  slot: 'LST',  left: '40%', top: '12%' },
    { key: 'RST_0',  slot: 'RST',  left: '60%', top: '12%' },
  ],
  '4-4-1-1': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'LM_0',   slot: 'LM',   left: '15%', top: '45%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '38%', top: '48%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '62%', top: '48%' },
    { key: 'RM_0',   slot: 'RM',   left: '85%', top: '45%' },
    { key: 'CF_0',   slot: 'CF',   left: '50%', top: '28%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '12%' },
  ],
  '4-2-2-2': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'LCDM_0', slot: 'LCDM', left: '35%', top: '55%' },
    { key: 'RCDM_0', slot: 'RCDM', left: '65%', top: '55%' },
    { key: 'LCAM_0', slot: 'LCAM', left: '30%', top: '30%' },
    { key: 'RCAM_0', slot: 'RCAM', left: '70%', top: '30%' },
    { key: 'LST_0',  slot: 'LST',  left: '40%', top: '12%' },
    { key: 'RST_0',  slot: 'RST',  left: '60%', top: '12%' },
  ],
  '4-3-1-2': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '30%', top: '50%' },
    { key: 'CM_0',   slot: 'CM',   left: '50%', top: '54%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '70%', top: '50%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '32%' },
    { key: 'LST_0',  slot: 'LST',  left: '40%', top: '12%' },
    { key: 'RST_0',  slot: 'RST',  left: '60%', top: '12%' },
  ],
  '4-3-2-1': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LB_0',   slot: 'LB',   left: '15%', top: '70%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '38%', top: '72%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '62%', top: '72%' },
    { key: 'RB_0',   slot: 'RB',   left: '85%', top: '70%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '30%', top: '50%' },
    { key: 'CM_0',   slot: 'CM',   left: '50%', top: '54%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '70%', top: '50%' },
    { key: 'LCF_0',  slot: 'LCF',  left: '35%', top: '28%' },
    { key: 'RCF_0',  slot: 'RCF',  left: '65%', top: '28%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '12%' },
  ],
  '3-4-1-2': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '25%', top: '75%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '78%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '75%', top: '75%' },
    { key: 'LM_0',   slot: 'LM',   left: '12%', top: '45%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '38%', top: '48%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '62%', top: '48%' },
    { key: 'RM_0',   slot: 'RM',   left: '88%', top: '45%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '28%' },
    { key: 'LST_0',  slot: 'LST',  left: '40%', top: '12%' },
    { key: 'RST_0',  slot: 'RST',  left: '60%', top: '12%' },
  ],
  '3-4-2-1': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '25%', top: '75%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '78%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '75%', top: '75%' },
    { key: 'LM_0',   slot: 'LM',   left: '12%', top: '45%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '38%', top: '48%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '62%', top: '48%' },
    { key: 'RM_0',   slot: 'RM',   left: '88%', top: '45%' },
    { key: 'LCF_0',  slot: 'LCF',  left: '35%', top: '25%' },
    { key: 'RCF_0',  slot: 'RCF',  left: '65%', top: '25%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '10%' },
  ],
  '3-1-4-2': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '25%', top: '75%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '78%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '75%', top: '75%' },
    { key: 'CDM_0',  slot: 'CDM',  left: '50%', top: '60%' },
    { key: 'LM_0',   slot: 'LM',   left: '12%', top: '40%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '35%', top: '42%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '65%', top: '42%' },
    { key: 'RM_0',   slot: 'RM',   left: '88%', top: '40%' },
    { key: 'LST_0',  slot: 'LST',  left: '40%', top: '12%' },
    { key: 'RST_0',  slot: 'RST',  left: '60%', top: '12%' },
  ],
  '3-4-3': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '25%', top: '75%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '78%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '75%', top: '75%' },
    { key: 'LM_0',   slot: 'LM',   left: '12%', top: '48%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '38%', top: '50%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '62%', top: '50%' },
    { key: 'RM_0',   slot: 'RM',   left: '88%', top: '48%' },
    { key: 'LW_0',   slot: 'LW',   left: '20%', top: '18%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '12%' },
    { key: 'RW_0',   slot: 'RW',   left: '80%', top: '18%' },
  ],
  '5-2-1-2': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LWB_0',  slot: 'LWB',  left: '12%', top: '65%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '32%', top: '72%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '75%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '68%', top: '72%' },
    { key: 'RWB_0',  slot: 'RWB',  left: '88%', top: '65%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '38%', top: '48%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '62%', top: '48%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '30%' },
    { key: 'LST_0',  slot: 'LST',  left: '40%', top: '12%' },
    { key: 'RST_0',  slot: 'RST',  left: '60%', top: '12%' },
  ],
  '5-2-2-1': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LWB_0',  slot: 'LWB',  left: '12%', top: '65%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '32%', top: '72%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '75%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '68%', top: '72%' },
    { key: 'RWB_0',  slot: 'RWB',  left: '88%', top: '65%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '38%', top: '48%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '62%', top: '48%' },
    { key: 'LCF_0',  slot: 'LCF',  left: '35%', top: '25%' },
    { key: 'RCF_0',  slot: 'RCF',  left: '65%', top: '25%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '10%' },
  ],
  '5-4-1 Flat': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LWB_0',  slot: 'LWB',  left: '12%', top: '65%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '32%', top: '72%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '75%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '68%', top: '72%' },
    { key: 'RWB_0',  slot: 'RWB',  left: '88%', top: '65%' },
    { key: 'LM_0',   slot: 'LM',   left: '15%', top: '42%' },
    { key: 'LCM_0',  slot: 'LCM',  left: '38%', top: '45%' },
    { key: 'RCM_0',  slot: 'RCM',  left: '62%', top: '45%' },
    { key: 'RM_0',   slot: 'RM',   left: '85%', top: '42%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '15%' },
  ],
  '5-4-1 Diamond': [
    { key: 'GK_0',   slot: 'GK',   left: '50%', top: '90%' },
    { key: 'LWB_0',  slot: 'LWB',  left: '12%', top: '65%' },
    { key: 'LCB_0',  slot: 'LCB',  left: '32%', top: '72%' },
    { key: 'CB_0',   slot: 'CB',   left: '50%', top: '75%' },
    { key: 'RCB_0',  slot: 'RCB',  left: '68%', top: '72%' },
    { key: 'RWB_0',  slot: 'RWB',  left: '88%', top: '65%' },
    { key: 'CDM_0',  slot: 'CDM',  left: '50%', top: '55%' },
    { key: 'LM_0',   slot: 'LM',   left: '15%', top: '40%' },
    { key: 'RM_0',   slot: 'RM',   left: '85%', top: '40%' },
    { key: 'CAM_0',  slot: 'CAM',  left: '50%', top: '28%' },
    { key: 'ST_0',   slot: 'ST',   left: '50%', top: '12%' },
  ],
}

// ── Position compatibility ─────────────────────────────────────────────────

function isCompatibleForSlot(player, slotType, formation) {
  const pos = player.api_position || player.position || 'CM'
  // In 3-back formations the wide mid slots are wing-back roles, not winger roles
  if ((slotType === 'LM' || slotType === 'RM') &&
      ([
        '3-5-2','3-4-1-2','3-4-2-1','3-1-4-2','3-4-3',
        '5-3-2','5-2-1-2','5-2-2-1','5-4-1 Flat','5-4-1 Diamond'
      ].includes(formation)) &&
      ['LB', 'RB', 'LWB', 'RWB'].includes(pos)) return true
  const COMPAT = {
    GK:  ['GK'],
    LB:  ['LB', 'LWB', 'CB', 'RB', 'RWB'],
    RB:  ['RB', 'RWB', 'CB', 'LB', 'LWB'],
    CB:  ['CB', 'LB', 'RB', 'CDM', 'CM'],
    LWB: ['LWB', 'LB', 'RB', 'LM', 'CM', 'CDM', 'RWB'],
    RWB: ['RWB', 'RB', 'LB', 'RM', 'CM', 'CDM', 'LWB'],
    CDM: ['CDM', 'CM', 'CB', 'CAM'],
    CM:  ['CM', 'CDM', 'CAM', 'LM', 'RM'],
    LM:  ['LM', 'LW', 'CM', 'CDM', 'LWB', 'RM'],
    RM:  ['RM', 'RW', 'CM', 'CDM', 'RWB', 'LM'],
    CAM: ['CAM', 'CM', 'LW', 'RW', 'CDM', 'ST', 'CF'],
    LAM: ['LAM', 'CAM', 'LW', 'CM'],
    RAM: ['RAM', 'CAM', 'RW', 'CM'],
    LW:  ['LW', 'LM', 'CAM', 'ST', 'RW'],
    RW:  ['RW', 'RM', 'CAM', 'ST', 'LW'],
    ST:  ['ST', 'CF', 'LW', 'RW', 'CAM'],
    CF:   ['CF', 'ST', 'CAM', 'LW', 'RW'],
    LCB:  ['CB', 'LB', 'RB', 'CDM', 'CM'],
    RCB:  ['CB', 'LB', 'RB', 'CDM', 'CM'],
    LCM:  ['CM', 'CDM', 'CAM', 'LM', 'RM'],
    RCM:  ['CM', 'CDM', 'CAM', 'LM', 'RM'],
    LDM:  ['CDM', 'CM', 'CB', 'LB', 'RB'],
    RDM:  ['CDM', 'CM', 'CB', 'LB', 'RB'],
    LCAM: ['CAM', 'CM', 'CDM', 'LM', 'RM', 'LW', 'RW'],
    RCAM: ['CAM', 'CM', 'CDM', 'LM', 'RM', 'LW', 'RW'],
    LCDM: ['CDM', 'CM', 'CB', 'LB', 'RB'],
    RCDM: ['CDM', 'CM', 'CB', 'LB', 'RB'],
    LCF:  ['CF', 'ST', 'CAM', 'LW', 'RW', 'SS'],
    RCF:  ['CF', 'ST', 'CAM', 'LW', 'RW', 'SS'],
    LST:  ['ST', 'CF', 'LW', 'RW', 'CAM', 'SS'],
    RST:  ['ST', 'CF', 'LW', 'RW', 'CAM', 'SS'],
  }
  if (slotType === 'GK') return pos === 'GK'
  if (pos === 'GK') return slotType === 'GK'
  const allowed = COMPAT[slotType] || [slotType]
  return allowed.includes(pos)
}

// ── Match Strategy Hub helpers ────────────────────────────────────────────

function getArchetype(player) {
  const pos = player.api_position || player.position || 'CM'
  if (pos === 'GK')  return 'Shot-stopper'
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'Defensive cover'
  if (pos === 'CDM') return 'Defensive screen'
  if (['LM', 'RM'].includes(pos))  return 'Width'
  if (['CM'].includes(pos))        return 'Energy injection'
  if (['CAM', 'LAM', 'RAM'].includes(pos)) return 'Creative spark'
  if (['LW', 'RW'].includes(pos))  return 'Width'
  if (['ST', 'CF', 'SS'].includes(pos)) return 'Attacking threat'
  return 'Tactical change'
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Planner() {
  const { selectedTeam, fetchSquad } = useTeam()
  const navigate = useNavigate()
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
  const [activeTab,    setActiveTab]    = useState('strategy')
  const [selectedComp, setSelectedComp] = useState(domesticComps[0]?.code || 'PL')

  useEffect(() => {
    if (domesticComps.length > 0) setSelectedComp(domesticComps[0].code)
    setSelectedCompetition(null)
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
  const [playerStatuses, setPlayerStatuses] = useState(() => {
    if (!teamId) return {}
    try { return JSON.parse(localStorage.getItem(`subhub_player_statuses_${teamId}`)) || {} } catch { return {} }
  })

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

  // Persist full status map per team so all flags survive refresh
  useEffect(() => {
    if (!teamId) return
    try { localStorage.setItem(`subhub_player_statuses_${teamId}`, JSON.stringify(playerStatuses)) } catch {}
  }, [teamId, playerStatuses])

  useEffect(() => {
    if (!teamId) return
    try {
      const stored = localStorage.getItem(`subhub_player_statuses_${teamId}`)
      setPlayerStatuses(stored ? JSON.parse(stored) : {})
    } catch { setPlayerStatuses({}) }
  }, [teamId])

  // ── Auto-evict injured/suspended from builtXI when statuses change ────────
  useEffect(() => {
    const removed = []
    const next = {}
    let changed = false
    for (const [key, player] of Object.entries(builtXI)) {
      const s = player ? getStatus(player.name) : null
      if (player && (s === 'injured' || s === 'suspended')) {
        next[key] = null
        changed = true
        removed.push(player.short_name || player.name)
      } else {
        next[key] = player
      }
    }
    if (changed) {
      setBuiltXI(next)
      removed.forEach(name => showToast(`Player removed — ${name} is unavailable`))
    }
    // Intentionally depends only on playerStatuses — fires when flags change, not on every XI edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerStatuses])

  // ── Squad Manager / Toast ────────────────────────────────────────────────
  const [showSquadManager, setShowSquadManager] = useState(false)
  const [savedSquads,      setSavedSquads]      = useState(() =>
    getSavedSquads().filter(s => s.teamId === selectedTeam?.id)
  )

  useEffect(() => {
    setSavedSquads(getSavedSquads().filter(s => s.teamId === selectedTeam?.id))
  }, [selectedTeam?.id])
  const [toast,            setToast]            = useState(null)
  const [renamingId,       setRenamingId]       = useState(null)
  const [renameValue,      setRenameValue]      = useState('')
  const renameInputRef = useRef(null)

  function commitRename(id) {
    const trimmed = renameValue.trim()
    if (trimmed) {
      updateSquad(id, { name: trimmed })
      setSavedSquads(getSavedSquads().filter(s => s.teamId === selectedTeam?.id))
    }
    setRenamingId(null)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── XI Builder state ─────────────────────────────────────────────────────
  const [builderFormation, setBuilderFormation] = useState('4-3-3')
  const [builtXI,          setBuiltXI]          = useState({})
  const [builtBench,       setBuiltBench]       = useState([])
  const [draggedPlayer,    setDraggedPlayer]    = useState(null)
  const [bslSearch,        setBslSearch]        = useState('')
  const [bslFilter,        setBslFilter]        = useState('ALL')

  const placedPlayerNames = useMemo(() =>
    Object.values(builtXI).filter(Boolean).map(p => p.name),
    [builtXI]
  )

  const builtBenchKeys = useMemo(() =>
    new Set(builtBench.map(p => p.id ?? p.name)),
    [builtBench]
  )

  const availablePlayers = useMemo(() =>
    fullSquad.filter(p =>
      !placedPlayerNames.includes(p.name) &&
      !excludedPlayers.includes(p.name) &&
      !builtBenchKeys.has(p.id ?? p.name)
    ),
    [fullSquad, placedPlayerNames, excludedPlayers, builtBenchKeys]
  )

  // Builder pool includes injured/suspended so they appear greyed-out (bench pool still uses availablePlayers)
  const builderPoolAll = useMemo(() =>
    fullSquad.filter(p =>
      !placedPlayerNames.includes(p.name) &&
      !builtBenchKeys.has(p.id ?? p.name)
    ),
    [fullSquad, placedPlayerNames, builtBenchKeys]
  )

  const placedCount = Object.values(builtXI).filter(Boolean).length

  // Doubtful players currently in the starting XI
  const doubtfulInXI = useMemo(() =>
    Object.values(builtXI)
      .filter(p => p && getStatus(p.name) === 'doubtful')
      .map(p => p.short_name || p.name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builtXI, playerStatuses]
  )

  // ── Match Strategy Hub state ──────────────────────────────────────────────
  // Opponent DNA selector
  const [opponentTeam,      setOpponentTeam]      = useState(null)   // { id, name, shortName }
  const [opponentDNA,       setOpponentDNA]       = useState(null)   // full DNA profile
  const [opponentDNALoading, setOpponentDNALoading] = useState(false)
  const [opponentDNAError,  setOpponentDNAError]  = useState(null)
  const [showDNAOverride,   setShowDNAOverride]   = useState(false)
  const [opponentManualKey, setOpponentManualKey] = useState('')     // manual override key
  const [selectedCompetition, setSelectedCompetition] = useState(null)
  const [competitionTeams,    setCompetitionTeams]    = useState([])
  const [teamsLoading,        setTeamsLoading]        = useState(false)

  // Key matchup players
  const [keyMatchupPlayers, setKeyMatchupPlayers] = useState([])
  const [keyMatchupLoading, setKeyMatchupLoading] = useState(false)

  // Fetch teams for the selected opponent competition
  useEffect(() => {
    const apiKey = COMP_TO_API_KEY[selectedCompetition]
    if (!selectedCompetition || !apiKey) { setCompetitionTeams([]); return }
    setTeamsLoading(true)
    fetch(`/api/teams-by-competition?competition=${apiKey}`)
      .then(r => r.json())
      .then(setCompetitionTeams)
      .catch(() => setCompetitionTeams([]))
      .finally(() => setTeamsLoading(false))
  }, [selectedCompetition])

  // Fetch DNA whenever opponent team changes
  useEffect(() => {
    if (!opponentTeam) { setOpponentDNA(null); setOpponentDNAError(null); return }
    setOpponentDNALoading(true)
    setOpponentDNAError(null)
    fetch(`/api/opponent-dna?team=${encodeURIComponent(opponentTeam.name)}`)
      .then(r => r.json())
      .then(data => {
        if (data.detail) {
          setOpponentDNAError('Opponent DNA unavailable')
          setOpponentDNA(null)
        } else {
          setOpponentDNA(data)
        }
      })
      .catch(() => setOpponentDNAError('Opponent DNA unavailable'))
      .finally(() => setOpponentDNALoading(false))
  }, [opponentTeam])

  // Persist full match plan to localStorage — triggered by any planning change
  useEffect(() => {
    if (!teamId) return
    try {
      // Read-merge-write: never wipe a field that hasn't changed this render
      const current = (() => {
        try { return JSON.parse(localStorage.getItem('subhub_match_plan') || '{}') } catch { return {} }
      })()

      const xiEntries = Object.entries(builtXI).filter(([, p]) => p)
      const xi = xiEntries.map(([key, player]) => {
        const slotDef = BUILDER_SLOTS[builderFormation].find(s => s.key === key)
        return { ...player, assigned_slot: slotDef?.slot || player.api_position, minute_entered: 0 }
      })

      const plan = {
        ...current,
        team:        teamId,
        teamName:    teamName ?? current.teamName ?? '',
        savedAt:     new Date().toISOString(),
        opponentDNA: opponentDNA ?? current.opponentDNA ?? null,
        key_players: keyMatchupPlayers.length > 0
          ? keyMatchupPlayers.map(p => ({ name: p.name, position: p.position, reason: p.reason }))
          : (current.key_players ?? []),
        xi:          xi.length === 11 ? xi : (current.xi ?? []),
        bench:       builtBench.length > 0 ? builtBench : (current.bench ?? []),
        formation:   builderFormation,
      }

      localStorage.setItem('subhub_match_plan', JSON.stringify(plan))
      console.log('[SubHub] subhub_match_plan saved:', plan)
    } catch {}
  }, [teamId, teamName, opponentDNA, keyMatchupPlayers, builtXI, builtBench, builderFormation])

  // Effective opponent playstyle key: manual override → DNA → null
  const effectiveOpponentStyle = showDNAOverride && opponentManualKey
    ? opponentManualKey
    : (opponentDNA?.playstyle_key ?? null)

  // Fetch key matchup players when opponent DNA resolves
  useEffect(() => {
    if (!opponentDNA || !teamName) { setKeyMatchupPlayers([]); return }
    setKeyMatchupLoading(true)
    fetch(`/api/key-matchup-players?team=${encodeURIComponent(teamName)}&opponent=${encodeURIComponent(opponentDNA.team)}`)
      .then(r => r.json())
      .then(data => setKeyMatchupPlayers(Array.isArray(data) ? data : []))
      .catch(() => setKeyMatchupPlayers([]))
      .finally(() => setKeyMatchupLoading(false))
  }, [opponentDNA, teamName])

  // ── Competition theme ────────────────────────────────────────────────────
  const theme = COMPETITION_THEMES[selectedComp] || DEFAULT_THEME

  const uclStars = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id:    i,
      left:  `${5 + (i * 47 + 13) % 88}%`,
      top:   `${5 + (i * 61 + 7) % 88}%`,
      delay: `${((i * 370) % 2000) / 1000}s`,
      size:  i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
    })),
    []
  )

  function buildXIFromBuilder() {
    return Object.entries(builtXI)
      .filter(([, p]) => p !== null && p !== undefined)
      .map(([key, player]) => {
        const slotDef = BUILDER_SLOTS[builderFormation].find(s => s.key === key)
        return { ...player, assigned_slot: slotDef?.slot || player.api_position, minute_entered: 0 }
      })
  }

  const toggleBuiltBench = (player) => {
    setBuiltBench(prev => {
      const key = player.id ?? player.name
      const already = prev.some(p => (p.id ?? p.name) === key)
      if (already) return prev.filter(p => (p.id ?? p.name) !== key)
      if (prev.length >= 7) return prev
      return [...prev, player]
    })
  }

  const handleLoadIntoConsole = () => {
    const xi = buildXIFromBuilder()
    if (xi.length < 11) return

    navigate(`/match/${teamId}`, {
      state: {
        confirmedXI:       xi,
        confirmedBench:    builtBench,
        confirmedReserves: [],
        formation:         builderFormation,
        playstyle:         null,
        competition:       selectedComp || null,
        teamId,
        excludedPlayerIds: [],
      },
    })
  }

  const handleSaveSquad = () => {
    const xi = buildXIFromBuilder()
    if (xi.length < 11) {
      showToast('Build a complete XI before saving')
      return
    }
    const teamSquads = getSavedSquads().filter(s => s.teamId === selectedTeam?.id)
    if (teamSquads.length >= 12) {
      setShowSquadManager(true)
      showToast('Squad limit reached for this team — remove one to save a new squad')
      return
    }
    const name = window.prompt('Name this concept squad (e.g. "UCL High Press"):')
    if (!name) return

    const result = saveSquad({
      name,
      competition: selectedComp || 'League',
      formation:   builderFormation,
      playstyle:   null,
      xi,
      bench:       builtBench,
      teamId,
      teamName:    selectedTeam?.name || '',
    })
    if (result.success) {
      setSavedSquads(getSavedSquads().filter(s => s.teamId === selectedTeam?.id))
      showToast(`✓ "${name}" saved`)
    }
  }

  const handleLoadSavedSquad = (squad) => {
    setShowSquadManager(false)
    navigate(`/match/${squad.teamId || teamId}`, {
      state: {
        confirmedXI:       squad.xi,
        confirmedBench:    squad.bench ?? [],
        confirmedReserves: [],
        formation:         squad.formation,
        playstyle:         squad.playstyle || null,
        competition:       squad.competition || null,
        teamId:            squad.teamId || teamId,
        excludedPlayerIds: [],
      },
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="planner-page"
      data-comp={selectedComp}
      style={{
        '--comp-primary':     theme.primary,
        '--comp-accent':      theme.accent,
        '--comp-cardBorder':  theme.cardBorder,
        '--comp-cardBg':      theme.cardBg,
        '--comp-cardGlow':    theme.cardGlow,
        '--comp-pitchTint':   theme.pitchTint,
        '--comp-textAccent':  theme.textAccent,
        '--comp-pillActive':  theme.pillActive,
        '--comp-pillBorder':  theme.pillBorder,
        background: `radial-gradient(ellipse at 50% 0%, ${theme.primary} 0%, #060a08 60%)`,
        transition: 'background 0.4s ease',
      }}
    >

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

        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <button
            onClick={() => { setSavedSquads(getSavedSquads()); setShowSquadManager(true) }}
            style={{
              background: 'rgba(200,150,60,0.1)', border: '1px solid rgba(200,150,60,0.45)',
              borderRadius: 6, color: '#c8963e', fontFamily: 'Rajdhani', fontWeight: 700,
              fontSize: 11, letterSpacing: '0.1em', padding: '5px 12px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            📂 MY SAVED SQUADS ({getSavedSquads().filter(s => s.teamId === selectedTeam?.id).length}/12)
          </button>
        </div>

      </div>

      {/* TAB NAVIGATION */}
      <div className="planner-tabs">
        <button
          className={`planner-tab ${activeTab === 'strategy' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategy')}
        >
          MATCH STRATEGY HUB
        </button>
        <button
          className={`planner-tab ${activeTab === 'readiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          SQUAD READINESS
        </button>
        <button
          className={`planner-tab ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          XI BUILDER
        </button>
      </div>

      {/* VIBE BANNER */}
      <div className="comp-vibe-banner">
        <span className="comp-vibe-label">{theme.label}</span>
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
                  <span><span className="slb-dot" style={{ background: '#00ff87' }} />Available</span>
                  <span><span className="slb-dot" style={{ background: '#ff3d3d' }} />Injured</span>
                  <span><span className="slb-dot" style={{ background: '#ffb800' }} />Doubtful</span>
                  <span><span className="slb-dot" style={{ background: '#ff8c00' }} />Suspended</span>
                  <span><span className="slb-dot" style={{ background: '#3d9fff' }} />Managed mins</span>
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
                    onClick={() => { setBuilderFormation(f); setBuiltXI({}); setBuiltBench([]) }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="builder-actions">
                <button className="builder-clear-btn" onClick={() => { setBuiltXI({}); setBuiltBench([]) }}>
                  Clear XI
                </button>
                <button
                  className="builder-load-btn"
                  disabled={placedCount < 11}
                  onClick={handleLoadIntoConsole}
                >
                  ⚡ Load into Console
                </button>
                <button
                  className="builder-load-btn"
                  disabled={placedCount < 11}
                  onClick={handleSaveSquad}
                  style={{ background: 'rgba(200,150,60,0.12)', borderColor: 'rgba(200,150,60,0.5)', color: '#c8963e' }}
                >
                  💾 Save Squad
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

            {/* Doubtful warning banner */}
            {doubtfulInXI.length > 0 && (
              <div className="builder-doubtful-warning">
                {doubtfulInXI.length} doubtful player{doubtfulInXI.length > 1 ? 's' : ''} in your starting XI — confirm you want to proceed
              </div>
            )}

            {/* Main layout */}
            <div className="builder-layout">

              {/* LEFT — Pitch */}
              <div className="builder-pitch-wrapper">
                <div className="builder-pitch">
                  {selectedComp === 'UCL' && (
                    <div className="ucl-stars" aria-hidden="true">
                      {uclStars.map(s => (
                        <div
                          key={s.id}
                          className="ucl-star"
                          style={{
                            left:           s.left,
                            top:            s.top,
                            width:          s.size,
                            height:         s.size,
                            animationDelay: s.delay,
                          }}
                        />
                      ))}
                    </div>
                  )}
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
                          const dpStatus = getStatus(draggedPlayer.name)
                          if (dpStatus === 'injured' || dpStatus === 'suspended') { setDraggedPlayer(null); return }
                          if (!isCompatibleForSlot(draggedPlayer, slotDef.slot, builderFormation)) {
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
                  {builderPoolAll
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
                    .map(player => {
                      const status    = getStatus(player.name)
                      const isBlocked = status === 'injured' || status === 'suspended'
                      const isDoubtful = status === 'doubtful'
                      return (
                        <div
                          key={player.name}
                          className={`bsl-player-row${isBlocked ? ' bsl-blocked' : ''}${isDoubtful ? ' bsl-doubtful' : ''}`}
                          draggable={!isBlocked}
                          onDragStart={isBlocked ? undefined : () => setDraggedPlayer(player)}
                        >
                          <span className="bsl-pos">{player.api_position}</span>
                          <span className="bsl-name">{player.short_name || player.name}</span>
                          <span className="bsl-ovr">{player.overall}</span>
                          {isBlocked && (
                            <span className="bsl-avail-badge bsl-badge-blocked">
                              {status === 'injured' ? 'Injured' : 'Suspended'}
                            </span>
                          )}
                          {isDoubtful && (
                            <span className="bsl-avail-badge bsl-badge-doubtful">Doubtful</span>
                          )}
                        </div>
                      )
                    })
                  }
                </div>
              </div>

            </div>

            {/* ── BENCH SELECTION (shown once XI is complete) ── */}
            {placedCount === 11 && (
              <div className="builder-bench-section">
                <div className="builder-bench-header">
                  <span className="builder-bench-title">BENCH</span>
                  <span className="builder-bench-count">{builtBench.length}/7</span>
                  <span className="builder-bench-hint">Click to add — max 7, no XI players</span>
                </div>

                {builtBench.length > 0 && (
                  <div className="builder-bench-selected">
                    {builtBench.map(p => (
                      <div
                        key={p.id ?? p.name}
                        className="builder-bench-chip"
                        onClick={() => toggleBuiltBench(p)}
                        title="Click to remove"
                      >
                        <span className="bbc-pos">{p.api_position}</span>
                        <span className="bbc-name">{getSurname(p.short_name || p.name)}</span>
                        <span className="bbc-remove">×</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="builder-bench-pool">
                  {availablePlayers
                    .map(p => (
                      <div
                        key={p.id ?? p.name}
                        className={`builder-bench-row${builtBench.length >= 7 ? ' disabled' : ''}`}
                        onClick={() => toggleBuiltBench(p)}
                      >
                        <span className="bbl-pos">{p.api_position}</span>
                        <span className="bbl-name">{p.short_name || p.name}</span>
                        <span className="bbl-ovr">{p.overall}</span>
                        <span className="bbl-add">+</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MATCH STRATEGY HUB ── */}
        {activeTab === 'strategy' && (
          <div className="tab-strategy">

            <div className="strategy-header">
              <div className="strategy-title">
                <h2>MATCH STRATEGY HUB</h2>
                <p>Select opponent to analyse key matchup players and tactical DNA.</p>
              </div>
            </div>

            {/* ── Opponent DNA Selector ── */}
            <div className="opp-playstyle-bar" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>

              {/* Competition filter — derived from same domesticComps + uefaComps as the header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="opp-playstyle-label">Competition</span>
                <div className="competition-pills">
                  {[...domesticComps, ...uefaComps].map(comp => (
                    <button
                      key={comp.code}
                      className={`comp-pill ${selectedCompetition === comp.code ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCompetition(p => p === comp.code ? null : comp.code)
                        setOpponentTeam(null)
                        setShowDNAOverride(false)
                        setOpponentManualKey('')
                      }}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opponent dropdown — only populated once a competition is chosen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="opp-playstyle-label">Opponent</span>
                <div style={{ position: 'relative', minWidth: 200 }}>
                  <select
                    value={opponentTeam?.name ?? ''}
                    onChange={e => {
                      const t = competitionTeams.find(x => x.name === e.target.value)
                      setOpponentTeam(t ?? null)
                      setShowDNAOverride(false)
                      setOpponentManualKey('')
                    }}
                    disabled={!selectedCompetition}
                    style={{
                      width: '100%',
                      appearance: 'none', WebkitAppearance: 'none',
                      background: 'rgba(255,255,255,0.04)',
                      color: selectedCompetition ? 'var(--text)' : 'var(--muted)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 4,
                      padding: '5px 30px 5px 10px',
                      fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13,
                      cursor: selectedCompetition ? 'pointer' : 'default',
                      outline: 'none',
                      opacity: selectedCompetition ? 1 : 0.5,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => { if (selectedCompetition) e.target.style.borderColor = 'rgba(255,255,255,0.28)' }}
                    onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
                  >
                    <option value="">
                      {!selectedCompetition
                        ? 'Select a competition first'
                        : teamsLoading
                        ? 'Loading teams…'
                        : '— Select opponent —'
                      }
                    </option>
                    {competitionTeams.map(t => (
                      <option key={t.fc26_club} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 10 6" width="10" height="6"
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      pointerEvents: 'none', opacity: selectedCompetition ? 0.5 : 0.25,
                    }}
                  >
                    <path d="M0 0l5 6 5-6z" fill="currentColor" />
                  </svg>
                </div>
                {opponentDNALoading && (
                  <span style={{ color: 'var(--muted)', fontFamily: 'Rajdhani', fontSize: 12 }}>Fetching DNA…</span>
                )}
              </div>

              {/* DNA unavailable notice */}
              {opponentDNAError && (
                <span style={{ color: 'var(--amber)', fontFamily: 'Rajdhani', fontSize: 12 }}>
                  {opponentDNAError}
                </span>
              )}

              {/* Compact DNA card */}
              {opponentDNA && !opponentDNAError && (
                <div className="opp-dna-card">
                  <div className="opp-dna-header">
                    <span className="opp-dna-title">OPPONENT DNA — {opponentDNA.team}</span>
                    <button
                      className="opp-dna-override-toggle"
                      onClick={() => setShowDNAOverride(v => !v)}
                    >
                      {showDNAOverride ? 'Use DNA' : 'Override'}
                    </button>
                  </div>

                  {showDNAOverride ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ color: 'var(--muted)', fontFamily: 'Rajdhani', fontSize: 12 }}>Manual style:</span>
                      <select
                        value={opponentManualKey}
                        onChange={e => setOpponentManualKey(e.target.value)}
                        style={{
                          background: '#1a1a1a', color: 'var(--text)',
                          border: '1px solid rgba(255,184,0,0.4)', borderRadius: 4,
                          padding: '3px 6px', fontFamily: 'Rajdhani', fontSize: 12,
                          cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="">None</option>
                        <option value="high_line_press">High-Line Press</option>
                        <option value="deep_block">Deep Block</option>
                        <option value="counter_attack">Counter Attack</option>
                        <option value="elite_wingers">Elite Wingers</option>
                        <option value="physical_dominance">Physical Dominance</option>
                      </select>
                    </div>
                  ) : (
                    <div className="opp-dna-rows">
                      <div className="opp-dna-row">
                        <span className="opp-dna-label">Playstyle</span>
                        <span className="opp-dna-value opp-dna-playstyle">{opponentDNA.playstyle}</span>
                      </div>
                      <div className="opp-dna-row">
                        <span className="opp-dna-label">Press Intensity</span>
                        <span className="opp-dna-value">{opponentDNA.press_intensity}</span>
                      </div>
                      <div className="opp-dna-row">
                        <span className="opp-dna-label">Pace Threat</span>
                        <span className="opp-dna-value">{opponentDNA.pace_threat}</span>
                      </div>
                      <div className="opp-dna-row">
                        <span className="opp-dna-label">Creative Threat</span>
                        <span className="opp-dna-value">{opponentDNA.creative_threat}</span>
                      </div>
                      <div className="opp-dna-row">
                        <span className="opp-dna-label">Physical Dominance</span>
                        <span className="opp-dna-value">{opponentDNA.physical_dominance}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cold state — no opponent selected yet */}
            {!opponentTeam && (
              <span style={{
                fontFamily: 'Rajdhani', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em',
                textTransform: 'uppercase', display: 'block', marginTop: 8,
              }}>
                Select your next opponent to begin
              </span>
            )}

            {/* Key matchup players — shown once opponent is selected */}
            {opponentTeam && keyMatchupLoading && (
              <span style={{ fontFamily: 'Rajdhani', fontSize: 12, color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginTop: 8 }}>
                Analysing matchup…
              </span>
            )}
            {opponentTeam && !keyMatchupLoading && keyMatchupPlayers.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11,
                  color: 'rgba(255,184,0,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase',
                  marginBottom: 10 }}>
                  KEY PLAYERS VS {opponentDNA?.team?.toUpperCase() ?? 'OPPONENT'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {keyMatchupPlayers.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12,
                      background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.2)',
                      borderRadius: 6, padding: '8px 12px' }}>
                      <div style={{ width: 4, height: 36, background: 'rgba(255,184,0,0.6)',
                        borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
                          color: 'var(--text)' }}>{p.name}</div>
                        <div style={{ fontFamily: 'Rajdhani', fontSize: 11, color: 'var(--muted)',
                          marginTop: 2 }}>{p.reason}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12,
                          color: 'rgba(255,184,0,0.8)' }}>{p.overall}</span>
                        <span style={{ fontFamily: 'Rajdhani', fontSize: 10, color: 'var(--muted)',
                          letterSpacing: '0.06em' }}>{p.position}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {/* ── Squad Manager Modal ── */}
      {showSquadManager && (
        <div
          onClick={() => setShowSquadManager(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a0e08', border: '1.5px solid #c8963e',
              borderRadius: 12, padding: 24, maxWidth: 860, width: '100%',
              maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 18, color: '#c8963e', letterSpacing: '0.12em' }}>
                MY SAVED SQUADS
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {savedSquads.length >= 12 && (
                  <span style={{ fontFamily: 'Rajdhani', fontSize: 11, color: '#ff3d3d', fontWeight: 700 }}>
                    12/12 squads saved — delete one to save a new squad
                  </span>
                )}
                <button
                  onClick={() => setShowSquadManager(false)}
                  style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
                    color: 'var(--muted)', fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 700,
                    cursor: 'pointer', padding: '3px 9px', letterSpacing: '0.06em',
                  }}
                >✕ CLOSE</button>
              </div>
            </div>

            {/* 12-slot grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {Array.from({ length: 12 }).map((_, i) => {
                const squad     = savedSquads[i]
                const compTheme = COMPETITION_THEMES[squad?.competition] || DEFAULT_THEME
                if (!squad) {
                  return (
                    <div key={i} style={{
                      border: '1px dashed rgba(200,150,60,0.22)', borderRadius: 8,
                      height: 135, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(200,150,60,0.22)', fontSize: 28,
                    }}>+</div>
                  )
                }
                return (
                  <div key={squad.id} style={{
                    position: 'relative', border: `1px solid ${compTheme.cardBorder || '#c8963e'}`,
                    borderRadius: 8, padding: '10px 10px 40px',
                    background: compTheme.cardBg || 'rgba(20,20,20,0.6)',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    {/* Delete */}
                    <button
                      onClick={() => { deleteSquad(squad.id); setSavedSquads(getSavedSquads().filter(s => s.teamId === selectedTeam?.id)) }}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'rgba(255,61,61,0.8)', border: 'none', borderRadius: 3,
                        color: '#fff', fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700,
                        padding: '2px 5px', cursor: 'pointer',
                      }}
                    >✕</button>
                    {renamingId === squad.id ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(squad.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); commitRename(squad.id) }
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        autoFocus
                        style={{
                          fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 13,
                          color: compTheme.textAccent || '#c8963e', lineHeight: 1.2,
                          background: 'rgba(255,255,255,0.07)',
                          border: `1px solid ${compTheme.cardBorder || '#c8963e'}`,
                          borderRadius: 3, padding: '2px 5px', width: '100%',
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <div
                        onDoubleClick={() => { setRenamingId(squad.id); setRenameValue(squad.name) }}
                        title="Double-click to rename"
                        style={{
                          fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 13,
                          color: compTheme.textAccent || '#c8963e', lineHeight: 1.2,
                          paddingRight: 18, cursor: 'text',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        {squad.name}
                        <span style={{ fontSize: 9, opacity: 0.4, flexShrink: 0 }}>✎</span>
                      </div>
                    )}
                    <div style={{ fontFamily: 'Rajdhani', fontSize: 10, color: 'var(--muted)' }}>
                      {squad.teamName || '—'}
                    </div>
                    <div style={{ fontFamily: 'Rajdhani', fontSize: 10, color: compTheme.accent || '#c8963e', fontWeight: 600 }}>
                      {squad.competition} · {squad.formation}
                    </div>
                    <div style={{ fontFamily: 'Rajdhani', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(squad.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                    {/* Load */}
                    <button
                      onClick={() => handleLoadSavedSquad(squad)}
                      style={{
                        position: 'absolute', bottom: 6, left: 6, right: 6,
                        background: 'rgba(200,150,60,0.15)', border: '1px solid #c8963e',
                        borderRadius: 4, color: '#c8963e', fontSize: 10,
                        fontFamily: 'Rajdhani', fontWeight: 700, padding: '5px 0',
                        cursor: 'pointer', letterSpacing: '0.08em',
                      }}
                    >⚡ LOAD INTO CONSOLE</button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,14,8,0.95)', border: '1px solid rgba(200,150,60,0.5)',
          borderRadius: 8, padding: '10px 20px', zIndex: 2000,
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, color: '#c8963e',
          letterSpacing: '0.06em', pointerEvents: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          {toast}
        </div>
      )}

    </div>
  )
}
