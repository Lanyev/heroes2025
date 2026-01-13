import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Cell 
} from 'recharts'
import { MetricCard, createMetricCardProps } from '../components/MetricCard'
import { ChartCard } from '../components/ChartCard'
import { SectionHeader } from '../components/SectionHeader'
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
 * Modernized with 2026 trends: visual hierarchy, micro-insights, semantic motion, contextual comparison
 */
export function Overview({ rows }) {
  const shouldReduceMotion = useReducedMotion()
  const prevRowsRef = useRef(rows)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const metrics = useMemo(() => calculateOverviewMetrics(rows), [rows])
  const roleDistribution = useMemo(() => getRoleDistribution(rows), [rows])
  const matchesOverTime = useMemo(() => getMatchesOverTime(rows), [rows])
  
  // Detect filter changes for animations
  useEffect(() => {
    if (prevRowsRef.current !== rows && prevRowsRef.current.length > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    prevRowsRef.current = rows
  }, [rows])

  // Calculate max value for opacity calculation
  const maxCount = useMemo(() => {
    return roleDistribution.length > 0 ? Math.max(...roleDistribution.map(r => r.count)) : 1
  }, [roleDistribution])

  // Function to calculate fill color with opacity based on value
  const getRoleFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.count / maxCount)
    return `rgba(99, 102, 241, ${opacity})`
  }, [maxCount])
  
  if (rows.length === 0) {
    return <EmptyState />
  }

  // Calculate per-game values
  const totalMatches = metrics.totalMatches || 1
  const killsPerGame = totalMatches > 0 ? metrics.totalKills / totalMatches : 0
  const deathsPerGame = totalMatches > 0 ? metrics.totalDeaths / totalMatches : 0
  const assistsPerGame = totalMatches > 0 ? metrics.totalAssists / totalMatches : 0

  // Editorial insights for charts
  const matchesOverTimeInsight = useMemo(() => {
    if (matchesOverTime.length === 0) return null
    const peakWeek = matchesOverTime.reduce((max, item) => 
      item.matches > max.matches ? item : max, matchesOverTime[0]
    )
    return `Semana más activa: ${peakWeek.period} (${formatNumber(peakWeek.matches)} partidas)`
  }, [matchesOverTime])

  const roleDistributionInsight = useMemo(() => {
    if (roleDistribution.length === 0) return null
    const dominantRole = roleDistribution[0]
    return `Rol dominante: ${dominantRole.role} (${formatPercent(dominantRole.percentage)})`
  }, [roleDistribution])

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

  return (
    <div className="space-y-8 relative z-10">
      {/* Tier A: Máxima importancia - Total Partidas, Win Rate, Avg Takedowns */}
      <SectionShell title="Resumen General" isPrimary>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Tier A cards - span 2 cols on desktop, full width on mobile */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <MetricCard
              {...createMetricCardProps({
                title: 'Total Partidas',
                value: formatNumber(metrics.totalMatches),
                icon: '🎮',
                tier: 'A',
                type: null,
                rawValue: metrics.totalMatches,
                totalMatches: metrics.totalMatches
              })}
              animate={isAnimating}
              className="w-full h-full"
            />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <MetricCard
              {...createMetricCardProps({
                title: 'Win Rate',
                value: formatPercent(metrics.winRate),
                icon: '🏆',
                tier: 'A',
                type: 'winRate',
                rawValue: metrics.winRate,
                totalMatches: metrics.totalMatches
              })}
              animate={isAnimating}
              className="w-full h-full"
            />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <MetricCard
              {...createMetricCardProps({
                title: 'Avg Takedowns',
                value: metrics.avgTakedowns.toFixed(1),
                icon: '🎯',
                tier: 'A',
                type: 'takedowns',
                rawValue: metrics.avgTakedowns,
                totalMatches: metrics.totalMatches,
                avgValue: metrics.avgTakedowns
              })}
              animate={isAnimating}
              className="w-full h-full"
              tooltip="Promedio de eliminaciones (kills + assists)"
            />
          </div>
          
          {/* Tier B: Métricas secundarias - Centradas */}
          <div className="col-span-full xl:col-span-6 flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl items-stretch">
              <MetricCard
                {...createMetricCardProps({
                  title: 'Avg Daño Héroe',
                  value: formatCompact(metrics.avgHeroDamage),
                  icon: '⚔️',
                  tier: 'B',
                  type: 'damage',
                  rawValue: metrics.avgHeroDamage,
                  totalMatches: metrics.totalMatches
                })}
                animate={isAnimating}
                className="h-full"
                tooltip="Promedio de daño a héroes enemigos"
              />
              
              <MetricCard
                {...createMetricCardProps({
                  title: 'Avg Muertes',
                  value: metrics.avgDeaths.toFixed(1),
                  icon: '💀',
                  tier: 'B',
                  type: 'deaths',
                  rawValue: metrics.avgDeaths,
                  totalMatches: metrics.totalMatches,
                  avgValue: metrics.avgDeaths
                })}
                animate={isAnimating}
                className="h-full"
              />
              
              <MetricCard
                {...createMetricCardProps({
                  title: 'Avg Duración',
                  value: formatDuration(metrics.avgGameTimeSeconds),
                  icon: '⏳',
                  tier: 'B',
                  type: 'duration',
                  rawValue: metrics.avgGameTimeSeconds,
                  totalMatches: metrics.totalMatches
                })}
                animate={isAnimating}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Tier B: Estadísticas de Combate con comparación contextual */}
      <SectionShell title="Estadísticas de Combate" isSecondary>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            {...createMetricCardProps({
              title: 'Total Kills',
              value: formatNumber(metrics.totalKills),
              icon: '🗡️',
              tier: 'B',
              type: 'kills',
              rawValue: metrics.totalKills,
              totalMatches: metrics.totalMatches,
              avgValue: metrics.avgKills,
              perGameValue: totalMatches > 0 
                ? `≈ ${killsPerGame.toFixed(1)} por partida` 
                : '—'
            })}
            priority={1}
            animate={isAnimating}
          />
          
          <MetricCard
            {...createMetricCardProps({
              title: 'Total Muertes',
              value: formatNumber(metrics.totalDeaths),
              icon: '☠️',
              tier: 'B',
              type: 'deaths',
              rawValue: metrics.totalDeaths,
              totalMatches: metrics.totalMatches,
              avgValue: metrics.avgDeaths,
              perGameValue: totalMatches > 0 
                ? `≈ ${deathsPerGame.toFixed(1)} por partida` 
                : '—'
            })}
            priority={2}
            animate={isAnimating}
          />
          
          <MetricCard
            {...createMetricCardProps({
              title: 'Total Asistencias',
              value: formatNumber(metrics.totalAssists),
              icon: '🤝',
              tier: 'B',
              type: 'assists',
              rawValue: metrics.totalAssists,
              totalMatches: metrics.totalMatches,
              avgValue: metrics.avgAssists,
              perGameValue: totalMatches > 0 
                ? `≈ ${assistsPerGame.toFixed(1)} por partida` 
                : '—'
            })}
            priority={3}
            animate={isAnimating}
          />
          
          <MetricCard
            {...createMetricCardProps({
              title: 'Avg Tiempo Muerto',
              value: formatDuration(metrics.avgSpentDeadSeconds),
              icon: '⏱️',
              tier: 'B',
              type: 'timeDead',
              rawValue: metrics.avgSpentDeadSeconds,
              totalMatches: metrics.totalMatches
            })}
            priority={4}
            animate={isAnimating}
          />
        </div>
      </SectionShell>

      {/* Charts Row - Más editoriales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matches Over Time */}
        <motion.div variants={chartVariants} initial="initial" animate="animate">
          <ChartCard>
            <SectionHeader
              title="Partidas en el Tiempo"
              subtitle="Agrupadas por semana"
              insight={matchesOverTimeInsight}
            />
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={matchesOverTime}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(51, 65, 85, 0.2)" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="period" 
                    stroke="#64748b" 
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11}
                    tick={{ fill: '#94a3b8' }}
                    width={50}
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
                  />
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(99, 102, 241, 0.25)" />
                      <stop offset="100%" stopColor="rgba(99, 102, 241, 0.02)" />
                    </linearGradient>
                  </defs>
                  <Line 
                    type="monotone" 
                    dataKey="matches" 
                    name="Partidas"
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    fill="url(#lineGradient)"
                    dot={{ fill: '#6366f1', strokeWidth: 2, stroke: '#818cf8', r: 3.5 }}
                    activeDot={{ r: 5, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Role Distribution */}
        <motion.div variants={chartVariants} initial="initial" animate="animate">
          <ChartCard>
            <SectionHeader
              title="Distribución por Rol"
              subtitle="Cantidad de picks por rol"
              insight={roleDistributionInsight}
            />
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistribution} layout="vertical">
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
                    dataKey="role" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={11}
                    width={110}
                    tick={{ fill: '#94a3b8' }}
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
                    formatter={(value, name, props) => [
                      `${formatNumber(value)} (${formatPercent(props.payload.percentage)})`,
                      'Partidas'
                    ]}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Partidas"
                    radius={[0, 6, 6, 0]}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRoleFill(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      </div>
    </div>
  )
}
