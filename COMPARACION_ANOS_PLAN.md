# Plan de Implementación: Página de Comparación de Años

## 📋 Resumen General

Crear una nueva página dedicada "Comparación" que permita comparar estadísticas entre múltiples años seleccionados. Esta página será independiente de los filtros globales y tendrá su propio sistema de selección de años.

---

## 🎯 Estructura de la Página

### 1. **Panel de Control Superior**
- **Selector de Años**: Checkboxes para seleccionar múltiples años (mínimo 2, máximo 4-5)
- **Años disponibles**: Se extraen automáticamente de `meta.dateMin` y `meta.dateMax`
- **Indicador visual**: Muestra cuántos años están seleccionados
- **Botón "Comparar"**: Activa la comparación (o se actualiza automáticamente)

### 2. **Sección de KPIs Comparativos**
Tarjetas de métricas principales con valores por año y diferencias:

#### Métricas a mostrar:
- **Total Partidas**: Número total por año + diferencia absoluta y porcentual
- **Win Rate**: Porcentaje por año + diferencia en puntos porcentuales
- **Duración Promedio**: Tiempo promedio de partida por año + diferencia
- **Avg Takedowns**: Promedio de eliminaciones por año + diferencia
- **Avg Daño Héroe**: Promedio de daño a héroes por año + diferencia
- **Avg Muertes**: Promedio de muertes por año + diferencia

**Formato de tarjeta:**
```
┌─────────────────────────────┐
│ Total Partidas              │
├─────────────────────────────┤
│ 2024: 1,234 partidas        │
│ 2025: 1,567 partidas        │
│ Diferencia: +333 (+27%) ↑   │
└─────────────────────────────┘
```

### 3. **Gráfico de Evolución Temporal**
Gráfico de líneas múltiples mostrando evolución de métricas a lo largo del tiempo:

- **Métricas disponibles** (selector):
  - Win Rate
  - Partidas totales (acumuladas o por período)
  - Duración promedio
  - Avg Takedowns
  
- **Agrupación temporal**: Por mes o por semana
- **Líneas**: Una línea por cada año seleccionado (colores distintos)
- **Leyenda**: Interactiva, permite mostrar/ocultar años

### 4. **Gráfico de Barras Agrupadas - Héroes**
Comparación de top héroes entre años:

- **Top 10-15 héroes** más jugados (basado en el año más reciente o promedio)
- **Barras agrupadas**: Una barra por año para cada héroe
- **Métricas comparadas**:
  - Picks (cantidad de partidas)
  - Win Rate
  - KDA promedio
- **Selector de métrica**: Permite cambiar qué métrica se muestra

### 5. **Gráfico de Barras Agrupadas - Jugadores**
Comparación de top jugadores entre años:

- **Top 10 jugadores** más activos
- **Barras agrupadas**: Una barra por año para cada jugador
- **Métricas comparadas**:
  - Partidas totales
  - Win Rate
  - KDA promedio
- **Selector de métrica**: Permite cambiar qué métrica se muestra

### 6. **Tabla Comparativa de Héroes**
Tabla completa con columnas por año + columna de diferencia:

**Columnas:**
- Héroe (nombre + avatar)
- Rol
- **Por cada año seleccionado:**
  - Picks
  - Win Rate
  - KDA
  - Avg Daño
- **Columna "Cambio"**:
  - Diferencia absoluta y porcentual
  - Indicador visual (↑↓)
  - Ordenable por mayor/menor cambio

**Ordenamiento:**
- Por defecto: Por cambio absoluto (mayor variación primero)
- Opciones: Por nombre, por picks año más reciente, por win rate

### 7. **Tabla Comparativa de Jugadores**
Similar a la tabla de héroes pero para jugadores:

**Columnas:**
- Jugador (nombre + avatar)
- **Por cada año seleccionado:**
  - Partidas
  - Win Rate
  - KDA
  - Avg Daño
- **Columna "Cambio"**:
  - Diferencia absoluta y porcentual
  - Indicador de mejora/empeoramiento

### 8. **Sección de Top Cambios / Tendencias**
Análisis de cambios más significativos:

