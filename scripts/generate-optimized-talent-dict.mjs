import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rutas de archivos
const talentsCsvPath = path.join(__dirname, '..', 'resources', 'hero-talents.csv')
const talentsDirPath = path.join(__dirname, '..', 'public', 'talents')
const outputDictPath = path.join(__dirname, '..', 'public', 'talent-dict-optimized.json')

console.log('📖 Leyendo archivos...')

// Leer CSV de talentos
const talentsCsvText = fs.readFileSync(talentsCsvPath, 'utf-8')
const talentsParseResult = Papa.parse(talentsCsvText, {
  header: true,
  skipEmptyLines: true
})
const talentRows = talentsParseResult.data
console.log(`✅ Leídos ${talentRows.length} talentos del CSV`)

// Obtener talentos únicos
const uniqueTalents = [...new Set(talentRows.map(row => row.talent_name))].filter(Boolean)
console.log(`✅ ${uniqueTalents.length} talentos únicos encontrados`)

// Escanear directorio de imágenes
const imageFiles = []
if (fs.existsSync(talentsDirPath)) {
  const files = fs.readdirSync(talentsDirPath)
  for (const file of files) {
    if (file.endsWith('.png')) {
      const baseName = file.replace('.png', '')
      imageFiles.push({
        filename: file,
        baseName,
        path: `/talents/${file}`
      })
    }
  }
}
console.log(`✅ Encontradas ${imageFiles.length} imágenes en el directorio`)

/**
 * Normaliza un nombre para búsqueda (minúsculas, sin guiones/espacios)
 */
function normalize(name) {
  if (!name) return ''
  return name.toLowerCase().replace(/[-_\s]/g, '')
}

/**
 * Convierte CamelCase a kebab-case
 * "ExtendedLightning" -> "extended-lightning"
 */
function camelToKebab(str) {
  if (!str) return ''
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Extrae el nombre del talento sin el prefijo del héroe
 * "AlarakExtendedLightning" -> "ExtendedLightning"
 */
function removeHeroPrefix(talentName) {
  if (!talentName) return ''
  
  // Patrón 1: Remover primera palabra (nombre del héroe)
  let withoutHero = talentName.replace(/^[A-Z][a-z]+/, '')
  
  // Patrón 2: Si no cambió, intentar con nombres compuestos
  if (withoutHero === talentName) {
    // Para nombres como "WitchDoctor" o "HungryHungryStitches"
    const match = talentName.match(/^([A-Z][a-z]+)+/)
    if (match) {
      withoutHero = talentName.substring(match[0].length)
    }
  }
  
  return withoutHero || talentName
}

/**
 * Remueve sufijos comunes de habilidades y modificadores
 */
function removeAbilitySuffixes(talentName) {
  if (!talentName) return ''
  
  // Sufijos comunes que indican modificadores de habilidades
  const suffixes = [
    'FirstHeroic', 'SecondHeroic', 'HeroicAbility',
    'Item', 'Talent', 'Dragonqueen',
    'DiscordStrike', 'FlameBuffet', 'GiftOfLife', 'Abundance',
    'CleansingFlame', 'Lifebinder', 'BurrowCharge', 'Cocoon',
    'LocustSwarm', 'ScarabHost', 'PhasePrism', 'BladeDash',
    'TwinBlades', 'SuppressionPulse', 'PurifierBeam',
    'HealingDart', 'SleepDart', 'BioticGrenade', 'Shrike',
    'DivineStar', 'FlashHeal', 'LeapOfFaith',
    'CombatStyle', 'Mastery', 'Underking',
    // Agregar más según sea necesario
  ]
  
  let cleaned = talentName
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length)
      break
    }
  }
  
  return cleaned
}

/**
 * Genera todas las variaciones posibles de un nombre de talento
 */
