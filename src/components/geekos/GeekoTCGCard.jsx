/**
 * GeekoTCGCard - Pokemon TCG-style player card component
 * 
 * Features:
 * - 3D tilt effect on mouse move
 * - Holographic foil patterns
 * - Dynamic glare/shine
 * - Rarity-based visual effects
 * - Full accessibility support
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { getPlayerCardImageSources, ARCHETYPE_THEMES } from '../../utils/geekoCards'
import { Emote } from '../Emote'

// Constants for tilt calculation
const MAX_ROTATION = 15 // Maximum degrees of rotation
const PERSPECTIVE = 1200 // CSS perspective value

/**
 * Get holo pattern class based on archetype theme
 */
function getHoloPatternClass(theme) {
  switch (theme.holoPattern) {
    case 'fire': return 'tcg-card--holo-fire'
    case 'water': return 'tcg-card--holo-water'
    case 'psychic': return 'tcg-card--holo-psychic'
    case 'fairy': return 'tcg-card--holo-fairy'
    default: return 'tcg-card--holo-psychic'
  }
}

/**
 * Get rarity class
 */
function getRarityClass(rarity) {
  switch (rarity.id) {
    case 'legendary': return 'tcg-card--legendary tcg-card--glow'
    case 'epic': return 'tcg-card--epic tcg-card--glow'
    case 'rare': return 'tcg-card--rare'
    case 'common': return 'tcg-card--common'
    default: return ''
  }
}

/**
 * Normalize player name for comparison
 */
function normalizePlayerName(playerName) {
  if (!playerName) return ''
  return playerName.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
}

/**
 * Custom player types mapping
 */
const PLAYER_TYPES = {
  'raizenser': {
    text: 'DRUNK TYPE',
    color: '#f59e0b', // Amber/Orange
    bgColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b'
  },
  'watchdogman': {
    text: 'FURRO TYPE',
    color: '#ec4899', // Pink
    bgColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#ec4899'
  },
  'ticoman': {
    text: 'PUCHICA TYPE',
    color: '#10b981', // Emerald
    bgColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981'
  },
  'deathmask': {
    text: 'AFK TYPE',
    color: '#6b7280', // Gray
    bgColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: '#6b7280'
  },
  'indigente': {
    text: 'CIEGOS DE M... TYPE',
    color: '#8b5cf6', // Violet
    bgColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8b5cf6'
  },
  'malenfant': {
    text: 'TREPACERROS TYPE',
    color: '#ef4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444'
  },
  'chapelhots': {
    text: 'WEON TYPE',
    color: '#06b6d4', // Cyan
    bgColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06b6d4'
  },
  'omarman': {
    text: '9-11 TYPE',
    color: '#f97316', // Orange
    bgColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#f97316'
  },
  'rampage15th': {
    text: 'XV TYPE',
    color: '#a855f7', // Purple
    bgColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#a855f7'
  }
}

/**
 * Get custom type for a player
 */
function getPlayerCustomType(playerName) {
  if (!playerName) return null
  const normalized = normalizePlayerName(playerName)
  return PLAYER_TYPES[normalized] || null
}

/**
 * Main TCG Card Component
 */
