/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import { getSavedSquads, saveSquad, deleteSquad } from '../utils/squadStorage'
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
}

// ── Position compatibility ─────────────────────────────────────────────────

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

// ── Sub Doctrine helpers ───────────────────────────────────────────────────

const SCENARIOS = {
  winning2: 'Winning by 2+',
  winning1: 'Winning by 1',
  drawing:  'Drawing',
  losing1:  'Losing by 1',
  losing2:  'Losing by 2+',
}

const SCENARIO_TO_COL = {
  winning2: 'winning',
  winning1: 'winning',
  drawing:  'drawing',
  losing1:  'losing',
  losing2:  'losing',
}

const DOC_POS_GROUP = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF',
  CDM: 'MID', CM: 'MID', LM: 'MID', RM: 'MID',
  CAM: 'MID', LAM: 'MID', RAM: 'MID',
  LW: 'ATT', RW: 'ATT', ST: 'ATT', CF: 'ATT', SS: 'ATT',
}

function getCompatibility(offPlayer, onPlayer) {
  if (!offPlayer || !onPlayer) return null
  const offPos = offPlayer.assigned_slot || offPlayer.api_position || 'CM'
  const onPos  = onPlayer.api_position  || onPlayer.position       || 'CM'
  const og = DOC_POS_GROUP[offPos] || 'MID'
  const ig = DOC_POS_GROUP[onPos]  || 'MID'
  if (og === 'GK' || ig === 'GK')
    return og === ig
      ? { symbol: '✓', label: 'Direct match', cls: 'compat-ok' }
      : { symbol: '❌', label: 'Invalid', cls: 'compat-bad' }
  if (og === ig) return { symbol: '✓', label: 'Direct match', cls: 'compat-ok' }
  const adj = (og === 'DEF' && ig === 'MID') || (og === 'MID' && ig === 'DEF') ||
              (og === 'MID' && ig === 'ATT') || (og === 'ATT' && ig === 'MID')
  return adj
    ? { symbol: '⚠', label: 'Stretched', cls: 'compat-warn' }
    : { symbol: '❌', label: 'Invalid',   cls: 'compat-bad' }
}

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

function getImpactScore(player) {
  return Math.min(99, Math.round((player.overall || 75) * 0.6 + 30))
}

