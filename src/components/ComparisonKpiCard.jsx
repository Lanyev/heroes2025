import { formatNumber, formatPercent, formatDuration, formatCompact } from '../utils/format'
import { getYearColor } from '../data/yearComparison'

/**
 * KPI Card for year comparison
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.icon - Icon emoji
 * @param {Object} props.yearsData - Object keyed by year with values
 * @param {string} props.format - Format type: 'number', 'percent', 'duration', 'compact'
 * @param {Function} props.formatter - Custom formatter function
 */
export function ComparisonKpiCard({ title, icon, yearsData, format = 'number', formatter }) {
  const years = Object.keys(yearsData).map(Number).sort((a, b) => a - b)
  
  if (years.length === 0) return null
  
  // Get formatter function
  const formatValue = formatter || ((value) => {
    switch (format) {
      case 'percent':
        return formatPercent(value)
      case 'duration':
        return formatDuration(value)
      case 'compact':
        return formatCompact(value)
      case 'number':
      default:
        return formatNumber(value)
    }
  })
  
  // Calculate difference between first and last year
  const firstYear = years[0]
  const lastYear = years[years.length - 1]
  const firstValue = yearsData[firstYear]
  const lastValue = yearsData[lastYear]
  
  const difference = lastValue - firstValue
  const percentageChange = firstValue !== 0 
    ? ((difference / firstValue) * 100) 
    : (lastValue !== 0 ? 100 : 0)
  
  let direction = '→'
  let diffColor = 'text-slate-400'
  
  if (Math.abs(difference) < 0.01) {
    direction = '→'
    diffColor = 'text-slate-400'
  } else if (difference > 0) {
    direction = '↑'
    diffColor = 'text-emerald-400'
  } else {
    direction = '↓'
    diffColor = 'text-red-400'
  }
  
  // For win rate, reverse the logic (higher is better)
  if (format === 'percent' && title.toLowerCase().includes('win')) {
    if (difference > 0) {
      diffColor = 'text-emerald-400'
    } else if (difference < 0) {
      diffColor = 'text-red-400'
    }
  }
  
  // For deaths, reverse the logic (lower is better)
  if (title.toLowerCase().includes('muerte')) {
    if (difference < 0) {
      diffColor = 'text-emerald-400'
      direction = '↑' // Improvement
    } else if (difference > 0) {
      diffColor = 'text-red-400'
      direction = '↓' // Worse
    }
  }
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 hover:border-slate-600/50 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {years.map((year) => {
          const value = yearsData[year]
          const color = getYearColor(year)
          
          return (
            <div key={year} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-400 text-sm">{year}:</span>
              </div>
              <span className="text-white font-semibold text-sm">
                {formatValue(value)}
              </span>
            </div>
          )
        })}
      </div>
      
      {years.length >= 2 && (
        <div className={`mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between ${diffColor}`}>
          <span className="text-xs font-medium">Diferencia:</span>
          <span className="text-xs font-semibold flex items-center gap-1">
            {difference > 0 ? '+' : ''}{formatValue(Math.abs(difference))}
            {format !== 'duration' && ` (${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%)`}
            <span>{direction}</span>
          </span>
        </div>
      )}
    </div>
  )
}
