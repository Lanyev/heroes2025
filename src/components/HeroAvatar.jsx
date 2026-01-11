import { useState, useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { heroInitials } from '../utils/slug'
import { getHeroImageSources } from '../utils/heroImage'

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
 * Role-based gradient backgrounds for placeholders
 */
const ROLE_GRADIENTS = {
  'Tank': 'bg-gradient-to-br from-blue-600 to-blue-800',
  'Bruiser': 'bg-gradient-to-br from-amber-600 to-orange-800',
  'Melee Assassin': 'bg-gradient-to-br from-red-600 to-red-800',
  'Ranged Assassin': 'bg-gradient-to-br from-purple-600 to-purple-800',
  'Healer': 'bg-gradient-to-br from-green-600 to-emerald-800',
  'Support': 'bg-gradient-to-br from-teal-600 to-cyan-800',
  'Unknown': 'bg-gradient-to-br from-slate-600 to-slate-800'
}

/**
 * Default gradient when role is not specified
 */
const DEFAULT_GRADIENT = 'bg-gradient-to-br from-indigo-600 to-purple-800'

/**
 * HeroAvatar - Displays hero image with graceful fallback
 * 
 * @param {Object} props
 * @param {string} props.name - Hero name (required)
 * @param {string} props.role - Hero role (optional, for placeholder styling)
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|number} props.size - Size preset or pixel number
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showBorder - Show slate border (default true)
 */
export function HeroAvatar({ 
  name, 
  role,
  size = 'md', 
  className,
  showBorder = true
}) {
  const [imageState, setImageState] = useState('loading') // 'loading' | 'loaded' | 'error'
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0)
  
  // Get all candidate image sources
  const imageSources = useMemo(() => getHeroImageSources(name), [name])
  
  // Get initials for placeholder
  const initials = useMemo(() => heroInitials(name), [name])
  
  // Get gradient based on role
  const gradient = useMemo(() => {
    if (!role) return DEFAULT_GRADIENT
    return ROLE_GRADIENTS[role] || DEFAULT_GRADIENT
  }, [role])
  
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
        !showImage && gradient,
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
            gradient,
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
 * HeroAvatarWithName - Avatar with hero name displayed alongside
 * Useful for lists and tables
 */
export function HeroAvatarWithName({
  name,
  role,
  size = 'sm',
  className,
  nameClassName,
  showBorder = true,
  children
}) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <HeroAvatar 
        name={name} 
        role={role}
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
