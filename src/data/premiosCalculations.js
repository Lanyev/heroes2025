import { formatNumber, formatDuration } from '../utils/format'

/**
 * Calculate winners for all premios based on CSV data
 * @param {Array} rows - Normalized CSV rows
 * @returns {Map<string, Object>} - Map of premio name to winner data
 */
export function calculatePremiosWinners(rows) {
  const winners = new Map()

  // 1. Partida más violenta - La partida con mayor número total de asesinatos
  const partidaMasViolenta = calculatePartidaMasViolenta(rows)
  if (partidaMasViolenta) {
    winners.set('Partida más violenta', partidaMasViolenta)
  }

  // 2. Asesino en Serie - Jugador con mayor promedio de asesinatos por partida
  const asesinoEnSerie = calculateAsesinoEnSerie(rows)
  if (asesinoEnSerie) {
    winners.set('Asesino en Serie', asesinoEnSerie)
  }

  // 3. Lluvia de Daño - La partida con mayor daño total realizado
  const lluviaDeDano = calculateLluviaDeDano(rows)
  if (lluviaDeDano) {
    winners.set('Lluvia de Daño', lluviaDeDano)
  }

  // 4. Daño Crónico - Jugador con mayor promedio de daño a héroes por partida
  const danoCronico = calculateDanoCronico(rows)
  if (danoCronico) {
    winners.set('Daño Crónico', danoCronico)
  }

  // 5. Ángel de la Guarda - Mayor curación en una sola partida siendo healer
  const angelDeLaGuarda = calculateAngelDeLaGuarda(rows)
  if (angelDeLaGuarda) {
    winners.set('Ángel de la Guarda', angelDeLaGuarda)
  }

  // 6. Sanador Supremo - Mayor curación promedio anual siendo healer
  const sanadorSupremo = calculateSanadorSupremo(rows)
  if (sanadorSupremo) {
    winners.set('Sanador Supremo', sanadorSupremo)
  }

  // 7. El healer que no es healer - Mayor curación sin usar héroes healer
  const healerQueNoEsHealer = calculateHealerQueNoEsHealer(rows)
  if (healerQueNoEsHealer) {
    winners.set('El healer que no es healer', healerQueNoEsHealer)
  }

  // 8. Protagonista del Respawn - Mayor tiempo muerto en una partida
  const protagonistaDelRespawn = calculateProtagonistaDelRespawn(rows)
  if (protagonistaDelRespawn) {
    winners.set('Protagonista del Respawn', protagonistaDelRespawn)
  }

  // 9. Esponja Humana - Mayor daño recibido siendo tank
  const esponjaHumana = calculateEsponjaHumana(rows)
  if (esponjaHumana) {
    winners.set('Esponja Humana', esponjaHumana)
  }

  // 10. Tank menos tankeador - Menor daño recibido siendo tank
  const tankMenosTankeador = calculateTankMenosTankeador(rows)
  if (tankMenosTankeador) {
    winners.set('Tank menos tankeador', tankMenosTankeador)
  }

  // 11. Fake Damage - Alto daño promedio con bajo impacto promedio
  const fakeDamage = calculateFakeDamage(rows)
  if (fakeDamage) {
    winners.set('Fake Damage', fakeDamage)
  }

  // 12. Carry del Año - Jugador con mayor número de MVPs
  const carryDelAno = calculateCarryDelAno(rows)
  if (carryDelAno) {
    winners.set('Carry del Año', carryDelAno)
  }

  // 13. Vicioso del Año - Jugador con más partidas jugadas
  const viciosoDelAno = calculateViciosoDelAno(rows)
  if (viciosoDelAno) {
    winners.set('Vicioso del Año', viciosoDelAno)
  }

  // 14. Healer más violento - Mayor promedio de daño por partida siendo healer
  const healerMasViolento = calculateHealerMasViolento(rows)
  if (healerMasViolento) {
    winners.set('Healer más violento', healerMasViolento)
  }

  // 15. Healer asesino - Mayor promedio de kills por partida siendo healer
  const healerAsesino = calculateHealerAsesino(rows)
  if (healerAsesino) {
    winners.set('Healer asesino', healerAsesino)
  }

  // 16. Autocuración - Mayor promedio de autocuración por partida
  const autocuracion = calculateAutocuracion(rows)
  if (autocuracion) {
    winners.set('Autocuración', autocuracion)
  }

  // 17. Adicto a los globos - No tenemos este dato en el CSV, omitir

  // 18. Asistente - Mayor promedio de asistencias por partida
  const asistente = calculateAsistente(rows)
  if (asistente) {
    winners.set('Asistente', asistente)
  }

  // 19. Top se murió más veces - Mayor promedio de muertes por partida
  const topSeMurioMasVeces = calculateTopSeMurioMasVeces(rows)
  if (topSeMurioMasVeces) {
    winners.set('Top se murió más veces', topSeMurioMasVeces)
  }

  // 20. Top daño a estructuras - Mayor promedio de daño a estructuras por partida
  const topDanoAStructuras = calculateTopDanoAStructuras(rows)
  if (topDanoAStructuras) {
    winners.set('Top daño a estructuras', topDanoAStructuras)
  }

  // 21. Top daño TOTAL - Mayor promedio de daño total combinado por partida
  const topDanoTotal = calculateTopDanoTotal(rows)
  if (topDanoTotal) {
    winners.set('Top daño TOTAL', topDanoTotal)
  }

  return winners
}