#### Subsección A: Héroes en Ascenso
- Héroes con mayor aumento en picks o win rate
- Top 5-10 héroes con mayor crecimiento

#### Subsección B: Héroes en Descenso
- Héroes con mayor disminución en picks o win rate
- Top 5-10 héroes con mayor caída

#### Subsección C: Jugadores con Mayor Mejora
- Jugadores que mejoraron más su win rate o KDA
- Top 5-10 jugadores con mejor progreso

#### Subsección D: Jugadores con Mayor Empeoramiento
- Jugadores que empeoraron más su win rate o KDA
- Top 5-10 jugadores con mayor regresión

**Formato de cada item:**
```
┌─────────────────────────────────────┐
│ Li-Ming                            │
│ Picks: 2024: 45 → 2025: 78 (+73%) │
│ Win Rate: 2024: 52% → 2025: 58%    │
│ Tendencia: 🔥 En ascenso           │
└─────────────────────────────────────┘
```

---

## 📊 Datos a Calcular y Mostrar

### Por Año (para cada año seleccionado):

#### Métricas Generales:
1. `totalMatches` - Total de partidas
2. `winRate` - Tasa de victorias
3. `avgGameTimeSeconds` - Duración promedio
4. `avgTakedowns` - Promedio de eliminaciones
5. `avgHeroDamage` - Promedio de daño a héroes
6. `avgDeaths` - Promedio de muertes
7. `avgKills` - Promedio de kills
8. `avgAssists` - Promedio de asistencias
9. `totalKills` - Total de kills
10. `totalDeaths` - Total de muertes
11. `totalAssists` - Total de asistencias

#### Por Héroe (agrupado):
1. `matches` - Partidas jugadas
2. `winRate` - Tasa de victorias
3. `kda` - KDA promedio
4. `avgHeroDamage` - Daño promedio
5. `avgTotalDamage` - Daño total promedio
6. `pickRate` - Tasa de selección (picks / total partidas)

#### Por Jugador (agrupado):
1. `matches` - Partidas jugadas
2. `winRate` - Tasa de victorias
3. `kda` - KDA promedio
4. `avgHeroDamage` - Daño promedio
5. `avgTotalDamage` - Daño total promedio

### Cálculos de Diferencia:

Para cada métrica comparada:
- **Diferencia absoluta**: `valorAño2 - valorAño1`
- **Diferencia porcentual**: `((valorAño2 - valorAño1) / valorAño1) * 100`
- **Indicador de dirección**: ↑ (aumento), ↓ (disminución), → (sin cambio)

### Detección de Tendencias:

Para identificar cambios significativos:
- **Umbral mínimo**: Cambio > 10% o cambio absoluto significativo
- **Filtro de muestra**: Mínimo 5-10 partidas en ambos años para considerar válido
- **Ranking**: Ordenar por mayor cambio absoluto o porcentual

---

## 🛠️ Archivos a Crear/Modificar

### Nuevos Archivos:

1. **`src/pages/YearComparison.jsx`**
   - Componente principal de la página
   - Maneja estado de años seleccionados
   - Renderiza todas las secciones

2. **`src/data/yearComparison.js`**
   - Funciones para agrupar datos por año
   - Funciones para calcular métricas por año
   - Funciones para calcular diferencias y tendencias
   - Funciones para detectar cambios significativos

3. **`src/components/YearSelector.jsx`** (opcional)
   - Componente reutilizable para seleccionar años
   - Checkboxes con diseño consistente

4. **`src/components/ComparisonKpiCard.jsx`** (opcional)
   - Tarjeta especializada para mostrar KPIs comparativos
   - Muestra valores por año y diferencias

### Archivos a Modificar:

1. **`src/app/routes.jsx`**
   - Agregar nueva ruta:
     ```js
     {
       id: 'comparison',
       label: 'Comparación',
       icon: '📊',
       component: YearComparison
     }
     ```

2. **`src/app/App.jsx`**
   - No requiere cambios (ya maneja rutas dinámicamente)

---

## 🎨 Diseño Visual

