import { useState, useEffect, useCallback } from 'react'
import { loadAwardsForPresentation } from '../data/loadAwardsForPresentation'
import { 
  ProgressBar, 
  PresentationControls, 
  AwardIntroSlide, 
  AwardPodiumSlide,
  AwardVideoIntro
} from '../components/presentation'
import { LoadingState } from '../components/LoadingState'

/**
 * Mapeo de premios a sus videos correspondientes
 */
const AWARD_VIDEO_MAP = {
  'Top Kills': '/video/top_kills.mp4',
  'Top Hero Damage': '/video/top_damage.mp4',
  'Top Deaths': '/video/top_deaths.mp4',
  'Top Siege Damage': '/video/top_siege.mp4',
  'Top Assists': '/video/top_assists.mp4',
  'Top Time Death': '/video/top_time_death.mp4',
  'Partida mas Corta': '/video/short_match.mp4',
  'Partida mas Larga': '/video/longest_match.mp4',
  'Top Tank Damage': '/video/top_tank.mp4',
  'Top Capturas Mercenarios': '/video/top_mercenaries.mp4',
  'Top Kills W/Healer': '/video/top_kills_whealer.mp4',
  'Less Tank Damage': '/video/less_tank.mp4',
  'Top Globitos': '/video/top_globes.mp4',
  'Top Time OnFire': '/video/top_onfire.mp4',
  'Top Damage W/Healer': '/video/top_damage_whealer.mp4',
  'Top Healing': '/video/top_healing.mp4',
  'Top Self Healing': '/video/top_selfhealing.mp4',
  'Top Exp': '/video/top_exp.mp4',
  'Top Minion Killer': '/video/top_minion.mp4'
}

/**
 * Helper: Determina si un premio tiene video asignado
 */
function hasVideo(award) {
  if (!award) return false
  // Si getVideoSrc devuelve algo, entonces tiene video
  return getVideoSrc(award) !== null
}

/**
 * Helper: Obtiene la ruta del video para un premio
 */
function getVideoSrc(award) {
  if (!award) return null
  const title = award.title || ''
  const id = award.id || ''
  
  // Primero verificar mapeo exacto por título
  if (AWARD_VIDEO_MAP[title]) {
    return AWARD_VIDEO_MAP[title]
  }
  
  // Luego verificar por coincidencias parciales (case-insensitive)
  const titleLower = title.toLowerCase()
  const idLower = id.toLowerCase()
  
  // Mapeo de patrones a videos
  const patterns = [
    { match: ['top kills', 'top-kills'], exclude: ['healer'], video: '/video/top_kills.mp4' },
    { match: ['top hero damage', 'top-hero-damage'], video: '/video/top_damage.mp4' },
    { match: ['top deaths', 'top-deaths'], video: '/video/top_deaths.mp4' },
    { match: ['top siege damage', 'top-siege-damage'], video: '/video/top_siege.mp4' },
    { match: ['top assists', 'top-assists'], video: '/video/top_assists.mp4' },
    { match: ['top time death', 'top-time-death'], video: '/video/top_time_death.mp4' },
    { match: ['partida mas corta', 'partida-mas-corta'], video: '/video/short_match.mp4' },
    { match: ['partida mas larga', 'partida-mas-larga'], video: '/video/longest_match.mp4' },
    { match: ['top tank damage', 'top-tank-damage'], video: '/video/top_tank.mp4' },
    { match: ['top capturas mercenarios', 'top-capturas-mercenarios'], video: '/video/top_mercenaries.mp4' },
    { match: ['top kills w/healer', 'top-kills-w-healer'], video: '/video/top_kills_whealer.mp4' },
    { match: ['top damage w/healer', 'top-damage-w-healer'], video: '/video/top_damage_whealer.mp4' },
    { match: ['less tank damage', 'less-tank-damage'], video: '/video/less_tank.mp4' },
    { match: ['top globitos', 'top-globitos'], video: '/video/top_globes.mp4' },
    { match: ['top time onfire', 'top-time-onfire'], video: '/video/top_onfire.mp4' },
    { match: ['top healing', 'top-healing'], video: '/video/top_healing.mp4' },
    { match: ['top self healing', 'top-self-healing'], video: '/video/top_selfhealing.mp4' },
    { match: ['top exp', 'top-exp'], video: '/video/top_exp.mp4' },
    { match: ['top minion killer', 'top-minion-killer'], video: '/video/top_minion.mp4' }
  ]
  
  for (const pattern of patterns) {
    const matches = pattern.match.some(p => 
      titleLower.includes(p) || idLower.includes(p)
    )
    const excludes = pattern.exclude?.some(p => 
      titleLower.includes(p) || idLower.includes(p)
    ) || false
    
    if (matches && !excludes) {
      return pattern.video
    }
  }
  
  return null
}

/**
 * Helper: Determina la fase inicial de un premio
 */
function getInitialPhase(award) {
  return hasVideo(award) ? 'video' : 'text'
}

/**
 * Página de presentación cinematográfica de premios
 * Fullscreen, sin navbar/footer
 */
