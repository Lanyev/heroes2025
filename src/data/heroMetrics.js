import { wilsonLowerBound, isLowSample, getConfidenceNote, safeDivide } from '../utils/stats'
import { getYearWeek, getYearMonth } from '../utils/date'

/**
 * Build a comprehensive hero index from rows
 * @param {Array} rows - Filtered rows from dataset
 * @returns {Object} - Object keyed by hero name with aggregated stats
 */
export function buildHeroIndex(rows) {
  const index = {}
  
  for (const row of rows) {
    const hero = row.heroName
    if (!hero) continue
    
    if (!index[hero]) {
      index[hero] = {
        name: hero,
        role: row.role || 'Unknown',
        matches: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        takedowns: 0,
        heroDamage: 0,
        siegeDamage: 0,
        damageTaken: 0,
        healingShielding: 0,
        spentDeadSeconds: 0,
        gameTimeSeconds: 0,
        onFireTotal: 0,
        maxHeroDamage: 0,
        maxTotalDamage: 0,
        maxDamageTaken: 0,
        maxHealingShielding: 0,
        maps: {},
        players: {},
        matchRecords: []
      }
    }
    
    const h = index[hero]
    h.matches++
    if (row.winner) h.wins++
    else h.losses++
    
    h.kills += row.heroKills || 0
    h.deaths += row.deaths || 0
    h.assists += row.assists || 0
    h.takedowns += row.takedowns || 0
    const currentHeroDamage = row.heroDamage || 0
    const currentSiegeDamage = row.siegeDamage || 0
    const currentTotalDamage = currentHeroDamage + currentSiegeDamage
    const currentDamageTaken = row.damageTaken || 0
    const currentHealing = row.healingShielding || 0
    
    h.heroDamage += currentHeroDamage
    h.siegeDamage += currentSiegeDamage
    h.damageTaken += currentDamageTaken
    h.healingShielding += currentHealing
    h.spentDeadSeconds += row.spentDeadSeconds || 0
    h.gameTimeSeconds += row.gameTimeSeconds || 0
    h.onFireTotal += row.onFire || 0
    
    // Track maximums per match
    if (currentHeroDamage > h.maxHeroDamage) {
      h.maxHeroDamage = currentHeroDamage
    }
    if (currentTotalDamage > h.maxTotalDamage) {
      h.maxTotalDamage = currentTotalDamage
    }
    if (currentDamageTaken > h.maxDamageTaken) {
      h.maxDamageTaken = currentDamageTaken
    }
    if (currentHealing > h.maxHealingShielding) {
      h.maxHealingShielding = currentHealing
    }
    
    // Track by map
    const map = row.map || 'Unknown'
    if (!h.maps[map]) h.maps[map] = { matches: 0, wins: 0 }
    h.maps[map].matches++
    if (row.winner) h.maps[map].wins++
    
    // Track by player
    const player = row.playerName || 'Unknown'
    if (!h.players[player]) h.players[player] = { matches: 0, wins: 0 }
    h.players[player].matches++
    if (row.winner) h.players[player].wins++
    
    // Store match record for finding extremes
    h.matchRecords.push({
      totalDamage: currentTotalDamage,
      heroDamage: currentHeroDamage,
      siegeDamage: currentSiegeDamage,
      damageTaken: currentDamageTaken,
      healingShielding: currentHealing,
      map: row.map,
      player: row.playerName,
      date: row.dateObj,
      winner: row.winner
    })
  }
  
  return index
}

/**
 * Build hero stats table with all derived metrics
 * @param {Array} rows - Filtered rows from dataset
 * @param {Object} options - Options like lowSampleThreshold
 * @returns {Array} - Array of hero stats objects
 */
