import { formatCompact, formatSecondsToMMSS, formatPercent } from '../utils/format'
import { getRandomJoke } from './playerHighlightsJokes'

/**
 * Get funny highlights for a player (exactly 3 blocks)
 * Block 1 is always "Partida Más Violenta"
 * Blocks 2-3 are selected from a pool of funny stats
 * @param {Array} rows - All filtered rows
 * @param {string} playerName - Player name
 * @returns {Array} - Array of exactly 3 highlight blocks
 */
export function getPlayerFunnyHighlights(rows, playerName) {
  // Validate inputs
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return [
      {
        id: 'no_data',
        title: '📦 Sin Datos',
        accent: 'slate',
        mainValue: '0 partidas',
        subValue: 'No hay datos disponibles',
        footer: '',
        joke: 'Este jugador está en modo invisible.'
      },
      {
        id: 'no_data_2',
        title: '😴 Sin Estadísticas',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay información disponible',
        footer: '',
        joke: 'Ni siquiera apareció en el radar.'
      },
      {
        id: 'no_data_3',
        title: '🤷 Sin Highlights',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay highlights disponibles',
        footer: '',
        joke: 'Este jugador prefiere el anonimato.'
      }
    ]
  }
  
  if (!playerName) {
    return [
      {
        id: 'no_player',
        title: '❓ Jugador Desconocido',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No se especificó un jugador',
        footer: '',
        joke: '¿Quién eres tú?'
      },
      {
        id: 'no_player_2',
        title: '😴 Sin Estadísticas',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay información disponible',
        footer: '',
        joke: 'Ni siquiera apareció en el radar.'
      },
      {
        id: 'no_player_3',
        title: '🤷 Sin Highlights',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay highlights disponibles',
        footer: '',
        joke: 'Este jugador prefiere el anonimato.'
      }
    ]
  }
  
  // Filter player rows
  const playerRows = rows.filter(r => r && r.playerName === playerName)
  
  if (playerRows.length === 0) {
    return [
      {
        id: 'no_matches',
        title: '📦 Sin Partidas',
        accent: 'slate',
        mainValue: '0 partidas',
        subValue: 'No hay partidas para este jugador',
        footer: '',
        joke: 'Este jugador está en modo invisible.'
      },
      {
        id: 'no_matches_2',
        title: '😴 Sin Estadísticas',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay información disponible',
        footer: '',
        joke: 'Ni siquiera apareció en el radar.'
      },
      {
        id: 'no_matches_3',
        title: '🤷 Sin Highlights',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay highlights disponibles',
        footer: '',
        joke: 'Este jugador prefiere el anonimato.'
      }
    ]
  }

  try {
    const blocks = []
  
    // BLOCK 1: Always "Partida Más Violenta"
    const mostViolent = playerRows
      .filter(row => row != null)
      .reduce((max, row) => {
        const totalDmg = (row.heroDamage || 0) + (row.siegeDamage || 0)
        const maxDmg = (max?.heroDamage || 0) + (max?.siegeDamage || 0)
        return totalDmg > maxDmg ? row : max
      }, null)
  
    if (mostViolent) {
      const totalDmg = (mostViolent.heroDamage || 0) + (mostViolent.siegeDamage || 0)
      const heroDmg = mostViolent.heroDamage || 0
      const siegeDmg = mostViolent.siegeDamage || 0
      
      let footer = ''
      if (mostViolent.heroName) footer += mostViolent.heroName
      if (mostViolent.map) {
        if (footer) footer += ' en '
        footer += mostViolent.map
      }
      if (mostViolent.winner) footer += ' 🏆'
      
      blocks.push({
        id: 'most_violent',
        title: '🔥 Partida Más Violenta',
        accent: 'red',
        mainValue: `${formatCompact(totalDmg)} daño total`,
        subValue: `${formatCompact(heroDmg)} héroe + ${formatCompact(siegeDmg)} asedio`,
        footer: footer || 'Partida épica',
        joke: getRandomJoke('most_violent')
      })
    }

    // CANDIDATES POOL: Compute all possible highlights
    const candidates = []
    
    // A) Most Time Dead
    const mostTimeDead = playerRows
      .filter(row => row != null)
      .reduce((max, row) => {
        const timeDead = row.spentDeadSeconds || 0
        const maxTime = max?.spentDeadSeconds || 0
        return timeDead > maxTime ? row : max
      }, null)
    
    if (mostTimeDead && (mostTimeDead.spentDeadSeconds || 0) > 0) {
      let footer = ''
      if (mostTimeDead.map) footer += mostTimeDead.map
      if (mostTimeDead.heroName) {
        if (footer) footer += ' con '
        footer += mostTimeDead.heroName
      }
      
      candidates.push({
        id: 'most_time_dead',
        title: '🪦 Día de Muertos',
        accent: 'purple',
        mainValue: formatSecondsToMMSS(mostTimeDead.spentDeadSeconds || 0),
        subValue: 'tiempo muerto',
        footer: footer || 'En alguna partida',
        joke: getRandomJoke('most_time_dead'),
        score: mostTimeDead.spentDeadSeconds || 0,
        category: 'time_dead'
      })
    }
    
    // B) Most Healing (only if healing exists)
    const hasHealing = playerRows.some(r => r && (r.healingShielding || 0) > 0)
    if (hasHealing) {
      const mostHealing = playerRows.reduce((max, row) => {
        if (!row) return max
        if (!max) return row
        const healing = row.healingShielding || 0
        const maxHealing = max.healingShielding || 0
        return healing > maxHealing ? row : max
      }, null)
      
      if (mostHealing && (mostHealing.healingShielding || 0) > 0) {
        let footer = ''
        if (mostHealing.map) footer += mostHealing.map
        if (mostHealing.heroName) {
          if (footer) footer += ' con '
          footer += mostHealing.heroName
        }
        
        candidates.push({
          id: 'most_healing',
          title: '👼 Ángel de la Guarda',
          accent: 'teal',
          mainValue: formatCompact(mostHealing.healingShielding || 0),
          subValue: 'curación y escudos',
          footer: footer || 'En alguna partida',
          joke: getRandomJoke('most_healing'),
          score: mostHealing.healingShielding || 0,
          category: 'healing'
        })
      }
    }
    
    // C) Most Deaths
    const mostDeaths = playerRows.reduce((max, row) => {
      if (!row) return max
      if (!max) return row
      const deaths = row.deaths || 0
      const maxDeaths = max.deaths || 0
      return deaths > maxDeaths ? row : max
    }, null)
    
    if (mostDeaths && (mostDeaths.deaths || 0) > 0) {
      const kda = mostDeaths.deaths > 0 
        ? ((mostDeaths.heroKills || 0) + (mostDeaths.assists || 0)) / mostDeaths.deaths 
        : 0
      
      let subValue = `${mostDeaths.deaths} muertes`
      if (kda > 0) {
        subValue += ` • KDA: ${kda.toFixed(2)}`
      }
      
      let footer = ''
      if (mostDeaths.map) footer += mostDeaths.map
      if (mostDeaths.heroName) {
        if (footer) footer += ' con '
        footer += mostDeaths.heroName
      }
      if (mostDeaths.winner !== undefined) {
        if (footer) footer += ' • '
        footer += mostDeaths.winner ? 'Ganaste 🏆' : 'Perdiste'
      }
      
      candidates.push({
        id: 'most_deaths',
        title: '😵 Kamikaze',
        accent: 'red',
        mainValue: `${mostDeaths.deaths} muertes`,
        subValue: subValue,
        footer: footer || 'En alguna partida',
        joke: getRandomJoke('most_deaths'),
        score: mostDeaths.deaths || 0,
        category: 'deaths'
      })
    }
    
    // D) Pacifist Win (lowest kills but still won)
    const wins = playerRows.filter(r => r && r.winner === true)
    if (wins.length > 0) {
      const pacifistWin = wins.reduce((min, row) => {
        if (!row) return min
        if (!min) return row
        const kills = row.heroKills || 0
        const minKills = min.heroKills || 0
        return kills < minKills ? row : min
      }, null)
      
      if (pacifistWin) {
        const kills = pacifistWin.heroKills || 0
        const assists = pacifistWin.assists || 0
        const takedowns = pacifistWin.takedowns || 0
        
        let subValue = ''
        if (takedowns > 0) {
          subValue = `${takedowns} takedowns`
        } else if (assists > 0) {
          subValue = `${assists} asistencias`
        } else {
          subValue = '0 kills, 0 assists'
        }
        
        let footer = ''
        if (pacifistWin.map) footer += pacifistWin.map
        if (pacifistWin.heroName) {
          if (footer) footer += ' con '
          footer += pacifistWin.heroName
        }
        footer += ' 🏆'
        
        candidates.push({
          id: 'pacifist_win',
          title: '🧠 Pacifista con Resultados',
          accent: 'amber',
          mainValue: kills === 0 ? '0 kills y aún así ganaste' : `${kills} kills y ganaste`,
          subValue: subValue,
          footer: footer || 'Ganaste sin matar',
          joke: getRandomJoke('pacifist_win'),
          score: 1000 - kills, // Inverse: lower kills = higher score
          category: 'pacifist'
        })
      }
    }
    
    // E) Speedrun (shortest match >= 5 minutes)
    const reasonableMatches = playerRows.filter(r => (r.gameTimeSeconds || 0) >= 300) // 5 min
    if (reasonableMatches.length > 0) {
      const speedrun = reasonableMatches.reduce((min, row) => {
        const time = row.gameTimeSeconds || 0
        const minTime = min?.gameTimeSeconds || Infinity
        return time < minTime ? row : min
      }, null)
      
      if (speedrun) {
        const minutes = Math.floor((speedrun.gameTimeSeconds || 0) / 60)
        const seconds = Math.floor((speedrun.gameTimeSeconds || 0) % 60)
        
        let footer = ''
        if (speedrun.winner !== undefined) {
          footer += speedrun.winner ? 'Ganaste 🏆' : 'Perdiste'
        }
        if (speedrun.map) {
          if (footer) footer += ' • '
          footer += speedrun.map
        }
        if (speedrun.heroName) {
          if (footer) footer += ' • '
          footer += speedrun.heroName
        }
        
        candidates.push({
          id: 'speedrun',
          title: '⚡ Speedrun',
          accent: 'amber',
          mainValue: `${minutes}:${String(seconds).padStart(2, '0')}`,
          subValue: 'duración de partida',
          footer: footer || 'Partida rápida',
          joke: getRandomJoke('speedrun'),
          score: 10000 - (speedrun.gameTimeSeconds || 0), // Inverse: shorter = higher score
          category: 'speedrun'
        })
      }
    }
    
    // F) Raid Boss (most damage taken)
    const mostDamageTaken = playerRows.reduce((max, row) => {
      if (!row) return max
      if (!max) return row
      const dmg = row.damageTaken || 0
      const maxDmg = max.damageTaken || 0
      return dmg > maxDmg ? row : max
    }, null)
    
    if (mostDamageTaken && (mostDamageTaken.damageTaken || 0) > 0) {
      let footer = ''
      if (mostDamageTaken.winner !== undefined) {
        footer += mostDamageTaken.winner ? 'Ganaste 🏆' : 'Perdiste'
      }
      if (mostDamageTaken.map) {
        if (footer) footer += ' • '
        footer += mostDamageTaken.map
      }
      if (mostDamageTaken.heroName) {
        if (footer) footer += ' • '
        footer += mostDamageTaken.heroName
      }
      
      candidates.push({
        id: 'raid_boss',
        title: '🧱 Raid Boss',
        accent: 'red',
        mainValue: formatCompact(mostDamageTaken.damageTaken || 0),
        subValue: 'daño recibido',
        footer: footer || 'Y aún así sobreviviste',
        joke: getRandomJoke('raid_boss'),
        score: mostDamageTaken.damageTaken || 0,
        category: 'damage_taken'
      })
    }
    
    // G) Protagonist Mode (highest KDA with time threshold)
    const validMatches = playerRows.filter(r => r && (r.gameTimeSeconds || 0) >= 300)
    if (validMatches.length > 0) {
      const protagonist = validMatches.reduce((max, row) => {
        if (!row) return max
        if (!max) return row
        const deaths = row.deaths || 0
        const kda = deaths > 0 
          ? ((row.heroKills || 0) + (row.assists || 0)) / deaths 
          : (row.heroKills || 0) + (row.assists || 0)
        const maxDeaths = max.deaths || 0
        const maxKda = maxDeaths > 0
          ? ((max.heroKills || 0) + (max.assists || 0)) / maxDeaths
          : (max.heroKills || 0) + (max.assists || 0)
        return kda > maxKda ? row : max
      }, null)
      
      if (protagonist) {
        const deaths = protagonist.deaths || 0
        const kda = deaths > 0 
          ? ((protagonist.heroKills || 0) + (protagonist.assists || 0)) / deaths 
          : (protagonist.heroKills || 0) + (protagonist.assists || 0)
        
        let subValue = `${protagonist.heroKills || 0}K / ${protagonist.assists || 0}A / ${protagonist.deaths || 0}D`
        
        let footer = ''
        if (protagonist.map) footer += protagonist.map
        if (protagonist.heroName) {
          if (footer) footer += ' con '
          footer += protagonist.heroName
        }
        
        candidates.push({
          id: 'protagonist',
          title: '🔥 Modo Protagonista',
          accent: 'amber',
          mainValue: `KDA ${kda.toFixed(2)}`,
          subValue: subValue,
          footer: footer || 'Partida épica',
          joke: getRandomJoke('protagonist'),
          score: kda * 100, // Scale for comparison
          category: 'kda'
        })
      }
    }
    
    // H) Push Enjoyer (most siege damage)
    const mostSiege = playerRows.reduce((max, row) => {
      if (!row) return max
      if (!max) return row
      const siege = row.siegeDamage || 0
      const maxSiege = max.siegeDamage || 0
      return siege > maxSiege ? row : max
    }, null)
    
    if (mostSiege && (mostSiege.siegeDamage || 0) > 0) {
      let footer = ''
      if (mostSiege.map) footer += mostSiege.map
      if (mostSiege.heroName) {
        if (footer) footer += ' con '
        footer += mostSiege.heroName
      }
      
      candidates.push({
        id: 'push_enjoyer',
        title: '🎯 Objetivos > Ego',
        accent: 'teal',
        mainValue: formatCompact(mostSiege.siegeDamage || 0),
        subValue: 'daño a estructuras',
        footer: footer || 'En alguna partida',
        joke: getRandomJoke('push_enjoyer'),
        score: mostSiege.siegeDamage || 0,
        category: 'siege'
      })
    }
    
    // I) Socializer (most assists)
    const mostAssists = playerRows.reduce((max, row) => {
      if (!row) return max
      if (!max) return row
      const assists = row.assists || 0
      const maxAssists = max.assists || 0
      return assists > maxAssists ? row : max
    }, null)
    
    if (mostAssists && (mostAssists.assists || 0) > 0) {
      const takedowns = mostAssists.takedowns || 0
      let subValue = `${mostAssists.assists} asistencias`
      if (takedowns > 0) {
        subValue += ` • ${takedowns} takedowns`
      }
      
      let footer = ''
      if (mostAssists.map) footer += mostAssists.map
      if (mostAssists.heroName) {
        if (footer) footer += ' con '
        footer += mostAssists.heroName
      }
      
      candidates.push({
        id: 'socializer',
        title: '🤝 Socializador',
        accent: 'teal',
        mainValue: `${mostAssists.assists} asistencias`,
        subValue: subValue,
        footer: footer || 'En alguna partida',
        joke: getRandomJoke('socializer'),
        score: mostAssists.assists || 0,
        category: 'assists'
      })
    }
    
    // SELECT TOP 2 CANDIDATES (avoid duplicates and "most_violent")
    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score)
    
    // Filter out duplicates by category and avoid "most_violent" category
    const selectedCategories = new Set(['damage']) // Block 1 is damage-based
    const selected = []
    
    for (const candidate of candidates) {
      if (selected.length >= 2) break
      if (!selectedCategories.has(candidate.category)) {
        selected.push(candidate)
        selectedCategories.add(candidate.category)
      }
    }
    
    // Add selected candidates to blocks
    blocks.push(...selected)
    
    // FALLBACK: If we don't have 3 blocks, add generic ones
    while (blocks.length < 3) {
      const matches = playerRows.length
      const wins = playerRows.filter(r => r.winner === true).length
      const winRate = matches > 0 ? wins / matches : 0
      const avgTimeDead = matches > 0 
        ? playerRows.reduce((sum, r) => sum + (r.spentDeadSeconds || 0), 0) / matches 
        : 0
      
      if (blocks.length === 1) {
        // Block 2: Generic matches + winrate
        blocks.push({
          id: 'generic_matches',
          title: '📦 Partidas Totales',
          accent: 'slate',
          mainValue: `${matches} partidas`,
          subValue: `Win rate: ${formatPercent(winRate)}`,
          footer: `${wins} victorias`,
          joke: getRandomJoke('generic_matches')
        })
      } else if (blocks.length === 2) {
        // Block 3: Average time dead
        blocks.push({
          id: 'avg_time_dead',
          title: '😴 Promedio Tiempo Muerto',
          accent: 'purple',
          mainValue: formatSecondsToMMSS(avgTimeDead),
          subValue: 'tiempo muerto promedio',
          footer: `En ${matches} partidas`,
          joke: getRandomJoke('avg_time_dead')
        })
      }
    }
    
    return blocks.slice(0, 3) // Ensure exactly 3
  } catch (error) {
    console.error('Error computing player highlights:', error)
    return [
      {
        id: 'error',
        title: '❌ Error',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'Error al calcular highlights',
        footer: '',
        joke: 'Algo salió mal, pero no fue tu culpa.'
      },
      {
        id: 'error_2',
        title: '😴 Sin Estadísticas',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay información disponible',
        footer: '',
        joke: 'Ni siquiera apareció en el radar.'
      },
      {
        id: 'error_3',
        title: '🤷 Sin Highlights',
        accent: 'slate',
        mainValue: 'N/A',
        subValue: 'No hay highlights disponibles',
        footer: '',
        joke: 'Este jugador prefiere el anonimato.'
      }
    ]
  }
}
