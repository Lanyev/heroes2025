import clsx from 'clsx'
import { Emote } from './Emote'

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
export function KpiCard({ title, value, subtitle, icon, trend, explanation, showExplanation, className, isHighlighted, isSecondary }) {
  return (
    <div className={clsx(
      'bg-layer-mid/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50',
      'hover:border-indigo-500/50 transition-all duration-300',
      'shadow-md-custom hover:shadow-lg-custom',
      'animate-fade-in card-hover-lift',
      // Jerarquía: cards destacadas más elevadas, secundarias más hundidas
      isHighlighted && 'bg-surface-1/80 shadow-lg-custom p-6',
      isSecondary && 'bg-surface-2/60 shadow-sm-custom',
      // Acento glow para métricas clave
      isHighlighted && 'accent-glow-hover',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className={clsx(
            'font-bold text-white tracking-tight',
            // Tamaño visual aumentado para cards destacadas
            isHighlighted ? 'text-3xl lg:text-4xl' : 'text-2xl lg:text-3xl'
          )}>
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
          <div className="ml-3 opacity-80">
            {typeof icon === 'string' ? (
              // Casos especiales para emojis problemáticos - verificar primero
              icon === '⏳' || icon === '\u23F3' || icon.trim() === '⏳' ? (
                <img 
                  src="/emotes/sands-of-time.png" 
                  alt="⏳" 
                  className="w-8 h-8"
                  style={{ objectFit: 'contain', imageRendering: 'crisp-edges' }}
                />
              ) : icon === '⏱️' || icon === '\u23F1' || icon === '\u23F1\uFE0F' || icon.replace(/\uFE0F/g, '') === '\u23F1' ? (
                <img 
                  src="/emotes/clockwork.png" 
                  alt="⏱️" 
                  className="w-8 h-8"
                  style={{ objectFit: 'contain', imageRendering: 'crisp-edges' }}
                />
              ) : /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon) ? (
                <Emote emoji={icon} size="lg" />
              ) : (
                <span className="text-3xl">{icon}</span>
              )
            ) : (
              <span className="text-3xl">{icon}</span>
            )}
          </div>
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
