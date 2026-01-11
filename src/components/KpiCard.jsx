import clsx from 'clsx'

/**
 * KPI Card component for displaying key metrics
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main value to display
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {string} props.icon - Optional emoji icon
 * @param {string} props.trend - Optional trend indicator ('up', 'down', 'neutral')
 * @param {string} props.explanation - Optional explanation shown when there's no data
 * @param {boolean} props.showExplanation - Whether to show explanation (when no data)
 * @param {string} props.className - Additional CSS classes
 */
export function KpiCard({ title, value, subtitle, icon, trend, explanation, showExplanation, className }) {
  return (
    <div className={clsx(
      'bg-layer-mid/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50',
      'hover:border-indigo-500/50 transition-all duration-300',
      'shadow-md-custom hover:shadow-lg-custom',
      'animate-fade-in',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
          )}
          {showExplanation && explanation && (
            <p className="text-slate-500 text-xs mt-2 italic">{explanation}</p>
          )}
        </div>
        {icon && (
          <div className="text-3xl ml-3 opacity-80">{icon}</div>
        )}
      </div>
      {trend && (
        <div className={clsx(
          'mt-3 text-sm font-medium flex items-center gap-1',
          trend === 'up' && 'text-emerald-400',
          trend === 'down' && 'text-red-400',
          trend === 'neutral' && 'text-slate-400'
        )}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'neutral' && '→'}
        </div>
      )}
    </div>
  )
}
