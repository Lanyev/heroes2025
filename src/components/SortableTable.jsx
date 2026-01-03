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
  className
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const handleHeaderClick = (column) => {
    if (column.sortable && onSort) {
      onSort(column.key)
    }
  }

  return (
    <div className={clsx('overflow-x-auto', className)}>
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