const PRINT_SLOT_ORDER = [
  'GK', 'LB', 'LWB', 'CB', 'RCB', 'RB', 'RWB',
  'CDM', 'LM', 'CM', 'RM', 'LAM', 'CAM', 'RAM',
  'LW', 'RW', 'ST', 'CF', 'SS',
]

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

  // ── Squad Manager / Toast ────────────────────────────────────────────────
  const [showSquadManager, setShowSquadManager] = useState(false)
  const [savedSquads,      setSavedSquads]      = useState(() =>
    getSavedSquads().filter(s => s.teamId === selectedTeam?.id)
  )

  useEffect(() => {
    setSavedSquads(getSavedSquads().filter(s => s.teamId === selectedTeam?.id))
  }, [selectedTeam?.id])
  const [toast,            setToast]            = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

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

  // ── Sub Doctrine state ────────────────────────────────────────────────────
  const [docSlots, setDocSlots] = useState([
    { minute: 60, scenario: 'drawing',  subOff: '', subOn: '' },
    { minute: 70, scenario: 'losing1',  subOff: '', subOn: '' },
    { minute: 80, scenario: 'winning2', subOff: '', subOn: '' },
  ])

  const updateDocSlot = (i, field, value) =>
    setDocSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))

  // Active XI for doctrine: builtXI if complete, else startingXI
  const doctrineXI = useMemo(() => {
    const placed = Object.entries(builtXI)
      .filter(([, p]) => p)
      .map(([key, player]) => {
        const slotDef = BUILDER_SLOTS[builderFormation].find(s => s.key === key)
        return { ...player, assigned_slot: slotDef?.slot || player.api_position }
      })
    return placed.length === 11 ? placed : startingXI
  }, [builtXI, builderFormation, startingXI])

  const doctrineBench = useMemo(() =>
    matchdayBench.filter(p => !excludedPlayers.includes(p.name)),
    [matchdayBench, excludedPlayers]
  )

  const doctrineXILabel = Object.values(builtXI).filter(Boolean).length === 11
    ? 'XI Builder lineup'
    : 'default squad lineup'

  const buildPrintContent = () => {
    const sep = '═══════════════════════════════'
    const rows = [
      sep,
      'TACTICAL BRIEFING',
      `${teamName || 'Unknown Team'} vs [Opponent]`,
      `Competition: ${theme.label}`,
      `Formation: ${builderFormation}`,
      sep, '',
      'STARTING XI:',
    ]
    const xiSorted = [...doctrineXI].sort((a, b) => {
      const ai = PRINT_SLOT_ORDER.indexOf(a.assigned_slot || a.api_position)
      const bi = PRINT_SLOT_ORDER.indexOf(b.assigned_slot || b.api_position)
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
    })
    xiSorted.forEach(p =>
      rows.push(`${(p.assigned_slot || p.api_position || '??').padEnd(5)}: ${p.short_name || p.name}`)
    )
    rows.push('', 'PLANNED SUBSTITUTIONS:')
    const filled = docSlots.filter(s => s.subOff && s.subOn)
    if (!filled.length) {
      rows.push('None configured.')
    } else {
      filled.forEach(s => {
        const offP = doctrineXI.find(p => p.name === s.subOff)
        const onP  = doctrineBench.find(p => p.name === s.subOn)
        rows.push(`${s.minute}' — If ${SCENARIOS[s.scenario]}:`)
        rows.push(`  Sub OFF: ${offP?.short_name || s.subOff} (${offP?.assigned_slot || offP?.api_position || '?'})`)
        rows.push(`  Sub ON:  ${onP?.short_name || s.subOn} (${onP?.api_position || '?'}) — Impact: ${onP ? getImpactScore(onP) : '—'}, ${onP ? getArchetype(onP) : '—'}`)
      })
    }
    const injNames  = Object.entries(playerStatuses).filter(([, s]) => s === 'injured').map(([n]) => n)
    const doubNames = Object.entries(playerStatuses).filter(([, s]) => s === 'doubtful').map(([n]) => n)
    rows.push('', 'SQUAD READINESS:')
    rows.push(`Injured:  ${injNames.length  ? injNames.join(', ')  : 'None'}`)
    rows.push(`Doubtful: ${doubNames.length ? doubNames.join(', ') : 'None'}`)
    rows.push('', `Generated by SubHub — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`)
    rows.push(sep)
    return rows.join('\n')
  }

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

  const handleLoadIntoConsole = () => {
    const xi = buildXIFromBuilder()
    if (xi.length < 11) return

    const activeBench = doctrineBench
    const excludedPlayerIds = matchdayBench
      .filter(p => excludedPlayers.includes(p.name))
      .map(p => p.id)

    navigate(`/match/${teamId}`, {
      state: {
        confirmedXI:       xi,
        confirmedBench:    activeBench,
        confirmedReserves: [],
        formation:         builderFormation,
        playstyle:         null,
        competition:       selectedComp || null,
        teamId,
        excludedPlayerIds,
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

    const activeBench = doctrineBench
    const result = saveSquad({
      name,
      competition: selectedComp || 'League',
      formation:   builderFormation,
      playstyle:   null,
      xi,
      bench:       activeBench,
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

            <div className="doctrine-header">
              <div className="doctrine-title">
                <h2>SUB DOCTRINE</h2>
                <p>
                  Plan your 3 substitutions before kickoff.
                  {' '}Using <strong>{doctrineXILabel}</strong>.
                  {doctrineBench.length === 0 && ' — Load a squad first.'}
                </p>
              </div>
            </div>

            {/* ── 3 Sub Slot Cards ── */}
            <div className="doctrine-slots">
              {docSlots.map((slot, i) => {
                const subOffPlayer = doctrineXI.find(p => p.name === slot.subOff)
                const subOnPlayer  = doctrineBench.find(p => p.name === slot.subOn)
                const compat       = getCompatibility(subOffPlayer, subOnPlayer)
                const impact       = subOnPlayer ? getImpactScore(subOnPlayer) : null
                const archetype    = subOnPlayer ? getArchetype(subOnPlayer)   : null

                return (
                  <div key={i} className="doctrine-slot-card">

                    <div className="dsc-header">
                      <span className="dsc-label">SUB {i + 1}</span>
                      <span className="dsc-minute-badge">{slot.minute}'</span>
                    </div>

                    <div className="dsc-controls">

                      {/* Minute slider */}
                      <div className="dsc-field">
                        <label className="dsc-field-label">TRIGGER MINUTE</label>
                        <div className="dsc-slider-row">
                          <input
                            type="range" min="45" max="90"
                            value={slot.minute}
                            className="dsc-slider"
                            onChange={e => updateDocSlot(i, 'minute', Number(e.target.value))}
                          />
                          <span className="dsc-slider-val">{slot.minute}'</span>
                        </div>
                      </div>

                      {/* Scenario */}
                      <div className="dsc-field">
                        <label className="dsc-field-label">SCENARIO</label>
                        <select
                          className="dsc-select"
                          value={slot.scenario}
                          onChange={e => updateDocSlot(i, 'scenario', e.target.value)}
                        >
                          {Object.entries(SCENARIOS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sub OFF / Sub ON row */}
                      <div className="dsc-swap-row">
                        <div className="dsc-field dsc-swap-field">
                          <label className="dsc-field-label">SUB OFF ↓</label>
                          <select
                            className="dsc-select"
                            value={slot.subOff}
                            onChange={e => updateDocSlot(i, 'subOff', e.target.value)}
                          >
                            <option value="">— Select player —</option>
                            {doctrineXI.map(p => (
                              <option key={p.name} value={p.name}>
                                {(p.assigned_slot || p.api_position || '?').padEnd(4)} · {p.short_name || p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="dsc-swap-arrow">⇄</div>

                        <div className="dsc-field dsc-swap-field">
                          <label className="dsc-field-label">SUB ON ↑</label>
                          <select
                            className="dsc-select"
                            value={slot.subOn}
                            onChange={e => updateDocSlot(i, 'subOn', e.target.value)}
                          >
                            <option value="">— Select player —</option>
                            {doctrineBench.map(p => (
                              <option key={p.name} value={p.name}>
                                {(p.api_position || '?').padEnd(4)} · {p.short_name || p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                    </div>

                    {/* Analysis bar */}
                    {slot.subOff && slot.subOn && (
                      <div className="dsc-analysis">
                        {compat && (
                          <span className={`dsc-compat ${compat.cls}`}>
                            {compat.symbol} {compat.label}
                          </span>
                        )}
                        {impact !== null && (
                          <span className="dsc-impact">
                            Expected impact: <strong>{impact}</strong> · {archetype}
                          </span>
                        )}
                      </div>
                    )}

                  </div>
                )
              })}
            </div>

            {/* ── Scenario Preview ── */}
            <div className="doctrine-preview">
              <div className="doctrine-preview-header">SCENARIO PREVIEW</div>
              <div className="scenario-grid">
                {[
                  { col: 'winning', label: 'WINNING', color: '#00ff87' },
                  { col: 'drawing', label: 'DRAWING', color: '#ffb800' },
                  { col: 'losing',  label: 'LOSING',  color: '#ff3d3d' },
                ].map(({ col, label, color }) => {
                  const hits  = docSlots
                    .map((s, i) => ({ ...s, i }))
                    .filter(s => SCENARIO_TO_COL[s.scenario] === col && s.subOff && s.subOn)
                  const delta = col === 'winning' ? '+2–4%' : col === 'drawing' ? '+3–5%' : '+1–3%'
                  return (
                    <div key={col} className="scenario-col">
                      <div className="scenario-col-header" style={{ color, borderColor: color }}>
                        {label}
                      </div>
                      {hits.length === 0 ? (
                        <div className="scenario-no-sub">No sub planned</div>
                      ) : hits.map(s => {
                        const offP = doctrineXI.find(p => p.name === s.subOff)
                        const onP  = doctrineBench.find(p => p.name === s.subOn)
                        return (
                          <div key={s.i} className="scenario-sub-entry">
                            <div className="sse-minute" style={{ color }}>{s.minute}'</div>
                            <div className="sse-players">
                              <span className="sse-off">{offP?.short_name || s.subOff}</span>
                              <span className="sse-arrow">→</span>
                              <span className="sse-on">{onP?.short_name || s.subOn}</span>
                            </div>
                            <div className="sse-delta" style={{ color }}>{delta} win prob</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Export Button ── */}
            <button className="doctrine-export-btn" onClick={() => window.print()}>
              📋 EXPORT TACTICAL BRIEFING
            </button>

            {/* ── Print-only content ── */}
            <div className="tactical-briefing-print">
              <pre className="tbp-content">{buildPrintContent()}</pre>
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
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 13, color: compTheme.textAccent || '#c8963e', lineHeight: 1.2, paddingRight: 18 }}>
                      {squad.name}
                    </div>
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
