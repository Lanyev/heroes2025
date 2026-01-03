import clsx from 'clsx'

/**
 * Shell wrapper for page sections
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.description - Optional description
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.className - Additional CSS classes
 */
export function SectionShell({ title, description, children, className }) {
  return (
    <section className={clsx('py-6', className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-bold text-white">{title}</h2>
          )}
          {description && (
            <p className="text-slate-400 text-sm mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
