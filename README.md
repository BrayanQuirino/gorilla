# Gorilla — 100 hombres contra un gorila

Juego táctico 2D. **El motor de reglas se conserva y ahora incluye un primer renderizado retro pixel-art procedural.** El motor de batalla no depende de React ni del lienzo.

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
- **Tácticas**: atacar, defender, mantener, retirar, huir, esconderse, emboscada, buscar armas, distraer y rescatar. La batalla comienza automáticamente con Atacar. Estrategia pausa la partida para aplicar una orden a todo el equipo o comprar suministros.
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
- `src/arena.js`: capa de escenarios por arena, profundidad por eje Y, indicadores de peligro, objetos y efectos de combate.
- `src/sprites.js`: atlas de sprites pixel-art generado a resolución nativa, cacheado y animado (cuatro fotogramas por estado) para gorila y humanos, sin bibliotecas externas.
- `src/sprites.test.js`: pruebas de atlas, fotogramas y decisiones de animación.
- `.github/workflows/ci.yml`: ejecuta pruebas y build Vite en cada push.
- `src/main.jsx`: HUD retro renovado con pestañas de combate, supervivencia, exploración y tienda desplegable.

## Balance pendiente

Las probabilidades y cantidades actuales son **parámetros de videojuego** sujetos a pruebas, no estadísticas de ataques reales de gorilas. Algunas habilidades declaradas, efectos de suministros y nuevos tipos de arena requerirán iteraciones de comportamiento y balance; la incorporación de spritesheets ilustrados profesionalmente, sonidos y la posible migración a Phaser siguen pendientes. El atlas actual está dibujado en código y no reproduce de manera exacta la ilustración conceptual aprobada.

## Probar la versión arcade

La rama `main` incluye un atlas de cuatro fotogramas por estado, gorila espalda plateada, humanos pixel-art, terrenos, impactos, avisos y HUD de tácticas y compras.

- `npm ci && npm test && npm run dev`: pruebas y vista local.
- `npm run build`: compilación de producción.
- `.github/workflows/ci.yml`: comprueba automáticamente tests y build.
- `.github/workflows/pages.yml`: intenta publicar en GitHub Pages después de probar y compilar. Si aún no está habilitado, seleccionar **Settings → Pages → Source → GitHub Actions** en el repositorio.

El sitio de Pages solo debe considerarse publicado cuando el workflow `Publish Gorilla to GitHub Pages` muestre una ejecución exitosa. No hay ninguna dependencia de Phaser en esta versión; el motor sigue funcionando con Canvas 2D.
