import { Select } from '../../components/Select'
import { SearchInput } from '../../components/SearchInput'

/**
 * Global filter bar component
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Object} props.filterOptions - Available filter options
 * @param {Object} props.meta - Dataset metadata
 * @param {Function} props.updateFilter - Filter update handler
 * @param {Function} props.resetFilters - Reset filters handler
 */
export function FilterBar({ filters, filterOptions, meta, updateFilter, resetFilters }) {
  if (!filters || !filterOptions) return null

  // Generar lista de años disponibles
  const getAvailableYears = () => {
    if (!meta?.dateMin || !meta?.dateMax) return []
    const minYear = meta.dateMin.getFullYear()
    const maxYear = meta.dateMax.getFullYear()
    const years = []
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year)
    }
    return years.sort((a, b) => b - a) // Ordenar de más reciente a más antiguo
  }

  const availableYears = getAvailableYears()

  // Obtener el año seleccionado actualmente
  const getSelectedYear = () => {
    if (!filters.dateMin || !filters.dateMax || !meta?.dateMin || !meta?.dateMax) return null
    const minYear = filters.dateMin.getFullYear()
    const maxYear = filters.dateMax.getFullYear()
    
    // Verificar si el rango corresponde a un año completo
    const minDate = new Date(minYear, 0, 1) // 1 de enero
    const maxDate = new Date(maxYear, 11, 31, 23, 59, 59, 999) // 31 de diciembre
    if (
      filters.dateMin.getTime() === minDate.getTime() &&
      filters.dateMax.getTime() === maxDate.getTime() &&
      minYear === maxYear
    ) {
      return minYear
    }
    
    // Verificar si el rango corresponde al rango completo (todos los años)
    if (
      filters.dateMin.getTime() === meta.dateMin.getTime() &&
      filters.dateMax.getTime() === meta.dateMax.getTime()
    ) {
      return 'all' // Indica que todos los años están seleccionados
    }
    
    return null
  }

  const selectedYear = getSelectedYear()

  // Manejar selección de año
  const handleYearSelect = (year) => {
    if (year === 'all') {
      // Seleccionar todos los años (rango completo)
      updateFilter('dateMin', meta.dateMin)
      updateFilter('dateMax', meta.dateMax)
    } else {
      // Seleccionar un año específico
      const yearStart = new Date(year, 0, 1) // 1 de enero
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999) // 31 de diciembre
      updateFilter('dateMin', yearStart)
      updateFilter('dateMax', yearEnd)
    }
  }

  return (
    <div className="bg-slate-800/30 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Year Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs font-medium">
              Año {selectedYear && selectedYear !== 'all' && `(${selectedYear})`}
              {selectedYear === 'all' && '(Todos)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {/* Botón "Todos los años" */}
              <button
                onClick={() => handleYearSelect('all')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedYear === 'all'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }`}
              >
                Todos
              </button>
              {/* Botones de años individuales */}
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedYear === year
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Map Select */}
          <Select
            label="Mapa"
            value={filters.map}
            onChange={(v) => updateFilter('map', v)}
            options={filterOptions.maps}
          />

          {/* Role Select */}
          <Select
            label="Rol"
            value={filters.role}
            onChange={(v) => updateFilter('role', v)}
            options={filterOptions.roles}
          />

          {/* Player Select */}
          <Select
            label="Jugador"
            value={filters.player}
            onChange={(v) => updateFilter('player', v)}
            options={filterOptions.players}
          />

          {/* Winner Filter */}
          <Select
            label="Resultado"
            value={filters.winner}
            onChange={(v) => updateFilter('winner', v)}
            options={filterOptions.winner}
          />

          {/* Only Listed Players Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-600">
            <input
              type="checkbox"
              id="onlyListedPlayers"
              checked={filters.onlyListedPlayers || false}
              onChange={(e) => updateFilter('onlyListedPlayers', e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
            />
            <label 
              htmlFor="onlyListedPlayers" 
              className="text-sm text-slate-300 cursor-pointer select-none"
            >
              Solo jugadores de la lista
            </label>
          </div>

          {/* Search */}
          <SearchInput
            value={filters.search}
            onChange={(v) => updateFilter('search', v)}
            placeholder="Buscar héroe o jugador..."
            className="w-48"
          />

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white 
              hover:bg-slate-700 rounded-lg transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}
