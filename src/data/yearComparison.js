import { calculateOverviewMetrics } from './metrics'
import { getHeroStatsTable } from './heroMetrics'
import { getTopPlayersByMatches, getAverage, getTotal, getWinRate } from './metrics'
import { getYearMonth } from '../utils/date'

/**
 * Get available years from dataset
 * @param {Array} rows - All rows from dataset
 * @returns {Array<number>} - Array of years sorted descending
 */
export function getAvailableYears(rows) {
  const years = new Set()
  
  for (const row of rows) {
    if (row.dateObj) {
      const year = row.dateObj.getFullYear()
      if (year && !isNaN(year)) {
        years.add(year)
      }
    }
  }
  
  return Array.from(years).sort((a, b) => b - a) // Descending order
}

/**
 * Filter rows by year
 * @param {Array} rows - All rows
 * @param {number} year - Year to filter
 * @returns {Array} - Filtered rows for that year
 */
export function filterRowsByYear(rows, year) {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)
  
  return rows.filter(row => {
    if (!row.dateObj) return false
    const date = row.dateObj
    return date >= yearStart && date <= yearEnd
  })
}

/**
 * Calculate metrics for a specific year
 * @param {Array} rows - All rows
 * @param {number} year - Year to calculate metrics for
 * @returns {Object} - Metrics object for that year
 */
export function calculateYearMetrics(rows, year) {
  const yearRows = filterRowsByYear(rows, year)
  
  if (yearRows.length === 0) {
    return {
      year,
      totalMatches: 0,
      winRate: 0,
      avgGameTimeSeconds: 0,
      avgTakedowns: 0,
      avgHeroDamage: 0,
      avgDeaths: 0,
      avgKills: 0,
      avgAssists: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0
    }
  }
  
  const overview = calculateOverviewMetrics(yearRows)
  
  return {
    year,
    totalMatches: overview.totalMatches,
    winRate: overview.winRate,
    avgGameTimeSeconds: overview.avgGameTimeSeconds,
    avgTakedowns: overview.avgTakedowns,
    avgHeroDamage: overview.avgHeroDamage,
    avgDeaths: overview.avgDeaths,
    avgKills: overview.avgKills,
    avgAssists: overview.avgAssists,
    totalKills: overview.totalKills,
    totalDeaths: overview.totalDeaths,
    totalAssists: overview.totalAssists
  }
}

/**
 * Calculate metrics for multiple years
 * @param {Array} rows - All rows
 * @param {Array<number>} years - Array of years to calculate
 * @returns {Object} - Object keyed by year with metrics
 */
export function calculateMultipleYearMetrics(rows, years) {
  const result = {}
  
  for (const year of years) {
    result[year] = calculateYearMetrics(rows, year)
  }
  
  return result
}

/**
 * Calculate difference between two values
 * @param {number} value1 - First value (usually older year)
 * @param {number} value2 - Second value (usually newer year)
 * @returns {Object} - { absolute, percentage, direction }
 */
export function calculateDifference(value1, value2) {
  const absolute = value2 - value1
  
  let percentage = 0
  if (value1 !== 0) {
    percentage = (absolute / value1) * 100
  } else if (value2 !== 0) {
    percentage = 100 // 100% increase from 0
  }
  
  let direction = '→'
  if (Math.abs(absolute) < 0.01) {
    direction = '→' // No significant change
  } else if (absolute > 0) {
    direction = '↑'
  } else {
    direction = '↓'
  }
  
  return {
    absolute,
    percentage,
    direction
  }
}

/**
 * Get hero stats by year
 * @param {Array} rows - All rows
 * @param {number} year - Year to get stats for
 * @returns {Array} - Hero stats table for that year
 */
export function getHeroStatsByYear(rows, year) {
  const yearRows = filterRowsByYear(rows, year)
  return getHeroStatsTable(yearRows, { lowSampleThreshold: 20 })
}

/**
 * Get player stats by year
 * @param {Array} rows - All rows
 * @param {number} year - Year to get stats for
 * @returns {Array} - Player stats for that year
 */
export function getPlayerStatsByYear(rows, year) {
  const yearRows = filterRowsByYear(rows, year)
  const stats = new Map()
  
  for (const row of yearRows) {
    const name = row.playerName
    if (!name) continue
    
    if (!stats.has(name)) {
      stats.set(name, {
        name,
        matches: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        heroDamage: 0,
        totalDamage: 0
      })
    }
    
    const s = stats.get(name)
    s.matches++
    if (row.winner) s.wins++
    
    s.kills += row.heroKills || 0
    s.deaths += row.deaths || 0
    s.assists += row.assists || 0
    s.heroDamage += row.heroDamage || 0
    s.totalDamage += (row.heroDamage || 0) + (row.siegeDamage || 0)
  }
  
  // Calculate averages and winrate
  const result = Array.from(stats.values()).map(s => {
    const winRate = s.matches > 0 ? s.wins / s.matches : 0
    const kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : (s.kills + s.assists)
    const avgHeroDamage = s.matches > 0 ? s.heroDamage / s.matches : 0
    const avgTotalDamage = s.matches > 0 ? s.totalDamage / s.matches : 0
    
    return {
      ...s,
      winRate,
      kda,
      avgHeroDamage,
      avgTotalDamage
    }
  })
  
  return result.sort((a, b) => b.matches - a.matches)
}

