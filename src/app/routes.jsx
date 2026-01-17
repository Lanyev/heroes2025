import { Overview } from '../pages/Overview'
import { Heroes } from '../pages/Heroes'
import { Stats } from '../pages/Stats'
import { Players } from '../pages/Players'
import { Premios } from '../pages/Premios'
import { Geekos } from '../pages/Geekos'
import { YearComparison } from '../pages/YearComparison'

/**
 * Route configuration for the dashboard
 */
export const routes = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '📊',
    component: Overview
  },
  {
    id: 'heroes',
    label: 'Héroes',
    icon: '⚔️',
    component: Heroes
  },
  // {
  //   id: 'stats',
  //   label: 'Estadísticas',
  //   icon: '📈',
  //   component: Stats
  // },
  {
    id: 'players',
    label: 'Jugadores',
    icon: '👤',
    component: Players
  },
  {
    id: 'comparison',
    label: 'Comparación',
    icon: '📊',
    component: YearComparison
  },
  {
    id: 'geekos',
    label: 'Geekos TCG',
    icon: '🎴',
    component: Geekos
  },
  {
    id: 'premios',
    label: 'Premios',
    icon: '🎖️',
    component: Premios
  }
]

/**
 * Tab navigation component
 * @param {Object} props
 * @param {string} props.activeRoute - Current active route ID
 * @param {Function} props.onRouteChange - Route change handler
 */
export function TabNav({ activeRoute, onRouteChange }) {
  return (
    <nav className="bg-layer-mid/50 border-b border-slate-700/50 backdrop-blur-sm shadow-sm-custom relative z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto py-2 sm:py-3 scrollbar-hide -mx-3 sm:-mx-4 lg:-mx-8 px-3 sm:px-4 lg:px-8">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => onRouteChange(route.id)}
              className={`
                flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium
                transition-all duration-200 whitespace-nowrap relative shrink-0
                ${activeRoute === route.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-elevated ring-2 ring-indigo-400/50'
                  : 'bg-slate-700/80 text-slate-200 border border-slate-600/80 hover:bg-slate-600 hover:border-slate-500 hover:text-white shadow-sm-custom hover:shadow-md-custom'
                }
              `}
            >
              <span className="hidden sm:inline">{route.icon}</span>
              <span>{route.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

/**
 * Get component for a route ID
 * @param {string} routeId 
 * @returns {React.ComponentType}
 */
export function getRouteComponent(routeId) {
  const route = routes.find(r => r.id === routeId)
  return route?.component || Overview
}
