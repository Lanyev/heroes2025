/**
 * Talent statistics calculations for heroes
 */

/**
 * Check if a talent value is valid (not empty, null, "Unknown", or "-")
 * @param {string} talent 
 * @returns {boolean}
 */
function isValidTalent(talent) {
  if (!talent) return false
  const normalized = String(talent).trim()
  if (normalized === '' || normalized === 'Unknown' || normalized === '-' || normalized === 'null') {
    return false
  }
  return true
}

/**
 * Get talent statistics by level for a specific hero
 * @param {Array} rows - All rows from dataset
 * @param {string} heroName - Hero to analyze
 * @returns {Object} - Object with stats by level { 1: [...], 4: [...], ... }
 */
export function getTalentStatsByHero(rows, heroName) {
  const heroRows = rows.filter(r => r.heroName === heroName)
  
  if (heroRows.length === 0) {
    return {}
  }
  
  const levels = [1, 4, 7, 10, 13, 16, 20]
  const result = {}
  
  for (const level of levels) {
    const talentKey = `talentL${level}`
    const talentStats = {}
    let totalGamesWithTalent = 0
    
    // Count games and wins for each talent at this level
    for (const row of heroRows) {
      const talent = row[talentKey]
      if (!isValidTalent(talent)) continue
      
      totalGamesWithTalent++
      
      if (!talentStats[talent]) {
        talentStats[talent] = {
          talent,
          games: 0,
          wins: 0
        }
      }
      
      talentStats[talent].games++
      if (row.winner) {
        talentStats[talent].wins++
      }
    }
    
    // Calculate percentages and sort
    const statsArray = Object.values(talentStats)
      .map(stat => ({
        talent: stat.talent,
        games: stat.games,
        pickPct: totalGamesWithTalent > 0 ? (stat.games / totalGamesWithTalent) * 100 : 0,
        winPct: stat.games > 0 ? (stat.wins / stat.games) * 100 : 0
      }))
      .sort((a, b) => {
        // Sort by pickPct DESC, then winPct DESC, then games DESC
        if (Math.abs(a.pickPct - b.pickPct) > 0.01) {
          return b.pickPct - a.pickPct
        }
        if (Math.abs(a.winPct - b.winPct) > 0.01) {
          return b.winPct - a.winPct
        }
        return b.games - a.games
      })
      .slice(0, 8) // Top 8 talentos
    
    result[level] = statsArray
  }
  
  return result
}

/**
 * Build a synthetic build from most popular talents by level
 * @param {Array} rows - All rows from dataset
 * @param {string} heroName - Hero to analyze
 * @returns {Object|null} - Synthetic build or null if no talent data
 */
function buildSyntheticBuild(rows, heroName) {
  const heroRows = rows.filter(r => r.heroName === heroName)
  const levels = [1, 4, 7, 10, 13, 16, 20]
  const talents = {}
  
  // Get most popular talent for each level (prioritizing win rate)
  for (const level of levels) {
    const talentKey = `talentL${level}`
    const talentStats = {}
    let levelGames = 0
    
    for (const row of heroRows) {
      const talent = row[talentKey]
      if (!isValidTalent(talent)) continue
      
      levelGames++
      
      if (!talentStats[talent]) {
        talentStats[talent] = {
          talent,
          games: 0,
          wins: 0
        }
      }
      
      talentStats[talent].games++
      if (row.winner) {
        talentStats[talent].wins++
      }
    }
    
    if (levelGames === 0) {
      // No valid talent at this level
      return null
    }
    
    // Find best talent: prioritize win rate, then pick rate, then games
    const statsArray = Object.values(talentStats)
      .map(stat => ({
        talent: stat.talent,
        games: stat.games,
        pickPct: (stat.games / levelGames) * 100,
        winPct: stat.games > 0 ? (stat.wins / stat.games) * 100 : 0
      }))
      .sort((a, b) => {
        // Sort by winPct DESC, then pickPct DESC, then games DESC
        if (Math.abs(a.winPct - b.winPct) > 0.01) {
          return b.winPct - a.winPct
        }
        if (Math.abs(a.pickPct - b.pickPct) > 0.01) {
          return b.pickPct - a.pickPct
        }
        return b.games - a.games
      })
    
    if (statsArray.length > 0) {
      talents[level] = statsArray[0].talent
    } else {
      return null
    }
  }
  
  // Now try to find matches that use most of these talents to calculate a realistic win rate
  // Count matches that have at least 5 out of 7 talents matching
  let matchingGames = 0
  let matchingWins = 0
  
  for (const row of heroRows) {
    let matches = 0
    if (isValidTalent(row.talentL1) && row.talentL1 === talents[1]) matches++
    if (isValidTalent(row.talentL4) && row.talentL4 === talents[4]) matches++
    if (isValidTalent(row.talentL7) && row.talentL7 === talents[7]) matches++
    if (isValidTalent(row.talentL10) && row.talentL10 === talents[10]) matches++
    if (isValidTalent(row.talentL13) && row.talentL13 === talents[13]) matches++
    if (isValidTalent(row.talentL16) && row.talentL16 === talents[16]) matches++
    if (isValidTalent(row.talentL20) && row.talentL20 === talents[20]) matches++
    
    // If at least 5 talents match, count this game
    if (matches >= 5) {
      matchingGames++
      if (row.winner) {
        matchingWins++
      }
    }
  }
  
  // If we have matching games, use that win rate
  // Otherwise, calculate average win rate of individual talents
  let winPct = 0
  let totalGames = 0
  
  if (matchingGames > 0) {
    winPct = (matchingWins / matchingGames) * 100
    totalGames = matchingGames
  } else {
    // Calculate average win rate of individual talents
    let totalWinPct = 0
    let talentCount = 0
    
    for (const level of levels) {
      const talentKey = `talentL${level}`
      const talentStats = {}
      
      for (const row of heroRows) {
        const talent = row[talentKey]
        if (!isValidTalent(talent) || talent !== talents[level]) continue
        
        if (!talentStats[talent]) {
          talentStats[talent] = { games: 0, wins: 0 }
        }
        
        talentStats[talent].games++
        if (row.winner) {
          talentStats[talent].wins++
        }
      }
      
      const stat = talentStats[talents[level]]
      if (stat && stat.games > 0) {
        totalWinPct += (stat.wins / stat.games) * 100
        totalGames += stat.games
        talentCount++
      }
    }
    
    if (talentCount > 0) {
      winPct = totalWinPct / talentCount
    }
  }
  
  return {
    talents,
    games: totalGames || matchingGames,
    wins: matchingWins,
    winPct,
    isSynthetic: true
  }
}

