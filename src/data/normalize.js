import { normalizeRow } from './normalizeRow'

/**
 * Normalize all rows and compute metadata
 * @param {Array} rawRows - Raw CSV rows
 * @returns {{ rows: Array, meta: Object }}
 */
export function normalizeData(rawRows) {
  const rows = []
  
  // Sets for unique values
  const players = new Set()
  const heroes = new Set()
  const maps = new Set()
  const roles = new Set()
  
  let dateMin = null
  let dateMax = null
  
  for (const rawRow of rawRows) {
    const row = normalizeRow(rawRow)
    rows.push(row)
    
    // Collect unique values
    if (row.playerName) players.add(row.playerName)
    if (row.heroName) heroes.add(row.heroName)
    if (row.map) maps.add(row.map)
    if (row.role && row.role !== 'Unknown') roles.add(row.role)
    
    // Track date range
    if (row.dateObj) {
      if (!dateMin || row.dateObj < dateMin) dateMin = row.dateObj
      if (!dateMax || row.dateObj > dateMax) dateMax = row.dateObj
    }
  }
  
  const meta = {
    totalRows: rows.length,
    dateMin,
    dateMax,
    players: Array.from(players).sort(),
    heroes: Array.from(heroes).sort(),
    maps: Array.from(maps).sort(),
    roles: Array.from(roles).sort()
  }
  
  return { rows, meta }
}
