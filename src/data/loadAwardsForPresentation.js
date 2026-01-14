/**
 * Parser robusto para el CSV de awards (tablas_awards.csv)
 * Este CSV tiene un formato especial con múltiples tablas lado a lado en columnas.
 * 
 * Estructura del CSV:
 * - Las tablas están dispuestas horizontalmente (en columnas adyacentes)
 * - Cada tabla tiene: título, header row, data rows
 * - Las tablas están separadas por columnas vacías
 */

import { heroSlug } from '../utils/slug'

// Columnas estándar que NO son la métrica principal
const STANDARD_COLUMNS = ['PlayerName', 'HeroName', 'GameTime', 'Winner', 'GperMin']

// Lista de nombres de premios conocidos para detectar
const KNOWN_AWARDS = [
  'Top Kills',
  'Top Hero Damage', 
  'Top Time Death',
  'Partida mas Corta',
  'Top Assists',
  'Top Siege Damage',
  'Top Time OnFire',
  'Partida mas Larga',
  'Top Deaths',
  'Top Tank Damage',
  'Top Capturas Mercenarios',
  'Top Kills W/Healer',
  'Less Tank Damage',
  'Top Globitos',
  'Top Damage W/Healer',
  'Top Healing',
  'Less Healing',
  'Top Self Healing',
  'Top Exp',
  'Top Minion Killer'
]

// Mapeo de nombres de premios a iconos y metadata
const AWARD_METADATA = {
  'Top Kills': { icon: '⚔️', color: 'red', description: 'Los jugadores con más eliminaciones en una partida' },
  'Top Hero Damage': { icon: '💥', color: 'orange', description: 'Máximo daño a héroes enemigos registrado' },
  'Top Time Death': { icon: '💀', color: 'gray', description: 'Tiempo total pasado muerto en una partida' },
  'Partida mas Corta': { icon: '⚡', color: 'yellow', description: 'Las victorias más rápidas del torneo' },
  'Top Assists': { icon: '🤝', color: 'blue', description: 'Jugadores con más asistencias en combate' },
  'Top Siege Damage': { icon: '🏰', color: 'brown', description: 'Máximo daño a estructuras enemigas' },
  'Top Time OnFire': { icon: '🔥', color: 'orange', description: 'Mayor tiempo en estado "On Fire"' },
  'Partida mas Larga': { icon: '⏰', color: 'purple', description: 'Las batallas épicas más extensas' },
  'Top Deaths': { icon: '☠️', color: 'gray', description: 'Los jugadores más sacrificados (o temerarios)' },
  'Top Tank Damage': { icon: '🛡️', color: 'cyan', description: 'Máximo daño absorbido como tanque' },
  'Top Capturas Mercenarios': { icon: '👹', color: 'green', description: 'Expertos en capturar campamentos' },
  'Top Kills W/Healer': { icon: '💉', color: 'pink', description: 'Healers con más eliminaciones' },
  'Less Tank Damage': { icon: '🪶', color: 'lightblue', description: 'Tanques más evasivos (menos daño recibido)' },
  'Top Globitos': { icon: '🔮', color: 'purple', description: 'Coleccionistas de globos de regeneración' },
  'Top Damage W/Healer': { icon: '⚕️', color: 'pink', description: 'Healers que también hacen daño' },
  'Top Healing': { icon: '💚', color: 'green', description: 'Máxima curación en una partida' },
  'Less Healing': { icon: '💔', color: 'red', description: 'Healers con menor curación (partidas cortas)' },
  'Top Self Healing': { icon: '🩹', color: 'lime', description: 'Campeones de la auto-sustentación' },
  'Top Exp': { icon: '📈', color: 'gold', description: 'Máxima contribución de experiencia' },
  'Top Minion Killer': { icon: '🗡️', color: 'amber', description: 'Especialistas en eliminar oleadas' }
}

