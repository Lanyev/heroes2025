import { useEffect } from 'react'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import clsx from 'clsx'
import { KpiCard } from './KpiCard'
import { Badge } from './Badge'
import { HeroAvatar } from './HeroAvatar'
import { formatNumber, formatPercent, formatCompact, formatDecimal, formatDuration } from '../utils/format'

/**
 * Hero details drawer/panel
 * Shows deep analytics for a selected hero
 */
export function HeroDetailsDrawer({ hero, onClose }) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!hero) return null

  const { kpis, maps, players, trend, mostViolent, name, role } = hero

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
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

        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Estadísticas Clave</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard
                title="Partidas"
                value={formatNumber(kpis.matches)}
                subtitle={kpis.confidenceNote}
                icon="🎮"
              />
              <KpiCard
                title="Win Rate"
                value={formatPercent(kpis.winRate)}
                subtitle={`Wilson: ${formatPercent(kpis.winRateWilson)}`}
                icon="🏆"
              />
              <KpiCard
                title="Pick Rate"
                value={formatPercent(kpis.pickRate)}
                icon="📊"
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
                      <th className="text-right px-4 py-2 text-slate-300 text-sm">Partidas</th>
                      <th className="text-right px-4 py-2 text-slate-300 text-sm">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {players.slice(0, 8).map((player) => (
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

          {/* Most Violent Match */}
          {mostViolent && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">🔥 Partida Más Violenta</h3>
              <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">💥</div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {formatCompact(mostViolent.totalDamage)} daño total
                    </p>
                    <p className="text-slate-300 text-sm">
                      {formatCompact(mostViolent.heroDamage)} héroe + {formatCompact(mostViolent.siegeDamage)} asedio
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      {mostViolent.player} en {mostViolent.map}
                      {mostViolent.winner ? ' 🏆' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