/**
 * Partida más violenta - Mayor número total de asesinatos (sumando ambos equipos)
 */
function calculatePartidaMasViolenta(rows) {
  // Group by replayName to get all players in each match
  const matches = new Map()
  
  for (const row of rows) {
    if (!row.replayName) continue
    if (!matches.has(row.replayName)) {
      matches.set(row.replayName, {
        replayName: row.replayName,
        map: row.map,
        dateISO: row.dateISO,
        totalKills: 0,
        players: []
      })
    }
    const match = matches.get(row.replayName)
    match.totalKills += row.heroKills || 0
    if (!match.players.includes(row.playerName)) {
      match.players.push(row.playerName)
    }
  }

  let maxKills = 0
  let winner = null

  for (const match of matches.values()) {
    if (match.totalKills > maxKills) {
      maxKills = match.totalKills
      winner = {
        value: maxKills,
        formattedValue: formatNumber(maxKills),
        match: {
          map: match.map,
          date: match.dateISO,
          replayName: match.replayName,
          players: match.players
        }
      }
    }
  }

  return winner
}

/**
 * Asesino en Serie - Jugador con mayor promedio de asesinatos por partida
 */
function calculateAsesinoEnSerie(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalKills: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalKills += row.heroKills || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalKills / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Lluvia de Daño - La partida con mayor daño total realizado
 */
function calculateLluviaDeDano(rows) {
  const matches = new Map()

  for (const row of rows) {
    if (!row.replayName) continue
    if (!matches.has(row.replayName)) {
      matches.set(row.replayName, {
        replayName: row.replayName,
        map: row.map,
        dateISO: row.dateISO,
        totalDamage: 0,
        players: []
      })
    }
    const match = matches.get(row.replayName)
    match.totalDamage += (row.heroDamage || 0) + (row.siegeDamage || 0)
    if (!match.players.includes(row.playerName)) {
      match.players.push(row.playerName)
    }
  }

  let maxDamage = 0
  let winner = null

  for (const match of matches.values()) {
    if (match.totalDamage > maxDamage) {
      maxDamage = match.totalDamage
      winner = {
        value: maxDamage,
        formattedValue: formatNumber(maxDamage),
        match: {
          map: match.map,
          date: match.dateISO,
          replayName: match.replayName,
          players: match.players
        }
      }
    }
  }

  return winner
}

/**
 * Daño Crónico - Jugador con mayor promedio de daño a héroes por partida
 */
function calculateDanoCronico(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalDamage: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalDamage += row.heroDamage || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalDamage / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Ángel de la Guarda - Mayor curación en una sola partida siendo healer
 */
function calculateAngelDeLaGuarda(rows) {
  const healerRows = rows.filter(r => r.role === 'Healer')
  
  let maxHealing = 0
  let winner = null

  for (const row of healerRows) {
    const healing = row.healingShielding || 0
    if (healing > maxHealing) {
      maxHealing = healing
      winner = {
        player: row.playerName,
        hero: row.heroName,
        value: maxHealing,
        formattedValue: formatNumber(maxHealing),
        match: {
          map: row.map,
          date: row.dateISO,
          replayName: row.replayName
        }
      }
    }
  }

  return winner
}

/**
 * Sanador Supremo - Mayor curación promedio anual siendo healer
 */
function calculateSanadorSupremo(rows) {
  const healerRows = rows.filter(r => r.role === 'Healer')
  const playerStats = new Map()

  for (const row of healerRows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalHealing: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalHealing += row.healingShielding || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalHealing / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * El healer que no es healer - Mayor curación sin usar héroes healer
 */
function calculateHealerQueNoEsHealer(rows) {
  const nonHealerRows = rows.filter(r => r.role !== 'Healer' && r.role !== 'Support')
  
  let maxHealing = 0
  let winner = null

  for (const row of nonHealerRows) {
    const healing = row.healingShielding || 0
    if (healing > maxHealing) {
      maxHealing = healing
      winner = {
        player: row.playerName,
        hero: row.heroName,
        role: row.role,
        value: maxHealing,
        formattedValue: formatNumber(maxHealing)
      }
    }
  }

  return winner
}

/**
 * Protagonista del Respawn - Mayor tiempo muerto en una partida
 */
function calculateProtagonistaDelRespawn(rows) {
  let maxDeadTime = 0
  let winner = null

  for (const row of rows) {
    const deadTime = row.spentDeadSeconds || 0
    if (deadTime > maxDeadTime) {
      maxDeadTime = deadTime
      winner = {
        player: row.playerName,
        hero: row.heroName,
        value: maxDeadTime,
        formattedValue: formatDuration(maxDeadTime),
        match: {
          map: row.map,
          date: row.dateISO,
          replayName: row.replayName
        }
      }
    }
  }

  return winner
}

/**
 * Esponja Humana - Mayor daño recibido siendo tank
 */
function calculateEsponjaHumana(rows) {
  const tankRows = rows.filter(r => r.role === 'Tank')
  
  let maxDamageTaken = 0
  let winner = null

  for (const row of tankRows) {
    const damageTaken = row.damageTaken || 0
    if (damageTaken > maxDamageTaken) {
      maxDamageTaken = damageTaken
      winner = {
        player: row.playerName,
        hero: row.heroName,
        value: maxDamageTaken,
        formattedValue: formatNumber(maxDamageTaken),
        match: {
          map: row.map,
          date: row.dateISO,
          replayName: row.replayName
        }
      }
    }
  }

  return winner
}

/**
 * Tank menos tankeador - Menor daño recibido siendo tank (pero que haya jugado al menos una partida completa)
 */
function calculateTankMenosTankeador(rows) {
  const tankRows = rows.filter(r => r.role === 'Tank' && (r.damageTaken || 0) > 0)
  
  let minDamageTaken = Infinity
  let winner = null

  for (const row of tankRows) {
    const damageTaken = row.damageTaken || 0
    if (damageTaken < minDamageTaken && damageTaken > 0) {
      minDamageTaken = damageTaken
      winner = {
        player: row.playerName,
        hero: row.heroName,
        value: minDamageTaken,
        formattedValue: formatNumber(minDamageTaken),
        match: {
          map: row.map,
          date: row.dateISO,
          replayName: row.replayName
        }
      }
    }
  }

  return winner
}

/**
 * Fake Damage - Alto daño promedio con bajo impacto promedio (ratio alto de daño promedio vs kills/assists promedio)
 */
function calculateFakeDamage(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalDamage: 0, totalKills: 0, totalAssists: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalDamage += row.heroDamage || 0
    stats.totalKills += row.heroKills || 0
    stats.totalAssists += row.assists || 0
    stats.matches++
  }

  let worstRatio = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    if (stats.matches === 0) continue
    const avgDamage = stats.totalDamage / stats.matches
    const avgImpact = (stats.totalKills + stats.totalAssists) / stats.matches
    // Solo considerar jugadores con daño promedio significativo (>30k por partida) y al menos algo de impacto promedio
    if (avgDamage > 30000 && avgImpact > 0) {
      const ratio = avgDamage / avgImpact // Más alto = peor ratio (mucho daño promedio, poco impacto promedio)
      if (ratio > worstRatio) {
        worstRatio = ratio
        winner = {
          player,
          value: avgDamage,
          formattedValue: formatNumber(Math.round(avgDamage)),
          impact: Math.round(avgImpact),
          ratio: Math.round(ratio),
          matches: stats.matches
        }
      }
    }
  }

  return winner
}

/**
 * Carry del Año - Jugador con mayor número de MVPs
 */
function calculateCarryDelAno(rows) {
  const playerMVPs = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    const award = (row.award || '').toLowerCase()
    if (award.includes('mvp')) {
      const current = playerMVPs.get(row.playerName) || 0
      playerMVPs.set(row.playerName, current + 1)
    }
  }

  let maxMVPs = 0
  let winner = null

  for (const [player, mvps] of playerMVPs.entries()) {
    if (mvps > maxMVPs) {
      maxMVPs = mvps
      winner = {
        player,
        value: maxMVPs,
        formattedValue: `${maxMVPs} MVP${maxMVPs !== 1 ? 's' : ''}`
      }
    }
  }

  return winner
}

/**
 * Vicioso del Año - Jugador con más partidas jugadas
 */
function calculateViciosoDelAno(rows) {
  const playerMatches = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    const current = playerMatches.get(row.playerName) || 0
    playerMatches.set(row.playerName, current + 1)
  }

  let maxMatches = 0
  let winner = null

  for (const [player, matches] of playerMatches.entries()) {
    if (matches > maxMatches) {
      maxMatches = matches
      winner = {
        player,
        value: maxMatches,
        formattedValue: formatNumber(maxMatches)
      }
    }
  }

  return winner
}

