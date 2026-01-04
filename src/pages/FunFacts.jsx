import { useMemo } from 'react'
import { SectionShell } from '../app/layout/SectionShell'
import { EmptyState } from '../components/EmptyState'
import { calculateFunFacts } from '../data/metrics'
import { formatNumber, formatPercent, formatDuration, formatCompact, truncate } from '../utils/format'
import clsx from 'clsx'

/**
 * Award Card component for fun facts
 */
function AwardCard({ title, icon, winner, value, description, color = 'indigo', replayName, isWinner, imageId }) {
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
      'rounded-xl p-6 border relative overflow-hidden',
      'hover:scale-[1.02] transition-transform duration-300',
      'animate-fade-in',
      !imageId && (colorClasses[color] || colorClasses.indigo),
      imageId && 'bg-slate-800/50'
    )}>
      {/* Imagen de fondo si existe */}
      {imageId && (
        <>
          {/* Contenedor de imagen con gradiente de máscara para difuminar lado izquierdo */}
          <div className="absolute right-0 top-0 h-full w-auto overflow-hidden pointer-events-none">
            <img 
              src={`/highlight-images/${imageId}.jpg`}
              alt=""
              className="h-full w-auto object-contain object-right opacity-75"
              onError={(e) => {
                // Fallback si la imagen no existe: mostrar gradiente de fondo
                e.target.style.display = 'none'
                const parent = e.target.closest('.rounded-xl')
                if (parent) {
                  parent.className = `${colorClasses[color] || colorClasses.indigo} rounded-xl p-6 border relative overflow-hidden hover:scale-[1.02] transition-transform duration-300 animate-fade-in`
                }
              }}
            />
            {/* Gradiente overlay sobre la imagen para difuminar lado izquierdo */}
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                background: 'linear-gradient(to left, transparent 0%, rgba(15, 23, 42, 0.3) 30%, rgba(15, 23, 42, 0.7) 60%, rgba(15, 23, 42, 0.95) 100%)'
              }}
            />
          </div>
          {/* Overlay oscuro general sutil para mejorar legibilidad del texto */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-l from-slate-900/50 via-slate-900/20 to-transparent pointer-events-none" />
          {/* Gradiente de acento sutil por encima */}
          <div className={`absolute inset-0 w-full h-full ${colorClasses[color] || colorClasses.indigo} opacity-15 pointer-events-none`} />
        </>
      )}
      
      {/* Contenido de texto por encima */}
      <div className="flex items-start gap-4 relative z-10">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <div className="text-2xl font-bold text-white mb-2">{winner}</div>
          <div className="text-xl font-semibold text-slate-300 mb-2">{value}</div>
          <p className="text-slate-400 text-sm mb-2">{description}</p>
          {replayName && (
            <div className="mt-2">
              <span className={clsx(
                'text-xs font-medium px-1.5 py-0.5 rounded inline-block truncate max-w-full',
                isWinner 
                  ? 'bg-green-500/10 text-green-300 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-300 border border-red-500/20'
              )} title={replayName}>
                {truncate(replayName, 40)}
              </span>
            </div>
          )}
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
      value: formatDuration(facts.mostOnFire.value) + '/partida',
      description: `Promedio más alto de tiempo "on fire" por partida en ${facts.mostOnFire.matches} partidas. ¡Imparable!`,
      color: 'amber',
      imageId: null // No hay imagen específica
    },
    facts.mostTimeDead && {
      title: '💀 Most Time Dead',
      icon: '⏰',
      winner: facts.mostTimeDead.name,
      value: formatDuration(facts.mostTimeDead.value) + '/partida',
      description: `Promedio más alto de tiempo muerto por partida en ${facts.mostTimeDead.matches} partidas. ¡Récord!`,
      color: 'purple',
      imageId: 'most_time_dead'
    },
    facts.kamikazeAward && {
      title: '💣 Kamikaze Award',
      icon: '💣',
      winner: facts.kamikazeAward.name,
      value: `${facts.kamikazeAward.value.toFixed(1)} muertes/partida`,
      description: `En ${facts.kamikazeAward.matches} partidas, ha demostrado un compromiso inquebrantable con el respawn.`,
      color: 'red',
      imageId: 'most_deaths'
    },
    facts.clutchHero && {
      title: '🎯 Clutch Hero',
      icon: '🎯',
      winner: facts.clutchHero.name,
      value: `${formatPercent(facts.clutchHero.winRate)} WR`,
      description: `Solo ${facts.clutchHero.matches} partidas, pero con un winrate impresionante. Héroe secreto.`,
      color: 'emerald',
      imageId: null // No hay imagen específica
    },
    facts.mostViolentMatch && {
      title: '⚔️ Most Violent Match',
      icon: '💥',
      winner: `${facts.mostViolentMatch.playerName} con ${facts.mostViolentMatch.heroName}`,
      value: formatCompact(facts.mostViolentMatch.value) + ' daño total',
      description: `En ${facts.mostViolentMatch.map}. Una partida para recordar... o para olvidar.`,
      color: 'cyan',
      replayName: facts.mostViolentMatch.replayName,
      isWinner: facts.mostViolentMatch.winner,
      imageId: 'most_violent'
    },
    facts.cursedMap && {
      title: '☠️ Cursed Map',
      icon: '🗺️',
      winner: facts.cursedMap.name,
      value: `${formatPercent(facts.cursedMap.winRate)} WR`,
      description: `En ${facts.cursedMap.matches} partidas, este mapa ha demostrado ser una pesadilla.`,
      color: 'purple',
      imageId: null // No hay imagen específica
    },
    facts.medicOfYear && {
      title: '🏥 Medic of the Year',
      icon: '🏥',
      winner: facts.medicOfYear.name,
      value: formatCompact(facts.medicOfYear.value) + ' healing/partida',
      description: `Promedio más alto de healing/shielding por partida en ${facts.medicOfYear.matches} partidas. ¡Salvando vidas desde el minuto 1!`,
      color: 'emerald',
      imageId: 'most_healing'
    },
    facts.xpSponge && {
      title: '🧠 XP Sponge',
      icon: '🧠',
      winner: facts.xpSponge.name,
      value: formatCompact(facts.xpSponge.value) + ' XP/partida',
      description: `Promedio más alto de experiencia por partida en ${facts.xpSponge.matches} partidas. ¡Nivel máximo!`,
      color: 'cyan',
      imageId: null // No hay imagen específica
    },
    facts.siegeLord && {
      title: '🏰 Siege Lord',
      icon: '🏰',
      winner: facts.siegeLord.name,
      value: formatCompact(facts.siegeLord.value) + ' siege/partida',
      description: `Promedio más alto de daño a estructuras por partida en ${facts.siegeLord.matches} partidas. ¡Demolición garantizada!`,
      color: 'amber',
      imageId: 'push_enjoyer'
    },
    facts.mercenaryUnion && {
      title: '🐗 Mercenary Union',
      icon: '🐗',
      winner: facts.mercenaryUnion.name,
      value: `${facts.mercenaryUnion.value.toFixed(1)} camps/partida`,
      description: `Promedio más alto de capturas de campamentos por partida en ${facts.mercenaryUnion.matches} partidas. ¡Contratista profesional!`,
      color: 'indigo',
      imageId: null // No hay imagen específica
    },
    facts.ccMachine && {
      title: '🧊 CC Machine',
      icon: '🧊',
      winner: facts.ccMachine.name,
      value: formatCompact(facts.ccMachine.value) + ' CC/partida',
      description: `Promedio más alto de control de masas por partida en ${facts.ccMachine.matches} partidas. ¡Nadie se mueve!`,
      color: 'purple',
      imageId: null // No hay imagen específica
    },
    facts.speedrunner && {
      title: '⏱️ Speedrunner',
      icon: '⏱️',
      winner: facts.speedrunner.name,
      value: `${formatPercent(facts.speedrunner.winRate)} WR (≤15m)`,
      description: `Mejor winrate en partidas cortas (≤15 min) con ${facts.speedrunner.matches} partidas. ¡Eficiencia máxima!`,
      color: 'cyan',
      imageId: 'speedrun'
    },
    facts.tiltProof && {
      title: '🧯 Tilt-Proof',
      icon: '🧯',
      winner: facts.tiltProof.name,
      value: `${formatPercent(facts.tiltProof.winRate)} WR (Deaths ≥ 8)`,
      description: `Mejor winrate en partidas con muchas muertes (≥8) con ${facts.tiltProof.matches} partidas. ¡Nada lo detiene!`,
      color: 'red',
      imageId: null // No hay imagen específica
    },
    facts.longestMatch && {
      title: '⌛ Longest Match',
      icon: '⌛',
      winner: `${facts.longestMatch.playerName} con ${facts.longestMatch.heroName}`,
      value: formatDuration(facts.longestMatch.valueSeconds),
      description: `La partida más larga en ${facts.longestMatch.map}. ¡Una épica batalla!`,
      color: 'purple',
      replayName: facts.longestMatch.replayName,
      isWinner: facts.longestMatch.winner,
      imageId: null // No hay imagen específica
    },
    facts.shortestWin && {
      title: '⚡ Shortest Win',
      icon: '⚡',
      winner: `${facts.shortestWin.playerName} con ${facts.shortestWin.heroName}`,
      value: formatDuration(facts.shortestWin.valueSeconds),
      description: `La victoria más rápida en ${facts.shortestWin.map}. ¡Dominación total!`,
      color: 'emerald',
      replayName: facts.shortestWin.replayName,
      isWinner: facts.shortestWin.winner,
      imageId: 'speedrun' // Comparte con speedrunner
    },
    facts.kdaKing && {
      title: '👑 KDA King',
      icon: '👑',
      winner: facts.kdaKing.name,
      value: `${facts.kdaKing.kda.toFixed(2)} KDA`,
      description: `El mejor ratio KDA con ${facts.kdaKing.matches} partidas. ¡Eficiencia letal!`,
      color: 'amber',
      imageId: 'protagonist'
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
                  <span><strong>Most On Fire:</strong> Promedio más alto de tiempo "on fire" por partida (mínimo 10 partidas).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💀</span>
                  <span><strong>Most Time Dead:</strong> Promedio más alto de tiempo muerto por partida (mínimo 10 partidas).</span>
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
                <li className="flex items-start gap-2">
                  <span>🏥</span>
                  <span><strong>Medic of the Year:</strong> Promedio más alto de healing/shielding por partida (mínimo 10 partidas).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🧠</span>
                  <span><strong>XP Sponge:</strong> Promedio más alto de experiencia por partida (mínimo 10 partidas).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🏰</span>
                  <span><strong>Siege Lord:</strong> Promedio más alto de daño a estructuras por partida (mínimo 10 partidas).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🐗</span>
                  <span><strong>Mercenary Union:</strong> Promedio más alto de capturas de campamentos por partida (mínimo 10 partidas).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🧊</span>
                  <span><strong>CC Machine:</strong> Promedio más alto de control de masas por partida (mínimo 10 partidas).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>⏱️</span>
                  <span><strong>Speedrunner:</strong> Mejor WR en partidas ≤15 min (mínimo 5 partidas, WR ≥60%).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🧯</span>
                  <span><strong>Tilt-Proof:</strong> Mejor WR en partidas con ≥8 muertes (mínimo 5 partidas, WR ≥55%).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>⌛</span>
                  <span><strong>Longest Match:</strong> La partida individual más larga registrada.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>⚡</span>
                  <span><strong>Shortest Win:</strong> La victoria más rápida registrada.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>👑</span>
                  <span><strong>KDA King:</strong> Mayor KDA total (Takedowns+Assists/Deaths, mínimo 10 partidas).</span>
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
