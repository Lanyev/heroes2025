import { getPublicPath } from './paths'

/**
 * Geeko TCG Card System
 * Determines card archetype, rarity, and signature stat based on player statistics
 */

// =====================
// CONSTANTS & THEMES
// =====================

// Geeko players list
export const GEEKO_PLAYERS = [
  'Raizenser', 'Ticoman', 'WatchdogMan', 'Deathmask', 'Swift',
  'Indigente', 'ChapelHots', 'Malenfant', 'Rampage15th', 'Omarman', 'Tarkus'
]

// Card archetypes mapped to Pokémon-like types
export const ARCHETYPES = {
  CARRY: {
    id: 'carry',
    name: 'Carry',
    subtitle: 'Assassin Type',
    pokemonType: 'Dark/Fighting',
    energyIcon: '⚔️',
    description: 'Elimina enemigos con precisión letal'
  },
  DAMAGE: {
    id: 'damage',
    name: 'Damage Dealer',
    subtitle: 'Fire Type',
    pokemonType: 'Fire',
    energyIcon: '🔥',
    description: 'Inflige daño devastador'
  },
  TANK: {
    id: 'tank',
    name: 'Tank',
    subtitle: 'Steel Type',
    pokemonType: 'Steel/Rock',
    energyIcon: '🛡️',
    description: 'Absorbe daño enemigo'
  },
  SUPPORT: {
    id: 'support',
    name: 'Support',
    subtitle: 'Fairy Type',
    pokemonType: 'Fairy/Grass',
    energyIcon: '💚',
    description: 'Mantiene al equipo con vida'
  },
  MACRO: {
    id: 'macro',
    name: 'Macro',
    subtitle: 'Psychic Type',
    pokemonType: 'Psychic/Ghost',
    energyIcon: '🔮',
    description: 'Domina objetivos y estructuras'
  }
}

// Theme colors for each archetype (Pokémon-inspired palettes)
export const ARCHETYPE_THEMES = {
  carry: {
    primary: '#6366f1',      // Indigo
    secondary: '#a855f7',    // Purple
    glow: 'rgba(99, 102, 241, 0.6)',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
    frame: 'linear-gradient(145deg, #4338ca 0%, #5b21b6 50%, #4f46e5 100%)',
    holoPattern: 'psychic',
    energyColor: '#818cf8'
  },
  damage: {
    primary: '#ef4444',      // Red
    secondary: '#f97316',    // Orange
    glow: 'rgba(239, 68, 68, 0.6)',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #ef4444 100%)',
    frame: 'linear-gradient(145deg, #b91c1c 0%, #c2410c 50%, #dc2626 100%)',
    holoPattern: 'fire',
    energyColor: '#f87171'
  },
  tank: {
    primary: '#06b6d4',      // Cyan
    secondary: '#3b82f6',    // Blue
    glow: 'rgba(6, 182, 212, 0.6)',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #2563eb 50%, #06b6d4 100%)',
    frame: 'linear-gradient(145deg, #0e7490 0%, #1d4ed8 50%, #0891b2 100%)',
    holoPattern: 'water',
    energyColor: '#22d3ee'
  },
  support: {
    primary: '#10b981',      // Emerald
    secondary: '#ec4899',    // Pink
    glow: 'rgba(16, 185, 129, 0.6)',
    gradient: 'linear-gradient(135deg, #059669 0%, #db2777 30%, #10b981 100%)',
    frame: 'linear-gradient(145deg, #047857 0%, #be185d 50%, #059669 100%)',
    holoPattern: 'fairy',
    energyColor: '#34d399'
  },
  macro: {
    primary: '#f59e0b',      // Amber
    secondary: '#8b5cf6',    // Violet
    glow: 'rgba(245, 158, 11, 0.6)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #7c3aed 50%, #f59e0b 100%)',
    frame: 'linear-gradient(145deg, #b45309 0%, #6d28d9 50%, #d97706 100%)',
    holoPattern: 'psychic',
    energyColor: '#fbbf24'
  }
}

