import { useState, useMemo } from 'react'
import { useDataset } from '../data/useDataset'
import { Header } from './layout/Header'
import { FilterBar } from './layout/FilterBar'
import { TabNav, getRouteComponent } from './routes'
import { LoadingState, ErrorState } from '../components/LoadingState'
import { BannerLoader } from '../components/BannerLoader'

/**
 * Main App component
 */
function App() {
  const [activeRoute, setActiveRoute] = useState('overview')
  const [showBanner, setShowBanner] = useState(true)
  
  const {
    loading,
    error,
    rows,
    allRows,
    meta,
    filters,
    filterOptions,
    updateFilter,
    resetFilters,
    listedPlayers,
    loadingProgress
  } = useDataset()

  // Get active page component
  const PageComponent = useMemo(() => getRouteComponent(activeRoute), [activeRoute])

  return (
    <>
      {showBanner && (
        <BannerLoader onComplete={() => setShowBanner(false)} />
      )}
      <Header />
      {!showBanner && (
        <div className="min-h-screen flex flex-col relative animate-fade-in">
      
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
      
      <main className="flex-1 relative z-10">
        {activeRoute === 'premios' || activeRoute === 'geekos' ? (
          <PageComponent rows={rows} />
        ) : activeRoute === 'comparison' ? (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            {loading ? (
              <LoadingState message="Cargando datos del CSV..." progress={loadingProgress} />
            ) : error ? (
              <ErrorState 
                error={error} 
                onRetry={() => window.location.reload()} 
              />
            ) : (
              <PageComponent allRows={allRows} meta={meta} listedPlayers={listedPlayers} />
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            {loading ? (
              <LoadingState message="Cargando datos del CSV..." progress={loadingProgress} />
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
      <footer className="bg-layer-mid/50 border-t border-slate-700/50 py-4 sm:py-6 shadow-sm-custom">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center space-y-1.5 sm:space-y-2">
            <p className="text-slate-300 text-sm sm:text-base font-semibold">
              Alan Awards Dashboard 2023-2025
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-slate-500 text-xs sm:text-sm">
              <span>
                {meta?.totalRows || 0} partidas registradas
              </span>
              {meta?.players && meta.players.length > 0 && (
                <span>
                  • {meta.players.length} jugadores
                </span>
              )}
              {meta?.heroes && meta.heroes.length > 0 && (
                <span>
                  • {meta.heroes.length} héroes
                </span>
              )}
              {meta?.maps && meta.maps.length > 0 && (
                <span>
                  • {meta.maps.length} mapas
                </span>
              )}
              {meta?.dateMin && meta?.dateMax && (
                <span className="hidden sm:inline">
                  • {new Date(meta.dateMin).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })} - {new Date(meta.dateMax).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[10px] sm:text-xs mt-2 sm:mt-3">
              Estadísticas de Heroes of the Storm de la comunidad Geekos
            </p>
          </div>
        </div>
      </footer>
      </div>
      )}
    </>
  )
}

export default App
