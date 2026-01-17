import { useMemo, useState, useCallback, useEffect } from 'react'
import { EmptyState } from '../components/EmptyState'
import { SectionShell } from '../app/layout/SectionShell'
import { Badge } from '../components/Badge'
import { Select } from '../components/Select'
import { YearSelector } from '../components/YearSelector'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { getAvailableYears, filterRowsByYear, getYearColor } from '../data/yearComparison'
import { formatNumber, formatPercent, formatDuration, formatCompact, formatDecimal } from '../utils/format'

const DEBUG = false

/**
 * Calculate confidence badge based on number of matches
 */
function getConfidenceBadge(matches) {
  if (matches >= 30) return { label: 'Alta', variant: 'success' }
  if (matches >= 15) return { label: 'Media', variant: 'warning' }
  return { label: 'Baja', variant: 'danger' }
}

/**
 * Calculate overview metrics for a player in a specific year
 */
function calculatePlayerYearOverview(rows) {
  if (!rows || rows.length === 0) {
    return {
      matches: 0,
      wins: 0,
      winRate: 0,
      avgHeroKills: 0,
      avgAssists: 0,
      avgTakedowns: 0,
      avgDeaths: 0,
      avgHeroDamage: 0,
      avgSiegeDamage: 0,
      avgDamageTaken: 0,
      avgHealingShielding: 0,
      avgSelfHealing: 0,
      avgExperience: 0,
      avgSpentDeadSeconds: 0,
      avgOnFire: 0,
      avgMercCampCaptures: 0,
      avgRegenGlobes: 0,
      avgGameTimeSeconds: 0
    }
  }

  const wins = rows.filter(r => r.winner).length
  const totalMatches = rows.length

  const sums = rows.reduce((acc, row) => ({
    heroKills: acc.heroKills + (row.heroKills || 0),
    assists: acc.assists + (row.assists || 0),
    takedowns: acc.takedowns + (row.takedowns || 0),
    deaths: acc.deaths + (row.deaths || 0),
    heroDamage: acc.heroDamage + (row.heroDamage || 0),
    siegeDamage: acc.siegeDamage + (row.siegeDamage || 0),
    damageTaken: acc.damageTaken + (row.damageTaken || 0),
    healingShielding: acc.healingShielding + (row.healingShielding || 0),
    selfHealing: acc.selfHealing + (row.selfHealing || 0),
    experience: acc.experience + (row.experience || 0),
    spentDeadSeconds: acc.spentDeadSeconds + (row.spentDeadSeconds || 0),
    onFire: acc.onFire + (row.onFire || 0),
    mercCampCaptures: acc.mercCampCaptures + (row.mercCampCaptures || 0),
    regenGlobes: acc.regenGlobes + (row.regenGlobes || 0),
    gameTimeSeconds: acc.gameTimeSeconds + (row.gameTimeSeconds || 0)
  }), {
    heroKills: 0, assists: 0, takedowns: 0, deaths: 0,
    heroDamage: 0, siegeDamage: 0, damageTaken: 0,
    healingShielding: 0, selfHealing: 0, experience: 0,
    spentDeadSeconds: 0, onFire: 0, mercCampCaptures: 0,
    regenGlobes: 0, gameTimeSeconds: 0
  })

  return {
    matches: totalMatches,
    wins,
    winRate: totalMatches > 0 ? wins / totalMatches : 0,
    avgHeroKills: totalMatches > 0 ? sums.heroKills / totalMatches : 0,
    avgAssists: totalMatches > 0 ? sums.assists / totalMatches : 0,
    avgTakedowns: totalMatches > 0 ? sums.takedowns / totalMatches : 0,
    avgDeaths: totalMatches > 0 ? sums.deaths / totalMatches : 0,
    avgHeroDamage: totalMatches > 0 ? sums.heroDamage / totalMatches : 0,
    avgSiegeDamage: totalMatches > 0 ? sums.siegeDamage / totalMatches : 0,
    avgDamageTaken: totalMatches > 0 ? sums.damageTaken / totalMatches : 0,
    avgHealingShielding: totalMatches > 0 ? sums.healingShielding / totalMatches : 0,
    avgSelfHealing: totalMatches > 0 ? sums.selfHealing / totalMatches : 0,
    avgExperience: totalMatches > 0 ? sums.experience / totalMatches : 0,
    avgSpentDeadSeconds: totalMatches > 0 ? sums.spentDeadSeconds / totalMatches : 0,
    avgOnFire: totalMatches > 0 ? sums.onFire / totalMatches : 0,
    avgMercCampCaptures: totalMatches > 0 ? sums.mercCampCaptures / totalMatches : 0,
    avgRegenGlobes: totalMatches > 0 ? sums.regenGlobes / totalMatches : 0,
    avgGameTimeSeconds: totalMatches > 0 ? sums.gameTimeSeconds / totalMatches : 0
  }
}