// Rarity definitions with visual properties
export const RARITIES = {
  LEGENDARY: {
    id: 'legendary',
    name: 'Legendary',
    stars: 4,
    symbol: '★★★★',
    holoType: 'rainbow',
    foilIntensity: 1.0,
    glareIntensity: 1.2,
    borderGlow: true,
    description: 'El jugador más excepcional'
  },
  EPIC: {
    id: 'epic',
    name: 'Epic',
    stars: 3,
    symbol: '★★★',
    holoType: 'reverse',
    foilIntensity: 0.8,
    glareIntensity: 1.0,
    borderGlow: true,
    description: 'Rendimiento sobresaliente'
  },
  RARE: {
    id: 'rare',
    name: 'Rare',
    stars: 2,
    symbol: '★★',
    holoType: 'standard',
    foilIntensity: 0.5,
    glareIntensity: 0.7,
    borderGlow: false,
    description: 'Jugador destacado'
  },
  COMMON: {
    id: 'common',
    name: 'Common',
    stars: 1,
    symbol: '★',
    holoType: 'none',
    foilIntensity: 0,
    glareIntensity: 0.3,
    borderGlow: false,
    description: 'Jugador base'
  }
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Calculate percentile value for a metric within a dataset
 * @param {number[]} values - Array of numeric values
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number}
 */
export function calculatePercentile(values, percentile) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Get the percentile rank of a value within a dataset
 * @param {number} value - Value to rank
 * @param {number[]} values - Array of all values
 * @returns {number} - Percentile rank (0-100)
 */
export function getPercentileRank(value, values) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const belowCount = sorted.filter(v => v < value).length
  return (belowCount / sorted.length) * 100
}

/**
 * Check if a value is in the top percentile
 * @param {number} value 
 * @param {number[]} values 
 * @param {number} percentile - e.g., 75 for P75
 * @returns {boolean}
 */
function isTopPercentile(value, values, percentile = 75) {
  const threshold = calculatePercentile(values, percentile)
  return value >= threshold
}

/**
 * Get rank position (1 = top) for a value in descending order
 * @param {number} value 
 * @param {number[]} values 
 * @returns {number}
 */
function getRank(value, values) {
  const sorted = [...values].sort((a, b) => b - a)
  return sorted.indexOf(value) + 1 || sorted.length
}

// =====================
// STATS CALCULATION
// =====================

/**
 * Calculate comprehensive stats for Geeko players from raw rows
 * @param {Array} rows - All match rows
 * @returns {Array} - Stats for each Geeko player
 */
export function calculateGeekoStats(rows) {
  const playerStats = new Map()
  
  // Initialize stats for all Geeko players
  for (const name of GEEKO_PLAYERS) {
    playerStats.set(name.toLowerCase(), {
      name,
      gamesPlayed: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      heroDamage: 0,
      siegeDamage: 0,
      damageTaken: 0,
      healing: 0,
      onFireCount: 0,
      experience: 0
    })
  }
  
  // Aggregate stats from rows
  for (const row of rows) {
    const nameLower = (row.playerName || '').toLowerCase()
    if (!playerStats.has(nameLower)) continue
    
    const stats = playerStats.get(nameLower)
    stats.gamesPlayed++
    if (row.winner) stats.wins++
    stats.kills += row.heroKills || 0
    stats.deaths += row.deaths || 0
    stats.assists += row.assists || 0
    stats.heroDamage += row.heroDamage || 0
    stats.siegeDamage += row.siegeDamage || 0
    stats.damageTaken += row.damageTaken || 0
    stats.healing += row.healingShielding || 0
    stats.onFireCount += (row.onFire || 0) > 0 ? 1 : 0
    stats.experience += row.experience || 0
  }
  
  // Calculate derived metrics
  const result = []
  for (const stats of playerStats.values()) {
    const games = stats.gamesPlayed || 1
    
    result.push({
      ...stats,
      winRate: stats.wins / games,
      avgKills: stats.kills / games,
      avgDeaths: stats.deaths / games,
      avgAssists: stats.assists / games,
      avgDamage: stats.heroDamage / games,
      avgTotalDamage: (stats.heroDamage + stats.siegeDamage) / games,
      avgDamageTaken: stats.damageTaken / games,
      avgHealing: stats.healing / games,
      avgSiege: stats.siegeDamage / games,
      kda: stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : stats.kills + stats.assists,
      totalDamage: stats.heroDamage + stats.siegeDamage
    })
  }
  
  return result
}

