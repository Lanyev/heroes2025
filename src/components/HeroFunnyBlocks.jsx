/**
 * Component to render 3 funny highlight blocks for a hero
 * @param {Object} props
 * @param {Array} props.blocks - Array of exactly 3 highlight blocks
 */
export function HeroFunnyBlocks({ blocks }) {
  if (!blocks || blocks.length === 0) return null
  
  // Map accent colors to Tailwind gradient classes
  const getGradientClasses = (accent) => {
    switch (accent) {
      case 'red':
        return 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30'
      case 'purple':
        return 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30'
      case 'amber':
        return 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/30'
      case 'teal':
        return 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-500/30'
      case 'slate':
      default:
        return 'bg-gradient-to-br from-slate-500/20 to-slate-600/20 border-slate-500/30'
    }
  }
  
  // Extract emoji from title (handles multi-character emojis)
  const extractEmoji = (title) => {
    if (!title) return '📦'
    
    // Try Unicode property escape first (modern browsers)
    try {
      const emojiRegex = /^[\p{Emoji}\p{Emoji_Presentation}]+\s*/u
      const match = title.match(emojiRegex)
      if (match) {
        return match[0].trim()
      }
    } catch (e) {
      // Fallback for browsers that don't support Unicode property escapes
    }
    
    // Fallback: extract emoji manually using code points
    // Most emojis start with high surrogate (0xD800-0xDBFF)
    const firstChar = title.charAt(0)
    if (!firstChar || /[a-zA-Z0-9\s]/.test(firstChar)) {
      return '📦'
    }
    
    // Get the code point (handles surrogate pairs)
    const codePoint = title.codePointAt(0)
    if (!codePoint) return '📦'
    
    // Check if it's in emoji range
    if (codePoint >= 0x1F300 && codePoint <= 0x1F9FF) {
      // Standard emoji range
      let emoji = String.fromCodePoint(codePoint)
      let length = codePoint > 0xFFFF ? 2 : 1
      
      // Check for variation selector (FE0F)
      if (title.length > length && title.codePointAt(length) === 0xFE0F) {
        emoji += '\uFE0F'
        length++
      }
      
      // Check for skin tone modifier (1F3FB-1F3FF)
      if (title.length > length) {
        const modifier = title.codePointAt(length)
        if (modifier >= 0x1F3FB && modifier <= 0x1F3FF) {
          emoji += String.fromCodePoint(modifier)
        }
      }
      
      return emoji
    }
    
    // Other emoji ranges (symbols, etc.)
    if ((codePoint >= 0x2600 && codePoint <= 0x26FF) || 
        (codePoint >= 0x2700 && codePoint <= 0x27BF) ||
        (codePoint >= 0x1F600 && codePoint <= 0x1F64F) ||
        (codePoint >= 0x1F900 && codePoint <= 0x1F9FF)) {
      return String.fromCodePoint(codePoint)
    }
    
    // Default: return first character
    return firstChar
  }
  
  // Get title without emoji
  const getTitleWithoutEmoji = (title) => {
    if (!title) return ''
    
    // Try Unicode property escape first
    try {
      const emojiRegex = /^[\p{Emoji}\p{Emoji_Presentation}]+\s*/u
      const withoutEmoji = title.replace(emojiRegex, '').trim()
      if (withoutEmoji !== title) {
        return withoutEmoji
      }
    } catch (e) {
      // Fallback
    }
    
    // Fallback: remove emoji manually
    const firstChar = title.charAt(0)
    if (!firstChar || /[a-zA-Z0-9\s]/.test(firstChar)) {
      return title
    }
    
    const codePoint = title.codePointAt(0)
    if (!codePoint) return title
    
    // Calculate emoji length
    let emojiLength = codePoint > 0xFFFF ? 2 : 1
    
    // Check for variation selector
    if (title.length > emojiLength && title.codePointAt(emojiLength) === 0xFE0F) {
      emojiLength++
    }
    
    // Check for skin tone modifier
    if (title.length > emojiLength) {
      const modifier = title.codePointAt(emojiLength)
      if (modifier >= 0x1F3FB && modifier <= 0x1F3FF) {
        emojiLength += modifier > 0xFFFF ? 2 : 1
      }
    }
    
    // Remove emoji and any following space
    return title.slice(emojiLength).trim()
  }
  
  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-3">🔥 Highlights Chuscos</h3>
      <div className="space-y-3">
        {blocks.map((block, index) => {
          if (!block) return null
          
          const emoji = block.emoji || extractEmoji(block.title || '')
          const titleText = getTitleWithoutEmoji(block.title || '')
          const accent = block.accent || 'slate'
          
          return (
            <div
              key={block.id || index}
              className="rounded-xl p-4 border relative overflow-hidden bg-slate-800/50"
            >
              {/* Contenedor de imagen con gradiente de máscara para difuminar lado izquierdo */}
              <div className="absolute right-0 top-0 h-full w-auto overflow-hidden pointer-events-none">
                <img 
                  src={`/highlight-images/${block.id}.jpg`}
                  alt=""
                  className="h-full w-auto object-contain object-right opacity-75"
                  onError={(e) => {
                    // Fallback si la imagen no existe: mostrar gradiente de fondo
                    e.target.style.display = 'none'
                    const parent = e.target.closest('.rounded-xl')
                    if (parent) {
                      parent.className = `${getGradientClasses(accent)} rounded-xl p-4 border relative overflow-hidden`
                    }
                  }}
                />
                {/* Gradiente overlay sobre la imagen para difuminar lado izquierdo */}
                <div 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(to left, transparent 0%, rgba(15, 23, 42, 0.3) 30%, rgba(15, 23, 42, 0.7) 60%, rgba(15, 23, 42, 0.95) 100%)'
                  }}
                />
              </div>
              {/* Overlay oscuro general sutil para mejorar legibilidad del texto */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-l from-slate-900/50 via-slate-900/20 to-transparent pointer-events-none" />
              {/* Overlay oscuro general sutil para mejorar legibilidad del texto */}
              <div className="absolute inset-0 w-full h-full bg-slate-900/20" />
              {/* Gradiente de acento sutil por encima */}
              <div className={`absolute inset-0 w-full h-full ${getGradientClasses(accent)} opacity-15`} />
              {/* Contenido de texto por encima */}
              <div className="flex items-start gap-4 relative z-10">
                <div className="text-4xl shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                    {titleText || block.title || 'Highlight'}
                  </p>
                <p className="text-2xl font-bold text-white mb-1">
                  {block.mainValue || 'N/A'}
                </p>
                {block.subValue && (
                  <p className="text-slate-300 text-sm mb-2">
                    {block.subValue}
                  </p>
                )}
                {block.footer && (
                  <p className="text-slate-400 text-sm mb-1">
                    {block.footer}
                  </p>
                )}
                {block.joke && (
                  <p className="text-slate-500 text-xs italic mt-2">
                    {block.joke}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
        })}
      </div>
    </section>
  )
}
