import { getYearWeek, getYearMonth } from '../utils/date'

/**
 * Calculate total matches
 * @param {Array} rows 
 * @returns {number}
 */
export function getTotalMatches(rows) {
  return rows.length
}

/**
 * Calculate win rate
 * @param {Array} rows 
 * @returns {number} - Value between 0 and 1
 */
export function getWinRate(rows) {
  if (rows.length === 0) return 0
  const wins = rows.filter(r => r.winner).length
  return wins / rows.length
}

/**
 * Calculate average of a numeric field
 * @param {Array} rows 
 * @param {string} field 
 * @returns {number}
 */
export function getAverage(rows, field) {
  if (rows.length === 0) return 0
  const sum = rows.reduce((acc, row) => acc + (row[field] || 0), 0)
  return sum / rows.length
}

/**
 * Get total of a numeric field
 * @param {Array} rows 
 * @param {string} field 
 * @returns {number}
 */
export function getTotal(rows, field) {
  return rows.reduce((acc, row) => acc + (row[field] || 0), 0)
}

/**
 * Get role distribution (counts and percentages)
 * @param {Array} rows 
 * @returns {Array<{role: string, count: number, percentage: number}>}
 */
export function getRoleDistribution(rows) {
  const counts = {}
  
  for (const row of rows) {
    const role = row.role || 'Unknown'
    counts[role] = (counts[role] || 0) + 1
  }
  
  const total = rows.length || 1
  
  return Object.entries(counts)
    .map(([role, count]) => ({
      role,
      count,
      percentage: count / total
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Group rows by a field and calculate stats
 * @param {Array} rows 
 * @param {string} field 
 * @returns {Map<string, {name: string, matches: number, wins: number, winRate: number}>}
 */
function groupByField(rows, field) {
  const groups = new Map()
  
  for (const row of rows) {
    const key = row[field] || 'Unknown'
    if (!groups.has(key)) {
      groups.set(key, { name: key, matches: 0, wins: 0 })
    }
    const group = groups.get(key)
    group.matches++
    if (row.winner) group.wins++
  }
  
  // Calculate win rates
  for (const group of groups.values()) {
    group.winRate = group.matches > 0 ? group.wins / group.matches : 0
  }
  
  return groups
}

/**
 * Get top heroes by pick count
 * @param {Array} rows 
 * @param {number} limit 
 * @returns {Array}
 */
export function getTopHeroesByPicks(rows, limit = 10) {
  const groups = groupByField(rows, 'heroName')
  return Array.from(groups.values())
    .sort((a, b) => b.matches - a.matches)
    .slice(0, limit)
}

/**
 * Get top heroes by win rate (with minimum matches threshold)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @param {number} limit 
 * @returns {Array}
 */
export function getTopHeroesByWinRate(rows, minMatches = 10, limit = 10) {
  const groups = groupByField(rows, 'heroName')
  return Array.from(groups.values())
    .filter(g => g.matches >= minMatches)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit)
}

/**
 * Get top players by match count
 * @param {Array} rows 
 * @param {number} limit 
 * @returns {Array}
 */
export function getTopPlayersByMatches(rows, limit = 10) {
  const groups = groupByField(rows, 'playerName')
  return Array.from(groups.values())
    .sort((a, b) => b.matches - a.matches)
    .slice(0, limit)
}

/**
 * Get top players by win rate (with minimum matches threshold)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @param {number} limit 
 * @returns {Array}
 */
export function getTopPlayersByWinRate(rows, minMatches = 10, limit = 10) {
  const groups = groupByField(rows, 'playerName')
  return Array.from(groups.values())
    .filter(g => g.matches >= minMatches)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit)
}

/**
 * Get map statistics
 * @param {Array} rows 
 * @returns {Array}
 */
export function getMapsTable(rows) {
  const groups = groupByField(rows, 'map')
  return Array.from(groups.values())
    .sort((a, b) => b.matches - a.matches)
}

/**
 * Get matches over time grouped by week
 * Falls back to month if date parsing fails frequently
 * @param {Array} rows 
 * @returns {Array<{period: string, matches: number, wins: number, winRate: number}>}
 */
export function getMatchesOverTime(rows) {
  const groups = new Map()
  let validDates = 0
  
  for (const row of rows) {
    if (!row.dateObj) continue
    validDates++
    
    const period = getYearWeek(row.dateObj)
    if (!groups.has(period)) {
      groups.set(period, { period, matches: 0, wins: 0 })
    }
    const group = groups.get(period)
    group.matches++
    if (row.winner) group.wins++
  }
  
  // If less than 50% have valid dates, fall back to month grouping
  if (validDates < rows.length * 0.5) {
    groups.clear()
    for (const row of rows) {
      if (!row.dateObj) continue
      
      const period = getYearMonth(row.dateObj)
      if (!groups.has(period)) {
        groups.set(period, { period, matches: 0, wins: 0 })
      }
      const group = groups.get(period)
      group.matches++
      if (row.winner) group.wins++
    }
  }
  
  // Calculate win rates and sort by period
  const result = Array.from(groups.values())
    .map(g => ({ ...g, winRate: g.matches > 0 ? g.wins / g.matches : 0 }))
    .sort((a, b) => a.period.localeCompare(b.period))
  
  return result
}

/**
 * Calculate all overview metrics
 * @param {Array} rows 
 * @returns {Object}
 */
export function calculateOverviewMetrics(rows) {
  return {
    totalMatches: getTotalMatches(rows),
    winRate: getWinRate(rows),
    avgHeroDamage: getAverage(rows, 'heroDamage'),
    avgDeaths: getAverage(rows, 'deaths'),
    avgSpentDeadSeconds: getAverage(rows, 'spentDeadSeconds'),
    avgGameTimeSeconds: getAverage(rows, 'gameTimeSeconds'),
    totalKills: getTotal(rows, 'heroKills'),
    totalDeaths: getTotal(rows, 'deaths'),
    totalAssists: getTotal(rows, 'assists'),
    avgKills: getAverage(rows, 'heroKills'),
    avgAssists: getAverage(rows, 'assists'),
    avgTakedowns: getAverage(rows, 'takedowns')
  }
}

// =====================
// FUN FACTS / AWARDS
// =====================

// Constants for thresholds
const MIN_MATCHES = 10
const MIN_SHORT_MATCHES = 5
const MIN_WIN_RATE_SPEEDRUNNER = 0.60
const MIN_WIN_RATE_TILTPROOF = 0.55
const HIGH_DEATHS = 8
const SHORT_MATCH_SECONDS = 15 * 60 // 15 minutes
const MIN_HIGH_DEATH_MATCHES = 5

/**
 * Helper: Get number from row, trying multiple possible keys
 * @param {Object} row 
 * @param {...string} possibleKeys 
 * @returns {number}
 */
function getNumber(row, ...possibleKeys) {
  for (const key of possibleKeys) {
    const value = row[key]
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value)
      if (!isNaN(num)) return num
    }
  }
  return 0
}

