# Geekos HotS Dashboard 2024-2025

Dashboard interactivo para visualizar y analizar estadísticas de Heroes of the Storm de la comunidad Geekos.

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 📁 Ubicación del CSV

**IMPORTANTE:** El archivo CSV debe estar en la carpeta `/public` para que la aplicación pueda cargarlo.

```
proyecto/
├── public/
│   └── structured_data.csv  ← El CSV debe estar aquí
├── src/
└── ...
```

Si el CSV está en la raíz del proyecto, cópialo a `/public`:

```bash
# Windows (PowerShell)
Copy-Item .\structured_data.csv .\public\

# Linux/Mac
cp ./structured_data.csv ./public/
```

## 📊 Formato del CSV

El CSV debe contener las siguientes columnas (al menos):

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| Year | Año de la partida | 2024 |
| FileName | Nombre del archivo replay (incluye fecha) | 2023-12-01 23.18.12 Silver City.StormReplay |
| PlayerName | Nombre del jugador | WatchdogMan |
| HeroName | Nombre del héroe | Zul'jin |
| Role | Rol del héroe | Ranged Assassin, Tank, Bruiser, Healer, Support, Melee Assassin, Mage |
| Map | Nombre del mapa | Caverna perdida |
| GameTime | Duración de la partida | 00:30:59 |
| Winner | Resultado | Yes/No, true/false, 1/0, Win/Loss |
| HeroDamage | Daño a héroes | 360891 |
| TotalSiegeDamage | Daño de asedio total | 264961 |
| DamageTaken | Daño recibido | 133549 |
| HealingShielding | Curación/escudos | 0 |
| HeroKills | Kills | 7 |
| Assists | Asistencias | 22 |
| Takedowns | Takedowns totales | 30 |
| Deaths | Muertes | 4 |
| Experience | Experiencia | 41809 |
| SpentDead | Tiempo muerto | 00:02:45 |
| OnFire | Tiempo "on fire" | 00:13:51 |
| Award | Premio obtenido | mvp |

### Normalización automática

La aplicación maneja automáticamente:

- **Winner:** Acepta `Yes/No`, `true/false`, `TRUE/FALSE`, `Win/Loss`, `1/0`, `Sí/No`
- **GameTime/SpentDead/OnFire:** Acepta `mm:ss`, `hh:mm:ss`, o segundos como número
- **Números:** Valores vacíos o `NaN` se convierten a 0
- **Fechas:** Se extraen del campo FileName (formato: "YYYY-MM-DD HH.MM.SS MapName.StormReplay") o del formato antiguo Year + Name
- **Roles:** Se asignan automáticamente basándose en el nombre del héroe

## 🎮 Funcionalidades

### Filtros Globales
- Rango de fechas
- Mapa específico
- Rol del héroe
- Jugador específico
- Resultado (Victorias/Derrotas)
- Búsqueda por texto (héroe o jugador)

### Secciones

1. **Overview:** KPIs generales, partidas en el tiempo, distribución por rol
2. **Héroes:** Página avanzada de exploración con:
   - Tabla completa sorteable con todas las métricas
   - Selector de métrica para gráficos (picks, winrate, KDA, DPM, etc.)
   - Filtro por mínimo de partidas y búsqueda
   - Wilson Score para ranking de winrate más confiable
   - Panel de detalles por héroe (click en fila): tendencias, mapas, jugadores
   - Exportación a CSV (tabla) y PNG (gráficos)
3. **Jugadores:** Top jugadores, estadísticas de KDA
4. **Mapas:** Estadísticas por mapa, winrate
5. **Fun Facts:** Premios especiales de la comunidad:
   - 🔥 Most On Fire
   - 💀 Most Time Dead
   - 💣 Kamikaze Award
   - 🎯 Clutch Hero
   - 💥 Most Violent Match
   - ☠️ Cursed Map

## 🖼️ Imágenes de Héroes

La aplicación muestra avatares de héroes en la tabla, gráficos (tooltips) y panel de detalles. Si no hay imagen disponible, se muestra un placeholder con las iniciales del héroe.

### Agregar imágenes manualmente

1. Coloca las imágenes en `/public/hero-images/`
2. Usa el formato de nombre "slug": minúsculas, sin acentos, guiones en lugar de espacios
3. Formatos soportados: `.webp`, `.png`, `.jpg` (en ese orden de prioridad)

**Ejemplos de nombres:**
| Héroe | Archivo |
|-------|---------|
| Alexstrasza | `alexstrasza.png` |
| Li-Ming | `li-ming.png` |
| Lt. Morales | `lt-morales.png` |
| E.T.C. | `etc.png` |
| Kel'Thuzad | `kelthuzad.png` |
| The Lost Vikings | `the-lost-vikings.png` |

