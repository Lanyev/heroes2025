import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rutas de archivos
const talentsCsvPath = path.join(__dirname, '..', 'resources', 'hero-talents.csv')
const talentsImagesTxtPath = path.join(__dirname, '..', 'resources', 'talents_images.txt')
const talentsIndexPath = path.join(__dirname, '..', 'public', 'talents-index.json')
const outputDictPath = path.join(__dirname, '..', 'public', 'talent-image-dict.json')

console.log('📖 Leyendo archivos...')

// Leer CSV de talentos
const talentsCsvText = fs.readFileSync(talentsCsvPath, 'utf-8')
const talentsParseResult = Papa.parse(talentsCsvText, {
  header: true,
  skipEmptyLines: true
})
const talentRows = talentsParseResult.data
console.log(`✅ Leídos ${talentRows.length} talentos del CSV`)

// Leer índice de talentos existente
let talentsIndex = {}
if (fs.existsSync(talentsIndexPath)) {
  talentsIndex = JSON.parse(fs.readFileSync(talentsIndexPath, 'utf-8'))
  console.log(`✅ Cargado índice con ${Object.keys(talentsIndex).length} entradas`)
}

// Leer archivo de texto con imágenes
const imagesText = fs.readFileSync(talentsImagesTxtPath, 'utf-8')
const imageFiles = []
const lines = imagesText.split('\n')
for (const line of lines) {
  // Buscar líneas que contengan .png
  const match = line.match(/([a-zA-Z0-9\-_]+\.png)/)
  if (match) {
    const filename = match[1]
    // Extraer el nombre base sin extensión
    const baseName = filename.replace('.png', '')
    imageFiles.push({
      filename,
      baseName,
      normalized: normalizeTalentName(baseName)
    })
  }
}
console.log(`✅ Encontradas ${imageFiles.length} imágenes`)

/**
 * Normaliza un nombre de talento para búsqueda
 * Convierte "AlarakExtendedLightning" -> "extendedlightning"
 * O "AlarakExtendedLightning" -> "alarakextendedlightning"
 */
function normalizeTalentName(name) {
  if (!name) return ''
  
  // Convertir a minúsculas
  let normalized = name.toLowerCase()
  
  // Remover prefijos comunes de héroe (si el nombre empieza con el nombre del héroe)
  // Esto es una heurística, puede necesitar ajustes
  
  // Remover guiones y espacios
  normalized = normalized.replace(/[-_\s]/g, '')
  
  return normalized
}

/**
 * Extrae palabras clave de un nombre de talento
 * "AlarakOverwhelmingPowerDiscordStrike" -> ["overwhelming", "power"]
 */
function extractKeywords(talentName) {
  if (!talentName) return []
  
  // Remover prefijo del héroe (primera palabra en mayúscula)
  let name = talentName.replace(/^[A-Z][a-z]+/, '')
  
  // Remover sufijos comunes de habilidades
  const abilitySuffixes = [
    'DiscordStrike', 'FlameBuffet', 'GiftOfLife', 'Abundance',
    'HeroicAbility', 'FirstHeroic', 'SecondHeroic', 'Talent',
    'Item', 'Dragonqueen', 'CleansingFlame', 'Lifebinder'
  ]
  for (const suffix of abilitySuffixes) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length)
      break
    }
  }
  
  // Dividir en palabras por mayúsculas
  const words = name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 1) // Permitir palabras de 2+ caracteres
  
  return words
}

/**
 * Convierte un nombre CamelCase a kebab-case
 * "CleansingFlame" -> "cleansing-flame"
 * "RespectTheElderly" -> "respect-the-elderly"
 * "PickMeUp" -> "pick-me-up"
 */
function camelToKebab(str) {
  if (!str) return ''
  
  // Insertar guiones antes de cada letra mayúscula que sigue a una minúscula o número
  let result = str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Maneja casos como "POTG" -> "POT-G" pero mejor
    .toLowerCase()
  
  return result
}

/**
 * Normaliza un nombre de talento del CSV (ej: "AlarakExtendedLightning")
 * Intenta múltiples estrategias para encontrar la imagen
 */
