import { parseDate, toISODateString } from '../utils/date'

/**
 * Map of hero names to their roles
 * Based on Heroes of the Storm hero classifications
 */
const HERO_ROLES = {
  // Tanks
  'Anub\'arak': 'Tank', 'Arthas': 'Tank', 'Blaze': 'Tank', 'Cho': 'Tank',
  'Diablo': 'Tank', 'E.T.C.': 'Tank', 'Garrosh': 'Tank', 'Johanna': 'Tank',
  'Mal\'Ganis': 'Tank', 'Mei': 'Tank', 'Muradin': 'Tank', 'Stitches': 'Tank',
  'Tyrael': 'Tank', 'Varian': 'Tank',
  
  // Bruisers
  'Artanis': 'Bruiser', 'Chen': 'Bruiser', 'D.Va': 'Bruiser', 'Deathwing': 'Bruiser',
  'Dehaka': 'Bruiser', 'Gazlowe': 'Bruiser', 'Hogger': 'Bruiser', 'Imperius': 'Bruiser',
  'Leoric': 'Bruiser', 'Malthael': 'Bruiser', 'Ragnaros': 'Bruiser', 'Rexxar': 'Bruiser',
  'Sonya': 'Bruiser', 'Thrall': 'Bruiser', 'Xul': 'Bruiser', 'Yrel': 'Bruiser',
  
  // Ranged Assassin
  'Azmodan': 'Ranged Assassin', 'Cassia': 'Ranged Assassin', 'Chromie': 'Ranged Assassin',
  'Falstad': 'Ranged Assassin', 'Fenix': 'Ranged Assassin', 'Gall': 'Ranged Assassin',
  'Genji': 'Ranged Assassin', 'Greymane': 'Ranged Assassin', 'Gul\'dan': 'Ranged Assassin',
  'Hanzo': 'Ranged Assassin', 'Jaina': 'Ranged Assassin', 'Junkrat': 'Ranged Assassin',
  'Kael\'thas': 'Ranged Assassin', 'Kel\'Thuzad': 'Ranged Assassin', 'Li-Ming': 'Ranged Assassin',
  'Lunara': 'Ranged Assassin', 'Mephisto': 'Ranged Assassin', 'Nazeebo': 'Ranged Assassin',
  'Nova': 'Ranged Assassin', 'Orphea': 'Ranged Assassin', 'Probius': 'Ranged Assassin',
  'Raynor': 'Ranged Assassin', 'Sgt. Hammer': 'Ranged Assassin', 'Sylvanas': 'Ranged Assassin',
  'Tassadar': 'Ranged Assassin', 'Tracer': 'Ranged Assassin', 'Tychus': 'Ranged Assassin',
  'Valla': 'Ranged Assassin', 'Zagara': 'Ranged Assassin', 'Zul\'jin': 'Ranged Assassin',
  
  // Melee Assassin
  'Alarak': 'Melee Assassin', 'Illidan': 'Melee Assassin', 'Kerrigan': 'Melee Assassin',
  'Maiev': 'Melee Assassin', 'Murky': 'Melee Assassin', 'Qhira': 'Melee Assassin',
  'Samuro': 'Melee Assassin', 'The Butcher': 'Melee Assassin', 'Valeera': 'Melee Assassin',
  'Zeratul': 'Melee Assassin',
  
  // Healers
  'Alexstrasza': 'Healer', 'Ana': 'Healer', 'Anduin': 'Healer', 'Auriel': 'Healer',
  'Brightwing': 'Healer', 'Deckard': 'Healer', 'Kharazim': 'Healer', 'Li Li': 'Healer',
  'Lt. Morales': 'Healer', 'Lúcio': 'Healer', 'Lucio': 'Healer', 'Malfurion': 'Healer',
  'Rehgar': 'Healer', 'Stukov': 'Healer', 'Tyrande': 'Healer', 'Uther': 'Healer',
  'Whitemane': 'Healer',
  
  // Supports
  'Abathur': 'Support', 'Medivh': 'Support', 'The Lost Vikings': 'Support', 'Zarya': 'Support'
}

/**
 * Get role for a hero name
 * @param {string} heroName 
 * @returns {string}
 */
export function getHeroRole(heroName) {
  if (!heroName) return 'Unknown'
  return HERO_ROLES[heroName] || 'Unknown'
}

