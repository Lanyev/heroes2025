/**
 * Componente Emote - Renderiza emotes desde imágenes PNG
 * Mapea emojis Unicode a sus imágenes correspondientes en public/emotes/
 */

/**
 * Mapeo de emojis a sus imágenes PNG correspondientes
 */
const EMOJI_TO_IMAGE = {
  // Emotes principales (15 originales)
  '❤️': '/emotes/curacion.png',
  '💚': '/emotes/curacion.png', // Corazón verde (Support/Healing)
  '💥': '/emotes/explosion.png',
  '🔥': '/emotes/fire.png',
  '⚔️': '/emotes/swords-power.png',
  '⚡': '/emotes/velocidad.png',
  '🛡️': '/emotes/shield.png',
  '⭐': '/emotes/star-formation.png',
  '🏆': '/emotes/trofeo.png',
  '🗡️': '/emotes/swords-power.png', // Espada (Kills/Assassin)
  '🎯': '/emotes/objetives.png',
  '🔮': '/emotes/star-formation.png', // Bola de cristal (Macro/Psychic)
  '🏰': '/emotes/stone-wall.png', // Castillo (Siege/Structures)
  '🥇': '/emotes/podium-winner.png',
  '🥈': '/emotes/podium-second.png',
  '🥉': '/emotes/podium-third.png',
  '#4': '/emotes/4place.png',
  '#5': '/emotes/5place.png',
  
  // Emotes nuevos agregados (11 faltantes)
  '🎮': '/emotes/console-controller.png', // Control de videojuegos (Partidas)
  '📊': '/emotes/notebook.png', // Gráfico de barras (Estadísticas)
  '📈': '/emotes/wax-tablet.png', // Gráfico creciente (Experiencia)
  '👤': '/emotes/warlord-helmet.png', // Persona (Jugadores)
  '🗺️': '/emotes/maze.png', // Mapa (Mapas)
  '🎖️': '/emotes/medal.png', // Medalla (Premios)
  '💀': '/emotes/broken-skull.png', // Calavera (Muertes)
  '☠️': '/emotes/death-skull.png', // Calavera y tibias (Top Deaths)
  '⏳': '/emotes/sands-of-time.png', // Reloj de arena (Duración) - sands-of-time.png
  '\u23F3': '/emotes/sands-of-time.png', // Reloj de arena (código Unicode U+23F3)
  '⏱️': '/emotes/clockwork.png', // Cronómetro (Tiempo) - clockwork.png
  '\u23F1\uFE0F': '/emotes/clockwork.png', // Cronómetro con selector (U+23F1 U+FE0F)
  '\u23F1': '/emotes/clockwork.png', // Cronómetro sin selector (U+23F1)
  '🤝': '/emotes/three-friends.png', // Apretón de manos (Asistencias)
  '🧱': '/emotes/stone-wall.png', // Ladrillo (Raid Boss)
  
  // Emojis adicionales con fallback
  '😢': '/emotes/curacion.png', // Fallback
  '⚠️': '/emotes/shield.png', // Fallback
  '🔍': '/emotes/objetives.png', // Fallback
}

/**
 * Componente Emote
 * @param {string} emoji - El emoji a renderizar (se mapea a su imagen PNG)
 * @param {string} className - Clases CSS adicionales
 * @param {string|number} size - Tamaño del emote ('sm', 'md', 'lg', 'xl' o número en px)
 */