/**
 * Healer más violento - Mayor promedio de daño por partida siendo healer
 */
function calculateHealerMasViolento(rows) {
  const healerRows = rows.filter(r => r.role === 'Healer')
  const playerStats = new Map()

  for (const row of healerRows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalDamage: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalDamage += row.heroDamage || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalDamage / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Healer asesino - Mayor promedio de kills por partida siendo healer
 */
function calculateHealerAsesino(rows) {
  const healerRows = rows.filter(r => r.role === 'Healer')
  const playerStats = new Map()

  for (const row of healerRows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalKills: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalKills += row.heroKills || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalKills / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Autocuración - Mayor promedio de autocuración por partida
 */
function calculateAutocuracion(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalSelfHealing: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalSelfHealing += row.selfHealing || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalSelfHealing / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Asistente - Mayor promedio de asistencias por partida
 */
function calculateAsistente(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalAssists: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalAssists += row.assists || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalAssists / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Top se murió más veces - Mayor promedio de muertes por partida
 */
function calculateTopSeMurioMasVeces(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalDeaths: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalDeaths += row.deaths || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalDeaths / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Top daño a estructuras - Mayor promedio de daño a estructuras por partida
 */
function calculateTopDanoAStructuras(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalSiegeDamage: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalSiegeDamage += row.siegeDamage || 0
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalSiegeDamage / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}

/**
 * Top daño TOTAL - Mayor promedio de daño total combinado por partida (héroes + estructuras)
 */
function calculateTopDanoTotal(rows) {
  const playerStats = new Map()

  for (const row of rows) {
    if (!row.playerName) continue
    if (!playerStats.has(row.playerName)) {
      playerStats.set(row.playerName, { totalDamage: 0, matches: 0 })
    }
    const stats = playerStats.get(row.playerName)
    stats.totalDamage += (row.heroDamage || 0) + (row.siegeDamage || 0)
    stats.matches++
  }

  let maxAvg = 0
  let winner = null

  for (const [player, stats] of playerStats.entries()) {
    const avg = stats.matches > 0 ? stats.totalDamage / stats.matches : 0
    if (avg > maxAvg) {
      maxAvg = avg
      winner = {
        player,
        value: maxAvg,
        formattedValue: formatNumber(Math.round(maxAvg)),
        matches: stats.matches
      }
    }
  }

  return winner
}
