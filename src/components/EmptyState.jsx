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
  // No mostrar nada cuando no hay resultados
  return null
}
