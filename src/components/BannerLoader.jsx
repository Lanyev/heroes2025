import { useState, useEffect, useRef } from 'react'
import { getPublicPath } from '../utils/paths'

/**
 * BannerLoader component
 * Muestra el banner.gif en pantalla negra y hace fade out cuando termina
 */
export function BannerLoader({ onComplete }) {
  const [isFading, setIsFading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const imgRef = useRef(null)
  const timeoutRef = useRef(null)

  const handleComplete = () => {
    setIsFading(true)
    setTimeout(() => {
      setIsVisible(false)
      // Restaurar el scroll del body
      document.body.style.overflow = ''
      if (onComplete) {
        onComplete()
      }
    }, 1000) // Duración del fade out
  }

  useEffect(() => {
    // Ocultar el scroll del body mientras el banner está visible
    document.body.style.overflow = 'hidden'

    // Iniciar el timer inmediatamente cuando el componente se monta
    // El tiempo total del loader debe ser exactamente 2.5 segundos (1.5s GIF + 1s fade out)
    const gifDuration = 1500 // 1.5 segundos para el GIF

    console.log('BannerLoader: Iniciando timer de', gifDuration, 'ms (tiempo total del loader: 2.5 segundos)')
    const startTime = Date.now()

    timeoutRef.current = setTimeout(() => {
      const elapsed = Date.now() - startTime
      console.log('BannerLoader: GIF completado después de', elapsed, 'ms, iniciando fade out de 1s')
      handleComplete()
    }, gifDuration)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Asegurarse de restaurar el scroll si el componente se desmonta
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  // Permitir saltar el loader con un clic
  const handleClick = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    handleComplete()
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-1000 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClick}
      style={{
        pointerEvents: isFading ? 'none' : 'auto',
        cursor: isFading ? 'default' : 'pointer'
      }}
      title="Haz clic para continuar"
    >
      <img
        ref={imgRef}
        src={getPublicPath('/banner.gif')}
        alt="Loading banner"
        className="max-w-full max-h-full object-contain pointer-events-none"
        style={{
          opacity: isFading ? 0 : 1,
          transition: 'opacity 1s ease-out'
        }}
      />
    </div>
  )
}
