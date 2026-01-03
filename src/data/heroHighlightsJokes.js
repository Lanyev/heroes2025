/**
 * Diccionario de frases chuscas para los diferentes tipos de highlights
 * Nivel: humor gamer, sarcasmo y roast ligero
 */
export const HERO_HIGHLIGHTS_JOKES = {
  // Bloque 1: Partida Más Violenta (siempre presente)
  most_violent: [
    'Te saliste del carril y rompiste el juego.',
    'Ese día sí eras el protagonista.',
    'Cuando el daño es tu personalidad.',
    'Ni el enemigo sabía qué pasó.',
    'Rompiste el medidor de daño.',
    'Blizzard todavía está revisando esta partida.',
    'El matchmaking pidió disculpas.',
    'Ese daño no era necesario… pero se agradece.',
    'Aquí no jugaste, ejecutaste.',
    'El replay debería venir con advertencia.',
  ],

  // A) Día de Muertos - Más tiempo muerto
  most_time_dead: [
    'Básicamente estuviste viendo la pantalla de respawn.',
    'El respawn te conocía por tu nombre.',
    'Más tiempo muerto que un NPC.',
    'Te volviste experto en pantallas de carga.',
    'El cementerio te extrañaba.',
    'Jugaste más como espectador que como héroe.',
    'Respawn Simulator 2025.',
    'El healer ya ni preguntaba.',
    'Moriste tanto que ya era costumbre.',
    'A estas alturas ya conocías el mapa… desde el suelo.',
  ],

  // B) Ángel de la Guarda - Más curación
  most_healing: [
    'Si cobraran por curación, ya tenías casa propia.',
    'Eres el médico que todos necesitan.',
    'Más curación que un hospital.',
    'Tu equipo te debe la vida.',
    'El sanador que nadie pidió pero todos necesitaban.',
    'Cargando vidas como si fuera WiFi.',
    'Curaste tanto que olvidaron esquivar.',
    'Básicamente jugaste en modo niñera.',
    'El equipo sobrevivió… gracias a ti, no a ellos.',
    'Sanaste errores ajenos como campeón.',
  ],

  // C) Kamikaze - Más muertes
  most_deaths: [
    'Entraste con fe y saliste con reporte.',
    'El respawn era tu segundo hogar.',
    'Más muertes que un personaje de Game of Thrones.',
    'Te conocían en el cementerio.',
    'Cada muerte era una lección… aparentemente.',
    'Morir también es una forma de contribuir.',
    'Jugaste en modo sacrificio constante.',
    'El equipo ya ni se sorprendía.',
    'A este punto era una estrategia… ¿no?',
    'Si daban oro por morir, eras rico.',
  ],

  // D) Pacifista con Resultados - Victoria con pocos kills
  pacifist_win: [
    'Demostrando que el daño emocional también cuenta.',
    'Ganaste sin mancharte las manos.',
    'La victoria sin violencia existe.',
    'Estrategia > Agresividad.',
    'Ganaste siendo el mejor espectador.',
    'No mataste, pero estuviste ahí… supongo.',
    'El equipo ganó mientras tú meditabas.',
    'Minimalismo aplicado al combate.',
    'Cero kills, cero remordimientos.',
    'El verdadero “no fue mi culpa”.',
  ],

  // E) Speedrun - Partida más corta
  speedrun: [
    'Ni el café se enfrió.',
    'Speedrun de partida completado.',
    'Más rápido que Flash corriendo.',
    'Entraste, ganaste, saliste.',
    'Partida express, resultados garantizados.',
    'El matchmaking no duró nada.',
    'Esto fue un trámite.',
    'Ni tiempo dio de tiltearse.',
    'GG antes de empezar.',
    'La partida duró menos que la explicación.',
  ],

  // F) Raid Boss - Más daño recibido
  raid_boss: [
    'Te pegaron como si debieras impuestos.',
    'Eras el tanque que todos necesitaban.',
    'Más daño recibido que un punching bag.',
    'El enemigo te tenía en la mira.',
    'Absorbiste más daño que una esponja.',
    'El equipo te usó como escudo humano.',
    'Recibiste golpes por todos.',
    'Tanqueaste incluso errores ajenos.',
    'El foco era 100% personal.',
    'Te llevaste golpes que no eran tuyos.',
  ],

  // G) Modo Protagonista - Mejor KDA
  protagonist: [
    'Ese día sí eras el main character.',
    'Protagonista de tu propia película.',
    'KDA digno de leyenda.',
    'Ese día todo salió perfecto.',
    'El héroe que todos querían ser.',
    'Jugaste en dificultad fácil.',
    'El enemigo era NPC.',
    'El carry que apareció.',
    'Aquí sí se notó la diferencia.',
    'El resto solo acompañaba.',
  ],

  // H) Objetivos > Ego - Más daño a estructuras
  push_enjoyer: [
    'Las torres te conocen por tu nombre.',
    'Eres el destructor de estructuras.',
    'Más daño a torres que un terremoto.',
    'Las defensas temían tu nombre.',
    'Push master en acción.',
    'Mientras otros peleaban, tú ganabas.',
    'Objetivos primero, kills después.',
    'Las torres no tuvieron oportunidad.',
    'La base enemiga pidió auxilio.',
    'Jugaste al objetivo, no al ego.',
  ],

  // I) Socializador - Más asistencias
  socializer: [
    'No matas, pero estás en todo.',
    'El mejor compañero de equipo.',
    'Asistencias como si fueras el asistente del equipo.',
    'Ayudaste más que un tutorial.',
    'El verdadero MVP del soporte.',
    'Estuviste en todas, menos en el daño.',
    'El teamfight era contigo o no era.',
    'Conectaste más que el WiFi.',
    'Hiciste el trabajo sucio.',
    'Sin ti, no ganaban.',
  ],

  // Fallbacks genéricos
  generic_matches: [
    'Cantidad no es calidad… pero impresiona.',
    'Muchas partidas, muchas decisiones cuestionables.',
    'Claramente te gusta este héroe.',
    'La constancia también cuenta.',
    'Horas de tu vida bien invertidas… supongo.',
    'Este héroe ya paga renta.',
    'Se nota el compromiso.',
    'Aquí hubo dedicación.',
    'Este pick no fue casualidad.',
    'El héroe favorito no se niega.',
  ],

  avg_time_dead: [
    'Al menos aprovechaste para ir al baño.',
    'Tiempo muerto promedio: profesional.',
    'El respawn era tu mejor amigo.',
    'Más tiempo muerto que vivo.',
    'Experto en pantallas de carga.',
    'Tiempo perfecto para reflexionar.',
    'Morir también es parte del gameplay.',
    'Respawn con experiencia.',
    'Aquí aprendiste paciencia.',
    'Tiempo muerto bien administrado.',
  ],
};

/**
 * Obtiene una frase chusca aleatoria para un tipo de highlight
 */
export function getRandomJoke(highlightType) {
  const jokes = HERO_HIGHLIGHTS_JOKES[highlightType];
  if (!jokes || jokes.length === 0) {
    return 'Dato interesante, pero no tan chusco.';
  }
  return jokes[Math.floor(Math.random() * jokes.length)];
}
