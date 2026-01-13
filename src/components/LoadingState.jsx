import clsx from 'clsx'
import { Emote } from './Emote'

/**
 * Loading state component
 * @param {Object} props
 * @param {string} props.message - Loading message
 * @param {string} props.className - Additional CSS classes
 */
export function LoadingState({ message = 'Cargando datos...', className }) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-16 px-4',
      'text-center',
      className
    )}>
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
      </div>
      <p className="text-slate-400 text-lg">{message}</p>
    </div>
  )
}

/**
 * Error state component
 * @param {Object} props
 * @param {string} props.error - Error message
 * @param {Function} props.onRetry - Optional retry handler
 * @param {string} props.className - Additional CSS classes
 */
export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-16 px-4',
      'text-center animate-fade-in',
      className
    )}>
      <div className="text-6xl mb-4">
        <Emote emoji="⚠️" size={64} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Error al cargar datos</h3>
      <p className="text-red-400 max-w-md mb-4">{error}</p>
      <p className="text-slate-500 text-sm max-w-md mb-6">
        Asegúrate de que el archivo CSV está ubicado en <code className="bg-slate-800 px-2 py-1 rounded">/public/structured_data.csv</code>
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
