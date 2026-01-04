import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { Badge } from './Badge'
import { HeroAvatar } from './HeroAvatar'
import { formatNumber, formatPercent, formatCompact, formatDecimal, formatDuration } from '../utils/format'

/**
 * Format cell value based on column type
 */
function formatCellValue(value, type) {
  if (value === null || value === undefined) return '-'
  
  switch (type) {
    case 'number':
      return formatNumber(value)
    case 'percent':
      return formatPercent(value)
    case 'compact':
      return formatCompact(value)
    case 'decimal':
      return formatDecimal(value, 2)
    case 'duration':
      return formatDuration(value)
    case 'string':
    default:
      return value
  }
}

/**
 * Sort icon component
 */
function SortIcon({ direction }) {
  if (!direction) {
    return (
      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
  
  return (
    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d={direction === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} 
      />
    </svg>
  )
}

/**
 * Generic sortable table component
 * @param {Object} props
 * @param {Array} props.columns - Column definitions [{key, label, sortable, type}]
 * @param {Array} props.rows - Data rows
 * @param {Object} props.sort - Current sort state {key, direction}
 * @param {Function} props.onSort - Sort handler (key) => void
 * @param {Function} props.onRowClick - Row click handler (row) => void
 * @param {Function} props.renderCell - Optional custom cell renderer (row, column) => ReactNode
 * @param {boolean} props.showHeroAvatar - Show avatar for hero name column (default false)
 * @param {string} props.className - Additional CSS classes
 * @param {Array} props.allRows - All original rows (for calculating top players)
 * @param {Function} props.getTopPlayersForHero - Function to get top players for a hero
 */
export function SortableTable({
  columns,
  rows,
  sort,
  onSort,
  onRowClick,
  renderCell,
  showHeroAvatar = false,
  emptyMessage = 'No hay datos',
  className,
  allRows,
  getTopPlayersForHero
}) {
  const [tooltip, setTooltip] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef(null)
  const tableRef = useRef(null)

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  // Handle mouse move to track cursor position
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (tooltip) {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
    }

    if (tooltip) {
      window.addEventListener('mousemove', handleMouseMove)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [tooltip])

  // Handle tooltip positioning - follows cursor with offset
  useEffect(() => {
    if (tooltip && tooltipRef.current) {
      const tooltipEl = tooltipRef.current
      
      // Force a layout calculation to get actual dimensions
      tooltipEl.style.visibility = 'hidden'
      tooltipEl.style.display = 'block'
      const tooltipWidth = tooltipEl.offsetWidth
      const tooltipHeight = tooltipEl.offsetHeight
      tooltipEl.style.visibility = 'visible'
      
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Offset from cursor - distance prudente para no estorbar
      const offsetX = 15
      const offsetY = 15
      
      // Calculate position relative to cursor
      let left = mousePosition.x + offsetX
      let top = mousePosition.y + offsetY
      
      // Adjust if tooltip would go off screen horizontally
      if (left + tooltipWidth > viewportWidth - 10) {
        // Position to the left of cursor
        left = mousePosition.x - tooltipWidth - offsetX
      }
      
      // Ensure tooltip doesn't go off screen on the left
      if (left < 10) {
        left = 10
      }
      
      // Adjust if tooltip would go off screen vertically
      if (top + tooltipHeight > viewportHeight - 10) {
        // Position above cursor
        top = mousePosition.y - tooltipHeight - offsetY
      }
      
      // Ensure tooltip doesn't go off screen at the top
      if (top < 10) {
        top = 10
      }
      
      tooltipEl.style.left = `${left}px`
      tooltipEl.style.top = `${top}px`
      tooltipEl.style.transform = 'none' // Remove translateY since we're positioning from top-left
    }
  }, [tooltip, mousePosition])

  const handleHeaderClick = (column) => {
    if (column.sortable && onSort) {
      onSort(column.key)
    }
  }

  const handleRowMouseEnter = (e, row) => {
    if (!allRows || !getTopPlayersForHero || !row.name) return
    
    const topPlayers = getTopPlayersForHero(allRows, row.name, 3, 3)
    if (topPlayers.length === 0) return
    
    // Initialize mouse position when tooltip appears
    setMousePosition({ x: e.clientX, y: e.clientY })
    setTooltip({
      heroName: row.name,
      players: topPlayers
    })
  }

  const handleRowMouseLeave = () => {
    setTooltip(null)
  }

  return (
    <div className={clsx('overflow-x-auto relative', className)} ref={tableRef}>
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-700/50 backdrop-blur-sm">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleHeaderClick(col)}
                className={clsx(
                  'px-3 py-3 text-slate-300 font-medium text-sm whitespace-nowrap',
                  col.key === 'name' ? 'text-left' : 'text-right',
                  col.sortable && 'cursor-pointer hover:text-white hover:bg-slate-600/50 transition-colors'
                )}
              >
                <div className={clsx(
                  'flex items-center gap-1',
                  col.key === 'name' ? 'justify-start' : 'justify-end'
                )}>
                  <span>{col.label}</span>
                  {col.sortable && (
                    <SortIcon direction={sort?.key === col.key ? sort.direction : null} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {rows.map((row, idx) => (
            <tr
              key={row.name || idx}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => handleRowMouseEnter(e, row)}
              onMouseLeave={handleRowMouseLeave}
              className={clsx(
                'hover:bg-slate-700/30 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    'px-3 py-3',
                    col.key === 'name' ? 'text-left' : 'text-right'
                  )}
                >
                  {renderCell ? renderCell(row, col) : (
                    <CellContent row={row} column={col} showHeroAvatar={showHeroAvatar} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Tooltip for top players */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 min-w-[240px] pointer-events-none"
        >
          {/* Header with hero name */}
          <div className="mb-3 pb-2 border-b border-slate-700">
            <div className="font-semibold text-white truncate">{tooltip.heroName}</div>
          </div>

          {/* Column headers */}
          <div className="flex items-center justify-between gap-4 text-xs font-medium text-slate-400 mb-2 pb-1 border-b border-slate-700/50">
            <span>Jugador</span>
            <div className="flex items-center gap-3 shrink-0">
              <span>Partidas</span>
              <span>Win Rate</span>
            </div>
          </div>

          {/* Players list */}
          <div className="space-y-1.5">
            {tooltip.players.map((player, idx) => (
              <div key={player.name} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-300 truncate">
                  {idx + 1}. {player.name}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-200 text-right min-w-[50px]">{formatNumber(player.matches)}</span>
                  <Badge 
                    variant={player.winRate >= 0.55 ? 'success' : player.winRate <= 0.45 ? 'danger' : 'default'}
                    size="sm"
                  >
                    {formatPercent(player.winRate)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Default cell content renderer
 */
function CellContent({ row, column, showHeroAvatar = false }) {
  const value = row[column.key]
  
  // Hero name with avatar and low sample indicator
  if (column.key === 'name') {
    return (
      <div className="flex items-center gap-2">
        {showHeroAvatar && (
          <HeroAvatar 
            name={value} 
            role={row.role}
            size="sm" 
            showBorder={true}
          />
        )}
        <span className="text-white font-medium truncate max-w-[140px]" title={value}>
          {value}
        </span>
        {row.lowSample && (
          <Badge variant="warning" size="sm" title={row.confidenceNote}>
            ?
          </Badge>
        )}
      </div>
    )
  }
  
  // Win rate with badge
  if (column.key === 'winRate') {
    return (
      <Badge 
        variant={value >= 0.55 ? 'success' : value <= 0.45 ? 'danger' : 'default'}
      >
        {formatPercent(value)}
      </Badge>
    )
  }
  
  // Default formatting
  return (
    <span className="text-slate-300">
      {formatCellValue(value, column.type)}
    </span>
  )
}
