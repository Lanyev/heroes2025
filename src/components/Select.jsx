import clsx from 'clsx'

/**
 * Custom select component
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {Array<{value: string, label: string}>} props.options - Options array
 * @param {string} props.className - Additional CSS classes
 */
export function Select({ label, value, onChange, options = [], className }) {
  return (
    <div className={clsx('flex flex-col gap-1 sm:gap-1.5', className)}>
      {label && (
        <label className="text-slate-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'bg-slate-700/80 border border-slate-600/80 rounded-lg px-2.5 sm:px-3.5 py-2 sm:py-2.5',
          'text-white text-xs sm:text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50',
          'cursor-pointer hover:border-slate-500 hover:bg-slate-700 transition-all duration-200',
          'appearance-none bg-no-repeat bg-right shadow-sm-custom hover:shadow-md-custom',
          'pr-7 sm:pr-8'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em'
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-800">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
