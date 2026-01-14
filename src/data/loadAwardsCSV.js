/**
 * Load and parse the awards tables from tablas_awards.csv
 * The CSV has a complex structure with multiple tables side by side
 */

// Table definitions with their column structure
const TABLE_DEFINITIONS = {
  'Top Kills': {
    columns: ['PlayerName', 'HeroName', 'HeroKills', 'GameTime', 'Winner'],
    valueColumn: 'HeroKills',
    valueLabel: 'Kills',
    icon: '⚔️',
    color: 'red'
  },
  'Top Hero Damage': {
    columns: ['PlayerName', 'HeroName', 'HeroDamage', 'GameTime', 'Winner'],
    valueColumn: 'HeroDamage',
    valueLabel: 'Daño',
    icon: '💥',
    color: 'orange'
  },
  'Top Time Death': {
    columns: ['PlayerName', 'HeroName', 'SpentDead', 'GameTime', 'Winner'],
    valueColumn: 'SpentDead',
    valueLabel: 'Tiempo Muerto',
    isTime: true,
    icon: '💀',
    color: 'gray'
  },
  'Partida mas Corta': {
    columns: ['GameTime', 'PlayerName', 'HeroName', 'Winner'],
    valueColumn: 'GameTime',
    valueLabel: 'Duración',
    isTime: true,
    icon: '⚡',
    color: 'yellow'
  },
  'Top Assists': {
    columns: ['PlayerName', 'HeroName', 'Assists', 'GameTime', 'Winner'],
    valueColumn: 'Assists',
    valueLabel: 'Asistencias',
    icon: '🤝',
    color: 'blue'
  },
  'Top Siege Damage': {
    columns: ['PlayerName', 'HeroName', 'TotalSiegeDamage', 'GameTime', 'Winner'],
    valueColumn: 'TotalSiegeDamage',
    valueLabel: 'Daño Siege',
    icon: '🏰',
    color: 'brown'
  },
  'Top Time OnFire': {
    columns: ['PlayerName', 'HeroName', 'OnFire', 'GameTime', 'Winner'],
    valueColumn: 'OnFire',
    valueLabel: 'En Llamas',
    isTime: true,
    icon: '🔥',
    color: 'orange'
  },
  'Partida mas Larga': {
    columns: ['GameTime', 'PlayerName', 'HeroName', 'Winner'],
    valueColumn: 'GameTime',
    valueLabel: 'Duración',
    isTime: true,
    icon: '⏰',
    color: 'purple'
  },
  'Top Deaths': {
    columns: ['PlayerName', 'HeroName', 'Deaths', 'GameTime', 'Winner'],
    valueColumn: 'Deaths',
    valueLabel: 'Muertes',
    icon: '☠️',
    color: 'gray'
  },
  'Top Tank Damage': {
    columns: ['PlayerName', 'HeroName', 'DamageTaken', 'GameTime', 'Winner'],
    valueColumn: 'DamageTaken',
    valueLabel: 'Daño Recibido',
    icon: '🛡️',
    color: 'cyan'
  },
  'Top Capturas Mercenarios': {
    columns: ['PlayerName', 'HeroName', 'MercCampCaptures', 'GameTime', 'Winner'],
    valueColumn: 'MercCampCaptures',
    valueLabel: 'Capturas',
    icon: '👹',
    color: 'green'
  },
  'Top Kills W/Healer': {
    columns: ['PlayerName', 'HeroName', 'HeroKills', 'GameTime', 'Winner'],
    valueColumn: 'HeroKills',
    valueLabel: 'Kills',
    icon: '💉',
    color: 'pink'
  },
  'Less Tank Damage': {
    columns: ['PlayerName', 'HeroName', 'DamageTaken', 'GameTime', 'Winner'],
    valueColumn: 'DamageTaken',
    valueLabel: 'Daño Recibido',
    icon: '🪶',
    color: 'lightblue'
  },
  'Top Globitos': {
    columns: ['PlayerName', 'HeroName', 'RegenGlobes', 'GameTime', 'Winner', 'GperMin'],
    valueColumn: 'RegenGlobes',
    valueLabel: 'Globos',
    icon: '🔮',
    color: 'purple'
  },
  'Top Damage W/Healer': {
    columns: ['PlayerName', 'HeroName', 'HeroDamage', 'GameTime', 'Winner'],
    valueColumn: 'HeroDamage',
    valueLabel: 'Daño',
    icon: '⚕️',
    color: 'pink'
  },
  'Top Healing': {
    columns: ['PlayerName', 'HeroName', 'HealingShielding', 'GameTime', 'Winner'],
    valueColumn: 'HealingShielding',
    valueLabel: 'Curación',
    icon: '💚',
    color: 'green'
  },
  'Less Healing': {
    columns: ['PlayerName', 'HeroName', 'HealingShielding', 'GameTime', 'Winner'],
    valueColumn: 'HealingShielding',
    valueLabel: 'Curación',
    icon: '💔',
    color: 'red'
  },
  'Top Self Healing': {
    columns: ['PlayerName', 'HeroName', 'SelfHealing', 'GameTime', 'Winner'],
    valueColumn: 'SelfHealing',
    valueLabel: 'Auto-curación',
    icon: '🩹',
    color: 'lime'
  },
  'Top Exp': {
    columns: ['PlayerName', 'HeroName', 'Experience', 'GameTime', 'Winner'],
    valueColumn: 'Experience',
    valueLabel: 'Experiencia',
    icon: '📈',
    color: 'gold'
  },
  'Top Minion Killer': {
    columns: ['PlayerName', 'HeroName', 'Experience', 'GameTime', 'Winner'],
    valueColumn: 'Experience',
    valueLabel: 'Daño a Minions',
    icon: '🗡️',
    color: 'amber'
  }
}