/**
 * Helper: Get string from row, trying multiple possible keys
 * @param {Object} row 
 * @param {...string} possibleKeys 
 * @returns {string}
 */
function getString(row, ...possibleKeys) {
  for (const key of possibleKeys) {
    const value = row[key]
    if (value !== null && value !== undefined && value !== '') {
      return String(value).trim()
    }
  }
  return ''
}

/**
 * Helper: Parse game time to seconds (defensive)
 * Handles: "mm:ss", "hh:mm:ss", integer seconds, or already parsed gameTimeSeconds
 * @param {any} value 
 * @returns {number}
 */
function parseGameTimeToSeconds(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  
  const str = String(value).trim()
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10)
  }
  
  const parts = str.split(':').map(p => parseInt(p, 10) || 0)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  
  return 0
}

/**
 * Helper: Determine if row represents a win
 * @param {Object} row 
 * @returns {boolean}
 */
function isWin(row) {
  // Use normalized field first (most common case)
  if (row.winner === true || row.winner === 1) return true
  if (row.winner === false || row.winner === 0) return false
  
  // Fallback: Check Winner field
  const winner = getString(row, 'Winner', 'winner')
  if (winner) {
    const lower = winner.toLowerCase()
    if (['true', 'yes', 'win', 'won', '1', 'victory', 'si', 'sí'].includes(lower)) return true
    if (['false', 'no', 'loss', 'lost', '0', 'defeat', 'derrota'].includes(lower)) return false
  }
  
  // Fallback: Check Win/Lost fields
  const win = getNumber(row, 'Win', 'win')
  const lost = getNumber(row, 'Lost', 'lost', 'Loss', 'loss')
  if (win > 0 && lost === 0) return true
  if (lost > 0 && win === 0) return false
  
  // Default to row.winner if it's a boolean
  return Boolean(row.winner)
}

