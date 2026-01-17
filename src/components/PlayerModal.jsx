import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { KpiCard } from './KpiCard'
import { Badge } from './Badge'
import { HeroAvatar } from './HeroAvatar'
import { PlayerAvatar } from './PlayerAvatar'
import { TalentDisplay } from './HeroModal'
import { formatNumber, formatPercent, formatCompact, formatDecimal, formatDuration } from '../utils/format'
import { getTalentStatsByHero } from '../data/heroTalentStats'

/**
 * Format talent name: remove hero name prefix and add spaces before capital letters
 * @param {string} talentName - Raw talent name (e.g., "AnduinLightbomb")
 * @param {string} heroName - Hero name to remove from start
 * @returns {string} - Formatted talent name (e.g., "Lightbomb")
 */
function formatTalentName(talentName, heroName) {
  if (!talentName) return ''
  
  let formatted = talentName
  
  // Remove hero name from the start if present
  if (heroName && formatted.toLowerCase().startsWith(heroName.toLowerCase())) {
    formatted = formatted.substring(heroName.length)
  }
  
  // Add spaces before capital letters (camelCase to readable)
  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2')
  
  // Capitalize first letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }
  
  return formatted
}

/**
 * Get color classes for record cards based on record type
 * @param {string} recordType - Type of record (e.g., 'maxHeroDamage', 'maxDeaths')
 * @returns {Object} - Object with bg, border, and shadow classes
 */
function getRecordCardColors(recordType) {
  // Green: Positive metrics (damage, healing, kills, assists, mercs, globes)
  if (recordType.includes('HeroDamage') || recordType.includes('TotalDamage') || 
      recordType.includes('SiegeDamage') || recordType.includes('Healing') || 
      recordType.includes('Kills') || recordType.includes('Assists') ||
      recordType.includes('MercCampCaptures') || recordType.includes('RegenGlobes')) {
    return {
      bg: 'from-emerald-500/20 via-emerald-600/10 to-emerald-500/20',
      border: 'border-emerald-500/40',
      shadow: 'shadow-emerald-500/10',
      hoverShadow: 'hover:shadow-emerald-500/20',
      borderHover: 'hover:border-emerald-500/50'
    }
  }
  
  // Orange: Neutral/moderate metrics (damage taken - can be good or bad)
  if (recordType.includes('DamageTaken')) {
    return {
      bg: 'from-orange-500/20 via-orange-600/10 to-orange-500/20',
      border: 'border-orange-500/40',
      shadow: 'shadow-orange-500/10',
      hoverShadow: 'hover:shadow-orange-500/20',
      borderHover: 'hover:border-orange-500/50'
    }
  }
  
  // Red: Negative metrics (deaths)
  if (recordType.includes('Deaths')) {
    return {
      bg: 'from-red-500/20 via-red-600/10 to-red-500/20',
      border: 'border-red-500/40',
      shadow: 'shadow-red-500/10',
      hoverShadow: 'hover:shadow-red-500/20',
      borderHover: 'hover:border-red-500/50'
    }
  }
  
  // Default: Amber (for featured record)
  return {
    bg: 'from-amber-500/20 via-amber-600/10 to-amber-500/20',
    border: 'border-amber-500/40',
    shadow: 'shadow-amber-500/10',
    hoverShadow: 'hover:shadow-amber-500/20',
    borderHover: 'hover:border-amber-500/50'
  }
}

/**
 * Player details modal
 * Shows deep analytics for a selected player in a centered modal
 */
