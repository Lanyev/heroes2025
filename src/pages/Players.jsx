import { useMemo, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { SectionShell } from '../app/layout/SectionShell'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { SortableTable } from '../components/SortableTable'
import { PlayerDetailsDrawer } from '../components/PlayerDetailsDrawer'
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
 * Column definitions for players table
 */
const PLAYER_TABLE_COLUMNS = [
  { key: 'name', label: 'Jugador', sortable: true, type: 'string' },
  { key: 'matches', label: 'Partidas', sortable: true, type: 'number' },
  { key: 'winRate', label: 'Win Rate', sortable: true, type: 'percent' },
  { key: 'avgKills', label: 'Avg K', sortable: true, type: 'decimal' },
  { key: 'avgDeaths', label: 'Avg D', sortable: true, type: 'decimal' },
  { key: 'avgAssists', label: 'Avg A', sortable: true, type: 'decimal' },
  { key: 'kda', label: 'KDA', sortable: true, type: 'decimal' },
  { key: 'avgDamage', label: 'Avg Daño', sortable: true, type: 'compact' },
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
    return [...playerStats].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      // Handle string sorting
      if (typeof aVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }
      
      // Handle numeric sorting
      return direction === 'asc' ? aVal - bVal : bVal - aVal
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
        <span className="text-white font-medium">{row.name}</span>
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
    
    if (column.key === 'avgDamage') {
      return (
        <span className="text-slate-300">{formatCompact(row.avgDamage)}</span>
      )
    }
    
    return null
  }, [])
  
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
                  radius={[0, 4, 4, 0]}
                >
                  {topByMatches.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getMatchesFill(entry)} />
                  ))}
                </Bar>
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
                  radius={[0, 4, 4, 0]}
                >
                  {topByWinRate.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getWinRateFill(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Players Table */}
      <SectionShell 
        title="Tabla de Jugadores" 
        description={`${sortedPlayerStats.length} jugadores • Click en una fila para ver detalles`}
      >
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
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
      </SectionShell>

      {/* Player Details Drawer */}
      {selectedPlayer && (
        <PlayerDetailsDrawer
          player={selectedPlayer}
          rows={rows}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}
