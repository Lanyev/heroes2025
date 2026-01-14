import { getPublicPath } from './paths'

/**
 * Utilidades para obtener imágenes y nombres legibles de talentos
 * Usa /public/talent-dict-optimized.json como fuente principal
 * y /public/talents-index.json como fallback
 */

// Cache del diccionario optimizado
let talentDict = null
let talentsIndex = null
let loadingPromise = null
let indexLoadingPromise = null

/**
 * Normaliza un nombre de talento para búsqueda en el índice
 * Convierte "AlarakExtendedLightning" -> "alarakextendedlightning"
 * @param {string} name - Nombre del talento
 * @returns {string} Nombre normalizado
 */
function normalizeTalentName(name) {
  if (!name) return ''
  // Convertir a minúsculas y remover guiones, espacios y guiones bajos
  return name.toLowerCase().replace(/[-_\s]/g, '')
}

/**
 * Carga el diccionario optimizado de talentos
 * @returns {Promise<Object>} Diccionario optimizado
 */
async function loadTalentDict() {
  // Si ya está cargado, retornar
  if (talentDict !== null) {
    return talentDict
  }

  // Si ya hay una carga en progreso, esperar a que termine
  if (loadingPromise) {
    return loadingPromise
  }

  // Iniciar carga
  loadingPromise = (async () => {
    try {
      const response = await fetch(getPublicPath('/talent-dict-optimized.json'))
      if (!response.ok) {
        console.warn('[TalentImage] No se pudo cargar talent-dict-optimized.json, usando índice como fallback')
        return await loadTalentsIndex()
      }
      const data = await response.json()
      talentDict = data.dict || data // Compatibilidad con ambos formatos
      if (import.meta.env.DEV) {
        console.log('[TalentImage] Diccionario optimizado cargado:', Object.keys(talentDict).length, 'talentos mapeados')
        if (data.metadata) {
          console.log('[TalentImage] Metadatos:', data.metadata)
        }
      }
      return talentDict
    } catch (error) {
      console.error('[TalentImage] Error al cargar talent-dict-optimized.json:', error)
      // Fallback al índice antiguo
      return await loadTalentsIndex()
    } finally {
      loadingPromise = null
    }
  })()

  return loadingPromise
}

/**
 * Carga el índice de talentos desde talents-index.json (fallback)
 * @returns {Promise<Object>} Índice de talentos
 */
export async function loadTalentsIndex() {
  // Si ya está cargado, retornar
  if (talentsIndex !== null) {
    return talentsIndex
  }

  // Si ya hay una carga en progreso, esperar a que termine
  if (indexLoadingPromise) {
    return indexLoadingPromise
  }

  // Iniciar carga
  indexLoadingPromise = (async () => {
    try {
      const response = await fetch(getPublicPath('/talents-index.json'))
      if (!response.ok) {
        console.error('[TalentImage] No se pudo cargar talents-index.json', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        })
        talentsIndex = {}
        return talentsIndex
      }
      talentsIndex = await response.json()
      if (import.meta.env.DEV) {
        console.log('[TalentImage] Índice cargado exitosamente:', Object.keys(talentsIndex).length, 'talentos')
      }
      return talentsIndex
    } catch (error) {
      console.error('[TalentImage] Error al cargar talents-index.json:', error)
      talentsIndex = {}
      return talentsIndex
    } finally {
      indexLoadingPromise = null
    }
  })()

  return indexLoadingPromise
}

/**
 * Busca un talento en el índice usando múltiples estrategias
 * @param {string} talentName - Nombre del talento del CSV (ej: "AlarakExtendedLightning")
 * @param {Object} index - Índice de talentos
 * @returns {Object|null} Entrada del índice o null
 */
