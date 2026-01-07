import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Componente de introducción con video para premios
 * Muestra un video fullscreen con botón Play centrado
 * El video solo se reproduce cuando el usuario presiona Play
 */
export function AwardVideoIntro({ videoSrc, isVisible, onVideoStarted }) {
  const videoRef = useRef(null)
  const [playButtonVisible, setPlayButtonVisible] = useState(true)

  // Resetear cuando cambia el video o se oculta
  useEffect(() => {
    if (!isVisible && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      videoRef.current.muted = true
      setPlayButtonVisible(true)
    }
  }, [isVisible])

  // Resetear cuando cambia el videoSrc
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      videoRef.current.muted = true
      setPlayButtonVisible(true)
    }
  }, [videoSrc])

  const handlePlay = () => {
    if (!videoRef.current) return

    // Resetear video al inicio
    videoRef.current.currentTime = 0
    
    // Habilitar audio
    videoRef.current.muted = false
    videoRef.current.volume = 0.7
    
    // Reproducir
    videoRef.current.play()
      .then(() => {
        // Ocultar botón Play con fade out
        setPlayButtonVisible(false)
        // Notificar al padre que el video comenzó
        if (onVideoStarted) {
          onVideoStarted()
        }
      })
      .catch((error) => {
        console.error('Error al reproducir video:', error)
      })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className={`
        absolute inset-0
        ${isVisible ? '' : 'pointer-events-none'}
      `}
    >
      {/* Video container */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          preload="metadata"
          muted={true}
          controls={false}
          className="w-full h-full object-cover"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* Overlay oscuro con gradiente cinematográfico */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />

      {/* Botón Play centrado */}
      <AnimatePresence>
        {playButtonVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <motion.button
              onClick={handlePlay}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="
                group relative
                w-24 h-24 md:w-32 md:h-32
                rounded-full
                bg-white/10 backdrop-blur-md
                border-2 border-white/30
                flex items-center justify-center
                cursor-pointer
                transition-all duration-300
                hover:bg-white/20 hover:border-white/50
                focus:outline-none focus:ring-4 focus:ring-white/30
              "
            >
              {/* Icono Play */}
              <motion.div
                initial={{ x: -2 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.2 }}
                className="
                  w-0 h-0
                  border-l-[24px] md:border-l-[32px] border-l-white
                  border-t-[16px] md:border-t-[20px] border-t-transparent
                  border-b-[16px] md:border-b-[20px] border-b-transparent
                  ml-1 md:ml-2
                "
              />
              
              {/* Texto opcional */}
              <span className="absolute -bottom-12 text-white/80 text-sm md:text-base font-medium whitespace-nowrap">
                Play intro
              </span>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
