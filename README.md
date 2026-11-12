# Gorilla

Juego de estrategia 2D en el que diriges a 100 hombres contra un gorila. Esta primera versión incluye el Claro del bosque, cuatro dificultades y pausa táctica.

## Desarrollo

Requiere Node.js 22.12 o posterior.

```bash
npm ci
npm run dev
npm test
npm run build
```

## Controles

Selecciona uno de los diez escuadrones o el grupo completo. Haz clic o toca la arena para ordenar un movimiento. Puedes atacar, mantener posición y retirarte. Usa el botón de pausa o la barra espaciadora para detener el combate mientras das órdenes. Cada partida empieza en pausa.

## Código y balance

- `src/roster.js` genera 100 personajes de 18 a 100 años. Sortea las nueve habilidades por separado, interpola los multiplicadores de edad y aplica la bonificación del objeto a la fuerza y su penalización a la velocidad. Los arquetipos describen el radar.
- `src/data/objetos.json` define los 1,000 objetos y sus probabilidades de aparición. Un punto básico equivale a 0.01 %.
- `src/battle.js` contiene la simulación independiente de React. El generador de azar puede inyectarse para repetir pruebas.
- `src/arena.js` dibuja la simulación en Canvas 2D. `src/main.jsx` contiene los controles y fichas React.

El gorila tiene tres niveles posibles por dificultad. Los hombres ganan al agotar su resistencia. El gorila gana si deja fuera de combate a los 100 hombres o si pasan cinco minutos. El miedo aumenta con rugidos, impactos y bajas cercanas. Los personajes pueden retroceder cuando supera su umbral individual de valentía.

Quedan pendientes las otras 19 arenas, las animaciones finales de personajes y la publicación de la web con su URL canónica y sitemap.
