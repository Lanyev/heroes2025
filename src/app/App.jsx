import { useState, useMemo } from 'react'
import { useDataset } from '../data/useDataset'
import { Header } from './layout/Header'
import { FilterBar } from './layout/FilterBar'
import { TabNav, getRouteComponent } from './routes'
import { LoadingState, ErrorState } from '../components/LoadingState'

/**
 * Main App component
 */
function App() {
  const [activeRoute, setActiveRoute] = useState('overview')
  
  const {
    loading,
    error,
    rows,
    meta,
    filters,
    filterOptions,
    updateFilter,
    resetFilters
  } = useDataset()

  // Get active page component
  const PageComponent = useMemo(() => getRouteComponent(activeRoute), [activeRoute])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {!loading && !error && (
        <>
          <FilterBar
            filters={filters}
            filterOptions={filterOptions}
            meta={meta}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
          />
          <TabNav
            activeRoute={activeRoute}
            onRouteChange={setActiveRoute}
          />
        </>
      )}
      
      <main className="flex-1">
        {activeRoute === 'premios' ? (
          <PageComponent rows={rows} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {loading ? (
              <LoadingState message="Cargando datos del CSV..." />
            ) : error ? (
              <ErrorState 
                error={error} 
                onRetry={() => window.location.reload()} 
              />
            ) : (
              <PageComponent rows={rows} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-sm">
            Geekos HotS Dashboard 2024-2025 • Datos de {meta?.totalRows || 0} registros
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
