import Papa from 'papaparse'
import { getPublicPath } from '../utils/paths'

/**
 * Fetch and parse CSV from public folder
 * @param {string} url - Path to CSV file
 * @returns {Promise<Array>} - Parsed rows
 */
export async function loadCsv(url = '/structured_data.csv') {
  // Add cache-busting param to avoid browser cache issues
  const fullUrl = getPublicPath(url)
  const cacheBuster = `?t=${Date.now()}`
  const response = await fetch(fullUrl + cacheBuster)
  
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}. Make sure the file is in the /public folder.`)
  }
  
  const csvText = await response.text()
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors)
        }
        resolve(results.data)
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      }
    })
  })
}
