import { toPng } from 'html-to-image'

/**
 * Export a DOM element as PNG image
 * @param {HTMLElement} element - Element to export
 * @param {string} filename - Filename without extension
 */
export async function exportToPng(element, filename = 'chart') {
  if (!element) {
    console.error('No element provided for PNG export')
    return
  }
  
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#1e293b',
      pixelRatio: 2
    })
    
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Error exporting PNG:', error)
  }
}

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions with key and label
 * @returns {string} - CSV string
 */
export function arrayToCsv(data, columns) {
  if (!data || data.length === 0) return ''
  
  // Header row
  const header = columns.map(col => `"${col.label}"`).join(',')
  
  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      if (typeof value === 'number') {
        // Format percentages and decimals
        if (col.type === 'percent') return (value * 100).toFixed(1)
        if (col.type === 'decimal') return value.toFixed(2)
        return value
      }
      return value
    }).join(',')
  })
  
  return [header, ...rows].join('\n')
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV string
 * @param {string} filename - Filename without extension
 */
export function downloadCsv(csvContent, filename = 'export') {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Export table data to CSV file
 * @param {Array} data - Table data
 * @param {Array} columns - Column definitions
 * @param {string} filename - Filename
 */
export function exportTableToCsv(data, columns, filename = 'heroes_export') {
  const csv = arrayToCsv(data, columns)
  downloadCsv(csv, filename)
}
