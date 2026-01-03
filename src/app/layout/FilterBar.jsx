import { Select } from '../../components/Select'
import { SearchInput } from '../../components/SearchInput'
import { toISODateString } from '../../utils/date'

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

  const handleDateChange = (key, value) => {
    const date = value ? new Date(value) : null
    updateFilter(key, date)
  }

  return (
    <div className="bg-slate-800/30 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Date Range */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs font-medium">Desde</label>
            <input
              type="date"
              value={filters.dateMin ? toISODateString(filters.dateMin) : ''}
              min={meta?.dateMin ? toISODateString(meta.dateMin) : ''}
              max={meta?.dateMax ? toISODateString(meta.dateMax) : ''}
              onChange={(e) => handleDateChange('dateMin', e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                hover:border-slate-500 transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs font-medium">Hasta</label>
            <input
              type="date"
              value={filters.dateMax ? toISODateString(filters.dateMax) : ''}
              min={meta?.dateMin ? toISODateString(meta.dateMin) : ''}
              max={meta?.dateMax ? toISODateString(meta.dateMax) : ''}
              onChange={(e) => handleDateChange('dateMax', e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                hover:border-slate-500 transition-colors"
            />
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
