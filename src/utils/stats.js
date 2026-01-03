/**
 * Statistical utility functions
 */

/**
 * Calculate Wilson score lower bound for confidence interval
 * Used for ranking items with varying sample sizes
 * @param {number} wins - Number of successes
 * @param {number} n - Total trials
 * @param {number} z - Z-score (default 1.96 for 95% confidence)
 * @returns {number} - Lower bound of confidence interval
 */
export function wilsonLowerBound(wins, n, z = 1.96) {
  if (n === 0) return 0
  
  const phat = wins / n
  const zsq = z * z
  
  const numerator = phat + zsq / (2 * n) - z * Math.sqrt((phat * (1 - phat) + zsq / (4 * n)) / n)
  const denominator = 1 + zsq / n
  
  return Math.max(0, numerator / denominator)
}

/**
 * Determine if sample size is too low for reliable statistics
 * @param {number} matches - Number of matches
 * @param {number} threshold - Minimum threshold (default 20)
 * @returns {boolean}
 */
export function isLowSample(matches, threshold = 20) {
  return matches < threshold
}

/**
 * Get confidence note based on sample size
 * @param {number} matches 
 * @returns {string}
 */
export function getConfidenceNote(matches) {
  if (matches < 5) return 'Muy pocos datos'
  if (matches < 10) return 'Datos limitados'
  if (matches < 20) return 'Muestra pequeña'
  if (matches < 50) return 'Muestra moderada'
  return 'Datos confiables'
}

/**
 * Safe division to avoid NaN/Infinity
 * @param {number} numerator 
 * @param {number} denominator 
 * @param {number} fallback 
 * @returns {number}
 */
export function safeDivide(numerator, denominator, fallback = 0) {
  if (!denominator || denominator === 0) return fallback
  const result = numerator / denominator
  return isFinite(result) ? result : fallback
}
