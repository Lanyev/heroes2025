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

import { useState, useRef, useCallback, useEffect } from 'react'
import { getPlayerAvatarPath, ARCHETYPE_THEMES } from '../../utils/geekoCards'

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
 * Main TCG Card Component
 */
export function GeekoTCGCard({ card, index = 0 }) {
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
  
  // Build class names
  const cardClasses = [
    'tcg-card',
    getRarityClass(rarity),
    getHoloPatternClass(theme),
    rarity.holoType === 'rainbow' ? 'tcg-card--holo-rainbow' : '',
    isActive ? 'tcg-card--active' : ''
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
  
  // Avatar handling with fallback - try multiple name variations
  const getAvatarSources = useCallback(() => {
    if (!playerName) return []
    const normalizedName = playerName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '')
    return [
      `/players-images/${normalizedName}.jpg`,
      `/players-images/${normalizedName}.png`,
      `/players-images/${normalizedName}.webp`,
      `/players-images/${playerName.toLowerCase()}.jpg`,
      `/players-images/${playerName.toLowerCase()}.png`
    ]
  }, [playerName])
  
  const avatarSources = getAvatarSources()
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0)
  const [avatarError, setAvatarError] = useState(false)
  const currentAvatarPath = avatarSources[currentAvatarIndex] || ''
  
  return (
    <article
      ref={cardRef}
      className={cardClasses}
      style={themeVars}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
                {archetype.energyIcon}
              </div>
              <h3 className="tcg-card__name">{playerName}</h3>
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
              {!avatarError && currentAvatarPath ? (
                <img
                  src={currentAvatarPath}
                  alt={`Avatar de ${playerName}`}
                  className="tcg-card__art-image"
                  onError={() => {
                    // Try next source if available
                    if (currentAvatarIndex < avatarSources.length - 1) {
                      setCurrentAvatarIndex(currentAvatarIndex + 1)
                    } else {
                      setAvatarError(true)
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
            <div className="tcg-card__archetype-badge">
              <span className="tcg-card__archetype-icon">{archetype.energyIcon}</span>
              <span className="tcg-card__archetype-name">{archetype.subtitle}</span>
            </div>
            
            {/* Stats Section */}
            <div className="tcg-card__stats">
              {secondaryStats.map((stat, i) => (
                <div key={i} className="tcg-card__stat-row">
                  <span className="tcg-card__stat-icon">{stat.icon}</span>
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
