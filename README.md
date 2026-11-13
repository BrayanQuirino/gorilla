# Gorilla — 100 hombres contra un gorila

Juego táctico 2D. **Esta etapa implementa reglas y simulación; el rediseño pixel-art queda pendiente.** El motor de batalla no depende de React ni del lienzo.

## Desarrollo

Requiere Node.js 22.12 o posterior.

```bash
npm ci
npm test
npm run dev
npm run build
```

## Reglas incorporadas

- **100 hombres** de 18 a 100 años, con efectos de la edad y ocho atributos: fuerza, velocidad, inteligencia (incluye percepción/coordinación), temple, precisión, agilidad, estrategia y técnica. Conservamos los arquetipos preexistentes; no se añadieron otros.
- **Catálogo preexistente de 1,000 objetos**, desde un zapato hasta las armas arcade. Los hombres pueden empezar equipados o sin objeto. Se calcula un inventario limitado, reservando una parte para el escenario antes del sorteo inicial.
- **Arenas configuradas**: claro, selva, cañón y hangar. Cada una tiene categorías compatibles, ubicaciones, ocultamiento y proporción de objetos en el suelo. No se revela su posición exacta en el resumen.
- **Tácticas**: atacar, defender, mantener, mover, retirar, huir, esconderse, emboscada, buscar armas, distraer y rescatar. Las órdenes se aplican por escuadrón o a todos.
- **Búsqueda de objetos**: unidades que exploran identifican y recogen objetos del suelo. Cuando alguien cae, su objeto vuelve al suelo, sin duplicarse. No está garantizado encontrar uno.
- **Gorila autónomo**: fuerza bruta con riesgo elevado de bajas por golpe, señales de ataque, cargas, barridos, golpes de área, rugidos, memoria de tácticas repetidas, energía, furia y enfriamientos.
- **Fatiga, pánico y estados**: energía de hombres y gorila, miedo, heridas, incapacidad, eliminación, descanso y rescate de incapacitados.
- **Bananas**: se obtienen por tiempo sobrevivido y daño infligido; permiten comprar suministros. La lista de suministros y sus costos se encuentra en `src/rules.js`.
- **Suministros**: curación, recuperación de energía, protección, armas de apoyo, barricadas, trampas, señuelos, humo, camuflaje, coordinación y bonificaciones temporales.
- **Victoria**: hombres si agotan la vida del gorila; gorila si elimina/incapacita al equipo o concluyen 5 minutos.

## Arquitectura

- `src/data/objetos.json`: catálogo original de objetos; no se sustituyó.
- `src/rules.js`: definiciones de arena, tácticas, suministros, atributos y ventajas.
- `src/roster.js`: generación de personajes, efectos de edad, asignación inicial y reserva de armas por arena.
- `src/battle.js`: motor determinista con generador de azar inyectable, estado de combate, compras, IA y eventos.
- `src/gameplay.test.js`: pruebas de inventario, tácticas, compras y simulación.
- `src/arena.js`: renderizado Canvas 2D heredado, pendiente de renovación.
- `src/main.jsx`: panel de control temporal para las reglas, sin rediseño visual.

## Balance pendiente

Las probabilidades y cantidades actuales son **parámetros de videojuego** sujetos a pruebas, no estadísticas de ataques reales de gorilas. Algunas habilidades declaradas, efectos de suministros y nuevos tipos de arena requerirán iteraciones de comportamiento y balance; la representación visual, animaciones, efectos sonoros y sprites se realizarán en una etapa posterior.
