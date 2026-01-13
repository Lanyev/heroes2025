/**
 * Main header component with title and subtitle
 */
export function Header() {
  return (
    <header className="bg-layer-mid/90 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 shadow-md-custom relative w-full" style={{ height: '84px' }}>
      <div className="h-full flex items-center justify-center relative px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <img 
            src="/banner_logo.png" 
            alt="Alan Awards 2025 Logo" 
            className="h-full object-contain"
            style={{ maxHeight: '84px' }}
          />
          <div className="flex flex-col items-start ml-2">
            <h1 className="text-sm font-bold text-white tracking-tight uppercase">
              ALAN AWARDS 2025
            </h1>
            <p className="text-slate-400 text-xs">
              Estadísticas de Heroes of the Storm 2023-2025
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