// =====================
// ARCHETYPE DETERMINATION
// =====================

/**
 * Determine player's card archetype based on their stats
 * Uses percentile comparisons within the Geeko player pool
 * 
 * @param {Object} playerStats - Individual player stats
 * @param {Array} allStats - Stats of all Geeko players for comparison
 * @returns {Object} - Archetype definition
 */
export function getCardArchetype(playerStats, allStats) {
  // Extract all values for percentile calculations
  const allKillsPerGame = allStats.map(s => s.avgKills)
  const allDamagePerGame = allStats.map(s => s.avgDamage)
  const allDeathsPerGame = allStats.map(s => s.avgDeaths)
  const allHealingPerGame = allStats.map(s => s.avgHealing)
  const allSiegePerGame = allStats.map(s => s.avgSiege)
  
  // Calculate percentile ranks for this player
  const killsRank = getPercentileRank(playerStats.avgKills, allKillsPerGame)
  const damageRank = getPercentileRank(playerStats.avgDamage, allDamagePerGame)
  const deathsRank = getPercentileRank(playerStats.avgDeaths, allDeathsPerGame)
  const healingRank = getPercentileRank(playerStats.avgHealing, allHealingPerGame)
  const siegeRank = getPercentileRank(playerStats.avgSiege, allSiegePerGame)
  
  // Determine archetype by priority
  
  // 1. CARRY - Top kills per game (high assassin potential)
  if (killsRank >= 75 && killsRank > damageRank) {
    return ARCHETYPES.CARRY
  }
  
  // 2. DAMAGE - Top damage dealer
  if (damageRank >= 75) {
    return ARCHETYPES.DAMAGE
  }
  
  // 3. SUPPORT - Significant healing contribution
  if (healingRank >= 60 && playerStats.avgHealing > 5000) {
    return ARCHETYPES.SUPPORT
  }
  
  // 4. TANK - High deaths but contributes to fights (frontline soaking)
  if (deathsRank >= 60 && playerStats.winRate >= 0.45) {
    return ARCHETYPES.TANK
  }
  
  // 5. MACRO - High siege damage / objective focus
  if (siegeRank >= 60) {
    return ARCHETYPES.MACRO
  }
  
  // Fallback priority: Damage > Carry > Tank > Macro
  if (damageRank >= 50) return ARCHETYPES.DAMAGE
  if (killsRank >= 50) return ARCHETYPES.CARRY
  if (deathsRank >= 50) return ARCHETYPES.TANK
  
  return ARCHETYPES.MACRO
}

// =====================
// RARITY DETERMINATION
// =====================

/**
 * Determine player's card rarity based on stats
 * Uses internal percentiles among Geeko players
 * 
 * @param {Object} playerStats - Individual player stats
 * @param {Array} allStats - Stats of all Geeko players
 * @returns {Object} - Rarity definition
 */
