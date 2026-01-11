import { useState } from 'react'
import { Select } from '../../components/Select'

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
  const [isCompact, setIsCompact] = useState(true) // Default to compact mode
  
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

  // Get active filters count
  const getActiveFilters = () => {
    const active = []
    if (selectedYear && selectedYear !== 'all') active.push({ type: 'year', value: selectedYear, label: `Año: ${selectedYear}` })
    if (filters.map !== 'all') active.push({ type: 'map', value: filters.map, label: `Mapa: ${filters.map}` })
    if (filters.role !== 'all') active.push({ type: 'role', value: filters.role, label: `Rol: ${filters.role}` })
    if (filters.player !== 'all') active.push({ type: 'player', value: filters.player, label: `Jugador: ${filters.player}` })
    if (filters.winner !== 'all') {
      const winnerLabel = filters.winner === 'wins' ? 'Victorias' : 'Derrotas'
      active.push({ type: 'winner', value: filters.winner, label: `Resultado: ${winnerLabel}` })
    }
    if (filters.onlyListedPlayers) active.push({ type: 'geekos', value: true, label: 'Geekos' })
    return active
  }

  const activeFilters = getActiveFilters()

  // Compact mode - show only active filters
  if (isCompact) {
    return (
      <div className="bg-layer-mid/50 border-b border-slate-700/50 backdrop-blur-sm shadow-sm-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.length > 0 ? (
                activeFilters.map((filter, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded text-xs shadow-sm-custom">
                    <span className="text-indigo-300 font-medium">
                      {filter.label}
                    </span>
                    <button
                      onClick={() => {
                        if (filter.type === 'year') handleYearSelect('all')
                        else if (filter.type === 'geekos') updateFilter('onlyListedPlayers', false)
                        else updateFilter(filter.type, 'all')
                      }}
                      className="text-indigo-400 hover:text-indigo-200 transition-colors ml-0.5"
                      title="Eliminar filtro"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-slate-400 text-xs">Sin filtros activos</span>
              )}
            </div>
            <button
              onClick={() => setIsCompact(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition-all shadow-sm-custom hover:shadow-md-custom"
            >
              Expandir
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Expanded mode - show all filters
  return (
    <div className="bg-gradient-to-b from-slate-800/60 to-slate-800/40 border-b border-slate-700/70 shadow-md-custom backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Filtros</h3>
          <button
            onClick={() => setIsCompact(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition-all shadow-sm-custom hover:shadow-md-custom"
          >
            Compactar
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {/* Year Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
              Año {selectedYear && selectedYear !== 'all' && `(${selectedYear})`}
              {selectedYear === 'all' && '(Todos)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {/* Botón "Todos los años" */}
              <button
                onClick={() => handleYearSelect('all')}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedYear === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow-elevated ring-2 ring-indigo-400/50'
                    : 'bg-slate-700/80 text-slate-200 border border-slate-600/80 hover:bg-slate-600 hover:border-slate-500 hover:text-white shadow-sm-custom hover:shadow-md-custom'
                }`}
              >
                Todos
              </button>
              {/* Botones de años individuales */}
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    selectedYear === year
                      ? 'bg-indigo-600 text-white font-semibold shadow-elevated ring-2 ring-indigo-400/50'
                      : 'bg-slate-700/80 text-slate-200 border border-slate-600/80 hover:bg-slate-600 hover:border-slate-500 hover:text-white shadow-sm-custom hover:shadow-md-custom'
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
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
            filters.onlyListedPlayers
              ? 'bg-indigo-600/20 border-indigo-500/50 ring-2 ring-indigo-400/30 shadow-sm-custom'
              : 'bg-slate-700/80 border-slate-600/80 hover:bg-slate-600/80 hover:border-slate-500 shadow-sm-custom hover:shadow-md-custom'
          }`}>
            <input
              type="checkbox"
              id="onlyListedPlayers"
              checked={filters.onlyListedPlayers || false}
              onChange={(e) => updateFilter('onlyListedPlayers', e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-500 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer transition-all"
            />
            <label 
              htmlFor="onlyListedPlayers" 
              className={`text-sm font-medium cursor-pointer select-none transition-colors ${
                filters.onlyListedPlayers ? 'text-indigo-200' : 'text-slate-300'
              }`}
            >
              Geekos
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white 
              hover:bg-slate-700/80 rounded-lg transition-all duration-200 border border-slate-600/80
              hover:border-slate-500 shadow-sm-custom hover:shadow-md-custom"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}
