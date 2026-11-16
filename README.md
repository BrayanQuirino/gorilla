# Gorilla — 100 humanos contra un gorila

Simulador táctico de combate con 100 humanos, un gorila y evolución de habilidades.

## Renderizado principal

**Modo MOBA 3D real:** src/arena-moba.js construye mallas WebGL, iluminación direccional, cámara ortográfica, escenarios con relieve y personajes tridimensionales articulados. Los veinte arquetipos tienen variantes de equipo y vestuario. Cuando ANGLE_instanced_arrays está disponible, los modelos se reutilizan en GPU, en lugar de reconstruirse 100 veces por fotograma.

No se estiran ilustraciones 2D para simular el terreno; el modo pixel-art antiguo permanece únicamente como respaldo técnico cuando WebGL falla.

El acabado gráfico actual es una **base 3D procedural estilizada**, no el conjunto final de modelos y texturas premium comparable a un juego AAA comercial.

## Ejecutar

Requiere Node.js 22.12 o posterior:

- npm ci
- npm test
- npm run dev
- npm run build

GitHub Actions comprueba pruebas y build en .github/workflows/ci.yml y despliega GitHub Pages mediante .github/workflows/pages.yml.

## Arquitectura

- **src/arena-moba.js:** geometría, materiales por arena, cámara elevada, GPU instancing, animaciones básicas y zoom.
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
