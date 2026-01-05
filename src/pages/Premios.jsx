import { useState, useEffect, useMemo } from 'react'
import { loadPremios } from '../data/loadPremios'
import { calculatePremiosWinners } from '../data/premiosCalculations'
import { LoadingState } from '../components/LoadingState'
import { formatNumber } from '../utils/format'

/**
 * Get category icon and color
 */
function getCategoryStyle(categoria) {
  const styles = {
    'Partida': { icon: '🎮', color: 'from-blue-600 to-cyan-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    'Jugador': { icon: '👤', color: 'from-purple-600 to-pink-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
    'Anual': { icon: '🏆', color: 'from-amber-600 to-orange-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' }
  }
  return styles[categoria] || { icon: '🏅', color: 'from-indigo-600 to-purple-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' }
}

/**
 * Premios page with scroll snap design
 */
export function Premios({ rows = [] }) {
  const [premios, setPremios] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showProgressIndicator, setShowProgressIndicator] = useState(true)

  // Calculate winners for each premio
  const winners = useMemo(() => {
    if (rows.length === 0) return new Map()
    return calculatePremiosWinners(rows)
  }, [rows])

  useEffect(() => {
    async function fetchPremios() {
      setLoading(true)
      const data = await loadPremios()
      setPremios(data)
      setLoading(false)
    }
    fetchPremios()
  }, [])

  // Handle scroll to update current index and show progress indicator
  useEffect(() => {
    const container = document.getElementById('premios-container')
    if (!container) return

    let inactivityTimer

    const handleScroll = () => {
      const scrollPosition = container.scrollTop
      const sectionHeight = container.clientHeight
      const index = Math.round(scrollPosition / sectionHeight)
      setCurrentIndex(Math.min(index, premios.length - 1))
      
      // Show indicator and reset timer
      setShowProgressIndicator(true)
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        setShowProgressIndicator(false)
      }, 3000) // Hide after 3 seconds of inactivity
    }

    // Initial calculation
    handleScroll()
    
    container.addEventListener('scroll', handleScroll)
    
    // Set initial timer
    inactivityTimer = setTimeout(() => {
      setShowProgressIndicator(false)
    }, 3000)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(inactivityTimer)
    }
  }, [premios])

  if (loading) {
    return <LoadingState message="Cargando premios..." />
  }

  if (premios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-400 text-lg">No se encontraron premios</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Progress indicator */}
      <div className={`fixed top-1/2 -translate-y-1/2 right-2 sm:right-4 z-50 hidden lg:block transition-opacity duration-500 ${showProgressIndicator ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-1.5 border border-slate-700/50 shadow-xl">
          <div className="text-[10px] text-slate-400 mb-1 text-center font-semibold">
            {currentIndex + 1} / {premios.length}
          </div>
          <div className="flex flex-col gap-0.5">
            {premios.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-4 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-indigo-500 scale-110 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-600/50 hover:bg-slate-500/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator - Aligned with progress bar */}
      {currentIndex < premios.length - 1 && (
        <div className={`fixed top-1/2 -translate-y-1/2 right-12 sm:right-16 z-50 hidden lg:block transition-opacity duration-500 ${showProgressIndicator ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center gap-1 text-slate-400 animate-bounce">
            <span className="text-xs font-medium">↓ Ver siguiente premio</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      )}

      {/* Scroll container with snap */}
      <div
        id="premios-container"
        className="overflow-y-scroll snap-y snap-mandatory h-full"
        style={{ 
          scrollBehavior: 'smooth',
          scrollSnapType: 'y mandatory'
        }}
      >
        {premios.map((premio, index) => {
          const categoryStyle = getCategoryStyle(premio.categoria)
          
          return (
            <section
              key={index}
              className="snap-start snap-always flex items-center justify-center px-3 sm:px-4 lg:px-6 xl:px-8 relative"
              style={{ 
                height: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always'
              }}
            >
              {/* Background gradient - static, changes only when premio changes */}
              <div className={`absolute inset-0 bg-gradient-to-br ${categoryStyle.color} opacity-10 transition-colors duration-500`} />
              
              {/* Decorative elements - static */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/3 rounded-full blur-3xl" />
              </div>

              {/* Main content card */}
              <div className={`relative z-10 w-full max-w-3xl mx-auto ${categoryStyle.bgColor} backdrop-blur-sm rounded-2xl border ${categoryStyle.borderColor} p-3 sm:p-4 md:p-5 lg:p-6 shadow-2xl transform transition-all duration-500 animate-fade-in`}>
                {/* Category badge */}
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${categoryStyle.color} text-white text-xs font-semibold shadow-lg`}>
                    <span className="text-base">{categoryStyle.icon}</span>
                    <span>{premio.categoria}</span>
                  </div>
                </div>

                {/* Premio title */}
                <div className="text-center mb-3 sm:mb-4 lg:mb-5">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg leading-tight">
                    {premio.premio}
                  </h2>
                  <div className="mt-1.5 sm:mt-2 lg:mt-2.5 h-0.5 w-16 sm:w-20 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                </div>

                {/* Winner information */}
                {(() => {
                  const winner = winners.get(premio.premio)
                  if (!winner) {
                    return (
                      <div className="border-t border-slate-700/50 pt-3 sm:pt-4">
                        <div className="text-center py-4 sm:py-5">
                          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs sm:text-sm text-slate-300">No hay datos disponibles aún</span>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="border-t border-slate-700/50 pt-3 sm:pt-4 lg:pt-5">
                      {/* Winner box - Premium design */}
                      <div className="relative bg-gradient-to-br from-amber-600/30 via-orange-500/25 to-amber-500/30 rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border-2 border-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.3),0_0_60px_rgba(251,191,36,0.15)] backdrop-blur-sm">
                        {/* Decorative glow effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 blur-xl -z-10" />
                        
                        {/* Title block - Épico */}
                        <div className="text-center mb-3 sm:mb-4 lg:mb-5">
                          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent drop-shadow-lg tracking-wide">
                            🏆 Campeón Absoluto 🏆
                          </h3>
                        </div>

                        {/* Player block - HERO */}
                        {winner.player && (
                          <div className="text-center mb-3 sm:mb-4 lg:mb-5">
                            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-1.5 sm:mb-2 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)] tracking-tight">
                              {winner.player}
                            </div>
                            {(winner.hero || winner.role) && (
                              <div className="flex flex-col items-center gap-0.5 mt-1.5 sm:mt-2">
                                {winner.hero && (
                                  <div className="text-sm sm:text-base md:text-lg lg:text-xl text-amber-200/90 font-semibold">
                                    {winner.hero}
                                  </div>
                                )}
                                {winner.role && (
                                  <div className="text-xs sm:text-sm text-amber-300/70 italic">
                                    {winner.role}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Match info - Secondary */}
                            {winner.match && (
                              <div className="mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 border-t border-amber-400/30">
                                <div className="text-xs text-amber-200/70">
                                  Partida: {winner.match.map || 'N/A'}
                                </div>
                                {winner.match.date && (
                                  <div className="text-xs text-amber-200/60 mt-0.5">
                                    {(() => {
                                      try {
                                        const date = new Date(winner.match.date)
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleDateString('es-ES', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          })
                                        }
                                        return winner.match.date
                                      } catch {
                                        return winner.match.date
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Match winner (for partida-based premios without specific player) */}
                        {winner.match && !winner.player && (
                          <div className="text-center mb-3 sm:mb-4 lg:mb-5">
                            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white mb-1.5 sm:mb-2 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]">
                              {winner.match.map || 'Partida'}
                            </div>
                            {winner.match.date && (
                              <div className="text-xs sm:text-sm md:text-base text-amber-200/90 mb-1.5 sm:mb-2">
                                {(() => {
                                  try {
                                    const date = new Date(winner.match.date)
                                    if (!isNaN(date.getTime())) {
                                      return date.toLocaleDateString('es-ES', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })
                                    }
                                    return winner.match.date
                                  } catch {
                                    return winner.match.date
                                  }
                                })()}
                              </div>
                            )}
                            {winner.match.players && winner.match.players.length > 0 && (
                              <div className="text-xs sm:text-sm text-amber-200/70 mt-2 sm:mt-3">
                                <div className="font-semibold mb-1">Jugadores participantes:</div>
                                <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
                                  {winner.match.players.map((player, idx) => (
                                    <span key={idx} className="px-1.5 sm:px-2 py-0.5 bg-amber-500/20 rounded-lg border border-amber-500/30 text-xs">
                                      {player}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metric block - Semántico */}
                        <div className="text-center mt-3 sm:mt-4 lg:mt-5 pt-3 sm:pt-4 lg:pt-5 border-t-2 border-amber-400/40">
                          <div className="mb-1.5 sm:mb-2">
                            <span className="text-xs sm:text-sm text-amber-200/80 font-semibold uppercase tracking-wider">
                              {winner.matches ? 'Promedio por partida' : 'Total registrado'}
                            </span>
                          </div>
                          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-2 sm:mb-3 drop-shadow-[0_2px_12px_rgba(251,191,36,0.4)]">
                            {winner.formattedValue}
                          </div>
                          
                          {/* Secondary metrics */}
                          <div className="flex flex-col gap-1 sm:gap-1.5 mt-3 sm:mt-4 text-xs">
                            {winner.matches && (
                              <div className="text-slate-300/80">
                                Basado en {winner.matches} partida{winner.matches !== 1 ? 's' : ''}
                              </div>
                            )}
                            {winner.impact !== undefined && (
                              <div className="text-slate-300/80">
                                Impacto promedio: {formatNumber(winner.impact)} (Kills + Asistencias por partida)
                              </div>
                            )}
                            {winner.ratio && (
                              <div className="text-slate-400/70">
                                Ratio daño/impacto: {formatNumber(winner.ratio)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* What it recognizes - Moved to bottom, smaller */}
                <div className="mt-3 sm:mt-4 lg:mt-5 pt-3 sm:pt-4 border-t border-slate-700/50">
                  <div className="flex items-start gap-1 sm:gap-1.5">
                    <div className="mt-0.5 shrink-0">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-indigo-300/80 mb-0.5">¿Qué reconoce exactamente?</h3>
                      <p className="text-xs text-slate-300/70 leading-snug">
                        {premio.queReconoce}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed description - Moved to bottom, smaller */}
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-700/40">
                  <div className="flex items-start gap-1 sm:gap-1.5">
                    <div className="mt-0.5 shrink-0">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-purple-300/80 mb-0.5">Descripción detallada</h3>
                      <p className="text-xs text-slate-300/70 leading-snug">
                        {premio.descripcion}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Page number */}
              <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 right-4 sm:right-6 lg:right-8 text-slate-500 text-xs sm:text-sm font-medium z-30 pointer-events-none">
                {index + 1} / {premios.length}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
