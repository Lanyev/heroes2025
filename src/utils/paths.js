/**
 * Utilidad para obtener rutas de assets públicos que respetan el base path de Vite
 * Necesario para GitHub Pages donde el sitio está en un subdirectorio
 * 
 * @param {string} path - Ruta del asset (debe empezar con /)
 * @returns {string} Ruta completa con base path
 * 
 * @example
 * getPublicPath('/banner.gif') // '/heroes2025/banner.gif' en producción
 * getPublicPath('/emotes/fire.png') // '/heroes2025/emotes/fire.png' en producción
 */
export function getPublicPath(path) {
  // import.meta.env.BASE_URL ya incluye la barra final (ej: '/heroes2025/')
  // y la ruta debe empezar con / pero no terminar con /
  const baseUrl = import.meta.env.BASE_URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  // Combinar base URL (que ya tiene barra final) con path (que empieza con barra)
  // Necesitamos remover la barra inicial del path para evitar doble barra
  return `${baseUrl}${cleanPath.slice(1)}`
}