function findTalentImage(talentName) {
  if (!talentName) return null
  
  // Estrategia 1: Buscar en el índice existente usando el nombre normalizado completo
  const normalizedFull = normalizeTalentName(talentName)
  if (talentsIndex[normalizedFull]) {
    return talentsIndex[normalizedFull].path
  }
  
  // Estrategia 2: Remover el prefijo del héroe y buscar
  // Intentar diferentes patrones para remover el nombre del héroe
  let withoutHero = talentName.replace(/^[A-Z][a-z]+/, '') // Patrón básico
  // Si no se removió nada, intentar con nombres compuestos
  if (withoutHero === talentName) {
    // Intentar remover nombres compuestos como "HungryHungryStitches"
    withoutHero = talentName.replace(/^([A-Z][a-z]+)+/, '')
  }
  
  // PRIORIDAD ALTA: Buscar el nombre sin el héroe directamente en archivos (para casos simples como "Pride")
  if (withoutHero && withoutHero !== talentName) {
    const simpleKebab = camelToKebab(withoutHero)
    // Buscar coincidencia exacta primero
    for (const image of imageFiles) {
      const imageBase = image.baseName.toLowerCase()
      if (imageBase === simpleKebab || 
          imageBase === `${simpleKebab}-talent` ||
          simpleKebab === imageBase.replace('-talent', '')) {
        return `/talents/${image.filename}`
      }
    }
    
    // También buscar sin convertir a kebab (para casos donde el nombre ya está en minúsculas)
    const simpleLower = withoutHero.toLowerCase()
    for (const image of imageFiles) {
      const imageBase = image.baseName.toLowerCase()
      if (imageBase === simpleLower || 
          imageBase === `${simpleLower}-talent`) {
        return `/talents/${image.filename}`
      }
    }
  }
  
  const normalizedWithoutHero = normalizeTalentName(withoutHero)
  if (talentsIndex[normalizedWithoutHero]) {
    return talentsIndex[normalizedWithoutHero].path
  }
  
  // Estrategia 2.5: Convertir sin héroe a kebab-case y buscar con/sin sufijo "-talent"
  const kebabName = camelToKebab(withoutHero)
  
  // PRIMERO: Buscar coincidencias exactas simples (para casos como "Pride" -> "pride.png")
  if (kebabName && kebabName.length < 30) {
    for (const image of imageFiles) {
      const imageBase = image.baseName.toLowerCase()
      // Coincidencia exacta
      if (imageBase === kebabName) {
        return `/talents/${image.filename}`
      }
      // Con sufijo -talent
      if (imageBase === `${kebabName}-talent`) {
        return `/talents/${image.filename}`
      }
      // Sin sufijo -talent en el archivo
      if (kebabName === imageBase.replace('-talent', '')) {
        return `/talents/${image.filename}`
      }
    }
  }
  
  // SEGUNDO: Buscar coincidencias exactas con variantes
  const exactMatches = []
  const partialMatches = []
  
  for (const image of imageFiles) {
    const imageBase = image.baseName.toLowerCase()
    
    // Coincidencias exactas (alta prioridad)
    if (imageBase === kebabName || 
        imageBase === `${kebabName}-talent` ||
        imageBase === `${kebabName}talent` ||
        kebabName === imageBase ||
        kebabName === imageBase.replace('-talent', '') ||
        kebabName === imageBase.replace('talent', '')) {
      exactMatches.push(`/talents/${image.filename}`)
    }
    
    // Búsqueda más flexible: verificar si el nombre del archivo contiene todas las palabras del kebab
    const kebabWords = kebabName.split('-').filter(w => w.length > 1)
    const imageWords = imageBase.split(/[-_\s]/).filter(w => w.length > 0)
    
    if (kebabWords.length > 0 && kebabWords.length <= 5) { // Limitar a 5 palabras para evitar coincidencias falsas
      // Verificar si todas las palabras importantes del kebab están en el nombre del archivo
      const allWordsMatch = kebabWords.every(kw => 
        imageWords.some(iw => iw === kw || iw.includes(kw) || kw.includes(iw))
      )
      
      // Verificar si el nombre del archivo contiene todas las palabras clave en orden
      const imageContainsAll = kebabWords.every(kw => imageBase.includes(kw))
      
      // Verificar similitud: al menos 80% de las palabras deben coincidir
      const matchCount = kebabWords.filter(kw => 
        imageWords.some(iw => iw === kw || iw.includes(kw) || kw.includes(iw))
      ).length
      const similarity = matchCount / kebabWords.length
      
      if ((allWordsMatch || imageContainsAll) && similarity >= 0.8) {
        partialMatches.push({
          path: `/talents/${image.filename}`,
          similarity
        })
      }
    }
  }
  
  // Retornar coincidencia exacta si existe
  if (exactMatches.length > 0) {
    return exactMatches[0]
  }
  
  // Si no hay exactas, usar la mejor coincidencia parcial
  if (partialMatches.length > 0) {
    // Ordenar por similitud descendente
    partialMatches.sort((a, b) => b.similarity - a.similarity)
    return partialMatches[0].path
  }
  
  // Buscar en índice con kebab-case
  const kebabNormalized = normalizeTalentName(kebabName)
  if (talentsIndex[kebabNormalized]) {
    return talentsIndex[kebabNormalized].path
  }
  
  // También buscar variantes en el índice (sin guiones)
  const kebabNoDashes = kebabName.replace(/-/g, '')
  if (talentsIndex[kebabNoDashes]) {
    return talentsIndex[kebabNoDashes].path
  }
  
  // Estrategia 3: Extraer palabras clave y buscar coincidencias
  const keywords = extractKeywords(talentName)
  if (keywords.length > 0) {
    // Buscar en el índice por palabras clave
    for (const [key, value] of Object.entries(talentsIndex)) {
      const keyWords = key.split(/(?=[A-Z])/).map(w => w.toLowerCase())
      // Verificar si todas las palabras clave importantes están presentes
      const matchCount = keywords.filter(kw => 
        keyWords.some(kw2 => kw2.includes(kw) || kw.includes(kw2))
      ).length
      
      // Si al menos el 70% de las palabras clave coinciden
      if (matchCount >= Math.ceil(keywords.length * 0.7) && keywords.length > 0) {
        return value.path
      }
    }
    
    // Buscar en archivos por palabras clave
    for (const image of imageFiles) {
      const imageWords = image.baseName.toLowerCase().split(/[-_\s]/)
      const matchCount = keywords.filter(kw => 
        imageWords.some(imgWord => imgWord.includes(kw) || kw.includes(imgWord))
      ).length
      
      // Si al menos el 70% de las palabras clave coinciden
      if (matchCount >= Math.ceil(keywords.length * 0.7) && keywords.length > 0) {
        return `/talents/${image.filename}`
      }
    }
  }
  
  // Estrategia 4: Búsqueda más flexible - cualquier palabra coincidente importante
  if (keywords.length > 0) {
    const mainKeywords = keywords.slice(0, Math.min(3, keywords.length))
    for (const image of imageFiles) {
      const imageWords = image.baseName.toLowerCase().split(/[-_\s]/)
      const hasMainKeyword = mainKeywords.some(kw =>
        imageWords.some(imgWord => imgWord.includes(kw) || kw.includes(imgWord))
      )
      if (hasMainKeyword) {
        return `/talents/${image.filename}`
      }
    }
  }
  
  return null
}

