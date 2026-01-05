/**
 * Load and parse premios from the premios.txt file
 * @returns {Promise<Array>} Array of premio objects
 */
export async function loadPremios() {
  try {
    const response = await fetch('/resources/premios.txt')
    const text = await response.text()
    
    // Parse TSV format
    const lines = text.trim().split('\n')
    const headers = lines[0].split('\t')
    
    const premios = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split('\t')
      if (values.length >= 4) {
        premios.push({
          premio: values[0]?.trim() || '',
          categoria: values[1]?.trim() || '',
          queReconoce: values[2]?.trim() || '',
          descripcion: values[3]?.trim() || ''
        })
      }
    }
    
    return premios
  } catch (error) {
    console.error('Error loading premios:', error)
    return []
  }
}