export function getHeroStatsTable(rows, options = {}) {
  const { lowSampleThreshold = 20 } = options
  const index = buildHeroIndex(rows)
  const totalMatches = rows.length
  
  const table = Object.values(index).map(h => {
    const gameTimeMinutes = h.gameTimeSeconds / 60
    const avgGameTimeMinutes = safeDivide(h.gameTimeSeconds, h.matches) / 60
    
    // Derived averages
    const avgKills = safeDivide(h.kills, h.matches)
    const avgDeaths = safeDivide(h.deaths, h.matches)
    const avgAssists = safeDivide(h.assists, h.matches)
    const avgTakedowns = safeDivide(h.takedowns, h.matches)
    const avgHeroDamage = safeDivide(h.heroDamage, h.matches)
    const avgSiegeDamage = safeDivide(h.siegeDamage, h.matches)
    const avgTotalDamage = avgHeroDamage + avgSiegeDamage
    const avgDamageTaken = safeDivide(h.damageTaken, h.matches)
    const avgHealingShielding = safeDivide(h.healingShielding, h.matches)
    const avgSpentDeadSeconds = safeDivide(h.spentDeadSeconds, h.matches)
    const avgGameTimeSeconds = safeDivide(h.gameTimeSeconds, h.matches)
    const avgOnFire = safeDivide(h.onFireTotal, h.matches)
    
    // KDA
    const kda = safeDivide(h.kills + h.assists, Math.max(1, h.deaths))
    
    // Rates
    const winRate = safeDivide(h.wins, h.matches)
    const pickRate = safeDivide(h.matches, totalMatches)
    
    // Per-minute stats (using average game time)
    const dpm = safeDivide(avgTotalDamage, avgGameTimeMinutes)
    const heroDpm = safeDivide(avgHeroDamage, avgGameTimeMinutes)
    const killsPerMin = safeDivide(avgKills, avgGameTimeMinutes)
    const deathsPerMin = safeDivide(avgDeaths, avgGameTimeMinutes)
    
    // Wilson score for ranking
    const wilsonScore = wilsonLowerBound(h.wins, h.matches)
    
    // Sample quality
    const lowSample = isLowSample(h.matches, lowSampleThreshold)
    const confidenceNote = getConfidenceNote(h.matches)
    
    // Most violent match
    const mostViolent = h.matchRecords.reduce((max, r) => 
      r.totalDamage > (max?.totalDamage || 0) ? r : max, null)
    
    return {
      name: h.name,
      role: h.role,
      matches: h.matches,
      wins: h.wins,
      losses: h.losses,
      winRate,
      winRateWilson: wilsonScore,
      pickRate,
      kills: h.kills,
      deaths: h.deaths,
      assists: h.assists,
      takedowns: h.takedowns,
      avgKills,
      avgDeaths,
      avgAssists,
      avgTakedowns,
      kda,
      heroDamage: h.heroDamage,
      siegeDamage: h.siegeDamage,
      avgHeroDamage,
      avgSiegeDamage,
      avgTotalDamage,
      avgDamageTaken,
      avgHealingShielding,
      avgSpentDeadSeconds,
      avgGameTimeSeconds,
      avgOnFire,
      dpm,
      heroDpm,
      killsPerMin,
      deathsPerMin,
      maxHeroDamage: h.maxHeroDamage,
      maxTotalDamage: h.maxTotalDamage,
      maxDamageTaken: h.maxDamageTaken,
      maxHealingShielding: h.maxHealingShielding,
      lowSample,
      confidenceNote,
      mostViolent,
      maps: h.maps,
      players: h.players
    }
  })
  
  return table
}

/**
 * Get top heroes by a specific metric
 * @param {Array} heroTable - Result from getHeroStatsTable
 * @param {string} metricKey - Key to sort by
 * @param {number} topN - Number of results
 * @param {number} minMatches - Minimum matches filter
 * @param {boolean} ascending - Sort ascending (for metrics where lower is better)
 * @returns {Array}
 */
export function getTopHeroesByMetric(heroTable, metricKey, topN = 10, minMatches = 0, ascending = false) {
  return heroTable
    .filter(h => h.matches >= minMatches)
    .sort((a, b) => ascending ? a[metricKey] - b[metricKey] : b[metricKey] - a[metricKey])
    .slice(0, topN)
}

/**
 * Get top players by winrate for a specific hero
 * @param {Array} rows - All filtered rows
 * @param {string} heroName - Hero to analyze
 * @param {number} topN - Number of top players to return (default 3)
 * @param {number} minMatches - Minimum matches required (default 3)
 * @returns {Array} - Array of top players with {name, matches, wins, winRate}
 */