/**
 * Find player with highest average OnFire time per match
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getMostOnFire(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    if (!stats.has(row.playerName)) {
      stats.set(row.playerName, { totalOnFire: 0, matches: 0 })
    }
    const s = stats.get(row.playerName)
    s.totalOnFire += row.onFire || 0
    s.matches++
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.matches > 0 ? s.totalOnFire / s.matches : 0
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Find player with highest average time dead per match
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getMostTimeDead(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    if (!stats.has(row.playerName)) {
      stats.set(row.playerName, { totalTimeDead: 0, matches: 0 })
    }
    const s = stats.get(row.playerName)
    s.totalTimeDead += row.spentDeadSeconds || 0
    s.matches++
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.matches > 0 ? s.totalTimeDead / s.matches : 0
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Find player with highest average deaths (Kamikaze Award)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getKamikazeAward(rows, minMatches = 10) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    if (!stats.has(row.playerName)) {
      stats.set(row.playerName, { deaths: 0, matches: 0 })
    }
    const s = stats.get(row.playerName)
    s.deaths += row.deaths
    s.matches++
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.deaths / s.matches
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Find clutch hero (high winrate, low pick rate)
 * @param {Array} rows 
 * @returns {{ name: string, winRate: number, matches: number }|null}
 */
export function getClutchHero(rows) {
  const groups = groupByField(rows, 'heroName')
  
  // Filter: winrate >= 60%, matches between 5 and 15
  const candidates = Array.from(groups.values())
    .filter(g => g.matches >= 5 && g.matches <= 15 && g.winRate >= 0.6)
    .sort((a, b) => b.winRate - a.winRate)
  
  if (candidates.length === 0) {
    // Fallback: relax constraints
    const relaxed = Array.from(groups.values())
      .filter(g => g.matches >= 3 && g.matches <= 20 && g.winRate >= 0.55)
      .sort((a, b) => b.winRate - a.winRate)
    
    return relaxed[0] ? { name: relaxed[0].name, winRate: relaxed[0].winRate, matches: relaxed[0].matches } : null
  }
  
  return { name: candidates[0].name, winRate: candidates[0].winRate, matches: candidates[0].matches }
}

/**
 * Find most violent match (max HeroDamage + SiegeDamage)
 * @param {Array} rows 
 * @returns {{ playerName: string, heroName: string, value: number, map: string, replayName: string, winner: boolean }|null}
 */
export function getMostViolentMatch(rows) {
  let best = null
  let bestValue = 0
  
  for (const row of rows) {
    const total = (row.heroDamage || 0) + (row.siegeDamage || 0)
    if (total > bestValue) {
      bestValue = total
      best = row
    }
  }
  
  return best ? { 
    playerName: best.playerName, 
    heroName: best.heroName, 
    value: bestValue,
    map: best.map,
    replayName: best.replayName || getString(best, 'Name', 'ReplayName', 'replayName'),
    winner: isWin(best)
  } : null
}

/**
 * Find cursed map (lowest winrate with min matches)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, winRate: number, matches: number }|null}
 */
export function getCursedMap(rows, minMatches = 10) {
  const groups = groupByField(rows, 'map')
  
  const candidates = Array.from(groups.values())
    .filter(g => g.matches >= minMatches)
    .sort((a, b) => a.winRate - b.winRate) // Lowest first
  
  if (candidates.length === 0) return null
  
  return { name: candidates[0].name, winRate: candidates[0].winRate, matches: candidates[0].matches }
}

