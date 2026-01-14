import { useMemo, useState, useCallback } from 'react'
import { EmptyState } from '../components/EmptyState'
import { SearchInput } from '../components/SearchInput'
import { HeroAvatar } from '../components/HeroAvatar'
import { HeroModal } from '../components/HeroModal'
import { Badge } from '../components/Badge'
import { SectionShell } from '../app/layout/SectionShell'
import { Select } from '../components/Select'
import { getHeroStatsTable, getHeroDetails, HERO_TABLE_COLUMNS } from '../data/heroMetrics'
import { formatPercent, formatNumber } from '../utils/format'

/**
 * Heroes selector page with grid of heroes
 * Clicking on a hero opens a modal with detailed stats
 */
export function Heroes({ rows }) {
  const [searchText, setSearchText] = useState('')
  const [selectedHero, setSelectedHero] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortKey, setSortKey] = useState('matches')
  const [sortDirection, setSortDirection] = useState('desc')

  // Compute hero stats table
  const heroTable = useMemo(() => {
    return getHeroStatsTable(rows, { lowSampleThreshold: 20 })
  }, [rows])

  // Get unique roles
  const roles = useMemo(() => {
    const uniqueRoles = new Set(heroTable.map(h => h.role))
    return Array.from(uniqueRoles).sort()
  }, [heroTable])

  // Apply filters and sorting
  const filteredHeroes = useMemo(() => {
    let filtered = heroTable

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(h => h.role === roleFilter)
    }

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(h => h.name.toLowerCase().includes(search))
    }

    // Get column definition to understand the type
    const columnDef = HERO_TABLE_COLUMNS.find(col => col.key === sortKey)
    const isNumericType = columnDef && ['number', 'decimal', 'percent', 'compact', 'duration'].includes(columnDef?.type)
    
    // Sort
    return [...filtered].sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]
      
      // Handle null/undefined values - put them at the end
      const aIsNull = aVal === null || aVal === undefined || aVal === ''
      const bIsNull = bVal === null || bVal === undefined || bVal === ''
      
      if (aIsNull && bIsNull) return 0
      if (aIsNull) return 1
      if (bIsNull) return -1
      
      // Handle string sorting (for name, role, etc.)
      if (!isNumericType && typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }
      
      // For numeric types, ensure we're comparing numbers
      const aNum = typeof aVal === 'number' ? aVal : (typeof aVal === 'string' ? parseFloat(aVal) : Number(aVal))
      const bNum = typeof bVal === 'number' ? bVal : (typeof bVal === 'string' ? parseFloat(bVal) : Number(bVal))
      
      // Handle NaN cases (invalid numbers) - put them at the end
      if (isNaN(aNum) && isNaN(bNum)) return 0
      if (isNaN(aNum)) return 1
      if (isNaN(bNum)) return -1
      
      // Handle numeric sorting with proper comparison
      const diff = aNum - bNum
      return sortDirection === 'asc' ? diff : -diff
    })
  }, [heroTable, roleFilter, searchText, sortKey, sortDirection])

  // Handle hero click
  const handleHeroClick = useCallback((heroName) => {
    const details = getHeroDetails(rows, heroName)
    setSelectedHero(details)
  }, [rows])

  // Get sort options from table columns
  const sortOptions = useMemo(() => {
    return HERO_TABLE_COLUMNS
      .filter(col => col.sortable)
      .map(col => ({
        value: col.key,
        label: col.label
      }))
  }, [])

  if (rows.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4 relative z-10">
      {/* Header - Más pequeño */}
      <SectionShell title="Héroes" isPrimary>
        {/* Contenedor con fondo distintivo y separación visual */}
        <div className="bg-surface-1/40 rounded-2xl p-4 border border-slate-700/30 backdrop-blur-sm relative overflow-hidden">
          {/* Patrón de fondo muy sutil */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.5) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Filters, Búsqueda y Ordenamiento */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between relative z-10 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 focus-ring-accent ${
                  roleFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-elevated ring-2 ring-indigo-500/30'
                    : 'bg-surface-2 text-slate-300 hover:bg-surface-2/80 hover:shadow-sm-custom'
                }`}
              >
                Todos
              </button>
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 focus-ring-accent ${
                    roleFilter === role
                      ? 'bg-indigo-600 text-white shadow-elevated ring-2 ring-indigo-500/30'
                      : 'bg-surface-2 text-slate-300 hover:bg-surface-2/80 hover:shadow-sm-custom'
                  }`}
                >
                  {role}
                </button>
              ))}
              
              {/* Sort Controls - En la misma línea */}
              <div className="flex items-center gap-2 ml-2">
                <label className="text-slate-400 text-xs font-medium whitespace-nowrap">
                  Ordenar por:
                </label>
                <Select
                  value={sortKey}
                  onChange={setSortKey}
                  options={sortOptions}
                  className="min-w-[140px]"
                />
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 focus-ring-accent ${
                    sortDirection === 'desc'
                      ? 'bg-indigo-600 text-white shadow-elevated'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:shadow-sm-custom'
                  }`}
                  title={sortDirection === 'desc' ? 'Orden descendente' : 'Orden ascendente'}
                >
                  {sortDirection === 'desc' ? '↓ Desc' : '↑ Asc'}
                </button>
              </div>
            </div>

            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="Buscar héroe..."
              className="w-full sm:w-48"
            />
          </div>

          {/* Hero Grid */}
          {filteredHeroes.length === 0 ? (
            <div className="text-center py-12 relative z-10">
              <p className="text-slate-400 text-lg">
                No se encontraron héroes con los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 relative z-10">
              {filteredHeroes.map((hero) => (
                <button
                  key={hero.name}
                  onClick={() => handleHeroClick(hero.name)}
                  className="hero-card group flex flex-col items-center gap-3 focus-ring-accent"
                >
                  <HeroAvatar
                    name={hero.name}
                    role={hero.role}
                    size="xl"
                    showBorder={true}
                  />
                  <div className="text-center w-full">
                    <h3 className="text-white font-bold text-sm mb-1.5 group-hover:text-indigo-400 transition-colors duration-200">
                      {hero.name}
                    </h3>
                    <Badge variant="info" className="text-xs">
                      {hero.role}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs w-full mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Partidas:</span>
                      <span className="text-white font-semibold">{formatNumber(hero.matches)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Win Rate:</span>
                      <span className={`font-semibold ${
                        hero.winRate >= 0.55 ? 'text-emerald-400' : 
                        hero.winRate <= 0.45 ? 'text-red-400' : 
                        'text-white'
                      }`}>
                        {formatPercent(hero.winRate)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Results count */}
          <div className="text-center text-slate-500 text-xs relative z-10 mt-4">
            Mostrando {filteredHeroes.length} de {heroTable.length} héroes
          </div>
        </div>
      </SectionShell>

      {/* Hero Modal */}
      {selectedHero && (
        <HeroModal
          hero={selectedHero}
          rows={rows}
          onClose={() => setSelectedHero(null)}
        />
      )}
    </div>
  )
}
