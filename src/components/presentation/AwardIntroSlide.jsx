import { getMetricDisplayName } from '../../data/loadAwardsForPresentation'

/**
 * Slide de introducción para un premio
 * Muestra el nombre del premio y una descripción
 */
export function AwardIntroSlide({ award, isVisible }) {
  const metricName = getMetricDisplayName(award.metricKey)
  
  return (
    <div 
      className={`
        absolute inset-0 flex flex-col items-center justify-center
        transition-all duration-500 ease-out
        ${isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Radial gradient */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)' }}
        />
        
        {/* Animated particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-400/30 rounded-full animate-float" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-purple-400/20 rounded-full animate-float-delayed" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-pink-400/30 rounded-full animate-float" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl px-8">
        {/* Icon */}
        <div 
          className="text-7xl mb-6 filter drop-shadow-2xl animate-intro-icon"
          style={{ animationDelay: '100ms' }}
        >
          {award.icon}
        </div>

        {/* Title */}
        <h1 
          className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 animate-intro-title"
          style={{ animationDelay: '200ms' }}
        >
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {award.title}
          </span>
        </h1>

        {/* Divider */}
        <div 
          className="w-32 h-1 mx-auto mb-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-intro-line"
          style={{ animationDelay: '300ms' }}
        />

        {/* Description */}
        <p 
          className="text-2xl md:text-3xl lg:text-4xl text-slate-300 mb-4 animate-intro-desc"
          style={{ animationDelay: '400ms' }}
        >
          {award.description}
        </p>

        {/* Metric info */}
        <p 
          className="text-base md:text-lg text-slate-500 font-mono animate-intro-desc"
          style={{ animationDelay: '500ms' }}
        >
          Métrica: {metricName}
        </p>

        {/* Hint */}
        <div 
          className="mt-12 flex items-center justify-center gap-2 text-slate-500 animate-intro-hint"
          style={{ animationDelay: '700ms' }}
        >
          <span className="text-sm">Presiona</span>
          <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono">→</kbd>
          <span className="text-sm">para ver el ranking</span>
        </div>
      </div>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/40 pointer-events-none" />
    </div>
  )
}