/**
 * Get Medic of the Year (highest average healing/shielding per match)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getMedicOfYear(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    // Use normalized field first, then try alternatives
    const healing = row.healingShielding || getNumber(row, 'HealingShielding', 'Healing/Shielding', 'Healing')
    if (healing > 0) {
      if (!stats.has(row.playerName)) {
        stats.set(row.playerName, { totalHealing: 0, matches: 0 })
      }
      const s = stats.get(row.playerName)
      s.totalHealing += healing
      s.matches++
    }
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.matches > 0 ? s.totalHealing / s.matches : 0
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Get XP Sponge (highest average experience per match)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getXpSponge(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    // Use normalized field first
    const xp = row.experience || getNumber(row, 'Experience', 'XP')
    if (xp > 0) {
      if (!stats.has(row.playerName)) {
        stats.set(row.playerName, { totalXP: 0, matches: 0 })
      }
      const s = stats.get(row.playerName)
      s.totalXP += xp
      s.matches++
    }
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.matches > 0 ? s.totalXP / s.matches : 0
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Get Siege Lord (highest average siege/structure damage per match)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getSiegeLord(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    
    // Prefer Total Siege Damage (normalized as siegeDamage), else use siegeDamage + structureDamage, else just structureDamage
    let siege = row.siegeDamage || getNumber(row, 'TotalSiegeDamage', 'Total Siege Damage', 'totalSiegeDamage')
    
    if (siege === 0) {
      const siegeDmg = row.siegeDamage || getNumber(row, 'SiegeDamage', 'Siege Damage')
      const structureDmg = getNumber(row, 'StructureDamage', 'Structure Damage', 'structureDamage')
      siege = siegeDmg + structureDmg
    }
    
    if (siege > 0) {
      if (!stats.has(row.playerName)) {
        stats.set(row.playerName, { totalSiege: 0, matches: 0 })
      }
      const s = stats.get(row.playerName)
      s.totalSiege += siege
      s.matches++
    }
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.matches > 0 ? s.totalSiege / s.matches : 0
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Get Mercenary Union (highest average merc camp captures per match)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getMercenaryUnion(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    const merc = getNumber(row, 'MercCampCaptures', 'Merc Camp Captures', 'mercCampCaptures', 'Mercenary')
    if (merc > 0) {
      if (!stats.has(row.playerName)) {
        stats.set(row.playerName, { totalMerc: 0, matches: 0 })
      }
      const s = stats.get(row.playerName)
      s.totalMerc += merc
      s.matches++
    }
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.matches > 0 ? s.totalMerc / s.matches : 0
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Get CC Machine (highest average CC per match)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, value: number, matches: number }|null}
 */
export function getCcMachine(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    
    // Prefer CC Heroes, else sum Stun + Silence + Rooting
    let cc = getNumber(row, 'CCHeroes', 'CC Heroes', 'ccHeroes')
    
    if (cc === 0) {
      const stun = getNumber(row, 'StunHeroes', 'Stun Heroes', 'stunHeroes')
      const silence = getNumber(row, 'SilenceHeroes', 'Silence Heroes', 'silenceHeroes')
      const rooting = getNumber(row, 'RootingHeroes', 'Rooting Heroes', 'rootingHeroes')
      cc = stun + silence + rooting
    }
    
    if (cc > 0) {
      if (!stats.has(row.playerName)) {
        stats.set(row.playerName, { totalCC: 0, matches: 0 })
      }
      const s = stats.get(row.playerName)
      s.totalCC += cc
      s.matches++
    }
  }
  
  let best = null
  let bestAvg = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    const avg = s.matches > 0 ? s.totalCC / s.matches : 0
    if (avg > bestAvg) {
      best = name
      bestAvg = avg
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, value: bestAvg, matches: bestMatches } : null
}

/**
 * Get Speedrunner (best winrate in short matches)
 * @param {Array} rows 
 * @returns {{ name: string, winRate: number, matches: number }|null}
 */
