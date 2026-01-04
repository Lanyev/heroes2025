import { useMemo, useCallback } from 'react'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Cell 
} from 'recharts'
import { KpiCard } from '../components/KpiCard'
import { ChartCard } from '../components/ChartCard'
import { SectionShell } from '../app/layout/SectionShell'
import { EmptyState } from '../components/EmptyState'
import { 
  calculateOverviewMetrics, 
  getRoleDistribution, 
  getMatchesOverTime 
} from '../data/metrics'
import { formatNumber, formatPercent, formatDuration, formatCompact } from '../utils/format'

/**
 * Overview page with main KPIs and summary charts
 */
export function Overview({ rows }) {
  const metrics = useMemo(() => calculateOverviewMetrics(rows), [rows])
  const roleDistribution = useMemo(() => getRoleDistribution(rows), [rows])
  const matchesOverTime = useMemo(() => getMatchesOverTime(rows), [rows])

  // Calculate max value for opacity calculation
  const maxCount = useMemo(() => {
    return roleDistribution.length > 0 ? Math.max(...roleDistribution.map(r => r.count)) : 1
  }, [roleDistribution])

  // Function to calculate fill color with opacity based on value
  const getRoleFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.count / maxCount) // Minimum opacity 0.3, max 1.0
    return `rgba(99, 102, 241, ${opacity})` // #6366f1 with opacity
  }, [maxCount])
  
  if (rows.length === 0) {
    return <EmptyState />
  }

  const roleColors = {
    'Tank': '#3b82f6',
    'Bruiser': '#f59e0b',
    'Ranged Assassin': '#ef4444',
    'Melee Assassin': '#ec4899',
    'Healer': '#10b981',
    'Support': '#8b5cf6',
    'Unknown': '#6b7280'
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <SectionShell title="Resumen General">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            title="Total Partidas"
            value={formatNumber(metrics.totalMatches)}
            icon="🎮"
          />
          <KpiCard
            title="Win Rate"
            value={formatPercent(metrics.winRate)}
            icon="🏆"
          />
          <KpiCard
            title="Avg Daño Héroe"
            value={formatCompact(metrics.avgHeroDamage)}
            icon="⚔️"
          />
          <KpiCard
            title="Avg Muertes"
            value={metrics.avgDeaths.toFixed(1)}
            icon="💀"
          />
          <KpiCard
            title="Avg Tiempo Muerto"
            value={formatDuration(metrics.avgSpentDeadSeconds)}
            icon="⏱️"
          />
          <KpiCard
            title="Avg Duración"
            value={formatDuration(metrics.avgGameTimeSeconds)}
            icon="⏳"
          />
        </div>
      </SectionShell>

      {/* Combat Stats */}
      <SectionShell title="Estadísticas de Combate">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Total Kills"
            value={formatNumber(metrics.totalKills)}
            subtitle={`Promedio: ${metrics.avgKills.toFixed(1)}`}
            icon="🗡️"
          />
          <KpiCard
            title="Total Muertes"
            value={formatNumber(metrics.totalDeaths)}
            subtitle={`Promedio: ${metrics.avgDeaths.toFixed(1)}`}
            icon="☠️"
          />
          <KpiCard
            title="Total Asistencias"
            value={formatNumber(metrics.totalAssists)}
            subtitle={`Promedio: ${metrics.avgAssists.toFixed(1)}`}
            icon="🤝"
          />
          <KpiCard
            title="Avg Takedowns"
            value={metrics.avgTakedowns.toFixed(1)}
            icon="🎯"
          />
        </div>
      </SectionShell>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matches Over Time */}
        <ChartCard title="Partidas en el Tiempo" subtitle="Agrupadas por semana">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={matchesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="period" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="matches" 
                  name="Partidas"
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#818cf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Role Distribution */}
        <ChartCard title="Distribución por Rol" subtitle="Cantidad de picks por rol">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis 
                  dataKey="role" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  width={110}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f8fafc' }}
                  formatter={(value, name, props) => [
                    `${formatNumber(value)} (${formatPercent(props.payload.percentage)})`,
                    'Partidas'
                  ]}
                />
                <Bar 
                  dataKey="count" 
                  name="Partidas"
                  radius={[0, 4, 4, 0]}
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRoleFill(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
