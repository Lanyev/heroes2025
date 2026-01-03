/**
 * Parse various date formats into a Date object
 * Handles: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.
 * @param {string|Date} dateStr 
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr
  
  const str = String(dateStr).trim()
  
  // Try native parsing first
  let date = new Date(str)
  if (!isNaN(date.getTime())) return date
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    date = new Date(year, month - 1, day)
    if (!isNaN(date.getTime())) return date
  }
  
  // Try YYYY/MM/DD or YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch
    date = new Date(year, month - 1, day)
    if (!isNaN(date.getTime())) return date
  }
  
  return null
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 * @param {Date} date 
 * @returns {string}
 */
export function toISODateString(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

/**
 * Format date for display
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateDisplay(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get the week number of a date
 * @param {Date} date 
 * @returns {number}
 */
export function getWeekNumber(date) {
  if (!date || !(date instanceof Date)) return 0
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Get year-week string for grouping
 * @param {Date} date 
 * @returns {string}
 */
export function getYearWeek(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Unknown'
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/**
 * Get year-month string for grouping
 * @param {Date} date 
 * @returns {string}
 */
export function getYearMonth(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Unknown'
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Check if date falls within range
 * @param {Date} date 
 * @param {Date} minDate 
 * @param {Date} maxDate 
 * @returns {boolean}
 */
export function isDateInRange(date, minDate, maxDate) {
  if (!date) return false
  if (minDate && date < minDate) return false
  if (maxDate && date > maxDate) return false
  return true
}
