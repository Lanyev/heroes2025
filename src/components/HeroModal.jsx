import { useEffect, useMemo, useState } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { KpiCard } from './KpiCard'
import { Badge } from './Badge'
import { HeroAvatar } from './HeroAvatar'
import { PlayerAvatar } from './PlayerAvatar'
import { PlayerModal } from './PlayerModal'
import { HeroFunnyBlocks } from './HeroFunnyBlocks'
import { Emote } from './Emote'
import { formatNumber, formatPercent, formatCompact, formatDecimal, formatDuration } from '../utils/format'
import { getHeroFunnyHighlights } from '../data/heroHighlights'
import { getPlayerDetails } from '../data/metrics'
import { 
  getTalentStatsByHero, 
  getBestBuildByHero, 
  getMostPickedTalentByLevel 
} from '../data/heroTalentStats'
import { getTalentInfo } from '../utils/talentImages'

/**
 * Componente para mostrar un talento con su imagen y nombre legible
 */
export function TalentDisplay({ talentName, size = 32, showName = true, className = '' }) {
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
  // State for selected player modal
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
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
      {/* Backdrop - Dark glass overlay */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-black/60 via-slate-900/50 to-black/60 backdrop-blur-sm z-[60] flex items-center justify-center overflow-y-auto"
        onClick={onClose}
        style={{
          paddingTop: 'calc(var(--app-header-h, 80px) + 16px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingBottom: '16px'
        }}
      >
        {/* Modal Container - Premium dark glass panel */}
        <div 
          className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/30 shadow-2xl animate-modal-enter w-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}
        >
          {/* Header - Hero Summary */}
          <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30 px-6 py-5 flex items-center justify-between z-10 shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              {/* Avatar - 10-15% bigger */}
              <div className="shrink-0">
                <HeroAvatar 
                  name={name} 
                  role={role}
                  size="xl" 
                  showBorder={true}
                />
              </div>
              
              {/* Name and Role */}
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold text-white mb-1">{name}</h2>
                <Badge variant="info" size="md">{role}</Badge>
              </div>
              
              {/* Inline Badges - Quick Stats */}
              <div className="flex items-center gap-3 shrink-0">
                <div className={`${kpis.winRate >= 0.5 ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg px-4 py-2`}>
                  <div className={`${kpis.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'} text-xs font-medium mb-0.5`}>Win Rate</div>
                  <div className="text-white text-xl font-bold">{formatPercent(kpis.winRate)}</div>
                </div>
                <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg px-4 py-2">
                  <div className="text-slate-400 text-xs font-medium mb-0.5">Partidas</div>
                  <div className="text-white text-xl font-bold">{formatNumber(kpis.matches)}</div>
                </div>
                <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg px-4 py-2">
                  <div className="text-slate-400 text-xs font-medium mb-0.5">Pick Rate</div>
                  <div className="text-white text-xl font-bold">{formatPercent(kpis.pickRate)}</div>
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="ml-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all shrink-0"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body - Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ maxHeight: '100%' }}>
            {/* Key Stats Strip - 4 prominent stats */}
            <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`bg-gradient-to-br ${kpis.winRate >= 0.5 ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/10' : 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/10'} border rounded-xl p-5 transition-all hover:shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🏆</span>
                    <div className="text-slate-400 text-xs font-medium">Win Rate</div>
                  </div>
                  <div className={`text-3xl font-bold ${kpis.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>{formatPercent(kpis.winRate)}</div>
                  {kpis.winRateWilson && (
                    <div className="text-slate-500 text-xs mt-1">Wilson: {formatPercent(kpis.winRateWilson)}</div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-5 hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚔️</span>
                    <div className="text-slate-400 text-xs font-medium">KDA</div>
                  </div>
                  <div className="text-white text-3xl font-bold">{formatDecimal(kpis.kda, 2)}</div>
                  <div className="text-slate-500 text-xs mt-1">{formatDecimal(kpis.avgKills, 1)}/{formatDecimal(kpis.avgDeaths, 1)}/{formatDecimal(kpis.avgAssists, 1)}</div>
                </div>
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-5 hover:border-red-400/50 transition-all hover:shadow-lg hover:shadow-red-500/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💥</span>
                    <div className="text-slate-400 text-xs font-medium">DPM</div>
                  </div>
                  <div className="text-white text-3xl font-bold">{formatCompact(kpis.dpm)}</div>
                  <div className="text-slate-500 text-xs mt-1">Daño por minuto</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5 hover:border-amber-400/50 transition-all hover:shadow-lg hover:shadow-amber-500/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💀</span>
                    <div className="text-slate-400 text-xs font-medium">Avg Time Dead</div>
                  </div>
                  <div className="text-white text-3xl font-bold">{formatDuration(kpis.avgSpentDeadSeconds)}</div>
                  <div className="text-slate-500 text-xs mt-1">Por partida</div>
                </div>
              </div>
            </section>

            {/* Performance Breakdown - Two Columns */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Group A: Output */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Output</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Avg Hero Damage</span>
                        <span className="text-white font-semibold">{formatCompact(kpis.avgHeroDamage || 0)}</span>
                      </div>
                    </div>
                    {kpis.avgHealingShielding > 0 && (
                      <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-sm">Avg Healing/Shielding</span>
                          <span className="text-white font-semibold">{formatCompact(kpis.avgHealingShielding)}</span>
                        </div>
                      </div>
                    )}
                    {kpis.avgSiegeDamage > 0 && (
                      <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-sm">Avg Siege/Structure</span>
                          <span className="text-white font-semibold">{formatCompact(kpis.avgSiegeDamage)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Group B: Survivability */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Survivability</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Avg Damage Taken</span>
                        <span className="text-white font-semibold">{formatCompact(kpis.avgDamageTaken || 0)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Avg Time Dead</span>
                        <span className="text-white font-semibold">{formatDuration(kpis.avgSpentDeadSeconds)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Trend Chart */}
            {trend && trend.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Tendencia en el Tiempo</h3>
                <div className="bg-layer-mid/60 rounded-xl p-4 border border-slate-700/50 shadow-md-custom">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
                        <defs>
                          <linearGradient id="lineGradientMatches" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.05)" />
                          </linearGradient>
                          <linearGradient id="lineGradientWinRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
                          </linearGradient>
                        </defs>
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
                          strokeWidth={2.5}
                          fill="url(#lineGradientMatches)"
                          dot={{ fill: '#6366f1', strokeWidth: 2, stroke: '#818cf8', r: 4 }}
                          activeDot={{ r: 6, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 2 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="winRate" 
                          name="Win Rate"
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          fill="url(#lineGradientWinRate)"
                          dot={{ fill: '#10b981', strokeWidth: 2, stroke: '#34d399', r: 4 }}
                          activeDot={{ r: 6, fill: '#34d399', stroke: '#10b981', strokeWidth: 2 }}
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
                <div className="bg-layer-deep/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-layer-light/40 shadow-sm-custom">
                        <th className="text-left px-4 py-2 text-slate-300 text-sm">Mapa</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Partidas</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {maps.slice(0, 8).map((map) => (
                        <tr key={map.name} className="hover:bg-slate-700/20 transition-colors card-hover-lift">
                          <td className="px-4 py-2 text-white text-sm">{map.name}</td>
                          <td className="px-4 py-2 text-right text-slate-300 text-sm">{map.matches}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={map.winRate >= 0.5 ? 'success' : 'danger'}>
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
                <div className="bg-layer-deep/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-layer-light/40 shadow-sm-custom">
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
                        .map((player) => {
                          const handlePlayerClick = () => {
                            // Pass the current hero name to filter player stats by this hero
                            const playerDetails = getPlayerDetails(rows, player.name, name)
                            if (playerDetails) {
                              setSelectedPlayer(playerDetails)
                            }
                          }
                          
                          return (
                            <tr 
                              key={player.name} 
                              className="hover:bg-slate-700/20 transition-colors cursor-pointer"
                              onClick={handlePlayerClick}
                            >
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <PlayerAvatar
                                    name={player.name}
                                    size="sm"
                                    showBorder={true}
                                  />
                                  <span className="text-white text-sm">{player.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right text-slate-300 text-sm">{player.matches}</td>
                              <td className="px-4 py-2 text-right">
                                <Badge variant={player.winRate >= 0.5 ? 'success' : 'danger'}>
                                  {formatPercent(player.winRate)}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
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
                              <Emote emoji="⚡" size={32} />
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
                                  <Badge variant={mostPickedUltimate.winPct >= 50 ? 'success' : 'danger'}>
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
                          <div className="bg-layer-mid/60 rounded-xl border border-slate-700/50 p-4 shadow-md-custom">
                            <div className="flex items-center gap-3 mb-3">
                              <Emote emoji="⭐" size={32} />
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
                                  <Badge variant={mostPickedL20.winPct >= 50 ? 'success' : 'danger'}>
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


                {/* Most Picked Talents by Level */}
                {Object.keys(talentStats).length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-white mb-3">Talentos más tomados</h3>
                    <div className="bg-layer-deep/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
                      {/* Level Tabs */}
                      <div className="flex flex-wrap gap-2 p-4 border-b border-slate-700/50 bg-layer-light/20">
                        {[1, 4, 7, 10, 13, 16, 20].map(level => {
                          const hasData = talentStats[level] && talentStats[level].length > 0
                          if (!hasData) return null
                          return (
                            <button
                              key={level}
                              onClick={() => setSelectedTalentLevel(level)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                selectedTalentLevel === level
                                  ? 'bg-indigo-600 text-white shadow-elevated'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 shadow-sm-custom hover:shadow-md-custom'
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
                              <tr className="bg-layer-light/40 shadow-sm-custom">
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
                                    <Badge variant={stat.winPct >= 50 ? 'success' : 'danger'}>
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

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          rows={rows}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  )
}
