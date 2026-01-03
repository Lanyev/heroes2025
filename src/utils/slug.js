/**
 * Generate a URL-friendly slug from a hero name
 * 
 * Examples:
 * - "Alexstrasza" -> "alexstrasza"
 * - "Lt. Morales" -> "lt-morales"
 * - "Li-Ming" -> "li-ming"
 * - "E.T.C." -> "etc"
 * - "The Lost Vikings" -> "the-lost-vikings"
 * - "Sgt. Hammer" -> "sgt-hammer"
 * - "Kel'Thuzad" -> "kelthuzad"
 * - "Cho'gall" -> "chogall"
 * 
 * @param {string} name - Hero name
 * @returns {string} - URL-safe slug
 */
export function heroSlug(name) {
  if (!name) return ''
  
  return name
    .toLowerCase()
    // Remove apostrophes (Kel'Thuzad -> kelthuzad)
    .replace(/'/g, '')
    // Replace periods with nothing unless followed by space (E.T.C. -> etc, Lt. Morales -> lt morales)
    .replace(/\.(?!\s)/g, '')
    .replace(/\.\s/g, ' ')
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9-]/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
}

/**
 * Extract initials from a hero name for placeholder display
 * 
 * Examples:
 * - "Alexstrasza" -> "A"
 * - "Lt. Morales" -> "LM"
 * - "Li-Ming" -> "LM"
 * - "The Lost Vikings" -> "TL"
 * - "E.T.C." -> "E"
 * 
 * @param {string} name - Hero name
 * @param {number} maxChars - Maximum characters to return (default 2)
 * @returns {string} - Initials
 */
export function heroInitials(name, maxChars = 2) {
  if (!name) return '?'
  
  // Split by spaces, hyphens, or dots
  const parts = name.split(/[\s\-\.]+/).filter(Boolean)
  
  if (parts.length === 1) {
    // Single word: take first letter(s)
    return parts[0].charAt(0).toUpperCase()
  }
  
  // Multiple parts: take first letter of each
  return parts
    .slice(0, maxChars)
    .map(p => p.charAt(0).toUpperCase())
    .join('')
}
