import { getPublicPath } from '../utils/paths'

/**
 * Load the list of players from resources/players.json
 * The file contains player names, one per line
 * @returns {Promise<Set<string>>} - Set of player names (for fast lookup)
 */
export async function loadPlayersList() {
  try {
    // In Vite, files in public/ are served from root
    const response = await fetch(getPublicPath('/resources/players.json'))
    
    if (!response.ok) {
      console.warn('Could not load players.json, using empty list')
      return new Set()
    }
    
    const text = await response.text()
    // Parse the file - it's a text file with one player name per line
    // Normalize player names to match the normalization in normalizeRow.js
    const normalizePlayerName = (name) => {
      if (!name) return name
      const normalized = name.trim()
      
      // Map aliases to canonical names (case-insensitive) - same as normalizeRow.js
      const playerAliases = {
        'swift': 'WatchdogMan',
        'watchdogman': 'WatchdogMan',
        'watchdog': 'WatchdogMan',
        'bronzehearth': 'Indigente',
        'henta1sama': 'Indigente',
        'esshigod': 'Indigente',
        'zombicioso': 'Indigente',
        'chapel': 'ChapelHots'
      }
      
      const normalizedLower = normalized.toLowerCase()
      if (playerAliases[normalizedLower]) {
        return playerAliases[normalizedLower]
      }
      
      return normalized
    }
    
    const players = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(name => normalizePlayerName(name.trim()))
      .filter(name => name) // Remove any empty names after normalization
    
    // Remove duplicates (in case Swift and WatchdogMan both normalize to WatchdogMan)
    const uniquePlayers = [...new Set(players)]
    
    console.log(`Loaded ${uniquePlayers.length} players from players.json (normalized):`, uniquePlayers)
    return new Set(uniquePlayers)
  } catch (error) {
    console.warn('Error loading players.json:', error)
    return new Set()
  }
}
