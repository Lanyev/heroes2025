import { useState } from 'react'
import { formatMetricValue, getMetricDisplayName } from '../../data/loadAwardsForPresentation'
import { getHeroImageSrc } from '../../utils/heroImage'

/**
 * Helper para detectar si un premio es de "Partida más corta" o "Partida más larga"
 */
export function isDurationMatchAward(awardTitle) {
  if (!awardTitle) return false
  const titleLower = awardTitle.toLowerCase()
  return titleLower.includes('partida más corta') || 
         titleLower.includes('partida mas corta') ||
         titleLower.includes('partida más larga') ||
         titleLower.includes('partida mas larga')
}

/**
 * Normaliza GameTime para usar como key de agrupación
 */
function normalizeGameTime(gameTime) {
  if (!gameTime) return ''
  return String(gameTime).trim().replace(/\s+/g, ' ')
}

/**
 * Agrupa las filas por misma partida (GameTime + FileName si existe)
 */
function groupMatchRows(rows) {
  const groups = new Map()
  const groupOrder = [] // Para mantener el orden de primera aparición

  for (const row of rows) {
    const gameTime = normalizeGameTime(row.GameTime)
    const fileName = row.FileName ? String(row.FileName).trim() : null
    
    // Crear key de grupo
    const groupKey = fileName 
      ? `${fileName}__${gameTime}`
      : gameTime

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupKey,
        gameTime: row.GameTime || gameTime, // Usar el original para display
        rows: [],
        displayParticipants: []
      })
      groupOrder.push(groupKey)
    }

    const group = groups.get(groupKey)
    group.rows.push(row)
    group.displayParticipants.push({
      player: row.PlayerName || '',
      hero: row.HeroName || ''
    })
  }

  // Retornar grupos en el orden de primera aparición
  return groupOrder.map(key => groups.get(key))
}

/**
 * Card para un grupo de participantes (misma partida)
 */