export function Presentation({ onExit }) {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estado de navegación
  const [awardIndex, setAwardIndex] = useState(0)
  const [awardPhase, setAwardPhase] = useState('text') // "video" | "text" | "podium"
  const [videoStarted, setVideoStarted] = useState(false)
  const [revealStep, setRevealStep] = useState(0)

  // Cargar datos
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await loadAwardsForPresentation()
        if (data.length === 0) {
          throw new Error('No se encontraron premios en el CSV')
        }
        setAwards(data)
        setError(null)
      } catch (err) {
        console.error('Error loading presentation data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Bloquear scroll del body
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  // Calcular maxReveal para el premio actual
  const currentAward = awards[awardIndex]
  const maxReveal = currentAward ? Math.min(5, currentAward.rows.length) : 0

  // Resetear fase cuando cambia el premio
  useEffect(() => {
    if (currentAward) {
      const initialPhase = getInitialPhase(currentAward)
      setAwardPhase(initialPhase)
      setVideoStarted(false)
      setRevealStep(0)
    }
  }, [awardIndex, currentAward])

  // Navegación: Next
  const handleNext = useCallback(() => {
    if (awardPhase === 'video') {
      // En fase video: solo avanzar si el video ya comenzó
      if (videoStarted) {
        setAwardPhase('text')
      }
      // Si no ha comenzado, no avanzar (obligar Play)
    } else if (awardPhase === 'text') {
      // De texto a podio
      setAwardPhase('podium')
      setRevealStep(1) // Empezar mostrando el #5 (o último disponible)
    } else {
      // En podio: avanzar reveal o siguiente premio
      if (revealStep < maxReveal) {
        setRevealStep(prev => prev + 1)
      } else {
        // Ya reveló todo, ir al siguiente premio
        if (awardIndex < awards.length - 1) {
          setAwardIndex(prev => prev + 1)
          // El useEffect reseteará awardPhase automáticamente
        }
      }
    }
  }, [awardPhase, videoStarted, revealStep, maxReveal, awardIndex, awards.length])

  // Navegación: Prev
  const handlePrev = useCallback(() => {
    if (awardPhase === 'podium') {
      // En podio: volver a texto
      if (revealStep > 1) {
        // Retroceder reveal
        setRevealStep(prev => prev - 1)
      } else {
        // Volver a texto del mismo premio
        setAwardPhase('text')
        setRevealStep(0)
      }
    } else if (awardPhase === 'text') {
      // En texto: si tiene video, volver a video; si no, premio anterior
      if (hasVideo(currentAward)) {
        setAwardPhase('video')
        setVideoStarted(false)
      } else {
        // Ir al premio anterior
        if (awardIndex > 0) {
          const prevAward = awards[awardIndex - 1]
          const prevMaxReveal = Math.min(5, prevAward.rows.length)
          setAwardIndex(prev => prev - 1)
          setAwardPhase('podium')
          setRevealStep(prevMaxReveal) // Mostrar todo revelado
        }
      }
    } else {
      // En video: ir al premio anterior
      if (awardIndex > 0) {
        const prevAward = awards[awardIndex - 1]
        const prevMaxReveal = Math.min(5, prevAward.rows.length)
        setAwardIndex(prev => prev - 1)
        setAwardPhase('podium')
        setRevealStep(prevMaxReveal) // Mostrar todo revelado
      }
    }
  }, [awardPhase, revealStep, awardIndex, awards, currentAward])

  // Reiniciar
  const handleRestart = useCallback(() => {
    setAwardIndex(0)
    setAwardPhase('text')
    setVideoStarted(false)
    setRevealStep(0)
  }, [])

  // Callback cuando el video comienza
  const handleVideoStarted = useCallback(() => {
    setVideoStarted(true)
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          handleNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlePrev()
          break
        case 'Escape':
          e.preventDefault()
          onExit()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          handleRestart()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, handleRestart, onExit])

  // Validar navegación
  const canGoPrev = awardIndex > 0 || awardPhase !== 'video' || revealStep > 1
  const canGoNext = awardIndex < awards.length - 1 || 
                    (awardPhase === 'video' && videoStarted) || 
                    awardPhase === 'text' || 
                    revealStep < maxReveal

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
        <LoadingState message="Preparando presentación..." />
      </div>
    )
  }

  if (error || awards.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-slate-400 mb-4">
            {error || 'No se encontraron premios'}
          </p>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 overflow-hidden">
      {/* Background base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-float" />
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Progress bar */}
      <ProgressBar
        awardIndex={awardIndex}
        totalAwards={awards.length}
        slideIndex={awardPhase === 'podium' ? 1 : 0}
        revealStep={revealStep}
        maxReveal={maxReveal}
      />

      {/* Slides container */}
      <div className="relative w-full h-full">
        {currentAward && (
          <>
            {/* Video intro (solo si tiene video y está en fase video) */}
            {hasVideo(currentAward) && (
              <AwardVideoIntro
                videoSrc={getVideoSrc(currentAward)}
                isVisible={awardPhase === 'video'}
                onVideoStarted={handleVideoStarted}
              />
            )}
            
            {/* Intro texto */}
            <AwardIntroSlide 
              award={currentAward} 
              isVisible={awardPhase === 'text'}
            />
            
            {/* Podio */}
            <AwardPodiumSlide 
              award={currentAward} 
              revealStep={revealStep}
              isVisible={awardPhase === 'podium'}
            />
          </>
        )}
      </div>

      {/* Controls */}
      <PresentationControls
        onPrev={handlePrev}
        onNext={handleNext}
        onRestart={handleRestart}
        onExit={onExit}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        awardIndex={awardIndex}
        totalAwards={awards.length}
      />

      {/* Keyboard hints (hidden on mobile) */}
      <div className="hidden md:flex fixed bottom-6 left-6 items-center gap-4 text-slate-600 text-xs">
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">→</kbd>
          <span className="ml-1">Navegar</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">R</kbd>
          <span className="ml-1">Reiniciar</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Esc</kbd>
          <span className="ml-1">Salir</span>
        </div>
      </div>
    </div>
  )
}
