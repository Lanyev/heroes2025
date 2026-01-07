import { useState, useEffect, useCallback } from 'react'

/**
 * Controles de navegación para la presentación
 * Se auto-ocultan después de inactividad y reaparecen con interacción
 */
export function PresentationControls({
  onPrev,
  onNext,
  onRestart,
  onExit,
  canGoPrev,
  canGoNext,
  awardIndex,
  totalAwards
}) {
  const [visible, setVisible] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Auto-hide después de 2 segundos de inactividad
  useEffect(() => {
    const checkVisibility = () => {
      const now = Date.now()
      if (now - lastActivity > 2000) {
        setVisible(false)
      }
    }

    const interval = setInterval(checkVisibility, 500)
    return () => clearInterval(interval)
  }, [lastActivity])

  // Mostrar controles con interacción
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now())
    setVisible(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = () => handleActivity()
    const handleKeyDown = () => handleActivity()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleActivity])

  return (
    <div 
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-3
        transition-all duration-300 ease-out
        ${visible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
    >
      {/* Award counter */}
      <div className="px-3 py-2 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-400 text-sm font-mono">
        {awardIndex + 1} / {totalAwards}
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
        {/* Prev */}
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${canGoPrev 
              ? 'text-slate-300 hover:text-white hover:bg-slate-700/50 active:scale-95' 
              : 'text-slate-600 cursor-not-allowed'
            }
          `}
          title="Anterior (←)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${canGoNext 
              ? 'text-slate-300 hover:text-white hover:bg-slate-700/50 active:scale-95' 
              : 'text-slate-600 cursor-not-allowed'
            }
          `}
          title="Siguiente (→)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-600/50 mx-1" />

        {/* Restart */}
        <button
          onClick={onRestart}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 active:scale-95"
          title="Reiniciar (R)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Exit */}
        <button
          onClick={onExit}
          className="p-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
          title="Salir (Esc)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
