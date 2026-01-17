import { getPublicPath } from '../../utils/paths'

/**
 * Main header component with title and subtitle
 */
export function Header() {
  return (
    <header className="bg-layer-mid/90 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 shadow-md-custom relative w-full h-16 sm:h-20 lg:h-[84px]">
      <div className="h-full flex items-center justify-center relative px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <img 
            src={getPublicPath('/banner_logo.png')} 
            alt="Alan Awards 2025 Logo" 
            className="h-10 sm:h-14 lg:h-20 object-contain"
          />
          <div className="flex flex-col items-start">
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase leading-tight">
              ALAN AWARDS 2025
            </h1>
            <p className="text-slate-400 text-[10px] sm:text-xs leading-tight hidden sm:block">
              Estadísticas de Heroes of the Storm 2023-2025
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
