import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuración del base path para GitHub Pages
// Si tu repositorio se llama "heroes2", la URL será: https://username.github.io/heroes2/
// Si es un repositorio de usuario/organización (username.github.io), cambia esto a base: '/'
// También puedes usar una variable de entorno: VITE_BASE_PATH
const getBasePath = () => {
  // Prioridad: variable de entorno > nombre del repositorio > por defecto
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH
  }
  
  // En GitHub Actions, usar el nombre del repositorio
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
    return `/${repoName}/`
  }
  
  // Por defecto, asumir que el repositorio se llama "heroes2025"
  // CAMBIA ESTE VALOR si tu repositorio tiene otro nombre
  const defaultRepoName = 'heroes2025'
  return process.env.NODE_ENV === 'production' ? `/${defaultRepoName}/` : '/'
}

export default defineConfig({
  base: getBasePath(),
  plugins: [
    react(),
    tailwindcss()
  ]
})
