import clsx from 'clsx'

/**
 * Shell wrapper for page sections
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.description - Optional description
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.className - Additional CSS classes
 */
export function SectionShell({ title, description, children, className, isPrimary, isSecondary }) {
  return (
    <section className={clsx('py-4 sm:py-6 relative z-10', className)}>
      {(title || description) && (
        <div className={clsx('mb-4 sm:mb-6', isPrimary && 'mb-6 sm:mb-8')}>
          {title && (
            <h2 className={clsx(
              'font-bold text-white',
              // Jerarquía: título primario más grande y destacado
              isPrimary ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-lg sm:text-xl'
            )}>
              {title}
            </h2>
          )}
          {description && (
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