export function Emote({ emoji, className = '', size = 'md' }) {
  if (!emoji) return null
  
  // Casos especiales: renderizar directamente las imágenes PNG para emojis problemáticos
  if (emoji === '⏳' || emoji === '\u23F3' || emoji.trim() === '⏳') {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    }
    const sizeStyle = typeof size === 'number' 
      ? { width: `${size}px`, height: `${size}px` }
      : {}
    const sizeClass = typeof size === 'number' ? '' : sizeClasses[size] || sizeClasses.md
    
    return (
      <img
        src="/emotes/sands-of-time.png"
        alt="⏳"
        className={`inline-block ${sizeClass} ${className}`}
        style={{
          objectFit: 'contain',
          imageRendering: 'crisp-edges',
          ...sizeStyle
        }}
        role="img"
        aria-label="⏳"
      />
    )
  }
  
  if (emoji === '⏱️' || emoji === '\u23F1' || emoji === '\u23F1\uFE0F' || emoji.replace(/\uFE0F/g, '') === '\u23F1') {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    }
    const sizeStyle = typeof size === 'number' 
      ? { width: `${size}px`, height: `${size}px` }
      : {}
    const sizeClass = typeof size === 'number' ? '' : sizeClasses[size] || sizeClasses.md
    
    return (
      <img
        src="/emotes/clockwork.png"
        alt="⏱️"
        className={`inline-block ${sizeClass} ${className}`}
        style={{
          objectFit: 'contain',
          imageRendering: 'crisp-edges',
          ...sizeStyle
        }}
        role="img"
        aria-label="⏱️"
      />
    )
  }
  
  // Normalizar el emoji removiendo variantes de presentación (FE0F) para mejor compatibilidad
  const normalizedEmoji = emoji.replace(/\uFE0F/g, '')
  
  // También crear versiones sin espacios y limpias
  const cleanEmoji = emoji.trim()
  const cleanNormalized = normalizedEmoji.trim()
  
  // Obtener la ruta de la imagen, intentar múltiples variantes
  const imageSrc = EMOJI_TO_IMAGE[emoji] || 
                   EMOJI_TO_IMAGE[normalizedEmoji] || 
                   EMOJI_TO_IMAGE[cleanEmoji] || 
                   EMOJI_TO_IMAGE[cleanNormalized]
  
  // Si no hay imagen mapeada, renderizar el emoji como texto
  if (!imageSrc) {
    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    }
    const sizeClass = typeof size === 'number' ? '' : sizeClasses[size] || sizeClasses.md
    const sizeStyle = typeof size === 'number' ? { fontSize: `${size}px` } : {}
    
    return (
      <span 
        className={`inline-block ${sizeClass} ${className}`} 
        style={sizeStyle}
        role="img"
        aria-label={emoji}
      >
        {emoji}
      </span>
    )
  }
  
  // Tamaños predefinidos para imágenes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }
  
  // Si size es un número, usar ese tamaño en px
  const sizeStyle = typeof size === 'number' 
    ? { width: `${size}px`, height: `${size}px` }
    : {}
  
  const sizeClass = typeof size === 'number' ? '' : sizeClasses[size] || sizeClasses.md
  
  return (
    <img
      src={imageSrc}
      alt={emoji}
      className={`inline-block ${sizeClass} ${className}`}
      style={{
        objectFit: 'contain',
        imageRendering: 'crisp-edges',
        ...sizeStyle
      }}
      role="img"
      aria-label={emoji}
    />
  )
}

/**
 * Componente que renderiza texto con emojis convertidos a componentes Emote
 * @param {string} text - Texto que puede contener emojis
 * @param {string|number} emoteSize - Tamaño de los emotes
 */
export function EmoteText({ text, emoteSize = 'md', className = '' }) {
  if (!text) return null
  
  // Regex para detectar emojis Unicode
  const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu
  
  const parts = []
  let lastIndex = 0
  let match
  
  while ((match = emojiRegex.exec(text)) !== null) {
    // Agregar texto antes del emoji
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    // Agregar el emote
    parts.push(<Emote key={match.index} emoji={match[0]} size={emoteSize} />)
    lastIndex = match.index + match[0].length
  }
  
  // Agregar texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  // Si no hay emojis, devolver el texto tal cual
  if (parts.length === 0) {
    return <span className={className}>{text}</span>
  }
  
  return <span className={className}>{parts}</span>
}
