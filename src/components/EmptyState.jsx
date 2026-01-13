import clsx from 'clsx'
import { Emote } from './Emote'

/**
 * Empty state component when no data matches filters
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {string} props.icon - Emoji icon
 * @param {React.ReactNode} props.action - Optional action button
 * @param {string} props.className - Additional CSS classes
 */
export function EmptyState({ 
  title = 'Sin resultados', 
  description = 'No hay datos que coincidan con los filtros seleccionados.',
  icon = '🔍',
  action,
  className 
}) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-16 px-4',
      'text-center animate-fade-in',
      className
    )}>
      <div className="text-6xl mb-4 opacity-50">
        <Emote emoji={icon} size={64} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-6">{description}</p>
      {action}
    </div>
  )
}
