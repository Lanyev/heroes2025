import { useState, useEffect } from 'react'
import { formatMetricValue, getMetricDisplayName, requiresGrouping, groupAwardRows } from '../../data/loadAwardsForPresentation'
import { getHeroImageSrc } from '../../utils/heroImage'
import { GroupedMatchPodiumSlide, isDurationMatchAward } from './GroupedMatchPodiumSlide'

/**
 * Card individual para un participante del podio
 */
function PodiumCard({ entry, position, metricKey, isRevealed, revealDelay }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const heroImageSrc = getHeroImageSrc(entry.HeroName)
  
  // Tamaños y estilos según posición (aumentados para mejor legibilidad)
  const positionStyles = {
    1: {
      container: 'col-span-2 md:col-span-1 md:row-span-2',
      card: 'p-6 md:p-8',
      avatar: 'w-28 h-28 md:w-40 md:h-40',
      name: 'text-3xl md:text-4xl',
      hero: 'text-xl md:text-2xl',
      value: 'text-4xl md:text-5xl',
      badge: 'w-12 h-12 text-2xl',
      glow: 'shadow-2xl shadow-amber-500/30',
      bg: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
      border: 'border-amber-500/50'
    },
    2: {
      container: '',
      card: 'p-4 md:p-6',
      avatar: 'w-20 h-20 md:w-24 md:h-24',
      name: 'text-xl md:text-2xl',
      hero: 'text-lg md:text-xl',
      value: 'text-2xl md:text-3xl',
      badge: 'w-10 h-10 text-xl',
      glow: 'shadow-xl shadow-slate-400/20',
      bg: 'from-slate-400/15 via-slate-500/10 to-slate-400/15',
      border: 'border-slate-400/40'
    },
    3: {
      container: '',
      card: 'p-4 md:p-6',
      avatar: 'w-20 h-20 md:w-24 md:h-24',
      name: 'text-xl md:text-2xl',
      hero: 'text-lg md:text-xl',
      value: 'text-2xl md:text-3xl',
      badge: 'w-10 h-10 text-xl',
      glow: 'shadow-xl shadow-amber-700/20',
      bg: 'from-amber-700/15 via-amber-800/10 to-amber-700/15',
      border: 'border-amber-700/40'
    },
    4: {
      container: '',
      card: 'p-3 md:p-4',
      avatar: 'w-16 h-16 md:w-20 md:h-20',
      name: 'text-lg md:text-xl',
      hero: 'text-base md:text-lg',
      value: 'text-xl md:text-2xl',
      badge: 'w-8 h-8 text-lg',
      glow: 'shadow-lg shadow-slate-600/10',
      bg: 'from-slate-700/15 via-slate-800/10 to-slate-700/15',
      border: 'border-slate-600/30'
    },
    5: {
      container: '',
      card: 'p-3 md:p-4',
      avatar: 'w-16 h-16 md:w-20 md:h-20',
      name: 'text-lg md:text-xl',
      hero: 'text-base md:text-lg',
      value: 'text-xl md:text-2xl',
      badge: 'w-8 h-8 text-lg',
      glow: 'shadow-lg shadow-slate-600/10',
      bg: 'from-slate-700/15 via-slate-800/10 to-slate-700/15',
      border: 'border-slate-600/30'
    }
  }
  
  const style = positionStyles[position] || positionStyles[5]
  const metricValue = entry[metricKey]
  
  // Badge con medalla para top 3
  const badges = {
    1: { emoji: '🥇', bg: 'bg-gradient-to-br from-amber-400 to-amber-600' },
    2: { emoji: '🥈', bg: 'bg-gradient-to-br from-slate-300 to-slate-500' },
    3: { emoji: '🥉', bg: 'bg-gradient-to-br from-amber-600 to-amber-800' },
    4: { emoji: '#4', bg: 'bg-slate-700' },
    5: { emoji: '#5', bg: 'bg-slate-700' }
  }
  
  const badge = badges[position] || badges[5]

  return (
    <div 
      className={`
        ${style.container}
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
          relative h-full rounded-2xl border backdrop-blur-sm
          bg-gradient-to-br ${style.bg} ${style.border} ${style.glow}
          ${style.card}
          ${position === 1 ? 'animate-pulse-subtle' : ''}
        `}
      >
        {/* Position badge */}
        <div 
          className={`
            absolute -top-3 -left-3 ${style.badge} rounded-full
            ${badge.bg} flex items-center justify-center
            font-bold text-white shadow-lg
            ${position <= 3 ? '' : 'text-sm'}
          `}
        >
          {position <= 3 ? badge.emoji : position}
        </div>

        <div className="flex flex-col items-center text-center gap-3">
          {/* Hero avatar */}
          <div 
            className={`
              ${style.avatar} rounded-full overflow-hidden
              bg-slate-800 border-2 ${style.border}
              flex items-center justify-center
            `}
          >
            {!imageError && heroImageSrc ? (
              <img 
                src={heroImageSrc}
                alt={entry.HeroName}
                className={`
                  w-full h-full object-cover
                  transition-opacity duration-300
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-2xl md:text-3xl">⚔️</span>
            )}
          </div>

          {/* Player name */}
          <h3 className={`${style.name} font-bold text-white`}>
            {entry.PlayerName}
          </h3>

          {/* Hero name */}
          <p className={`${style.hero} text-slate-400`}>
            {entry.HeroName}
          </p>

          {/* Metric value */}
          <div className={`${style.value} font-mono font-bold text-indigo-400`}>
            {formatMetricValue(metricValue, metricKey)}
          </div>

          {/* Game info */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {entry.GameTime && (
              <span className="font-mono">{entry.GameTime}</span>
            )}
            {entry.Winner && (
              <span className={entry.Winner === 'Yes' ? 'text-green-400' : 'text-red-400/60'}>
                {entry.Winner === 'Yes' ? '✓ Victoria' : '✗ Derrota'}
              </span>
            )}
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
 * Card para un grupo de participantes (misma partida)
 */
function PodiumCardGroup({ group, position, metricKey, isRevealed, revealDelay }) {
  const [imageErrors, setImageErrors] = useState(new Set())
  const [imagesLoaded, setImagesLoaded] = useState(new Set())
  
  const handleImageError = (heroName) => {
    setImageErrors(prev => new Set(prev).add(heroName))
  }
  
  const handleImageLoad = (heroName) => {
    setImagesLoaded(prev => new Set(prev).add(heroName))
  }

  // Tamaños y estilos según posición (aumentados)
  const positionStyles = {
    1: {
      container: 'col-span-2 md:col-span-1 md:row-span-2',
      card: 'p-6 md:p-8',
      participantAvatar: 'w-16 h-16 md:w-20 md:h-20',
      participantName: 'text-base md:text-lg',
      participantHero: 'text-sm md:text-base',
      value: 'text-4xl md:text-5xl',
      badge: 'w-12 h-12 text-2xl',
      glow: 'shadow-2xl shadow-amber-500/30',
      bg: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
      border: 'border-amber-500/50'
    },
    2: {
      container: '',
      card: 'p-4 md:p-6',
      participantAvatar: 'w-14 h-14 md:w-16 md:h-16',
      participantName: 'text-sm md:text-base',
      participantHero: 'text-xs md:text-sm',
      value: 'text-2xl md:text-3xl',
      badge: 'w-10 h-10 text-xl',
      glow: 'shadow-xl shadow-slate-400/20',
      bg: 'from-slate-400/15 via-slate-500/10 to-slate-400/15',
      border: 'border-slate-400/40'
    },
    3: {
      container: '',
      card: 'p-4 md:p-6',
      participantAvatar: 'w-14 h-14 md:w-16 md:h-16',
      participantName: 'text-sm md:text-base',
      participantHero: 'text-xs md:text-sm',
      value: 'text-2xl md:text-3xl',
      badge: 'w-10 h-10 text-xl',
      glow: 'shadow-xl shadow-amber-700/20',
      bg: 'from-amber-700/15 via-amber-800/10 to-amber-700/15',
      border: 'border-amber-700/40'
    },
    4: {
      container: '',
      card: 'p-3 md:p-4',
      participantAvatar: 'w-12 h-12 md:w-14 md:h-14',
      participantName: 'text-sm',
      participantHero: 'text-xs',
      value: 'text-xl md:text-2xl',
      badge: 'w-8 h-8 text-lg',
      glow: 'shadow-lg shadow-slate-600/10',
      bg: 'from-slate-700/15 via-slate-800/10 to-slate-700/15',
      border: 'border-slate-600/30'
    },
    5: {
      container: '',
      card: 'p-3 md:p-4',
      participantAvatar: 'w-12 h-12 md:w-14 md:h-14',
      participantName: 'text-sm',
      participantHero: 'text-xs',
      value: 'text-xl md:text-2xl',
      badge: 'w-8 h-8 text-lg',
      glow: 'shadow-lg shadow-slate-600/10',
      bg: 'from-slate-700/15 via-slate-800/10 to-slate-700/15',
      border: 'border-slate-600/30'
    }
  }
  
  const style = positionStyles[position] || positionStyles[5]
  
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

  return (
    <div 
      className={`
        ${style.container}
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
          relative h-full rounded-2xl border backdrop-blur-sm
          bg-gradient-to-br ${style.bg} ${style.border} ${style.glow}
          ${style.card}
          ${position === 1 ? 'animate-pulse-subtle' : ''}
          flex flex-col
        `}
      >
        {/* Position badge */}
        <div 
          className={`
            absolute -top-3 -left-3 ${style.badge} rounded-full
            ${badge.bg} flex items-center justify-center
            font-bold text-white shadow-lg
            ${position <= 3 ? '' : 'text-sm'}
          `}
        >
          {position <= 3 ? badge.emoji : position}
        </div>

        <div className="flex flex-col items-center text-center gap-3 flex-1">
          {/* GameTime como valor principal */}
          <div className={`${style.value} font-mono font-bold text-indigo-400 mb-2`}>
            {formatMetricValue(group.gameTime, metricKey)}
          </div>

          {/* Lista de participantes */}
          <div className="flex-1 w-full overflow-auto">
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              {group.displayParticipants.map((participant, idx) => {
                const heroImageSrc = getHeroImageSrc(participant.hero)
                const imageError = imageErrors.has(participant.hero)
                const imageLoaded = imagesLoaded.has(participant.hero)
                
                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 md:gap-3 p-2 rounded-lg bg-slate-800/30"
                  >
                    {/* Hero avatar */}
                    <div 
                      className={`
                        ${style.participantAvatar} rounded-full overflow-hidden
                        bg-slate-800 border-2 ${style.border}
                        flex items-center justify-center flex-shrink-0
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
                        <span className="text-lg md:text-xl">⚔️</span>
                      )}
                    </div>

                    {/* Player y Hero name */}
                    <div className="flex-1 text-left min-w-0">
                      <div className={`${style.participantName} font-bold text-white truncate`}>
                        {participant.player}
                      </div>
                      <div className={`${style.participantHero} text-slate-400 truncate`}>
                        {participant.hero}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Winner info */}
          {winnerDisplay && (
            <div className="text-xs md:text-sm text-slate-500 mt-2">
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
 * Slide del podio con revelado progresivo
 */
export function AwardPodiumSlide({ award, revealStep, isVisible }) {
  // Si es un premio de duración de partida, usar el componente especial
  if (isDurationMatchAward(award.title)) {
    return (
      <GroupedMatchPodiumSlide 
        award={award}
        revealStep={revealStep}
        isVisible={isVisible}
      />
    )
  }

  // Detectar si requiere agrupación (para otros premios que puedan necesitarlo)
  const needsGrouping = requiresGrouping(award)
  
  // Si requiere agrupación, usar grupos; si no, usar rows individuales
  const groups = needsGrouping ? groupAwardRows(award) : null
  const rows = !needsGrouping ? award.rows.slice(0, 5) : null
  
  // Para grupos, tomar top 5 grupos; para rows, top 5 rows
  const displayItems = needsGrouping 
    ? groups.slice(0, 5)
    : rows
  
  const maxReveal = Math.min(5, displayItems.length)
  
  // Orden de revelado: 5, 4, 3, 2, 1 (de peor a mejor)
  // revealStep 1 = muestra posición 5 (index 4)
  // revealStep 2 = muestra posición 5, 4 (index 4, 3)
  // etc.
  
  const getIsRevealed = (position) => {
    // position va de 1 a 5
    // Para posición 5: se revela en step 1
    // Para posición 4: se revela en step 2
    // etc.
    const revealAtStep = maxReveal - position + 1
    return revealStep >= revealAtStep
  }

  // Obtener delay de animación basado en cuándo se reveló
  const getRevealDelay = (position) => {
    return 0 // Sin delay adicional, la animación ya tiene transition
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

      {/* Podium grid */}
      <div className="relative z-10 w-full max-w-5xl">
        {needsGrouping ? (
          <>
            {/* Layout especial para top 3 + bottom 2 con grupos */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-end justify-center">
              {/* Top 3: 2do, 1ro, 3ro en desktop */}
              <div className="order-2 md:order-1 col-span-1">
                {displayItems[1] && (
                  <PodiumCardGroup 
                    group={displayItems[1]} 
                    position={2} 
                    metricKey="GameTime"
                    isRevealed={getIsRevealed(2)}
                    revealDelay={getRevealDelay(2)}
                  />
                )}
              </div>
              
              <div className="order-1 md:order-2 col-span-2 md:col-span-1">
                {displayItems[0] && (
                  <PodiumCardGroup 
                    group={displayItems[0]} 
                    position={1} 
                    metricKey="GameTime"
                    isRevealed={getIsRevealed(1)}
                    revealDelay={getRevealDelay(1)}
                  />
                )}
              </div>
              
              <div className="order-3 col-span-1">
                {displayItems[2] && (
                  <PodiumCardGroup 
                    group={displayItems[2]} 
                    position={3} 
                    metricKey="GameTime"
                    isRevealed={getIsRevealed(3)}
                    revealDelay={getRevealDelay(3)}
                  />
                )}
              </div>
            </div>

            {/* Posiciones 4 y 5 */}
            {displayItems.length > 3 && (
              <div className="grid grid-cols-2 gap-4 mt-6 max-w-lg mx-auto">
                {displayItems[3] && (
                  <PodiumCardGroup 
                    group={displayItems[3]} 
                    position={4} 
                    metricKey="GameTime"
                    isRevealed={getIsRevealed(4)}
                    revealDelay={getRevealDelay(4)}
                  />
                )}
                {displayItems[4] && (
                  <PodiumCardGroup 
                    group={displayItems[4]} 
                    position={5} 
                    metricKey="GameTime"
                    isRevealed={getIsRevealed(5)}
                    revealDelay={getRevealDelay(5)}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Layout especial para top 3 + bottom 2 con rows individuales */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-end justify-center">
              {/* Top 3: 2do, 1ro, 3ro en desktop */}
              <div className="order-2 md:order-1 col-span-1">
                {displayItems[1] && (
                  <PodiumCard 
                    entry={displayItems[1]} 
                    position={2} 
                    metricKey={award.metricKey}
                    isRevealed={getIsRevealed(2)}
                    revealDelay={getRevealDelay(2)}
                  />
                )}
              </div>
              
              <div className="order-1 md:order-2 col-span-2 md:col-span-1">
                {displayItems[0] && (
                  <PodiumCard 
                    entry={displayItems[0]} 
                    position={1} 
                    metricKey={award.metricKey}
                    isRevealed={getIsRevealed(1)}
                    revealDelay={getRevealDelay(1)}
                  />
                )}
              </div>
              
              <div className="order-3 col-span-1">
                {displayItems[2] && (
                  <PodiumCard 
                    entry={displayItems[2]} 
                    position={3} 
                    metricKey={award.metricKey}
                    isRevealed={getIsRevealed(3)}
                    revealDelay={getRevealDelay(3)}
                  />
                )}
              </div>
            </div>

            {/* Posiciones 4 y 5 */}
            {displayItems.length > 3 && (
              <div className="grid grid-cols-2 gap-4 mt-6 max-w-lg mx-auto">
                {displayItems[3] && (
                  <PodiumCard 
                    entry={displayItems[3]} 
                    position={4} 
                    metricKey={award.metricKey}
                    isRevealed={getIsRevealed(4)}
                    revealDelay={getRevealDelay(4)}
                  />
                )}
                {displayItems[4] && (
                  <PodiumCard 
                    entry={displayItems[4]} 
                    position={5} 
                    metricKey={award.metricKey}
                    isRevealed={getIsRevealed(5)}
                    revealDelay={getRevealDelay(5)}
                  />
                )}
              </div>
            )}
          </>
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
