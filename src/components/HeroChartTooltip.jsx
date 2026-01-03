import clsx from 'clsx'
import { HeroAvatar } from './HeroAvatar'
import { Badge } from './Badge'
import { formatNumber, formatPercent, formatCompact, formatDecimal } from '../utils/format'

/**
 * Custom tooltip component for Recharts with hero avatar
 * 
 * @param {Object} props - Recharts tooltip props
 * @param {boolean} props.active - Whether tooltip is active
 * @param {Array} props.payload - Data payload
 * @param {string} props.label - Label (usually hero name)
 * @param {Object} props.config - Configuration for tooltip display
 */
export function HeroChartTooltip({ 
  active, 
  payload, 
  label,
  config = {}
}) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0]?.payload
  if (!data) return null

  const heroName = data.name || label
  const heroRole = data.role

  // Determine which metrics to show
  const {
    primaryMetric,
    primaryLabel,
    primaryFormatter = formatCompact,
    showMatches = true,
    showWinRate = true,
    showRole = false
  } = config

  // Get the primary value from the dataKey
  const primaryValue = payload[0]?.value
  const primaryDataKey = payload[0]?.dataKey

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 min-w-[180px]">
      {/* Header with avatar and name */}
      <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-700">
        <HeroAvatar 
          name={heroName} 
          role={heroRole}
          size="md" 
          showBorder={true}
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{heroName}</div>
          {showRole && heroRole && (
            <div className="text-xs text-slate-400">{heroRole}</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1.5">
        {/* Primary metric (the chart's main value) */}
        {primaryValue !== undefined && (
          <TooltipRow 
            label={primaryLabel || formatMetricLabel(primaryDataKey)}
            value={formatMetricValue(primaryValue, primaryDataKey, primaryFormatter)}
            highlight
          />
        )}

        {/* Matches */}
        {showMatches && data.matches !== undefined && (
          <TooltipRow 
            label="Partidas"
            value={formatNumber(data.matches)}
          />
        )}

        {/* Win Rate */}
        {showWinRate && data.winRate !== undefined && (
          <TooltipRow 
            label="Win Rate"
            value={
              <Badge 
                variant={data.winRate >= 0.55 ? 'success' : data.winRate <= 0.45 ? 'danger' : 'default'}
                size="sm"
              >
                {formatPercent(data.winRate)}
              </Badge>
            }
          />
        )}

        {/* Additional stats from config */}
        {config.additionalStats?.map(stat => {
          const value = data[stat.key]
          if (value === undefined) return null
          return (
            <TooltipRow 
              key={stat.key}
              label={stat.label}
              value={stat.formatter ? stat.formatter(value) : value}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * Simple row for tooltip content
 */
function TooltipRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={clsx(
        highlight ? 'text-slate-200 font-medium' : 'text-slate-400'
      )}>
        {label}
      </span>
      <span className={clsx(
        highlight ? 'text-white font-semibold' : 'text-slate-200'
      )}>
        {value}
      </span>
    </div>
  )
}

/**
 * Format metric label from key
 */
function formatMetricLabel(key) {
  const labels = {
    matches: 'Partidas',
    winRate: 'Win Rate',
    winRateWilson: 'Win Rate (Wilson)',
    pickRate: 'Pick Rate',
    kda: 'KDA',
    dpm: 'DPM',
    avgTotalDamage: 'Avg Daño',
    avgHeroDamage: 'Avg D.Héroe',
    avgSiegeDamage: 'Avg D.Asedio',
    avgHealingShielding: 'Avg Curación',
    avgKills: 'Avg Kills',
    avgDeaths: 'Avg Muertes',
    avgAssists: 'Avg Asistencias',
    avgSpentDeadSeconds: 'Avg T.Muerto',
    avgDamageTaken: 'Avg D.Recibido'
  }
  return labels[key] || key
}

/**
 * Format metric value based on key type
 */
function formatMetricValue(value, key, defaultFormatter) {
  // Percentage metrics
  if (['winRate', 'winRateWilson', 'pickRate'].includes(key)) {
    return formatPercent(value)
  }
  // Decimal metrics
  if (['kda', 'avgKills', 'avgDeaths', 'avgAssists'].includes(key)) {
    return formatDecimal(value, 2)
  }
  // Compact number metrics
  if (['dpm', 'avgTotalDamage', 'avgHeroDamage', 'avgSiegeDamage', 'avgHealingShielding', 'avgDamageTaken'].includes(key)) {
    return formatCompact(value)
  }
  // Default
  return defaultFormatter ? defaultFormatter(value) : formatNumber(value)
}

/**
 * Create a tooltip config for a specific metric
 */
export function createTooltipConfig(metricKey, metricLabel) {
  const isPercent = ['winRate', 'winRateWilson', 'pickRate'].includes(metricKey)
  const isDecimal = ['kda', 'avgKills', 'avgDeaths', 'avgAssists'].includes(metricKey)
  
  return {
    primaryMetric: metricKey,
    primaryLabel: metricLabel,
    primaryFormatter: isPercent ? formatPercent : isDecimal ? (v) => formatDecimal(v, 2) : formatCompact,
    showMatches: true,
    showWinRate: metricKey !== 'winRate' && metricKey !== 'winRateWilson',
    showRole: true
  }
}
