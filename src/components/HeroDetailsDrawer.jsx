import { useEffect, useMemo, useState } from 'react'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import clsx from 'clsx'
import { KpiCard } from './KpiCard'
import { Badge } from './Badge'
import { HeroAvatar } from './HeroAvatar'
import { HeroFunnyBlocks } from './HeroFunnyBlocks'
import { formatNumber, formatPercent, formatCompact, formatDecimal, formatDuration } from '../utils/format'
import { getHeroFunnyHighlights } from '../data/heroHighlights'

/**
 * Hero details drawer/panel
 * Shows deep analytics for a selected hero
 */
export function HeroDetailsDrawer({ hero, rows, onClose }) {
  // Sort state for players table
  const [playerSort, setPlayerSort] = useState({ column: 'matches', direction: 'desc' })
  
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
      console.warn('HeroDetailsDrawer: Missing rows or name', { rows: rows?.length, name })
      return []
    }
    try {
      const highlights = getHeroFunnyHighlights(rows, name)
      console.log('HeroDetailsDrawer: Computed highlights', { 
        heroName: name, 
        rowsCount: rows.length, 
        highlightsCount: highlights.length,
        firstHighlight: highlights[0]?.title 
      })
      return highlights
    } catch (error) {
      console.error('Error computing funny highlights:', error)
      return []
    }
  }, [rows, name])

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 z-50 flex flex-col animate-fade-in">
        {/* Header: altura fija, sticky, z-index alto */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex items-center justify-between z-50 shrink-0">
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

        {/* Body: scroll solo aquí, con padding superior para espaciado */}
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
                isHighlighted
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
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
                      <defs>
                        <linearGradient id="lineGradientMatchesDrawer" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                          <stop offset="100%" stopColor="rgba(99, 102, 241, 0.05)" />
                        </linearGradient>
                        <linearGradient id="lineGradientWinRateDrawer" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#lineGradientMatchesDrawer)"
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
                        fill="url(#lineGradientWinRateDrawer)"
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
              <div className="bg-layer-deep/80 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
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
                      <tr key={map.name} className="hover:bg-slate-700/20 transition-colors card-hover-lift">
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
              <div className="bg-layer-deep/80 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
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

          {/* Funny Highlights */}
          {funnyHighlights && funnyHighlights.length > 0 && (
            <HeroFunnyBlocks blocks={funnyHighlights} />
          )}
        </div>
      </div>
    </>
  )
}
