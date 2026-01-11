import { useEffect, useMemo, useState } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { KpiCard } from './KpiCard'
import { Badge } from './Badge'
import { HeroAvatar } from './HeroAvatar'
import { HeroFunnyBlocks } from './HeroFunnyBlocks'
import { formatNumber, formatPercent, formatCompact, formatDecimal, formatDuration } from '../utils/format'
import { getHeroFunnyHighlights } from '../data/heroHighlights'
import { 
  getTalentStatsByHero, 
  getBestBuildByHero, 
  getMostPickedTalentByLevel 
} from '../data/heroTalentStats'
import { getTalentInfo } from '../utils/talentImages'

/**
 * Componente para mostrar un talento con su imagen y nombre legible
 */
function TalentDisplay({ talentName, size = 32, showName = true, className = '' }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [displayName, setDisplayName] = useState(talentName || '')
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!talentName) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadTalentInfo() {
      try {
        const { imageUrl: url, displayName: name } = await getTalentInfo(talentName)

        if (!cancelled) {
          setImageUrl(url)
          setDisplayName(name)
          setIsLoading(false)
          
          // Log en desarrollo para debugging
          if (import.meta.env.DEV) {
            if (url) {
              console.log(`[TalentDisplay] Loaded image for ${talentName}: ${url}`)
            } else {
              console.warn(`[TalentDisplay] No image found for ${talentName}, showing placeholder`)
            }
          }
        }
      } catch (error) {
        console.error('[TalentDisplay] Error loading talent info:', error, { talentName })
        if (!cancelled) {
          setImageUrl(null) // Asegurar que se muestre placeholder en caso de error
          setIsLoading(false)
        }
      }
    }

    loadTalentInfo()

    return () => {
      cancelled = true
    }
  }, [talentName])

  const handleImageError = (e) => {
    if (import.meta.env.DEV) {
      console.error('[TalentDisplay] Image failed to load:', {
        talentName,
        imageUrl,
        src: e.target?.src,
        error: e
      })
    }
    setImageError(true)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="bg-slate-700 rounded animate-pulse" style={{ width: size, height: size }} />
        {showName && <span className="text-white text-sm">{talentName}</span>}
      </div>
    )
  }

  const showPlaceholder = !imageUrl || imageError

  return (
    <div className={`flex items-center gap-2 ${className}`} title={talentName}>
      {showPlaceholder ? (
        <div
          className="bg-slate-700 rounded flex items-center justify-center text-slate-400 text-xs font-bold shrink-0"
          style={{ 
            width: size, 
            height: size,
            minWidth: size,
            minHeight: size
          }}
        >
          ?
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={displayName}
          className="rounded shrink-0"
          style={{ 
            width: size, 
            height: size,
            minWidth: size,
            minHeight: size
          }}
          onError={handleImageError}
        />
      )}
      {showName && (
        <span className="text-white text-sm font-medium">{displayName}</span>
      )}
    </div>
  )
}

/**
 * Hero details modal
 * Shows deep analytics for a selected hero in a centered modal
 */
