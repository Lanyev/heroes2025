import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import { Emote } from './Emote'
import { getPublicPath } from '../utils/paths'

/**
 * Generate micro-insight text based on metric type and value
 * @param {Object} params
 * @param {string} params.type - Metric type ('winRate', 'duration', 'deaths', 'kills', 'assists', 'takedowns', 'damage', 'timeDead')
 * @param {number} params.value - Main value
 * @param {number} params.totalMatches - Total matches for per-game calculations
 * @param {number} params.avgValue - Average value if available
 * @returns {string|null}
 */
function getMicroInsight({ type, value, totalMatches = 0, avgValue = null }) {
  if (type === 'winRate') {
    if (value > 0.55) return 'Muy alto'
    if (value >= 0.50) return 'Bueno'
    if (value >= 0.45) return 'Ajustado'
    return 'Bajo'
  }
  
  if (type === 'duration') {
    const minutes = value / 60
    if (minutes < 15) return 'Rápido'
    if (minutes <= 20) return 'Normal'
    return 'Largo'
  }
  
  if (type === 'timeDead') {
    const minutes = value / 60
    if (minutes < 1) return 'Muy bajo'
    if (minutes <= 2) return 'Normal'
    return 'Alto'
  }
  
  // For per-game metrics, we can add context if we have avgValue
  if (type === 'kills' && avgValue !== null) {
    if (avgValue > 5) return 'Alto'
    if (avgValue >= 3) return 'Normal'
    return 'Bajo'
  }
  
  if (type === 'deaths' && avgValue !== null) {
    if (avgValue < 3) return 'Bajo'
    if (avgValue <= 5) return 'Normal'
    return 'Alto'
  }
  
  if (type === 'takedowns' && avgValue !== null) {
    if (avgValue > 8) return 'Excelente'
    if (avgValue >= 5) return 'Bueno'
    return 'Normal'
  }
  
  return null
}

/**
 * Enhanced Metric Card component with tiers, micro-insights, and modern styling
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main value to display
 * @param {string} props.icon - Optional emoji icon
 * @param {'A'|'B'|'C'} props.tier - Visual tier (A = highest importance, C = lowest)
 * @param {number} props.priority - Priority level (1 = highest, 4 = lowest) for size and hover effects
 * @param {string} props.microInsight - Optional micro-insight text
 * @param {string} props.perGameValue - Optional "per game" value to show
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animate - Whether to animate value changes
 * @param {string} props.tooltip - Optional tooltip text for title
 */