function GroupedMatchCard({ group, position, isRevealed, revealDelay }) {
  const [imageErrors, setImageErrors] = useState(new Set())
  const [imagesLoaded, setImagesLoaded] = useState(new Set())
  
  const handleImageError = (heroName) => {
    setImageErrors(prev => new Set(prev).add(heroName))
  }
  
  const handleImageLoad = (heroName) => {
    setImagesLoaded(prev => new Set(prev).add(heroName))
  }

  // Badge con medalla para top 3
  const badges = {
    1: { emoji: '🥇', bg: 'bg-gradient-to-br from-amber-400 to-amber-600' },
    2: { emoji: '🥈', bg: 'bg-gradient-to-br from-slate-300 to-slate-500' },
    3: { emoji: '🥉', bg: 'bg-gradient-to-br from-amber-600 to-amber-800' },
    4: { emoji: '#4', bg: 'bg-slate-700' },
    5: { emoji: '#5', bg: 'bg-slate-700' }
  }
  
  const badge = badges[position] || badges[5]

  // Determinar Winner (si es consistente en el grupo)
  const winners = group.rows.map(r => r.Winner).filter(Boolean)
  const uniqueWinners = [...new Set(winners)]
  const winnerDisplay = uniqueWinners.length === 1 
    ? uniqueWinners[0] 
    : uniqueWinners.length > 1 
      ? 'Mixed' 
      : null

  // Estilos según posición
  const containerClass = position <= 3 ? 'col-span-4' : 'col-span-6'
  const cardHeightClass = position <= 3 ? 'max-h-[42vh]' : 'max-h-[32vh]'
  const avatarSize = position === 1 ? 'w-14 h-14' : 'w-12 h-12'
  const valueSize = position === 1 ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'

  const glowStyles = {
    1: 'shadow-2xl shadow-amber-500/30',
    2: 'shadow-xl shadow-slate-400/20',
    3: 'shadow-xl shadow-amber-700/20',
    4: 'shadow-lg shadow-slate-600/10',
    5: 'shadow-lg shadow-slate-600/10'
  }

  const bgStyles = {
    1: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
    2: 'from-slate-400/15 via-slate-500/10 to-slate-400/15',
    3: 'from-amber-700/15 via-amber-800/10 to-amber-700/15',
    4: 'from-slate-700/15 via-slate-800/10 to-slate-700/15',
    5: 'from-slate-700/15 via-slate-800/10 to-slate-700/15'
  }

  const borderStyles = {
    1: 'border-amber-500/50',
    2: 'border-slate-400/40',
    3: 'border-amber-700/40',
    4: 'border-slate-600/30',
    5: 'border-slate-600/30'
  }

  return (
    <div 
      className={`
        ${containerClass}
        transition-all duration-500 ease-out
        ${isRevealed 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
        }
      `}
      style={{ 
        transitionDelay: isRevealed ? `${revealDelay}ms` : '0ms'
      }}
    >
      <div 
        className={`
          relative rounded-2xl border backdrop-blur-sm
          bg-gradient-to-br ${bgStyles[position]} ${borderStyles[position]} ${glowStyles[position]}
          ${cardHeightClass} h-full overflow-hidden
          p-4 md:p-6
          flex flex-col min-h-0
          ${position === 1 ? 'animate-pulse-subtle' : ''}
        `}
      >
        {/* Position badge */}
        <div 
          className={`
            absolute -top-3 -left-3 w-12 h-12 rounded-full
            ${badge.bg} flex items-center justify-center
            font-bold text-white shadow-lg text-2xl
            ${position <= 3 ? '' : 'text-sm'}
          `}
        >
          {position <= 3 ? badge.emoji : position}
        </div>

        {/* Header fijo: GameTime + Winner */}
        <div className="shrink-0 flex flex-col items-center text-center gap-2 mb-3">
          <div className={`${valueSize} font-mono font-bold text-indigo-400`}>
            {formatMetricValue(group.gameTime, 'GameTime')}
          </div>
          {winnerDisplay && (
            <div className="text-xs md:text-sm">
              {winnerDisplay === 'Mixed' ? (
                <span className="text-slate-400">Resultado mixto</span>
              ) : (
                <span className={winnerDisplay === 'Yes' ? 'text-green-400' : 'text-red-400/60'}>
                  {winnerDisplay === 'Yes' ? '✓ Victoria' : '✗ Derrota'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Lista de participantes scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-2">
            {group.displayParticipants.map((participant, idx) => {
              const heroImageSrc = getHeroImageSrc(participant.hero)
              const imageError = imageErrors.has(participant.hero)
              const imageLoaded = imagesLoaded.has(participant.hero)
              
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 w-full min-w-0"
                >
                  {/* Hero avatar - tamaño consistente */}
                  <div 
                    className={`
                      ${avatarSize} rounded-full overflow-hidden
                      bg-slate-800 border-2 ${borderStyles[position]}
                      flex items-center justify-center shrink-0 flex-shrink-0
                    `}
                  >
                    {!imageError && heroImageSrc ? (
                      <img 
                        src={heroImageSrc}
                        alt={participant.hero}
                        className={`
                          w-full h-full object-cover
                          transition-opacity duration-300
                          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                        `}
                        onLoad={() => handleImageLoad(participant.hero)}
                        onError={() => handleImageError(participant.hero)}
                      />
                    ) : (
                      <span className="text-lg">⚔️</span>
                    )}
                  </div>

                  {/* Player y Hero name */}
                  <div className="flex-1 text-left min-w-0 overflow-x-auto overflow-y-hidden">
                    <div className="text-sm md:text-base font-semibold text-white whitespace-nowrap">
                      {participant.player}
                    </div>
                    <div className="text-xs md:text-sm opacity-80 text-slate-400 mt-0.5 whitespace-nowrap">
                      {participant.hero}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Shine effect for #1 */}
        {position === 1 && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 animate-shimmer opacity-30" />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Slide del podio especial para premios de "Partida más corta/larga"
 * Con layout de 12 columnas y alturas controladas
 */
export function GroupedMatchPodiumSlide({ award, revealStep, isVisible }) {
  // Agrupar filas por misma partida
  const groups = groupMatchRows(award.rows)
  const displayItems = groups.slice(0, 5) // Top 5 grupos
  const maxReveal = Math.min(5, displayItems.length)
  
  // Orden de revelado: 5, 4, 3, 2, 1 (de peor a mejor)
  const getIsRevealed = (position) => {
    const revealAtStep = maxReveal - position + 1
    return revealStep >= revealAtStep
  }

  const getRevealDelay = (position) => {
    return 0
  }

  return (
    <div 
      className={`
        absolute inset-0 flex flex-col items-center justify-center p-8
        transition-all duration-500 ease-out
        ${isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-105 pointer-events-none'
        }
      `}
    >
      {/* Header */}
      <div className="text-center mb-8 z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-5xl md:text-6xl">{award.icon}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {award.title}
          </h2>
        </div>
        <p className="text-slate-400 text-lg md:text-xl">
          {getMetricDisplayName(award.metricKey)} • Top {displayItems.length}
        </p>
      </div>

      {/* Podium grid - Layout especial de 12 columnas */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
        {/* Top 3: #2, #1, #3 */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {displayItems[1] && (
            <GroupedMatchCard 
              group={displayItems[1]} 
              position={2} 
              isRevealed={getIsRevealed(2)}
              revealDelay={getRevealDelay(2)}
            />
          )}
          
          {displayItems[0] && (
            <GroupedMatchCard 
              group={displayItems[0]} 
              position={1} 
              isRevealed={getIsRevealed(1)}
              revealDelay={getRevealDelay(1)}
            />
          )}
          
          {displayItems[2] && (
            <GroupedMatchCard 
              group={displayItems[2]} 
              position={3} 
              isRevealed={getIsRevealed(3)}
              revealDelay={getRevealDelay(3)}
            />
          )}
        </div>

        {/* Posiciones 4 y 5 en fila separada */}
        {displayItems.length > 3 && (
          <div className="grid grid-cols-12 gap-4 md:gap-6 mt-4 md:mt-6">
            {displayItems[3] && (
              <GroupedMatchCard 
                group={displayItems[3]} 
                position={4} 
                isRevealed={getIsRevealed(4)}
                revealDelay={getRevealDelay(4)}
              />
            )}
            {displayItems[4] && (
              <GroupedMatchCard 
                group={displayItems[4]} 
                position={5} 
                isRevealed={getIsRevealed(5)}
                revealDelay={getRevealDelay(5)}
              />
            )}
          </div>
        )}
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)' }}
        />
      </div>
    </div>
  )
}