function generateVariations(talentName) {
  const variations = new Set()
  
  if (!talentName) return variations
  
  // Variación 1: Nombre completo normalizado
  variations.add(normalize(talentName))
  
  // Variación 2: Sin prefijo del héroe
  const withoutHero = removeHeroPrefix(talentName)
  if (withoutHero && withoutHero !== talentName) {
    variations.add(normalize(withoutHero))
    
    // Variación 3: Sin héroe en kebab-case
    const kebab = camelToKebab(withoutHero)
    variations.add(normalize(kebab))
    variations.add(kebab)
    
    // Variación 4: Con/sin sufijo "-talent"
    variations.add(`${kebab}-talent`)
    variations.add(kebab.replace('-talent', ''))
    
    // Variación 5: Palabras individuales (para búsqueda parcial)
    const words = withoutHero.match(/[A-Z][a-z]+/g) || []
    if (words.length > 0) {
      // Primera palabra importante
      variations.add(normalize(words[0]))
      // Última palabra importante
      if (words.length > 1) {
        variations.add(normalize(words[words.length - 1]))
      }
      // Todas las palabras juntas
      variations.add(normalize(words.join('')))
    }
  }
  
  // Variación 6: Kebab-case del nombre completo
  const fullKebab = camelToKebab(talentName)
  variations.add(normalize(fullKebab))
  variations.add(fullKebab)
  
  return variations
}

/**
 * Busca la imagen para un talento usando múltiples estrategias
 */
function findTalentImage(talentName, imageMap) {
  if (!talentName) return null
  
  // Generar todas las variaciones del nombre completo
  const variations = generateVariations(talentName)
  
  // Estrategia 1: Búsqueda exacta por normalización
  for (const variation of variations) {
    if (imageMap.normalized[variation]) {
      return imageMap.normalized[variation]
    }
  }
  
  // Estrategia 2: Remover prefijo del héroe y buscar
  let withoutHero = removeHeroPrefix(talentName)
  let kebab = camelToKebab(withoutHero)
  
  // Buscar coincidencia exacta
  if (imageMap.kebabExact[kebab]) {
    return imageMap.kebabExact[kebab]
  }
  
  // Buscar con sufijo -talent
  if (imageMap.kebabExact[`${kebab}-talent`]) {
    return imageMap.kebabExact[`${kebab}-talent`]
  }
  
  // Buscar sin sufijo -talent
  const withoutSuffix = kebab.replace(/-talent$/, '')
  if (imageMap.kebabExact[withoutSuffix]) {
    return imageMap.kebabExact[withoutSuffix]
  }
  
  // Estrategia 3: Remover sufijos de habilidades y buscar
  const cleaned = removeAbilitySuffixes(withoutHero)
  if (cleaned !== withoutHero) {
    const cleanedKebab = camelToKebab(cleaned)
    
    if (imageMap.kebabExact[cleanedKebab]) {
      return imageMap.kebabExact[cleanedKebab]
    }
    
    if (imageMap.kebabExact[`${cleanedKebab}-talent`]) {
      return imageMap.kebabExact[`${cleanedKebab}-talent`]
    }
  }
  
  // Estrategia 4: Búsqueda por palabras clave (últimas 2-3 palabras importantes)
  const words = withoutHero.match(/[A-Z][a-z]+/g) || []
  if (words.length > 0) {
    // Remover palabras comunes que no son parte del nombre del talento
    const commonWords = ['First', 'Second', 'Heroic', 'Ability', 'Item', 'Talent', 'Mastery', 'Combat', 'Style']
    const filteredWords = words.filter(w => !commonWords.includes(w))
    
    if (filteredWords.length > 0) {
      // Intentar con las últimas 2-3 palabras
      for (let wordCount = Math.min(3, filteredWords.length); wordCount >= 1; wordCount--) {
        const importantWords = filteredWords.slice(-wordCount)
        const searchKey = importantWords.map(w => w.toLowerCase()).join('-')
        
        // Búsqueda exacta
        if (imageMap.kebabExact[searchKey]) {
          return imageMap.kebabExact[searchKey]
        }
        
        if (imageMap.kebabExact[`${searchKey}-talent`]) {
          return imageMap.kebabExact[`${searchKey}-talent`]
        }
        
        // Búsqueda parcial (al menos 80% de coincidencia)
        for (const [key, path] of Object.entries(imageMap.kebabExact)) {
          const keyWords = key.split('-')
          const matchCount = importantWords.filter(word => 
            keyWords.some(kw => kw === word.toLowerCase() || kw.includes(word.toLowerCase()) || word.toLowerCase().includes(kw))
          ).length
          
          if (matchCount >= Math.ceil(importantWords.length * 0.8) && importantWords.length > 0) {
            return path
          }
        }
      }
    }
  }
  
  // Estrategia 5: Búsqueda por primera palabra importante (para talentos simples)
  if (words.length > 0) {
    const firstImportantWord = words.find(w => !['First', 'Second', 'Heroic', 'Ability'].includes(w))
    if (firstImportantWord) {
      const firstWordKebab = firstImportantWord.toLowerCase()
      if (imageMap.kebabExact[firstWordKebab]) {
        return imageMap.kebabExact[firstWordKebab]
      }
    }
  }
  
  return null
}

