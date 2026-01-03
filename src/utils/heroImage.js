import { heroSlug } from './slug'

/**
 * Supported image extensions in priority order
 */
const IMAGE_EXTENSIONS = ['webp', 'png', 'jpg']

/**
 * Base path for hero images
 */
const HERO_IMAGES_PATH = '/hero-images'

/**
 * Get array of candidate image source URLs for a hero
 * Returns sources in priority order: webp, png, jpg
 * 
 * @param {string} heroName - Hero name
 * @returns {string[]} - Array of image source URLs to try
 */
export function getHeroImageSources(heroName) {
  const slug = heroSlug(heroName)
  if (!slug) return []
  
  return IMAGE_EXTENSIONS.map(ext => `${HERO_IMAGES_PATH}/${slug}.${ext}`)
}

/**
 * Get the primary image source for a hero (first priority)
 * Useful for preloading or simple cases
 * 
 * @param {string} heroName - Hero name
 * @returns {string} - Primary image source URL
 */
export function getHeroImageSrc(heroName) {
  const sources = getHeroImageSources(heroName)
  return sources[0] || ''
}

/**
 * Check if an image exists by attempting to load it
 * 
 * @param {string} src - Image source URL
 * @returns {Promise<boolean>} - True if image loads successfully
 */
export function checkImageExists(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/**
 * Find the first available image source for a hero
 * Tries each extension in priority order
 * 
 * @param {string} heroName - Hero name
 * @returns {Promise<string|null>} - First working image URL or null
 */
export async function findHeroImageSrc(heroName) {
  const sources = getHeroImageSources(heroName)
  
  for (const src of sources) {
    const exists = await checkImageExists(src)
    if (exists) return src
  }
  
  return null
}