console.log('\n🔍 Generando diccionario de mapeo...')

// Crear diccionario: talent_name -> image_path
const talentImageDict = {}
const unmatchedTalents = []
const matchedTalents = []

// Obtener talentos únicos
const uniqueTalents = [...new Set(talentRows.map(row => row.talent_name))]

// Mapeos manuales para casos específicos conocidos
const manualMappings = {
  'AzmodanPride': '/talents/pride.png',
  'MephistoSpite': '/talents/spite.png',
  'SamuroShukuchi': '/talents/shukuchi.png',
  'BarbarianRuthless': '/talents/ruthless.png',
  'StitchesHungryHungryStitchesGorge': '/talents/gorge-talent.png',
  'TracerJumper': '/talents/jumper.png',
  'ZuljinRecklessness': '/talents/recklessness.png',
  'DeckardRespectTheElderly': '/talents/respect-the-elderly.png'
}

for (const talentName of uniqueTalents) {
  // Primero verificar mapeos manuales
  if (manualMappings[talentName]) {
    talentImageDict[talentName] = manualMappings[talentName]
    matchedTalents.push(talentName)
    continue
  }
  
  const imagePath = findTalentImage(talentName)
  
  if (imagePath) {
    talentImageDict[talentName] = imagePath
    matchedTalents.push(talentName)
  } else {
    unmatchedTalents.push(talentName)
  }
}

console.log(`✅ Mapeados: ${matchedTalents.length} talentos`)
console.log(`⚠️  Sin mapear: ${unmatchedTalents.length} talentos`)

// Guardar diccionario
fs.writeFileSync(
  outputDictPath,
  JSON.stringify(talentImageDict, null, 2),
  'utf-8'
)
console.log(`\n✅ Diccionario guardado en: ${outputDictPath}`)

// Mostrar algunos ejemplos de talentos sin mapear
if (unmatchedTalents.length > 0) {
  console.log('\n⚠️  Primeros 20 talentos sin mapear:')
  unmatchedTalents.slice(0, 20).forEach(talent => {
    console.log(`  - ${talent}`)
  })
  if (unmatchedTalents.length > 20) {
    console.log(`  ... y ${unmatchedTalents.length - 20} más`)
  }
}

// Estadísticas
console.log(`\n📊 Estadísticas:`)
console.log(`  Total talentos únicos: ${uniqueTalents.length}`)
console.log(`  Talentos mapeados: ${matchedTalents.length} (${((matchedTalents.length / uniqueTalents.length) * 100).toFixed(1)}%)`)
console.log(`  Talentos sin mapear: ${unmatchedTalents.length} (${((unmatchedTalents.length / uniqueTalents.length) * 100).toFixed(1)}%)`)
