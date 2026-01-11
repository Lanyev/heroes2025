/**
 * Main header component with title and subtitle
 */
export function Header() {
  return (
    <header className="bg-layer-mid/90 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 shadow-md-custom relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl">⚔️</div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Geekos HotS Dashboard
            </h1>
            <p className="text-slate-400 text-sm">
              Estadísticas de Heroes of the Storm 2024-2025
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