function findTalentInIndex(talentName, index) {
  if (!talentName || !index || Object.keys(index).length === 0) {
    if (import.meta.env.DEV && !index) {
      console.warn('[TalentImage] Índice vacío o no cargado')
    }
    return null
  }

  // Estrategia 1: Buscar con el nombre completo normalizado
  const normalizedFull = normalizeTalentName(talentName)
  if (index[normalizedFull]) {
    return index[normalizedFull]
  }

  // Estrategia 2: Remover prefijo del héroe y buscar
  // Dividir en palabras CamelCase
  const camelCaseWords = talentName.match(/[A-Z][a-z]+/g) || []
  
  // Si hay múltiples palabras, intentar remover 1, 2, 3... palabras del inicio
  // (para manejar nombres de héroes compuestos como "WitchDoctor")
  if (camelCaseWords.length > 1) {
    // Intentar remover 1, 2, 3 palabras del inicio
    for (let i = 1; i <= Math.min(3, camelCaseWords.length - 1); i++) {
      // Primero intentar unir todas las palabras después de las i primeras (más confiable)
      const talentWords = camelCaseWords.slice(i).join('')
      const normalizedTalentWords = normalizeTalentName(talentWords)
      if (index[normalizedTalentWords]) {
        if (import.meta.env.DEV) {
          console.log(`[TalentImage] Found ${talentName} as ${normalizedTalentWords} (removed ${i} words)`)
        }
        return index[normalizedTalentWords]
      }
      
      // También intentar remover las primeras i palabras del string original
      // Encontrar la posición donde termina la i-ésima palabra
      let charIndex = 0
      for (let j = 0; j < i; j++) {
        const word = camelCaseWords[j]
        const wordIndex = talentName.indexOf(word, charIndex)
        if (wordIndex !== -1) {
          charIndex = wordIndex + word.length
        }
      }
      const withoutHero = talentName.substring(charIndex)
      const normalizedWithoutHero = normalizeTalentName(withoutHero)
      
      if (index[normalizedWithoutHero]) {
        if (import.meta.env.DEV) {
          console.log(`[TalentImage] Found ${talentName} as ${normalizedWithoutHero} (substring method)`)
        }
        return index[normalizedWithoutHero]
      }
    }
  }

  // Estrategia 3: Buscar variaciones con guiones y singular/plural
  // Algunos talentos en el índice pueden tener guiones en el nombre
  if (camelCaseWords.length > 1) {
    for (let i = 1; i <= Math.min(3, camelCaseWords.length - 1); i++) {
      const talentWords = camelCaseWords.slice(i)
      const lastWord = talentWords[talentWords.length - 1].toLowerCase()
      
      // Generar todas las variaciones posibles
      const variations = []
      
      // 1. Sin guiones: "packinstinct"
      variations.push(talentWords.join('').toLowerCase())
      
      // 2. Con guiones: "pack-instinct"
      variations.push(talentWords.join('-').toLowerCase())
      variations.push(normalizeTalentName(talentWords.join('-')))
      
      // 3. Variaciones singular/plural con guiones
      // Si no termina en "s", intentar con "s" (singular -> plural)
      if (!lastWord.endsWith('s') && lastWord.length > 3) {
        const pluralWords = [...talentWords]
        pluralWords[pluralWords.length - 1] = lastWord + 's'
        const pluralWithHyphens = pluralWords.join('-').toLowerCase()
        variations.push(pluralWithHyphens)
        variations.push(normalizeTalentName(pluralWithHyphens))
        // También sin guiones
        variations.push(pluralWords.join('').toLowerCase())
      }
      
      // Si termina en "s", intentar sin la "s" (plural -> singular)
      if (lastWord.endsWith('s') && lastWord.length > 3) {
        const singularWords = [...talentWords]
        singularWords[singularWords.length - 1] = lastWord.slice(0, -1)
        const singularWithHyphens = singularWords.join('-').toLowerCase()
        variations.push(singularWithHyphens)
        variations.push(normalizeTalentName(singularWithHyphens))
        // También sin guiones
        variations.push(singularWords.join('').toLowerCase())
      }
      
      // Buscar todas las variaciones
      for (const variation of variations) {
        if (index[variation]) {
          if (import.meta.env.DEV) {
            console.log(`[TalentImage] Found ${talentName} as variation: ${variation}`)
          }
          return index[variation]
        }
      }
      
      // Log en desarrollo las variaciones intentadas
      if (import.meta.env.DEV && i === 1) {
        console.log(`[TalentImage] Tried variations for ${talentName}:`, variations)
      }
    }
  }

  // Estrategia 4: Buscar por coincidencias parciales (última opción)
  // Extraer palabras clave del talento (sin el héroe)
  if (camelCaseWords.length > 1) {
    // Intentar con diferentes números de palabras removidas
    for (let i = 1; i <= Math.min(3, camelCaseWords.length - 1); i++) {
      const talentPart = camelCaseWords.slice(i).join('')
      const words = talentPart.split(/(?=[A-Z])/).filter(w => w.length > 0).map(w => w.toLowerCase())
      
      if (words.length > 0) {
        // Buscar coincidencias exactas primero
        const normalizedPart = normalizeTalentName(talentPart)
        if (index[normalizedPart]) {
          return index[normalizedPart]
        }
        
        // Buscar variaciones: todas las palabras juntas
        const allWordsTogether = words.join('')
        if (index[allWordsTogether]) {
          return index[allWordsTogether]
        }
        
        // Buscar por palabras clave - si todas las palabras importantes están presentes
        let bestMatch = null
        let bestMatchScore = 0
        
        for (const [key, value] of Object.entries(index)) {
          const keyWords = key.split(/(?=[a-z][A-Z])|[-_\s]/).filter(w => w.length > 0).map(w => w.toLowerCase())
          
          // Calcular score: cuántas palabras del talento están en la clave
          let matchScore = 0
          for (const word of words) {
            if (word.length >= 4) { // Solo palabras de 4+ caracteres (evitar "of", "the", etc.)
              if (keyWords.some(kw => kw.includes(word) || word.includes(kw))) {
                matchScore++
              }
            }
          }
          
          // Si todas las palabras importantes (>=4 chars) están presentes
          const importantWords = words.filter(w => w.length >= 4)
          if (importantWords.length > 0 && matchScore === importantWords.length && matchScore > bestMatchScore) {
            bestMatch = value
            bestMatchScore = matchScore
          }
        }
        
        if (bestMatch) {
          return bestMatch
        }
      }
    }
  }

  return null
}