/**
 * Genera un slug único para un premio
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Detecta la columna que contiene la métrica principal
 * (la que no es PlayerName, HeroName, GameTime, Winner, GperMin)
 */
function detectMetricColumn(headers) {
  for (const header of headers) {
    if (!STANDARD_COLUMNS.includes(header) && header.trim()) {
      return header
    }
  }
  return headers[2] || 'Value' // Fallback a tercera columna
}

/**
 * Parsea el contenido del CSV y extrae todas las tablas de premios
 * El CSV tiene tablas lado a lado en columnas, no apiladas verticalmente
 * @param {string} csvText - Contenido del CSV como texto
 * @returns {Array} - Array de objetos award con estructura definida
 */
export function parseAwardsCSV(csvText) {
  const lines = csvText.split('\n').map(line => line.split(',').map(c => c.trim()))
  const awardsFound = new Map() // Para evitar duplicados
  
  // Buscar todas las celdas que contengan nombres de premios conocidos
  for (let row = 0; row < lines.length; row++) {
    for (let col = 0; col < lines[row].length; col++) {
      const cell = lines[row][col]
      
      if (KNOWN_AWARDS.includes(cell) && !awardsFound.has(cell)) {
        // Encontramos un título de premio
        const awardTitle = cell
        
        // La siguiente fila debería tener los headers
        const headerRow = row + 1
        if (headerRow >= lines.length) continue
        
        // Buscar los headers empezando en esta columna
        const headers = []
        let headerCol = col
        while (headerCol < lines[headerRow].length) {
          const headerCell = lines[headerRow][headerCol]
          if (headerCell === '') break // Fin de headers de esta tabla
          headers.push(headerCell)
          headerCol++
        }
        
        if (headers.length === 0) continue
        
        // Leer las filas de datos
        const rows = []
        let dataRow = row + 2
        
        while (dataRow < lines.length) {
          const dataLine = lines[dataRow]
          
          // Verificar si hay datos en la primera columna de esta tabla
          const firstValue = dataLine[col] || ''
          
          // Si está vacío o es otro título de premio, terminamos
          if (firstValue === '' || KNOWN_AWARDS.includes(firstValue)) {
            break
          }
          
          // Extraer valores para este row
          const rowData = {}
          let hasValidData = false
          
          for (let i = 0; i < headers.length; i++) {
            const value = dataLine[col + i] || ''
            rowData[headers[i]] = value
            if (value !== '' && (headers[i] === 'PlayerName' || headers[i] === 'GameTime')) {
              hasValidData = true
            }
          }
          
          if (hasValidData) {
            rows.push(rowData)
          }
          
          dataRow++
        }
        
        // Solo agregar si tiene datos
        if (rows.length > 0) {
          let metricKey = detectMetricColumn(headers)
          
          // Para premios de partida más corta/larga, forzar GameTime como metricKey
          const titleLower = awardTitle.toLowerCase()
          if (titleLower.includes('partida mas corta') || 
              titleLower.includes('partida mas larga') ||
              titleLower.includes('shortest game') ||
              titleLower.includes('longest game')) {
            metricKey = 'GameTime'
          }
          
          const metadata = AWARD_METADATA[awardTitle] || {
            icon: '🏆',
            color: 'purple',
            description: `Ranking basado en ${metricKey}`
          }
          
          awardsFound.set(awardTitle, {
            id: generateSlug(awardTitle),
            title: awardTitle,
            headers: headers,
            rows: rows,
            metricKey: metricKey,
            icon: metadata.icon,
            color: metadata.color,
            description: metadata.description
          })
        }
      }
    }
  }
  
  // Convertir Map a Array manteniendo un orden consistente
  const orderedAwards = []
  for (const title of KNOWN_AWARDS) {
    if (awardsFound.has(title)) {
      orderedAwards.push(awardsFound.get(title))
    }
  }
  
  return orderedAwards
}

import { getPublicPath } from '../utils/paths'