export function HeroModal({ hero, rows, onClose }) {
  // Sort state for players table
  const [playerSort, setPlayerSort] = useState({ column: 'matches', direction: 'desc' })
  // State for talent tabs
  const [selectedTalentLevel, setSelectedTalentLevel] = useState(1)
  
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!hero) return null

  const { kpis, maps, players, trend, name, role } = hero
  
  // Compute funny highlights
  const funnyHighlights = useMemo(() => {
    if (!rows || !name) {
      console.warn('HeroModal: Missing rows or name', { rows: rows?.length, name })
      return []
    }
    try {
      const highlights = getHeroFunnyHighlights(rows, name)
      return highlights
    } catch (error) {
      console.error('Error computing funny highlights:', error)
      return []
    }
  }, [rows, name])
  
  // Compute talent statistics
  const talentStats = useMemo(() => {
    if (!rows || !name) return {}
    try {
      return getTalentStatsByHero(rows, name)
    } catch (error) {
      console.error('Error computing talent stats:', error)
      return {}
    }
  }, [rows, name])
  
  // Set initial selected talent level to first available
  useEffect(() => {
    if (Object.keys(talentStats).length > 0 && !talentStats[selectedTalentLevel]) {
      const firstAvailableLevel = [1, 4, 7, 10, 13, 16, 20].find(level => talentStats[level] && talentStats[level].length > 0)
      if (firstAvailableLevel) {
        setSelectedTalentLevel(firstAvailableLevel)
      }
    }
  }, [talentStats, selectedTalentLevel])
  
  // Compute best build
  const bestBuild = useMemo(() => {
    if (!rows || !name) return null
    try {
      return getBestBuildByHero(rows, name, 5)
    } catch (error) {
      console.error('Error computing best build:', error)
      return null
    }
  }, [rows, name])
  
  // Compute most picked ultimate (L10)
  const mostPickedUltimate = useMemo(() => {
    if (!rows || !name) return null
    try {
      return getMostPickedTalentByLevel(rows, name, 10)
    } catch (error) {
      console.error('Error computing most picked ultimate:', error)
      return null
    }
  }, [rows, name])
  
  // Compute most picked L20 talent
  const mostPickedL20 = useMemo(() => {
    if (!rows || !name) return null
    try {
      return getMostPickedTalentByLevel(rows, name, 20)
    } catch (error) {
      console.error('Error computing most picked L20:', error)
      return null
    }
  }, [rows, name])

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex items-center justify-between z-50 shrink-0 rounded-t-xl">
            <div className="flex items-center gap-4">
              <HeroAvatar 
                name={name} 
                role={role}
                size="lg" 
                showBorder={true}
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{name}</h2>
                <Badge variant="info">{role}</Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body: scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* KPI Cards */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">Estadísticas Clave</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiCard
                  title="Partidas"
                  value={formatNumber(kpis.matches)}
                  subtitle={kpis.confidenceNote}
                  icon="🎮"
                  explanation="Número total de partidas jugadas con este héroe"
                  showExplanation={!kpis.matches || kpis.matches === 0}
                />
                <KpiCard
                  title="Win Rate"
                  value={formatPercent(kpis.winRate)}
                  subtitle={`Wilson: ${formatPercent(kpis.winRateWilson)}`}
                  icon="🏆"
                  explanation="Porcentaje de victorias. Wilson ajusta por tamaño de muestra para mayor confiabilidad"
                  showExplanation={!kpis.matches || kpis.matches === 0 || isNaN(kpis.winRate) || kpis.winRate == null}
                />
                <KpiCard
                  title="Pick Rate"
                  value={formatPercent(kpis.pickRate)}
                  icon="📊"
                  explanation="Porcentaje de veces que este héroe fue elegido del total de partidas"
                  showExplanation={!kpis.matches || kpis.matches === 0 || isNaN(kpis.pickRate) || kpis.pickRate == null}
                />
                <KpiCard
                  title="KDA"
                  value={formatDecimal(kpis.kda, 2)}
                  subtitle={`${formatDecimal(kpis.avgKills, 1)}/${formatDecimal(kpis.avgDeaths, 1)}/${formatDecimal(kpis.avgAssists, 1)}`}
                  icon="⚔️"
                  explanation="Ratio de (Kills + Asistencias) / Muertes. Muestra eficiencia en combate"
                  showExplanation={!kpis.matches || kpis.matches === 0 || isNaN(kpis.kda) || kpis.kda == null}
                />
                <KpiCard
                  title="DPM"
                  value={formatCompact(kpis.dpm)}
                  subtitle="Daño por minuto"
                  icon="💥"
                  explanation="Daño por minuto. Mide la contribución de daño en el tiempo"
                  showExplanation={!kpis.matches || kpis.matches === 0 || isNaN(kpis.dpm) || kpis.dpm == null}
                />
                <KpiCard
                  title="Avg Tiempo Muerto"
                  value={formatDuration(kpis.avgSpentDeadSeconds)}
                  icon="💀"
                  explanation="Tiempo promedio que el héroe pasó muerto por partida"
                  showExplanation={!kpis.matches || kpis.matches === 0 || isNaN(kpis.avgSpentDeadSeconds) || kpis.avgSpentDeadSeconds == null}
                />
              </div>
            </section>

            {/* Trend Chart */}
            {trend && trend.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Tendencia en el Tiempo</h3>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="period" 
                          stroke="#94a3b8" 
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#94a3b8" 
                          fontSize={10}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#94a3b8" 
                          fontSize={10}
                          domain={[0, 1]}
                          tickFormatter={(v) => formatPercent(v, 0)}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #334155',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#f8fafc' }}
                          formatter={(value, name) => {
                            if (name === 'Win Rate') return [formatPercent(value), name]
                            return [formatNumber(value), name]
                          }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="matches" 
                          name="Partidas"
                          stroke="#6366f1" 
                          strokeWidth={2}
                          dot={{ fill: '#6366f1', r: 3 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="winRate" 
                          name="Win Rate"
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 3 }}
                        />
                        <ReferenceLine yAxisId="right" y={0.5} stroke="#f59e0b" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {/* Top Maps */}
            {maps && maps.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Rendimiento por Mapa</h3>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700/30">
                        <th className="text-left px-4 py-2 text-slate-300 text-sm">Mapa</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Partidas</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {maps.slice(0, 8).map((map) => (
                        <tr key={map.name} className="hover:bg-slate-700/20">
                          <td className="px-4 py-2 text-white text-sm">{map.name}</td>
                          <td className="px-4 py-2 text-right text-slate-300 text-sm">{map.matches}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={map.winRate >= 0.55 ? 'success' : map.winRate <= 0.45 ? 'danger' : 'default'}>
                              {formatPercent(map.winRate)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Top Players */}
            {players && players.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Jugadores con este Héroe</h3>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700/30">
                        <th className="text-left px-4 py-2 text-slate-300 text-sm">Jugador</th>
                        <th 
                          className="text-right px-4 py-2 text-slate-300 text-sm cursor-pointer hover:bg-slate-700/50 transition-colors select-none"
                          onClick={() => setPlayerSort(prev => ({
                            column: 'matches',
                            direction: prev.column === 'matches' && prev.direction === 'desc' ? 'asc' : 'desc'
                          }))}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Partidas
                            {playerSort.column === 'matches' && (
                              <span className="text-indigo-400">
                                {playerSort.direction === 'desc' ? '↓' : '↑'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-right px-4 py-2 text-slate-300 text-sm cursor-pointer hover:bg-slate-700/50 transition-colors select-none"
                          onClick={() => setPlayerSort(prev => ({
                            column: 'winRate',
                            direction: prev.column === 'winRate' && prev.direction === 'desc' ? 'asc' : 'desc'
                          }))}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Win Rate
                            {playerSort.column === 'winRate' && (
                              <span className="text-indigo-400">
                                {playerSort.direction === 'desc' ? '↓' : '↑'}
                              </span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {[...players]
                        .sort((a, b) => {
                          if (playerSort.column === 'matches') {
                            return playerSort.direction === 'desc' 
                              ? b.matches - a.matches 
                              : a.matches - b.matches
                          } else {
                            return playerSort.direction === 'desc'
                              ? b.winRate - a.winRate
                              : a.winRate - b.winRate
                          }
                        })
                        .slice(0, 8)
                        .map((player) => (
                        <tr key={player.name} className="hover:bg-slate-700/20">
                          <td className="px-4 py-2 text-white text-sm">{player.name}</td>
                          <td className="px-4 py-2 text-right text-slate-300 text-sm">{player.matches}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={player.winRate >= 0.55 ? 'success' : player.winRate <= 0.45 ? 'danger' : 'default'}>
                              {formatPercent(player.winRate)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Talent Statistics Section */}
            {(Object.keys(talentStats).length > 0 || bestBuild || mostPickedUltimate || mostPickedL20) && (
              <>
                {/* Most Picked Ultimate (L10) and L20 Talent - Grid 2x1 */}
                {(mostPickedUltimate || mostPickedL20) && (
                  <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Most Picked Ultimate (L10) */}
                      {mostPickedUltimate && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Ultimate (Nivel 10) más tomado</h3>
                          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl">⚡</span>
                              <div className="flex-1">
                                <TalentDisplay 
                                  talentName={mostPickedUltimate.talent} 
                                  size={40}
                                  showName={true}
                                  className="mb-1"
                                />
                                <p className="text-slate-400 text-sm">Ultimate más popular</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Pick %</p>
                                <p className="text-white font-semibold">{formatDecimal(mostPickedUltimate.pickPct, 1)}%</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Win %</p>
                                <p className="text-white font-semibold">
                                  <Badge variant={mostPickedUltimate.winPct >= 55 ? 'success' : mostPickedUltimate.winPct <= 45 ? 'danger' : 'default'}>
                                    {formatDecimal(mostPickedUltimate.winPct, 1)}%
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Partidas</p>
                                <p className="text-white font-semibold">{formatNumber(mostPickedUltimate.games)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Most Picked L20 Talent */}
                      {mostPickedL20 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Talento Nivel 20 más tomado</h3>
                          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl">⭐</span>
                              <div className="flex-1">
                                <TalentDisplay 
                                  talentName={mostPickedL20.talent} 
                                  size={40}
                                  showName={true}
                                  className="mb-1"
                                />
                                <p className="text-slate-400 text-sm">Talento de nivel 20 más popular</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Pick %</p>
                                <p className="text-white font-semibold">{formatDecimal(mostPickedL20.pickPct, 1)}%</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Win %</p>
                                <p className="text-white font-semibold">
                                  <Badge variant={mostPickedL20.winPct >= 55 ? 'success' : mostPickedL20.winPct <= 45 ? 'danger' : 'default'}>
                                    {formatDecimal(mostPickedL20.winPct, 1)}%
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Partidas</p>
                                <p className="text-white font-semibold">{formatNumber(mostPickedL20.games)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Best Build */}
                {bestBuild ? (
                  <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Mejor build según estadísticas</h3>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <div className="space-y-3 mb-4">
                        {[1, 4, 7, 10, 13, 16, 20].map(level => {
                          const talentName = bestBuild.talents[level]
                          if (!talentName) return null
                          
                          return (
                            <div key={level} className="flex items-center gap-3">
                              <span className="text-slate-400 text-sm w-16 shrink-0">Nivel {level}:</span>
                              <TalentDisplay 
                                talentName={talentName} 
                                size={32}
                                showName={true}
                                className="flex-1"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Win %</p>
                          <p className="text-white font-semibold text-lg">
                            <Badge variant={bestBuild.winPct >= 55 ? 'success' : bestBuild.winPct <= 45 ? 'danger' : 'default'}>
                              {formatDecimal(bestBuild.winPct, 1)}%
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Partidas</p>
                          <p className="text-white font-semibold text-lg">{formatNumber(bestBuild.games)}</p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs mt-3">
                        Calculado a partir de builds con al menos 5 partidas
                      </p>
                    </div>
                  </section>
                ) : (
                  Object.keys(talentStats).length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-white mb-3">Mejor build según estadísticas</h3>
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                        <p className="text-slate-400 text-sm">
                          No hay suficientes datos para determinar la mejor build (mínimo 5 partidas requeridas)
                        </p>
                      </div>
                    </section>
                  )
                )}

                {/* Most Picked Talents by Level */}
                {Object.keys(talentStats).length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Talentos más tomados</h3>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                      {/* Level Tabs */}
                      <div className="flex flex-wrap gap-2 p-4 border-b border-slate-700/50 bg-slate-700/20">
                        {[1, 4, 7, 10, 13, 16, 20].map(level => {
                          const hasData = talentStats[level] && talentStats[level].length > 0
                          if (!hasData) return null
                          return (
                            <button
                              key={level}
                              onClick={() => setSelectedTalentLevel(level)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                selectedTalentLevel === level
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              Nivel {level}
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Talent Table for Selected Level */}
                      {talentStats[selectedTalentLevel] && talentStats[selectedTalentLevel].length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-700/30">
                                <th className="text-left px-4 py-2 text-slate-300 text-sm">Talento</th>
                                <th className="text-right px-4 py-2 text-slate-300 text-sm">Pick %</th>
                                <th className="text-right px-4 py-2 text-slate-300 text-sm">Win %</th>
                                <th className="text-right px-4 py-2 text-slate-300 text-sm">Partidas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                              {talentStats[selectedTalentLevel].map((stat, idx) => (
                                <tr key={idx} className="hover:bg-slate-700/20">
                                  <td className="px-4 py-2">
                                    <TalentDisplay 
                                      talentName={stat.talent} 
                                      size={28}
                                      showName={true}
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-right text-slate-300 text-sm">
                                    {formatDecimal(stat.pickPct, 1)}%
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <Badge variant={stat.winPct >= 55 ? 'success' : stat.winPct <= 45 ? 'danger' : 'default'}>
                                      {formatDecimal(stat.winPct, 1)}%
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2 text-right text-slate-300 text-sm">
                                    {formatNumber(stat.games)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Funny Highlights */}
            {funnyHighlights && funnyHighlights.length > 0 && (
              <HeroFunnyBlocks blocks={funnyHighlights} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