export function GeekoTCGCard({ card, index = 0, isModal = false, onClick }) {
  const cardRef = useRef(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const rafRef = useRef(null)
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  
  // CSS variable state
  const [cssVars, setCssVars] = useState({
    '--tcg-mx': '50%',
    '--tcg-my': '50%',
    '--tcg-rx': '0deg',
    '--tcg-ry': '0deg',
    '--tcg-pos': '50% 50%',
    '--tcg-hyp': 0
  })
  
  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])
  
  /**
   * Handle mouse move with RAF throttling
   */
  const handleMouseMove = useCallback((e) => {
    if (prefersReducedMotion.current) return
    if (!cardRef.current) return
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const w = rect.width
      const h = rect.height
      
      // Calculate percentages
      const px = x / w
      const py = y / h
      
      // Calculate rotation (inverted for natural feel)
      const rotateY = (px - 0.5) * MAX_ROTATION * 2
      const rotateX = (0.5 - py) * MAX_ROTATION * 2
      
      // Calculate hypotenuse for intensity
      const hyp = Math.sqrt(Math.pow(px - 0.5, 2) + Math.pow(py - 0.5, 2))
      
      setCssVars({
        '--tcg-mx': `${px * 100}%`,
        '--tcg-my': `${py * 100}%`,
        '--tcg-rx': `${rotateX}deg`,
        '--tcg-ry': `${rotateY}deg`,
        '--tcg-pos': `${px * 100}% ${py * 100}%`,
        '--tcg-hyp': hyp
      })
    })
  }, [])
  
  /**
   * Handle mouse enter
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
    setIsActive(true)
  }, [])
  
  /**
   * Handle mouse leave - reset with smooth transition
   */
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setIsActive(false)
    
    setCssVars({
      '--tcg-mx': '50%',
      '--tcg-my': '50%',
      '--tcg-rx': '0deg',
      '--tcg-ry': '0deg',
      '--tcg-pos': '50% 50%',
      '--tcg-hyp': 0
    })
  }, [])
  
  // Destructure card data
  const {
    playerName,
    cardNumber,
    totalCards,
    stats,
    archetype,
    rarity,
    signatureStat,
    theme,
    secondaryStats,
    weakness,
    evolution
  } = card
  
  // Check if this is WatchdogMan card (needs dark text)
  const isWatchdogMan = playerName && normalizePlayerName(playerName) === 'watchdogman'
  
  // Check if name is long (needs smaller font)
  // WatchdogMan = 11 caracteres, así que ajustamos para nombres >= 10
  const isLongName = playerName && playerName.length >= 10
  
  // Get custom type for this player
  const customType = getPlayerCustomType(playerName)
  
  // Build class names
  const cardClasses = [
    'tcg-card',
    getRarityClass(rarity),
    getHoloPatternClass(theme),
    rarity.holoType === 'rainbow' ? 'tcg-card--holo-rainbow' : '',
    isActive ? 'tcg-card--active' : '',
    isWatchdogMan ? 'tcg-card--dark-text' : ''
  ].filter(Boolean).join(' ')
  
  // Custom CSS variables for this card's theme
  const themeVars = {
    '--tcg-primary': theme.primary,
    '--tcg-secondary': theme.secondary,
    '--tcg-glow': theme.glow,
    '--tcg-gradient': theme.gradient,
    '--tcg-frame': theme.frame,
    '--tcg-foil-opacity': rarity.foilIntensity,
    '--tcg-glare-opacity': rarity.glareIntensity,
    '--tcg-shine-intensity': rarity.foilIntensity > 0 ? 1 : 0.3,
    ...cssVars
  }
  
  // Card image handling - uses -card images exclusively
  const cardImageSources = useMemo(() => 
    getPlayerCardImageSources(playerName), 
    [playerName]
  )
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const currentImagePath = cardImageSources[currentImageIndex] || ''
  
  // Handler para clic en la card
  const handleCardClick = useCallback((e) => {
    if (onClick) {
      e.stopPropagation()
      onClick(card)
    }
  }, [onClick, card])

  return (
    <article
      ref={cardRef}
      className={cardClasses}
      style={{
        ...themeVars,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      tabIndex={0}
      role="img"
      aria-label={`Carta TCG de ${playerName} - ${archetype.name} - ${rarity.name}`}
    >
      <div className="tcg-card__inner">
        {/* Card Frame */}
        <div className="tcg-card__frame">
          {/* Card Content */}
          <div className="tcg-card__content">
            
            {/* Header: Name + HP/Signature */}
            <div className="tcg-card__header">
              <div className="tcg-card__energy-icon" title={archetype.pokemonType}>
                <Emote emoji={archetype.energyIcon} size={10} />
              </div>
              <h3 
                className="tcg-card__name"
                style={isLongName ? {
                  fontSize: '9.5px',
                  letterSpacing: '0.2px'
                } : {}}
              >
                {playerName}
              </h3>
              <div className="tcg-card__hp">
                <span className="tcg-card__hp-label">{signatureStat.shortLabel}</span>
                <span>{signatureStat.displayValue}</span>
              </div>
            </div>
            
            {/* Rarity Stars */}
            <div className="tcg-card__rarity" aria-label={`Rareza: ${rarity.name}`}>
              {Array.from({ length: rarity.stars }).map((_, i) => (
                <span key={i} className="tcg-card__rarity-star">★</span>
              ))}
            </div>
            
            {/* Art Area */}
            <div className="tcg-card__art">
              {!imageError && currentImagePath ? (
                <img
                  src={currentImagePath}
                  alt={`Carta de ${playerName}`}
                  className="tcg-card__art-image"
                  onError={() => {
                    // Try next source if available
                    if (currentImageIndex < cardImageSources.length - 1) {
                      setCurrentImageIndex(currentImageIndex + 1)
                    } else {
                      setImageError(true)
                    }
                  }}
                  loading="lazy"
                />
              ) : (
                <div 
                  className="tcg-card__art-image" 
                  style={{
                    background: theme.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.3)'
                  }}
                >
                  {playerName.charAt(0)}
                </div>
              )}
              <div className="tcg-card__art-foil" />
            </div>
            
            {/* Info Strip */}
            <div className="tcg-card__info-strip">
              <span>{stats.gamesPlayed} Games</span>
              <span className="tcg-card__info-divider" />
              <span>{(stats.winRate * 100).toFixed(1)}% WR</span>
              <span className="tcg-card__info-divider" />
              <span>{archetype.name}</span>
            </div>
            
            {/* Archetype Badge */}
            <div 
              className={`tcg-card__archetype-badge ${customType ? 'tcg-card__archetype-badge--custom' : ''}`}
              style={customType ? {
                background: customType.bgColor,
                borderColor: customType.borderColor
              } : {}}
            >
              {customType ? (
                <span className="tcg-card__archetype-name" style={{ color: customType.color }}>
                  {customType.text}
                </span>
              ) : (
                <>
                  <span className="tcg-card__archetype-icon">
                    <Emote emoji={archetype.energyIcon} size={10} />
                  </span>
                  <span className="tcg-card__archetype-name">{archetype.subtitle}</span>
                </>
              )}
            </div>
            
            {/* Stats Section */}
            <div className="tcg-card__stats">
              {secondaryStats.map((stat, i) => (
                <div key={i} className="tcg-card__stat-row">
                  <span className="tcg-card__stat-icon">
                    <Emote emoji={stat.icon} size={9} />
                  </span>
                  <span className="tcg-card__stat-label">{stat.label}</span>
                  <span className="tcg-card__stat-value">{stat.value}</span>
                </div>
              ))}
            </div>
            
            {/* Weakness & Evolution */}
            <div className="tcg-card__meta">
              {weakness ? (
                <div className="tcg-card__weakness">
                  <span className="tcg-card__weakness-label">Weakness:</span>
                  <span className="tcg-card__weakness-value">
                    {weakness.type} {weakness.value}
                  </span>
                </div>
              ) : (
                <div className="tcg-card__weakness">
                  <span className="tcg-card__weakness-label">No Weakness</span>
                </div>
              )}
              
              {evolution && (
                <div className="tcg-card__evolution">
                  <span className="tcg-card__evolution-label">{evolution.stage}:</span>
                  <span className="tcg-card__evolution-value">{evolution.text}</span>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="tcg-card__footer">
              <div className="tcg-card__set-info">
                <span className="tcg-card__set-name">Geekos TCG</span>
                <span className="tcg-card__set-year">Alan Awards 2025</span>
              </div>
              <span className="tcg-card__number">
                #{String(cardNumber).padStart(2, '0')}/{String(totalCards).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Effect Layers */}
        <div className="tcg-card__holo" />
        <div className="tcg-card__glare" />
        <div className="tcg-card__shimmer" />
        <div className="tcg-card__texture" />
      </div>
    </article>
  )
}

export default GeekoTCGCard
