import { Overview } from '../pages/Overview'
import { Heroes } from '../pages/Heroes'
import { Players } from '../pages/Players'
import { Maps } from '../pages/Maps'
import { FunFacts } from '../pages/FunFacts'

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
    id: 'players',
    label: 'Jugadores',
    icon: '👤',
    component: Players
  },
  {
    id: 'maps',
    label: 'Mapas',
    icon: '🗺️',
    component: Maps
  },
  {
    id: 'funfacts',
    label: 'Fun Facts',
    icon: '🏆',
    component: FunFacts
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
    <nav className="bg-slate-800/50 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto py-2">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => onRouteChange(route.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${activeRoute === route.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              <span>{route.icon}</span>
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
