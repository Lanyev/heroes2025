# Imágenes de Highlights Chuscos

Esta carpeta contiene las imágenes de fondo para los bloques de "Highlights Chuscos" que se muestran en los detalles de héroes y jugadores.

## Estructura de Archivos

Las imágenes deben nombrarse según el **ID del highlight** que representan. Los IDs disponibles son:

### Highlights Principales

- `most_violent.jpg` - 🔥 Partida Más Violenta
- `most_time_dead.jpg` - 🪦 Día de Muertos (más tiempo muerto)
- `most_healing.jpg` - 👼 Ángel de la Guarda (más curación)
- `most_deaths.jpg` - 😵 Kamikaze (más muertes)
- `pacifist_win.jpg` - 🧠 Pacifista con Resultados (victoria con pocos kills)
- `speedrun.jpg` - ⚡ Speedrun (partida más corta)
- `raid_boss.jpg` - 🧱 Raid Boss (más daño recibido)
- `protagonist.jpg` - 🔥 Modo Protagonista (mejor KDA)
- `push_enjoyer.jpg` - 🎯 Objetivos > Ego (más daño a estructuras)
- `socializer.jpg` - 🤝 Socializador (más asistencias)

### Highlights Genéricos

- `generic_matches.jpg` - 📦 Partidas con este Héroe
- `avg_time_dead.jpg` - 😴 Promedio Tiempo Muerto
- `no_data.jpg` - Para estados sin datos

## Formato de Imágenes

- **Formato recomendado**: JPG o PNG
- **Resolución**: Se ajustarán automáticamente al contenedor (aspect ratio 16:9 recomendado)
- **Tamaño**: Optimiza las imágenes para web (recomendado < 500KB por imagen)
- **Aspecto**: Las imágenes se mostrarán como fondo detrás del texto, así que:
  - Usa imágenes que no compitan demasiado con el texto
  - Considera usar imágenes con opacidad o filtros oscuros
  - El texto se mostrará por encima con `z-index: 10`

## Cómo Usar las Imágenes

Las imágenes se cargan automáticamente en el componente `HeroFunnyBlocks` basándose en el `id` del bloque. El componente buscará la imagen en:

```
/public/highlight-images/{block.id}.jpg
```

Por ejemplo:
- Si el bloque tiene `id: 'most_violent'`, buscará `/highlight-images/most_violent.jpg`
- Si el bloque tiene `id: 'push_enjoyer'`, buscará `/highlight-images/push_enjoyer.jpg`

## Implementación en el Código

La configuración actual de las imágenes en `HeroFunnyBlocks.jsx` es la siguiente:

```jsx
{/* Contenedor de imagen con gradiente de máscara para difuminar lado izquierdo */}
<div className="absolute right-0 top-0 h-full w-auto overflow-hidden pointer-events-none">
  <img 
    src={`/highlight-images/${block.id}.jpg`}
    alt=""
    className="h-full w-auto object-contain object-right opacity-75"
    onError={(e) => {
      // Fallback si la imagen no existe: mostrar gradiente de fondo
      e.target.style.display = 'none'
      const parent = e.target.closest('.rounded-xl')
      if (parent) {
        parent.className = `${getGradientClasses(accent)} rounded-xl p-4 border relative overflow-hidden`
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
```

## Configuración de la Imagen

### Posicionamiento
- **Posición**: `absolute right-0 top-0` - La imagen se posiciona a la derecha del contenedor
- **Ajuste**: `h-full w-auto object-contain object-right` - La imagen se ajusta a la altura del box, manteniendo sus proporciones
- **Opacidad**: `opacity-75` - La imagen tiene 75% de opacidad para ser visible pero no dominar el texto

### Gradiente de Difuminado
El gradiente se aplica sobre la imagen para difuminar el lado izquierdo hacia transparente:

- **Dirección**: `to left` - El gradiente va de derecha a izquierda
- **Puntos de control**:
  - `0%` (izquierda): `transparent` - Completamente transparente
  - `30%`: `rgba(15, 23, 42, 0.3)` - 30% opacidad (slate-900)
  - `60%`: `rgba(15, 23, 42, 0.7)` - 70% opacidad
  - `100%` (derecha): `rgba(15, 23, 42, 0.95)` - 95% opacidad

### Overlay General
Un overlay adicional con gradiente para mejorar la legibilidad del texto:
- `bg-gradient-to-l from-slate-900/50 via-slate-900/20 to-transparent`
- Se aplica sobre toda el área del contenedor

## Notas

- Si una imagen no existe para un highlight específico, se mostrará el gradiente de acento del bloque
- Las imágenes se ajustan a la altura del contenedor (`h-full`) y mantienen sus proporciones (`object-contain`)
- La imagen se posiciona a la derecha (`object-right`) y se difumina hacia la izquierda
- El texto siempre se mostrará por encima de la imagen con `z-index: 10`
- Todos los overlays usan `pointer-events-none` para no interferir con la interacción del contenido