/**
 * Compare heroes across years
 * @param {Array} rows - All rows
 * @param {Array<number>} years - Years to compare
 * @returns {Array} - Array of hero comparison objects
 */
export function compareHeroesAcrossYears(rows, years) {
  const heroStatsByYear = {}
  
  // Get stats for each year
  for (const year of years) {
    heroStatsByYear[year] = getHeroStatsByYear(rows, year)
  }
  
  // Get all unique heroes across all years
  const allHeroes = new Set()
  for (const year of years) {
    for (const hero of heroStatsByYear[year]) {
      allHeroes.add(hero.name)
    }
  }
  
  // Build comparison array
  const comparison = []
  
  for (const heroName of allHeroes) {
    const heroData = {
      name: heroName,
      role: null,
      years: {}
    }
    
    // Get data for each year
    for (const year of years) {
      const heroInYear = heroStatsByYear[year].find(h => h.name === heroName)
      if (heroInYear) {
        heroData.role = heroInYear.role // Use role from any year (should be consistent)
        heroData.years[year] = {
          matches: heroInYear.matches,
          winRate: heroInYear.winRate,
          kda: heroInYear.kda,
          avgHeroDamage: heroInYear.avgHeroDamage,
          avgTotalDamage: heroInYear.avgTotalDamage
        }
      } else {
        heroData.years[year] = {
          matches: 0,
          winRate: 0,
          kda: 0,
          avgHeroDamage: 0,
          avgTotalDamage: 0
        }
      }
    }
    
    // Calculate changes (comparing first year to last year)
    if (years.length >= 2) {
      const sortedYears = [...years].sort((a, b) => a - b)
      const firstYear = sortedYears[0]
      const lastYear = sortedYears[sortedYears.length - 1]
      
      const firstData = heroData.years[firstYear]
      const lastData = heroData.years[lastYear]
      
      heroData.change = {
        matches: calculateDifference(firstData.matches, lastData.matches),
        winRate: calculateDifference(firstData.winRate, lastData.winRate),
        kda: calculateDifference(firstData.kda, lastData.kda),
        avgHeroDamage: calculateDifference(firstData.avgHeroDamage, lastData.avgHeroDamage)
      }
    }
    
    comparison.push(heroData)
  }
  
  return comparison
}

/**
 * Compare players across years
 * @param {Array} rows - All rows
 * @param {Array<number>} years - Years to compare
 * @returns {Array} - Array of player comparison objects
 */
export function comparePlayersAcrossYears(rows, years) {
  const playerStatsByYear = {}
  
  // Get stats for each year
  for (const year of years) {
    playerStatsByYear[year] = getPlayerStatsByYear(rows, year)
  }
  
  // Get all unique players across all years
  const allPlayers = new Set()
  for (const year of years) {
    for (const player of playerStatsByYear[year]) {
      allPlayers.add(player.name)
    }
  }
  
  // Build comparison array
  const comparison = []
  
  for (const playerName of allPlayers) {
    const playerData = {
      name: playerName,
      years: {}
    }
    
    // Get data for each year
    for (const year of years) {
      const playerInYear = playerStatsByYear[year].find(p => p.name === playerName)
      if (playerInYear) {
        playerData.years[year] = {
          matches: playerInYear.matches,
          winRate: playerInYear.winRate,
          kda: playerInYear.kda,
          avgHeroDamage: playerInYear.avgHeroDamage,
          avgTotalDamage: playerInYear.avgTotalDamage
        }
      } else {
        playerData.years[year] = {
          matches: 0,
          winRate: 0,
          kda: 0,
          avgHeroDamage: 0,
          avgTotalDamage: 0
        }
      }
    }
    
    // Calculate changes (comparing first year to last year)
    if (years.length >= 2) {
      const sortedYears = [...years].sort((a, b) => a - b)
      const firstYear = sortedYears[0]
      const lastYear = sortedYears[sortedYears.length - 1]
      
      const firstData = playerData.years[firstYear]
      const lastData = playerData.years[lastYear]
      
      playerData.change = {
        matches: calculateDifference(firstData.matches, lastData.matches),
        winRate: calculateDifference(firstData.winRate, lastData.winRate),
        kda: calculateDifference(firstData.kda, lastData.kda),
        avgHeroDamage: calculateDifference(firstData.avgHeroDamage, lastData.avgHeroDamage)
      }
    }
    
    comparison.push(playerData)
  }
  
  return comparison
}