export function getRarity(playerStats, allStats) {
  const allWinRates = allStats.map(s => s.winRate)
  const allGamesPlayed = allStats.map(s => s.gamesPlayed)
  const allTotalDamage = allStats.map(s => s.totalDamage)
  const allKills = allStats.map(s => s.kills)
  
  const gamesP75 = calculatePercentile(allGamesPlayed, 75)
  const gamesP50 = calculatePercentile(allGamesPlayed, 50)
  
  // Check if top 1 in any major metric
  const isTopDamage = getRank(playerStats.totalDamage, allTotalDamage) === 1
  const isTopKills = getRank(playerStats.kills, allKills) === 1
  const isTopWinRate = getRank(playerStats.winRate, allWinRates) === 1
  
  // Check if top 3 in any metric
  const isTop3Damage = getRank(playerStats.totalDamage, allTotalDamage) <= 3
  const isTop3Kills = getRank(playerStats.kills, allKills) <= 3
  const isTop3WinRate = getRank(playerStats.winRate, allWinRates) <= 3
  
  // LEGENDARY: High winrate + high activity OR top 1 in key metric
  if ((playerStats.winRate >= 0.55 && playerStats.gamesPlayed >= gamesP75) ||
      isTopDamage || isTopKills || isTopWinRate) {
    return RARITIES.LEGENDARY
  }
  
  // EPIC: Good winrate + decent activity OR top 3 in key metric
  if ((playerStats.winRate >= 0.52 && playerStats.gamesPlayed >= gamesP50) ||
      isTop3Damage || isTop3Kills || isTop3WinRate) {
    return RARITIES.EPIC
  }
  
  // RARE: Decent games or winrate
  if (playerStats.gamesPlayed >= gamesP50 || playerStats.winRate >= 0.50) {
    return RARITIES.RARE
  }
  
  // COMMON: Everyone else
  return RARITIES.COMMON
}

// =====================
// SIGNATURE STAT
// =====================

/**
 * Get the signature stat for a player card (main highlight stat)
 * Maps to Pokémon card "HP" or "Attack" equivalent
 * 
 * @param {Object} playerStats - Player stats
 * @param {Object} archetype - Player's archetype
 * @returns {Object} - Signature stat info
 */
export function getSignatureStat(playerStats, archetype) {
  switch (archetype.id) {
    case 'damage':
      return {
        label: 'Total Damage',
        shortLabel: 'DMG',
        value: playerStats.totalDamage,
        displayValue: formatLargeNumber(playerStats.totalDamage),
        perGame: formatLargeNumber(playerStats.avgDamage),
        icon: '💥',
        description: 'Daño total infligido'
      }
    
    case 'carry':
      return {
        label: 'Total Kills',
        shortLabel: 'KILLS',
        value: playerStats.kills,
        displayValue: playerStats.kills.toString(),
        perGame: playerStats.avgKills.toFixed(1),
        icon: '🗡️',
        description: 'Eliminaciones totales'
      }
    
    case 'tank':
      return {
        label: 'Damage Soaked',
        shortLabel: 'TANK',
        value: playerStats.damageTaken,
        displayValue: formatLargeNumber(playerStats.damageTaken),
        perGame: formatLargeNumber(playerStats.avgDamageTaken),
        icon: '🛡️',
        description: 'Daño absorbido'
      }
    
    case 'support':
      return {
        label: 'Healing Done',
        shortLabel: 'HEAL',
        value: playerStats.healing,
        displayValue: formatLargeNumber(playerStats.healing),
        perGame: formatLargeNumber(playerStats.avgHealing),
        icon: '💚',
        description: 'Sanación total'
      }
    
    case 'macro':
      return {
        label: 'Siege Damage',
        shortLabel: 'SIEGE',
        value: playerStats.siegeDamage,
        displayValue: formatLargeNumber(playerStats.siegeDamage),
        perGame: formatLargeNumber(playerStats.avgSiege),
        icon: '🏰',
        description: 'Daño a estructuras'
      }
    
    default:
      return {
        label: 'Total Damage',
        shortLabel: 'DMG',
        value: playerStats.totalDamage,
        displayValue: formatLargeNumber(playerStats.totalDamage),
        perGame: formatLargeNumber(playerStats.avgDamage),
        icon: '⚡',
        description: 'Daño total'
      }
  }
}

// =====================
// CARD DATA BUILDER
// =====================

/**
 * Build complete card data for all Geeko players
 * @param {Array} rows - All match rows from dataset
 * @returns {Array} - Complete card data for each player
 */
