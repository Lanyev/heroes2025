import clsx from 'clsx'

/**
 * Card wrapper for charts
 * @param {Object} props
 * @param {string} props.title - Chart title
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.children - Chart content
 * @param {string} props.className - Additional CSS classes
 */
export function ChartCard({ title, subtitle, children, className }) {
  return (
    <div className={clsx(
      'bg-layer-deep/80 backdrop-blur-sm rounded-xl border border-slate-700/50',
      'shadow-inset-custom',
      'animate-fade-in',
      // Panel hundido para gráficas integradas
      className
    )}>
      <div className="p-4 border-b border-slate-700/50 bg-layer-light/20">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && (
          <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      <div className="p-4 bg-layer-deep/60">
        {children}
      </div>
    </div>
  )
}