/**
 * Find record (max) for a metric with full context
 */
function findRecord(rows, metricKey, metricLabel) {
  if (!rows || rows.length === 0) return null

  let maxValue = -Infinity
  let recordRow = null

  for (const row of rows) {
    const value = row[metricKey]
    if (value != null && value > maxValue) {
      maxValue = value
      recordRow = row
    }
  }

  if (!recordRow || maxValue === -Infinity) return null

  const gameTimeMinutes = recordRow.gameTimeSeconds ? recordRow.gameTimeSeconds / 60 : 0
  const perMinute = gameTimeMinutes > 0 ? maxValue / gameTimeMinutes : 0

  return {
    value: maxValue,
    perMinute,
    label: metricLabel,
    context: {
      heroName: recordRow.heroName || 'N/A',
      map: recordRow.map || 'N/A',
      gameMode: recordRow.gameMode || 'N/A',
      gameTime: recordRow.gameTimeSeconds || 0,
      date: recordRow.dateISO || recordRow.dateObj?.toISOString()?.split('T')[0] || 'N/A',
      winner: recordRow.winner !== undefined ? (recordRow.winner ? 'Win' : 'Loss') : 'N/A',
      team: recordRow.team || 'N/A'
    }
  }
}

/**
 * Calculate all records for a player in a year
 */
function calculatePlayerYearRecords(rows) {
  if (!rows || rows.length === 0) return []

  const recordMetrics = [
    { key: 'heroKills', label: 'Kills' },
    { key: 'assists', label: 'Assists' },
    { key: 'takedowns', label: 'Takedowns' },
    { key: 'heroDamage', label: 'Hero Damage' },
    { key: 'siegeDamage', label: 'Siege Damage' },
    { key: 'damageTaken', label: 'Damage Taken' },
    { key: 'healingShielding', label: 'Healing/Shielding' },
    { key: 'selfHealing', label: 'Self Healing' },
    { key: 'experience', label: 'Experience' },
    { key: 'onFire', label: 'Time On Fire' },
    { key: 'mercCampCaptures', label: 'Merc Camp Captures' },
    { key: 'regenGlobes', label: 'Regen Globes' }
  ]

  const records = []
  for (const metric of recordMetrics) {
    const record = findRecord(rows, metric.key, metric.label)
    if (record && record.value > 0) {
      records.push(record)
    }
  }

  return records
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray, p) {
  if (!sortedArray || sortedArray.length === 0) return 0
  const index = Math.ceil((p / 100) * sortedArray.length) - 1
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
}

/**
 * Calculate median
 */
function median(sortedArray) {
  return percentile(sortedArray, 50)
}

/**
 * Calculate interquartile range (IQR)
 */
function iqr(sortedArray) {
  const q1 = percentile(sortedArray, 25)
  const q3 = percentile(sortedArray, 75)
  return q3 - q1
}

/**
 * Calculate consistency metrics for a player in a year
 */
