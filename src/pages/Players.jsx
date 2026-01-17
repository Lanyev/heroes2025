import { useMemo, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { SectionShell } from '../app/layout/SectionShell'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { SortableTable } from '../components/SortableTable'
import { PlayerModal } from '../components/PlayerModal'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { getTopPlayersByMatches, getTopPlayersByWinRate, getAverage, getTotal, getPlayerDetails } from '../data/metrics'
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
        siegeDamage: 0,
        totalDamage: 0,
        damageTaken: 0,
        healing: 0,
        maxKills: 0,
        maxDeaths: 0,
        maxAssists: 0,
        maxHeroDamage: 0,
        maxTotalDamage: 0,
        maxDamageTaken: 0,
        maxHealing: 0
      })
    }
    
    const s = stats.get(name)
    s.matches++
    if (row.winner) s.wins++
    
    const currentKills = row.heroKills || 0
    const currentDeaths = row.deaths || 0
    const currentAssists = row.assists || 0
    const currentHeroDamage = row.heroDamage || 0
    const currentSiegeDamage = row.siegeDamage || 0
    const currentTotalDamage = currentHeroDamage + currentSiegeDamage
    const currentDamageTaken = row.damageTaken || 0
    const currentHealing = row.healingShielding || 0
    
    s.kills += currentKills
    s.deaths += currentDeaths
    s.assists += currentAssists
    s.heroDamage += currentHeroDamage
    s.siegeDamage += currentSiegeDamage
    s.totalDamage += currentTotalDamage
    s.damageTaken += currentDamageTaken
    s.healing += currentHealing
    
    // Track maximums per match
    if (currentKills > s.maxKills) s.maxKills = currentKills
    if (currentDeaths > s.maxDeaths) s.maxDeaths = currentDeaths
    if (currentAssists > s.maxAssists) s.maxAssists = currentAssists
    if (currentHeroDamage > s.maxHeroDamage) s.maxHeroDamage = currentHeroDamage
    if (currentTotalDamage > s.maxTotalDamage) s.maxTotalDamage = currentTotalDamage
    if (currentDamageTaken > s.maxDamageTaken) s.maxDamageTaken = currentDamageTaken
    if (currentHealing > s.maxHealing) s.maxHealing = currentHealing
  }
  
  // Calculate averages and winrate
  for (const s of stats.values()) {
    s.winRate = s.matches > 0 ? s.wins / s.matches : 0
    s.avgKills = s.matches > 0 ? s.kills / s.matches : 0
    s.avgDeaths = s.matches > 0 ? s.deaths / s.matches : 0
    s.avgAssists = s.matches > 0 ? s.assists / s.matches : 0
    s.avgDamage = s.matches > 0 ? s.heroDamage / s.matches : 0
    s.avgTotalDamage = s.matches > 0 ? s.totalDamage / s.matches : 0
    s.avgDamageTaken = s.matches > 0 ? s.damageTaken / s.matches : 0
    s.avgHealing = s.matches > 0 ? s.healing / s.matches : 0
    s.kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists
  }
  
  return Array.from(stats.values()).sort((a, b) => b.matches - a.matches)
}

/**
 * Column definitions for players table
 */
const PLAYER_TABLE_COLUMNS = [
  { key: 'name', label: 'Jugador', sortable: true, type: 'string' },
  { key: 'matches', label: 'Partidas', sortable: true, type: 'number' },
  { key: 'winRate', label: 'Win Rate', sortable: true, type: 'percent' },
  { key: 'kda', label: 'KDA', sortable: true, type: 'decimal' },
  // Average columns first
  { key: 'avgKills', label: 'Avg K', sortable: true, type: 'decimal' },
  { key: 'avgDeaths', label: 'Avg D', sortable: true, type: 'decimal' },
  { key: 'avgAssists', label: 'Avg A', sortable: true, type: 'decimal' },
  { key: 'avgDamage', label: 'Avg Daño', sortable: true, type: 'compact' },
  { key: 'avgTotalDamage', label: 'Avg Daño Total', sortable: true, type: 'compact' },
  { key: 'avgDamageTaken', label: 'Avg D.Tankeado', sortable: true, type: 'compact' },
  { key: 'avgHealing', label: 'Avg Heal', sortable: true, type: 'compact' },
  // Max columns after averages
  { key: 'maxKills', label: 'Max K', sortable: true, type: 'number' },
  { key: 'maxAssists', label: 'Max A', sortable: true, type: 'number' },
  { key: 'maxHeroDamage', label: 'Max D.Héroe', sortable: true, type: 'compact' },
  { key: 'maxTotalDamage', label: 'Max Daño', sortable: true, type: 'compact' },
  { key: 'maxDamageTaken', label: 'Max D.Tankeado', sortable: true, type: 'compact' },
  { key: 'maxHealing', label: 'Max Heal', sortable: true, type: 'compact' },
]

