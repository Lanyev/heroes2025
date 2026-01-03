import { useMemo } from 'react'
import { SectionShell } from '../app/layout/SectionShell'
import { EmptyState } from '../components/EmptyState'
import { calculateFunFacts } from '../data/metrics'
import { formatNumber, formatPercent, formatDuration, formatCompact } from '../utils/format'
import clsx from 'clsx'

/**
 * Award Card component for fun facts
 */
function AwardCard({ title, icon, winner, value, description, color = 'indigo' }) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    red: 'from-red-500/20 to-pink-500/20 border-red-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
  }

  return (
    <div className={clsx(
      'bg-gradient-to-br rounded-xl p-6 border',
      'hover:scale-[1.02] transition-transform duration-300',
      'animate-fade-in',
      colorClasses[color] || colorClasses.indigo
    )}>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <div className="text-2xl font-bold text-white mb-2">{winner}</div>
          <div className="text-xl font-semibold text-slate-300 mb-2">{value}</div>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Fun Facts page with awards and interesting statistics
 */
export function FunFacts({ rows }) {
  const facts = useMemo(() => calculateFunFacts(rows), [rows])
  
  if (rows.length === 0) {
    return <EmptyState />
  }

  const awards = [
    facts.mostOnFire && {
      title: '🔥 Most On Fire',
      icon: '🔥',
      winner: facts.mostOnFire.name,
      value: formatDuration(facts.mostOnFire.value),
      description: 'El jugador que más tiempo ha pasado "on fire" durante las partidas. ¡Imparable!',
      color: 'amber'
    },
    facts.mostTimeDead && {
      title: '💀 Most Time Dead',
      icon: '⏰',
      winner: facts.mostTimeDead.name,
      value: formatDuration(facts.mostTimeDead.value),
      description: 'Ha pasado más tiempo mirando la pantalla gris que jugando. ¡Récord!',
      color: 'purple'
    },
    facts.kamikazeAward && {
      title: '💣 Kamikaze Award',
      icon: '💣',
      winner: facts.kamikazeAward.name,
      value: `${facts.kamikazeAward.value.toFixed(1)} muertes/partida`,
      description: `En ${facts.kamikazeAward.matches} partidas, ha demostrado un compromiso inquebrantable con el respawn.`,
      color: 'red'
    },
    facts.clutchHero && {
      title: '🎯 Clutch Hero',
      icon: '🎯',
      winner: facts.clutchHero.name,
      value: `${formatPercent(facts.clutchHero.winRate)} WR`,
      description: `Solo ${facts.clutchHero.matches} partidas, pero con un winrate impresionante. Héroe secreto.`,
      color: 'emerald'
    },
    facts.mostViolentMatch && {
      title: '⚔️ Most Violent Match',
      icon: '💥',
      winner: `${facts.mostViolentMatch.playerName} con ${facts.mostViolentMatch.heroName}`,
      value: formatCompact(facts.mostViolentMatch.value) + ' daño total',
      description: `En ${facts.mostViolentMatch.map}. Una partida para recordar... o para olvidar.`,
      color: 'cyan'
    },
    facts.cursedMap && {
      title: '☠️ Cursed Map',
      icon: '🗺️',
      winner: facts.cursedMap.name,
      value: `${formatPercent(facts.cursedMap.winRate)} WR`,
      description: `En ${facts.cursedMap.matches} partidas, este mapa ha demostrado ser una pesadilla.`,
      color: 'purple'
    }
  ].filter(Boolean)

  return (
    <div className="space-y-8">
      <SectionShell 
        title="🏆 Geekos Awards" 
        description="Los premios más prestigiosos (y cuestionables) de la comunidad"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {awards.map((award, idx) => (
            <AwardCard key={idx} {...award} />
          ))}
        </div>
      </SectionShell>

      {/* Additional Fun Stats */}
      <SectionShell title="📊 Datos Curiosos">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Sobre los Awards</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-start gap-2">
                  <span>🔥</span>
                  <span><strong>Most On Fire:</strong> Tiempo total "on fire" sumando todas las partidas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💀</span>
                  <span><strong>Most Time Dead:</strong> Tiempo total muerto (SpentDead) sumado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💣</span>
                  <span><strong>Kamikaze:</strong> Promedio de muertes más alto (mínimo 10 partidas).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎯</span>
                  <span><strong>Clutch Hero:</strong> Héroe con WR ≥60% y entre 5-15 partidas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💥</span>
                  <span><strong>Most Violent:</strong> Mayor HeroDamage + SiegeDamage en una partida.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🗺️</span>
                  <span><strong>Cursed Map:</strong> Mapa con peor winrate (mínimo 10 partidas).</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Estadísticas del Dataset</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>📊 Total de registros analizados: <span className="text-white font-medium">{formatNumber(rows.length)}</span></li>
                <li>🎮 Estos datos representan partidas reales de la comunidad Geekos</li>
                <li>📅 Los datos abarcan la temporada 2024-2025</li>
                <li>🔧 Los filtros globales afectan todos los cálculos</li>
              </ul>
            </div>
          </div>
        </div>
      </SectionShell>
    </div>
  )
}