/**
 * Get the best build (combination of all talents) for a hero
 * @param {Array} rows - All rows from dataset
 * @param {string} heroName - Hero to analyze
 * @param {number} minGames - Minimum games required for a build (default 5)
 * @returns {Object|null} - Best build or null if no valid builds
 */
export function getBestBuildByHero(rows, heroName, minGames = 5) {
  const heroRows = rows.filter(r => r.heroName === heroName)
  
  if (heroRows.length === 0) {
    return null
  }
  
  const buildMap = {}
  
  // Group rows by complete build (all 7 talents)
  for (const row of heroRows) {
    const talents = {
      1: row.talentL1,
      4: row.talentL4,
      7: row.talentL7,
      10: row.talentL10,
      13: row.talentL13,
      16: row.talentL16,
      20: row.talentL20
    }
    
    // Check if all talents are valid
    const allValid = Object.values(talents).every(t => isValidTalent(t))
    if (!allValid) continue
    
    // Create a unique key for this build
    const buildKey = `${talents[1]}|${talents[4]}|${talents[7]}|${talents[10]}|${talents[13]}|${talents[16]}|${talents[20]}`
    
    if (!buildMap[buildKey]) {
      buildMap[buildKey] = {
        talents,
        games: 0,
        wins: 0
      }
    }
    
    buildMap[buildKey].games++
    if (row.winner) {
      buildMap[buildKey].wins++
    }
  }
  
  // First, try to find builds with >= minGames
  let validBuilds = Object.values(buildMap)
    .filter(build => build.games >= minGames)
    .map(build => ({
      talents: build.talents,
      games: build.games,
      wins: build.wins,
      winPct: build.games > 0 ? (build.wins / build.games) * 100 : 0,
      isSynthetic: false
    }))
  
  // If no builds with minGames, try any complete build (>= 1 game)
  if (validBuilds.length === 0) {
    validBuilds = Object.values(buildMap)
      .map(build => ({
        talents: build.talents,
        games: build.games,
        wins: build.wins,
        winPct: build.games > 0 ? (build.wins / build.games) * 100 : 0,
        isSynthetic: false
      }))
  }
  
  // Sort by winPct DESC, then games DESC
  if (validBuilds.length > 0) {
    validBuilds.sort((a, b) => {
      if (Math.abs(a.winPct - b.winPct) > 0.01) {
        return b.winPct - a.winPct
      }
      return b.games - a.games
    })
    
    return validBuilds[0]
  }
  
  // If no complete builds found, build a synthetic one from most popular talents
  const syntheticBuild = buildSyntheticBuild(rows, heroName)
  return syntheticBuild
}

/**
 * Get the most picked talent at a specific level for a hero
 * @param {Array} rows - All rows from dataset
 * @param {string} heroName - Hero to analyze
 * @param {number} level - Talent level (1, 4, 7, 10, 13, 16, 20)
 * @returns {Object|null} - Most picked talent stats or null
 */
export function getMostPickedTalentByLevel(rows, heroName, level) {
  const heroRows = rows.filter(r => r.heroName === heroName)
  
  if (heroRows.length === 0) {
    return null
  }
  
  const talentKey = `talentL${level}`
  const talentStats = {}
  let totalGamesWithTalent = 0
  
  // Count games and wins for each talent at this level
  for (const row of heroRows) {
    const talent = row[talentKey]
    if (!isValidTalent(talent)) continue
    
    totalGamesWithTalent++
    
    if (!talentStats[talent]) {
      talentStats[talent] = {
        talent,
        games: 0,
        wins: 0
      }
    }
    
    talentStats[talent].games++
    if (row.winner) {
      talentStats[talent].wins++
    }
  }
  
  if (totalGamesWithTalent === 0) {
    return null
  }
  
  // Calculate percentages
  const statsArray = Object.values(talentStats)
    .map(stat => ({
      talent: stat.talent,
      games: stat.games,
      pickPct: (stat.games / totalGamesWithTalent) * 100,
      winPct: stat.games > 0 ? (stat.wins / stat.games) * 100 : 0
    }))
    .sort((a, b) => {
      // Sort by pickPct DESC, then winPct DESC
      if (Math.abs(a.pickPct - b.pickPct) > 0.01) {
        return b.pickPct - a.pickPct
      }
      return b.winPct - a.winPct
    })
  
  return statsArray[0] || null
}