/**
 * Carga y parsea el CSV de awards para la presentación
 * @returns {Promise<Array>} - Array de premios parseados
 */
export async function loadAwardsForPresentation() {
  try {
    const response = await fetch(getPublicPath('/resources/tablas_awards.csv'))
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`)
    }
    const text = await response.text()
    return parseAwardsCSV(text)
  } catch (error) {
    console.error('Error loading awards for presentation:', error)
    return []
  }
}

/**
 * Formatea el valor de una métrica para mostrar
 */
export function formatMetricValue(value, metricKey) {
  if (!value) return '-'
  
  // Si parece ser un tiempo (HH:MM:SS o MM:SS)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    return value
  }
  
  const num = parseInt(value, 10)
  if (isNaN(num)) return value
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

/**
 * Obtiene el nombre de la métrica para mostrar en UI
 */
export function getMetricDisplayName(metricKey) {
  const names = {
    'HeroKills': 'Eliminaciones',
    'HeroDamage': 'Daño a Héroes',
    'SpentDead': 'Tiempo Muerto',
    'Assists': 'Asistencias',
    'Deaths': 'Muertes',
    'TotalSiegeDamage': 'Daño Siege',
    'DamageTaken': 'Daño Recibido',
    'MercCampCaptures': 'Capturas',
    'RegenGlobes': 'Globos',
    'HealingShielding': 'Curación',
    'SelfHealing': 'Auto-curación',
    'Experience': 'Experiencia',
    'OnFire': 'Tiempo On Fire',
    'GameTime': 'Duración'
  }
  return names[metricKey] || metricKey
}

/**
 * Detecta si un award requiere agrupación por "misma partida"
 * (Partida mas Corta / Partida mas Larga)
 */
export function requiresGrouping(award) {
  if (!award || !award.title) return false
  const titleLower = award.title.toLowerCase()
  return titleLower.includes('partida mas corta') || 
         titleLower.includes('partida mas larga') ||
         titleLower.includes('shortest game') ||
         titleLower.includes('longest game')
}

/**
 * Normaliza el valor de GameTime para usar como key de agrupación
 */
function normalizeGameTime(gameTime) {
  if (!gameTime) return ''
  // Trim y reemplazar espacios/commas extra
  let normalized = String(gameTime).trim().replace(/[,\s]+/g, ' ')
  // Si ya está en formato mm:ss o hh:mm:ss, conservarlo tal cual
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(normalized)) {
    return normalized
  }
  return normalized
}

/**
 * Agrupa las filas de un award por GameTime (y FileName si existe)
 * Solo para awards que requieren agrupación
 */
export function groupAwardRows(award) {
  if (!requiresGrouping(award)) {
    // No requiere agrupación, devolver como está pero con estructura de grupo
    return award.rows.map((row, index) => ({
      groupKey: `single-${index}`,
      gameTime: row.GameTime || '',
      rows: [row],
      displayParticipants: [{
        player: row.PlayerName || '',
        hero: row.HeroName || ''
      }]
    }))
  }

  const groups = new Map()
  const groupOrder = [] // Para mantener el orden de primera aparición

  for (const row of award.rows) {
    const gameTime = normalizeGameTime(row.GameTime)
    const fileName = row.FileName ? String(row.FileName).trim() : null
    
    // Crear key de grupo
    const groupKey = fileName 
      ? `${fileName}__${gameTime}`
      : gameTime

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupKey,
        gameTime: row.GameTime || gameTime, // Usar el original para display
        rows: [],
        displayParticipants: []
      })
      groupOrder.push(groupKey)
    }

    const group = groups.get(groupKey)
    group.rows.push(row)
    group.displayParticipants.push({
      player: row.PlayerName || '',
      hero: row.HeroName || ''
    })
  }

  // Retornar grupos en el orden de primera aparición
  return groupOrder.map(key => groups.get(key))
}