/**
 * Get top changes (heroes/players with biggest variations)
 * @param {Array} comparison - Comparison array from compareHeroesAcrossYears or comparePlayersAcrossYears
 * @param {string} metric - Metric to rank by ('matches', 'winRate', 'kda', etc.)
 * @param {number} limit - Number of top items to return
 * @param {string} direction - 'asc' for biggest increase, 'desc' for biggest decrease
 * @returns {Array} - Top items sorted by change
 */
export function getTopChanges(comparison, metric, limit = 10, direction = 'asc') {
  return comparison
    .filter(item => {
      // Filter out items with no significant data
      if (!item.change || !item.change[metric]) return false
      
      const changeAbsolute = item.change[metric]?.absolute || 0
      
      // Filter by direction: 'asc' = only positive changes (improvements), 'desc' = only negative changes (regressions)
      if (direction === 'asc' && changeAbsolute <= 0) return false
      if (direction === 'desc' && changeAbsolute >= 0) return false
      
      // Only include items that had at least some activity in both periods
      const sortedYears = Object.keys(item.years).map(Number).sort((a, b) => a - b)
      const firstYear = sortedYears[0]
      const lastYear = sortedYears[sortedYears.length - 1]
      
      const firstValue = item.years[firstYear]?.[metric === 'matches' ? 'matches' : metric] || 0
      const lastValue = item.years[lastYear]?.[metric === 'matches' ? 'matches' : metric] || 0
      
      // Minimum threshold: at least 5 matches/activity in first year
      if (metric === 'matches') {
        return firstValue >= 5
      } else {
        return item.years[firstYear]?.matches >= 5
      }
    })
    .sort((a, b) => {
      const aChange = a.change[metric]?.absolute || 0
      const bChange = b.change[metric]?.absolute || 0
      // For 'asc' (improvements): sort descending (biggest positive changes first)
      // For 'desc' (regressions): sort ascending (biggest negative changes first, i.e., most negative)
      return direction === 'asc' ? bChange - aChange : aChange - bChange
    })
    .slice(0, limit)
}

/**
 * Get evolution data for a metric over time (grouped by month)
 * @param {Array} rows - All rows
 * @param {Array<number>} years - Years to include
 * @param {string} metric - Metric to track ('winRate', 'totalMatches', 'avgGameTimeSeconds', 'avgTakedowns')
 * @returns {Array} - Array of { period, [year]: value } objects
 */
export function getEvolutionData(rows, years, metric) {
  const dataByPeriod = new Map()
  
  // Group rows by year-month
  for (const row of rows) {
    if (!row.dateObj) continue
    
    const year = row.dateObj.getFullYear()
    if (!years.includes(year)) continue
    
    const period = getYearMonth(row.dateObj)
    
    if (!dataByPeriod.has(period)) {
      dataByPeriod.set(period, {
        period,
        rowsByYear: {}
      })
    }
    
    const periodData = dataByPeriod.get(period)
    if (!periodData.rowsByYear[year]) {
      periodData.rowsByYear[year] = []
    }
    periodData.rowsByYear[year].push(row)
  }
  
  // Calculate metric for each period and year
  const result = []
  
  for (const [period, periodData] of dataByPeriod.entries()) {
    const entry = { period }
    
    for (const year of years) {
      const yearRows = periodData.rowsByYear[year] || []
      
      if (yearRows.length === 0) {
        entry[year] = null
        continue
      }
      
      let value = 0
      
      switch (metric) {
        case 'winRate':
          value = getWinRate(yearRows)
          break
        case 'totalMatches':
          value = yearRows.length
          break
        case 'avgGameTimeSeconds':
          value = getAverage(yearRows, 'gameTimeSeconds')
          break
        case 'avgTakedowns':
          value = getAverage(yearRows, 'takedowns')
          break
        default:
          value = 0
      }
      
      entry[year] = value
    }
    
    result.push(entry)
  }
  
  // Sort by period
  return result.sort((a, b) => a.period.localeCompare(b.period))
}

/**
 * Get color for a year (consistent palette)
 * @param {number} year - Year
 * @returns {string} - Hex color code
 */
export function getYearColor(year) {
  const colors = {
    2023: '#8b5cf6', // violeta
    2024: '#6366f1', // índigo
    2025: '#10b981', // verde
    2026: '#f59e0b', // ámbar
    2027: '#ef4444'  // rojo
  }
  
  return colors[year] || '#64748b' // Default gray if year not in palette
}
