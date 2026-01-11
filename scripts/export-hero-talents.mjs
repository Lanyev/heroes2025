import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ruta al CSV de entrada
const inputCsvPath = path.join(__dirname, '..', 'public', 'structured_data.csv')
// Ruta al CSV de salida
const outputCsvPath = path.join(__dirname, '..', 'hero-talents.csv')

console.log('📖 Leyendo CSV de partidas...')
const csvText = fs.readFileSync(inputCsvPath, 'utf-8')

const parseResult = Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true
})

if (parseResult.errors && parseResult.errors.length > 0) {
  console.warn('⚠️  Advertencias al parsear CSV:', parseResult.errors)
}

const rows = parseResult.data
console.log(`✅ Leídas ${rows.length} filas`)

// Niveles de talentos
const talentLevels = [1, 4, 7, 10, 13, 16, 20]

// Estructura para almacenar talentos únicos por héroe y nivel
// { heroName: { level: Set<talentName> } }
const heroTalentsMap = {}

console.log('🔍 Extrayendo talentos únicos por héroe...')

for (const row of rows) {
  const heroName = row.HeroName?.trim()
  if (!heroName) continue

  // Inicializar estructura si no existe
  if (!heroTalentsMap[heroName]) {
    heroTalentsMap[heroName] = {}
    for (const level of talentLevels) {
      heroTalentsMap[heroName][level] = new Set()
    }
  }

  // Extraer talentos de cada nivel
  for (const level of talentLevels) {
    const talentKey = `Talents_L${level}`
    const talentName = row[talentKey]?.trim()
    
    if (talentName && talentName.length > 0) {
      heroTalentsMap[heroName][level].add(talentName)
    }
  }
}

// Convertir Sets a arrays y crear filas para el CSV
const csvRows = []

for (const [heroName, levels] of Object.entries(heroTalentsMap)) {
  for (const level of talentLevels) {
    const talents = Array.from(levels[level]).sort()
    
    for (const talentName of talents) {
      csvRows.push({
        hero_name: heroName,
        level: level,
        talent_name: talentName
      })
    }
  }
}

// Ordenar por nombre de héroe, luego por nivel, luego por nombre de talento
csvRows.sort((a, b) => {
  if (a.hero_name !== b.hero_name) {
    return a.hero_name.localeCompare(b.hero_name)
  }
  if (a.level !== b.level) {
    return a.level - b.level
  }
  return a.talent_name.localeCompare(b.talent_name)
})

console.log(`✅ Encontrados ${csvRows.length} talentos únicos`)
console.log(`📊 Héroes únicos: ${Object.keys(heroTalentsMap).length}`)

// Generar CSV
const csvOutput = Papa.unparse(csvRows, {
  header: true,
  columns: ['hero_name', 'level', 'talent_name']
})

fs.writeFileSync(outputCsvPath, csvOutput, 'utf-8')
console.log(`\n✅ CSV exportado exitosamente a: ${outputCsvPath}`)

// Mostrar estadísticas
console.log('\n📈 Estadísticas:')
const heroStats = Object.entries(heroTalentsMap).map(([heroName, levels]) => {
  const totalTalents = talentLevels.reduce((sum, level) => sum + levels[level].size, 0)
  return { heroName, totalTalents }
}).sort((a, b) => b.totalTalents - a.totalTalents)

console.log(`\nTop 10 héroes con más talentos únicos:`)
heroStats.slice(0, 10).forEach((stat, idx) => {
  console.log(`  ${idx + 1}. ${stat.heroName}: ${stat.totalTalents} talentos`)
})
