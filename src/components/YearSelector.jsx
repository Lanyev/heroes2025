import { useMemo } from 'react'
import { getYearColor } from '../data/yearComparison'
import { Badge } from './Badge'

/**
 * Year selector component with pill-style checkboxes
 * @param {Object} props
 * @param {Array<number>} props.availableYears - Available years to select
 * @param {Array<number>} props.selectedYears - Currently selected years
 * @param {Function} props.onYearsChange - Callback when selection changes
 */
export function YearSelector({ availableYears, selectedYears, onYearsChange }) {
  const handleYearToggle = (year) => {
    if (selectedYears.includes(year)) {
      // Deselect year (but keep at least 2 selected)
      if (selectedYears.length > 2) {
        onYearsChange(selectedYears.filter(y => y !== year))
      }
    } else {
      // Select year (max 5 years)
      if (selectedYears.length < 5) {
        onYearsChange([...selectedYears, year].sort((a, b) => b - a))
      }
    }
  }
  
  const handleSelectAll = () => {
    if (selectedYears.length === availableYears.length) {
      // Deselect all except the two most recent
      const twoMostRecent = availableYears.slice(0, 2)
      onYearsChange(twoMostRecent)
    } else {
      // Select all (up to 5)
      const toSelect = availableYears.slice(0, Math.min(5, availableYears.length))
      onYearsChange(toSelect)
    }
  }
  
  const canCompare = selectedYears.length >= 2
  const allSelected = selectedYears.length === availableYears.length || 
                      (selectedYears.length === Math.min(5, availableYears.length))
  
  return (
    <div className="bg-surface-1/40 rounded-2xl p-4 border border-slate-700/30 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-white font-semibold text-base">
              Seleccionar Años para Comparar
            </h3>
            <Badge variant="info" className="text-xs">
              Solo Geekos
            </Badge>
          </div>
          {availableYears.length === 0 ? (
            <div className="py-4">
              <p className="text-slate-400 text-sm">
                No hay años disponibles para comparar
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => {
              const isSelected = selectedYears.includes(year)
              const color = getYearColor(year)
              
              return (
                <button
                  key={year}
                  onClick={() => handleYearToggle(year)}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-semibold
                    transition-all duration-200 focus-ring-accent
                    min-w-[80px] text-center
                    ${isSelected
                      ? 'text-white shadow-elevated ring-2 transform scale-105'
                      : 'bg-slate-700/80 text-slate-300 border border-slate-600/80 hover:bg-slate-600 hover:border-slate-500 hover:text-white hover:scale-105'
                    }
                  `}
                  style={isSelected ? {
                    backgroundColor: color,
                    borderColor: color,
                    ringColor: `${color}50`
                  } : {}}
                >
                  {year}
                </button>
              )
            })}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 items-end">
          <div className="text-slate-400 text-xs">
            {selectedYears.length} {selectedYears.length === 1 ? 'año' : 'años'} seleccionado{selectedYears.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-700/80 text-slate-300 border border-slate-600/80 hover:bg-slate-600 hover:border-slate-500 hover:text-white transition-all duration-200"
          >
            {allSelected ? 'Deseleccionar' : 'Seleccionar todos'}
          </button>
        </div>
      </div>
      
      {!canCompare && (
        <div className="mt-3 text-amber-400 text-xs flex items-center gap-1">
          <span>⚠️</span>
          <span>Selecciona al menos 2 años para comparar</span>
        </div>
      )}
    </div>
  )
}
