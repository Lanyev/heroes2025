import clsx from 'clsx'

/**
 * Badge component for labels and tags
 * @param {Object} props
 * @param {string} props.children - Badge text
 * @param {string} props.variant - Color variant ('default', 'success', 'warning', 'danger', 'info')
 * @param {string} props.size - Size ('sm', 'md')
 * @param {string} props.className - Additional CSS classes
 */
export function Badge({ children, variant = 'default', size = 'sm', className }) {
  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full shadow-sm-custom',
      // Sizes
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-3 py-1 text-sm',
      // Variants
      variant === 'default' && 'bg-slate-700 text-slate-300',
      variant === 'success' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
      variant === 'warning' && 'bg-amber-500/20 text-amber-400 border border-amber-500/20',
      variant === 'danger' && 'bg-red-500/20 text-red-400 border border-red-500/20',
      variant === 'info' && 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20',
      className
    )}>
      {children}
    </span>
  )
}
