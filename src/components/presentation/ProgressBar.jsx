/**
 * Barra de progreso sutil para la presentación
 * Muestra el avance global considerando: premio actual + slide + reveal
 */
export function ProgressBar({ 
  awardIndex, 
  totalAwards, 
  slideIndex, 
  revealStep, 
  maxReveal 
}) {
  // Calcular progreso total
  // Cada premio tiene: 1 slide intro + (maxReveal) pasos de reveal
  // Total de "steps" = totalAwards * (1 + maxRevealPromedio)
  // Simplificamos: cada premio = 2 unidades (intro + podio completo)
  
  const stepsPerAward = 2 // intro + podio
  const totalSteps = totalAwards * stepsPerAward
  
  // Paso actual dentro del premio
  let currentAwardProgress = 0
  if (slideIndex === 0) {
    currentAwardProgress = 0 // En intro
  } else {
    // En podio: el progreso depende del reveal
    currentAwardProgress = 1 + (revealStep / maxReveal)
  }
  
  const globalProgress = (awardIndex * stepsPerAward + currentAwardProgress) / totalSteps
  const percentage = Math.min(100, Math.max(0, globalProgress * 100))

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900/50">
      <div 
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
      {/* Glow effect */}
      <div 
        className="absolute top-0 h-full bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 blur-sm transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