### Descarga automática (opcional)

Existe un script que puede descargar imágenes desde URLs que tú proporciones:

1. Edita `hero-images.manifest.json` y añade URLs a cada héroe:
   ```json
   { "name": "Alexstrasza", "slug": "alexstrasza", "url": "https://ejemplo.com/alexstrasza.png" }
   ```

2. Ejecuta el script:
   ```bash
   npm run download:hero-images
   
   # Opciones:
   npm run download:hero-images -- --force    # Re-descarga existentes
   npm run download:hero-images -- --dry-run  # Solo muestra qué haría
   ```

**Nota:** El manifest viene con URLs vacías. Debes añadir las URLs de fuentes oficiales o fan sites que uses.

### Estructura de carpetas

```
public/
└── hero-images/
    ├── .gitkeep
    ├── alexstrasza.webp
    ├── li-ming.png
    └── ...
```

## 🛠️ Tecnologías

- **Vite** - Build tool
- **React** - UI library
- **TailwindCSS** - Styling
- **PapaParse** - CSV parsing
- **Recharts** - Charts
- **html-to-image** - Exportación de gráficos a PNG
- **clsx** - Class utilities

## 📈 Wilson Score

La página de Héroes utiliza **Wilson Score Lower Bound** para ranking de winrate. Esto proporciona un ranking más justo que penaliza a héroes con muy pocas partidas, evitando que un héroe con 2/2 victorias (100%) aparezca por encima de uno con 80/100 (80%).

Los héroes con menos de 20 partidas se marcan con "?" indicando datos limitados.

## 📝 Reemplazar CSV

Para actualizar los datos:

1. Exporta tu nuevo CSV con el mismo formato
2. Reemplaza el archivo en `/public/structured_data.csv`
3. Recarga la aplicación

## 🔧 Desarrollo

Estructura del proyecto:

```
src/
├── app/
│   ├── App.jsx              # Componente principal
│   ├── routes.jsx           # Configuración de tabs/rutas
│   └── layout/
│       ├── Header.jsx       # Cabecera
│       ├── FilterBar.jsx    # Barra de filtros
│       └── SectionShell.jsx # Wrapper de secciones
├── data/
│   ├── useDataset.js        # Hook principal de datos
│   ├── loadCsv.js           # Carga del CSV
│   ├── normalizeRow.js      # Normalización de una fila
│   ├── normalize.js         # Normalización de todo el dataset
│   ├── filters.js           # Lógica de filtros
│   ├── metrics.js           # Cálculos y agregaciones generales
│   ├── heroMetrics.js       # Métricas avanzadas de héroes
│   └── exportHelpers.js     # Helpers para exportación CSV/PNG
├── components/
   │   ├── KpiCard.jsx          # Tarjeta de KPI
   │   ├── ChartCard.jsx        # Tarjeta para gráficos
   │   ├── Select.jsx           # Select personalizado
   │   ├── SearchInput.jsx      # Input de búsqueda
   │   ├── Badge.jsx            # Badge/etiqueta
   │   ├── EmptyState.jsx       # Estado vacío
   │   ├── LoadingState.jsx     # Estado de carga/error
   │   ├── SortableTable.jsx    # Tabla sorteable genérica
   │   ├── HeroMetricPicker.jsx # Selector de métricas para héroes
   │   ├── HeroDetailsDrawer.jsx # Panel de detalles de héroe
   │   ├── HeroAvatar.jsx       # Avatar de héroe con fallback
   │   ├── HeroChartTooltip.jsx # Tooltip mejorado para gráficos
   │   ├── ChartExportButton.jsx # Botones de exportación
   │   └── TruncatedText.jsx    # Texto truncado con tooltip
├── pages/
│   ├── Overview.jsx         # Página de resumen
│   ├── Heroes.jsx           # Página de héroes
│   ├── Players.jsx          # Página de jugadores
│   ├── Maps.jsx             # Página de mapas
│   └── FunFacts.jsx         # Página de fun facts
├── utils/
   │   ├── format.js            # Funciones de formateo
   │   ├── date.js              # Utilidades de fecha
   │   ├── stats.js             # Utilidades estadísticas (Wilson Score)
   │   ├── slug.js              # Generador de slugs para héroes
   │   └── heroImage.js         # Resolver de imágenes de héroes
├── styles/
│   └── index.css            # Estilos globales + Tailwind
└── main.jsx                 # Entry point
```

## 📄 Licencia

MIT