export function getSpeedrunner(rows) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    
    // Use normalized field first
    const gameTime = row.gameTimeSeconds || parseGameTimeToSeconds(getString(row, 'GameTime', 'Game Time', 'gameTime'))
    if (gameTime > 0 && gameTime <= SHORT_MATCH_SECONDS) {
      if (!stats.has(row.playerName)) {
        stats.set(row.playerName, { shortMatches: 0, shortWins: 0 })
      }
      const s = stats.get(row.playerName)
      s.shortMatches++
      if (isWin(row)) {
        s.shortWins++
      }
    }
  }
  
  let best = null
  let bestWinRate = 0
  let bestMatches = 0
  let bestWins = 0
  
  for (const [name, s] of stats) {
    if (s.shortMatches < MIN_SHORT_MATCHES) continue
    
    const winRate = s.shortMatches > 0 ? s.shortWins / s.shortMatches : 0
    if (winRate < MIN_WIN_RATE_SPEEDRUNNER) continue
    
    // Pick highest winRate; tie-breaker: more matches, then more wins
    if (winRate > bestWinRate || 
        (winRate === bestWinRate && s.shortMatches > bestMatches) ||
        (winRate === bestWinRate && s.shortMatches === bestMatches && s.shortWins > bestWins)) {
      best = name
      bestWinRate = winRate
      bestMatches = s.shortMatches
      bestWins = s.shortWins
    }
  }
  
  return best ? { name: best, winRate: bestWinRate, matches: bestMatches } : null
}

/**
 * Get Tilt-Proof (best winrate in high-death matches)
 * @param {Array} rows 
 * @returns {{ name: string, winRate: number, matches: number }|null}
 */
export function getTiltProof(rows) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    
    // Use normalized field first
    const deaths = row.deaths || getNumber(row, 'Deaths')
    if (deaths >= HIGH_DEATHS) {
      if (!stats.has(row.playerName)) {
        stats.set(row.playerName, { highDeathMatches: 0, highDeathWins: 0 })
      }
      const s = stats.get(row.playerName)
      s.highDeathMatches++
      if (isWin(row)) {
        s.highDeathWins++
      }
    }
  }
  
  let best = null
  let bestWinRate = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.highDeathMatches < MIN_HIGH_DEATH_MATCHES) continue
    
    const winRate = s.highDeathMatches > 0 ? s.highDeathWins / s.highDeathMatches : 0
    if (winRate < MIN_WIN_RATE_TILTPROOF) continue
    
    // Pick highest winRate; tie-breaker: more matches
    if (winRate > bestWinRate || (winRate === bestWinRate && s.highDeathMatches > bestMatches)) {
      best = name
      bestWinRate = winRate
      bestMatches = s.highDeathMatches
    }
  }
  
  return best ? { name: best, winRate: bestWinRate, matches: bestMatches } : null
}

/**
 * Get Longest Match (single row with maximum game time)
 * @param {Array} rows 
 * @returns {{ playerName: string, heroName: string, map: string, valueSeconds: number, date?: Date, replayName: string, winner: boolean }|null}
 */
export function getLongestMatch(rows) {
  let best = null
  let bestTime = 0
  
  for (const row of rows) {
    // Use normalized field first
    const gameTime = row.gameTimeSeconds || parseGameTimeToSeconds(getString(row, 'GameTime', 'Game Time', 'gameTime'))
    if (gameTime > bestTime) {
      bestTime = gameTime
      best = row
    }
  }
  
  if (!best || bestTime === 0) return null
  
  return {
    playerName: best.playerName || getString(best, 'Player', 'PlayerName', 'playerName'),
    heroName: best.heroName || getString(best, 'Hero', 'HeroName', 'heroName'),
    map: best.map || getString(best, 'Map', 'map'),
    valueSeconds: bestTime,
    date: best.dateObj || null,
    replayName: best.replayName || getString(best, 'Name', 'ReplayName', 'replayName'),
    winner: isWin(best)
  }
}

/**
 * Get Shortest Win (minimum game time among wins)
 * @param {Array} rows 
 * @returns {{ playerName: string, heroName: string, map: string, valueSeconds: number, replayName: string, winner: boolean }|null}
 */