export function getTopPlayersByWinrate(rows, heroName, topN = 3, minMatches = 3) {
  const heroRows = rows.filter(r => r.heroName === heroName)
  
  if (heroRows.length === 0) {
    return []
  }
  
  const players = {}
  
  for (const row of heroRows) {
    const player = row.playerName || 'Unknown'
    if (!players[player]) {
      players[player] = { name: player, matches: 0, wins: 0 }
    }
    players[player].matches++
    if (row.winner) players[player].wins++
  }
  
  // Process players - compute winrate and filter by minMatches
  const playersList = Object.values(players)
    .filter(p => p.matches >= minMatches)
    .map(p => ({ ...p, winRate: safeDivide(p.wins, p.matches) }))
    .sort((a, b) => {
      // Sort by winrate first, then by matches as tiebreaker
      if (Math.abs(a.winRate - b.winRate) > 0.001) {
        return b.winRate - a.winRate
      }
      return b.matches - a.matches
    })
    .slice(0, topN)
  
  return playersList
}

/**
 * Get detailed stats for a specific hero
 * @param {Array} rows - All filtered rows
 * @param {string} heroName - Hero to analyze
 * @returns {Object} - Detailed hero analytics
 */
export function getHeroDetails(rows, heroName) {
  const heroRows = rows.filter(r => r.heroName === heroName)
  
  if (heroRows.length === 0) {
    return null
  }
  
  const totalMatches = rows.length
  
  // Basic aggregation
  let wins = 0, kills = 0, deaths = 0, assists = 0, takedowns = 0
  let heroDamage = 0, siegeDamage = 0, damageTaken = 0, healingShielding = 0
  let spentDeadSeconds = 0, gameTimeSeconds = 0, onFireTotal = 0
  const maps = {}
  const players = {}
  const byWeek = {}
  let mostViolent = null
  let mostViolentDamage = 0
  
  for (const row of heroRows) {
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
    
    // By map
    const map = row.map || 'Unknown'
    if (!maps[map]) maps[map] = { name: map, matches: 0, wins: 0 }
    maps[map].matches++
    if (row.winner) maps[map].wins++
    
    // By player
    const player = row.playerName || 'Unknown'
    if (!players[player]) players[player] = { name: player, matches: 0, wins: 0 }
    players[player].matches++
    if (row.winner) players[player].wins++
    
    // Time series (by week)
    if (row.dateObj) {
      const week = getYearWeek(row.dateObj)
      if (!byWeek[week]) byWeek[week] = { period: week, matches: 0, wins: 0 }
      byWeek[week].matches++
      if (row.winner) byWeek[week].wins++
    }
    
    // Most violent match
    const totalDmg = (row.heroDamage || 0) + (row.siegeDamage || 0)
    if (totalDmg > mostViolentDamage) {
      mostViolentDamage = totalDmg
      mostViolent = {
        totalDamage: totalDmg,
        heroDamage: row.heroDamage,
        siegeDamage: row.siegeDamage,
        map: row.map,
        player: row.playerName,
        date: row.dateObj,
        winner: row.winner
      }
    }
  }
  
  const matches = heroRows.length
  const avgGameTimeMinutes = safeDivide(gameTimeSeconds, matches) / 60
  
  // KPIs
  const kpis = {
    matches,
    wins,
    losses: matches - wins,
    winRate: safeDivide(wins, matches),
    winRateWilson: wilsonLowerBound(wins, matches),
    pickRate: safeDivide(matches, totalMatches),
    avgKills: safeDivide(kills, matches),
    avgDeaths: safeDivide(deaths, matches),
    avgAssists: safeDivide(assists, matches),
    kda: safeDivide(kills + assists, Math.max(1, deaths)),
    avgHeroDamage: safeDivide(heroDamage, matches),
    avgSiegeDamage: safeDivide(siegeDamage, matches),
    avgTotalDamage: safeDivide(heroDamage + siegeDamage, matches),
    dpm: safeDivide(safeDivide(heroDamage + siegeDamage, matches), avgGameTimeMinutes),
    avgDamageTaken: safeDivide(damageTaken, matches),
    avgHealingShielding: safeDivide(healingShielding, matches),
    avgSpentDeadSeconds: safeDivide(spentDeadSeconds, matches),
    avgGameTimeSeconds: safeDivide(gameTimeSeconds, matches),
    avgOnFire: safeDivide(onFireTotal, matches),
    lowSample: isLowSample(matches),
    confidenceNote: getConfidenceNote(matches)
  }
  
  // Process maps - sort by matches and compute winrate
  const mapsList = Object.values(maps)
    .map(m => ({ ...m, winRate: safeDivide(m.wins, m.matches) }))
    .sort((a, b) => b.matches - a.matches)
  
  // Process players - sort by matches and compute winrate
  const playersList = Object.values(players)
    .map(p => ({ ...p, winRate: safeDivide(p.wins, p.matches) }))
    .sort((a, b) => b.matches - a.matches)
  
  // Process trend - sort chronologically
  const trend = Object.values(byWeek)
    .map(t => ({ ...t, winRate: safeDivide(t.wins, t.matches) }))
    .sort((a, b) => a.period.localeCompare(b.period))
  
  // Get role from first row
  const role = heroRows[0]?.role || 'Unknown'
  
  return {
    name: heroName,
    role,
    kpis,
    maps: mapsList,
    players: playersList,
    trend,
    mostViolent
  }
}