export function buildGeekoCards(rows) {
  const allStats = calculateGeekoStats(rows)
  
  // Filter out players with 0 games
  const activeStats = allStats.filter(s => s.gamesPlayed > 0)
  
  return activeStats.map((stats, index) => {
    const archetype = getCardArchetype(stats, activeStats)
    const rarity = getRarity(stats, activeStats)
    const signatureStat = getSignatureStat(stats, archetype)
    const theme = ARCHETYPE_THEMES[archetype.id]
    
    return {
      id: `geeko-${stats.name.toLowerCase()}`,
      playerName: stats.name,
      cardNumber: index + 1,
      totalCards: activeStats.length,
      
      // Core stats
      stats: {
        gamesPlayed: stats.gamesPlayed,
        wins: stats.wins,
        winRate: stats.winRate,
        kills: stats.kills,
        deaths: stats.deaths,
        assists: stats.assists,
        kda: stats.kda,
        avgKills: stats.avgKills,
        avgDeaths: stats.avgDeaths,
        totalDamage: stats.totalDamage,
        avgDamage: stats.avgDamage,
        damageTaken: stats.damageTaken,
        avgDamageTaken: stats.avgDamageTaken,
        healing: stats.healing,
        avgHealing: stats.avgHealing,
        siegeDamage: stats.siegeDamage,
        avgSiege: stats.avgSiege,
        onFireCount: stats.onFireCount
      },
      
      // Card properties
      archetype,
      rarity,
      signatureStat,
      theme,
      
      // Secondary stats for card display
      secondaryStats: getSecondaryStats(stats, archetype),
      
      // Card flavor
      weakness: getWeakness(stats),
      evolution: getEvolution(stats)
    }
  }).sort((a, b) => {
    // Sort by rarity first (Legendary > Epic > Rare > Common)
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
    const rarityDiff = rarityOrder[a.rarity.id] - rarityOrder[b.rarity.id]
    if (rarityDiff !== 0) return rarityDiff
    
    // Then by games played
    return b.stats.gamesPlayed - a.stats.gamesPlayed
  })
}

/**
 * Get secondary stats for card display (like Pokémon attacks)
 */
function getSecondaryStats(stats, archetype) {
  const result = []
  
  // Always show Win Rate
  result.push({
    label: 'Win Rate',
    value: `${(stats.winRate * 100).toFixed(1)}%`,
    icon: '📈'
  })
  
  // KDA
  result.push({
    label: 'KDA',
    value: stats.kda.toFixed(2),
    icon: '⚔️'
  })
  
  // Games played
  result.push({
    label: 'Games',
    value: stats.gamesPlayed.toString(),
    icon: '🎮'
  })
  
  // Archetype-specific stat
  switch (archetype.id) {
    case 'damage':
      result.push({
        label: 'Avg Damage',
        value: formatLargeNumber(stats.avgDamage),
        icon: '💥'
      })
      break
    case 'carry':
      result.push({
        label: 'Avg Kills',
        value: stats.avgKills.toFixed(1),
        icon: '🗡️'
      })
      break
    case 'tank':
      result.push({
        label: 'Avg Soaked',
        value: formatLargeNumber(stats.avgDamageTaken),
        icon: '🛡️'
      })
      break
    case 'support':
      result.push({
        label: 'Avg Healing',
        value: formatLargeNumber(stats.avgHealing),
        icon: '💚'
      })
      break
    case 'macro':
      result.push({
        label: 'Avg Siege',
        value: formatLargeNumber(stats.avgSiege),
        icon: '🏰'
      })
      break
  }
  
  return result
}

/**
 * Get weakness text based on stats (like Pokémon weakness)
 */
function getWeakness(stats) {
  if (stats.avgDeaths > 4) {
    return { type: 'Aggression', value: '×2', description: 'Muere con frecuencia' }
  }
  if (stats.winRate < 0.45) {
    return { type: 'Momentum', value: '×2', description: 'Lucha por ganar' }
  }
  if (stats.gamesPlayed < 20) {
    return { type: 'Experience', value: '×1.5', description: 'Pocas partidas' }
  }
  return null
}

/**
 * Get evolution text based on performance (like Pokémon evolution)
 */