### Estilo General:
- Mantener consistencia con el resto del dashboard
- Usar colores distintos para cada año (paleta de colores predefinida)
- Indicadores visuales claros para aumentos/disminuciones
- Animaciones sutiles al cambiar selección de años

### Paleta de Colores por Año:
- 2023: `#8b5cf6` (violeta)
- 2024: `#6366f1` (índigo)
- 2025: `#10b981` (verde)
- 2026: `#f59e0b` (ámbar)
- 2027: `#ef4444` (rojo)

### Indicadores de Cambio:
- ↑ Verde: Aumento positivo
- ↓ Rojo: Disminución negativa
- → Gris: Sin cambio significativo

---

## 📈 Funcionalidades Adicionales (Futuras)

1. **Exportación**:
   - Exportar tablas comparativas a CSV
   - Exportar gráficos a PNG

2. **Filtros adicionales**:
   - Filtrar por rol de héroe en comparación
   - Filtrar por jugador específico

3. **Comparación de mapas**:
   - Tabla comparativa de mapas más jugados
   - Win rate por mapa por año

4. **Análisis estadístico**:
   - Tests de significancia estadística
   - Intervalos de confianza para win rates

---

## ✅ Checklist de Implementación

- [ ] Crear `src/data/yearComparison.js` con funciones helper
- [ ] Crear `src/pages/YearComparison.jsx` con estructura básica
- [ ] Implementar selector de años (checkboxes)
- [ ] Implementar sección de KPIs comparativos
- [ ] Implementar gráfico de evolución temporal
- [ ] Implementar gráfico de barras agrupadas - Héroes
- [ ] Implementar gráfico de barras agrupadas - Jugadores
- [ ] Implementar tabla comparativa de Héroes
- [ ] Implementar tabla comparativa de Jugadores
- [ ] Implementar sección de Top Cambios / Tendencias
- [ ] Agregar ruta en `routes.jsx`
- [ ] Probar con datos reales
- [ ] Ajustar estilos y animaciones
- [ ] Optimizar rendimiento (memoización)

---

## 🔍 Consideraciones Técnicas

1. **Rendimiento**:
   - Usar `useMemo` para cálculos pesados
   - Agrupar datos por año una sola vez
   - Cachear resultados de cálculos

2. **Manejo de datos faltantes**:
   - Si un año no tiene datos, mostrar mensaje apropiado
   - No calcular diferencias si falta un año

3. **Validación**:
   - Mínimo 2 años seleccionados para comparar
   - Validar que los años seleccionados tengan datos

4. **Responsive**:
   - Las tablas deben ser scrollables horizontalmente en móviles
   - Los gráficos deben adaptarse a pantallas pequeñas

---

## 📝 Notas Finales

- Esta página será independiente de los filtros globales
- Los datos se filtrarán internamente por año seleccionado
- Se reutilizarán componentes existentes cuando sea posible (ChartCard, SectionShell, etc.)
- Se seguirán las convenciones de código del proyecto existente


🎨🧠 Backlog de Tareas UX/UI – Página Comparación de Años
Objetivo General

Mejorar la experiencia de usuario de la página Comparación de Años mediante una UI moderna, clara, escaneable y orientada a insights, manteniendo coherencia visual con el dashboard existente.

🧭 UX-01 · Estructura y Jerarquía Visual

Tarea:
Definir una jerarquía visual clara para la página de comparación.

Acciones:

Establecer el orden visual:

Selector de años (sticky)

KPIs comparativos

Gráficos

Tablas

Tendencias

Aplicar espaciado consistente entre secciones (SectionShell o similar).

Garantizar que cada sección sea visualmente distinguible.

Criterio de éxito UX:

El usuario entiende qué comparar en menos de 5 segundos.

La página se puede escanear sin leer texto largo.

🎛️ UX-02 · Selector de Años UX-Friendly

Tarea:
Rediseñar el selector de años con enfoque UX moderno.

Acciones:

Usar checkboxes tipo pill / chip buttons.

Asignar color único a cada año y mantenerlo consistente.

Mostrar contador visible: X años seleccionados.

Deshabilitar visualmente el botón Comparar si hay < 2 años.

