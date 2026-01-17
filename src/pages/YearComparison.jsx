import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { EmptyState } from '../components/EmptyState'
import { SectionShell } from '../app/layout/SectionShell'
import { SectionHeader } from '../components/SectionHeader'
import { ChartCard } from '../components/ChartCard'
import { YearSelector } from '../components/YearSelector'
import { ComparisonKpiCard } from '../components/ComparisonKpiCard'
import { Badge } from '../components/Badge'
import { HeroAvatar } from '../components/HeroAvatar'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { Select } from '../components/Select'
import {
  getAvailableYears,
  calculateMultipleYearMetrics,
  compareHeroesAcrossYears,
  comparePlayersAcrossYears,
  getTopChanges,
  getEvolutionData,
  getYearColor
} from '../data/yearComparison'
import { formatNumber, formatPercent, formatDuration, formatCompact } from '../utils/format'

/**
 * Year Comparison page - Compare statistics across multiple years
 * Only shows data for Geekos players (listed players)
 */
export function YearComparison({ allRows, meta, listedPlayers }) {
  const shouldReduceMotion = useReducedMotion()
  const [isCalculating, setIsCalculating] = useState(false)
  
  // Debug: Log initial props - ALWAYS log this
  useEffect(() => {
    if (allRows && allRows.length > 0) {
      const uniquePlayerNames = [...new Set(allRows.slice(0, 100).map(r => r.playerName).filter(Boolean))]
      console.log('🔍 YearComparison DEBUG:', {
        allRowsCount: allRows.length,
        listedPlayersCount: listedPlayers?.size || 0,
        listedPlayers: listedPlayers ? Array.from(listedPlayers).sort() : 'NULL',
        samplePlayerNamesInData: uniquePlayerNames.slice(0, 15).sort(),
        firstRow: allRows[0] ? {
          playerName: allRows[0].playerName,
          date: allRows[0].dateObj?.getFullYear()
        } : null
      })
    }
  }, [allRows, listedPlayers])
  
  // Filter rows to only include Geekos players (always, no toggle)
  // Note: player names are normalized in normalizeRow.js (Swift -> WatchdogMan)
  // The listedPlayers set should contain the normalized names
  const geekosRows = useMemo(() => {
    if (!allRows || allRows.length === 0) {
      console.warn('YearComparison: No allRows provided')
      return []
    }
    
    // Always filter by Geekos players
    if (!listedPlayers || listedPlayers.size === 0) {
      console.warn('YearComparison: No listedPlayers provided')
      return []
    }
    
    // Since names are normalized, we just check if the normalized name is in the list
    const filtered = allRows.filter(row => {
      if (!row.playerName) return false
      return listedPlayers.has(row.playerName)
    })
    
    // Debug logging - ALWAYS log when filtering
    const uniquePlayerNames = [...new Set(allRows.map(r => r.playerName).filter(Boolean))]
    const matchingNames = uniquePlayerNames.filter(name => listedPlayers.has(name))
    
    if (filtered.length === 0 && allRows.length > 0) {
      console.error('❌ YearComparison: No Geekos matches found!', {
        totalRows: allRows.length,
        filteredRows: filtered.length,
        listedPlayersCount: listedPlayers.size,
        listedPlayers: Array.from(listedPlayers).sort(),
        uniquePlayerNamesInData: uniquePlayerNames.sort().slice(0, 30),
        matchingNames,
        nonMatchingNames: uniquePlayerNames.filter(name => !listedPlayers.has(name)).slice(0, 20),
        '🔍 COMPARISON': {
          'In listedPlayers but NOT in data': Array.from(listedPlayers).filter(name => !uniquePlayerNames.includes(name)),
          'In data but NOT in listedPlayers': uniquePlayerNames.filter(name => !listedPlayers.has(name)).slice(0, 10)
        },
        firstFewRows: allRows.slice(0, 5).map(r => ({ 
          playerName: r.playerName, 
          date: r.dateObj?.getFullYear()
        }))
      })
    } else if (filtered.length > 0) {
      const uniqueGeekoNames = [...new Set(filtered.map(r => r.playerName).filter(Boolean))]
      console.log('YearComparison: Geekos filter working', {
        totalRows: allRows.length,
        filteredRows: filtered.length,
        uniqueGeekoNames: uniqueGeekoNames.sort(),
        listedPlayers: Array.from(listedPlayers).sort()
      })
    }
    
    return filtered
  }, [allRows, listedPlayers])
  
  // Get available years from all data (not filtered)
  const availableYears = useMemo(() => {
    if (!allRows || allRows.length === 0) return []
    return getAvailableYears(allRows)
  }, [allRows])
  
  // State for pending years (what user selects)
  const [pendingYears, setPendingYears] = useState([])
  
  // State for applied years (what's actually being calculated)
  const [appliedYears, setAppliedYears] = useState([])
  
  // Update pendingYears when availableYears changes (initialize with 2 most recent)
  useEffect(() => {
    if (availableYears.length > 0 && pendingYears.length === 0) {
      const initial = availableYears.slice(0, Math.min(2, availableYears.length))
      setPendingYears(initial)
      setAppliedYears(initial) // Auto-apply on initial load
    }
  }, [availableYears])
  
  // Handler to apply selected years
  const handleApplyYears = useCallback(() => {
    if (pendingYears.length < 2) return
    
    setIsCalculating(true)
    // Use requestAnimationFrame and setTimeout to allow UI to update before heavy calculation
    requestAnimationFrame(() => {
      setTimeout(() => {
        setAppliedYears([...pendingYears])
        // Keep loading a bit longer to show the progress
        setTimeout(() => {
          setIsCalculating(false)
        }, 300)
      }, 50)
    })
  }, [pendingYears])
  
  // State for evolution metric selector
  const [evolutionMetric, setEvolutionMetric] = useState('winRate')
  const [heroMetric, setHeroMetric] = useState('matches')
  const [playerMetric, setPlayerMetric] = useState('matches')
  
  // Calculate metrics for applied years (using Geekos data only)
  const yearMetrics = useMemo(() => {
    if (appliedYears.length < 2) return {}
    
    const metrics = calculateMultipleYearMetrics(geekosRows, appliedYears)
    
    // Debug: Check if metrics are being calculated
    console.log('YearComparison: Metrics calculated', {
      appliedYears,
      geekosRowsCount: geekosRows.length,
      metricsByYear: Object.keys(metrics).map(year => ({
        year,
        totalMatches: metrics[year]?.totalMatches || 0,
        winRate: metrics[year]?.winRate || 0
      })),
      sampleRowsForYears: appliedYears.map(year => {
        const yearRows = geekosRows.filter(r => r.dateObj?.getFullYear() === year)
        return { year, count: yearRows.length, samplePlayers: [...new Set(yearRows.slice(0, 10).map(r => r.playerName))] }
      })
    })
    
    return metrics
  }, [geekosRows, appliedYears])
  
  // Prepare KPI data
  const kpiData = useMemo(() => {
    const data = {
      totalMatches: {},
      winRate: {},
      avgGameTimeSeconds: {},
      avgTakedowns: {},
      avgHeroDamage: {},
      avgDeaths: {}
    }
    
    for (const year of appliedYears) {
      const metrics = yearMetrics[year]
      if (metrics) {
        data.totalMatches[year] = metrics.totalMatches
        data.winRate[year] = metrics.winRate
        data.avgGameTimeSeconds[year] = metrics.avgGameTimeSeconds
        data.avgTakedowns[year] = metrics.avgTakedowns
        data.avgHeroDamage[year] = metrics.avgHeroDamage
        data.avgDeaths[year] = metrics.avgDeaths
      }
    }
    
    return data
  }, [yearMetrics, appliedYears])
  
  // Get evolution data (using Geekos data only)
  const evolutionData = useMemo(() => {
    if (appliedYears.length < 2) return []
    return getEvolutionData(geekosRows, appliedYears, evolutionMetric)
  }, [geekosRows, appliedYears, evolutionMetric])
  
  // Compare heroes (using Geekos data only)
  const heroComparison = useMemo(() => {
    if (appliedYears.length < 2) return []
    return compareHeroesAcrossYears(geekosRows, appliedYears)
  }, [geekosRows, appliedYears])
  
  // Compare players (using Geekos data only)
  const playerComparison = useMemo(() => {
    if (appliedYears.length < 2) return []
    return comparePlayersAcrossYears(geekosRows, appliedYears)
  }, [geekosRows, appliedYears])
  
  // Get top heroes for bar chart (based on most recent year or average)
  const topHeroesForChart = useMemo(() => {
    if (heroComparison.length === 0) return []
    
    // Get top heroes by total matches across all years
    const heroesWithTotal = heroComparison.map(hero => {
      const totalMatches = appliedYears.reduce((sum, year) => {
        return sum + (hero.years[year]?.matches || 0)
      }, 0)
      return { ...hero, totalMatches }
    })
    
    return heroesWithTotal
      .sort((a, b) => b.totalMatches - a.totalMatches)
      .slice(0, 15)
  }, [heroComparison, appliedYears])
  
  // Prepare hero chart data
  const heroChartData = useMemo(() => {
    return topHeroesForChart.map(hero => {
      const entry = { name: hero.name }
      for (const year of appliedYears) {
        const value = hero.years[year]?.[heroMetric] || 0
        entry[year] = value
      }
      return entry
    })
  }, [topHeroesForChart, appliedYears, heroMetric])
  
  // Get top players for bar chart
  const topPlayersForChart = useMemo(() => {
    if (playerComparison.length === 0) return []
    
    const playersWithTotal = playerComparison.map(player => {
      const totalMatches = appliedYears.reduce((sum, year) => {
        return sum + (player.years[year]?.matches || 0)
      }, 0)
      return { ...player, totalMatches }
    })
    
    return playersWithTotal
      .sort((a, b) => b.totalMatches - a.totalMatches)
      .slice(0, 10)
  }, [playerComparison, appliedYears])
  
  // Prepare player chart data
  const playerChartData = useMemo(() => {
    return topPlayersForChart.map(player => {
      const entry = { name: player.name }
      for (const year of appliedYears) {
        const value = player.years[year]?.[playerMetric] || 0
        entry[year] = value
      }
      return entry
    })
  }, [topPlayersForChart, appliedYears, playerMetric])
  
  // Get top changes
  const topHeroAscending = useMemo(() => {
    return getTopChanges(heroComparison, 'matches', 10, 'asc')
  }, [heroComparison])
  
  const topHeroDescending = useMemo(() => {
    return getTopChanges(heroComparison, 'matches', 10, 'desc')
  }, [heroComparison])
  
  const topPlayerAscending = useMemo(() => {
    return getTopChanges(playerComparison, 'winRate', 10, 'asc')
  }, [playerComparison])
  
  const topPlayerDescending = useMemo(() => {
    return getTopChanges(playerComparison, 'winRate', 10, 'desc')
  }, [playerComparison])
  
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
  
  // Early returns for error states
  if (!allRows || allRows.length === 0) {
    return <EmptyState />
  }
  
  // Show warning if no Geekos data but we have listed players
  if (geekosRows.length === 0 && listedPlayers && listedPlayers.size > 0) {
    // Get sample player names for debugging
    const samplePlayers = Array.from(listedPlayers).slice(0, 5)
    const sampleRowPlayers = allRows.slice(0, 20).map(r => r.playerName).filter(Boolean)
    const uniqueRowPlayers = [...new Set(sampleRowPlayers)].slice(0, 10)
    
    return (
      <div className="space-y-8 relative z-10">
        <SectionShell title="Comparación de Años" isPrimary>
          <div className="mb-6">
            <YearSelector
              availableYears={availableYears}
              selectedYears={pendingYears}
              onYearsChange={setPendingYears}
            />
          </div>
        </SectionShell>
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-slate-300 text-lg font-medium mb-2">
            No hay datos de jugadores Geekos disponibles
          </p>
          <p className="text-slate-500 text-sm mb-4">
            Verifica que el archivo players.json contenga los nombres correctos
          </p>
          <div className="text-left max-w-2xl mx-auto bg-slate-900/50 rounded-lg p-4 text-xs">
            <p className="text-slate-400 mb-2">Debug info:</p>
            <p className="text-slate-500">Total filas: {allRows.length}</p>
            <p className="text-slate-500">Jugadores en lista: {listedPlayers.size}</p>
            <p className="text-slate-500">Ejemplos de lista: {samplePlayers.join(', ')}</p>
            <p className="text-slate-500">Ejemplos en datos: {uniqueRowPlayers.join(', ')}</p>
          </div>
        </div>
      </div>
    )
  }
  
  const canCompare = appliedYears.length >= 2
  
  // Evolution metric options
  const evolutionMetricOptions = [
    { value: 'winRate', label: 'Win Rate' },
    { value: 'totalMatches', label: 'Partidas Totales' },
    { value: 'avgGameTimeSeconds', label: 'Duración Promedio' },
    { value: 'avgTakedowns', label: 'Avg Takedowns' }
  ]
  
  // Hero metric options
  const heroMetricOptions = [
    { value: 'matches', label: 'Picks' },
    { value: 'winRate', label: 'Win Rate' },
    { value: 'kda', label: 'KDA' }
  ]
  
  // Player metric options
  const playerMetricOptions = [
    { value: 'matches', label: 'Partidas' },
    { value: 'winRate', label: 'Win Rate' },
    { value: 'kda', label: 'KDA' }
  ]
  
  return (
    <div className="space-y-8 relative z-10">
      {/* Loading Overlay */}
      {isCalculating && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-md mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
              </div>
              <div className="text-center">
                <h3 className="text-white font-semibold text-lg mb-2">Calculando comparación...</h3>
                <p className="text-slate-400 text-sm">
                  Procesando datos de {appliedYears.length} {appliedYears.length === 1 ? 'año' : 'años'}
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  Esto puede tardar unos segundos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Year Selector - Always show */}
      <SectionShell title="Comparación de Años" isPrimary>
        <div className="mb-6">
          <YearSelector
            availableYears={availableYears}
            selectedYears={pendingYears}
            onYearsChange={setPendingYears}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="text-slate-500 text-xs">
              {pendingYears.length} {pendingYears.length === 1 ? 'año' : 'años'} seleccionado{pendingYears.length !== 1 ? 's' : ''}
              {pendingYears.length >= 2 && pendingYears.join(',') !== appliedYears.join(',') && (
                <span className="ml-2 text-amber-400">• Cambios pendientes</span>
              )}
            </div>
            <button
              onClick={handleApplyYears}
              disabled={pendingYears.length < 2 || isCalculating || pendingYears.join(',') === appliedYears.join(',')}
              className={`
                px-6 py-2.5 rounded-lg font-semibold text-sm
                transition-all duration-200 focus-ring-accent
                ${pendingYears.length >= 2 && pendingYears.join(',') !== appliedYears.join(',') && !isCalculating
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-elevated'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              {isCalculating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Calculando...
                </span>
              ) : (
                'Aplicar Comparación'
              )}
            </button>
          </div>
          {/* Info */}
          <div className="mt-4 text-xs text-slate-500 bg-slate-900/50 rounded p-2">
            Jugadores Geekos: {listedPlayers?.size || 0} | 
            Partidas Geekos: {geekosRows.length} | 
            Años disponibles: {availableYears.join(', ')}
          </div>
        </div>
      </SectionShell>
      
      {availableYears.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-slate-300 text-lg font-medium mb-2">
            No se encontraron años en los datos
          </p>
          <p className="text-slate-500 text-sm">
            Verifica que el CSV tenga fechas válidas en el campo FileName o Year
          </p>
        </div>
      ) : !canCompare ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-slate-300 text-lg font-medium mb-2">
            Selecciona al menos 2 años para comenzar la comparación
          </p>
          <p className="text-slate-500 text-sm">
            Haz clic en los botones de años arriba para seleccionarlos
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Años disponibles: {availableYears.join(', ')}
          </p>
        </div>
      ) : (
        <>
          {/* KPIs Comparativos */}
          <SectionShell title="Métricas Comparativas" isPrimary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ComparisonKpiCard
                title="Total Partidas"
                icon="🎮"
                yearsData={kpiData.totalMatches}
                format="number"
              />
              <ComparisonKpiCard
                title="Win Rate"
                icon="🏆"
                yearsData={kpiData.winRate}
                format="percent"
              />
              <ComparisonKpiCard
                title="Duración Promedio"
                icon="⏳"
                yearsData={kpiData.avgGameTimeSeconds}
                format="duration"
              />
              <ComparisonKpiCard
                title="Avg Takedowns"
                icon="🎯"
                yearsData={kpiData.avgTakedowns}
                format="number"
              />
              <ComparisonKpiCard
                title="Avg Daño Héroe"
                icon="⚔️"
                yearsData={kpiData.avgHeroDamage}
                format="compact"
              />
              <ComparisonKpiCard
                title="Avg Muertes"
                icon="💀"
                yearsData={kpiData.avgDeaths}
                format="number"
              />
            </div>
          </SectionShell>
          
          {/* Evolution Chart */}
          <SectionShell title="Evolución Temporal" isSecondary>
            <ChartCard>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                <SectionHeader
                  title="Evolución de Métricas"
                  subtitle="Comparación temporal entre años seleccionados"
                />
                <Select
                  value={evolutionMetric}
                  onChange={setEvolutionMetric}
                  options={evolutionMetricOptions}
                  className="min-w-[180px]"
                />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
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
                      tickFormatter={
                        evolutionMetric === 'winRate'
                          ? (v) => formatPercent(v, 0)
                          : evolutionMetric === 'avgGameTimeSeconds'
                          ? (v) => formatDuration(v)
                          : undefined
                      }
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
                      formatter={(value, name) => {
                        if (evolutionMetric === 'winRate') {
                          return [formatPercent(value), name]
                        } else if (evolutionMetric === 'avgGameTimeSeconds') {
                          return [formatDuration(value), name]
                        }
                        return [formatNumber(value), name]
                      }}
                    />
                    <Legend />
                    {appliedYears.map((year) => {
                      const color = getYearColor(year)
                      return (
                        <Line
                          key={year}
                          type="monotone"
                          dataKey={year}
                          name={String(year)}
                          stroke={color}
                          strokeWidth={2.5}
                          dot={{ fill: color, strokeWidth: 2, r: 3.5 }}
                          activeDot={{ r: 5, fill: color }}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </SectionShell>
          
          {/* Hero Comparison Chart */}
          <SectionShell title="Comparación de Héroes" isSecondary>
            <ChartCard>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                <SectionHeader
                  title="Top Héroes por Año"
                  subtitle={`Top 15 héroes más jugados`}
                />
                <Select
                  value={heroMetric}
                  onChange={setHeroMetric}
                  options={heroMetricOptions}
                  className="min-w-[140px]"
                />
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heroChartData} layout="vertical">
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
                      tickFormatter={
                        heroMetric === 'winRate'
                          ? (v) => formatPercent(v, 0)
                          : undefined
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      fontSize={11}
                      width={120}
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
                    />
                    <Legend />
                    {appliedYears.map((year) => {
                      const color = getYearColor(year)
                      return (
                        <Bar
                          key={year}
                          dataKey={year}
                          name={String(year)}
                          fill={color}
                          radius={[0, 6, 6, 0]}
                        />
                      )
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </SectionShell>
          
          {/* Player Comparison Chart */}
          <SectionShell title="Comparación de Jugadores" isSecondary>
            <ChartCard>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                <SectionHeader
                  title="Top Jugadores por Año"
                  subtitle={`Top 10 jugadores más activos`}
                />
                <Select
                  value={playerMetric}
                  onChange={setPlayerMetric}
                  options={playerMetricOptions}
                  className="min-w-[140px]"
                />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={playerChartData} layout="vertical">
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
                      tickFormatter={
                        playerMetric === 'winRate'
                          ? (v) => formatPercent(v, 0)
                          : undefined
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      fontSize={11}
                      width={120}
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
                    />
                    <Legend />
                    {appliedYears.map((year) => {
                      const color = getYearColor(year)
                      return (
                        <Bar
                          key={year}
                          dataKey={year}
                          name={String(year)}
                          fill={color}
                          radius={[0, 6, 6, 0]}
                        />
                      )
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </SectionShell>
          
          {/* Top Changes / Trends */}
          <SectionShell title="Tendencias y Cambios Significativos" isPrimary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Heroes Ascending */}
              <ChartCard>
                <SectionHeader
                  title="🔥 Héroes en Ascenso"
                  subtitle="Mayor crecimiento en picks"
                />
                <div className="space-y-3">
                  {topHeroAscending.length === 0 ? (
                    <p className="text-slate-400 text-sm">No hay datos suficientes</p>
                  ) : (
                    topHeroAscending.map((hero, idx) => {
                      const sortedYears = appliedYears.sort((a, b) => a - b)
                      const firstYear = sortedYears[0]
                      const lastYear = sortedYears[sortedYears.length - 1]
                      const firstMatches = hero.years[firstYear]?.matches || 0
                      const lastMatches = hero.years[lastYear]?.matches || 0
                      const change = hero.change?.matches
                      
                      return (
                        <div
                          key={hero.name}
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                          <HeroAvatar name={hero.name} role={hero.role} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-sm truncate">
                              {hero.name}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {firstYear}: {firstMatches} → {lastYear}: {lastMatches}
                              {change && (
                                <span className="text-emerald-400 ml-1">
                                  ({change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ChartCard>
              
              {/* Heroes Descending */}
              <ChartCard>
                <SectionHeader
                  title="📉 Héroes en Descenso"
                  subtitle="Mayor disminución en picks"
                />
                <div className="space-y-3">
                  {topHeroDescending.length === 0 ? (
                    <p className="text-slate-400 text-sm">No hay datos suficientes</p>
                  ) : (
                    topHeroDescending.map((hero) => {
                      const sortedYears = appliedYears.sort((a, b) => a - b)
                      const firstYear = sortedYears[0]
                      const lastYear = sortedYears[sortedYears.length - 1]
                      const firstMatches = hero.years[firstYear]?.matches || 0
                      const lastMatches = hero.years[lastYear]?.matches || 0
                      const change = hero.change?.matches
                      
                      return (
                        <div
                          key={hero.name}
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                          <HeroAvatar name={hero.name} role={hero.role} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-sm truncate">
                              {hero.name}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {firstYear}: {firstMatches} → {lastYear}: {lastMatches}
                              {change && (
                                <span className="text-red-400 ml-1">
                                  ({change.percentage.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ChartCard>
              
              {/* Players Ascending */}
              <ChartCard>
                <SectionHeader
                  title="⭐ Jugadores con Mayor Mejora"
                  subtitle="Mejor progreso en win rate"
                />
                <div className="space-y-3">
                  {topPlayerAscending.length === 0 ? (
                    <p className="text-slate-400 text-sm">No hay datos suficientes</p>
                  ) : (
                    topPlayerAscending.map((player) => {
                      const sortedYears = appliedYears.sort((a, b) => a - b)
                      const firstYear = sortedYears[0]
                      const lastYear = sortedYears[sortedYears.length - 1]
                      const firstWR = player.years[firstYear]?.winRate || 0
                      const lastWR = player.years[lastYear]?.winRate || 0
                      const change = player.change?.winRate
                      
                      return (
                        <div
                          key={player.name}
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                          <PlayerAvatarWithName name={player.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-400 text-xs">
                              {firstYear}: {formatPercent(firstWR)} → {lastYear}: {formatPercent(lastWR)}
                              {change && (
                                <span className="text-emerald-400 ml-1">
                                  ({change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}pp)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ChartCard>
              
              {/* Players Descending */}
              <ChartCard>
                <SectionHeader
                  title="📊 Jugadores con Mayor Regresión"
                  subtitle="Mayor empeoramiento en win rate"
                />
                <div className="space-y-3">
                  {topPlayerDescending.length === 0 ? (
                    <p className="text-slate-400 text-sm">No hay datos suficientes</p>
                  ) : (
                    topPlayerDescending.map((player) => {
                      const sortedYears = appliedYears.sort((a, b) => a - b)
                      const firstYear = sortedYears[0]
                      const lastYear = sortedYears[sortedYears.length - 1]
                      const firstWR = player.years[firstYear]?.winRate || 0
                      const lastWR = player.years[lastYear]?.winRate || 0
                      const change = player.change?.winRate
                      
                      return (
                        <div
                          key={player.name}
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                          <PlayerAvatarWithName name={player.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-400 text-xs">
                              {firstYear}: {formatPercent(firstWR)} → {lastYear}: {formatPercent(lastWR)}
                              {change && (
                                <span className="text-red-400 ml-1">
                                  ({change.percentage.toFixed(1)}pp)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ChartCard>
            </div>
          </SectionShell>
        </>
      )}
    </div>
  )
}
