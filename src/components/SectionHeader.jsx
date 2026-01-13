import clsx from 'clsx'

/**
 * Section header component with optional insight subtitle
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Optional subtitle
 * @param {string} props.insight - Optional editorial insight (e.g., "Semana más activa: ...")
 * @param {string} props.className - Additional CSS classes
 */
export function SectionHeader({ title, subtitle, insight, className }) {
  return (
    <div className={clsx('mb-4', className)}>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {subtitle && (
        <p className="text-slate-400 text-sm">{subtitle}</p>
      )}
      {insight && (
        <p className="text-indigo-300/80 text-sm font-medium mt-2">
          {insight}
        </p>
      )}
    </div>
  )
}
