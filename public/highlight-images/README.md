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

Actualmente el componente muestra un placeholder. Para activar las imágenes, reemplaza el div del placeholder en `HeroFunnyBlocks.jsx`:

```jsx
{/* Imagen de fondo */}
<img 
  src={`/highlight-images/${block.id}.jpg`}
  alt=""
  className="absolute inset-0 w-full h-full object-cover opacity-30"
  onError={(e) => {
    // Fallback si la imagen no existe
    e.target.style.display = 'none'
  }}
/>
```

## Notas

- Si una imagen no existe para un highlight específico, se mostrará el placeholder actual
- Las imágenes se muestran con `object-cover` para mantener la proporción y cubrir todo el contenedor
- El texto siempre se mostrará por encima de la imagen con `z-index: 10`
- Considera agregar una capa de overlay oscuro (`opacity-30` o similar) para mejorar la legibilidad del texto