/**
 * Available metrics for the metric picker
 */
export const HERO_METRICS = [
  { key: 'matches', label: 'Partidas', desc: true },
  { key: 'winRate', label: 'Win Rate (Raw)', desc: true },
  { key: 'winRateWilson', label: 'Win Rate (Wilson)', desc: true },
  { key: 'pickRate', label: 'Pick Rate', desc: true },
  { key: 'kda', label: 'KDA', desc: true },
  { key: 'dpm', label: 'DPM (Daño/min)', desc: true },
  { key: 'avgTotalDamage', label: 'Avg Daño Total', desc: true },
  { key: 'avgHeroDamage', label: 'Avg Daño Héroe', desc: true },
  { key: 'avgHealingShielding', label: 'Avg Curación', desc: true },
  { key: 'avgKills', label: 'Avg Kills', desc: true },
  { key: 'avgDeaths', label: 'Avg Muertes', desc: false },
  { key: 'avgSpentDeadSeconds', label: 'Avg Tiempo Muerto', desc: false },
  { key: 'avgDamageTaken', label: 'Avg Daño Recibido', desc: true }
]

/**
 * Table column definitions for the heroes table
 */
export const HERO_TABLE_COLUMNS = [
  { key: 'name', label: 'Héroe', sortable: true, type: 'string' },
  { key: 'role', label: 'Rol', sortable: true, type: 'string' },
  { key: 'matches', label: 'Partidas', sortable: true, type: 'number' },
  { key: 'wins', label: 'Wins', sortable: true, type: 'number' },
  { key: 'winRate', label: 'Win Rate', sortable: true, type: 'percent' },
  { key: 'pickRate', label: 'Pick Rate', sortable: true, type: 'percent' },
  { key: 'kda', label: 'KDA', sortable: true, type: 'decimal' },
  { key: 'dpm', label: 'DPM', sortable: true, type: 'compact' },
  // Average columns first
  { key: 'avgTotalDamage', label: 'Avg Daño', sortable: true, type: 'compact' },
  { key: 'avgHeroDamage', label: 'Avg D.Héroe', sortable: true, type: 'compact' },
  { key: 'avgHealingShielding', label: 'Avg Heal', sortable: true, type: 'compact' },
  { key: 'avgDamageTaken', label: 'Avg D.Tankeado', sortable: true, type: 'compact' },
  { key: 'avgDeaths', label: 'Avg Muertes', sortable: true, type: 'decimal' },
  { key: 'avgSpentDeadSeconds', label: 'Avg T.Muerto', sortable: true, type: 'duration' },
  // Max columns after averages
  { key: 'maxTotalDamage', label: 'Max Daño', sortable: true, type: 'compact' },
  { key: 'maxHeroDamage', label: 'Max D.Héroe', sortable: true, type: 'compact' },
  { key: 'maxHealingShielding', label: 'Max Heal', sortable: true, type: 'compact' },
  { key: 'maxDamageTaken', label: 'Max D.Tankeado', sortable: true, type: 'compact' }
]