console.log('\n🔍 Construyendo índice de imágenes...')

// Construir índices de imágenes para búsqueda rápida
const imageMap = {
  normalized: {},      // Clave normalizada -> path
  kebabExact: {},      // kebab-case exacto -> path
  baseName: {}         // nombre base -> path
}

for (const image of imageFiles) {
  const normalized = normalize(image.baseName)
  const kebab = image.baseName.toLowerCase()
  
  // Índice por normalización
  imageMap.normalized[normalized] = image.path
  
  // Índice por kebab-case exacto
  imageMap.kebabExact[kebab] = image.path
  
  // Índice por nombre base
  imageMap.baseName[image.baseName.toLowerCase()] = image.path
  
  // También indexar sin sufijo -talent
  if (kebab.endsWith('-talent')) {
    const withoutSuffix = kebab.replace(/-talent$/, '')
    if (!imageMap.kebabExact[withoutSuffix]) {
      imageMap.kebabExact[withoutSuffix] = image.path
    }
  }
}

console.log(`✅ Índice construido con ${Object.keys(imageMap.normalized).length} entradas normalizadas`)

console.log('\n🔍 Generando diccionario de mapeo...')

// Crear diccionario optimizado
const talentDict = {}
const unmatchedTalents = []
const matchedTalents = []

for (const talentName of uniqueTalents) {
  const imagePath = findTalentImage(talentName, imageMap)
  
  if (imagePath) {
    talentDict[talentName] = imagePath
    matchedTalents.push(talentName)
  } else {
    unmatchedTalents.push(talentName)
  }
}

console.log(`✅ Mapeados: ${matchedTalents.length} talentos`)
console.log(`⚠️  Sin mapear: ${unmatchedTalents.length} talentos`)

// Guardar diccionario optimizado
const output = {
  // Metadatos
  metadata: {
    generated: new Date().toISOString(),
    totalTalents: uniqueTalents.length,
    matchedTalents: matchedTalents.length,
    unmatchedTalents: unmatchedTalents.length,
    totalImages: imageFiles.length
  },
  // Diccionario principal: talentName -> imagePath
  dict: talentDict,
  // Lista de talentos sin mapear para debugging
  unmatched: unmatchedTalents
}

fs.writeFileSync(
  outputDictPath,
  JSON.stringify(output, null, 2),
  'utf-8'
)
console.log(`\n✅ Diccionario guardado en: ${outputDictPath}`)

// Mostrar algunos ejemplos de talentos sin mapear
if (unmatchedTalents.length > 0) {
  console.log('\n⚠️  Primeros 30 talentos sin mapear:')
  unmatchedTalents.slice(0, 30).forEach(talent => {
    const withoutHero = removeHeroPrefix(talent)
    const kebab = camelToKebab(withoutHero)
    console.log(`  - ${talent}`)
    console.log(`    → Sin héroe: ${withoutHero}`)
    console.log(`    → Kebab: ${kebab}`)
  })
  if (unmatchedTalents.length > 30) {
    console.log(`  ... y ${unmatchedTalents.length - 30} más`)
  }
}

// Estadísticas
const matchRate = ((matchedTalents.length / uniqueTalents.length) * 100).toFixed(1)
console.log(`\n📊 Estadísticas:`)
console.log(`  Total talentos únicos: ${uniqueTalents.length}`)
console.log(`  Talentos mapeados: ${matchedTalents.length} (${matchRate}%)`)
console.log(`  Talentos sin mapear: ${unmatchedTalents.length} (${(100 - matchRate).toFixed(1)}%)`)
console.log(`  Total imágenes disponibles: ${imageFiles.length}`)
