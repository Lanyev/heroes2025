import { useState, useEffect } from 'react'
import { loadAwardsCSV, formatAwardValue, getAwardColorClasses } from '../data/loadAwardsCSV'
import { LoadingState } from '../components/LoadingState'

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
          <div className="text-6xl mb-4 opacity-50">🏆</div>
          <p className="text-slate-400 text-lg">No se encontraron datos de awards</p>
        </div>
      </div>
    )
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
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden py-8 mb-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-indigo-500/5 to-transparent rounded-full" />
        </div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-indigo-300 font-medium">Temporada Activa</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              HALL OF FAME
            </span>
          </h1>
          
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            Rankings y records de los mejores jugadores
          </p>
          
          {/* Stats Summary */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{tableArray.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Categorías</div>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {tableArray.reduce((acc, t) => acc + t.entries.length, 0)}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Entries</div>
            </div>
          </div>
        </div>
      </div>

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
                <span>{cat.icon}</span>
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
    </div>
  )
}
