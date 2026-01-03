/**
 * Format a number with thousands separators
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return new Intl.NumberFormat('es-ES').format(Math.round(num))
}

/**
 * Format a percentage (0-1 to 0-100%)
 * @param {number} value - Value between 0 and 1
 * @param {number} decimals - Decimal places
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format seconds to mm:ss or hh:mm:ss
 * @param {number} totalSeconds 
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '00:00'
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Format large numbers with K/M suffix
 * @param {number} num 
 * @returns {string}
 */
export function formatCompact(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return String(Math.round(num))
}

/**
 * Truncate text with ellipsis
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncate(text, maxLength = 20) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter
 * @param {string} text 
 * @returns {string}
 */
export function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Format seconds to mm:ss (short format)
 * @param {number} totalSeconds 
 * @returns {string}
 */
export function formatSecondsToMMSS(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '0:00'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Format a decimal number with fixed decimals
 * @param {number} num 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatDecimal(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return num.toFixed(decimals)
}

/**
 * Format DPM (damage per minute)
 * @param {number} dpm 
 * @returns {string}
 */
export function formatDPM(dpm) {
  if (!dpm || isNaN(dpm)) return '0'
  return formatCompact(Math.round(dpm))
}