export function getShortestWin(rows) {
  let best = null
  let bestTime = Infinity
  
  for (const row of rows) {
    if (!isWin(row)) continue
    
    // Use normalized field first
    const gameTime = row.gameTimeSeconds || parseGameTimeToSeconds(getString(row, 'GameTime', 'Game Time', 'gameTime'))
    if (gameTime > 0 && gameTime < bestTime) {
      bestTime = gameTime
      best = row
    }
  }
  
  if (!best || bestTime === Infinity) return null
  
  return {
    playerName: best.playerName || getString(best, 'Player', 'PlayerName', 'playerName'),
    heroName: best.heroName || getString(best, 'Hero', 'HeroName', 'heroName'),
    map: best.map || getString(best, 'Map', 'map'),
    valueSeconds: bestTime,
    replayName: best.replayName || getString(best, 'Name', 'ReplayName', 'replayName'),
    winner: isWin(best)
  }
}

/**
 * Get KDA King (highest KDA per player)
 * @param {Array} rows 
 * @param {number} minMatches 
 * @returns {{ name: string, kda: number, matches: number }|null}
 */
export function getKdaKing(rows, minMatches = MIN_MATCHES) {
  const stats = new Map()
  
  for (const row of rows) {
    if (!row.playerName) continue
    
    if (!stats.has(row.playerName)) {
      stats.set(row.playerName, { takedowns: 0, assists: 0, deaths: 0, matches: 0 })
    }
    const s = stats.get(row.playerName)
    // Use normalized fields first
    s.takedowns += row.takedowns || getNumber(row, 'Takedowns')
    s.assists += row.assists || getNumber(row, 'Assists')
    s.deaths += row.deaths || getNumber(row, 'Deaths')
    s.matches++
  }
  
  let best = null
  let bestKda = 0
  let bestMatches = 0
  
  for (const [name, s] of stats) {
    if (s.matches < minMatches) continue
    
    const kda = (s.takedowns + s.assists) / Math.max(1, s.deaths)
    if (kda > bestKda) {
      best = name
      bestKda = kda
      bestMatches = s.matches
    }
  }
  
  return best ? { name: best, kda: bestKda, matches: bestMatches } : null
}

/**
 * Calculate all fun facts/awards
 * @param {Array} rows 
 * @returns {Object}
 */
export function calculateFunFacts(rows) {
  return {
    mostOnFire: getMostOnFire(rows),
    mostTimeDead: getMostTimeDead(rows),
    kamikazeAward: getKamikazeAward(rows),
    clutchHero: getClutchHero(rows),
    mostViolentMatch: getMostViolentMatch(rows),
    cursedMap: getCursedMap(rows),
    medicOfYear: getMedicOfYear(rows),
    xpSponge: getXpSponge(rows),
    siegeLord: getSiegeLord(rows),
    mercenaryUnion: getMercenaryUnion(rows),
    ccMachine: getCcMachine(rows),
    speedrunner: getSpeedrunner(rows),
    tiltProof: getTiltProof(rows),
    longestMatch: getLongestMatch(rows),
    shortestWin: getShortestWin(rows),
    kdaKing: getKdaKing(rows)
  }
}

/**
 * Get detailed stats for a specific player
 * @param {Array} rows - All filtered rows
 * @param {string} playerName - Player to analyze
 * @returns {Object} - Detailed player analytics
 */
