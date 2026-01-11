import { useState, useEffect, useMemo } from 'react'
import { loadTalentsIndex, getTalentInfo } from '../utils/talentImages'

/**
 * Página de testeo para verificar todas las imágenes de talentos
 * Muestra todas las imágenes del índice y marca cuáles no se cargan
 * También muestra todos los talentos del CSV y verifica si tienen imagen
 */
export function TalentImagesTest({ rows }) {
  const [talentsIndex, setTalentsIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [failedImages, setFailedImages] = useState(new Set())
  const [loadedImages, setLoadedImages] = useState(new Set())
  const [searchText, setSearchText] = useState('')
  const [showOnlyFailed, setShowOnlyFailed] = useState(false)
  const [csvTalents, setCsvTalents] = useState([])
  const [csvTalentsLoading, setCsvTalentsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('index') // 'index' o 'csv'

  // Cargar el índice de talentos
  useEffect(() => {
    async function loadIndex() {
      try {
        setLoading(true)
        const index = await loadTalentsIndex()
        setTalentsIndex(index)
        setError(null)
      } catch (err) {
        console.error('Error loading talents index:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadIndex()
  }, [])

  // Extraer todos los talentos únicos del CSV
  useEffect(() => {
    if (!rows || rows.length === 0) return

    async function extractCsvTalents() {
      setCsvTalentsLoading(true)
      try {
        const talentSet = new Set()
        const talentMap = new Map() // Para guardar información adicional

        // Extraer talentos de todos los niveles
        const levels = [1, 4, 7, 10, 13, 16, 20]
        for (const row of rows) {
          for (const level of levels) {
            const talentKey = `talentL${level}`
            const talentName = row[talentKey]?.trim()
            
            if (talentName && talentName.length > 0 && talentName !== 'Unknown' && talentName !== '-') {
              if (!talentSet.has(talentName)) {
                talentSet.add(talentName)
                talentMap.set(talentName, {
                  name: talentName,
                  level,
                  heroName: row.heroName,
                  hasImage: null,
                  imageUrl: null,
                  displayName: null
                })
              }
            }
          }
        }

        // Verificar imágenes para cada talento
        const talentsWithImages = []
        const index = await loadTalentsIndex()
        
        for (const [talentName, talentInfo] of talentMap.entries()) {
          try {
            const { imageUrl, displayName } = await getTalentInfo(talentName)
            talentsWithImages.push({
              ...talentInfo,
              hasImage: !!imageUrl,
              imageUrl,
              displayName
            })
          } catch (error) {
            talentsWithImages.push({
              ...talentInfo,
              hasImage: false,
              imageUrl: null,
              displayName: null,
              error: error.message
            })
          }
        }

        // Ordenar por nombre de héroe, luego por nivel, luego por nombre de talento
        talentsWithImages.sort((a, b) => {
          if (a.heroName !== b.heroName) {
            return a.heroName.localeCompare(b.heroName)
          }
          if (a.level !== b.level) {
            return a.level - b.level
          }
          return a.name.localeCompare(b.name)
        })

        setCsvTalents(talentsWithImages)
      } catch (error) {
        console.error('Error extracting CSV talents:', error)
      } finally {
        setCsvTalentsLoading(false)
      }
    }

    extractCsvTalents()
  }, [rows])

  // Obtener lista de talentos ordenada
  const talentsList = useMemo(() => {
    if (!talentsIndex) return []
    
    return Object.entries(talentsIndex)
      .map(([key, value]) => ({
        key,
        ...value,
        normalizedKey: key
      }))
      .sort((a, b) => a.originalName.localeCompare(b.originalName))
  }, [talentsIndex])

  // Filtrar talentos según búsqueda y filtro de fallidos
  const filteredTalents = useMemo(() => {
    let filtered = talentsList

    // Filtrar por búsqueda
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(talent => 
        talent.originalName.toLowerCase().includes(searchLower) ||
        talent.key.toLowerCase().includes(searchLower) ||
        talent.filename.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar solo fallidos
    if (showOnlyFailed) {
      filtered = filtered.filter(talent => failedImages.has(talent.path))
    }

    return filtered
  }, [talentsList, searchText, showOnlyFailed, failedImages])

  // Manejar carga exitosa de imagen
  const handleImageLoad = (path) => {
    setLoadedImages(prev => new Set([...prev, path]))
    setFailedImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(path)
      return newSet
    })
  }

  // Manejar error de carga de imagen
  const handleImageError = (path, filename) => {
    setFailedImages(prev => new Set([...prev, path]))
    setLoadedImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(path)
      return newSet
    })
    if (import.meta.env.DEV) {
      console.warn(`[TalentImagesTest] Imagen falló: ${path} (${filename})`)
    }
  }

  // Estadísticas de talentos del índice
  const stats = useMemo(() => {
    if (!talentsList) {
      return { total: 0, loaded: 0, failed: 0, pending: 0 }
    }
    return {
      total: talentsList.length,
      loaded: loadedImages.size,
      failed: failedImages.size,
      pending: talentsList.length - loadedImages.size - failedImages.size
    }
  }, [talentsList, loadedImages.size, failedImages.size])

  // Estadísticas de talentos del CSV
  const csvStats = useMemo(() => {
    const total = csvTalents.length
    const withImage = csvTalents.filter(t => t.hasImage).length
    const withoutImage = csvTalents.filter(t => !t.hasImage).length
    return { total, withImage, withoutImage }
  }, [csvTalents])

  // Filtrar talentos del CSV
  const filteredCsvTalents = useMemo(() => {
    let filtered = csvTalents

    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(talent => 
        talent.name.toLowerCase().includes(searchLower) ||
        talent.heroName.toLowerCase().includes(searchLower) ||
        (talent.displayName && talent.displayName.toLowerCase().includes(searchLower))
      )
    }

    if (showOnlyFailed) {
      filtered = filtered.filter(talent => !talent.hasImage)
    }

    return filtered
  }, [csvTalents, searchText, showOnlyFailed])

  // Early returns después de todos los hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando índice de talentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Error al cargar el índice</p>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Testeo de Imágenes de Talentos</h1>
        
        {/* Tabs para cambiar entre vista de índice y CSV */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('index')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'index'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Índice de Imágenes ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'csv'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Talentos del CSV ({csvStats.total})
          </button>
        </div>
        
        {/* Estadísticas según la pestaña activa */}
        {activeTab === 'index' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Total</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-green-900/20 rounded-lg p-3 border border-green-700/30">
              <p className="text-green-400 text-sm mb-1">Cargadas</p>
              <p className="text-green-400 text-2xl font-bold">{stats.loaded}</p>
            </div>
            <div className="bg-red-900/20 rounded-lg p-3 border border-red-700/30">
              <p className="text-red-400 text-sm mb-1">Fallidas</p>
              <p className="text-red-400 text-2xl font-bold">{stats.failed}</p>
            </div>
            <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-700/30">
              <p className="text-yellow-400 text-sm mb-1">Pendientes</p>
              <p className="text-yellow-400 text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Total Talentos CSV</p>
              <p className="text-white text-2xl font-bold">{csvStats.total}</p>
            </div>
            <div className="bg-green-900/20 rounded-lg p-3 border border-green-700/30">
              <p className="text-green-400 text-sm mb-1">Con Imagen</p>
              <p className="text-green-400 text-2xl font-bold">{csvStats.withImage}</p>
            </div>
            <div className="bg-red-900/20 rounded-lg p-3 border border-red-700/30">
              <p className="text-red-400 text-sm mb-1">Sin Imagen</p>
              <p className="text-red-400 text-2xl font-bold">{csvStats.withoutImage}</p>
            </div>
          </div>
        )}

        {/* Controles de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, clave o archivo..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={showOnlyFailed}
              onChange={(e) => setShowOnlyFailed(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-white text-sm">Solo fallidas</span>
          </label>
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === 'index' ? (
        /* Lista de talentos del índice */
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="mb-4">
            <p className="text-slate-400 text-sm">
              Mostrando {filteredTalents.length} de {talentsList.length} talentos del índice
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Estas son las imágenes que están en el índice. Todas deberían cargar correctamente.
            </p>
          </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredTalents.map((talent) => {
            const isFailed = failedImages.has(talent.path)
            const isLoaded = loadedImages.has(talent.path)
            const isLoading = !isFailed && !isLoaded

            return (
              <div
                key={talent.key}
                className={`
                  relative bg-slate-900/50 rounded-lg border-2 p-3 transition-all
                  ${isFailed 
                    ? 'border-red-500/50 bg-red-900/10' 
                    : isLoaded 
                    ? 'border-green-500/50 bg-green-900/10' 
                    : 'border-slate-700/50'
                  }
                `}
              >
                {/* Indicador de estado */}
                <div className="absolute top-1 right-1">
                  {isFailed && (
                    <span className="text-red-500 text-xs font-bold" title="Imagen fallida">✗</span>
                  )}
                  {isLoaded && (
                    <span className="text-green-500 text-xs font-bold" title="Imagen cargada">✓</span>
                  )}
                  {isLoading && (
                    <span className="text-yellow-500 text-xs font-bold animate-pulse" title="Cargando...">⟳</span>
                  )}
                </div>

                {/* Imagen */}
                <div className="flex items-center justify-center mb-2 h-16 bg-slate-800 rounded">
                  <img
                    src={talent.path}
                    alt={talent.originalName}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => handleImageLoad(talent.path)}
                    onError={() => handleImageError(talent.path, talent.filename)}
                  />
                </div>

                {/* Información */}
                <div className="space-y-1">
                  <p className="text-white text-xs font-medium truncate" title={talent.originalName}>
                    {talent.originalName}
                  </p>
                  <p className="text-slate-500 text-xs truncate" title={talent.filename}>
                    {talent.filename}
                  </p>
                  <p className="text-slate-600 text-xs truncate font-mono" title={talent.key}>
                    {talent.key}
                  </p>
                  {isFailed && (
                    <p className="text-red-400 text-xs truncate" title={talent.path}>
                      {talent.path}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredTalents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No se encontraron talentos con los filtros aplicados</p>
          </div>
        )}
        </div>
      ) : (
        /* Lista de talentos del CSV */
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          {csvTalentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-400">Analizando talentos del CSV...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-slate-400 text-sm">
                  Mostrando {filteredCsvTalents.length} de {csvTalents.length} talentos del CSV
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Estos son los talentos que aparecen en tus datos. Verifica cuáles tienen imagen asociada.
                </p>
              </div>

              <div className="space-y-2">
                {filteredCsvTalents.map((talent, idx) => (
                  <div
                    key={`${talent.heroName}-${talent.level}-${talent.name}-${idx}`}
                    className={`
                      flex items-center gap-4 p-3 rounded-lg border-2 transition-all
                      ${talent.hasImage 
                        ? 'bg-green-900/10 border-green-500/50' 
                        : 'bg-red-900/10 border-red-500/50'
                      }
                    `}
                  >
                    {/* Imagen o placeholder */}
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                      {talent.hasImage && talent.imageUrl ? (
                        <img
                          src={talent.imageUrl}
                          alt={talent.displayName || talent.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-slate-500 text-xs font-bold">?</span>
                      )}
                    </div>

                    {/* Información del talento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium truncate">
                          {talent.displayName || talent.name}
                        </p>
                        {talent.hasImage ? (
                          <span className="text-green-400 text-xs font-bold">✓</span>
                        ) : (
                          <span className="text-red-400 text-xs font-bold">✗</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">{talent.heroName}</span>
                        <span>•</span>
                        <span>Nivel {talent.level}</span>
                        {talent.imageUrl && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-500 truncate">{talent.imageUrl}</span>
                          </>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs font-mono truncate mt-1" title={talent.name}>
                        {talent.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCsvTalents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400">No se encontraron talentos con los filtros aplicados</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Lista de fallidas del índice (si hay) */}
      {activeTab === 'index' && failedImages.size > 0 && (
        <div className="bg-red-900/10 rounded-xl border border-red-700/50 p-6">
          <h2 className="text-xl font-bold text-red-400 mb-4">
            Imágenes Fallidas ({failedImages.size})
          </h2>
          <div className="space-y-2">
            {Array.from(failedImages).map((path) => {
              const talent = talentsList.find(t => t.path === path)
              return (
                <div key={path} className="bg-slate-900/50 rounded p-2 border border-red-700/30">
                  <p className="text-red-400 text-sm font-mono">{path}</p>
                  {talent && (
                    <p className="text-slate-400 text-xs mt-1">
                      {talent.originalName} ({talent.filename})
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