function calculatePlayerYearConsistency(rows) {
  if (!rows || rows.length === 0) return {}

  const metrics = [
    { key: 'heroDamage', label: 'Hero Damage' },
    { key: 'takedowns', label: 'Takedowns' },
    { key: 'deaths', label: 'Deaths' },
    { key: 'healingShielding', label: 'Healing/Shielding' },
    { key: 'siegeDamage', label: 'Siege Damage' }
  ]

  const consistency = {}

  for (const metric of metrics) {
    const values = rows
      .map(r => r[metric.key])
      .filter(v => v != null && !isNaN(v))
      .sort((a, b) => a - b)

    if (values.length === 0) {
      consistency[metric.key] = {
        label: metric.label,
        median: 0,
        p90: 0,
        iqr: 0,
        hasData: false
      }
      continue
    }

    const med = median(values)
    const p90 = percentile(values, 90)
    const iqrValue = iqr(values)

    consistency[metric.key] = {
      label: metric.label,
      median: med,
      p90,
      iqr: iqrValue,
      hasData: true
    }
  }

  return consistency
}

/**
 * Year Comparison page - Compare a single Geeko across multiple seasons
 */
export function YearComparison({ allRows, meta, listedPlayers }) {
  // Filter rows to only include Geekos players
  const geekosRows = useMemo(() => {
    if (!allRows || allRows.length === 0 || !listedPlayers || listedPlayers.size === 0) {
      return []
    }
    return allRows.filter(row => row.playerName && listedPlayers.has(row.playerName))
  }, [allRows, listedPlayers])

  // Get available years
  const availableYears = useMemo(() => {
    if (!allRows || allRows.length === 0) return []
    return getAvailableYears(allRows)
  }, [allRows])

  // Get list of Geeko players
  const geekoPlayers = useMemo(() => {
    if (!listedPlayers || listedPlayers.size === 0) return []
    return Array.from(listedPlayers).sort()
  }, [listedPlayers])

  // State
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedYears, setSelectedYears] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  // Initialize with first player and two most recent years
  useEffect(() => {
    if (geekoPlayers.length > 0 && !selectedPlayer) {
      setSelectedPlayer(geekoPlayers[0])
    }
    if (availableYears.length >= 2 && selectedYears.length === 0) {
      setSelectedYears([availableYears[0], availableYears[1]])
    } else if (availableYears.length === 1 && selectedYears.length === 0) {
      setSelectedYears([availableYears[0]])
    }
  }, [geekoPlayers, availableYears, selectedPlayer, selectedYears.length])

  // Get rows for selected player in each selected year
  const playerYearRows = useMemo(() => {
    if (!selectedPlayer || selectedYears.length === 0) return {}
    const playerRows = geekosRows.filter(r => r.playerName === selectedPlayer)
    const result = {}
    for (const year of selectedYears) {
      result[year] = filterRowsByYear(playerRows, year)
    }
    return result
  }, [geekosRows, selectedPlayer, selectedYears])

  // Calculate metrics for each year
  const overviewByYear = useMemo(() => {
    const result = {}
    for (const year of selectedYears) {
      result[year] = calculatePlayerYearOverview(playerYearRows[year] || [])
    }
    return result
  }, [playerYearRows, selectedYears])

  const recordsByYear = useMemo(() => {
    const result = {}
    for (const year of selectedYears) {
      result[year] = calculatePlayerYearRecords(playerYearRows[year] || [])
    }
    return result
  }, [playerYearRows, selectedYears])

  const consistencyByYear = useMemo(() => {
    const result = {}
    for (const year of selectedYears) {
      result[year] = calculatePlayerYearConsistency(playerYearRows[year] || [])
    }
    return result
  }, [playerYearRows, selectedYears])

  // Early returns
  if (!allRows || allRows.length === 0) {
    return <EmptyState />
  }

  if (geekosRows.length === 0 && listedPlayers && listedPlayers.size > 0) {
    return (
      <div className="space-y-8 relative z-10">
        <SectionShell title="Geeko Year vs Year" isPrimary>
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-slate-300 text-lg font-medium mb-2">
              No hay datos de jugadores Geekos disponibles
            </p>
          </div>
        </SectionShell>
      </div>
    )
  }

  const canCompare = selectedPlayer && selectedYears.length >= 2
  const playerOptions = geekoPlayers.map(name => ({ value: name, label: name }))

  return (
    <div className="space-y-8 relative z-10">
      {/* Header */}
      <SectionShell title="Geeko Year vs Year" isPrimary>
        <p className="text-slate-400 text-sm mb-6">
          Compare a single Geeko across multiple seasons
        </p>

        {/* Player Selector */}
        <div className="mb-6">
          <Select
            label="Jugador"
            value={selectedPlayer}
            onChange={setSelectedPlayer}
            options={[{ value: '', label: 'Seleccionar...' }, ...playerOptions]}
          />
        </div>

        {/* Year Selector */}
        <div className="mb-6">
          <YearSelector
            availableYears={availableYears}
            selectedYears={selectedYears}
            onYearsChange={setSelectedYears}
          />
        </div>

        {/* Sample indicators */}
        {canCompare && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            {selectedYears.map(year => {
              const overview = overviewByYear[year]
              const confidence = getConfidenceBadge(overview?.matches || 0)
              return (
                <div key={year} className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Matches in {year}:</span>
                  <span className="text-white font-semibold">{overview?.matches || 0}</span>
                  <Badge variant={confidence.variant} size="sm">{confidence.label}</Badge>
                </div>
              )
            })}
          </div>
        )}

        {!canCompare && selectedYears.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-sm">
              Selecciona al menos 2 años diferentes para comparar
            </p>
          </div>
        )}
      </SectionShell>

      {!canCompare ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-slate-300 text-lg font-medium mb-2">
            Selecciona un jugador y al menos 2 años diferentes para comenzar
          </p>
        </div>
      ) : (
        <>
          {/* Player Header */}
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-4">
              <PlayerAvatarWithName name={selectedPlayer} size="lg" />
              <div className="flex-1">
                <div className="text-slate-400 text-sm mb-1">Comparando</div>
                <div className="text-white text-xl font-bold">
                  {selectedPlayer} - {selectedYears.join(' vs ')}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700/50">
            <div className="flex gap-2">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'records', label: 'Records' },
                { id: 'consistency', label: 'Consistency' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 font-semibold text-sm transition-all duration-200
                    border-b-2
                    ${activeTab === tab.id
                      ? 'text-indigo-400 border-indigo-400'
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <OverviewTab
                selectedYears={selectedYears}
                overviewByYear={overviewByYear}
              />
            )}

            {activeTab === 'records' && (
              <RecordsTab
                selectedYears={selectedYears}
                recordsByYear={recordsByYear}
              />
            )}

            {activeTab === 'consistency' && (
              <ConsistencyTab
                selectedYears={selectedYears}
                consistencyByYear={consistencyByYear}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Overview Tab Component
 */
function OverviewTab({ selectedYears, overviewByYear }) {
  const metrics = [
    { key: 'matches', label: 'Partidas', format: 'number' },
    { key: 'winRate', label: 'Win Rate', format: 'percent' },
    { key: 'avgGameTimeSeconds', label: 'Avg Game Time', format: 'duration' },
    { key: 'avgHeroKills', label: 'Avg Hero Kills', format: 'decimal' },
    { key: 'avgAssists', label: 'Avg Assists', format: 'decimal' },
    { key: 'avgTakedowns', label: 'Avg Takedowns', format: 'decimal' },
    { key: 'avgDeaths', label: 'Avg Deaths', format: 'decimal' },
    { key: 'avgHeroDamage', label: 'Avg Hero Damage', format: 'compact' },
    { key: 'avgSiegeDamage', label: 'Avg Siege Damage', format: 'compact' },
    { key: 'avgDamageTaken', label: 'Avg Damage Taken', format: 'compact' },
    { key: 'avgHealingShielding', label: 'Avg Healing/Shielding', format: 'compact' },
    { key: 'avgSelfHealing', label: 'Avg Self Healing', format: 'compact' }
  ]

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left text-slate-400 text-xs font-semibold py-3 px-4">Métrica</th>
              {selectedYears.map(year => (
                <th
                  key={year}
                  className="text-center text-xs font-semibold py-3 px-4"
                  style={{ color: getYearColor(year) }}
                >
                  {year}
                </th>
              ))}
              {selectedYears.length >= 2 && (
                <th className="text-center text-slate-400 text-xs font-semibold py-3 px-4">
                  Δ (Último - Primero)
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {metrics.map(metric => {
              const firstYear = selectedYears[selectedYears.length - 1]
              const lastYear = selectedYears[0]
              const firstValue = overviewByYear[firstYear]?.[metric.key] || 0
              const lastValue = overviewByYear[lastYear]?.[metric.key] || 0
              const delta = lastValue - firstValue

              const formatValue = (val) => {
                switch (metric.format) {
                  case 'percent':
                    return formatPercent(val)
                  case 'duration':
                    return formatDuration(val)
                  case 'compact':
                    return formatCompact(val)
                  case 'decimal':
                    return formatDecimal(val, 1)
                  default:
                    return formatNumber(val)
                }
              }

              const deltaColor = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-400'

              return (
                <tr key={metric.key} className="border-b border-slate-700/30 hover:bg-slate-800/20">
                  <td className="text-slate-300 text-sm py-3 px-4">{metric.label}</td>
                  {selectedYears.map(year => {
                    const value = overviewByYear[year]?.[metric.key] || 0
                    return (
                      <td key={year} className="text-center text-white font-semibold py-3 px-4">
                        {formatValue(value)}
                      </td>
                    )
                  })}
                  {selectedYears.length >= 2 && (
                    <td className={`text-center font-semibold py-3 px-4 ${deltaColor}`}>
                      {delta > 0 ? '+' : ''}{formatValue(delta)}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Records Tab Component
 */
function RecordsTab({ selectedYears, recordsByYear }) {
  return (
    <div className="space-y-6">
      <div className="text-slate-400 text-sm mb-4">
        Récords por partida (máximo valor en una sola partida)
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedYears.map(year => {
          const records = recordsByYear[year] || []
          return (
            <div key={year}>
              <h3 className="text-white font-semibold text-lg mb-4" style={{ color: getYearColor(year) }}>
                {year} Records
              </h3>
              <div className="space-y-4">
                {records.length === 0 ? (
                  <p className="text-slate-500 text-sm">No hay récords disponibles</p>
                ) : (
                  records.map((record, idx) => (
                    <RecordCard key={idx} record={record} year={year} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Consistency Tab Component
 */
function ConsistencyTab({ selectedYears, consistencyByYear }) {
  const metricKeys = Object.keys(consistencyByYear[selectedYears[0]] || {})

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 mb-4">
        <p className="text-slate-300 text-sm">
          <strong>P90</strong> = percentil 90, representa un juego típico de alto rendimiento, menos sensible a valores atípicos que el máximo.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {metricKeys.map(metricKey => {
          const firstConsistency = consistencyByYear[selectedYears[selectedYears.length - 1]]?.[metricKey]
          const lastConsistency = consistencyByYear[selectedYears[0]]?.[metricKey]
          
          if (!firstConsistency?.hasData && !lastConsistency?.hasData) return null

          return (
            <div key={metricKey} className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-6">
              <div className="text-slate-300 font-semibold text-lg mb-4">
                {firstConsistency?.label || lastConsistency?.label}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left text-slate-400 text-xs font-semibold py-2 px-4">Año</th>
                      <th className="text-center text-slate-400 text-xs font-semibold py-2 px-4">Mediana</th>
                      <th className="text-center text-slate-400 text-xs font-semibold py-2 px-4">P90</th>
                      <th className="text-center text-slate-400 text-xs font-semibold py-2 px-4">IQR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedYears.map(year => {
                      const cons = consistencyByYear[year]?.[metricKey]
                      if (!cons?.hasData) return null
                      return (
                        <tr key={year} className="border-b border-slate-700/30">
                          <td className="text-slate-300 text-sm py-2 px-4" style={{ color: getYearColor(year) }}>
                            {year}
                          </td>
                          <td className="text-center text-white font-semibold py-2 px-4">
                            {formatCompact(cons.median)}
                          </td>
                          <td className="text-center text-white font-semibold py-2 px-4">
                            {formatCompact(cons.p90)}
                          </td>
                          <td className="text-center text-white font-semibold py-2 px-4">
                            {formatCompact(cons.iqr)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {selectedYears.length >= 2 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Δ Mediana</div>
                      <div className={`text-sm font-semibold ${
                        lastConsistency?.median > firstConsistency?.median ? 'text-emerald-400' :
                        lastConsistency?.median < firstConsistency?.median ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {lastConsistency?.median > firstConsistency?.median ? '+' : ''}
                        {formatCompact((lastConsistency?.median || 0) - (firstConsistency?.median || 0))}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Δ P90</div>
                      <div className={`text-sm font-semibold ${
                        lastConsistency?.p90 > firstConsistency?.p90 ? 'text-emerald-400' :
                        lastConsistency?.p90 < firstConsistency?.p90 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {lastConsistency?.p90 > firstConsistency?.p90 ? '+' : ''}
                        {formatCompact((lastConsistency?.p90 || 0) - (firstConsistency?.p90 || 0))}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Δ IQR</div>
                      <div className={`text-sm font-semibold ${
                        lastConsistency?.iqr > firstConsistency?.iqr ? 'text-amber-400' :
                        lastConsistency?.iqr < firstConsistency?.iqr ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {lastConsistency?.iqr > firstConsistency?.iqr ? '+' : ''}
                        {formatCompact((lastConsistency?.iqr || 0) - (firstConsistency?.iqr || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Record Card Component
 */
function RecordCard({ record, year }) {
  const yearColor = getYearColor(year)

  const formatValue = (val, isTime = false) => {
    if (isTime) return formatDuration(val)
    return formatCompact(val)
  }

  const isTimeMetric = record.label.includes('Time') || record.label.includes('On Fire')

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-slate-400 text-xs font-medium mb-1">{record.label}</div>
          <div className="text-white text-2xl font-bold" style={{ color: yearColor }}>
            {formatValue(record.value, isTimeMetric)}
          </div>
        </div>
      </div>
      {record.context.gameTime > 0 && (
        <div className="mb-2">
          <div className="text-slate-500 text-xs">
            Per minute: <span className="text-slate-300">{formatValue(record.perMinute, isTimeMetric)}</span>
          </div>
        </div>
      )}
      <div className="pt-3 border-t border-slate-700/50 space-y-1">
        <div className="text-slate-500 text-xs">
          <strong>Hero:</strong> {record.context.heroName}
        </div>
        <div className="text-slate-500 text-xs">
          <strong>Map:</strong> {record.context.map}
        </div>
        {record.context.gameMode && (
          <div className="text-slate-500 text-xs">
            <strong>Mode:</strong> {record.context.gameMode}
          </div>
        )}
        <div className="text-slate-500 text-xs">
          <strong>Duration:</strong> {formatDuration(record.context.gameTime)}
        </div>
        <div className="text-slate-500 text-xs">
          <strong>Date:</strong> {record.context.date}
        </div>
        <div className="text-slate-500 text-xs">
          <strong>Result:</strong> {record.context.winner}
        </div>
      </div>
    </div>
  )
}
