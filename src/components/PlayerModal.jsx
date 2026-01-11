import { useEffect, useMemo } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { KpiCard } from './KpiCard'
import { Badge } from './Badge'
import { HeroAvatar } from './HeroAvatar'
import { HeroFunnyBlocks } from './HeroFunnyBlocks'
import { formatNumber, formatPercent, formatCompact, formatDecimal, formatDuration } from '../utils/format'
import { getPlayerFunnyHighlights } from '../data/playerHighlights'

/**
 * Player details modal
 * Shows deep analytics for a selected player in a centered modal
 */
export function PlayerModal({ player, rows, onClose }) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!player) return null

  const { kpis, heroes, maps, trend, name } = player
  
  // Compute funny highlights
  const funnyHighlights = useMemo(() => {
    if (!rows || !name) {
      console.warn('PlayerModal: Missing rows or name', { rows: rows?.length, name })
      return []
    }
    try {
      const highlights = getPlayerFunnyHighlights(rows, name)
      return highlights
    } catch (error) {
      console.error('Error computing player funny highlights:', error)
      return []
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
          className="bg-layer-mid rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-lg-custom animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-layer-mid/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex items-center justify-between z-50 shrink-0 rounded-t-xl shadow-md-custom">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-sm-custom">
                {name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{name}</h2>
                <Badge variant="info">{kpis.matches} partidas</Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors shrink-0 shadow-sm-custom hover:shadow-md-custom"
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
                  subtitle={`${kpis.wins}W - ${kpis.losses}L`}
                  icon="🎮"
                />
                <KpiCard
                  title="Win Rate"
                  value={formatPercent(kpis.winRate)}
                  subtitle={`${kpis.wins} victorias`}
                  icon="🏆"
                />
                <KpiCard
                  title="KDA"
                  value={formatDecimal(kpis.kda, 2)}
                  subtitle={`${formatDecimal(kpis.avgKills, 1)}/${formatDecimal(kpis.avgDeaths, 1)}/${formatDecimal(kpis.avgAssists, 1)}`}
                  icon="⚔️"
                />
                <KpiCard
                  title="DPM"
                  value={formatCompact(kpis.dpm)}
                  subtitle="Daño por minuto"
                  icon="💥"
                />
                <KpiCard
                  title="Avg Daño Total"
                  value={formatCompact(kpis.avgTotalDamage)}
                  subtitle="Por partida"
                  icon="🔥"
                />
                <KpiCard
                  title="Avg Tiempo Muerto"
                  value={formatDuration(kpis.avgSpentDeadSeconds)}
                  icon="💀"
                />
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

            {/* Top Heroes */}
            {heroes && heroes.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Mejores Héroes</h3>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700/30">
                        <th className="text-left px-4 py-2 text-slate-300 text-sm">Héroe</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Partidas</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {heroes.slice(0, 10).map((hero) => (
                        <tr key={hero.name} className="hover:bg-slate-700/20">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <HeroAvatar 
                                name={hero.name} 
                                role={hero.role}
                                size="sm" 
                                showBorder={true}
                              />
                              <span className="text-white text-sm">{hero.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-300 text-sm">{hero.matches}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={hero.winRate >= 0.55 ? 'success' : hero.winRate <= 0.45 ? 'danger' : 'default'}>
                              {formatPercent(hero.winRate)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