/**
 * Parse CSV content and extract all award tables
 */
import { getPublicPath } from '../utils/paths'

export async function loadAwardsCSV() {
  try {
    const response = await fetch(getPublicPath('/resources/tablas_awards.csv'))
    const text = await response.text()
    
    const lines = text.split('\n').map(line => line.split(','))
    const tables = {}
    
    // Find all table headers in the CSV
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row]
      
      for (let col = 0; col < line.length; col++) {
        const cell = line[col]?.trim()
        
        if (cell && TABLE_DEFINITIONS[cell]) {
          // Found a table header, extract the table data
          const tableName = cell
          const tableDef = TABLE_DEFINITIONS[tableName]
          
          // The next row should be column headers
          const headerRow = lines[row + 1]
          if (!headerRow) continue
          
          // Find the actual column positions for this table
          const tableData = []
          
          // Read data rows (starting from row + 2)
          for (let dataRow = row + 2; dataRow < lines.length; dataRow++) {
            const dataLine = lines[dataRow]
            if (!dataLine) break
            
            // Check if we've hit another table header or empty section
            const firstCell = dataLine[col]?.trim()
            if (!firstCell || TABLE_DEFINITIONS[firstCell]) break
            
            // Extract values for this row
            const entry = {}
            let hasData = false
            
            for (let i = 0; i < tableDef.columns.length; i++) {
              const value = dataLine[col + i]?.trim() || ''
              const columnName = tableDef.columns[i]
              entry[columnName] = value
              if (value && columnName === 'PlayerName') hasData = true
              if (value && columnName === 'GameTime' && tableName.includes('Partida')) hasData = true
            }
            
            if (hasData) {
              tableData.push(entry)
            }
          }
          
          if (tableData.length > 0) {
            tables[tableName] = {
              ...tableDef,
              name: tableName,
              entries: tableData
            }
          }
        }
      }
    }
    
    return tables
  } catch (error) {
    console.error('Error loading awards CSV:', error)
    return {}
  }
}

/**
 * Format a numeric value for display
 */
export function formatAwardValue(value, isTime = false) {
  if (!value) return '-'
  
  if (isTime) {
    // Already formatted as time string (HH:MM:SS or MM:SS)
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
 * Get color classes based on table color
 */
export function getAwardColorClasses(color) {
  const colors = {
    red: {
      bg: 'from-red-900/40 to-red-800/20',
      border: 'border-red-500/30',
      accent: 'text-red-400',
      glow: 'shadow-red-500/20',
      badge: 'bg-red-500/20 text-red-300'
    },
    orange: {
      bg: 'from-orange-900/40 to-orange-800/20',
      border: 'border-orange-500/30',
      accent: 'text-orange-400',
      glow: 'shadow-orange-500/20',
      badge: 'bg-orange-500/20 text-orange-300'
    },
    yellow: {
      bg: 'from-yellow-900/40 to-yellow-800/20',
      border: 'border-yellow-500/30',
      accent: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
      badge: 'bg-yellow-500/20 text-yellow-300'
    },
    green: {
      bg: 'from-green-900/40 to-green-800/20',
      border: 'border-green-500/30',
      accent: 'text-green-400',
      glow: 'shadow-green-500/20',
      badge: 'bg-green-500/20 text-green-300'
    },
    cyan: {
      bg: 'from-cyan-900/40 to-cyan-800/20',
      border: 'border-cyan-500/30',
      accent: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
      badge: 'bg-cyan-500/20 text-cyan-300'
    },
    blue: {
      bg: 'from-blue-900/40 to-blue-800/20',
      border: 'border-blue-500/30',
      accent: 'text-blue-400',
      glow: 'shadow-blue-500/20',
      badge: 'bg-blue-500/20 text-blue-300'
    },
    purple: {
      bg: 'from-purple-900/40 to-purple-800/20',
      border: 'border-purple-500/30',
      accent: 'text-purple-400',
      glow: 'shadow-purple-500/20',
      badge: 'bg-purple-500/20 text-purple-300'
    },
    pink: {
      bg: 'from-pink-900/40 to-pink-800/20',
      border: 'border-pink-500/30',
      accent: 'text-pink-400',
      glow: 'shadow-pink-500/20',
      badge: 'bg-pink-500/20 text-pink-300'
    },
    gray: {
      bg: 'from-slate-800/40 to-slate-700/20',
      border: 'border-slate-500/30',
      accent: 'text-slate-400',
      glow: 'shadow-slate-500/20',
      badge: 'bg-slate-500/20 text-slate-300'
    },
    gold: {
      bg: 'from-amber-900/40 to-amber-800/20',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
      glow: 'shadow-amber-500/20',
      badge: 'bg-amber-500/20 text-amber-300'
    },
    amber: {
      bg: 'from-amber-900/40 to-amber-800/20',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
      glow: 'shadow-amber-500/20',
      badge: 'bg-amber-500/20 text-amber-300'
    },
    lime: {
      bg: 'from-lime-900/40 to-lime-800/20',
      border: 'border-lime-500/30',
      accent: 'text-lime-400',
      glow: 'shadow-lime-500/20',
      badge: 'bg-lime-500/20 text-lime-300'
    },
    lightblue: {
      bg: 'from-sky-900/40 to-sky-800/20',
      border: 'border-sky-500/30',
      accent: 'text-sky-400',
      glow: 'shadow-sky-500/20',
      badge: 'bg-sky-500/20 text-sky-300'
    },
    brown: {
      bg: 'from-amber-950/40 to-amber-900/20',
      border: 'border-amber-700/30',
      accent: 'text-amber-500',
      glow: 'shadow-amber-700/20',
      badge: 'bg-amber-700/20 text-amber-400'
    }
  }
  
  return colors[color] || colors.purple
}