/**
 * Normalize Winner field to boolean
 * Handles: true/false, TRUE/FALSE, "true"/"false", Yes/No, Win/Loss, 1/0, etc.
 * @param {any} value 
 * @returns {boolean}
 */
export function normalizeWinner(value) {
  if (value === true || value === 1) return true
  if (value === false || value === 0) return false
  
  const str = String(value).trim().toLowerCase()
  
  if (['true', 'yes', 'win', 'won', '1', 'victory', 'si', 'sí'].includes(str)) {
    return true
  }
  if (['false', 'no', 'loss', 'lost', '0', 'defeat', 'derrota'].includes(str)) {
    return false
  }
  
  return false
}

/**
 * Parse GameTime to seconds
 * Handles: "mm:ss", "hh:mm:ss", integer seconds
 * @param {any} value 
 * @returns {number}
 */
export function parseGameTime(value) {
  if (!value) return 0
  
  // Already a number
  if (typeof value === 'number') return value
  
  const str = String(value).trim()
  
  // Pure number string
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10)
  }
  
  // Time format: hh:mm:ss or mm:ss
  const parts = str.split(':').map(p => parseInt(p, 10) || 0)
  
  if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    // mm:ss
    return parts[0] * 60 + parts[1]
  }
  
  return 0
}

/**
 * Safely parse a numeric value
 * @param {any} value 
 * @param {number} defaultValue 
 * @returns {number}
 */
export function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') return defaultValue
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * Normalize a single row from the CSV
 * @param {Object} row - Raw CSV row
 * @returns {Object} - Normalized row
 */
export function normalizeRow(row) {
  // Parse date from Year + Name fields (contains date info)
  // Name field format: "-MM-DD HH.MM.SS MapName.StormReplay"
  const yearStr = String(row.Year || '').trim()
  const nameStr = String(row.Name || '').trim()
  
  let dateObj = null
  let dateISO = ''
  
  // Try to extract date from Year and Name
  // Year is like "2024" and Name starts with "-MM-DD"
  const dateMatch = nameStr.match(/^-(\d{2})-(\d{2})/)
  if (yearStr && dateMatch) {
    const [, month, day] = dateMatch
    dateObj = new Date(parseInt(yearStr), parseInt(month) - 1, parseInt(day))
    if (!isNaN(dateObj.getTime())) {
      dateISO = toISODateString(dateObj)
    }
  }
  
  // Fallback: try Date column if it exists
  if (!dateObj && row.Date) {
    dateObj = parseDate(row.Date)
    if (dateObj) {
      dateISO = toISODateString(dateObj)
    }
  }
  
  const heroName = String(row.HeroName || '').trim()
  const playerName = String(row.PlayerName || '').trim()
  const map = String(row.Map || '').trim()
  
  // Extract replay name from Name field (format: "-MM-DD HH.MM.SS MapName.StormReplay")
  // Store the full name string as replay name for searching
  const replayName = nameStr || String(row.Name || '').trim()
  
  return {
    // Identifiers
    playerName,
    heroName,
    map,
    replayName,
    
    // Derived role
    role: getHeroRole(heroName),
    
    // Game info
    team: String(row.Team || '').trim(),
    gameMode: String(row.GameMode || '').trim(),
    
    // Date handling
    dateObj,
    dateISO,
    year: yearStr,
    
    // Win status
    winner: normalizeWinner(row.Winner),
    
    // Time in seconds
    gameTimeSeconds: parseGameTime(row.GameTime),
    
    // Combat stats
    heroKills: safeNumber(row.HeroKills),
    assists: safeNumber(row.Assists),
    takedowns: safeNumber(row.Takedowns),
    deaths: safeNumber(row.Deaths),
    
    // Damage stats
    heroDamage: safeNumber(row.HeroDamage),
    siegeDamage: safeNumber(row.TotalSiegeDamage),
    damageTaken: safeNumber(row.DamageTaken),
    healingShielding: safeNumber(row.HealingShielding),
    selfHealing: safeNumber(row.SelfHealing),
    
    // Other stats
    experience: safeNumber(row.Experience),
    spentDeadSeconds: parseGameTime(row.SpentDead),
    onFire: parseGameTime(row.OnFire),
    
    // Awards
    award: String(row.Award || '').trim(),
    
    // Additional raw data we might need
    playerLevel: safeNumber(row.PlayerLevel),
    heroLevel: safeNumber(row.HeroLevel),
  }
}