export function MetricCard({ 
  title, 
  value, 
  icon, 
  tier = 'C',
  priority,
  microInsight,
  perGameValue,
  className,
  animate = false,
  tooltip
}) {
  const shouldReduceMotion = useReducedMotion()
  const hasFullHeight = className?.includes('h-full') || tier === 'A'
  
  // Priority-based styling (overrides tier when priority is set)
  const priorityStyles = useMemo(() => {
    if (priority === 1) {
      return {
        value: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
        padding: 'p-3 sm:p-4 lg:p-5 xl:p-6',
        iconSize: 'w-8 h-8 sm:w-10 sm:h-10',
        hover: 'hover:scale-105 hover:shadow-xl hover:border-indigo-400/60 hover:bg-indigo-500/5',
        titleSize: 'text-[10px] sm:text-xs'
      }
    }
    if (priority === 2) {
      return {
        value: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl',
        padding: 'p-3 sm:p-3.5 lg:p-4.5 xl:p-5',
        iconSize: 'w-7 h-7 sm:w-9 sm:h-9',
        hover: 'hover:scale-[1.03] hover:shadow-lg hover:border-indigo-400/50 hover:bg-indigo-500/3',
        titleSize: 'text-[10px] sm:text-xs'
      }
    }
    if (priority === 3) {
      return {
        value: 'text-base sm:text-lg lg:text-xl xl:text-2xl',
        padding: 'p-2.5 sm:p-3 lg:p-4 xl:p-4.5',
        iconSize: 'w-6 h-6 sm:w-8 sm:h-8',
        hover: 'hover:scale-[1.02] hover:shadow-md hover:border-indigo-400/40 hover:bg-indigo-500/2',
        titleSize: 'text-[10px] sm:text-xs'
      }
    }
    if (priority === 4) {
      return {
        value: 'text-sm sm:text-base lg:text-lg xl:text-xl',
        padding: 'p-2.5 sm:p-3 lg:p-3.5 xl:p-4',
        iconSize: 'w-5 h-5 sm:w-7 sm:h-7',
        hover: 'hover:scale-[1.01] hover:shadow-sm hover:border-indigo-400/30 hover:bg-indigo-500/1',
        titleSize: 'text-[10px] sm:text-xs'
      }
    }
    return null
  }, [priority])
  
  // Tier-based styling
  const tierStyles = useMemo(() => {
    if (tier === 'A') {
      return {
        container: '', // Container handled by parent grid
        card: 'bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 border-indigo-500/30',
        value: priorityStyles?.value || 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
        padding: priorityStyles?.padding || 'p-4 sm:p-5 lg:p-6 xl:p-7',
        shadow: 'shadow-lg-custom hover:shadow-xl',
        glow: 'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-indigo-500/5 before:to-purple-500/5 before:pointer-events-none',
        hover: priorityStyles?.hover || 'hover:border-indigo-500/50',
        titleSize: priorityStyles?.titleSize || 'text-[10px] sm:text-xs'
      }
    }
    if (tier === 'B') {
      return {
        container: '', // Container handled by parent grid
        card: 'bg-layer-mid/70 border-slate-700/40',
        value: priorityStyles?.value || 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
        padding: priorityStyles?.padding || 'p-3 sm:p-4 lg:p-5 xl:p-6',
        shadow: 'shadow-md-custom hover:shadow-lg-custom',
        glow: '',
        hover: priorityStyles?.hover || 'hover:border-indigo-500/50',
        titleSize: priorityStyles?.titleSize || 'text-[10px] sm:text-xs'
      }
    }
    // Tier C
    return {
      container: '', // Container handled by parent grid
      card: 'bg-layer-mid/60 border-slate-700/30',
      value: priorityStyles?.value || 'text-lg sm:text-xl lg:text-2xl xl:text-3xl',
      padding: priorityStyles?.padding || 'p-3 sm:p-4 lg:p-4 xl:p-5',
      shadow: 'shadow-sm-custom hover:shadow-md-custom',
      glow: '',
      hover: priorityStyles?.hover || 'hover:border-indigo-500/50',
      titleSize: priorityStyles?.titleSize || 'text-[10px] sm:text-xs'
    }
  }, [tier, priorityStyles])
  
  // Animation variants
  const valueVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeOut' }
    },
    exit: { opacity: 0, y: -10 }
  }
  
  const cardVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }
    }
  }
  
  return (
    <motion.div
      className={clsx('w-full', (tier === 'A' || className?.includes('h-full')) && 'h-full', className)}
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <div className={clsx(
        'relative rounded-xl border backdrop-blur-sm',
        'transition-all duration-300',
        tierStyles.card,
        tierStyles.padding,
        tierStyles.shadow,
        tierStyles.hover,
        'group',
        hasFullHeight && 'h-full flex flex-col',
        tierStyles.glow
      )}>
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-opacity duration-300 pointer-events-none" />
        
        <div className={clsx(
          'relative flex items-start justify-between',
          hasFullHeight && 'flex-1'
        )}>
          <div className="flex-1 min-w-0">
            <p 
              className={clsx(
                'text-slate-400 font-medium mb-2 uppercase tracking-wide',
                tierStyles.titleSize
              )}
              title={tooltip}
            >
              {title}
            </p>
            
            {animate && !shouldReduceMotion ? (
              <motion.p
                key={value}
                className={clsx(
                  'font-bold text-white tracking-tight mb-1',
                  tierStyles.value
                )}
                variants={valueVariants}
                initial="initial"
                animate="animate"
              >
                {value}
              </motion.p>
            ) : (
              <p className={clsx(
                'font-bold text-white tracking-tight mb-1',
                tierStyles.value
              )}>
                {value}
              </p>
            )}
            
            {/* Per-game value */}
            {perGameValue && (
              <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5">
                {perGameValue}
              </p>
            )}
            
            {/* Micro-insight */}
            {microInsight && (
              <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
                <span className="text-slate-500/80 text-[10px] sm:text-xs font-medium">
                  {microInsight}
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className={clsx(
              'ml-3 opacity-70 group-hover:opacity-90 transition-opacity',
              tier === 'A' && ''
            )}>
              {typeof icon === 'string' ? (
                // Casos especiales para emojis problemáticos - verificar primero
                icon === '⏳' || icon === '\u23F3' || icon.trim() === '⏳' ? (
                  <img 
                    src={getPublicPath('/emotes/sands-of-time.png')} 
                    alt="⏳" 
                    className={priorityStyles?.iconSize || (tier === 'A' ? 'w-12 h-12' : 'w-8 h-8')}
                    style={{ objectFit: 'contain', imageRendering: 'crisp-edges' }}
                  />
                ) : icon === '⏱️' || icon === '\u23F1' || icon === '\u23F1\uFE0F' || icon.replace(/\uFE0F/g, '') === '\u23F1' ? (
                  <img 
                    src={getPublicPath('/emotes/clockwork.png')} 
                    alt="⏱️" 
                    className={priorityStyles?.iconSize || (tier === 'A' ? 'w-12 h-12' : 'w-8 h-8')}
                    style={{ objectFit: 'contain', imageRendering: 'crisp-edges' }}
                  />
                ) : /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon) ? (
                  <Emote emoji={icon} size={tier === 'A' ? 'xl' : 'lg'} />
                ) : (
                  <span className={clsx(
                    'text-3xl',
                    tier === 'A' && 'text-4xl'
                  )}>{icon}</span>
                )
              ) : (
                <span className={clsx(
                  'text-3xl',
                  tier === 'A' && 'text-4xl'
                )}>{icon}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Edge highlight on hover */}
        <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-indigo-500/20 transition-colors duration-300 pointer-events-none" />
      </div>
    </motion.div>
  )
}

/**
 * Helper to create metric card props with micro-insights
 * @param {Object} params
 * @param {string} params.title
 * @param {string|number} params.value
 * @param {string} params.icon
 * @param {'A'|'B'|'C'} params.tier
 * @param {string} params.type - Metric type for micro-insight
 * @param {number} params.rawValue - Raw numeric value for calculations
 * @param {number} params.totalMatches - Total matches
 * @param {number} params.avgValue - Average value if available
 * @param {string} params.perGameValue - Optional per-game value string
 * @returns {Object}
 */
export function createMetricCardProps({
  title,
  value,
  icon,
  tier = 'C',
  type,
  rawValue,
  totalMatches = 0,
  avgValue = null,
  perGameValue = null
}) {
  const microInsight = getMicroInsight({ 
    type, 
    value: rawValue, 
    totalMatches, 
    avgValue 
  })
  
  return {
    title,
    value,
    icon,
    tier,
    microInsight,
    perGameValue,
    animate: true
  }
}
