import clsx from 'clsx'

/**
 * Card wrapper for charts with improved depth and modern styling
 * @param {Object} props
 * @param {string} props.title - Chart title (optional, can use SectionHeader inside)
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.children - Chart content
 * @param {string} props.className - Additional CSS classes
 */
export function ChartCard({ title, subtitle, children, className }) {
  return (
    <div className={clsx(
      'relative rounded-lg sm:rounded-xl border border-slate-700/40 backdrop-blur-sm',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90',
      'shadow-lg-custom hover:shadow-xl transition-shadow duration-300',
      'group',
      className
    )}>
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/3 group-hover:to-purple-500/3 transition-opacity duration-300 pointer-events-none" />
      
      {/* Edge highlight */}
      <div className="absolute inset-0 rounded-lg sm:rounded-xl border border-transparent group-hover:border-indigo-500/10 transition-colors duration-300 pointer-events-none" />
      
      {title && (
        <div className="p-3 sm:p-4 border-b border-slate-700/40 bg-slate-800/30 relative z-10">
          <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div className={clsx('relative z-10', title ? 'p-3 sm:p-4' : 'p-4 sm:p-6')}>
        {children}
      </div>
    </div>
  )
}
