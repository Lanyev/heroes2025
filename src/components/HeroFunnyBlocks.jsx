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
    const firstChar = title.charAt(0)
    if (!firstChar || /[a-zA-Z0-9\s]/.test(firstChar)) {
      return '📦'
    }
    
    const codePoint = title.codePointAt(0)
    if (!codePoint) return '📦'
    
    if (codePoint >= 0x1F300 && codePoint <= 0x1F9FF) {
      let emoji = String.fromCodePoint(codePoint)
      let length = codePoint > 0xFFFF ? 2 : 1
      
      if (title.length > length && title.codePointAt(length) === 0xFE0F) {
        emoji += '\uFE0F'
        length++
      }
      
      if (title.length > length) {
        const modifier = title.codePointAt(length)
        if (modifier >= 0x1F3FB && modifier <= 0x1F3FF) {
          emoji += String.fromCodePoint(modifier)
        }
      }
      
      return emoji
    }
    
    if ((codePoint >= 0x2600 && codePoint <= 0x26FF) || 
        (codePoint >= 0x2700 && codePoint <= 0x27BF) ||
        (codePoint >= 0x1F600 && codePoint <= 0x1F64F) ||
        (codePoint >= 0x1F900 && codePoint <= 0x1F9FF)) {
      return String.fromCodePoint(codePoint)
    }
    
    return firstChar
  }
  
  // Get title without emoji
  const getTitleWithoutEmoji = (title) => {
    if (!title) return ''
    
    try {
      const emojiRegex = /^[\p{Emoji}\p{Emoji_Presentation}]+\s*/u
      const withoutEmoji = title.replace(emojiRegex, '').trim()
      if (withoutEmoji !== title) {
        return withoutEmoji
      }
    } catch (e) {
      // Fallback
    }
    
    const firstChar = title.charAt(0)
    if (!firstChar || /[a-zA-Z0-9\s]/.test(firstChar)) {
      return title
    }
    
    const codePoint = title.codePointAt(0)
    if (!codePoint) return title
    
    let emojiLength = codePoint > 0xFFFF ? 2 : 1
    
    if (title.length > emojiLength && title.codePointAt(emojiLength) === 0xFE0F) {
      emojiLength++
    }
    
    if (title.length > emojiLength) {
      const modifier = title.codePointAt(emojiLength)
      if (modifier >= 0x1F3FB && modifier <= 0x1F3FF) {
        emojiLength += modifier > 0xFFFF ? 2 : 1
      }
    }
    
    return title.slice(emojiLength).trim()
  }
  
  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-3">🔥 Highlights</h3>
      <div className="space-y-3">
        {blocks.map((block, index) => {
          if (!block) return null
          
          const emoji = block.emoji || extractEmoji(block.title || '')
          const titleText = getTitleWithoutEmoji(block.title || '')
          const accent = block.accent || 'slate'
          const replayName = block.replayName || ''
          const isWinner = block.winner === true
          
          return (
            <div
              key={block.id || index}
              className={`rounded-xl border p-4 ${getGradientClasses(accent)}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                    {titleText || block.title || 'Highlight'}
                  </p>
                  <p className="text-3xl md:text-4xl font-extrabold text-white mb-1 leading-tight">
                    {block.mainValue || 'N/A'}
                  </p>
                  {block.subValue && (
                    <p className="text-slate-300/80 text-sm mb-2 opacity-90">
                      {block.subValue}
                    </p>
                  )}
                  {replayName && (
                    <p className={`text-sm font-medium mb-1 ${
                      isWinner ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {replayName}
                    </p>
                  )}
                  {block.footer && (
                    <p className="text-slate-400/70 text-sm mb-1 opacity-80">
                      {block.footer}
                    </p>
                  )}
                  {block.joke && (
                    <p className="text-slate-500/60 text-xs italic mt-2 opacity-70">
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