export function PlayerModal({ player, rows, onClose }) {
  // Sort state for heroes table
  const [heroSort, setHeroSort] = useState({ column: 'matches', direction: 'desc' })
  
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  
  
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!player) return null

  const { kpis, heroes, maps, trend, name, matches, heroName } = player

  // Compute most picked talents by level for this player with the selected hero
  const mostPickedTalents = useMemo(() => {
    if (!heroName || !rows || !name) return null
    try {
      // Filter rows to only this player with this hero
      const playerHeroRows = rows.filter(r => r.playerName === name && r.heroName === heroName)
      if (playerHeroRows.length === 0) return null
      
      // Get talent stats by level
      const talentStats = getTalentStatsByHero(playerHeroRows, heroName)
      if (!talentStats || Object.keys(talentStats).length === 0) return null
      
      // Extract most picked talent for each level
      const mostPicked = {}
      const levels = [1, 4, 7, 10, 13, 16, 20]
      
      for (const level of levels) {
        if (talentStats[level] && talentStats[level].length > 0) {
          // Get the most picked talent (first in sorted array)
          mostPicked[level] = {
            talent: talentStats[level][0].talent,
            pickPct: talentStats[level][0].pickPct,
            winPct: talentStats[level][0].winPct,
            games: talentStats[level][0].games
          }
        }
      }
      
      return Object.keys(mostPicked).length > 0 ? mostPicked : null
    } catch (error) {
      console.error('Error computing most picked talents for player:', error)
      return null
    }
  }, [rows, name, heroName])


  // Compute best personal records - sorted by importance for featured/secondary display
  const bestRecords = useMemo(() => {
    if (!matches || matches.length === 0) return null

    let maxKills = 0, maxAssists = 0, maxHeroDamage = 0, maxTotalDamage = 0, maxDeaths = 0, maxHealing = 0
    let maxDamageTaken = 0, maxSiegeDamage = 0, maxSelfHealing = 0, maxMercCampCaptures = 0, maxRegenGlobes = 0
    let maxKillsMatch = null, maxAssistsMatch = null, maxHeroDamageMatch = null, maxTotalDamageMatch = null
    let maxDeathsMatch = null, maxHealingMatch = null, maxDamageTakenMatch = null, maxSiegeDamageMatch = null
    let maxSelfHealingMatch = null, maxMercCampCapturesMatch = null, maxRegenGlobesMatch = null

    for (const match of matches) {
      if (match.kills > maxKills) {
        maxKills = match.kills
        maxKillsMatch = match
      }
      if (match.assists > maxAssists) {
        maxAssists = match.assists
        maxAssistsMatch = match
      }
      if (match.heroDamage > maxHeroDamage) {
        maxHeroDamage = match.heroDamage
        maxHeroDamageMatch = match
      }
      if (match.totalDamage > maxTotalDamage) {
        maxTotalDamage = match.totalDamage
        maxTotalDamageMatch = match
      }
      if (match.deaths > maxDeaths) {
        maxDeaths = match.deaths
        maxDeathsMatch = match
      }
      if (match.healingShielding > maxHealing) {
        maxHealing = match.healingShielding
        maxHealingMatch = match
      }
      if ((match.damageTaken || 0) > maxDamageTaken) {
        maxDamageTaken = match.damageTaken || 0
        maxDamageTakenMatch = match
      }
      if ((match.siegeDamage || 0) > maxSiegeDamage) {
        maxSiegeDamage = match.siegeDamage || 0
        maxSiegeDamageMatch = match
      }
      if ((match.selfHealing || 0) > maxSelfHealing) {
        maxSelfHealing = match.selfHealing || 0
        maxSelfHealingMatch = match
      }
      if ((match.mercCampCaptures || 0) > maxMercCampCaptures) {
        maxMercCampCaptures = match.mercCampCaptures || 0
        maxMercCampCapturesMatch = match
      }
      if ((match.regenGlobes || 0) > maxRegenGlobes) {
        maxRegenGlobes = match.regenGlobes || 0
        maxRegenGlobesMatch = match
      }
    }

    const records = [
      { type: 'maxHeroDamage', value: maxHeroDamage, match: maxHeroDamageMatch, label: 'Daño máximo con héroe', priority: 1 },
      { type: 'maxTotalDamage', value: maxTotalDamage, match: maxTotalDamageMatch, label: 'Daño total máximo', priority: 2 },
      { type: 'maxSiegeDamage', value: maxSiegeDamage, match: maxSiegeDamageMatch, label: 'Daño a estructuras máximo', priority: 3 },
      { type: 'maxKills', value: maxKills, match: maxKillsMatch, label: 'Kills en una partida', priority: 4 },
      { type: 'maxHealing', value: maxHealing, match: maxHealingMatch, label: 'Curación máxima', priority: 5 },
      { type: 'maxSelfHealing', value: maxSelfHealing, match: maxSelfHealingMatch, label: 'Auto-curación máxima', priority: 6 },
      { type: 'maxDamageTaken', value: maxDamageTaken, match: maxDamageTakenMatch, label: 'Daño recibido máximo', priority: 7 },
      { type: 'maxAssists', value: maxAssists, match: maxAssistsMatch, label: 'Asistencias en una partida', priority: 8 },
      { type: 'maxMercCampCaptures', value: maxMercCampCaptures, match: maxMercCampCapturesMatch, label: 'Capturas de mercenarios', priority: 9 },
      { type: 'maxRegenGlobes', value: maxRegenGlobes, match: maxRegenGlobesMatch, label: 'Globos de regeneración', priority: 10 },
      { type: 'maxDeaths', value: maxDeaths, match: maxDeathsMatch, label: 'Muertes en una partida', priority: 11 }
    ].filter(r => r.value > 0).sort((a, b) => a.priority - b.priority)

    return records
  }, [matches])

  // Determine role for healing vs damage taken priority
  const primaryRole = heroName ? heroes.find(h => h.name === heroName)?.role : null
  const isSupport = primaryRole === 'Support' || primaryRole === 'Healer'

  return (
    <>
      {/* Backdrop - Dark glass overlay */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/70 via-slate-900/60 to-black/70 backdrop-blur-md z-[70] flex items-center justify-center overflow-y-auto"
        onClick={onClose}
        style={{
          paddingTop: 'calc(var(--app-header-h, 64px) + 8px)',
          paddingLeft: '8px',
          paddingRight: '8px',
          paddingBottom: '8px'
        }}
      >
        {/* Modal Container - Premium dark glass panel */}
        <div
          className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-700/30 shadow-2xl animate-modal-enter w-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '1000px',
            maxHeight: 'calc(100vh - var(--app-header-h, 64px) - 16px)'
          }}
        >
          {/* Header - Hero Summary */}
          <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30 px-3 sm:px-6 py-3 sm:py-5 z-10 shrink-0 rounded-t-xl sm:rounded-t-2xl">
            <div className="flex items-start sm:items-center gap-2 sm:gap-4 justify-between">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {/* Avatar - 10-15% bigger */}
                <div className="shrink-0">
                  <PlayerAvatar name={name} size={80} className="shadow-xl hidden sm:block" />
                  <PlayerAvatar name={name} size={60} className="shadow-xl sm:hidden" />
                </div>
                
                {/* Name and Info */}
                <div className="flex-1 min-w-0 pr-2 sm:pr-0">
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate">{name}</h2>
                  {heroName && (
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-0.5 sm:mt-1">
                      <HeroAvatar 
                        name={heroName} 
                        role={heroes.find(h => h.name === heroName)?.role || 'Unknown'}
                        size="sm" 
                        showBorder={true}
                      />
                      <span className="text-slate-400 text-xs sm:text-sm truncate">{heroName}</span>
                      <Badge variant="info" size="sm" className="shrink-0">{heroes.find(h => h.name === heroName)?.role || 'Unknown'}</Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Inline Badges - Quick Stats */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className={`${kpis.winRate >= 0.5 ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2`}>
                  <div className={`${kpis.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'} text-[10px] sm:text-xs font-medium mb-0.5`}>Win Rate</div>
                  <div className="text-white text-sm sm:text-base lg:text-xl font-bold whitespace-nowrap">{formatPercent(kpis.winRate)}</div>
                </div>
                <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 hidden sm:block">
                  <div className="text-slate-400 text-[10px] sm:text-xs font-medium mb-0.5">Partidas</div>
                  <div className="text-white text-sm sm:text-base lg:text-xl font-bold whitespace-nowrap">{formatNumber(kpis.matches)}</div>
                </div>
                <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 hidden lg:block">
                  <div className="text-slate-400 text-xs font-medium mb-0.5">Récord</div>
                  <div className="text-white text-xl font-bold whitespace-nowrap">{kpis.wins}W - {kpis.losses}L</div>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="ml-2 sm:ml-4 p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all shrink-0"
                aria-label="Cerrar modal"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body - Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Key Stats Strip - 4 prominent stats */}
            <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`bg-gradient-to-br ${kpis.winRate >= 0.5 ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/10' : 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/10'} border rounded-xl p-5 transition-all hover:shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🏆</span>
                    <div className="text-slate-400 text-xs font-medium">Win Rate</div>
                  </div>
                  <div className={`text-3xl font-bold ${kpis.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>{formatPercent(kpis.winRate)}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-5 hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚔️</span>
                    <div className="text-slate-400 text-xs font-medium">KDA</div>
                  </div>
                  <div className="text-white text-3xl font-bold">{formatDecimal(kpis.kda, 2)}</div>
                  <div className="text-slate-500 text-xs mt-1">{formatDecimal(kpis.avgKills, 1)}/{formatDecimal(kpis.avgDeaths, 1)}/{formatDecimal(kpis.avgAssists, 1)}</div>
                </div>
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-5 hover:border-red-400/50 transition-all hover:shadow-lg hover:shadow-red-500/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💥</span>
                    <div className="text-slate-400 text-xs font-medium">DPM</div>
                  </div>
                  <div className="text-white text-3xl font-bold">{formatCompact(kpis.dpm)}</div>
                  <div className="text-slate-500 text-xs mt-1">Daño por minuto</div>
                </div>
                <div className={`bg-gradient-to-br ${isSupport ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/10' : 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400/50 hover:shadow-amber-500/10'} border rounded-xl p-5 transition-all hover:shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{isSupport ? '❤️' : '🛡️'}</span>
                    <div className="text-slate-400 text-xs font-medium">{isSupport ? 'Avg Healing' : 'Avg Damage Taken'}</div>
                  </div>
                  <div className="text-white text-3xl font-bold">{formatCompact(isSupport ? kpis.avgHealingShielding : kpis.avgDamageTaken)}</div>
                  <div className="text-slate-500 text-xs mt-1">Por partida</div>
                </div>
              </div>
            </section>

            {/* Performance Breakdown - Two Columns */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Group A: Output */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Output</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Avg Hero Damage</span>
                        <span className="text-white font-semibold">{formatCompact(kpis.avgHeroDamage || 0)}</span>
                      </div>
                    </div>
                    {kpis.avgHealingShielding > 0 && (
                      <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-sm">Avg Healing/Shielding</span>
                          <span className="text-white font-semibold">{formatCompact(kpis.avgHealingShielding)}</span>
                        </div>
                      </div>
                    )}
                    {kpis.avgSiegeDamage > 0 && (
                      <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-sm">Avg Siege/Structure</span>
                          <span className="text-white font-semibold">{formatCompact(kpis.avgSiegeDamage)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Group B: Survivability */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Survivability</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Avg Damage Taken</span>
                        <span className="text-white font-semibold">{formatCompact(kpis.avgDamageTaken)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Avg Time Dead</span>
                        <span className="text-white font-semibold">{formatDuration(kpis.avgSpentDeadSeconds)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Most Picked Talents by Level (only when filtering by hero) */}
            {heroName && mostPickedTalents && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Talentos Más Pickeados</h3>
                <div className="bg-gradient-to-br from-indigo-500/20 via-indigo-600/10 to-indigo-500/20 border border-indigo-500/40 rounded-xl p-4 shadow-lg shadow-indigo-500/10">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                    {[1, 4, 7, 10, 13, 16, 20].map(level => {
                      const talentData = mostPickedTalents[level]
                      if (!talentData) return null
                      
                      return (
                        <div key={level} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30 hover:border-indigo-500/50 transition-colors">
                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-indigo-500/30 rounded px-2 py-0.5">
                              <span className="text-indigo-200 text-xs font-semibold">L{level}</span>
                            </div>
                            <TalentDisplay 
                              talentName={talentData.talent} 
                              size={32}
                              showName={false}
                              className="justify-center"
                            />
                            <div className="text-center w-full min-h-[3rem] flex flex-col justify-center">
                              <div className="text-white text-xs font-medium leading-tight break-words" title={talentData.talent}>
                                {formatTalentName(talentData.talent, heroName)}
                              </div>
                              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                <span className="text-slate-400 text-[10px]">{formatDecimal(talentData.pickPct, 0)}%</span>
                                <Badge 
                                  variant={talentData.winPct >= 50 ? 'success' : 'danger'} 
                                  size="sm"
                                  className="text-[10px] px-1 py-0"
                                >
                                  {formatDecimal(talentData.winPct, 0)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Records Section - Storytelling: 1 Featured + Grid of Secondary */}
            {bestRecords && bestRecords.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-4">Mejores Registros Personales</h3>
                <div className="space-y-4">
                  {/* Featured Record - Largest with color highlight */}
                  {bestRecords[0] && (() => {
                    const colors = getRecordCardColors(bestRecords[0].type)
                    return (
                      <div className={`bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-xl p-6 shadow-lg ${colors.shadow} hover:shadow-xl ${colors.hoverShadow} transition-all`}>
                      <div className="flex items-start gap-3 mb-3">
                        {bestRecords[0].match?.heroName && (
                          <HeroAvatar
                            name={bestRecords[0].match.heroName}
                            role={bestRecords[0].match.heroRole}
                            size="md"
                            showBorder={true}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-4xl mb-1">
                            {bestRecords[0].type.includes('Damage') || bestRecords[0].type.includes('Healing') || bestRecords[0].type.includes('Siege')
                              ? formatCompact(bestRecords[0].value) 
                              : formatNumber(bestRecords[0].value)}
                          </p>
                          <p className="text-slate-300 text-sm font-medium">{bestRecords[0].label}</p>
                        </div>
                      </div>
                      {bestRecords[0].match && (
                        <div className={`text-xs text-slate-400 space-y-0.5 pt-2 border-t ${bestRecords[0].type.includes('Deaths') ? 'border-red-500/20' : bestRecords[0].type.includes('DamageTaken') ? 'border-orange-500/20' : 'border-emerald-500/20'}`}>
                          <p>Con {bestRecords[0].match.heroName} en {bestRecords[0].match.map}</p>
                          {bestRecords[0].match.replayName && (
                            <p className="text-slate-500">{bestRecords[0].match.replayName}</p>
                          )}
                        </div>
                      )}
                      </div>
                    )
                  })()}

                  {/* Secondary Records - Grid Layout */}
                  {bestRecords.slice(1).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {bestRecords.slice(1).map((record, idx) => {
                        const colors = getRecordCardColors(record.type)
                        return (
                          <div key={idx} className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4 ${colors.borderHover} transition-all`}>
                          <div className="flex items-start gap-2 mb-2">
                            {record.match?.heroName && (
                              <HeroAvatar
                                name={record.match.heroName}
                                role={record.match.heroRole}
                                size="sm"
                                showBorder={true}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-xl mb-1">
                                {record.type.includes('Damage') || record.type.includes('Healing') || record.type.includes('Siege')
                                  ? formatCompact(record.value) 
                                  : formatNumber(record.value)}
                              </p>
                              <p className="text-slate-400 text-xs leading-tight">{record.label}</p>
                            </div>
                          </div>
                          {record.match && (
                            <div className={`text-xs text-slate-500 space-y-0.5 pt-2 border-t ${record.type.includes('Deaths') ? 'border-red-500/20' : record.type.includes('DamageTaken') ? 'border-orange-500/20' : 'border-emerald-500/20'}`}>
                              <p className="truncate">Con {record.match.heroName} en {record.match.map}</p>
                              {record.match.replayName && (
                                <p className="truncate text-slate-600">{record.match.replayName}</p>
                              )}
                            </div>
                          )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Trend Chart */}
            {trend && trend.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Tendencia en el Tiempo</h3>
                <div className="bg-layer-mid/60 rounded-xl p-4 border border-slate-700/50 shadow-md-custom">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
                        <defs>
                          <linearGradient id="lineGradientMatchesPlayerModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.05)" />
                          </linearGradient>
                          <linearGradient id="lineGradientWinRatePlayerModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="period"
                          stroke="#94a3b8"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#94a3b8"
                          fontSize={10}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#94a3b8"
                          fontSize={10}
                          domain={[0, 1]}
                          tickFormatter={(v) => formatPercent(v, 0)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                          }}
                          labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                          itemStyle={{ color: '#cbd5e1' }}
                          formatter={(value, name) => {
                            if (name === 'Win Rate') return [formatPercent(value), name]
                            return [formatNumber(value), name]
                          }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="matches"
                          name="Partidas"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#lineGradientMatchesPlayerModal)"
                          dot={{ fill: '#6366f1', strokeWidth: 2, stroke: '#818cf8', r: 4 }}
                          activeDot={{ r: 6, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 2 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="winRate"
                          name="Win Rate"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#lineGradientWinRatePlayerModal)"
                          dot={{ fill: '#10b981', strokeWidth: 2, stroke: '#34d399', r: 4 }}
                          activeDot={{ r: 6, fill: '#34d399', stroke: '#10b981', strokeWidth: 2 }}
                        />
                        <ReferenceLine yAxisId="right" y={0.5} stroke="#f59e0b" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {/* Top Heroes - Only show if not filtering by a specific hero */}
            {heroes && heroes.length > 0 && !heroName && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Rendimiento por Héroe</h3>
                <div className="bg-layer-deep/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-layer-light/40 shadow-sm-custom">
                        <th className="text-left px-4 py-2 text-slate-300 text-sm">Héroe</th>
                        <th
                          className="text-right px-4 py-2 text-slate-300 text-sm cursor-pointer hover:bg-slate-700/50 transition-colors select-none"
                          onClick={() => setHeroSort(prev => ({
                            column: 'matches',
                            direction: prev.column === 'matches' && prev.direction === 'desc' ? 'asc' : 'desc'
                          }))}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Partidas
                            {heroSort.column === 'matches' && (
                              <span className="text-indigo-400">
                                {heroSort.direction === 'desc' ? '↓' : '↑'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          className="text-right px-4 py-2 text-slate-300 text-sm cursor-pointer hover:bg-slate-700/50 transition-colors select-none"
                          onClick={() => setHeroSort(prev => ({
                            column: 'winRate',
                            direction: prev.column === 'winRate' && prev.direction === 'desc' ? 'asc' : 'desc'
                          }))}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Win Rate
                            {heroSort.column === 'winRate' && (
                              <span className="text-indigo-400">
                                {heroSort.direction === 'desc' ? '↓' : '↑'}
                              </span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {[...heroes]
                        .sort((a, b) => {
                          if (heroSort.column === 'matches') {
                            return heroSort.direction === 'desc'
                              ? b.matches - a.matches
                              : a.matches - b.matches
                          } else {
                            return heroSort.direction === 'desc'
                              ? b.winRate - a.winRate
                              : a.winRate - b.winRate
                          }
                        })
                        .slice(0, 10)
                        .map((hero) => (
                        <tr key={hero.name} className="hover:bg-slate-700/20 transition-colors card-hover-lift">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <HeroAvatar
                                name={hero.name}
                                role={hero.role}
                                size="sm"
                                showBorder={true}
                              />
                              <span className="text-white text-sm">{hero.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-300 text-sm">{hero.matches}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={hero.winRate >= 0.5 ? 'success' : 'danger'}>
                              {formatPercent(hero.winRate)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Top Maps */}
            {maps && maps.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">Rendimiento por Mapa</h3>
                <div className="bg-layer-deep/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-inset-custom">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-layer-light/40 shadow-sm-custom">
                        <th className="text-left px-4 py-2 text-slate-300 text-sm">Mapa</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Partidas</th>
                        <th className="text-right px-4 py-2 text-slate-300 text-sm">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {maps.slice(0, 8).map((map) => (
                        <tr key={map.name} className="hover:bg-slate-700/20 transition-colors card-hover-lift">
                          <td className="px-4 py-2 text-white text-sm">{map.name}</td>
                          <td className="px-4 py-2 text-right text-slate-300 text-sm">{map.matches}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant={map.winRate >= 0.5 ? 'success' : 'danger'}>
                              {formatPercent(map.winRate)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
