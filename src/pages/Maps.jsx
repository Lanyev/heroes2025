import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { SectionShell } from '../app/layout/SectionShell'
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

  // Prepare data for charts
  const mapsByMatches = [...mapsData].sort((a, b) => b.matches - a.matches)
  const mapsByWinRate = [...mapsData]
    .filter(m => m.matches >= 5)
    .sort((a, b) => b.winRate - a.winRate)

  return (
    <div className="space-y-8">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maps by Matches */}
        <ChartCard title="Mapas Más Jugados" subtitle="Ordenados por cantidad de partidas">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mapsByMatches} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  width={140}
                  tickFormatter={(v) => v.length > 20 ? v.slice(0, 18) + '...' : v}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f8fafc' }}
                  formatter={(value, name, props) => {
                    return [`${formatNumber(value)} partidas`, props.payload.name]
                  }}
                />
                <Bar 
                  dataKey="matches" 
                  name="Partidas"
                  fill="#06b6d4"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Maps by Win Rate */}
        <ChartCard title="Win Rate por Mapa" subtitle="Mínimo 5 partidas">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mapsByWinRate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  type="number" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  domain={[0, 1]}
                  tickFormatter={(v) => formatPercent(v, 0)}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  width={140}
                  tickFormatter={(v) => v.length > 20 ? v.slice(0, 18) + '...' : v}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f8fafc' }}
                  formatter={(value, name, props) => {
                    return [`${formatPercent(value)} (${props.payload.matches} partidas)`, 'Win Rate']
                  }}
                />
                <Bar 
                  dataKey="winRate" 
                  name="Win Rate"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Maps Table */}
      <SectionShell title="Tabla de Mapas" description="Estadísticas completas por mapa">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
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
                  <tr key={map.name} className="hover:bg-slate-700/20 transition-colors">
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
