import { createReadStream, createWriteStream } from 'fs'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Leer el archivo de roles
const rolesPath = join(projectRoot, 'resources', 'rol.json')
const rolesData = JSON.parse(readFileSync(rolesPath, 'utf-8'))

// Normalizar los roles del JSON para que coincidan con los nombres de héroes
// El JSON tiene algunos roles en minúsculas, necesitamos normalizarlos
const normalizeRole = (role) => {
  const roleMap = {
    'tank': 'Tank',
    'bruiser': 'Bruiser',
    'melee assasin': 'Melee Assassin',
    'Ranged Assasin': 'Ranged Assassin',
    'Mage': 'Mage',
    'Healer': 'Healer',
    'support': 'Support'
  }
  return roleMap[role] || role
}

// Crear un mapa de roles normalizado
const roleMap = {}
for (const [heroName, role] of Object.entries(rolesData)) {
  roleMap[heroName] = normalizeRole(role)
}

console.log(`Cargados ${Object.keys(roleMap).length} roles de héroes`)

// Rutas de archivos
const inputPath = join(projectRoot, 'public', 'structured_data.csv')
const outputPath = join(projectRoot, 'public', 'structured_data_with_role.csv')
const backupPath = join(projectRoot, 'public', 'structured_data_backup.csv')

// Crear streams
const inputStream = createReadStream(inputPath, { encoding: 'utf8' })
const outputStream = createWriteStream(outputPath, { encoding: 'utf8' })

const rl = createInterface({
  input: inputStream,
  crlfDelay: Infinity
})

let lineNumber = 0
let headerProcessed = false
let headerColumns = []
let heroNameIndex = -1

console.log('Procesando CSV...')

rl.on('line', (line) => {
  lineNumber++
  
  // Procesar header
  if (!headerProcessed) {
    headerColumns = line.split(',')
    heroNameIndex = headerColumns.indexOf('HeroName')
    
    if (heroNameIndex === -1) {
      console.error('Error: No se encontró la columna HeroName en el header')
      process.exit(1)
    }
    
    // Insertar Role después de HeroName
    headerColumns.splice(heroNameIndex + 1, 0, 'Role')
    outputStream.write(headerColumns.join(',') + '\n')
    headerProcessed = true
    
    console.log('Header procesado. Columna Role agregada después de HeroName.')
    return
  }
  
  // Procesar filas de datos
  // Manejar CSV con comas dentro de campos (usando comillas)
  const columns = []
  let currentColumn = ''
  let insideQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      insideQuotes = !insideQuotes
      currentColumn += char
    } else if (char === ',' && !insideQuotes) {
      columns.push(currentColumn)
      currentColumn = ''
    } else {
      currentColumn += char
    }
  }
  columns.push(currentColumn) // Última columna
  
  if (columns.length !== headerColumns.length - 1) {
    // Si el número de columnas no coincide, puede ser un problema de parsing
    // Intentar split simple como fallback
    const simpleSplit = line.split(',')
    if (simpleSplit.length === headerColumns.length - 1) {
      columns.length = 0
      columns.push(...simpleSplit)
    }
  }
  
  // Obtener el nombre del héroe
  const heroName = columns[heroNameIndex]?.replace(/^"|"$/g, '') || ''
  
  // Buscar el rol en el mapa
  let role = 'Unknown'
  if (heroName) {
    // Intentar búsqueda exacta primero
    if (roleMap[heroName]) {
      role = roleMap[heroName]
    } else {
      // Buscar variaciones (sin espacios extra, etc.)
      const normalizedHeroName = heroName.trim()
      if (roleMap[normalizedHeroName]) {
        role = roleMap[normalizedHeroName]
      } else {
        // Buscar en todas las claves (case-insensitive parcial)
        for (const [key, value] of Object.entries(roleMap)) {
          if (key.toLowerCase() === normalizedHeroName.toLowerCase()) {
            role = value
            break
          }
        }
      }
    }
  }
  
  // Insertar el rol después de HeroName
  columns.splice(heroNameIndex + 1, 0, role)
  
  // Escribir la línea procesada
  outputStream.write(columns.join(',') + '\n')
  
  // Mostrar progreso cada 1000 líneas
  if (lineNumber % 1000 === 0) {
    process.stdout.write(`\rProcesadas ${lineNumber} líneas...`)
  }
})

rl.on('close', () => {
  outputStream.end()
  console.log(`\n\n✅ Proceso completado!`)
  console.log(`   Total de líneas procesadas: ${lineNumber}`)
  console.log(`   Archivo generado: ${outputPath}`)
  console.log(`\n   Para reemplazar el archivo original, ejecuta:`)
  console.log(`   mv "${outputPath}" "${inputPath}"`)
  console.log(`\n   O en Windows PowerShell:`)
  console.log(`   Move-Item "${outputPath}" "${inputPath}" -Force`)
})

rl.on('error', (error) => {
  console.error('Error leyendo el archivo:', error)
  process.exit(1)
})

outputStream.on('error', (error) => {
  console.error('Error escribiendo el archivo:', error)
  process.exit(1)
})
