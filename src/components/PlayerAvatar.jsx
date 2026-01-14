import { useState, useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { getPublicPath } from '../utils/paths'

/**
 * Size configurations for the avatar
 */
const SIZES = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-16 h-16', text: 'text-xl' },
  xl: { container: 'w-24 h-24', text: 'text-3xl' }
}

/**
 * Default gradient for player avatars
 */
const DEFAULT_GRADIENT = 'bg-gradient-to-br from-indigo-600 to-purple-800'

/**
 * Get player image sources - tries multiple formats and fallbacks
 * Now prioritizes images with -profile suffix
 */
function getPlayerImageSources(name) {
  if (!name) return []

  // Normalize name for filename (remove spaces, special chars)
  const normalizedName = name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces

  return [
    // First try -profile images (new format)
    getPublicPath(`/players-images/${normalizedName}-profile.png`),
    getPublicPath(`/players-images/${normalizedName}-profile.jpg`),
    getPublicPath(`/players-images/${normalizedName}-profile.webp`),
    // Fallback to old format without -profile
    getPublicPath(`/players-images/${normalizedName}.png`),
    getPublicPath(`/players-images/${normalizedName}.jpg`),
    getPublicPath(`/players-images/${normalizedName}.webp`),
    // Try original name with spaces/special chars (with -profile)
    getPublicPath(`/players-images/${name}-profile.png`),
    getPublicPath(`/players-images/${name}-profile.jpg`),
    getPublicPath(`/players-images/${name}-profile.webp`),
    // Try original name without -profile
    getPublicPath(`/players-images/${name}.png`),
    getPublicPath(`/players-images/${name}.jpg`),
    getPublicPath(`/players-images/${name}.webp`)
  ]
}

/**
 * PlayerAvatar - Displays player profile image with graceful fallback
 *
 * @param {Object} props
 * @param {string} props.name - Player name (required)
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|number} props.size - Size preset or pixel number
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showBorder - Show slate border (default true)
 */
export function PlayerAvatar({
  name,
  size = 'md',
  className,
  showBorder = true
}) {
  const [imageState, setImageState] = useState('loading') // 'loading' | 'loaded' | 'error'
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0)

  // Get all candidate image sources
  const imageSources = useMemo(() => getPlayerImageSources(name), [name])

  // Get initials for placeholder
  const initials = useMemo(() => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }, [name])

  // Get size classes or inline style for numeric size
  const sizeConfig = typeof size === 'number'
    ? { container: '', text: '', style: { width: size, height: size } }
    : { ...SIZES[size] || SIZES.md, style: {} }

  // Calculate font size for numeric size
  const textStyle = typeof size === 'number'
    ? { fontSize: Math.max(10, size * 0.35) }
    : {}

  // Reset state when name changes
  useEffect(() => {
    setImageState('loading')
    setCurrentSrcIndex(0)
  }, [name])

  // Handle image load error - try next source
  const handleError = () => {
    if (currentSrcIndex < imageSources.length - 1) {
      setCurrentSrcIndex(prev => prev + 1)
    } else {
      setImageState('error')
    }
  }

  // Handle successful image load
  const handleLoad = () => {
    setImageState('loaded')
  }

  const currentSrc = imageSources[currentSrcIndex]
  const showImage = imageState !== 'error' && currentSrc
  const showPlaceholder = imageState === 'error' || !currentSrc

  return (
    <div
      className={clsx(
        'relative shrink-0 rounded-full overflow-hidden',
        sizeConfig.container,
        showBorder && 'ring-2 ring-slate-700/60 ring-offset-1 ring-offset-slate-800/50',
        !showImage && DEFAULT_GRADIENT,
        className
      )}
      style={sizeConfig.style}
      title={name}
    >
      {/* Image (hidden until loaded, or while trying sources) */}
      {showImage && (
        <img
          src={currentSrc}
          alt={name}
          onLoad={handleLoad}
          onError={handleError}
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-200',
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
            'group-hover:brightness-110'
          )}
          loading="lazy"
        />
      )}

      {/* Placeholder (shown when image fails or while loading) */}
      {(showPlaceholder || imageState === 'loading') && (
        <div
          className={clsx(
            'absolute inset-0 flex items-center justify-center',
            DEFAULT_GRADIENT,
            imageState === 'loaded' && 'opacity-0'
          )}
        >
          <span
            className={clsx(
              'font-semibold text-white/90',
              sizeConfig.text
            )}
            style={textStyle}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * PlayerAvatarWithName - Avatar with player name displayed alongside
 * Useful for lists and tables
 */
export function PlayerAvatarWithName({
  name,
  size = 'sm',
  className,
  nameClassName,
  showBorder = true,
  children
}) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <PlayerAvatar
        name={name}
        size={size}
        showBorder={showBorder}
      />
      <span className={clsx('font-medium text-white', nameClassName)} title={name}>
        {name}
      </span>
      {children}
    </div>
  )
}