import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { SectionShell } from '../app/layout/SectionShell'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { getTopPlayersByMatches, getTopPlayersByWinRate, getAverage, getTotal } from '../data/metrics'
import { formatNumber, formatPercent, formatCompact } from '../utils/format'

/**
 * Calculate player detailed stats
 */
function getPlayerStats(rows) {
  const stats = new Map()
  
  for (const row of rows) {
    const name = row.playerName
    if (!name) continue
    
    if (!stats.has(name)) {
      stats.set(name, {
        name,
        matches: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        heroDamage: 0,
        healing: 0
      })
    }
    
    const s = stats.get(name)
    s.matches++
    if (row.winner) s.wins++
    s.kills += row.heroKills || 0
    s.deaths += row.deaths || 0
    s.assists += row.assists || 0
    s.heroDamage += row.heroDamage || 0
    s.healing += row.healingShielding || 0
  }
  
  // Calculate averages and winrate
  for (const s of stats.values()) {
    s.winRate = s.matches > 0 ? s.wins / s.matches : 0
    s.avgKills = s.matches > 0 ? s.kills / s.matches : 0
    s.avgDeaths = s.matches > 0 ? s.deaths / s.matches : 0
    s.avgAssists = s.matches > 0 ? s.assists / s.matches : 0
    s.avgDamage = s.matches > 0 ? s.heroDamage / s.matches : 0
    s.kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists
  }
  
  return Array.from(stats.values()).sort((a, b) => b.matches - a.matches)
}

/**
 * Players page with player statistics
 */
export function Players({ rows }) {
  const topByMatches = useMemo(() => getTopPlayersByMatches(rows, 10), [rows])
  const topByWinRate = useMemo(() => getTopPlayersByWinRate(rows, 10, 10), [rows])
  const playerStats = useMemo(() => getPlayerStats(rows), [rows])
  
  if (rows.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-8">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Players by Matches */}
        <ChartCard title="Jugadores Más Activos" subtitle="Top 10 por cantidad de partidas">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topByMatches} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f8fafc' }}
                  formatter={(value, name, props) => {
                    return [`${formatNumber(value)} (WR: ${formatPercent(props.payload.winRate)})`, 'Partidas']
                  }}
                />
                <Bar 
                  dataKey="matches" 
                  name="Partidas"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top Players by Win Rate */}
        <ChartCard title="Jugadores con Mayor Win Rate" subtitle="Top 10 (mínimo 10 partidas)">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topByWinRate} layout="vertical">
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
                  fontSize={11}
                  width={100}
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
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Players Table */}
      <SectionShell title="Tabla de Jugadores" description="Estadísticas detalladas por jugador">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/30">
                  <th className="text-left px-4 py-3 text-slate-300 font-medium text-sm">Jugador</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Partidas</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Win Rate</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Avg K</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Avg D</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Avg A</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">KDA</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Avg Daño</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {playerStats.slice(0, 15).map((player, idx) => (
                  <tr key={player.name} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-sm w-5">{idx + 1}</span>
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-slate-300">{formatNumber(player.matches)}</td>
                    <td className="text-right px-4 py-3">
                      <Badge 
                        variant={player.winRate >= 0.55 ? 'success' : player.winRate <= 0.45 ? 'danger' : 'default'}
                      >
                        {formatPercent(player.winRate)}
                      </Badge>
                    </td>
                    <td className="text-right px-4 py-3 text-slate-300">{player.avgKills.toFixed(1)}</td>
                    <td className="text-right px-4 py-3 text-slate-300">{player.avgDeaths.toFixed(1)}</td>
                    <td className="text-right px-4 py-3 text-slate-300">{player.avgAssists.toFixed(1)}</td>
                    <td className="text-right px-4 py-3">
                      <Badge variant={player.kda >= 3 ? 'success' : player.kda <= 1.5 ? 'danger' : 'info'}>
                        {player.kda.toFixed(2)}
                      </Badge>
                    </td>
                    <td className="text-right px-4 py-3 text-slate-300">{formatCompact(player.avgDamage)}</td>
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
