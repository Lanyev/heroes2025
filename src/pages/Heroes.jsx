import { useMemo, useState, useCallback } from 'react'
import { EmptyState } from '../components/EmptyState'
import { SearchInput } from '../components/SearchInput'
import { HeroAvatar } from '../components/HeroAvatar'
import { HeroModal } from '../components/HeroModal'
import { Badge } from '../components/Badge'
import { getHeroStatsTable } from '../data/heroMetrics'
import { getHeroDetails } from '../data/heroMetrics'
import { formatPercent, formatNumber } from '../utils/format'

/**
 * Heroes selector page with grid of heroes
 * Clicking on a hero opens a modal with detailed stats
 */
export function Heroes({ rows }) {
  const [searchText, setSearchText] = useState('')
  const [selectedHero, setSelectedHero] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')

  // Compute hero stats table
  const heroTable = useMemo(() => {
    return getHeroStatsTable(rows, { lowSampleThreshold: 20 })
  }, [rows])

  // Get unique roles
  const roles = useMemo(() => {
    const uniqueRoles = new Set(heroTable.map(h => h.role))
    return Array.from(uniqueRoles).sort()
  }, [heroTable])

  // Apply filters
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

    // Sort by matches (most played first)
    return filtered.sort((a, b) => b.matches - a.matches)
  }, [heroTable, roleFilter, searchText])

  // Handle hero click
  const handleHeroClick = useCallback((heroName) => {
    const details = getHeroDetails(rows, heroName)
    setSelectedHero(details)
  }, [rows])

  if (rows.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Selector de Héroes</h1>
        <p className="text-slate-400">
          Haz clic en un héroe para ver sus estadísticas detalladas
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Todos
          </button>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <SearchInput
          value={searchText}
          onChange={setSearchText}
          placeholder="Buscar héroe..."
          className="w-full sm:w-64"
        />
      </div>

      {/* Hero Grid */}
      {filteredHeroes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">
            No se encontraron héroes con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredHeroes.map((hero) => (
            <button
              key={hero.name}
              onClick={() => handleHeroClick(hero.name)}
              className="group bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-105 flex flex-col items-center gap-3"
            >
              <HeroAvatar
                name={hero.name}
                role={hero.role}
                size="xl"
                showBorder={true}
              />
              <div className="text-center w-full">
                <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-indigo-400 transition-colors">
                  {hero.name}
                </h3>
                <Badge variant="info" className="text-xs">
                  {hero.role}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-xs text-slate-400 w-full">
                <div className="flex justify-between">
                  <span>Partidas:</span>
                  <span className="text-white font-medium">{formatNumber(hero.matches)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="text-white font-medium">{formatPercent(hero.winRate)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="text-center text-slate-400 text-sm">
        Mostrando {filteredHeroes.length} de {heroTable.length} héroes
      </div>

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
