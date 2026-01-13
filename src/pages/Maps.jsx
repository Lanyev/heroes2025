import { useMemo, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { SectionShell } from '../app/layout/SectionShell'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { getMapsTable } from '../data/metrics'
import { formatNumber, formatPercent } from '../utils/format'

/**
 * Maps page with map statistics
 */
export function Maps({ rows }) {
  const mapsData = useMemo(() => getMapsTable(rows), [rows])
  
  if (rows.length === 0) {
    return <EmptyState />
  }

  const shouldReduceMotion = useReducedMotion()
  
  // Chart animation variants
  const chartVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: shouldReduceMotion ? 0 : 0.4, 
        ease: 'easeOut' 
      }
    }
  }

  // Prepare data for charts
  const mapsByMatches = [...mapsData].sort((a, b) => b.matches - a.matches)
  const mapsByWinRate = [...mapsData]
    .filter(m => m.matches >= 5)
    .sort((a, b) => b.winRate - a.winRate)

  // Calculate max values for opacity calculation
  const maxMatches = useMemo(() => {
    return mapsByMatches.length > 0 ? Math.max(...mapsByMatches.map(m => m.matches)) : 1
  }, [mapsByMatches])

  const maxWinRate = useMemo(() => {
    return mapsByWinRate.length > 0 ? Math.max(...mapsByWinRate.map(m => m.winRate)) : 1
  }, [mapsByWinRate])

  // Function to calculate fill color with opacity based on value
  const getMatchesFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.matches / maxMatches) // Minimum opacity 0.3, max 1.0
    return `rgba(6, 182, 212, ${opacity})` // #06b6d4 with opacity
  }, [maxMatches])

  const getWinRateFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.winRate / maxWinRate) // Minimum opacity 0.3, max 1.0
    return `rgba(16, 185, 129, ${opacity})` // #10b981 with opacity
  }, [maxWinRate])

  return (
    <div className="space-y-8 relative z-10">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maps by Matches */}
        <motion.div variants={chartVariants} initial="initial" animate="animate">
          <ChartCard>
            <SectionHeader
              title="Mapas Más Jugados"
              subtitle="Ordenados por cantidad de partidas"
            />
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapsByMatches} layout="vertical">
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(51, 65, 85, 0.2)" 
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={11}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={11}
                    width={140}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(v) => v.length > 20 ? v.slice(0, 18) + '...' : v}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value, name, props) => {
                      return [`${formatNumber(value)} partidas`, props.payload.name]
                    }}
                  />
                  <Bar 
                    dataKey="matches" 
                    name="Partidas"
                    radius={[0, 6, 6, 0]}
                  >
                    {mapsByMatches.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getMatchesFill(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Maps by Win Rate */}
        <motion.div variants={chartVariants} initial="initial" animate="animate">
          <ChartCard>
            <SectionHeader
              title="Win Rate por Mapa"
              subtitle="Mínimo 5 partidas"
            />
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapsByWinRate} layout="vertical">
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(51, 65, 85, 0.2)" 
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={11}
                    domain={[0, 1]}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(v) => formatPercent(v, 0)}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={11}
                    width={140}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(v) => v.length > 20 ? v.slice(0, 18) + '...' : v}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value, name, props) => {
                      return [`${formatPercent(value)} (${props.payload.matches} partidas)`, 'Win Rate']
                    }}
                  />
                  <Bar 
                    dataKey="winRate" 
                    name="Win Rate"
                    radius={[0, 6, 6, 0]}
                  >
                    {mapsByWinRate.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getWinRateFill(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Maps Table */}
      <SectionShell title="Tabla de Mapas" description="Estadísticas completas por mapa" isSecondary>
        <div className="bg-layer-deep/80 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/30">
                  <th className="text-left px-4 py-3 text-slate-300 font-medium text-sm">Mapa</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Partidas</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Victorias</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Derrotas</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {mapsData.map((map, idx) => (
                  <tr key={map.name} className="hover:bg-slate-700/20 transition-colors card-hover-lift">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-sm w-5">{idx + 1}</span>
                        <span className="text-white font-medium">{map.name}</span>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-slate-300">{formatNumber(map.matches)}</td>
                    <td className="text-right px-4 py-3 text-emerald-400">{formatNumber(map.wins)}</td>
                    <td className="text-right px-4 py-3 text-red-400">{formatNumber(map.matches - map.wins)}</td>
                    <td className="text-right px-4 py-3">
                      <Badge 
                        variant={map.winRate >= 0.55 ? 'success' : map.winRate <= 0.45 ? 'danger' : 'default'}
                      >
                        {formatPercent(map.winRate)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionShell>
    </div>
  )
}
