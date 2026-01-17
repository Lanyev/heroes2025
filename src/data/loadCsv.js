import Papa from 'papaparse'
import { getPublicPath } from '../utils/paths'

const CACHE_KEY = 'heroes2_csv_cache'
const CACHE_VERSION_KEY = 'heroes2_csv_version'
const CACHE_VERSION = '1.0' // Incrementar cuando cambie el formato del CSV

/**
 * Get cached CSV data if available and valid
 * @returns {Array|null} Cached data or null
 */
function getCachedData() {
  try {
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (cachedVersion !== CACHE_VERSION) {
      // Versión diferente, limpiar caché antiguo
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_VERSION_KEY)
      return null
    }
    
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      // Verificar que tenga datos válidos
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`✅ CSV cargado desde caché (${parsed.length} filas)`)
        return parsed
      }
    }
  } catch (error) {
    console.warn('Error al leer caché:', error)
    // Limpiar caché corrupto
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_VERSION_KEY)
  }
  return null
}

/**
 * Save CSV data to cache
 * @param {Array} data - Parsed CSV data
 */
function saveToCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
    console.log(`💾 CSV guardado en caché (${data.length} filas)`)
  } catch (error) {
    // Si el localStorage está lleno, intentar limpiar espacio
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage lleno, limpiando caché antiguo...')
      try {
        // Limpiar solo el caché del CSV
        localStorage.removeItem(CACHE_KEY)
        localStorage.removeItem(CACHE_VERSION_KEY)
        // Intentar guardar de nuevo
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
      } catch (retryError) {
        console.warn('No se pudo guardar en caché:', retryError)
      }
    } else {
      console.warn('Error al guardar en caché:', error)
    }
  }
}

/**
 * Fetch and parse CSV from public folder with caching
 * @param {string} url - Path to CSV file
 * @param {Object} options - Options { useCache: boolean, onProgress: function }
 * @returns {Promise<Array>} - Parsed rows
 */
export async function loadCsv(url = '/structured_data.csv', options = {}) {
  const { useCache = true, onProgress } = options
  
  // Intentar cargar desde caché primero
  if (useCache) {
    const cached = getCachedData()
    if (cached) {
      return cached
    }
  }
  
  // Cargar desde el servidor
  const fullUrl = getPublicPath(url)
  // Usar ETag/Last-Modified en lugar de cache-busting para mejor rendimiento
  const response = await fetch(fullUrl, {
    cache: 'default' // Permitir caché del navegador
  })
  
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}. Make sure the file is in the /public folder.`)
  }
  
  const csvText = await response.text()
  
  return new Promise((resolve, reject) => {
    let rowCount = 0
    const rows = []
    
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      // Usar streaming para procesar en chunks y mostrar progreso
      step: (results, parser) => {
        // Solo agregar si hay datos válidos
        if (results.data && Object.keys(results.data).length > 0) {
          rows.push(results.data)
          rowCount++
          
          // Reportar progreso cada 100 filas
          if (onProgress && rowCount % 100 === 0) {
            onProgress({
              loaded: rowCount,
              total: null // No conocemos el total hasta terminar
            })
          }
        }
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors)
        }
        
        // Cuando se usa 'step', results.data puede estar vacío
        // Usar el array acumulado 'rows' en su lugar
        const finalData = rows.length > 0 ? rows : results.data
        
        // Guardar en caché
        if (useCache) {
          saveToCache(finalData)
        }
        
        if (onProgress) {
          onProgress({
            loaded: finalData.length,
            total: finalData.length
          })
        }
        
        resolve(finalData)
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      }
    })
  })
}

/**
 * Clear CSV cache
 */
export function clearCsvCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(CACHE_VERSION_KEY)
  console.log('🗑️ Caché del CSV limpiado')
}