Hacer el selector sticky en scroll vertical.

Micro-interacciones:

Animación sutil al seleccionar/deseleccionar.

Hover state claro.

Criterio de éxito UX:

El usuario entiende qué años está comparando sin leer texto adicional.

📊 UX-03 · KPIs Comparativos de Alto Impacto

Tarea:
Diseñar tarjetas KPI enfocadas en comparación y diferencia.

Acciones:

Crear ComparisonKpiCard con:

Una fila por año

Diferencia absoluta y porcentual destacada

Usar íconos y colores semánticos:

Verde ↑ mejora

Rojo ↓ empeora

Gris → sin cambio

Priorizar visualmente la diferencia sobre el valor absoluto.

Micro-interacciones:

Hover: resaltar el año con mejor valor.

Tooltip con explicación de la métrica.

Criterio de éxito UX:

El usuario identifica mejoras/empeoramientos sin calcular mentalmente.

📈 UX-04 · Gráficos Claros y Comparables

Tarea:
Optimizar gráficos para comparación multi-año.

Acciones:

Usar líneas gruesas y colores consistentes por año.

Implementar leyenda interactiva (mostrar/ocultar años).

Agregar selector de métrica claro y accesible.

Permitir toggle:

Valores absolutos

Diferencias (%)

Criterio de éxito UX:

El gráfico se entiende sin leer la leyenda completa.

No hay saturación visual con 3–4 años.

📋 UX-05 · Tablas Comparativas Legibles

Tarea:
Mejorar la usabilidad de tablas densas.

Acciones:

Mantener encabezados sticky.

Compactar columnas secundarias.

Resaltar columna Cambio (↑ ↓ %).

Usar avatar + nombre para héroes/jugadores.

Permitir ordenamiento rápido por cambio.

UX Mobile:

Scroll horizontal suave.

Mantener primeras columnas visibles.

Criterio de éxito UX:

El usuario puede detectar cambios importantes sin revisar toda la fila.

🔥 UX-06 · Sección de Tendencias Orientada a Insights

Tarea:
Transformar datos en narrativa visual.

Acciones:

Mostrar tendencias como cards editoriales, no tablas.

Usar íconos de estado (🔥 📉 ⭐).

Limitar texto a insights claros y cortos.

Priorizar top 5–10 cambios significativos.

Criterio de éxito UX:

El usuario entiende “qué está pasando” sin analizar números.

🎞️ UX-07 · Animaciones y Micro-interacciones

Tarea:
Agregar animaciones sutiles y útiles.

Acciones:

Animar conteo de KPIs.

Transiciones suaves al cambiar años.

Skeleton loaders al recalcular datos.

Usar duraciones cortas (150–250ms).

Restricciones:

Sin animaciones distractoras.

Priorizar rendimiento.

Criterio de éxito UX:

La interfaz se siente viva pero profesional.

🎨 UX-08 · Consistencia Visual y Tema

Tarea:
Alinear visualmente la página con el dashboard principal.

Acciones:

Usar modo oscuro por defecto.

Mantener paleta de colores por año.

Reutilizar componentes existentes siempre que sea posible.

Tipografía clara y legible para números.

Criterio de éxito UX:

La página se siente parte natural del dashboard.

♿ UX-09 · Accesibilidad Básica

Tarea:
Garantizar una experiencia inclusiva.

Acciones:

Asegurar contraste AA mínimo.

No depender solo del color para indicar cambios.

Tooltips accesibles.

Tamaños de texto legibles en tablas.

Criterio de éxito UX:

La información sigue siendo clara sin depender del color.

✅ UX-10 · Validación Final de Experiencia

Tarea:
Validar la experiencia antes de cerrar implementación.

Checklist UX:

¿Se entiende qué año mejoró sin leer números?

¿Los KPIs responden la pregunta “qué cambió”?

¿La comparación es clara con 3–4 años?

¿En móvil se pueden leer KPIs y tendencias?

✨ Resultado Esperado

Una página de comparación que:

Prioriza insights sobre datos crudos

Se siente moderna y profesional

Reduce carga cognitiva

Eleva la percepción de calidad del dashboard