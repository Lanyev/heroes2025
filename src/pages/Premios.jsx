import { useState, useEffect } from 'react'
import { loadAwardsCSV, formatAwardValue, getAwardColorClasses } from '../data/loadAwardsCSV'
import { LoadingState } from '../components/LoadingState'
import { Presentation } from './Presentation'
import { Emote } from '../components/Emote'
import { getPublicPath } from '../utils/paths'

/**
 * Award Card Component - Shows a single award table
 */
function AwardCard({ table, index }) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = getAwardColorClasses(table.color)
  
  // Stagger animation delay based on index
  const animationDelay = `${index * 0.1}s`
  
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-sm
        bg-gradient-to-br ${colors.bg} ${colors.border}
        transform transition-all duration-500 ease-out
        hover:scale-[1.02] hover:shadow-2xl hover:${colors.glow}
        animate-card-enter
      `}
      style={{ animationDelay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background glow */}
      <div 
        className={`
          absolute inset-0 opacity-0 transition-opacity duration-500
          ${isHovered ? 'opacity-100' : ''}
        `}
      >
        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-radial ${colors.accent} opacity-10 blur-3xl`} />
        <div className={`absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-radial ${colors.accent} opacity-10 blur-3xl`} />
      </div>
      
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={`
            absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent
            transform -translate-y-full animate-scan-line
          `}
          style={{ animationDelay }}
        />
      </div>
      
      {/* Header */}
      <div className="relative p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl filter drop-shadow-lg">{table.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg ${colors.accent} truncate tracking-wide`}>
              {table.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {table.valueLabel}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-mono ${colors.badge}`}>
            TOP {table.entries.length}
          </div>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="relative p-3">
        <div className="space-y-1">
          {table.entries.map((entry, i) => {
            const isFirst = i === 0
            const value = entry[table.valueColumn]
            
            return (
              <div
                key={i}
                className={`
                  relative flex items-center gap-3 p-2 rounded-lg
                  transition-all duration-300
                  ${isFirst 
                    ? `bg-gradient-to-r ${colors.bg} border ${colors.border} shadow-lg` 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                {/* Rank */}
                <div className={`
                  w-7 h-7 flex items-center justify-center rounded-md font-bold text-sm
                  ${isFirst 
                    ? `bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30` 
                    : i === 1 
                      ? 'bg-slate-400/20 text-slate-300' 
                      : i === 2 
                        ? 'bg-amber-900/30 text-amber-600' 
                        : 'bg-slate-700/30 text-slate-500'
                  }
                `}>
                  {i + 1}
                </div>
                
                {/* Player & Hero Info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${isFirst ? 'text-white' : 'text-slate-200'}`}>
                    {entry.PlayerName || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="truncate">{entry.HeroName || '-'}</span>
                    {entry.Winner === 'Yes' && (
                      <span className="text-green-400 font-medium">W</span>
                    )}
                    {entry.Winner === 'No' && (
                      <span className="text-red-400/60 font-medium">L</span>
                    )}
                  </div>
                </div>
                
                {/* Value */}
                <div className="text-right">
                  <div className={`
                    font-mono font-bold text-sm
                    ${isFirst ? colors.accent : 'text-slate-300'}
                  `}>
                    {formatAwardValue(value, table.isTime)}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {entry.GameTime || ''}
                  </div>
                </div>
                
                {/* First place glow */}
                {isFirst && (
                  <div className="absolute inset-0 rounded-lg animate-pulse-subtle opacity-50 pointer-events-none">
                    <div className={`absolute inset-0 rounded-lg border-2 ${colors.border}`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Extra info for Globitos */}
      {table.name === 'Top Globitos' && table.entries[0]?.GperMin && (
        <div className="px-4 pb-3 text-xs text-slate-500">
          Top rate: {table.entries[0].GperMin} globos/min
        </div>
      )}
    </div>
  )
}

/**
 * Category Section Component
 */
function CategorySection({ title, tables, startIndex }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <h2 className="text-xl font-bold text-slate-200 tracking-wider uppercase px-4">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table, i) => (
          <AwardCard key={table.name} table={table} index={startIndex + i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Premios Page - Gamer Style Awards Dashboard
 */
export function Premios() {
  const [tables, setTables] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showPresentation, setShowPresentation] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const data = await loadAwardsCSV()
      setTables(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <LoadingState message="Cargando rankings..." />
  }

  const tableArray = Object.values(tables)

  if (tableArray.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-50">
            <Emote emoji="🏆" size={64} />
          </div>
          <p className="text-slate-400 text-lg">No se encontraron datos de awards</p>
        </div>
      </div>
    )
  }

  // Mostrar presentación fullscreen
  if (showPresentation) {
    return <Presentation onExit={() => setShowPresentation(false)} />
  }

  // Organize tables by category
  const combatTables = tableArray.filter(t => 
    ['Top Kills', 'Top Hero Damage', 'Top Deaths', 'Top Time Death', 'Top Assists'].includes(t.name)
  )
  
  const healerTables = tableArray.filter(t => 
    ['Top Healing', 'Less Healing', 'Top Self Healing', 'Top Kills W/Healer', 'Top Damage W/Healer'].includes(t.name)
  )
  
  const tankTables = tableArray.filter(t => 
    ['Top Tank Damage', 'Less Tank Damage'].includes(t.name)
  )
  
  const pveAwardTables = tableArray.filter(t => 
    ['Top Siege Damage', 'Top Capturas Mercenarios', 'Top Exp', 'Top Minion Killer', 'Top Globitos'].includes(t.name)
  )
  
  const matchTables = tableArray.filter(t => 
    ['Partida mas Corta', 'Partida mas Larga', 'Top Time OnFire'].includes(t.name)
  )

  // Filter categories
  const categories = [
    { id: 'all', label: 'Todos', icon: '🎮' },
    { id: 'combat', label: 'Combate', icon: '⚔️' },
    { id: 'healer', label: 'Healers', icon: '💚' },
    { id: 'tank', label: 'Tanks', icon: '🛡️' },
    { id: 'pve', label: 'PvE', icon: '🏰' },
    { id: 'match', label: 'Partidas', icon: '⏱️' }
  ]

  const getFilteredContent = () => {
    let index = 0
    const content = []

    if (filter === 'all' || filter === 'combat') {
      if (combatTables.length > 0) {
        content.push(
          <CategorySection 
            key="combat" 
            title="Estadísticas de Combate" 
            tables={combatTables} 
            startIndex={index}
          />
        )
        index += combatTables.length
      }
    }

    if (filter === 'all' || filter === 'healer') {
      if (healerTables.length > 0) {
        content.push(
          <CategorySection 
            key="healer" 
            title="Estadísticas de Healers" 
            tables={healerTables} 
            startIndex={index}
          />
        )
        index += healerTables.length
      }
    }

    if (filter === 'all' || filter === 'tank') {
      if (tankTables.length > 0) {
        content.push(
          <CategorySection 
            key="tank" 
            title="Estadísticas de Tanks" 
            tables={tankTables} 
            startIndex={index}
          />
        )
        index += tankTables.length
      }
    }

    if (filter === 'all' || filter === 'pve') {
      if (pveAwardTables.length > 0) {
        content.push(
          <CategorySection 
            key="pve" 
            title="Estadísticas PvE y Recursos" 
            tables={pveAwardTables} 
            startIndex={index}
          />
        )
        index += pveAwardTables.length
      }
    }

    if (filter === 'all' || filter === 'match') {
      if (matchTables.length > 0) {
        content.push(
          <CategorySection 
            key="match" 
            title="Records de Partidas" 
            tables={matchTables} 
            startIndex={index}
          />
        )
      }
    }

    return content
  }

  return (
    <div id="premios-container" className="min-h-screen overflow-y-auto">
      {/* Sección 1: Hero ALAN AWARDS 2025 ocupando todo el alto de la pantalla */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Hero Header */}
        <div className="relative w-full">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
          </div>
          
          {/* Grid pattern overlay with glow */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              color: 'rgba(38, 71, 105, 1)',
              backgroundImage: `
                linear-gradient(rgba(99, 102, 241, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              boxShadow: `
                inset 0 0 100px rgba(99, 102, 241, 0.1),
                inset 0 0 200px rgba(99, 102, 241, 0.05)
              `
            }}
          />
          
          <div className="relative max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center text-center min-h-screen">
            {/* Clickable Hall of Fame title */}
            <div 
              className="group cursor-pointer inline-block"
              onClick={() => setShowPresentation(true)}
              title="Iniciar presentación cinematográfica"
            >
              <h1 className="text-5xl md:text-6xl font-black mb-1 tracking-tight transition-all duration-300 group-hover:scale-110">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative inline-block transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(129,140,248,0.5)]">
                  ALAN AWARDS 2025
                  {/* Underline animado */}
                  <span className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
                </span>
              </h1>
              
              {/* Play hint */}
              <div className="flex items-center justify-center gap-2 text-indigo-400/60 text-sm mt-3 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Click para iniciar presentación</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 2: Filtros y premios, visibles al hacer scroll una pantalla */}
      <section className="min-h-screen">
        {/* Filter Tabs */}
        <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 mb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-300 whitespace-nowrap
                  ${filter === cat.id
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
                >
                  {cat.icon === '⏱️' || cat.icon === '\u23F1' || cat.icon === '\u23F1\uFE0F' ? (
                    <img 
                      src={getPublicPath('/emotes/clockwork.png')} 
                      alt="⏱️" 
                      className="w-4 h-4"
                      style={{ objectFit: 'contain', imageRendering: 'crisp-edges' }}
                    />
                  ) : (
                    <Emote emoji={cat.icon} size="sm" />
                  )}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {getFilteredContent()}
        </div>
      </section>
    </div>
  )
}
