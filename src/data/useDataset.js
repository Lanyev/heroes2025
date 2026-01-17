import { useState, useEffect, useMemo, useCallback } from 'react'
import { loadCsv } from './loadCsv'
import { normalizeData } from './normalize'
import { createFilterState, applyFilters, getFilterOptions } from './filters'
import { loadPlayersList } from './loadPlayersList'

/**
 * Main hook for loading and managing dataset
 * @returns {Object}
 */
export function useDataset() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState(null)
  const [listedPlayers, setListedPlayers] = useState(null)
  
  // Load and normalize data on mount
  useEffect(() => {
    let cancelled = false
    
    async function load() {
      try {
        setLoading(true)
        setError(null)
        
        // Load CSV and players list in parallel
        const [rawRows, playersSet] = await Promise.all([
          loadCsv(),
          loadPlayersList()
        ])
        
        if (cancelled) return
        
        const { rows: normalizedRows, meta: dataMeta } = normalizeData(rawRows)
        
        setRows(normalizedRows)
        setMeta(dataMeta)
        setFilters(createFilterState(dataMeta))
        setListedPlayers(playersSet)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      }
    }
    
    load()
    
    return () => {
      cancelled = true
    }
  }, [])
  
  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => prev ? { ...prev, [key]: value } : prev)
  }, [])
  
  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    if (meta) {
      setFilters(createFilterState(meta))
    }
  }, [meta])
  
  // Compute filtered rows
  const filteredRows = useMemo(() => {
    if (!rows.length || !filters) return []
    return applyFilters(rows, filters, listedPlayers)
  }, [rows, filters, listedPlayers])
  
  // Get filter options
  const filterOptions = useMemo(() => {
    if (!meta) return null
    return getFilterOptions(meta)
  }, [meta])
  
  return {
    loading,
    error,
    rows: filteredRows,
    allRows: rows,
    meta,
    filters,
    filterOptions,
    updateFilter,
    resetFilters,
    listedPlayers
  }
}
