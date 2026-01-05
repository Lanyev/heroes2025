import { isDateInRange } from '../utils/date'

/**
 * Create default filter state from metadata
 * @param {Object} meta 
 * @returns {Object}
 */
export function createFilterState(meta) {
  return {
    dateMin: meta.dateMin,
    dateMax: meta.dateMax,
    map: 'all',
    role: 'all',
    player: 'all',
    winner: 'all', // 'all', 'wins', 'losses'
    search: '',
    onlyListedPlayers: false // Filter to only show players from the players.json list
  }
}

/**
 * Apply filters to rows
 * @param {Array} rows - Normalized rows
 * @param {Object} filters - Current filter state
 * @returns {Array} - Filtered rows
 */
export function applyFilters(rows, filters, listedPlayersSet = null) {
  return rows.filter(row => {
    // Date range filter
    if (!isDateInRange(row.dateObj, filters.dateMin, filters.dateMax)) {
      return false
    }
    
    // Map filter
    if (filters.map !== 'all' && row.map !== filters.map) {
      return false
    }
    
    // Role filter
    if (filters.role !== 'all' && row.role !== filters.role) {
      return false
    }
    
    // Player filter
    if (filters.player !== 'all' && row.playerName !== filters.player) {
      return false
    }
    
    // Only listed players filter
    if (filters.onlyListedPlayers && listedPlayersSet) {
      if (!listedPlayersSet.has(row.playerName)) {
        return false
      }
    }
    
    // Winner filter
    if (filters.winner === 'wins' && !row.winner) {
      return false
    }
    if (filters.winner === 'losses' && row.winner) {
      return false
    }
    
    // Search filter (matches hero or player name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesHero = row.heroName.toLowerCase().includes(searchLower)
      const matchesPlayer = row.playerName.toLowerCase().includes(searchLower)
      if (!matchesHero && !matchesPlayer) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Get filter options for select components
 * @param {Object} meta 
 * @returns {Object}
 */
export function getFilterOptions(meta) {
  return {
    maps: [{ value: 'all', label: 'Todos los mapas' }, ...meta.maps.map(m => ({ value: m, label: m }))],
    roles: [{ value: 'all', label: 'Todos los roles' }, ...meta.roles.map(r => ({ value: r, label: r }))],
    players: [{ value: 'all', label: 'Todos los jugadores' }, ...meta.players.map(p => ({ value: p, label: p }))],
    winner: [
      { value: 'all', label: 'Todas las partidas' },
      { value: 'wins', label: 'Solo victorias' },
      { value: 'losses', label: 'Solo derrotas' }
    ]
  }
}