function getEvolution(stats) {
  if (stats.winRate >= 0.55 && stats.gamesPlayed >= 50) {
    return { stage: 'FINAL', text: 'Forma Definitiva' }
  }
  if (stats.winRate >= 0.50 && stats.gamesPlayed >= 30) {
    return { stage: 'STAGE 2', text: 'En Evolución' }
  }
  return { stage: 'BASIC', text: 'Forma Base' }
}

// =====================
// UTILITY FUNCTIONS
// =====================

/**
 * Format large numbers with K/M suffix
 */
function formatLargeNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return Math.round(num).toString()
}

/**
 * Get avatar path for a player
 * Returns the primary path (component will handle fallback)
 * Now prioritizes images with -profile suffix
 */
export function getPlayerAvatarPath(playerName) {
  if (!playerName) return ''
  
  // Normalize name for filename (remove spaces, special chars)
  const normalizedName = playerName.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
  
  // Return primary path with -profile suffix (component handles fallback via onError)
  return getPublicPath(`/players-images/${normalizedName}-profile.png`)
}

/**
 * Normalize player name for filename matching
 * Converts to lowercase and removes special characters/spaces
 * @param {string} playerName - Original player name
 * @returns {string} - Normalized name
 */
function normalizePlayerName(playerName) {
  if (!playerName) return ''
  return playerName.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
}

/**
 * Get player card image path
 * Searches for images matching pattern: {playerName}-card.{ext}
 * Supports multiple extensions: png, jpg, jpeg, webp
 * Returns fallback image if no card image is found
 * 
 * @param {string} playerName - Player name
 * @returns {string} - Public path to card image or fallback
 */
export function getPlayerCardImage(playerName) {
  if (!playerName) {
    return getPublicPath('/players-images/default-card.png')
  }
  
  const normalizedName = normalizePlayerName(playerName)
  
  // Supported extensions in order of preference
  const extensions = ['png', 'jpg', 'jpeg', 'webp']
  
  // Try each extension - return first match (Vite will handle 404s)
  // In production, we'll rely on the browser's onError handler
  // For now, return the most common format (png)
  // The component will handle fallback via onError
  return getPublicPath(`/players-images/${normalizedName}-card.png`)
}

/**
 * Get all possible card image paths for a player
 * Returns array of paths to try in order
 * Used by components to handle fallback logic
 * 
 * @param {string} playerName - Player name
 * @returns {string[]} - Array of paths to try
 */
export function getPlayerCardImageSources(playerName) {
  if (!playerName) {
    return [getPublicPath('/players-images/default-card.png')]
  }
  
  const normalizedName = normalizePlayerName(playerName)
  const extensions = ['png', 'jpg', 'jpeg', 'webp']
  
  // Return all possible paths in order of preference
  const paths = extensions.map(ext => 
    getPublicPath(`/players-images/${normalizedName}-card.${ext}`)
  )
  
  // Add fallback at the end
  paths.push(getPublicPath('/players-images/default-card.png'))
  
  return paths
}

/**
 * Load the card images index (lazy-loaded for performance)
 * @returns {Promise<Object|null>} - Index object or null if not available
 */
let cardImagesIndexCache = null
export async function loadCardImagesIndex() {
  if (cardImagesIndexCache !== null) {
    return cardImagesIndexCache
  }
  
  try {
    const response = await fetch(getPublicPath('/players-card-images-index.json'))
    if (response.ok) {
      cardImagesIndexCache = await response.json()
      return cardImagesIndexCache
    }
  } catch (error) {
    // Index not available, return null (fallback will be used)
    if (import.meta.env.DEV) {
      console.warn('[CardImages] Index not available, using fallback logic:', error)
    }
  }
  
  cardImagesIndexCache = null
  return null
}

/**
 * Check if a card image exists in the index
 * @param {string} playerName - Player name
 * @returns {Promise<boolean>} - True if image exists in index
 */
export async function hasPlayerCardImage(playerName) {
  if (!playerName) return false
  
  const index = await loadCardImagesIndex()
  if (!index || !index.availableCards) return true // Assume exists if index unavailable
  
  const normalizedName = normalizePlayerName(playerName)
  return index.availableCards.some(filename => 
    filename.startsWith(`${normalizedName}-card.`)
  )
}