/**
 * Players page with player statistics
 */
export function Players({ rows }) {
  const [tableSort, setTableSort] = useState({ key: 'matches', direction: 'desc' })
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  const topByMatches = useMemo(() => getTopPlayersByMatches(rows, 10), [rows])
  const topByWinRate = useMemo(() => getTopPlayersByWinRate(rows, 10, 10), [rows])
  const playerStats = useMemo(() => getPlayerStats(rows), [rows])
  
  // Calculate max values for opacity calculation
  const maxMatches = useMemo(() => {
    return topByMatches.length > 0 ? Math.max(...topByMatches.map(p => p.matches)) : 1
  }, [topByMatches])
  
  const maxWinRate = useMemo(() => {
    return topByWinRate.length > 0 ? Math.max(...topByWinRate.map(p => p.winRate)) : 1
  }, [topByWinRate])
  
  // Function to calculate fill color with opacity based on value
  const getMatchesFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.matches / maxMatches) // Minimum opacity 0.3, max 1.0
    return `rgba(139, 92, 246, ${opacity})` // #8b5cf6 with opacity
  }, [maxMatches])
  
  const getWinRateFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.winRate / maxWinRate) // Minimum opacity 0.3, max 1.0
    return `rgba(245, 158, 11, ${opacity})` // #f59e0b with opacity
  }, [maxWinRate])
  
  // Sort player stats
  const sortedPlayerStats = useMemo(() => {
    const { key, direction } = tableSort
    
    // Get column definition to understand the type
    const columnDef = PLAYER_TABLE_COLUMNS.find(col => col.key === key)
    const isNumericType = columnDef && ['number', 'decimal', 'percent', 'compact', 'duration'].includes(columnDef.type)
    
    return [...playerStats].sort((a, b) => {
      let aVal = a[key]
      let bVal = b[key]
      
      // Handle null/undefined values - put them at the end
      const aIsNull = aVal === null || aVal === undefined || aVal === ''
      const bIsNull = bVal === null || bVal === undefined || bVal === ''
      
      if (aIsNull && bIsNull) return 0
      if (aIsNull) return 1
      if (bIsNull) return -1
      
      // Handle string sorting (for name, etc.)
      if (!isNumericType && typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }
      
      // For numeric types, ensure we're comparing numbers
      const aNum = typeof aVal === 'number' ? aVal : (typeof aVal === 'string' ? parseFloat(aVal) : Number(aVal))
      const bNum = typeof bVal === 'number' ? bVal : (typeof bVal === 'string' ? parseFloat(bVal) : Number(bVal))
      
      // Handle NaN cases (invalid numbers) - put them at the end
      if (isNaN(aNum) && isNaN(bNum)) return 0
      if (isNaN(aNum)) return 1
      if (isNaN(bNum)) return -1
      
      // Handle numeric sorting with proper comparison
      const diff = aNum - bNum
      return direction === 'asc' ? diff : -diff
    })
  }, [playerStats, tableSort])
  
  // Handle sort column click
  const handleSort = useCallback((key) => {
    setTableSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }, [])
  
  // Handle row click - open details drawer
  const handleRowClick = useCallback((row) => {
    const details = getPlayerDetails(rows, row.name)
    setSelectedPlayer(details)
  }, [rows])
  
  // Custom cell renderer for players table
  const renderPlayerCell = useCallback((row, column) => {
    if (column.key === 'name') {
      return (
        <PlayerAvatarWithName
          name={row.name}
          size="sm"
          showBorder={false}
        />
      )
    }
    
    if (column.key === 'winRate') {
      return (
        <Badge 
          variant={row.winRate >= 0.55 ? 'success' : row.winRate <= 0.45 ? 'danger' : 'default'}
        >
          {formatPercent(row.winRate)}
        </Badge>
      )
    }
    
    if (column.key === 'kda') {
      return (
        <Badge variant={row.kda >= 3 ? 'success' : row.kda <= 1.5 ? 'danger' : 'info'}>
          {row.kda.toFixed(2)}
        </Badge>
      )
    }
    
    if (column.key === 'matches') {
      return (
        <span className="text-slate-300">{formatNumber(row.matches)}</span>
      )
    }
    
    if (column.key === 'avgKills' || column.key === 'avgDeaths' || column.key === 'avgAssists') {
      return (
        <span className="text-slate-300">{row[column.key].toFixed(1)}</span>
      )
    }
    
    if (column.key === 'avgDamage' || column.key === 'avgTotalDamage' || column.key === 'avgDamageTaken' || column.key === 'avgHealing') {
      return (
        <span className="text-slate-300">{formatCompact(row[column.key])}</span>
      )
    }
    
    if (column.key === 'maxKills' || column.key === 'maxAssists') {
      return (
        <span className="text-slate-300">{formatNumber(row[column.key])}</span>
      )
    }
    
    if (column.key === 'maxHeroDamage' || column.key === 'maxTotalDamage' || column.key === 'maxDamageTaken' || column.key === 'maxHealing') {
      return (
        <span className="text-slate-300">{formatCompact(row[column.key])}</span>
      )
    }
    
    return null
  }, [])
  
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative z-10">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Players by Matches */}
        <motion.div variants={chartVariants} initial="initial" animate="animate">
          <ChartCard>
            <SectionHeader
              title="Jugadores Más Activos"
              subtitle="Top 10 por cantidad de partidas"
            />
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByMatches} layout="vertical">
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(51, 65, 85, 0.2)" 
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={10}
                    width={80}
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
                    formatter={(value, name, props) => {
                      return [`${formatNumber(value)} (WR: ${formatPercent(props.payload.winRate)})`, 'Partidas']
                    }}
                  />
                  <Bar 
                    dataKey="matches" 
                    name="Partidas"
                    radius={[0, 6, 6, 0]}
                  >
                    {topByMatches.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getMatchesFill(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Top Players by Win Rate */}
        <motion.div variants={chartVariants} initial="initial" animate="animate">
          <ChartCard>
            <SectionHeader
              title="Jugadores con Mayor Win Rate"
              subtitle="Top 10 (mínimo 10 partidas)"
            />
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByWinRate} layout="vertical">
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(51, 65, 85, 0.2)" 
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={10}
                    domain={[0, 1]}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(v) => formatPercent(v, 0)}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={10}
                    width={80}
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
                    formatter={(value, name, props) => {
                      return [`${formatPercent(value)} (${props.payload.matches} partidas)`, 'Win Rate']
                    }}
                  />
                  <Bar 
                    dataKey="winRate" 
                    name="Win Rate"
                    radius={[0, 6, 6, 0]}
                  >
                    {topByWinRate.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getWinRateFill(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Players Table */}
      <SectionShell 
        title="Tabla de Jugadores" 
        description={`${sortedPlayerStats.length} jugadores • Click en una fila para ver detalles`}
        isSecondary
      >
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto overflow-x-auto scrollbar-visible">
            <SortableTable
              columns={PLAYER_TABLE_COLUMNS}
              rows={sortedPlayerStats}
              sort={tableSort}
              onSort={handleSort}
              onRowClick={handleRowClick}
              renderCell={renderPlayerCell}
              emptyMessage="No hay datos de jugadores"
            />
          </div>
        </div>
      </SectionShell>

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          rows={rows}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}
