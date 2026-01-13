import { useMemo, useState, useRef, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { SectionShell } from '../app/layout/SectionShell'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { SearchInput } from '../components/SearchInput'
import { HeroMetricPicker } from '../components/HeroMetricPicker'
import { SortableTable } from '../components/SortableTable'
import { HeroDetailsDrawer } from '../components/HeroDetailsDrawer'
import { ChartExportButton, TableExportButton } from '../components/ChartExportButton'
import { HeroChartTooltip, createTooltipConfig } from '../components/HeroChartTooltip'
import { truncateForChart } from '../components/TruncatedText'
import { 
  getHeroStatsTable, 
  getTopHeroesByMetric, 
  getHeroDetails,
  getTopPlayersByWinrate,
  HERO_METRICS,
  HERO_TABLE_COLUMNS 
} from '../data/heroMetrics'
import { exportTableToCsv } from '../data/exportHelpers'
import { formatPercent } from '../utils/format'

/**
 * Heroes exploration page with full stats table, metric-driven charts, and details drawer
 */
export function Stats({ rows }) {
  // Local state
  const [searchText, setSearchText] = useState('')
  const [minMatches, setMinMatches] = useState(5)
  const [topN, setTopN] = useState(10)
  const [selectedMetric, setSelectedMetric] = useState('matches')
  const [tableSort, setTableSort] = useState({ key: 'matches', direction: 'desc' })
  const [selectedHero, setSelectedHero] = useState(null)
  const [showClassicCharts, setShowClassicCharts] = useState(false)
  
  // Refs for export
  const metricChartRef = useRef(null)
  const winrateChartRef = useRef(null)
  
  // Compute hero stats table once (memoized)
  const heroTable = useMemo(() => {
    return getHeroStatsTable(rows, { lowSampleThreshold: 20 })
  }, [rows])
  
  // Apply search filter
  const searchFilteredTable = useMemo(() => {
    if (!searchText) return heroTable
    const search = searchText.toLowerCase()
    return heroTable.filter(h => h.name.toLowerCase().includes(search))
  }, [heroTable, searchText])
  
  // Apply min matches filter
  const filteredTable = useMemo(() => {
    return searchFilteredTable.filter(h => h.matches >= minMatches)
  }, [searchFilteredTable, minMatches])
  
  // Sort table
  const sortedTable = useMemo(() => {
    const { key, direction } = tableSort
    
    // Get column definition to understand the type
    const columnDef = HERO_TABLE_COLUMNS.find(col => col.key === key)
    const isNumericType = columnDef && ['number', 'decimal', 'percent', 'compact', 'duration'].includes(columnDef.type)
    
    return [...filteredTable].sort((a, b) => {
      let aVal = a[key]
      let bVal = b[key]
      
      // Handle null/undefined values - put them at the end
      const aIsNull = aVal === null || aVal === undefined || aVal === ''
      const bIsNull = bVal === null || bVal === undefined || bVal === ''
      
      if (aIsNull && bIsNull) return 0
      if (aIsNull) return 1
      if (bIsNull) return -1
      
      // Handle string sorting (for name, role, etc.)
      if (!isNumericType && typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }
      
      // For numeric types, ensure we're comparing numbers
      // Convert to numbers if they're not already
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
  }, [filteredTable, tableSort])
  
  // Top heroes by selected metric
  const topByMetric = useMemo(() => {
    const metricConfig = HERO_METRICS.find(m => m.key === selectedMetric)
    const ascending = metricConfig ? !metricConfig.desc : false
    return getTopHeroesByMetric(heroTable, selectedMetric, topN, minMatches, ascending)
  }, [heroTable, selectedMetric, topN, minMatches])
  
  // Top heroes by winrate (Wilson) for classic chart
  const topByWinRate = useMemo(() => {
    return getTopHeroesByMetric(heroTable, 'winRateWilson', topN, Math.max(minMatches, 10), false)
  }, [heroTable, topN, minMatches])

  // Calculate max values for opacity calculation
  const maxMetric = useMemo(() => {
    return topByMetric.length > 0 
      ? Math.max(...topByMetric.map(h => h[selectedMetric] || 0)) 
      : 1
  }, [topByMetric, selectedMetric])

  const maxMatches = useMemo(() => {
    return topByMetric.length > 0 ? Math.max(...topByMetric.map(h => h.matches)) : 1
  }, [topByMetric])

  const maxWinRate = useMemo(() => {
    return topByWinRate.length > 0 ? Math.max(...topByWinRate.map(h => h.winRateWilson)) : 1
  }, [topByWinRate])

  // Function to calculate fill color with opacity based on value
  const getMetricFill = useCallback((entry) => {
    const value = entry[selectedMetric] || 0
    const opacity = Math.max(0.3, value / maxMetric) // Minimum opacity 0.3, max 1.0
    if (selectedMetric.includes('Death')) {
      return `rgba(239, 68, 68, ${opacity})` // #ef4444 with opacity
    }
    return `rgba(99, 102, 241, ${opacity})` // #6366f1 with opacity
  }, [selectedMetric, maxMetric])

  const getMatchesFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.matches / maxMatches) // Minimum opacity 0.3, max 1.0
    return `rgba(99, 102, 241, ${opacity})` // #6366f1 with opacity
  }, [maxMatches])

  const getWinRateFill = useCallback((entry) => {
    const opacity = Math.max(0.3, entry.winRateWilson / maxWinRate) // Minimum opacity 0.3, max 1.0
    return `rgba(16, 185, 129, ${opacity})` // #10b981 with opacity
  }, [maxWinRate])
  
  // Handle sort column click
  const handleSort = useCallback((key) => {
    setTableSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }, [])
  
  // Handle row click - open details drawer
  const handleRowClick = useCallback((row) => {
    const details = getHeroDetails(rows, row.name)
    setSelectedHero(details)
  }, [rows])
  
  // Handle table export
  const handleExportTable = useCallback(() => {
    exportTableToCsv(sortedTable, HERO_TABLE_COLUMNS, 'heroes_stats')
  }, [sortedTable])
  
  // Get metric label for chart title
  const metricLabel = HERO_METRICS.find(m => m.key === selectedMetric)?.label || selectedMetric
  
  // Check if selected metric is a percentage
  const isPercentMetric = ['winRate', 'winRateWilson', 'pickRate'].includes(selectedMetric)
  
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
    <div className="space-y-8 relative z-10">
      {/* Controls Section */}
      <SectionShell title="Análisis de Héroes" isPrimary>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
          <HeroMetricPicker
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
            minMatches={minMatches}
            onMinMatchesChange={setMinMatches}
            topN={topN}
            onTopNChange={setTopN}
          />
          
          <div className="flex items-end gap-3">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="Buscar héroe..."
              className="w-48"
            />
            
            <button
              onClick={() => setShowClassicCharts(!showClassicCharts)}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 focus-ring-accent ${
                showClassicCharts 
                  ? 'bg-indigo-600 text-white shadow-elevated' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:shadow-sm-custom'
              }`}
            >
              {showClassicCharts ? 'Ver Métrica' : 'Ver Clásicos'}
            </button>
          </div>
        </div>
      </SectionShell>

      {/* Charts Section */}
      {showClassicCharts ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top by Picks */}
          <motion.div variants={chartVariants} initial="initial" animate="animate">
            <ChartCard>
              <SectionHeader
                title="Héroes Más Jugados"
                subtitle={`Top ${topN} por cantidad de partidas`}
              />
              <div className="h-96" ref={metricChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topByMetric} layout="vertical">
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
                      width={100}
                      tick={{ fill: '#94a3b8' }}
                      tickFormatter={(v) => truncateForChart(v, 14)}
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
                      content={
                        <HeroChartTooltip 
                          config={{
                            primaryLabel: 'Partidas',
                            showRole: true
                          }}
                        />
                      }
                    />
                    <Bar 
                      dataKey="matches" 
                      radius={[0, 6, 6, 0]}
                    >
                      {topByMetric.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getMatchesFill(entry)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-end mt-2">
                <ChartExportButton chartRef={metricChartRef} filename="heroes_picks" />
              </div>
            </ChartCard>
          </motion.div>

          {/* Top by Win Rate (Wilson) */}
          <motion.div variants={chartVariants} initial="initial" animate="animate">
            <ChartCard>
              <SectionHeader
                title="Héroes con Mayor Win Rate"
                subtitle={`Top ${topN} por Wilson Score (mín. ${Math.max(minMatches, 10)} partidas)`}
              />
              <div className="h-96" ref={winrateChartRef}>
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
                      width={100}
                      tick={{ fill: '#94a3b8' }}
                      tickFormatter={(v) => truncateForChart(v, 14)}
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
                      content={
                        <HeroChartTooltip 
                          config={{
                            primaryLabel: 'Win Rate Wilson',
                            showRole: true,
                            showWinRate: false
                          }}
                        />
                      }
                    />
                    <ReferenceLine x={0.5} stroke="#f59e0b" strokeDasharray="5 5" />
                    <Bar 
                      dataKey="winRateWilson" 
                      radius={[0, 6, 6, 0]}
                    >
                      {topByWinRate.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getWinRateFill(entry)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-end mt-2">
                <ChartExportButton chartRef={winrateChartRef} filename="heroes_winrate" />
              </div>
            </ChartCard>
          </motion.div>
        </div>
      ) : (
        /* Metric-driven Chart */
        <motion.div variants={chartVariants} initial="initial" animate="animate">
          <ChartCard>
            <SectionHeader
              title={`Top Héroes por ${metricLabel}`}
              subtitle={`Top ${topN} con mínimo ${minMatches} partidas`}
            />
            <div className="h-96" ref={metricChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByMetric} layout="vertical">
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
                    domain={isPercentMetric ? [0, 1] : undefined}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={isPercentMetric ? (v) => formatPercent(v, 0) : undefined}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={11}
                    width={100}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(v) => truncateForChart(v, 14)}
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
                    content={
                      <HeroChartTooltip 
                        config={createTooltipConfig(selectedMetric, metricLabel)}
                      />
                    }
                  />
                  {isPercentMetric && (
                    <ReferenceLine x={0.5} stroke="#f59e0b" strokeDasharray="5 5" />
                  )}
                  <Bar 
                    dataKey={selectedMetric}
                    radius={[0, 6, 6, 0]}
                  >
                    {topByMetric.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getMetricFill(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-end mt-2">
              <ChartExportButton chartRef={metricChartRef} filename={`heroes_${selectedMetric}`} />
            </div>
          </ChartCard>
        </motion.div>
      )}

      {/* Full Stats Table */}
      <SectionShell 
        title="Tabla Completa de Héroes" 
        description={`${sortedTable.length} héroes • Click en una fila para ver detalles`}
        isSecondary
      >
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-layer-light/20">
            <span className="text-slate-400 text-sm">
              Mostrando {sortedTable.length} de {heroTable.length} héroes
            </span>
            <TableExportButton onExport={handleExportTable} />
          </div>
          
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto scrollbar-visible">
            <SortableTable
              columns={HERO_TABLE_COLUMNS}
              rows={sortedTable}
              sort={tableSort}
              onSort={handleSort}
              onRowClick={handleRowClick}
              showHeroAvatar={true}
              emptyMessage="No hay héroes que coincidan con los filtros"
              allRows={rows}
              getTopPlayersForHero={getTopPlayersByWinrate}
            />
          </div>
        </div>
      </SectionShell>

      {/* Hero Details Drawer */}
      {selectedHero && (
        <HeroDetailsDrawer
          hero={selectedHero}
          rows={rows}
          onClose={() => setSelectedHero(null)}
        />
      )}
    </div>
  )
}
