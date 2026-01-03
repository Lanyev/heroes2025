import { useRef } from 'react'
import clsx from 'clsx'
import { exportToPng } from '../data/exportHelpers'

/**
 * Button to export a chart container as PNG
 * @param {Object} props
 * @param {React.RefObject} props.chartRef - Ref to the chart container
 * @param {string} props.filename - Export filename
 * @param {string} props.className - Additional CSS classes
 */
export function ChartExportButton({ chartRef, filename = 'chart', className }) {
  const handleExport = async () => {
    if (chartRef.current) {
      await exportToPng(chartRef.current, filename)
    }
  }

  return (
    <button
      onClick={handleExport}
      className={clsx(
        'flex items-center gap-1 px-2 py-1 text-xs text-slate-400',
        'hover:text-white hover:bg-slate-700 rounded transition-colors',
        className
      )}
      title="Exportar como PNG"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
      <span>PNG</span>
    </button>
  )
}

/**
 * Button to export table data as CSV
 * @param {Object} props
 * @param {Function} props.onExport - Export handler
 * @param {string} props.className - Additional CSS classes
 */
export function TableExportButton({ onExport, className }) {
  return (
    <button
      onClick={onExport}
      className={clsx(
        'flex items-center gap-1 px-2 py-1 text-xs text-slate-400',
        'hover:text-white hover:bg-slate-700 rounded transition-colors',
        className
      )}
      title="Exportar como CSV"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      </svg>
      <span>CSV</span>
    </button>
  )
}
