import { Overview } from '../pages/Overview'
import { Heroes } from '../pages/Heroes'
import { Stats } from '../pages/Stats'
import { Players } from '../pages/Players'
import { Premios } from '../pages/Premios'

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
  {
    id: 'stats',
    label: 'Estadísticas',
    icon: '📈',
    component: Stats
  },
  {
    id: 'players',
    label: 'Jugadores',
    icon: '👤',
    component: Players
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto py-3">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => onRouteChange(route.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 whitespace-nowrap relative
                ${activeRoute === route.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-elevated ring-2 ring-indigo-400/50'
                  : 'bg-slate-700/80 text-slate-200 border border-slate-600/80 hover:bg-slate-600 hover:border-slate-500 hover:text-white shadow-sm-custom hover:shadow-md-custom'
                }
              `}
            >
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
