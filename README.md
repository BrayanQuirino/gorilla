# Gorilla — 100 humanos contra un gorila

Simulador táctico de combate con 100 humanos, un gorila y evolución de habilidades.

## Renderizado principal

**Selva — Babylon.js (modo predeterminado):** al abrir GitHub Pages se ve únicamente
la primera arena en una escena isométrica hecha con Babylon.js, sin personajes,
HUD ni lógica de combate ejecutándose. El terreno es una malla con relieve,
material PBR y textura, y la vegetación usa modelos glTF/GLB CC0 descargados
en la publicación (Quaternius / Poly Haven).

- `src/arena-babylon.js`: motor y composición de la primera arena.
- `scripts/fetch-art-assets.mjs`: descarga/verifica los tres modelos GLB CC0.
- `index.html`: carga Babylon.js y el cargador glTF desde el CDN oficial.
- `?combate=1`: mantiene accesible el juego anterior con Three.js.
- `src/arena-three.js`: se conserva sin eliminar la lógica de combate.

La nueva dirección **no es todavía arte final de calidad LoL**. El repertorio
disponible tiene solo dos tipos de árboles y un modelo de rocas. Para conseguir
el acabado aprobado hará falta ampliar el catálogo de modelos y componer una
arena en Blender con recursos y materiales más variados, exportarla a GLB y
sustituir la distribución inicial. Cambiar de motor por sí solo no suministra
arte premium.

**Limitación de red:** el navegador necesita acceso al CDN oficial de
Babylon.js; los modelos GLB sí se hospedan en el propio GitHub Pages.

## Ejecutar

Requiere Node.js 22.12 o posterior:

- npm ci
- npm test
- npm run dev
- npm run build

GitHub Actions comprueba pruebas y build en .github/workflows/ci.yml y despliega GitHub Pages mediante .github/workflows/pages.yml.

## Arquitectura

- **src/arena-three.js:** renderizador Three.js principal con materiales, cámara elevada, sombras, instancing y zoom.
- **src/arena-moba.js:** renderizador WebGL anterior, retenido como código heredado.
- **src/terreno.js:** huellas de colisión, alturas, puentes, cobertura y superficies escalables.
- **src/navegacion.js:** A* cacheado con zonas transitables y enlaces especiales para el gorila.
- **src/battle.js:** IA, combate, vida, daño, enfriamientos, equipamiento y simulación independiente del render.
- **src/evolution.js:** habilidades, requisitos, atributos globales, bananas y reembolsos.
- **src/EvolutionTree.jsx:** visualización hexagonal interactiva y desbloqueos progresivos.
- **src/main.jsx:** interfaz React y ciclo de simulación.
- **src/arena.js y src/arena3d.js:** visualizadores heredados de compatibilidad.

## Escenarios y navegación

- Cuatro arenas: claro del bosque, selva, cañón y hangar.
- Montañas, rocas, árboles, cajas y estructuras tienen geometría visible y huellas de colisión compartidas.
- Las colisiones no se pintan como rectángulos de depuración.
- Los humanos rodean obstáculos mediante A*, separación local y corrección física, sin trepar montañas.
- El gorila puede superar rocas y ruinas escalables; contenedores y otros obstáculos permanecen cerrados.
- Las trayectorias se cachean y se actualizan cuando cambian los objetivos.
- La rueda del ratón permite acercar y alejar la cámara sin modificar el combate.

## Reglas y evolución

Se conservan las reglas de combate, atributos, daño, armas, comportamientos, compras y enfriamientos previamente aprobados. La recarga física humana base es 1 segundo y la de disparo, 1.5 segundos.

El panal comienza con Humano básico, Atacar, Supervivencia y Estrategia. El resto de habilidades aparece conforme se compran sus padres directos. El efecto de cada habilidad se combina con las capacidades individuales del combatiente.

## Pruebas

- src/gameplay.test.js — regresiones de combate y simulación.
- src/evolution.test.js — evolución y desbloqueos.
- src/scenery.test.js — colisiones físicas de las arenas.
- src/navegacion.test.js — A*, colisiones y movilidad gorila/humano.
- src/arena-moba.test.js — generación de mallas 3D por escenario.
- src/arena-moba-runtime.test.js — render de 100 humanos, cuatro arenas y limpieza de recursos GPU.

## Pendiente para una dirección artística AAA completa

El render 3D ya sustituye los fondos planos por volúmenes reales, pero todavía faltan modelos GLTF/GLB diseñados y esculpidos profesionalmente, rigging y animaciones esqueléticas completas, texturas hand-painted, materiales PBR, sombras dinámicas de alta calidad, vegetación con LOD avanzado, partículas y pruebas visuales exhaustivas en dispositivos reales. Estas mejoras se deben integrar sin alterar el motor de combate.