/**
 * Formatea un nombre de talento para mostrarlo legible
 * Convierte "extended-lightning" -> "Extended Lightning"
 * O "AlarakExtendedLightning" -> "Extended Lightning" (si se puede)
 * @param {string} originalName - Nombre original del talento
 * @param {string} talentName - Nombre del talento del CSV (fallback)
 * @returns {string} Nombre formateado
 */
function formatTalentDisplayName(originalName, talentName) {
  if (originalName) {
    // Si tenemos originalName del índice, formatearlo
    // Convertir "extended-lightning" -> "Extended Lightning"
    return originalName
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Fallback: formatear el nombre del CSV
  if (!talentName) return 'Talento Desconocido'

  // Intentar remover el prefijo del héroe
  let withoutHero = talentName.replace(/^[A-Z][a-z]+/, '')
  if (withoutHero === talentName) {
    withoutHero = talentName.replace(/^([A-Z][a-z]+)+/, '')
  }

  // Convertir CamelCase a espacios
  const formatted = withoutHero
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  return formatted || talentName
}

/**
 * Obtiene la URL de la imagen para un talento
 * @param {string} talentName - Nombre del talento del CSV (ej: "AlarakExtendedLightning")
 * @returns {Promise<string|null>} URL de la imagen o null si no se encuentra
 */
export async function getTalentImageUrl(talentName) {
  if (!talentName) return null

  const index = await loadTalentsIndex()
  const entry = findTalentInIndex(talentName, index)

  if (entry && entry.path) {
    return entry.path
  }

  // Log en desarrollo si no se encuentra
  if (import.meta.env.DEV) {
    const normalizedFull = normalizeTalentName(talentName)
    const camelCaseWords = talentName.match(/[A-Z][a-z]+/g) || []
    const withoutHero = camelCaseWords.length > 1 ? talentName.substring(camelCaseWords[0].length) : talentName
    const normalizedWithoutHero = normalizeTalentName(withoutHero)
    console.warn(`[TalentImage] No se encontró imagen para talento: ${talentName}`, {
      normalizedFull,
      withoutHero,
      normalizedWithoutHero,
      indexKeys: Object.keys(index).filter(k => k.includes('extended') || k.includes('lightning')).slice(0, 5)
    })
  }

  return null
}

/**
 * Obtiene el nombre legible para mostrar de un talento
 * @param {string} talentName - Nombre del talento del CSV (ej: "AlarakExtendedLightning")
 * @returns {Promise<string>} Nombre legible del talento
 */
export async function getTalentDisplayName(talentName) {
  if (!talentName) return 'Talento Desconocido'

  const index = await loadTalentsIndex()
  const entry = findTalentInIndex(talentName, index)

  if (entry && entry.originalName) {
    return formatTalentDisplayName(entry.originalName, talentName)
  }

  // Fallback: formatear el nombre del CSV
  return formatTalentDisplayName(null, talentName)
}

/**
 * Obtiene tanto la URL de la imagen como el nombre legible de un talento
 * @param {string} talentName - Nombre del talento del CSV
 * @returns {Promise<{imageUrl: string|null, displayName: string}>}
 */
export async function getTalentInfo(talentName) {
  if (!talentName) {
    return { imageUrl: null, displayName: 'Talento Desconocido' }
  }

  // Primero intentar con el diccionario optimizado
  const dict = await loadTalentDict()
  
  // Si el diccionario tiene el talento directamente, usarlo (más rápido)
  if (dict && dict[talentName]) {
    const imageUrl = dict[talentName]
    const displayName = formatTalentDisplayName(null, talentName)
    
    if (import.meta.env.DEV) {
      console.log(`[TalentImage] Found in optimized dict: ${talentName} -> ${imageUrl}`)
    }
    
    return { imageUrl, displayName }
  }

  // Fallback: usar el índice antiguo con búsqueda inteligente
  const index = await loadTalentsIndex()
  
  if (!index || Object.keys(index).length === 0) {
    if (import.meta.env.DEV) {
      console.warn('[TalentImage] Índice no cargado o vacío, talento no encontrado:', talentName)
    }
    return { 
      imageUrl: null, 
      displayName: formatTalentDisplayName(null, talentName) 
    }
  }

  const entry = findTalentInIndex(talentName, index)

  const imageUrl = entry && entry.path ? entry.path : null
  const displayName = entry && entry.originalName
    ? formatTalentDisplayName(entry.originalName, talentName)
    : formatTalentDisplayName(null, talentName)

  // Log en desarrollo para debugging
  if (import.meta.env.DEV) {
    if (entry) {
      console.log(`[TalentImage] Found talent: ${talentName} -> ${entry.path}`, { entry })
    } else {
      console.warn(`[TalentImage] Talent not found: ${talentName}`, {
        normalized: normalizeTalentName(talentName),
        indexSize: Object.keys(index).length,
        sampleKeys: Object.keys(index).slice(0, 5)
      })
    }
  }

  // Log en desarrollo si no se encuentra imagen
  if (!imageUrl && import.meta.env.DEV) {
    const normalizedFull = normalizeTalentName(talentName)
    const camelCaseWords = talentName.match(/[A-Z][a-z]+/g) || []
    const triedKeys = []
    const allVariations = []
    
    // Mostrar todas las claves que se intentaron buscar
    for (let i = 1; i <= Math.min(3, camelCaseWords.length); i++) {
      const talentWords = camelCaseWords.slice(i)
      
      if (talentWords.length === 0) continue
      
      const lastWord = talentWords[talentWords.length - 1]?.toLowerCase()
      
      if (!lastWord) continue
      
      // Generar todas las variaciones que se intentaron
      const variations = []
      variations.push(talentWords.join('').toLowerCase())
      variations.push(talentWords.join('-').toLowerCase())
      variations.push(normalizeTalentName(talentWords.join('-')))
      
      if (!lastWord.endsWith('s') && lastWord.length > 3) {
        const pluralWords = [...talentWords]
        pluralWords[pluralWords.length - 1] = lastWord + 's'
        variations.push(pluralWords.join('-').toLowerCase())
        variations.push(normalizeTalentName(pluralWords.join('-')))
        variations.push(pluralWords.join('').toLowerCase())
      }
      
      allVariations.push(...variations)
      triedKeys.push(...variations.map(v => normalizeTalentName(v)))
    }
    
    // Buscar claves similares
    const importantWords = camelCaseWords.length > 1 
      ? camelCaseWords.slice(1).filter(w => w.length >= 4).map(w => w.toLowerCase())
      : [normalizedFull]
    
    const similarKeys = Object.keys(index).filter(k => {
      return importantWords.some(word => k.includes(word) || word.includes(k))
    }).slice(0, 10)
    
    console.warn(`[TalentImage] No se encontró imagen para talento: ${talentName}`, {
      normalizedFull,
      triedKeys: [...new Set(triedKeys)], // Remover duplicados
      allVariations: [...new Set(allVariations)],
      camelCaseWords,
      importantWords,
      indexSize: Object.keys(index).length,
      similarKeys,
      // Verificar si alguna variación existe en el índice
      foundInIndex: allVariations.filter(v => index[normalizeTalentName(v)]).map(v => ({
        variation: v,
        normalized: normalizeTalentName(v),
        found: !!index[normalizeTalentName(v)]
      }))
    })
  }

  return { imageUrl, displayName }
}

/**
 * Pre-carga el índice de talentos
 * Útil para cargar el índice al inicio de la aplicación
 */
export async function preloadTalentsIndex() {
  await loadTalentsIndex()
}