export function getPlayerDetails(rows, playerName) {
  const playerRows = rows.filter(r => r.playerName === playerName)
  
  if (playerRows.length === 0) {
    return null
  }
  
  // Basic aggregation
  let wins = 0, kills = 0, deaths = 0, assists = 0, takedowns = 0
  let heroDamage = 0, siegeDamage = 0, damageTaken = 0, healingShielding = 0
  let spentDeadSeconds = 0, gameTimeSeconds = 0, onFireTotal = 0
  const heroes = {}
  const maps = {}
  const byWeek = {}
  const matches = []
  
  for (const row of playerRows) {
    if (row.winner) wins++
    kills += row.heroKills || 0
    deaths += row.deaths || 0
    assists += row.assists || 0
    takedowns += row.takedowns || 0
    heroDamage += row.heroDamage || 0
    siegeDamage += row.siegeDamage || 0
    damageTaken += row.damageTaken || 0
    healingShielding += row.healingShielding || 0
    spentDeadSeconds += row.spentDeadSeconds || 0
    gameTimeSeconds += row.gameTimeSeconds || 0
    onFireTotal += row.onFire || 0
    
    // By hero
    const hero = row.heroName || 'Unknown'
    if (!heroes[hero]) {
      heroes[hero] = { 
        name: hero, 
        role: row.role || 'Unknown',
        matches: 0, 
        wins: 0 
      }
    }
    heroes[hero].matches++
    if (row.winner) heroes[hero].wins++
    
    // By map
    const map = row.map || 'Unknown'
    if (!maps[map]) maps[map] = { name: map, matches: 0, wins: 0 }
    maps[map].matches++
    if (row.winner) maps[map].wins++
    
    // Time series (by week)
    if (row.dateObj) {
      const week = getYearWeek(row.dateObj)
      if (!byWeek[week]) byWeek[week] = { period: week, matches: 0, wins: 0 }
      byWeek[week].matches++
      if (row.winner) byWeek[week].wins++
    }
    
    // Store match record with replay name
    matches.push({
      heroName: hero,
      heroRole: row.role || 'Unknown',
      map: map,
      replayName: row.replayName || '',
      date: row.dateObj,
      winner: row.winner,
      kills: row.heroKills || 0,
      deaths: row.deaths || 0,
      assists: row.assists || 0,
      heroDamage: row.heroDamage || 0,
      siegeDamage: row.siegeDamage || 0,
      totalDamage: (row.heroDamage || 0) + (row.siegeDamage || 0),
      gameTimeSeconds: row.gameTimeSeconds || 0
    })
  }
  
  const totalMatches = playerRows.length
  const avgGameTimeMinutes = totalMatches > 0 ? (gameTimeSeconds / totalMatches) / 60 : 0
  
  // Helper function for safe division
  const safeDivide = (a, b) => b > 0 ? a / b : 0
  
  // KPIs
  const kpis = {
    matches: totalMatches,
    wins,
    losses: totalMatches - wins,
    winRate: safeDivide(wins, totalMatches),
    avgKills: safeDivide(kills, totalMatches),
    avgDeaths: safeDivide(deaths, totalMatches),
    avgAssists: safeDivide(assists, totalMatches),
    kda: safeDivide(kills + assists, Math.max(1, deaths)),
    avgHeroDamage: safeDivide(heroDamage, totalMatches),
    avgSiegeDamage: safeDivide(siegeDamage, totalMatches),
    avgTotalDamage: safeDivide(heroDamage + siegeDamage, totalMatches),
    dpm: safeDivide(safeDivide(heroDamage + siegeDamage, totalMatches), avgGameTimeMinutes),
    avgDamageTaken: safeDivide(damageTaken, totalMatches),
    avgHealingShielding: safeDivide(healingShielding, totalMatches),
    avgSpentDeadSeconds: safeDivide(spentDeadSeconds, totalMatches),
    avgGameTimeSeconds: safeDivide(gameTimeSeconds, totalMatches),
    avgOnFire: safeDivide(onFireTotal, totalMatches),
    totalKills: kills,
    totalDeaths: deaths,
    totalAssists: assists
  }
  
  // Process heroes - sort by matches and compute winrate
  const heroesList = Object.values(heroes)
    .map(h => ({ ...h, winRate: safeDivide(h.wins, h.matches) }))
    .sort((a, b) => b.matches - a.matches)
  
  // Process maps - sort by matches and compute winrate
  const mapsList = Object.values(maps)
    .map(m => ({ ...m, winRate: safeDivide(m.wins, m.matches) }))
    .sort((a, b) => b.matches - a.matches)
  
  // Process trend - sort chronologically
  const trend = Object.values(byWeek)
    .map(t => ({ ...t, winRate: safeDivide(t.wins, t.matches) }))
    .sort((a, b) => a.period.localeCompare(b.period))
  
  // Sort matches by date (most recent first)
  matches.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date - a.date
  })
  
  return {
    name: playerName,
    kpis,
    heroes: heroesList,
    maps: mapsList,
    trend,
    matches
  }
}
