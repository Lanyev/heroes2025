import { Select } from './Select'
import { HERO_METRICS } from '../data/heroMetrics'

/**
 * Metric picker component for heroes page
 * Allows selecting ranking metric, min matches, and top N
 */
export function HeroMetricPicker({
  selectedMetric,
  onMetricChange,
  minMatches,
  onMinMatchesChange,
  topN,
  onTopNChange
}) {
  const metricOptions = HERO_METRICS.map(m => ({
    value: m.key,
    label: m.label
  }))

  const topNOptions = [
    { value: '5', label: 'Top 5' },
    { value: '10', label: 'Top 10' },
    { value: '15', label: 'Top 15' },
    { value: '25', label: 'Top 25' }
  ]

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
      <Select
        label="Métrica"
        value={selectedMetric}
        onChange={onMetricChange}
        options={metricOptions}
      />

      <div className="flex flex-col gap-1">
        <label className="text-slate-400 text-xs font-medium">
          Mín. Partidas
        </label>
        <input
          type="number"
          value={minMatches}
          onChange={(e) => onMinMatchesChange(Math.max(0, parseInt(e.target.value) || 0))}
          min="0"
          max="100"
          className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            hover:border-slate-500 transition-colors"
        />
      </div>

      <Select
        label="Mostrar"
        value={String(topN)}
        onChange={(v) => onTopNChange(parseInt(v))}
        options={topNOptions}
      />
    </div>
  )
}
