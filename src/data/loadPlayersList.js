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
    const players = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(name => name.trim())
    
    console.log(`Loaded ${players.length} players from players.json:`, players)
    return new Set(players)
  } catch (error) {
    console.warn('Error loading players.json:', error)
    return new Set()
  }
}
